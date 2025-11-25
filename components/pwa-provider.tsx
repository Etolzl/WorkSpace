'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { usePeriodicSync } from '@/hooks/use-periodic-sync';
import { createOfflineFetch } from '@/lib/fetch-interceptor';

interface PWAContextType {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  updateServiceWorker: () => void;
  pendingRequests: any[];
  syncPendingRequests: () => Promise<void>;
  isSyncing: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const pwaState = usePWA();
  const offlineSync = useOfflineSync();

  // Configurar verificación periódica cada 10 segundos
  const periodicSync = usePeriodicSync({
    intervalMs: 10000, // 10 segundos
    enabled: true,
    onSyncStart: () => console.log('Iniciando sincronización periódica...'),
    onSyncComplete: (syncedCount) => {
      if (syncedCount > 0) {
        console.log(`Sincronización periódica completada: ${syncedCount} peticiones sincronizadas`);
      }
    },
    onSyncError: (error) => console.error('Error en sincronización periódica:', error)
  });

  // Inicializar interceptor de fetch para manejo offline
  useEffect(() => {
    createOfflineFetch();
    
    // Escuchar mensajes del service worker para proporcionar el token actual
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'GET_TOKEN') {
          const token = localStorage.getItem('token');
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              type: 'TOKEN_RESPONSE',
              token: token
            });
          }
        }
      });
    }
    
    // Exponer función global para limpiar peticiones desde la consola
    if (typeof window !== 'undefined') {
      (window as any).clearAllPendingRequests = async () => {
        const { offlineStorage } = await import('@/lib/offline-storage');
        const count = (await offlineStorage.getAllPendingRequests()).length;
        const confirmed = confirm(`¿Eliminar todas las ${count} peticiones pendientes?`);
        if (confirmed) {
          await offlineStorage.clearAllPendingRequests();
          console.log(`✅ Se eliminaron ${count} peticiones pendientes`);
          window.location.reload();
        }
      };
      
      console.log('💡 Tip: Usa window.clearAllPendingRequests() en la consola para limpiar todas las peticiones');
    }
  }, []);

  // Registrar Background Sync cuando se recupere la conexión
  useEffect(() => {
    if (offlineSync.isOnline && offlineSync.pendingRequests.length > 0) {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          // Verificación de tipos segura para Background Sync
          if ('sync' in registration && registration.sync) {
            registration.sync.register('sync-pending-requests');
          }
        });
      }
    }
  }, [offlineSync.isOnline, offlineSync.pendingRequests.length]);

  const contextValue = {
    ...pwaState,
    pendingRequests: offlineSync.pendingRequests,
    syncPendingRequests: offlineSync.syncPendingRequests,
    isSyncing: offlineSync.isSyncing,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      <PWAStatusIndicator />
    </PWAContext.Provider>
  );
}

export function usePWAContext() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
}

function PWAStatusIndicator() {
  const { 
    isOnline, 
    isUpdateAvailable, 
    updateServiceWorker, 
    pendingRequests, 
    syncPendingRequests, 
    isSyncing 
  } = usePWAContext();

  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Sin conexión</span>
          {pendingRequests.length > 0 && (
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
              {pendingRequests.length} pendiente{pendingRequests.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (pendingRequests.length > 0 && isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            {isSyncing ? 'Sincronizando...' : `${pendingRequests.length} petición${pendingRequests.length !== 1 ? 'es' : ''} pendiente${pendingRequests.length !== 1 ? 's' : ''}`}
          </span>
          {!isSyncing && (
            <button
              onClick={syncPendingRequests}
              className="bg-white text-yellow-500 px-2 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              Sincronizar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isUpdateAvailable) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Actualización disponible</span>
          <button
            onClick={updateServiceWorker}
            className="bg-white text-blue-500 px-2 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  return null;
}
