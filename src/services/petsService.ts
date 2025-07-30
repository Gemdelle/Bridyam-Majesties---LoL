// Pet data structure based on the API response
export interface PetAbility {
    name: string;
    type: 'defensive' | 'offensive' | 'ultimate';
    description: string;
}

export interface PetStats {
    force: number;
    instinct: number;
    pressure: number;
    cleverness: number;
}

export interface PetMatchups {
    weak_against: string;
    strong_against: string;
}

export interface Pet {
    id: string;
    name: string;
    type: 'fighter' | 'venom' | 'water' | 'psychic';
    lore: string;
    description: string;
    stats: PetStats;
    matchups: PetMatchups;
    abilities: PetAbility[];
}

export interface PetsResponse {
    pets: Pet[];
}

export interface ClaimPetRequest {
    petId: string;
    name: string;
}

export interface ClaimPetResponse {
    success: boolean;
    message?: string;
    pet?: Pet;
}

import { authService } from './authService';

// API configuration
const API_BASE_URL = 'https://bridyam-majesties-back-production.up.railway.app';

/**
 * Fetches all pets from the API
 * @returns Promise<Pet[]> - Array of all pets
 */
export const fetchPets = async (): Promise<Pet[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/pets`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PetsResponse = await response.json();
        return data.pets;
    } catch (error) {
        console.error('Error fetching pets:', error);
        throw error;
    }
};

/**
 * Fetches a specific pet by ID
 * @param id - The pet ID
 * @returns Promise<Pet | null> - The pet or null if not found
 */
export const fetchPetById = async (id: string): Promise<Pet | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pet: Pet = await response.json();
        return pet;
    } catch (error) {
        console.error(`Error fetching pet with ID ${id}:`, error);
        throw error;
    }
};

/**
 * Claims a pet with a given name
 * @param petId - The pet ID to claim
 * @param name - The name for the pet
 * @returns Promise<ClaimPetResponse> - The claim response
 */
export const claimPet = async (petId: string, name: string): Promise<ClaimPetResponse> => {
    try {
        const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/pets/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                petId,
                name
            } as ClaimPetRequest),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data: ClaimPetResponse = await response.json();
        return data;
    } catch (error) {
        console.error(`Error claiming pet ${petId} with name ${name}:`, error);
        throw error;
    }
};

/**
 * Gets a pet by ID from a local array (useful for filtering from already fetched pets)
 * @param pets - Array of pets to search in
 * @param id - The pet ID to find
 * @returns Pet | undefined - The pet or undefined if not found
 */
export const getPetById = (pets: Pet[], id: string): Pet | undefined => {
    return pets.find(pet => pet.id === id);
};

/**
 * Gets pets by type
 * @param pets - Array of pets to filter
 * @param type - The pet type to filter by
 * @returns Pet[] - Array of pets of the specified type
 */
export const getPetsByType = (pets: Pet[], type: Pet['type']): Pet[] => {
    return pets.filter(pet => pet.type === type);
};

/**
 * Gets the strongest pet based on total stats
 * @param pets - Array of pets to compare
 * @returns Pet | undefined - The pet with highest total stats
 */
export const getStrongestPet = (pets: Pet[]): Pet | undefined => {
    if (pets.length === 0) return undefined;
    
    return pets.reduce((strongest, current) => {
        const strongestTotal = Object.values(strongest.stats).reduce((sum, stat) => sum + stat, 0);
        const currentTotal = Object.values(current.stats).reduce((sum, stat) => sum + stat, 0);
        return currentTotal > strongestTotal ? current : strongest;
    });
};

/**
 * Gets pets sorted by a specific stat
 * @param pets - Array of pets to sort
 * @param stat - The stat to sort by
 * @param order - Sort order ('asc' or 'desc')
 * @returns Pet[] - Sorted array of pets
 */
export const getPetsSortedByStat = (
    pets: Pet[], 
    stat: keyof PetStats, 
    order: 'asc' | 'desc' = 'desc'
): Pet[] => {
    return [...pets].sort((a, b) => {
        const aValue = a.stats[stat];
        const bValue = b.stats[stat];
        return order === 'desc' ? bValue - aValue : aValue - bValue;
    });
}; 