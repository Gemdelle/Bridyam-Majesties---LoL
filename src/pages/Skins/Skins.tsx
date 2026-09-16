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
  getOwnedSplashForFamily,
  getTeamSkinImageUrl,
  FEATURED_PRIORITY_ORDER,
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

interface SplashFit {
  x: number; // object-position % horizontal
  y: number; // object-position % vertical
  scale: number;
}

const SPLASH_FIT_KEY = 'bridyam-skin-splash-fit';
const DEFAULT_FIT: SplashFit = { x: 50, y: 35, scale: 1.2 };

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
  family: SkinFamily | null;
}> = ({ column, selection, blockedChampions, onSelect, family }) => {
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
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const extraSkins = availableSkins.length;

  const cycleSkin = (dir: 1 | -1) => {
    if (!selectedAccount || availableSkins.length < 2) return;
    const idx = Math.max(
      0,
      availableSkins.findIndex((s) => s.name === selectedSkin?.name)
    );
    const next = availableSkins[(idx + dir + availableSkins.length) % availableSkins.length];
    onSelect({ rankedId: selectedAccount.rankedId, skinName: next.name });
  };

  const imgStyle: React.CSSProperties = {
    objectFit: 'contain',
    objectPosition: 'center center',
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
                    const skin =
                      firstAvailableSkin(acc.skins, blockedChampions) || acc.skins[0];
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
              src={getTeamSkinImageUrl(selectedSkin, family)}
              alt={selectedSkin.name}
              className={styles.role__skin__img}
              style={imgStyle}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                if (selectedSkin.imageUrl && el.src !== selectedSkin.imageUrl) {
                  el.src = selectedSkin.imageUrl;
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

        {extraSkins > 1 && (
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
  const [editSplash, setEditSplash] = useState(false);
  const [splashFits, setSplashFits] = useState<Record<string, SplashFit>>(() => loadSplashFits());
  const [editingFamilyId, setEditingFamilyId] = useState<number | null>(null);

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
        // File defaults + local edits on top
        const merged = { ...fileFits, ...loadSplashFits() };
        setSplashFits(merged);
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
    const pinned = featured
      .filter((f) => priorityIdx(f.name) < 1000)
      .sort((a, b) => priorityIdx(a.name) - priorityIdx(b.name));
    const rest = featured
      .filter((f) => priorityIdx(f.name) === 1000)
      .sort((a, b) => {
        const ca = getAccountsForFamily(a, accountSkins, rankedLookup).length;
        const cb = getAccountsForFamily(b, accountSkins, rankedLookup).length;
        return cb - ca || a.name.localeCompare(b.name);
      });
    return [...pinned, ...rest];
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
    splashFits[String(family.id)] || splashFits[family.name] || DEFAULT_FIT;

  const updateFit = (family: SkinFamily, patch: Partial<SplashFit>) => {
    const key = String(family.id);
    const current = getFit(family);
    const nextFit: SplashFit = {
      x: Number(patch.x ?? current.x),
      y: Number(patch.y ?? current.y),
      scale: Number(patch.scale ?? current.scale),
    };
    nextFit.x = Math.max(-80, Math.min(180, nextFit.x));
    nextFit.y = Math.max(-80, Math.min(180, nextFit.y));
    nextFit.scale = Math.max(1, Math.min(2.8, nextFit.scale));
    const next = { ...splashFits, [key]: nextFit };
    setSplashFits(next);
    saveSplashFits(next);
  };

  const copyFitsJson = async () => {
    const text = JSON.stringify(splashFits, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      alert('Splash fits copied to clipboard (localStorage also saved).');
    } catch {
      console.log(text);
      alert('Could not copy — check console for JSON.');
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
    const isEditing = editSplash && editingFamilyId === family.id;
    const splashSrc = getOwnedSplashForFamily(family, accountSkins);
    const imgStyle: React.CSSProperties = {
      objectPosition: `${fit.x}% ${fit.y}%`,
      // Origin follows focus point so ↑/↓ actually pans while zoomed
      transform: `scale(${fit.scale})`,
      transformOrigin: `${fit.x}% ${fit.y}%`,
    };

    return (
      <div
        key={family.id}
        className={`${styles.family__card} ${isEditing ? styles.family__card__editing : ''}`}
        onClick={() => {
          if (editSplash) {
            setEditingFamilyId(family.id);
            return;
          }
          openFamily(family);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (editSplash) setEditingFamilyId(family.id);
            else openFamily(family);
          }
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
            <span className={`${styles.family__card__gems__count}`}>
              {covered}
            </span>
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

        {isEditing && (
          <div
            className={styles.splash__edit__panel}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => updateFit(family, { x: fit.x - 6 })}>
              ←
            </button>
            <button
              type="button"
              title="Pan up (reveal lower part / push image up)"
              onClick={() => updateFit(family, { y: Number(fit.y) - 8 })}
            >
              ↑
            </button>
            <button
              type="button"
              title="Pan down (reveal heads / push image down)"
              onClick={() => updateFit(family, { y: Number(fit.y) + 8 })}
            >
              ↓
            </button>
            <button type="button" onClick={() => updateFit(family, { x: fit.x + 6 })}>
              →
            </button>
            <button
              type="button"
              onClick={() =>
                updateFit(family, { scale: Math.max(1, +(Number(fit.scale) - 0.08).toFixed(2)) })
              }
            >
              −
            </button>
            <button
              type="button"
              onClick={() =>
                updateFit(family, { scale: Math.min(2.8, +(Number(fit.scale) + 0.08).toFixed(2)) })
              }
            >
              +
            </button>
            <button
              type="button"
              onClick={() => updateFit(family, { ...DEFAULT_FIT })}
              title="Reset"
            >
              ↺
            </button>
            <span className={styles.splash__edit__meta}>
              y:{Math.round(Number(fit.y))} z:{Number(fit.scale).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderPager = (page: number, pageCount: number, onPrev: () => void, onNext: () => void) =>
    pageCount > 1 ? (
      <div className={styles.pager}>
        {page > 0 && (
          <button type="button" className={styles.pager__btn} onClick={onPrev} aria-label="Previous page">
            ▴
          </button>
        )}
        <span className={styles.pager__meta}>
          {page + 1}/{pageCount}
        </span>
        {page < pageCount - 1 && (
          <button type="button" className={styles.pager__btn} onClick={onNext} aria-label="Next page">
            ▾
          </button>
        )}
      </div>
    ) : null;

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
            <button
              type="button"
              className={`${styles.other__button} ${editSplash ? styles.edit__active : ''}`}
              onClick={() => {
                setEditSplash((v) => !v);
                setEditingFamilyId(null);
              }}
            >
              {editSplash ? 'Done editing' : 'Edit splashes'}
            </button>
            {editSplash && (
              <button type="button" className={styles.other__button} onClick={copyFitsJson}>
                Copy fits JSON
              </button>
            )}
          </div>
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
            <button
              type="button"
              className={`${styles.other__button} ${editSplash ? styles.edit__active : ''}`}
              onClick={() => {
                setEditSplash((v) => !v);
                setEditingFamilyId(null);
              }}
            >
              {editSplash ? 'Done editing' : 'Edit splashes'}
            </button>
          </div>
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
                family={selectedFamily}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Skins;
