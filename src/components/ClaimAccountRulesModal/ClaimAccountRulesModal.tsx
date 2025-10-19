import React, { useState } from 'react';
import styles from './ClaimAccountRulesModal.module.scss';
import { type ClaimAccountRulesModalProps, type RuleItem } from './ClaimAccountRulesModal.types';
import { useLanguage } from '../../contexts/LanguageContext';

const ClaimAccountRulesModal: React.FC<ClaimAccountRulesModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    username
}) => {
    const { t } = useLanguage();
    const [step, setStep] = useState<1 | 2>(1);
    const [rules, setRules] = useState<RuleItem[]>([
        {
            id: 1,
            text: {
                en: 'Insulting other players',
                es: 'Insultar a otros jugadores'
            },
            checked: false
        },
        {
            id: 2,
            text: {
                en: 'Negative comments (includes "ez", "?", "get better", etc.)',
                es: 'Comentarios negativos (incluye "ez", "?", "get better", etc.)'
            },
            checked: false
        },
        {
            id: 3,
            text: {
                en: 'Excessive pinging/tagging',
                es: 'Pings/menciones excesivas'
            },
            checked: false
        },
        {
            id: 4,
            text: {
                en: 'Sharing your login details with anyone',
                es: 'Compartir tus datos de inicio de sesión con nadie'
            },
            checked: false
        }
    ]);

    const [allowedRules, setAllowedRules] = useState([
        {
            id: 5,
            text: {
                en: 'Play any game mode you like (normals, ranked, URF, etc.)',
                es: 'Jugar cualquier modo de juego que quieras (normales, clasificatorias, URF, etc.)'
            },
            checked: false
        },
        {
            id: 6,
            text: {
                en: 'Add friends to play together',
                es: 'Agregar amigos para jugar juntos'
            },
            checked: false
        },
        {
            id: 7,
            text: {
                en: 'Log in whenever you want. Once you\'ve claimed the account, it\'s yours!',
                es: '¡Inicia sesión cuando quieras. Una vez que hayas reclamado la cuenta, es tuya!'
            },
            checked: false
        }
    ]);

    // Check if all rules are checked
    const allRulesChecked = rules.every(rule => rule.checked);

    if (!isOpen) return null;

    const handleCheckboxChange = (id: number) => {
        setRules(prevRules =>
            prevRules.map(rule =>
                rule.id === id ? { ...rule, checked: !rule.checked } : rule
            )
        );
    };

    const handleAllowedCheckboxChange = (id: number) => {
        setAllowedRules(prevRules =>
            prevRules.map(rule =>
                rule.id === id ? { ...rule, checked: !rule.checked } : rule
            )
        );
    };

    const handleNext = () => {
        if (allRulesChecked) {
            setStep(2);
        }
    };

    const handleConfirm = () => {
        onConfirm();
    };

    const handleClose = () => {
        // Reset state when closing
        setStep(1);
        setRules(prevRules => prevRules.map(rule => ({ ...rule, checked: false })));
        setAllowedRules(prevRules => prevRules.map(rule => ({ ...rule, checked: false })));
        onClose();
    };

    return (
        <div className={styles.modal__overlay}>
            <div className={styles.modal__content}>
                {/* Close button */}
                <button
                    className={styles.modal__close}
                    onClick={handleClose}
                    aria-label="Close"
                >
                    ✕
                </button>

                {step === 1 ? (
                    <>
                        {/* Step 1: Behavior Rules */}
                        <div className={styles.modal__header}>
                            <h2 className={styles.modal__title}>
                                {t('claimRules.behaviorRules')}
                            </h2>
                        </div>

                        <div className={styles.modal__body}>
                            {/* Not Allowed Section */}
                            <div className={styles.rules__section}>
                                <h3 className={styles.section__title}>
                                    {t('claimRules.notAllowed')}
                                </h3>
                                <div className={styles.rules__list}>
                                    {rules.map((rule) => (
                                        <label
                                            key={rule.id}
                                            className={`${styles.rule__item} ${!rule.checked ? styles.unchecked : ''}`}
                                        >
                                            <img
                                                src="/images/bullets/bullet-wrong.png"
                                                alt="Not allowed"
                                                className={styles.rule__icon}
                                            />
                                            <span className={styles.rule__text}>
                                                {String(rule.id).padStart(2, '0')}. {t(`claimRules.rules.notAllowed.${rule.id}`)}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={rule.checked}
                                                onChange={() => handleCheckboxChange(rule.id)}
                                                className={styles.checkbox__input}
                                            />
                                            <span className={`${styles.checkbox__custom} ${rule.checked ? styles.checked : ''}`}>
                                                {rule.checked && (
                                                    <svg viewBox="0 0 24 24" className={styles.checkbox__icon}>
                                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                    </svg>
                                                )}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Positive message */}
                            <div className={styles.positive__message}>
                                {t('claimRules.positiveMessage')}
                            </div>

                            {/* Allowed Section */}
                            <div className={styles.rules__section}>
                                <h3 className={styles.section__title}>
                                    {t('claimRules.allowed')}
                                </h3>
                                <div className={styles.rules__list}>
                                    {allowedRules.map((rule) => (
                                        <label
                                            key={rule.id}
                                            className={`${styles.allowed__item} ${!rule.checked ? styles.unchecked : ''}`}
                                        >
                                            <img
                                                src="/images/bullets/bullet-right.png"
                                                alt="Allowed"
                                                className={styles.rule__icon_allowed}
                                            />
                                            <span className={styles.rule__text}>
                                                {String(rule.id - 4).padStart(2, '0')}. {t(`claimRules.rules.allowed.${rule.id - 4}`)}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={rule.checked}
                                                onChange={() => handleAllowedCheckboxChange(rule.id)}
                                                className={styles.checkbox__input}
                                            />
                                            <span className={`${styles.checkbox__custom} ${rule.checked ? styles.checked : ''}`}>
                                                {rule.checked && (
                                                    <svg viewBox="0 0 24 24" className={styles.checkbox__icon}>
                                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                    </svg>
                                                )}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.modal__footer}>
                            <button
                                className={`${styles.modal__button} ${!allRulesChecked ? styles.disabled : ''}`}
                                onClick={handleNext}
                                disabled={!allRulesChecked}
                            >
                                {t('claimRules.next')}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Step 2: Consequences */}
                        <div className={styles.modal__header}>
                            <h2 className={styles.modal__title}>
                                {t('claimRules.consequences')}
                            </h2>
                        </div>

                        <div className={styles.modal__body}>
                            <div className={styles.consequences__content}>
                                <p className={styles.consequences__warning}>
                                    {t('claimRules.consequencesWarning')}
                                </p>

                                <p className={styles.consequences__welcome}>
                                    {t('claimRules.consequencesWelcome').replace('{username}', username)}
                                </p>

                                <p className={styles.consequences__benefit}>
                                    {t('claimRules.consequencesBenefit')}
                                </p>
                            </div>
                        </div>

                        <div className={styles.modal__footer}>
                            <button
                                className={styles.modal__button}
                                onClick={handleConfirm}
                            >
                                {t('claimRules.thankYou')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ClaimAccountRulesModal;

