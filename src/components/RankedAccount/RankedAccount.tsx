import React, { useState, useEffect, useRef } from 'react';
import styles from './RankedAccount.module.scss';
import { type RankedData } from '../../services/apiRankedsService';
// Tier images are now served from public/images/
const tierDiamond = '/images/lol-elements/tier-diamond.webp';
const tierPlatinum = '/images/lol-elements/tier-platinum.webp';
const tierEmerald = '/images/lol-elements/tier-emerald.webp';
const tierGold = '/images/lol-elements/tier-gold.webp';
const tierSilver = '/images/lol-elements/tier-silver.webp';
const tierBronze = '/images/lol-elements/tier-bronze.webp';
const tierIron = '/images/lol-elements/tier-iron.webp';

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

    // States for rank selectors
    const [showSoloqSelector, setShowSoloqSelector] = useState(false);
    const [showFlexSelector, setShowFlexSelector] = useState(false);

    // States for essencer editing
    const [isEditingEssencer, setIsEditingEssencer] = useState(false);
    const [tempEssencerName, setTempEssencerName] = useState(rankedData.name);

    // Refs for rank containers
    const soloqRef = useRef<HTMLDivElement>(null);
    const flexRef = useRef<HTMLDivElement>(null);

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

        // Update essencer name
        setTempEssencerName(rankedData.name);
    }, [rankedData]);

    // Close rank selectors when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Check if click is outside both containers
            if (soloqRef.current && !soloqRef.current.contains(target)) {
                setShowSoloqSelector(false);
            }
            if (flexRef.current && !flexRef.current.contains(target)) {
                setShowFlexSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Mission numbers
    const missionNumbers = [2, 3, 6, 7, 8, 12, 14, 16, 17, 20, 22, 26, 27, 29, 31, 33, 36, 38, 42, 45, 48, 51, 52, 53, 54];

    // Hall mission numbers
    const hallMissionNumbers = [2, 4, 6, 7, 8, 12, 18, 20, 22, 23, 26, 28, 32, 36, 40, 41, 43, 47, 51, 52, 53, 56, 60, 61, 62, 63, 66, 67, 71, 73, 76, 77, 81, 83, 85, 86, 91, 98];

    const handleMissionClick = (index: number) => {
        setSelectedMissions(prev => {
            const newState = [...prev];

            // If clicking on a mission that's already selected, unselect it and all subsequent missions
            if (newState[index]) {
                for (let i = index; i < newState.length; i++) {
                    newState[i] = false;
                }
            }
            // If clicking on a mission that's not selected, select it and all previous missions
            else {
                // Select all missions from 0 to index (autocomplete previous levels)
                for (let i = 0; i <= index; i++) {
                    newState[i] = true;
                }
            }

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

            // If clicking on a hall mission that's already selected, unselect it and all subsequent missions
            if (newState[index]) {
                for (let i = index; i < newState.length; i++) {
                    newState[i] = false;
                }
            }
            // If clicking on a hall mission that's not selected, select it and all previous missions
            else {
                // Select all hall missions from 0 to index (autocomplete previous levels)
                for (let i = 0; i <= index; i++) {
                    newState[i] = true;
                }
            }

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

    const handleEssencerEdit = () => {
        setIsEditingEssencer(true);
    };

    const handleEssencerSave = () => {
        const updatedRankedData = {
            ...rankedData,
            name: tempEssencerName.trim()
        };
        onUpdateRankedData(updatedRankedData);
        setIsEditingEssencer(false);
    };

    const handleEssencerCancel = () => {
        setTempEssencerName(rankedData.name);
        setIsEditingEssencer(false);
    };

    const handleEssencerKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleEssencerSave();
        } else if (e.key === 'Escape') {
            handleEssencerCancel();
        }
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
                return 'url(/images/ranked-btn/porveldam.png)';
            case 'Spadelline':
                return 'url(/images/ranked-btn/spadelline.png)';
            case 'Zephiroth':
                return 'url(/images/ranked-btn/zephiroth.png)';
            case 'Gladasmy':
                return 'url(/images/ranked-btn/gladasmy.png)';
            case 'Primogenit':
                return 'url(/images/ranked-btn/primogenit.png)';
            default:
                return 'url(/images/ranked-btn/missing.png)';
        }
    };

    const convertToRomanNumeral = (num: number): string => {
        switch (num) {
            case 1:
                return 'I';
            case 2:
                return 'II';
            case 3:
                return 'III';
            case 4:
                return 'IV';
            default:
                return num.toString();
        }
    };

    const isAccountRanked = (): boolean => {
        const validTiers = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond'];
        const soloqRanked = validTiers.includes(rankedData.elo_soloq.tier.toLowerCase());
        const flexRanked = validTiers.includes(rankedData.elo_flex.tier.toLowerCase());
        return soloqRanked || flexRanked;
    };

    const isSoloqRanked = (): boolean => {
        const validTiers = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond'];
        return validTiers.includes(rankedData.elo_soloq.tier.toLowerCase());
    };

    const isFlexRanked = (): boolean => {
        const validTiers = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond'];
        return validTiers.includes(rankedData.elo_flex.tier.toLowerCase());
    };

    const availableTiers = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond'];
    const availableDivisions = [1, 2, 3, 4];

    const handleRankChange = (queueType: 'soloq' | 'flex', tier: string, division: number) => {
        console.log('Rank change:', queueType, tier, division); // Debug log

        const updatedData = {
            ...rankedData,
            ...(queueType === 'soloq' ? {
                elo_soloq: {
                    tier: tier,
                    division: division
                }
            } : {
                elo_flex: {
                    tier: tier,
                    division: division
                }
            })
        };

        console.log('Updated data:', updatedData); // Debug log
        console.log('Calling onUpdateRankedData with:', updatedData);
        onUpdateRankedData(updatedData);

        // Close the selector
        if (queueType === 'soloq') {
            setShowSoloqSelector(false);
        } else {
            setShowFlexSelector(false);
        }
    };

    return (
        <div className={styles.container}>

            <div className={styles.number__container}>
                <span>{rankedData.id}</span>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.portrait__container}>
                {isAccountRanked() && (
                    <img src={rankedData.icon} alt={rankedData.name} className={styles.portrait} />
                )}
            </div>

            <div className={styles.divider}></div>

            <div className={styles.name__container}>
                <span>{rankedData.username}</span>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.essencer__container}>
                {isEditingEssencer ? (
                    <input
                        type="text"
                        value={tempEssencerName}
                        onChange={(e) => setTempEssencerName(e.target.value)}
                        onBlur={handleEssencerSave}
                        onKeyDown={handleEssencerKeyPress}
                        className={styles.essencer__input}
                        autoFocus
                    />
                ) : (
                    <span onClick={handleEssencerEdit}>{rankedData.name}</span>
                )}
            </div>

            <div className={styles.divider}></div>

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

            <div className={styles.divider}></div>

            <div ref={soloqRef} className={styles.soloq__container} onClick={() => setShowSoloqSelector(!showSoloqSelector)}>
                {isSoloqRanked() && (
                    <>
                        <span>{convertToRomanNumeral(rankedData.elo_soloq.division)}</span>
                        <img src={getTierImage(rankedData.elo_soloq.tier)} alt={rankedData.elo_soloq.tier} />
                    </>
                )}
                {showSoloqSelector && (
                    <div className={styles.rank__selector}>
                        <div className={styles.divisions__row}>
                            {availableDivisions.map(division => (
                                <div
                                    key={division}
                                    className={`${styles.division__option} ${rankedData.elo_soloq.division === division ? styles.division__selected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Division clicked:', division);
                                        handleRankChange('soloq', rankedData.elo_soloq.tier, division);
                                    }}
                                >
                                    {convertToRomanNumeral(division)}
                                </div>
                            ))}
                        </div>
                        <div className={styles.tiers__row}>
                            {availableTiers.map(tier => (
                                <div
                                    key={tier}
                                    className={`${styles.tier__option} ${rankedData.elo_soloq.tier.toLowerCase() === tier ? styles.tier__selected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Tier clicked:', tier);
                                        handleRankChange('soloq', tier, rankedData.elo_soloq.division);
                                    }}
                                >
                                    <img src={getTierImage(tier)} alt={tier} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.divider}></div>

            <div ref={flexRef} className={styles.flex__container} onClick={() => setShowFlexSelector(!showFlexSelector)}>
                {isFlexRanked() && (
                    <>
                        <span>{convertToRomanNumeral(rankedData.elo_flex.division)}</span>
                        <img src={getTierImage(rankedData.elo_flex.tier)} alt={rankedData.elo_flex.tier} />
                    </>
                )}
                {showFlexSelector && (
                    <div className={styles.rank__selector}>
                        <div className={styles.divisions__row}>
                            {availableDivisions.map(division => (
                                <div
                                    key={division}
                                    className={`${styles.division__option} ${rankedData.elo_flex.division === division ? styles.division__selected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Flex division clicked:', division);
                                        handleRankChange('flex', rankedData.elo_flex.tier, division);
                                    }}
                                >
                                    {convertToRomanNumeral(division)}
                                </div>
                            ))}
                        </div>
                        <div className={styles.tiers__row}>
                            {availableTiers.map(tier => (
                                <div
                                    key={tier}
                                    className={`${styles.tier__option} ${rankedData.elo_flex.tier.toLowerCase() === tier ? styles.tier__selected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Flex tier clicked:', tier);
                                        handleRankChange('flex', tier, rankedData.elo_flex.division);
                                    }}
                                >
                                    <img src={getTierImage(tier)} alt={tier} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.divider}></div>

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
                                        <span className={styles.mission__number}>{missionNumbers[index]}</span>
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