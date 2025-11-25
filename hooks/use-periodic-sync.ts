import { useEffect, useRef } from 'react';
import { offlineStorage } from '@/lib/offline-storage';

interface UsePeriodicSyncOptions {
  intervalMs?: number; // Intervalo en milisegundos (default: 10000 = 10 segundos)
  enabled?: boolean; // Si está habilitado (default: true)
  onSyncStart?: () => void; // Callback cuando inicia sincronización
  onSyncComplete?: (syncedCount: number) => void; // Callback cuando completa sincronización
  onSyncError?: (error: Error) => void; // Callback cuando hay error
}

export const usePeriodicSync = (options: UsePeriodicSyncOptions = {}) => {
  const {
    intervalMs = 10000, // 10 segundos por defecto
    enabled = true,
    onSyncStart,
    onSyncComplete,
    onSyncError
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(navigator.onLine);
  const isSyncingLockRef = useRef(false);

  // Función para sincronizar peticiones pendientes
  const syncPendingRequests = async () => {
    if (!isOnlineRef.current) {
      console.log('Sincronización periódica omitida: sin conexión');
      return;
    }

    // Evitar sincronizaciones simultáneas
    if (isSyncingLockRef.current) {
      console.log('Sincronización periódica omitida: ya hay una sincronización en curso');
      return;
    }

    isSyncingLockRef.current = true;

    try {
      onSyncStart?.();
      
      await offlineStorage.init();
      const requests = await offlineStorage.getAllPendingRequests();
      
      if (requests.length === 0) {
        console.log('Verificación periódica: No hay peticiones pendientes');
        return;
      }

      console.log(`Verificación periódica: ${requests.length} peticiones pendientes encontradas`);
      
      let syncedCount = 0;
      
      // Procesar cada petición pendiente
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
            await new Promise(resolve => setTimeout(resolve, delay));
          }

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
            syncedCount++;
            console.log(`✅ Petición sincronizada: ${request.url}`);
          } else {
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
                    syncedCount++;
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

            // Solo reintentar errores 5xx
            console.warn(`Error ${status} en petición ${request.url}`);
            
            // Incrementar contador de reintentos
            const newRetryCount = (request.retryCount || 0) + 1;
            await offlineStorage.updateRetryCount(request.id, newRetryCount);
            
            // Si excede el máximo de reintentos, eliminar
            if (newRetryCount >= 3) {
              await offlineStorage.deletePendingRequest(request.id);
              console.log(`Petición eliminada por exceso de reintentos: ${request.url}`);
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
            console.log('Sin conexión, deteniendo sincronización periódica');
            break; // Detener el bucle si perdimos conexión
          }
          
          // Incrementar contador de reintentos
          const newRetryCount = (request.retryCount || 0) + 1;
          await offlineStorage.updateRetryCount(request.id, newRetryCount);
          
          // Si excede el máximo de reintentos, eliminar
          if (newRetryCount >= 3) {
            await offlineStorage.deletePendingRequest(request.id);
            console.log(`Petición eliminada por exceso de reintentos: ${request.url}`);
          }
        }
      }

      onSyncComplete?.(syncedCount);
      
    } catch (error) {
      console.error('Error en verificación periódica:', error);
      onSyncError?.(error as Error);
    } finally {
      isSyncingLockRef.current = false;
    }
  };

  // Función para iniciar la verificación periódica
  const startPeriodicSync = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!enabled || !navigator.onLine) {
      console.log('Verificación periódica no iniciada:', { enabled, online: navigator.onLine });
      return;
    }

    console.log(`Iniciando verificación periódica cada ${intervalMs}ms`);
    
    // NO verificar inmediatamente para evitar múltiples sincronizaciones
    // Solo configurar el intervalo
    intervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        syncPendingRequests();
      }
    }, intervalMs);
  };

  // Función para detener la verificación periódica
  const stopPeriodicSync = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Verificación periódica detenida');
    }
  };

  // Detectar cambios de conectividad
  useEffect(() => {
    const updateOnlineStatus = () => {
      const wasOffline = !isOnlineRef.current;
      isOnlineRef.current = navigator.onLine;
      
      if (wasOffline && navigator.onLine) {
        console.log('Conexión recuperada, iniciando verificación periódica');
        startPeriodicSync();
      } else if (!navigator.onLine) {
        console.log('Conexión perdida, deteniendo verificación periódica');
        stopPeriodicSync();
      }
    };

    // Estado inicial
    updateOnlineStatus();

    // Listeners de conectividad
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Iniciar si hay conexión
    if (navigator.onLine && enabled) {
      startPeriodicSync();
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      stopPeriodicSync();
    };
  }, [enabled, intervalMs]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopPeriodicSync();
    };
  }, []);

  return {
    startPeriodicSync,
    stopPeriodicSync,
    isRunning: intervalRef.current !== null
  };
};
