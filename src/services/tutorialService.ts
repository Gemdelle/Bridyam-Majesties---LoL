export interface TutorialState {
  hasSeenTutorial: boolean;
  currentStep: number;
  currentSection: string;
  selectedPet?: {
    id: string;
    name: string;
    imageSrc: string;
    rarity: string;
    petName?: string;
    petNumber?: number;
  };
}

const TUTORIAL_STORAGE_KEY = 'bridyam_tutorial_state';

export const tutorialService = {
  // Get tutorial state from localStorage
  getTutorialState(): TutorialState {
    try {
      const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading tutorial state from localStorage:', error);
    }
    
    // Default state for new users
    return {
      hasSeenTutorial: false,
      currentStep: 0,
      currentSection: 'accounts'
    };
  },

  // Save tutorial state to localStorage
  saveTutorialState(state: TutorialState): void {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving tutorial state to localStorage:', error);
    }
  },

  // Mark tutorial as completed
  completeTutorial(): void {
    const state = this.getTutorialState();
    state.hasSeenTutorial = true;
    state.currentStep = 0;
    state.currentSection = 'accounts';
    this.saveTutorialState(state);
  },

  // Save selected pet
  saveSelectedPet(pet: { id: string; name: string; imageSrc: string; rarity: string; petName?: string; petNumber?: number }): void {
    const state = this.getTutorialState();
    state.selectedPet = pet;
    this.saveTutorialState(state);
  },

  // Get selected pet
  getSelectedPet(): { id: string; name: string; imageSrc: string; rarity: string; petName?: string; petNumber?: number } | null {
    const state = this.getTutorialState();
    return state.selectedPet || null;
  },

  // Update current step
  updateStep(step: number, section: string): void {
    const state = this.getTutorialState();
    state.currentStep = step;
    state.currentSection = section;
    this.saveTutorialState(state);
  },

  // Reset tutorial (for testing or if user wants to see it again)
  resetTutorial(): void {
    const state = this.getTutorialState();
    state.hasSeenTutorial = false;
    state.currentStep = 0;
    state.currentSection = 'accounts';
    this.saveTutorialState(state);
  },

  // Check if user should see tutorial
  shouldShowTutorial(): boolean {
    const state = this.getTutorialState();
    return !state.hasSeenTutorial;
  }
}; 