import React from 'react';
import styles from './AchievementPopup.module.scss';

interface AchievementPopupProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    badgeImage?: string;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({
    isOpen,
    onClose,
    title = "Achievement Unlocked!",
    description = "You have unlocked a new achievement!",
    badgeImage
}) => {
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
            
            <div className={styles.popup__content}>
                <div className={styles.spinning__circle}></div>

                {badgeImage && (
                    <div className={styles.badge__container}>
                        <img src={badgeImage} alt="Achievement Badge" className={styles.badge__image} />
                    </div>
                )}

                <h2 className={styles.popup__title}>{title}</h2>
                <p className={styles.popup__description}>{description}</p>

                <button className={styles.popup__confirm} onClick={onClose}>
                    Awesome!
                </button>
            </div>
        </div>
    );
};

export default AchievementPopup; 