// Utilidad para cachear datos relacionados con push notifications
const VAPID_KEY_CACHE_KEY = 'vapid_key_cache';
const VAPID_KEY_CACHE_TIMESTAMP_KEY = 'vapid_key_cache_timestamp';
const SUBSCRIPTIONS_CACHE_KEY = 'push_subscriptions_cache';
const SUBSCRIPTIONS_CACHE_TIMESTAMP_KEY = 'push_subscriptions_cache_timestamp';

const VAPID_KEY_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 horas (las claves VAPID no cambian frecuentemente)
const SUBSCRIPTIONS_CACHE_AGE = 60 * 1000; // 1 minuto (las suscripciones pueden cambiar más frecuentemente)

export const pushCache = {
  // Guardar clave VAPID en caché
  saveVapidKey(key: string): void {
    try {
      localStorage.setItem(VAPID_KEY_CACHE_KEY, key);
      localStorage.setItem(VAPID_KEY_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error guardando clave VAPID en caché:', error);
    }
  },

  // Obtener clave VAPID desde caché
  getVapidKey(): string | null {
    try {
      const key = localStorage.getItem(VAPID_KEY_CACHE_KEY);
      const timestampStr = localStorage.getItem(VAPID_KEY_CACHE_TIMESTAMP_KEY);
      
      if (!key || !timestampStr) {
        return null;
      }

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      
      // Verificar si la clave es muy antigua
      if (now - timestamp > VAPID_KEY_CACHE_AGE) {
        this.clearVapidKey();
        return null;
      }

      return key;
    } catch (error) {
      console.error('Error obteniendo clave VAPID desde caché:', error);
      return null;
    }
  },

  // Limpiar clave VAPID del caché
  clearVapidKey(): void {
    try {
      localStorage.removeItem(VAPID_KEY_CACHE_KEY);
      localStorage.removeItem(VAPID_KEY_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error limpiando clave VAPID del caché:', error);
    }
  },

  // Guardar suscripciones en caché
  saveSubscriptions(subscriptions: any[]): void {
    try {
      localStorage.setItem(SUBSCRIPTIONS_CACHE_KEY, JSON.stringify(subscriptions));
      localStorage.setItem(SUBSCRIPTIONS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error guardando suscripciones en caché:', error);
    }
  },

  // Obtener suscripciones desde caché
  getSubscriptions(): any[] | null {
    try {
      const subscriptionsStr = localStorage.getItem(SUBSCRIPTIONS_CACHE_KEY);
      const timestampStr = localStorage.getItem(SUBSCRIPTIONS_CACHE_TIMESTAMP_KEY);
      
      if (!subscriptionsStr || !timestampStr) {
        return null;
      }

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      
      // Verificar si las suscripciones son muy antiguas
      if (now - timestamp > SUBSCRIPTIONS_CACHE_AGE) {
        this.clearSubscriptions();
        return null;
      }

      return JSON.parse(subscriptionsStr);
    } catch (error) {
      console.error('Error obteniendo suscripciones desde caché:', error);
      return null;
    }
  },

  // Limpiar suscripciones del caché
  clearSubscriptions(): void {
    try {
      localStorage.removeItem(SUBSCRIPTIONS_CACHE_KEY);
      localStorage.removeItem(SUBSCRIPTIONS_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error limpiando suscripciones del caché:', error);
    }
  },

  // Invalidar caché de suscripciones (útil cuando se suscribe/desuscribe)
  invalidateSubscriptions(): void {
    this.clearSubscriptions();
  }
};

