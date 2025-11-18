'use client';

import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertCircle,
  Settings,
  XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

// Wrapper para asegurar que el componente siempre se renderice
function PushNotificationStatusContent() {
  // El hook debe llamarse incondicionalmente
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    getSubscriptions
  } = usePushNotifications();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Verificar permisos y suscripciones
  useEffect(() => {
    let isMounted = true;
    let lastPermission = notificationPermission;
    
    // Función para refrescar el estado completo
    const refreshStatus = async () => {
      if (!isMounted) return;
      
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const currentPermission = Notification.permission;
          if (currentPermission !== lastPermission) {
            lastPermission = currentPermission;
            setNotificationPermission(currentPermission);
          }
        }

        // Siempre verificar suscripciones en el backend, independientemente del estado del navegador
        // Solo si getSubscriptions está disponible
        if (getSubscriptions && typeof getSubscriptions === 'function') {
          try {
            const subs = await getSubscriptions();
            if (isMounted) {
              setSubscriptions(subs || []);
              setIsInitialized(true);
            }
          } catch (error) {
            console.error('Error obteniendo suscripciones:', error);
            if (isMounted) {
              setSubscriptions([]);
              setIsInitialized(true);
            }
          }
        } else {
          // Si getSubscriptions no está disponible, marcar como inicializado de todas formas
          if (isMounted) {
            setIsInitialized(true);
          }
        }
      } catch (error) {
        console.error('Error en refreshStatus:', error);
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };
    
    // Ejecutar después de un pequeño delay para asegurar que todo esté listo
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        refreshStatus();
      }
    }, 100);
    
    // Verificar periódicamente el estado de los permisos y suscripciones
    const interval = setInterval(() => {
      if (!isMounted) return;
      
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPermission = Notification.permission;
        if (currentPermission !== lastPermission) {
          lastPermission = currentPermission;
          setNotificationPermission(currentPermission);
        }
      }
      // Refrescar suscripciones del backend periódicamente (cada 60 segundos para evitar saturar el servidor)
      if (getSubscriptions && typeof getSubscriptions === 'function') {
        refreshStatus();
      }
    }, 60000); // Cada 60 segundos (aumentado para evitar errores 429)

    // Escuchar eventos personalizados para actualizar cuando se suscriba desde otros componentes
    const handlePushSubscriptionChange = () => {
      if (isMounted) {
        refreshStatus();
      }
    };

    // Escuchar cambios en los permisos de notificación
    const handlePermissionChange = () => {
      if (isMounted && typeof window !== 'undefined' && 'Notification' in window) {
        const currentPermission = Notification.permission;
        if (currentPermission !== lastPermission) {
          lastPermission = currentPermission;
          setNotificationPermission(currentPermission);
        }
        // Refrescar suscripciones cuando cambien los permisos
        refreshStatus();
      }
    };

    // Agregar listeners
    window.addEventListener('push-subscription-changed', handlePushSubscriptionChange);
    window.addEventListener('notification-permission-changed', handlePermissionChange);

    // Polling más frecuente para detectar cambios en permisos (cada 5 segundos)
    const permissionCheckInterval = setInterval(() => {
      if (!isMounted) return;
      
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPermission = Notification.permission;
        if (currentPermission !== lastPermission) {
          lastPermission = currentPermission;
          setNotificationPermission(currentPermission);
          refreshStatus();
        }
      }
    }, 5000); // Cada 5 segundos para detectar cambios (reducido para evitar saturar)

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearInterval(interval);
      clearInterval(permissionCheckInterval);
      window.removeEventListener('push-subscription-changed', handlePushSubscriptionChange);
      window.removeEventListener('notification-permission-changed', handlePermissionChange);
    };
  }, [getSubscriptions]);

  const handleToggleSubscription = async () => {
    setIsChecking(true);
    try {
      // Verificar si hay suscripciones en el backend
      const hasBackendSubscriptions = subscriptions.length > 0;
      
      if (isSubscribed || hasBackendSubscriptions) {
        // Desuscribirse
        const success = await unsubscribe();
        if (success) {
          // Actualizar permisos inmediatamente
          if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
          }
          // Refrescar suscripciones después de desuscribirse
          if (getSubscriptions && typeof getSubscriptions === 'function') {
            try {
              const subs = await getSubscriptions();
              setSubscriptions(subs || []);
            } catch (error) {
              console.error('Error refrescando suscripciones:', error);
            }
          }
          // Disparar evento personalizado para notificar a otros componentes
          window.dispatchEvent(new CustomEvent('push-subscription-changed'));
        }
      } else {
        // Suscribirse
        // Verificar permisos primero
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          
          // Disparar evento de cambio de permisos
          window.dispatchEvent(new CustomEvent('notification-permission-changed'));
          
          if (permission !== 'granted') {
            alert('Los permisos de notificación fueron denegados. Por favor, habilítalos en la configuración del navegador.');
            setIsChecking(false);
            return;
          }
        } else if (Notification.permission === 'denied') {
          alert('Los permisos de notificación están denegados. Por favor, habilítalos en la configuración del navegador.');
          setIsChecking(false);
          return;
        }

        const success = await subscribe();
        if (success) {
          // Actualizar permisos inmediatamente
          if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
          }
          // Refrescar suscripciones después de suscribirse
          if (getSubscriptions && typeof getSubscriptions === 'function') {
            try {
              const subs = await getSubscriptions();
              setSubscriptions(subs || []);
            } catch (error) {
              console.error('Error refrescando suscripciones:', error);
            }
          }
          // Disparar evento personalizado para notificar a otros componentes
          window.dispatchEvent(new CustomEvent('push-subscription-changed'));
        }
      }
    } catch (error) {
      console.error('Error cambiando suscripción:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Determinar si está realmente suscrito (backend o navegador)
  const isActuallySubscribed = subscriptions.length > 0 || isSubscribed;

  const getStatusIcon = () => {
    if (!isSupported) return <XCircle className="h-4 w-4 text-red-500" />;
    if (notificationPermission === 'denied') return <BellOff className="h-4 w-4 text-red-500" />;
    if (isActuallySubscribed && notificationPermission === 'granted') return <Bell className="h-4 w-4 text-green-500" />;
    if (notificationPermission === 'granted' && !isActuallySubscribed) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <BellOff className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) return 'No soportado';
    if (notificationPermission === 'denied') return 'Permisos denegados';
    if (isActuallySubscribed && notificationPermission === 'granted') {
      return subscriptions.length > 0 
        ? `Activo (${subscriptions.length} dispositivo${subscriptions.length !== 1 ? 's' : ''})`
        : 'Notificaciones activas';
    }
    if (notificationPermission === 'granted' && !isActuallySubscribed) return 'Permisos otorgados, no suscrito';
    return 'Notificaciones desactivadas';
  };

  const getStatusColor = () => {
    if (!isSupported) return 'destructive';
    if (notificationPermission === 'denied') return 'destructive';
    if (isActuallySubscribed && notificationPermission === 'granted') return 'default';
    if (notificationPermission === 'granted' && !isActuallySubscribed) return 'secondary';
    return 'secondary';
  };

  const getPermissionBadge = () => {
    if (notificationPermission === 'granted') return 'Permitido';
    if (notificationPermission === 'denied') return 'Denegado';
    return 'No solicitado';
  };

  const getPermissionBadgeColor = () => {
    if (notificationPermission === 'granted') return 'default';
    if (notificationPermission === 'denied') return 'destructive';
    return 'secondary';
  };

  // Asegurar que el componente siempre sea visible
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          Notificaciones Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {getStatusText()}
          </span>
          <Badge variant={getStatusColor()}>
            {getPermissionBadge()}
          </Badge>
        </div>

        {subscriptions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Dispositivos suscritos: {subscriptions.length}
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {subscriptions.slice(0, 3).map((sub, index) => (
                <div 
                  key={sub._id || sub.id || index}
                  className="flex items-center justify-between text-xs bg-muted p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs truncate max-w-[200px]">
                      {sub.userAgent ? 
                        sub.userAgent.split(' ').slice(0, 2).join(' ') : 
                        'Dispositivo desconocido'
                      }
                    </span>
                  </div>
                  {sub.lastUsed && (
                    <span className="text-muted-foreground text-xs">
                      {new Date(sub.lastUsed).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
              {subscriptions.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  ... y {subscriptions.length - 3} más
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {!isSupported && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>Las notificaciones push no son compatibles con este navegador</span>
          </div>
        )}

        {notificationPermission === 'denied' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <span>Los permisos están denegados. Habilítalos en la configuración del navegador.</span>
            </div>
            <Button
              onClick={() => {
                alert('Para habilitar las notificaciones:\n\n1. Haz clic en el ícono de candado en la barra de direcciones\n2. Busca "Notificaciones"\n3. Cambia a "Permitir"');
              }}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Ver Instrucciones
            </Button>
          </div>
        )}

        {/* Mostrar información del estado de suscripción - Siempre visible */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Estado de suscripción:</span>
            <Badge variant={isActuallySubscribed ? "default" : "secondary"} className="text-xs">
              {isActuallySubscribed ? 'Suscrito' : 'No suscrito'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Suscripciones en servidor:</span>
            <Badge variant={subscriptions.length > 0 ? "default" : "secondary"} className="text-xs">
              {subscriptions.length > 0 
                ? `${subscriptions.length} activa${subscriptions.length !== 1 ? 's' : ''}`
                : 'Ninguna'}
            </Badge>
          </div>
        </div>

        {/* Botón de acción - Siempre visible si está soportado */}
        {isSupported ? (
          notificationPermission !== 'denied' ? (
            <Button
              onClick={handleToggleSubscription}
              disabled={isLoading || isChecking}
              size="sm"
              className="w-full"
              variant={isActuallySubscribed ? "destructive" : "default"}
            >
              {isLoading || isChecking ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isActuallySubscribed ? 'Desactivando...' : 'Activando...'}</span>
                </div>
              ) : isActuallySubscribed ? (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Desactivar Notificaciones
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Activar Notificaciones
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                alert('Para habilitar las notificaciones:\n\n1. Haz clic en el ícono de candado en la barra de direcciones\n2. Busca "Notificaciones"\n3. Cambia a "Permitir"');
              }}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Habilitar Permisos
            </Button>
          )
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted rounded">
            <AlertCircle className="h-3 w-3" />
            <span>No disponible en este navegador</span>
          </div>
        )}

        {isActuallySubscribed && notificationPermission === 'granted' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Recibirás notificaciones sobre cambios importantes</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente principal con error boundary
export function PushNotificationStatus() {
  try {
    // Siempre renderizar el componente, incluso si hay errores
    return (
      <PushNotificationStatusContent />
    );
  } catch (error) {
    // Si hay un error, renderizar una versión simplificada
    console.error('Error renderizando PushNotificationStatus:', error);
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-gray-500" />
            Notificaciones Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Error cargando notificaciones</span>
            <Badge variant="secondary">Error</Badge>
          </div>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Recargar Página
          </Button>
        </CardContent>
      </Card>
    );
  }
}

