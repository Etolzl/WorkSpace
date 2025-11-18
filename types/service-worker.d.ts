// Declaraciones de tipos para Service Worker y Background Sync
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }

  interface Window {
    ServiceWorkerRegistration: typeof ServiceWorkerRegistration;
  }
}

export {};
