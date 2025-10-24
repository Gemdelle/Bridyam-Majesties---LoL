// API configuration
const API_BASE_URL = 'https://bridyam-majesties-back-production.up.railway.app';

/**
 * Tipos de acción de notificación
 */
export enum NotificationAction {
    LEVEL_UP = 'LEVEL_UP',
    HONOR_UP = 'HONOR_UP',
    WIN = 'WIN',
    RANK_UP = 'RANK_UP',
    MASTERY_LEVEL_UP = 'MASTERY_LEVEL_UP',
    LEVEL_30_ACHIEVED = 'LEVEL_30_ACHIEVED',
    ELO_DIVISION_UP = 'ELO_DIVISION_UP',
    MEMBER = 'MEMBER',
    USER_REGISTERED = 'USER_REGISTERED',
    MISSION_COMPLETED = 'MISSION_COMPLETED'
}

/**
 * Notificación del feed
 */
export interface FeedNotification {
    id: number;
    userId: string;
    rankedId: number;
    rankedName: string;
    rankedUsername: string;
    bloodline: string;
    petType: string | null;
    petStage: number | null;
    action: NotificationAction;
    title: string;
    description: string;
    metadata: Record<string, string>;
    createdAt: string;
    points: number | null;
}

/**
 * Type alias para mejor legibilidad
 */
export type FeedNotificationType = FeedNotification;

/**
 * Obtiene todas las notificaciones del feed (global)
 */
export const fetchAllNotifications = async (limit: number = 100): Promise<FeedNotification[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/feed/notifications?limit=${limit}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch notifications: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        throw error;
    }
};

/**
 * Obtiene las notificaciones de un usuario específico
 */
export const fetchNotificationsByUser = async (userId: string, limit: number = 50): Promise<FeedNotification[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/feed/notifications/user/${userId}?limit=${limit}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch user notifications: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching notifications for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Obtiene las notificaciones de una bloodline específica
 */
export const fetchNotificationsByBloodline = async (bloodline: string, limit: number = 100): Promise<FeedNotification[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/feed/notifications/bloodline/${bloodline}?limit=${limit}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch bloodline notifications: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching notifications for bloodline ${bloodline}:`, error);
        throw error;
    }
};

/**
 * Obtiene las notificaciones de una cuenta ranked específica
 */
export const fetchNotificationsByRanked = async (rankedId: number, limit: number = 50): Promise<FeedNotification[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/feed/notifications/ranked/${rankedId}?limit=${limit}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch ranked notifications: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching notifications for ranked ${rankedId}:`, error);
        throw error;
    }
};

/**
 * Formatea la fecha de una notificación
 */
export const formatNotificationDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        console.error('Error formatting notification date:', error);
        return dateString;
    }
};

/**
 * Obtiene el icono apropiado para el tipo de acción
 */
export const getNotificationIcon = (action: NotificationAction): string => {
    switch (action) {
        case NotificationAction.LEVEL_UP:
            return '⬆️';
        case NotificationAction.HONOR_UP:
            return '🎖️';
        case NotificationAction.WIN:
            return '🏆';
        case NotificationAction.RANK_UP:
            return '👑';
        case NotificationAction.MASTERY_LEVEL_UP:
            return '⚔️';
        case NotificationAction.LEVEL_30_ACHIEVED:
            return '🎉';
        case NotificationAction.ELO_DIVISION_UP:
            return '📈';
        case NotificationAction.MEMBER:
            return '🎊';
        case NotificationAction.USER_REGISTERED:
            return '👋';
        case NotificationAction.MISSION_COMPLETED:
            return '🎯';
        default:
            return '📢';
    }
};

/**
 * Obtiene el color apropiado para el tipo de acción
 */
export const getNotificationColor = (action: NotificationAction): string => {
    switch (action) {
        case NotificationAction.LEVEL_UP:
            return '#4CAF50'; // Verde
        case NotificationAction.HONOR_UP:
            return '#2196F3'; // Azul
        case NotificationAction.WIN:
            return '#FFC107'; // Amarillo dorado
        case NotificationAction.RANK_UP:
            return '#9C27B0'; // Púrpura
        case NotificationAction.MASTERY_LEVEL_UP:
            return '#FF5722'; // Naranja rojizo
        case NotificationAction.LEVEL_30_ACHIEVED:
            return '#FF9800'; // Naranja
        case NotificationAction.ELO_DIVISION_UP:
            return '#00BCD4'; // Cian
        case NotificationAction.MEMBER:
            return '#E91E63'; // Rosa
        case NotificationAction.USER_REGISTERED:
            return '#8BC34A'; // Verde claro
        case NotificationAction.MISSION_COMPLETED:
            return '#FF6B35'; // Naranja vibrante
        default:
            return '#757575'; // Gris
    }
};

/**
 * Interfaz para crear notificaciones de missions
 */
export interface CreateMissionNotificationRequest {
    userId: string;
    rankedId: number;
    rankedName: string;
    rankedUsername: string;
    bloodline: string;
    missionNumber: number;
    totalMissions?: number;
}

/**
 * Crea una notificación cuando un usuario completa una misión
 */
export const createMissionNotification = async (request: CreateMissionNotificationRequest): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/feed/notifications/mission`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...request,
                totalMissions: request.totalMissions || 22
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to create mission notification: ${response.statusText}`);
        }

        console.log('Mission notification created successfully');
    } catch (error) {
        console.error('Error creating mission notification:', error);
        throw error;
    }
};

