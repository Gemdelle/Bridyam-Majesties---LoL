import React, { useState, useEffect } from 'react';
import styles from './Bloodlines.module.css';
import Filter, { type FilterOption } from '../../components/Filter';
import { fetchRankedData, type RankedData } from '../../services/apiRankedsService';
import { fetchChampions, type Champion, getRiotIdForChampion } from '../../services/championsService';
import { fetchMasteryData, type MasteryData, isGemUser, markChampionAsPurchased, unmarkChampionAsPurchased, isChampionPurchased } from '../../services/apiMasteriesService';

// --- Opciones para los filtros ---
const viewOptions: FilterOption[] = [
  { id: 'porveldam', label: 'Porveldam', image: '/images/ranked-btn/porveldam.png' },
  { id: 'spadelline', label: 'Spadelline', image: '/images/ranked-btn/spadelline.png' },
  { id: 'zephiroth', label: 'Zephiroth', image: '/images/ranked-btn/zephiroth.png' },
  { id: 'gladasmy', label: 'Gladasmy', image: '/images/ranked-btn/gladasmy.png' },
  { id: 'primogenit', label: 'Primogenit', image: '/images/ranked-btn/primogenit.png' }
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

  // --- Estado para los datos de masteries ---
  const [masteryData, setMasteryData] = useState<MasteryData[]>([]);
  const [masteryLoading, setMasteryLoading] = useState(true);

  // --- Estado para la b�squeda ---
  const [searchTerm, setSearchTerm] = useState<string>('');

  // --- Estado para GEM user ---
  const [isGem, setIsGem] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // --- Estado para ordenamiento por cuenta ---
  const [sortByAccount, setSortByAccount] = useState<number | null>(null);

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

  // --- Cargar datos de masteries ---
  useEffect(() => {
    const loadMasteries = async () => {
      try {
        setMasteryLoading(true);
        const data = await fetchMasteryData();
        setMasteryData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading mastery data');
      } finally {
        setMasteryLoading(false);
      }
    };

    loadMasteries();
  }, []);

  // --- Verificar si el usuario es GEM ---
  useEffect(() => {
    const checkGemStatus = () => {
      setIsGem(isGemUser());
    };
    checkGemStatus();
  }, [refreshKey]);



  // --- Funci�n para filtrar los datos ranked ---
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

  // --- Funci�n para filtrar los champions por rol ---
  const filterChampionsByRole = (championsToFilter: Champion[]) => {
    if (selectedFilters.length === 0) return championsToFilter;

    return championsToFilter.filter(champion => {
      // If champion doesn't have a role defined, show it in all filters
      if (!champion.role) return true;

      // Check if the champion's role matches any selected filter
      return selectedFilters.includes(champion.role);
    });
  };

  // --- Funci�n para filtrar los champions por b�squeda ---
  const filterChampionsBySearch = (championsToFilter: Champion[]) => {
    if (searchTerm.trim() === '') return championsToFilter;

    return championsToFilter.filter(champion =>
      champion.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // --- Funci�n para ordenar los champions ---
  const sortChampions = (championsToSort: Champion[]) => {
    if (selectedSorts.length === 0 && !sortByAccount) return championsToSort;

    const sortBy = selectedSorts[0]; // Take the first selected sort option

    return [...championsToSort].sort((a, b) => {
      // If sorting by specific account, use that account's mastery
      if (sortByAccount) {
        const masteryA = getMasteryLevel(sortByAccount, a.id);
        const masteryB = getMasteryLevel(sortByAccount, b.id);
        return masteryB - masteryA; // Descending order
      }

      switch (sortBy) {
        case 'id':
          // Sort by ID ascending (default)
          return a.id - b.id;
        case 'mastery': {
          // Sort by total mastery count across all accounts descending
          const { accounts } = getCurrentPageAccounts();
          const totalMasteryA = accounts.reduce((sum, account) => sum + getMasteryLevel(account.id, a.id), 0);
          const totalMasteryB = accounts.reduce((sum, account) => sum + getMasteryLevel(account.id, b.id), 0);
          return totalMasteryB - totalMasteryA;
        }
        default:
          return a.id - b.id;
      }
    });
  };

  // --- Funci�n para obtener el nivel de mastery ---
  const getMasteryLevel = (rankedId: number, championId: number): number => {
    const riotChampionId = getRiotIdForChampion(championId);
    const mastery = masteryData.find(m => m.ranked_id === rankedId && m.champion_id === riotChampionId);
    const realMasteryLevel = mastery ? mastery.champion_level : 0;

    // If champion is marked as purchased, show mastery 0
    if (isChampionPurchased(rankedId, championId)) {
      return 0;
    }

    return realMasteryLevel;
  };

  // --- Funci�n para obtener la imagen de mastery ---
  const getMasteryImage = (rankedId: number, championId: number, masteryLevel: number): string => {
    // If champion is marked as purchased, show bought.png
    if (isChampionPurchased(rankedId, championId)) {
      return `/images/masteries/mastery/bought.png`;
    }

    if (masteryLevel > 10) {
      return `/images/masteries/mastery/10+.png`;
    }
    return `/images/masteries/mastery/${masteryLevel}.png`;
  };

  // --- Funciones para manejar champions comprados ---
  const handleMasteryClick = (rankedId: number, championId: number) => {
    if (!isGem) return;

    const riotChampionId = getRiotIdForChampion(championId);
    const mastery = masteryData.find(m => m.ranked_id === rankedId && m.champion_id === riotChampionId);
    const realMasteryLevel = mastery ? mastery.champion_level : 0;

    // Solo permitir marcar como comprado si no tiene maestría real
    if (realMasteryLevel === 0) {
      if (isChampionPurchased(rankedId, championId)) {
        // Si ya está marcado como comprado, desmarcarlo
        unmarkChampionAsPurchased(rankedId, championId);
      } else {
        // Si no está marcado, marcarlo como comprado
        markChampionAsPurchased(rankedId, championId);
      }
      // Force re-render by updating refreshKey
      setRefreshKey(prev => prev + 1);
    }
  };

  const getRealMasteryLevel = (rankedId: number, championId: number): number => {
    const riotChampionId = getRiotIdForChampion(championId);
    const mastery = masteryData.find(m => m.ranked_id === rankedId && m.champion_id === riotChampionId);
    return mastery ? mastery.champion_level : 0;
  };

  // Check if champion is owned (has mastery > 0 OR is marked as purchased)
  const isChampionOwned = (rankedId: number, championId: number): boolean => {
    const realMasteryLevel = getRealMasteryLevel(rankedId, championId);
    const isPurchased = isChampionPurchased(rankedId, championId);

    // Champion is owned if it has real mastery OR is marked as purchased
    return realMasteryLevel > 0 || isPurchased;
  };

  // Clean summoner name (remove GEM prefix and #GEM/#LAS suffix)
  const cleanSummonerName = (summonerName: string): string => {
    // Remove "GEM " prefix if it exists
    let cleanName = summonerName.replace(/^GEM\s+/, '');
    // Remove " #GEM" suffix if it exists
    cleanName = cleanName.replace(/\s+#GEM$/, '');
    // Remove "#GEM" suffix if it exists (without space)
    cleanName = cleanName.replace(/#GEM$/, '');
    // Remove " #LAS" suffix if it exists
    cleanName = cleanName.replace(/\s+#LAS$/, '');
    // Remove "#LAS" suffix if it exists (without space)
    cleanName = cleanName.replace(/#LAS$/, '');
    return cleanName;
  };

  // Get portrait URL from portraits.json
  const getPortraitUrl = (majestyName: string): string => {

    const img_name = majestyName.replace(/^GEM\s+/, '').replace(/\s+#GEM$/, '').replace(/#GEM$/, '').replace(/\s+#LAS$/, '').replace(/#LAS$/, '');

    return `/images/portraits/${img_name}.png`;
  };

  // Handle click on account header to sort by mastery
  const handleAccountHeaderClick = (accountId: number) => {
    setSortByAccount(accountId);
  };


  // --- Calcular las accounts a mostrar ---
  const getCurrentPageAccounts = () => {
    const filteredData = filterRankedData(rankedData);
    return { accounts: filteredData };
  };



  // --- Handler para selecci�n �nica de view ---
  const handleViewChange = (newSelection: string[]) => {
    // For single selection, we want to replace the current selection
    // If the new selection is empty, keep the current one
    if (newSelection.length > 0) {
      const newView = newSelection[newSelection.length - 1]; // Get the last selected item
      setSelectedView(newView);
    }
  };



  if (loading || championsLoading || masteryLoading) {
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
                  �
                </button>
              )}
            </div>
            <div className={styles.stats__container}>

              <div className={styles.stats__porveldam}>
                <img src="/images/ranked-btn/porveldam.png" alt="Porveldam" />
                <span>{(() => {
                  const porveldam = rankedData.filter(account => account.bloodline.toLowerCase() === 'porveldam');
                  const totalChampions = champions.length;
                  // Calculate real mastery ownership: count champions with mastery level > 0
                  const ownedChampions = porveldam.reduce((total, account) => {
                    return total + champions.filter(champion => isChampionOwned(account.id, champion.id)).length;
                  }, 0);
                  const totalPossible = totalChampions * porveldam.length;
                  const percentage = totalPossible > 0 ? Math.round((ownedChampions / totalPossible) * 100) : 0;
                  return `${percentage}%`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__spadelline}>
                <img src="/images/ranked-btn/spadelline.png" alt="Spadelline" />
                <span>{(() => {
                  const spadelline = rankedData.filter(account => account.bloodline.toLowerCase() === 'spadelline');
                  const totalChampions = champions.length;
                  // Calculate real mastery ownership: count champions with mastery level > 0
                  const ownedChampions = spadelline.reduce((total, account) => {
                    return total + champions.filter(champion => isChampionOwned(account.id, champion.id)).length;
                  }, 0);
                  const totalPossible = totalChampions * spadelline.length;
                  const percentage = totalPossible > 0 ? Math.round((ownedChampions / totalPossible) * 100) : 0;
                  return `${percentage}%`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__zephiroth}>
                <img src="/images/ranked-btn/zephiroth.png" alt="Zephiroth" />
                <span>{(() => {
                  const zephiroth = rankedData.filter(account => account.bloodline.toLowerCase() === 'zephiroth');
                  const totalChampions = champions.length;
                  // Calculate real mastery ownership: count champions with mastery level > 0
                  const ownedChampions = zephiroth.reduce((total, account) => {
                    return total + champions.filter(champion => isChampionOwned(account.id, champion.id)).length;
                  }, 0);
                  const totalPossible = totalChampions * zephiroth.length;
                  const percentage = totalPossible > 0 ? Math.round((ownedChampions / totalPossible) * 100) : 0;
                  return `${percentage}%`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__gladasmy}>
                <img src="/images/ranked-btn/gladasmy.png" alt="Gladasmy" />
                <span>{(() => {
                  const gladasmy = rankedData.filter(account => account.bloodline.toLowerCase() === 'gladasmy');
                  const totalChampions = champions.length;
                  // Calculate real mastery ownership: count champions with mastery level > 0
                  const ownedChampions = gladasmy.reduce((total, account) => {
                    return total + champions.filter(champion => isChampionOwned(account.id, champion.id)).length;
                  }, 0);
                  const totalPossible = totalChampions * gladasmy.length;
                  const percentage = totalPossible > 0 ? Math.round((ownedChampions / totalPossible) * 100) : 0;
                  return `${percentage}%`;
                })()}</span>
              </div>

              <div className={styles.stats__divider}></div>

              <div className={styles.stats__primogenit}>
                <img src="/images/ranked-btn/primogenit.png" alt="Primogenit" />
                <span>{(() => {
                  const primogenit = rankedData.filter(account => account.bloodline.toLowerCase() === 'primogenit');
                  const totalChampions = champions.length;
                  // Calculate real mastery ownership: count champions with mastery level > 0
                  const ownedChampions = primogenit.reduce((total, account) => {
                    return total + champions.filter(champion => isChampionOwned(account.id, champion.id)).length;
                  }, 0);
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
                  <div
                    key={account.id}
                    className={styles.header__account}
                    onClick={() => handleAccountHeaderClick(account.id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: sortByAccount === account.id ? 'rgba(200, 155, 60, 0.2)' : 'transparent',
                      border: sortByAccount === account.id ? '2px solid #c89b3c' : 'none'
                    }}
                  >
                    <div className={styles.account__portrait}>
                      <img src={getPortraitUrl(account.username)} alt={account.username} />
                    </div>
                    <div className={styles.account__name}>
                      <div>{account.name}</div>
                      <div className={styles.majesty__name}>{cleanSummonerName(account.username)}</div>
                    </div>
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
                    return accounts.map((account) => {
                      const masteryLevel = getMasteryLevel(account.id, champion.id);
                      const isSmallMastery = masteryLevel >= 1 && masteryLevel <= 5;
                      const isLargeMastery = masteryLevel >= 10;
                      const hasGlow = masteryLevel >= 5;
                      const masteryText = masteryLevel > 10 ? '10+' : masteryLevel.toString();
                      const realMasteryLevel = getRealMasteryLevel(account.id, champion.id);
                      const isPurchased = isChampionPurchased(account.id, champion.id);
                      const canClick = isGem && realMasteryLevel === 0;

                      return (
                        <div key={account.id} className={styles.row__account}>
                          <img
                            src={getMasteryImage(account.id, champion.id, masteryLevel)}
                            alt={`Mastery ${masteryText}`}
                            className={`${styles.mastery__image} ${isSmallMastery ? styles['mastery__image--small'] : ''} ${isLargeMastery ? styles['mastery__image--large'] : ''} ${hasGlow ? styles['mastery__image--glow'] : ''} ${isPurchased ? styles['mastery__image--bought'] : ''}`}
                            style={{
                              cursor: canClick ? 'pointer' : 'default',
                              opacity: canClick ? 0.8 : 1
                            }}
                            onClick={() => handleMasteryClick(account.id, champion.id)}
                            title={canClick ? (isPurchased ? 'Click to unmark as purchased' : 'Click to mark as purchased') : ''}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              ))}

              {/* Summary row showing champions count for each account */}
              <div className={`${styles.data__row} ${styles.summary__row}`}>
                <div className={styles.row__id}></div>
                <div className={`${styles.row__champion} ${styles.summary__label}`}>Champions</div>
                {(() => {
                  const { accounts } = getCurrentPageAccounts();
                  return accounts.map((account) => {
                    const ownedChampions = champions.filter(champion => isChampionOwned(account.id, champion.id)).length;
                    const totalChampions = champions.length;
                    return (
                      <div key={account.id} className={styles.row__account}>
                        <span className={styles.champions__count}>
                          {ownedChampions} / {totalChampions}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bloodlines;
