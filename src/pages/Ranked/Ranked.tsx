import React, { useState, useEffect } from 'react';
import styles from './Ranked.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import Tab, { type TabOption } from '../../components/Tab';
import RankedAccount from '../../components/RankedAccount/RankedAccount';
import { fetchRankedData, updateRankedData, type RankedData } from '../../services/apiRankedsService';

// --- Opciones para las tabs ---
const tabOptions: TabOption[] = [
    { id: 'missions', label: 'missions', image: '/images/ranked-btn/mission.png' },
    { id: 'hall-missions', label: 'hall', image: '/images/ranked-btn/hall-mission.png' }
];

// --- Opciones para los filtros ---
const viewOptions: FilterOption[] = [
    { id: 'missions', label: 'missions', image: 'https://placehold.co/24x24/4a90e2/ffffff.png?text=📋' },
    { id: 'hall-missions', label: 'hall missions', image: 'https://placehold.co/24x24/ff6b6b/ffffff.png?text=🏛️' }
];

const filterOptions: FilterOption[] = [
    { id: 'porveldam', label: 'Porveldam', image: '/images/ranked-btn/porveldam.png' },
    { id: 'spadelline', label: 'Spadelline', image: '/images/ranked-btn/spadelline.png' },
    { id: 'zephiroth', label: 'Zephiroth', image: '/images/ranked-btn/zephiroth.png' },
    { id: 'gladasmy', label: 'Gladasmy', image: '/images/ranked-btn/gladasmy.png' },
    { id: 'primogenit', label: 'Primogenit', image: '/images/ranked-btn/primogenit.png' },
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
    { id: 'bloodline', label: 'bloodline' },
];

