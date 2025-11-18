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
      if ('serviceWorker' in navigator) {
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

          console.log('Service Worker registrado exitosamente');
        } catch (error) {
          console.error('Error registrando Service Worker:', error);
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
