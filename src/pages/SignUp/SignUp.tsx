import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import styles from './SignUp.module.scss';

const SignUp: React.FC = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated } = useAuthContext();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            console.log('User is already authenticated, redirecting...');
        }
    }, [isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        // Calculate age
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        if (age < 13) {
            setError('You must be at least 13 years old to register');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.register({
                email,
                password,
                name,
                birthDate
            });

            if (response.success) {
                setSuccess('Registration successful! You can now login with your credentials.');
                // Clear form
                setEmail('');
                setName('');
                setPassword('');
                setConfirmPassword('');
                setBirthDate('');
            } else {
                setError(response.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
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
        <div className={styles.container}>
            <div className={styles.spinningBackground}></div>
            <div className={styles.blurOverlay}></div>
            <div className={styles.content}>
                <h1>Sign Up</h1>
                <form className={styles.signUpForm} onSubmit={handleSubmit}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className={styles.success}>
                            {success}
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
                        <label htmlFor="name" className={styles.label}>Twitch Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.input}
                            placeholder="Enter your Twitch username"
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
                            minLength={6}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={styles.input}
                            placeholder="Confirm your password"
                            required
                            disabled={isLoading}
                            minLength={6}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="birthDate" className={styles.label}>Birth Date</label>
                        <input
                            type="date"
                            id="birthDate"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className={styles.input}
                            required
                            disabled={isLoading}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <div className={styles.loginLink}>
                        Already have an account? <Link to="/login">Login here</Link>
                    </div>
                </form>
            </div>

            {/* Background portraits */}
            <div className={styles.portraitsContainer}>
                {portraitNames.map((name, index) => (
                    <div key={name} className={`${styles.portrait} ${styles[`portrait${index + 1}`]}`}>
                        <img src={`/images/portraits/${name}.png`} alt={name} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SignUp; 