import React, { useState, useEffect } from 'react';
import styles from './Champions.module.scss';
import { fetchChampions, type Champion, getRiotIdForChampion } from '../../services/championsService';
import { AccountsService, type Account } from '../../services/accountsService';
import { type MasteryData } from '../../services/apiMasteriesService';
import { masteryCacheService } from '../../services/masteryCacheService';
import Filter, { type FilterOption } from '../../components/Filter/Filter';
import AchievementPopup from '../../components/AchievementPopup';
import ChampionProgress from '../../components/ChampionProgress/ChampionProgress';
import CacheStatus from '../../components/CacheStatus/CacheStatus';
import { useAuthContext } from '../../contexts/AuthContext';

const Champions: React.FC = () => {
    const { user } = useAuthContext();
    const [champions, setChampions] = useState<Champion[]>([]);
    const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
    const [userAccounts, setUserAccounts] = useState<Account[]>([]);
    const [masteryData, setMasteryData] = useState<MasteryData[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [selectedChampions, setSelectedChampions] = useState<string[]>([]);
    const [favoriteChampions, setFavoriteChampions] = useState<number[]>(() => {
        const saved = localStorage.getItem('favoriteChampions');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(true);
    const [showAchievementPopup, setShowAchievementPopup] = useState(false);
    const [showChampions, setShowChampions] = useState(false);

    // --- Estado para la paginación ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 28; // 28 champions per page (4 containers × 7 champions each)

    // Role filter options
    const roleOptions: FilterOption[] = [
        { id: 'all', label: 'All Roles' },
        { id: 'adc', label: 'ADC' },
        { id: 'jungle', label: 'Jungle' },
        { id: 'mid', label: 'Mid' },
        { id: 'support', label: 'Support' },
        { id: 'top', label: 'Top' }
    ];

    // Account filter options (based on user's claimed accounts filtered by rankedUsernames)
    const rankedUsernames = user?.rankedUsernames || [];
    const filteredAccountsForFilter = rankedUsernames.length > 0
        ? userAccounts.filter(acc => rankedUsernames.includes(acc.username))
        : userAccounts;
    
    const accountOptions: FilterOption[] = [
        { id: 'all', label: 'All Accounts' },
        ...filteredAccountsForFilter.map(account => ({
            id: account.username,
            label: account.username
        }))
    ];

    // Champion filter options (based on favorite champions)
    const championOptions: FilterOption[] = [
        { id: 'all', label: 'All Champions' },
        ...favoriteChampions.map(id => {
            const champion = champions.find(c => c.id === id);
            return champion ? { id: champion.id.toString(), label: champion.name } : null;
        }).filter((option): option is FilterOption => option !== null)
    ];

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('favoriteChampions', JSON.stringify(favoriteChampions));
    }, [favoriteChampions]);

    // Load champions and user accounts on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Load all data in parallel using shared cache
                const [championsData, accountsData, masteriesData] = await Promise.all([
                    fetchChampions(),
                    AccountsService.getInstance().getAccounts(),
                    masteryCacheService.getMasteries() // Use shared cache
                ]);

                setChampions(championsData);
                setUserAccounts(accountsData);
                setMasteryData(masteriesData);

            } catch (error) {
                console.error('Error loading data:', error);
                // Set mock data for development/testing
                setUserAccounts([
                    {
                        url: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/5413.png",
                        id: 19,
                        name: "Tryppy Troppy",
                        username: "GEM Damglantine#GEM",
                        champions: 84,
                        skins: 267,
                        masteries: 84,
                        solo_q_elo: "EMERALD 4",
                        roles: {
                            top: 45,
                            jungle: 78,
                            mid: 34,
                            adc: 67,
                            support: 45
                        },
                        blueEssence: 98760,
                        orangeEssence: 14560
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Filter champions based on role and search
    useEffect(() => {
        let filtered = champions;

        // Filter by role
        if (selectedRoles.length > 0 && !selectedRoles.includes('all')) {
            filtered = filtered.filter(champion =>
                champion.role && selectedRoles.includes(champion.role)
            );
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(champion =>
                champion.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort by search relevance first, then favorites
        filtered = filtered.sort((a, b) => {
            const aIsFavorite = favoriteChampions.includes(a.id);
            const bIsFavorite = favoriteChampions.includes(b.id);

            // If there's a search term, prioritize exact matches
            if (searchTerm) {
                const aExactMatch = a.name.toLowerCase() === searchTerm.toLowerCase();
                const bExactMatch = b.name.toLowerCase() === searchTerm.toLowerCase();
                const aStartsWith = a.name.toLowerCase().startsWith(searchTerm.toLowerCase());
                const bStartsWith = b.name.toLowerCase().startsWith(searchTerm.toLowerCase());

                // Exact matches first
                if (aExactMatch && !bExactMatch) return -1;
                if (!aExactMatch && bExactMatch) return 1;

                // Then matches that start with search term
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
            }

            // Then sort by favorites
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;

            // If both are favorites, maintain the order they were favorited
            if (aIsFavorite && bIsFavorite) {
                return favoriteChampions.indexOf(a.id) - favoriteChampions.indexOf(b.id);
            }

            return 0;
        });

        setFilteredChampions(filtered);
    }, [champions, selectedRoles, searchTerm, favoriteChampions]);

    // Toggle favorite champion
    const toggleFavorite = (championId: number) => {
        setFavoriteChampions(prev => {
            if (prev.includes(championId)) {
                // Remove from favorites
                return prev.filter(id => id !== championId);
            } else {
                // Add to favorites at the beginning (most recent first)
                return [championId, ...prev];
            }
        });
    };

    // Type for list items (accounts and champions)
    type ListItem = 
        | { type: 'account', account: Account }
        | { type: 'champion', champion: Champion, account: Account, masteryLevel: number, masteryProgress: number, masteryPoints: number, currentXP: number, totalXP: number };

    // Get all items without pagination (for counting purposes)
    const getAllItemsUnpaginated = (): ListItem[] => {
        // Filter accounts by user's rankedUsernames first
        const rankedUsernames = user?.rankedUsernames || [];
        const filteredAccountsByUser = rankedUsernames.length > 0
            ? userAccounts.filter(acc => rankedUsernames.includes(acc.username))
            : userAccounts;

        // Determine which accounts to use
        const accountsToUse = selectedAccounts.length > 0 && !selectedAccounts.includes('all')
            ? filteredAccountsByUser.filter(acc => selectedAccounts.includes(acc.username))
            : filteredAccountsByUser;

        // Get favorite champions
        let favoriteChampionsList = favoriteChampions
            .map(id => champions.find(champion => champion.id === id))
            .filter((champion): champion is Champion => champion !== undefined);

        // Apply role filter to favorite champions
        if (selectedRoles.length > 0 && !selectedRoles.includes('all')) {
            favoriteChampionsList = favoriteChampionsList.filter(champion =>
                champion.role && selectedRoles.includes(champion.role)
            );
        }

        // Apply search filter to favorite champions
        if (searchTerm) {
            favoriteChampionsList = favoriteChampionsList.filter(champion =>
                champion.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply champion filter to favorite champions
        if (selectedChampions.length > 0 && !selectedChampions.includes('all')) {
            favoriteChampionsList = favoriteChampionsList.filter(champion =>
                selectedChampions.includes(champion.id.toString())
            );
        }

        // Create a flat list alternating between account names and champions
        const itemsList: ListItem[] = [];

        accountsToUse.forEach((account) => {
            // Add account name as an item
            itemsList.push({ type: 'account', account });

            // Get champions with mastery data for this account
            const championsWithMastery = favoriteChampionsList
                .map((champion, index) => {
                    // Get real mastery data from cache for this specific account
                    const riotChampionId = getRiotIdForChampion(champion.id);
                    const mastery = masteryData.find(m => 
                        m.ranked_id === account.id && 
                        m.champion_id === riotChampionId
                    );

                    const masteryLevel = mastery?.champion_level || 0;
                    const masteryPoints = mastery?.champion_points || 0;
                    const pointsSinceLastLevel = mastery?.champion_points_since_last_level || 0;
                    const pointsUntilNextLevel = mastery?.champion_points_until_next_level || 0;

                    // Calculate progress percentage
                    const masteryProgress = pointsUntilNextLevel > 0 
                        ? Math.floor((pointsSinceLastLevel / (pointsSinceLastLevel + pointsUntilNextLevel)) * 100)
                        : 0;

                    return {
                        champion,
                        masteryLevel,
                        masteryProgress,
                        masteryPoints,
                        currentXP: pointsSinceLastLevel,
                        totalXP: pointsSinceLastLevel + pointsUntilNextLevel,
                        originalIndex: index,
                        account
                    };
                })
                .sort((a, b) => {
                    // Sort by mastery level descending, then by mastery points descending
                    if (b.masteryLevel !== a.masteryLevel) {
                        return b.masteryLevel - a.masteryLevel;
                    }
                    return b.masteryPoints - a.masteryPoints;
                });

            // Add champions for this account
            championsWithMastery.forEach((championData) => {
                itemsList.push({
                    type: 'champion',
                    champion: championData.champion,
                    account: account,
                    masteryLevel: championData.masteryLevel,
                    masteryProgress: championData.masteryProgress,
                    masteryPoints: championData.masteryPoints,
                    currentXP: championData.currentXP,
                    totalXP: championData.totalXP
                });
            });
        });

        return itemsList;
    };

    // Get all items (accounts + champions) for pagination
    const getAllItems = (): { items: ListItem[], totalPages: number } => {
        const itemsList = getAllItemsUnpaginated();

        // Calculate total pages based on items (28 items per page = 4 columns × 7 items)
        const totalPages = Math.ceil(itemsList.length / itemsPerPage);

        // Reset to page 1 if current page is out of bounds
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }

        // Get items for current page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageItems = itemsList.slice(startIndex, endIndex);

        return { items: currentPageItems, totalPages };
    };

    // Legacy function for backward compatibility (returns champions only for filtering logic)
    const getCurrentPageChampions = () => {
        const { items } = getAllItems();
        const championsFromItems = items
            .filter((item): item is Extract<ListItem, { type: 'champion' }> => item.type === 'champion')
            .map(item => item.champion);
        
        // Fill with nulls to maintain itemsPerPage size
        const likedChampions: (Champion | null)[] = [...championsFromItems];
        while (likedChampions.length < itemsPerPage) {
            likedChampions.push(null);
        }

        return { 
            champions: likedChampions, 
            totalPages: getAllItems().totalPages 
        };
    };

    const handlePageChange = (newPage: number) => {
        const { totalPages } = getCurrentPageChampions();
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
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
            {/* Temporary Achievement Button */}
            <button
                className={styles.achievement__button}
                onClick={() => setShowAchievementPopup(true)}
            >
                Achievement
            </button>

            {!showChampions ? (
                // Empty screen with Choose Champions button
                <div className={styles.empty__container}>
                    {/* Filters and Search for Favorites View */}
                    <div className={styles.content__top}>
                        <div className={styles.filters__container}>
                            <div className={styles.filters}>
                                <Filter
                                    title="ACCOUNT"
                                    options={accountOptions}
                                    selectedOptions={selectedAccounts}
                                    onSelectionChange={setSelectedAccounts}
                                />
                            </div>
                            <div className={styles.filters}>
                                <Filter
                                    title="CHAMPION"
                                    options={championOptions}
                                    selectedOptions={selectedChampions}
                                    onSelectionChange={setSelectedChampions}
                                />
                            </div>
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
                                        onClick={() => setSearchTerm('')}
                                        className={styles.search__clear}
                                        type="button"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <button
                                className={styles.choose__champions__button}
                                onClick={() => setShowChampions(true)}
                            >
                                Champions
                            </button>
                        </div>
                    </div>
                    <div className={styles.current_champions__container}>
                        
                        {(() => {
                            // Get paginated items for current page
                            const { items: currentPageItems } = getAllItems();

                            // Distribute items across 4 columns (each column gets up to 7 items)
                            // Fill each column completely from top to bottom, then move to next column (left to right)
                            // Column 0: items 0-6
                            // Column 1: items 7-13
                            // Column 2: items 14-20
                            // Column 3: items 21-27
                            return Array.from({ length: 4 }, (_, containerIndex) => {
                                const itemsPerColumn = 7;
                                const startIndex = containerIndex * itemsPerColumn;
                                const endIndex = startIndex + itemsPerColumn;
                                
                                // Get items for this column (7 items per column)
                                const columnItems = currentPageItems.slice(startIndex, endIndex);

                                return (
                                    <div
                                        key={`container-${containerIndex}`}
                                        className={styles.champion__container__item}
                                    >
                                        {columnItems.map((item, itemIndex) => {
                                            // Calculate the global index in the current page
                                            // Column 0: indices 0-6 (itemIndex 0-6)
                                            // Column 1: indices 7-13 (itemIndex 0-6, but globalIndex = 7 + itemIndex)
                                            // Column 2: indices 14-20 (itemIndex 0-6, but globalIndex = 14 + itemIndex)
                                            // Column 3: indices 21-27 (itemIndex 0-6, but globalIndex = 21 + itemIndex)
                                            const globalIndexInPage = startIndex + itemIndex;
                                            
                                            if (item.type === 'account') {
                                                return (
                                                    <div 
                                                        key={`account-${item.account.id}-${globalIndexInPage}`} 
                                                        className={styles.account__name}
                                                    >
                                                        <span className={styles.particle}></span>
                                                        <span className={styles.account__text}>
                                                            {item.account.username || 'No account selected'}
                                                        </span>
                                                        <span className={styles.particle}></span>
                                                    </div>
                                                );
                                            } else {
                                                const { champion, account, masteryLevel, masteryProgress, currentXP, totalXP } = item;
                                                const championImageUrl = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.name.replace(/['.\s]/g, '')}.png`;
                                                
                                                // Calculate the actual position in the full list (1-based)
                                                // Count only champions (not account names) for the numbering
                                                const allItemsList = getAllItemsUnpaginated();
                                                const pageStartIndex = (currentPage - 1) * itemsPerPage;
                                                const absoluteIndex = pageStartIndex + globalIndexInPage;
                                                let championNumber = 0;
                                                
                                                // Count champions from the beginning up to this champion's position
                                                for (let i = 0; i <= absoluteIndex; i++) {
                                                    if (allItemsList[i] && allItemsList[i].type === 'champion') {
                                                        championNumber++;
                                                    }
                                                }

                                                return (
                                                    <ChampionProgress
                                                        key={`champion-${champion.id}-${account.id}-${globalIndexInPage}`}
                                                        championName={champion.name}
                                                        championImage={championImageUrl}
                                                        masteryLevel={masteryLevel}
                                                        masteryProgress={masteryProgress}
                                                        currentXP={currentXP}
                                                        totalXP={totalXP}
                                                        championNumber={(currentPage - 1) * itemsPerPage + championNumber}
                                                        accountName={account.username || ""}
                                                    />
                                                );
                                            }
                                        })}
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* No results message */}
                    {(() => {
                        const { champions: currentChampions } = getCurrentPageChampions();
                        const hasChampions = currentChampions.some(champion => champion !== null);
                        const { totalPages } = getCurrentPageChampions();

                        if (!hasChampions && totalPages === 0) {
                            return (
                                <div className={styles.no__results}>
                                    <p>No favorite champions found matching your criteria.</p>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Pagination */}
                    <div className={styles.pagination}>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                            &lt; Previous
                        </button>
                        <span>Page {currentPage} of {getCurrentPageChampions().totalPages}</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === getCurrentPageChampions().totalPages}>
                            Next &gt;
                        </button>
                    </div>
                </div>
            ) : (
                // Champions interface
                <div className={styles.container}>
                    <div className={styles.content__top}>
                        <div className={styles.filters__container}>
                            <div className={styles.filters}>
                                <Filter
                                    title="ROLE"
                                    options={roleOptions}
                                    selectedOptions={selectedRoles}
                                    onSelectionChange={setSelectedRoles}
                                />
                            </div>
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
                                        onClick={() => setSearchTerm('')}
                                        className={styles.search__clear}
                                        type="button"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <button
                                className={styles.back__button}
                                onClick={() => setShowChampions(false)}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.champions__grid}>
                            {filteredChampions.map((champion) => (
                                <div
                                    key={champion.id}
                                    className={`${styles.champion__card} ${favoriteChampions.includes(champion.id) ? styles.favorited : ''}`}
                                >
                                    <img src="/images/frames/champion-frame.png" alt="Champion Frame" className={styles.champion__frame} />
                                    <button
                                        onClick={() => toggleFavorite(champion.id)}
                                        className={`${styles.favorite__button} ${favoriteChampions.includes(champion.id) ? styles.favorited : ''}`}
                                    >
                                        {favoriteChampions.includes(champion.id) ? '' : ''}
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
                            ))}
                        </div>
                        {filteredChampions.length === 0 && (
                            <div className={styles.no__results}>
                                <p>No champions found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Achievement Popup */}
            <AchievementPopup
                isOpen={showAchievementPopup}
                onClose={() => setShowAchievementPopup(false)}
                title="Test Achievement"
                description="This is a temporary testing popup for achievements and badges."
            />
            
            <CacheStatus />
        </div>
    );
};

export default Champions; 