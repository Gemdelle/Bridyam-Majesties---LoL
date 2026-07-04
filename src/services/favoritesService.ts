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
let favoritesLoadedFromFile = false;

/**
 * LOCAL MODE: Load all essencer favorites from JSON file first, then localStorage as backup
 */
export const loadAllEssencerFavorites = (): EssencerFavorites => {
  if (essencerFavoritesCache) return essencerFavoritesCache;
  
  // Try localStorage first (has latest local changes)
  const stored = localStorage.getItem('essencer-favorites');
  if (stored) {
    essencerFavoritesCache = JSON.parse(stored);
    return essencerFavoritesCache || {};
  }
  
  // Default empty - will be loaded async from file
  essencerFavoritesCache = {};
  return essencerFavoritesCache;
};

/**
 * Load favorites from the JSON file (async)
 */
export const loadFavoritesFromFile = async (): Promise<EssencerFavorites> => {
  if (favoritesLoadedFromFile && essencerFavoritesCache) {
    return essencerFavoritesCache;
  }
  
  try {
    const response = await fetch(`/data/essencer-favorites.json?t=${Date.now()}`, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      essencerFavoritesCache = data;
      // Sync to localStorage
      localStorage.setItem('essencer-favorites', JSON.stringify(data));
      favoritesLoadedFromFile = true;
      return data;
    }
  } catch (error) {
    console.error('Error loading favorites from file:', error);
  }
  
  // Fallback to localStorage or empty
  const stored = localStorage.getItem('essencer-favorites');
  if (stored) {
    essencerFavoritesCache = JSON.parse(stored);
    return essencerFavoritesCache || {};
  }
  
  return {};
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
 * Also logs the JSON so you can copy it to the file
 */
export const saveEssencerFavorites = (essencerName: string, favoriteIds: number[]): void => {
  const allFavorites = loadAllEssencerFavorites();
  allFavorites[essencerName] = favoriteIds;
  essencerFavoritesCache = allFavorites;
  localStorage.setItem('essencer-favorites', JSON.stringify(allFavorites));

  // Save to JSON file via Vite dev server
  fetch('/api/save-favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(allFavorites)
  })
    .then(res => {
      if (res.ok) {
        console.log('%c✅ Favorites saved to JSON file!', 'color: #90EE90; font-weight: bold;');
      } else {
        console.log('%c⚠️ Could not save to file (dev server only)', 'color: #FFA500;');
      }
    })
    .catch(() => {
      console.log('%c⚠️ Could not save to file (dev server only)', 'color: #FFA500;');
    });
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

/**
 * Export all essencer favorites as a downloadable JSON file
 */
export const exportFavoritesToFile = (): void => {
  const allFavorites = loadAllEssencerFavorites();
  const dataStr = JSON.stringify(allFavorites, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'essencer-favorites.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import essencer favorites from a JSON object (for loading from file)
 */
export const importFavoritesFromData = (data: EssencerFavorites): void => {
  essencerFavoritesCache = data;
  localStorage.setItem('essencer-favorites', JSON.stringify(data));
};

