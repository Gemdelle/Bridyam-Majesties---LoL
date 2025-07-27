import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignUpSuccess.module.scss';

interface SignUpSuccessProps {
    onComplete?: () => void;
}

const SignUpSuccess: React.FC<SignUpSuccessProps> = ({ onComplete }) => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to login after 3 seconds
        const timer = setTimeout(() => {
            if (onComplete) {
                onComplete();
            }
            navigate('/login', { state: { fromSignup: true } });
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate, onComplete]);

    const portraitNames = [
        'Arminariknot',
        'Blaandel\'Valse',
        'Bricellice',
        'Damglantine',
        'Deestellirys',
        'Dreemurdomme',
        'Eunilacealle',
        'Hestiarethe',
        'Ivelism',
        'Lacellire',
        'Lahallayd',
        'Orzyadhere',
        'Vrillyarethez'
    ];

    return (
        <div className={styles.page}>
            <div className={styles.pageBackground}></div>
            <div className={styles.majestyLoop}>
                {/* First set */}
                {portraitNames.map((portrait, index) => (
                    <img
                        key={`set1-${index}`}
                        src={`/images/portraits/${portrait}.png`}
                        alt={portrait}
                        className={styles.majestyImage}
                    />
                ))}
                {/* Second set - exact duplicate */}
                {portraitNames.map((portrait, index) => (
                    <img
                        key={`set2-${index}`}
                        src={`/images/portraits/${portrait}.png`}
                        alt={portrait}
                        className={styles.majestyImage}
                    />
                ))}
            </div>
            <div className={styles.container}>
                <div className={styles.spinningBackground}></div>
                <div className={styles.blurOverlay}></div>
                <div className={styles.content}>
                    <div className={styles.successCard}>
                        <div className={styles.successIcon}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h1 className={styles.title}>¡Cuenta Creada Exitosamente!</h1>
                        <p className={styles.message}>
                            Tu cuenta ha sido creada con éxito. Te estamos redirigiendo al Login...
                        </p>
                        <div className={styles.spinner}>
                            <div className={styles.spinnerRing}></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.backgroundImage}></div>
        </div>
    );
};

export default SignUpSuccess; 