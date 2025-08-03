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

// Mapeo de usernames a portraits locales
const usernameToPortraitMap: { [key: string]: string } = {
  'GEM Arminariknot#GEM': '/images/portraits/Arminariknot.png',
  'GEM Dreemurdomme#GEM': '/images/portraits/Dreemurdomme.png',
  'GEM Hestiarethe#GEM': '/images/portraits/Hestiarethe.png',
  'GEM Orzyadhere#GEM': '/images/portraits/Orzyadhere.png',
  'GEM Brincelleza#GEM': '/images/portraits/Bricellice.png',
  'GEM Eunilacealle#GEM': '/images/portraits/Eunilacealle.png',
  'GEM Lacellire#GEM': '/images/portraits/Lacellire.png',
  'GEM Blaandel\'Valse#GEM': '/images/portraits/Blaandel\'Valse.png',
  'GEM Bricellice#GEM': '/images/portraits/Bricellice.png',
  'GEM Damglantine#GEM': '/images/portraits/Damglantine.png',
  'GEM Deestellirys#GEM': '/images/portraits/Deestellirys.png',
  'GEM Ivelism#GEM': '/images/portraits/Ivelism.png',
  'GEM Lahallayd#GEM': '/images/portraits/Lahallayd.png',
  'GEM Vrillyarethez#GEM': '/images/portraits/Vrillyarethez.png',
  // Agregar más mapeos según sea necesario
  'GEM Cordacrimory#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Purselgarmet#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Rothroyaume#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Stridellarea#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Deellycella#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM PelsNpurmips#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Primrosenrot#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Priscyumice#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Regimbudlair#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Envicingess#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Glacelynne#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Lagrimelle#GEM': '/images/portraits/Lahallayd.png', // Usa el mismo que Lahallayd
  'GEM Plissevelary#GEM': '/images/portraits/Lahallayd.png', // Usa el mismo que Lahallayd
  'GEM Vaelardorcel#GEM': '/images/portraits/Lahallayd.png', // Usa el mismo que Lahallayd
  'GEM Velchelisse#GEM': '/images/portraits/Lahallayd.png', // Usa el mismo que Lahallayd
  'GEM Asticedicair#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Dellablivien#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Gallilessya#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Greedgardell#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Irzeleriance#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Phrasimfasya#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Praireclovia#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Vespianelian#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Cierzellant#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Deliquesence#GEM': '/images/portraits/Arminariknot.png', // Fallback
  'GEM Veldraveth#GEM': '/images/portraits/Arminariknot.png', // Fallback
};

// Función para obtener el portrait local basado en el username
const getLocalPortrait = (username: string): string => {
  return usernameToPortraitMap[username] || '/images/portraits/Arminariknot.png'; // Fallback por defecto
};

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedRank, setSelectedRank] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState<string[]>([]);
  const [selectedPortrait, setSelectedPortrait] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // Set some default data to prevent blank page
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
    return accounts.map(account => ({
      id: account.name,
      label: account.name
    }));
  };

  const handleRankChange = (ranks: string[]) => {
    setSelectedRank(ranks);
  };

  const handleTierChange = (tiers: string[]) => {
    setSelectedTier(tiers);
  };

  const handlePortraitChange = (portraits: string[]) => {
    setSelectedPortrait(portraits);
  };

  const filteredAccounts = accounts.filter((account: Account) => {
    // Parse the solo_q_elo to extract rank and tier
    const { rank, tier } = accountsService.parseElo(account.solo_q_elo);
    
    const matchesRank = selectedRank.length === 0 || selectedRank.includes(rank);
    const matchesTier = selectedTier.length === 0 || selectedTier.includes(tier);
    const matchesPortrait = selectedPortrait.length === 0 || selectedPortrait.includes(account.name);
    
    return matchesRank && matchesTier && matchesPortrait;
  });

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

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Accounts</h1>
          <p>Manage your ranked accounts</p>
        </div>

        <div className={styles.filters}>
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

        <div className={styles.accounts}>
          {filteredAccounts.map((account: Account) => (
            <div key={account.id} className={styles.accountWrapper}>
              <AccountSummary data={{
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
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Accounts;