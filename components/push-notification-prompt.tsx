'use client';

import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { pushCache } from '@/lib/push-cache';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell } from 'lucide-react';

interface PushNotificationPromptProps {
  onClose?: () => void;
}

export function PushNotificationPrompt({ onClose }: PushNotificationPromptProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [hasBackendSubscriptions, setHasBackendSubscriptions] = useState<boolean | null>(null);
  const { isSupported, isSubscribed, isLoading, subscribe, error, getSubscriptions } = usePushNotifications();

  useEffect(() => {
    // Verificar suscripciones en el backend primero (usar caché si está disponible)
    const checkBackendSubscriptions = async () => {
      // Esperar un poco para evitar peticiones simultáneas con otros componentes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Verificar caché primero
        const cachedSubscriptions = pushCache.getSubscriptions();
        if (cachedSubscriptions !== null && cachedSubscriptions.length > 0) {
          setHasBackendSubscriptions(true);
          return;
        }
        
        const token = localStorage.getItem('token');
        if (token) {
          const subscriptions = await getSubscriptions();
          if (subscriptions && subscriptions.length > 0) {
            setHasBackendSubscriptions(true);
            return;
          }
        }
      } catch (error) {
        console.warn('Error verificando suscripciones en backend:', error);
        // Si hay error 429 u otro error, intentar usar caché antiguo
        const oldCachedSubscriptions = pushCache.getSubscriptions();
        if (oldCachedSubscriptions !== null && oldCachedSubscriptions.length > 0) {
          setHasBackendSubscriptions(true);
          return;
        }
      }
      setHasBackendSubscriptions(false);
    };

    checkBackendSubscriptions();
  }, [getSubscriptions]);

  useEffect(() => {
    // Esperar a que se verifiquen las suscripciones del backend
    if (hasBackendSubscriptions === null) {
      return;
    }

    // Verificar si el usuario acaba de iniciar sesión
    const justLoggedIn = sessionStorage.getItem('just-logged-in');
    
    // Verificar si ya se mostró el prompt antes
    const hasShownPrompt = localStorage.getItem('push-notification-prompt-shown');
    const notificationPermission = Notification.permission;
    
    // Solo mostrar si:
    // 1. El usuario acaba de iniciar sesión O no se ha mostrado antes
    // 2. Los permisos están en estado 'default' (no se han pedido aún)
    // 3. Las notificaciones están soportadas
    // 4. No está suscrito (ni en navegador ni en backend)
    const shouldShow = 
      (justLoggedIn === 'true' || !hasShownPrompt) &&
      notificationPermission === 'default' &&
      isSupported &&
      !isSubscribed &&
      !hasBackendSubscriptions;
    
    if (shouldShow) {
      // Limpiar el flag de login
      if (justLoggedIn === 'true') {
        sessionStorage.removeItem('just-logged-in');
      }
      
      // Esperar un poco para que la página cargue completamente
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasChecked(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setHasChecked(true);
    }
  }, [isSupported, isSubscribed, hasBackendSubscriptions]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      localStorage.setItem('push-notification-prompt-shown', 'true');
      
      // Invalidar caché para forzar actualización
      pushCache.invalidateSubscriptions();
      
      // Refrescar suscripciones del backend
      try {
        const subscriptions = await getSubscriptions();
        if (subscriptions && subscriptions.length > 0) {
          setHasBackendSubscriptions(true);
          console.log('✅ Suscripción a notificaciones push guardada en el servidor');
        }
      } catch (error) {
        console.warn('Error refrescando suscripciones:', error);
        // Si hay error, verificar caché actualizado
        const cachedSubscriptions = pushCache.getSubscriptions();
        if (cachedSubscriptions !== null && cachedSubscriptions.length > 0) {
          setHasBackendSubscriptions(true);
        }
      }
      
      // Disparar eventos personalizados para actualizar la card de notificaciones
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('push-subscription-changed'));
        // También actualizar permisos si cambió
        if (typeof Notification !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification-permission-changed'));
        }
      }
      
      setIsOpen(false);
      onClose?.();
    } else {
      // Si falla la suscripción, mostrar el error
      console.error('Error al suscribirse a notificaciones push');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-notification-prompt-shown', 'true');
    setIsOpen(false);
    onClose?.();
  };

  // No mostrar si ya se verificó y no cumple las condiciones
  if (hasChecked && !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-white text-xl">Activar Notificaciones Push</DialogTitle>
          </div>
          <DialogDescription className="text-gray-300 pt-2">
            Mantente al día con las últimas actualizaciones y alertas de tu WorkSpace.
            Recibirás notificaciones sobre cambios importantes en tus entornos y sensores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 text-sm text-gray-300">
            <p className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Alertas de sensores en tiempo real</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Cambios de estado en tus entornos</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Notificaciones importantes del sistema</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Ahora no
          </Button>
          <Button
            onClick={handleEnable}
            disabled={isLoading || !isSupported}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Activando...</span>
              </div>
            ) : (
              'Activar Notificaciones'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

