import React, { useState, useEffect } from 'react';
import styles from './CacheStatus.module.scss';
import { masteryCacheService } from '../../services/masteryCacheService';

const CacheStatus: React.FC = () => {
    const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

    useEffect(() => {
        // Actualizar el tiempo restante cada segundo
        const updateTime = () => {
            const formatted = masteryCacheService.getFormattedTimeUntilRefresh();
            setTimeRemaining(formatted);
        };

        // Actualizar inmediatamente
        updateTime();

        // Actualizar cada segundo
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    // No mostrar nada si no hay tiempo (caché vacía)
    if (!timeRemaining) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.icon}>🔄</div>
            <div className={styles.text}>
                <span className={styles.label}>Next update in:</span>
                <span className={styles.time}>{timeRemaining}</span>
            </div>
        </div>
    );
};

export default CacheStatus;

