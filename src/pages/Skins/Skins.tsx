import React, { useState, useEffect } from 'react';
import styles from './Skins.module.scss';
import {
  fetchSkinFamilies,
  fetchAccountSkins,
  fetchChampionRoles,
  getRoleTeamForFamily,
  getAccountsForFamily,
  cleanAccountName,
  canFormFullTeam,
  type SkinFamily,
  type AccountSkins,
  type RoleTeamColumn,
  type LaneRole,
} from '../../services/skinsService';
import { fetchRankedData } from '../../services/apiRankedsService';
import { assetUrl } from '../../utils/assetUrl';

type ViewState = 'list' | 'family';

const Skins: React.FC = () => {
  const [families, setFamilies] = useState<SkinFamily[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<SkinFamily[]>([]);
  const [accountSkins, setAccountSkins] = useState<AccountSkins[]>([]);
  const [rolesByName, setRolesByName] = useState<Record<string, LaneRole>>({});
  const [rankedLookup, setRankedLookup] = useState<
    Map<number, { username: string; essencer?: string }>
  >(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedFamily, setSelectedFamily] = useState<SkinFamily | null>(null);
  const [roleTeam, setRoleTeam] = useState<RoleTeamColumn[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [familiesData, ownership, rankeds, roles] = await Promise.all([
          fetchSkinFamilies(),
          fetchAccountSkins(),
          fetchRankedData(),
          fetchChampionRoles(),
        ]);
        setFamilies(familiesData);
        setAccountSkins(ownership);
        setRolesByName(roles);
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
  }, [families, searchTerm]);

  const openFamily = (family: SkinFamily) => {
    setSelectedFamily(family);
    setRoleTeam(getRoleTeamForFamily(family, accountSkins, rankedLookup, rolesByName));
    setViewState('family');
  };

  const backToList = () => {
    setViewState('list');
    setSelectedFamily(null);
    setRoleTeam([]);
  };

  const accountsWithTheme = (family: SkinFamily): number =>
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

  const fullTeamReady = canFormFullTeam(roleTeam);

  return (
    <div className={styles.page}>
      {viewState === 'list' && (
        <div className={`${styles.container} ${styles.list__container}`}>
          <div className={styles.content__top}>
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

          <div className={`${styles.content} ${styles.list__content}`}>
            <div className={styles.families__grid}>
              {filteredFamilies.map((family) => {
                const acctCount = accountsWithTheme(family);
                return (
                  <div
                    key={family.id}
                    className={styles.family__card}
                    onClick={() => openFamily(family)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openFamily(family);
                    }}
                  >
                    <h3 className={styles.family__card__name}>{family.name}</h3>
                    <img
                      src={assetUrl('images/frames/skin-frame.png')}
                      alt=""
                      className={styles.family__card__frame}
                    />
                    <div className={styles.family__card__count}>{family.skinCount}</div>
                    <div className={styles.family__card__acct}>{acctCount} acct</div>
                    <div className={styles.family__card__image}>
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
        <div className={`${styles.container} ${styles.team__container}`}>
          <div className={styles.family__header}>
            <button type="button" className={styles.back__button} onClick={backToList}>
              ← Families
            </button>
            <div className={styles.family__title__block}>
              <h2 className={styles.family__title}>{selectedFamily.name}</h2>
              <p className={styles.family__meta}>
                {selectedFamily.skinCount} skins in line ·{' '}
                <span className={fullTeamReady ? styles.team__ready : styles.team__missing}>
                  {fullTeamReady ? 'Full team possible' : 'Missing roles'}
                </span>
              </p>
            </div>
          </div>

          <div className={styles.team__board}>
            {roleTeam.map((col) => (
              <div key={col.role} className={styles.role__column}>
                <div className={styles.role__header}>
                  <img src={col.icon} alt={col.label} className={styles.role__icon} />
                  <span className={styles.role__label}>{col.label}</span>
                  <span className={styles.role__count}>{col.options.length}</span>
                </div>

                <div className={styles.role__options}>
                  {col.options.length === 0 ? (
                    <div className={styles.role__empty}>
                      <div className={styles.role__empty__box}>—</div>
                      <span>No skin</span>
                    </div>
                  ) : (
                    col.options.map((opt) => (
                      <div
                        key={`${col.role}-${opt.rankedId}-${opt.skin.name}`}
                        className={styles.role__option}
                        title={`${opt.skin.name} · ${opt.username}`}
                      >
                        <div className={styles.role__skin}>
                          {opt.skin.imageUrl ? (
                            <img src={opt.skin.imageUrl} alt={opt.skin.name} />
                          ) : (
                            <div className={styles.role__empty__box}>?</div>
                          )}
                        </div>
                        <span className={styles.role__skin__name}>{opt.skin.name}</span>
                        <span className={styles.role__account}>
                          {cleanAccountName(opt.username)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Skins;
