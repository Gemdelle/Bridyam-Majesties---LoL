import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Achievements/Achievements.module.scss';
import lbStyles from './Leaderboard.module.scss';
import PlayerAchievementRow from '../../components/PlayerAchievementRow';
import {
    fetchPlayerAchievementLeaderboard,
    type AchievementKind,
    type PlayerAchievementRow as RowData,
} from '../../services/playerAchievementsService';
import { assetUrl } from '../../utils/assetUrl';
import { playClickSound } from '../../utils/soundUtils';

const Leaderboard: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<AchievementKind>('lol');
    const [rows, setRows] = useState<RowData[]>([]);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 6;

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchPlayerAchievementLeaderboard(activeTab);
                if (!cancelled) setRows(data);
            } catch (err) {
                console.error('Leaderboard load failed:', err);
                if (!cancelled) setRows([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [activeTab]);

    const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRows = rows.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const handleTabChange = (tab: AchievementKind) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    return (
        <div className={styles.achievements}>
            <Link
                to="/achievements"
                className={lbStyles.seeListBtn}
                onClick={playClickSound}
            >
                <img
                    src={assetUrl('images/ranked-btn/mission.png')}
                    alt=""
                    className={lbStyles.seeListBtn__icon}
                />
                <span>See achievement list</span>
            </Link>
            <div className={styles.tabContainer}>
                <button
                    type="button"
                    className={`${styles.tabButton} ${activeTab === 'pet' ? styles.active : ''}`}
                    onClick={() => handleTabChange('pet')}
                >
                    Pet
                </button>
                <button
                    type="button"
                    className={`${styles.tabButton} ${activeTab === 'lol' ? styles.active : ''}`}
                    onClick={() => handleTabChange('lol')}
                >
                    LoL
                </button>
            </div>
            <div className={styles.achievements__container}>
                <div className={`${styles.achievements__content} ${lbStyles.denseContent}`}>
                    {loading && <p style={{ color: '#cdbe91' }}>Loading leaderboard...</p>}
                    {!loading && currentRows.length === 0 && (
                        <p style={{ color: '#cdbe91' }}>No players with achievements yet.</p>
                    )}
                    {!loading &&
                        currentRows.map((row, i) => (
                            <PlayerAchievementRow
                                key={row.playerName}
                                row={row}
                                rankIndex={startIndex + i}
                            />
                        ))}
                </div>
                <div className={styles.pagination}>
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        &lt; Previous
                    </button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next &gt;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
