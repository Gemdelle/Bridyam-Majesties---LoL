import React, { useState } from 'react';
import { usePetContext } from '../../contexts/PetContext';
import { tutorialService } from '../../services/tutorialService';
import { claimPet, type Pet } from '../../services/petsService';
import styles from './Adoption.module.scss';
import NameYourPet from './NameYourPet';

interface EggOption {
    id: string;
    name: string;
    description: string;
    imageSrc: string;
    rarity: string;
}

// Fallback egg options in case API fails
const fallbackEggOptions: EggOption[] = [
    {
        id: 'flarnit-egg',
        name: 'Flarnit',
        description: 'Strong-willed and fierce, thrives on challenge and protects what it trusts.',
        imageSrc: '/images/eggs/1.png',
        rarity: 'Legendary'
    },
    {
        id: 'petlewyn-egg',
        name: 'Petlewyn',
        description: 'Elegant and quiet, but surprisingly dangerous when pushed.',
        imageSrc: '/images/eggs/2.png',
        rarity: 'Epic'
    },
    {
        id: 'peewee-egg',
        name: 'Peewee',
        description: 'Calm and watchful, with a powerful sense of justice.',
        imageSrc: '/images/eggs/3.png',
        rarity: 'Mythic'
    },
    {
        id: 'vindeloon-egg',
        name: 'Vindeloon',
        description: 'Thoughtful and focused, never forgets what matters.',
        imageSrc: '/images/eggs/4.png',
        rarity: 'Divine'
    }
];

