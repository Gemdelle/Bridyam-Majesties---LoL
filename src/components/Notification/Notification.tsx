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
                    <img src={imageUrl} alt={type} />
                </div>
            )}

            {/* Content */}
            <div className={styles.notification__content}>
                <div className={styles.notification__header}>
                    <h3 className={styles.notification__title}>{title}</h3>
                    <span className={styles.notification__timestamp}>
                        {formatTimestamp(timestamp)}
                    </span>
                </div>
                <p className={styles.notification__message}>{message}</p>
            </div>

            {/* Unread indicator */}
            {!isRead && (
                <div className={styles.notification__unread__indicator}></div>
            )}
        </div>
    );
};

export default Notification;

