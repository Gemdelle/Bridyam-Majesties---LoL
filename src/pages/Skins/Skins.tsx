import React, { useState, useEffect, useMemo } from 'react';
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
  type RoleAccountOption,
  type OwnedSkin,
  type LaneRole,
} from '../../services/skinsService';
import { fetchRankedData } from '../../services/apiRankedsService';
import { assetUrl } from '../../utils/assetUrl';

type ViewState = 'featured' | 'other' | 'family';

interface RoleSelection {
  rankedId: number;
  skinName: string;
}

const RoleSlot: React.FC<{
  column: RoleTeamColumn;
  selection: RoleSelection | null;
  onSelect: (next: RoleSelection) => void;
}> = ({ column, selection, onSelect }) => {
  const [skinPickerOpen, setSkinPickerOpen] = useState(false);

  const selectedAccount: RoleAccountOption | null = useMemo(() => {
    if (!column.accounts.length) return null;
    return (
      column.accounts.find((a) => a.rankedId === selection?.rankedId) || column.accounts[0]
    );
  }, [column.accounts, selection]);

  const selectedSkin: OwnedSkin | null = useMemo(() => {
    if (!selectedAccount) return null;
    return (
      selectedAccount.skins.find((s) => s.name === selection?.skinName) ||
      selectedAccount.skins[0] ||
      null
    );
  }, [selectedAccount, selection]);

  useEffect(() => {
    if (!column.accounts.length) return;
    if (selection) {
      const exists = column.accounts.some((a) => a.rankedId === selection.rankedId);
      if (exists) return;
    }
    const first = column.accounts[0];
    if (first?.skins[0]) {
      onSelect({ rankedId: first.rankedId, skinName: first.skins[0].name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.role, column.accounts]);

  const extraSkins = selectedAccount ? selectedAccount.skins.length : 0;

  return (
    <div className={styles.role__column}>
      <div className={styles.role__header}>
        <img src={column.icon} alt={column.label} className={styles.role__icon} />
        <span className={styles.role__label}>{column.label}</span>
      </div>

      <div className={styles.role__skin__wrap}>
        {selectedSkin?.imageUrl ? (
          <img src={selectedSkin.imageUrl} alt={selectedSkin.name} className={styles.role__skin__img} />
        ) : (
          <div className={styles.role__empty__box}>—</div>
        )}

        {extraSkins > 1 && (
          <button
            type="button"
            className={styles.skin__count__badge}
            onClick={() => setSkinPickerOpen((v) => !v)}
            title={`${extraSkins} skins`}
          >
            {extraSkins}
          </button>
        )}

        {skinPickerOpen && selectedAccount && selectedAccount.skins.length > 1 && (
          <div className={styles.skin__picker}>
            {selectedAccount.skins.map((skin) => (
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

      {column.accounts.length === 0 ? (
        <div className={styles.role__account__empty}>No account</div>
      ) : (
        <select
          className={styles.role__account__select}
          value={selectedAccount?.rankedId ?? ''}
          onChange={(e) => {
            const rankedId = Number(e.target.value);
            const acc = column.accounts.find((a) => a.rankedId === rankedId);
            if (!acc) return;
            onSelect({ rankedId, skinName: acc.skins[0]?.name || '' });
            setSkinPickerOpen(false);
          }}
        >
          {column.accounts.map((acc) => (
            <option key={acc.rankedId} value={acc.rankedId}>
              {cleanAccountName(acc.username)}
              {acc.skins.length > 1 ? ` (${acc.skins.length})` : ''}
            </option>
          ))}
        </select>
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

  const openFamily = (family: SkinFamily, from: ViewState = 'featured') => {
    const team = getRoleTeamForFamily(family, accountSkins, rankedLookup, rolesData);
    const initial: Partial<Record<LaneRole, RoleSelection>> = {};
    team.forEach((col) => {
      if (col.accounts[0]?.skins[0]) {
        initial[col.role] = {
          rankedId: col.accounts[0].rankedId,
          skinName: col.accounts[0].skins[0].name,
        };
      }
    });
    setSelectedFamily(family);
    setRoleTeam(team);
    setRoleSelections(initial);
    setViewState('family');
    // remember where we came from via selectedFamily only; back goes to featured/other by checking featured flag
    void from;
  };

  const backToList = () => {
    const wasFeatured = selectedFamily?.featured !== false;
    setViewState(wasFeatured ? 'featured' : 'other');
    setSelectedFamily(null);
    setRoleTeam([]);
    setRoleSelections({});
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
            <span>{family.skinCount}</span>
          </div>
          <div className={styles.family__card__acct}>{acctCount} acct</div>
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
                {selectedFamily.skinCount} skins ·{' '}
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
                onSelect={(next) =>
                  setRoleSelections((prev) => ({
                    ...prev,
                    [col.role]: next,
                  }))
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Skins;
