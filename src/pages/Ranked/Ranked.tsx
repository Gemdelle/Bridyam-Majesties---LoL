import React, { useState, useEffect } from 'react';
import styles from './Ranked.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import RankedAccount from '../../components/RankedAccount/RankedAccount';
import RankingTable from '../../components/RankingTable/RankingTable';
import { fetchRankedData, updateRankedData, type RankedData } from '../../services/apiRankedsService';
import { usePermissions } from '../../hooks/usePermissions';
import AchievementCard from '../../components/AchievementCard/AchievementCard';

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
    // --- Hook para permisos ---
    const permissions = usePermissions();
    const { canEditRankedUsername, isAdmin } = permissions;

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

    // --- Estado para el popup de reglas ---
    const [showRulesPopup, setShowRulesPopup] = useState(false);

    // --- Generar opciones de essencers dinámicamente ---
    const getEssencerOptions = (): FilterOption[] => {
        // Apply filters except essencer filter to get visible accounts
        let filteredData = rankedData;

        // Apply view filter (level-based filtering)
        if (selectedView === 'low') {
            filteredData = filteredData.filter(data => data.level < 30);
        } else if (selectedView === 'ranking') {
            filteredData = filteredData.filter(data => data.level >= 30);
        }

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

        // Extract unique essencers from filtered data
        const uniqueEssencers = [...new Set(filteredData.map(account => account.name))];
        return uniqueEssencers
            .sort((a, b) => a.localeCompare(b)) // Ordenar alfabéticamente
            .map(essencer => ({
                id: essencer.toLowerCase(),
                label: essencer
            }));
    };

    // --- Limpiar selecciones de essencers que ya no están disponibles ---
    useEffect(() => {
        const availableEssencerIds = getEssencerOptions().map(option => option.id);

        setSelectedEssencers(prevSelected => {
            const validSelectedEssencers = prevSelected.filter(essencer =>
                availableEssencerIds.includes(essencer)
            );

            // Only update if there's a difference
            if (validSelectedEssencers.length !== prevSelected.length) {
                return validSelectedEssencers;
            }
            return prevSelected;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedView, selectedFilters, searchTerm, rankedData]);

    // --- Log permissions for debugging ---
    useEffect(() => {
        console.log('Ranked page - Current permissions:', {
            isAdmin: permissions.isAdmin,
            editableUsernames: permissions.editableUsernames,
            canSeeAllNavigation: permissions.canSeeAllNavigation
        });
    }, [permissions]);

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

    // Calcular accounts y totalPages antes del render
    const { accounts, totalPages } = getCurrentPageAccounts();

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
                            <img src="/images/ranked-btn/wins.png" alt="Total Games" />
                            <span>{(() => {
                                const totalWins = rankedData.reduce((sum, account) => sum + account.wins.current, 0);
                                const totalPossible = rankedData.length * 15; // All accounts * 15 games each
                                return `${totalWins} / ${totalPossible}`;
                            })()}</span>
                        </div>


                    </div>
                    <div className={styles.ranking__rules__container}>
                        <div className={styles.rules__title__wrapper}>
                            {/* Partículas flotantes */}
                            <div className={styles.rules__particles__container}>
                                {Array.from({ length: 8 }, (_, i) => (
                                    <div key={i} className={`${styles.rules__particle} ${styles[`rules__particle__${i + 1}`]}`}></div>
                                ))}
                            </div>
                            <h2 className={styles.rules__title}>How can I earn points?</h2>
                        </div>
                        <button
                            className={styles.rules__button}
                            onClick={() => setShowRulesPopup(true)}
                        >
                            See how it works
                        </button>
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.header__container}>
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
                        <div className={styles.ranking__header}
                        >
                            <span className={styles.rank}>RANK</span>
                            <span className={styles.win}>WIN</span>
                            <span className={styles.mastery}>MASTERY</span>
                            <span className={styles.honor}>HONOR</span>
                            <span className={styles.level}>LEVEL</span>
                            <span className={styles.member}>MEMBER</span>
                            <span className={styles.elo}>ELO</span>
                            <span className={styles.score}>SCORE</span>
                        </div>
                    </div>
                    <div className={styles.accounts__container}>
                        <div className={styles.progress__container}>
                            <div className={styles.accounts}>
                                {accounts.map((rankedAccount) => {
                                    const canEdit = canEditRankedUsername(rankedAccount.username);
                                    console.log(`Ranked: ${rankedAccount.username} - canEdit: ${canEdit}, canEditEssencer: ${isAdmin}`);
                                    return (
                                        <RankedAccount
                                            key={rankedAccount.id}
                                            rankedData={rankedAccount}
                                            onUpdateRankedData={handleUpdateRankedData}
                                            canEdit={canEdit}
                                            canEditEssencer={isAdmin}
                                        />
                                    );
                                })}
                            </div>
                            <div className={styles.ranking__container}>
                                <RankingTable />
                            </div>
                        </div>
                    </div>
                    <div className={styles.pagination}>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                            &lt; Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                            Next &gt;
                        </button>
                    </div>
                </div>
            </div >

            {/* Popup de reglas */}
            {showRulesPopup && (
                <div className={styles.popup__overlay} onClick={() => setShowRulesPopup(false)}>
                    <div className={styles.popup__content} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.title__container}>
                            <h2 className={styles.title}>How to Earn Points</h2>
                        </div>
                        <div className={styles.achievements__container}>
                            {/* <RankingAchievement name="Achievement 1" description="Earn points for ..." iconSrc="/images/ranking/diamond/diamond-redeem.png" /> */}
                        </div>
                        <div className={styles.elo__container}>
                            <div className={styles.elo__items}>
                                <div className={styles.elo__item}>
                                    <span>bronze</span>
                                    <img src="/images/ranking/bronze/bronze-honor.png" alt="Elo" />
                                </div>
                                <div className={styles.elo__item}>
                                    <span>vesuvianite</span>
                                    <img src="/images/ranking/vesuvianite/vesuvianite-honor.png" alt="Elo" />
                                </div>
                                <div className={styles.elo__item}>
                                    <span>silver</span>
                                    <img src="/images/ranking/silver/silver-honor.png" alt="Elo" />
                                </div>
                                <div className={styles.elo__item}>
                                    <span>diamond</span>
                                    <img src="/images/ranking/diamond/diamond-honor.png" alt="Elo" />
                                </div>
                            </div>
                            <div className={styles.elo__explanation}>
                                <p>Earn points for every game won on your ranked accounts.</p>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Ranked; 
