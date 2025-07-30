import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchPets, type Pet } from '../services/petsService';

interface LegacyPet {
  id: string;
  name: string;
  imageSrc: string;
  rarity: string;
  petName?: string;
  petNumber?: number;
}

interface PetContextType {
  selectedPet: LegacyPet | null;
  setSelectedPet: (pet: LegacyPet | null) => void;
  pets: Pet[];
  loading: boolean;
  error: string | null;
  refreshPets: () => Promise<void>;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export const usePetContext = () => {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error('usePetContext must be used within a PetProvider');
  }
  return context;
};

interface PetProviderProps {
  children: ReactNode;
}

export const PetProvider: React.FC<PetProviderProps> = ({ children }) => {
  const [selectedPet, setSelectedPet] = useState<LegacyPet | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPetsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const petsData = await fetchPets();
      setPets(petsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pets');
      console.error('Error fetching pets:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshPets = async () => {
    await fetchPetsData();
  };

  // Fetch pets on component mount
  useEffect(() => {
    fetchPetsData();
  }, []);

  return (
    <PetContext.Provider value={{ 
      selectedPet, 
      setSelectedPet, 
      pets, 
      loading, 
      error, 
      refreshPets 
    }}>
      {children}
    </PetContext.Provider>
  );
}; 