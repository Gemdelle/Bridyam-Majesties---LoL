import React from 'react';
import styles from '../AchievementCard/AchievementCard.module.scss';
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
        <div className={styles.achievement__card}>
            <div className={styles.achievement__icon}>
                <div className={styles.achievement__badge}>
                    <img src={getPetImage()} alt={row.playerName} />
                </div>
            </div>
            <div className={styles.achievement__info}>
                <h3 className={styles.achievement__name}>{row.playerName}</h3>
                <div className={styles.achievement__progress}>
                    <div className={styles.progress__bar}>
                        <div
                            className={styles.progress__fill}
                            style={{ width: `${row.progressPercent}%` }}
                        />
                    </div>
                    <span className={styles.progress__text}>
                        {row.totalBadges}/{row.maxBadges} · {row.progressPercent}%
                    </span>
                </div>
            </div>
            <div className={styles.achievement__circles}>
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
                            className={`${styles.achievement__circle} ${
                                ach.completedSteps > 0 ? styles.completed : ''
                            } ${ach.completedSteps > 0 ? styles.currentLevel : ''}`}
                            title={`${ach.name}: ${ach.completedSteps}/10`}
                        >
                            <img
                                src={img}
                                alt={ach.name}
                                style={{ opacity: ach.completedSteps > 0 ? 1 : 0.35 }}
                            />
                            <div className={styles.badge__counter}>
                                <span>
                                    {ach.completedSteps}/10
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={styles.achievement__prize}>
                <div className={styles.spinning__circle} />
                <img src={getPetImage()} alt={row.playerName} />
            </div>
        </div>
    );
};

export default PlayerAchievementRow;
