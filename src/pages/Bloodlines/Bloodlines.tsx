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
  { id: 'bloodline', label: 'bloodline' },
];

const Bloodlines: React.FC = () => {
  // --- Estados para cada filtro ---
  const [selectedView, setSelectedView] = useState<string>('porveldam');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedSorts, setSelectedSorts] = useState<string[]>(['wins']);

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

    // Apply search filter first
    if (searchTerm.trim() !== '') {
      filteredData = filteredData.filter(data =>
        data.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply bloodline view filter
    if (selectedView && ['porveldam', 'spadelline', 'zephiroth', 'gladasmy', 'primogenit'].includes(selectedView)) {
      filteredData = filteredData.filter(data =>
        data.bloodline.toLowerCase() === selectedView.toLowerCase()
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
        case 'tier-soloq': {
          // Sort by tier and division (tier priority, then division)
          const aTierIndex = tierOrder.indexOf(a.elo_soloq.tier.toLowerCase());
          const bTierIndex = tierOrder.indexOf(b.elo_soloq.tier.toLowerCase());
          if (aTierIndex !== bTierIndex) {
            return bTierIndex - aTierIndex; // Higher tier first
          }
          return b.elo_soloq.division - a.elo_soloq.division; // Higher division first
        }
        case 'tier-flex': {
          const aTierIndexFlex = tierOrder.indexOf(a.elo_flex.tier.toLowerCase());
          const bTierIndexFlex = tierOrder.indexOf(b.elo_flex.tier.toLowerCase());
          if (aTierIndexFlex !== bTierIndexFlex) {
            return bTierIndexFlex - aTierIndexFlex; // Higher tier first
          }
          return b.elo_flex.division - a.elo_flex.division; // Higher division first
        }
        case 'wins':
          // Sort by wins current (descending)
          return b.wins.current - a.wins.current;
        case 'missions':
          // Sort by missions current (descending)
          return b.missions.current_act.current - a.missions.current_act.current;
        case 'hall missions':
          // Sort by hall missions current (descending)
          return b.missions.current_hall_of_legends.current - a.missions.current_hall_of_legends.current;
        case 'bloodline': {
          // Sort by bloodline in the order: Porveldam, Spadelline, Zephiroth, Gladasmy
          const bloodlineOrder = ['porveldam', 'spadelline', 'zephiroth', 'gladasmy'];
          const aBloodlineIndex = bloodlineOrder.indexOf(a.bloodline.toLowerCase());
          const bBloodlineIndex = bloodlineOrder.indexOf(b.bloodline.toLowerCase());
          return aBloodlineIndex - bBloodlineIndex;
        }
        default:
          return 0;
      }
    });
  };

  // --- Calcular las accounts a mostrar ---
  const getCurrentPageAccounts = () => {
    const filteredData = filterRankedData(rankedData);
    const sortedData = sortRankedData(filteredData);
    return { accounts: sortedData };
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
                <img src="/src/assets/images/ranked-btn/wins.png" alt="Total Games" />
                <span>{(() => {
                  const totalWins = rankedData.reduce((sum, account) => sum + account.wins.current, 0);
                  const totalPossible = rankedData.reduce((sum, account) => sum + account.wins.totals, 0);
                  return `${totalWins} / ${totalPossible}`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__porveldam}>
                <img src="/src/assets/images/ranked-btn/porveldam.png" alt="Porveldam" />
                <span>{(() => {
                  const porveldam = rankedData.filter(account => account.bloodline.toLowerCase() === 'porveldam');
                  const totalWins = porveldam.reduce((sum, account) => sum + account.wins.current, 0);
                  const totalPossible = porveldam.reduce((sum, account) => sum + account.wins.totals, 0);
                  return `${totalWins} / ${totalPossible}`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__spadelline}>
                <img src="/src/assets/images/ranked-btn/spadelline.png" alt="Spadelline" />
                <span>{(() => {
                  const spadelline = rankedData.filter(account => account.bloodline.toLowerCase() === 'spadelline');
                  const totalWins = spadelline.reduce((sum, account) => sum + account.wins.current, 0);
                  const totalPossible = spadelline.reduce((sum, account) => sum + account.wins.totals, 0);
                  return `${totalWins} / ${totalPossible}`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__zephiroth}>
                <img src="/src/assets/images/ranked-btn/zephiroth.png" alt="Zephiroth" />
                <span>{(() => {
                  const zephiroth = rankedData.filter(account => account.bloodline.toLowerCase() === 'zephiroth');
                  const totalWins = zephiroth.reduce((sum, account) => sum + account.wins.current, 0);
                  const totalPossible = zephiroth.reduce((sum, account) => sum + account.wins.totals, 0);
                  return `${totalWins} / ${totalPossible}`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__gladasmy}>
                <img src="/src/assets/images/ranked-btn/gladasmy.png" alt="Gladasmy" />
                <span>{(() => {
                  const gladasmy = rankedData.filter(account => account.bloodline.toLowerCase() === 'gladasmy');
                  const totalWins = gladasmy.reduce((sum, account) => sum + account.wins.current, 0);
                  const totalPossible = gladasmy.reduce((sum, account) => sum + account.wins.totals, 0);
                  return `${totalWins} / ${totalPossible}`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__primogenit}>
                <img src="/src/assets/images/ranked-btn/primogenit.png" alt="Primogenit" />
                <span>{(() => {
                  const primogenit = rankedData.filter(account => account.bloodline.toLowerCase() === 'primogenit');
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
              {champions.map((champion) => (
                <div key={champion.id} className={styles.data__row}>
                  <div className={styles.row__id}>{champion.id}</div>
                  <div className={styles.row__champion}>{champion.name}</div>
                  {(() => {
                    const { accounts } = getCurrentPageAccounts();
                    return accounts.map((account) => (
                      <div key={account.id} className={styles.row__account}>
                        {/* Account-specific data will go here */}
                        <span>-</span>
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
