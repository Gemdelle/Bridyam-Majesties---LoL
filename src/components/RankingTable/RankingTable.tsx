import React, { useState, useEffect } from 'react';
import styles from './RankingTable.module.scss';
import { fetchGlobalRanking, type RankingEntry } from '../../services/progressRankingService';
import { assetUrl } from '../../utils/assetUrl';
import { trophyAsset } from '../../services/gardenService';

const PODIUM_SPARKLES: Record<number, string[]> = {
    0: ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'ml', 'mr', 'tml', 'tmr'],
    1: ['tl', 'tr', 'bl', 'br', 'tm'],
    2: ['tl', 'tr', 'bm'],
};

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

    const getPetImage = (petType: string | null, petStage: number | null): string | null => {
        // Validar petType (debe ser "1", "2", "3", "4", no "0")
        if (!petType || petType === '0' || !['1', '2', '3', '4'].includes(petType)) {
            return null; // No mostrar pet si no es válido
        }

        // Validar petStage (debe ser 1, 2, o 3)
        if (!petStage || petStage < 1 || petStage > 3) {
            return null; // No mostrar pet si la etapa no es válida
        }

        return assetUrl(`images/pets/pet-${petType}-${petStage}.png`);
    };

    // Thresholds for each category based on elo values
    // Format: { bronze: value, vesuvianite: value, silver: value, diamond: value }
    const categoryThresholds: Record<string, { bronze: number; vesuvianite: number; silver: number; diamond: number }> = {
        eloDivisionsGained: { bronze: 1, vesuvianite: 3, silver: 10, diamond: 25 },
        masteryLevelsGained: { bronze: 3, vesuvianite: 10, silver: 25, diamond: 50 },
        winsGained: { bronze: 3, vesuvianite: 15, silver: 30, diamond: 75 },
        levelGained: { bronze: 1, vesuvianite: 15, silver: 40, diamond: 75 },
        honorGained: { bronze: 1, vesuvianite: 3, silver: 8, diamond: 12 },
        redeemCount: { bronze: 1, vesuvianite: 3, silver: 5, diamond: 8 },
        level30BonusCount: { bronze: 0, vesuvianite: 1, silver: 2, diamond: 3 }
    };

    // Obtiene el tier de icono basado en el valor real de la categoría
    const getCategoryTier = (entry: RankingEntry, category: keyof RankingEntry): string => {
        const categoryValue = entry[category] as number;

        // Si el valor de la categoría es 0 o menor, siempre retornar bronze
        if (categoryValue <= 0) {
            return 'bronze';
        }

        const thresholds = categoryThresholds[category as string];
        if (!thresholds) {
            // Fallback a bronze si no hay thresholds definidos
            return 'bronze';
        }

        // Determinar el tier basándose en los umbrales
        if (categoryValue >= thresholds.diamond) {
            return 'diamond';
        } else if (categoryValue >= thresholds.silver) {
            return 'silver';
        } else if (categoryValue >= thresholds.vesuvianite) {
            return 'vesuvianite';
        } else {
            return 'bronze';
        }
    };

    // Helper function to render score as images (small digit assets)
    const renderScoreAsImages = (score: number) => {
        const scoreString = score.toString();
        return scoreString.split('').map((digit, index) => (
            <img
                key={index}
                src={`/images/numbers/${digit}.png`}
                alt={digit}
                className={styles.rank__score__digit}
            />
        ));
    };

    const formatEssencerName = (name: string) => {
        const raw = String(name || '').trim();
        if (!raw) return '';
        // Title case reads better with italic serif names
        return raw
            .toLowerCase()
            .replace(/\b([a-zÁÉÍÓÚÑÜáéíóúñü])/g, (c) => c.toUpperCase());
    };

    const renderRankingRow = (entry: RankingEntry, rowClass: string) => {
        const winTier = getCategoryTier(entry, 'winsGained');
        const masteryTier = getCategoryTier(entry, 'masteryLevelsGained');
        const levelTier = getCategoryTier(entry, 'levelGained');
        const eloTier = getCategoryTier(entry, 'eloDivisionsGained');
        const redeemTier = getCategoryTier(entry, 'redeemCount');
        const rankIndex = Math.max(0, entry.rank - 1);
        const sparklePos = PODIUM_SPARKLES[rankIndex] || [];

        return (
            <div className={rowClass} key={entry.userId}>
                {/* ESSENCER */}
                <div className={styles.essencer__description}>
                    <div className={styles.essencer__info}>
                        <div className={styles.essencer__info__rank}>
                            <div className={styles.rank__trophyWrap}>
                                <img
                                    src={trophyAsset(rankIndex)}
                                    alt={`#${entry.rank}`}
                                    className={styles.rank__trophy}
                                />
                                {sparklePos.map((pos) => (
                                    <span
                                        key={pos}
                                        className={styles.rank__trophySparkle}
                                        data-pos={pos}
                                        aria-hidden
                                    />
                                ))}
                            </div>
                            <div className={styles.rank__text}>
                                <span className={styles.rank__name}>
                                    {formatEssencerName(entry.rankedName || '')}
                                </span>
                                <div className={styles.rank__score}>
                                    {renderScoreAsImages(entry.totalProgressScore)}
                                </div>
                            </div>
                            {getPetImage(entry.petType, entry.petStage) && (
                                <div className={styles.rank__petWrap}>
                                    <img
                                        src={getPetImage(entry.petType, entry.petStage)!}
                                        alt="Pet"
                                        className={[
                                            styles.rank__pet,
                                            entry.petType === '2' ? styles.pet__type2 : '',
                                            entry.rank === 1 ? styles.rank__petJump : '',
                                        ].filter(Boolean).join(' ')}
                                    />
                                    {entry.rank === 1 && (
                                        <div className={styles.rank__hearts} aria-hidden>
                                            <img src="/images/icons/love-icon-1.png" alt="" className={`${styles.rank__heart} ${styles.rank__heart1}`} />
                                            <img src="/images/icons/love-icon-2.png" alt="" className={`${styles.rank__heart} ${styles.rank__heart2}`} />
                                            <img src="/images/icons/love-icon-3.png" alt="" className={`${styles.rank__heart} ${styles.rank__heart3}`} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PROGRESS */}
                <div className={styles.achievements__container}>
                    {/* REDEEM */}
                    <div className={`${styles.achievement__container} ${styles[`achievement__${redeemTier}`]}`}>
                        <img
                            src={`/images/ranking/${redeemTier}/${redeemTier}-redeem.png`}
                            alt="Redeem"
                            onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/100x100/c89b3c/1a1a1a?text=REDEEM';
                            }}
                        />
                        <div className={styles.achievement__stats}>
                            <span className={styles.achievement__gained}>{entry.redeemCount || 0}</span>
                            <span className={styles.achievement__score}>{entry.redeemScore > 0 ? entry.redeemScore : ''}</span>
                        </div>
                    </div>
                    {/* WIN */}
                    <div className={`${styles.achievement__container} ${styles[`achievement__${winTier}`]}`}>
                        <img src={`/images/ranking/${winTier}/${winTier}-win.png`} alt="Win" />
                        <div className={styles.achievement__stats}>
                            <span className={styles.achievement__gained}>{entry.winsGained}</span>
                            <span className={styles.achievement__score}>{entry.winsScore > 0 ? entry.winsScore : ''}</span>
                        </div>
                    </div>
                    {/* MASTERY */}
                    <div className={`${styles.achievement__container} ${styles[`achievement__${masteryTier}`]}`}>
                        <img src={`/images/ranking/${masteryTier}/${masteryTier}-mastery.png`} alt="Mastery" />
                        <div className={styles.achievement__stats}>
                            <span className={styles.achievement__gained}>{entry.masteryLevelsGained}</span>
                            <span className={styles.achievement__score}>{entry.masteryScore > 0 ? entry.masteryScore : ''}</span>
                        </div>
                    </div>
                    {/* LEVEL */}
                    <div className={`${styles.achievement__container} ${styles.achievement__level} ${styles[`achievement__${levelTier}`]}`}>
                        <img src={`/images/ranking/${levelTier}/${levelTier}-level.png`} alt="Level" />
                        <div className={styles.achievement__stats}>
                            <span className={styles.achievement__gained}>{entry.levelGained}</span>
                            <span className={styles.achievement__score}>{entry.levelScore > 0 ? entry.levelScore : ''}</span>
                        </div>
                    </div>
                    {/* ELO */}
                    <div className={`${styles.achievement__container} ${styles[`achievement__${eloTier}`]}`}>
                        <img src={`/images/ranking/${eloTier}/${eloTier}-elo.png`} alt="Elo" />
                        <div className={styles.achievement__stats}>
                            <span className={styles.achievement__gained}>{entry.eloDivisionsGained}</span>
                            <span className={styles.achievement__score}>{entry.eloScore > 0 ? entry.eloScore : ''}</span>
                        </div>
                    </div>
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
            {/* DATA ROWS */}
            {ranking.map((entry) => {
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

export default RankingTable;
