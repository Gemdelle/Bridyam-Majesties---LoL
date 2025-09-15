import React, { useState, useEffect } from 'react';
import styles from './Champions.module.scss';
import { fetchChampions, type Champion } from '../../services/championsService';
import { AccountsService, type Account } from '../../services/accountsService';
import Filter, { type FilterOption } from '../../components/Filter/Filter';
import AchievementPopup from '../../components/AchievementPopup';
import ChampionProgress from '../../components/ChampionProgress/ChampionProgress';

const Champions: React.FC = () => {
    const [champions, setChampions] = useState<Champion[]>([]);
    const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
    const [userAccounts, setUserAccounts] = useState<Account[]>([]);
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
    const itemsPerPage = 12; // 3 columns × 4 champions each

    // Role filter options
    const roleOptions: FilterOption[] = [
        { id: 'all', label: 'All Roles' },
        { id: 'adc', label: 'ADC' },
        { id: 'jungle', label: 'Jungle' },
        { id: 'mid', label: 'Mid' },
        { id: 'support', label: 'Support' },
        { id: 'top', label: 'Top' }
    ];

    // Account filter options (based on user's claimed accounts)
    const accountOptions: FilterOption[] = [
        { id: 'all', label: 'All Accounts' },
        ...userAccounts.map(account => ({
            id: account.username,
            label: account.name || account.username
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

                // Load champions
                const championsData = await fetchChampions();
                setChampions(championsData);

                // Load user accounts
                const accountsService = AccountsService.getInstance();
                const accountsData = await accountsService.getAccounts();
                setUserAccounts(accountsData);

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

    // Get champions for current page
    const getCurrentPageChampions = () => {
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

        // Apply account filter (filter by user's claimed accounts)
        if (selectedAccounts.length > 0 && !selectedAccounts.includes('all')) {
            // In a real implementation, this would filter champions based on which account they belong to
            // For now, we'll simulate this by showing champions that "belong" to the selected accounts
            favoriteChampionsList = favoriteChampionsList.filter((_, index) => {
                const accountUsername = selectedAccounts[index % selectedAccounts.length];
                return selectedAccounts.includes(accountUsername);
            });
        }

        // Apply champion filter to favorite champions
        if (selectedChampions.length > 0 && !selectedChampions.includes('all')) {
            favoriteChampionsList = favoriteChampionsList.filter(champion =>
                selectedChampions.includes(champion.id.toString())
            );
        }

        const totalPages = Math.ceil(favoriteChampionsList.length / itemsPerPage);

        // Reset to page 1 if current page is out of bounds
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentChampions = favoriteChampionsList.slice(startIndex, endIndex);

        // Fill remaining slots with placeholder data if less than 12
        const likedChampions: (Champion | null)[] = [...currentChampions];
        while (likedChampions.length < itemsPerPage) {
            likedChampions.push(null);
        }

        return { champions: likedChampions, totalPages };
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
                            const { champions: currentChampions } = getCurrentPageChampions();

                            // Distribute champions across 3 columns
                            const column1 = currentChampions.slice(0, 4); // First 4 champions
                            const column2 = currentChampions.slice(4, 8); // Next 4 champions  
                            const column3 = currentChampions.slice(8, 12); // Last 4 champions

                            const renderColumn = (champions: (Champion | null)[], startIndex: number) => {
                                return champions.map((champion, index) => {
                                    if (!champion) {
                                        return null; // Empty slot
                                    }

                                    const championNumber = (currentPage - 1) * itemsPerPage + startIndex + index + 1;
                                    const championImageUrl = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.name.replace(/['.\s]/g, '')}.png`;

                                    // Mock mastery data
                                    const masteryLevel = Math.floor(Math.random() * 11);
                                    const masteryProgress = Math.floor(Math.random() * 101);

                                    // Mock XP data
                                    const currentXP = Math.floor(Math.random() * 1000) + 100;
                                    const totalXP = Math.floor(Math.random() * 2000) + 1000;

                                    return (
                                        <ChampionProgress
                                            key={champion.id}
                                            championNumber={championNumber}
                                            championName={champion.name}
                                            championImage={championImageUrl}
                                            masteryLevel={masteryLevel}
                                            masteryProgress={masteryProgress}
                                            currentXP={currentXP}
                                            totalXP={totalXP}
                                        />
                                    );
                                });
                            };

                            return (
                                <>
                                    <div className={styles.current_champions__column}>
                                        {renderColumn(column1, 0)}
                                    </div>
                                    <div className={styles.current_champions__column}>
                                        {renderColumn(column2, 4)}
                                    </div>
                                    <div className={styles.current_champions__column}>
                                        {renderColumn(column3, 8)}
                                    </div>
                                </>
                            );
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
        </div>
    );
};

export default Champions; 