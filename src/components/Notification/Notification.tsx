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
    bloodline?: string | number;
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
    bloodline,
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

    // Función para obtener imagen de mascota según bloodline
    const getPetImage = (bloodline: string | number | undefined): string => {
        if (!bloodline) return '/images/pets/pet-1-1.png';

        // Si es string, intentar convertir o mapear por nombre
        let bloodlineNum = 1;
        if (typeof bloodline === 'string') {
            const bloodlineLower = bloodline.toLowerCase();

            // Mapeo por nombre
            if (bloodlineLower.includes('porveldam')) bloodlineNum = 1;
            else if (bloodlineLower.includes('spadelline')) bloodlineNum = 2;
            else if (bloodlineLower.includes('zephir')) bloodlineNum = 3;
            else if (bloodlineLower.includes('gladasmy')) bloodlineNum = 4;
            else {
                // Intentar parsear como número
                const parsed = parseInt(bloodline);
                if (!isNaN(parsed)) bloodlineNum = parsed;
            }
        } else {
            bloodlineNum = bloodline;
        }

        // Retornar la imagen de pet correspondiente (usando variante 1)
        switch (bloodlineNum) {
            case 1: return '/images/pets/pet-1-1.png'; // Porveldam
            case 2: return '/images/pets/pet-2-1.png'; // Spadelline
            case 3: return '/images/pets/pet-3-1.png'; // Zephiroth
            case 4: return '/images/pets/pet-4-1.png'; // Gladasmy
            default: return '/images/pets/pet-1-1.png';
        }
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
            {/* Icon/Image */}
            {imageUrl && (
                <div className={`${styles.notification__icon} ${type === 'mission' ? styles['notification__icon--redeem'] : ''}`}>
                    <div className={styles.spinning__circle}></div>
                    {type === 'mission' ? (
                        <div className={styles.portrait__wrapper}>
                            <img src={imageUrl} alt={type} />
                        </div>
                    ) : (
                        <img src={imageUrl} alt={type} />
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
                <div className={styles.notification__reward}>
                </div>

            </div>
            <img src={getPetImage(bloodline)} alt="pet" className={styles.pet__image} />
            {/* Unread indicator */}
            {!isRead && (
                <div className={styles.notification__unread__indicator}></div>
            )}
        </div>
    );
};

export default Notification;

