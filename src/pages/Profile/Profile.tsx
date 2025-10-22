import React from 'react';
import styles from './Profile.module.scss';

const Profile: React.FC = () => {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <h1>Profile</h1>
                    <p>Esta es la página de perfil del usuario.</p>
                </div>
            </div>
        </div>
    );
};

export default Profile;
