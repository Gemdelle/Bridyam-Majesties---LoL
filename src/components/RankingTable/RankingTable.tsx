import React, { useState, useEffect } from 'react';
import styles from './RankingTable.module.scss';
import { fetchGlobalRanking, type RankingEntry } from '../../services/progressRankingService';

const RankingTable: React.FC = () => {
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRanking = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetchGlobalRanking(50);
                setRanking(response.ranking);
            } catch (err) {
                console.error('Error loading ranking:', err);
                setError('Failed to load ranking');
            } finally {
                setLoading(false);
            }
        };

        loadRanking();
    }, []);

    const getRankClass = (rank: number) => {
        if (rank === 1) return styles.rank1;
        if (rank === 2) return styles.rank2;
        if (rank === 3) return styles.rank3;
        return '';
    };

    const formatScore = (score: number) => {
        return score.toLocaleString();
    };

    const getPetImage = (petType: string | null, petStage: number | null) => {
        if (!petType || !petStage) return '/images/pets/nav-pet-1.png'; // Default pet image
        return `/images/pets/pet-${petType}-${petStage}.png`;
    };

    if (loading) {
        return (
            <div className={styles.ranking__container}>
                <div className={styles.ranking__header}>
                    <h2>Progress Ranking</h2>
                </div>
                <div className={styles.loading}>Loading ranking...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.ranking__container}>
                <div className={styles.ranking__header}>
                    <h2>Progress Ranking</h2>
                </div>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.ranking__container}>
            <div className={styles.ranking__header}>
                <h2>Progress Ranking</h2>
            </div>

            {ranking.length === 0 ? (
                <div className={styles.empty}>No progress data available yet</div>
            ) : (
                <div className={styles.ranking__list}>
                    {ranking.map((entry) => (
                        <div
                            key={`${entry.userId}-${entry.rank}`}
                            className={`${styles.ranking__entry} ${entry.rank <= 3 ? styles.top3 : ''}`}
                        >
                            {/* Pet */}
                            <div className={styles.pet__container}>
                                <img 
                                    src={getPetImage(entry.petType, entry.petStage)} 
                                    alt="Pet" 
                                    className={`${styles.pet__image} ${entry.petType === '1' ? styles.pet__mirrored : ''}`}
                                />
                            </div>

                            {/* Rank y Nombre */}
                            <div className={styles.player__info}>
                                <div className={`${styles.rank} ${getRankClass(entry.rank)}`}>
                                    {entry.rank <= 3 ? (
                                        entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'
                                    ) : (
                                        `#${entry.rank}`
                                    )}
                                </div>
                                <div className={styles.player__name}>{entry.rankedName}</div>
                            </div>

                            {/* Wins */}
                            <div className={styles.stat__box}>
                                <div className={styles.stat__label}>WINS</div>
                                <div className={styles.stat__value}>{entry.winsGained}</div>
                            </div>

                            {/* Masteries */}
                            <div className={styles.stat__box}>
                                <div className={styles.stat__label}>MASTERIES</div>
                                <div className={styles.stat__value}>{entry.masteryLevelsGained}</div>
                            </div>

                            {/* Honor */}
                            <div className={styles.stat__box}>
                                <div className={styles.stat__label}>HONOR</div>
                                <div className={styles.stat__value}>{entry.honorGained}</div>
                            </div>

                            {/* Levels */}
                            <div className={styles.stat__box}>
                                <div className={styles.stat__label}>LEVELS</div>
                                <div className={styles.stat__value}>{entry.levelGained}</div>
                            </div>

                            {/* Member (Level 30 Bonus Count) */}
                            <div className={styles.stat__box}>
                                <div className={styles.stat__label}>MEMBER</div>
                                <div className={styles.stat__value}>
                                    {entry.level30BonusCount > 0 ? (
                                        <span className={styles.bonus__count}>{entry.level30BonusCount}</span>
                                    ) : (
                                        entry.level30BonusCount
                                    )}
                                </div>
                            </div>

                            {/* Elo (Divisiones progresadas) */}
                            <div className={styles.stat__box}>
                                <div className={styles.stat__label}>ELO</div>
                                <div className={styles.stat__value}>{entry.eloDivisionsGained}</div>
                            </div>

                            {/* Score Total */}
                            <div className={styles.score__container}>
                                <div className={styles.score__value}>{formatScore(entry.totalProgressScore)}</div>
                                <div className={styles.score__label}>SCORE</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RankingTable;
