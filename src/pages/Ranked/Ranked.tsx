import React, { useState, useEffect } from 'react';
import styles from './Ranked.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import RankedAccount from '../../components/RankedAccount/RankedAccount';
import { fetchRankedData, updateRankedData, type RankedData } from '../../services/apiRankedsService';

// --- Opciones para los filtros ---
const viewOptions: FilterOption[] = [
    { id: 'low', label: 'low', image: 'https://placehold.co/24x24/ff6b6b/ffffff.png?text=📉' },
    { id: 'ranking', label: 'ranking', image: 'https://placehold.co/24x24/4a90e2/ffffff.png?text=🏆' },
    { id: 'all', label: 'all', image: 'https://placehold.co/24x24/50c878/ffffff.png?text=📊' }
];

const filterOptions: FilterOption[] = [
    { id: 'porveldam', label: 'Porveldam', image: '/images/ranked-btn/porveldam.png' },
    { id: 'spadelline', label: 'Spadelline', image: '/images/ranked-btn/spadelline.png' },
    { id: 'zephiroth', label: 'Zephiroth', image: '/images/ranked-btn/zephiroth.png' },
    { id: 'gladasmy', label: 'Gladasmy', image: '/images/ranked-btn/gladasmy.png' },
    { id: 'primogenit', label: 'Primogenit', image: '/images/ranked-btn/primogenit.png' },
];

// Las opciones de essencers se generarán dinámicamente basándose en los datos

