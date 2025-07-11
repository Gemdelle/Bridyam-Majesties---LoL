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
        imageSrc: '/src/assets/images/lol-elements/blue-essence.webp',
        rarity: 'Legendary'
    },
    {
        id: 'phoenix-egg',
        name: 'Phoenix Egg',
        description: 'A warm egg that pulses with fiery life',
        imageSrc: '/src/assets/images/lol-elements/orange-essence.webp',
        rarity: 'Epic'
    },
    {
        id: 'void-egg',
        name: 'Void Egg',
        description: 'A dark egg from the depths of the void',
        imageSrc: '/src/assets/images/lol-elements/tier-diamond.webp',
        rarity: 'Mythic'
    },
    {
        id: 'celestial-egg',
        name: 'Celestial Egg',
        description: 'A radiant egg blessed by the stars above',
        imageSrc: '/src/assets/images/lol-elements/tier-challenger.webp',
        rarity: 'Divine'
    }
];

const Adoption: React.FC = () => {
    const [selectedEgg, setSelectedEgg] = useState<string | null>(null);

    const handleEggSelect = (eggId: string) => {
        setSelectedEgg(eggId);
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
                    <div className={styles.egg__cards}>
                        {eggOptions.map((egg) => (
                            <div
                                key={egg.id}
                                className={`${styles.egg__card} ${selectedEgg === egg.id ? styles.selected : ''}`}
                                onClick={() => handleEggSelect(egg.id)}
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
                                        <p className={styles.egg__rarity}>{egg.rarity}</p>
                                        <p className={styles.egg__description}>{egg.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedEgg && (
                        <button
                            className={styles.confirm__button}
                            onClick={handleConfirmSelection}
                        >
                            Confirm Selection
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Adoption; 