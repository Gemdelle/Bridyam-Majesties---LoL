import React from 'react';
import styles from './RankingAchievement.module.scss';

interface RankingAchievementProps {
    name: string;
    description: string;
    iconSrc: string;
}

const RankingAchievement: React.FC<RankingAchievementProps> = ({
    name,
    description,
    iconSrc
}) => {
    return (
        <div className={styles.ranking__achievement}>
            <div className={styles.achievement__name}>
                {name}
            </div>
            <div className={styles.achievement__icon}>
                <img src={iconSrc} alt={name} />
            </div>
            <div className={styles.achievement__description}>
                {description}
            </div>
        </div>
    );
};

export default RankingAchievement;
