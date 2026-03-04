// LOCAL MODE: Uses localStorage for essencer favorites

// Types
export interface FavoritesResponse {
  success: boolean;
  favorites: number[];
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

// Essencer favorites type
export type EssencerFavorites = Record<string, number[]>;

// Cache for essencer favorites
let essencerFavoritesCache: EssencerFavorites | null = null;

/**
 * LOCAL MODE: Load all essencer favorites from localStorage
 */
export const loadAllEssencerFavorites = (): EssencerFavorites => {
  if (essencerFavoritesCache) return essencerFavoritesCache;
  
  const stored = localStorage.getItem('essencer-favorites');
  if (stored) {
    essencerFavoritesCache = JSON.parse(stored);
    return essencerFavoritesCache || {};
  }
  
  // Default empty favorites for known essencers
  essencerFavoritesCache = {
    "peraltadoctor": [],
    "Gemy": [],
    "jony_lu": [],
    "Matutte": [],
    "Enzyto": [],
    "Zoro": [],
    "AegonLucifer": [],
    "AmNightmare": []
  };
  localStorage.setItem('essencer-favorites', JSON.stringify(essencerFavoritesCache));
  return essencerFavoritesCache;
};

/**
 * LOCAL MODE: Get favorites for a specific essencer
 */
export const getEssencerFavorites = (essencerName: string): number[] => {
  const allFavorites = loadAllEssencerFavorites();
  return allFavorites[essencerName] || [];
};

/**
 * LOCAL MODE: Save favorites for a specific essencer
 */
export const saveEssencerFavorites = (essencerName: string, favoriteIds: number[]): void => {
  const allFavorites = loadAllEssencerFavorites();
  allFavorites[essencerName] = favoriteIds;
  essencerFavoritesCache = allFavorites;
  localStorage.setItem('essencer-favorites', JSON.stringify(allFavorites));
};

/**
 * LOCAL MODE: Get list of all essencers
 */
export const getEssencerList = async (): Promise<string[]> => {
  try {
    const response = await fetch('/data/essencers.json');
    if (response.ok) {
      const data = await response.json();
      return Object.keys(data.essencers || {});
    }
  } catch (error) {
    console.error('Error loading essencers:', error);
  }
  return ['peraltadoctor', 'Gemy', 'jony_lu', 'Matutte', 'Enzyto', 'Zoro', 'AegonLucifer', 'AmNightmare'];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getFavorites = async (userId: string): Promise<number[]> => {
  // LOCAL MODE: Return from localStorage
  const saved = localStorage.getItem('favoriteChampions');
  return saved ? JSON.parse(saved) : [];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const saveFavorites = async (userId: string, favoriteIds: number[]): Promise<boolean> => {
  // LOCAL MODE: Save to localStorage
  localStorage.setItem('favoriteChampions', JSON.stringify(favoriteIds));
  return true;
};

