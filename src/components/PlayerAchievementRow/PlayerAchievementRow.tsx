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

const PlayerAchievementRow: React.FC<Props> = ({ row, rankIndex }) => {
    const [hoverTip, setHoverTip] = useState<{
        name: string;
        description: string;
        progressLabel: string;
        x: number;
        y: number;
    } | null>(null);

    const getPetImage = (): string => {
        const type = row.petType && ['1', '2', '3', '4'].includes(row.petType) ? row.petType : '1';
        const stage = Math.max(1, Math.min(3, Number(row.petStage) || 1));
        return assetUrl(`images/pets/pet-${type}-${stage}.png`);
    };

    const badgeSizeStyle = (step: number): React.CSSProperties => {
        // Match AchievementCard progressive sizing (step 1 small → step 10 large)
        const widthPct = 3.5 + step * 0.95;
        const heightPct = 70 + step * 5;
        return {
            width: `${widthPct}%`,
            height: `${heightPct}%`,
        };
    };

    return (
        <div className={`${cardStyles.achievement__card} ${styles.card}`}>
            <div className={`${cardStyles.achievement__icon} ${styles.trophySlot}`}>
                <div className={cardStyles.achievement__badge}>
                    <img src={trophyAsset(rankIndex)} alt={`Rank ${rankIndex + 1}`} />
                </div>
            </div>
            <div className={`${cardStyles.achievement__info} ${styles.info}`}>
                <h3 className={cardStyles.achievement__name}>{row.playerName}</h3>
                <div className={styles.progressStack}>
                    <span className={styles.progressPercent}>{row.progressPercent}%</span>
                    <div className={styles.progressRow}>
                        <div className={cardStyles.progress__bar}>
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
            </div>
            <div className={`${cardStyles.achievement__circles} ${styles.circles}`}>
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
                            className={`${cardStyles.achievement__circle} ${styles.circle} ${
                                ach.completedSteps > 0 ? cardStyles.completed : ''
                            } ${ach.completedSteps > 0 ? cardStyles.currentLevel : ''}`}
                            style={badgeSizeStyle(Math.max(1, displayStep || 1))}
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
                                style={{ opacity: ach.completedSteps > 0 ? 1 : 0.35 }}
                            />
                            <div className={cardStyles.badge__counter}>
                                <span>{displayStep}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={`${cardStyles.achievement__prize} ${styles.prize}`}>
                <img src={getPetImage()} alt={row.playerName} />
            </div>

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
