import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNotificationsByUser, type FeedNotification, NotificationAction } from '../services/feedNotificationService';
import { useAuthContext } from '../contexts/AuthContext';

export interface AchievementData {
    notification: FeedNotification;
    category: string;
    elo?: string;
    progress?: number;
    total?: number;
    badgeImage?: string;
}

/**
 * Hook que detecta nuevas notificaciones y las presenta como achievements
 * Se ejecuta periódicamente y compara con las notificaciones ya vistas
 */
export const useAchievementNotifications = () => {
    const { user, isAuthenticated } = useAuthContext();
    const [pendingAchievement, setPendingAchievement] = useState<AchievementData | null>(null);
    const [achievementQueue, setAchievementQueue] = useState<AchievementData[]>([]);
    const lastCheckedRef = useRef<string | null>(null);
    const isCheckingRef = useRef(false);

    // Mapea la notificación a datos del achievement popup
    const mapNotificationToAchievement = useCallback((notification: FeedNotification): AchievementData | null => {
        const metadata = notification.metadata || {};
        
        switch (notification.action) {
            case NotificationAction.LEVEL_UP: {
                const from = parseInt(metadata.from || '0');
                const to = parseInt(metadata.to || '0');
                return {
                    notification,
                    category: 'level',
                    progress: to,
                    total: 30,
                    badgeImage: `/images/icons/level-up-icon.png`
                };
            }
            
            case NotificationAction.HONOR_UP: {
                const to = parseInt(metadata.to || '1');
                return {
                    notification,
                    category: 'honor',
                    progress: to,
                    total: 5,
                    badgeImage: `/images/honor/honor-${to}.png`
                };
            }
            
            case NotificationAction.WIN: {
                const wins = parseInt(metadata.wins || '1');
                return {
                    notification,
                    category: 'wins',
                    progress: wins,
                    total: 100, // Total aproximado
                    badgeImage: `/images/icons/level-up-icon.png`
                };
            }
            
            case NotificationAction.RANK_UP: {
                const toTier = metadata.toTier || metadata.currentTier || 'Bronze';
                const toDivision = parseInt(metadata.toDivision || '4');
                const queue = metadata.queue || 'SoloQ';
                
                // Formatear elo según el tier y división
                let eloDisplay = toTier.toUpperCase();
                if (!['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(toTier.toUpperCase())) {
                    const divisionRoman = ['IV', 'III', 'II', 'I'][4 - toDivision] || 'IV';
                    eloDisplay = `${toTier.toUpperCase()} ${divisionRoman}`;
                }
                
                return {
                    notification,
                    category: 'elo',
                    elo: eloDisplay,
                    progress: 5 - toDivision, // Divisions desde IV hasta I
                    total: 4,
                    badgeImage: `/images/lol-elements/tier-${toTier.toLowerCase()}-helm.webp`
                };
            }
            
            case NotificationAction.MASTERY_LEVEL_UP: {
                const to = parseInt(metadata.to || '1');
                const championName = metadata.championName || 'Champion';
                return {
                    notification,
                    category: 'mastery',
                    progress: to,
                    total: 10,
                    badgeImage: `/images/masteries/badges/${to}.png`
                };
            }
            
            case NotificationAction.LEVEL_30_ACHIEVED: {
                return {
                    notification,
                    category: 'member',
                    elo: 'LEVEL 30',
                    progress: 30,
                    total: 30,
                    badgeImage: `/images/icons/level-up-icon.png`
                };
            }
            
            case NotificationAction.MEMBER: {
                return {
                    notification,
                    category: 'redeem',
                    progress: 1,
                    total: 1,
                    badgeImage: `/images/icons/level-up-icon.png`
                };
            }
            
            case NotificationAction.MISSION_COMPLETED: {
                const missionNumber = parseInt(metadata.missionNumber || '1');
                const totalMissions = parseInt(metadata.totalMissions || '22');
                return {
                    notification,
                    category: 'mission',
                    progress: missionNumber,
                    total: totalMissions,
                    badgeImage: `/images/icons/level-up-icon.png`
                };
            }
            
            default:
                return null;
        }
    }, []);

    // Verifica si hay nuevas notificaciones
    const checkForNewNotifications = useCallback(async () => {
        if (!user?.id || !isAuthenticated || isCheckingRef.current) {
            return;
        }

        try {
            isCheckingRef.current = true;
            
            // Obtener notificaciones del usuario (últimas 10)
            const notifications = await fetchNotificationsByUser(user.id, 10);
            
            if (notifications.length === 0) {
                isCheckingRef.current = false;
                return;
            }

            // Obtener la notificación más reciente
            const latestNotification = notifications[0];
            const latestId = `${latestNotification.id}-${latestNotification.createdAt}`;
            
            // Si es la primera vez (no hay lastChecked), solo guardar la referencia sin mostrar
            if (lastCheckedRef.current === null) {
                lastCheckedRef.current = latestId;
                isCheckingRef.current = false;
                return;
            }
            
            // Si hay notificación nueva, buscar TODAS las notificaciones nuevas
            if (lastCheckedRef.current !== latestId) {
                const newAchievements: AchievementData[] = [];
                
                // Iterar sobre las notificaciones hasta encontrar la última que vimos
                for (const notification of notifications) {
                    const notificationId = `${notification.id}-${notification.createdAt}`;
                    
                    // Si encontramos la última que vimos, parar
                    if (notificationId === lastCheckedRef.current) {
                        break;
                    }
                    
                    // Mapear la notificación a achievement
                    const achievementData = mapNotificationToAchievement(notification);
                    if (achievementData) {
                        newAchievements.push(achievementData);
                    }
                }
                
                // Agregar todas las nuevas achievements a la cola (en orden inverso para mostrar más antiguas primero)
                if (newAchievements.length > 0) {
                    setAchievementQueue(prev => [...prev, ...newAchievements.reverse()]);
                }
                
                // Actualizar el último visto
                lastCheckedRef.current = latestId;
            }
            
            isCheckingRef.current = false;
        } catch (error) {
            console.error('Error checking for new notifications:', error);
            isCheckingRef.current = false;
        }
    }, [user?.id, isAuthenticated, mapNotificationToAchievement]);

    // Procesar la cola de achievements (mostrar uno a la vez)
    useEffect(() => {
        if (achievementQueue.length > 0 && !pendingAchievement) {
            // Tomar el primer achievement de la cola y mostrarlo
            const [nextAchievement, ...rest] = achievementQueue;
            setPendingAchievement(nextAchievement);
            setAchievementQueue(rest);
        }
    }, [achievementQueue, pendingAchievement]);

    // Polling cada 10 segundos para buscar nuevas notificaciones
    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            return;
        }

        // Verificar inmediatamente al montar (después de 2 segundos)
        const initialTimer = setTimeout(() => {
            checkForNewNotifications();
        }, 2000);

        // Luego verificar cada 10 segundos
        const interval = setInterval(() => {
            checkForNewNotifications();
        }, 10000); // 10 segundos

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [isAuthenticated, user?.id, checkForNewNotifications]);

    // Función para cerrar el achievement actual
    const closeAchievement = useCallback(() => {
        setPendingAchievement(null);
    }, []);

    // Función manual para forzar verificación (útil después de acciones que generan notificaciones)
    const forceCheck = useCallback(() => {
        checkForNewNotifications();
    }, [checkForNewNotifications]);

    return {
        currentAchievement: pendingAchievement,
        closeAchievement,
        forceCheck,
        hasQueuedAchievements: achievementQueue.length > 0
    };
};

