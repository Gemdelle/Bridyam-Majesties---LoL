import React, { useState, useEffect } from 'react';
import styles from './Champions.module.scss';
import { fetchChampions, type Champion } from '../../services/championsService';
import Filter, { type FilterOption } from '../../components/Filter/Filter';
import AchievementPopup from '../../components/AchievementPopup';

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
    const itemsPerPage = 5;

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
        const favoriteChampionsList = favoriteChampions
            .map(id => champions.find(champion => champion.id === id))
            .filter((champion): champion is Champion => champion !== undefined);

        const totalPages = Math.ceil(favoriteChampionsList.length / itemsPerPage);

        // Reset to page 1 if current page is out of bounds
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentChampions = favoriteChampionsList.slice(startIndex, endIndex);

        // Fill remaining slots with placeholder data if less than 5
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
                    <div className={styles.current_champions__container}>
                        <div className={styles.current_champions__column}>
                            <div className={styles.current_champion__container}>
                                <div className={styles.champion__portrait}>
                                    <img src="/images/frames/personal-champion.frame.png" alt="Champion Portrait"
                                        className={styles.champion__frame}
                                    />
                                    <img src="/images/roulette/wheel.png" alt="Champion" className={styles.champion} />
                                </div>
                                <div className={styles.champion__info}>
                                    <div className={styles.champion__name}>
                                        <h3>Champion Name</h3>
                                    </div>

                                    <div className={styles.champion__stats}>
                                        <div className={styles.champion__level__container}>
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                            <img src="/images/gems/crystal.png" alt="Level" className={styles.champion__level} />
                                        </div>
                                        <div className={styles.champion__level__number}>
                                            <img src="/images/masteries/mastery/10.png" alt="Level" className={styles.champion__level__number__image} />
                                        </div>
                                    </div>

                                    <div className={styles.champion__bar}>
                                        <div className={styles.champion__bar__fill}></div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.current_champion__container}></div>
                            <div className={styles.current_champion__container}></div>
                            <div className={styles.current_champion__container}></div>
                        </div>
                        <div className={styles.current_champions__column}></div>
                        <div className={styles.current_champions__column}></div>
                    </div>

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