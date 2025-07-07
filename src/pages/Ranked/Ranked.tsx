import React, { useState, useEffect } from 'react';
import styles from './Ranked.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import RankedAccount from '../../components/RankedAccount/RankedAccount';
import { fetchPortraits, type Portrait } from '../../services/portraitsService';

// --- Opciones para los filtros ---
const viewOptions: FilterOption[] = [
    { id: 'missions', label: 'missions', image: 'https://placehold.co/24x24/4a90e2/ffffff.png?text=📋' },
    { id: 'hall-missions', label: 'hall missions', image: 'https://placehold.co/24x24/ff6b6b/ffffff.png?text=🏛️' }
];

const filterOptions: FilterOption[] = [
    { id: 'porveldam', label: 'Porveldam', image: '/src/assets/images/ranked-btn/porveldam.png' },
    { id: 'spadelline', label: 'Spadelline', image: '/src/assets/images/ranked-btn/spadelline.png' },
    { id: 'zephiroth', label: 'Zephiroth', image: '/src/assets/images/ranked-btn/zephiroth.png' },
    { id: 'gladasmy', label: 'Gladasmy', image: '/src/assets/images/ranked-btn/gladasmy.png' },
    { id: 'primogenit', label: 'Primogenit', image: '/src/assets/images/ranked-btn/primogenit.png' },
    { id: 'wins', label: 'wins' },
    { id: 'missions', label: 'missions' },
    { id: 'hall missions', label: 'hall missions' },
];

const sortOptions: FilterOption[] = [
    { id: 'tier-soloq', label: 'tier soloq' },
    { id: 'tier-flex', label: 'tier flex' },
    { id: 'wins', label: 'wins' },
    { id: 'missions', label: 'missions' },
    { id: 'hall missions', label: 'hall missions' },
];

const Ranked: React.FC = () => {
    // --- Estados para cada filtro ---
    const [selectedView, setSelectedView] = useState<string>('missions');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [selectedSorts, setSelectedSorts] = useState<string[]>(['tier-soloq']);

    // --- Estado para los datos de portraits ---
    const [portraits, setPortraits] = useState<Portrait[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Estado para la paginación ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // --- Cargar datos de portraits ---
    useEffect(() => {
        const loadPortraits = async () => {
            try {
                setLoading(true);
                const data = await fetchPortraits();
                setPortraits(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error loading portraits');
            } finally {
                setLoading(false);
            }
        };

        loadPortraits();
    }, []);

    // --- Función para filtrar los portraits ---
    const filterPortraits = (portraitsToFilter: Portrait[]) => {
        if (selectedFilters.length === 0) return portraitsToFilter;

        return portraitsToFilter.filter(portrait => {
            // Check bloodline filters
            const bloodlineFilters = selectedFilters.filter(filter =>
                ['porveldam', 'spadelline', 'zephiroth', 'gladasmy', 'primogenit'].includes(filter)
            );

            if (bloodlineFilters.length > 0) {
                const hasMatchingBloodline = bloodlineFilters.some(filter =>
                    portrait.bloodline.toLowerCase() === filter
                );
                if (!hasMatchingBloodline) return false;
            }

            // Check missing filters (placeholder logic - would need actual progress tracking)
            if (selectedFilters.includes('wins')) {
                // For now, consider wins missing if champions < 150 (placeholder)
                if (portrait.champions >= 150) return false;
            }

            if (selectedFilters.includes('missions')) {
                // For now, consider missions missing if masteries < 600 (placeholder)
                if (portrait.masteries >= 600) return false;
            }

            if (selectedFilters.includes('hall missions')) {
                // For now, consider hall missions missing if skins < 250 (placeholder)
                if (portrait.skins >= 250) return false;
            }

            return true;
        });
    };

    // --- Función para ordenar los portraits ---
    const sortPortraits = (portraitsToSort: Portrait[]) => {
        if (selectedSorts.length === 0) return portraitsToSort;

        const sortBy = selectedSorts[0]; // Take the first selected sort option

        return [...portraitsToSort].sort((a, b) => {
            switch (sortBy) {
                case 'tier-soloq':
                    // Sort by elo-soloq in descending order
                    return (b.elo || 0) - (a.elo || 0);
                case 'tier-flex':
                    // Sort by elo-flex in descending order (using elo as proxy for now)
                    return (b.elo || 0) - (a.elo || 0);
                case 'wins':
                    // Sort by wins count (placeholder - would need to track actual wins)
                    return (b.champions || 0) - (a.champions || 0);
                case 'missions':
                    // Sort by missions completed (placeholder - would need to track actual missions)
                    return (b.masteries || 0) - (a.masteries || 0);
                case 'hall missions':
                    // Sort by hall missions completed (placeholder - would need to track actual hall missions)
                    return (b.skins || 0) - (a.skins || 0);
                default:
                    return 0;
            }
        });
    };

    // --- Calcular las accounts a mostrar en la página actual ---
    const getCurrentPageAccounts = () => {
        const filteredPortraits = filterPortraits(portraits);
        const sortedPortraits = sortPortraits(filteredPortraits);
        const totalPages = Math.ceil(filteredPortraits.length / itemsPerPage);

        // Reset to page 1 if current page is out of bounds
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return { accounts: sortedPortraits.slice(startIndex, endIndex), totalPages };
    };

    const handlePageChange = (newPage: number) => {
        const { totalPages } = getCurrentPageAccounts();
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Handler para selección única de view ---
    const handleViewChange = (newSelection: string[]) => {
        // For single selection, we want to replace the current selection
        // If the new selection is empty, keep the current one
        if (newSelection.length > 0) {
            const newView = newSelection[newSelection.length - 1]; // Get the last selected item
            setSelectedView(newView);
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <p>Loading majesties...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <p>Error: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.content__filters}>
                    <Filter
                        title="VIEW"
                        options={viewOptions}
                        selectedOptions={[selectedView]}
                        onSelectionChange={handleViewChange}
                    />
                    <Filter
                        title="FILTER"
                        options={filterOptions}
                        selectedOptions={selectedFilters}
                        onSelectionChange={setSelectedFilters}
                    />
                    <Filter
                        title="SORT BY"
                        options={sortOptions}
                        selectedOptions={selectedSorts}
                        onSelectionChange={setSelectedSorts}
                    />
                </div>
                <div className={styles.content}>
                    <div className={styles.accounts}>
                        <div className={styles.accounts__header}>
                            <div className={styles.header__id}>ID</div>
                            <div className={styles.header__portrait}></div>
                            <div className={styles.header__name}>ACCOUNT</div>
                            <div className={styles.header__essencer}>ESSENCER</div>
                            <div className={styles.header__wins}>WINS</div>
                            <div className={styles.header__soloq}>SOLO</div>
                            <div className={styles.header__flex}>FLEX</div>
                            <div className={styles.header__missions}>MISSIONS</div>
                        </div>
                        {(() => {
                            const { accounts, totalPages } = getCurrentPageAccounts();
                            return (
                                <>
                                    {accounts.map((portrait) => (
                                        <RankedAccount
                                            key={portrait.id}
                                            portrait={portrait}
                                            selectedView={selectedView}
                                        />
                                    ))}
                                    <div className={styles.pagination}>
                                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                            &lt; Previous
                                        </button>
                                        <span>Page {currentPage} of {totalPages}</span>
                                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                            Next &gt;
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ranked; 