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
                {/* Account name at top */}
                <div className={styles.account__name}>
                    {accountName}
                </div>

                {/* Bottom container with crystals and XP */}
                <div className={styles.bottom__info__container}>
                    {/* Crystals container (70% width) */}
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

                    {/* XP points container (30% width) */}
                    <div className={styles.xp__container}>
                        <div className={styles.xp__text}>
                            {currentXP}/{totalXP}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChampionProgress;
