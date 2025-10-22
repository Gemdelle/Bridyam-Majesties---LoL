import React, { useState, useEffect, useRef } from 'react';
import styles from './Bloodlines.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import { fetchRankedData, type RankedData } from '../../services/apiRankedsService';
import { fetchChampions, type Champion, getRiotIdForChampion } from '../../services/championsService';
import { fetchMasteryData, type MasteryData, updateMasteriesByRankedId } from '../../services/apiMasteriesService';
import { usePermissions } from '../../hooks/usePermissions';

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

  // --- Hook para permisos ---
  const { canEditRankedUsername } = usePermissions();

  // --- Estado para ordenamiento por cuenta ---
  const [sortByAccount, setSortByAccount] = useState<number | null>(null);

  // --- Estado para el dropdown de mastery ---
  const [activeMasteryDropdown, setActiveMasteryDropdown] = useState<string | null>(null);
  const masteryDropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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


  // --- Cerrar dropdown cuando se hace clic fuera ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside the active dropdown
      if (activeMasteryDropdown) {
        const activeRef = masteryDropdownRefs.current.get(activeMasteryDropdown);
        if (activeRef && !activeRef.contains(target)) {
          setActiveMasteryDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMasteryDropdown]);



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

        // Handle null (not acquired), 0 (purchased), and >0 (mastery levels)
        // Sort order: mastery levels > 0, then purchased (0), then not acquired (null)

        // If both are null, sort by ID
        if (masteryA === null && masteryB === null) {
          return a.id - b.id;
        }

        // If A is null and B is not, B comes first
        if (masteryA === null && masteryB !== null) {
          return 1;
        }

        // If B is null and A is not, A comes first
        if (masteryB === null && masteryA !== null) {
          return -1;
        }

        // Both are not null, sort by mastery level descending
        // At this point, both masteryA and masteryB are guaranteed to be numbers (not null)
        return (masteryB ?? 0) - (masteryA ?? 0);
      }

      switch (sortBy) {
        case 'id':
          // Sort by ID ascending (default)
          return a.id - b.id;
        case 'mastery': {
          // Sort by total mastery count across all accounts descending
          const { accounts } = getCurrentPageAccounts();

          // Count how many accounts have mastery levels > 0, then purchased (0), then not acquired (null)
          const getMasteryScore = (championId: number) => {
            let masteryLevels = 0;
            let purchased = 0;
            let notAcquired = 0;

            accounts.forEach(account => {
              const mastery = getMasteryLevel(account.id, championId);
              if (mastery === null) notAcquired++;
              else if (mastery === 0) purchased++;
              else masteryLevels++;
            });

            // Return a score where mastery levels have highest priority, then purchased, then not acquired
            return masteryLevels * 1000 + purchased * 100 + notAcquired;
          };

          const scoreA = getMasteryScore(a.id);
          const scoreB = getMasteryScore(b.id);

          return scoreB - scoreA;
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
    // If masteryLevel is null (no mastery data exists / not owned), show 0.png from mastery
    if (masteryLevel === null) {
      return `/images/masteries/mastery/0.png`;
    }

    // If champion_level is 0 (purchased), show missing.png
    if (masteryLevel === 0) {
      return `/images/ranked-btn/missing.png`;
    }

    // If masteryLevel is greater than 10, show 10.png from badges
    if (masteryLevel > 10) {
      return `/images/masteries/badges/10.png`;
    }

    // For levels 1-10, show the corresponding badge
    return `/images/masteries/badges/${masteryLevel}.png`;
  };

  // --- Funciones para manejar champions comprados ---
  const handleMasteryClick = (rankedId: number, championId: number, username: string) => {
    // Check if user can edit this specific username
    if (!canEditRankedUsername(username)) return;

    const dropdownKey = `${rankedId}-${championId}`;

    // Toggle dropdown visibility
    if (activeMasteryDropdown === dropdownKey) {
      setActiveMasteryDropdown(null);
    } else {
      setActiveMasteryDropdown(dropdownKey);
    }
  };

  // Available mastery levels (null = not owned, 0 = purchased but no mastery, 1-10+ = mastery levels)
  const availableMasteryLevels = [
    { value: null, label: 'Not Owned', image: '/images/masteries/mastery/0.png' },
    { value: 0, label: 'Purchased', image: '/images/ranked-btn/missing.png' },
    { value: 1, label: 'Level 1', image: '/images/masteries/badges/1.png' },
    { value: 2, label: 'Level 2', image: '/images/masteries/badges/2.png' },
    { value: 3, label: 'Level 3', image: '/images/masteries/badges/3.png' },
    { value: 4, label: 'Level 4', image: '/images/masteries/badges/4.png' },
    { value: 5, label: 'Level 5', image: '/images/masteries/badges/5.png' },
    { value: 6, label: 'Level 6', image: '/images/masteries/badges/6.png' },
    { value: 7, label: 'Level 7', image: '/images/masteries/badges/7.png' },
    { value: 8, label: 'Level 8', image: '/images/masteries/badges/8.png' },
    { value: 9, label: 'Level 9', image: '/images/masteries/badges/9.png' },
    { value: 10, label: 'Level 10', image: '/images/masteries/badges/10.png' },
    { value: 11, label: 'Level 10+', image: '/images/masteries/badges/10.png' }
  ];

  const handleMasteryLevelChange = async (rankedId: number, championId: number, newLevel: number | null) => {
    console.log('handleMasteryLevelChange called:', { rankedId, championId, newLevel });

    const riotChampionId = getRiotIdForChampion(championId);
    const mastery = masteryData.find(m => m.ranked_id === rankedId && m.champion_id === riotChampionId);

    try {
      let masteryToUpdate: MasteryData;

      if (mastery) {
        console.log('Existing mastery found, updating level...');

        // Update existing mastery
        masteryToUpdate = {
          ...mastery,
          champion_level: newLevel
        };
      } else {
        console.log('No existing mastery found, creating new one...');

        // Create new mastery entry
        masteryToUpdate = {
          id: null, // Let backend assign ID
          ranked_id: rankedId,
          username: rankedData.find(r => r.id === rankedId)?.username || '',
          champion_id: riotChampionId,
          champion_level: newLevel,
          champion_points: 0,
          champion_points_since_last_level: 0,
          champion_points_until_next_level: 0,
          chest_granted: false,
          last_play_time: new Date().toISOString()
        };
      }

      console.log('Sending PUT request with mastery:', masteryToUpdate);

      // Send PUT request to backend with the ranked_id
      await updateMasteriesByRankedId(rankedId, [masteryToUpdate]);

      console.log('PUT request successful, reloading data...');

      // Reload mastery data from backend to reflect changes
      const updatedData = await fetchMasteryData();
      setMasteryData(updatedData);

      // Close dropdown
      setActiveMasteryDropdown(null);

      console.log('Data reloaded successfully');
    } catch (error) {
      console.error('Error updating masteries in backend:', error);
      // Optionally, you could show an error message to the user here
    }
  };


  // Check if champion is owned (has mastery > 0)
  const isChampionOwned = (rankedId: number, championId: number): boolean => {
    const masteryLevel = getMasteryLevel(rankedId, championId);
    // Champion is owned if it has mastery > 0 (including level 0 which means purchased)
    return masteryLevel !== null && masteryLevel >= 0;
  };

  // Convert number to Roman numeral
  const convertToRomanNumeral = (num: number): string => {
    switch (num) {
      case 1:
        return 'I';
      case 2:
        return 'II';
      case 3:
        return 'III';
      case 4:
        return 'IV';
      case 5:
        return 'V';
      case 6:
        return 'VI';
      case 7:
        return 'VII';
      case 8:
        return 'VIII';
      case 9:
        return 'IX';
      case 10:
        return 'X';
      default:
        return num.toString();
    }
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

    // List of known portraits to check if they exist
    const knownPortraits = [
      'Arminariknot', 'Blaandel\'Valse', 'Bricellice', 'Damglantine', 'Deestellirys',
      'Dreemurdomme', 'Eunilacealle', 'Hestiarethe', 'Ivelism', 'Lacellire',
      'Lahallayd', 'Orzyadhere', 'Vrillyarethez'
    ];

    // If the portrait is not in the known list, return empty string to show fallback
    if (!knownPortraits.includes(img_name)) {
      return '';
    }

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
                      const canClick = canEditRankedUsername(account.username);
                      const dropdownKey = `${account.id}-${champion.id}`;
                      const isDropdownOpen = activeMasteryDropdown === dropdownKey;

                      return (
                        <div
                          key={account.id}
                          className={styles.row__account}
                          ref={(el) => {
                            if (el) {
                              masteryDropdownRefs.current.set(dropdownKey, el);
                            } else {
                              masteryDropdownRefs.current.delete(dropdownKey);
                            }
                          }}
                          style={{ position: 'relative' }}
                        >
                          <span className={styles.mastery__roman}>
                            {masteryLevel === null
                              ? '-'
                              : masteryLevel === 0
                                ? '0'
                                : convertToRomanNumeral(masteryValue > 10 ? 10 : masteryValue)}
                          </span>
                          <img
                            src={getMasteryImage(masteryLevel)}
                            alt={`Mastery ${masteryText}`}
                            className={`${styles.mastery__image} ${isSmallMastery ? styles['mastery__image--small'] : ''} ${isLargeMastery ? styles['mastery__image--large'] : ''} ${hasGlow ? styles['mastery__image--glow'] : ''} ${masteryLevel === 0 ? styles['mastery__image--bought'] : ''}`}
                            style={{
                              cursor: canClick ? 'pointer' : 'default',
                              opacity: canClick ? 0.8 : 1
                            }}
                            onClick={() => handleMasteryClick(account.id, champion.id, account.username)}
                            title={canClick ? 'Click to change mastery level' : ''}
                          />
                          {isDropdownOpen && (
                            <div className={styles.mastery__selector}>
                              <div className={styles.mastery__options}>
                                {availableMasteryLevels.map((level) => (
                                  <div
                                    key={level.value ?? 'null'}
                                    className={`${styles.mastery__option} ${masteryLevel === level.value ? styles.mastery__selected : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMasteryLevelChange(account.id, champion.id, level.value);
                                    }}
                                    title={level.label}
                                  >
                                    <img src={level.image} alt={level.label} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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

