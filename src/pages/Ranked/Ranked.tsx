import React, { useState, useEffect } from 'react';
import styles from './Ranked.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import RankedAccount from '../../components/RankedAccount/RankedAccount';
import { fetchRankedData, type RankedData } from '../../services/apiRankedsService';

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

    // --- Estado para los datos de ranked ---
    const [rankedData, setRankedData] = useState<RankedData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Estado para la paginación ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // --- Cargar datos de ranked ---
    useEffect(() => {
        const loadRankedData = async () => {
            try {
                setLoading(true);
                const data = await fetchRankedData();
                setRankedData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error loading ranked data');
            } finally {
                setLoading(false);
            }
        };

        loadRankedData();
    }, []);

    // --- Función para filtrar los datos ranked ---
    const filterRankedData = (dataToFilter: RankedData[]) => {
        if (selectedFilters.length === 0) return dataToFilter;

        return dataToFilter.filter(data => {
            // Check bloodline filters
            const bloodlineFilters = selectedFilters.filter(filter =>
                ['porveldam', 'spadelline', 'zephiroth', 'gladasmy', 'primogenit'].includes(filter)
            );

            if (bloodlineFilters.length > 0) {
                const hasMatchingBloodline = bloodlineFilters.some(filter =>
                    data.bloodline.toLowerCase() === filter
                );
                if (!hasMatchingBloodline) return false;
            }

            // Check missing filters using actual progress data
            if (selectedFilters.includes('wins')) {
                // Show accounts that haven't completed all wins
                if (data.wins.current >= data.wins.totals) return false;
            }

            if (selectedFilters.includes('missions')) {
                // Show accounts that haven't completed all missions
                if (data.missions.current_act.current >= data.missions.current_act.totals) return false;
            }

            if (selectedFilters.includes('hall missions')) {
                // Show accounts that haven't completed all hall missions
                if (data.missions.current_hall_of_legends.current >= data.missions.current_hall_of_legends.totals) return false;
            }

            return true;
        });
    };

    // --- Función para ordenar los datos ranked ---
    const sortRankedData = (dataToSort: RankedData[]) => {
        if (selectedSorts.length === 0) return dataToSort;

        const sortBy = selectedSorts[0]; // Take the first selected sort option
        const tierOrder = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond'];

        return [...dataToSort].sort((a, b) => {
            switch (sortBy) {
                case 'tier-soloq':
                    // Sort by tier and division (tier priority, then division)
                    const aTierIndex = tierOrder.indexOf(a.elo_soloq.tier.toLowerCase());
                    const bTierIndex = tierOrder.indexOf(b.elo_soloq.tier.toLowerCase());
                    if (aTierIndex !== bTierIndex) {
                        return bTierIndex - aTierIndex; // Higher tier first
                    }
                    return b.elo_soloq.division - a.elo_soloq.division; // Higher division first
                case 'tier-flex':
                    const aTierIndexFlex = tierOrder.indexOf(a.elo_flex.tier.toLowerCase());
                    const bTierIndexFlex = tierOrder.indexOf(b.elo_flex.tier.toLowerCase());
                    if (aTierIndexFlex !== bTierIndexFlex) {
                        return bTierIndexFlex - aTierIndexFlex; // Higher tier first
                    }
                    return b.elo_flex.division - a.elo_flex.division; // Higher division first
                case 'wins':
                    // Sort by wins current (descending)
                    return b.wins.current - a.wins.current;
                case 'missions':
                    // Sort by missions current (descending)
                    return b.missions.current_act.current - a.missions.current_act.current;
                case 'hall missions':
                    // Sort by hall missions current (descending)
                    return b.missions.current_hall_of_legends.current - a.missions.current_hall_of_legends.current;
                default:
                    return 0;
            }
        });
    };

    // --- Calcular las accounts a mostrar en la página actual ---
    const getCurrentPageAccounts = () => {
        const filteredData = filterRankedData(rankedData);
        const sortedData = sortRankedData(filteredData);
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);

        // Reset to page 1 if current page is out of bounds
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return { accounts: sortedData.slice(startIndex, endIndex), totalPages };
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
                                    {accounts.map((rankedAccount) => (
                                        <RankedAccount
                                            key={rankedAccount.id}
                                            rankedData={rankedAccount}
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