import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import styles from './Nav.module.scss'
import PetDisplay from '../PetDisplay'

export const Nav = () => {
    const location = useLocation()
    const { user, logout } = useAuthContext()

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await logout()
        }
    }

    return (
        <div className={styles.nav}>
            <div className={styles.nav__container}>
                <ul className={styles.nav__container__links__left}>
                    <li 
                        className={location.pathname === '/' ? styles.active : ''}
                        data-nav="accounts"
                    >
                        <Link to="/">Home</Link>
                    </li>
                    <li 
                        className={location.pathname === '/bloodlines' ? styles.active : ''}
                        data-nav="bloodlines"
                    >
                        <Link to="/bloodlines">Bloodlines</Link>
                    </li>
                    <li 
                        className={location.pathname === '/ranked' ? styles.active : ''}
                        data-nav="ranked"
                    >
                        <Link to="/ranked">Ranked</Link>
                    </li>
                    <li 
                        className={location.pathname === '/champions' ? styles.active : ''}
                        data-nav="champions"
                    >
                        <Link to="/champions">Champions</Link>
                    </li>
                    <li 
                        className={location.pathname === '/achievements' ? styles.active : ''}
                        data-nav="achievements"
                    >
                        <Link to="/achievements">Achievements</Link>
                    </li>
                </ul>
                <PetDisplay name={user?.fullName || ''} />
                <ul className={styles.nav__container__links__right}>
                    <li 
                        className={location.pathname === '/redeem' ? styles.active : ''}
                        data-nav="redeem"
                    >
                        <Link to="/redeem">Redeem</Link>
                    </li>
                    <li>
                        PAGE
                    </li>
                    <li>
                        PAGE
                    </li>
                    <li>
                        <button
                            className={styles.logoutButton}
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    )
}
