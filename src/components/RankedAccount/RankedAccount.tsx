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

export interface RankedAccountProps {
    rankedData: RankedData;
    onUpdateRankedData: (updatedData: RankedData) => void | Promise<void>;
    canEdit: boolean;
    canEditEssencer?: boolean; // Optional, defaults to canEdit if not provided
    activeWinsTab?: 'wins' | 'missions'; // Tab activo para alternar entre wins y missions
}

const RankedAccount: React.FC<RankedAccountProps> = ({ rankedData, onUpdateRankedData, canEdit, canEditEssencer, activeWinsTab = 'wins' }) => {
    // States for rank selectors
    const [showSoloqSelector, setShowSoloqSelector] = useState(false);
    const [showFlexSelector, setShowFlexSelector] = useState(false);
    const [showHonorSelector, setShowHonorSelector] = useState(false);

    // Use canEditEssencer if provided, otherwise fallback to canEdit
    const essencerEditable = canEditEssencer !== undefined ? canEditEssencer : canEdit;

    // States for essencer editing
    const [isEditingEssencer, setIsEditingEssencer] = useState(false);
    const [tempEssencerName, setTempEssencerName] = useState(rankedData.name);

    // States for level editing
    const [isEditingLevel, setIsEditingLevel] = useState(false);
    const [tempLevel, setTempLevel] = useState(rankedData.level.toString());

    // Refs for rank containers
    const soloqRef = useRef<HTMLDivElement>(null);
    const flexRef = useRef<HTMLDivElement>(null);
    const honorRef = useRef<HTMLDivElement>(null);

    const [selectedWins, setSelectedWins] = useState<boolean[]>(() => {
        const initialWins = Array(15).fill(false);
        // Set true for wins up to current value
        for (let i = 0; i < rankedData.wins.current && i < 15; i++) {
            initialWins[i] = true;
        }
        return initialWins;
    });

    const [selectedMissions, setSelectedMissions] = useState<boolean[]>(() => {
        const initialMissions = Array(22).fill(false);
        // Set true for missions up to current value (using current_act)
        for (let i = 0; i < rankedData.missions.current_act.current && i < 22; i++) {
            initialMissions[i] = true;
        }
        return initialMissions;
    });


    // Update states when rankedData changes
    useEffect(() => {
        // Update wins
        const newWins = Array(15).fill(false);
        for (let i = 0; i < rankedData.wins.current && i < 15; i++) {
            newWins[i] = true;
        }
        setSelectedWins(newWins);

        // Update missions
        const newMissions = Array(22).fill(false);
        for (let i = 0; i < rankedData.missions.current_act.current && i < 22; i++) {
            newMissions[i] = true;
        }
        setSelectedMissions(newMissions);


        // Update essencer name
        setTempEssencerName(rankedData.name);

        // Update level
        setTempLevel(rankedData.level.toString());
    }, [rankedData]);

    // Close rank selectors when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Check if click is outside all containers
            if (soloqRef.current && !soloqRef.current.contains(target)) {
                setShowSoloqSelector(false);
            }
            if (flexRef.current && !flexRef.current.contains(target)) {
                setShowFlexSelector(false);
            }
            if (honorRef.current && !honorRef.current.contains(target)) {
                setShowHonorSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleWinClick = (index: number) => {
        if (!canEdit) return; // Prevent editing if user doesn't have permission

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

    const handleMissionClick = (index: number) => {
        if (!canEdit) return; // Prevent editing if user doesn't have permission

        setSelectedMissions(prev => {
            const newState = [...prev];

            // If clicking on a mission that's already selected, unselect it and all subsequent missions
            if (newState[index]) {
                for (let i = index; i < newState.length; i++) {
                    newState[i] = false;
                }
            }
            // If clicking on a mission that's not selected, only allow if previous mission is selected
            else {
                // Allow selecting the first mission (index 0) or if the previous mission is selected
                if (index === 0 || newState[index - 1]) {
                    newState[index] = true;
                }
            }

            // Update rankedData with new missions count
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


    const handleEssencerEdit = () => {
        if (!essencerEditable) return; // Prevent editing if user doesn't have permission
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

    const handleLevelEdit = () => {
        if (!canEdit) return; // Prevent editing if user doesn't have permission
        setIsEditingLevel(true);
    };

    const handleLevelSave = () => {
        const levelValue = parseInt(tempLevel.trim());
        if (!isNaN(levelValue) && levelValue >= 1 && levelValue <= 999) {
            const updatedRankedData = {
                ...rankedData,
                level: levelValue
            };
            onUpdateRankedData(updatedRankedData);
        } else {
            // Reset to original value if invalid
            setTempLevel(rankedData.level.toString());
        }
        setIsEditingLevel(false);
    };

    const handleLevelCancel = () => {
        setTempLevel(rankedData.level.toString());
        setIsEditingLevel(false);
    };

    const handleLevelKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLevelSave();
        } else if (e.key === 'Escape') {
            handleLevelCancel();
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
            case 5:
                return 'V';
            default:
                return num.toString();
        }
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

    const getHonorImage = (honorLevel: number): string => {
        return `/images/honor/honor-${honorLevel}.png`;
    };

    const handleHonorChange = (honorLevel: number) => {
        console.log('Honor change:', honorLevel); // Debug log

        const updatedData = {
            ...rankedData,
            honor: honorLevel
        };

        console.log('Updated data:', updatedData); // Debug log
        console.log('Calling onUpdateRankedData with:', updatedData);
        onUpdateRankedData(updatedData);

        // Close the selector
        setShowHonorSelector(false);
    };

    return (
        <div className={styles.container}>

            <div className={styles.number__container}>
                <span>{rankedData.id}</span>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.portrait__container}>
                <img src={rankedData.icon} alt={rankedData.name} className={styles.portrait} />
            </div>

            <div className={styles.divider}></div>

            <div className={styles.name__container}>
                <span>{rankedData.username}</span>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.level__container}>
                {isEditingLevel ? (
                    <input
                        type="text"
                        value={tempLevel}
                        onChange={(e) => setTempLevel(e.target.value)}
                        onBlur={handleLevelSave}
                        onKeyDown={handleLevelKeyPress}
                        className={styles.level__input}
                        autoFocus
                    />
                ) : (
                    <span onClick={handleLevelEdit} style={{ cursor: canEdit ? 'pointer' : 'default' }}>{rankedData.level}</span>
                )}
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
                    <span onClick={handleEssencerEdit} style={{ cursor: essencerEditable ? 'pointer' : 'default' }}>{rankedData.name}</span>
                )}
            </div>

            <div className={styles.divider}></div>

            <div className={styles.wins__container}>
                <div className={styles.wins}>
                    {activeWinsTab === 'wins' ? (
                        // Show wins
                        selectedWins.map((isSelected, index) => {
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
                                    style={isSelected ? { backgroundImage: getBloodlineImage(), cursor: canEdit ? 'pointer' : 'default' } : { cursor: canEdit ? 'pointer' : 'default' }}
                                    onClick={() => handleWinClick(index)}
                                ></div>
                            );
                        })
                    ) : (
                        // Show missions - ensure we show all 22 slots
                        Array.from({ length: 22 }, (_, index) => {
                            const isSelected = index < selectedMissions.length ? selectedMissions[index] : false;

                            // Find the last selected mission index
                            const lastSelectedIndex = selectedMissions.lastIndexOf(true);

                            // Find the next available mission
                            const nextAvailableIndex = lastSelectedIndex === -1 ? 0 : lastSelectedIndex + 1;
                            const isNextAvailable = !isSelected && index === nextAvailableIndex;

                            return (
                                <div
                                    key={index}
                                    className={`${styles.mission} ${isSelected
                                        ? styles.mission__selected
                                        : isNextAvailable
                                            ? styles.mission__next
                                            : ''
                                        }`}
                                    style={isSelected ? { backgroundImage: 'url(/images/ranked-btn/fire.png)', cursor: canEdit ? 'pointer' : 'default' } : { cursor: canEdit ? 'pointer' : 'default' }}
                                    onClick={() => handleMissionClick(index)}
                                ></div>
                            );
                        })
                    )}
                </div>
                <div className={styles.wins__count}>
                    {activeWinsTab === 'wins'
                        ? `${rankedData.wins.current} / ${rankedData.wins.totals}`
                        : `${rankedData.missions.current_act.current} / 22`
                    }
                </div>
            </div>

            <div className={styles.divider}></div>

            <div ref={honorRef} className={styles.honor__container} onClick={() => canEdit && setShowHonorSelector(!showHonorSelector)} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                <span>{convertToRomanNumeral(rankedData.honor)}</span>
                <img src={getHonorImage(rankedData.honor)} alt={`Honor ${rankedData.honor}`} />
                {showHonorSelector && (
                    <div className={styles.honor__selector}>
                        <div className={styles.honor__options}>
                            {[1, 2, 3, 4, 5].map(honorLevel => (
                                <div
                                    key={honorLevel}
                                    className={`${styles.honor__option} ${rankedData.honor === honorLevel ? styles.honor__selected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleHonorChange(honorLevel);
                                    }}
                                >
                                    <img src={getHonorImage(honorLevel)} alt={`Honor ${honorLevel}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.divider}></div>

            <div ref={soloqRef} className={styles.soloq__container} onClick={() => canEdit && setShowSoloqSelector(!showSoloqSelector)} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
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

            <div ref={flexRef} className={styles.flex__container} onClick={() => canEdit && setShowFlexSelector(!showFlexSelector)} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
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
        </div>
    );
};

export default RankedAccount;