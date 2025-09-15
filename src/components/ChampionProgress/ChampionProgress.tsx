import React from 'react';
import styles from './ChampionProgress.module.scss';

const ChampionProgress: React.FC = () => {
    return (
        <div className={styles.current_champion__container}>
            <div className={styles.champion__portrait}>
                <img src="/images/frames/personal-champion.frame.png" alt="Champion Portrait"
                    className={styles.champion__frame}
                />
                <img src="/images/roulette/wheel.png" alt="Champion" className={styles.champion} />
            </div>
            <div className={styles.champion__info}>
                <div className={styles.champion__name}>
                    <h3>Champion Name</h3>
                </div>

                <div className={styles.champion__stats}>
                    <div className={styles.champion__level__container}>
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                        <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                    </div>
                    <div className={styles.champion__level__number}>
                        <img src="/images/masteries/mastery/10.png" alt="Level" className={styles.champion__level__number__image} />
                    </div>
                </div>

                <div className={styles.champion__bar}>
                    <div className={styles.champion__bar__fill}></div>
                </div>
            </div>
        </div>
    );
};

export default ChampionProgress;