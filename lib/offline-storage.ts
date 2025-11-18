// Utilidad para manejar almacenamiento offline con IndexedDB
interface PendingRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retryCount: number;
}

class OfflineStorage {
  private dbName = 'PWAOfflineDB';
  private version = 1;
  private storeName = 'pendingRequests';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('url', 'url', { unique: false });
        }
      };
    });
  }

  async savePendingRequest(request: Omit<PendingRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    if (!this.db) await this.init();

    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingRequest: PendingRequest = {
      id,
      timestamp: Date.now(),
      retryCount: 0,
      ...request
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(pendingRequest);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPendingRequests(): Promise<PendingRequest[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePendingRequest(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateRetryCount(id: string, retryCount: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const request = getRequest.result;
        if (request) {
          request.retryCount = retryCount;
          const putRequest = store.put(request);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearAllPendingRequests(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cleanCorruptedRequests(): Promise<number> {
    if (!this.db) await this.init();
    
    const allRequests = await this.getAllPendingRequests();
    let cleanedCount = 0;
    
    for (const request of allRequests) {
      // Validar peticiones corruptas
      const isCorrupted = 
        !request.url || 
        !request.method ||
        (['POST', 'PUT', 'PATCH'].includes(request.method) && !request.body) ||
        request.retryCount >= 3;
      
      if (isCorrupted) {
        console.log('🧹 Limpiando petición corrupta:', {
          id: request.id,
          url: request.url,
          method: request.method,
          hasBody: !!request.body,
          retryCount: request.retryCount
        });
        
        await this.deletePendingRequest(request.id!);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Limpieza completada: ${cleanedCount} peticiones corruptas eliminadas`);
    }
    
    return cleanedCount;
  }
}

export const offlineStorage = new OfflineStorage();
export type { PendingRequest };

// Exponer función global para limpiar desde la consola
if (typeof window !== 'undefined') {
  (window as any).clearAllPendingRequests = async () => {
    try {
      await offlineStorage.init();
      const requests = await offlineStorage.getAllPendingRequests();
      const count = requests.length;
      
      if (count === 0) {
        console.log('✅ No hay peticiones pendientes para eliminar');
        return;
      }
      
      const confirmed = confirm(`¿Eliminar todas las ${count} peticiones pendientes?\n\nEsta acción no se puede deshacer.`);
      
      if (confirmed) {
        await offlineStorage.clearAllPendingRequests();
        console.log(`✅ Se eliminaron ${count} peticiones pendientes`);
        console.log('💡 Recarga la página para ver los cambios');
        return count;
      } else {
        console.log('❌ Operación cancelada');
        return 0;
      }
    } catch (error) {
      console.error('❌ Error al eliminar peticiones:', error);
      throw error;
    }
  };
  
  // También exponer función para ver el conteo
  (window as any).getPendingRequestsCount = async () => {
    try {
      await offlineStorage.init();
      const requests = await offlineStorage.getAllPendingRequests();
      console.log(`📊 Hay ${requests.length} peticiones pendientes`);
      return requests.length;
    } catch (error) {
      console.error('❌ Error al obtener conteo:', error);
      throw error;
    }
  };
  
  console.log('💡 Funciones disponibles en la consola:');
  console.log('   - window.clearAllPendingRequests() - Eliminar todas las peticiones');
  console.log('   - window.getPendingRequestsCount() - Ver cantidad de peticiones');
}