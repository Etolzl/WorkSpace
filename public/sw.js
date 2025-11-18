// Service Worker para PWA
const CACHE_NAME = 'pwa-cache-v1.4.9';
const APP_SHELL_CACHE = 'app-shell-v1.4.9';
const STATIC_CACHE = 'static-cache-v1.4.9';
const DYNAMIC_CACHE = 'dynamic-cache-v1.4.9';

// Rutas fijas de la aplicación (APP SHELL) - Solo recursos locales
const APP_SHELL_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  '/dashboard/admin',
  '/dashboard/admin/users',
  '/dashboard/analytics',
  '/dashboard/billing',
  '/dashboard/environments',
  '/favicon/favicon.ico',
  '/favicon/favicon.svg',
  '/favicon/apple-touch-icon.png',
  '/favicon/favicon-96x96.png',
  '/favicon/web-app-manifest-192x192.png',
  '/favicon/web-app-manifest-512x512.png',
  '/placeholder-logo.png',
  '/placeholder-logo.svg',
  '/placeholder-user.jpg',
  '/placeholder.jpg',
  '/placeholder.svg',
  '/room.jpg',
  '/manifest.json'
];

// Patrones para identificar recursos estáticos
const STATIC_RESOURCE_PATTERNS = [
  /\.css$/,
  /\.js$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.webp$/,
  /\.ico$/,
  /_next\/static\//,
  /_next\/image/
];

