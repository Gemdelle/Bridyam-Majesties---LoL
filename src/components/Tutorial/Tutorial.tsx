import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tutorialService } from '../../services/tutorialService';
import { usePetContext } from '../../contexts/PetContext';
import { useAuthContext } from '../../contexts/AuthContext';
import type { TutorialState } from '../../services/tutorialService';
import styles from './Tutorial.module.scss';
import './Tutorial.global.scss';

interface TutorialStep {
  section: string;
  title: string;
  message: string;
  highlightNav?: string;
  navigateTo?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    section: 'accounts',
    title: '¡Bienvenido a tu Cuenta!',
    message: 'Aquí podrás ver y gestionar todas tus cuentas de League of Legends. Puedes agregar múltiples cuentas, ver sus estadísticas y configurar tus preferencias.',
    highlightNav: 'accounts',
    navigateTo: '/bloodlines'
  },
  {
    section: 'bloodlines',
    title: 'Líneas de Sangre',
    message: 'En esta sección podrás explorar las diferentes líneas de sangre de los campeones. Cada línea tiene sus propias características y poderes únicos.',
    highlightNav: 'bloodlines',
    navigateTo: '/ranked'
  },
  {
    section: 'ranked',
    title: 'Ranked y Progreso',
    message: 'Aquí podrás ver tu progreso en ranked, tus misiones y logros. Mantén un seguimiento de tu evolución como jugador.',
    highlightNav: 'ranked',
    navigateTo: '/champions'
  },
  {
    section: 'champions',
    title: 'Campeones',
    message: 'Explora todos los campeones disponibles, sus habilidades y estadísticas. Encuentra tu campeón favorito.',
    highlightNav: 'champions',
    navigateTo: '/achievements'
  },
  {
    section: 'achievements',
    title: 'Logros',
    message: 'Desbloquea logros especiales y recompensas. Completa desafíos únicos para mostrar tu maestría.',
    highlightNav: 'achievements',
    navigateTo: '/redeem'
  },
  {
    section: 'redeem',
    title: 'Canjear Recompensas',
    message: 'Canjea tus puntos y recompensas por items especiales. ¡Aprovecha al máximo tu progreso!',
    highlightNav: 'redeem'
  }
];

