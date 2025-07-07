import React, { useState } from 'react';
import styles from './RankedAccount.module.scss';
import { type Portrait } from '../../services/portraitsService';
import tierDiamond from '../../assets/images/lol-elements/tier-diamond.webp';
import tierPlatinum from '../../assets/images/lol-elements/tier-platinum.webp';
import tierEmerald from '../../assets/images/lol-elements/tier-emerald.webp';
import tierGold from '../../assets/images/lol-elements/tier-gold.webp';
import tierSilver from '../../assets/images/lol-elements/tier-silver.webp';
import tierBronze from '../../assets/images/lol-elements/tier-bronze.webp';
import tierIron from '../../assets/images/lol-elements/tier-iron.webp';

interface RankedAccountProps {
    portrait: Portrait;
    selectedView: string;
}

const RankedAccount: React.FC<RankedAccountProps> = ({ portrait, selectedView }) => {
    const [selectedMissions, setSelectedMissions] = useState<boolean[]>(Array(23).fill(false));
    const [selectedHallMissions, setSelectedHallMissions] = useState<boolean[]>(Array(38).fill(false));
    const [selectedWins, setSelectedWins] = useState<boolean[]>(Array(15).fill(false));

    // Hall mission numbers
    const hallMissionNumbers = [2, 4, 6, 7, 8, 12, 18, 20, 22, 23, 26, 28, 32, 36, 40, 41, 43, 47, 51, 52, 53, 56, 60, 61, 62, 63, 66, 67, 71, 73, 76, 77, 81, 83, 85, 86, 91, 98];

    const handleMissionClick = (index: number) => {
        setSelectedMissions(prev => {
            const newState = [...prev];
            newState[index] = !newState[index];
            return newState;
        });
    };

    const handleHallMissionClick = (index: number) => {
        setSelectedHallMissions(prev => {
            const newState = [...prev];
            newState[index] = !newState[index];
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
        switch (portrait.bloodline) {
            case 'Porveldam':
                return 'url(/src/assets/images/ranked-btn/porveldam.png)';
            case 'Spadelline':
                return 'url(/src/assets/images/ranked-btn/spadelline.png)';
            case 'Zephiroth':
                return 'url(/src/assets/images/ranked-btn/zephiroth.png)';
            case 'Gladasmy':
                return 'url(/src/assets/images/ranked-btn/gladasmy.png)';
            default:
                return 'url(../../assets/images/ranked-btn/missing.png)';
        }
    };

    return (
        <div className={styles.container}>

            <div className={styles.number__container}>
                <span>{portrait.id}</span>
            </div>

            <div className={styles.portrait__container}>
                <img src={portrait.url} alt={portrait.name} className={styles.portrait} />
            </div>

            <div className={styles.name__container}>
                <span>{portrait.username}</span>
            </div>
            <div className={styles.essencer__container}>
                <span>Essencer_twitch_name</span>
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
                    {selectedWins.filter(win => win).length} / 15
                </div>
            </div>
            <div className={styles.soloq__container}>
                <span>{portrait["level-soloq"]}</span>
                <img src={getTierImage(portrait["elo-soloq"])} alt={portrait["elo-soloq"]} />
            </div>
            <div className={styles.flex__container}>
                <span>{portrait["level-flex"]}</span>
                <img src={getTierImage(portrait["elo-flex"])} alt={portrait["elo-flex"]} />
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

                            // Debug log for first few missions
                            if (index < 3) {
                                console.log(`Mission ${index}: isSelected=${isSelected}, isCurrentLevel=${isCurrentLevel}, isNextAvailable=${isNextAvailable}, lastSelectedIndex=${lastSelectedIndex}`);
                            }

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
                                        <span className={styles.mission__number}>{index + 1}</span>
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
                                        <span className={styles.hall__mission__number}>{hallMissionNumbers[index]}</span>
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