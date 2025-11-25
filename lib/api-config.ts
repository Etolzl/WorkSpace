/**
 * Configuración centralizada de la API
 * 
 * IMPORTANTE: Para producción, configura la variable de entorno NEXT_PUBLIC_API_URL
 * en Vercel o tu plataforma de hosting.
 * 
 * El backend debe configurar CORS para permitir el origen de producción.
 * Actualmente el backend solo permite: http://localhost:3000
 * 
 * Para resolver el error de CORS, el backend debe actualizar la configuración
 * para incluir: https://work-space-gamma-umber.vercel.app
 */

export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://workspaceapi-b81x.onrender.com';

/**
 * Construye una URL completa para un endpoint de la API
 */
export function getApiUrl(endpoint: string): string {
  // Si el endpoint ya es una URL completa, retornarla tal cual
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // Asegurar que el endpoint comience con /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Remover trailing slash del base URL si existe
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
  
  return `${baseUrl}${normalizedEndpoint}`;
}

