import React, { useState, useEffect } from 'react';
import './MemoryGame.css';

const CARD_SETS = {
  Animals: ["🐘", "🦊", "🐞", "🐸", "🐨", "🐌", "🦁", "🐛", "🦒", "🦓", "🐅", "🐆", "🦘", "🐪", "🦏"],
  Symbols: ["⚛️", "☯️", "☮️", "⚠️", "♻️", "⚜️", "➿", "🌀", "⭐", "💫", "✨", "🔆", "🌟", "💎", "🎭"],
  Foods: ["🍕", "🍔", "🍓", "🥑", "🌽", "🍩", "🍪", "🍉", "🍇", "🍊", "🍌", "🥝", "🍒", "🥥", "🍑"],
};

const LEVEL_CONFIG = {
  1: { rows: 4, cols: 4, penaltyPerIncorrect: 1 },
  2: { rows: 4, cols: 5, penaltyPerIncorrect: 1 },
  3: { rows: 4, cols: 5, penaltyPerIncorrect: 2 },
  4: { rows: 4, cols: 5, penaltyPerIncorrect: 3 },
  5: { rows: 5, cols: 6, penaltyPerIncorrect: 2 },
  6: { rows: 5, cols: 6, penaltyPerIncorrect: 3 },
};

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} - A new shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// localStorage key for saving game state
const GAME_STATE_KEY = 'memoryGameState';

// Game constants
const INITIAL_PREVIEW_TIME = 3;
const CARD_FLIP_DELAY = 1000;
const LEVEL_COMPLETION_DELAY = 5000;
const NOTIFICATION_TIMEOUT = 3000;
const ANIMATION_DURATION = 600;
const FLYING_EMOJI_DURATION = 1500;
const PROGRESS_PULSE_DELAY = 50;
const PROGRESS_PULSE_DURATION = 500;
const FLYING_EMOJI_DELAY_1 = 200;
const FLYING_EMOJI_DELAY_2 = 400;
const SCORE_POINTS_PER_MATCH = 10;
const MAX_LEVEL = 6;

// Helper functions for localStorage
/**
 * Saves the current game state to localStorage
 * @param {Object} gameState - The game state object to save
 */
const saveGameState = (gameState) => {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
  } catch (error) {
    console.warn('Failed to save game state to localStorage:', error);
  }
};

/**
 * Loads the game state from localStorage
 * @returns {Object|null} The saved game state or null if not found
 */
const loadGameState = () => {
  try {
    const savedState = localStorage.getItem(GAME_STATE_KEY);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.warn('Failed to load game state from localStorage:', error);
    return null;
  }
};

/**
 * Clears the game state from localStorage
 */
const clearGameState = () => {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch (error) {
    console.warn('Failed to clear game state from localStorage:', error);
  }
};

/**
 * MemoryGame - A multi-level memory card game component (Functional)
 * Features multiple categories, difficulty levels, animations, and progress persistence
 * @returns {JSX.Element} The memory game component
 */
