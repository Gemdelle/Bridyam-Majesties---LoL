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
  const [prizes, setPrizes] = useState<number[]>([0, 0, 0, 0, 0]);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);

  // Function to convert number to digit images
  const renderNumberAsImages = (number: number) => {
    const digits = number.toString().split('');
    return (
      <div className={styles.numberContainer}>
        {digits.map((digit, index) => (
          <img
            key={index}
            src={`/images/numbers/${digit}.png`}
            alt={digit}
            className={styles.digitImage}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    loadRandomQuestion();
    generatePrizes();
  }, []);

  const generatePrizes = () => {
    const prizeRanges = [
      { min: 0, max: 100 },      // Prize 1 (bottom)
      { min: 100, max: 500 },    // Prize 2
      { min: 500, max: 2000 },   // Prize 3
      { min: 2000, max: 5000 },  // Prize 4
      { min: 5000, max: 12000 }  // Prize 5 (top)
    ];

    const newPrizes = prizeRanges.map(range => {
      const randomValue = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      // Round to nearest 5, then ensure it ends in 0 or 5
      const roundedToFive = Math.round(randomValue / 5) * 5;
      // If it ends in 0 or 5, use it; otherwise, round down to nearest 0 or 5
      const lastDigit = roundedToFive % 10;
      if (lastDigit === 0 || lastDigit === 5) {
        return roundedToFive;
      } else {
        // Round down to nearest 0 or 5
        return Math.floor(roundedToFive / 10) * 10 + (lastDigit > 5 ? 5 : 0);
      }
    });

    console.log('Generated prizes:', newPrizes);
    setPrizes(newPrizes);
  };

  // Cargar la siguiente pregunta cuando se muestra la actual
  useEffect(() => {
    if (showQuestion && !nextQuestion) {
      loadNextQuestion();
    }
  }, [showQuestion, nextQuestion]);

  // Timer effect for the bar
  useEffect(() => {
    if (showQuestion && !answered && timeLeft > 0 && !isSpinning) {
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
  }, [showQuestion, answered, timeLeft, isSpinning]);

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
    setAnswered(false);
    setSelectedAnswer(null);
    setTimeLeft(60); // Reset timer
    setBarWidth(100); // Reset bar width

    // Move to next prize if user answered correctly
    if (selectedAnswer === currentQuestion?.correctAnswerIndex) {
      setCurrentPrizeIndex(prev => Math.min(prev + 1, 4)); // Max index is 4 (5 prizes total)
    }

    // Trigger spinning animation
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
      setAnswered(false);
      setSelectedAnswer(null);

      // Mover la siguiente pregunta a la actual
      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        setNextQuestion(null);
      }
    }, 3000);
  };

  const handleCashOut = () => {
    // Player decides to stop betting and take their current prize
    console.log('Player cashed out with prize:', prizes[currentPrizeIndex]);
    // Here you can add logic to save the prize to the player's account
    // For now, we'll just reset the game
    setShowQuestion(false);
    setAnswered(false);
    setSelectedAnswer(null);
    setSelectedCategory(null);
    setTimeLeft(60);
    setBarWidth(100);
    setCurrentPrizeIndex(0); // Reset to first prize
    generatePrizes(); // Generate new prizes for next round
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
              src="/images/roulette/wheel-derlets.png"
              alt="Wheel Derlets"
              className={styles.wheelDerlets}
            />
            <div className={styles.derletPrize}>
              {renderNumberAsImages(showQuestion && currentPrizeIndex > 0 ?
                prizes.slice(0, currentPrizeIndex).reduce((sum, prize) => sum + prize, 0) : 0)}
            </div>
          </div>
        </div>

        {/* Prize container - only show after spinning is complete */}
        {showQuestion && (
          <div className={styles.prizeContainer}>
            <div className={`${styles.prize} ${currentPrizeIndex === 4 ? styles.currentPrize : ''}`}>
              <img src="/images/roulette/prize-frame.png" alt="Prize Frame" className={styles.prizeImage} />
              {currentPrizeIndex >= 4 ? (
                <div className={styles.prizeValue}>
                  {renderNumberAsImages(prizes[4])}
                </div>
              ) : (
                <img src="/images/roulette/question-mark.png" alt="Question Mark" className={styles.questionMark} />
              )}
            </div>
            <div className={`${styles.prize} ${currentPrizeIndex === 3 ? styles.currentPrize : ''}`}>
              <img src="/images/roulette/prize-frame.png" alt="Prize Frame" className={styles.prizeImage} />
              {currentPrizeIndex >= 3 ? (
                <div className={styles.prizeValue}>
                  {renderNumberAsImages(prizes[3])}
                </div>
              ) : (
                <img src="/images/roulette/question-mark.png" alt="Question Mark" className={styles.questionMark} />
              )}
            </div>
            <div className={`${styles.prize} ${currentPrizeIndex === 2 ? styles.currentPrize : ''}`}>
              <img src="/images/roulette/prize-frame.png" alt="Prize Frame" className={styles.prizeImage} />
              {currentPrizeIndex >= 2 ? (
                <div className={styles.prizeValue}>
                  {renderNumberAsImages(prizes[2])}
                </div>
              ) : (
                <img src="/images/roulette/question-mark.png" alt="Question Mark" className={styles.questionMark} />
              )}
            </div>
            <div className={`${styles.prize} ${currentPrizeIndex === 1 ? styles.currentPrize : ''}`}>
              <img src="/images/roulette/prize-frame.png" alt="Prize Frame" className={styles.prizeImage} />
              {currentPrizeIndex >= 1 ? (
                <div className={styles.prizeValue}>
                  {renderNumberAsImages(prizes[1])}
                </div>
              ) : (
                <img src="/images/roulette/question-mark.png" alt="Question Mark" className={styles.questionMark} />
              )}
            </div>
            <div className={`${styles.prize} ${currentPrizeIndex === 0 ? styles.currentPrize : ''}`}>
              <img src="/images/roulette/prize-frame.png" alt="Prize Frame" className={styles.prizeImage} />
              <div className={styles.prizeValue}>
                {renderNumberAsImages(prizes[0])}
              </div>
            </div>
          </div>
        )}

        {/* Spin button */}
        {!showQuestion && (
          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className={`${styles.spinButton} ${isSpinning ? styles.disabled : ''}`}
          >
            {isSpinning ? 'Spinning...' : 'Spin'}
          </button>
        )}

        {/* Sección de pregunta */}
        {showQuestion && currentQuestion && (
          <div className={`${styles.questionSection} ${styles[getQuestionFrameClass()]}`}>

            <div className={styles.questionContent}>
              <div className={styles.categoryEmblem}>
                <img src="/images/roulette/emblem-majesties.png" alt="Category Emblem" className={styles.categoryEmblemImage} />
              </div>
              {selectedCategory && !isSpinning && (
                <div className={styles.selectedCategory}>
                  <span className={styles.selectedCategoryText}>
                    CATEGORY: {currentQuestion.category.name}
                  </span>
                </div>
              )}

              {!isSpinning && (
                <>
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

                  {/* Life image at the bottom */}
                  <div className={styles.lifeContainer}>
                    <img
                      src={answered && selectedAnswer !== currentQuestion.correctAnswerIndex
                        ? "/images/roulette/roulette-life-used.png"
                        : "/images/roulette/roulette-life-free.png"}
                      alt="Life"
                      className={`${styles.lifeImage} ${answered && selectedAnswer !== currentQuestion.correctAnswerIndex
                        ? styles.lifeUsed
                        : ''
                        }`}
                    />
                  </div>
                </>
              )}

            </div>


            <div className={styles.barContainer}>
              <div
                className={`${styles.bar} ${timeLeft <= 15 ? styles.urgent : ''}`}
                style={{ width: `${barWidth}%` }}
              ></div>
            </div>
            <div className={styles.timerContainer}>
              <span key={timeLeft} className={styles.timerText}>{timeLeft}</span>
            </div>

            {answered && !isSpinning && (
              <div className={styles.feedbackSection}>
                <button onClick={handleContinue} className={styles.continueButton}>
                  Continue
                </button>
                <button onClick={handleCashOut} className={styles.cashOutButton}>
                  Cash Out
                </button>
              </div>
            )}

          </div>

        )}
      </div>
    </div >
  );
};

export default Roulette; 