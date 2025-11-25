// Utilidad para cachear datos del dashboard
const DASHBOARD_CACHE_KEY = 'dashboard_cache';
const DASHBOARD_CACHE_TIMESTAMP_KEY = 'dashboard_cache_timestamp';
const MAX_CACHE_AGE = 60 * 60 * 1000; // 1 hora

interface DashboardCache {
  environments: any[];
  sensors?: any;
  timestamp: number;
}

export const dashboardCache = {
  // Guardar datos del dashboard en localStorage
  saveDashboardData(data: { environments?: any[]; sensors?: any }): void {
    try {
      const cacheData: DashboardCache = {
        environments: data.environments || [],
        sensors: data.sensors,
        timestamp: Date.now(),
      };
      localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(DASHBOARD_CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('✅ Datos del dashboard guardados en caché');
    } catch (error) {
      console.error('Error guardando datos del dashboard:', error);
    }
  },

  // Obtener datos del dashboard desde localStorage
  getDashboardData(): DashboardCache | null {
    try {
      const cacheDataStr = localStorage.getItem(DASHBOARD_CACHE_KEY);
      const timestampStr = localStorage.getItem(DASHBOARD_CACHE_TIMESTAMP_KEY);
      
      if (!cacheDataStr || !timestampStr) {
        return null;
      }

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      
      // Verificar si los datos son muy viejos (más de 1 hora)
      if (now - timestamp > MAX_CACHE_AGE) {
        console.log('⚠️ Datos del dashboard muy antiguos, limpiando caché');
        this.clearDashboardData();
        return null;
      }

      return JSON.parse(cacheDataStr);
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      return null;
    }
  },

  // Limpiar datos del dashboard
  clearDashboardData(): void {
    try {
      localStorage.removeItem(DASHBOARD_CACHE_KEY);
      localStorage.removeItem(DASHBOARD_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error limpiando datos del dashboard:', error);
    }
  },

  // Verificar si hay conexión
  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  },

  // Obtener entornos con fallback a caché
  async fetchEnvironments(userId: string | null, token: string | null): Promise<any[]> {
    // Si estamos offline, usar datos guardados
    if (!this.isOnline()) {
      console.log('📴 Sin conexión, usando entornos desde caché');
      const cached = this.getDashboardData();
      if (cached && cached.environments) {
        console.log('✅ Usando entornos desde caché');
        // Filtrar por userId si está disponible
        if (userId) {
          return cached.environments.filter((e: any) => e.usuario === userId);
        }
        return cached.environments;
      } else {
        console.log('⚠️ No hay entornos en caché');
        return [];
      }
    }

    // Si hay conexión, intentar obtener datos del servidor
    try {
      const res = await fetch(`https://workspaceapi-b81x.onrender.com/entornos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        // Si es un error 429, usar caché si está disponible
        if (res.status === 429) {
          console.warn('⚠️ Demasiadas solicitudes al obtener entornos, usando caché');
          const cached = this.getDashboardData();
          if (cached && cached.environments) {
            if (userId) {
              return cached.environments.filter((e: any) => e.usuario === userId);
            }
            return cached.environments;
          }
        }
        
        // Si falla pero tenemos datos guardados, usar esos
        const cached = this.getDashboardData();
        if (cached && cached.environments) {
          console.log('⚠️ Error en fetch, usando entornos guardados');
          if (userId) {
            return cached.environments.filter((e: any) => e.usuario === userId);
          }
          return cached.environments;
        }
        throw new Error(`Error al obtener entornos (${res.status})`);
      }

      const data = await res.json();
      const environments = Array.isArray(data) ? data : [];
      
      // Guardar en caché
      this.saveDashboardData({ environments });
      
      // Filtrar por userId si está disponible
      if (userId) {
        return environments.filter((e: any) => e.usuario === userId);
      }
      
      return environments;
    } catch (error) {
      // Si hay error de red pero tenemos datos guardados, usar esos
      const cached = this.getDashboardData();
      if (cached && cached.environments) {
        console.log('⚠️ Error de red, usando entornos guardados');
        if (userId) {
          return cached.environments.filter((e: any) => e.usuario === userId);
        }
        return cached.environments;
      }
      throw error;
    }
  }
};

