// Utilidad para manejar autenticación offline
const USER_DATA_KEY = 'user_data';
const USER_DATA_TIMESTAMP_KEY = 'user_data_timestamp';
const TOKEN_VALIDATION_CACHE_KEY = 'token_validation_cache';
const TOKEN_VALIDATION_CACHE_TIMESTAMP_KEY = 'token_validation_cache_timestamp';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 horas
const TOKEN_VALIDATION_CACHE_AGE = 5 * 60 * 1000; // 5 minutos (para evitar llamadas muy frecuentes)

interface UserData {
  id?: string;
  _id?: string;
  nombre: string;
  apellido?: string;
  correo: string;
  rol: string;
  [key: string]: any;
}

export const authOffline = {
  // Guardar datos del usuario en localStorage
  saveUserData(user: UserData): void {
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      localStorage.setItem(USER_DATA_TIMESTAMP_KEY, Date.now().toString());
      console.log('✅ Datos de usuario guardados en localStorage');
    } catch (error) {
      console.error('Error guardando datos de usuario:', error);
    }
  },

  // Obtener datos del usuario desde localStorage
  getUserData(): UserData | null {
    try {
      const userDataStr = localStorage.getItem(USER_DATA_KEY);
      const timestampStr = localStorage.getItem(USER_DATA_TIMESTAMP_KEY);
      
      if (!userDataStr || !timestampStr) {
        return null;
      }

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      
      // Verificar si los datos son muy viejos (más de 24 horas)
      if (now - timestamp > MAX_CACHE_AGE) {
        console.log('⚠️ Datos de usuario muy antiguos, limpiando cache');
        this.clearUserData();
        return null;
      }

      return JSON.parse(userDataStr);
    } catch (error) {
      console.error('Error obteniendo datos de usuario:', error);
      return null;
    }
  },

  // Limpiar datos del usuario
  clearUserData(): void {
    try {
      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem(USER_DATA_TIMESTAMP_KEY);
      localStorage.removeItem(TOKEN_VALIDATION_CACHE_KEY);
      localStorage.removeItem(TOKEN_VALIDATION_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error limpiando datos de usuario:', error);
    }
  },

  // Verificar si hay conexión
  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  },

  // Validar token y obtener datos del usuario (con fallback offline y caché)
  async validateToken(token: string): Promise<{ user: UserData; fromCache: boolean }> {
    // Si estamos offline, usar datos guardados
    if (!this.isOnline()) {
      console.log('📴 Sin conexión, usando datos de usuario guardados');
      const cachedUser = this.getUserData();
      
      if (cachedUser) {
        console.log('✅ Usando datos de usuario desde cache');
        return { user: cachedUser, fromCache: true };
      } else {
        throw new Error('No hay datos de usuario guardados y no hay conexión');
      }
    }

    // Verificar si hay una validación reciente en caché (para evitar llamadas muy frecuentes)
    try {
      const cachedValidationStr = localStorage.getItem(TOKEN_VALIDATION_CACHE_KEY);
      const cachedValidationTimestampStr = localStorage.getItem(TOKEN_VALIDATION_CACHE_TIMESTAMP_KEY);
      
      if (cachedValidationStr && cachedValidationTimestampStr) {
        const cachedValidation = JSON.parse(cachedValidationStr);
        const cachedTimestamp = parseInt(cachedValidationTimestampStr, 10);
        const now = Date.now();
        
        // Si la validación es reciente (menos de 5 minutos), usar caché
        if (now - cachedTimestamp < TOKEN_VALIDATION_CACHE_AGE && cachedValidation.token === token) {
          const cachedUser = this.getUserData();
          if (cachedUser) {
            console.log('✅ Usando validación de token desde caché');
            return { user: cachedUser, fromCache: true };
          }
        }
      }
    } catch (error) {
      // Si hay error leyendo el caché, continuar con la validación normal
      console.warn('Error leyendo caché de validación:', error);
    }

    // Si hay conexión, intentar obtener datos del servidor
    try {
      const response = await fetch("http://https://workspaceapi-b81x.onrender.com/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        // Si es un error 429, usar caché si está disponible
        if (response.status === 429) {
          console.warn('⚠️ Demasiadas solicitudes al validar token, usando caché');
          const cachedUser = this.getUserData();
          if (cachedUser) {
            return { user: cachedUser, fromCache: true };
          }
        }
        
        // Si falla pero tenemos datos guardados, usar esos
        const cachedUser = this.getUserData();
        if (cachedUser) {
          console.log('⚠️ Error en validación, usando datos guardados');
          return { user: cachedUser, fromCache: true };
        }
        throw new Error("No autorizado");
      }

      const data = await response.json();
      
      // Guardar datos del usuario para uso offline
      if (data.user) {
        this.saveUserData(data.user);
      }

      // Guardar validación en caché
      try {
        localStorage.setItem(TOKEN_VALIDATION_CACHE_KEY, JSON.stringify({ token, user: data.user }));
        localStorage.setItem(TOKEN_VALIDATION_CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch (cacheError) {
        console.warn('Error guardando validación en caché:', cacheError);
      }

      return { user: data.user, fromCache: false };
    } catch (error) {
      // Si hay error de red pero tenemos datos guardados, usar esos
      const cachedUser = this.getUserData();
      if (cachedUser) {
        console.log('⚠️ Error de red, usando datos guardados');
        return { user: cachedUser, fromCache: true };
      }
      throw error;
    }
  }
};

