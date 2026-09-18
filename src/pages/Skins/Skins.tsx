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
  countCoveredRoles,
  pickUniqueRoleSelections,
  reconcileUniqueSelections,
  getBlockedChampions,
  firstAvailableSkin,
  addManualAccountSkin,
  invalidateAccountSkinsCache,
  invalidateSkinsCache,
  FEATURED_PRIORITY_ORDER,
  FEATURED_TRAILING_ORDER,
  findFamilyForSkin,
  familyDisplayOrderIndex,
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

type ViewState = 'featured' | 'other' | 'family' | 'account';

interface SplashFit {
  x: number; // object-position % horizontal
  y: number; // object-position % vertical
  scale: number;
}

const SPLASH_FIT_KEY = 'bridyam-skin-splash-fit-v3';
const DEFAULT_FIT: SplashFit = { x: 50, y: 28, scale: 1.65 };

const prettyAccountName = (username: string): string => {
  const cleaned = cleanAccountName(username);
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
};
const FEATURED_COLS = 6;
const FEATURED_ROWS = 2;
const FEATURED_PAGE_SIZE = FEATURED_COLS * FEATURED_ROWS;

const champKey = (name: string) =>
  String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const loadSplashFits = (): Record<string, SplashFit> => {
  try {
    const raw = localStorage.getItem(SPLASH_FIT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SplashFit>;
  } catch {
    return {};
  }
};

const saveSplashFits = (fits: Record<string, SplashFit>) => {
  localStorage.setItem(SPLASH_FIT_KEY, JSON.stringify(fits));
};

const accountChampLabel = (acc: RoleAccountOption, blocked: Set<string>): string => {
  const champs = [
    ...new Set(
      acc.skins
        .filter((s) => !blocked.has(champKey(s.champName)))
        .map((s) => s.champName)
    ),
  ];
  if (!champs.length) {
    return [...new Set(acc.skins.map((s) => s.champName))].join(' · ');
  }
  return champs.slice(0, 3).join(' · ');
};

const RoleSlot: React.FC<{
  column: RoleTeamColumn;
  selection: RoleSelection | null;
  blockedChampions: Set<string>;
  onSelect: (next: RoleSelection) => void;
}> = ({ column, selection, blockedChampions, onSelect }) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const blockedKey = useMemo(
    () => [...blockedChampions].sort().join('|'),
    [blockedChampions]
  );

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
      if (acc?.skins.some((s) => s.name === selection.skinName)) {
        // Keep selection only if that champ is not blocked by another lane
        const skin = acc.skins.find((s) => s.name === selection.skinName);
        if (skin && !blockedChampions.has(champKey(skin.champName))) return;
      }
    }
    for (const acc of column.accounts) {
      const skin = firstAvailableSkin(acc.skins, blockedChampions);
      if (skin) {
        onSelect({ rankedId: acc.rankedId, skinName: skin.name });
        return;
      }
    }
    // No unblocked option — leave empty (do NOT fall back to blocked skins)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.role, column.accounts, selection?.rankedId, selection?.skinName, blockedKey]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const showSkinArrow = Boolean(selectedAccount && availableSkins.length > 1);

  const cycleSkin = (dir: 1 | -1) => {
    if (!selectedAccount || availableSkins.length < 2) return;
    const idx = Math.max(
      0,
      availableSkins.findIndex((s) => s.name === selectedSkin?.name)
    );
    const next = availableSkins[(idx + dir + availableSkins.length) % availableSkins.length];
    onSelect({ rankedId: selectedAccount.rankedId, skinName: next.name });
  };

  return (
    <div className={styles.role__column} ref={rootRef}>
      {availableAccounts.length === 0 ? (
        <div className={styles.role__account__empty}>No account</div>
      ) : (
        <div className={styles.role__account__dropdown}>
          <button
            type="button"
            className={styles.role__account__trigger}
            onClick={() => {
              setAccountOpen((v) => !v);
            }}
          >
            <span className={styles.role__account__trigger__text}>
              {prettyAccountName(selectedAccount?.username || '')}
            </span>
            <span className={`${styles.role__account__arrow} ${accountOpen ? styles.open : ''}`}>
              ›
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
                    const skin = firstAvailableSkin(acc.skins, blockedChampions);
                    if (!skin) return;
                    onSelect({ rankedId: acc.rankedId, skinName: skin.name });
                    setAccountOpen(false);
                  }}
                >
                  <span className={styles.role__account__option__text}>
                    {prettyAccountName(acc.username)} ({accountChampLabel(acc, blockedChampions)})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={styles.role__skin__wrap}>
        <div className={styles.role__skin__image}>
          {selectedSkin?.imageUrl ? (
            <img
              src={selectedSkin.imageUrl}
              alt={selectedSkin.name}
              className={styles.role__skin__img}
              onError={(e) => {
                const img = e.currentTarget;
                // loading ↔ splash fallback for DDragon art
                if (img.src.includes('/loading/')) {
                  img.src = img.src.replace('/loading/', '/splash/').replace('.png', '.jpg');
                } else if (img.src.includes('/splash/')) {
                  img.src = img.src.replace('/splash/', '/loading/');
                }
              }}
            />
          ) : (
            <div className={styles.role__empty__box}>—</div>
          )}
        </div>
        <img
          src={assetUrl('images/frames/skin-frame-long.png')}
          alt=""
          className={styles.role__skin__frame}
        />
        <span className={styles.role__sparkle} data-pos="tl" aria-hidden />
        <span className={styles.role__sparkle} data-pos="tr" aria-hidden />
        <span className={styles.role__sparkle} data-pos="bl" aria-hidden />
        <span className={styles.role__sparkle} data-pos="br" aria-hidden />
        <span className={styles.role__sparkle} data-pos="tm" aria-hidden />
        <span className={styles.role__sparkle} data-pos="ml" aria-hidden />
        <span className={styles.role__sparkle} data-pos="mr" aria-hidden />
        <span className={styles.role__sparkle} data-pos="bm" aria-hidden />

        {showSkinArrow && (
          <button
            type="button"
            className={styles.skin__next__arrow}
            onClick={() => cycleSkin(1)}
            title="Next skin"
          >
            ›
          </button>
        )}
      </div>

      <div className={styles.role__skin__caption}>{selectedSkin?.name || 'No skin'}</div>

      <div className={styles.role__header}>
        <img src={column.icon} alt={column.label} className={styles.role__icon} />
        <span className={styles.role__label}>{column.label}</span>
      </div>
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
  const [featuredPage, setFeaturedPage] = useState(0);
  const [otherPage, setOtherPage] = useState(0);
  const [splashFits, setSplashFits] = useState<Record<string, SplashFit>>(() => loadSplashFits());
  const [filterAccountId, setFilterAccountId] = useState<number | ''>('');
  const [updating, setUpdating] = useState(false);
  const [accountPage, setAccountPage] = useState(0);
  const [showAddSkin, setShowAddSkin] = useState(false);
  const [addChampId, setAddChampId] = useState('');
  const [addSkinKey, setAddSkinKey] = useState(''); // `${num}::${name}`
  const [addSkinAccountId, setAddSkinAccountId] = useState<number | ''>('');
  const [addSkinStatus, setAddSkinStatus] = useState('');
  const [addSkinSaving, setAddSkinSaving] = useState(false);
  const [champOptions, setChampOptions] = useState<{ id: string; name: string }[]>([]);
  const [manualSkinOptions, setManualSkinOptions] = useState<
    { name: string; champId: string; champName: string; num: number; imageUrl: string; skinLine: string }[]
  >([]);
  const [manualSkinsLoading, setManualSkinsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [familiesData, ownership, rankeds, roles, fitRes] = await Promise.all([
          fetchSkinFamilies(),
          fetchAccountSkins(),
          fetchRankedData(),
          fetchChampionRoles(),
          fetch(assetUrl(`data/skin-splash-fit.json?t=${Date.now()}`), { cache: 'no-store' }).catch(
            () => null
          ),
        ]);
        setFamilies(familiesData);
        setAccountSkins(ownership);
        setRolesData(roles);
        const lookup = new Map<number, { username: string; essencer?: string }>();
        rankeds.forEach((r) => {
          lookup.set(r.id, { username: r.username, essencer: r.essencer || r.name });
        });
        setRankedLookup(lookup);

        let fileFits: Record<string, SplashFit> = {};
        if (fitRes && fitRes.ok) {
          try {
            fileFits = await fitRes.json();
          } catch {
            fileFits = {};
          }
        }
        // Published file wins; drop stale local ID-based caches.
        try {
          localStorage.removeItem('bridyam-skin-splash-fit');
          localStorage.removeItem('bridyam-skin-splash-fit-v2');
        } catch {
          /* ignore */
        }
        setSplashFits(fileFits);
        saveSplashFits(fileFits);
      } catch (error) {
        console.error('Error loading skins data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featuredFamilies = useMemo(() => {
    const featured = families.filter((f) => f.featured === true);
    const priorityIdx = (name: string) => {
      const i = FEATURED_PRIORITY_ORDER.indexOf(name);
      return i === -1 ? 1000 : i;
    };
    const trailingIdx = (name: string) => {
      const i = FEATURED_TRAILING_ORDER.indexOf(name);
      return i === -1 ? 1000 : i;
    };
    const pinned = featured
      .filter((f) => priorityIdx(f.name) < 1000)
      .sort((a, b) => priorityIdx(a.name) - priorityIdx(b.name));
    const trailing = featured
      .filter((f) => trailingIdx(f.name) < 1000)
      .sort((a, b) => trailingIdx(a.name) - trailingIdx(b.name));
    const rest = featured
      .filter((f) => priorityIdx(f.name) === 1000 && trailingIdx(f.name) === 1000)
      .sort((a, b) => {
        const ca = getAccountsForFamily(a, accountSkins, rankedLookup).length;
        const cb = getAccountsForFamily(b, accountSkins, rankedLookup).length;
        return cb - ca || a.name.localeCompare(b.name);
      });
    return [...pinned, ...rest, ...trailing];
  }, [families, accountSkins, rankedLookup]);

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

  const featuredPageCount = Math.max(1, Math.ceil(featuredFamilies.length / FEATURED_PAGE_SIZE));
  const otherPageCount = Math.max(1, Math.ceil(otherFamilies.length / FEATURED_PAGE_SIZE));

  const pagedFeatured = useMemo(() => {
    const start = featuredPage * FEATURED_PAGE_SIZE;
    return featuredFamilies.slice(start, start + FEATURED_PAGE_SIZE);
  }, [featuredFamilies, featuredPage]);

  const pagedOther = useMemo(() => {
    const start = otherPage * FEATURED_PAGE_SIZE;
    return otherFamilies.slice(start, start + FEATURED_PAGE_SIZE);
  }, [otherFamilies, otherPage]);

  useEffect(() => {
    if (featuredPage > featuredPageCount - 1) setFeaturedPage(0);
  }, [featuredPage, featuredPageCount]);

  useEffect(() => {
    setOtherPage(0);
  }, [searchTerm]);

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

  const rolesCovered = (family: SkinFamily): number =>
    countCoveredRoles(family, accountSkins, rankedLookup, rolesData);

  const getFit = (family: SkinFamily): SplashFit =>
    splashFits[family.name] || splashFits[String(family.id)] || DEFAULT_FIT;

  const accountOptions = useMemo(() => {
    return [...rankedLookup.entries()]
      .map(([id, info]) => ({ id, username: info.username, essencer: info.essencer }))
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [rankedLookup]);

  const selectedAccountSkins = useMemo(() => {
    if (filterAccountId === '') return null;
    const owned = accountSkins.find((a) => a.ranked_id === filterAccountId);
    const info = rankedLookup.get(filterAccountId);
    const skins = [...(owned?.skins || [])]
      .map((skin) => {
        const family = findFamilyForSkin(skin, families);
        return {
          skin,
          familyName: family?.name || 'OTHER',
          familyOrder: family
            ? familyDisplayOrderIndex(family.name, family.featured)
            : 9999,
          familySort: family?.sortOrder ?? family?.id ?? 9999,
        };
      })
      .sort(
        (a, b) =>
          a.familyOrder - b.familyOrder ||
          a.familySort - b.familySort ||
          a.familyName.localeCompare(b.familyName) ||
          a.skin.name.localeCompare(b.skin.name, undefined, { sensitivity: 'base' })
      );
    return {
      rankedId: filterAccountId,
      username: info?.username || owned?.username || String(filterAccountId),
      essencer: info?.essencer,
      skins,
    };
  }, [filterAccountId, accountSkins, rankedLookup, families]);

  const accountPageCount = Math.max(
    1,
    Math.ceil((selectedAccountSkins?.skins.length || 0) / FEATURED_PAGE_SIZE)
  );

  const pagedAccountSkins = useMemo(() => {
    if (!selectedAccountSkins) return [];
    const start = accountPage * FEATURED_PAGE_SIZE;
    return selectedAccountSkins.skins.slice(start, start + FEATURED_PAGE_SIZE);
  }, [selectedAccountSkins, accountPage]);

  useEffect(() => {
    setAccountPage(0);
  }, [filterAccountId]);

  useEffect(() => {
    if (accountPage > accountPageCount - 1) setAccountPage(0);
  }, [accountPage, accountPageCount]);

  const refreshSkins = async () => {
    try {
      setUpdating(true);
      invalidateAccountSkinsCache();
      invalidateSkinsCache();
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
      if (selectedFamily) {
        const team = getRoleTeamForFamily(selectedFamily, ownership, lookup, roles);
        setRoleTeam(team);
        setRoleSelections(pickUniqueRoleSelections(team));
      }
    } catch (err) {
      console.error('Error refreshing skins:', err);
    } finally {
      setUpdating(false);
    }
  };

  const goFamilies = () => {
    setFilterAccountId('');
    setSearchTerm('');
    setSelectedFamily(null);
    setRoleTeam([]);
    setRoleSelections({});
    setViewState('featured');
  };

  const goOther = () => {
    setFilterAccountId('');
    setSearchTerm('');
    setSelectedFamily(null);
    setRoleTeam([]);
    setRoleSelections({});
    setViewState('other');
  };

  const onAccountFilterChange = (value: string) => {
    if (!value) {
      goFamilies();
      return;
    }
    const id = Number(value);
    setFilterAccountId(id);
    setSelectedFamily(null);
    setRoleTeam([]);
    setRoleSelections({});
    setViewState('account');
  };

  const renderListToolbar = (mode: 'featured' | 'other') => (
    <div className={styles.content__top}>
      <button
        type="button"
        className={`${styles.other__button} ${mode === 'featured' ? styles.edit__active : ''}`}
        onClick={goFamilies}
      >
        Families
      </button>
      {(mode === 'featured' || mode === 'other') && (
        <button
          type="button"
          className={`${styles.other__button} ${mode === 'other' ? styles.edit__active : ''}`}
          onClick={goOther}
        >
          Other
        </button>
      )}
      {mode === 'other' && (
        <div className={styles.search__container}>
          <input
            type="text"
            placeholder="Search all other skin lines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.search__input}
          />
        </div>
      )}
      <select
        className={styles.account__select}
        value={filterAccountId === '' ? '' : String(filterAccountId)}
        onChange={(e) => onAccountFilterChange(e.target.value)}
        aria-label="Skins by account"
      >
        <option value="">Skins by account…</option>
        {accountOptions.map((a) => (
          <option key={a.id} value={a.id}>
            {a.username}
            {a.essencer && a.essencer !== '-' ? ` · ${a.essencer}` : ''}
          </option>
        ))}
      </select>
      <button type="button" className={styles.other__button} onClick={openAddSkinModal}>
        Add skin
      </button>
    </div>
  );

  const selectedManualSkin = useMemo(() => {
    if (!addSkinKey) return null;
    return manualSkinOptions.find((s) => `${s.num}::${s.name}` === addSkinKey) || null;
  }, [addSkinKey, manualSkinOptions]);

  useEffect(() => {
    if (!showAddSkin) return;
    let cancelled = false;
    void (async () => {
      try {
        const { fetchChampionOptions } = await import('../../services/skinArtResolver');
        const list = await fetchChampionOptions();
        if (!cancelled) setChampOptions(list);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showAddSkin]);

  useEffect(() => {
    if (!addChampId) {
      setManualSkinOptions([]);
      setAddSkinKey('');
      return;
    }
    let cancelled = false;
    setManualSkinsLoading(true);
    setAddSkinKey('');
    void (async () => {
      try {
        const { fetchManualSkinOptionsForChampion } = await import('../../services/skinArtResolver');
        const skins = await fetchManualSkinOptionsForChampion(addChampId);
        if (!cancelled) setManualSkinOptions(skins);
      } catch (err) {
        console.error(err);
        if (!cancelled) setManualSkinOptions([]);
      } finally {
        if (!cancelled) setManualSkinsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [addChampId]);

  const openAddSkinModal = () => {
    setShowAddSkin(true);
    setAddSkinStatus('');
    setAddChampId('');
    setAddSkinKey('');
    setAddSkinAccountId('');
    setManualSkinOptions([]);
  };

  const submitAddSkin = async () => {
    if (!selectedManualSkin || addSkinAccountId === '') {
      setAddSkinStatus('Pick champion, skin, and account.');
      return;
    }
    const account = rankedLookup.get(Number(addSkinAccountId));
    if (!account) {
      setAddSkinStatus('Account not found.');
      return;
    }
    setAddSkinSaving(true);
    setAddSkinStatus('');
    try {
      const next = await addManualAccountSkin({
        rankedId: Number(addSkinAccountId),
        username: account.username,
        skinName: selectedManualSkin.name,
        champName: selectedManualSkin.champName,
        skinLine: selectedManualSkin.skinLine,
        imageUrl: selectedManualSkin.imageUrl,
      });
      setAccountSkins(next);
      setAddSkinStatus(
        'Skin saved. If others still don’t see it, redeploy sheets-wins-api.gs (SKINS tab).'
      );
      setAddSkinKey('');
    } catch (err) {
      console.error(err);
      setAddSkinStatus('Could not add skin.');
    } finally {
      setAddSkinSaving(false);
    }
  };

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
    const covered = rolesCovered(family);
    const gemN = Math.max(1, Math.min(5, covered || 1));
    const fit = getFit(family);
    const splashSrc = family.splashart;
    const imgStyle: React.CSSProperties = {
      objectPosition: `${fit.x}% ${fit.y}%`,
      transform: `scale(${fit.scale})`,
      transformOrigin: `${fit.x}% ${fit.y}%`,
    };

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
        <div className={styles.family__card__title}>
          <h3 className={styles.family__card__name}>{family.name}</h3>
          <div className={styles.family__card__gems} title={`${covered}/5 roles covered`}>
            <img
              src={assetUrl('images/frames/ring-gems-1.png')}
              alt=""
              className={`${styles.family__card__gems__img} ${styles.gem__bob} ${styles.gem__bob__a}`}
            />
            <span className={`${styles.family__card__gems__count}`}>{covered}</span>
            <img
              src={assetUrl(`images/frames/ring-gems-${gemN}.png`)}
              alt=""
              className={`${styles.family__card__gems__img} ${styles.gem__bob} ${styles.gem__bob__c}`}
            />
          </div>
        </div>
        <div className={styles.family__card__stage}>
          <div className={styles.family__card__image}>
            <img
              src={splashSrc}
              alt={family.name}
              style={imgStyle}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                if (el.src !== family.splashart) el.src = family.splashart;
                else el.src = assetUrl('images/bg/bg.png');
              }}
            />
          </div>
          <img
            src={assetUrl('images/frames/skin-frame.png')}
            alt=""
            className={styles.family__card__frame}
          />
          <span className={styles.card__sparkle} data-pos="tl" aria-hidden />
          <span className={styles.card__sparkle} data-pos="tr" aria-hidden />
          <span className={styles.card__sparkle} data-pos="bl" aria-hidden />
          <span className={styles.card__sparkle} data-pos="br" aria-hidden />
          <span className={styles.card__sparkle} data-pos="tm" aria-hidden />
          <span className={styles.card__sparkle} data-pos="ml" aria-hidden />
          <span className={styles.card__sparkle} data-pos="mr" aria-hidden />
          <span className={styles.card__sparkle} data-pos="bm" aria-hidden />
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

  const renderPager = (page: number, pageCount: number, onPrev: () => void, onNext: () => void) =>
    pageCount > 1 ? (
      <div className={styles.pager}>
        {page > 0 && (
          <button
            type="button"
            className={`${styles.pager__arrow} ${styles.pager__arrow__up}`}
            onClick={onPrev}
            aria-label="Previous page"
          >
            ›
          </button>
        )}
        <span className={styles.pager__meta}>
          {page + 1}/{pageCount}
        </span>
        {page < pageCount - 1 && (
          <button
            type="button"
            className={`${styles.pager__arrow} ${styles.pager__arrow__down}`}
            onClick={onNext}
            aria-label="Next page"
          >
            ›
          </button>
        )}
      </div>
    ) : null;

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.update__button}
        onClick={() => void refreshSkins()}
        disabled={updating}
        title="Pull latest skins from the Sheet"
      >
        {updating ? 'Updating…' : 'Update'}
      </button>

      {viewState === 'featured' && (
        <div className={`${styles.container} ${styles.list__container}`}>
          {renderListToolbar('featured')}
          <div className={`${styles.content} ${styles.list__content}`}>
            <div className={styles.families__grid__featured}>{pagedFeatured.map(renderFamilyCard)}</div>
          </div>
          {renderPager(
            featuredPage,
            featuredPageCount,
            () => setFeaturedPage((p) => Math.max(0, p - 1)),
            () => setFeaturedPage((p) => Math.min(featuredPageCount - 1, p + 1))
          )}
        </div>
      )}

      {viewState === 'other' && (
        <div className={`${styles.container} ${styles.list__container}`}>
          {renderListToolbar('other')}
          <div className={`${styles.content} ${styles.other__content}`}>
            <div className={styles.families__grid__other}>{pagedOther.map(renderFamilyCard)}</div>
            {otherFamilies.length === 0 && (
              <div className={styles.no__results}>
                <p>No skin lines found.</p>
              </div>
            )}
          </div>
          {renderPager(
            otherPage,
            otherPageCount,
            () => setOtherPage((p) => Math.max(0, p - 1)),
            () => setOtherPage((p) => Math.min(otherPageCount - 1, p + 1))
          )}
        </div>
      )}

      {viewState === 'account' && selectedAccountSkins && (
        <div className={`${styles.container} ${styles.list__container}`}>
          <div className={styles.content__top}>
            <button type="button" className={styles.other__button} onClick={goFamilies}>
              Families
            </button>
            <select
              className={styles.account__select}
              value={String(filterAccountId)}
              onChange={(e) => onAccountFilterChange(e.target.value)}
              aria-label="Skins by account"
            >
              <option value="">Skins by account…</option>
              {accountOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.username}
                  {a.essencer && a.essencer !== '-' ? ` · ${a.essencer}` : ''}
                </option>
              ))}
            </select>
            <button type="button" className={styles.other__button} onClick={openAddSkinModal}>
              Add skin
            </button>
          </div>
          <div className={styles.account__header}>
            <h2 className={styles.account__title}>
              {prettyAccountName(selectedAccountSkins.username)}
              {selectedAccountSkins.essencer && selectedAccountSkins.essencer !== '-'
                ? ` · ${selectedAccountSkins.essencer}`
                : ''}
            </h2>
            <p className={styles.account__meta}>
              {selectedAccountSkins.skins.length} skin
              {selectedAccountSkins.skins.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className={`${styles.content} ${styles.account__content}`}>
            {selectedAccountSkins.skins.length === 0 ? (
              <div className={styles.no__results}>
                <p>No skins logged for this account yet.</p>
              </div>
            ) : (
              <div className={styles.account__skins__grid}>
                {pagedAccountSkins.map(({ skin, familyName }) => (
                  <div key={`${skin.name}-${skin.champName}`} className={styles.account__skin__card}>
                    <div className={styles.account__skin__stage}>
                      <div className={styles.account__skin__art}>
                        {skin.imageUrl ? (
                          <img
                            src={skin.imageUrl}
                            alt={skin.name}
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (img.src.includes('/splash/')) {
                                img.src = img.src.replace('/splash/', '/loading/');
                              } else {
                                img.style.visibility = 'hidden';
                              }
                            }}
                          />
                        ) : (
                          <div className={styles.account__skin__empty}>—</div>
                        )}
                      </div>
                      <img
                        src={assetUrl('images/frames/skin-frame-thin.png')}
                        alt=""
                        className={styles.account__skin__frame}
                      />
                    </div>
                    <div className={styles.account__skin__caption}>
                      <em className={styles.account__skin__family}>{familyName}</em>
                      <strong>{skin.name}</strong>
                      <span>{skin.champName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedAccountSkins.skins.length > 0 &&
            renderPager(
              accountPage,
              accountPageCount,
              () => setAccountPage((p) => Math.max(0, p - 1)),
              () => setAccountPage((p) => Math.min(accountPageCount - 1, p + 1))
            )}
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

      {showAddSkin && (
        <div className={styles.addSkinOverlay} onClick={() => setShowAddSkin(false)}>
          <div className={styles.addSkinPanel} onClick={(e) => e.stopPropagation()}>
            <h3>Add skin</h3>
            <p>
              Legacy, limited, and reward skins that are not in the permanent RP store (Victorious,
              Heartseeker, Freljord, etc.). Chromas are skipped. Art resolves automatically.
            </p>
            <label>
              Champion
              <select value={addChampId} onChange={(e) => setAddChampId(e.target.value)}>
                <option value="">Select champion…</option>
                {champOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Skin
              <select
                value={addSkinKey}
                onChange={(e) => setAddSkinKey(e.target.value)}
                disabled={!addChampId || manualSkinsLoading}
              >
                <option value="">
                  {!addChampId
                    ? 'Select a champion first…'
                    : manualSkinsLoading
                      ? 'Loading skins…'
                        : manualSkinOptions.length === 0
                        ? 'No legacy / limited skins for this champ'
                        : 'Select skin…'}
                </option>
                {manualSkinOptions.map((s) => (
                  <option key={`${s.num}-${s.name}`} value={`${s.num}::${s.name}`}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedManualSkin?.imageUrl && (
              <div className={styles.addSkinPreview}>
                <img src={selectedManualSkin.imageUrl} alt={selectedManualSkin.name} />
              </div>
            )}
            <label>
              Account
              <select
                value={addSkinAccountId === '' ? '' : String(addSkinAccountId)}
                onChange={(e) =>
                  setAddSkinAccountId(e.target.value ? Number(e.target.value) : '')
                }
              >
                <option value="">Select account…</option>
                {accountOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.username}
                    {a.essencer && a.essencer !== '-' ? ` · ${a.essencer}` : ''}
                  </option>
                ))}
              </select>
            </label>
            {addSkinStatus && <p className={styles.addSkinStatus}>{addSkinStatus}</p>}
            <div className={styles.addSkinActions}>
              <button type="button" onClick={() => setShowAddSkin(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={addSkinSaving || !selectedManualSkin || addSkinAccountId === ''}
                onClick={() => void submitAddSkin()}
              >
                {addSkinSaving ? 'Saving…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Skins;
