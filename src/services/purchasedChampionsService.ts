// Service to handle purchased champions for GEM user
// This allows marking champions as "purchased" (mastery 0) without affecting real mastery data

export interface PurchasedChampion {
    rankedId: number;
    championId: number;
    timestamp: number;
}

class PurchasedChampionsService {
    private static instance: PurchasedChampionsService;
    private readonly STORAGE_KEY = 'purchased_champions';
    private readonly GEM_EMAIL = 'gemdelle@bridyam.com';

    private constructor() { }

    public static getInstance(): PurchasedChampionsService {
        if (!PurchasedChampionsService.instance) {
            PurchasedChampionsService.instance = new PurchasedChampionsService();
        }
        return PurchasedChampionsService.instance;
    }

    // Check if current user is GEM
    public isGemUser(): boolean {
        try {
            const userData = localStorage.getItem('user_data');
            if (!userData) return false;

            const user = JSON.parse(userData);
            const email = user.email || '';

            return email.toLowerCase() === this.GEM_EMAIL.toLowerCase();
        } catch (error) {
            console.error('Error checking GEM status:', error);
            return false;
        }
    }

    // Get all purchased champions from localStorage
    private getPurchasedData(): PurchasedChampion[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) {
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading purchased champions:', error);
            return [];
        }
    }

    // Save purchased champions to localStorage
    private savePurchasedData(data: PurchasedChampion[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving purchased champions:', error);
        }
    }

    // Mark champion as purchased
    public markAsPurchased(rankedId: number, championId: number): void {
        if (!this.isGemUser()) {
            console.warn('Only GEM user can mark champions as purchased');
            return;
        }

        const data = this.getPurchasedData();

        // Check if already purchased
        const alreadyPurchased = data.some(
            item => item.rankedId === rankedId && item.championId === championId
        );

        if (!alreadyPurchased) {
            data.push({
                rankedId,
                championId,
                timestamp: Date.now()
            });
            this.savePurchasedData(data);
        }
    }

    // Unmark champion as purchased
    public unmarkAsPurchased(rankedId: number, championId: number): void {
        if (!this.isGemUser()) {
            console.warn('Only GEM user can unmark champions as purchased');
            return;
        }

        const data = this.getPurchasedData();
        const filteredData = data.filter(
            item => !(item.rankedId === rankedId && item.championId === championId)
        );
        this.savePurchasedData(filteredData);
    }

    // Check if champion is marked as purchased
    public isPurchased(rankedId: number, championId: number): boolean {
        if (!this.isGemUser()) {
            return false;
        }

        const data = this.getPurchasedData();
        return data.some(
            item => item.rankedId === rankedId && item.championId === championId
        );
    }

    // Get effective mastery level (0 if purchased, real level otherwise)
    public getEffectiveMasteryLevel(rankedId: number, championId: number, realMasteryLevel: number): number {
        if (this.isPurchased(rankedId, championId)) {
            return 0; // Show as purchased (mastery 0)
        }
        return realMasteryLevel;
    }

    // Get all purchased champions for a specific account
    public getPurchasedForAccount(rankedId: number): PurchasedChampion[] {
        if (!this.isGemUser()) {
            return [];
        }

        const data = this.getPurchasedData();
        return data.filter(item => item.rankedId === rankedId);
    }

    // Clear all purchased champions
    public clearAllPurchased(): void {
        if (!this.isGemUser()) {
            console.warn('Only GEM user can clear purchased champions');
            return;
        }

        this.savePurchasedData([]);
    }

    // Get statistics
    public getStats(): { totalPurchased: number; lastUpdated: string } {
        const data = this.getPurchasedData();
        const lastUpdated = data.length > 0
            ? new Date(Math.max(...data.map(item => item.timestamp))).toLocaleString()
            : 'Never';

        return {
            totalPurchased: data.length,
            lastUpdated
        };
    }
}

// Export singleton instance
export const purchasedChampionsService = PurchasedChampionsService.getInstance();
