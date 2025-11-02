import React, { useState, useEffect, useRef } from 'react';
import styles from './AchievementPopup.module.scss';

interface AchievementPopupProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    badgeImage?: string;
    category?: string;
    elo?: string;
    progress?: number;
    total?: number;
    petType?: string | number; // Pet type (1-4)
    petStage?: number; // Pet stage (1-3), defaults to 1
    userName?: string; // User name for personalized messages
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({
    isOpen,
    onClose,
    title = "Achievement Unlocked!",
    description = "You have unlocked a new achievement!",
    badgeImage,
    category,
    elo,
    progress,
    total,
    petType = '1',
    petStage = 1,
    userName = 'beast'
}) => {
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [hearts, setHearts] = useState<Array<{ id: number; left: number; top: number; delay: number }>>([]);
    const heartIdRef = useRef(0);
    const messageIntervalRef = useRef<number | null>(null);
    const heartIntervalRef = useRef<number | null>(null);

    // Messages array - memoized to avoid dependency issues
    const messages = React.useMemo(() => [
        `I love you, ${userName}`,
        "Let's go, beast",
        "The GOAT",
        `Let's go, ${userName}`,
        "We are not noobs anymore"
    ], [userName]);

    // Get pet image path
    const getPetImage = (): string => {
        const petTypeStr = String(petType);
        const validTypes = ['1', '2', '3', '4'];
        const validType = validTypes.includes(petTypeStr) ? petTypeStr : '1';
        const validStage = (petStage >= 1 && petStage <= 3) ? petStage : 1;
        return `/images/pets/pet-${validType}-${validStage}.png`;
    };

    useEffect(() => {
        if (!isOpen) return;

        // Set initial message
        setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);

        // Change message every 3 seconds
        messageIntervalRef.current = window.setInterval(() => {
            setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 3000);

        // Generate hearts every 1.5 seconds
        heartIntervalRef.current = window.setInterval(() => {
            const newHeart = {
                id: heartIdRef.current++,
                left: 50 + (Math.random() - 0.5) * 15, // Random position around pet center
                top: 50 + (Math.random() - 0.5) * 15,
                delay: Math.random() * 0.3 // Small random delay for variety
            };
            setHearts(prev => [...prev, newHeart]);

            // Remove heart after animation (2s)
            setTimeout(() => {
                setHearts(prev => prev.filter(h => h.id !== newHeart.id));
            }, 2000);
        }, 1500);

        return () => {
            if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
            if (heartIntervalRef.current) clearInterval(heartIntervalRef.current);
            setHearts([]);
        };
    }, [isOpen, userName, messages]);

    if (!isOpen) return null;

    // Generate particles distributed around the popup in a more organized way
    const particleCount = 24;
    const particles = Array.from({ length: particleCount }, (_, i) => {
        // Distribute particles in a circular/radial pattern around center
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 30 + (i % 3) * 15; // Varying distances from center
        const centerX = 50; // Center of viewport
        const centerY = 50;

        // Add some randomness to make it more natural
        const randomOffsetX = (Math.random() - 0.5) * 10;
        const randomOffsetY = (Math.random() - 0.5) * 10;

        const left = centerX + (radius * Math.cos(angle)) + randomOffsetX;
        const top = centerY + (radius * Math.sin(angle)) + randomOffsetY;

        return {
            id: i,
            top: `${Math.max(5, Math.min(95, top))}%`,
            left: `${Math.max(5, Math.min(95, left))}%`,
            size: `${5 + Math.random() * 7}px`,
            delay: `${Math.random() * 2}s`,
            duration: `${12 + Math.random() * 8}s`
        };
    });

    // Get achievement description based on category
    const getAchievementDescription = (category: string, progress: number, total: number): string => {
        const categoryLower = category.toLowerCase();
        if (categoryLower === 'redeem') {
            return `redeeming ${progress}/${total} account${total > 1 ? 's' : ''}`;
        } else if (categoryLower === 'win' || categoryLower === 'wins') {
            return `winning ${progress}/${total} game${total > 1 ? 's' : ''}`;
        } else if (categoryLower === 'mastery') {
            return `reaching ${progress}/${total} mastery level${total > 1 ? 's' : ''}`;
        } else if (categoryLower === 'honor') {
            return `reaching honor level ${progress}/${total}`;
        } else if (categoryLower === 'level') {
            return `reaching level ${progress}/${total}`;
        } else if (categoryLower === 'elo') {
            return `gaining ${progress}/${total} division${total > 1 ? 's' : ''}`;
        } else if (categoryLower === 'member') {
            return `reaching level 30 ${progress}/${total} time${total > 1 ? 's' : ''}`;
        }
        return `reaching ${progress}/${total}`;
    };

    return (
        <div className={styles.achievement__popup}>
            {/* Particles */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className={styles.particle}
                    style={{
                        top: particle.top,
                        left: particle.left,
                        width: particle.size,
                        height: particle.size,
                        animationDelay: particle.delay,
                        animationDuration: particle.duration
                    }}
                />
            ))}

            <div className={styles.popup__wrapper}>
                <div className={styles.popup__content}>
                    <div className={styles.spinning__circle}></div>

                    {badgeImage && (
                        <div className={styles.badge__container}>
                            <img src={badgeImage} alt="Achievement Badge" className={styles.badge__image} />
                        </div>
                    )}

                    <div className={styles.popup__title__image}>
                        <img src="/images/ranking/vesuvianite/vesuvianite-mastery.png" alt={title || "Achievement"} />
                    </div>
                    <div className={styles.popup__text__container}>
                        {category && (
                            <h2 className={styles.popup__title}>
                                {category.toUpperCase()} ACHIEVEMENT
                            </h2>
                        )}
                        {elo && category && progress !== undefined && total !== undefined && (
                            <p className={styles.popup__description}>
                                Congratulations! You achieved {elo} by {getAchievementDescription(category, progress, total)}.
                            </p>
                        )}
                        {!elo && (
                            <p className={styles.popup__description}>{description}</p>
                        )}
                    </div>
                </div>

                <button className={styles.popup__confirm} onClick={onClose}>
                    Awesome!
                </button>
            </div>

            {/* Pet Section */}
            <div className={styles.pet__container}>
                {/* Hearts */}
                {hearts.map(heart => (
                    <div
                        key={heart.id}
                        className={styles.heart}
                        style={{
                            left: `${heart.left}%`,
                            top: `${heart.top}%`,
                            animationDelay: `${heart.delay}s`
                        }}
                    >
                        ❤️
                    </div>
                ))}

                {/* Pet Image */}
                <img
                    src={getPetImage()}
                    alt="Pet"
                    className={styles.pet__image}
                />

                {/* Message Bubble */}
                {currentMessage && (
                    <div className={styles.pet__message}>
                        {currentMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AchievementPopup; 