import React from 'react';
import styles from './AccountSummary.module.scss';

// Define todos los datos numéricos que el componente necesita
export interface AccountSummaryData {
    url: string;
    majestyId: number;
    name: string;
    champions: number;
    skins: number;
    masteries: number;
    elo: number;
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

const AccountSummary: React.FC<AccountSummaryProps> = ({ data }) => {
    return (
        <div className={styles.card}>
            <div className={styles.profileIcon}>

                <img
                    key={data.majestyId}
                    src={data.url}
                    alt={`${data.name} portrait`}
                />

            </div>
            <div className={styles.info}>
                <h2 className={styles.name}>{data.name}</h2>
                <ul className={styles.stats}>
                    <li><span>champions</span> <span>{data.champions}</span></li>
                    <li><span>skins</span> <span>{data.skins}</span></li>
                    <li><span>masteries</span> <span>{data.masteries}</span></li>
                    <li><span>elo</span> <span>{data.elo}</span></li>
                </ul>
                <div className={styles.roles}>
                    <ul>
                        <li><span>top</span> <span>{data.roles.top}</span></li>
                        <li><span>jungle</span> <span>{data.roles.jungle}</span></li>
                        <li><span>mid</span> <span>{data.roles.mid}</span></li>
                        <li><span>adc</span> <span>{data.roles.adc}</span></li>
                        <li><span>support</span> <span>{data.roles.support}</span></li>
                    </ul>
                </div>
                <div className={styles.essences}>
                    <div className={styles.essenceItem}>
                        <img src="/src/assets/images/lol-elements/blue-essence.webp" alt="Blue Essence" />
                        <span>{data.blueEssence.toLocaleString()}</span>
                    </div>
                    <div className={styles.essenceItem}>
                        <img src="/src/assets/images/lol-elements/orange-essence.webp" alt="Orange Essence" />
                        <span>{data.orangeEssence.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSummary; 