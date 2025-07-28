import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCursor } from '../../contexts/CursorContext';
import styles from './CursorSelection.module.scss';

interface CursorSelectionProps {
    onCursorSelected?: (cursorId: string) => void;
}

interface Heart {
    id: number;
    x: number;
    y: number;
    type: number;
}

const CursorSelection: React.FC<CursorSelectionProps> = ({ onCursorSelected }) => {
    const navigate = useNavigate();
    const { setSelectedCursor } = useCursor();
    const [hearts, setHearts] = useState<Heart[]>([]);
    const [heartId, setHeartId] = useState(0);
    const [isPetting, setIsPetting] = useState(false);
    const [petCount, setPetCount] = useState(0);
    const [selectedCursorSet, setSelectedCursorSet] = useState<string | null>(null);

    const playPetSound = () => {
        const audio = new Audio('/sounds/pet-3-stage-1.mp3');
        audio.play().catch(error => console.log('Pet sound play failed:', error));
    };

    const spawnHeart = (event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const containerRect = event.currentTarget.closest(`.${styles.cursorSelection__content__crystalPet}`)?.getBoundingClientRect();

        if (containerRect) {
            const x = rect.left - containerRect.left + rect.width * 0.35;
            const y = rect.top - containerRect.top + 80;
            const heartType = Math.floor(Math.random() * 3) + 1;

            const newHeart: Heart = {
                id: heartId,
                x: x,
                y: y,
                type: heartType
            };

            setHearts(prev => [...prev, newHeart]);
            setHeartId(prev => prev + 1);

            // Remove heart after animation completes
            setTimeout(() => {
                setHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
            }, 2000);
        }
    };

    const handleCursorSetSelect = (cursorSet: string) => {
        setSelectedCursorSet(cursorSet);
        setPetCount(0); // Reset pet count when selecting a new cursor set
        
        // Test: Apply cursor immediately for testing
        setSelectedCursor(cursorSet);
        console.log(`Selected cursor set: ${cursorSet}`);
    };

    const handlePetClick = (event: React.MouseEvent) => {
        playPetSound();
        spawnHeart(event);

        // Trigger petting animation
        setIsPetting(true);
        setTimeout(() => {
            setIsPetting(false);
        }, 600); // Match the animation duration

        // Increment pet count
        const newPetCount = petCount + 1;
        setPetCount(newPetCount);

        // If pet count reaches 5, confirm cursor selection
        if (newPetCount >= 5) {
            if (onCursorSelected && selectedCursorSet) {
                onCursorSelected(selectedCursorSet);
            }
            // Apply the selected cursor globally
            if (selectedCursorSet) {
                setSelectedCursor(selectedCursorSet);
            }
            // Reset pet count after confirmation
            setPetCount(0);
            // Redirect to adoption page
            navigate('/adoption');
        }
    };

    return (
        <div className={styles.cursorSelection}>
            <div className={styles.cursorSelection__container}>
                <header className={styles.cursorSelection__header}>
                    <h1 className={styles.cursorSelection__title}>SELECT CURSOR</h1>
                    <p className={styles.cursorSelection__subtitle}>Choose your preferred cursor style</p>
                </header>

                <div className={styles.cursorSelection__content}>
                    <div className={styles.cursorSelection__content__framesContainer}>
                        <div className={styles.cursorSelection__content__framesRow}>
                            <div
                                className={`${styles.cursorSelection__content__frame} ${styles.frame1} ${selectedCursorSet === 'cursor-1' ? styles.selected : ''}`}
                                onClick={() => handleCursorSetSelect('cursor-1')}
                            >
                                <div className={styles.cursorSelection__content__frameContent}>
                                    <img src="/images/cursors/cursor-default-1.png" alt="Cursor 1" />
                                    <img src="/images/cursors/cursor-pointer-1.png" alt="Cursor 2" />
                                </div>
                            </div>
                            <div
                                className={`${styles.cursorSelection__content__frame} ${styles.frame2} ${selectedCursorSet === 'cursor-2' ? styles.selected : ''}`}
                                onClick={() => handleCursorSetSelect('cursor-2')}
                            >
                                <div className={styles.cursorSelection__content__frameContent}>
                                    <img src="/images/cursors/cursor-default-2.png" alt="Cursor 1" />
                                    <img src="/images/cursors/cursor-pointer-2.png" alt="Cursor 2" />
                                </div>
                            </div>
                        </div>
                        <div className={styles.cursorSelection__content__framesRow}>
                            <div
                                className={`${styles.cursorSelection__content__frame} ${styles.frame3} ${selectedCursorSet === 'cursor-3' ? styles.selected : ''}`}
                                onClick={() => handleCursorSetSelect('cursor-3')}
                            >
                                <div className={styles.cursorSelection__content__frameContent}>
                                    <img src="/images/cursors/cursor-default-3.png" alt="Cursor 1" />
                                    <img src="/images/cursors/cursor-pointer-3.png" alt="Cursor 2" />
                                </div>
                            </div>
                            <div
                                className={`${styles.cursorSelection__content__frame} ${styles.frame4} ${selectedCursorSet === 'cursor-4' ? styles.selected : ''}`}
                                onClick={() => handleCursorSetSelect('cursor-4')}
                            >
                                <div className={styles.cursorSelection__content__frameContent}>
                                    <img src="/images/cursors/cursor-default-4.png" alt="Cursor 1" />
                                    <img src="/images/cursors/cursor-pointer-4.png" alt="Cursor 2" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.cursorSelection__content__crystalPet}>
                        <img src="/images/pets/crystal-pet-3sparkles.png" alt="Crystal Pet Sparkles" className={styles.cursorSelection__content__crystalPet__sparkles} />
                        <img
                            src="/images/pets/crystal-pet-3.png"
                            alt="Crystal Pet"
                            className={`${styles.cursorSelection__content__crystalPet__pet} ${isPetting ? styles.petting : ''}`}
                            onClick={handlePetClick}
                            style={{ cursor: 'pointer' }}
                        />
                        <img src="/images/pets/crystal-pet-3-shadow.png" alt="Crystal Pet Shadow" className={styles.cursorSelection__content__crystalPet__shadow} />

                        {/* Render hearts */}
                        {hearts.map(heart => (
                            <div
                                key={heart.id}
                                className={styles.heart}
                                style={{
                                    left: heart.x,
                                    top: heart.y,
                                }}
                            >
                                <img
                                    src={`/images/icons/love-icon-${heart.type}.png`}
                                    alt="heart"
                                />
                            </div>
                        ))}

                        {/* Pet instruction text */}
                        <div className={styles.cursorSelection__content__crystalPet__instruction}>
                            <p>
                                {selectedCursorSet
                                    ? `Pet me ${5 - petCount} times to confirm cursor`
                                    : 'Select a cursor set first'
                                }
                            </p>
                        </div>
                        
                        {/* Debug: Test cursor button */}
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <button 
                                onClick={() => {
                                    console.log('Current body classes:', document.body.className);
                                    console.log('Current data-cursor:', document.body.getAttribute('data-cursor'));
                                    console.log('Selected cursor set:', selectedCursorSet);
                                    
                                    // Test if cursor images are loading
                                    const testDefaultImage = new Image();
                                    testDefaultImage.onload = () => console.log('✅ Default cursor image loaded successfully');
                                    testDefaultImage.onerror = () => console.log('❌ Default cursor image failed to load');
                                    testDefaultImage.src = '/images/cursors/resized/cursor-default-4.png';
                                    
                                    const testPointerImage = new Image();
                                    testPointerImage.onload = () => console.log('✅ Pointer cursor image loaded successfully');
                                    testPointerImage.onerror = () => console.log('❌ Pointer cursor image failed to load');
                                    testPointerImage.src = '/images/cursors/resized/cursor-pointer-4.png';
                                }}
                                style={{ 
                                    padding: '10px 20px', 
                                    backgroundColor: '#c89b3c', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Debug: Check Cursor Status
                            </button>
                            <button 
                                onClick={() => {
                                    document.body.classList.remove('cursor-1', 'cursor-2', 'cursor-3', 'cursor-4', 'cursor-default');
                                    document.body.removeAttribute('data-cursor');
                                    document.body.classList.add('cursor-test');
                                    console.log('Applied test cursor (crosshair)');
                                }}
                                style={{ 
                                    padding: '10px 20px', 
                                    backgroundColor: '#ff00ff', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    marginLeft: '10px'
                                }}
                            >
                                Test: Apply Crosshair Cursor
                            </button>
                            <button 
                                onClick={() => {
                                    document.body.classList.remove('cursor-1', 'cursor-2', 'cursor-3', 'cursor-4', 'cursor-default', 'cursor-test');
                                    document.body.removeAttribute('data-cursor');
                                    document.body.classList.add('cursor-1');
                                    document.body.setAttribute('data-cursor', 'cursor-1');
                                    console.log('Applied cursor-1 directly');
                                }}
                                style={{ 
                                    padding: '10px 20px', 
                                    backgroundColor: '#ff0000', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    marginLeft: '10px'
                                }}
                            >
                                Test: Apply Cursor-1 Directly
                            </button>
                            <button 
                                onClick={() => {
                                    document.body.classList.remove('cursor-1', 'cursor-2', 'cursor-3', 'cursor-4', 'cursor-default', 'cursor-test', 'cursor-1-alt', 'cursor-2-alt', 'cursor-3-alt', 'cursor-4-alt');
                                    document.body.removeAttribute('data-cursor');
                                    document.body.classList.add('cursor-1-alt');
                                    console.log('Applied cursor-1-alt (with crosshair fallback)');
                                }}
                                style={{ 
                                    padding: '10px 20px', 
                                    backgroundColor: '#ff6600', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    marginLeft: '10px'
                                }}
                            >
                                Test: Cursor-1 with Crosshair Fallback
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CursorSelection; 