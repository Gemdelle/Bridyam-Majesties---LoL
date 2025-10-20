import React, { useState, useEffect } from 'react';
import styles from './AccountSummary.module.scss';
import { fetchChampions, type Champion, getRiotIdForChampion } from '../../services/championsService';
import { fetchMasteryDataByRankedId } from '../../services/apiMasteriesService';

// Define todos los datos numéricos que el componente necesita
export interface AccountSummaryData {
    url: string;
    id: number;
    name: string;
    username: string;
    champions: number;
    skins: number;
    masteries: number;
    roles: {
        top: number;
        jungle: number;
        mid: number;
        adc: number;
        support: number;
    };
}

interface AccountSummaryProps {
    data: AccountSummaryData;
}

interface ChampionWithMastery {
    champion: Champion;
    masteryLevel: number;
}

// Function to convert number to digit images
const renderNumberAsImages = (number: number) => {
    const digits = number.toString().split('');
    return (
        <div className={styles.numberContainer}>
            {digits.map((digit, index) => (
                <img
                    key={index}
                    src={`/images/roulette/${digit}.png`}
                    alt={digit}
                    className={`${styles.digitImage} ${digit === '0' ? styles.zeroDigit : ''}`}
                />
            ))}
        </div>
    );
};

// Function to normalize champion name for Riot API
const getChampionImageName = (championName: string): string => {
    // Special cases that need specific handling
    const specialCases: { [key: string]: string } = {
        "Nunu & Willump": "Nunu",
        "Wukong": "MonkeyKing",
        "Renata Glasc": "Renata",
        "Bel'Veth": "Belveth",
        "Cho'Gath": "Chogath",
        "Dr. Mundo": "DrMundo",
        "Jarvan IV": "JarvanIV",
        "K'Sante": "KSante",
        "Kai'Sa": "Kaisa",
        "Kha'Zix": "Khazix",
        "Kog'Maw": "KogMaw",
        "LeBlanc": "Leblanc",
        "Lee Sin": "LeeSin",
        "Master Yi": "MasterYi",
        "Miss Fortune": "MissFortune",
        "Twisted Fate": "TwistedFate",
        "Tahm Kench": "TahmKench",
        "Vel'Koz": "Velkoz",
        "Xin Zhao": "XinZhao",
        "Rek'Sai": "RekSai",
        "Aurelion Sol": "AurelionSol"
    };

    // Check if it's a special case
    if (specialCases[championName]) {
        return specialCases[championName];
    }

    // Default: remove apostrophes, dots, spaces, and ampersands
    return championName.replace(/['.\s&]/g, '');
};

const AccountSummary: React.FC<AccountSummaryProps> = ({ data }) => {
    const [topChampions, setTopChampions] = useState<ChampionWithMastery[]>([]);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    // Get the top 4 champions with highest mastery for this account
    useEffect(() => {
        const getTopChampions = async () => {
            try {
                // Load champions and masteries for this account
                const [allChampions, accountMasteries] = await Promise.all([
                    fetchChampions(),
                    fetchMasteryDataByRankedId(data.id)
                ]);

                // Create a map of riot champion id to our champion id
                const riotIdToChampionMap = new Map<number, Champion>();
                allChampions.forEach(champion => {
                    const riotId = getRiotIdForChampion(champion.id);
                    riotIdToChampionMap.set(riotId, champion);
                });

                // Match masteries with champions and filter only champions with mastery > 0
                const championsWithMastery: ChampionWithMastery[] = accountMasteries
                    .filter(mastery => mastery.champion_level !== null && mastery.champion_level > 0)
                    .map(mastery => {
                        const champion = riotIdToChampionMap.get(mastery.champion_id);
                        return champion ? {
                            champion,
                            masteryLevel: mastery.champion_level!
                        } : null;
                    })
                    .filter((item): item is ChampionWithMastery => item !== null);

                // Sort by mastery level descending and take top 5
                const topFive = championsWithMastery
                    .sort((a, b) => b.masteryLevel - a.masteryLevel)
                    .slice(0, 5);

                setTopChampions(topFive);
            } catch (error) {
                console.error('Error loading top champions:', error);
            }
        };

        getTopChampions();
    }, [data.id]);

    const handleImageError = (championId: number) => {
        setImageErrors(prev => new Set(prev).add(championId));
    };

    return (
        <div className={styles.card}>
            <div className={styles.ranking__container}>
                <img src="/images/frames/account-ranking-position-frame.png" alt="Ranking Frame" className={styles.ranking__position_frame} />
                <span className={styles.ranking__position}>{renderNumberAsImages(10)}</span>
            </div>
            <h2 className={styles.name}>{data.username}</h2>

            <div className={styles.card__container}>
                <div className={styles.profileIcon}>
                    <img
                        key={data.id}
                        src={data.url}
                        alt={`${data.username} portrait`}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/frames/default-majesty-portrait.png';
                        }}
                    />
                </div>
                <h3 className={styles.username}>{data.name}</h3>
                <div className={styles.info__container}>



                    <div className={styles.info__stats}>
                        <div className={styles.info__item}>
                            <span className={styles.info__item__title}>champions</span> <span className={styles.info__item__value}>{data.champions}</span>
                        </div>
                        <div className={styles.info__item}>

                            <span className={styles.info__item__title}>masteries</span> <span className={styles.info__item__value}>{data.masteries}</span>
                        </div>

                        <div className={styles.info__item}>
                            <span className={styles.info__item__title}>skins</span> <span className={styles.info__item__value}>{data.skins}</span>
                        </div>
                    </div>
                    <div className={styles.champions}>
                        {topChampions.map((championData) => {
                            const champion = championData.champion;
                            const masteryLevel = championData.masteryLevel;
                            const hasImageError = imageErrors.has(champion.id);
                            
                            return (
                                <div key={champion.id} className={styles.champion__container}>
                                    <div className={styles.champion__icon}>
                                        {!hasImageError ? (
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${getChampionImageName(champion.name)}.png`}
                                                alt={champion.name}
                                                className={styles.champion__icon__image}
                                                onError={() => handleImageError(champion.id)}
                                            />
                                        ) : (
                                            <div className={styles.champion__placeholder}>?</div>
                                        )}
                                        <img
                                            src="/images/frames/account-champion-frame.png"
                                            alt="Champion Frame"
                                            className={styles.champion__icon__frame}
                                        />
                                    </div>
                                    <div className={styles.champion__mastery}>
                                        <img
                                            src={`/images/masteries/badges/${Math.min(masteryLevel, 10)}.png`}
                                            alt={`Mastery ${masteryLevel}`}
                                            className={`${styles.mastery__badge} ${masteryLevel <= 3 ? styles['mastery__badge--small'] : ''}`}
                                        />
                                        <span className={styles.mastery__level}>
                                            {masteryLevel > 10 ? '10+' : masteryLevel}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>


            </div>
        </div>
    );
};

export default AccountSummary; 