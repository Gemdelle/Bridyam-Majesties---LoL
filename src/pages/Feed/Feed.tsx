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
 * - essencer: Cuando un usuario se REGISTRA en la página (USER_REGISTERED) - Filtra por username
 * - honor: Cuando sube de honor (HONOR_UP)
 * - ranking: Cuando alguien sube de posición en el ranking (bronze, silver, diamond, tourmaline) en cualquier categoría (pendiente implementación backend)
 */

// Tipo extendido para las notificaciones con filtro
type ExtendedNotification = NotificationProps & {
    filterType: NotificationFilterType;
    action: NotificationAction;
    rankedName: string;
    username: string;
    masteryLevel?: string | null;
};

const Feed: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<NotificationFilterType>('all');
    // Cargar notificaciones vistas desde localStorage al inicializar
    const [viewedNotifications, setViewedNotifications] = useState<Set<number>>(() => {
        const stored = localStorage.getItem('viewedNotifications');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    });

    // Función helper para obtener imagen de tier
    const getTierImage = (tier: string): string => {
        const tierLower = tier.toLowerCase();
        const tierMap: Record<string, string> = {
            'iron': 'tier-iron-helm.webp',
            'bronze': 'tier-bronze-helm.webp',
            'silver': 'tier-silver-helm.webp',
            'gold': 'tier-gold-helm.webp',
            'platinum': 'tier-platinum-helm.webp',
            'emerald': 'tier-emerald-helm.webp',
            'diamond': 'tier-diamond-helm.webp',
            'master': 'tier-master-helm.webp',
            'grandmaster': 'tier-grandmaster-helm.webp',
            'challenger': 'tier-challenger-heml.webp' // Nota: el archivo tiene typo 'heml'
        };
        return `/images/lol-elements/${tierMap[tierLower] || 'tier-bronze-helm.webp'}`;
    };

    // Función helper para obtener imagen de honor
    const getHonorImage = (honorLevel: string | number): string => {
        const level = typeof honorLevel === 'string' ? parseInt(honorLevel) : honorLevel;
        if (level >= 1 && level <= 5) {
            return `/images/honor/honor-${level}.png`;
        }
        return '/images/honor/honor-1.png';
    };

    // Función helper para obtener imagen de mastery
    const getMasteryImage = (masteryLevel: string | number): string => {
        const level = typeof masteryLevel === 'string' ? parseInt(masteryLevel) : masteryLevel;
        if (level >= 1 && level <= 10) {
            return `/images/masteries/badges/${level}.png`;
        }
        // Si el nivel es mayor a 10, usar la imagen del nivel 10
        if (level > 10) {
            return '/images/masteries/badges/10.png';
        }
        return '/images/masteries/badges/1.png';
    };

    // Función helper para obtener portrait de majesty
    const getMajestyPortrait = (majestyName: string): string => {
        if (!majestyName) return '/images/portraits/Lacellire.png'; // Default

        // Lista de majesties disponibles
        const majesties = [
            'Arminariknot', 'Blaandel\'Valse', 'Bricellice', 'Damglantine',
            'Deestellirys', 'Dreemurdomme', 'Eunilacealle', 'Hestiarethe',
            'Ivelism', 'Lacellire', 'Lahallayd', 'Orzyadhere', 'Vrillyarethez'
        ];

        // Buscar si el nombre coincide (case insensitive)
        const foundMajesty = majesties.find(majesty =>
            majesty.toLowerCase() === majestyName.toLowerCase()
        );

        if (foundMajesty) {
            return `/images/portraits/${foundMajesty}.png`;
        }

        // Si no encuentra, usar default
        return '/images/portraits/Lacellire.png';
    };

    // Función helper para obtener gem-pet según bloodline
    const getBloodlineGem = (bloodline: string | number): string => {
        // Si es string, intentar convertir o mapear por nombre
        if (typeof bloodline === 'string') {
            const bloodlineLower = bloodline.toLowerCase();

            // Mapeo por nombre
            if (bloodlineLower.includes('porveldam')) return '/images/achievement/gem-pet-1.png';
            if (bloodlineLower.includes('spadelline')) return '/images/achievement/gem-pet-2.png';
            if (bloodlineLower.includes('zephir')) return '/images/achievement/gem-pet-3.png';
            if (bloodlineLower.includes('gladasmy')) return '/images/achievement/gem-pet-4.png';

            // Intentar parsear como número
            const bloodlineNum = parseInt(bloodline);
            if (!isNaN(bloodlineNum)) {
                bloodline = bloodlineNum;
            }
        }

        // Si ya es número o se convirtió a número
        const bloodlineNum = typeof bloodline === 'number' ? bloodline : 1;

        switch (bloodlineNum) {
            case 1: // Porveldam
                return '/images/achievement/gem-pet-1.png';
            case 2: // Spadelline
                return '/images/achievement/gem-pet-2.png';
            case 3: // Zephiroth
                return '/images/achievement/gem-pet-3.png';
            case 4: // Gladasmy
                return '/images/achievement/gem-pet-4.png';
            default:
                return '/images/achievement/gem-pet-1.png'; // Default: Porveldam
        }
    };

    // Función para mapear FeedNotification a NotificationProps con filterType
    const mapFeedNotificationToProps = (feedNotif: FeedNotification): NotificationProps & { filterType: NotificationFilterType; action: NotificationAction } => {
        // Mapear el tipo de acción a tipo de notificación
        let notifType: NotificationProps['type'] = 'general';
        let imageUrl = '';
        let notifFilterType: NotificationFilterType = 'all';


        switch (feedNotif.action) {
            case NotificationAction.LEVEL_UP:
                notifType = 'level';
                imageUrl = '/images/icons/level-up-icon.png';
                notifFilterType = 'level';
                break;
            case NotificationAction.HONOR_UP: {
                notifType = 'achievement';
                // Usar imagen de honor según el nivel en metadata
                const honorLevel = feedNotif.metadata.to || '1'; // 'to' contiene el honor level alcanzado
                imageUrl = getHonorImage(honorLevel);
                notifFilterType = 'honor';
                break;
            }
            case NotificationAction.WIN:
                notifType = 'achievement';
                // Usar gem-pet según la bloodline de la cuenta
                console.log('WIN - bloodline:', feedNotif.bloodline, 'imageUrl:', getBloodlineGem(feedNotif.bloodline));
                imageUrl = getBloodlineGem(feedNotif.bloodline);
                notifFilterType = 'ranked';
                break;
            case NotificationAction.RANK_UP: {
                notifType = 'ranked';
                // Usar imagen de tier según el metadata
                const rankTier = feedNotif.metadata.toTier || 'bronze'; // 'toTier' contiene el tier alcanzado
                imageUrl = getTierImage(rankTier);
                notifFilterType = 'elo';
                break;
            }
            case NotificationAction.MASTERY_LEVEL_UP: {
                notifType = 'achievement';
                // Usar imagen de mastery según el nivel en metadata
                const masteryLvl = feedNotif.metadata.to || '1'; // 'to' contiene el mastery level alcanzado
                imageUrl = getMasteryImage(masteryLvl);
                notifFilterType = 'mastery';
                // Agregar clase específica para el nivel de maestría
                feedNotif.masteryLevel = masteryLvl;
                break;
            }
            case NotificationAction.LEVEL_30_ACHIEVED:
                notifType = 'achievement';
                imageUrl = '/images/achievement/achievement-1.png';
                notifFilterType = 'member'; // Usuario llega a level 30 habiendo canjeado cuenta de level 10 o menor
                break;
            case NotificationAction.ELO_DIVISION_UP: {
                notifType = 'ranked';
                // Usar imagen de tier según el metadata
                const eloTier = feedNotif.metadata.toTier || 'bronze'; // 'toTier' contiene el tier alcanzado
                imageUrl = getTierImage(eloTier);
                notifFilterType = 'elo';
                break;
            }
            case NotificationAction.MEMBER: {
                notifType = 'mission';
                // Extraer nombre de majesty desde username (formato: "GEM MajestyName#GEM")
                let majestyName = '';
                if (feedNotif.metadata.username) {
                    // Eliminar "GEM " del inicio y "#GEM" del final
                    majestyName = feedNotif.metadata.username
                        .replace(/^GEM\s+/, '')  // Elimina "GEM " al inicio
                        .replace(/#GEM$/, '');    // Elimina "#GEM" al final
                }
                // Fallback a otras posibles fuentes
                if (!majestyName) {
                    majestyName = feedNotif.metadata.majestyName ||
                        feedNotif.metadata.majesty ||
                        feedNotif.metadata.name ||
                        feedNotif.rankedName ||
                        '';
                }
                imageUrl = getMajestyPortrait(majestyName);
                notifFilterType = 'redeem'; // Cuando canjean una cuenta
                break;
            }
            case NotificationAction.USER_REGISTERED:
                notifType = 'mission';
                imageUrl = '/images/achievement/achievement-1.png';
                notifFilterType = 'essencer';
                break;
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

        // Usar los puntos calculados por el backend que vienen directamente en el campo points
        // Estos puntos representan el score de ranking que se suma por esa acción
        const score = feedNotif.points ?? undefined;

        return {
            id: feedNotif.id,
            type: notifType,
            title: feedNotif.title,
            message: feedNotif.description,
            timestamp: new Date(feedNotif.createdAt),
            isRead: false,
            imageUrl: imageUrl,
            petType: feedNotif.petType,
            petStage: feedNotif.petStage,
            score: score,
            filterType: notifFilterType,
            action: feedNotif.action,
            rankedName: feedNotif.rankedName,
            username: feedNotif.metadata.username || '',
            masteryLevel: feedNotif.masteryLevel || null
        };
    };

    // Cargar notificaciones del endpoint
    const loadNotifications = useCallback(async () => {
        try {
            setError(null);
            const feedNotifications = await fetchAllNotifications(100);

            // Debug: ver los primeros 3 registros crudos del backend
            console.log('RAW BACKEND DATA (first 3):', feedNotifications.slice(0, 3));

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
        setViewedNotifications(prev => {
            const updated = new Set(prev).add(id);
            // Guardar en localStorage
            localStorage.setItem('viewedNotifications', JSON.stringify([...updated]));
            return updated;
        });
    };

    const isNotificationNew = (notif: ExtendedNotification): boolean => {
        return !viewedNotifications.has(notif.id);
    };

    // Filtrar notificaciones por término de búsqueda y tipo
    const filteredNotifications = notifications.filter(notif => {
        // Filtrar por tipo
        const matchesFilter = filterType === 'all' || notif.filterType === filterType;

        // Filtrar por búsqueda (si no hay término de búsqueda, mostrar todos)
        // Buscar en: título, mensaje, rankedName (nombre del usuario) y username
        const matchesSearch = searchTerm === '' ||
            notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.rankedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (notif.username && notif.username.toLowerCase().includes(searchTerm.toLowerCase()));

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
                                    className={styles.notification__wrapper}
                                    onMouseEnter={() => handleNotificationHover(notification.id)}
                                >
                                    <Notification
                                        {...notification}
                                        isNew={isNotificationNew(notification)}
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

