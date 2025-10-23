import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useState, useEffect } from 'react'
import { fetchAllNotifications } from '../../services/feedNotificationService'
import styles from './Nav.module.scss'
import PetDisplay from '../PetDisplay'
import { useLanguage } from '../../contexts/LanguageContext'

export const Nav = () => {
    const location = useLocation()
    const { logout } = useAuthContext()
    const { canSeeAllNavigation } = usePermissions()
    const { language, setLanguage, t } = useLanguage()
    const [hasNewNotifications, setHasNewNotifications] = useState(false)
    const [lastNotificationCount, setLastNotificationCount] = useState(0)

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await logout()
        }
    }

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'es' : 'en';
        setLanguage(newLang);
    }

    // Verificar notificaciones nuevas cada 30 segundos
    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const notifications = await fetchAllNotifications(100)
                const currentCount = notifications.length

                // Si hay más notificaciones que antes, mostrar efecto
                if (lastNotificationCount > 0 && currentCount > lastNotificationCount) {
                    setHasNewNotifications(true)
                } else if (currentCount === 0) {
                    setHasNewNotifications(false)
                }

                setLastNotificationCount(currentCount)
            } catch (error) {
                console.error('Error checking notifications:', error)
            }
        }

        checkNotifications()
        const interval = setInterval(checkNotifications, 30000)

        return () => clearInterval(interval)
    }, [lastNotificationCount])

    // Limpiar el efecto cuando se visita la página de Feed
    useEffect(() => {
        if (location.pathname === '/feed') {
            setHasNewNotifications(false)
        }
    }, [location.pathname])

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
                        <Link to="/">{t('nav.home')}</Link>
                    </li>
                    <li
                        className={location.pathname === '/bloodlines' ? styles.active : ''}
                        data-nav="bloodlines"
                    >
                        <Link to="/bloodlines">{t('nav.bloodlines')}</Link>
                    </li>
                    <li
                        className={location.pathname === '/ranked' ? styles.active : ''}
                        data-nav="ranked"
                    >
                        <Link to="/ranked">{t('nav.ranked')}</Link>
                    </li>
                    <li
                        className={location.pathname === '/champions' ? styles.active : ''}
                        data-nav="champions"
                    >
                        <Link to="/champions">{t('nav.champions')}</Link>
                    </li>
                    <li
                        className={location.pathname === '/skins' ? styles.active : ''}
                        data-nav="skins"
                    >
                        <Link to="/skins">{t('nav.skins')}</Link>
                    </li>
                </ul>
                <PetDisplay />
                <ul className={styles.nav__container__links__right}>
                    {canSeeAllNavigation && (
                        <>
                            <li
                                className={location.pathname === '/achievements' ? styles.active : ''}
                                data-nav="achievements"
                            >
                                <Link to="/achievements">{t('nav.achievements')}</Link>
                            </li>
                            <li
                                className={location.pathname === '/roulette' ? styles.active : ''}
                                data-nav="roulette"
                            >
                                <Link to="/roulette">{t('nav.roulette')}</Link>
                            </li>
                        </>
                    )}
                    <li
                        className={location.pathname === '/redeem' ? styles.active : ''}
                        data-nav="redeem"
                    >
                        <Link to="/redeem">{t('nav.redeem')}</Link>
                    </li>
                    <li
                        className={`${location.pathname === '/feed' ? styles.active : ''} ${hasNewNotifications ? styles.hasNotifications : ''}`}
                        data-nav="feed"
                    >
                        <Link to="/feed">{t('nav.feed')}</Link>
                        {hasNewNotifications && (
                            <div className={styles.particles__container}>
                                {Array.from({ length: 8 }, (_, i) => (
                                    <div key={i} className={`${styles.particle} ${styles[`particle__${i + 1}`]}`}></div>
                                ))}
                            </div>
                        )}
                    </li>
                    <li
                        className={location.pathname === '/page' ? styles.active : ''}
                        data-nav="page"
                    >
                        <Link to="/page">Page</Link>
                    </li>
                    <li>
                        <button
                            className={styles.logoutButton}
                            onClick={handleLogout}
                        >
                            {t('nav.logout')}
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    )
}
