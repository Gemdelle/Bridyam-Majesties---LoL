import React, { useState, useEffect } from 'react';
import { questionsService } from '../../services/questionsService';
import { usePetContext } from '../../contexts/PetContext';
import { tutorialService } from '../../services/tutorialService';
import styles from './Roulette.module.scss';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Question {
  id: number;
  question: string;
  category: Category;
  answers: string[];
  correctAnswerIndex: number; // Índice de la respuesta correcta (0-3)
}

const Roulette: React.FC = () => {
  const { selectedPet } = usePetContext();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds = 1 minute
  const [barWidth, setBarWidth] = useState(100); // 100% width

  useEffect(() => {
    loadRandomQuestion();
  }, []);

  // Cargar la siguiente pregunta cuando se muestra la actual
  useEffect(() => {
    if (showQuestion && !nextQuestion) {
      loadNextQuestion();
    }
  }, [showQuestion, nextQuestion]);

  // Timer effect for the bar
  useEffect(() => {
    if (showQuestion && !answered && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          const newWidth = (newTime / 60) * 100;
          setBarWidth(newWidth);
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showQuestion, answered, timeLeft]);

  const loadRandomQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      const randomQuestion = await questionsService.getRandomQuestion();
      setCurrentQuestion(randomQuestion);
    } catch (err) {
      setError('Error al cargar la pregunta');
      console.error('Error loading question:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNextQuestion = async () => {
    try {
      const randomQuestion = await questionsService.getRandomQuestion();
      setNextQuestion(randomQuestion);
    } catch (err) {
      console.error('Error loading next question:', err);
    }
  };

  const loadQuestionByCategory = async (categoryId: number) => {
    try {
      setLoading(true);
      setError(null);
      const categoryQuestion = await questionsService.getQuestionByCategory(categoryId);
      setCurrentQuestion(categoryQuestion);
    } catch (err) {
      // If category-specific question fails, fall back to random question
      console.error('Error loading category question, falling back to random:', err);
      try {
        const randomQuestion = await questionsService.getRandomQuestion();
        setCurrentQuestion(randomQuestion);
      } catch (fallbackErr) {
        setError('Error al cargar la pregunta');
        console.error('Error loading fallback question:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    // Calculate random rotation that lands on one of the 12 sections
    const sections = 12;
    const sectionAngle = 360 / sections; // 30 degrees per section
    const randomSection = Math.floor(Math.random() * sections);
    const targetAngle = randomSection * sectionAngle + (sectionAngle / 2); // Center of the section

    // 4 full rotations + target angle
    const newRotation = rotation + 1440 + targetAngle;
    setRotation(newRotation);

    // Determine which category was selected
    const selectedCategoryNumber = randomSection + 1; // Categories are 1-12
    setSelectedCategory(selectedCategoryNumber);
    console.log(`Ruleta cayó en la categoría: ${selectedCategoryNumber}`);

    setTimeout(() => {
      setIsSpinning(false);
      setShowQuestion(true);
      setAnswered(false);
      setSelectedAnswer(null);
    }, 3000);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered || !currentQuestion) return;

    setSelectedAnswer(answerIndex);
    setAnswered(true);
  };

  const handleContinue = () => {
    setShowQuestion(false);
    setAnswered(false);
    setSelectedAnswer(null);
    setSelectedCategory(null);
    setTimeLeft(60); // Reset timer
    setBarWidth(100); // Reset bar width

    // Mover la siguiente pregunta a la actual
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setNextQuestion(null);
    }
  };

  // Determine the correct frame based on the selected pet
  const getQuestionFrameClass = () => {
    // Try to get pet from context first, then tutorial service as fallback
    let petNumber = selectedPet?.petNumber;

    // If no pet in context, try tutorial service
    if (!petNumber) {
      const tutorialPet = tutorialService.getSelectedPet();
      petNumber = tutorialPet?.petNumber;
    }

    // Default to pet 1 if still no pet number
    petNumber = petNumber || 1;

    console.log('Selected Pet from Context:', selectedPet);
    console.log('Pet from Tutorial Service:', tutorialService.getSelectedPet());
    console.log('Pet Number:', petNumber);
    console.log('Frame Class:', `questionSectionPet${petNumber}`);
    return `questionSectionPet${petNumber}`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={loadRandomQuestion} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.wheelContainer}>
          <div className={`${styles.flyingDerlet} ${styles.derlet1}`}></div>
          <div className={`${styles.flyingDerlet} ${styles.derlet2}`}></div>
          <div className={`${styles.flyingDerlet} ${styles.derlet3}`}></div>
          <div className={`${styles.flyingDerlet} ${styles.derlet4}`}></div>
          <div className={`${styles.flyingDerlet} ${styles.derlet5}`}></div>

          <div className={`${styles.flyingDerlet} ${styles.derlet6}`}></div>
          <div className={`${styles.flyingDerlet} ${styles.derlet7}`}></div>
          <div className={`${styles.flyingDerlet} ${styles.derlet8}`}></div>
          <div className={`${styles.flyingDerlet} ${styles.derlet9}`}></div>
          <div className={`${styles.flyingDerlet} ${styles.derlet10}`}></div>

          {/* Marco de la ruleta */}
          <div className={styles.wheelFrame}>
            <img
              src="/images/roulette/frame.png"
              alt="Marco de la ruleta"
              className={styles.frameImage}
            />
          </div>

          {/* Ruleta giratoria */}
          <div
            className={`${styles.wheel} ${isSpinning ? styles.spinning : ''}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <img
              src="/images/roulette/wheel.png"
              alt="Ruleta"
              className={styles.wheelImage}
            />
          </div>

          <div
            className={styles.derletContainer}
          >
            <img
              src="/images/roulette/derlet.png"
              alt="Derlet"
              className={styles.derlet}
            />
          </div>
        </div>

        <div className={styles.prizeContainer}>
          <div className={styles.prize}>
            <img src="/images/roulette/prize-frame-5.png" alt="Prize Frame 5" className={styles.prizeImage} />
            <img src="/images/roulette/question-mark.png" alt="Question Mark" className={styles.questionMark} />
          </div>
          <div className={styles.prize}>
            <img src="/images/roulette/prize-frame-4.png" alt="Prize Frame 4" className={styles.prizeImage} />
            <img src="/images/roulette/question-mark.png" alt="Question Mark" className={styles.questionMark} />
          </div>
          <div className={styles.prize}>
            <img src="/images/roulette/prize-frame-3.png" alt="Prize Frame 3" className={styles.prizeImage} />
            <img src="/images/roulette/question-mark.png" alt="Question Mark" className={styles.questionMark} />
          </div>
          <div className={styles.prize}>
            <img src="/images/roulette/prize-frame-2.png" alt="Prize Frame 2" className={styles.prizeImage} />
            <img src="/images/roulette/question-mark.png" alt="Question Mark" className={styles.questionMark} />
          </div>
          <div className={styles.prize}>
            <img src="/images/roulette/prize-frame-1.png" alt="Prize Frame 1" className={styles.prizeImage} />
          </div>
        </div>

        {/* Botón de girar */}
        {!showQuestion && (
          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className={`${styles.spinButton} ${isSpinning ? styles.disabled : ''}`}
          >
            {isSpinning ? 'Girando...' : 'Girar Ruleta'}
          </button>
        )}

        {/* Sección de pregunta */}
        {showQuestion && currentQuestion && (
          <div className={`${styles.questionSection} ${styles[getQuestionFrameClass()]}`}>

            <div className={styles.questionContent}>
              <div className={styles.categoryEmblem}>
                <img src="/images/roulette/emblem-majesties.png" alt="Category Emblem" className={styles.categoryEmblemImage} />
              </div>
              {selectedCategory && (
                <div className={styles.selectedCategory}>
                  <span className={styles.selectedCategoryText}>
                    CATEGORY: {currentQuestion.category.name}
                  </span>
                </div>
              )}

              <div className={styles.question}>
                <h2>{currentQuestion.question}</h2>
              </div>

              <div className={styles.answers}>
                {currentQuestion.answers.map((answer, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === currentQuestion.correctAnswerIndex;
                  const isUserCorrect = selectedAnswer === currentQuestion.correctAnswerIndex;

                  // Mostrar verde si es la respuesta correcta y el usuario la seleccionó
                  const showCorrect = answered && isSelected && isUserCorrect;
                  // Mostrar verde si es la respuesta correcta (cuando el usuario se equivocó)
                  const showCorrectAnswer = answered && isCorrectAnswer && !isUserCorrect;
                  // Mostrar rojo si el usuario seleccionó esta respuesta y está mal
                  const showIncorrect = answered && isSelected && !isUserCorrect;

                  return (
                    <div
                      key={index}
                      className={`${styles.answer} ${showCorrect || showCorrectAnswer ? styles.correct :
                        showIncorrect ? styles.incorrect :
                          isSelected ? styles.selected : ''
                        }`}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <span className={styles.answerText}>{answer}</span>
                      {(showCorrect || showCorrectAnswer) && <span className={styles.correctIcon}>✓</span>}
                      {showIncorrect && <span className={styles.incorrectIcon}>✗</span>}
                    </div>
                  );
                })}
              </div>

              {answered && (
                <div className={styles.feedbackSection}>
                  <button onClick={handleContinue} className={styles.continueButton}>
                    Continuar
                  </button>
                </div>
              )}
            </div>


            <div className={styles.timerContainer}>
              <span key={timeLeft} className={styles.timerText}>{timeLeft}</span>
            </div>
            <div className={styles.barContainer}>
              <div
                className={`${styles.bar} ${timeLeft <= 15 ? styles.urgent : ''}`}
                style={{ width: `${barWidth}%` }}
              ></div>
            </div>

          </div>

        )}
      </div>
    </div >
  );
};

export default Roulette; 