import { useState, useEffect } from 'react';
import styles from './Accounts.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import AccountSummary from '../../components/AccountSummary';
import AccountsService, { type Account } from '../../services/accountsService';

// --- Opciones para los filtros ---
const rankOptions: FilterOption[] = [
  { id: 'iron', label: 'Iron' },
  { id: 'bronze', label: 'Bronze' },
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'platinum', label: 'Platinum' },
  { id: 'emerald', label: 'Emerald' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'master', label: 'Master' },
  { id: 'grandmaster', label: 'Grandmaster' },
  { id: 'challenger', label: 'Challenger' },
];

const tierOptions: FilterOption[] = [
  { id: 'IV', label: 'IV' },
  { id: 'III', label: 'III' },
  { id: 'II', label: 'II' },
  { id: 'I', label: 'I' },
];

// Mapeo completo de usernames a portraits locales
const usernameToPortraitMap: { [key: string]: string } = {
  'GEM Arminariknot#GEM': '/images/portraits/Arminariknot.png',
  'GEM Blaandel\'Valse#GEM': '/images/portraits/Blaandel\'Valse.png',
  'GEM Blaandelvals#GEM': '/images/portraits/Blaandel\'Valse.png',
  'GEM Bricellice#GEM': '/images/portraits/Bricellice.png',
  'GEM Brincellezha#GEM': '/images/portraits/Bricellice.png',
  'GEM Damglantine#GEM': '/images/portraits/Damglantine.png',
  'GEM Deestellirys#GEM': '/images/portraits/Deestellirys.png',
  'GEM Deellycella#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Dreemurdomme#GEM': '/images/portraits/Dreemurdomme.png',
  'GEM Eunilacealle#LAS': '/images/portraits/Eunilacealle.png',
  'GEM Glacelynne#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Hestiarethe#GEM': '/images/portraits/Hestiarethe.png',
  'GEM Ivelism#GEM': '/images/portraits/Ivelism.png',
  'GEM Lacellire#LAS': '/images/portraits/Lacellire.png',
  'GEM Lahallayd#LAS': '/images/portraits/Lahallayd.png',
  'GEM Orzyadhere#LAS': '/images/portraits/Orzyadhere.png',
  'GEM Vrillyarethez#GEM': '/images/portraits/Vrillyarethez.png',
  // Nuevos usernames del JSON proporcionado
  'GEM Asticedicair#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Cierzellant#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Deliquesence#LAS': '/images/frames/default-majesty-portrait.png',
  'GEM Dellablivien#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Gallilessya#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Greedgardell#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Irzeleriance#LAS': '/images/frames/default-majesty-portrait.png',
  'GEM Lagrimelle#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM PelsNpurmips#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Phrasimfasya#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Plissevelary#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Praireclovia#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Primrosenrot#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Priscyumice#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Purselgarmet#LAS': '/images/frames/default-majesty-portrait.png',
  'GEM Regimbudlair#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Rothroyaume#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Stridellarea#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Vaelardorcel#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Veldraveth#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Velchelisse#GEM': '/images/frames/default-majesty-portrait.png',
  'GEM Vespianelian#GEM': '/images/frames/default-majesty-portrait.png',
};

// Función para obtener el portrait local basado en el username
const getLocalPortrait = (username: string): string => {
  return usernameToPortraitMap[username] || '/images/frames/default-majesty-portrait.png'; // Fallback por defecto
};

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedRank, setSelectedRank] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState<string[]>([]);
  const [selectedPortrait, setSelectedPortrait] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estado para la paginación ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 8 AccountSummary por página (2 filas de 4)

  const accountsService = AccountsService.getInstance();

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const accountsData = await accountsService.getAccounts();
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error loading accounts:', error);
        setError(error instanceof Error ? error.message : 'Failed to load accounts');
        // Set mock data for development/testing
        setAccounts([
          {
            url: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/5413.png",
            id: 19,
            name: "Tryppy Troppy",
            username: "GEM Damglantine#GEM",
            champions: 84,
            skins: 267,
            masteries: 84,
            solo_q_elo: "EMERALD 4",
            roles: {
              top: 45,
              jungle: 78,
              mid: 34,
              adc: 67,
              support: 45
            },
            blueEssence: 98760,
            orangeEssence: 14560
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const getPortraitOptions = (): FilterOption[] => {
    const uniqueNames = [...new Set(accounts.map(account => account.name))];
    return uniqueNames.map(name => ({
      id: name,
      label: name
    }));
  };

  const handleRankChange = (ranks: string[]) => {
    setSelectedRank(ranks);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleTierChange = (tiers: string[]) => {
    setSelectedTier(tiers);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePortraitChange = (portraits: string[]) => {
    setSelectedPortrait(portraits);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const filteredAccounts = accounts.filter((account: Account) => {
    // Parse the solo_q_elo to extract rank and tier
    const { rank, tier } = accountsService.parseElo(account.solo_q_elo);

    const matchesRank = selectedRank.length === 0 || selectedRank.includes(rank);
    const matchesTier = selectedTier.length === 0 || selectedTier.includes(tier);
    const matchesPortrait = selectedPortrait.length === 0 || selectedPortrait.includes(account.name);

    return matchesRank && matchesTier && matchesPortrait;
  });

  // --- Calcular las accounts a mostrar en la página actual ---
  const getCurrentPageAccounts = () => {
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

    // Reset to page 1 if current page is out of bounds
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return { accounts: filteredAccounts.slice(startIndex, endIndex), totalPages };
  };

  const handlePageChange = (newPage: number) => {
    const { totalPages } = getCurrentPageAccounts();
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Función para renderizar las filas de cuentas
  const renderAccountRows = () => {
    const { accounts: currentPageAccounts } = getCurrentPageAccounts();
    const rows = [];
    const accountsPerRow = 4;

    for (let i = 0; i < currentPageAccounts.length; i += accountsPerRow) {
      const rowAccounts = currentPageAccounts.slice(i, i + accountsPerRow);
      rows.push(
        <div key={i} className={styles.content__row}>
          {rowAccounts.map((account) => (
            <AccountSummary
              key={account.id}
              data={{
                url: getLocalPortrait(account.username),
                id: account.id,
                name: account.name,
                username: account.username,
                champions: account.champions,
                skins: account.skins,
                masteries: account.masteries,
                roles: account.roles,
                blueEssence: account.blueEssence,
                orangeEssence: account.orangeEssence
              }}
            />
          ))}
        </div>
      );
    }

    return rows;
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.error}>
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { totalPages } = getCurrentPageAccounts();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.content__filters}>
          <Filter
            title="Rank"
            options={rankOptions}
            selectedOptions={selectedRank}
            onSelectionChange={handleRankChange}
          />
          <Filter
            title="Tier"
            options={tierOptions}
            selectedOptions={selectedTier}
            onSelectionChange={handleTierChange}
          />
          <Filter
            title="Portrait"
            options={getPortraitOptions()}
            selectedOptions={selectedPortrait}
            onSelectionChange={handlePortraitChange}
          />
        </div>
        <div className={styles.content}>
          {filteredAccounts.length > 0 ? (
            <>
              {renderAccountRows()}
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.pagination__button}
                >
                  &lt; Previous
                </button>
                <span className={styles.pagination__info}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.pagination__button}
                >
                  Next &gt;
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noResults}>
              <p>No accounts found with the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Accounts;