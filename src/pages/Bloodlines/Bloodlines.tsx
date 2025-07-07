import React, { useState, useEffect } from 'react';
import styles from './Bloodlines.module.css';
import Filter, { type FilterOption } from '../../components/Filter';
import { fetchRankedData, type RankedData } from '../../services/apiRankedsService';
import { fetchChampions, type Champion } from '../../services/championsService';

// --- Opciones para los filtros ---
const viewOptions: FilterOption[] = [
  { id: 'porveldam', label: 'Porveldam', image: '/src/assets/images/ranked-btn/porveldam.png' },
  { id: 'spadelline', label: 'Spadelline', image: '/src/assets/images/ranked-btn/spadelline.png' },
  { id: 'zephiroth', label: 'Zephiroth', image: '/src/assets/images/ranked-btn/zephiroth.png' },
  { id: 'gladasmy', label: 'Gladasmy', image: '/src/assets/images/ranked-btn/gladasmy.png' },
  { id: 'primogenit', label: 'Primogenit', image: '/src/assets/images/ranked-btn/primogenit.png' }
];

const filterOptions: FilterOption[] = [
  { id: 'top', label: 'Top' },
  { id: 'jungle', label: 'Jungle' },
  { id: 'mid', label: 'Mid' },
  { id: 'adc', label: 'ADC' },
  { id: 'support', label: 'Support' },
];

const sortOptions: FilterOption[] = [
  { id: 'id', label: 'ID' },
  { id: 'mastery', label: 'Mastery Count' },
];

