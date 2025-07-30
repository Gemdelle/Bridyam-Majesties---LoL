import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetContext } from '../../contexts/PetContext';
import styles from './PetDisplay.module.scss';

const PetDisplay: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPet } = usePetContext();
    const [petName, setPetName] = useState<string>('');

    const handleClick = () => {
        navigate('/login');
    };

    useEffect(() => {
        // Try to get pet data from localStorage as fallback
        const savedPetData = localStorage.getItem('selectedPet');
        if (savedPetData) {
            try {
                const petData = JSON.parse(savedPetData);
                if (petData.petName) {
                    setPetName(petData.petName);
                }
            } catch (error) {
                console.log('Error parsing saved pet data:', error);
            }
        }
    }, []);

    // Use pet name from context, then localStorage, then fallback to "Pet"
    const displayName = selectedPet?.petName || petName || "Pet";

    // Debug logging
    console.log('Selected Pet:', selectedPet);
    console.log('Pet Name from Context:', selectedPet?.petName);
    console.log('Pet Name from localStorage:', petName);
    console.log('Final Display Name:', displayName);

    return (
        <div className={styles.container} onClick={handleClick}>

            <div className={styles.petContainer}>
                <img src="/images/nav-frames/pet-2/frame-pet-2-level-6.png" alt="Pet Profile" className={styles.petFrame} />
                <img src="/images/pets/nav-pet-2.png" alt="Pet" className={styles.pet} />
            </div>

            <div className={styles.emotionsPanel}>
                <div className={styles.emotionsContainer}>
                    <span className={styles.petName}>{displayName}</span>
                    <div className={styles.barsContainer}>
                        <div className={styles.hungerContainer}>
                            <span>🍖</span>
                            <div className={styles.barContainer}>
                                <div className={`${styles.bar} ${styles.hungerBar}`}></div>
                            </div>
                            <span className={styles.percentage}>75%</span>
                        </div>
                        <div className={styles.energyContainer}>
                            <span>⚡</span>
                            <div className={styles.barContainer}>
                                <div className={`${styles.bar} ${styles.energyBar}`}></div>
                            </div>
                            <span className={styles.percentage}>60%</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    );
};

export default PetDisplay; 