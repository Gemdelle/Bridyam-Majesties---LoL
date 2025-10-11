import React, { useState, useEffect } from 'react';
import styles from './RankingTable.module.scss';
import { fetchGlobalRanking, type RankingEntry } from '../../services/progressRankingService';

const RankingTableFinal: React.FC = () => {
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
            <div className={styles.essencer__first}>
                {/* DESCRIPTION */}
                <div className={styles.essencer__description}>
                    <img src="/images/pets/pet-1-1.png" alt="Pet" />
                    <div className={styles.essencer__info}>
                        <div className={styles.essencer__info__rank}>
                            <h2>N</h2>
                            <span>NAME</span>
                        </div>
                    </div>
                </div>

                {/* PROGRESS */}
                <div className={styles.achievements__container}>
                    {/* ACHIEVEMENT 1 */}
                    <div className={styles.achievement__container}>
                        <h2>RANK</h2>
                        <img src="/images/achievement/achievement-1-1.png" alt="Achievement" />
                        <span>N</span>
                    </div>
                    {/* ACHIEVEMENT 2 */}
                    <div className={styles.achievement__container}>
                        <h2>RANK</h2>
                        <img src="/images/achievement/achievement-1-1.png" alt="Achievement" />
                        <span>N</span>
                    </div>
                    {/* ACHIEVEMENT 3 */}
                    <div className={styles.achievement__container}>
                        <h2>RANK</h2>
                        <img src="/images/achievement/achievement-1-1.png" alt="Achievement" />
                        <span>N</span>
                    </div>
                    {/* ACHIEVEMENT 4 */}
                    <div className={styles.achievement__container}>
                        <h2>RANK</h2>
                        <img src="/images/achievement/achievement-1-1.png" alt="Achievement" />
                        <span>N</span>
                    </div>
                    {/* ACHIEVEMENT 5 */}
                    <div className={styles.achievement__container}>
                        <h2>RANK</h2>
                        <img src="/images/achievement/achievement-1-1.png" alt="Achievement" />
                        <span>N</span>
                    </div>
                    {/* ACHIEVEMENT 6 */}
                    <div className={styles.achievement__container}>
                        <h2>RANK</h2>
                        <img src="/images/achievement/achievement-1-1.png" alt="Achievement" />
                        <span>N</span>
                    </div>
                </div>
                {/* TOTAL */}
                <div className={styles.total__container}>
                    <span>TOTAL</span>
                    <span>N</span>
                </div>
            </div>
            <div className={styles.essencer__second}></div>
            <div className={styles.essencer__third}></div>
            <div className={styles.essencer__default}></div>
            <div className={styles.essencer__default}></div>
            <div className={styles.essencer__default}></div>
        </div>
    );
};

export default RankingTableFinal;
