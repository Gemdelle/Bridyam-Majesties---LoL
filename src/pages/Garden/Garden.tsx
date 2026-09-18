import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Garden.module.scss';
import {
    hasPetPassword,
    loadGardenPets,
    petCare,
    sanctuaryAsset,
    setPetPassword,
    type GardenPet,
    verifyPetPassword,
} from '../../services/gardenService';
import { playClickSound, playPettingSound } from '../../utils/soundUtils';
import { assetUrl } from '../../utils/assetUrl';

type Heart = { id: number; x: number; y: number; type: number };
type PanelMode = 'care' | 'auth' | null;

type WalkPet = GardenPet & {
    tx: number;
    ty: number;
    vx: number;
    vy: number;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Floor walkable area in % of the floor panel */
const pickTarget = (): { x: number; y: number } => ({
    x: rand(8, 92),
    y: rand(12, 88),
});

const Garden: React.FC = () => {
    const navigate = useNavigate();
    const [pets, setPets] = useState<WalkPet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<WalkPet | null>(null);
    const [panel, setPanel] = useState<PanelMode>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState('');
    const [hearts, setHearts] = useState<Heart[]>([]);
    const [heartId, setHeartId] = useState(0);
    const [pettingOwner, setPettingOwner] = useState<string | null>(null);
    const floorRef = useRef<HTMLDivElement>(null);
    const petsRef = useRef<WalkPet[]>([]);
    const rafRef = useRef<number>(0);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const list = await loadGardenPets();
            const walked: WalkPet[] = list.map((p, i) => {
                const start = pickTarget();
                const target = pickTarget();
                return {
                    ...p,
                    x: start.x,
                    y: 20 + ((i * 11) % 60),
                    tx: target.x,
                    ty: target.y,
                    vx: 0,
                    vy: 0,
                    activity: 'walk' as const,
                };
            });
            petsRef.current = walked;
            setPets(walked);
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

    // Smooth walking across the floor
    useEffect(() => {
        let last = performance.now();
        const step = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const next = petsRef.current.map((p) => {
                let { x, y, tx, ty, facing, activity, needs } = p;
                const hungry = needs.hunger < 28;
                const tired = needs.energy < 22;

                // Soft pull toward food / sleep corners of the floor when needy
                if (hungry && Math.random() < 0.008) {
                    tx = rand(70, 92);
                    ty = rand(8, 28);
                } else if (tired && Math.random() < 0.008) {
                    tx = rand(8, 28);
                    ty = rand(8, 28);
                }

                const dx = tx - x;
                const dy = ty - y;
                const dist = Math.hypot(dx, dy);

                if (dist < 1.2) {
                    const t = pickTarget();
                    tx = t.x;
                    ty = t.y;
                    activity =
                        hungry && x > 65 && y < 35 ? 'eat' : tired && x < 35 && y < 35 ? 'sleep' : 'idle';
                } else {
                    activity = 'walk';
                    const speed = 7 + Math.random() * 4; // % per second
                    const nx = x + (dx / dist) * speed * dt;
                    const ny = y + (dy / dist) * speed * dt;
                    if (Math.abs(dx) > 0.2) facing = dx > 0 ? 1 : -1;
                    x = Math.max(4, Math.min(96, nx));
                    y = Math.max(6, Math.min(94, ny));
                }

                return { ...p, x, y, tx, ty, facing, activity };
            });
            petsRef.current = next;
            setPets(next);
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    const spawnHearts = (owner: string, clientX: number, clientY: number) => {
        const floor = floorRef.current?.getBoundingClientRect();
        const baseX = floor ? clientX - floor.left : clientX;
        const baseY = floor ? clientY - floor.top : clientY;
        const batch: Heart[] = [];
        for (let i = 0; i < 4; i++) {
            batch.push({
                id: heartId + i,
                x: baseX + (Math.random() - 0.5) * 50,
                y: baseY - 10 - Math.random() * 20,
                type: (Math.floor(Math.random() * 3) + 1) as number,
            });
        }
        setHeartId((h) => h + 4);
        setHearts((prev) => [...prev, ...batch]);
        setTimeout(() => {
            setHearts((prev) => prev.filter((h) => !batch.some((b) => b.id === h.id)));
        }, 1600);
        setPettingOwner(owner);
        setTimeout(() => setPettingOwner(null), 500);
    };

    const openPet = (pet: WalkPet) => {
        playClickSound();
        setSelected(pet);
        setAuthError('');
        setPasswordInput('');
        setPanel('care');
    };

    const applyCare = (action: 'love' | 'feed' | 'sleep') => {
        if (!selected) return;
        if (action === 'love') {
            playPettingSound(selected.petType);
            if (floorRef.current) {
                const r = floorRef.current.getBoundingClientRect();
                spawnHearts(
                    selected.owner,
                    r.left + (selected.x / 100) * r.width,
                    r.top + (selected.y / 100) * r.height
                );
            }
        } else {
            playClickSound();
        }
        const next = petCare(selected.owner, action);
        const stage = next.love >= 80 ? 3 : next.love >= 45 ? Math.max(selected.stage, 2) : selected.stage;
        const patch = (p: WalkPet): WalkPet =>
            p.owner === selected.owner
                ? {
                      ...p,
                      needs: next,
                      stage,
                      activity: action === 'feed' ? 'eat' : action === 'sleep' ? 'sleep' : 'idle',
                      imageSrc: p.imageSrc.replace(/pet-(\d)-\d/, `pet-$1-${stage}`),
                  }
                : p;
        petsRef.current = petsRef.current.map(patch);
        setPets(petsRef.current);
        setSelected((s) => (s ? patch(s) : s));
    };

    const startAuthForFight = () => {
        if (!selected) return;
        playClickSound();
        setPanel('auth');
        setAuthError('');
        setPasswordInput('');
    };

    const goToFight = (player: WalkPet) => {
        const foes = petsRef.current.filter((p) => p.owner !== player.owner);
        const foe = foes.length ? foes[Math.floor(Math.random() * foes.length)] : null;
        if (!foe) {
            setAuthError('Need at least one other pet in the garden to fight.');
            return;
        }
        sessionStorage.setItem(
            'bridyam_garden_fight',
            JSON.stringify({
                playerOwner: player.owner,
                enemyOwner: foe.owner,
            })
        );
        navigate('/garden/fight');
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
            goToFight(selected);
            return;
        }
        if (!verifyPetPassword(owner, passwordInput)) {
            setAuthError('Wrong password — only the owner can fight with this pet.');
            return;
        }
        goToFight(selected);
    };

    return (
        <div className={styles.garden}>
            <img className={styles.bg} src={sanctuaryAsset('bg')} alt="" />

            <div className={styles.header}>
                <h1>Garden</h1>
                <p>Walk the sanctuary. Pet, feed, rest — or prove ownership and fight.</p>
            </div>

            <div className={styles.stage}>
                <div className={`${styles.prop} ${styles.propSleep}`}>
                    <img src={sanctuaryAsset('sleep')} alt="Sleep" />
                    <span>Sleep</span>
                </div>
                <div className={`${styles.prop} ${styles.propFood}`}>
                    <img src={sanctuaryAsset('food')} alt="Food" />
                    <span>Food</span>
                </div>

                <div className={styles.floor} ref={floorRef}>
                    <img className={styles.floorImg} src={sanctuaryAsset('floor')} alt="" />

                    {loading && <div className={styles.loading}>Calling the pets…</div>}
                    {!loading && pets.length === 0 && (
                        <div className={styles.loading}>No claimed pets yet.</div>
                    )}

                    {pets.map((pet) => (
                        <button
                            key={pet.owner}
                            type="button"
                            className={`${styles.pet} ${styles[`pet--${pet.activity}`]} ${
                                pettingOwner === pet.owner ? styles.petting : ''
                            } ${selected?.owner === pet.owner ? styles.petSelected : ''}`}
                            style={{
                                left: `${pet.x}%`,
                                top: `${pet.y}%`,
                                transform: `translate(-50%, -50%) scaleX(${pet.facing})`,
                                zIndex: Math.round(pet.y),
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

                    {hearts.map((heart) => (
                        <img
                            key={heart.id}
                            className={styles.heart}
                            style={{ left: heart.x, top: heart.y }}
                            src={assetUrl(`images/icons/love-icon-${heart.type}.png`)}
                            alt=""
                        />
                    ))}
                </div>
            </div>

            {panel && selected && (
                <div className={styles.overlay} onClick={() => setPanel(null)}>
                    <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                        <button type="button" className={styles.close} onClick={() => setPanel(null)}>
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
                                        {hasPetPassword(selected.owner) ? 'Enter arena' : 'Set & fight'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Garden;
