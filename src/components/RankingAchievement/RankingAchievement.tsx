import React from 'react';
import styles from './RankingAchievement.module.scss';

interface EloPoint {
    elo: 'bronze' | 'vesuvianite' | 'silver' | 'diamond';
    points: number;
}

interface RankingAchievementProps {
    name: string;
    description: string;
    iconSrc: string;
    value: string;
    clarification?: string;
    eloBreakdown?: EloPoint[];
}

const RankingAchievement: React.FC<RankingAchievementProps> = ({
    name,
    description,
    iconSrc,
    value,
    clarification,
    eloBreakdown
}) => {
    // Default elo breakdown if not provided
    const defaultEloBreakdown: EloPoint[] = [
        { elo: 'bronze', points: 5 },
        { elo: 'vesuvianite', points: 10 },
        { elo: 'silver', points: 20 },
        { elo: 'diamond', points: 30 }
    ];

    const elos = eloBreakdown || defaultEloBreakdown;

    const getEloIconPath = (elo: string) => {
        return `/images/ranking/${elo}/${elo}-honor.png`;
    };

    return (
        <div className={styles.ranking__achievement}>
            <div className={styles.achievement__name}>
                {name}
            </div>
            <div className={styles.achievement__icon}>
                <img src={iconSrc} alt={name} />
            </div>
            <div className={styles.achievement__value}>
                {value}
            </div>
            <div className={styles.achievement__text__container}>
                <div className={styles.achievement__description}>
                    {description}
                </div>
                {clarification && (
                    <div className={styles.achievement__clarification}>
                        {clarification}
                    </div>
                )}
            </div>
            <div className={styles.elo__breakdown}>
                {elos.map((eloPoint, index) => (
                    <div key={index} className={styles.elo__point}>
                        <img
                            src={getEloIconPath(eloPoint.elo)}
                            alt={eloPoint.elo}
                            className={styles.elo__icon}
                        />
                        <span className={styles.elo__number}>{eloPoint.points}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RankingAchievement;
