import { Link } from 'react-router-dom'
import styles from './Nav.module.scss'
import PetDisplay from '../PetDisplay'

export const Nav = () => {
    return (
        <div className={styles.nav}>
            <div className={styles.nav__container}>
                <ul className={styles.nav__container__links__left}>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/bloodlines">Bloodlines</Link>
                    </li>
                    <li>
                        <Link to="/ranked">Ranked</Link>
                    </li>
                    <li>
                        PAGE
                    </li>
                    <li>
                        PAGE
                    </li>
                </ul>
                <PetDisplay name="Bridyam" level={5} />
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
