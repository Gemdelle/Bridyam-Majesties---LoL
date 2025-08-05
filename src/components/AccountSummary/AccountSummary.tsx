import React, { useState, useEffect } from 'react';
import styles from './AccountSummary.module.scss';
import { fetchChampions, type Champion } from '../../services/championsService';

// Define todos los datos numéricos que el componente necesita
export interface AccountSummaryData {
    url: string;
    id: number;
    name: string;
    username: string;
    champions: number;
    skins: number;
    masteries: number;
    elo?: number; // Made optional since it's not in the new protocol
    roles: {
        top: number;
        jungle: number;
        mid: number;
        adc: number;
        support: number;
    };
    blueEssence: number;
    orangeEssence: number;
}

interface AccountSummaryProps {
    data: AccountSummaryData;
}

// Function to get top 2 roles
const getTopRoles = (roles: AccountSummaryData['roles']) => {
    const roleEntries = [
        { role: 'top', value: roles.top },
        { role: 'jungle', value: roles.jungle },
        { role: 'mid', value: roles.mid },
        { role: 'adc', value: roles.adc },
        { role: 'support', value: roles.support }
    ];

    return roleEntries
        .sort((a, b) => b.value - a.value)
        .slice(0, 2);
};

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

const AccountSummary: React.FC<AccountSummaryProps> = ({ data }) => {
    const [likedChampions, setLikedChampions] = useState<Champion[]>([]);

    // Get the first 3 liked champions from localStorage
    useEffect(() => {
        const getLikedChampions = () => {
            try {
                const savedFavorites = localStorage.getItem('favoriteChampions');
                if (savedFavorites) {
                    const favoriteIds: number[] = JSON.parse(savedFavorites);
                    const firstThreeIds = favoriteIds.slice(0, 3);

                    // Load champions and filter to get the first 3 liked ones
                    fetchChampions().then(champions => {
                        const likedChamps = champions.filter(champion =>
                            firstThreeIds.includes(champion.id)
                        );
                        setLikedChampions(likedChamps);
                    });
                }
            } catch (error) {
                console.error('Error loading liked champions:', error);
            }
        };

        getLikedChampions();
    }, []);

    return (
        <div className={styles.card}>
            <div className={styles.ranking__container}>
                <img src="/images/frames/account-ranking-position-frame.png" alt="Ranking Frame" className={styles.ranking__position_frame} />
                <span className={styles.ranking__position}>{renderNumberAsImages(10)}</span>
            </div>
            <h2 className={styles.name}>{data.username}</h2>
            <h3 className={styles.username}>{data.name}</h3>
            <div className={styles.card__container}>
                <div className={styles.profileIcon}>
                    <img
                        key={data.id}
                        src={data.url}
                        alt={`${data.username} portrait`}
                    />
                </div>
                <div className={styles.info__container}>

                    <div className={styles.info}>
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
                            {[0, 1, 2].map((index) => {
                                const champion = likedChampions[index];
                                return (
                                    <div key={index} className={styles.champion__icon}>
                                        <img
                                            src={champion
                                                ? `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.name.replace(/['.\s]/g, '')}.png`
                                                : "/images/pets/nav-pet-2.png"
                                            }
                                            alt={champion ? champion.name : "Champion"}
                                            className={styles.champion__icon__image}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/images/pets/nav-pet-2.png';
                                            }}
                                        />
                                        <img
                                            src="/images/frames/account-champion-frame.png"
                                            alt="Champion Frame"
                                            className={styles.champion__icon__frame}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>


                <div className={styles.lower_info__container}>
                    <img className={styles.flag__frame} src="/images/frames/flag-frame.png" alt="Flag Frame" />
                    {/* <img className={styles.info__divider} src="/images/frames/lower-title-frame.png" alt="Info Divider" /> */}

                    <div className={styles.info__description}>
                        <div className={styles.elo__container}>
                            <div className={styles.eloItem}>
                                <img src="/images/lol-elements/tier-gold.webp" alt="Solo Rank" />
                                <span>I</span>
                            </div>
                            <div className={styles.eloItem}>
                                <img src="/images/lol-elements/tier-platinum.webp" alt="Flex Rank" />
                                <span>III</span>
                            </div>
                        </div>



                        <div className={styles.essences__container}>
                            <div className={styles.essenceItem}>
                                <img src="/images/lol-elements/blue-essence.png" alt="Blue Essence" />
                                <span>{data.blueEssence.toLocaleString()}</span>
                            </div>
                            <div className={styles.essenceItem}>
                                <img src="/images/lol-elements/orange-essence.png" alt="Orange Essence" />
                                <span>{data.orangeEssence.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSummary; 