// Recursos de Next.js que no deben ser cacheados en desarrollo (hot reload)
const DEV_EXCLUDE_PATTERNS = [
  /_next\/static\/chunks\/webpack\.js$/,
  /_next\/static\/chunks\/main-app\.js$/,
  /_next\/webpack-hmr/
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    Promise.all([
      caches.open(APP_SHELL_CACHE),
      caches.open(STATIC_CACHE)
    ]).then(async ([appShellCache, staticCache]) => {
      console.log('Service Worker: Cacheando APP SHELL...');
      
      // Cachear recursos principales (pueden fallar algunos)
      try {
        const routesToCache = APP_SHELL_ROUTES.map(route => {
          // Convertir rutas relativas a URLs absolutas
          if (route.startsWith('/')) {
            return new URL(route, self.location.origin).href;
          }
          return route;
        });
        
        await appShellCache.addAll(routesToCache);
        console.log('Service Worker: Recursos principales cacheados');
      } catch (error) {
        console.warn('Service Worker: Algunos recursos principales fallaron al cachear:', error);
        // Cachear individualmente los que fallaron
        for (const route of APP_SHELL_ROUTES) {
          try {
            const url = route.startsWith('/') 
              ? new URL(route, self.location.origin).href 
              : route;
            await appShellCache.add(url);
          } catch (err) {
            console.warn(`Service Worker: No se pudo cachear: ${route}`, err);
          }
        }
      }
      
      console.log('Service Worker: APP SHELL cacheado exitosamente');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('Service Worker: Error crítico en instalación:', error);
      // Aún así, continuar con la instalación
      return self.skipWaiting();
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches viejos
            if (cacheName !== CACHE_NAME && 
                cacheName !== APP_SHELL_CACHE && 
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Eliminando cache viejo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activado y listo');
        return self.clients.claim();
      })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo procesar peticiones HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Solo interceptar peticiones del mismo origen
  if (url.origin !== self.location.origin) {
    // Permitir solo recursos estáticos de CDNs conocidos si es necesario
    return;
  }

  // No interceptar peticiones a la API del backend (puerto 4001)
  if (url.port === '4001' || url.hostname.includes('4001') || url.href.includes('localhost:4001')) {
    return;
  }

  // No interceptar peticiones POST, PUT, DELETE, PATCH (las maneja el interceptor de fetch)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return;
  }

  // No interceptar recursos de desarrollo de Next.js que cambian constantemente (hot reload)
  if (DEV_EXCLUDE_PATTERNS.some(pattern => pattern.test(request.url))) {
    return;
  }

  // Determinar si es un recurso estático
  const isStaticResource = STATIC_RESOURCE_PATTERNS.some(pattern => pattern.test(request.url));
  const isAppShellRoute = isAppShellRouteCheck(request.url);

  // Estrategia para recursos estáticos: Cache First
  if (isStaticResource) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true })
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Sirviendo recurso estático desde cache:', request.url);
            return cachedResponse;
          }
          
          // Si no está en cache, hacer fetch y cachear
          return fetch(request)
            .then((response) => {
              // Solo cachear respuestas exitosas y válidas
              if (response.status === 200 && response.ok) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                    console.log('Service Worker: Recurso estático cacheado:', request.url);
                  });
              }
              return response;
            })
            .catch((error) => {
              console.warn('Service Worker: Error en fetch para recurso estático:', request.url, error);
              // Si falla y no hay cache, devolver error
              return new Response('Recurso no disponible offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }

  // Estrategia para APP SHELL (páginas HTML): Cache First
  if (isAppShellRoute || request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Sirviendo desde APP SHELL cache:', request.url);
            return cachedResponse;
          }
          
          // Si no está en cache, hacer fetch y cachear
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(APP_SHELL_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch((error) => {
              console.warn('Service Worker: Error en fetch para APP SHELL:', request.url, error);
              // Fallback offline para páginas HTML
              if (request.destination === 'document') {
                return caches.match('/').then(fallback => {
                  if (fallback) return fallback;
                  return new Response('Página no disponible offline', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                  });
                });
              }
              return new Response('Recurso no disponible offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }

  // Estrategia para contenido dinámico: Network First, Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la respuesta es exitosa, cachear en dynamic cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch((error) => {
        console.warn('Service Worker: Error en fetch para contenido dinámico:', request.url, error);
        // Si falla la red, intentar servir desde cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('Service Worker: Sirviendo desde cache dinámico:', request.url);
              return cachedResponse;
            }
            
            // Fallback offline para contenido dinámico
            if (request.destination === 'document') {
              return caches.match('/').then(fallback => {
                if (fallback) return fallback;
                return new Response('Página no disponible offline', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
              });
            }
            
            // Para otros recursos, devolver respuesta de error
            return new Response('Contenido no disponible offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Función para determinar si una URL es parte del APP SHELL
function isAppShellRouteCheck(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  return APP_SHELL_ROUTES.some(route => {
    // Normalizar rutas
    const normalizedRoute = route.endsWith('/') ? route : route;
    const normalizedPath = pathname.endsWith('/') ? pathname : pathname;
    
    if (normalizedPath === normalizedRoute || normalizedPath.startsWith(normalizedRoute + '/')) {
      return true;
    }
    
    // Comparar sin el dominio
    const routeUrl = route.startsWith('/') 
      ? new URL(route, self.location.origin).pathname 
      : route;
    
    return pathname === routeUrl || pathname.startsWith(routeUrl + '/');
  });
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Background Sync para sincronizar peticiones pendientes
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background Sync activado', event.tag);
  
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  } else if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupDynamicCache());
  }
});

// Función para sincronizar peticiones pendientes
async function syncPendingRequests() {
  try {
    console.log('Service Worker: Iniciando sincronización de peticiones pendientes...');
    
    // Abrir IndexedDB
    const dbName = 'PWAOfflineDB';
    const version = 1;
    const storeName = 'pendingRequests';
    
    const db = await openIndexedDB(dbName, version);
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Obtener todas las peticiones pendientes
    const getAllRequest = store.getAll();
    const pendingRequests = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    console.log(`Service Worker: Encontradas ${pendingRequests.length} peticiones pendientes`);
    
    // Procesar cada petición pendiente
    for (const request of pendingRequests) {
      try {
        console.log(`Service Worker: Sincronizando petición: ${request.url}`);
        
        // Obtener el token actual del cliente (puede haber cambiado desde que se guardó)
        // Nota: El service worker no tiene acceso directo a localStorage, 
        // pero podemos intentar obtenerlo del cliente o usar el token guardado
        let headers = { ...request.headers };
        
        // Asegurar que Content-Type esté presente para peticiones con body
        if (request.body && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
        
        // Intentar obtener el token actual del cliente
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
          // Pedir el token actual al cliente
          try {
            const client = clients[0];
            const messageChannel = new MessageChannel();
            const tokenPromise = new Promise((resolve) => {
              messageChannel.port1.onmessage = (event) => {
                if (event.data && event.data.type === 'TOKEN_RESPONSE') {
                  resolve(event.data.token);
                } else {
                  resolve(null);
                }
              };
              // Timeout después de 1 segundo
              setTimeout(() => resolve(null), 1000);
            });
            
            client.postMessage({ type: 'GET_TOKEN' }, [messageChannel.port2]);
            const currentToken = await tokenPromise;
            
            if (currentToken && headers['Authorization']) {
              headers['Authorization'] = `Bearer ${currentToken}`;
            }
          } catch (error) {
            console.warn('Service Worker: No se pudo obtener token actual, usando el guardado');
          }
        }
        
        const fetchOptions = {
          method: request.method,
          headers,
          body: request.body || undefined,
        };
        
        const response = await fetch(request.url, fetchOptions);
        
        if (response.ok) {
          // Petición exitosa, eliminar de IndexedDB
          const deleteRequest = store.delete(request.id);
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          
          console.log(`Service Worker: Petición sincronizada exitosamente: ${request.url}`);
        } else {
          const status = response.status;
          
          // Error 429 (Too Many Requests) - eliminar inmediatamente sin reintentar
          if (status === 429) {
            console.error(`Service Worker: Error 429 (Too Many Requests) en ${request.url} - eliminando petición inmediatamente`);
            const deleteRequest = store.delete(request.id);
            await new Promise((resolve, reject) => {
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => reject(deleteRequest.error);
            });
            continue;
          }

          // Errores 4xx (excepto 429) - verificar si es un error de autenticación
          if (status >= 400 && status < 500) {
            // Si es 401 o 403, puede ser que el token haya expirado
            // Intentar una vez más con el token actual antes de eliminar
            if ((status === 401 || status === 403) && (request.retryCount || 0) === 0) {
              console.warn(`Service Worker: Error ${status} (autenticación) en ${request.url}, intentando con token actual...`);
              
              // Intentar obtener el token actual del cliente
              const clients = await self.clients.matchAll();
              if (clients.length > 0) {
                try {
                  const client = clients[0];
                  const messageChannel = new MessageChannel();
                  const tokenPromise = new Promise((resolve) => {
                    messageChannel.port1.onmessage = (event) => {
                      if (event.data && event.data.type === 'TOKEN_RESPONSE') {
                        resolve(event.data.token);
                      } else {
                        resolve(null);
                      }
                    };
                    setTimeout(() => resolve(null), 1000);
                  });
                  
                  client.postMessage({ type: 'GET_TOKEN' }, [messageChannel.port2]);
                  const latestToken = await tokenPromise;
                  
                  if (latestToken && latestToken !== (headers['Authorization']?.replace('Bearer ', '') || '')) {
                    // Intentar una vez más con el nuevo token
                    const retryHeaders = { ...headers };
                    retryHeaders['Authorization'] = `Bearer ${latestToken}`;
                    
                    const retryResponse = await fetch(request.url, {
                      method: request.method,
                      headers: retryHeaders,
                      body: request.body || undefined,
                    });
                    
                    if (retryResponse.ok) {
                      const deleteRequest = store.delete(request.id);
                      await new Promise((resolve, reject) => {
                        deleteRequest.onsuccess = () => resolve();
                        deleteRequest.onerror = () => reject(deleteRequest.error);
                      });
                      console.log(`Service Worker: Petición sincronizada con token actualizado: ${request.url}`);
                      continue;
                    }
                  }
                } catch (error) {
                  console.warn('Service Worker: Error obteniendo token actual:', error);
                }
              }
            }
            
            console.error(`Service Worker: Error ${status} (cliente) en ${request.url} - eliminando petición`);
            const deleteRequest = store.delete(request.id);
            await new Promise((resolve, reject) => {
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => reject(deleteRequest.error);
            });
            continue;
          }

          console.warn(`Service Worker: Error ${status} en petición ${request.url}`);
          
          // Incrementar contador de reintentos solo para errores 5xx
          const newRetryCount = (request.retryCount || 0) + 1;
          request.retryCount = newRetryCount;
          
          if (newRetryCount >= 3) {
            // Eliminar si excede el máximo de reintentos
            const deleteRequest = store.delete(request.id);
            await new Promise((resolve, reject) => {
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => reject(deleteRequest.error);
            });
            console.log(`Service Worker: Petición eliminada por exceso de reintentos: ${request.url}`);
          } else {
            // Actualizar contador de reintentos
            const putRequest = store.put(request);
            await new Promise((resolve, reject) => {
              putRequest.onsuccess = () => resolve();
              putRequest.onerror = () => reject(putRequest.error);
            });
          }
        }
      } catch (error) {
        console.error(`Service Worker: Error sincronizando petición ${request.url}:`, error);
        
        // Incrementar contador de reintentos
        const newRetryCount = (request.retryCount || 0) + 1;
        request.retryCount = newRetryCount;
        
        if (newRetryCount >= 3) {
          // Eliminar si excede el máximo de reintentos
          const deleteRequest = store.delete(request.id);
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          console.log(`Service Worker: Petición eliminada por exceso de reintentos: ${request.url}`);
        } else {
          // Actualizar contador de reintentos
          const putRequest = store.put(request);
          await new Promise((resolve, reject) => {
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          });
        }
      }
    }
    
    console.log('Service Worker: Sincronización completada');
    
  } catch (error) {
    console.error('Service Worker: Error en sincronización:', error);
  }
}

// Función auxiliar para abrir IndexedDB
function openIndexedDB(dbName, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const store = db.createObjectStore('pendingRequests', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('url', 'url', { unique: false });
      }
    };
  });
}

