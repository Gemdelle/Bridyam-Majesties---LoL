import React from 'react';
import styles from './PetDisplay.module.scss';

interface PetDisplayProps {
    petImage?: string;
    name: string;
    level: number;
}

const PetDisplay: React.FC<PetDisplayProps> = ({ petImage, name, level }) => {
    const totalLevels = 6;
    const arcDegrees = 180;
    const startAngle = -90;

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.levels}>
                    {[...Array(totalLevels)].map((_, i) => {
                        const angle = startAngle + i * (arcDegrees / (totalLevels - 1));
                        return (
                            <div
                                key={i}
                                className={`${styles.diamond} ${i < level ? styles.active : ''}`}
                                style={{ '--angle': `${angle}deg` } as React.CSSProperties}
                            />
                        );
                    })}
                </div>
                <div className={styles.frame}>
                    <div className={styles.pet}>
                        {petImage ? <img src={petImage} alt="Pet" /> : 'pet'}
                    </div>
                </div>
            </div>
            <div className={styles.name}>
                <span>{name}</span>
            </div>
        </div>
    );
};

export default PetDisplay; 