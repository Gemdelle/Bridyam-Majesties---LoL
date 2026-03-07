import React from 'react';
import styles from './ChampionProgress.module.scss';

interface ChampionProgressProps {
    championName: string;
    championImage: string;
    masteryLevel: number;
    masteryProgress: number;
    currentXP: number;
    totalXP: number;
    championNumber: number;
    accountName: string;
    onMasteryChange?: (delta: number) => void;
    editable?: boolean;
    isOwned?: boolean;
}

const ChampionProgress: React.FC<ChampionProgressProps> = ({
    championImage,
    masteryLevel,
    accountName,
    onMasteryChange,
    editable = false,
    isOwned = true
}) => {
    const masteryBadgeLevel = Math.min(masteryLevel, 10);

    const handleCrystalClick = (crystalIndex: number) => {
        if (!editable || !onMasteryChange) return;
        
        // If clicking on an unlocked crystal, set level to that crystal (or one less if it's the current level)
        // If clicking on a locked crystal, set level to that crystal + 1
        const clickedLevel = crystalIndex + 1;
        
        if (clickedLevel === masteryLevel) {
            // Clicking the last unlocked crystal decreases level by 1
            onMasteryChange(-1);
        } else if (clickedLevel > masteryLevel) {
            // Clicking a locked crystal sets level to that position
            onMasteryChange(clickedLevel - masteryLevel);
        } else {
            // Clicking a lower unlocked crystal sets level to that position
            onMasteryChange(clickedLevel - masteryLevel);
        }
    };

    return (
        <div className={`${styles.champion__card} ${!isOwned ? styles.not__owned : ''}`}>
            {/* Left side - Champion portrait with frame */}
            <div className={styles.left__container}>
                <div
                    className={styles.champion__image__background}
                    style={{ backgroundImage: `url(${championImage})` }}
                ></div>
                <img
                    src="/images/frames/personal-champion.frame.png"
                    alt="Champion Frame"
                    className={styles.champion__frame}
                />
            </div>

            {/* Right side - Account name and progress info */}
            <div className={styles.right__container}>
                <div className={styles.left__info__container}>
                    <div className={styles.account__name}>
                        {accountName}
                    </div>
                    <div className={styles.crystals__container}>
                        {Array.from({ length: 10 }, (_, i) => {
                            const isUnlocked = i < masteryLevel;
                            return (
                                <img
                                    key={i}
                                    src="/images/gems/crystal.png"
                                    alt="Crystal"
                                    className={`${styles.crystal} ${isUnlocked ? styles.crystal__unlocked : styles.crystal__locked} ${editable ? styles.crystal__clickable : ''}`}
                                    onClick={() => handleCrystalClick(i)}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className={styles.mastery__score__container}>
                    <div className={styles.mastery__score__text}>
                        {masteryLevel}
                    </div>
                    <img
                        src={`/images/masteries/badges/${masteryBadgeLevel}.png`}
                        alt={`Mastery ${masteryLevel}`}
                        className={`${styles.mastery__score__badge} ${masteryBadgeLevel >= 1 && masteryBadgeLevel <= 4 ? styles.mastery__badge__small : ''}`}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChampionProgress;
