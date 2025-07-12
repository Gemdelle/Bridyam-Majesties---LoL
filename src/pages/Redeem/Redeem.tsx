import React, { useState } from 'react';
import styles from './Redeem.module.scss';
import { claimService } from '../../services/claimService';

const Redeem: React.FC = () => {
    const [redeemCode, setRedeemCode] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleRedeem = async () => {
        setError(null);
        setSuccess(null);

        // Validate input data
        const validationErrors = claimService.validateClaimData(redeemCode, selectedAccount);
        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
        }

        setLoading(true);

        try {
            const result = await claimService.claimAccount({
                code: redeemCode,
                rankedUsername: selectedAccount
            });

            if (result.success) {
                setSuccess(`¡Cuenta "${result.rankedUsername}" reclamada exitosamente!`);
                setRedeemCode('');
                setSelectedAccount('');
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

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length <= 8) {
            setRedeemCode(value);
        }
    };

    return (
        <div className={styles.redeem}>
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
                                disabled={loading}
                            >
                                <option value="" disabled>Elige una cuenta...</option>
                                <option value="GEM Arminariknot#GEM">GEM Arminariknot#GEM</option>
                                <option value="GEM Cordacrimory#GEM">GEM Cordacrimory#GEM</option>
                                <option value="GEM Dreemurdomme#GEM">GEM Dreemurdomme#GEM</option>
                                <option value="GEM Hestiarethe#GEM">GEM Hestiarethe#GEM</option>
                                <option value="GEM Orzyadhere#GEM">GEM Orzyadhere#GEM</option>
                                <option value="GEM Purselgarmet#GEM">GEM Purselgarmet#GEM</option>
                                <option value="GEM Rothroyaume#GEM">GEM Rothroyaume#GEM</option>
                                <option value="GEM Stridellarea#GEM">GEM Stridellarea#GEM</option>
                                <option value="GEM Brincelleza#GEM">GEM Brincelleza#GEM</option>
                                <option value="GEM Deellycella#GEM">GEM Deellycella#GEM</option>
                                <option value="GEM Eunilacealle#GEM">GEM Eunilacealle#GEM</option>
                                <option value="GEM Lacellire#GEM">GEM Lacellire#GEM</option>
                                <option value="GEM PelsNpurmips#GEM">GEM PelsNpurmips#GEM</option>
                                <option value="GEM Primrosenrot#GEM">GEM Primrosenrot#GEM</option>
                                <option value="GEM Priscyumice#GEM">GEM Priscyumice#GEM</option>
                            </select>
                            <small className={styles.input__hint}>
                                Selecciona la cuenta ranked que deseas reclamar
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