import React, { useState, useEffect } from 'react';
import styles from './Feed.module.scss';
import Notification, { type NotificationProps } from '../../components/Notification/Notification';
import { fetchAllNotifications, NotificationAction } from '../../services/feedNotificationService';
import type { FeedNotification } from '../../services/feedNotificationService';

const Feed: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFeed, setShowFeed] = useState(false);
    const [notifications, setNotifications] = useState<NotificationProps[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Función para mapear FeedNotification a NotificationProps
    const mapFeedNotificationToProps = (feedNotif: FeedNotification): NotificationProps => {
        // Mapear el tipo de acción a tipo de notificación
        let notifType: NotificationProps['type'] = 'general';
        let imageUrl = '';

        switch (feedNotif.action) {
            case NotificationAction.LEVEL_UP:
                notifType = 'level';
                imageUrl = '/images/icons/level-icon.png';
                break;
            case NotificationAction.HONOR_UP:
                notifType = 'achievement';
                imageUrl = '/images/achievement/achievement-1.png';
                break;
            case NotificationAction.WIN:
                notifType = 'achievement';
                imageUrl = '/images/achievement/achievement-1.png';
                break;
            case NotificationAction.RANK_UP:
                notifType = 'ranked';
                imageUrl = '/images/ranked-btn/fire.png';
                break;
            case NotificationAction.MASTERY_LEVEL_UP:
                notifType = 'achievement';
                imageUrl = '/images/achievement/achievement-1.png';
                break;
            case NotificationAction.LEVEL_30_ACHIEVED:
                notifType = 'achievement';
                imageUrl = '/images/achievement/achievement-1.png';
                break;
            case NotificationAction.ELO_DIVISION_UP:
                notifType = 'ranked';
                imageUrl = '/images/ranked-btn/fire.png';
                break;
            case NotificationAction.MEMBER:
                notifType = 'mission';
                imageUrl = '/images/achievement/achievement-1.png';
                break;
            default:
                notifType = 'general';
        }

        return {
            id: feedNotif.id,
            type: notifType,
            title: feedNotif.title,
            message: feedNotif.description,
            timestamp: new Date(feedNotif.createdAt),
            isRead: false,
            imageUrl: imageUrl
        };
    };

    // Cargar notificaciones del endpoint
    const loadNotifications = async () => {
        try {
            setError(null);
            const feedNotifications = await fetchAllNotifications(100);
            const mappedNotifications = feedNotifications.map(mapFeedNotificationToProps);
            setNotifications(mappedNotifications);
            setLoading(false);
        } catch (err) {
            console.error('Error loading notifications:', err);
            setError('No se pudieron cargar las notificaciones');
            setNotifications([]);
            setLoading(false);
        }
    };

    // Cargar notificaciones al montar y establecer auto-refresh
    useEffect(() => {
        loadNotifications();

        // Auto-refresh cada 30 segundos
        const interval = setInterval(() => {
            loadNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleNotificationRead = (id: number) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === id ? { ...notif, isRead: true } : notif
            )
        );
    };

    const handleNotificationClick = (id: number) => {
        console.log('Notification clicked:', id);
    };

    // Filtrar notificaciones por término de búsqueda
    const filteredNotifications = notifications.filter(notif => 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <p>Loading feed...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <p style={{ color: '#e74c3c' }}>{error}</p>
                        <button onClick={loadNotifications} style={{ marginTop: '1rem' }}>
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {!showFeed ? (
                // Empty screen with button
                <div className={styles.empty__container}>
                    {/* Search Bar */}
                    <div className={styles.content__top}>
                        <div className={styles.search__container}>
                            <input
                                type="text"
                                placeholder="Search feed..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.search__input}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className={styles.search__clear}
                                    type="button"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button
                            className={styles.show__feed__button}
                            onClick={() => setShowFeed(true)}
                        >
                            Show Feed
                        </button>
                    </div>

                    {/* Main empty content */}
                    <div className={styles.content}>
                        <div className={styles.empty__message}>
                            <h2>Your feed is empty</h2>
                            <p>Click "Show Feed" to start viewing content</p>
                        </div>
                    </div>
                </div>
            ) : (
                // Feed content view
                <div className={styles.container}>
                    {/* Search Bar */}
                    <div className={styles.content__top}>
                        <div className={styles.search__container}>
                            <input
                                type="text"
                                placeholder="Search feed..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.search__input}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className={styles.search__clear}
                                    type="button"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button
                            className={styles.hide__feed__button}
                            onClick={() => setShowFeed(false)}
                        >
                            Hide Feed
                        </button>
                    </div>

                    {/* Feed content */}
                    <div className={styles.content}>
                        <div className={styles.feed__items}>
                            {filteredNotifications.length > 0 ? (
                                filteredNotifications.map(notification => (
                                    <Notification
                                        key={notification.id}
                                        {...notification}
                                        onRead={handleNotificationRead}
                                        onClick={handleNotificationClick}
                                    />
                                ))
                            ) : searchTerm ? (
                                <p className={styles.no__notifications}>No se encontraron notificaciones que coincidan con "{searchTerm}"</p>
                            ) : (
                                <p className={styles.no__notifications}>No hay notificaciones aún</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feed;

