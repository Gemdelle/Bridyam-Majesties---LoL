import { Link, useLocation } from 'react-router-dom'
import styles from './Nav.module.scss'
import PetDisplay from '../PetDisplay'

export const Nav = () => {
    const location = useLocation()

    return (
        <div className={styles.nav}>
            <div className={styles.nav__container}>
                <ul className={styles.nav__container__links__left}>
                    <li className={location.pathname === '/' ? styles.active : ''}>
                        <Link to="/">Home</Link>
                    </li>
                    <li className={location.pathname === '/bloodlines' ? styles.active : ''}>
                        <Link to="/bloodlines">Bloodlines</Link>
                    </li>
                    <li className={location.pathname === '/ranked' ? styles.active : ''}>
                        <Link to="/ranked">Ranked</Link>
                    </li>
                    <li className={location.pathname === '/champions' ? styles.active : ''}>
                        <Link to="/champions">Champions</Link>
                    </li>
                    <li className={location.pathname === '/achievements' ? styles.active : ''}>
                        <Link to="/achievements">Achievements</Link>
                    </li>
                </ul>
                <PetDisplay name="Essencer" />
                <ul className={styles.nav__container__links__right}>
                    <li>
                        PAGE
                    </li>
                    <li>
                        PAGE
                    </li>
                    <li>
                        PAGE
                    </li>
                    <li>
                        PAGE
                    </li>
                    <li>
                        <img src="" alt="derlets" />
                        <p>Derlet count</p>
                    </li>
                </ul>
            </div>
        </div>
    )
}
