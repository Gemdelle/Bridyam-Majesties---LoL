import { fetchMasteryData, type MasteryData } from './apiMasteriesService';
import { CACHE_CONFIG } from '../config/cacheConfig';

/**
 * Servicio de caché centralizado para datos de masteries
 * Evita múltiples requests al backend desde diferentes páginas (Accounts, Champions, Mastery)
 */
class MasteryCacheService {
    private static instance: MasteryCacheService;
    private cache: MasteryData[] | null = null;
    private cacheTimestamp: number | null = null;
    private cachePromise: Promise<MasteryData[]> | null = null;
    
    // TTL (Time To Live) de la caché en milisegundos
    // Configurado desde cacheConfig.ts
    private cacheTTL: number = CACHE_CONFIG.MASTERY_CACHE_TTL;

    private constructor() {
        console.log(`🔧 Mastery cache initialized with TTL: ${this.cacheTTL}ms (${this.cacheTTL / 1000 / 60} minutes)`);
    }

    public static getInstance(): MasteryCacheService {
        if (!MasteryCacheService.instance) {
            MasteryCacheService.instance = new MasteryCacheService();
        }
        return MasteryCacheService.instance;
    }

    /**
     * Configura el TTL (Time To Live) de la caché
     * @param milliseconds - Tiempo en milisegundos (ej: 5 * 60 * 1000 = 5 minutos)
     */
    public setCacheTTL(milliseconds: number): void {
        this.cacheTTL = milliseconds;
        console.log(`Mastery cache TTL set to ${milliseconds}ms (${milliseconds / 1000 / 60} minutes)`);
    }

    /**
     * Verifica si la caché está válida (no expirada)
     */
    private isCacheValid(): boolean {
        if (!this.cache || !this.cacheTimestamp) {
            return false;
        }
        
        const now = Date.now();
        const cacheAge = now - this.cacheTimestamp;
        const isValid = cacheAge < this.cacheTTL;
        
        if (!isValid) {
            console.log(`Mastery cache expired (age: ${cacheAge}ms, TTL: ${this.cacheTTL}ms)`);
        }
        
        return isValid;
    }

    /**
     * Obtiene los datos de masteries (desde caché o backend)
     * Si múltiples páginas llaman a este método simultáneamente,
     * solo se hará UNA request al backend
     */
    public async getMasteries(): Promise<MasteryData[]> {
        // Si la caché es válida, retornarla inmediatamente
        if (this.isCacheValid() && this.cache) {
            console.log('✅ Mastery data served from cache (no backend request)');
            return Promise.resolve(this.cache);
        }

        // Si ya hay una request en proceso, esperar a que termine
        // Esto evita múltiples requests simultáneos
        if (this.cachePromise) {
            console.log('⏳ Waiting for ongoing mastery request...');
            return this.cachePromise;
        }

        // Hacer la request al backend
        console.log('🌐 Fetching mastery data from backend...');
        this.cachePromise = fetchMasteryData()
            .then(data => {
                this.cache = data;
                this.cacheTimestamp = Date.now();
                this.cachePromise = null;
                console.log(`✅ Mastery cache updated (${data.length} entries)`);
                return data;
            })
            .catch(error => {
                this.cachePromise = null;
                console.error('❌ Error fetching mastery data:', error);
                throw error;
            });

        return this.cachePromise;
    }

    /**
     * Invalida la caché manualmente
     * Útil cuando se actualiza una mastery y quieres forzar un refresh
     */
    public invalidateCache(): void {
        console.log('🗑️ Mastery cache invalidated');
        this.cache = null;
        this.cacheTimestamp = null;
        this.cachePromise = null;
    }

    /**
     * Obtiene información sobre el estado de la caché
     */
    public getCacheInfo(): {
        isValid: boolean;
        size: number;
        age: number | null;
        ttl: number;
    } {
        const now = Date.now();
        return {
            isValid: this.isCacheValid(),
            size: this.cache?.length || 0,
            age: this.cacheTimestamp ? now - this.cacheTimestamp : null,
            ttl: this.cacheTTL
        };
    }

    /**
     * Obtiene el tiempo restante hasta el próximo refresh (en milisegundos)
     * Retorna null si la caché está vacía o expirada
     */
    public getTimeUntilRefresh(): number | null {
        if (!this.cache || !this.cacheTimestamp) {
            return null;
        }

        const now = Date.now();
        const cacheAge = now - this.cacheTimestamp;
        const timeRemaining = this.cacheTTL - cacheAge;

        // Si ya expiró, retornar 0
        return timeRemaining > 0 ? timeRemaining : 0;
    }

    /**
     * Formatea el tiempo restante en un string legible
     * Ej: "2h 30m", "45m", "5m"
     */
    public getFormattedTimeUntilRefresh(): string | null {
        const timeRemaining = this.getTimeUntilRefresh();
        
        if (timeRemaining === null) {
            return null;
        }

        if (timeRemaining === 0) {
            return 'Updating...';
        }

        const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
        const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${seconds}s`;
        }
    }
}

// Exportar la instancia única
export const masteryCacheService = MasteryCacheService.getInstance();

