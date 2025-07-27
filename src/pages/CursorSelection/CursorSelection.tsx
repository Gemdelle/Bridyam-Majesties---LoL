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
                    <div className={styles.cursorSelection__content__framesContainer}>
                        <div className={styles.cursorSelection__content__frame}>
                            <img src="/images/frames/cursor-frame-1.png" alt="Cursor Frame 1" />
                            <div className={styles.cursorSelection__content__frameContent}>
                                <img src="/images/cursors/cursor-default-1.png" alt="Cursor 1" />
                                <img src="/images/cursors/cursor-pointer-1.png" alt="Cursor 2" />
                            </div>
                        </div>
                        <div className={styles.cursorSelection__content__frame}>
                            <img src="/images/frames/cursor-frame-2.png" alt="Cursor Frame 2" />
                            <div className={styles.cursorSelection__content__frameContent}>
                                <img src="/images/cursors/cursor-default-2.png" alt="Cursor 1" />
                                <img src="/images/cursors/cursor-pointer-2.png" alt="Cursor 2" />
                            </div>
                        </div>
                        <div className={styles.cursorSelection__content__frame}>
                            <img src="/images/frames/cursor-frame-3.png" alt="Cursor Frame 3" />
                            <div className={styles.cursorSelection__content__frameContent}>
                                <img src="/images/cursors/cursor-default-3.png" alt="Cursor 1" />
                                <img src="/images/cursors/cursor-pointer-3.png" alt="Cursor 2" />
                            </div>
                        </div>
                        <div className={styles.cursorSelection__content__frame}>
                            <img src="/images/frames/cursor-frame-4.png" alt="Cursor Frame 4" />
                            <div className={styles.cursorSelection__content__frameContent}>
                                <img src="/images/cursors/cursor-default-4.png" alt="Cursor 1" />
                                <img src="/images/cursors/cursor-pointer-4.png" alt="Cursor 2" />
                            </div>
                        </div>
                    </div>
                    <div className={styles.cursorSelection__content__crystalPet}>
                        {/* CrystalPet will be added here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CursorSelection; 