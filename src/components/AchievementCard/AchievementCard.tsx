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
    const isMasteryJourney = name === "Mastery Journey";

    // For mastery journey, show current mastery level on the left
    const leftIconSrc = isMasteryJourney
        ? `/src/assets/images/masteries/mastery/${completedSteps}.png`
        : iconSrc;

    return (
        <div className={styles.achievement__card}>
            <div className={styles.achievement__icon}>
                <div className={styles.spinning__circle}></div>
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

                    // For mastery journey, use mastery images 1-10
                    const circleImageSrc = isMasteryJourney
                        ? `/src/assets/images/masteries/mastery/${stepNumber}.png`
                        : "/src/assets/images/achievement/circle.png";

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
        </div>
    );
};

export default AchievementCard; 