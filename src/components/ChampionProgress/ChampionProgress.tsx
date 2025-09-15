import React from 'react';
import styles from './ChampionProgress.module.scss';

interface ChampionProgressProps {
    championNumber: number;
    championName: string;
    championImage: string;
    masteryLevel: number;
    masteryProgress: number;
    currentXP: number;
    totalXP: number;
}

const ChampionProgress: React.FC<ChampionProgressProps> = ({
    championNumber,
    championName,
    championImage,
    masteryLevel,
    masteryProgress,
    currentXP,
    totalXP
}) => {
    // Function to get number image for each digit
    const getNumberImage = (digit: number): string => {
        return `/images/numbers/${digit}.png`;
    };

    // Function to render champion number as images
    const renderChampionNumber = (number: number) => {
        const digits = number.toString().split('').map(Number);
        return digits.map((digit, index) => (
            <img
                key={index}
                src={getNumberImage(digit)}
                alt={digit.toString()}
                className={styles.champion__number__digit}
            />
        ));
    };
    return (
        <div className={styles.current_champion__container}>
            <div className={styles.champion__portrait}>
                <div className={styles.champion__frame__container}>
                    <img src="/images/frames/personal-champion.frame.png" alt="Champion Portrait"
                        className={styles.champion__frame}
                    />
                    {masteryLevel >= 5 && (
                        <div className={styles.particles__container}>
                            {Array.from({ length: 20 }, (_, i) => (
                                <div key={i} className={`${styles.particle} ${styles[`particle__${i + 1}`]}`}></div>
                            ))}
                        </div>
                    )}
                </div>
                <img
                    src={championImage}
                    alt="Champion"
                    className={`${styles.champion} ${masteryLevel >= 5 ? styles.mastery__glow : ''}`}
                />
            </div>
            <div className={styles.champion__info}>
                <div className={styles.champion__name}>
                    <div className={styles.champion__number}>
                        {renderChampionNumber(championNumber)}
                    </div>
                    <h3>{championName}</h3>
                </div>

                <div className={styles.champion__stats}>
                    <div className={styles.champion__level__container}>
                        {Array.from({ length: 11 }, (_, i) => {
                            const isUnlocked = i < masteryLevel;
                            return (
                                <img
                                    key={i}
                                    src="/images/gems/crystal.png"
                                    alt="Level"
                                    className={`${styles.champion__level} ${isUnlocked ? styles.crystal__unlocked : styles.crystal__locked}`}
                                />
                            );
                        })}
                    </div>
                    <div className={styles.champion__level__number}>
                        <img
                            src={`/images/masteries/mastery/${masteryLevel}.png`}
                            alt="Level"
                            className={`${styles.champion__level__number__image} ${styles[`level__${masteryLevel}`]}`}
                        />
                    </div>
                </div>

                <div className={styles.champion__bar__container}>
                    <div className={styles.champion__bar}>
                        <div
                            className={styles.champion__bar__fill}
                            style={{ width: `${masteryProgress}%` }}
                        ></div>
                    </div>
                    <div className={styles.champion__xp}>
                        {currentXP}/{totalXP}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChampionProgress;