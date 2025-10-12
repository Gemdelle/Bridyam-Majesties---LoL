import React, { useState, useEffect, useCallback } from 'react';
import styles from './Feed.module.scss';
import Notification, { type NotificationProps } from '../../components/Notification/Notification';
import { fetchAllNotifications, NotificationAction } from '../../services/feedNotificationService';
import type { FeedNotification } from '../../services/feedNotificationService';

// Tipo de filtro para las notificaciones
type NotificationFilterType = 'all' | 'level' | 'ranked' | 'elo' | 'member' | 'essencer' | 'redeem' | 'honor' | 'mastery' | 'ranking';

/**
 * Filtros de notificaciones:
 * - all: Todas las notificaciones
 * - level: Cuando sube de nivel (LEVEL_UP)
 * - ranked: Cuando gana una ranked (WIN)
 * - mastery: Cuando gana una maestría (MASTERY_LEVEL_UP)
 * - elo: Cuando sube de liga/división (RANK_UP, ELO_DIVISION_UP)
 * - member: Cuando un usuario llega a level 30 habiendo canjeado cuenta de level 10 o menor (LEVEL_30_ACHIEVED)
 * - redeem: Cuando canjean una cuenta (MEMBER)
 * - essencer: Cuando un usuario se REGISTRA en la página (pendiente implementación backend)
 * - honor: Cuando sube de honor (HONOR_UP)
 * - ranking: Cuando alguien sube de posición en el ranking (bronze, silver, diamond, tourmaline) en cualquier categoría (pendiente implementación backend)
 */

// Tipo extendido para las notificaciones con filtro
type ExtendedNotification = NotificationProps & { filterType: NotificationFilterType; action: NotificationAction };

const Feed: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<NotificationFilterType>('all');
    const [viewedNotifications, setViewedNotifications] = useState<Set<number>>(new Set());

    // Función para mapear FeedNotification a NotificationProps con filterType
    const mapFeedNotificationToProps = (feedNotif: FeedNotification): NotificationProps & { filterType: NotificationFilterType; action: NotificationAction } => {
        // Mapear el tipo de acción a tipo de notificación
        let notifType: NotificationProps['type'] = 'general';
        let imageUrl = '';
        let notifFilterType: NotificationFilterType = 'all';

        switch (feedNotif.action) {
            case NotificationAction.LEVEL_UP:
                notifType = 'level';
                imageUrl = '/images/icons/level-icon.png';
                notifFilterType = 'level';
                break;
            case NotificationAction.HONOR_UP:
                notifType = 'achievement';
                imageUrl = '/images/achievement/achievement-1.png';
                notifFilterType = 'honor';
                break;
            case NotificationAction.WIN:
                notifType = 'achievement';
                imageUrl = '/images/achievement/achievement-1.png';
                notifFilterType = 'ranked';
                break;
            case NotificationAction.RANK_UP:
                notifType = 'ranked';
                imageUrl = '/images/ranked-btn/fire.png';
                notifFilterType = 'elo';
                break;
            case NotificationAction.MASTERY_LEVEL_UP:
                notifType = 'achievement';
                imageUrl = '/images/achievement/achievement-1.png';
                notifFilterType = 'mastery';
                break;
            case NotificationAction.LEVEL_30_ACHIEVED:
                notifType = 'achievement';
                imageUrl = '/images/achievement/achievement-1.png';
                notifFilterType = 'member'; // Usuario llega a level 30 habiendo canjeado cuenta de level 10 o menor
                break;
            case NotificationAction.ELO_DIVISION_UP:
                notifType = 'ranked';
                imageUrl = '/images/ranked-btn/fire.png';
                notifFilterType = 'elo';
                break;
            case NotificationAction.MEMBER:
                notifType = 'mission';
                imageUrl = '/images/achievement/achievement-1.png';
                notifFilterType = 'redeem'; // Cuando canjean una cuenta
                break;
            // TODO: Agregar caso para ESSENCER cuando el backend lo implemente
            // (cuando alguien se REGISTRA en la página por primera vez)
            // case NotificationAction.ESSENCER_REGISTERED:
            //     notifType = 'mission';
            //     imageUrl = '/images/achievement/achievement-1.png';
            //     notifFilterType = 'essencer';
            //     break;
            // TODO: Agregar caso para RANKING cuando el backend lo implemente
            // (cuando alguien sube de posición: bronze, silver, diamond, tourmaline)
            // Ej: "user ascendió a silver en mastery y desplazó a user2"
            // case NotificationAction.RANKING_POSITION_UP:
            //     notifType = 'achievement';
            //     imageUrl = '/images/achievement/achievement-1.png';
            //     notifFilterType = 'ranking';
            //     break;
            default:
                notifType = 'general';
                notifFilterType = 'all';
                console.warn('Unknown notification action:', feedNotif.action);
        }

        return {
            id: feedNotif.id,
            type: notifType,
            title: feedNotif.title,
            message: feedNotif.description,
            timestamp: new Date(feedNotif.createdAt),
            isRead: false,
            imageUrl: imageUrl,
            filterType: notifFilterType,
            action: feedNotif.action
        };
    };

    // Cargar notificaciones del endpoint
    const loadNotifications = useCallback(async () => {
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
    }, []);

    // Cargar notificaciones al montar y establecer auto-refresh
    useEffect(() => {
        loadNotifications();

        // Auto-refresh cada 30 segundos
        const interval = setInterval(() => {
            loadNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [loadNotifications]);

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

    const handleNotificationHover = (id: number) => {
        setViewedNotifications(prev => new Set(prev).add(id));
    };

    const isNotificationNew = (notif: ExtendedNotification): boolean => {
        return !viewedNotifications.has(notif.id);
    };

    // Filtrar notificaciones por término de búsqueda y tipo
    const filteredNotifications = notifications.filter(notif => {
        // Filtrar por tipo
        const matchesFilter = filterType === 'all' || notif.filterType === filterType;

        // Filtrar por búsqueda (si no hay término de búsqueda, mostrar todos)
        const matchesSearch = searchTerm === '' ||
            notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.message.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

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
            <div className={styles.container}>
                {/* Search Bar */}
                <div className={styles.content__top}>
                    {/* Filter Dropdown */}
                    <div className={styles.filter__container}>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as NotificationFilterType)}
                            className={styles.filter__select}
                        >
                            <option value="all">All</option>
                            <option value="level">Level</option>
                            <option value="ranked">Ranked</option>
                            <option value="mastery">Mastery</option>
                            <option value="elo">Elo</option>
                            <option value="member">Member</option>
                            <option value="redeem">Redeem</option>
                            <option value="essencer">Essencer</option>
                            <option value="honor">Honor</option>
                            <option value="ranking">Ranking</option>
                        </select>
                    </div>

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
                </div>

                {/* Feed content */}
                <div className={styles.content}>
                    <div className={styles.feed__items}>
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`${styles.notification__wrapper} ${isNotificationNew(notification) ? styles.new__notification : ''}`}
                                    onMouseEnter={() => handleNotificationHover(notification.id)}
                                >
                                    <Notification
                                        {...notification}
                                        onRead={handleNotificationRead}
                                        onClick={handleNotificationClick}
                                    />
                                </div>
                            ))
                        ) : searchTerm ? (
                            <p className={styles.no__notifications}>No se encontraron notificaciones que coincidan con "{searchTerm}"</p>
                        ) : (
                            <p className={styles.no__notifications}>No hay notificaciones aún</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Feed;

