import React, { useState, useEffect } from 'react';
import styles from './Feed.module.scss';
import Notification, { type NotificationProps } from '../../components/Notification/Notification';

const Feed: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFeed, setShowFeed] = useState(false);
    const [notifications, setNotifications] = useState<NotificationProps[]>([]);

    // Simulate loading and load mock notifications
    useEffect(() => {
        const timer = setTimeout(() => {
            // Mock notifications data
            const mockNotifications: NotificationProps[] = [
                {
                    id: 1,
                    type: 'achievement',
                    title: 'Achievement Unlocked!',
                    message: 'You have unlocked the "Master of Champions" achievement by reaching mastery level 7 with 10 champions.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
                    isRead: false,
                    imageUrl: '/images/achievement/achievement-1.png'
                },
                {
                    id: 2,
                    type: 'level',
                    title: 'Level Up!',
                    message: 'Congratulations! Your account has reached level 150.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                    isRead: false,
                    imageUrl: '/images/icons/level-icon.png'
                },
                {
                    id: 3,
                    type: 'ranked',
                    title: 'Rank Promotion',
                    message: 'You have been promoted to Diamond IV in Solo Queue. Keep up the great work!',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
                    isRead: false,
                    imageUrl: '/images/ranked-btn/fire.png'
                }
            ];

            setNotifications(mockNotifications);
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
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
                            {notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <Notification
                                        key={notification.id}
                                        {...notification}
                                        onRead={handleNotificationRead}
                                        onClick={handleNotificationClick}
                                    />
                                ))
                            ) : (
                                <p className={styles.no__notifications}>No notifications yet</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feed;

