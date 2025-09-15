import React, { useState, useEffect } from 'react';
import styles from './Champions.module.scss';
import { fetchChampions, type Champion } from '../../services/championsService';
import Filter, { type FilterOption } from '../../components/Filter/Filter';
import AchievementPopup from '../../components/AchievementPopup';
import ChampionProgress from '../../components/ChampionProgress/ChampionProgress';

const Champions: React.FC = () => {
    const [champions, setChampions] = useState<Champion[]>([]);
    const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
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

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('favoriteChampions', JSON.stringify(favoriteChampions));
    }, [favoriteChampions]);

    // Load champions on component mount
    useEffect(() => {
        const loadChampions = async () => {
            try {
                setLoading(true);
                const championsData = await fetchChampions();
                setChampions(championsData);
                // Remove this line - let the useEffect handle the initial sorting
                // setFilteredChampions(championsData);
            } catch (error) {
                console.error('Error loading champions:', error);
            } finally {
                setLoading(false);
            }
        };

        loadChampions();
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

        // Apply filters to favorite champions
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

            <button
                className={styles.choose__champions__button}
                onClick={() => setShowChampions(true)}
            >
                Choose Champions
            </button>

            {!showChampions ? (
                // Empty screen with Choose Champions button
                <div className={styles.empty__container}>
                    {/* Filters and Search for Favorites View */}
                    <div className={styles.content__top}>
                        <div className={styles.filters}>
                            <Filter
                                title="FILTER"
                                options={roleOptions}
                                selectedOptions={selectedRoles}
                                onSelectionChange={setSelectedRoles}
                            />
                        </div>
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
                    <button
                        className={styles.back__button}
                        onClick={() => setShowChampions(false)}
                    >
                        Back
                    </button>
                    <div className={styles.content__top}>
                        <div className={styles.filters}>
                            <Filter
                                title="FILTER"
                                options={roleOptions}
                                selectedOptions={selectedRoles}
                                onSelectionChange={setSelectedRoles}
                            />
                        </div>
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