import React, { useState, useEffect } from 'react';
import styles from './Redeem.module.scss';
import { claimService } from '../../services/claimService';
import { useAuthContext } from '../../contexts/AuthContext';
import { fetchAvailableRankedAccounts, type RankedData } from '../../services/apiRankedsService';
import ClaimAccountRulesModal from '../../components/ClaimAccountRulesModal/ClaimAccountRulesModal';

// Traducciones
const translations = {
    codeLabel: {
        en: 'Redeem Code (8 characters)',
        es: 'Código de Reclamación (8 caracteres)'
    },
    codeHint: {
        en: 'Enter the 8-character alphanumeric code',
        es: 'Ingresa el código alfanumérico de 8 caracteres'
    },
    codePlaceholder: {
        en: 'Ex: ABC12345',
        es: 'Ej: ABC12345'
    },
    accountLabel: {
        en: 'Select Majesty Account',
        es: 'Seleccionar Cuenta Majesty'
    },
    accountLoading: {
        en: 'Loading accounts...',
        es: 'Cargando cuentas...'
    },
    accountChoose: {
        en: 'Choose an account...',
        es: 'Elige una cuenta...'
    },
    buttonRedeeming: {
        en: 'Redeeming...',
        es: 'Canjeando...'
    },
    buttonRedeem: {
        en: 'Redeem account',
        es: 'Canjear cuenta'
    },
    errorLoading: {
        en: 'Error loading available accounts',
        es: 'Error al cargar las cuentas disponibles'
    },
    errorUnexpected: {
        en: 'Unexpected error. Please try again.',
        es: 'Error inesperado. Por favor, intenta de nuevo.'
    },
    successMessage: {
        en: (username: string) => `Account "${username}" claimed successfully! Permissions updated.`,
        es: (username: string) => `¡Cuenta "${username}" reclamada exitosamente! Permisos actualizados.`
    }
};

const Redeem: React.FC = () => {
    const { refreshProfile, user } = useAuthContext();
    const [redeemCode, setRedeemCode] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [availableAccounts, setAvailableAccounts] = useState<RankedData[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const language = 'es'; // TODO: Conectar con Language Context del Nav

    useEffect(() => {
        const loadAvailableAccounts = async () => {
            try {
                setLoadingAccounts(true);
                const accounts = await fetchAvailableRankedAccounts();
                setAvailableAccounts(accounts);
            } catch (error) {
                console.error('Error loading available accounts:', error);
                setError(translations.errorLoading[language]);
            } finally {
                setLoadingAccounts(false);
            }
        };

        loadAvailableAccounts();
    }, []);

    const handleRedeem = async () => {
        setError(null);
        setSuccess(null);

        // Validate input data
        const validationErrors = claimService.validateClaimData(redeemCode, selectedAccount);
        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
        }

        // Show rules modal instead of directly claiming
        setShowRulesModal(true);
    };

    const handleConfirmClaim = async () => {
        setShowRulesModal(false);
        setLoading(true);

        try {
            const result = await claimService.claimAccount({
                code: redeemCode,
                rankedUsername: selectedAccount
            });

            if (result.success) {
                console.log('Claim successful, refreshing profile...');

                // Refresh user profile to update rankedUsernames permissions
                await refreshProfile();

                console.log('Profile refreshed, permissions updated');

                setSuccess(translations.successMessage[language](result.rankedUsername || ''));
                setRedeemCode('');
                setSelectedAccount('');

                // Reload available accounts
                const accounts = await fetchAvailableRankedAccounts();
                setAvailableAccounts(accounts);
            } else {
                setError(result.message);
            }
        } catch (error) {
            console.error('Redeem error:', error);
            setError(translations.errorUnexpected[language]);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowRulesModal(false);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length <= 8) {
            setRedeemCode(value);
        }
    };

    return (
        <div className={styles.redeem}>
            <ClaimAccountRulesModal
                isOpen={showRulesModal}
                onClose={handleCloseModal}
                onConfirm={handleConfirmClaim}
                username={user?.name || user?.email || 'Player'}
                language={language}
            />
            <div className={styles.redeem__container}>
                <div className={styles.redeem__form}>
                    <div className={styles.input__group}>
                        <label htmlFor="redeemCode" className={styles.input__label}>
                            {translations.codeLabel[language]}
                        </label>
                        <small className={styles.input__hint}>
                            {translations.codeHint[language]}
                        </small>
                        <input
                            type="text"
                            id="redeemCode"
                            className={styles.input__field}
                            placeholder={translations.codePlaceholder[language]}
                            value={redeemCode}
                            onChange={handleCodeChange}
                            maxLength={8}
                            disabled={loading}
                        />

                    </div>

                    <div className={styles.dropdown__group}>
                        <label htmlFor="majestyAccount" className={styles.input__label}>
                            {translations.accountLabel[language]}
                        </label>
                        {/* <small className={styles.input__hint}>
                            {loadingAccounts
                                ? 'Cargando cuentas disponibles...'
                                : availableAccounts.length > 0
                                    ? 'Selecciona la cuenta ranked que deseas reclamar'
                                    : 'No hay cuentas disponibles en este momento'
                            }
                        </small> */}
                        <select
                            id="majestyAccount"
                            className={styles.input__select}
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            disabled={loading || loadingAccounts}
                        >
                            <option value="" disabled>
                                {loadingAccounts ? translations.accountLoading[language] : translations.accountChoose[language]}
                            </option>
                            {availableAccounts.map((account) => (
                                <option key={account.id} value={account.username}>
                                    {account.username}
                                </option>
                            ))}
                        </select>

                    </div>

                    {error && (
                        <div className={styles.error__message}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className={styles.success__message}>
                            {success}
                        </div>
                    )}

                    <div className={styles.majesty__portrait}>
                        {selectedAccount && (
                            <img
                                src={`/images/majesties/${selectedAccount}.png`}
                                alt={selectedAccount}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        )}
                        <div className={styles.particles__container}>
                            {Array.from({ length: 20 }, (_, i) => (
                                <div key={i} className={`${styles.particle} ${styles[`particle__${i + 1}`]}`}></div>
                            ))}
                        </div>
                    </div>

                    <button
                        className={styles.redeem__button}
                        onClick={handleRedeem}
                        disabled={loading || !redeemCode || !selectedAccount}
                    >
                        {loading ? translations.buttonRedeeming[language] : translations.buttonRedeem[language]}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Redeem; 