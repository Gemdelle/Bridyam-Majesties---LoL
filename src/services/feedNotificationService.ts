import {
    SHEETS_WINS_URL,
    postToSheet,
    fetchWinsFromSheet,
    fetchEssencerPetMap,
    normalizeSheetEssencer,
    isClaimedEssencer,
    getPetTypeFromSpecies,
    getPetStageFromLevel,
} from './sheetsWinsService';

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
    MISSION_COMPLETED = 'MISSION_COMPLETED',
}

type FeedActor = {
    rankedName: string;
    petType: string | null;
    petStage: number | null;
};

let actorCache: { at: number; byUsername: Map<string, FeedActor> } | null = null;

const defaultPointsForAction = (action: string): number | null => {
    switch (action) {
        case NotificationAction.WIN:
            return 70;
        case NotificationAction.MASTERY_LEVEL_UP:
            return 45;
        case NotificationAction.LEVEL_UP:
            return 25;
        case NotificationAction.HONOR_UP:
            return 30;
        case NotificationAction.RANK_UP:
        case NotificationAction.ELO_DIVISION_UP:
            return 50;
        case NotificationAction.MISSION_COMPLETED:
            return 40;
        default:
            return null;
    }
};

/** Resolve person name + pet from the account username (Sheet ACCOUNTS + ESSENCERS). */
const resolveFeedActor = async (
    username: string,
    fallbackName?: string
): Promise<FeedActor> => {
    const key = username.trim().toLowerCase();
    const now = Date.now();
    if (!actorCache || now - actorCache.at > 60_000) {
        try {
            const [accounts, pets] = await Promise.all([
                fetchWinsFromSheet(),
                fetchEssencerPetMap(),
            ]);
            const byUsername = new Map<string, FeedActor>();
            accounts.forEach((row) => {
                const accountKey = String(row.account || '').trim().toLowerCase();
                if (!accountKey) return;
                const essencer = normalizeSheetEssencer(row.essencer);
                const rankedName = isClaimedEssencer(essencer)
                    ? essencer
                    : String(row.essencer || '').trim() || accountKey;
                const petRow = pets.get(rankedName.toLowerCase());
                const petType = getPetTypeFromSpecies(petRow?.pet);
                byUsername.set(accountKey, {
                    rankedName: isClaimedEssencer(essencer) ? essencer : rankedName,
                    petType,
                    petStage: petType ? getPetStageFromLevel(petRow?.level) : null,
                });
            });
            actorCache = { at: now, byUsername };
        } catch (err) {
            console.warn('Could not resolve feed actors from Sheet:', err);
            actorCache = { at: now, byUsername: new Map() };
        }
    }

    const found = actorCache.byUsername.get(key);
    if (found) return found;

    const fallback = String(fallbackName || username).trim() || username;
    return { rankedName: fallback, petType: null, petStage: null };
};

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

export type FeedNotificationType = FeedNotification;

export interface CreateFeedEventInput {
    rankedId?: number;
    rankedUsername: string;
    rankedName?: string;
    bloodline?: string;
    petType?: string | null;
    petStage?: number | null;
    action: NotificationAction | string;
    title: string;
    description?: string;
    metadata?: Record<string, string>;
    points?: number | null;
}

const mapRow = (row: Record<string, unknown>): FeedNotification => ({
    id: Number(row.id) || 0,
    userId: String(row.rankedName || row.rankedUsername || ''),
    rankedId: Number(row.rankedId) || 0,
    rankedName: String(row.rankedName || ''),
    rankedUsername: String(row.rankedUsername || ''),
    bloodline: String(row.bloodline || ''),
    petType: row.petType != null && String(row.petType) !== '' ? String(row.petType) : null,
    petStage: row.petStage != null && String(row.petStage) !== '' ? Number(row.petStage) : null,
    action: String(row.action || '') as NotificationAction,
    title: String(row.title || ''),
    description: String(row.description || ''),
    metadata: (row.metadata as Record<string, string>) || {},
    createdAt: String(row.createdAt || new Date().toISOString()),
    points: row.points == null || row.points === '' ? null : Number(row.points),
});

export const fetchAllNotifications = async (limit: number = 100): Promise<FeedNotification[]> => {
    try {
        const response = await fetch(
            `${SHEETS_WINS_URL}?resource=feed&limit=${limit}&t=${Date.now()}`,
            { cache: 'no-store' }
        );
        if (!response.ok) throw new Error(`Feed GET ${response.status}`);
        const payload = await response.json();
        if (!payload.ok) throw new Error(payload.error || 'Feed GET failed');
        return (payload.feed || []).map(mapRow);
    } catch (err) {
        console.warn('Feed unavailable:', err);
        return [];
    }
};

