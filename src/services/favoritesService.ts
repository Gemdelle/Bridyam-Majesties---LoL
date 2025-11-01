// API configuration
const API_BASE_URL = 'https://bridyam-majesties-back-production.up.railway.app';

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

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Fetches favorite champions from the API
 * @param userId - The user ID
 * @returns Promise<number[]> - Array of favorite champion IDs
 */
export const getFavorites = async (userId: string): Promise<number[]> => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If 404, return empty array (user has no favorites yet)
      if (response.status === 404) {
        return [];
      }
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data: FavoritesResponse = await response.json();

    if (!data.success || !Array.isArray(data.favorites)) {
      console.error('Invalid response format:', data);
      return [];
    }

    return data.favorites;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    // Return empty array on error, fallback to localStorage
    return [];
  }
};

/**
 * Saves favorite champions to the API
 * @param userId - The user ID
 * @param favoriteIds - Array of favorite champion IDs
 * @returns Promise<boolean> - Success status
 */
export const saveFavorites = async (userId: string, favoriteIds: number[]): Promise<boolean> => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ favorites: favoriteIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return data.success !== false;
  } catch (error) {
    console.error('Error saving favorites:', error);
    return false;
  }
};

