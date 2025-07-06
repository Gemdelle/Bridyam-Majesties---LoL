import portraitsData from '../../public/data/portraits.json';

// Interface for the portrait data structure
export interface Portrait {
    id: number;
    name: string;
    username: string;
    bloodline: string;
    url: string;
    champions: number;
    skins: number;
    masteries: number;
    elo: number;
    level: number;
    icon: string;
    "elo-soloq": string;
    "elo-flex": string;
    "level-soloq": string;
    "level-flex": string;
    honor: string;
    roles: {
        top: number;
        jungle: number;
        mid: number;
        adc: number;
        support: number;
    };
    blueEssence: number;
    orangeEssence: number;
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate fetching all portraits
export const fetchPortraits = async (): Promise<Portrait[]> => {
    // Simulate network delay
    await delay(800);

    // Simulate random API errors (5% chance)
    if (Math.random() < 0.05) {
        throw new Error('Failed to fetch portraits data');
    }

    return portraitsData as Portrait[];
};

// Simulate fetching a single portrait by ID
export const fetchPortraitById = async (id: number): Promise<Portrait | null> => {
    // Simulate network delay
    await delay(500);

    // Simulate random API errors (3% chance)
    if (Math.random() < 0.03) {
        throw new Error('Failed to fetch portrait data');
    }

    const portrait = portraitsData.find(p => p.id === id);
    return portrait as Portrait || null;
};

// Simulate fetching portraits by bloodline
export const fetchPortraitsByBloodline = async (bloodline: string): Promise<Portrait[]> => {
    // Simulate network delay
    await delay(600);

    // Simulate random API errors (4% chance)
    if (Math.random() < 0.04) {
        throw new Error('Failed to fetch portraits by bloodline');
    }

    return portraitsData.filter(p => p.bloodline === bloodline) as Portrait[];
};

// Simulate searching portraits by name
export const searchPortraits = async (query: string): Promise<Portrait[]> => {
    // Simulate network delay
    await delay(400);

    // Simulate random API errors (2% chance)
    if (Math.random() < 0.02) {
        throw new Error('Failed to search portraits');
    }

    const filtered = portraitsData.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
    );

    return filtered as Portrait[];
}; 