const Tutorial: React.FC = () => {
  const [tutorialState, setTutorialState] = useState<TutorialState>(tutorialService.getTutorialState());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [highlightElement, setHighlightElement] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const typingTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPet: contextPet } = usePetContext();
  const { isAuthenticated } = useAuthContext();
  
  // Get pet from localStorage (persistent) or context (current session)
  const selectedPet = tutorialService.getSelectedPet() || contextPet;

  useEffect(() => {
    // Check if we should show tutorial and user is authenticated
    if (!tutorialService.shouldShowTutorial() || !isAuthenticated) {
      return;
    }

    // Only start tutorial on home page
    const currentPath = location.pathname;
    
    // If we're not on home page and tutorial hasn't started yet, don't show it
    if (currentPath !== '/' && currentStepIndex === 0) {
      return;
    }

    // Find the current step based on the current page
    let stepIndex = 0; // Default to first step

    if (currentPath === '/') {
      stepIndex = 0; // Home/Accounts step
    } else if (currentPath === '/accounts') {
      stepIndex = 0; // Accounts step (same as home)
    } else if (currentPath === '/bloodlines') {
      stepIndex = 1; // Bloodlines step
    } else if (currentPath === '/ranked') {
      stepIndex = 2; // Ranked step
    } else if (currentPath === '/champions') {
      stepIndex = 3; // Champions step
    } else if (currentPath === '/achievements') {
      stepIndex = 4; // Achievements step
    } else if (currentPath === '/redeem') {
      stepIndex = 5; // Redeem step
    }

    // Only update if the step index is different to avoid loops
    if (stepIndex !== currentStepIndex) {
      setCurrentStepIndex(stepIndex);
    }
  }, [location.pathname, isAuthenticated]);

  // Typing animation effect
  useEffect(() => {
    // Only apply typing animation if tutorial should show and user is authenticated
    if (!tutorialService.shouldShowTutorial() || !isAuthenticated) {
      return;
    }

    const currentStep = tutorialSteps[currentStepIndex];
    if (!currentStep) return;

    // Clear any existing animation immediately
    setIsTyping(false);
    setDisplayedText('');

    // Longer delay to ensure clean state and prevent overlap
    const startTimer = setTimeout(() => {
      setIsTyping(true);
      setDisplayedText('');

      let currentIndex = 0;
      const text = currentStep.message;
      const typingSpeed = 50; // milliseconds per character

      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
          const nextTimer = setTimeout(typeNextChar, typingSpeed);
          typingTimerRef.current = nextTimer;
        } else {
          setIsTyping(false);
          typingTimerRef.current = null;
        }
      };

      const initialTimer = setTimeout(typeNextChar, 500); // Start typing after 500ms
      typingTimerRef.current = initialTimer;
    }, 200); // Reduced delay since we're clearing timers immediately

    return () => {
      clearTimeout(startTimer);
      // Also clear typing state when effect is cleaned up
      setIsTyping(false);
      setDisplayedText('');
    };
  }, [currentStepIndex, location.pathname]);

  // Highlight effect for navigation elements
  useEffect(() => {
    // Only apply highlighting if tutorial should show and user is authenticated
    if (!tutorialService.shouldShowTutorial() || !isAuthenticated) {
      return;
    }

    const currentStep = tutorialSteps[currentStepIndex];
    if (!currentStep?.highlightNav) return;

    // Set the element to highlight
    setHighlightElement(currentStep.highlightNav);

    // Find and highlight the navigation element
    const navElement = document.querySelector(`[data-nav="${currentStep.highlightNav}"]`);
    if (navElement) {
      navElement.classList.add('tutorial-highlight');
      
      // Position the spotlight on the highlighted element
      const rect = navElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      document.documentElement.style.setProperty('--highlight-x', `${centerX}px`);
      document.documentElement.style.setProperty('--highlight-y', `${centerY}px`);
    }

    return () => {
      // Remove highlight when component unmounts or step changes
      if (navElement) {
        navElement.classList.remove('tutorial-highlight');
      }
    };
  }, [currentStepIndex, location.pathname]);

  const handleNext = () => {
    if (isNavigating || isClearing) return; // Prevent multiple clicks
    
    // Immediately stop any ongoing typing animation
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    // Immediately clear text to prevent overlap
    setIsClearing(true);
    setIsTyping(false);
    setDisplayedText('');
    
    const currentStep = tutorialSteps[currentStepIndex];
    
    // Check if we're at the last step
    if (currentStepIndex >= tutorialSteps.length - 1) {
      // Tutorial completed
      tutorialService.completeTutorial();
      setTutorialState(tutorialService.getTutorialState());
      setIsClearing(false);
      return;
    }

    // Move to next step first
    const nextStepIndex = currentStepIndex + 1;
    
    // Update tutorial state
    tutorialService.updateStep(nextStepIndex, currentStep.section);
    setTutorialState(tutorialService.getTutorialState());

    // Navigate to next section if needed
    if (currentStep?.navigateTo) {
      setIsNavigating(true);
      navigate(currentStep.navigateTo);
      
      // Update step index immediately after navigation
      setTimeout(() => {
        setCurrentStepIndex(nextStepIndex);
        setIsClearing(false);
        setIsNavigating(false);
      }, 100);
    } else {
      // No navigation needed, just update step immediately
      setCurrentStepIndex(nextStepIndex);
      setIsClearing(false);
    }
  };

  const handleSkip = () => {
    // Immediately stop any ongoing typing animation
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    // Immediately clear typing animation
    setIsTyping(false);
    setDisplayedText('');
    
    tutorialService.completeTutorial();
    setTutorialState(tutorialService.getTutorialState());
  };

  // Don't render if tutorial is completed, user is not authenticated, or we're on auth pages
  if (tutorialState.hasSeenTutorial || !isAuthenticated || location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/cursor-selection' || location.pathname === '/adoption') {
    return null;
  }

  const currentStep = tutorialSteps[currentStepIndex];
  const isLastStep = currentStepIndex === tutorialSteps.length - 1;

  return (
    <>
      {/* Overlay with highlight */}
      <div className={styles.tutorialOverlay}>
        {highlightElement && (
          <div className={styles.highlightSpotlight} />
        )}
      </div>

      <div className={styles.tutorialContainer}>
        {/* Pet Portrait */}
        <div className={styles.petPortrait}>
          {selectedPet && (
            <div className={styles.petImageContainer}>
              <img
                src={`/images/pets/pet-${selectedPet.petNumber}-1.png`}
                alt={selectedPet.name}
                className={styles.petImage}
              />
            </div>
          )}
        </div>

        {/* RPG Style Dialog Box */}
        <div className={styles.dialogBox}>
            <div className={styles.speakerName}>
              {selectedPet?.petName || selectedPet?.name || 'Tutorial'}
            </div>
            <div className={styles.dialogText}>
              <span className={`${styles.typingText} ${isClearing ? styles.clearing : ''}`}>
                {displayedText}
                {isTyping && <span className={styles.cursor}>|</span>}
              </span>
            </div>
            <div className={styles.dialogControls}>
              <button
                className={styles.skipButton}
                onClick={handleSkip}
                title="Saltar Tutorial"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                className={`${styles.nextButton} ${(isNavigating || isClearing) ? styles.disabled : ''}`}
                onClick={handleNext}
                disabled={isNavigating || isClearing}
                title={isLastStep ? 'Finalizar' : 'Siguiente'}
              >
                {(isNavigating || isClearing) ? (
                  <div className={styles.loadingSpinner}></div>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`${styles.progressDot} ${index === currentStepIndex ? styles.active : ''}`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Tutorial; 