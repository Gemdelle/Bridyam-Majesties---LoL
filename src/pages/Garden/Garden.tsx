import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './Garden.module.scss';
import {
    abilityPower,
    hasPetPassword,
    loadGardenPets,
    petCare,
    sanctuaryAsset,
    setPetPassword,
    type GardenPet,
    verifyPetPassword,
} from '../../services/gardenService';
import type { PetAbility } from '../../services/petsService';
import { playClickSound } from '../../utils/soundUtils';

type PanelMode = 'care' | 'auth' | 'fight' | null;

const Garden: React.FC = () => {
    const [pets, setPets] = useState<GardenPet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<GardenPet | null>(null);
    const [panel, setPanel] = useState<PanelMode>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState('');
    const [controlledOwner, setControlledOwner] = useState<string | null>(null);
    const [enemy, setEnemy] = useState<GardenPet | null>(null);
    const [playerHp, setPlayerHp] = useState(100);
    const [enemyHp, setEnemyHp] = useState(100);
    const [fightLog, setFightLog] = useState<string[]>([]);
    const [fightOver, setFightOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
    const animRef = useRef<number | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const list = await loadGardenPets();
            setPets(list);
        } catch (err) {
            console.error('Garden load failed', err);
            setPets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        if (panel === 'fight') return;
        const tick = () => {
            setPets((prev) =>
                prev.map((p) => {
                    let { x, y, facing, activity, needs } = p;
                    const hungry = needs.hunger < 30;
                    const tired = needs.energy < 25;

                    if (hungry && Math.random() < 0.04) {
                        x += (18 - x) * 0.08;
                        y += (72 - y) * 0.08;
                        activity = Math.hypot(x - 18, y - 72) < 8 ? 'eat' : 'walk';
                    } else if (tired && Math.random() < 0.04) {
                        x += (78 - x) * 0.08;
                        y += (70 - y) * 0.08;
                        activity = Math.hypot(x - 78, y - 70) < 8 ? 'sleep' : 'walk';
                    } else if (activity === 'eat' || activity === 'sleep') {
                        if (Math.random() < 0.02) activity = 'walk';
                    } else {
                        activity = 'walk';
                        const dx = (Math.random() - 0.5) * 1.4;
                        const dy = (Math.random() - 0.5) * 0.9;
                        x = Math.max(4, Math.min(90, x + dx));
                        y = Math.max(18, Math.min(82, y + dy));
                        if (dx !== 0) facing = dx > 0 ? 1 : -1;
                    }

                    return { ...p, x, y, facing, activity };
                })
            );
            animRef.current = window.setTimeout(tick, 180);
        };
        animRef.current = window.setTimeout(tick, 180);
        return () => {
            if (animRef.current) window.clearTimeout(animRef.current);
        };
    }, [panel]);

    const openPet = (pet: GardenPet) => {
        playClickSound();
        setSelected(pet);
        setAuthError('');
        setPasswordInput('');
        setPanel('care');
    };

    const applyCare = (action: 'love' | 'feed' | 'sleep') => {
        if (!selected) return;
        playClickSound();
        const next = petCare(selected.owner, action);
        const stage = next.love >= 80 ? 3 : next.love >= 45 ? Math.max(selected.stage, 2) : selected.stage;
        setPets((prev) =>
            prev.map((p) =>
                p.owner === selected.owner
                    ? {
                          ...p,
                          needs: next,
                          activity: action === 'feed' ? 'eat' : action === 'sleep' ? 'sleep' : 'idle',
                          stage,
                          imageSrc: p.imageSrc.replace(/pet-(\d)-\d/, `pet-$1-${stage}`),
                      }
                    : p
            )
        );
        setSelected((s) => (s ? { ...s, needs: next, stage } : s));
    };

    const startAuthForFight = () => {
        if (!selected) return;
        playClickSound();
        setPanel('auth');
        setAuthError('');
        setPasswordInput('');
    };

    const beginFight = (player: GardenPet) => {
        const foes = pets.filter((p) => p.owner !== player.owner);
        const foe = foes.length ? foes[Math.floor(Math.random() * foes.length)] : null;
        if (!foe) {
            setAuthError('Need at least one other pet in the garden to fight.');
            return;
        }
        setEnemy(foe);
        setPlayerHp(100);
        setEnemyHp(100);
        setFightLog([`${player.owner}'s ${player.species} challenges ${foe.owner}'s ${foe.species}!`]);
        setFightOver(false);
        setWinner(null);
        setPanel('fight');
    };

    const confirmAuth = () => {
        if (!selected) return;
        const owner = selected.owner;
        if (!hasPetPassword(owner)) {
            if (passwordInput.trim().length < 3) {
                setAuthError('Set a password (min 3 chars) for this pet.');
                return;
            }
            setPetPassword(owner, passwordInput);
            setControlledOwner(owner);
            beginFight(selected);
            return;
        }
        if (!verifyPetPassword(owner, passwordInput)) {
            setAuthError('Wrong password — only the owner can fight with this pet.');
            return;
        }
        setControlledOwner(owner);
        beginFight(selected);
    };

    const playerAbilities: PetAbility[] = useMemo(() => {
        return selected?.catalog?.abilities?.length
            ? selected.catalog.abilities
            : [
                  { name: 'Nuzzle', type: 'defensive', description: 'Soft guard' },
                  { name: 'Pounce', type: 'offensive', description: 'Quick strike' },
                  { name: 'Bond Burst', type: 'ultimate', description: 'Love-powered hit' },
              ];
    }, [selected]);

    const doPlayerMove = (ability: PetAbility) => {
        if (!selected || !enemy || fightOver) return;
        playClickSound();
        const pStats = selected.catalog?.stats || { force: 2, instinct: 2, pressure: 2, cleverness: 2 };
        const eStats = enemy.catalog?.stats || { force: 2, instinct: 2, pressure: 2, cleverness: 2 };
        const dmg = abilityPower(ability, pStats);
        const nextEnemyHp = Math.max(0, enemyHp - dmg);
        const logs = [`${selected.species} uses ${ability.name} (−${dmg})`];

        if (nextEnemyHp <= 0) {
            setEnemyHp(0);
            setFightLog((l) => [...l, ...logs, `${selected.owner} wins!`]);
            setFightOver(true);
            setWinner('player');
            petCare(selected.owner, 'love');
            return;
        }

        const aiList = enemy.catalog?.abilities || [];
        const aiAbility =
            aiList[Math.floor(Math.random() * Math.max(1, aiList.length))] ||
            ({ name: 'Scratch', type: 'offensive', description: 'AI hit' } as PetAbility);
        const aiDmg = abilityPower(aiAbility, eStats);
        const nextPlayerHp = Math.max(0, playerHp - aiDmg);
        logs.push(`${enemy.species} uses ${aiAbility.name} (−${aiDmg})`);

        setEnemyHp(nextEnemyHp);
        setPlayerHp(nextPlayerHp);
        setFightLog((l) => [...l, ...logs]);

        if (nextPlayerHp <= 0) {
            setFightOver(true);
            setWinner('enemy');
            setFightLog((l) => [...l, `${enemy.owner}'s pet wins.`]);
        }
    };

    const closePanel = () => {
        setPanel(null);
        setSelected(null);
        setEnemy(null);
        setFightOver(false);
    };

    return (
        <div className={styles.garden}>
            <div className={styles.header}>
                <h1>Garden</h1>
                <p>
                    Pets roam, eat, sleep, and evolve with love. Click a pet to care — or prove you are its owner and
                    fight.
                </p>
            </div>

            <div className={styles.arena}>
                <img
                    className={styles.ground}
                    src={sanctuaryAsset('ground')}
                    alt=""
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                <div className={styles.zone} style={{ left: '8%', top: '58%' }} title="Feeding ground">
                    <img src={sanctuaryAsset('eat-spot')} alt="eat" />
                    <span>Eat</span>
                </div>
                <div className={styles.zone} style={{ left: '72%', top: '56%' }} title="Resting nest">
                    <img src={sanctuaryAsset('sleep-spot')} alt="sleep" />
                    <span>Sleep</span>
                </div>

                {loading && <div className={styles.loading}>Calling the pets…</div>}
                {!loading && pets.length === 0 && (
                    <div className={styles.loading}>No claimed pets in the sanctuary yet.</div>
                )}

                {pets.map((pet) => (
                    <button
                        key={pet.owner}
                        type="button"
                        className={`${styles.pet} ${styles[`pet--${pet.activity}`]} ${
                            selected?.owner === pet.owner ? styles.petSelected : ''
                        }`}
                        style={{
                            left: `${pet.x}%`,
                            top: `${pet.y}%`,
                            transform: `translate(-50%, -50%) scaleX(${pet.facing})`,
                        }}
                        onClick={() => openPet(pet)}
                        title={`${pet.owner} · ${pet.species}`}
                    >
                        <div className={styles.bars} style={{ transform: `scaleX(${pet.facing})` }}>
                            <div className={styles.barTrack} title="Love">
                                <div
                                    className={`${styles.barFill} ${styles.love}`}
                                    style={{ width: `${pet.needs.love}%` }}
                                />
                            </div>
                            <div className={styles.barTrack} title="Hunger">
                                <div
                                    className={`${styles.barFill} ${styles.hunger}`}
                                    style={{ width: `${pet.needs.hunger}%` }}
                                />
                            </div>
                            <div className={styles.barTrack} title="Energy">
                                <div
                                    className={`${styles.barFill} ${styles.energy}`}
                                    style={{ width: `${pet.needs.energy}%` }}
                                />
                            </div>
                        </div>
                        <img src={pet.imageSrc} alt={pet.species} draggable={false} />
                        <span className={styles.petName} style={{ transform: `scaleX(${pet.facing})` }}>
                            {pet.owner}
                        </span>
                    </button>
                ))}
            </div>

            {panel && selected && (
                <div className={styles.overlay} onClick={closePanel}>
                    <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                        <button type="button" className={styles.close} onClick={closePanel}>
                            ×
                        </button>

                        {panel === 'care' && (
                            <>
                                <div className={styles.panelHero}>
                                    <img src={selected.imageSrc} alt={selected.species} />
                                    <div>
                                        <h2>{selected.species}</h2>
                                        <p>Owner: {selected.owner}</p>
                                        <p>
                                            Stage {selected.stage}
                                            {selected.needs.love >= 80
                                                ? ' · Evolved'
                                                : selected.needs.love >= 45
                                                  ? ' · Growing'
                                                  : ' · Hatchling bond'}
                                        </p>
                                    </div>
                                </div>
                                <div className={styles.statRows}>
                                    <label>
                                        Love <b>{Math.round(selected.needs.love)}</b>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={`${styles.barFill} ${styles.love}`}
                                                style={{ width: `${selected.needs.love}%` }}
                                            />
                                        </div>
                                    </label>
                                    <label>
                                        Hunger <b>{Math.round(selected.needs.hunger)}</b>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={`${styles.barFill} ${styles.hunger}`}
                                                style={{ width: `${selected.needs.hunger}%` }}
                                            />
                                        </div>
                                    </label>
                                    <label>
                                        Energy <b>{Math.round(selected.needs.energy)}</b>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={`${styles.barFill} ${styles.energy}`}
                                                style={{ width: `${selected.needs.energy}%` }}
                                            />
                                        </div>
                                    </label>
                                </div>
                                <div className={styles.actions}>
                                    <button type="button" onClick={() => applyCare('love')}>
                                        Pet
                                    </button>
                                    <button type="button" onClick={() => applyCare('feed')}>
                                        Feed
                                    </button>
                                    <button type="button" onClick={() => applyCare('sleep')}>
                                        Sleep
                                    </button>
                                    <button type="button" className={styles.fightBtn} onClick={startAuthForFight}>
                                        Fight
                                    </button>
                                </div>
                            </>
                        )}

                        {panel === 'auth' && (
                            <>
                                <h2>Prove you are {selected.owner}</h2>
                                <p>
                                    {hasPetPassword(selected.owner)
                                        ? 'Enter the pet password to take control in battle.'
                                        : 'First time: set a password so only you can fight with this pet.'}
                                </p>
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Password"
                                    className={styles.password}
                                />
                                {authError && <p className={styles.error}>{authError}</p>}
                                <div className={styles.actions}>
                                    <button type="button" onClick={() => setPanel('care')}>
                                        Back
                                    </button>
                                    <button type="button" className={styles.fightBtn} onClick={confirmAuth}>
                                        {hasPetPassword(selected.owner) ? 'Enter fight' : 'Set & fight'}
                                    </button>
                                </div>
                            </>
                        )}

                        {panel === 'fight' && enemy && (
                            <>
                                <h2>Pet Battle</h2>
                                <p className={styles.fightSub}>
                                    You control {selected.species}. {enemy.species} is wild (AI).
                                    {controlledOwner ? ` · Playing as ${controlledOwner}` : ''}
                                </p>
                                <div className={styles.fightArena}>
                                    <div className={styles.fighter}>
                                        <img src={selected.imageSrc} alt="" />
                                        <div className={styles.barTrack}>
                                            <div
                                                className={`${styles.barFill} ${styles.hp}`}
                                                style={{ width: `${playerHp}%` }}
                                            />
                                        </div>
                                        <span>{selected.owner}</span>
                                    </div>
                                    <span className={styles.vs}>VS</span>
                                    <div className={styles.fighter}>
                                        <img src={enemy.imageSrc} alt="" />
                                        <div className={styles.barTrack}>
                                            <div
                                                className={`${styles.barFill} ${styles.hp}`}
                                                style={{ width: `${enemyHp}%` }}
                                            />
                                        </div>
                                        <span>{enemy.owner}</span>
                                    </div>
                                </div>
                                <div className={styles.log}>
                                    {fightLog.slice(-6).map((line, i) => (
                                        <p key={`${line}-${i}`}>{line}</p>
                                    ))}
                                </div>
                                {!fightOver ? (
                                    <div className={styles.abilityGrid}>
                                        {playerAbilities.map((ab) => (
                                            <button key={ab.name} type="button" onClick={() => doPlayerMove(ab)}>
                                                <strong>{ab.name}</strong>
                                                <small>{ab.type}</small>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.actions}>
                                        <p className={styles.winner}>
                                            {winner === 'player' ? 'Victory!' : 'Defeat…'}
                                        </p>
                                        <button type="button" className={styles.fightBtn} onClick={closePanel}>
                                            Back to garden
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Garden;