// Función para limpiar cache dinámico viejo
async function cleanupDynamicCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
  const now = Date.now();
  
  for (const request of requests) {
    const response = await cache.match(request);
    const dateHeader = response.headers.get('date');
    
    if (dateHeader) {
      const responseDate = new Date(dateHeader).getTime();
      if (now - responseDate > maxAge) {
        await cache.delete(request);
        console.log('Service Worker: Eliminando cache dinámico viejo:', request.url);
      }
    }
  }
}

// ===== MANEJO DE NOTIFICACIONES PUSH =====

// Escuchar eventos de notificaciones push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Notificación push recibida');
  
  let notificationData = {
    title: 'Nueva notificación',
    body: 'Tienes una nueva notificación',
    icon: '/favicon/favicon-96x96.png',
    badge: '/favicon/favicon-96x96.png',
    url: '/dashboard',
    data: {}
  };

  // Si hay datos en el evento push
  if (event.data) {
    try {
      // Intentar parsear como JSON primero
      let pushData;
      try {
        pushData = event.data.json();
      } catch (jsonError) {
        // Si falla el JSON, intentar como texto
        const textData = event.data.text();
        console.log('Service Worker: Datos recibidos como texto:', textData);
        
        // Intentar parsear el texto como JSON
        try {
          pushData = JSON.parse(textData);
        } catch (parseError) {
          // Si no es JSON válido, usar el texto como body
          console.warn('Service Worker: Datos no son JSON válido, usando como texto');
          pushData = {
            body: textData,
            title: 'Notificación'
          };
        }
      }

      // Actualizar datos de notificación con los datos parseados
      if (pushData) {
        notificationData = {
          title: pushData.title || notificationData.title,
          body: pushData.body || notificationData.body,
          icon: pushData.icon || notificationData.icon,
          badge: pushData.badge || pushData.icon || notificationData.badge,
          url: pushData.url || notificationData.url,
          data: pushData.data || notificationData.data
        };
      }
    } catch (error) {
      console.error('Service Worker: Error procesando datos de push:', error);
      // Si hay un error, usar los datos por defecto
    }
  }

  // Mostrar la notificación con manejo de errores
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: {
        url: notificationData.url,
        ...notificationData.data
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/favicon/favicon-96x96.png'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ],
      requireInteraction: false,
      silent: false,
      tag: 'notification-' + Date.now(),
      timestamp: Date.now()
    }).catch((error) => {
      console.error('Service Worker: Error mostrando notificación:', error);
      if (error.message && error.message.includes('permission')) {
        console.warn('Service Worker: Permisos de notificación no otorgados. El usuario debe otorgar permisos desde la aplicación.');
      }
      // Re-lanzar el error para que el navegador lo maneje
      throw error;
    })
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Click en notificación', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // URL a la que redirigir (por defecto o desde los datos de la notificación)
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('Service Worker: Error manejando click de notificación:', error);
      })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notificación cerrada');
  
  // Aquí podrías enviar analytics o realizar otras acciones
  // cuando el usuario cierra la notificación sin hacer click
});

// Manejar errores en notificaciones
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Service Worker: Suscripción push cambiada');
  
  // Re-suscribirse automáticamente si es necesario
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('BGQECJNUtqdg8AaL3qBNSEgH86UagDCZguAGD0ZrAQH2upekDEDbce-7Upjj14qurzuUZ13JV-C2e-VERd9C8DM')
    }).then((subscription) => {
      console.log('Service Worker: Nueva suscripción creada:', subscription);
      
      // Notificar al cliente sobre la nueva suscripción
      return clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            subscription: subscription
          });
        });
      });
    }).catch((error) => {
      console.error('Service Worker: Error creando nueva suscripción:', error);
    })
  );
});

// Función auxiliar para convertir clave VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