export const fetchNotificationsByUser = async (
    userId: string,
    limit: number = 50
): Promise<FeedNotification[]> => {
    const all = await fetchAllNotifications(Math.max(limit, 100));
    const key = String(userId || '').toLowerCase();
    return all
        .filter(
            (n) =>
                n.userId.toLowerCase() === key ||
                n.rankedName.toLowerCase() === key ||
                n.rankedUsername.toLowerCase().includes(key)
        )
        .slice(0, limit);
};

export const fetchNotificationsByBloodline = async (
    bloodline: string,
    limit: number = 100
): Promise<FeedNotification[]> => {
    const all = await fetchAllNotifications(limit);
    const key = String(bloodline || '').toLowerCase();
    return all.filter((n) => n.bloodline.toLowerCase().includes(key));
};

export const fetchNotificationsByRanked = async (
    rankedId: number,
    limit: number = 50
): Promise<FeedNotification[]> => {
    const all = await fetchAllNotifications(Math.max(limit, 100));
    return all.filter((n) => n.rankedId === rankedId).slice(0, limit);
};

/** Publish a feed event identified by account / player name (no login required). */
export const publishFeedEvent = async (input: CreateFeedEventInput): Promise<void> => {
    const username = String(input.rankedUsername || '').trim();
    if (!username || !input.action || !input.title) return;

    try {
        const actor = await resolveFeedActor(username, input.rankedName);
        const playerName = actor.rankedName || String(input.rankedName || username);
        const points =
            input.points !== undefined && input.points !== null
                ? input.points
                : defaultPointsForAction(String(input.action));

        // Prefer person name in title/description when the caller used the account name
        let title = String(input.title);
        let description = String(input.description || '');
        if (playerName && playerName !== username) {
            title = title.split(username).join(playerName);
            description = description.split(username).join(playerName);
        }

        await postToSheet({
            action: 'appendFeed',
            feed: {
                rankedId: Number(input.rankedId) || 0,
                rankedUsername: username,
                rankedName: playerName,
                bloodline: String(input.bloodline || ''),
                petType: input.petType ?? actor.petType ?? '',
                petStage: input.petStage ?? actor.petStage ?? '',
                action: String(input.action),
                title,
                description,
                metadata: input.metadata || {},
                createdAt: new Date().toISOString(),
                points,
            },
        });
    } catch (err) {
        console.warn('Could not publish feed event:', err);
    }
};

export const formatNotificationDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
};

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

export const getNotificationColor = (action: NotificationAction): string => {
    switch (action) {
        case NotificationAction.LEVEL_UP:
            return '#4CAF50';
        case NotificationAction.HONOR_UP:
            return '#2196F3';
        case NotificationAction.WIN:
            return '#FFC107';
        case NotificationAction.RANK_UP:
            return '#9C27B0';
        case NotificationAction.MASTERY_LEVEL_UP:
            return '#FF5722';
        case NotificationAction.LEVEL_30_ACHIEVED:
            return '#FF9800';
        case NotificationAction.ELO_DIVISION_UP:
            return '#00BCD4';
        case NotificationAction.MEMBER:
            return '#E91E63';
        case NotificationAction.USER_REGISTERED:
            return '#8BC34A';
        case NotificationAction.MISSION_COMPLETED:
            return '#FF6B35';
        default:
            return '#757575';
    }
};

export interface CreateMissionNotificationRequest {
    userId: string;
    rankedId: number;
    rankedName: string;
    rankedUsername: string;
    bloodline: string;
    missionNumber: number;
    totalMissions?: number;
}

export const createMissionNotification = async (
    request: CreateMissionNotificationRequest
): Promise<void> => {
    await publishFeedEvent({
        rankedId: request.rankedId,
        rankedUsername: request.rankedUsername,
        rankedName: request.rankedName,
        bloodline: request.bloodline,
        action: NotificationAction.MISSION_COMPLETED,
        title: `Mission ${request.missionNumber} completed`,
        description: `${request.rankedName || request.rankedUsername} completed a mission`,
        metadata: {
            missionNumber: String(request.missionNumber),
            totalMissions: String(request.totalMissions || ''),
        },
    });
};
