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
            {/* Names container (separate from background) */}
            <div className={styles.names__container}>
                {/* Account name container */}
                <div className={styles.account__name__container}>
                    <div className={styles.account__name}>
                        {accountName}
                    </div>
                </div>

                {/* Champion number and name container */}
                <div className={styles.champion__info__container}>
                    <div className={styles.champion__number}>
                        {championNumber}
                    </div>
                    <div className={styles.champion__name}>
                        {championName.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Champion content container (with background) */}
            <div className={styles.champion__content__container}>
                {/* Main frame background */}
                <img
                    src="/images/frames/champion.frame-progress.png"
                    alt="Champion Frame"
                    className={styles.champion__frame__background}
                />

                {/* Particles on frame */}
                {masteryLevel >= 5 && (
                    <div className={styles.particles__container}>
                        {Array.from({ length: 20 }, (_, i) => (
                            <div key={i} className={`${styles.particle} ${styles[`particle__${i + 1}`]}`}></div>
                        ))}
                    </div>
                )}

                {/* Champion portrait in circular cutout */}
                <div className={styles.champion__portrait__container}>
                    <img
                        src={championImage}
                        alt="Champion"
                        className={`${styles.champion__portrait} ${masteryLevel >= 5 ? styles.mastery__glow : ''}`}
                    />
                </div>

                {/* Mastery badge in center */}
                <div className={styles.mastery__badge__container}>
                    <img
                        src={`/images/masteries/badges/${masteryLevel}.png`}
                        alt="Mastery Badge"
                        className={styles.mastery__badge}
                    />
                </div>

                {/* Crystals row */}
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

                {/* Progress bar */}
                <div className={styles.progress__bar__container}>
                    <div className={styles.progress__bar}>
                        <div
                            className={styles.progress__bar__fill}
                            style={{ width: `${masteryProgress}%` }}
                        ></div>
                    </div>
                </div>

                {/* XP text */}
                <div className={styles.xp__text}>
                    {currentXP}/{totalXP}
                </div>

                {/* Mastery level frame at bottom */}
                <div className={styles.mastery__level__frame__container}>
                    <img
                        src="/images/frames/mastery-level-frame.png"
                        alt="Mastery Level Frame"
                        className={styles.mastery__level__frame}
                    />
                    <div className={styles.mastery__level__number}>
                        {masteryLevel}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChampionProgress;