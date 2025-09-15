import React, { useState, useEffect } from 'react';
import styles from './Bloodlines.module.css';
import Filter, { type FilterOption } from '../../components/Filter';
import { fetchRankedData, type RankedData } from '../../services/apiRankedsService';
import { fetchChampions, type Champion, getRiotIdForChampion } from '../../services/championsService';
import { fetchMasteryData, type MasteryData, isGemUser, updateMasteries } from '../../services/apiMasteriesService';

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
  }, []);



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

        // Convert null to 0 for comparison purposes
        const masteryAValue = masteryA ?? 0;
        const masteryBValue = masteryB ?? 0;

        // Sort by mastery level descending (10+, 20, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0)
        return masteryBValue - masteryAValue;
      }

      switch (sortBy) {
        case 'id':
          // Sort by ID ascending (default)
          return a.id - b.id;
        case 'mastery': {
          // Sort by total mastery count across all accounts descending
          const { accounts } = getCurrentPageAccounts();
          const totalMasteryA = accounts.reduce((sum, account) => sum + (getMasteryLevel(account.id, a.id) ?? 0), 0);
          const totalMasteryB = accounts.reduce((sum, account) => sum + (getMasteryLevel(account.id, b.id) ?? 0), 0);
          return totalMasteryB - totalMasteryA;
        }
        default:
          return a.id - b.id;
      }
    });
  };

  // --- Funci�n para obtener el nivel de mastery ---
  const getMasteryLevel = (rankedId: number, championId: number): number | null => {
    const riotChampionId = getRiotIdForChampion(championId);
    const mastery = masteryData.find(m => m.ranked_id === rankedId && m.champion_id === riotChampionId);
    // Champion levels now only come from API - no local overrides
    return mastery ? mastery.champion_level : null;
  };

  // --- Funci�n para obtener la imagen de mastery ---
  const getMasteryImage = (masteryLevel: number | null): string => {
    // If champion_level is 0, show bought.png
    if (masteryLevel === 0) {
      return `/images/masteries/mastery/bought.png`;
    }

    // If masteryLevel is null (no mastery data exists), show 0.png
    if (masteryLevel === null) {
      return `/images/masteries/mastery/0.png`;
    }

    if (masteryLevel > 10) {
      return `/images/masteries/mastery/10+.png`;
    }
    return `/images/masteries/mastery/${masteryLevel}.png`;
  };

  // --- Funciones para manejar champions comprados ---
  const handleMasteryClick = async (rankedId: number, championId: number) => {
    if (!isGem) return;

    console.log('handleMasteryClick called:', { rankedId, championId, isGem });

    const riotChampionId = getRiotIdForChampion(championId);
    const mastery = masteryData.find(m => m.ranked_id === rankedId && m.champion_id === riotChampionId);
    const currentMasteryLevel = mastery ? mastery.champion_level : null;

    console.log('Mastery data found:', { mastery, currentMasteryLevel, riotChampionId });

    // Solo permitir actualizar si no tiene maestría real (null) o si ya es 0
    if (currentMasteryLevel === 0 || currentMasteryLevel === null) {
      console.log('Mastery level is 0 or null, proceeding with update...');
      
      // Make PUT request to backend to toggle between 0 and null
      try {
        let masteryToUpdate: MasteryData;
        let newChampionLevel: number | null;
        
        if (mastery) {
          console.log('Existing mastery found, toggling level...');
          // Toggle between 0 and null
          newChampionLevel = mastery.champion_level === 0 ? null : 0;
          console.log(`Changing champion_level from ${mastery.champion_level} to ${newChampionLevel}`);
          
          // Update existing mastery
          masteryToUpdate = {
            ...mastery,
            champion_level: newChampionLevel
          };
        } else {
          console.log('No existing mastery found, creating new one with level 0...');
          newChampionLevel = 0;
          
          // Create new mastery entry
          masteryToUpdate = {
            id: null, // Let backend assign ID
            ranked_id: rankedId,
            username: rankedData.find(r => r.id === rankedId)?.username || '',
            champion_id: riotChampionId,
            champion_level: 0,
            champion_points: 0,
            champion_points_since_last_level: 0,
            champion_points_until_next_level: 0,
            chest_granted: false,
            last_play_time: new Date().toISOString()
          };
        }
        
        console.log('Sending PUT request with single mastery:', masteryToUpdate);
        
        // Send PUT request to backend with only the updated mastery
        await updateMasteries([masteryToUpdate]);
        
        console.log('PUT request successful, reloading data...');
        
        // Reload mastery data from backend to reflect changes
        const updatedData = await fetchMasteryData();
        setMasteryData(updatedData);
        
        console.log('Data reloaded successfully');
      } catch (error) {
        console.error('Error updating masteries in backend:', error);
        // Optionally, you could show an error message to the user here
      }
    } else {
      console.log('Mastery level is greater than 0, skipping update');
    }
  };


  // Check if champion is owned (has mastery > 0)
  const isChampionOwned = (rankedId: number, championId: number): boolean => {
    const masteryLevel = getMasteryLevel(rankedId, championId);
    // Champion is owned if it has mastery > 0 (including level 0 which means purchased)
    return masteryLevel !== null && masteryLevel >= 0;
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
    // If clicking the same account, toggle off the sorting
    if (sortByAccount === accountId) {
      setSortByAccount(null);
    } else {
      setSortByAccount(accountId);
    }
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
                      borderTop: sortByAccount === account.id ? '2px solid #c89b3c' : 'none',
                      borderLeft: sortByAccount === account.id ? '2px solid #c89b3c' : 'none',
                      borderRight: sortByAccount === account.id ? '2px solid #c89b3c' : 'none'
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
                      const masteryValue = masteryLevel ?? 0;
                      const isSmallMastery = masteryValue >= 1 && masteryValue <= 5;
                      const isLargeMastery = masteryValue >= 10;
                      const hasGlow = masteryValue >= 5;
                      const masteryText = masteryValue > 10 ? '10+' : masteryValue.toString();
                      const canClick = isGem && (masteryLevel === 0 || masteryLevel === null);

                      return (
                        <div key={account.id} className={styles.row__account}>
                          <img
                            src={getMasteryImage(masteryLevel)}
                            alt={`Mastery ${masteryText}`}
                            className={`${styles.mastery__image} ${isSmallMastery ? styles['mastery__image--small'] : ''} ${isLargeMastery ? styles['mastery__image--large'] : ''} ${hasGlow ? styles['mastery__image--glow'] : ''} ${masteryLevel === 0 ? styles['mastery__image--bought'] : ''}`}
                            style={{
                              cursor: canClick ? 'pointer' : 'default',
                              opacity: canClick ? 0.8 : 1
                            }}
                            onClick={() => handleMasteryClick(account.id, champion.id)}
                            title={canClick ? (masteryLevel === 0 ? 'Click to remove purchased status' : 'Click to mark as purchased') : ''}
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
