# Sistema de Caché de Masteries 🚀

## ¿Qué problema resuelve?

Antes, cada una de las 3 páginas (Accounts, Champions, Mastery) hacía su propia request al backend para obtener los datos de masteries. Esto significaba:
- ❌ **3 requests** al backend cada vez que navegabas entre páginas
- ❌ **Costos triplicados** en el backend
- ❌ **Carga innecesaria** en la base de datos

## Solución: Caché Centralizada

Ahora todas las páginas usan la **misma caché compartida**:
- ✅ **1 sola request** al backend (las otras páginas usan la caché)
- ✅ **Costos reducidos** hasta un 66% en queries de masteries
- ✅ **Carga más rápida** en navegación entre páginas
- ✅ **TTL configurable** para balancear frescura de datos vs costos

## Cómo funciona

### Flujo de caché:

1. **Primera carga** (ej: entras a Accounts):
   - 🌐 Request al backend → Guarda en caché
   
2. **Segunda página** (ej: vas a Champions):
   - ✅ Lee desde caché (NO hace request)
   
3. **Tercera página** (ej: vas a Mastery):
   - ✅ Lee desde caché (NO hace request)
   
4. **Después del TTL** (ej: pasan 5 minutos):
   - 🌐 Nueva request al backend → Actualiza caché

### Protección contra requests duplicados:

Si 2 páginas cargan simultáneamente:
- Primera página: Inicia request
- Segunda página: Espera a que termine la misma request
- Resultado: **1 sola request** en lugar de 2

## Configuración del TTL

Puedes ajustar el TTL en `cacheConfig.ts`:

```typescript
export const CACHE_CONFIG = {
    // Tiempo que los datos permanecen en caché
    MASTERY_CACHE_TTL: 5 * 60 * 1000, // 5 minutos (default)
};
```

### Valores recomendados:

| TTL | Uso recomendado | Requests/hora* |
|-----|----------------|----------------|
| 1 min | Desarrollo/Testing | ~60 |
| 5 min | **Producción (default)** | ~12 |
| 10 min | Datos estables | ~6 |
| 30 min | Máximo ahorro | ~2 |

*Suponiendo navegación activa constante entre páginas

## Invalidación de caché

La caché se invalida automáticamente cuando:
- ✅ Se actualiza una mastery (en página Mastery)
- ✅ Expira el TTL configurado
- ✅ Se refresca la página (caché en memoria, no localStorage)

## Monitoreo

Abre la consola del navegador para ver logs:
- `🔧 Mastery cache initialized with TTL: ...` - Inicialización
- `✅ Mastery data served from cache` - Hit de caché (ahorro!)
- `🌐 Fetching mastery data from backend...` - Request al backend
- `⏳ Waiting for ongoing mastery request...` - Evitó request duplicado

## Impacto en costos

### Antes (sin caché):
```
Usuario navega: Accounts → Champions → Mastery
Requests: 3 (una por cada página)
```

### Ahora (con caché, TTL 5 min):
```
Usuario navega: Accounts → Champions → Mastery
Requests: 1 (solo la primera página, resto usa caché)
Ahorro: ~66% en requests
```

### Ejemplo real:
- 100 usuarios navegando activamente durante 1 hora
- Antes: ~300 requests/hora
- Ahora: ~100 requests/hora (con TTL 5 min)
- **Ahorro: ~200 requests/hora** 💰

