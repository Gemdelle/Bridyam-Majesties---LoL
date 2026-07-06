import React, { useState, useEffect } from 'react';
import styles from './Champions.module.scss';
import { fetchChampions, type Champion, getRiotIdForChampion } from '../../services/championsService';
import { type MasteryData } from '../../services/apiMasteriesService';
import { masteryCacheService } from '../../services/masteryCacheService';
import { getEssencerList, getEssencerFavorites, saveEssencerFavorites, loadFavoritesFromFile } from '../../services/favoritesService';
import ChampionProgress from '../../components/ChampionProgress/ChampionProgress';
import CacheStatus from '../../components/CacheStatus/CacheStatus';
import { playClickSound } from '../../utils/soundUtils';

interface RankedAccount {
    id: number;
    name: string;
    username: string;
    essencer?: string;
    icon?: string;
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
    isOwned: boolean;
}

type ViewState = 'list' | 'essencer' | 'selector';
type ListMode = 'essencer' | 'account';

interface TopChampion {
    championId: number;
    masteryLevel: number;
}

interface AccountMajestyPortraitProps {
    portraitSrc: string;
    profileIcon?: string;
}

const AccountMajestyPortrait: React.FC<AccountMajestyPortraitProps> = ({ portraitSrc, profileIcon }) => {
    const [src, setSrc] = useState(portraitSrc);
    const [isProfile, setIsProfile] = useState(false);

    useEffect(() => {
        setSrc(portraitSrc);
        setIsProfile(false);
    }, [portraitSrc]);

    const handleError = () => {
        if (!isProfile && profileIcon) {
            setIsProfile(true);
            setSrc(profileIcon);
            return;
        }
        setSrc('/images/bg/bg.png');
    };

    return (
        <div className={styles.account__card__portrait__wrap}>
            <div className={`${styles.account__card__portrait__slot} ${isProfile ? styles.account__card__portrait__slot__profile : ''}`}>
                <img
                    src={src}
                    alt="Majesty"
                    className={styles.account__card__portrait}
                    onError={handleError}
                />
                {isProfile && (
                    <img
                        src="/images/frames/account-champion-frame.png"
                        alt=""
                        className={styles.account__card__portrait__frame}
                        aria-hidden="true"
                    />
                )}
            </div>
        </div>
    );
};

