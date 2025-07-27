import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NameYourPet.module.scss';
import petLore from '../../data/petLore.json';

interface NameYourPetProps {
    selectedEgg: {
        id: string;
        name: string;
        description: string;
        imageSrc: string;
        rarity: string;
    };
    onPetNamed: (petName: string) => void;
    eggIndex: number;
}

interface Heart {
    id: number;
    x: number;
    y: number;
    type: number;
}

const NameYourPet: React.FC<NameYourPetProps> = ({ selectedEgg, onPetNamed, eggIndex }) => {
    const [petName, setPetName] = useState('');
    const [clickCount, setClickCount] = useState(0);
    const [showPetFadeIn, setShowPetFadeIn] = useState(false);
    const [hearts, setHearts] = useState<Heart[]>([]);
    const [heartId, setHeartId] = useState(0);
    const [isPetting, setIsPetting] = useState(false);
    const [hoveredAbility, setHoveredAbility] = useState<number | null>(null);
    const navigate = useNavigate();

    // Get the current pet's lore
    const currentPetLore = petLore.pets[eggIndex];

    const playRandomSound = () => {
        const soundNumber = Math.floor(Math.random() * 3) + 1;
        const audio = new Audio(`/sounds/egg-crack-${soundNumber}.mp3`);
        audio.play().catch(error => console.log('Audio play failed:', error));
    };

    const playPetSound = () => {
        const audio = new Audio(`/sounds/pet-${eggIndex + 1}-stage-1.mp3`);
        audio.play().catch(error => console.log('Pet sound play failed:', error));
    };

    const spawnHeart = (event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();

        // Pet-specific heart positioning variables
        const petHeartPositions = {
            0: { x: rect.width * 2.5, y: -30 }, // Flarnit (pet-1)
            1: { x: rect.width * 1.9, y: -30 }, // Petlewyn (pet-2)
            2: { x: rect.width * 2.5, y: -30 }, // Peewee (pet-3)
            3: { x: rect.width * 2, y: -30 }  // Vindeloon (pet-4)
        };

        const position = petHeartPositions[eggIndex as keyof typeof petHeartPositions];
        const x = position.x;
        const y = position.y;
        const heartType = Math.floor(Math.random() * 3) + 1;

        console.log('Spawning heart type:', heartType); // Debug log

        const newHeart: Heart = {
            id: heartId,
            x: x,
            y: y,
            type: heartType
        };

        setHearts(prev => [...prev, newHeart]);
        setHeartId(prev => prev + 1);

        // Remove heart after animation completes
        setTimeout(() => {
            setHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
        }, 2000);
    };

    const handlePetClick = (event: React.MouseEvent) => {
        playPetSound();

        // Only spawn heart if pet is fully hatched (not during hatching process)
        if (clickCount >= 4) {
            spawnHeart(event);
        }

        // Trigger petting animation
        setIsPetting(true);
        setTimeout(() => {
            setIsPetting(false);
        }, 600); // Match the animation duration
    };

    const handleContinueClick = () => {
        if (petName.trim().length > 3) {
            onPetNamed(petName.trim());
            navigate('/');
        }
    };

    const handleEggTap = () => {
        if (clickCount < 4) {
            // Only play sound if it's not the 4th click
            if (clickCount < 3) {
                playRandomSound();
            }
            const newClickCount = clickCount + 1;
            setClickCount(newClickCount);
            console.log('Click count:', newClickCount);

            if (newClickCount === 4) {
                console.log('4th click detected! Starting hatching process...');
                // The animation will handle the fade out automatically

                // After 4 seconds (when hatching animation ends), start pet fade in
                setTimeout(() => {
                    console.log('Starting pet fade in!');
                    setShowPetFadeIn(true);
                }, 4000);
            }
        }
    };

    return (
        <div
            className={styles.nameYourPet}
            style={{
                backgroundImage: `url('/images/bg/name-your-pet-${eggIndex + 1}.png')`
            }}
        >
            <div className={styles.nameYourPet__container}>
                <header className={styles.nameYourPet__header}>
                    <h1 className={styles.nameYourPet__title}>NAME YOUR PET</h1>
                    <p className={styles.nameYourPet__subtitle}>
                        {clickCount < 4 ? "Make it original!" : `¡WOW, you hatched a ${selectedEgg.name}!`}
                    </p>
                </header>

                <div className={styles.nameYourPet__content}>
                    <div className={styles.egg__display}>
                        <div className={styles.spinning__circle}></div>
                        <div
                            className={styles.egg__badge}
                            onClick={handleEggTap}
                            style={{
                                transform: `scale(${0.7 + (Math.min(clickCount, 3) * 0.1)})`
                            }}
                        >
                            {/* Pet image that appears under the egg from 3rd click */}
                            {clickCount >= 3 && (
                                <div
                                    className={`${styles.pet__underneath} ${showPetFadeIn ? styles.fadeIn : ''} ${isPetting ? styles.petting : ''}`}
                                    onLoad={() => console.log('Pet div rendered, showPetFadeIn:', showPetFadeIn)}
                                >
                                    <img
                                        src={`/images/pets/pet-${eggIndex + 1}-1.png`}
                                        alt={`${selectedEgg.name} pet`}
                                        onClick={handlePetClick}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </div>
                            )}
                            <div
                                className={`${styles.egg__inner} ${clickCount === 4 ? styles.hatching : ''}`}
                            >
                                <img
                                    src={selectedEgg.imageSrc}
                                    alt={selectedEgg.name}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lore display - only show when pet is hatched */}
                    {clickCount >= 4 && currentPetLore && (
                        <div className={styles.lore__container}>
                            <div
                                className={styles.lore__frame}
                                style={{
                                    backgroundImage: `url('/images/frames/lore-frame-pet-${eggIndex + 1}.png')`
                                }}
                            >
                                <div className={styles.lore__content}>
                                    <h3 className={styles.lore__title}>{currentPetLore.name}</h3>
                                    <p className={styles.lore__text}>{currentPetLore.lore}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Abilities Panel - only show when pet is hatched */}
                    {clickCount >= 4 && currentPetLore && (
                        <div className={styles.abilities__container}>

                            <div className={styles.panel__header}><h3 className={styles.panel__title}>Abilities</h3>
                                <p className={styles.panel__subtitle}>
                                    {hoveredAbility !== null
                                        ? currentPetLore.abilities[hoveredAbility].description
                                        : "Hover through abilities to learn more about them"
                                    }
                                </p></div>

                            <div className={styles.abilities__grid}>
                                {currentPetLore.abilities?.map((ability, index) => (
                                    <div
                                        key={ability.name}
                                        className={`${styles.ability__item} ${hoveredAbility !== null && hoveredAbility !== index ? styles.dimmed : ''}`}
                                        onMouseEnter={() => setHoveredAbility(index)}
                                        onMouseLeave={() => setHoveredAbility(null)}
                                    >
                                        <div className={styles.ability__icon}>
                                            <img
                                                src={`/images/abilities/pet-${eggIndex + 1}-ability-${index + 1}.png`}
                                                alt={ability.name}
                                            />
                                        </div>
                                        <span className={styles.ability__name}>{ability.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats Panel - only show when pet is hatched */}
                    {clickCount >= 4 && currentPetLore && (
                        <div className={styles.stats__container}>
                            <h3 className={styles.stats__title}>Stats</h3>
                            <div className={styles.stats__list}>
                                <div className={styles.stat__row}>
                                    <div className={styles.stat__timeline}></div>
                                    <span className={styles.stat__name}>Instinct</span>
                                    <div className={styles.stat__bars}>
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <img
                                                key={level}
                                                src="/images/stats/stat-instinct.png"
                                                alt="instinct stat"
                                                className={`${styles.stat__icon} ${level <= (currentPetLore.stats?.instinct || 0) ? styles.active : styles.inactive}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.stat__row}>
                                    <div className={styles.stat__timeline}></div>
                                    <span className={styles.stat__name}>Force</span>
                                    <div className={styles.stat__bars}>
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <img
                                                key={level}
                                                src="/images/stats/stat-force.png"
                                                alt="force stat"
                                                className={`${styles.stat__icon} ${level <= (currentPetLore.stats?.force || 0) ? styles.active : styles.inactive}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.stat__row}>
                                    <div className={styles.stat__timeline}></div>
                                    <span className={styles.stat__name}>Pressure</span>
                                    <div className={styles.stat__bars}>
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <img
                                                key={level}
                                                src="/images/stats/stat-pressure.png"
                                                alt="pressure stat"
                                                className={`${styles.stat__icon} ${level <= (currentPetLore.stats?.pressure || 0) ? styles.active : styles.inactive}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.stat__row}>
                                    <div className={styles.stat__timeline}></div>
                                    <span className={styles.stat__name}>Cleverness</span>
                                    <div className={styles.stat__bars}>
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <img
                                                key={level}
                                                src="/images/stats/stat-cleverness.png"
                                                alt="cleverness stat"
                                                className={`${styles.stat__icon} ${level <= (currentPetLore.stats?.cleverness || 0) ? styles.active : styles.inactive}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Render hearts */}
                    {hearts.map(heart => (
                        <div
                            key={heart.id}
                            className={styles.heart}
                            style={{
                                left: heart.x,
                                top: heart.y,
                            }}
                        >
                            <img
                                src={`/images/icons/love-icon-${heart.type}.png`}
                                alt="heart"
                            />
                        </div>
                    ))}

                    <div className={`${styles.instruction__text} ${clickCount >= 4 ? styles.fadeOut : ''}`}>
                        Tap the egg to hatch it
                    </div>

                    {clickCount >= 4 && (
                        <div className={styles.nameInput__container}>
                            <input
                                type="text"
                                className={styles.pet__name__input}
                                placeholder="Name me..."
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && petName.trim().length > 3) {
                                        handleContinueClick();
                                    }
                                }}
                                maxLength={20}
                            />
                            {petName.trim().length > 3 && (
                                <button
                                    className={styles.continue__button}
                                    onClick={handleContinueClick}
                                    title="Continue"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NameYourPet; 