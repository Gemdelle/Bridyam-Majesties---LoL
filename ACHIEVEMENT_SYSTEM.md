# Sistema de Achievement Popups

## ✅ Estado: IMPLEMENTADO Y FUNCIONANDO

Este documento explica cómo funciona el sistema automático de popups de achievements.

## 🎯 ¿Qué hace?

Cuando un usuario desbloquea un achievement (sube de nivel, gana partidas, sube de rango, etc.), **automáticamente** aparecerá un popup mostrando el logro alcanzado con:
- 🎨 Animaciones y efectos visuales
- 🐾 Tu mascota celebrando contigo
- 🏆 Badge del achievement desbloqueado
- 📊 Progreso actual (ej: nivel 15/30)

## 🔧 Arquitectura

### 1. Backend (Kotlin)
- **TrackRankedProgressService**: Detecta cambios en las cuentas (level, honor, wins, elo, mastery)
- **NotificationCreatorService**: Crea notificaciones cuando hay cambios
- **FeedNotificationService**: Almacena las notificaciones en la base de datos

### 2. Frontend (React + TypeScript)

#### Hook: `useAchievementNotifications.ts`
Hook personalizado que:
- 🔄 Hace polling cada 10 segundos para buscar nuevas notificaciones
- 📝 Detecta múltiples notificaciones nuevas (no solo una)
- 🎭 Mapea cada tipo de notificación a datos del popup
- 📋 Gestiona una cola de achievements para mostrar uno a la vez
- 🎬 Evita mostrar popups en el primer login (solo detecta nuevos logros)

#### Integración en `App.tsx`
- El hook se ejecuta globalmente en toda la app
- Muestra el `AchievementPopup` cuando hay un achievement pendiente
- Pasa todos los datos necesarios (imagen, progreso, mascota, etc.)

#### Componente: `AchievementPopup`
Ya existía, ahora está conectado con el sistema real:
- Muestra el popup con animaciones
- Reproduce sonido de achievement
- Muestra la mascota del usuario con mensajes aleatorios
- Botón "Awesome!" para cerrar y ver el siguiente

## 📊 Tipos de Achievements Soportados

| Tipo | Trigger | Imagen Badge |
|------|---------|--------------|
| **Level Up** | Subir de nivel | level-up-icon.png |
| **Honor Up** | Subir honor | honor-{level}.png |
| **Win** | Ganar partida | level-up-icon.png |
| **Rank Up** | Subir división/tier | tier-{tier}-helm.webp |
| **Mastery** | Subir mastery con campeón | masteries/badges/{level}.png |
| **Level 30** | Alcanzar level 30 desde ≤10 | level-up-icon.png |
| **Member** | Canjear una cuenta | level-up-icon.png |
| **Mission** | Completar misión | level-up-icon.png |

## 🚀 Flujo Completo

```
1. Usuario gana una partida
   ↓
2. Backend detecta cambio (TrackRankedProgressService)
   ↓
3. Backend crea notificación (NotificationCreatorService)
   ↓
4. Notificación se guarda en DB (Supabase)
   ↓
5. Frontend hace polling (cada 10s)
   ↓
6. Hook detecta nueva notificación
   ↓
7. Mapea notificación a achievement
   ↓
8. Agrega a cola de achievements
   ↓
9. Muestra popup con animaciones
   ↓
10. Usuario presiona "Awesome!"
   ↓
11. Si hay más en cola, muestra el siguiente
```

## ⚙️ Configuración

### Polling Interval
```typescript
// En useAchievementNotifications.ts
const interval = setInterval(() => {
    checkForNewNotifications();
}, 10000); // 10 segundos
```

### Primera verificación
```typescript
const initialTimer = setTimeout(() => {
    checkForNewNotifications();
}, 2000); // 2 segundos después de login
```

## 🎮 Ejemplo de Uso Manual (Opcional)

Si necesitas forzar una verificación después de una acción específica:

```typescript
import { useAchievementNotifications } from './hooks/useAchievementNotifications';

function MyComponent() {
    const { forceCheck } = useAchievementNotifications();
    
    const handleAction = async () => {
        // Realizar acción que podría generar achievement
        await someAction();
        
        // Forzar verificación inmediata
        forceCheck();
    };
    
    return <button onClick={handleAction}>Actualizar</button>;
}
```

## 🐛 Debugging

Para ver logs en consola:
1. Abre DevTools (F12)
2. Ve a Console
3. Busca mensajes como:
   - "Error checking for new notifications"
   - Los datos de las notificaciones encontradas

## 📝 Notas Importantes

1. **Primera vez**: En el primer login, el sistema guarda la notificación más reciente pero NO muestra popup (para evitar mostrar achievements antiguos)

2. **Cola de achievements**: Si el backend crea múltiples notificaciones en rápida sucesión, el sistema las detecta todas y las muestra una por una

3. **Persistencia**: El sistema usa `lastCheckedRef` para recordar la última notificación vista (se resetea si cierras la app)

4. **Pet data**: El popup muestra la mascota que el usuario seleccionó en el tutorial

5. **User name**: Usa el username del usuario para personalizar mensajes de la mascota

## 🎨 Personalización

Para cambiar las imágenes de los badges, edita en `useAchievementNotifications.ts`:

```typescript
case NotificationAction.LEVEL_UP: {
    return {
        notification,
        category: 'level',
        progress: to,
        total: 30,
        badgeImage: `/images/icons/TU_IMAGEN.png` // ← Aquí
    };
}
```

## 🔮 Mejoras Futuras

- [ ] Sonidos diferentes por tipo de achievement
- [ ] Animaciones personalizadas según el tipo
- [ ] Historial de achievements desbloqueados
- [ ] Achievements locales (sin backend) para acciones del frontend
- [ ] Push notifications cuando la app está en segundo plano
- [ ] Sistema de "combo" para múltiples achievements seguidos

---

**¡El sistema está listo y funcionando! 🎉**

