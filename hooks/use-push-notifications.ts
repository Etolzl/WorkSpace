import { useState, useEffect, useCallback } from 'react';
import { pushCache } from '@/lib/push-cache';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: any;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendNotification: (payload: NotificationPayload) => Promise<boolean>;
  sendNotificationToAll: (payload: NotificationPayload) => Promise<boolean>;
  getSubscriptions: () => Promise<any[]>;
}

import { API_BASE_URL } from '@/lib/api-config';

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar soporte para notificaciones push
  useEffect(() => {
    const checkSupport = () => {
      if (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
      ) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
        setError('Las notificaciones push no son compatibles con este navegador');
      }
    };

    checkSupport();
  }, []);

  // Definir checkSubscriptionStatus con useCallback antes de usarlo
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      // Verificar suscripción en el navegador
      if ('serviceWorker' in navigator) {
        try {
          // Esperar a que el service worker esté listo con un timeout
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Service worker timeout')), 5000)
            )
          ]) as ServiceWorkerRegistration;
          
          const browserSubscription = await registration.pushManager.getSubscription();
          
          // Verificar suscripciones en el backend
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const response = await fetch(`${API_BASE_URL}/push/subscriptions`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                const backendSubscriptions = data.subscriptions || [];
                
                // Si hay suscripciones en el backend, considerar al usuario como suscrito
                if (backendSubscriptions.length > 0) {
                  setIsSubscribed(true);
                  console.log('Usuario tiene suscripciones activas en el backend');
                  return;
                }
              } else if (response.status === 429) {
                // Para errores 429, usar la suscripción del navegador si existe
                console.warn('Demasiadas solicitudes al verificar suscripciones. Usando estado del navegador.');
                // Continuar con la verificación del navegador
              }
            } catch (error) {
              console.warn('Error verificando suscripciones en backend:', error);
              // Continuar con la verificación del navegador
            }
          }
          
          // Si no hay suscripciones en backend, usar la del navegador
          setIsSubscribed(!!browserSubscription);
        } catch (error) {
          console.warn('Error accediendo al service worker:', error);
          // Si el service worker no está listo, verificar solo el backend
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const response = await fetch(`${API_BASE_URL}/push/subscriptions`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                const backendSubscriptions = data.subscriptions || [];
                if (backendSubscriptions.length > 0) {
                  setIsSubscribed(true);
                  return;
                }
              } else if (response.status === 429) {
                // Para errores 429, asumir que no está suscrito por ahora
                console.warn('Demasiadas solicitudes al verificar suscripciones.');
                setIsSubscribed(false);
                return;
              }
            } catch (backendError) {
              console.warn('Error verificando suscripciones en backend:', backendError);
            }
          }
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error verificando estado de suscripción:', error);
      setIsSubscribed(false);
    }
  }, []);

  // Verificar si ya está suscrito (tanto en navegador como en backend)
  useEffect(() => {
    if (isSupported) {
      checkSubscriptionStatus();
    }
  }, [isSupported, checkSubscriptionStatus]);

  const getVapidPublicKey = async (): Promise<string> => {
    // Verificar caché primero
    const cachedKey = pushCache.getVapidKey();
    if (cachedKey) {
      return cachedKey;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/push/vapid-key`);
      
      if (!response.ok) {
        if (response.status === 429) {
          // Si hay error 429, intentar usar caché aunque sea antiguo
          const oldCachedKey = localStorage.getItem('vapid_key_cache');
          if (oldCachedKey) {
            console.warn('⚠️ Demasiadas solicitudes, usando clave VAPID desde caché antiguo');
            return oldCachedKey;
          }
          throw new Error('Demasiadas solicitudes. Intenta de nuevo más tarde.');
        }
        const errorData = await response.json().catch(() => ({ error: 'Error obteniendo clave VAPID' }));
        throw new Error(errorData.error || 'Error obteniendo clave VAPID');
      }
      
      const data = await response.json();
      if (!data.publicKey || typeof data.publicKey !== 'string') {
        throw new Error('Clave VAPID inválida o no disponible');
      }
      
      // Guardar en caché
      pushCache.saveVapidKey(data.publicKey);
      
      return data.publicKey;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo clave VAPID';
      throw new Error(errorMessage);
    }
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
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
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Las notificaciones push no son compatibles');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Solicitar permisos
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Permisos de notificación denegados');
        return false;
      }

      // Obtener registro del service worker con timeout
      let registration: ServiceWorkerRegistration;
      try {
        registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<ServiceWorkerRegistration>((_, reject) => 
            setTimeout(() => reject(new Error('Service worker timeout')), 10000)
          )
        ]);
      } catch (error) {
        setError('El service worker no está disponible. Por favor, recarga la página.');
        return false;
      }

      // Verificar si ya existe una suscripción antes de crear una nueva
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('Ya existe una suscripción en el navegador, verificando en el backend...');
        // Si ya hay suscripción en el navegador, verificar si está en el backend
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const checkResponse = await fetch(`${API_BASE_URL}/push/subscriptions`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (checkResponse.ok) {
              const data = await checkResponse.json();
              const backendSubscriptions = data.subscriptions || [];
              
              // Verificar si esta suscripción ya está en el backend
              const isInBackend = backendSubscriptions.some((sub: any) => 
                sub.endpoint === subscription.endpoint
              );
              
              if (isInBackend) {
                console.log('Suscripción ya existe en el backend');
                setIsSubscribed(true);
                return true;
              } else {
                // Si no está en el backend, guardarla
                console.log('Suscripción del navegador no está en el backend, guardándola...');
                try {
                  const saveResponse = await fetch(`${API_BASE_URL}/push/subscribe`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      subscription: subscription,
                      userAgent: navigator.userAgent
                    })
                  });

                  if (saveResponse.ok) {
                    setIsSubscribed(true);
                    console.log('Suscripción existente guardada en el servidor');
                    return true;
                  }
                } catch (saveError) {
                  console.warn('Error guardando suscripción existente:', saveError);
                }
              }
            }
          } catch (checkError) {
            console.warn('Error verificando suscripciones en backend:', checkError);
          }
        }
      }

      // Si no hay suscripción, crear una nueva
      if (!subscription) {
        try {
          // Obtener clave VAPID pública
          const vapidPublicKey = await getVapidPublicKey();
          const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

          // Esperar un poco antes de intentar suscribirse (para evitar errores de timing)
          await new Promise(resolve => setTimeout(resolve, 500));

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
          });
        } catch (subscribeError) {
          // Si falla la suscripción del navegador, verificar si ya hay una en el backend
          const errorMessage = subscribeError instanceof Error ? subscribeError.message : String(subscribeError);
          
          // Solo loguear en modo debug si no es un error esperado del servicio
          if (process.env.NODE_ENV === 'development' && 
              !errorMessage.includes('AbortError') && 
              !errorMessage.includes('push service error')) {
            console.warn('Error creando suscripción en navegador:', subscribeError);
          }
          
          // Si es un AbortError o push service error, verificar backend
          if (errorMessage.includes('AbortError') || errorMessage.includes('push service error')) {
            const token = localStorage.getItem('token');
            if (token) {
              try {
                const checkResponse = await fetch(`${API_BASE_URL}/push/subscriptions`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (checkResponse.ok) {
                  const data = await checkResponse.json();
                  if (data.subscriptions && data.subscriptions.length > 0) {
                    console.log('Usuario ya tiene suscripciones activas en el backend');
                    setIsSubscribed(true);
                    setError('Ya estás suscrito a las notificaciones push');
                    return true;
                  }
                }
              } catch (checkError) {
                console.error('Error verificando suscripciones existentes:', checkError);
              }
            }
            
            setError('Error del servicio de notificaciones. Por favor, intenta de nuevo más tarde o verifica tu conexión.');
            return false;
          }
          
          throw subscribeError;
        }
      }

      // Enviar suscripción al servidor
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación');
        // Intentar desuscribirse del navegador si no se pudo guardar
        try {
          await subscription.unsubscribe();
        } catch (unsubError) {
          console.warn('Error desuscribiendo del navegador:', unsubError);
        }
        return false;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            subscription: subscription,
            userAgent: navigator.userAgent
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error guardando suscripción en el servidor');
        }

        setIsSubscribed(true);
        console.log('Suscripción push exitosa y guardada en el servidor');
        
        // Invalidar caché de suscripciones para forzar actualización
        pushCache.invalidateSubscriptions();
        
        // Refrescar el estado de suscripción verificando el backend
        try {
          const checkResponse = await fetch(`${API_BASE_URL}/push/subscriptions`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (checkResponse.ok) {
            const data = await checkResponse.json();
            const backendSubscriptions = data.subscriptions || [];
            if (backendSubscriptions.length > 0) {
              setIsSubscribed(true);
              // Actualizar caché con las nuevas suscripciones
              pushCache.saveSubscriptions(backendSubscriptions);
            }
          }
        } catch (refreshError) {
          console.warn('Error refrescando estado de suscripción:', refreshError);
        }
        
        // Disparar evento personalizado para actualizar la card de notificaciones
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('push-subscription-changed'));
          // También actualizar permisos si cambió
          if (typeof Notification !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notification-permission-changed'));
          }
        }
        
        return true;
      } catch (serverError) {
        // Si falla al guardar en el servidor, intentar desuscribirse del navegador
        console.error('Error guardando suscripción en servidor:', serverError);
        try {
          await subscription.unsubscribe();
          console.log('Suscripción del navegador eliminada debido a error en servidor');
        } catch (unsubError) {
          console.warn('Error desuscribiendo del navegador:', unsubError);
        }
        throw serverError;
      }

    } catch (error) {
      console.error('Error en suscripción push:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Manejar errores específicos
      if (errorMessage.includes('AbortError') || errorMessage.includes('push service error')) {
        setError('Error del servicio de notificaciones. Por favor, intenta de nuevo más tarde.');
      } else {
        setError(errorMessage);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, getVapidPublicKey]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Las notificaciones push no son compatibles');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Obtener todas las suscripciones del backend primero
      let backendSubscriptions: any[] = [];
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/push/subscriptions`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            backendSubscriptions = data.subscriptions || [];
          }
        } catch (error) {
          console.warn('Error obteniendo suscripciones del backend:', error);
        }
      }

      // Desuscribirse del navegador si hay una suscripción
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Desuscribirse del navegador
          await subscription.unsubscribe();

          // Notificar al servidor sobre esta suscripción específica
          if (token) {
            try {
              await fetch(`${API_BASE_URL}/push/unsubscribe`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  endpoint: subscription.endpoint
                })
              });
            } catch (error) {
              console.warn('Error desuscribiendo del servidor:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Error desuscribiendo del navegador:', error);
        // Continuar para desuscribirse del backend aunque falle el navegador
      }

      // Desuscribirse de todas las suscripciones restantes en el backend
      if (token && backendSubscriptions.length > 0) {
        for (const sub of backendSubscriptions) {
          try {
            await fetch(`${API_BASE_URL}/push/unsubscribe`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                endpoint: sub.endpoint
              })
            });
          } catch (error) {
            console.warn(`Error desuscribiendo endpoint ${sub.endpoint}:`, error);
          }
        }
      }

      setIsSubscribed(false);
      console.log('Desuscripción push exitosa (navegador y servidor)');
      
      // Invalidar caché de suscripciones
      pushCache.invalidateSubscriptions();
      
      // Disparar evento personalizado para actualizar la card de notificaciones
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('push-subscription-changed'));
      }
      
      return true;

    } catch (error) {
      console.error('Error en desuscripción push:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const sendNotification = useCallback(async (payload: NotificationPayload): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error enviando notificación');
      }

      const result = await response.json();
      console.log('Notificación enviada:', result);
      return true;

    } catch (error) {
      console.error('Error enviando notificación:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    }
  }, []);

  const sendNotificationToAll = useCallback(async (payload: NotificationPayload): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/push/send-to-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error enviando notificación masiva');
      }

      const result = await response.json();
      console.log('Notificación masiva enviada:', result);
      return true;

    } catch (error) {
      console.error('Error enviando notificación masiva:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    }
  }, []);

  const getSubscriptions = useCallback(async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación');
        return [];
      }

      // Verificar caché primero
      const cachedSubscriptions = pushCache.getSubscriptions();
      if (cachedSubscriptions !== null) {
        return cachedSubscriptions;
      }

      const response = await fetch(`${API_BASE_URL}/push/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Para errores 429, usar caché si está disponible (aunque sea antiguo)
          const oldCachedSubscriptions = localStorage.getItem('push_subscriptions_cache');
          if (oldCachedSubscriptions) {
            try {
              const parsed = JSON.parse(oldCachedSubscriptions);
              console.warn('⚠️ Demasiadas solicitudes, usando suscripciones desde caché antiguo');
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              // Si el caché está corrupto, retornar array vacío
            }
          }
          console.warn('Demasiadas solicitudes al obtener suscripciones. Reintentando más tarde...');
          return [];
        }
        const errorData = await response.json().catch(() => ({ error: 'Error obteniendo suscripciones' }));
        throw new Error(errorData.error || 'Error obteniendo suscripciones');
      }

      const data = await response.json();
      const subscriptions = data.subscriptions || [];
      
      // Guardar en caché
      pushCache.saveSubscriptions(subscriptions);
      
      return subscriptions;

    } catch (error) {
      console.error('Error obteniendo suscripciones:', error);
      // En caso de error, intentar usar caché antiguo
      const oldCachedSubscriptions = pushCache.getSubscriptions();
      if (oldCachedSubscriptions !== null) {
        return oldCachedSubscriptions;
      }
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return [];
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendNotification,
    sendNotificationToAll,
    getSubscriptions
  };
};
