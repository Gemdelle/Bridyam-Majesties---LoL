import React, { useState } from 'react';
import styles from './NameYourPet.module.scss';

interface NameYourPetProps {
    selectedEgg: {
        id: string;
        name: string;
        description: string;
        imageSrc: string;
        rarity: string;
    };
    onPetNamed: (petName: string) => void;
    eggIndex: number;
}

const NameYourPet: React.FC<NameYourPetProps> = ({ selectedEgg, onPetNamed, eggIndex }) => {
    const [petName, setPetName] = useState('');
    const [clickCount, setClickCount] = useState(0);

    const playRandomSound = () => {
        const soundNumber = Math.floor(Math.random() * 3) + 1;
        const audio = new Audio(`/sounds/egg-crack-${soundNumber}.mp3`);
        audio.play().catch(error => console.log('Audio play failed:', error));
    };

    const handleEggTap = () => {
        if (clickCount < 3) {
            playRandomSound();
            setClickCount(prev => prev + 1);

            if (clickCount === 2 && petName.trim()) {
                // On the third click, proceed with naming
                setTimeout(() => {
                    onPetNamed(petName.trim());
                }, 1000); // Small delay to let the sound play
            }
        }
    };

    return (
        <div
            className={styles.nameYourPet}
            style={{
                backgroundImage: `url('/images/bg/name-your-pet-${eggIndex + 1}.png')`
            }}
        >
            <div className={styles.nameYourPet__container}>
                <header className={styles.nameYourPet__header}>
                    <h1 className={styles.nameYourPet__title}>NAME YOUR PET</h1>
                    <p className={styles.nameYourPet__subtitle}>Make it original!</p>
                </header>

                <div className={styles.nameYourPet__content}>
                    <div className={styles.egg__display}>
                        <div className={styles.spinning__circle}></div>
                        <div
                            className={styles.egg__badge}
                            onClick={handleEggTap}
                            style={{
                                transform: `scale(${0.8 + (clickCount * 0.1)})`
                            }}
                        >
                            <div className={styles.egg__inner}>
                                <img src={selectedEgg.imageSrc} alt={selectedEgg.name} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.input__container}>
                        <input
                            type="text"
                            className={styles.pet__name__input}
                            placeholder="Enter your pet's name..."
                            value={petName}
                            onChange={(e) => setPetName(e.target.value)}
                            maxLength={20}
                        />
                    </div>

                    <div className={styles.instruction__text}>
                        Tap the egg 3 times to hatch it
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NameYourPet; 