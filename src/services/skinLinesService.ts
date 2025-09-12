export interface SkinLine {
    id: number;
    name: string;
    splashart: string;
    description?: string;
}

// Mock data for skin lines - you can replace this with real API data later
const skinLinesData: SkinLine[] = [
    {
        id: 1,
        name: "PROJECT",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/PROJECT_1.jpg",
        description: "Futuristic cyberpunk skin line"
    },
    {
        id: 2,
        name: "STAR GUARDIAN",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/STAR_GUARDIAN_1.jpg",
        description: "Magical girl skin line"
    },
    {
        id: 3,
        name: "K/DA",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/KDA_1.jpg",
        description: "K-pop inspired skin line"
    },
    {
        id: 4,
        name: "DARK STAR",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/DARK_STAR_1.jpg",
        description: "Cosmic horror skin line"
    },
    {
        id: 5,
        name: "BLOOD MOON",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/BLOOD_MOON_1.jpg",
        description: "Japanese folklore skin line"
    },
    {
        id: 6,
        name: "HIGH NOON",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/HIGH_NOON_1.jpg",
        description: "Wild West skin line"
    },
    {
        id: 7,
        name: "PENTAKILL",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/PENTAKILL_1.jpg",
        description: "Heavy metal skin line"
    },
    {
        id: 8,
        name: "ARCADE",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/ARCADE_1.jpg",
        description: "Retro gaming skin line"
    },
    {
        id: 9,
        name: "PULSEFIRE",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/PULSEFIRE_1.jpg",
        description: "Futuristic tech skin line"
    },
    {
        id: 10,
        name: "WORLD BREAKER",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/WORLD_BREAKER_1.jpg",
        description: "Post-apocalyptic skin line"
    },
    {
        id: 11,
        name: "COSMIC",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/COSMIC_1.jpg",
        description: "Space-themed skin line"
    },
    {
        id: 12,
        name: "INVASION",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/INVASION_1.jpg",
        description: "Alien invasion skin line"
    },
    {
        id: 13,
        name: "ODDYSEY",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/ODDYSEY_1.jpg",
        description: "Space adventure skin line"
    },
    {
        id: 14,
        name: "BATTLE ACADEMIA",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/BATTLE_ACADEMIA_1.jpg",
        description: "Anime school skin line"
    },
    {
        id: 15,
        name: "SPIRIT BLOSSOM",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/SPIRIT_BLOSSOM_1.jpg",
        description: "Japanese mythology skin line"
    },
    {
        id: 16,
        name: "CRIME CITY",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/CRIME_CITY_1.jpg",
        description: "Noir detective skin line"
    },
    {
        id: 17,
        name: "DEBONAIR",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/DEBONAIR_1.jpg",
        description: "Elegant gentleman skin line"
    },
    {
        id: 18,
        name: "FROSTBLADE",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/FROSTBLADE_1.jpg",
        description: "Ice-themed skin line"
    },
    {
        id: 19,
        name: "HEXPLOSIVE",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/HEXPLOSIVE_1.jpg",
        description: "Explosive magic skin line"
    },
    {
        id: 20,
        name: "INFERNAL",
        splashart: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/INFERNAL_1.jpg",
        description: "Fire and demon skin line"
    }
];

export const fetchSkinLines = async (): Promise<SkinLine[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return skinLinesData;
};

export const getSkinLineById = (id: number): SkinLine | undefined => {
    return skinLinesData.find(skinLine => skinLine.id === id);
};

export const searchSkinLines = (searchTerm: string): SkinLine[] => {
    if (!searchTerm) return skinLinesData;

    return skinLinesData.filter(skinLine =>
        skinLine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (skinLine.description && skinLine.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
};
