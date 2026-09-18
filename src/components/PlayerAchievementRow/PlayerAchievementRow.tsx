import React, { useState } from 'react';
import cardStyles from '../AchievementCard/AchievementCard.module.scss';
import styles from './PlayerAchievementRow.module.scss';
import { assetUrl } from '../../utils/assetUrl';
import { trophyAsset } from '../../services/gardenService';
import { ACHIEVEMENT_DEFS, type PlayerAchievementRow as RowData } from '../../services/playerAchievementsService';

interface Props {
    row: RowData;
    rankIndex: number;
}

const PODIUM_SPARKLES: Record<number, string[]> = {
    0: ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'ml', 'mr', 'tml', 'tmr'],
    1: ['tl', 'tr', 'bl', 'br', 'tm'],
    2: ['tl', 'tr', 'bm'],
};

export const getPetFaceSrc = (petType: string | null, petStage: number | null): string => {
    const type = petType && ['1', '2', '3', '4'].includes(petType) ? petType : '1';
    const stage = Math.max(1, Math.min(3, Number(petStage) || 1));
    return assetUrl(`images/pets/pet-${type}-${stage}.png`);
};

export const PetFaceFrame: React.FC<{
    petType: string | null;
    petStage: number | null;
    alt?: string;
    className?: string;
}> = ({ petType, petStage, alt = 'Pet', className }) => (
    <div className={`${styles.petFace} ${className || ''}`}>
        <img src={getPetFaceSrc(petType, petStage)} alt={alt} className={styles.petFace__img} />
        <img
            src={assetUrl('images/frames/personal-champion.frame.png')}
            alt=""
            className={styles.petFace__frame}
        />
    </div>
);

const PlayerAchievementRow: React.FC<Props> = ({ row, rankIndex }) => {
    const [hoverTip, setHoverTip] = useState<{
        name: string;
        description: string;
        progressLabel: string;
        x: number;
        y: number;
    } | null>(null);

    const podiumPlace = rankIndex <= 2 ? rankIndex + 1 : 0;
    const sparklePos = PODIUM_SPARKLES[rankIndex] || [];

    const badgeHeight = (step: number): string => `${2.1 + step * 0.22}vw`;

    const podiumClass =
        podiumPlace === 1
            ? styles.podium1
            : podiumPlace === 2
              ? styles.podium2
              : podiumPlace === 3
                ? styles.podium3
                : '';
    const trophyGlowClass =
        podiumPlace === 1
            ? styles.trophyGlow1
            : podiumPlace === 2
              ? styles.trophyGlow2
              : podiumPlace === 3
                ? styles.trophyGlow3
                : '';

    return (
        <div className={`${cardStyles.achievement__card} ${styles.card} ${podiumClass}`}>
            <div className={`${cardStyles.achievement__icon} ${styles.trophySlot}`}>
                <div
                    className={`${cardStyles.achievement__badge} ${styles.trophyBadge} ${trophyGlowClass}`}
                >
                    <img src={trophyAsset(rankIndex)} alt={`Rank ${rankIndex + 1}`} />
                    {sparklePos.map((pos) => (
                        <span
                            key={pos}
                            className={styles.trophySparkle}
                            data-pos={pos}
                            aria-hidden
                        />
                    ))}
                </div>
            </div>

            <div className={styles.info}>
                <div className={styles.nameRow}>
                    <h3 className={styles.playerName}>{row.playerName}</h3>
                    <span className={styles.progressPercent}>{row.progressPercent}%</span>
                </div>
                <div className={styles.progressRow}>
                    <div className={`${cardStyles.progress__bar} ${styles.progressBar}`}>
                        <div
                            className={cardStyles.progress__fill}
                            style={{ width: `${row.progressPercent}%` }}
                        />
                    </div>
                    <span className={styles.progressCount}>
                        {row.totalBadges}/{row.maxBadges}
                    </span>
                </div>
            </div>

            <div className={styles.circles}>
                {row.achievements.map((ach) => {
                    const def = ACHIEVEMENT_DEFS.find((d) => d.name === ach.name);
                    const num = def?.achievementNumber || 1;
                    const step = Math.max(1, Math.min(10, ach.completedSteps || 1));
                    const displayStep = ach.completedSteps;
                    const img =
                        ach.completedSteps > 0
                            ? `/images/achievement/achievement-${num}-${step}.png`
                            : `/images/achievement/achievement-${num}-1.png`;
                    const thresholds = def?.thresholds || [];
                    const nextThreshold =
                        ach.completedSteps >= 10
                            ? thresholds[9]
                            : thresholds[Math.min(ach.completedSteps, thresholds.length - 1)];
                    const progressLabel =
                        nextThreshold != null
                            ? `${ach.value}/${nextThreshold}`
                            : `${ach.value}`;

                    return (
                        <div
                            key={ach.name}
                            className={`${styles.circle} ${
                                ach.completedSteps > 0 ? styles.circleDone : ''
                            }`}
                            style={{ height: badgeHeight(Math.max(1, displayStep || 1)) }}
                            onMouseEnter={(e) => {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setHoverTip({
                                    name: ach.name,
                                    description: def?.description || '',
                                    progressLabel,
                                    x: rect.left + rect.width / 2,
                                    y: rect.top,
                                });
                            }}
                            onMouseLeave={() => setHoverTip(null)}
                        >
                            <img
                                src={img}
                                alt={ach.name}
                                className={styles.badgeImg}
                                style={{ opacity: ach.completedSteps > 0 ? 1 : 0.35 }}
                            />
                            <span className={styles.badgeCounter}>{displayStep}</span>
                        </div>
                    );
                })}
            </div>

            <PetFaceFrame
                petType={row.petType}
                petStage={row.petStage}
                alt={row.playerName}
                className={styles.prize}
            />

            {hoverTip && (
                <div
                    className={styles.tooltip}
                    style={{ left: hoverTip.x, top: hoverTip.y }}
                >
                    <strong>{hoverTip.name}</strong>
                    <span>{hoverTip.description}</span>
                    <em>{hoverTip.progressLabel}</em>
                </div>
            )}
        </div>
    );
};

export default PlayerAchievementRow;