const Ranked: React.FC = () => {
    // --- Estados para cada filtro ---
    const [selectedView, setSelectedView] = useState<string>('hall-missions');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [selectedSorts, setSelectedSorts] = useState<string[]>(['wins']);

    // --- Estado para los datos de ranked ---
    const [rankedData, setRankedData] = useState<RankedData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Estado para la paginación ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // --- Estado para la búsqueda ---
    const [searchTerm, setSearchTerm] = useState<string>('');

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

    // --- Función para actualizar un rankedData específico ---
    const handleUpdateRankedData = async (updatedData: RankedData) => {
        console.log('handleUpdateRankedData called with:', updatedData);
        try {
            // Update local state first for immediate UI feedback
            const newData = rankedData.map(item =>
                item.id === updatedData.id ? updatedData : item
            );
            console.log('New data array:', newData);
            setRankedData(newData);

            // Make POST request with updated data immediately
            await updateRankedData(newData);
            console.log('Data updated successfully');
        } catch (error) {
            console.error('Error updating ranked data:', error);
            setError('Failed to update data on server');

            // Revert local state if API call fails
            setRankedData(prevData => prevData);
        }
    };

    // --- Función para filtrar los datos ranked ---
    const filterRankedData = (dataToFilter: RankedData[]) => {
        let filteredData = dataToFilter;

        // Apply search filter first
        if (searchTerm.trim() !== '') {
            filteredData = filteredData.filter(data =>
                data.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                data.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedFilters.length === 0) return filteredData;

        return filteredData.filter(data => {
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
                // Only count missing wins for accounts above level 30
                if (data.level >= 30) {
                    // Show accounts that haven't completed all wins
                    if (data.wins.current >= data.wins.totals) return false;
                } else {
                    // For accounts below level 30, don't count missing wins - exclude them from this filter
                    return false;
                }
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

        // Count accounts per essencer for secondary sorting
        const essencerAccountCounts = new Map<string, number>();
        dataToSort.forEach(account => {
            const essencerName = account.name;
            essencerAccountCounts.set(essencerName, (essencerAccountCounts.get(essencerName) || 0) + 1);
        });

        return [...dataToSort].sort((a, b) => {
            let primaryComparison = 0;

            switch (sortBy) {
                case 'tier-soloq': {
                    // Sort by tier and division (tier priority, then division)
                    const aTierIndex = tierOrder.indexOf(a.elo_soloq.tier.toLowerCase());
                    const bTierIndex = tierOrder.indexOf(b.elo_soloq.tier.toLowerCase());
                    if (aTierIndex !== bTierIndex) {
                        primaryComparison = bTierIndex - aTierIndex; // Higher tier first
                    } else {
                        primaryComparison = b.elo_soloq.division - a.elo_soloq.division; // Higher division first
                    }
                    break;
                }
                case 'tier-flex': {
                    const aTierIndexFlex = tierOrder.indexOf(a.elo_flex.tier.toLowerCase());
                    const bTierIndexFlex = tierOrder.indexOf(b.elo_flex.tier.toLowerCase());
                    if (aTierIndexFlex !== bTierIndexFlex) {
                        primaryComparison = bTierIndexFlex - aTierIndexFlex; // Higher tier first
                    } else {
                        primaryComparison = b.elo_flex.division - a.elo_flex.division; // Higher division first
                    }
                    break;
                }
                case 'wins':
                    // Sort by wins current (descending)
                    primaryComparison = b.wins.current - a.wins.current;
                    break;
                case 'missions':
                    // Sort by missions current (descending)
                    primaryComparison = b.missions.current_act.current - a.missions.current_act.current;
                    break;
                case 'hall missions':
                    // Sort by hall missions current (descending)
                    primaryComparison = b.missions.current_hall_of_legends.current - a.missions.current_hall_of_legends.current;
                    break;
                case 'bloodline': {
                    // Sort by bloodline in the order: Porveldam, Spadelline, Zephiroth, Gladasmy
                    const bloodlineOrder = ['porveldam', 'spadelline', 'zephiroth', 'gladasmy'];
                    const aBloodlineIndex = bloodlineOrder.indexOf(a.bloodline.toLowerCase());
                    const bBloodlineIndex = bloodlineOrder.indexOf(b.bloodline.toLowerCase());
                    primaryComparison = aBloodlineIndex - bBloodlineIndex;
                    break;
                }
                default:
                    return 0;
            }

            // If primary comparison is not 0, return it
            if (primaryComparison !== 0) {
                return primaryComparison;
            }

            // Secondary sort: by number of accounts per essencer (descending)
            const aAccountCount = essencerAccountCounts.get(a.name) || 0;
            const bAccountCount = essencerAccountCounts.get(b.name) || 0;
            const accountCountComparison = bAccountCount - aAccountCount;

            if (accountCountComparison !== 0) {
                return accountCountComparison;
            }

            // Tertiary sort: by bloodline within the same essencer (Primogenit, Porveldam, Spadelline, Zephiroth, Gladasmy)
            const bloodlineOrder = ['primogenit', 'porveldam', 'spadelline', 'zephiroth', 'gladasmy'];
            const aBloodlineIndex = bloodlineOrder.indexOf(a.bloodline.toLowerCase());
            const bBloodlineIndex = bloodlineOrder.indexOf(b.bloodline.toLowerCase());
            const bloodlineComparison = aBloodlineIndex - bBloodlineIndex;

            if (bloodlineComparison !== 0) {
                return bloodlineComparison;
            }

            // Quaternary sort: by essencer name (ascending) for essencers with same account count and bloodline
            return a.name.localeCompare(b.name);
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

    // --- Handler para selección de tab ---
    const handleTabChange = (selectedId: string) => {
        setSelectedView(selectedId);
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
                <div className={styles.content__top}>
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
                    <div className={styles.content__search_stats}>
                        <div className={styles.search__container}>
                            <input
                                type="text"
                                placeholder="Search account or essencer..."
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
                        <div className={styles.stats__container}>
                            <div className={styles.stats__total_games}>
                                <img src="/images/ranked-btn/wins.png" alt="Total Games" />
                                <span>{(() => {
                                    const accountsAbove30 = rankedData.filter(account => account.level >= 30);
                                    const totalWins = accountsAbove30.reduce((sum, account) => sum + account.wins.current, 0);
                                    const totalPossible = accountsAbove30.reduce((sum, account) => sum + account.wins.totals, 0);
                                    return `${totalWins} / ${totalPossible}`;
                                })()}</span>
                            </div>

                            <div className={styles.stats__divider}></div>

                            <div className={styles.stats__porveldam}>
                                <img src="/images/ranked-btn/porveldam.png" alt="Porveldam" />
                                <span>{(() => {
                                    const porveldam = rankedData.filter(account => account.bloodline.toLowerCase() === 'porveldam' && account.level >= 30);
                                    const totalWins = porveldam.reduce((sum, account) => sum + account.wins.current, 0);
                                    const totalPossible = porveldam.reduce((sum, account) => sum + account.wins.totals, 0);
                                    return `${totalWins} / ${totalPossible}`;
                                })()}</span>
                            </div>

                            <div className={styles.stats__divider}></div>

                            <div className={styles.stats__spadelline}>
                                <img src="/images/ranked-btn/spadelline.png" alt="Spadelline" />
                                <span>{(() => {
                                    const spadelline = rankedData.filter(account => account.bloodline.toLowerCase() === 'spadelline' && account.level >= 30);
                                    const totalWins = spadelline.reduce((sum, account) => sum + account.wins.current, 0);
                                    const totalPossible = spadelline.reduce((sum, account) => sum + account.wins.totals, 0);
                                    return `${totalWins} / ${totalPossible}`;
                                })()}</span>
                            </div>

                            <div className={styles.stats__divider}></div>

                            <div className={styles.stats__zephiroth}>
                                <img src="/images/ranked-btn/zephiroth.png" alt="Zephiroth" />
                                <span>{(() => {
                                    const zephiroth = rankedData.filter(account => account.bloodline.toLowerCase() === 'zephiroth' && account.level >= 30);
                                    const totalWins = zephiroth.reduce((sum, account) => sum + account.wins.current, 0);
                                    const totalPossible = zephiroth.reduce((sum, account) => sum + account.wins.totals, 0);
                                    return `${totalWins} / ${totalPossible}`;
                                })()}</span>
                            </div>

                            <div className={styles.stats__divider}></div>

                            <div className={styles.stats__gladasmy}>
                                <img src="/images/ranked-btn/gladasmy.png" alt="Gladasmy" />
                                <span>{(() => {
                                    const gladasmy = rankedData.filter(account => account.bloodline.toLowerCase() === 'gladasmy' && account.level >= 30);
                                    const totalWins = gladasmy.reduce((sum, account) => sum + account.wins.current, 0);
                                    const totalPossible = gladasmy.reduce((sum, account) => sum + account.wins.totals, 0);
                                    return `${totalWins} / ${totalPossible}`;
                                })()}</span>
                            </div>

                            <div className={styles.stats__divider}></div>

                            <div className={styles.stats__primogenit}>
                                <img src="/images/ranked-btn/primogenit.png" alt="Primogenit" />
                                <span>{(() => {
                                    const primogenit = rankedData.filter(account => account.bloodline.toLowerCase() === 'primogenit' && account.level >= 30);
                                    const totalWins = primogenit.reduce((sum, account) => sum + account.wins.current, 0);
                                    const totalPossible = primogenit.reduce((sum, account) => sum + account.wins.totals, 0);
                                    return `${totalWins} / ${totalPossible}`;
                                })()}</span>
                            </div>

                        </div>
                    </div>
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
                            <div className={styles.header__missions}>
                                <Tab
                                    options={tabOptions}
                                    selectedOption={selectedView}
                                    onSelectionChange={handleTabChange}
                                />
                            </div>
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
                                            onUpdateRankedData={handleUpdateRankedData}
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
