import React from 'react';
import cardStyles from '../AchievementCard/AchievementCard.module.scss';
import styles from './PlayerAchievementRow.module.scss';
import { assetUrl } from '../../utils/assetUrl';
import { ACHIEVEMENT_DEFS, type PlayerAchievementRow as RowData } from '../../services/playerAchievementsService';

interface Props {
    row: RowData;
}

const PlayerAchievementRow: React.FC<Props> = ({ row }) => {
    const getPetImage = (): string => {
        const type = row.petType && ['1', '2', '3', '4'].includes(row.petType) ? row.petType : '1';
        const stage = Math.max(1, Math.min(3, Number(row.petStage) || 1));
        return assetUrl(`images/pets/pet-${type}-${stage}.png`);
    };

    return (
        <div className={cardStyles.achievement__card}>
            <div className={cardStyles.achievement__icon}>
                <div className={cardStyles.achievement__badge}>
                    <img src={getPetImage()} alt={row.playerName} />
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
                    const img =
                        ach.completedSteps > 0
                            ? `/images/achievement/achievement-${num}-${step}.png`
                            : `/images/achievement/achievement-${num}-1.png`;
                    return (
                        <div
                            key={ach.name}
                            className={`${cardStyles.achievement__circle} ${styles.circle} ${
                                ach.completedSteps > 0 ? cardStyles.completed : ''
                            } ${ach.completedSteps > 0 ? cardStyles.currentLevel : ''}`}
                            title={`${ach.name}: ${ach.completedSteps}/10`}
                        >
                            <img
                                src={img}
                                alt={ach.name}
                                style={{ opacity: ach.completedSteps > 0 ? 1 : 0.35 }}
                            />
                            <div className={cardStyles.badge__counter}>
                                <span>{ach.completedSteps}/10</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={cardStyles.achievement__prize}>
                <div className={cardStyles.spinning__circle} />
                <img src={getPetImage()} alt={row.playerName} />
            </div>
        </div>
    );
};

export default PlayerAchievementRow;
