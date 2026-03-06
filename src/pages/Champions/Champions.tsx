import React, { useState, useEffect } from 'react';
import styles from './Champions.module.scss';
import { fetchChampions, type Champion, getRiotIdForChampion } from '../../services/championsService';
import { type MasteryData } from '../../services/apiMasteriesService';
import { masteryCacheService } from '../../services/masteryCacheService';
import { getEssencerList, getEssencerFavorites, saveEssencerFavorites, exportFavoritesToFile } from '../../services/favoritesService';
import AchievementPopup from '../../components/AchievementPopup';
import ChampionProgress from '../../components/ChampionProgress/ChampionProgress';
import CacheStatus from '../../components/CacheStatus/CacheStatus';
import { useAuthContext } from '../../contexts/AuthContext';
import { playClickSound } from '../../utils/soundUtils';

interface RankedAccount {
    id: number;
    name: string;
    username: string;
}

interface EssencerData {
    name: string;
    favorites: number[];
    totalMastery: number;
}

interface ChampionMasteryDetail {
    rankedId: number;
    accountName: string;
    masteryLevel: number;
    masteryPoints: number;
    currentXP: number;
    totalXP: number;
}

type ViewState = 'list' | 'essencer' | 'selector';

const Champions: React.FC = () => {
    const { user } = useAuthContext();
    const [champions, setChampions] = useState<Champion[]>([]);
    const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
    const [masteryData, setMasteryData] = useState<MasteryData[]>([]);
    const [essencers, setEssencers] = useState<EssencerData[]>([]);
    const [rankedAccounts, setRankedAccounts] = useState<RankedAccount[]>([]);
    const [selectedEssencer, setSelectedEssencer] = useState<string | null>(null);
    const [selectedChampion, setSelectedChampion] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAchievementPopup, setShowAchievementPopup] = useState(false);
    const [viewState, setViewState] = useState<ViewState>('list');

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                const [championsData, masteriesData, essencerNames] = await Promise.all([
                    fetchChampions(),
                    masteryCacheService.getMasteries(),
                    getEssencerList()
                ]);

                // Also load rankeds to calculate total mastery
                const rankedsResponse = await fetch('/data/rankeds.json');
                const rankedsData: RankedAccount[] = await rankedsResponse.json();

                setChampions(championsData);
                setMasteryData(masteriesData);
                setRankedAccounts(rankedsData);

                // Build essencer data with their favorites and total mastery
                const essencerDataList: EssencerData[] = essencerNames.map(name => {
                    const favorites = getEssencerFavorites(name);
                    
                    // Calculate total mastery from ALL accounts (sum of mastery levels for favorite champions)
                    let totalMastery = 0;
                    favorites.forEach(champId => {
                        const riotId = getRiotIdForChampion(champId);
                        rankedsData.forEach((ranked: { id: number }) => {
                            const mastery = masteriesData.find(m => 
                                m.ranked_id === ranked.id && m.champion_id === riotId
                            );
                            if (mastery) {
                                totalMastery += mastery.champion_level || 0;
                            }
                        });
                    });

                    return { name, favorites, totalMastery };
                });

                // Sort alphabetically
                essencerDataList.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

                setEssencers(essencerDataList);

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Filter champions for selector
    useEffect(() => {
        let filtered = champions;

        if (searchTerm) {
            filtered = filtered.filter(champion =>
                champion.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort: favorites first, then alphabetically
        if (selectedEssencer) {
            const favorites = getEssencerFavorites(selectedEssencer);
            filtered = filtered.sort((a, b) => {
                const aIsFav = favorites.includes(a.id);
                const bIsFav = favorites.includes(b.id);
                if (aIsFav && !bIsFav) return -1;
                if (!aIsFav && bIsFav) return 1;
                return a.name.localeCompare(b.name);
            });
        }

        setFilteredChampions(filtered);
    }, [champions, searchTerm, selectedEssencer]);

    // Toggle favorite for selected essencer
    const toggleFavorite = (championId: number) => {
        if (!selectedEssencer) return;

        const currentFavorites = getEssencerFavorites(selectedEssencer);
        let newFavorites: number[];

        if (currentFavorites.includes(championId)) {
            newFavorites = currentFavorites.filter(id => id !== championId);
        } else {
            newFavorites = [championId, ...currentFavorites];
        }

        saveEssencerFavorites(selectedEssencer, newFavorites);

        // Update essencers state
        setEssencers(prev => prev.map(e => {
            if (e.name === selectedEssencer) {
                // Recalculate total mastery
                let totalMastery = 0;
                newFavorites.forEach(champId => {
                    const riotId = getRiotIdForChampion(champId);
                    masteryData.forEach(m => {
                        if (m.champion_id === riotId) {
                            totalMastery += m.champion_level || 0;
                        }
                    });
                });
                return { ...e, favorites: newFavorites, totalMastery };
            }
            return e;
        }));
    };

    // Get champion image URL
    const getChampionImage = (champId: number): string => {
        const champ = champions.find(c => c.id === champId);
        if (!champ) return '/images/bg/bg.png';
        return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champ.name.replace(/['.\s]/g, '')}.png`;
    };

    // Select an essencer from the list
    const selectEssencer = (essencerName: string) => {
        playClickSound();
        setSelectedEssencer(essencerName);
        setViewState('essencer');
        
        // Auto-select first champion if available
        const favorites = getEssencerFavorites(essencerName);
        if (favorites.length > 0) {
            setSelectedChampion(favorites[0]);
        } else {
            setSelectedChampion(null);
        }
    };

    // Open champion selector
    const openChampionSelector = () => {
        playClickSound();
        setViewState('selector');
    };

    // Go back to previous view
    const goBack = () => {
        playClickSound();
        if (viewState === 'selector') {
            setViewState('essencer');
        } else if (viewState === 'essencer') {
            setSelectedEssencer(null);
            setViewState('list');
        }
    };

    // Get current essencer data
    const currentEssencer = essencers.find(e => e.name === selectedEssencer);

    // Clean account name (remove GEM prefix and #tag suffix)
    const cleanAccountName = (name: string): string => {
        let cleaned = name;
        // Remove "GEM " prefix
        if (cleaned.startsWith('GEM ')) {
            cleaned = cleaned.substring(4);
        }
        // Remove #tag suffix
        const hashIndex = cleaned.indexOf('#');
        if (hashIndex !== -1) {
            cleaned = cleaned.substring(0, hashIndex);
        }
        return cleaned;
    };

    // Get mastery details for a champion across all accounts
    const getChampionMasteryDetails = (champId: number): ChampionMasteryDetail[] => {
        const riotId = getRiotIdForChampion(champId);
        const details: ChampionMasteryDetail[] = [];

        rankedAccounts.forEach(account => {
            const mastery = masteryData.find(m => 
                m.ranked_id === account.id && m.champion_id === riotId
            );
            
            if (mastery && (mastery.champion_level ?? 0) > 0) {
                details.push({
                    rankedId: account.id,
                    accountName: cleanAccountName(account.username || account.name),
                    masteryLevel: mastery.champion_level || 0,
                    masteryPoints: mastery.champion_points || 0,
                    currentXP: mastery.champion_points_since_last_level || 0,
                    totalXP: (mastery.champion_points_since_last_level || 0) + (mastery.champion_points_until_next_level || 0)
                });
            }
        });

        // Sort by mastery level descending
        return details.sort((a, b) => b.masteryLevel - a.masteryLevel);
    };

    // Calculate total mastery and max possible for a champion
    const getChampionMasteryStats = (champId: number): { current: number; max: number } => {
        const riotId = getRiotIdForChampion(champId);
        let current = 0;
        let accountsWithMastery = 0;

        rankedAccounts.forEach(account => {
            const mastery = masteryData.find(m => 
                m.ranked_id === account.id && m.champion_id === riotId
            );
            const level = mastery?.champion_level ?? 0;
            if (level > 0) {
                current += level;
                accountsWithMastery++;
            }
        });

        // Max is 10 per account that has any mastery
        const max = accountsWithMastery * 10;
        return { current, max };
    };

    // Toggle selected champion for details view
    const toggleChampionDetails = (champId: number) => {
        playClickSound();
        if (selectedChampion === champId) {
            setSelectedChampion(null);
        } else {
            setSelectedChampion(champId);
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <p>Loading champions...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <button
                className={styles.achievement__button}
                onClick={() => {
                    playClickSound();
                    setShowAchievementPopup(true);
                }}
            >
                Achievement
            </button>

            {/* VIEW 1: List of essencers to select */}
            {viewState === 'list' && (
                <div className={styles.essencers__container}>
                    <h2 className={styles.section__title}>Select Essencer</h2>
                    
                    <button 
                        className={styles.export__button}
                        onClick={() => {
                            playClickSound();
                            exportFavoritesToFile();
                        }}
                    >
                        Export Favorites
                    </button>
                    
                    <div className={styles.essencers__grid}>
                        {essencers.map(essencer => (
                            <div
                                key={essencer.name}
                                className={styles.essencer__card}
                                onClick={() => selectEssencer(essencer.name)}
                            >
                                <span className={styles.essencer__card__name}>{essencer.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 2: Selected essencer's champions */}
            {viewState === 'essencer' && currentEssencer && (
                <div className={styles.essencer__view}>
                    <div className={styles.essencer__header}>
                        <div className={styles.header__left}>
                            <button className={styles.small__button} onClick={goBack}>
                                Back
                            </button>
                            <h2 className={styles.essencer__title}>{currentEssencer.name}</h2>
                            <button className={styles.small__button} onClick={openChampionSelector}>
                                Champions
                            </button>
                        </div>
                        
                        {/* Champions grid in header */}
                        <div className={styles.favorites__grid}>
                            {currentEssencer.favorites.map(champId => {
                                const stats = getChampionMasteryStats(champId);
                                const isSelected = selectedChampion === champId;
                                
                                return (
                                    <div
                                        key={champId}
                                        className={`${styles.favorite__card} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => toggleChampionDetails(champId)}
                                    >
                                        <img
                                            src={getChampionImage(champId)}
                                            alt="Champion"
                                            className={styles.favorite__card__img}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/images/bg/bg.png';
                                            }}
                                        />
                                        <img
                                            src="/images/frames/account-champion-frame.png"
                                            alt="Frame"
                                            className={styles.favorite__card__frame}
                                        />
                                        <span className={styles.favorite__card__stats}>
                                            {stats.current}/{stats.max}
                                        </span>
                                    </div>
                                );
                            })}
                            {currentEssencer.favorites.length === 0 && (
                                <span className={styles.no__favorites__inline}>No favorites</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.essencer__content}>
                        {/* Champion details list */}
                        {selectedChampion && (
                            <div className={styles.champion__details__list}>
                                <div className={styles.details__scroll}>
                                    {getChampionMasteryDetails(selectedChampion).map((detail, index) => (
                                        <ChampionProgress
                                            key={detail.rankedId}
                                            championName={champions.find(c => c.id === selectedChampion)?.name || ''}
                                            championImage={getChampionImage(selectedChampion)}
                                            masteryLevel={detail.masteryLevel}
                                            masteryProgress={detail.totalXP > 0 ? Math.floor((detail.currentXP / detail.totalXP) * 100) : 0}
                                            currentXP={detail.currentXP}
                                            totalXP={detail.totalXP}
                                            championNumber={index + 1}
                                            accountName={cleanAccountName(detail.accountName)}
                                        />
                                    ))}
                                    {getChampionMasteryDetails(selectedChampion).length === 0 && (
                                        <p className={styles.no__mastery}>No mastery data for this champion</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW 3: Champion selector */}
            {viewState === 'selector' && (
                <div className={styles.container}>
                    <div className={styles.content__top}>
                        <div className={styles.selector__header}>
                            <h2 className={styles.selector__title}>
                                Select champions for {selectedEssencer}
                            </h2>
                        </div>
                        <div className={styles.actions__container}>
                            <div className={styles.search__container}>
                                <input
                                    type="text"
                                    placeholder="Search champions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={styles.search__input}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => {
                                            playClickSound();
                                            setSearchTerm('');
                                        }}
                                        className={styles.search__clear}
                                        type="button"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <button className={styles.back__button} onClick={goBack}>
                                Back
                            </button>
                        </div>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.champions__grid}>
                            {filteredChampions.map((champion) => {
                                const isFavorite = selectedEssencer 
                                    ? getEssencerFavorites(selectedEssencer).includes(champion.id)
                                    : false;
                                
                                return (
                                    <div
                                        key={champion.id}
                                        className={`${styles.champion__card} ${isFavorite ? styles.favorited : ''}`}
                                        onClick={() => toggleFavorite(champion.id)}
                                    >
                                        <img src="/images/frames/champion-frame.png" alt="Champion Frame" className={styles.champion__frame} />
                                        <button
                                            className={`${styles.favorite__button} ${isFavorite ? styles.favorited : ''}`}
                                        >
                                            {isFavorite ? '' : ''}
                                        </button>
                                        <div className={styles.champion__image}>
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.name.replace(/['.\s]/g, '')}.png`}
                                                alt={champion.name}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/images/bg/bg.png';
                                                }}
                                            />
                                        </div>
                                        <h3 className={styles.champion__name}>{champion.name}</h3>
                                    </div>
                                );
                            })}
                        </div>
                        {filteredChampions.length === 0 && (
                            <div className={styles.no__results}>
                                <p>No champions found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AchievementPopup
                isOpen={showAchievementPopup}
                onClose={() => setShowAchievementPopup(false)}
                category="REDEEM"
                elo="vesuvianite"
                progress={3}
                total={3}
                petType="1"
                petStage={1}
                userName={user?.name || 'beast'}
            />

            <CacheStatus />
        </div>
    );
};

export default Champions;
