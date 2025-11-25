'use client';

import { useEffect, useState } from 'react';

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  updateServiceWorker: () => void;
}

export function usePWA(): PWAState {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Verificar si la app está instalada
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    // Verificar estado de conexión
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Registrar Service Worker
    const registerServiceWorker = async () => {
      // Verificar soporte de Service Workers
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers no son compatibles con este navegador');
        return;
      }

      // Verificar HTTPS en producción (requerido para Service Workers)
      if (process.env.NODE_ENV === 'production' && 
          window.location.protocol !== 'https:' && 
          !window.location.hostname.includes('localhost') &&
          !window.location.hostname.includes('127.0.0.1')) {
        console.warn('Service Workers requieren HTTPS en producción');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setRegistration(registration);

        // Verificar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });

        // Escuchar mensajes del Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
            setIsUpdateAvailable(true);
          }
        });

        console.log('✅ Service Worker registrado exitosamente');
        
        // Verificar si el service worker está activo
        if (registration.active) {
          console.log('✅ Service Worker activo y funcionando');
        }
      } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
        // En móviles, algunos errores pueden ser silenciosos, así que los logueamos
        if (error instanceof Error) {
          console.error('Detalles del error:', error.message);
        }
      }
    };

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir el prompt automático
      e.preventDefault();
    });

    // Inicializar
    checkInstallation();
    updateOnlineStatus();
    registerServiceWorker();

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    isInstalled,
    isOnline,
    isUpdateAvailable,
    updateServiceWorker,
  };
}
