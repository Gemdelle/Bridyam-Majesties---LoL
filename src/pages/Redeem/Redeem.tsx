import React, { useState, useEffect } from 'react';
import styles from './Redeem.module.scss';
import { claimService } from '../../services/claimService';
import { useAuthContext } from '../../contexts/AuthContext';
import { fetchAvailableRankedAccounts, type RankedData } from '../../services/apiRankedsService';
import ClaimAccountRulesModal from '../../components/ClaimAccountRulesModal/ClaimAccountRulesModal';
import { useLanguage } from '../../contexts/LanguageContext';

const Redeem: React.FC = () => {
    const { refreshProfile, user } = useAuthContext();
    const { t } = useLanguage();
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
                setError(t('redeem.errorLoading'));
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

                setSuccess(t('redeem.successMessage').replace('{username}', result.rankedUsername || ''));
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
            setError(t('redeem.errorUnexpected'));
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
                <div className={styles.redeem__form}>
                    <div className={styles.input__group}>
                        <label htmlFor="redeemCode" className={styles.input__label}>
                            {t('redeem.codeLabel')}
                        </label>
                        <small className={styles.input__hint}>
                            {t('redeem.codeHint')}
                        </small>
                        <input
                            type="text"
                            id="redeemCode"
                            className={styles.input__field}
                            placeholder={t('redeem.codePlaceholder')}
                            value={redeemCode}
                            onChange={handleCodeChange}
                            maxLength={8}
                            disabled={loading}
                        />

                    </div>

                    <div className={styles.dropdown__group}>
                        <label htmlFor="majestyAccount" className={styles.input__label}>
                            {t('redeem.accountLabel')}
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
                                {loadingAccounts ? t('redeem.accountLoading') : t('redeem.accountChoose')}
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
                        {loading ? t('redeem.buttonRedeeming') : t('redeem.buttonRedeem')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Redeem; 