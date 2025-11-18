# Sistema de Notificaciones Push

Este documento describe el sistema completo de notificaciones push implementado en la aplicación.

## Arquitectura del Sistema

### Backend (API)
- **Configuración**: `API/routes/push-config.js` - Configuración de claves VAPID
- **Modelo**: `API/models/pushSubscription.js` - Modelo de base de datos para suscripciones
- **Rutas**: `API/routes/push.js` - Endpoints para manejar suscripciones y envío
- **Pruebas**: `API/routes/test-push.js` - Endpoints de prueba y estadísticas

### Frontend
- **Hook**: `hooks/use-push-notifications.ts` - Hook personalizado para manejar notificaciones
- **Componente**: `components/dashboard/push-notifications.tsx` - Interfaz de usuario
- **Service Worker**: `public/sw.js` - Manejo de notificaciones en el navegador

## Configuración

### 1. Claves VAPID
Las claves VAPID ya están configuradas:
- **Clave Pública**: `BGQECJNUtqdg8AaL3qBNSEgH86UagDCZguAGD0ZrAQH2upekDEDbce-7Upjj14qurzuUZ13JV-C2e-VERd9C8DM`
- **Clave Privada**: `gfjjZ3A3lRKXcNw4l9o3b-3_vu0tFb2bt-fRIJoYUDQ`

### 2. Variables de Entorno
Asegúrate de tener configuradas las siguientes variables:
```env
MONGODB_URI=mongodb://localhost:27017/tu-base-de-datos
JWT_SECRET=tu-jwt-secret
FRONTEND_URL=http://localhost:3000
```

## Endpoints de la API

### Suscripción a Notificaciones
```http
POST /push/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "userAgent": "Mozilla/5.0..."
}
```

### Desuscripción
```http
POST /push/unsubscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

### Obtener Clave VAPID Pública
```http
GET /push/vapid-key
```

### Enviar Notificación Personal
```http
POST /push/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Título de la notificación",
  "body": "Mensaje de la notificación",
  "icon": "/favicon/favicon-96x96.png",
  "url": "/dashboard",
  "data": {}
}
```

### Enviar Notificación Masiva (Solo Admin)
```http
POST /push/send-to-all
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Notificación para todos",
  "body": "Mensaje para todos los usuarios",
  "icon": "/favicon/favicon-96x96.png",
  "url": "/dashboard"
}
```

### Obtener Suscripciones del Usuario
```http
GET /push/subscriptions
Authorization: Bearer <token>
```

## Endpoints de Prueba

### Enviar Notificación de Prueba
```http
POST /test-push/send-test
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Prueba",
  "body": "Notificación de prueba",
  "icon": "/favicon/favicon-96x96.png",
  "url": "/dashboard"
}
```

### Enviar Notificación Automática (Solo Admin)
```http
POST /test-push/send-automated
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "sensor_alert",
  "data": {
    "sensorName": "Temperatura",
    "value": 35
  }
}
```

Tipos disponibles:
- `sensor_alert` - Alerta de sensor
- `environment_status` - Cambio de estado de entorno
- `system_update` - Actualización del sistema
- `maintenance` - Mantenimiento programado

### Obtener Estadísticas (Solo Admin)
```http
GET /test-push/stats
Authorization: Bearer <token>
```

## Uso en el Frontend

### 1. Hook Personalizado
```typescript
import { usePushNotifications } from '@/hooks/use-push-notifications';

const {
  isSupported,
  isSubscribed,
  isLoading,
  error,
  subscribe,
  unsubscribe,
  sendNotification,
  sendNotificationToAll
} = usePushNotifications();
```

### 2. Componente de Configuración
```tsx
import { PushNotificationSettings } from '@/components/dashboard/push-notifications';

<PushNotificationSettings userRole="admin" />
```

### 3. Suscripción Automática
```typescript
// Suscribirse automáticamente al cargar la aplicación
useEffect(() => {
  if (isSupported && !isSubscribed) {
    subscribe();
  }
}, [isSupported, isSubscribed, subscribe]);
```

## Características del Sistema

### ✅ Funcionalidades Implementadas
- Suscripción/desuscripción automática
- Envío de notificaciones personales
- Envío de notificaciones masivas (admin)
- Manejo de múltiples dispositivos por usuario
- Gestión automática de suscripciones inválidas
- Interfaz de usuario completa
- Service Worker optimizado
- Endpoints de prueba y estadísticas

### 🔒 Seguridad
- Autenticación JWT requerida
- Validación de permisos de administrador
- Sanitización de datos de entrada
- Rate limiting implementado
- Manejo seguro de claves VAPID

### 📱 Compatibilidad
- Chrome/Chromium
- Firefox
- Edge
- Safari (limitado)
- Navegadores móviles

## Flujo de Trabajo

1. **Usuario accede a la aplicación**
2. **Sistema verifica soporte de notificaciones**
3. **Solicita permisos al usuario**
4. **Crea suscripción push**
5. **Envía suscripción al servidor**
6. **Servidor almacena suscripción en BD**
7. **Usuario puede enviar/recibir notificaciones**

## Troubleshooting

### Problemas Comunes

1. **"Las notificaciones push no son compatibles"**
   - Verificar que el navegador soporte Service Workers
   - Asegurar que la aplicación esté servida por HTTPS

2. **"Permisos de notificación denegados"**
   - El usuario debe permitir notificaciones manualmente
   - Verificar configuración del navegador

3. **"No hay token de autenticación"**
   - El usuario debe estar logueado
   - Verificar que el token JWT sea válido

4. **"Error enviando notificación"**
   - Verificar que la suscripción esté activa
   - Comprobar conectividad de red
   - Revisar logs del servidor

### Logs de Debug
Los logs se muestran en la consola del navegador y del servidor:
- Service Worker: `console.log('Service Worker: ...')`
- API: `console.log('Notificación enviada a: ...')`

## Próximos Pasos

1. **Integrar con el dashboard principal**
2. **Agregar notificaciones automáticas por eventos**
3. **Implementar plantillas de notificaciones**
4. **Agregar analytics de notificaciones**
5. **Optimizar para dispositivos móviles**

## Recursos Adicionales

- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [Service Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
