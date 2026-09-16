import React, { useState, useEffect } from 'react';
import styles from './Skins.module.scss';
import {
  fetchSkinFamilies,
  fetchAccountSkins,
  getAccountsForFamily,
  cleanAccountName,
  type SkinFamily,
  type AccountSkins,
  type FamilyAccountOwnership,
} from '../../services/skinsService';
import { fetchRankedData } from '../../services/apiRankedsService';
import Filter, { type FilterOption } from '../../components/Filter/Filter';
import { assetUrl } from '../../utils/assetUrl';

type ViewState = 'list' | 'family';

const Skins: React.FC = () => {
  const [families, setFamilies] = useState<SkinFamily[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<SkinFamily[]>([]);
  const [accountSkins, setAccountSkins] = useState<AccountSkins[]>([]);
  const [rankedLookup, setRankedLookup] = useState<
    Map<number, { username: string; essencer?: string }>
  >(new Map());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedFamily, setSelectedFamily] = useState<SkinFamily | null>(null);
  const [familyAccounts, setFamilyAccounts] = useState<FamilyAccountOwnership[]>([]);
  const [expandedAccountId, setExpandedAccountId] = useState<number | null>(null);

  const categoryOptions: FilterOption[] = [
    { id: 'all', label: 'All Families' },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [familiesData, ownership, rankeds] = await Promise.all([
          fetchSkinFamilies(),
          fetchAccountSkins(),
          fetchRankedData(),
        ]);
        setFamilies(familiesData);
        setAccountSkins(ownership);
        const lookup = new Map<number, { username: string; essencer?: string }>();
        rankeds.forEach((r) => {
          lookup.set(r.id, { username: r.username, essencer: r.essencer || r.name });
        });
        setRankedLookup(lookup);
      } catch (error) {
        console.error('Error loading skins data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let filtered = families;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.cdragonNames?.some((n) => n.toLowerCase().includes(q))
      );
    }
    setFilteredFamilies(filtered);
  }, [families, selectedCategories, searchTerm]);

  const openFamily = (family: SkinFamily) => {
    setSelectedFamily(family);
    setFamilyAccounts(getAccountsForFamily(family, accountSkins, rankedLookup));
    setExpandedAccountId(null);
    setViewState('family');
  };

  const backToList = () => {
    setViewState('list');
    setSelectedFamily(null);
    setFamilyAccounts([]);
    setExpandedAccountId(null);
  };

  const ownedCountForFamily = (family: SkinFamily): number =>
    getAccountsForFamily(family, accountSkins, rankedLookup).length;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.content}>
            <p>Loading skin families...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {viewState === 'list' && (
        <div className={styles.container}>
          <div className={styles.content__top}>
            <div className={styles.filters}>
              <Filter
                title="FILTER"
                options={categoryOptions}
                selectedOptions={selectedCategories}
                onSelectionChange={setSelectedCategories}
              />
            </div>
            <div className={styles.search__container}>
              <input
                type="text"
                placeholder="Search skin families..."
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
          </div>

          <div className={styles.content}>
            <div className={styles.champions__grid}>
              {filteredFamilies.map((family) => {
                const accountsWithSkin = ownedCountForFamily(family);
                return (
                  <div
                    key={family.id}
                    className={styles.champion__card}
                    onClick={() => openFamily(family)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openFamily(family);
                    }}
                  >
                    <h3 className={styles.champion__name}>{family.name}</h3>
                    <img
                      src={assetUrl('images/frames/skin-frame.png')}
                      alt=""
                      className={styles.champion__frame}
                    />
                    <div className={styles.account__champion__frame}>
                      <span className={styles.account__champion__number}>{family.skinCount}</span>
                    </div>
                    <div className={styles.family__owned__badge}>
                      {accountsWithSkin} acct
                    </div>
                    <div className={styles.champion__image}>
                      <img
                        src={family.splashart}
                        alt={family.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = assetUrl('images/bg/bg.png');
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredFamilies.length === 0 && (
              <div className={styles.no__results}>
                <p>No skin families found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewState === 'family' && selectedFamily && (
        <div className={`${styles.container} ${styles.family__container}`}>
          <div className={styles.family__header}>
            <button type="button" className={styles.back__button} onClick={backToList}>
              ← Families
            </button>
            <div className={styles.family__title__block}>
              <h2 className={styles.family__title}>{selectedFamily.name}</h2>
              <p className={styles.family__meta}>
                {selectedFamily.skinCount} skins in line · {familyAccounts.length} accounts own at
                least one
              </p>
            </div>
          </div>

          <div className={styles.family__layout}>
            <div className={styles.family__hero}>
              <img
                src={selectedFamily.splashart}
                alt={selectedFamily.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = assetUrl('images/bg/bg.png');
                }}
              />
            </div>

            <div className={styles.family__accounts}>
              <h3 className={styles.section__title}>Accounts with this theme</h3>
              {familyAccounts.length === 0 ? (
                <p className={styles.empty__hint}>
                  No accounts have skins from this family yet. Run the weekly LoLDB sync to populate
                  ownership.
                </p>
              ) : (
                <div className={styles.accounts__list}>
                  {familyAccounts.map((row) => {
                    const open = expandedAccountId === row.rankedId;
                    return (
                      <div key={row.rankedId} className={styles.account__row}>
                        <button
                          type="button"
                          className={styles.account__row__main}
                          onClick={() =>
                            setExpandedAccountId(open ? null : row.rankedId)
                          }
                        >
                          <span className={styles.account__row__name}>
                            {cleanAccountName(row.username)}
                          </span>
                          <span className={styles.account__row__essencer}>
                            {row.essencer && row.essencer !== '-' ? row.essencer : '—'}
                          </span>
                          <span className={styles.account__row__count}>
                            {row.ownedCount}/{selectedFamily.skinCount}
                          </span>
                        </button>
                        {open && (
                          <div className={styles.owned__skins}>
                            {row.ownedSkins.map((skin) => (
                              <div key={`${row.rankedId}-${skin.name}`} className={styles.owned__skin}>
                                {skin.imageUrl ? (
                                  <img src={skin.imageUrl} alt={skin.name} />
                                ) : null}
                                <span>{skin.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Skins;
