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
    { id: 'tier', label: 'tier' },
    { id: 'division', label: 'division' },
    { id: 'lp', label: 'lp' },
    { id: 'wins', label: 'wins' },
    { id: 'losses', label: 'losses' },
    { id: 'winrate', label: 'winrate' },
];

const sortOptions: FilterOption[] = [
    { id: 'alphabetical', label: 'alphabetical' },
    { id: 'tier', label: 'tier' },
    { id: 'lp', label: 'lp' },
    { id: 'winrate', label: 'winrate' },
];

const Ranked: React.FC = () => {
    // --- Estados para cada filtro ---
    const [selectedView, setSelectedView] = useState<string>('missions');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [selectedSorts, setSelectedSorts] = useState<string[]>(['tier']);

    // --- Estado para los datos de portraits ---
    const [portraits, setPortraits] = useState<Portrait[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Estado para la paginación ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const totalPages = Math.ceil(portraits.length / itemsPerPage);

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

    // --- Calcular las accounts a mostrar en la página actual ---
    const getCurrentPageAccounts = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return portraits.slice(startIndex, endIndex);
    };

    const handlePageChange = (newPage: number) => {
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
                        {getCurrentPageAccounts().map((portrait) => (
                            <RankedAccount
                                key={portrait.id}
                                portrait={portrait}
                                selectedView={selectedView}
                            />
                        ))}
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
            </div>
        </div>
    );
};

export default Ranked; 