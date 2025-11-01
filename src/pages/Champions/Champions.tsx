import React, { useState, useEffect } from 'react';
import styles from './Champions.module.scss';
import { fetchChampions, type Champion, getRiotIdForChampion } from '../../services/championsService';
import { AccountsService, type Account } from '../../services/accountsService';
import { type MasteryData } from '../../services/apiMasteriesService';
import { masteryCacheService } from '../../services/masteryCacheService';
import { getFavorites, saveFavorites } from '../../services/favoritesService';
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
    const [favoriteChampions, setFavoriteChampions] = useState<number[]>([]);
    const [favoritesLoaded, setFavoritesLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAchievementPopup, setShowAchievementPopup] = useState(false);
    const [showChampions, setShowChampions] = useState(false);

    // --- Estado para la paginación ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 28; // Legacy: kept for compatibility, actual pagination is 4 accounts per page

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
    const championOptions: FilterOption[] = favoriteChampions.map(id => {
        const champion = champions.find(c => c.id === id);
        return champion ? { id: champion.id.toString(), label: champion.name } : null;
    }).filter((option): option is FilterOption => option !== null);

    // Load favorites from database on mount
    useEffect(() => {
        const loadFavorites = async () => {
            if (!user?.id) {
                // No user logged in, load from localStorage as fallback
                const saved = localStorage.getItem('favoriteChampions');
                if (saved) {
                    setFavoriteChampions(JSON.parse(saved));
                }
                setFavoritesLoaded(true);
                return;
            }

            try {
                // Load from database
                const dbFavorites = await getFavorites(user.id);
                if (dbFavorites.length > 0) {
                    setFavoriteChampions(dbFavorites);
                    // Also save to localStorage as backup
                    localStorage.setItem('favoriteChampions', JSON.stringify(dbFavorites));
                } else {
                    // No favorites in DB, try loading from localStorage
                    const saved = localStorage.getItem('favoriteChampions');
                    if (saved) {
                        const localFavorites = JSON.parse(saved);
                        setFavoriteChampions(localFavorites);
                        // Sync localStorage favorites to DB
                        await saveFavorites(user.id, localFavorites);
                    }
                }
            } catch (error) {
                console.error('Error loading favorites from database:', error);
                // Fallback to localStorage
                const saved = localStorage.getItem('favoriteChampions');
                if (saved) {
                    setFavoriteChampions(JSON.parse(saved));
                }
            } finally {
                setFavoritesLoaded(true);
            }
        };

        loadFavorites();
    }, [user?.id]);

    // Save favorites to database and localStorage whenever they change
    useEffect(() => {
        if (!favoritesLoaded) return; // Don't save during initial load

        // Always save to localStorage as backup
        localStorage.setItem('favoriteChampions', JSON.stringify(favoriteChampions));

        // Save to database if user is logged in
        if (user?.id) {
            saveFavorites(user.id, favoriteChampions).catch(error => {
                console.error('Error saving favorites to database:', error);
                // Continue anyway, localStorage is saved as backup
            });
        }
    }, [favoriteChampions, user?.id, favoritesLoaded]);

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
        let accountsToUse = selectedAccounts.length > 0 && !selectedAccounts.includes('all')
            ? filteredAccountsByUser.filter(acc => selectedAccounts.includes(acc.username))
            : filteredAccountsByUser;

        // Sort accounts by total number of masteries (highest first)
        // Calculate total masteries for each account
        accountsToUse = accountsToUse.sort((accountA, accountB) => {
            const masteriesA = masteryData.filter(m => m.ranked_id === accountA.id).length;
            const masteriesB = masteryData.filter(m => m.ranked_id === accountB.id).length;
            return masteriesB - masteriesA; // Sort descending (highest first)
        });

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

        // Check if a specific champion is selected
        const isSpecificChampionSelected = selectedChampions.length > 0 && !selectedChampions.includes('all');

        // Apply champion filter to favorite champions
        if (isSpecificChampionSelected) {
            favoriteChampionsList = favoriteChampionsList.filter(champion =>
                selectedChampions.includes(champion.id.toString())
            );
        }

        // Create a flat list alternating between account names and champions
        const itemsList: ListItem[] = [];

        // Check if only one account is selected
        const isSingleAccountSelected = accountsToUse.length === 1;

        // Special case: if a specific champion is selected, show it for each account without account names
        if (isSpecificChampionSelected && favoriteChampionsList.length > 0) {
            const selectedChampion = favoriteChampionsList[0]; // Get the selected champion

            // Use ALL accounts when a specific champion is selected (not just claimed ones)
            const allAccountsForChampion = selectedAccounts.length > 0 && !selectedAccounts.includes('all')
                ? userAccounts.filter(acc => selectedAccounts.includes(acc.username))
                : userAccounts;

            // Create champion entries for all accounts
            const championEntries = allAccountsForChampion.map((account) => {
                // Get mastery data for this specific champion and account
                const riotChampionId = getRiotIdForChampion(selectedChampion.id);
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
                    type: 'champion' as const,
                    champion: selectedChampion,
                    account: account,
                    masteryLevel,
                    masteryProgress,
                    masteryPoints,
                    currentXP: pointsSinceLastLevel,
                    totalXP: pointsSinceLastLevel + pointsUntilNextLevel
                };
            });

            // Sort by mastery level descending, then by mastery points descending
            championEntries.sort((a, b) => {
                if (b.masteryLevel !== a.masteryLevel) {
                    return b.masteryLevel - a.masteryLevel;
                }
                return b.masteryPoints - a.masteryPoints;
            });

            // Add all sorted champions to itemsList (NO account names)
            itemsList.push(...championEntries);
        } else {
            // Normal flow: show accounts with their champions
            accountsToUse.forEach((account) => {
                // Add account name as an item
                itemsList.push({ type: 'account', account });

                // Get champions with mastery data for this account
                let championsWithMastery = favoriteChampionsList
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

                // Limit to top 6 champions by mastery ONLY if multiple accounts are selected
                // If only one account is selected, show all favorite champions
                if (!isSingleAccountSelected) {
                    championsWithMastery = championsWithMastery.slice(0, 6);
                }

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
        }

        return itemsList;
    };

    // Legacy function for backward compatibility (returns champions only for filtering logic)
    const getCurrentPageChampions = () => {
        const allItems = getAllItemsUnpaginated();

        // Check if a specific champion is selected (all items will be champions, no account names)
        const isSpecificChampionSelected = selectedChampions.length > 0 && !selectedChampions.includes('all') &&
            allItems.length > 0 && allItems.every(item => item.type === 'champion');

        if (isSpecificChampionSelected) {
            // Special case: specific champion selected
            const allChampions = allItems.filter((item): item is Extract<ListItem, { type: 'champion' }> => item.type === 'champion');
            const championsPerPage = 28;
            const totalPages = Math.ceil(allChampions.length / championsPerPage);

            const startChampionIndex = (currentPage - 1) * championsPerPage;
            const endChampionIndex = startChampionIndex + championsPerPage;
            const championsFromItems = allChampions
                .slice(startChampionIndex, endChampionIndex)
                .map(item => item.champion);

            const likedChampions: (Champion | null)[] = [...championsFromItems];
            while (likedChampions.length < itemsPerPage) {
                likedChampions.push(null);
            }

            return {
                champions: likedChampions,
                totalPages
            };
        }

        // Group items by account to calculate total pages
        const allAccountsGroups: Array<{ account: Account, champions: Extract<ListItem, { type: 'champion' }>[] }> = [];
        let currentAccount: Account | null = null;
        let currentChampions: Extract<ListItem, { type: 'champion' }>[] = [];

        allItems.forEach(item => {
            if (item.type === 'account') {
                if (currentAccount && currentChampions.length > 0) {
                    allAccountsGroups.push({ account: currentAccount, champions: currentChampions });
                }
                currentAccount = item.account;
                currentChampions = [];
            } else {
                currentChampions.push(item);
            }
        });

        if (currentAccount && currentChampions.length > 0) {
            allAccountsGroups.push({ account: currentAccount, champions: currentChampions });
        }

        let totalPages: number;
        let championsFromItems: Champion[];

        // Check if only one account is selected
        const isSingleAccount = allAccountsGroups.length === 1;

        if (isSingleAccount) {
            // Single account: pagination by champions (27 per page: 6 + 7 + 7 + 7)
            const singleAccountGroup = allAccountsGroups[0];
            const championsPerPage = 27;
            totalPages = Math.ceil(singleAccountGroup.champions.length / championsPerPage);

            // Get champions for current page
            const startChampionIndex = (currentPage - 1) * championsPerPage;
            const endChampionIndex = startChampionIndex + championsPerPage;
            championsFromItems = singleAccountGroup.champions
                .slice(startChampionIndex, endChampionIndex)
                .map(item => item.champion);
        } else {
            // Multiple accounts: pagination by accounts (4 per page)
            const accountsPerPage = 4;
            totalPages = Math.ceil(allAccountsGroups.length / accountsPerPage);

            // Get champions for current page
            const startAccountIndex = (currentPage - 1) * accountsPerPage;
            const endAccountIndex = startAccountIndex + accountsPerPage;
            const currentPageAccountsGroups = allAccountsGroups.slice(startAccountIndex, endAccountIndex);

            championsFromItems = currentPageAccountsGroups.flatMap(group =>
                group.champions.map(item => item.champion)
            );
        }

        // Fill with nulls if needed (not required anymore, but keeping for compatibility)
        const likedChampions: (Champion | null)[] = [...championsFromItems];
        while (likedChampions.length < itemsPerPage) {
            likedChampions.push(null);
        }

        return {
            champions: likedChampions,
            totalPages
        };
    };

    const handlePageChange = (newPage: number) => {
        const { totalPages } = getCurrentPageChampions();
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Calculate total masteries based on current filter
    const calculateTotalMasteries = (): number => {
        const allItems = getAllItemsUnpaginated();

        // Get all champion items
        const championItems = allItems.filter((item): item is Extract<ListItem, { type: 'champion' }> => item.type === 'champion');

        // Sum all mastery levels
        return championItems.reduce((total, item) => total + item.masteryLevel, 0);
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
                        <div className={styles.total__masteries__container}>
                            <img
                                src="/images/frames/account-ranking-position-frame.png"
                                alt="Masteries frame"
                                className={styles.total__masteries__frame}
                            />
                            <span className={styles.total__masteries__text}>
                                {calculateTotalMasteries()}
                            </span>
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
                            // Get all items without pagination to organize by account
                            const allItems = getAllItemsUnpaginated();

                            // Check if a specific champion is selected (all items will be champions, no account names)
                            const isSpecificChampionSelected = selectedChampions.length > 0 && !selectedChampions.includes('all') &&
                                allItems.length > 0 && allItems.every(item => item.type === 'champion');

                            if (isSpecificChampionSelected) {
                                // Special case: specific champion selected - show champion for each account without account names
                                const allChampions = allItems.filter((item): item is Extract<ListItem, { type: 'champion' }> => item.type === 'champion');

                                // Pagination: 28 champions per page (7 per column × 4 columns)
                                const championsPerPage = 28;
                                const totalPages = Math.ceil(allChampions.length / championsPerPage);

                                // Reset to page 1 if current page is out of bounds
                                if (currentPage > totalPages && totalPages > 0) {
                                    setCurrentPage(1);
                                }

                                // Get champions for current page
                                const startChampionIndex = (currentPage - 1) * championsPerPage;
                                const endChampionIndex = startChampionIndex + championsPerPage;
                                const currentPageChampions = allChampions.slice(startChampionIndex, endChampionIndex);

                                // Distribute champions across 4 columns (7 champions per column)
                                return Array.from({ length: 4 }, (_, containerIndex) => {
                                    const championsPerColumn = 7;
                                    const startIndex = containerIndex * championsPerColumn;
                                    const endIndex = startIndex + championsPerColumn;
                                    const columnChampions = currentPageChampions.slice(startIndex, endIndex);

                                    return (
                                        <div
                                            key={`container-${containerIndex}`}
                                            className={styles.champion__container__item}
                                        >
                                            {/* No account names - just champions one below the other */}
                                            {columnChampions.map((championItem, championIndex) => {
                                                const { champion, account, masteryLevel, masteryProgress, currentXP, totalXP } = championItem;
                                                const championImageUrl = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.name.replace(/['.\s]/g, '')}.png`;
                                                const globalChampionIndex = startChampionIndex + startIndex + championIndex;

                                                return (
                                                    <ChampionProgress
                                                        key={`champion-${champion.id}-${account.id}-${championIndex}`}
                                                        championName={champion.name}
                                                        championImage={championImageUrl}
                                                        masteryLevel={masteryLevel}
                                                        masteryProgress={masteryProgress}
                                                        currentXP={currentXP}
                                                        totalXP={totalXP}
                                                        championNumber={globalChampionIndex + 1}
                                                        accountName={account.username || ""}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                });
                            }

                            // Group items by account (normal flow)
                            const allAccountsGroups: Array<{ account: Account, champions: Extract<ListItem, { type: 'champion' }>[] }> = [];
                            let currentAccount: Account | null = null;
                            let currentChampions: Extract<ListItem, { type: 'champion' }>[] = [];

                            allItems.forEach(item => {
                                if (item.type === 'account') {
                                    // Save previous account group if exists
                                    if (currentAccount && currentChampions.length > 0) {
                                        allAccountsGroups.push({ account: currentAccount, champions: currentChampions });
                                    }
                                    // Start new account group
                                    currentAccount = item.account;
                                    currentChampions = [];
                                } else {
                                    // Add champion to current account
                                    currentChampions.push(item);
                                }
                            });

                            // Don't forget the last account group
                            if (currentAccount && currentChampions.length > 0) {
                                allAccountsGroups.push({ account: currentAccount, champions: currentChampions });
                            }

                            // Check if only one account is selected
                            const isSingleAccount = allAccountsGroups.length === 1;

                            if (isSingleAccount) {
                                // Single account: distribute all champions across 4 columns with pagination
                                const singleAccountGroup = allAccountsGroups[0];
                                const { account, champions } = singleAccountGroup;

                                // Pagination: 27 champions per page (first column: 6 champions + account name, others: 7 champions each)
                                // Total: 6 + 7 + 7 + 7 = 27 champions per page
                                const championsPerPage = 27;
                                const totalPages = Math.ceil(champions.length / championsPerPage);

                                // Reset to page 1 if current page is out of bounds
                                if (currentPage > totalPages && totalPages > 0) {
                                    setCurrentPage(1);
                                }

                                // Get champions for current page
                                const startChampionIndex = (currentPage - 1) * championsPerPage;
                                const endChampionIndex = startChampionIndex + championsPerPage;
                                const currentPageChampions = champions.slice(startChampionIndex, endChampionIndex);

                                // Distribute champions across 4 columns
                                // First column: 6 champions (account name takes up space), others: 7 champions each
                                return Array.from({ length: 4 }, (_, containerIndex) => {
                                    let startIndex: number;
                                    let endIndex: number;

                                    if (containerIndex === 0) {
                                        // First column: 6 champions (account name uses one slot)
                                        startIndex = 0;
                                        endIndex = 6;
                                    } else {
                                        // Other columns: 7 champions each
                                        // Column 2: starts at 6, ends at 13
                                        // Column 3: starts at 13, ends at 20
                                        // Column 4: starts at 20, ends at 27
                                        startIndex = 6 + (containerIndex - 1) * 7;
                                        endIndex = startIndex + 7;
                                    }

                                    const columnChampions = currentPageChampions.slice(startIndex, endIndex);

                                    return (
                                        <div
                                            key={`container-${containerIndex}`}
                                            className={styles.champion__container__item}
                                        >
                                            {/* Show account name only in first column */}
                                            {containerIndex === 0 && (
                                                <div
                                                    key={`account-${account.id}`}
                                                    className={styles.account__name}
                                                >
                                                    <span className={styles.account__text}>
                                                        {account.username || 'No account selected'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Champions for this column */}
                                            {columnChampions.map((championItem, championIndex) => {
                                                const { champion, masteryLevel, masteryProgress, currentXP, totalXP } = championItem;
                                                const championImageUrl = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.name.replace(/['.\s]/g, '')}.png`;
                                                const globalChampionIndex = startChampionIndex + startIndex + championIndex;

                                                return (
                                                    <ChampionProgress
                                                        key={`champion-${champion.id}-${account.id}-${championIndex}`}
                                                        championName={champion.name}
                                                        championImage={championImageUrl}
                                                        masteryLevel={masteryLevel}
                                                        masteryProgress={masteryProgress}
                                                        currentXP={currentXP}
                                                        totalXP={totalXP}
                                                        championNumber={globalChampionIndex + 1}
                                                        accountName={account.username || ""}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                });
                            } else {
                                // Multiple accounts: one account per column, max 6 champions per account
                                const accountsPerPage = 4;
                                const totalPages = Math.ceil(allAccountsGroups.length / accountsPerPage);

                                // Reset to page 1 if current page is out of bounds
                                if (currentPage > totalPages && totalPages > 0) {
                                    setCurrentPage(1);
                                }

                                // Get accounts for current page
                                const startAccountIndex = (currentPage - 1) * accountsPerPage;
                                const endAccountIndex = startAccountIndex + accountsPerPage;
                                const currentPageAccountsGroups = allAccountsGroups.slice(startAccountIndex, endAccountIndex);

                                // Count all champions from previous pages for numbering
                                let championCount = 0;
                                for (let i = 0; i < startAccountIndex; i++) {
                                    championCount += allAccountsGroups[i].champions.length;
                                }

                                // Distribute accounts across 4 columns (each column gets 1 account with its champions)
                                return Array.from({ length: 4 }, (_, containerIndex) => {
                                    const accountGroup = currentPageAccountsGroups[containerIndex];

                                    if (!accountGroup) {
                                        return (
                                            <div
                                                key={`container-${containerIndex}`}
                                                className={styles.champion__container__item}
                                            />
                                        );
                                    }

                                    const { account, champions } = accountGroup;

                                    // Count champions from previous columns on current page
                                    let currentPageChampionCount = championCount;
                                    for (let i = 0; i < containerIndex; i++) {
                                        const prevGroup = currentPageAccountsGroups[i];
                                        if (prevGroup) {
                                            currentPageChampionCount += prevGroup.champions.length;
                                        }
                                    }

                                    return (
                                        <div
                                            key={`container-${containerIndex}`}
                                            className={styles.champion__container__item}
                                        >
                                            {/* Account name */}
                                            <div
                                                key={`account-${account.id}`}
                                                className={styles.account__name}
                                            >
                                                <span className={styles.account__text}>
                                                    {account.username || 'No account selected'}
                                                </span>
                                            </div>

                                            {/* Champions for this account (max 6) */}
                                            {champions.map((championItem, championIndex) => {
                                                const { champion, masteryLevel, masteryProgress, currentXP, totalXP } = championItem;
                                                const championImageUrl = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.name.replace(/['.\s]/g, '')}.png`;

                                                return (
                                                    <ChampionProgress
                                                        key={`champion-${champion.id}-${account.id}-${championIndex}`}
                                                        championName={champion.name}
                                                        championImage={championImageUrl}
                                                        masteryLevel={masteryLevel}
                                                        masteryProgress={masteryProgress}
                                                        currentXP={currentXP}
                                                        totalXP={totalXP}
                                                        championNumber={currentPageChampionCount + championIndex + 1}
                                                        accountName={account.username || ""}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                });
                            }
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