import React from 'react';
import styles from './Achievements.module.scss';

const Achievements: React.FC = () => {
    return (
        <div className={styles.achievements}>
            <div className={styles.achievements__container}>
                <header className={styles.achievements__header}>
                    <h1 className={styles.achievements__title}>Achievements</h1>
                    <p className={styles.achievements__subtitle}>Track your progress and unlock rewards</p>
                </header>

                <div className={styles.achievements__content}>
                    <div className={styles.achievements__list}>
                        <div className={styles.achievement__card}>
                            <div className={styles.achievement__icon}>
                                <div className={styles.spinning__circle}></div>
                                <div className={styles.achievement__badge}>
                                    <img src="/src/assets/images/ranked-btn/wins.png" alt="First Steps" />
                                </div>
                            </div>
                            <div className={styles.achievement__info}>
                                <h3 className={styles.achievement__name}>First Steps</h3>
                                <p className={styles.achievement__description}>Complete your first match</p>
                            </div>
                            <div className={styles.achievement__progress__section}>
                                <div className={styles.achievement__progress}>
                                    <div className={styles.progress__bar}>
                                        <div className={styles.progress__fill} style={{ width: '100%' }}></div>
                                    </div>
                                    <span className={styles.progress__text}>100%</span>
                                </div>
                                <div className={styles.achievement__circles}>
                                    {[...Array(10)].map((_, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.achievement__circle} ${index < 10 ? styles.completed : ''}`}
                                        >
                                            <img src="/src/assets/images/achievement/circle.png" alt="Step" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.achievement__card}>
                            <div className={styles.achievement__icon}>
                                <div className={styles.spinning__circle}></div>
                                <div className={styles.achievement__badge}>
                                    <img src="/src/assets/images/ranked-btn/mission.png" alt="Champion Collector" />
                                </div>
                            </div>
                            <div className={styles.achievement__info}>
                                <h3 className={styles.achievement__name}>Champion Collector</h3>
                                <p className={styles.achievement__description}>Favorite 10 champions</p>
                            </div>
                            <div className={styles.achievement__progress__section}>
                                <div className={styles.achievement__progress}>
                                    <div className={styles.progress__bar}>
                                        <div className={styles.progress__fill} style={{ width: '60%' }}></div>
                                    </div>
                                    <span className={styles.progress__text}>60%</span>
                                </div>
                                <div className={styles.achievement__circles}>
                                    {[...Array(10)].map((_, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.achievement__circle} ${index < 6 ? styles.completed : ''}`}
                                        >
                                            <img src="/src/assets/images/achievement/circle.png" alt="Step" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.achievement__card}>
                            <div className={styles.achievement__icon}>
                                <div className={styles.spinning__circle}></div>
                                <div className={styles.achievement__badge}>
                                    <img src="/src/assets/images/lol-elements/tier-gold.webp" alt="Ranked Warrior" />
                                </div>
                            </div>
                            <div className={styles.achievement__info}>
                                <h3 className={styles.achievement__name}>Ranked Warrior</h3>
                                <p className={styles.achievement__description}>Reach Gold rank</p>
                            </div>
                            <div className={styles.achievement__progress__section}>
                                <div className={styles.achievement__progress}>
                                    <div className={styles.progress__bar}>
                                        <div className={styles.progress__fill} style={{ width: '70%' }}></div>
                                    </div>
                                    <span className={styles.progress__text}>70%</span>
                                </div>
                                <div className={styles.achievement__circles}>
                                    {[...Array(10)].map((_, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.achievement__circle} ${index < 7 ? styles.completed : ''}`}
                                        >
                                            <img src="/src/assets/images/achievement/circle.png" alt="Step" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.achievement__card}>
                            <div className={styles.achievement__icon}>
                                <div className={styles.spinning__circle}></div>
                                <div className={styles.achievement__badge}>
                                    <img src="/src/assets/images/masteries/mastery/7.png" alt="Mastery Master" />
                                </div>
                            </div>
                            <div className={styles.achievement__info}>
                                <h3 className={styles.achievement__name}>Mastery Master</h3>
                                <p className={styles.achievement__description}>Get mastery level 7 on any champion</p>
                            </div>
                            <div className={styles.achievement__progress__section}>
                                <div className={styles.achievement__progress}>
                                    <div className={styles.progress__bar}>
                                        <div className={styles.progress__fill} style={{ width: '30%' }}></div>
                                    </div>
                                    <span className={styles.progress__text}>30%</span>
                                </div>
                                <div className={styles.achievement__circles}>
                                    {[...Array(10)].map((_, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.achievement__circle} ${index < 3 ? styles.completed : ''}`}
                                        >
                                            <img src="/src/assets/images/achievement/circle.png" alt="Step" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Achievements; 