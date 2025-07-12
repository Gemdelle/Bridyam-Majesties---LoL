import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import styles from './Login.module.scss';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { login, isLoading, isAuthenticated } = useAuthContext();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // TODO: Implement navigation to main app
            console.log('User is already authenticated, redirecting...');
        }
    }, [isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const result = await login(email, password);
            
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
                <div className={styles.content}>
                    <h1>Login</h1>
                    <form className={styles.loginForm} onSubmit={handleSubmit}>
                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                placeholder="Enter your email"
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
                    </form>
                </div>
            </div>
            <div className={styles.backgroundImage}></div>
        </div>
    );
};

export default Login; 