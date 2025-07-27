import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface Pet {
  id: string;
  name: string;
  imageSrc: string;
  rarity: string;
  petName?: string;
  petNumber?: number;
}

interface PetContextType {
  selectedPet: Pet | null;
  setSelectedPet: (pet: Pet | null) => void;
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
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  return (
    <PetContext.Provider value={{ selectedPet, setSelectedPet }}>
      {children}
    </PetContext.Provider>
  );
}; 