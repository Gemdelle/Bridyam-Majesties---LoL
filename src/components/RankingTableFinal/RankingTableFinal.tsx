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

    const getRankTier = (rank: number): string => {
        if (rank === 1) return 'tourmaline';
        if (rank === 2) return 'diamond';
        if (rank === 3) return 'silver';
        return 'bronze';
    };

    const formatScore = (score: number) => {
        return score.toLocaleString();
    };

    const getPetImage = (petType: string | null, petStage: number | null) => {
        if (!petType || !petStage) return '/images/pets/nav-pet-1.png';
        return `/images/pets/pet-${petType}-${petStage}.png`;
    };

    // Calcula la posición de un usuario en una categoría específica
    const getCategoryRank = (entry: RankingEntry, category: keyof RankingEntry): number => {
        const sortedByCategory = [...ranking].sort((a, b) => {
            const aValue = a[category] as number;
            const bValue = b[category] as number;
            return bValue - aValue; // Orden descendente
        });
        
        return sortedByCategory.findIndex(e => e.userId === entry.userId) + 1;
    };

    // Obtiene el tier de icono basado en la posición en la categoría específica
    const getCategoryTier = (entry: RankingEntry, category: keyof RankingEntry): string => {
        const categoryRank = getCategoryRank(entry, category);
        return getRankTier(categoryRank);
    };

    const renderRankingRow = (entry: RankingEntry, rowClass: string) => {
        const winTier = getCategoryTier(entry, 'winsGained');
        const masteryTier = getCategoryTier(entry, 'masteryLevelsGained');
        const honorTier = getCategoryTier(entry, 'honorGained');
        const levelTier = getCategoryTier(entry, 'levelGained');
        const memberTier = getCategoryTier(entry, 'level30BonusCount');
        const eloTier = getCategoryTier(entry, 'eloDivisionsGained');
        
        return (
            <div className={rowClass} key={entry.userId}>
                {/* DESCRIPTION */}
                <div className={styles.essencer__description}>
                    <img src={getPetImage(entry.petType, entry.petStage)} alt="Pet" />
                    <div className={styles.essencer__info}>
                        <div className={styles.essencer__info__rank}>
                            <h2>{entry.rank}</h2>
                            <span>{entry.rankedName}</span>
                        </div>
                    </div>
                </div>

                {/* PROGRESS */}
                <div className={styles.achievements__container}>
                    {/* WIN */}
                    <div className={styles.achievement__container}>
                        <img src={`/images/ranking/${winTier}/${winTier}-win.png`} alt="Win" />
                        <span>{entry.winsGained}</span>
                    </div>
                    {/* MASTERY */}
                    <div className={styles.achievement__container}>
                        <img src={`/images/ranking/${masteryTier}/${masteryTier}-mastery.png`} alt="Mastery" />
                        <span>{entry.masteryLevelsGained}</span>
                    </div>
                    {/* HONOR */}
                    <div className={styles.achievement__container}>
                        <img src={`/images/ranking/${honorTier}/${honorTier}-honor.png`} alt="Honor" />
                        <span>{entry.honorGained}</span>
                    </div>
                    {/* LEVEL */}
                    <div className={styles.achievement__container}>
                        <img src={`/images/ranking/${levelTier}/${levelTier}-level.png`} alt="Level" />
                        <span>{entry.levelGained}</span>
                    </div>
                    {/* MEMBER */}
                    <div className={styles.achievement__container}>
                        <img src={`/images/ranking/${memberTier}/${memberTier}-member.png`} alt="Member" />
                        <span>{entry.level30BonusCount}</span>
                    </div>
                    {/* ELO */}
                    <div className={styles.achievement__container}>
                        <img src={`/images/ranking/${eloTier}/${eloTier}-elo.png`} alt="Elo" />
                        <span>{entry.eloDivisionsGained}</span>
                    </div>
                </div>

                {/* TOTAL */}
                <div className={styles.total__container}>
                    <span>{formatScore(entry.totalProgressScore)}</span>
                </div>
            </div>
        );
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
            {/* HEADER */}
            <div className={styles.ranking__header__row}>
                <div className={styles.header__description}>
                    <span>RANK</span>
                </div>
                <div className={styles.header__achievements}>
                    <div className={styles.header__achievement}>
                        <span>WIN</span>
                    </div>
                    <div className={styles.header__achievement}>
                        <span>MASTERY</span>
                    </div>
                    <div className={styles.header__achievement}>
                        <span>HONOR</span>
                    </div>
                    <div className={styles.header__achievement}>
                        <span>LEVEL</span>
                    </div>
                    <div className={styles.header__achievement}>
                        <span>MEMBER</span>
                    </div>
                    <div className={styles.header__achievement}>
                        <span>ELO</span>
                    </div>
                </div>
                <div className={styles.header__total}>
                    <span>SCORE</span>
                </div>
            </div>

            {/* DATA ROWS */}
            {ranking.map((entry, index) => {
                let rowClass = styles.essencer__default;
                
                if (entry.rank === 1) {
                    rowClass = styles.essencer__first;
                } else if (entry.rank === 2) {
                    rowClass = styles.essencer__second;
                } else if (entry.rank === 3) {
                    rowClass = styles.essencer__third;
                }
                
                return renderRankingRow(entry, rowClass);
            })}
        </div>
    );
};

export default RankingTableFinal;