const Bloodlines: React.FC = () => {
  // --- Estados para cada filtro ---
  const [selectedView, setSelectedView] = useState<string>('porveldam');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedSorts, setSelectedSorts] = useState<string[]>(['id']);

  // --- Estado para los datos de ranked ---
  const [rankedData, setRankedData] = useState<RankedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estado para los datos de champions ---
  const [champions, setChampions] = useState<Champion[]>([]);
  const [championsLoading, setChampionsLoading] = useState(true);



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

  // --- Cargar datos de champions ---
  useEffect(() => {
    const loadChampions = async () => {
      try {
        setChampionsLoading(true);
        const data = await fetchChampions();
        setChampions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading champions data');
      } finally {
        setChampionsLoading(false);
      }
    };

    loadChampions();
  }, []);



  // --- Función para filtrar los datos ranked ---
  const filterRankedData = (dataToFilter: RankedData[]) => {
    let filteredData = dataToFilter;

    // Apply bloodline view filter
    if (selectedView && ['porveldam', 'spadelline', 'zephiroth', 'gladasmy', 'primogenit'].includes(selectedView)) {
      filteredData = filteredData.filter(data =>
        data.bloodline.toLowerCase() === selectedView.toLowerCase()
      );
    }

    return filteredData;
  };

  // --- Función para filtrar los champions por rol ---
  const filterChampionsByRole = (championsToFilter: Champion[]) => {
    if (selectedFilters.length === 0) return championsToFilter;

    return championsToFilter.filter(champion => {
      // If champion doesn't have a role defined, show it in all filters
      if (!champion.role) return true;

      // Check if the champion's role matches any selected filter
      return selectedFilters.includes(champion.role);
    });
  };

  // --- Función para filtrar los champions por búsqueda ---
  const filterChampionsBySearch = (championsToFilter: Champion[]) => {
    if (searchTerm.trim() === '') return championsToFilter;

    return championsToFilter.filter(champion =>
      champion.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // --- Función para ordenar los champions ---
  const sortChampions = (championsToSort: Champion[]) => {
    if (selectedSorts.length === 0) return championsToSort;

    const sortBy = selectedSorts[0]; // Take the first selected sort option

    return [...championsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'id':
          // Sort by ID ascending (default)
          return a.id - b.id;
        case 'mastery':
          // Sort by mastery count descending
          // For now, this is a placeholder - will be replaced with actual mastery data
          // Currently sorting by ID descending as placeholder
          return b.id - a.id;
        default:
          return a.id - b.id;
      }
    });
  };

  // --- Calcular las accounts a mostrar ---
  const getCurrentPageAccounts = () => {
    const filteredData = filterRankedData(rankedData);
    return { accounts: filteredData };
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



  if (loading || championsLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.content}>
            <p>Loading bloodlines...</p>
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
            <div className={styles.stats__container}>

              <div className={styles.stats__porveldam}>
                <img src="/src/assets/images/ranked-btn/porveldam.png" alt="Porveldam" />
                <span>{(() => {
                  const porveldam = rankedData.filter(account => account.bloodline.toLowerCase() === 'porveldam');
                  const totalChampions = champions.length;
                  // Placeholder: Each Porveldam account owns ~30% of champions
                  const ownedChampions = Math.floor(totalChampions * 0.3 * porveldam.length);
                  const totalPossible = totalChampions * porveldam.length;
                  const percentage = totalPossible > 0 ? Math.round((ownedChampions / totalPossible) * 100) : 0;
                  return `${percentage}%`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__spadelline}>
                <img src="/src/assets/images/ranked-btn/spadelline.png" alt="Spadelline" />
                <span>{(() => {
                  const spadelline = rankedData.filter(account => account.bloodline.toLowerCase() === 'spadelline');
                  const totalChampions = champions.length;
                  // Placeholder: Each Spadelline account owns ~25% of champions
                  const ownedChampions = Math.floor(totalChampions * 0.25 * spadelline.length);
                  const totalPossible = totalChampions * spadelline.length;
                  const percentage = totalPossible > 0 ? Math.round((ownedChampions / totalPossible) * 100) : 0;
                  return `${percentage}%`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__zephiroth}>
                <img src="/src/assets/images/ranked-btn/zephiroth.png" alt="Zephiroth" />
                <span>{(() => {
                  const zephiroth = rankedData.filter(account => account.bloodline.toLowerCase() === 'zephiroth');
                  const totalChampions = champions.length;
                  // Placeholder: Each Zephiroth account owns ~35% of champions
                  const ownedChampions = Math.floor(totalChampions * 0.35 * zephiroth.length);
                  const totalPossible = totalChampions * zephiroth.length;
                  const percentage = totalPossible > 0 ? Math.round((ownedChampions / totalPossible) * 100) : 0;
                  return `${percentage}%`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__gladasmy}>
                <img src="/src/assets/images/ranked-btn/gladasmy.png" alt="Gladasmy" />
                <span>{(() => {
                  const gladasmy = rankedData.filter(account => account.bloodline.toLowerCase() === 'gladasmy');
                  const totalChampions = champions.length;
                  // Placeholder: Each Gladasmy account owns ~20% of champions
                  const ownedChampions = Math.floor(totalChampions * 0.2 * gladasmy.length);
                  const totalPossible = totalChampions * gladasmy.length;
                  const percentage = totalPossible > 0 ? Math.round((ownedChampions / totalPossible) * 100) : 0;
                  return `${percentage}%`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__primogenit}>
                <img src="/src/assets/images/ranked-btn/primogenit.png" alt="Primogenit" />
                <span>{(() => {
                  const primogenit = rankedData.filter(account => account.bloodline.toLowerCase() === 'primogenit');
                  const totalChampions = champions.length;
                  // Placeholder: Each Primogenit account owns ~45% of champions
                  const ownedChampions = Math.floor(totalChampions * 0.45 * primogenit.length);
                  const totalPossible = totalChampions * primogenit.length;
                  const percentage = totalPossible > 0 ? Math.round((ownedChampions / totalPossible) * 100) : 0;
                  return `${percentage}%`;
                })()}</span>
              </div>

            </div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.accounts}>
            <div className={styles.accounts__header}>
              <div className={styles.header__id}>ID</div>
              <div className={styles.header__champion}>CHAMPION</div>
              {(() => {
                const { accounts } = getCurrentPageAccounts();
                return accounts.map((account) => (
                  <div key={account.id} className={styles.header__account}>
                    <div className={styles.account__portrait}>
                      <img src={`/src/assets/images/portraits/${account.name}.png`} alt={account.name} />
                    </div>
                    <div className={styles.account__name}>{account.name}</div>
                  </div>
                ));
              })()}
            </div>

            {/* Data rows will go here */}
            <div className={styles.data__rows}>
              {sortChampions(filterChampionsByRole(filterChampionsBySearch(champions))).map((champion) => (
                <div key={champion.id} className={styles.data__row}>
                  <div className={styles.row__id}>{champion.id}</div>
                  <div className={styles.row__champion}>{champion.name}</div>
                  {(() => {
                    const { accounts } = getCurrentPageAccounts();
                    return accounts.map((account) => (
                      <div key={account.id} className={styles.row__account}>
                        {/* Account-specific data will go here */}
                        <img src="/src/assets/images/masteries/mastery/mastery_0.png" alt="Mastery 0" className={styles.mastery__image} />
                      </div>
                    ));
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bloodlines;
