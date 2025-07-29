import React from 'react';
import styles from './AchievementCard.module.scss';

interface AchievementCardProps {
    name: string;
    description: string;
    iconSrc: string;
    completedSteps: number;
    totalSteps?: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
    name,
    description,
    iconSrc,
    completedSteps,
    totalSteps = 10
}) => {
    // Get achievement number based on name for consistent image pattern
    const getAchievementNumber = (achievementName: string): number => {
        const achievementMap: { [key: string]: number } = {
            "Ascension": 1,
            "Artisan": 2,
            "Battlelord": 3,
            "Victorious": 4,
            "Initiate": 5,
            "Conqueror": 6,
            "Champion": 7,
            "Majesty": 8,
            "Warrior": 9,
            "Guardian": 10,
            "Companion": 11,
            "Questmaster": 12
        };
        return achievementMap[achievementName] || 0;
    };

    const achievementNumber = getAchievementNumber(name);

    // Custom values for specific achievements
    const getAchievementValues = (achievementName: string): number[] => {
        const valueMap: { [key: string]: number[] } = {
            "Artisan": [1, 3, 5, 10, 15, 25, 50, 100, 200, 500],
            "Battlelord": [5, 15, 30, 75, 150, 300, 750, 1500, 3000, 7500],
            "Victorious": [1, 5, 15, 35, 75, 150, 350, 750, 1500, 3500],
            "Initiate": [1, 2, 3, 5, 8, 12, 18, 25, 35, 50],
            "Conqueror": [1, 3, 5, 8, 12, 18, 25, 35, 40, 50],
            "Champion": [1, 2, 3, 5, 8, 12, 18, 22, 26, 30],
            "Warrior": [5, 15, 35, 75, 150, 300, 500, 750, 1000, 1500],
            "Guardian": [10, 50, 150, 500, 1000, 2000, 3500, 5000, 7500, 10000],
            "Companion": [1, 5, 15, 35, 75, 150, 250, 350, 425, 500],
            "Questmaster": [5, 25, 75, 200, 500, 1000, 2000, 3500, 5500, 8000]
        };
        return valueMap[achievementName] || [];
    };

    const achievementValues = getAchievementValues(name);

    // Calculate actual progress percentage based on current level
    const calculateActualProgress = (): number => {
        if (achievementValues.length > 0) {
            // If no levels are completed, progress is 0
            if (completedSteps === 0) {
                return 0;
            }

            // Calculate total progress from completed levels
            let totalProgress = 0;
            for (let i = 0; i < completedSteps - 1; i++) {
                totalProgress += achievementValues[i];
            }

            // Add partial progress from current level (if any)
            if (completedSteps > 0 && completedSteps <= 10) {
                const currentLevelTotal = achievementValues[completedSteps - 1];
                const currentProgress = Math.floor(Math.random() * (currentLevelTotal * 0.8)) + 1;
                totalProgress += currentProgress;
            }

            // Calculate total possible progress up to current level
            let totalPossible = 0;
            for (let i = 0; i < completedSteps; i++) {
                totalPossible += achievementValues[i];
            }

            // If we're on the first level and haven't completed it, show partial progress
            if (completedSteps === 1) {
                const currentLevelTotal = achievementValues[0];
                const currentProgress = Math.floor(Math.random() * (currentLevelTotal * 0.8)) + 1;
                return Math.round((currentProgress / currentLevelTotal) * 100);
            }

            return Math.min(100, Math.round((totalProgress / totalPossible) * 100));
        } else {
            // Default progress calculation for achievements without custom values
            return Math.round((completedSteps / totalSteps) * 100);
        }
    };

    const actualProgress = calculateActualProgress();

    // For special achievements, show current level on the left
    const leftIconSrc = achievementNumber > 0
        ? `/images/achievement/achievement-${achievementNumber}-${completedSteps}.png`
        : iconSrc;

    return (
        <div className={styles.achievement__card}>
            <div className={styles.achievement__icon}>
                <div className={styles.achievement__badge}>
                    <img src={leftIconSrc} alt={name} />
                </div>
            </div>
            <div className={styles.achievement__info}>
                <h3 className={styles.achievement__name}>{name}</h3>
                <p className={styles.achievement__description}>{description}</p>
                <div className={styles.achievement__progress}>
                    <div className={styles.progress__bar}>
                        <div className={styles.progress__fill} style={{ width: `${actualProgress}%` }}></div>
                    </div>
                    <span className={styles.progress__text}>{actualProgress}%</span>
                </div>
            </div>
            <div className={styles.achievement__circles}>
                {[...Array(totalSteps)].map((_, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = index < completedSteps;

                    // For special achievements, use appropriate images
                    const circleImageSrc = achievementNumber > 0
                        ? `/images/achievement/achievement-${achievementNumber}-${stepNumber}.png`
                        : "/images/achievement/circle.png";

                    return (
                        <div
                            key={index}
                            className={`${styles.achievement__circle} ${isCompleted ? styles.completed : ''} ${index === completedSteps - 1 ? styles.currentLevel : ''}`}
                        >
                            <img src={circleImageSrc} alt={`Step ${stepNumber}`} />
                            <div className={styles.badge__counter}>
                                <span>
                                    {achievementValues.length > 0
                                        ? (() => {
                                            const total = achievementValues[stepNumber - 1];
                                            if (isCompleted) {
                                                if (index === completedSteps - 1) {
                                                    // Current level (glowing) - show cumulative progress
                                                    let cumulativeProgress = 0;
                                                    for (let i = 0; i < stepNumber - 1; i++) {
                                                        cumulativeProgress += achievementValues[i];
                                                    }
                                                    cumulativeProgress += Math.floor(Math.random() * (total * 0.8)) + 1;
                                                    return `${cumulativeProgress}/${total}`;
                                                } else {
                                                    return `${total}/${total}`;
                                                }
                                            } else {
                                                return `0/${total}`;
                                            }
                                        })()
                                        : (() => {
                                            if (isCompleted) {
                                                if (index === completedSteps - 1) {
                                                    // Current level (glowing) - show cumulative progress
                                                    let cumulativeProgress = 0;
                                                    for (let i = 0; i < stepNumber - 1; i++) {
                                                        cumulativeProgress += (i + 1);
                                                    }
                                                    cumulativeProgress += Math.floor(Math.random() * (stepNumber * 0.8)) + 1;
                                                    return `${cumulativeProgress}/${stepNumber}`;
                                                } else {
                                                    return `${stepNumber}/${stepNumber}`;
                                                }
                                            } else {
                                                return `0/${stepNumber}`;
                                            }
                                        })()
                                    }
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={styles.achievement__prize}>
                <div className={styles.spinning__circle}></div>
                <img src={leftIconSrc} alt={name} />
            </div>
        </div>
    );
};

export default AchievementCard; 