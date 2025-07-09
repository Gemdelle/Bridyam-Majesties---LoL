# Sistema de Autenticación - Frontend

Este documento describe la implementación del sistema de autenticación en el frontend de Bridyam Majesties.

## Características Implementadas

### 1. Servicio de Autenticación (`authService.ts`)
- **Login**: Autentica usuarios con email y contraseña
- **Logout**: Cierra sesión y limpia tokens
- **Registro**: Registra nuevos usuarios
- **Validación de Token**: Verifica si el token JWT es válido
- **Cambio de Contraseña**: Permite cambiar la contraseña del usuario
- **Peticiones Autenticadas**: Método helper para hacer peticiones con token

### 2. Hook de Autenticación (`useAuth.ts`)
- **Estado de Autenticación**: Maneja el estado global de autenticación
- **Inicialización**: Verifica automáticamente tokens al iniciar la aplicación
- **Persistencia**: Mantiene la sesión activa usando localStorage
- **Validación Automática**: Valida tokens con el backend

### 3. Contexto de Autenticación (`AuthContext.tsx`)
- **Provider**: Proporciona el estado de autenticación a toda la aplicación
- **Hook de Contexto**: `useAuthContext()` para acceder al estado

### 4. Componente de Login (`Login.tsx`)
- **Formulario**: Email y contraseña con validación
- **Estados**: Loading, error, y éxito
- **Redirección**: Automática después del login exitoso
- **Validación**: Input type="email" y validación de campos requeridos

### 5. Rutas Protegidas (`ProtectedRoute.tsx`)
- **Protección**: Redirige a login si no está autenticado
- **Loading**: Muestra pantalla de carga mientras se verifica la autenticación
- **Redirección**: Automática a login para usuarios no autenticados

### 6. Navegación (`Nav.tsx`)
- **Información del Usuario**: Muestra email y nombre completo
- **Botón de Logout**: Permite cerrar sesión
- **Visibilidad**: Solo se muestra cuando el usuario está autenticado

## Configuración

### 1. Variables de Entorno
El frontend está configurado para conectarse a:
```
API_BASE_URL = 'http://localhost:8080'
```

### 2. Endpoints Utilizados
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/register` - Registro
- `POST /auth/validate-token` - Validar token
- `GET /auth/profile` - Obtener perfil
- `POST /auth/change-password` - Cambiar contraseña

### 3. Rutas Protegidas
- `/` - Home (Accounts)
- `/bloodlines` - Bloodlines
- `/ranked` - Ranked

### 4. Rutas Públicas
- `/login` - Login

## Uso

### 1. Inicialización
```tsx
import { AuthProvider } from './contexts/AuthContext';

// Envolver la aplicación con AuthProvider
<AuthProvider>
  <App />
</AuthProvider>
```

### 2. Usar el Hook de Autenticación
```tsx
import { useAuthContext } from './contexts/AuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout 
  } = useAuthContext();

  // Usar el estado de autenticación
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;
  
  return <div>Welcome {user?.email}</div>;
}
```

### 3. Hacer Peticiones Autenticadas
```tsx
import { authService } from './services/authService';

// Los servicios ya incluyen automáticamente el token
const rankedData = await fetchRankedData();
const masteryData = await fetchMasteryData();
```

## Flujo de Autenticación

### 1. Inicialización de la Aplicación
1. App se envuelve con `AuthProvider`
2. Hook `useAuth` se ejecuta y verifica si existe un token en localStorage
3. Si existe token, se valida con el backend
4. Si es válido, se establece el estado de autenticación
5. Si no es válido, se redirige a login

### 2. Proceso de Login
1. Usuario ingresa email y contraseña
2. Se hace petición POST a `/auth/login`
3. Si es exitoso, se almacena el token en localStorage
4. Se actualiza el estado de autenticación
5. Se redirige a la página principal

### 3. Navegación
1. `ProtectedRoute` verifica el estado de autenticación
2. Si no está autenticado, redirige a `/login`
3. Si está autenticado, muestra el componente

### 4. Peticiones a la API
1. Los servicios usan `authService.makeAuthenticatedRequest()`
2. Este método automáticamente incluye el token JWT en el header `Authorization`
3. Si el token expira, se maneja automáticamente

### 5. Logout
1. Usuario hace click en el botón de logout
2. Se confirma la acción
3. Se hace petición POST a `/auth/logout`
4. Se limpia el token del localStorage
5. Se redirige a login

## Manejo de Errores

### 1. Errores de Red
- Se muestran mensajes de error genéricos
- Se registran en la consola para debugging

### 2. Errores de Autenticación
- Token expirado: Se redirige automáticamente a login
- Credenciales inválidas: Se muestra mensaje específico
- Usuario no encontrado: Se muestra mensaje específico

### 3. Errores de Validación
- Campos requeridos: Validación HTML5
- Formato de email: Validación HTML5
- Contraseña: Validación en backend

## Persistencia de Sesión

### 1. LocalStorage
- Token JWT: `auth_token`
- Datos del usuario: `user_data`

### 2. Expiración
- Los tokens expiran según la configuración del backend (1 hora por defecto)
- Se validan automáticamente al iniciar la aplicación
- Se manejan automáticamente en las peticiones

### 3. Limpieza
- Se limpia automáticamente en logout
- Se limpia automáticamente si el token es inválido

## Seguridad

### 1. Almacenamiento de Tokens
- Se almacenan en localStorage (no en cookies para evitar CSRF)
- Se incluyen en el header Authorization: Bearer <token>

### 2. Validación
- Se valida el token en cada inicialización de la aplicación
- Se maneja automáticamente la expiración

### 3. Rutas Protegidas
- Todas las rutas principales están protegidas
- Se redirige automáticamente a login si no está autenticado

## Próximos Pasos

### 1. Mejoras Sugeridas
- Implementar refresh tokens
- Agregar "Remember Me" funcionalidad
- Implementar 2FA (Two-Factor Authentication)
- Agregar rate limiting en el frontend
- Implementar mejor manejo de errores

### 2. Funcionalidades Adicionales
- Página de registro
- Página de cambio de contraseña
- Página de perfil de usuario
- Recuperación de contraseña

### 3. Optimizaciones
- Implementar React Query para cache
- Optimizar re-renderizado con React.memo
- Agregar Service Worker para offline support 