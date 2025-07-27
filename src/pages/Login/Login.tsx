import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import styles from './Login.module.scss';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { login, isLoading, isAuthenticated } = useAuthContext();
    const location = useLocation();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // TODO: Implement navigation to main app
            console.log('User is already authenticated, redirecting...');
        }
    }, [isAuthenticated]);

    // Check if user came from signup
    useEffect(() => {
        const state = location.state as { fromSignup?: boolean } | null;
        if (state?.fromSignup) {
            setSuccessMessage('¡Cuenta creada exitosamente! Ya puedes iniciar sesión con tus credenciales.');
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const result = await login(username, password);

            if (result.success) {
                // Login successful - context will handle state updates
                console.log('Login successful, user authenticated');
                // TODO: Implement navigation to main app
                alert('Login successful! Welcome back.');
            } else {
                // Login failed
                setError(result.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('An unexpected error occurred. Please try again.');
        }
    };

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
                    <h1>Login</h1>
                    <form className={styles.loginForm} onSubmit={handleSubmit}>
                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className={styles.success}>
                                {successMessage}
                            </div>
                        )}
                        <div className={styles.inputGroup}>
                            <label htmlFor="username" className={styles.label}>Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={styles.input}
                                placeholder="Enter your username"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                placeholder="Enter your password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>

                        <div className={styles.signUpLink}>
                            Don't have an account? <a href="/signup">Sign up here</a>
                        </div>
                    </form>
                </div>
            </div>
            <div className={styles.backgroundImage}></div>
        </div>
    );
};

export default Login; 