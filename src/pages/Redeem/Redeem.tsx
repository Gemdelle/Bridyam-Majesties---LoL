import React, { useState } from 'react';
import styles from './Redeem.module.scss';
import { claimService } from '../../services/claimService';
import { useAuthContext } from '../../contexts/AuthContext';

const Redeem: React.FC = () => {
    const { refreshProfile } = useAuthContext();
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
                console.log('Claim successful, refreshing profile...');
                
                // Refresh user profile to update rankedUsernames permissions
                await refreshProfile();
                
                console.log('Profile refreshed, permissions updated');
                
                setSuccess(`¡Cuenta "${result.rankedUsername}" reclamada exitosamente! Permisos actualizados.`);
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
                                <option value="GEM Dreemurdomme#GEM">GEM Dreemurdomme#GEM</option>
                                <option value="GEM Stridellarea#GEM">GEM Stridellarea#GEM</option>
                                <option value="GEM Cordacrimory#GEM">GEM Cordacrimory#GEM</option>
                                <option value="GEM Hestiarethe#GEM">GEM Hestiarethe#GEM</option>
                                <option value="GEM Arminariknot#GEM">GEM Arminariknot#GEM</option>
                                <option value="GEM Orzyadhere#LAS">GEM Orzyadhere#LAS</option>
                                <option value="GEM Purselgarmet#LAS">GEM Purselgarmet#LAS</option>
                                <option value="GEM Rothroyaume#GEM">GEM Rothroyaume#GEM</option>
                                <option value="GEM Furninscorce#GEM">GEM Furninscorce#GEM</option>
                                <option value="GEM Arklyndarce#GEM">GEM Arklyndarce#GEM</option>
                                <option value="GEM Brincellezha#GEM">GEM Brincellezha#GEM</option>
                                <option value="GEM Primrosenrot#GEM">GEM Primrosenrot#GEM</option>
                                <option value="GEM Deellycella#GEM">GEM Deellycella#GEM</option>
                                <option value="GEM Eunilacealle#LAS">GEM Eunilacealle#LAS</option>
                                <option value="GEM Regimbudlair#GEM">GEM Regimbudlair#GEM</option>
                                <option value="GEM Lacellire#LAS">GEM Lacellire#LAS</option>
                                <option value="GEM PelsNpurmips#GEM">GEM PelsNpurmips#GEM</option>
                                <option value="GEM Priscyumice#GEM">GEM Priscyumice#GEM</option>
                                <option value="GEM Buddelizeth#GEM">GEM Buddelizeth#GEM</option>
                                <option value="GEM Depurallire#GEM">GEM Depurallire#GEM</option>
                                <option value="GEM Lagrimelle#GEM">GEM Lagrimelle#GEM</option>
                                <option value="GEM Damglantine#GEM">GEM Damglantine#GEM</option>
                                <option value="GEM Glacelynne#GEM">GEM Glacelynne#GEM</option>
                                <option value="GEM Bricellice#GEM">GEM Bricellice#GEM</option>
                                <option value="GEM Deestellirys#GEM">GEM Deestellirys#GEM</option>
                                <option value="GEM Lahallayd#GEM">GEM Lahallayd#GEM</option>
                                <option value="GEM Ivelism#GEM">GEM Ivelism#GEM</option>
                                <option value="GEM Blaandelvals#GEM">GEM Blaandelvals#GEM</option>
                                <option value="GEM Vaelardorcel#GEM">GEM Vaelardorcel#GEM</option>
                                <option value="GEM Envicingess#GEM">GEM Envicingess#GEM</option>
                                <option value="GEM Velchelisse#GEM">GEM Velchelisse#GEM</option>
                                <option value="GEM Plissevelary#GEM">GEM Plissevelary#GEM</option>
                                <option value="GEM Lageldrynne#GEM">GEM Lageldrynne#GEM</option>
                                <option value="GEM Auzglades#GEM">GEM Auzglades#GEM</option>
                                <option value="GEM Vespianelian#GEM">GEM Vespianelian#GEM</option>
                                <option value="GEM Greedgardell#GEM">GEM Greedgardell#GEM</option>
                                <option value="GEM Praireclovia#GEM">GEM Praireclovia#GEM</option>
                                <option value="GEM Asticedicair#GEM">GEM Asticedicair#GEM</option>
                                <option value="GEM Dellablivien#GEM">GEM Dellablivien#GEM</option>
                                <option value="GEM Vrilyarethez#GEM">GEM Vrilyarethez#GEM</option>
                                <option value="GEM Irzeleriance#LAS">GEM Irzeleriance#LAS</option>
                                <option value="GEM Phrasimfasya#GEM">GEM Phrasimfasya#GEM</option>
                                <option value="GEM Gallilessya#GEM">GEM Gallilessya#GEM</option>
                                <option value="GEM Debranice#GEM">GEM Debranice#GEM</option>
                                <option value="GEM Gliecernice#GEM">GEM Gliecernice#GEM</option>
                                <option value="GEM Cierzellant#GEM">GEM Cierzellant#GEM</option>
                                <option value="GEM Golzendants#GEM">GEM Golzendants#GEM</option>
                                <option value="GEM Argyndorness#GEM">GEM Argyndorness#GEM</option>
                                <option value="GEM Ornetchreans#GEM">GEM Ornetchreans#GEM</option>
                                <option value="GEM Veldraveth#GEM">GEM Veldraveth#GEM</option>
                                <option value="GEM Deliquesence#LAS">GEM Deliquesence#LAS</option>
                                <option value="GEM Religerness#GEM">GEM Religerness#GEM</option>
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