import React, { useState } from 'react';
import styles from './Adoption.module.scss';

interface EggOption {
    id: string;
    name: string;
    description: string;
    imageSrc: string;
    rarity: string;
}

const eggOptions: EggOption[] = [
    {
        id: 'dragon-egg',
        name: 'Dragon Egg',
        description: 'A mysterious egg with ancient draconic energy',
        imageSrc: '/images/eggs/1.png',
        rarity: 'Legendary'
    },
    {
        id: 'phoenix-egg',
        name: 'Phoenix Egg',
        description: 'A warm egg that pulses with fiery life',
        imageSrc: '/images/eggs/2.png',
        rarity: 'Epic'
    },
    {
        id: 'void-egg',
        name: 'Void Egg',
        description: 'A dark egg from the depths of the void',
        imageSrc: '/images/eggs/3.png',
        rarity: 'Mythic'
    },
    {
        id: 'celestial-egg',
        name: 'Celestial Egg',
        description: 'A radiant egg blessed by the stars above',
        imageSrc: '/images/eggs/4.png',
        rarity: 'Divine'
    }
];

const Adoption: React.FC = () => {
    const [selectedEgg, setSelectedEgg] = useState<string | null>(null);
    const [hoveredEgg, setHoveredEgg] = useState<number | null>(null);

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
            const selectedOption = eggOptions.find(egg => egg.id === selectedEgg);
            alert(`You've adopted the ${selectedOption?.name}! Welcome to your adventure!`);
            // Here you would typically navigate to the main app or save the selection
        }
    };

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
                            className={`${styles.gem__image} ${hoveredEgg !== null ? styles.active : ''}`}
                            src={hoveredEgg !== null ? `/images/gems/gem-pet-${hoveredEgg + 1}.png` : "/images/gems/gem-inactive.png"}
                            alt="Gem"
                            style={{
                                opacity: hoveredEgg !== null ? 1 : 0.7
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
                    {selectedEgg ? 'Adopt Pet' : 'Select a Pet to Adopt'}
                </button>
            </div>
        </div>
    );
};

export default Adoption; 