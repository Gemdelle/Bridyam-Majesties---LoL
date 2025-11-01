/**
 * Configuración de caché para la aplicación
 * 
 * Ajusta el TTL (Time To Live) de la caché de masteries según tus necesidades:
 * - Menor TTL = Datos más frescos pero más requests al backend (más costoso)
 * - Mayor TTL = Menos requests al backend (más barato) pero datos pueden estar desactualizados
 * 
 * Ejemplos de valores:
 * - 1 minuto: 1 * 60 * 1000 = 60000
 * - 5 minutos: 5 * 60 * 1000 = 300000 (default)
 * - 10 minutos: 10 * 60 * 1000 = 600000
 * - 30 minutos: 30 * 60 * 1000 = 1800000
 * - 1 hora: 60 * 60 * 1000 = 3600000
 */

export const CACHE_CONFIG = {
    // TTL de la caché de masteries en milisegundos
    // Configurado a 3 horas para máximo ahorro
    MASTERY_CACHE_TTL: 3 * 60 * 60 * 1000, // 3 horas
};

