import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Achievements/Achievements.module.scss';
import lbStyles from './Leaderboard.module.scss';
import PlayerAchievementRow from '../../components/PlayerAchievementRow';
import {
    fetchPlayerAchievementLeaderboard,
    type PlayerAchievementRow as RowData,
} from '../../services/playerAchievementsService';
import { assetUrl } from '../../utils/assetUrl';
import { playClickSound } from '../../utils/soundUtils';
import { trophyAsset } from '../../services/gardenService';

type BoardView = 'summary' | 'detail';

const navPetSrc = (petType: string | null): string => {
    const type = petType && ['1', '2', '3', '4'].includes(petType) ? petType : '1';
    return assetUrl(`images/pets/nav-pet-${type}.png`);
};

const PodiumCard: React.FC<{
    row: RowData;
    rankIndex: number;
    size: 'first' | 'second' | 'third';
}> = ({ row, rankIndex, size }) => {
    const sizeClass =
        size === 'first'
            ? lbStyles.podiumCardFirst
            : size === 'second'
              ? lbStyles.podiumCardSecond
              : lbStyles.podiumCardThird;

    return (
        <div className={`${lbStyles.podiumCard} ${sizeClass}`}>
            <img
                src={assetUrl('images/frames/default-majesty-portrait.png')}
                alt=""
                className={lbStyles.podiumCard__frame}
            />
            <img
                src={navPetSrc(row.petType)}
                alt=""
                className={lbStyles.podiumCard__pet}
            />
            <img
                src={trophyAsset(rankIndex)}
                alt={`#${rankIndex + 1}`}
                className={lbStyles.podiumCard__trophy}
            />
            <div className={lbStyles.podiumCard__meta}>
                <strong>{row.playerName}</strong>
                <span>{row.totalBadges} pts</span>
            </div>
        </div>
    );
};

const Leaderboard: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [boardView, setBoardView] = useState<BoardView>('summary');
    const [rows, setRows] = useState<RowData[]>([]);
    const [loading, setLoading] = useState(true);

    const detailPerPage = 6;
    const summaryListPerPage = 6;

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchPlayerAchievementLeaderboard('lol');
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
    }, []);

    const podium = useMemo(() => rows.slice(0, 3), [rows]);
    const listRows = useMemo(() => rows.slice(3), [rows]);

    const itemsPerPage = boardView === 'summary' ? summaryListPerPage : detailPerPage;
    const pageSource = boardView === 'summary' ? listRows : rows;
    const totalPages = Math.max(1, Math.ceil(pageSource.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRows = pageSource.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const handleViewChange = (view: BoardView) => {
        setBoardView(view);
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
                    className={`${styles.tabButton} ${boardView === 'summary' ? styles.active : ''}`}
                    onClick={() => handleViewChange('summary')}
                >
                    Summary
                </button>
                <button
                    type="button"
                    className={`${styles.tabButton} ${boardView === 'detail' ? styles.active : ''}`}
                    onClick={() => handleViewChange('detail')}
                >
                    Detail
                </button>
            </div>
            <div className={styles.achievements__container}>
                {boardView === 'detail' ? (
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
                ) : (
                    <div className={lbStyles.summaryPanel}>
                        {loading && <p className={lbStyles.summaryEmpty}>Loading leaderboard...</p>}
                        {!loading && rows.length === 0 && (
                            <p className={lbStyles.summaryEmpty}>No players with achievements yet.</p>
                        )}
                        {!loading && rows.length > 0 && (
                            <>
                                <div className={lbStyles.podium}>
                                    {podium[1] ? (
                                        <PodiumCard row={podium[1]} rankIndex={1} size="second" />
                                    ) : (
                                        <div className={lbStyles.podiumCardSpacer} />
                                    )}
                                    {podium[0] ? (
                                        <PodiumCard row={podium[0]} rankIndex={0} size="first" />
                                    ) : (
                                        <div className={lbStyles.podiumCardSpacer} />
                                    )}
                                    {podium[2] ? (
                                        <PodiumCard row={podium[2]} rankIndex={2} size="third" />
                                    ) : (
                                        <div className={lbStyles.podiumCardSpacer} />
                                    )}
                                </div>

                                <div className={lbStyles.summaryList}>
                                    {currentRows.map((row, i) => {
                                        const rankIndex = 3 + startIndex + i;
                                        const place = rankIndex + 1;
                                        return (
                                            <div key={row.playerName} className={lbStyles.summaryRow}>
                                                <div className={lbStyles.summaryRank}>
                                                    <img
                                                        src={trophyAsset(rankIndex)}
                                                        alt={`#${place}`}
                                                        className={lbStyles.summaryTrophy}
                                                    />
                                                    <span className={lbStyles.summaryPlace}>{place}</span>
                                                </div>
                                                <img
                                                    src={navPetSrc(row.petType)}
                                                    alt=""
                                                    className={lbStyles.summaryNavPet}
                                                />
                                                <div className={lbStyles.summaryMain}>
                                                    <span className={lbStyles.summaryName}>
                                                        {row.playerName}
                                                    </span>
                                                    <span className={lbStyles.summaryPts}>
                                                        {row.totalBadges} pts
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {currentRows.length === 0 && (
                                        <p className={lbStyles.summaryEmpty}>
                                            Only the top 3 for now.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
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
