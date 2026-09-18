import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useState, useEffect, useRef } from 'react'
import { fetchAllNotifications } from '../../services/feedNotificationService'
import styles from './Nav.module.scss'
// import PetDisplay from '../PetDisplay'
import { useLanguage } from '../../contexts/LanguageContext'
import { playClickSound, playNotificationSound } from '../../utils/soundUtils'
import { assetUrl } from '../../utils/assetUrl'

const FEED_SEEN_KEY = 'bridyam_feed_seen_count'

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

                if (unread > 0 && notifications[0]) {
                    const petType = notifications[0].petType
                    const petStage = notifications[0].petStage
                    if (
                        petType &&
                        ['1', '2', '3', '4'].includes(petType) &&
                        petStage &&
                        petStage >= 1 &&
                        petStage <= 3
                    ) {
                        setAlertPetSrc(assetUrl(`images/pets/pet-${petType}-${petStage}.png`))
                    } else {
                        setAlertPetSrc(assetUrl('images/pets/pet-1-1.png'))
                    }
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

    return (
        <div className={styles.nav}>
            <div className={styles.nav__container}>
                <ul className={styles.nav__container__links__left}>
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
                    <li
                        className={location.pathname === '/' ? styles.active : ''}
                        data-nav="accounts"
                    >
                        <Link to="/" onClick={playClickSound}>{t('nav.home')}</Link>
                    </li>
                    <li
                        className={location.pathname === '/bloodlines' ? styles.active : ''}
                        data-nav="bloodlines"
                    >
                        <Link to="/bloodlines" onClick={playClickSound}>{t('nav.bloodlines')}</Link>
                    </li>
                    <li
                        className={location.pathname === '/ranked' ? styles.active : ''}
                        data-nav="ranked"
                    >
                        <Link to="/ranked" onClick={playClickSound}>{t('nav.ranked')}</Link>
                    </li>
                    <li
                        className={location.pathname === '/champions' ? styles.active : ''}
                        data-nav="champions"
                    >
                        <Link to="/champions" onClick={playClickSound}>{t('nav.champions')}</Link>
                    </li>
                    <li
                        className={location.pathname === '/skins' ? styles.active : ''}
                        data-nav="skins"
                    >
                        <Link to="/skins" onClick={playClickSound}>{t('nav.skins')}</Link>
                    </li>
                </ul>
                <ul className={styles.nav__container__links__right}>
                    {canSeeAllNavigation && (
                        <>
                            {/* Achievements moved to Leaderboard "See achievement list" button
                            <li
                                className={location.pathname === '/achievements' ? styles.active : ''}
                                data-nav="achievements"
                            >
                                <Link to="/achievements" onClick={playClickSound}>{t('nav.achievements')}</Link>
                            </li>
                            */}
                            <li
                                className={location.pathname === '/roulette' ? styles.active : ''}
                                data-nav="roulette"
                            >
                                <Link to="/roulette" onClick={playClickSound}>{t('nav.roulette')}</Link>
                            </li>
                        </>
                    )}
                    <li
                        className={`${location.pathname === '/feed' ? styles.active : ''} ${showFeedAlert ? styles.hasNotifications : ''}`}
                        data-nav="feed"
                    >
                        <Link to="/feed" onClick={playClickSound}>{t('nav.feed')}</Link>
                        {showFeedAlert && (
                            <>
                                <span className={styles.feedBadge} aria-label={`${unreadCount} new`}>
                                    <img
                                        src={assetUrl('images/frames/notification-icon-frame.png')}
                                        alt=""
                                        className={styles.feedBadge__frame}
                                    />
                                    <span className={styles.feedBadge__count}>{badgeLabel}</span>
                                </span>
                                {alertPetSrc && (
                                    <img
                                        src={alertPetSrc}
                                        alt=""
                                        className={styles.feedAlertPet}
                                    />
                                )}
                            </>
                        )}
                    </li>
                    <li
                        className={location.pathname === '/leaderboard' ? styles.active : ''}
                        data-nav="leaderboard"
                    >
                        <Link to="/leaderboard" onClick={playClickSound}>
                            Leaderboard
                        </Link>
                    </li>
                </ul>
            </div>
            {/* Pet nav display commented out (no login / personal pet yet) — Garden replaces it */}
            {/*
            <div className={styles.nav__pet}>
                <PetDisplay />
            </div>
            */}
            <div className={styles.nav__pet}>
                <Link
                    to="/garden"
                    className={`${styles.gardenNav} ${location.pathname === '/garden' ? styles.gardenNavActive : ''}`}
                    onClick={playClickSound}
                >
                    <img
                        src={assetUrl('images/frames/egg-frame.png')}
                        alt=""
                        className={styles.gardenNav__frame}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.opacity = '0.35';
                        }}
                    />
                    <span>Garden</span>
                </Link>
            </div>
        </div>
    )
}
