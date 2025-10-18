import React from 'react';
import styles from './Notification.module.scss';

export interface NotificationProps {
    id: number;
    type: 'achievement' | 'level' | 'ranked' | 'mission' | 'general';
    title: string;
    message: string;
    timestamp: Date;
    isRead?: boolean;
    imageUrl?: string;
    petType?: string | null;
    petStage?: number | null;
    score?: number;
    isNew?: boolean;
    masteryLevel?: string | null;
    onRead?: (id: number) => void;
    onClick?: (id: number) => void;
}

const Notification: React.FC<NotificationProps> = ({
    id,
    type,
    title,
    message,
    timestamp,
    isRead = false,
    imageUrl,
    petType,
    petStage,
    score,
    isNew = false,
    masteryLevel,
    onRead,
    onClick
}) => {
    const handleClick = () => {
        if (!isRead && onRead) {
            onRead(id);
        }
        if (onClick) {
            onClick(id);
        }
    };

    // Helper function to render score as images
    const renderScoreAsImages = (score: number) => {
        const scoreString = score.toString();
        return scoreString.split('').map((digit, index) => (
            <img
                key={index}
                src={`/images/numbers/${digit}.png`}
                alt={digit}
                className={styles.score__digit}
            />
        ));
    };

    // Función para obtener imagen de pet
    const getPetImage = (petType: string | null | undefined, petStage: number | null | undefined): string | null => {
        console.log('getPetImage called with:', { petType, petStage });

        // Validar petType (debe ser "1", "2", "3", "4", no "0")
        if (!petType || petType === '0' || !['1', '2', '3', '4'].includes(petType)) {
            console.log('Invalid petType, returning null');
            return null; // No mostrar pet si no es válido
        }

        // Validar petStage (debe ser 1, 2, o 3)
        if (!petStage || petStage < 1 || petStage > 3) {
            console.log('Invalid petStage, returning null');
            return null; // No mostrar pet si la etapa no es válida
        }

        const imagePath = `/images/pets/pet-${petType}-${petStage}.png`;
        console.log('Using pet image:', imagePath);
        return imagePath;
    };

    const getTypeColor = () => {
        switch (type) {
            case 'achievement':
                return styles.notification__achievement;
            case 'level':
                return styles.notification__level;
            case 'ranked':
                return styles.notification__ranked;
            case 'mission':
                return styles.notification__mission;
            default:
                return styles.notification__general;
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div
            className={`${styles.notification} ${getTypeColor()} ${isRead ? styles.notification__read : ''}`}
            onClick={handleClick}
        >
            <img
                src={'/images/frames/achievement-bg-frame.png'}
                alt="background"
                className={`${styles.notificacion__background} ${isNew ? styles.notificacion__background__glow : ''}`}
            />
            {/* Icon/Image */}
            {imageUrl && (
                <div className={`${styles.notification__icon} ${type === 'mission' ? styles['notification__icon--redeem'] : ''} ${type === 'achievement' && masteryLevel ? styles[`notification__icon--mastery-${masteryLevel}`] : ''}`}>
                    <div className={styles.spinning__circle}></div>
                    {type === 'mission' ? (
                        <div className={styles.portrait__wrapper}>
                            <img src={imageUrl} alt={type} className={styles.icon__img} />
                        </div>
                    ) : (
                        <img src={imageUrl} alt={type} className={styles.icon__img} />
                    )}
                </div>
            )}

            {/* Content */}
            <div className={styles.notification__content}>
                <div className={styles.notification__info}>
                    <div className={styles.notification__header}>
                        <h3 className={styles.notification__title}>{title}</h3>
                        <span className={styles.notification__timestamp}>
                            {formatTimestamp(timestamp)}
                        </span>
                    </div>
                    <p className={styles.notification__message}>{message}</p>
                </div>
                {/* Solo mostrar recompensa si hay puntos (score > 0) */}
                {score !== undefined && score !== null && score > 0 && (
                    <div className={styles.notification__reward}>
                        {/* Derlets flotantes */}
                        <img
                            src="/images/derlet/derlet-side.png"
                            alt="derlet"
                            className={`${styles.derlet} ${styles.derlet__right__top}`}
                        />
                        <img
                            src="/images/derlet/derlet-side-2.png"
                            alt="derlet"
                            className={`${styles.derlet} ${styles.derlet__left__bottom}`}
                        />

                        {/* Partículas flotantes */}
                        <div className={styles.score__particles__container}>
                            {Array.from({ length: 12 }, (_, i) => (
                                <div key={i} className={`${styles.score__particle} ${styles[`score__particle__${i + 1}`]}`}></div>
                            ))}
                        </div>

                        {/* Números del score */}
                        <div className={styles.score__numbers}>
                            {renderScoreAsImages(score)}
                        </div>
                    </div>
                )}

            </div>
            {getPetImage(petType, petStage) && (
                <img src={getPetImage(petType, petStage)!} alt="pet" className={styles.pet__image} />
            )}
            {/* Unread indicator */}
            {!isRead && (
                <div className={styles.notification__unread__indicator}></div>
            )}
        </div>
    );
};

export default Notification;

