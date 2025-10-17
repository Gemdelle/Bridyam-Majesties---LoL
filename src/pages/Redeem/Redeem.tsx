import React, { useState, useEffect } from 'react';
import styles from './Redeem.module.scss';
import { claimService } from '../../services/claimService';
import { useAuthContext } from '../../contexts/AuthContext';
import { fetchAvailableRankedAccounts, type RankedData } from '../../services/apiRankedsService';
import ClaimAccountRulesModal from '../../components/ClaimAccountRulesModal/ClaimAccountRulesModal';

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

    useEffect(() => {
        const loadAvailableAccounts = async () => {
            try {
                setLoadingAccounts(true);
                const accounts = await fetchAvailableRankedAccounts();
                setAvailableAccounts(accounts);
            } catch (error) {
                console.error('Error loading available accounts:', error);
                setError('Error al cargar las cuentas disponibles');
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
                
                setSuccess(`¡Cuenta "${result.rankedUsername}" reclamada exitosamente! Permisos actualizados.`);
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
            setError('Error inesperado. Por favor, intenta de nuevo.');
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
            />
            <div className={styles.redeem__container}>
                <header className={styles.redeem__header}>
                    <h1 className={styles.redeem__title}>Redeem</h1>
                    <p className={styles.redeem__subtitle}>Reclamar cuenta ranked con código</p>
                </header>

                <div className={styles.redeem__content}>
                    <div className={styles.redeem__form}>
                        <div className={styles.input__group}>
                            <label htmlFor="redeemCode" className={styles.input__label}>
                                Código de Reclamación (8 caracteres)
                            </label>
                            <input
                                type="text"
                                id="redeemCode"
                                className={styles.input__field}
                                placeholder="Ej: ABC12345"
                                value={redeemCode}
                                onChange={handleCodeChange}
                                maxLength={8}
                                disabled={loading}
                            />
                            <small className={styles.input__hint}>
                                Ingresa el código alfanumérico de 8 caracteres
                            </small>
                        </div>

                        <div className={styles.input__group}>
                            <label htmlFor="majestyAccount" className={styles.input__label}>
                                Seleccionar Cuenta Majesty
                            </label>
                            <select
                                id="majestyAccount"
                                className={styles.input__select}
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                disabled={loading || loadingAccounts}
                            >
                                <option value="" disabled>
                                    {loadingAccounts ? 'Cargando cuentas...' : 'Elige una cuenta...'}
                                </option>
                                {availableAccounts.map((account) => (
                                    <option key={account.id} value={account.username}>
                                        {account.username}
                                    </option>
                                ))}
                            </select>
                            <small className={styles.input__hint}>
                                {loadingAccounts 
                                    ? 'Cargando cuentas disponibles...' 
                                    : availableAccounts.length > 0 
                                        ? 'Selecciona la cuenta ranked que deseas reclamar'
                                        : 'No hay cuentas disponibles en este momento'
                                }
                            </small>
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

                        <button 
                            className={styles.redeem__button} 
                            onClick={handleRedeem}
                            disabled={loading || !redeemCode || !selectedAccount}
                        >
                            {loading ? 'Reclamando...' : 'Reclamar Cuenta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Redeem; 