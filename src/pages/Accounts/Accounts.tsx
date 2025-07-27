import { useState, useEffect } from 'react';
import styles from './Accounts.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import AccountSummary from '../../components/AccountSummary';

// Definir tipos para los datos
interface Account {
  id: number;
  name: string;
  username: string;
  bloodline: string;
  url: string;
  champions: number;
  skins: number;
  masteries: number;
  elo: number;
  level: number;
  'elo-soloq': string;
  'elo-flex': string;
  'level-soloq': string;
  'level-flex': string;
  honor: string;
  roles: {
    top: number;
    jungle: number;
    mid: number;
    adc: number;
    support: number;
  };
  blueEssence: number;
  orangeEssence: number;
}

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

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedRank, setSelectedRank] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState<string[]>([]);
  const [selectedPortrait, setSelectedPortrait] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await fetch('/data/portraits.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error('Error loading accounts:', error);
        // Set some default data to prevent blank page
        setAccounts([
          {
            id: 1,
            name: 'Arminariknot',
            username: 'GEM Arminariknot#GEM',
            bloodline: 'Porveldam',
            url: '/images/portraits/Arminariknot.png',
            champions: 165,
            skins: 320,
            masteries: 678,
            elo: 2950,
            level: 105,
            'elo-soloq': 'Gold',
            'elo-flex': 'Silver',
            'level-soloq': 'II',
            'level-flex': 'IV',
            honor: 'https://placehold.co/24x24/ffa500/ffffff.png?text=💛',
            roles: {
              top: 56,
              jungle: 34,
              mid: 78,
              adc: 45,
              support: 23
            },
            blueEssence: 156780,
            orangeEssence: 23450
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
    // Map the data structure from portraits.json to the expected format
    const accountRank = (account['elo-soloq'] as string)?.toLowerCase() || '';
    const accountTier = (account['level-soloq'] as string) || '';
    
    const matchesRank = selectedRank.length === 0 || selectedRank.includes(accountRank);
    const matchesTier = selectedTier.length === 0 || selectedTier.includes(accountTier);
    const matchesPortrait = selectedPortrait.length === 0 || selectedPortrait.includes(account.name);
    
    return matchesRank && matchesTier && matchesPortrait;
  });

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
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

                 {filteredAccounts.length > 0 && (
           <div className={styles.summary}>
             <AccountSummary data={{
               url: `/images/portraits/${filteredAccounts[0].name}.png`,
               id: 1,
               name: filteredAccounts[0].name,
               username: filteredAccounts[0].name,
               champions: filteredAccounts[0].champions || 150,
               skins: filteredAccounts[0].skins || 200,
               masteries: filteredAccounts[0].masteries || 50,
               elo: filteredAccounts[0].elo || 1200,
               roles: filteredAccounts[0].roles || {
                 top: 10,
                 jungle: 15,
                 mid: 25,
                 adc: 20,
                 support: 5
               },
               blueEssence: filteredAccounts[0].blueEssence || 50000,
               orangeEssence: 2500
             }} />
           </div>
         )}

        <div className={styles.accounts}>
          {filteredAccounts.map((account: Account) => (
            <div key={account.name} className={styles.account}>
              <h3>{account.name}</h3>
              <p>Rank: {account['elo-soloq']}</p>
              <p>Tier: {account['level-soloq']}</p>
              <p>ELO: {account.elo}</p>
              <p>Level: {account.level}</p>
              <p>Champions: {account.champions}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Accounts;