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
            "Mastery Journey": 1,
            "Skill Builder": 2,
            "Battle Tested": 3,
            "Victory Seeker": 4,
            "First Blood": 5,
            "Rank Climber": 6,
            "Tier Climber": 7,
            "Majesty Collector": 8,
            "Victorious Warrior": 9,
            "Carer": 10,
            "Friends": 11,
            "Missions": 12
        };
        return achievementMap[achievementName] || 0;
    };

    const achievementNumber = getAchievementNumber(name);

    // Custom values for specific achievements
    const getAchievementValues = (achievementName: string): number[] => {
        const valueMap: { [key: string]: number[] } = {
            "Skill Builder": [1, 3, 5, 10, 15, 25, 50, 100, 200, 500],
            "Battle Tested": [5, 15, 30, 75, 150, 300, 750, 1500, 3000, 7500],
            "Victory Seeker": [1, 5, 15, 35, 75, 150, 350, 750, 1500, 3500]
        };
        return valueMap[achievementName] || [];
    };

    const achievementValues = getAchievementValues(name);

    // Calculate actual progress percentage based on current level
    const calculateActualProgress = (): number => {
        if (achievementValues.length > 0) {
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
                                                    // Current level (glowing) - show random progress
                                                    const progress = Math.floor(Math.random() * (total * 0.8)) + 1;
                                                    return `${progress}/${total}`;
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
                                                    // Current level (glowing) - show random progress
                                                    const progress = Math.floor(Math.random() * (stepNumber * 0.8)) + 1;
                                                    return `${progress}/${stepNumber}`;
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