const Champions: React.FC = () => {
    const [champions, setChampions] = useState<Champion[]>([]);
    const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
    const [masteryData, setMasteryData] = useState<MasteryData[]>([]);
    const [essencers, setEssencers] = useState<EssencerData[]>([]);
    const [rankedAccounts, setRankedAccounts] = useState<RankedAccount[]>([]);
    const [selectedEssencer, setSelectedEssencer] = useState<string | null>(null);
    const [selectedChampion, setSelectedChampion] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [accountSearchTerm, setAccountSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewState, setViewState] = useState<ViewState>('list');
    const [listMode, setListMode] = useState<ListMode>('account');
    const [, setMasteryUpdateTrigger] = useState(0); // Force re-render on mastery change

    // Load data function (reusable)
    const loadData = async () => {
        try {
            setLoading(true);

            // Don't invalidate cache - keep local changes

            const [championsData, masteriesData, essencerNames] = await Promise.all([
                fetchChampions(),
                masteryCacheService.getMasteries(),
                getEssencerList(),
                loadFavoritesFromFile() // Load favorites from JSON file
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
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Reload data when page becomes visible (coming back from another tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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

    // Get favorites sorted by total mastery (highest first)
    const getSortedFavorites = (): number[] => {
        if (!currentEssencer) return [];
        
        return [...currentEssencer.favorites].sort((a, b) => {
            const statsA = getChampionMasteryStats(a);
            const statsB = getChampionMasteryStats(b);
            return statsB.current - statsA.current;
        });
    };

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

    const getMajestyPortraitSrc = (account: RankedAccount): string =>
        `/images/portraits/${cleanAccountName(account.username || account.name)}.png`;

    // Get top 3 champions by mastery for an account
    const getTopChampionsForAccount = (accountId: number): TopChampion[] => {
        const accountMasteries = masteryData
            .filter(m => m.ranked_id === accountId && (m.champion_level ?? 0) > 0)
            .sort((a, b) => (b.champion_level ?? 0) - (a.champion_level ?? 0))
            .slice(0, 3);

        return accountMasteries.map(m => ({
            championId: m.champion_id,
            masteryLevel: m.champion_level ?? 0
        }));
    };

    // Get champion image URL by riot ID
    const getChampionImageByRiotId = (riotId: number): string => {
        const champion = champions.find(c => {
            const champRiotId = getRiotIdForChampion(c.id);
            return champRiotId === riotId;
        });
        if (champion) {
            return `https://ddragon.leagueoflegends.com/cdn/14.20.1/img/champion/${champion.name.replace(/[^a-zA-Z]/g, '')}.png`;
        }
        return '/images/bg/bg.png';
    };

// Get mastery details for a champion across all accounts (including not owned)
    const getChampionMasteryDetails = (champId: number): ChampionMasteryDetail[] => {
        const riotId = getRiotIdForChampion(champId);
        const details: ChampionMasteryDetail[] = [];

        rankedAccounts.forEach(account => {
            const accountName = cleanAccountName(account.username || account.name);

            // Filter by account search term
            if (accountSearchTerm && !accountName.toLowerCase().includes(accountSearchTerm.toLowerCase())) {
                return;
            }

            const mastery = masteryData.find(m =>
                m.ranked_id === account.id && m.champion_id === riotId
            );

            const isOwned = mastery && (mastery.champion_level ?? -1) >= 0;
            
            details.push({
                rankedId: account.id,
                accountName,
                masteryLevel: mastery?.champion_level ?? 0,
                masteryPoints: mastery?.champion_points ?? 0,
                currentXP: mastery?.champion_points_since_last_level ?? 0,
                totalXP: (mastery?.champion_points_since_last_level ?? 0) + (mastery?.champion_points_until_next_level ?? 0),
                isOwned: !!isOwned
            });
        });

        // Sort: owned first (by mastery level descending), then not owned (alphabetically)
        return details.sort((a, b) => {
            if (a.isOwned && !b.isOwned) return -1;
            if (!a.isOwned && b.isOwned) return 1;
            if (a.isOwned && b.isOwned) return b.masteryLevel - a.masteryLevel;
            return a.accountName.localeCompare(b.accountName);
        });
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

    // Update mastery level for a specific champion and account
const updateMasteryLevel = (rankedId: number, championId: number, delta: number) => {
        const riotId = getRiotIdForChampion(championId);
        const masteryIndex = masteryData.findIndex(m =>
            m.ranked_id === rankedId && m.champion_id === riotId
        );

        let newLevel: number;

        if (masteryIndex !== -1) {
            const currentLevel = masteryData[masteryIndex].champion_level ?? 0;
            newLevel = Math.max(0, Math.min(10, currentLevel + delta));
            masteryData[masteryIndex].champion_level = newLevel;
        } else {
            // Create new mastery entry if it doesn't exist
            newLevel = Math.max(0, Math.min(10, delta));
            const account = rankedAccounts.find(a => a.id === rankedId);
            masteryData.push({
                id: null,
                ranked_id: rankedId,
                username: account?.username || account?.name || '',
                champion_id: riotId,
                champion_level: newLevel,
                champion_points: 0,
                champion_points_since_last_level: 0,
                champion_points_until_next_level: 0,
                chest_granted: false,
                last_play_time: new Date().toISOString()
            });
        }

// Force re-render
            setMasteryUpdateTrigger(prev => prev + 1);
            
            // Update essencers total mastery
            setEssencers(prev => prev.map(e => {
                const favorites = getEssencerFavorites(e.name);
                let totalMastery = 0;
                favorites.forEach(champId => {
                    const rid = getRiotIdForChampion(champId);
                    masteryData.forEach(m => {
                        if (m.champion_id === rid) {
                            totalMastery += m.champion_level || 0;
                        }
                    });
                });
                return { ...e, totalMastery };
            }));
            
// Build masteries in the correct format for the JSON file
            const masteriesByAccount: Record<number, { champion_id: number; champion_level: number; champion_points: number }[]> = {};
            masteryData.forEach(m => {
                if (!masteriesByAccount[m.ranked_id]) {
                    masteriesByAccount[m.ranked_id] = [];
                }
                masteriesByAccount[m.ranked_id].push({
                    champion_id: m.champion_id,
                    champion_level: m.champion_level ?? 0,
                    champion_points: m.champion_points ?? 0
                });
            });

            // Convert to array format matching masteries.json structure
            const masteriesArray = rankedAccounts.map(account => ({
                ranked_id: account.id,
                username: account.username || account.name,
                masteries: masteriesByAccount[account.id] || []
            })).filter(acc => acc.masteries.length > 0);

            // Save to JSON file via Vite dev server
            fetch('/api/save-masteries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(masteriesArray)
            })
                .then(res => {
                    if (res.ok) {
                        console.log('%c✅ Masteries saved to JSON file!', 'color: #90EE90; font-weight: bold;');
                    } else {
                        console.log('%c⚠️ Could not save to file (dev server only)', 'color: #FFA500;');
                    }
                })
                .catch(() => {
                    console.log('%c⚠️ Could not save to file (dev server only)', 'color: #FFA500;');
                });
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

            {/* VIEW 1: List view with mode selector */}
            {viewState === 'list' && (
                <div className={`${styles.container} ${styles.list__container}`}>
                    <div className={styles.list__layout}>
                        <div className={styles.mode__tabs}>
                            <button
                                type="button"
                                className={`${styles.mode__tab} ${listMode === 'account' ? styles.mode__tab__active : ''}`}
                                onClick={() => {
                                    playClickSound();
                                    setListMode('account');
                                }}
                            >
                                Account
                            </button>
                            <button
                                type="button"
                                className={`${styles.mode__tab} ${listMode === 'essencer' ? styles.mode__tab__active : ''}`}
                                onClick={() => {
                                    playClickSound();
                                    setListMode('essencer');
                                }}
                            >
                                Essencer
                            </button>
                        </div>

                        <div className={`${styles.content} ${styles.list__content}`}>
                            {listMode === 'essencer' && (
                                <>
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
                                </>
                            )}

                            {listMode === 'account' && (
                            <div className={styles.accounts__grid}>
                                {rankedAccounts.map(account => {
                                    const topChampions = getTopChampionsForAccount(account.id);
                                    return (
                                        <div key={account.id} className={styles.account__card}>
                                            <span className={styles.account__card__name}>
                                                {cleanAccountName(account.username || account.name)}
                                            </span>
                                            <span className={styles.account__card__essencer}>
                                                {account.essencer || '-'}
                                            </span>
                                            <AccountMajestyPortrait
                                                portraitSrc={getMajestyPortraitSrc(account)}
                                                profileIcon={account.icon}
                                            />
                                            <div className={styles.account__card__champions}>
                                                {topChampions.length > 0 ? (
                                                    topChampions.map((champ, idx) => (
                                                        <div key={idx} className={styles.top__champion}>
                                                            <img
                                                                src={getChampionImageByRiotId(champ.championId)}
                                                                alt="Champion"
                                                                className={styles.top__champion__img}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/images/bg/bg.png';
                                                                }}
                                                            />
                                                            <span className={styles.top__champion__mastery}>
                                                                {champ.masteryLevel}
                                                            </span>
                                                            <img
                                                                src={`/images/masteries/badges/${Math.min(champ.masteryLevel, 10)}.png`}
                                                                alt={`Mastery ${champ.masteryLevel}`}
                                                                className={styles.top__champion__badge}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/images/masteries/badges/0.png';
                                                                }}
                                                            />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className={styles.no__champions}>-</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        </div>
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
                            <div className={styles.search__container}>
                                <input
                                    type="text"
                                    placeholder="Search accounts..."
                                    value={accountSearchTerm}
                                    onChange={(e) => setAccountSearchTerm(e.target.value)}
                                    className={styles.search__input}
                                />
                            </div>
                        </div>
                        
                        {/* Champions grid in header - sorted by mastery */}
                        <div className={styles.favorites__grid}>
                            {getSortedFavorites().map(champId => {
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
                                            editable={true}
                                            isOwned={detail.isOwned}
                                            onMasteryChange={(delta) => updateMasteryLevel(detail.rankedId, selectedChampion, delta)}
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

            <CacheStatus />
        </div>
    );
};

export default Champions;
