import React, { useState } from 'react';
import styles from './Adoption.module.scss';
import NameYourPet from './NameYourPet';

interface EggOption {
    id: string;
    name: string;
    description: string;
    imageSrc: string;
    rarity: string;
}

const eggOptions: EggOption[] = [
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

    const handlePetNamed = (petName: string) => {
        const selectedOption = eggOptions.find(egg => egg.id === selectedEgg);
        alert(`Congratulations! You've adopted ${petName}, the ${selectedOption?.name}! Welcome to your adventure!`);
        // Here you would typically navigate to the main app or save the selection
    };

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