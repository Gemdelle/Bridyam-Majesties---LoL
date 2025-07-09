import React, { useState } from 'react';
import styles from './Redeem.module.scss';

const Redeem: React.FC = () => {
    const [redeemCode, setRedeemCode] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');

    const handleRedeem = () => {
        if (!redeemCode.trim()) {
            alert('Please enter a redeem code');
            return;
        }
        if (!selectedAccount) {
            alert('Please select a majesty account');
            return;
        }

        // Here you would typically make an API call to redeem the code
        alert(`Redeeming code "${redeemCode}" for account "${selectedAccount}"`);
    };

    return (
        <div className={styles.redeem}>
            <div className={styles.redeem__container}>
                <header className={styles.redeem__header}>
                    <h1 className={styles.redeem__title}>Redeem</h1>
                    <p className={styles.redeem__subtitle}>Exchange your essence and rewards</p>
                </header>

                <div className={styles.redeem__content}>
                    <div className={styles.redeem__form}>
                        <div className={styles.input__group}>
                            <label htmlFor="redeemCode" className={styles.input__label}>
                                Redeem Code
                            </label>
                            <input
                                type="text"
                                id="redeemCode"
                                className={styles.input__field}
                                placeholder="Enter your redeem code here..."
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value)}
                            />
                        </div>

                        <div className={styles.input__group}>
                            <label htmlFor="majestyAccount" className={styles.input__label}>
                                Select Majesty Account
                            </label>
                            <select
                                id="majestyAccount"
                                className={styles.input__select}
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                            >
                                <option value="" disabled>Choose an account...</option>
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
                        </div>

                        <button className={styles.redeem__button} onClick={handleRedeem}>
                            Redeem Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Redeem; 