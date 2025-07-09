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

    return (
        <div className={styles.achievement__popup}>
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