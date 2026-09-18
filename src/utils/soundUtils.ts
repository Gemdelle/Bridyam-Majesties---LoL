/**
 * Utility functions for playing UI sounds
 */

/**
 * Plays the click sound for buttons
 */
export const playClickSound = (): void => {
    try {
        const clickSound = new Audio('/sounds/UI/click.wav');
        clickSound.volume = 0.7; // Adjust volume if needed
        clickSound.play().catch(error => {
            console.error('Error playing click sound:', error);
        });
    } catch (error) {
        console.error('Error creating click sound:', error);
    }
};

/**
 * Plays the achievement sound
 */
export const playAchievementSound = (): void => {
    try {
        const achievementSound = new Audio('/sounds/UI/achievement.wav');
        achievementSound.volume = 0.7; // Adjust volume if needed
        achievementSound.play().catch(error => {
            console.error('Error playing achievement sound:', error);
        });
    } catch (error) {
        console.error('Error creating achievement sound:', error);
    }
};

/**
 * Plays the notification sound
 */
export const playNotificationSound = (): void => {
    try {
        const notificationSound = new Audio('/sounds/UI/notification.wav');
        notificationSound.volume = 0.7; // Adjust volume if needed
        notificationSound.play().catch(error => {
            console.error('Error playing notification sound:', error);
        });
    } catch (error) {
        console.error('Error creating notification sound:', error);
    }
};

/**
 * Plays the progress click sound (for ranked/mastery progress buttons)
 */
export const playProgressClickSound = (): void => {
    try {
        const progressSound = new Audio('/sounds/UI/progress-click.mp3');
        progressSound.volume = 0.7;
        progressSound.play().catch(error => {
            console.error('Error playing progress sound:', error);
        });
    } catch (error) {
        console.error('Error creating progress sound:', error);
    }
};

/**
 * Plays the petting / love sound used in Garden and adoption.
 */
export const playPettingSound = (petType?: string | number): void => {
    try {
        const type = Number(petType) || 0;
        const src =
            type >= 1 && type <= 4
                ? `/sounds/pet-${type}-stage-1.mp3`
                : '/sounds/petting.mp3';
        const audio = new Audio(src);
        audio.volume = 0.85;
        audio.play().catch(() => {
            const fallback = new Audio('/sounds/petting.mp3');
            fallback.volume = 0.85;
            fallback.play().catch(() => undefined);
        });
    } catch {
        /* ignore */
    }
};

