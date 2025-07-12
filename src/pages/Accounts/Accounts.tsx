import { useState, useEffect } from 'react';
import styles from './Accounts.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import AccountSummary from '../../components/AccountSummary';

// Definir tipos para los datos
interface Account {
  name: string;
  rank?: string;
  tier?: string;
  lp?: number;
  wins?: number;
  losses?: number;
  [key: string]: unknown;
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
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error('Error loading accounts:', error);
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
    const matchesRank = selectedRank.length === 0 || selectedRank.includes(account.rank?.toLowerCase() || '');
    const matchesTier = selectedTier.length === 0 || selectedTier.includes(account.tier || '');
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
               champions: 150,
               skins: 200,
               masteries: 50,
               elo: filteredAccounts[0].lp || 1200,
               roles: {
                 top: 10,
                 jungle: 15,
                 mid: 25,
                 adc: 20,
                 support: 5
               },
               blueEssence: 50000,
               orangeEssence: 2500
             }} />
           </div>
         )}

        <div className={styles.accounts}>
          {filteredAccounts.map((account: Account) => (
            <div key={account.name} className={styles.account}>
              <h3>{account.name}</h3>
              <p>Rank: {account.rank}</p>
              <p>Tier: {account.tier}</p>
              <p>LP: {account.lp}</p>
              <p>Wins: {account.wins}</p>
              <p>Losses: {account.losses}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Accounts;