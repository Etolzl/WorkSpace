import { offlineStorage } from './offline-storage';

// Interceptar fetch para manejar peticiones offline
export const createOfflineFetch = () => {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || 'GET';
    
    // Solo interceptar peticiones POST, PUT, DELETE, PATCH
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      return originalFetch(input, init);
    }

    // Solo interceptar peticiones a la API
    if (!url.includes('/api/') && !url.includes('localhost:4001') && !url.includes('127.0.0.1:4001')) {
      return originalFetch(input, init);
    }

    // Verificar conectividad ANTES de hacer la petición
    // Solo guardar si REALMENTE estamos offline
    if (!navigator.onLine) {
      console.log('Sin conexión detectada (navigator.onLine = false), guardando petición en IndexedDB:', url);
      return await handleOfflineRequest(url, method, init);
    }

    try {
      // Intentar la petición original SIN timeout (el navegador ya tiene su propio timeout)
      const response = await originalFetch(input, init);
      
      // Si la petición fue exitosa, no hacer nada más
      if (response.ok) {
        return response;
      }
      
      // Si la petición falló con un status code válido (4xx, 5xx), 
      // NO es un error de red, es un error del servidor/cliente
      // Devolver la respuesta normalmente para que la app la maneje
      return response;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Verificar PRIMERO si realmente no hay conexión
      // Esta es la verificación MÁS IMPORTANTE
      const isActuallyOffline = !navigator.onLine;
      
      // Si tenemos conexión, NUNCA guardar en IndexedDB
      // Los errores con conexión pueden ser CORS, errores del servidor, etc.
      if (!isActuallyOffline) {
        console.log('Hay conexión pero error en petición, re-lanzando error:', errorMessage);
        throw error;
      }
      
      // Solo si REALMENTE estamos offline, verificar si es un error de red
      const isNetworkError = 
        error instanceof TypeError && 
        (errorMessage.includes('Failed to fetch') || 
         errorMessage.includes('NetworkError') ||
         errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
         errorMessage.includes('ERR_NETWORK_CHANGED') ||
         errorMessage.includes('ERR_NETWORK_ACCESS_DENIED') ||
         errorMessage.includes('ERR_NAME_NOT_RESOLVED')) &&
        !errorMessage.includes('CORS') && // Excluir errores CORS
        !errorMessage.includes('aborted'); // Excluir aborts

      // Solo guardar si REALMENTE estamos offline Y es un error de red
      if (isNetworkError && isActuallyOffline) {
        console.log('Error de red REAL detectado (offline confirmado), guardando petición en IndexedDB:', url);
        return await handleOfflineRequest(url, method, init);
      }
      
      // Si estamos offline pero no es un error de red reconocido, re-lanzar el error
      console.log('Estamos offline pero error no reconocido como de red, re-lanzando:', errorMessage);
      throw error;
    }
  };

  // Función para manejar peticiones offline
  async function handleOfflineRequest(url: string, method: string, init?: RequestInit): Promise<Response> {
    try {
      // Guardar petición en IndexedDB
      const headers: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            headers[key] = value;
          });
        } else {
          Object.assign(headers, init.headers);
        }
      }

      // Validar y limpiar datos antes de guardar
      const cleanBody = init?.body ? 
        (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : '';
      
      // Validar que el body no esté vacío para peticiones POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && !cleanBody) {
        console.warn('⚠️ Petición sin body detectada, no se guardará:', url);
        throw new Error('Petición sin datos válidos');
      }

      console.log('💾 Guardando petición offline:', {
        url,
        method: method.toUpperCase(),
        headers,
        bodyLength: cleanBody.length,
        bodyPreview: cleanBody.substring(0, 100) + (cleanBody.length > 100 ? '...' : '')
      });

      await offlineStorage.savePendingRequest({
        url,
        method: method.toUpperCase(),
        headers,
        body: cleanBody
      });

      // Devolver una respuesta simulada para que la aplicación continúe
      return new Response(JSON.stringify({
        message: 'Petición guardada para sincronización offline',
        offline: true,
        timestamp: new Date().toISOString(),
        url: url
      }), {
        status: 202,
        statusText: 'Accepted',
        headers: {
          'Content-Type': 'application/json'
        }
      });

    } catch (storageError) {
      console.error('Error guardando petición offline:', storageError);
      // Devolver error de servidor para que la app maneje el error
      return new Response(JSON.stringify({
        error: 'Error guardando petición offline',
        message: 'No se pudo guardar la petición para sincronización posterior'
      }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

// Función para restaurar fetch original
export const restoreOriginalFetch = () => {
  // Esta función se puede usar para deshabilitar el interceptor si es necesario
  console.log('Fetch interceptor activo para manejo offline');
};
