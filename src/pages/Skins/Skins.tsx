import React, { useState, useEffect, useMemo, useRef } from 'react';
import styles from './Skins.module.scss';
import {
  fetchSkinFamilies,
  fetchAccountSkins,
  fetchChampionRoles,
  getRoleTeamForFamily,
  getAccountsForFamily,
  cleanAccountName,
  canFormFullTeam,
  pickUniqueRoleSelections,
  reconcileUniqueSelections,
  getBlockedChampions,
  firstAvailableSkin,
  type SkinFamily,
  type AccountSkins,
  type RoleTeamColumn,
  type RoleAccountOption,
  type OwnedSkin,
  type LaneRole,
  type RoleSelection,
} from '../../services/skinsService';
import { fetchRankedData } from '../../services/apiRankedsService';
import { assetUrl } from '../../utils/assetUrl';

type ViewState = 'featured' | 'other' | 'family';

const champKey = (name: string) =>
  String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const RoleSlot: React.FC<{
  column: RoleTeamColumn;
  selection: RoleSelection | null;
  blockedChampions: Set<string>;
  onSelect: (next: RoleSelection) => void;
}> = ({ column, selection, blockedChampions, onSelect }) => {
  const [skinPickerOpen, setSkinPickerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const availableAccounts = useMemo(() => {
    return column.accounts.filter((acc) => {
      if (selection?.rankedId === acc.rankedId) return true;
      return acc.skins.some((s) => !blockedChampions.has(champKey(s.champName)));
    });
  }, [column.accounts, blockedChampions, selection?.rankedId]);

  const selectedAccount: RoleAccountOption | null = useMemo(() => {
    if (!availableAccounts.length) return null;
    return (
      availableAccounts.find((a) => a.rankedId === selection?.rankedId) || availableAccounts[0]
    );
  }, [availableAccounts, selection]);

  const availableSkins = useMemo(() => {
    if (!selectedAccount) return [] as OwnedSkin[];
    return selectedAccount.skins.filter((s) => {
      if (selection?.skinName === s.name) return true;
      return !blockedChampions.has(champKey(s.champName));
    });
  }, [selectedAccount, blockedChampions, selection?.skinName]);

  const selectedSkin: OwnedSkin | null = useMemo(() => {
    if (!selectedAccount) return null;
    return (
      availableSkins.find((s) => s.name === selection?.skinName) || availableSkins[0] || null
    );
  }, [selectedAccount, availableSkins, selection]);

  useEffect(() => {
    if (!column.accounts.length) return;
    if (selection) {
      const acc = column.accounts.find((a) => a.rankedId === selection.rankedId);
      if (acc?.skins.some((s) => s.name === selection.skinName)) return;
    }
    for (const acc of column.accounts) {
      const skin = firstAvailableSkin(acc.skins, blockedChampions) || acc.skins[0];
      if (skin) {
        onSelect({ rankedId: acc.rankedId, skinName: skin.name });
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.role, column.accounts, selection?.rankedId, selection?.skinName]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setAccountOpen(false);
        setSkinPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const extraSkins = availableSkins.length;

  return (
    <div className={styles.role__column} ref={rootRef}>
      <div className={styles.role__header}>
        <img src={column.icon} alt={column.label} className={styles.role__icon} />
        <span className={styles.role__label}>{column.label}</span>
      </div>

      <div className={styles.role__skin__wrap}>
        <div className={styles.role__skin__image}>
          {selectedSkin?.imageUrl ? (
            <img src={selectedSkin.imageUrl} alt={selectedSkin.name} className={styles.role__skin__img} />
          ) : (
            <div className={styles.role__empty__box}>—</div>
          )}
        </div>
        <img
          src={assetUrl('images/frames/skin-frame.png')}
          alt=""
          className={styles.role__skin__frame}
        />
        <span className={styles.role__sparkle} data-pos="tl" aria-hidden />
        <span className={styles.role__sparkle} data-pos="tr" aria-hidden />
        <span className={styles.role__sparkle} data-pos="bl" aria-hidden />
        <span className={styles.role__sparkle} data-pos="br" aria-hidden />

        {extraSkins > 1 && (
          <button
            type="button"
            className={styles.skin__count__badge}
            onClick={() => {
              setSkinPickerOpen((v) => !v);
              setAccountOpen(false);
            }}
            title={`${extraSkins} skins`}
          >
            {extraSkins}
          </button>
        )}

        {skinPickerOpen && availableSkins.length > 1 && selectedAccount && (
          <div className={styles.skin__picker}>
            {availableSkins.map((skin) => (
              <button
                key={skin.name}
                type="button"
                className={`${styles.skin__picker__item} ${
                  skin.name === selectedSkin?.name ? styles.skin__picker__item__active : ''
                }`}
                onClick={() => {
                  onSelect({ rankedId: selectedAccount.rankedId, skinName: skin.name });
                  setSkinPickerOpen(false);
                }}
              >
                {skin.imageUrl ? <img src={skin.imageUrl} alt={skin.name} /> : null}
                <span>{skin.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.role__skin__caption}>{selectedSkin?.name || 'No skin'}</div>

      {availableAccounts.length === 0 ? (
        <div className={styles.role__account__empty}>No account</div>
      ) : (
        <div className={styles.role__account__dropdown}>
          <button
            type="button"
            className={styles.role__account__trigger}
            onClick={() => {
              setAccountOpen((v) => !v);
              setSkinPickerOpen(false);
            }}
          >
            <span>
              {cleanAccountName(selectedAccount?.username || '')}
              {selectedAccount && selectedAccount.skins.length > 1
                ? ` (${selectedAccount.skins.length})`
                : ''}
            </span>
            <span className={`${styles.role__account__arrow} ${accountOpen ? styles.open : ''}`}>
              ▾
            </span>
          </button>
          {accountOpen && (
            <div className={styles.role__account__menu}>
              {availableAccounts.map((acc) => (
                <button
                  key={acc.rankedId}
                  type="button"
                  className={`${styles.role__account__option} ${
                    acc.rankedId === selectedAccount?.rankedId
                      ? styles.role__account__option__active
                      : ''
                  }`}
                  onClick={() => {
                    const skin =
                      firstAvailableSkin(acc.skins, blockedChampions) || acc.skins[0];
                    if (!skin) return;
                    onSelect({ rankedId: acc.rankedId, skinName: skin.name });
                    setAccountOpen(false);
                  }}
                >
                  {cleanAccountName(acc.username)}
                  {acc.skins.length > 1 ? ` (${acc.skins.length})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Skins: React.FC = () => {
  const [families, setFamilies] = useState<SkinFamily[]>([]);
  const [accountSkins, setAccountSkins] = useState<AccountSkins[]>([]);
  const [rolesData, setRolesData] = useState<{
    byName: Record<string, LaneRole>;
    byNameAll?: Record<string, LaneRole[]>;
  }>({ byName: {} });
  const [rankedLookup, setRankedLookup] = useState<
    Map<number, { username: string; essencer?: string }>
  >(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('featured');
  const [selectedFamily, setSelectedFamily] = useState<SkinFamily | null>(null);
  const [roleTeam, setRoleTeam] = useState<RoleTeamColumn[]>([]);
  const [roleSelections, setRoleSelections] = useState<Partial<Record<LaneRole, RoleSelection>>>(
    {}
  );

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
        setRolesData(roles);
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

  const featuredFamilies = useMemo(
    () => families.filter((f) => f.featured === true),
    [families]
  );

  const otherFamilies = useMemo(() => {
    let list = families.filter((f) => f.featured === false);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.cdragonNames?.some((n) => n.toLowerCase().includes(q))
      );
    }
    return list;
  }, [families, searchTerm]);

  const openFamily = (family: SkinFamily) => {
    const team = getRoleTeamForFamily(family, accountSkins, rankedLookup, rolesData);
    setSelectedFamily(family);
    setRoleTeam(team);
    setRoleSelections(pickUniqueRoleSelections(team));
    setViewState('family');
  };

  const backToList = () => {
    const wasFeatured = selectedFamily?.featured !== false;
    setViewState(wasFeatured ? 'featured' : 'other');
    setSelectedFamily(null);
    setRoleTeam([]);
    setRoleSelections({});
  };

  const handleRoleSelect = (role: LaneRole, next: RoleSelection) => {
    setRoleSelections((prev) => {
      const merged = { ...prev, [role]: next };
      return reconcileUniqueSelections(roleTeam, merged, role);
    });
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

  const renderFamilyCard = (family: SkinFamily) => {
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
        <div className={styles.family__card__stage}>
          <div className={styles.family__card__image}>
            <img
              src={family.splashart}
              alt={family.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = assetUrl('images/bg/bg.png');
              }}
            />
          </div>
          <img
            src={assetUrl('images/frames/skin-frame.png')}
            alt=""
            className={styles.family__card__frame}
          />
          <div className={styles.family__card__count}>
            <img
              src={assetUrl('images/frames/skin-number-frame.png')}
              alt=""
              className={styles.family__card__count__frame}
            />
            <span>{acctCount}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {viewState === 'featured' && (
        <div className={`${styles.container} ${styles.list__container}`}>
          <div className={styles.content__top}>
            <button
              type="button"
              className={styles.other__button}
              onClick={() => {
                setSearchTerm('');
                setViewState('other');
              }}
            >
              Other
            </button>
          </div>
          <div className={`${styles.content} ${styles.list__content}`}>
            <div className={styles.families__grid__featured}>
              {featuredFamilies.map(renderFamilyCard)}
            </div>
          </div>
        </div>
      )}

      {viewState === 'other' && (
        <div className={`${styles.container} ${styles.list__container}`}>
          <div className={styles.content__top}>
            <button type="button" className={styles.back__button} onClick={() => setViewState('featured')}>
              ← Featured
            </button>
            <div className={styles.search__container}>
              <input
                type="text"
                placeholder="Search all other skin lines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.search__input}
              />
            </div>
          </div>
          <div className={`${styles.content} ${styles.other__content}`}>
            <div className={styles.families__grid__other}>
              {otherFamilies.map(renderFamilyCard)}
            </div>
            {otherFamilies.length === 0 && (
              <div className={styles.no__results}>
                <p>No skin lines found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewState === 'family' && selectedFamily && (
        <div className={`${styles.container} ${styles.team__container}`}>
          <div className={styles.family__header}>
            <button type="button" className={styles.back__button} onClick={backToList}>
              ← {selectedFamily.featured === false ? 'Other' : 'Families'}
            </button>
            <div className={styles.family__title__block}>
              <h2 className={styles.family__title}>{selectedFamily.name}</h2>
              <p className={styles.family__meta}>
                {accountsWithTheme(selectedFamily)} accounts ·{' '}
                <span className={fullTeamReady ? styles.team__ready : styles.team__missing}>
                  {fullTeamReady ? 'Full team possible' : 'Missing roles'}
                </span>
              </p>
            </div>
          </div>

          <div className={styles.team__board}>
            {roleTeam.map((col) => (
              <RoleSlot
                key={col.role}
                column={col}
                selection={roleSelections[col.role] || null}
                blockedChampions={getBlockedChampions(roleTeam, roleSelections, col.role)}
                onSelect={(next) => handleRoleSelect(col.role, next)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Skins;
