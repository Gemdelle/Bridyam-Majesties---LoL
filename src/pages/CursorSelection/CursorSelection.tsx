import React from 'react';
import styles from './CursorSelection.module.scss';

interface CursorSelectionProps {
    onCursorSelected?: (cursorId: string) => void;
}

const CursorSelection: React.FC<CursorSelectionProps> = ({ onCursorSelected }) => {
    return (
        <div className={styles.cursorSelection}>
            <div className={styles.cursorSelection__container}>
                <header className={styles.cursorSelection__header}>
                    <h1 className={styles.cursorSelection__title}>SELECT CURSOR</h1>
                    <p className={styles.cursorSelection__subtitle}>Choose your preferred cursor style</p>
                </header>

                <div className={styles.cursorSelection__content}>
                    {/* Content will be added here */}
                </div>
            </div>
        </div>
    );
};

export default CursorSelection; 