const Adoption: React.FC = () => {
    const [selectedEgg, setSelectedEgg] = useState<string | null>(null);
    const [hoveredEgg, setHoveredEgg] = useState<number | null>(null);
    const [currentScreen, setCurrentScreen] = useState<'adoption' | 'name'>('adoption');
    const { setSelectedPet, pets, loading, error } = usePetContext();

    // Map egg index to pet names (1-based index)
    const petNameMap: { [key: number]: string } = {
        1: 'Flarnit',
        2: 'Pettlewyn', 
        3: 'Peewee',
        4: 'Vindeloon'
    };

    // Convert pets from API to egg options format
    const eggOptions: EggOption[] = pets.length > 0 ? pets.map((pet, index) => ({
        id: pet.id,
        name: pet.name,
        description: pet.description,
        imageSrc: `/images/eggs/${index + 1}.png`,
        rarity: getRarityByType(pet.type)
    })) : fallbackEggOptions;

    function getRarityByType(type: string): string {
        switch (type) {
            case 'fighter': return 'Legendary';
            case 'venom': return 'Epic';
            case 'water': return 'Mythic';
            case 'psychic': return 'Divine';
            default: return 'Rare';
        }
    }

    const handleEggSelect = (eggId: string) => {
        setSelectedEgg(eggId);
    };

    const handleEggHover = (index: number) => {
        setHoveredEgg(index);
    };

    const handleEggLeave = () => {
        setHoveredEgg(null);
    };

    const handleConfirmSelection = () => {
        if (selectedEgg) {
            setCurrentScreen('name');
        }
    };

    const handlePetNamed = async (petName: string) => {
        if (!selectedEgg) return;
        
        try {
            let selectedPet: Pet | undefined;
            let petIndex: number = -1;
            
            // Check if we're using API data or fallback data
            if (pets.length > 0) {
                // Using API data
                selectedPet = pets.find(pet => pet.id === selectedEgg);
                petIndex = pets.findIndex(pet => pet.id === selectedEgg);
            } else {
                // Using fallback data - map fallback egg ID to pet data
                const fallbackPetMap: { [key: string]: { pet: Pet, index: number } } = {
                    'flarnit-egg': {
                        pet: {
                            id: 'flarnit',
                            name: 'Flarnit',
                            type: 'fighter',
                            lore: 'Strong-willed and fierce, thrives on challenge and protects what it trusts.',
                            description: 'Strong-willed and fierce, thrives on challenge and protects what it trusts.',
                            stats: { force: 8, instinct: 6, pressure: 7, cleverness: 5 },
                            matchups: { weak_against: 'psychic', strong_against: 'venom' },
                            abilities: []
                        },
                        index: 0
                    },
                    'petlewyn-egg': {
                        pet: {
                            id: 'petlewyn',
                            name: 'Pettlewyn',
                            type: 'venom',
                            lore: 'Elegant and quiet, but surprisingly dangerous when pushed.',
                            description: 'Elegant and quiet, but surprisingly dangerous when pushed.',
                            stats: { force: 6, instinct: 8, pressure: 5, cleverness: 7 },
                            matchups: { weak_against: 'water', strong_against: 'psychic' },
                            abilities: []
                        },
                        index: 1
                    },
                    'peewee-egg': {
                        pet: {
                            id: 'peewee',
                            name: 'Peewee',
                            type: 'water',
                            lore: 'Calm and watchful, with a powerful sense of justice.',
                            description: 'Calm and watchful, with a powerful sense of justice.',
                            stats: { force: 5, instinct: 7, pressure: 8, cleverness: 6 },
                            matchups: { weak_against: 'fighter', strong_against: 'venom' },
                            abilities: []
                        },
                        index: 2
                    },
                    'vindeloon-egg': {
                        pet: {
                            id: 'vindeloon',
                            name: 'Vindeloon',
                            type: 'psychic',
                            lore: 'Thoughtful and focused, never forgets what matters.',
                            description: 'Thoughtful and focused, never forgets what matters.',
                            stats: { force: 4, instinct: 9, pressure: 6, cleverness: 8 },
                            matchups: { weak_against: 'venom', strong_against: 'fighter' },
                            abilities: []
                        },
                        index: 3
                    }
                };
                
                const fallbackData = fallbackPetMap[selectedEgg];
                if (fallbackData) {
                    selectedPet = fallbackData.pet;
                    petIndex = fallbackData.index;
                }
            }
            
            if (!selectedPet) {
                throw new Error('Selected pet not found');
            }

            // Claim the pet via API
            const claimResponse = await claimPet(selectedEgg, petName);
            
            if (!claimResponse.success) {
                throw new Error(claimResponse.message || 'Failed to claim pet');
            }

            // Use the pet index we already calculated
            const petImageSrc = `/images/pets/pet-${petIndex + 1}-1.png`;
            
            const petData = {
                id: selectedEgg,
                name: selectedPet.name,
                imageSrc: petImageSrc, // Use pet image instead of egg image
                rarity: getRarityByType(selectedPet.type),
                petName: petName,
                petNumber: petIndex + 1 // Add the pet number (1-4)
            };
            
            // Save the selected pet to context
            setSelectedPet(petData);
            
            // Save the selected pet to localStorage for tutorial
            tutorialService.saveSelectedPet(petData);
            console.log('Pet saved to localStorage:', petData);
            console.log('Tutorial state after saving pet:', tutorialService.getTutorialState());
            
            alert(`Congratulations! You've successfully adopted ${petName}, the ${selectedPet.name}! Welcome to your adventure!`);
            
        } catch (error) {
            console.error('Error claiming pet:', error);
            alert(`Error claiming pet: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className={styles.adoption}>
                <div className={styles.adoption__container}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '50vh',
                        color: '#c89b3c',
                        fontSize: '1.2rem'
                    }}>
                        Loading pets...
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className={styles.adoption}>
                <div className={styles.adoption__container}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '50vh',
                        color: '#c89b3c',
                        fontSize: '1.2rem',
                        textAlign: 'center'
                    }}>
                        <p>Error loading pets: {error}</p>
                        <p style={{ fontSize: '1rem', marginTop: '1rem' }}>
                            Using fallback data...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (currentScreen === 'name' && selectedEgg) {
        const selectedOption = eggOptions.find(egg => egg.id === selectedEgg);
        const eggIndex = eggOptions.findIndex(egg => egg.id === selectedEgg);
        return (
            <NameYourPet
                selectedEgg={selectedOption!}
                onPetNamed={handlePetNamed}
                eggIndex={eggIndex}
            />
        );
    }

    return (
        <div className={styles.adoption}>
            <div className={styles.adoption__container}>
                <header className={styles.adoption__header}>
                    <h1 className={styles.adoption__title}>Choose Your Pet</h1>
                    <p className={styles.adoption__subtitle}>Select an egg to begin your journey</p>
                </header>

                <div className={styles.adoption__content}>
                    <div className={styles.gem__container}>
                        <img
                            className={`${styles.gem__image} ${hoveredEgg !== null || selectedEgg ? styles.active : ''}`}
                            src={hoveredEgg !== null ? `/images/gems/gem-pet-${hoveredEgg + 1}.png` : selectedEgg ? `/images/gems/gem-pet-${eggOptions.findIndex(egg => egg.id === selectedEgg) + 1}.png` : "/images/gems/gem-inactive.png"}
                            alt="Gem"
                            style={{
                                opacity: hoveredEgg !== null || selectedEgg ? 1 : 0.7
                            }}
                        />
                        <img className={styles.gem__base__image} src="/images/gems/gem-base.png" alt="Gem base" />
                    </div>
                    <div className={styles.egg__cards}>
                        {eggOptions.map((egg, index) => (
                            <div
                                key={egg.id}
                                className={`${styles.egg__card} ${selectedEgg === egg.id ? styles.selected : ''}`}
                                style={{
                                    backgroundImage: `url('/images/statues/statue-pet-${index + 1}.png')`
                                }}
                                onClick={() => handleEggSelect(egg.id)}
                                onMouseEnter={() => handleEggHover(index)}
                                onMouseLeave={handleEggLeave}
                            >
                                <div className={styles.card__glow}></div>
                                <div className={styles.card__content}>
                                    <div className={styles.egg__image}>
                                        <div className={styles.spinning__circle}></div>
                                        <div className={styles.egg__badge}>
                                            <img src={egg.imageSrc} alt={egg.name} />
                                        </div>
                                    </div>
                                    <div className={styles.egg__info}>
                                        <h3 className={styles.egg__name}>{egg.name}</h3>
                                        <p className={styles.egg__description}>{egg.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    className={styles.adopt__button}
                    onClick={handleConfirmSelection}
                    disabled={!selectedEgg}
                >
                    Adopt
                </button>
            </div>
        </div>
    );
};

export default Adoption; 