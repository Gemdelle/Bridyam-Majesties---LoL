import React from 'react';
import styles from './AchievementCard.module.scss';

interface AchievementCardProps {
    name: string;
    description: string;
    iconSrc: string;
    progress: number;
    completedSteps: number;
    totalSteps?: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
    name,
    description,
    iconSrc,
    progress,
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
                        <div className={styles.progress__fill} style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className={styles.progress__text}>{progress}%</span>
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
                            className={`${styles.achievement__circle} ${isCompleted ? styles.completed : ''}`}
                        >
                            <img src={circleImageSrc} alt={`Step ${stepNumber}`} />
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