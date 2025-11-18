import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, PendingRequest } from '@/lib/offline-storage';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingRequests: PendingRequest[];
  syncPendingRequests: () => Promise<void>;
  isSyncing: boolean;
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Detectar estado de conectividad
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Estado inicial
    updateOnlineStatus();

    // Listeners de conectividad
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Cargar peticiones pendientes
    const loadPendingRequests = async () => {
      try {
        await offlineStorage.init();
        const requests = await offlineStorage.getAllPendingRequests();
        setPendingRequests(requests);
      } catch (error) {
        console.error('Error cargando peticiones pendientes:', error);
      }
    };

    loadPendingRequests();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Función para sincronizar peticiones pendientes
  const syncPendingRequests = useCallback(async () => {
    if (!isOnline || isSyncing) {
      console.log('Sincronización omitida:', { isOnline, isSyncing });
      return;
    }

    setIsSyncing(true);
    
    try {
      // Limpiar peticiones corruptas antes de sincronizar
      await offlineStorage.cleanCorruptedRequests();
      
      const requests = await offlineStorage.getAllPendingRequests();
      
      if (requests.length === 0) {
        console.log('No hay peticiones pendientes para sincronizar');
        return;
      }

      console.log(`🔄 Iniciando sincronización de ${requests.length} peticiones pendientes`);
      
      for (const request of requests) {
        try {
          // Verificar si la petición tiene demasiados reintentos
          if (request.retryCount >= 3) {
            console.warn(`Petición ${request.url} excede máximo de reintentos, eliminando`);
            await offlineStorage.deletePendingRequest(request.id);
            continue;
          }

          // Delay exponencial entre reintentos (1s, 2s, 4s)
          if (request.retryCount > 0) {
            const delay = Math.min(1000 * Math.pow(2, request.retryCount - 1), 10000); // Máximo 10 segundos
            console.log(`Esperando ${delay}ms antes de reintentar petición ${request.url} (intento ${request.retryCount + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          console.log('🔍 Sincronizando petición:', {
            id: request.id,
            url: request.url,
            method: request.method,
            retryCount: request.retryCount
          });

          // Obtener el token actual del localStorage (puede haber cambiado desde que se guardó)
          const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          
          // Recrear headers con el token actual
          const headers: Record<string, string> = { ...request.headers };
          
          // SIEMPRE usar el token actual si está disponible (puede ser más reciente que el guardado)
          if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
            console.log('🔑 Usando token actual para sincronización');
          } else if (request.headers['Authorization']) {
            console.log('⚠️ No hay token actual, usando token guardado');
          } else {
            console.warn('⚠️ No hay token disponible para esta petición');
          }
          
          // Asegurar que Content-Type esté presente para peticiones con body
          if (request.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
          }
          
          console.log('📤 Sincronizando petición:', {
            url: request.url,
            method: request.method,
            hasAuth: !!headers['Authorization'],
            hasContentType: !!headers['Content-Type'],
            bodyLength: request.body?.length || 0
          });
          
          const fetchOptions: RequestInit = {
            method: request.method,
            headers,
            body: request.body || undefined,
          };

          const response = await fetch(request.url, fetchOptions);
          
          if (response.ok) {
            // Petición exitosa, eliminar de IndexedDB
            await offlineStorage.deletePendingRequest(request.id);
            console.log(`✅ Petición sincronizada exitosamente: ${request.url}`);
          } else {
            // Manejar errores específicos
            const status = response.status;
            
            // Error 429 (Too Many Requests) - eliminar inmediatamente sin reintentar
            if (status === 429) {
              console.error(`❌ Error 429 (Too Many Requests) en ${request.url} - eliminando petición inmediatamente`);
              await offlineStorage.deletePendingRequest(request.id);
              continue;
            }

            // Errores 4xx (excepto 429) - verificar si es un error de autenticación
            if (status >= 400 && status < 500) {
              // Si es 401 o 403, puede ser que el token haya expirado o no tenga permisos
              // Intentar una vez más con el token actual antes de eliminar
              if ((status === 401 || status === 403) && request.retryCount === 0) {
                console.warn(`⚠️ Error ${status} (autenticación) en ${request.url}, intentando con token actual...`);
                
                // Obtener el token más reciente (puede haber cambiado desde que se guardó la petición)
                const latestToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                
                // Intentar el retry SIEMPRE si hay un token disponible (incluso si es el mismo)
                // porque el token puede haber sido refrescado o el usuario puede haber iniciado sesión de nuevo
                if (latestToken) {
                  // Intentar una vez más con el token más reciente
                  const retryHeaders = { ...headers };
                  retryHeaders['Authorization'] = `Bearer ${latestToken}`;
                  
                  console.log(`🔄 Reintentando petición con token actualizado (${latestToken.substring(0, 20)}...)`);
                  
                  const retryResponse = await fetch(request.url, {
                    method: request.method,
                    headers: retryHeaders,
                    body: request.body || undefined,
                  });
                  
                  if (retryResponse.ok) {
                    await offlineStorage.deletePendingRequest(request.id);
                    console.log(`✅ Petición sincronizada con token actualizado: ${request.url}`);
                    continue;
                  } else {
                    // Si el retry también falla, puede ser un problema de permisos o datos inválidos
                    const retryStatus = retryResponse.status;
                    let retryText = '';
                    try {
                      const retryData = await retryResponse.json().catch(() => null);
                      retryText = retryData?.error || retryData?.message || await retryResponse.text().catch(() => 'No se pudo leer el error');
                    } catch {
                      retryText = await retryResponse.text().catch(() => 'No se pudo leer el error');
                    }
                    
                    console.error(`❌ Reintento falló con status ${retryStatus}:`, retryText.substring(0, 200));
                    
                    // Si sigue siendo 403, puede ser un problema de permisos o datos inválidos
                    // Eliminar la petición ya que no se puede resolver con un token válido
                    if (retryStatus === 403) {
                      const errorMessage = typeof retryText === 'string' ? retryText : JSON.stringify(retryText);
                      console.error(`❌ Error 403 persistente - puede ser problema de permisos o datos inválidos. Eliminando petición: ${request.url}`);
                      
                      // Mostrar notificación al usuario si está disponible
                      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        new Notification('Petición fallida por permisos', {
                          body: `La petición a ${new URL(request.url).pathname} falló: ${errorMessage.substring(0, 100)}`,
                          icon: '/favicon/favicon-96x96.png',
                          tag: `sync-error-${request.id}`,
                        });
                      } else if (typeof window !== 'undefined') {
                        // Si las notificaciones no están disponibles, mostrar un alert
                        console.warn(`⚠️ Petición fallida: ${errorMessage}`);
                      }
                      
                      await offlineStorage.deletePendingRequest(request.id);
                      continue;
                    }
                  }
                } else {
                  console.warn(`⚠️ No hay token disponible para reintentar petición: ${request.url}`);
                }
              }
              
              // Extraer mensaje de error del servidor si está disponible
              let errorMessage = '';
              try {
                const errorData = await response.json().catch(() => null);
                errorMessage = errorData?.error || errorData?.message || '';
              } catch {
                errorMessage = await response.text().catch(() => '');
              }
              
              // Si es un error 403 con mensaje de permisos, mostrar notificación
              if (status === 403 && errorMessage) {
                const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
                console.error(`❌ Error 403 (permisos) en ${request.url}: ${errorText.substring(0, 200)}`);
                
                // Mostrar notificación al usuario si está disponible
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification('Petición fallida por permisos', {
                    body: `La petición a ${new URL(request.url).pathname} falló: ${errorText.substring(0, 100)}`,
                    icon: '/favicon/favicon-96x96.png',
                    tag: `sync-error-${request.id}`,
                  });
                } else if (typeof window !== 'undefined') {
                  console.warn(`⚠️ Petición fallida por permisos: ${errorText}`);
                }
              } else {
                console.error(`❌ Error ${status} (cliente) en ${request.url} - eliminando petición`);
              }
              
              await offlineStorage.deletePendingRequest(request.id);
              continue;
            }

            // Log del error del servidor (5xx)
            const errorText = await response.text().catch(() => 'No se pudo leer el error');
            console.error(`❌ Error ${status} en petición ${request.url}:`, {
              status,
              statusText: response.statusText,
              error: errorText.substring(0, 200)
            });

            // Incrementar contador de reintentos solo para errores 5xx
            const newRetryCount = request.retryCount + 1;
            await offlineStorage.updateRetryCount(request.id, newRetryCount);
            
            // Si excede el máximo de reintentos, eliminar
            if (newRetryCount >= 3) {
              await offlineStorage.deletePendingRequest(request.id);
              console.warn(`Petición eliminada por exceso de reintentos: ${request.url}`);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error sincronizando petición ${request.url}:`, errorMessage);
          
          // Verificar si es un error de red (no reintentar si estamos offline)
          const isNetworkError = 
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('ERR_INTERNET_DISCONNECTED');
          
          if (isNetworkError && !navigator.onLine) {
            console.log('Sin conexión, deteniendo sincronización');
            break; // Detener el bucle si perdimos conexión
          }
          
          // Incrementar contador de reintentos
          const newRetryCount = request.retryCount + 1;
          await offlineStorage.updateRetryCount(request.id, newRetryCount);
          
          // Si excede el máximo de reintentos, eliminar
          if (newRetryCount >= 3) {
            await offlineStorage.deletePendingRequest(request.id);
            console.warn(`Petición eliminada por exceso de reintentos: ${request.url}`);
          }
        }
      }

      // Actualizar lista de peticiones pendientes
      const updatedRequests = await offlineStorage.getAllPendingRequests();
      setPendingRequests(updatedRequests);

    } catch (error) {
      console.error('Error en sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Sincronizar automáticamente cuando se recupere la conexión (solo una vez)
  // La sincronización periódica se maneja en usePeriodicSync para evitar duplicados
  useEffect(() => {
    if (isOnline && pendingRequests.length > 0 && !isSyncing) {
      // Pequeño delay para asegurar que la conexión sea estable
      const timeoutId = setTimeout(() => {
        syncPendingRequests();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, syncPendingRequests]); // Solo cuando cambia el estado de conexión

  return {
    isOnline,
    pendingRequests,
    syncPendingRequests,
    isSyncing
  };
};
