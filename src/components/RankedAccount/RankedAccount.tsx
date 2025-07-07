import React, { useState, useEffect } from 'react';
import styles from './RankedAccount.module.scss';
import { type RankedData } from '../../services/apiRankedsService';
import tierDiamond from '../../assets/images/lol-elements/tier-diamond.webp';
import tierPlatinum from '../../assets/images/lol-elements/tier-platinum.webp';
import tierEmerald from '../../assets/images/lol-elements/tier-emerald.webp';
import tierGold from '../../assets/images/lol-elements/tier-gold.webp';
import tierSilver from '../../assets/images/lol-elements/tier-silver.webp';
import tierBronze from '../../assets/images/lol-elements/tier-bronze.webp';
import tierIron from '../../assets/images/lol-elements/tier-iron.webp';

interface RankedAccountProps {
    rankedData: RankedData;
    selectedView: string;
    onUpdateRankedData: (updatedData: RankedData) => void;
}

const RankedAccount: React.FC<RankedAccountProps> = ({ rankedData, selectedView, onUpdateRankedData }) => {
    // Initialize states based on current values from RankedData
    const [selectedMissions, setSelectedMissions] = useState<boolean[]>(() => {
        const initialMissions = Array(23).fill(false);
        // Set true for missions up to current value
        for (let i = 0; i < rankedData.missions.current_act.current && i < 23; i++) {
            initialMissions[i] = true;
        }
        return initialMissions;
    });
    
    const [selectedHallMissions, setSelectedHallMissions] = useState<boolean[]>(() => {
        const initialHallMissions = Array(38).fill(false);
        // Set true for hall missions up to current value
        for (let i = 0; i < rankedData.missions.current_hall_of_legends.current && i < 38; i++) {
            initialHallMissions[i] = true;
        }
        return initialHallMissions;
    });
    
    const [selectedWins, setSelectedWins] = useState<boolean[]>(() => {
        const initialWins = Array(15).fill(false);
        // Set true for wins up to current value
        for (let i = 0; i < rankedData.wins.current && i < 15; i++) {
            initialWins[i] = true;
        }
        return initialWins;
    });

    // Update states when rankedData changes
    useEffect(() => {
        // Update missions
        const newMissions = Array(23).fill(false);
        for (let i = 0; i < rankedData.missions.current_act.current && i < 23; i++) {
            newMissions[i] = true;
        }
        setSelectedMissions(newMissions);

        // Update hall missions
        const newHallMissions = Array(38).fill(false);
        for (let i = 0; i < rankedData.missions.current_hall_of_legends.current && i < 38; i++) {
            newHallMissions[i] = true;
        }
        setSelectedHallMissions(newHallMissions);

        // Update wins
        const newWins = Array(15).fill(false);
        for (let i = 0; i < rankedData.wins.current && i < 15; i++) {
            newWins[i] = true;
        }
        setSelectedWins(newWins);
    }, [rankedData]);

    // Hall mission numbers
    const hallMissionNumbers = [2, 4, 6, 7, 8, 12, 18, 20, 22, 23, 26, 28, 32, 36, 40, 41, 43, 47, 51, 52, 53, 56, 60, 61, 62, 63, 66, 67, 71, 73, 76, 77, 81, 83, 85, 86, 91, 98];

    const handleMissionClick = (index: number) => {
        setSelectedMissions(prev => {
            const newState = [...prev];
            newState[index] = !newState[index];
            
            // Update rankedData with new mission count
            const newCurrent = newState.filter(Boolean).length;
            const updatedRankedData = {
                ...rankedData,
                missions: {
                    ...rankedData.missions,
                    current_act: {
                        ...rankedData.missions.current_act,
                        current: newCurrent
                    }
                }
            };
            
            // Call callback to update data
            onUpdateRankedData(updatedRankedData);
            
            return newState;
        });
    };

    const handleHallMissionClick = (index: number) => {
        setSelectedHallMissions(prev => {
            const newState = [...prev];
            newState[index] = !newState[index];
            
            // Update rankedData with new hall mission count
            const newCurrent = newState.filter(Boolean).length;
            const updatedRankedData = {
                ...rankedData,
                missions: {
                    ...rankedData.missions,
                    current_hall_of_legends: {
                        ...rankedData.missions.current_hall_of_legends,
                        current: newCurrent
                    }
                }
            };
            
            // Call callback to update data
            onUpdateRankedData(updatedRankedData);
            
            return newState;
        });
    };

    const handleWinClick = (index: number) => {
        setSelectedWins(prev => {
            const newState = [...prev];

            // If clicking on a win that's already selected, unselect it and all subsequent wins
            if (newState[index]) {
                for (let i = index; i < newState.length; i++) {
                    newState[i] = false;
                }
            }
            // If clicking on a win that's not selected, only allow if previous win is selected
            else {
                // Allow selecting the first win (index 0) or if the previous win is selected
                if (index === 0 || newState[index - 1]) {
                    newState[index] = true;
                }
            }

            // Update rankedData with new wins count
            const newCurrent = newState.filter(Boolean).length;
            const updatedRankedData = {
                ...rankedData,
                wins: {
                    ...rankedData.wins,
                    current: newCurrent
                }
            };
            
            // Call callback to update data
            onUpdateRankedData(updatedRankedData);

            return newState;
        });
    };

    const getTierImage = (tier: string) => {
        switch (tier.toLowerCase()) {
            case 'diamond':
                return tierDiamond;
            case 'platinum':
                return tierPlatinum;
            case 'emerald':
                return tierEmerald;
            case 'gold':
                return tierGold;
            case 'silver':
                return tierSilver;
            case 'bronze':
                return tierBronze;
            case 'iron':
                return tierIron;
            default:
                return '';
        }
    };

    const getBloodlineImage = () => {
        switch (rankedData.bloodline) {
            case 'Porveldam':
                return 'url(/src/assets/images/ranked-btn/porveldam.png)';
            case 'Spadelline':
                return 'url(/src/assets/images/ranked-btn/spadelline.png)';
            case 'Zephiroth':
                return 'url(/src/assets/images/ranked-btn/zephiroth.png)';
            case 'Gladasmy':
                return 'url(/src/assets/images/ranked-btn/gladasmy.png)';
            case 'Primogenit':
                return 'url(/src/assets/images/ranked-btn/primogenit.png)';
            default:
                return 'url(../../assets/images/ranked-btn/missing.png)';
        }
    };

    return (
        <div className={styles.container}>

            <div className={styles.number__container}>
                <span>{rankedData.id}</span>
            </div>

            <div className={styles.portrait__container}>
                <img src={rankedData.icon} alt={rankedData.name} className={styles.portrait} />
            </div>

            <div className={styles.name__container}>
                <span>{rankedData.username}</span>
            </div>
            <div className={styles.essencer__container}>
                <span>{rankedData.name}</span>
            </div>

            <div className={styles.wins__container}>
                <div className={styles.wins}>
                    {selectedWins.map((isSelected, index) => {
                        // Find the last selected win index
                        const lastSelectedIndex = selectedWins.lastIndexOf(true);

                        // Find the next available win
                        const nextAvailableIndex = lastSelectedIndex === -1 ? 0 : lastSelectedIndex + 1;
                        const isNextAvailable = !isSelected && index === nextAvailableIndex;

                        return (
                            <div
                                key={index}
                                className={`${styles.win} ${isSelected
                                    ? styles.win__selected
                                    : isNextAvailable
                                        ? styles.win__next
                                        : ''
                                    }`}
                                style={isSelected ? { backgroundImage: getBloodlineImage() } : {}}
                                onClick={() => handleWinClick(index)}
                            ></div>
                        );
                    })}
                </div>
                <div className={styles.wins__count}>
                    {rankedData.wins.current} / {rankedData.wins.totals}
                </div>
            </div>
            <div className={styles.soloq__container}>
                <span>{rankedData.elo_soloq.division}</span>
                <img src={getTierImage(rankedData.elo_soloq.tier)} alt={rankedData.elo_soloq.tier} />
            </div>
            <div className={styles.flex__container}>
                <span>{rankedData.elo_flex.division}</span>
                <img src={getTierImage(rankedData.elo_flex.tier)} alt={rankedData.elo_flex.tier} />
            </div>

            <div className={styles.missions__container}>
                {selectedView === 'missions' && (
                    <div className={styles.missions__list}>
                        <div className={styles.mission__timeline}></div>
                        {selectedMissions.map((isSelected, index) => {
                            // Find the last selected mission index
                            const lastSelectedIndex = selectedMissions.lastIndexOf(true);
                            const showNumber = isSelected && index === lastSelectedIndex;
                            const isCurrentLevel = isSelected && index === lastSelectedIndex;

                            // Find the next available mission
                            const nextAvailableIndex = lastSelectedIndex === -1 ? 0 : lastSelectedIndex + 1;
                            const isNextAvailable = !isSelected && index === nextAvailableIndex;

                            return (
                                <div
                                    key={index}
                                    className={`${styles.mission} ${isCurrentLevel
                                        ? styles.mission__current
                                        : isSelected
                                            ? styles.mission__selected
                                            : isNextAvailable
                                                ? styles.mission__next
                                                : ''
                                        }`}
                                    onClick={() => handleMissionClick(index)}
                                >
                                    {showNumber && (
                                        <span className={styles.mission__number}>{rankedData.missions.current_act.current}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {selectedView === 'hall-missions' && (
                    <div className={styles.hall__list}>
                        <div className={styles.hall__mission__timeline}></div>
                        {selectedHallMissions.map((isSelected, index) => {
                            // Find the last selected hall mission index
                            const lastSelectedIndex = selectedHallMissions.lastIndexOf(true);
                            const showNumber = isSelected && index === lastSelectedIndex;
                            const isCurrentLevel = isSelected && index === lastSelectedIndex;

                            // Find the next available mission
                            const nextAvailableIndex = lastSelectedIndex === -1 ? 0 : lastSelectedIndex + 1;
                            const isNextAvailable = !isSelected && index === nextAvailableIndex;

                            return (
                                <div
                                    key={index}
                                    className={`${styles.hall__mission} ${isCurrentLevel
                                        ? styles.hall__mission__current
                                        : isSelected
                                            ? styles.hall__mission__selected
                                            : isNextAvailable
                                                ? styles.hall__mission__next
                                                : ''
                                        }`}
                                    onClick={() => handleHallMissionClick(index)}
                                >
                                    {showNumber && (
                                        <span className={styles.hall__mission__number}>{rankedData.missions.current_hall_of_legends.current}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RankedAccount;