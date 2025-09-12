import React, { useState, useEffect } from 'react';
import styles from './Skins.module.scss';
import { fetchSkinLines, type SkinLine } from '../../services/skinLinesService';
import Filter, { type FilterOption } from '../../components/Filter/Filter';
import AchievementPopup from '../../components/AchievementPopup';

const Skins: React.FC = () => {
    const [skinLines, setSkinLines] = useState<SkinLine[]>([]);
    const [filteredSkinLines, setFilteredSkinLines] = useState<SkinLine[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [favoriteSkinLines, setFavoriteSkinLines] = useState<number[]>(() => {
        const saved = localStorage.getItem('favoriteSkinLines');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(true);
    const [showAchievementPopup, setShowAchievementPopup] = useState(false);

    // Category filter options
    const categoryOptions: FilterOption[] = [
        { id: 'all', label: 'All Categories' },
        { id: 'futuristic', label: 'Futuristic' },
        { id: 'magical', label: 'Magical' },
        { id: 'music', label: 'Music' },
        { id: 'cosmic', label: 'Cosmic' },
        { id: 'folklore', label: 'Folklore' },
        { id: 'western', label: 'Western' },
        { id: 'gaming', label: 'Gaming' }
    ];

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('favoriteSkinLines', JSON.stringify(favoriteSkinLines));
    }, [favoriteSkinLines]);

    // Load skin lines on component mount
    useEffect(() => {
        const loadSkinLines = async () => {
            try {
                setLoading(true);
                const skinLinesData = await fetchSkinLines();
                setSkinLines(skinLinesData);
            } catch (error) {
                console.error('Error loading skin lines:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSkinLines();
    }, []);

    // Filter skin lines based on category and search
    useEffect(() => {
        let filtered = skinLines;

        // Filter by category (simplified for now - you can add category logic later)
        if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
            // For now, just show all skin lines regardless of category
            // You can implement category filtering logic here later
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(skinLine =>
                skinLine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (skinLine.description && skinLine.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Sort by search relevance first, then favorites
        filtered = filtered.sort((a, b) => {
            const aIsFavorite = favoriteSkinLines.includes(a.id);
            const bIsFavorite = favoriteSkinLines.includes(b.id);

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
                return favoriteSkinLines.indexOf(a.id) - favoriteSkinLines.indexOf(b.id);
            }

            return 0;
        });

        setFilteredSkinLines(filtered);
    }, [skinLines, selectedCategories, searchTerm, favoriteSkinLines]);

    // Toggle favorite skin line
    const toggleFavorite = (skinLineId: number) => {
        setFavoriteSkinLines(prev => {
            if (prev.includes(skinLineId)) {
                // Remove from favorites
                return prev.filter(id => id !== skinLineId);
            } else {
                // Add to favorites at the beginning (most recent first)
                return [skinLineId, ...prev];
            }
        });
    };


    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <p>Loading skin lines...</p>
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

            {/* Skins interface */}
            <div className={styles.container}>
                <div className={styles.content__top}>
                    <div className={styles.filters}>
                        <Filter
                            title="FILTER"
                            options={categoryOptions}
                            selectedOptions={selectedCategories}
                            onSelectionChange={setSelectedCategories}
                        />
                    </div>
                    <div className={styles.search__container}>
                        <input
                            type="text"
                            placeholder="Search skin lines..."
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
                        {filteredSkinLines.map((skinLine) => (
                            <div
                                key={skinLine.id}
                                className={`${styles.champion__card}`}
                            >
                                <h3 className={styles.champion__name}>{skinLine.name}</h3>
                                <img src="/images/frames/skin-frame.png" alt="Skin Line Frame" className={styles.champion__frame} />
                                <div className={styles.champion__image}>
                                    <img
                                        src={skinLine.splashart}
                                        alt={skinLine.name}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/bg/bg.png';
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredSkinLines.length === 0 && (
                        <div className={styles.no__results}>
                            <p>No skin lines found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

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

export default Skins;