const MemoryGame = () => {
  const [category, setCategory] = useState("Animals");
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [level, setLevel] = useState(1);
  const [isChecking, setIsChecking] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewTime, setPreviewTime] = useState(3);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isResumedGame, setIsResumedGame] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCategoryWarning, setShowCategoryWarning] = useState(false);
  const [pendingCategory, setPendingCategory] = useState(null);
  
  // Previous values for animations
  const [prevScore, setPrevScore] = useState(0);
  const [prevCorrect, setPrevCorrect] = useState(0);
  const [prevIncorrect, setPrevIncorrect] = useState(0);
  const [prevLevel, setPrevLevel] = useState(1);
  
  // Animation states
  const [scoreAnimation, setScoreAnimation] = useState('');
  const [correctAnimation, setCorrectAnimation] = useState('');
  const [incorrectAnimation, setIncorrectAnimation] = useState('');
  const [levelAnimation, setLevelAnimation] = useState('');

  const generateCards = (selectedCategory, currentLevel = 1) => {
    const config = LEVEL_CONFIG[currentLevel];
    const totalCards = config.rows * config.cols;
    const pairs = totalCards / 2;
    
    const availableEmojis = CARD_SETS[selectedCategory];
    const selectedEmojis = availableEmojis.slice(0, pairs);
    const emojis = shuffleArray([...selectedEmojis, ...selectedEmojis]);
    
    console.log(`Generating cards for Level ${currentLevel}: ${config.rows}×${config.cols} = ${totalCards} cards (${pairs} pairs)`);
    
    return emojis.map((emoji, index) => ({
      id: index,
      emoji: emoji,
      isFlipped: false,
      isMatched: false,
    }));
  };

  const startGame = (selectedCategory, resetLevel = true) => {
    setCategory(selectedCategory);
    setScore(0);
    setCorrect(0);
    setIncorrect(0);
    setPrevScore(0);
    setPrevCorrect(0);
    setPrevIncorrect(0);
    setScoreAnimation('');
    setCorrectAnimation('');
    setIncorrectAnimation('');
    setLevelAnimation('');
    setFlippedCards([]);
    setIsChecking(false);
    setShowCongratulations(false);
    setIsGameComplete(false);
    setIsResumedGame(false);
    
    // Clear localStorage when starting fresh
    clearGameState();
    
    if (resetLevel) {
      setLevel(1);
      setPrevLevel(1);
    }
    
    const newCards = generateCards(selectedCategory, resetLevel ? 1 : level);
    
    // Preview phase with countdown
    setIsPreviewing(true);
    setPreviewTime(INITIAL_PREVIEW_TIME);
    setCards(newCards.map(card => ({ ...card, isFlipped: true })));
    
    const countdown = setInterval(() => {
      setPreviewTime(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          setCards(newCards.map(card => ({ ...card, isFlipped: false })));
          setIsPreviewing(false);
          return 0;
        }
        return prev - 1;
      });
    }, CARD_FLIP_DELAY);
  };

  const startNextLevel = () => {
    const nextLevel = level + 1;
    setLevel(nextLevel);
    triggerLevelAnimation(nextLevel);
    
    // Reset progress for new level
    setCorrect(0);
    setPrevCorrect(0);
    setIncorrect(0);
    setPrevIncorrect(0);
    
    const newCards = generateCards(category, nextLevel);
    
    // Reset flipped cards and checking state
    setFlippedCards([]);
    setIsChecking(false);
    
    // Preview phase with countdown for new level
    setIsPreviewing(true);
    setPreviewTime(INITIAL_PREVIEW_TIME);
    setCards(newCards.map(card => ({ ...card, isFlipped: true })));
    
    const countdown = setInterval(() => {
      setPreviewTime(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          setCards(newCards.map(card => ({ ...card, isFlipped: false })));
          setIsPreviewing(false);
          return 0;
        }
        return prev - 1;
      });
    }, CARD_FLIP_DELAY);
  };

  useEffect(() => {
    // Initialize game - either from saved state or start fresh
    const savedState = loadGameState();
    
    if (savedState && savedState.cards && savedState.cards.length > 0) {
      // Check if the saved state has actual progress (not just default values)
      const hasProgress = savedState.score > 0 || 
                         savedState.correct > 0 || 
                         savedState.incorrect > 0 || 
                         savedState.level > 1 ||
                         savedState.cards.some(card => card.isMatched || card.isFlipped);
      
      // Resume from saved state
      setCategory(savedState.category);
      setCards(savedState.cards);
      setScore(savedState.score);
      setCorrect(savedState.correct);
      setIncorrect(savedState.incorrect);
      setLevel(savedState.level);
      setIsGameComplete(savedState.isGameComplete);
      setPrevScore(savedState.score);
      setPrevCorrect(savedState.correct);
      setPrevIncorrect(savedState.incorrect);
      setPrevLevel(savedState.level);
      
      // Only show notification if there's actual progress to resume
      if (hasProgress) {
        setIsResumedGame(true);
        console.log('Resuming game from saved state:', savedState);
        
        // Hide the resumed indicator after notification timeout
        setTimeout(() => {
          setIsResumedGame(false);
        }, NOTIFICATION_TIMEOUT);
      }
    } else {
      // Start new game
      startGame("Animals");
    }
  }, []);

  // Save game state whenever important values change
  useEffect(() => {
    const gameState = {
      category,
      cards,
      score,
      correct,
      incorrect,
      level,
      isGameComplete
    };
    
    // Only save if we have cards (game has started)
    if (cards.length > 0) {
      saveGameState(gameState);
    }
  }, [category, cards, score, correct, incorrect, level, isGameComplete]);

  useEffect(() => {
    // Check if level is completed
    const totalPairs = cards.length / 2;
    const allCardsMatched = cards.length > 0 && cards.every(card => card.isMatched);
    
    console.log('Level completion check:', {
      cardsLength: cards.length,
      totalPairs,
      correct,
      allCardsMatched,
      level
    });
    
    if (cards.length > 0 && (correct === totalPairs || allCardsMatched)) {
      if (level === 6) {
        // Game complete - clear localStorage
        clearGameState();
        setIsGameComplete(true);
        setShowCongratulations(true);
      } else {
        // Level complete, show congratulations and move to next level
        setShowCongratulations(true);
        setTimeout(() => {
          setShowCongratulations(false);
          startNextLevel();
        }, LEVEL_COMPLETION_DELAY);
      }
    }
  }, [correct, cards.length, level, cards]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      setTimeout(checkForMatch, CARD_FLIP_DELAY);
    }
  }, [flippedCards]);

  const createFlyingEmoji = (emoji, startElement, currentProgress) => {
    const flyingEmoji = document.createElement('div');
    flyingEmoji.textContent = emoji;
    flyingEmoji.className = 'flying-emoji';
    
    // Get positions
    const cardRect = startElement.getBoundingClientRect();
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBar = document.querySelector('.progress-bar');
    const progressBarContainerRect = progressBarContainer.getBoundingClientRect();
    
    // Set starting position
    flyingEmoji.style.left = `${cardRect.left + cardRect.width / 2}px`;
    flyingEmoji.style.top = `${cardRect.top + cardRect.height / 2}px`;
    
    // Calculate end position (at the current progress bar fill position, centered vertically)
    const progressWidth = progressBarContainerRect.width * (currentProgress / 100);
    const endX = progressBarContainerRect.left + progressWidth;
    const endY = progressBarContainerRect.top + progressBarContainerRect.height / 2;
    
    document.body.appendChild(flyingEmoji);
    
    // Update the animation to use custom properties
    flyingEmoji.style.animation = 'none';
    void flyingEmoji.offsetHeight; // Force reflow
    
    // Animate to end position with better easing
    flyingEmoji.animate([
      {
        left: flyingEmoji.style.left,
        top: flyingEmoji.style.top,
        transform: 'scale(1) rotate(0deg)',
        opacity: 1
      },
      {
        left: `${endX}px`,
        top: `${endY}px`,
        transform: 'scale(0) rotate(360deg)',
        opacity: 0
      }
    ], {
      duration: FLYING_EMOJI_DURATION,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' // ease-in-out with custom curve
    });
    
    // Remove element when animation completes
    setTimeout(() => {
      flyingEmoji.remove();
    }, FLYING_EMOJI_DURATION);
  };

  const checkForMatch = () => {
    const [card1, card2] = flippedCards;
    
    if (card1.emoji === card2.emoji) {
      // Calculate CURRENT progress (not future progress)
      const currentProgress = (correct / (cards.length / 2)) * 100;
      
      // Create flying emojis before updating state
      const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
      const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
      
      if (card1Element && card2Element) {
        // Slight delay between the two flying emojis for better visual effect
        setTimeout(() => createFlyingEmoji(card1.emoji, card1Element, currentProgress), FLYING_EMOJI_DELAY_1);
        setTimeout(() => createFlyingEmoji(card2.emoji, card2Element, currentProgress), FLYING_EMOJI_DELAY_2);
        
        // Delay state updates until flying emoji animation completes
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.emoji === card1.emoji ? { ...card, isMatched: true, isFlipped: true } : card
            )
          );
          triggerScoreAnimation(score + SCORE_POINTS_PER_MATCH);
          triggerCorrectAnimation(correct + 1);
          
          // Trigger progress bar pulse immediately when progress increases
          setTimeout(() => {
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
              progressBar.classList.add('emoji-received');
              setTimeout(() => {
                progressBar.classList.remove('emoji-received');
              }, PROGRESS_PULSE_DURATION);
            }
          }, PROGRESS_PULSE_DELAY);
        }, FLYING_EMOJI_DURATION);
      } else {
        // Fallback if elements not found - immediate update
        setCards(prevCards =>
          prevCards.map(card =>
            card.emoji === card1.emoji ? { ...card, isMatched: true, isFlipped: true } : card
          )
        );
        triggerScoreAnimation(score + SCORE_POINTS_PER_MATCH);
        triggerCorrectAnimation(correct + 1);
      }
    } else {
      setCards(prevCards =>
        prevCards.map(card =>
          (card.id === card1.id || card.id === card2.id) ? { ...card, isFlipped: false } : card
        )
      );
      triggerIncorrectAnimation(incorrect + 1);
      // Use level-specific penalty for incorrect guess
      const penalty = LEVEL_CONFIG[level].penaltyPerIncorrect;
      triggerScoreAnimation(Math.max(0, score - penalty));
    }
    setFlippedCards([]);
    setIsChecking(false);
  };

  const handleCardClick = (clickedCard) => {
    if (isChecking || isPreviewing || clickedCard.isFlipped || clickedCard.isMatched || flippedCards.length === 2) {
      return;
    }
    const newFlippedCard = { ...clickedCard, isFlipped: true };
    setCards(cards.map(card => card.id === clickedCard.id ? newFlippedCard : card));
    setFlippedCards([...flippedCards, newFlippedCard]);
  };

  const triggerScoreAnimation = (newScore) => {
    setPrevScore(score);
    if (newScore > score) {
      setScoreAnimation('score-increase');
      setTimeout(() => setScoreAnimation(''), ANIMATION_DURATION);
    } else if (newScore < score) {
      setScoreAnimation('score-decrease');
      setTimeout(() => setScoreAnimation(''), ANIMATION_DURATION - 100);
    }
    setScore(newScore);
  };

  const triggerCorrectAnimation = (newCorrect) => {
    setPrevCorrect(correct);
    if (newCorrect > correct) {
      setCorrectAnimation('stat-increase');
    }
    setCorrect(newCorrect);
    
    setTimeout(() => setCorrectAnimation(''), ANIMATION_DURATION);
  };

  const triggerIncorrectAnimation = (newIncorrect) => {
    setPrevIncorrect(incorrect);
    if (newIncorrect > incorrect) {
      setIncorrectAnimation('stat-increase');
    }
    setIncorrect(newIncorrect);
    
    setTimeout(() => setIncorrectAnimation(''), ANIMATION_DURATION);
  };

  const triggerLevelAnimation = (newLevel) => {
    setPrevLevel(level);
    if (newLevel > level) {
      setLevelAnimation('stat-increase');
    }
    
    setTimeout(() => setLevelAnimation(''), ANIMATION_DURATION);
  };

  const handleCategoryClick = (selectedCategory) => {
    if (selectedCategory === category) {
      // Don't allow clicking the active category
      return;
    }
    
    // Check if there's progress to lose
    if (score > 0 || correct > 0 || incorrect > 0 || level > 1) {
      setPendingCategory(selectedCategory);
      setShowCategoryWarning(true);
    } else {
      // No progress to lose, switch directly
      startGame(selectedCategory, true);
    }
  };

  const confirmCategorySwitch = () => {
    setShowCategoryWarning(false);
    if (pendingCategory) {
      startGame(pendingCategory, true);
      setPendingCategory(null);
    }
  };

  const cancelCategorySwitch = () => {
    setShowCategoryWarning(false);
    setPendingCategory(null);
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setShowResetConfirm(false);
    startGame(category, true);
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  const handlePlayAgain = () => {
    clearGameState(); // Clear saved state when starting a new game
    startGame(category, true);
  };

  const toggleRules = () => {
    setShowRules(!showRules);
  };

  const progress = cards.length > 0 ? (correct / (cards.length / 2)) * 100 : 0;
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
  
  console.log('Progress calculation:', {
    cardsLength: cards.length,
    correct,
    totalPairs: cards.length / 2,
    progress,
    level
  });

  return (
    <div className="game-board">
      {/* Help Button */}
      <div className="help-button" onClick={toggleRules}>
        ?
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="rules-overlay" onClick={() => setShowRules(false)}>
          <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rules-header">
              <h2>🎮 Game Rules</h2>
              <button className="close-rules" onClick={() => setShowRules(false)}>×</button>
            </div>
            <div className="rules-content">
              <div className="rules-section">
                <h3>📋 How to Play</h3>
                <p>Match pairs of identical emojis by flipping cards. Complete all pairs to advance to the next level!</p>
              </div>
              
              <div className="rules-section">
                <h3>🏆 Scoring System</h3>
                <div className="level-rules">
                  <div className="level-rule">
                    <span className="level-title">Level 1 (4×4 Grid)</span>
                    <span className="scoring">Correct: +10 | Incorrect: -1</span>
                  </div>
                  <div className="level-rule">
                    <span className="level-title">Level 2 (5×4 Grid)</span>
                    <span className="scoring">Correct: +10 | Incorrect: -1</span>
                  </div>
                  <div className="level-rule">
                    <span className="level-title">Level 3 (5×4 Grid)</span>
                    <span className="scoring">Correct: +10 | Incorrect: -2</span>
                  </div>
                  <div className="level-rule">
                    <span className="level-title">Level 4 (5×4 Grid)</span>
                    <span className="scoring">Correct: +10 | Incorrect: -3</span>
                  </div>
                  <div className="level-rule">
                    <span className="level-title">Level 5 (5×6 Grid)</span>
                    <span className="scoring">Correct: +10 | Incorrect: -2</span>
                  </div>
                  <div className="level-rule">
                    <span className="level-title">Level 6 (5×6 Grid)</span>
                    <span className="scoring">Correct: +10 | Incorrect: -3</span>
                  </div>
                </div>
              </div>

              <div className="rules-section">
                <h3>🎯 Tips</h3>
                <ul>
                  <li>Each level starts with a 3-second preview of all cards</li>
                  <li>Pay attention during preview time to memorize positions</li>
                  <li>Score cannot go below 0</li>
                  <li>Your progress is automatically saved to browser storage</li>
                  <li>Complete all 6 levels to win the game!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCongratulations && (
        <div className="congratulations-overlay">
          <div className="congratulations-dialog">
            <div className="fireworks"></div>
            <div className="congratulations-content">
              <h2>🎉 Congratulations! 🎉</h2>
              {isGameComplete ? (
                <>
                  <p>You've completed all 6 levels!</p>
                  <p>Final Score: {score}</p>
                  <button className="play-again-button" onClick={handlePlayAgain}>
                    Play Again
                  </button>
                </>
              ) : (
                <>
                  <p>Level {level} Complete!</p>
                  <p>Moving to Level {level + 1}...</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <header className="game-header">
        <div className="category-selector">
          {Object.keys(CARD_SETS).map((cat) => (
            <button
              key={cat}
              className={`category-button ${category === cat ? "active" : ""} ${category === cat ? "disabled" : ""}`}
              onClick={() => handleCategoryClick(cat)}
              disabled={category === cat}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </header>
      
      <div className="preview-status">
        {isPreviewing ? `Preview: ${previewTime}s` : "Preview: 0s"}
      </div>
      
      {/* Resumed Game Notification */}
      {isResumedGame && (
        <div className="resumed-notification">
          <div className="resumed-notification-content">
            <div className="notification-icon">📋</div>
            <div className="notification-text">
              <div className="notification-title">Game Resumed</div>
              <div className="notification-subtitle">Continuing from saved progress</div>
            </div>
            <div className="notification-close" onClick={() => setIsResumedGame(false)}>✓</div>
          </div>
        </div>
      )}
      <div className="stats-container">
        <div className={`stat-item ${levelAnimation}`}>Level <br/> 
          <span>{level}/6</span>
        </div>
        <div className={`stat-item ${scoreAnimation}`}>Score <br/> 
          <span>{score}</span>
        </div>
        <div className={`stat-item ${correctAnimation}`}>Correct <br/> 
          <span>{correct}</span>
        </div>
        <div className={`stat-item ${incorrectAnimation}`}>Incorrect <br/> 
          <span>{incorrect}</span>
        </div>
      </div>
      <button className="reset-button" onClick={handleResetClick}>
        RESET GAME
      </button>
      
      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="confirmation-overlay" onClick={cancelReset}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-header">
              <h3>🔄 Reset Game</h3>
            </div>
            <div className="confirmation-content">
              <p>Are you sure you want to reset the game?</p>
              <p>All progress will be lost.</p>
              <div className="confirmation-buttons">
                <button className="confirm-button" onClick={confirmReset}>
                  Yes, Reset
                </button>
                <button className="cancel-button" onClick={cancelReset}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Switch Warning Dialog */}
      {showCategoryWarning && (
        <div className="confirmation-overlay" onClick={cancelCategorySwitch}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-header">
              <h3>⚠️ Switch Category</h3>
            </div>
            <div className="confirmation-content">
              <p>Switching categories will reset your current progress.</p>
              <p>Level: {level}, Score: {score}, Correct: {correct}</p>
              <p>Continue to <strong>{pendingCategory}</strong>?</p>
              <div className="confirmation-buttons">
                <button className="confirm-button" onClick={confirmCategorySwitch}>
                  Yes, Switch
                </button>
                <button className="cancel-button" onClick={cancelCategorySwitch}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div 
        className="card-grid" 
        style={{
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          gridTemplateRows: `repeat(${config.rows}, 1fr)`
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            data-card-id={card.id}
            className={`card ${card.isFlipped || card.isMatched ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
            onClick={() => handleCardClick(card)}
          >
            <div className="card-blank"></div>
            <div className="card-emoji">{card.emoji}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryGame;