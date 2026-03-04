import React, { useState, useEffect } from 'react';
import styles from './Champions.module.scss';
import { fetchChampions, type Champion, getRiotIdForChampion } from '../../services/championsService';
import { type MasteryData } from '../../services/apiMasteriesService';
import { masteryCacheService } from '../../services/masteryCacheService';
import { getEssencerList, getEssencerFavorites, saveEssencerFavorites } from '../../services/favoritesService';
import AchievementPopup from '../../components/AchievementPopup';
import CacheStatus from '../../components/CacheStatus/CacheStatus';
import { useAuthContext } from '../../contexts/AuthContext';
import { playClickSound } from '../../utils/soundUtils';

interface EssencerData {
    name: string;
    favorites: number[];
    totalMastery: number;
}

type ViewState = 'list' | 'essencer' | 'selector';

const Champions: React.FC = () => {
    const { user } = useAuthContext();
    const [champions, setChampions] = useState<Champion[]>([]);
    const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
    const [masteryData, setMasteryData] = useState<MasteryData[]>([]);
    const [essencers, setEssencers] = useState<EssencerData[]>([]);
    const [selectedEssencer, setSelectedEssencer] = useState<string | null>(null);
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
                const rankedsData = await rankedsResponse.json();

                setChampions(championsData);
                setMasteryData(masteriesData);

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
                        <button className={styles.back__button} onClick={goBack}>
                            Back
                        </button>
                        <h2 className={styles.essencer__title}>{currentEssencer.name}</h2>
                        <button className={styles.champions__button} onClick={openChampionSelector}>
                            Champions
                        </button>
                    </div>

                    <div className={styles.essencer__content}>
                        <div className={styles.stats__row}>
                            <div className={styles.total__masteries__container}>
                                <img
                                    src="/images/frames/account-ranking-position-frame.png"
                                    alt="Masteries frame"
                                    className={styles.total__masteries__frame}
                                />
                                <span className={styles.total__masteries__text}>
                                    {currentEssencer.totalMastery}
                                </span>
                            </div>
                        </div>

                        <div className={styles.favorites__grid}>
                            {currentEssencer.favorites.map(champId => (
                                <div key={champId} className={styles.favorite__card}>
                                    <img
                                        src={getChampionImage(champId)}
                                        alt="Champion"
                                        className={styles.favorite__card__img}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/bg/bg.png';
                                        }}
                                    />
                                </div>
                            ))}
                            {currentEssencer.favorites.length === 0 && (
                                <div className={styles.no__favorites__message}>
                                    <p>No favorite champions yet</p>
                                    <p>Click "Champions" to add some!</p>
                                </div>
                            )}
                        </div>
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
