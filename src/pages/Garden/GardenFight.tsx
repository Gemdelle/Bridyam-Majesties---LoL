import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './GardenFight.module.scss';
import {
    abilityPower,
    loadGardenPets,
    petCare,
    type GardenPet,
} from '../../services/gardenService';
import type { PetAbility } from '../../services/petsService';
import { playClickSound } from '../../utils/soundUtils';
import { sanctuaryAsset } from '../../services/gardenService';

type FightPayload = { playerOwner: string; enemyOwner: string };

const GardenFight: React.FC = () => {
    const navigate = useNavigate();
    const [player, setPlayer] = useState<GardenPet | null>(null);
    const [enemy, setEnemy] = useState<GardenPet | null>(null);
    const [playerHp, setPlayerHp] = useState(100);
    const [enemyHp, setEnemyHp] = useState(100);
    const [log, setLog] = useState<string[]>([]);
    const [over, setOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const raw = sessionStorage.getItem('bridyam_garden_fight');
        if (!raw) {
            navigate('/garden', { replace: true });
            return;
        }
        let payload: FightPayload;
        try {
            payload = JSON.parse(raw);
        } catch {
            navigate('/garden', { replace: true });
            return;
        }

        void (async () => {
            const pets = await loadGardenPets();
            const p = pets.find((x) => x.owner === payload.playerOwner) || null;
            const e = pets.find((x) => x.owner === payload.enemyOwner) || null;
            if (!p || !e) {
                navigate('/garden', { replace: true });
                return;
            }
            setPlayer(p);
            setEnemy(e);
            setLog([`${p.owner}'s ${p.species} enters the arena vs ${e.owner}'s ${e.species}!`]);
            setLoading(false);
        })();
    }, [navigate]);

    const abilities: PetAbility[] = useMemo(() => {
        return player?.catalog?.abilities?.length
            ? player.catalog.abilities
            : [
                  { name: 'Nuzzle', type: 'defensive', description: 'Soft guard' },
                  { name: 'Pounce', type: 'offensive', description: 'Quick strike' },
                  { name: 'Bond Burst', type: 'ultimate', description: 'Love-powered hit' },
              ];
    }, [player]);

    const doMove = (ability: PetAbility) => {
        if (!player || !enemy || over) return;
        playClickSound();
        const pStats = player.catalog?.stats || { force: 2, instinct: 2, pressure: 2, cleverness: 2 };
        const eStats = enemy.catalog?.stats || { force: 2, instinct: 2, pressure: 2, cleverness: 2 };
        const dmg = abilityPower(ability, pStats);
        const nextEnemy = Math.max(0, enemyHp - dmg);
        const lines = [`${player.species} uses ${ability.name} (−${dmg})`];

        if (nextEnemy <= 0) {
            setEnemyHp(0);
            setLog((l) => [...l, ...lines, `${player.owner} wins the fight!`]);
            setOver(true);
            setWinner('player');
            petCare(player.owner, 'love');
            return;
        }

        const aiList = enemy.catalog?.abilities || [];
        const ai =
            aiList[Math.floor(Math.random() * Math.max(1, aiList.length))] ||
            ({ name: 'Scratch', type: 'offensive', description: 'AI' } as PetAbility);
        const aiDmg = abilityPower(ai, eStats);
        const nextPlayer = Math.max(0, playerHp - aiDmg);
        lines.push(`${enemy.species} uses ${ai.name} (−${aiDmg})`);

        setEnemyHp(nextEnemy);
        setPlayerHp(nextPlayer);
        setLog((l) => [...l, ...lines]);

        if (nextPlayer <= 0) {
            setOver(true);
            setWinner('enemy');
            setLog((l) => [...l, `${enemy.owner}'s pet wins.`]);
        }
    };

    if (loading || !player || !enemy) {
        return (
            <div className={styles.fight}>
                <img className={styles.bg} src={sanctuaryAsset('bg')} alt="" />
                <p className={styles.loading}>Preparing the arena…</p>
            </div>
        );
    }

    return (
        <div className={styles.fight}>
            <img className={styles.bg} src={sanctuaryAsset('bg')} alt="" />
            <div className={styles.topBar}>
                <Link to="/garden" className={styles.back} onClick={playClickSound}>
                    ← Garden
                </Link>
                <h1>Pet Arena</h1>
                <span className={styles.hint}>You control {player.species}. Opponent is AI.</span>
            </div>

            <div className={styles.arena}>
                <div className={styles.fighter}>
                    <img src={player.imageSrc} alt={player.species} />
                    <div className={styles.hpTrack}>
                        <div className={styles.hpFill} style={{ width: `${playerHp}%` }} />
                    </div>
                    <strong>{player.owner}</strong>
                    <span>{player.species}</span>
                </div>
                <div className={styles.vs}>VS</div>
                <div className={styles.fighter}>
                    <img src={enemy.imageSrc} alt={enemy.species} style={{ transform: 'scaleX(-1)' }} />
                    <div className={styles.hpTrack}>
                        <div className={styles.hpFill} style={{ width: `${enemyHp}%` }} />
                    </div>
                    <strong>{enemy.owner}</strong>
                    <span>{enemy.species}</span>
                </div>
            </div>

            <div className={styles.log}>
                {log.slice(-8).map((line, i) => (
                    <p key={`${line}-${i}`}>{line}</p>
                ))}
            </div>

            {!over ? (
                <div className={styles.abilities}>
                    {abilities.map((ab) => (
                        <button key={ab.name} type="button" onClick={() => doMove(ab)}>
                            <strong>{ab.name}</strong>
                            <small>{ab.type}</small>
                        </button>
                    ))}
                </div>
            ) : (
                <div className={styles.result}>
                    <h2>{winner === 'player' ? 'Victory!' : 'Defeat…'}</h2>
                    <button type="button" onClick={() => navigate('/garden')}>
                        Return to Garden
                    </button>
                </div>
            )}
        </div>
    );
};

export default GardenFight;
