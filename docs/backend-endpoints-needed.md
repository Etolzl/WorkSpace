# Endpoints del Backend Necesarios para Gestión de Usuarios

Este documento describe los endpoints que necesitan ser agregados al backend para que la funcionalidad de gestión de usuarios con notificaciones push funcione correctamente.

## Endpoints Requeridos

### 1. Obtener Suscripciones de un Usuario Específico (Admin)

**Ruta:** `GET /push/subscriptions/:userId`

**Descripción:** Permite a un administrador obtener las suscripciones push de un usuario específico.

**Autenticación:** Requiere token de administrador

**Parámetros:**
- `userId` (URL parameter): ID del usuario del cual obtener las suscripciones

**Respuesta Exitosa (200):**
```json
{
  "subscriptions": [
    {
      "_id": "...",
      "usuario": "...",
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      },
      "userAgent": "Mozilla/5.0...",
      "lastUsed": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Respuesta de Error (404):**
```json
{
  "error": "Usuario no encontrado"
}
```

**Respuesta de Error (403):**
```json
{
  "error": "Acceso denegado. Se requieren permisos de administrador"
}
```

**Implementación sugerida en `routes/push.js`:**
```javascript
// Obtener suscripciones de un usuario específico (solo admin)
router.get('/subscriptions/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar que el usuario existe
    const User = require('../models/user');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const subscriptions = await PushSubscription.find({ usuario: userId });
    res.json({ subscriptions });
  } catch (error) {
    console.error('Error obteniendo suscripciones:', error);
    res.status(500).json({ error: 'Error obteniendo suscripciones' });
  }
});
```

### 2. Enviar Notificación a un Usuario Específico (Admin)

**Ruta:** `POST /push/send-to-user/:userId`

**Descripción:** Permite a un administrador enviar una notificación push personalizada a un usuario específico.

**Autenticación:** Requiere token de administrador

**Parámetros:**
- `userId` (URL parameter): ID del usuario al cual enviar la notificación

**Body:**
```json
{
  "title": "Título de la notificación",
  "body": "Mensaje de la notificación",
  "icon": "/favicon/favicon-96x96.png",
  "url": "/dashboard",
  "data": {}
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Notificación enviada",
  "results": [
    {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "status": "success"
    }
  ]
}
```

**Respuesta de Error (404):**
```json
{
  "error": "Usuario no encontrado"
}
```

**Respuesta de Error (404):**
```json
{
  "error": "No hay suscripciones activas para este usuario"
}
```

**Respuesta de Error (403):**
```json
{
  "error": "Acceso denegado. Se requieren permisos de administrador"
}
```

**Implementación sugerida en `routes/push.js`:**
```javascript
// Enviar una notificación push a un usuario específico (solo admin)
router.post('/send-to-user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, body, icon, url, data } = req.body;
    
    // Verificar que el usuario existe
    const User = require('../models/user');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const subscriptions = await PushSubscription.find({ usuario: userId });
    
    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'No hay suscripciones activas para este usuario' });
    }
    
    const payload = JSON.stringify({ title, body, icon, url, data });
    
    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(sub, payload).catch(async (error) => {
        console.error(`Error enviando notificación a ${sub.endpoint}:`, error);
        // Si la suscripción ya no es válida, eliminarla de la base de datos
        if (error.statusCode === 410 || error.body.includes('expired')) {
          console.log(`Suscripción expirada o inválida, eliminando: ${sub.endpoint}`);
          await PushSubscription.findByIdAndDelete(sub._id);
        }
        return { endpoint: sub.endpoint, status: 'failed', error: error.message };
      })
    );
    
    const results = await Promise.all(sendPromises);
    console.log(`Notificación enviada a ${subscriptions.length} suscripciones del usuario ${user.correo} por administrador ${req.user.email}`);
    res.json({ message: 'Notificación enviada', results });
    
  } catch (error) {
    console.error('Error enviando notificación a usuario:', error);
    res.status(500).json({ error: 'Error enviando notificación' });
  }
});
```

## Notas Importantes

1. **Seguridad:** Ambos endpoints requieren autenticación y permisos de administrador (`requireAdmin`).

2. **Validación:** Se debe validar que el usuario existe antes de procesar las solicitudes.

3. **Manejo de Errores:** Se debe manejar correctamente los casos donde:
   - El usuario no existe
   - El usuario no tiene suscripciones activas
   - Las suscripciones están expiradas o inválidas

4. **Limpieza:** Las suscripciones expiradas o inválidas deben ser eliminadas automáticamente de la base de datos.

5. **Logging:** Se recomienda registrar todas las acciones de envío de notificaciones para auditoría.

