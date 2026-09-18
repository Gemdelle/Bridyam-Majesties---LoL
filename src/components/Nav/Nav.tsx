import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useState, useEffect, useRef } from 'react'
import { fetchAllNotifications } from '../../services/feedNotificationService'
import styles from './Nav.module.scss'
import { useLanguage } from '../../contexts/LanguageContext'
import { playClickSound, playNotificationSound } from '../../utils/soundUtils'
import { assetUrl } from '../../utils/assetUrl'

const FEED_SEEN_KEY = 'bridyam_feed_seen_count'
/** Garden + Leaderboard are local-dev only until ready for production. */
const LOCAL_ONLY = import.meta.env.DEV

export const Nav = () => {
    const location = useLocation()
    const { logout } = useAuthContext()
    const { canSeeAllNavigation } = usePermissions()
    const { language, setLanguage, t } = useLanguage()
    const [unreadCount, setUnreadCount] = useState(0)
    const [alertPetSrc, setAlertPetSrc] = useState<string | null>(null)
    const prevCountRef = useRef(0)
    const onFeedPage = location.pathname === '/feed'

    const handleLogout = async () => {
        playClickSound();
        if (confirm('Are you sure you want to logout?')) {
            await logout()
        }
    }

    const toggleLanguage = () => {
        playClickSound();
        const newLang = language === 'en' ? 'es' : 'en';
        setLanguage(newLang);
    }

    const markFeedSeen = (count: number) => {
        localStorage.setItem(FEED_SEEN_KEY, String(count))
        setUnreadCount(0)
        setAlertPetSrc(null)
    }

    useEffect(() => {
        let cancelled = false

        const checkNotifications = async () => {
            try {
                const notifications = await fetchAllNotifications(100)
                if (cancelled) return

                const currentCount = notifications.length
                const seen = Number(localStorage.getItem(FEED_SEEN_KEY) || '0')

                if (onFeedPage) {
                    markFeedSeen(currentCount)
                    prevCountRef.current = currentCount
                    return
                }

                const unread = Math.max(0, currentCount - seen)
                setUnreadCount(unread)

                if (prevCountRef.current > 0 && currentCount > prevCountRef.current) {
                    playNotificationSound()
                }
                prevCountRef.current = currentCount

                if (unread > 0) {
                    // Default crystal pet until login can resolve the player's pet
                    setAlertPetSrc(assetUrl('images/pets/crystal-pet-3.png'))
                } else {
                    setAlertPetSrc(null)
                }
            } catch (error) {
                console.error('Error checking notifications:', error)
            }
        }

        checkNotifications()
        const interval = setInterval(checkNotifications, 30000)
        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [onFeedPage])

    const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)
    const showFeedAlert = unreadCount > 0 && !onFeedPage

    const linkClass = (path: string, extra = '') =>
        `${location.pathname === path ? styles.active : ''} ${extra}`.trim()

    return (
        <div className={styles.nav}>
            <div className={styles.nav__container}>
                <ul className={styles.nav__links}>
                    <li className={styles.language__selector}>
                        <div className={styles.language__current}>
                            <img
                                src={language === 'en' ? '/images/flags/flag-uk.png' : '/images/flags/flag-argentina.png'}
                                alt={language === 'en' ? 'English' : 'Español'}
                                className={styles.language__flag}
                            />
                            <span className={styles.language__text}>
                                {t('nav.language.' + (language === 'en' ? 'english' : 'spanish'))}
                            </span>
                        </div>
                        <div className={styles.language__hover} onClick={toggleLanguage}>
                            <img
                                src={language === 'en' ? '/images/flags/flag-argentina.png' : '/images/flags/flag-uk.png'}
                                alt={language === 'en' ? 'Español' : 'English'}
                                className={styles.language__flag__hover}
                            />
                            <span className={styles.language__text__hover}>
                                {t('nav.language.' + (language === 'en' ? 'spanish' : 'english'))}
                            </span>
                        </div>
                    </li>
                    <li className={linkClass('/')} data-nav="accounts">
                        <Link to="/" onClick={playClickSound}>{t('nav.home')}</Link>
                    </li>
                    <li className={linkClass('/bloodlines')} data-nav="bloodlines">
                        <Link to="/bloodlines" onClick={playClickSound}>{t('nav.bloodlines')}</Link>
                    </li>
                    <li className={linkClass('/ranked')} data-nav="ranked">
                        <Link to="/ranked" onClick={playClickSound}>{t('nav.ranked')}</Link>
                    </li>
                    <li className={linkClass('/champions')} data-nav="champions">
                        <Link to="/champions" onClick={playClickSound}>{t('nav.champions')}</Link>
                    </li>
                    <li className={linkClass('/skins')} data-nav="skins">
                        <Link to="/skins" onClick={playClickSound}>{t('nav.skins')}</Link>
                    </li>
                    {canSeeAllNavigation && (
                        <li className={linkClass('/roulette')} data-nav="roulette">
                            <Link to="/roulette" onClick={playClickSound}>{t('nav.roulette')}</Link>
                        </li>
                    )}
                    <li
                        className={`${linkClass('/feed')} ${showFeedAlert ? styles.hasNotifications : ''}`}
                        data-nav="feed"
                    >
                        <Link to="/feed" onClick={playClickSound}>{t('nav.feed')}</Link>
                        {showFeedAlert && (
                            <>
                                <span className={styles.feedSparkles} aria-hidden="true">
                                    <span className={`${styles.feedSparkle} ${styles.feedSparkle__1}`} />
                                    <span className={`${styles.feedSparkle} ${styles.feedSparkle__2}`} />
                                    <span className={`${styles.feedSparkle} ${styles.feedSparkle__3}`} />
                                </span>
                                <span className={styles.feedBadge} aria-label={`${badgeLabel} new`}>
                                    <img
                                        src={assetUrl('images/frames/mastery-level-frame.png')}
                                        alt=""
                                        className={styles.feedBadge__frame}
                                    />
                                    <span className={styles.feedBadge__count}>{badgeLabel}</span>
                                </span>
                                <img
                                    src={alertPetSrc || assetUrl('images/pets/crystal-pet-3.png')}
                                    alt=""
                                    className={styles.feedAlertPet}
                                />
                            </>
                        )}
                    </li>
                    <li
                        className={`${LOCAL_ONLY ? linkClass('/leaderboard') : ''} ${
                            !LOCAL_ONLY ? styles.navDisabled : ''
                        }`}
                        data-nav="leaderboard"
                        title={LOCAL_ONLY ? 'Leaderboard' : 'Leaderboard — coming soon'}
                    >
                        {LOCAL_ONLY ? (
                            <Link to="/leaderboard" onClick={playClickSound}>
                                Leaderboard
                            </Link>
                        ) : (
                            <span className={styles.navDisabledLabel}>Leaderboard</span>
                        )}
                    </li>
                    <li
                        className={`${LOCAL_ONLY ? linkClass('/garden') : ''} ${styles.gardenItem} ${
                            !LOCAL_ONLY ? styles.navDisabled : ''
                        }`}
                        data-nav="garden"
                        title={LOCAL_ONLY ? 'Garden' : 'Garden — coming soon'}
                    >
                        {LOCAL_ONLY ? (
                            <Link to="/garden" onClick={playClickSound}>
                                Garden
                            </Link>
                        ) : (
                            <span className={styles.navDisabledLabel}>Garden</span>
                        )}
                    </li>
                </ul>
            </div>
        </div>
    )
}
