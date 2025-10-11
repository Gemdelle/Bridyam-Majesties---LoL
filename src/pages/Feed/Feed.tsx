import React, { useState, useEffect } from 'react';
import styles from './Feed.module.scss';

const Feed: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFeed, setShowFeed] = useState(false);

    // Simulate loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

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
                            {/* Feed items will go here */}
                            <p>Feed content will be displayed here</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feed;

