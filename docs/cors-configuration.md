# Configuración de CORS - Problema y Solución

## Problema Actual

Al desplegar la aplicación en Vercel (`https://work-space-gamma-umber.vercel.app`), se produce un error de CORS al intentar hacer peticiones al backend:

```
Access to fetch at 'https://workspaceapi-b81x.onrender.com/users/login' from origin 
'https://work-space-gamma-umber.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' 
that is not equal to the supplied origin.
```

## Causa

El backend en `https://workspaceapi-b81x.onrender.com` está configurado para permitir solicitudes solo desde `http://localhost:3000`, pero la aplicación en producción está en `https://work-space-gamma-umber.vercel.app`.

## Solución

El backend debe actualizar su configuración de CORS para incluir el origen de producción.

### Opción 1: Permitir múltiples orígenes (Recomendado)

En el backend, actualizar la configuración de CORS para permitir tanto desarrollo como producción:

```javascript
// Ejemplo con Express y cors
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'https://work-space-gamma-umber.vercel.app',
  // Agregar otros orígenes según sea necesario
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Opción 2: Usar variable de entorno

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://work-space-gamma-umber.vercel.app',
  // Agregar otros orígenes según sea necesario
];
```

### Opción 3: Permitir todos los orígenes (Solo para desarrollo, NO recomendado para producción)

```javascript
app.use(cors({
  origin: '*', // ⚠️ NO usar en producción
  credentials: true,
}));
```

## Verificación

Después de actualizar el backend:

1. Reinicia el servidor backend
2. Intenta iniciar sesión desde la aplicación en Vercel
3. Verifica que no aparezcan errores de CORS en la consola del navegador

## Notas Adicionales

- Si planeas usar un dominio personalizado, agrégalo también a la lista de orígenes permitidos
- Asegúrate de que el backend también permita las credenciales (`credentials: true`) si estás enviando cookies o headers de autenticación
- Los métodos HTTP permitidos deben incluir: GET, POST, PUT, DELETE, PATCH, OPTIONS

