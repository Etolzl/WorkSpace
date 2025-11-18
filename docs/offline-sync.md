# Sistema de Sincronización Offline

Este sistema implementa funcionalidad de sincronización offline para la aplicación PWA, permitiendo que las peticiones POST se almacenen localmente cuando no hay conexión y se sincronicen automáticamente cuando se recupere la conectividad.

## Componentes del Sistema

### 1. IndexedDB Storage (`lib/offline-storage.ts`)
- **Propósito**: Maneja el almacenamiento local de peticiones pendientes
- **Funcionalidades**:
  - Guardar peticiones pendientes con metadatos
  - Recuperar todas las peticiones pendientes
  - Eliminar peticiones sincronizadas exitosamente
  - Manejar contadores de reintentos

### 2. Fetch Interceptor (`lib/fetch-interceptor.ts`)
- **Propósito**: Intercepta peticiones HTTP para detectar fallos de red
- **Funcionalidades**:
  - Detecta errores de conectividad
  - Guarda automáticamente peticiones POST/PUT/DELETE/PATCH en IndexedDB
  - Devuelve respuestas simuladas para mantener la funcionalidad de la app

### 3. Offline Sync Hook (`hooks/use-offline-sync.ts`)
- **Propósito**: Hook personalizado para manejar el estado de sincronización
- **Funcionalidades**:
  - Detecta cambios en la conectividad
  - Sincroniza automáticamente cuando se recupera la conexión
  - Proporciona estado de sincronización en tiempo real

### 4. Service Worker Background Sync (`public/sw.js`)
- **Propósito**: Sincronización en segundo plano cuando se recupera la conectividad
- **Funcionalidades**:
  - Listener de Background Sync para procesar peticiones pendientes
  - Recrea peticiones originales desde IndexedDB
  - Maneja reintentos y eliminación de peticiones fallidas

### 5. UI Components
- **PWA Provider**: Integra el interceptor y manejo offline
- **Offline Sync Status**: Componente para mostrar estado de sincronización
- **Status Indicators**: Indicadores visuales de conectividad y sincronización

## Flujo de Funcionamiento

### Cuando hay conexión:
1. Las peticiones se ejecutan normalmente
2. Si fallan por problemas de red, se guardan en IndexedDB
3. Se muestra indicador de peticiones pendientes

### Cuando no hay conexión:
1. Las peticiones POST/PUT/DELETE/PATCH se interceptan
2. Se guardan automáticamente en IndexedDB
3. Se devuelve respuesta simulada (202 Accepted)
4. Se muestra indicador de modo offline

### Cuando se recupera la conexión:
1. Se detecta automáticamente el cambio de estado
2. Se registra Background Sync en el Service Worker
3. Se procesan todas las peticiones pendientes
4. Se eliminan las peticiones sincronizadas exitosamente
5. Se actualiza la UI con el nuevo estado

## Características Técnicas

### Persistencia de Datos
- **IndexedDB**: Almacenamiento local persistente
- **Estructura**: Cada petición incluye URL, método, headers, body, timestamp y contador de reintentos
- **Limpieza**: Peticiones con más de 3 reintentos se eliminan automáticamente

### Manejo de Errores
- **Detección inteligente**: Solo intercepta errores de conectividad real
- **Reintentos**: Máximo 3 intentos por petición
- **Fallback**: Respuestas simuladas para mantener UX

### Sincronización
- **Automática**: Se activa cuando se recupera la conexión
- **Manual**: Botón de sincronización en la UI
- **Background**: Service Worker maneja la sincronización en segundo plano

## Uso en la Aplicación

### Para desarrolladores:
```typescript
// El interceptor se activa automáticamente al cargar la app
// No se requiere configuración adicional

// Para verificar estado de sincronización:
const { isOnline, pendingRequests, syncPendingRequests, isSyncing } = usePWAContext();
```

### Para usuarios:
- **Indicador rojo**: Sin conexión, peticiones se guardan automáticamente
- **Indicador amarillo**: Conexión recuperada, peticiones pendientes por sincronizar
- **Botón sincronizar**: Permite sincronización manual
- **Estado en dashboard**: Panel de estado de sincronización

## Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari (con limitaciones en Background Sync)
- **PWA**: Requiere Service Worker registrado
- **IndexedDB**: Soporte nativo en navegadores modernos
- **Background Sync**: Funcionalidad experimental, fallback a sincronización manual

## Consideraciones de Seguridad

- **Validación**: Todas las peticiones se validan antes de guardar
- **Sanitización**: Headers y body se sanitizan automáticamente
- **Límites**: Máximo 3 reintentos por petición
- **Limpieza**: Peticiones antiguas se eliminan automáticamente
