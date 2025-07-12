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
    const isRankClimber = name === "Rank Climber";
    const isTierClimber = name === "Tier Climber";

    // Define tier progression for rank climber
    const tierImages = [
        'tier-iron.webp',
        'tier-bronze.webp',
        'tier-silver.webp',
        'tier-gold.webp',
        'tier-platinum.webp',
        'tier-emerald.webp',
        'tier-diamond.webp',
        'tier-master.webp',
        'tier-grandmaster.webp',
        'tier-challenger.webp'
    ];

    // Define helm progression for tier climber
    const helmImages = [
        'tier-iron-helm.webp',
        'tier-bronze-helm.webp',
        'tier-silver-helm.webp',
        'tier-gold-helm.webp',
        'tier-platinum-helm.webp',
        'tier-emerald-helm.webp',
        'tier-diamond-helm.webp',
        'tier-master-helm.webp',
        'tier-grandmaster-helm.webp',
        'tier-challenger-heml.webp' // Note: typo in filename
    ];

    // For special achievements, show current level on the left
    const leftIconSrc = isMasteryJourney
        ? `/images/masteries/mastery/${completedSteps}.png`
        : isRankClimber
            ? `/images/lol-elements/${tierImages[Math.min(completedSteps - 1, tierImages.length - 1)]}`
            : isTierClimber
                ? `/images/lol-elements/${helmImages[Math.min(completedSteps - 1, helmImages.length - 1)]}`
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

                    // For special achievements, use appropriate images
                    const circleImageSrc = isMasteryJourney
                        ? `/images/masteries/mastery/${stepNumber}.png`
                        : isRankClimber
                            ? `/images/lol-elements/${tierImages[Math.min(stepNumber - 1, tierImages.length - 1)]}`
                            : isTierClimber
                                ? `/images/lol-elements/${helmImages[Math.min(stepNumber - 1, helmImages.length - 1)]}`
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
        </div>
    );
};

export default AchievementCard; 