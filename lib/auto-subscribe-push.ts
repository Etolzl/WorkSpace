/**
 * Utilidad para suscribirse automáticamente a notificaciones push
 * cuando el usuario tiene permisos pero no está suscrito
 */

import { pushCache } from './push-cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://https://workspaceapi-b81x.onrender.com';

interface AutoSubscribeResult {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
}

/**
 * Verifica si el usuario tiene permisos de notificación y se suscribe automáticamente
 * @returns Promise con el resultado de la suscripción
 */
export async function autoSubscribeToPushNotifications(): Promise<AutoSubscribeResult> {
  // Verificar soporte
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return {
      success: false,
      message: 'Las notificaciones push no son compatibles con este navegador'
    };
  }

  // Verificar si ya hay token de autenticación
  const token = localStorage.getItem('token');
  if (!token) {
    return {
      success: false,
      message: 'No hay token de autenticación'
    };
  }

  try {
    // Verificar permisos actuales
    const permission = Notification.permission;
    
    if (permission === 'denied') {
      return {
        success: false,
        message: 'Los permisos de notificación están denegados'
      };
    }

    // Si los permisos no están otorgados, no suscribirse automáticamente
    // (el usuario debe hacerlo manualmente o a través del prompt)
    if (permission === 'default') {
      return {
        success: false,
        message: 'Los permisos de notificación no han sido solicitados aún'
      };
    }

    // Verificar si ya está suscrito en el backend
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
          console.log('Usuario ya tiene suscripciones activas en el backend');
          return {
            success: true,
            message: 'Usuario ya está suscrito',
            alreadySubscribed: true
          };
        }
      }
    } catch (error) {
      console.warn('Error verificando suscripciones existentes:', error);
    }

    // Verificar si ya está suscrito en el navegador
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        // Si hay suscripción en el navegador pero no en el backend, guardarla
        try {
          const saveResponse = await fetch(`${API_BASE_URL}/push/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              subscription: existingSubscription,
              userAgent: navigator.userAgent
            })
          });

          if (saveResponse.ok) {
            console.log('Suscripción del navegador guardada en el servidor');
            return {
              success: true,
              message: 'Suscripción guardada exitosamente'
            };
          }
        } catch (error) {
          console.error('Error guardando suscripción existente:', error);
        }
      }
    } catch (error) {
      console.warn('Error verificando suscripción del navegador:', error);
    }

    // Si tiene permisos pero no está suscrito, crear nueva suscripción
    if (permission === 'granted') {
      try {
        // Obtener clave VAPID pública (usar caché si está disponible)
        let vapidPublicKey = pushCache.getVapidKey();
        
        if (!vapidPublicKey) {
          const vapidResponse = await fetch(`${API_BASE_URL}/push/vapid-key`);
          
          if (!vapidResponse.ok) {
            if (vapidResponse.status === 429) {
              // Intentar usar caché antiguo si está disponible
              const oldCachedKey = localStorage.getItem('vapid_key_cache');
              if (oldCachedKey) {
                vapidPublicKey = oldCachedKey;
              } else {
                throw new Error('Demasiadas solicitudes. Intenta de nuevo más tarde.');
              }
            } else {
              const errorData = await vapidResponse.json().catch(() => ({ error: 'Error obteniendo clave VAPID' }));
              throw new Error(errorData.error || 'Error obteniendo clave VAPID');
            }
          } else {
            const vapidData = await vapidResponse.json();
            vapidPublicKey = vapidData?.publicKey;
            
            if (!vapidPublicKey || typeof vapidPublicKey !== 'string') {
              throw new Error('Clave VAPID inválida o no disponible');
            }
            
            // Guardar en caché
            pushCache.saveVapidKey(vapidPublicKey);
          }
        }

        // Convertir la clave a Uint8Array
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

        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

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
          throw new Error('El service worker no está disponible');
        }

        // Verificar si ya existe una suscripción antes de crear una nueva
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Esperar un poco antes de intentar suscribirse (para evitar errores de timing)
          await new Promise(resolve => setTimeout(resolve, 500));

          // Crear nueva suscripción
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey as BufferSource
            });
          } catch (subscribeError) {
            const errorMessage = subscribeError instanceof Error ? subscribeError.message : String(subscribeError);
            
            // Si es un AbortError o push service error, verificar backend antes de fallar
            if (errorMessage.includes('AbortError') || errorMessage.includes('push service error')) {
              // Verificar si ya hay suscripciones en el backend
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
                    return {
                      success: true,
                      message: 'Usuario ya está suscrito',
                      alreadySubscribed: true
                    };
                  }
                } else if (checkResponse.status === 429) {
                  // Si hay error 429, simplemente retornar que no se pudo suscribir automáticamente
                  console.warn('Demasiadas solicitudes al verificar suscripciones. No se puede suscribir automáticamente por ahora.');
                  return {
                    success: false,
                    message: 'El servicio de notificaciones no está disponible temporalmente. Puedes intentar suscribirte manualmente más tarde.',
                    alreadySubscribed: false
                  };
                }
              } catch (checkError) {
                console.warn('Error verificando suscripciones en backend:', checkError);
              }
              
              // En lugar de lanzar un error, retornar un resultado indicando que no se pudo suscribir
              // Esto evita que se muestre como un error crítico en la consola
              // No loguear este error ya que es un comportamiento esperado cuando el servicio no está disponible
              return {
                success: false,
                message: 'No se pudo suscribir automáticamente. El servicio de notificaciones puede no estar disponible. Puedes intentar suscribirte manualmente desde la card de notificaciones.',
                alreadySubscribed: false
              };
            }
            
            throw subscribeError;
          }
        } else {
          // Si ya hay suscripción, verificar si está en el backend
          const existingSubscription = subscription; // Guardar referencia
          if (existingSubscription) {
            const isInBackend = await (async () => {
              try {
                const checkResponse = await fetch(`${API_BASE_URL}/push/subscriptions`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (checkResponse.ok) {
                  const data = await checkResponse.json();
                  const backendSubscriptions = data.subscriptions || [];
                  return backendSubscriptions.some((sub: any) => 
                    sub.endpoint === existingSubscription.endpoint
                  );
                }
              } catch (error) {
                return false;
              }
              return false;
            })();

            if (isInBackend) {
              return {
                success: true,
                message: 'Usuario ya está suscrito',
                alreadySubscribed: true
              };
            }
          }
        }

        // Guardar suscripción en el servidor
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

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(errorData.error || 'Error guardando suscripción en el servidor');
        }

        console.log('Suscripción push automática exitosa y guardada en el servidor');
        
        // Invalidar caché de suscripciones
        pushCache.invalidateSubscriptions();
        
        // Disparar evento personalizado para actualizar la card de notificaciones
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('push-subscription-changed'));
          // También actualizar permisos si cambió
          if (typeof Notification !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notification-permission-changed'));
          }
        }
        
        return {
          success: true,
          message: 'Suscripción automática exitosa'
        };

      } catch (error) {
        // La suscripción automática es opcional, así que no la tratamos como error crítico
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido en suscripción automática';
        console.warn('⚠️ Suscripción automática no realizada:', errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    }

    return {
      success: false,
      message: 'No se pudo completar la suscripción automática'
    };

  } catch (error) {
    console.error('Error en autoSubscribeToPushNotifications:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

