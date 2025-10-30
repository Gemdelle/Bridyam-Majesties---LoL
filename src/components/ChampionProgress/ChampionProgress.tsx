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
}

const ChampionProgress: React.FC<ChampionProgressProps> = ({
    championName,
    championImage,
    masteryLevel,
    masteryProgress,
    currentXP,
    totalXP,
    championNumber,
    accountName
}) => {
    return (
        <div className={styles.champion__card}>
            {/* Left side - Champion portrait with frame (30% width) */}
            <div className={styles.left__container}>
                {/* Champion image as background */}
                <div
                    className={styles.champion__image__background}
                    style={{ backgroundImage: `url(${championImage})` }}
                ></div>

                {/* Frame overlay */}
                <img
                    src="/images/frames/personal-champion.frame.png"
                    alt="Champion Frame"
                    className={styles.champion__frame}
                />
            </div>

            {/* Right side - Account name and progress info (70% width) */}
            <div className={styles.right__container}>
                {/* Left info container (60% width) - Name and crystals */}
                <div className={styles.left__info__container}>
                    {/* Account name */}
                    <div className={styles.account__name}>
                        {accountName}
                    </div>

                    {/* Crystals container */}
                    <div className={styles.crystals__container}>
                        {Array.from({ length: 10 }, (_, i) => {
                            const isUnlocked = i < masteryLevel;
                            return (
                                <img
                                    key={i}
                                    src="/images/gems/crystal.png"
                                    alt="Crystal"
                                    className={`${styles.crystal} ${isUnlocked ? styles.crystal__unlocked : styles.crystal__locked}`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Right mastery container (20% width, 100% height) */}
                <div className={styles.mastery__score__container}>
                    <img
                        src={`/images/masteries/badges/${masteryLevel}.png`}
                        alt={`Mastery ${masteryLevel}`}
                        className={`${styles.mastery__score__badge} ${masteryLevel >= 1 && masteryLevel <= 4 ? styles.mastery__badge__small : ''}`}
                    />
                    <div className={styles.mastery__score__text}>
                        {masteryLevel}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChampionProgress;