const Ranked: React.FC = () => {
    // --- Estados para cada filtro ---
    const [selectedView, setSelectedView] = useState<string>('all');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [selectedEssencers, setSelectedEssencers] = useState<string[]>([]);

    // --- Estado para los datos de ranked ---
    const [rankedData, setRankedData] = useState<RankedData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Estado para la paginación ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 16;

    // --- Estado para la búsqueda ---
    const [searchTerm, setSearchTerm] = useState<string>('');

    // --- Estado para el ordenamiento por columnas ---
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // --- Generar opciones de essencers dinámicamente ---
    const getEssencerOptions = (): FilterOption[] => {
        const uniqueEssencers = [...new Set(rankedData.map(account => account.name))];
        return uniqueEssencers
            .sort((a, b) => a.localeCompare(b)) // Ordenar alfabéticamente
            .map(essencer => ({
                id: essencer.toLowerCase(),
                label: essencer
            }));
    };

    // --- Cargar datos de ranked ---
    useEffect(() => {
        const loadRankedData = async () => {
            try {
                setLoading(true);
                const data = await fetchRankedData();

                // Set default honor level to 3 only for accounts that don't have honor set
                const dataWithDefaultHonor = data.map(account => ({
                    ...account,
                    honor: account.honor && account.honor > 0 ? account.honor : 3 // Only set to 3 if honor is 0, null, or undefined
                }));

                setRankedData(dataWithDefaultHonor);
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

        // Apply view filter first (level-based filtering)
        if (selectedView === 'low') {
            filteredData = filteredData.filter(data => data.level < 30);
        } else if (selectedView === 'ranking') {
            filteredData = filteredData.filter(data => data.level >= 30);
        }
        // 'all' shows everything, so no filtering needed

        // Apply search filter
        if (searchTerm.trim() !== '') {
            filteredData = filteredData.filter(data =>
                data.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                data.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply bloodline filters
        if (selectedFilters.length > 0) {
            filteredData = filteredData.filter(data => {
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

                return true;
            });
        }

        // Apply essencer filters
        if (selectedEssencers.length > 0) {
            filteredData = filteredData.filter(data => {
                return selectedEssencers.some(essencer =>
                    data.name.toLowerCase() === essencer
                );
            });
        }

        return filteredData;
    };

    // --- Función para ordenar los datos ranked ---
    const sortRankedData = (dataToSort: RankedData[]) => {
        // Si hay un ordenamiento por columna activo, usarlo en lugar del filtro de sort
        if (sortColumn) {
            return [...dataToSort].sort((a, b) => {
                let comparison = 0;

                switch (sortColumn) {
                    case 'id':
                        comparison = a.id - b.id;
                        break;
                    case 'level':
                        comparison = a.level - b.level;
                        break;
                    case 'essencer':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'wins':
                        comparison = a.wins.current - b.wins.current;
                        break;
                    case 'honor':
                        comparison = a.honor - b.honor;
                        break;
                    case 'soloq': {
                        const tierOrder = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond'];
                        const aTierIndex = tierOrder.indexOf(a.elo_soloq.tier.toLowerCase());
                        const bTierIndex = tierOrder.indexOf(b.elo_soloq.tier.toLowerCase());
                        if (aTierIndex !== bTierIndex) {
                            comparison = aTierIndex - bTierIndex;
                        } else {
                            comparison = a.elo_soloq.division - b.elo_soloq.division;
                        }
                        break;
                    }
                    case 'flex': {
                        const tierOrder = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond'];
                        const aTierIndexFlex = tierOrder.indexOf(a.elo_flex.tier.toLowerCase());
                        const bTierIndexFlex = tierOrder.indexOf(b.elo_flex.tier.toLowerCase());
                        if (aTierIndexFlex !== bTierIndexFlex) {
                            comparison = aTierIndexFlex - bTierIndexFlex;
                        } else {
                            comparison = a.elo_flex.division - b.elo_flex.division;
                        }
                        break;
                    }
                    default:
                        return 0;
                }

                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        // Si no hay ordenamiento por columna, usar ordenamiento por defecto (por wins descendente, luego por name)
        if (!sortColumn) {
            return [...dataToSort].sort((a, b) => {
                // Primero ordenar por wins (descendente - mayor a menor)
                const winsComparison = b.wins.current - a.wins.current;
                if (winsComparison !== 0) {
                    return winsComparison;
                }
                // Si tienen la misma cantidad de wins, ordenar por name (ascendente)
                return a.name.localeCompare(b.name);
            });
        }

        return dataToSort;
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

    // --- Handler para ordenamiento por columnas ---
    const handleColumnSort = (column: string) => {
        if (sortColumn === column) {
            // Si ya está ordenado por esta columna, cambiar dirección
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Nueva columna, empezar con ascendente
            setSortColumn(column);
            setSortDirection('asc');
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
                            title="ESSENCERS"
                            options={getEssencerOptions()}
                            selectedOptions={selectedEssencers}
                            onSelectionChange={setSelectedEssencers}
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
                                    const totalWins = rankedData.reduce((sum, account) => sum + account.wins.current, 0);
                                    const totalPossible = rankedData.length * 15; // All accounts * 15 games each
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
                    <div className={styles.accounts__header}>
                        <div
                            className={`${styles.header__id} ${styles.sortable}`}
                            onClick={() => handleColumnSort('id')}
                        >
                            ID{sortColumn === 'id' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                        </div>
                        <div className={styles.header__portrait}></div>
                        <div className={styles.header__name}>ACCOUNT</div>
                        <div
                            className={`${styles.header__level} ${styles.sortable}`}
                            onClick={() => handleColumnSort('level')}
                        >
                            LV{sortColumn === 'level' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                        </div>
                        <div
                            className={`${styles.header__essencer} ${styles.sortable}`}
                            onClick={() => handleColumnSort('essencer')}
                        >
                            ESSENCER{sortColumn === 'essencer' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                        </div>
                        <div
                            className={`${styles.header__wins} ${styles.sortable}`}
                            onClick={() => handleColumnSort('wins')}
                        >
                            WINS{sortColumn === 'wins' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                        </div>
                        <div
                            className={`${styles.header__honor} ${styles.sortable}`}
                            onClick={() => handleColumnSort('honor')}
                        >
                            HONOR{sortColumn === 'honor' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                        </div>
                        <div
                            className={`${styles.header__soloq} ${styles.sortable}`}
                            onClick={() => handleColumnSort('soloq')}
                        >
                            SOLO{sortColumn === 'soloq' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                        </div>
                        <div
                            className={`${styles.header__flex} ${styles.sortable}`}
                            onClick={() => handleColumnSort('flex')}
                        >
                            FLEX{sortColumn === 'flex' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                        </div>
                    </div>
                    <div className={styles.accounts__container}>
                        <div className={styles.accounts}>

                            {(() => {
                                const { accounts, totalPages } = getCurrentPageAccounts();
                                return (
                                    <>
                                        {accounts.map((rankedAccount) => (
                                            <RankedAccount
                                                key={rankedAccount.id}
                                                rankedData={rankedAccount}
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
                        <div className={styles.ranking__container}>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Ranked; 
