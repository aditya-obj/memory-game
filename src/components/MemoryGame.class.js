import React, { Component } from 'react';
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
 * MemoryGame - A multi-level memory card game component (Class-based)
 * Features multiple categories, difficulty levels, animations, and progress persistence
 */
class MemoryGame extends Component {
  state = {
    category: "Animals",
    cards: [],
    flippedCards: [],
    score: 0,
    correct: 0,
    incorrect: 0,
    level: 1,
    isChecking: false,
    isPreviewing: false,
    previewTime: 3,
    showCongratulations: false,
    isGameComplete: false,
    showRules: false,
    isResumedGame: false,
    showResetConfirm: false,
    showCategoryWarning: false,
    pendingCategory: null,
    
    // Previous values for animations
    prevScore: 0,
    prevCorrect: 0,
    prevIncorrect: 0,
    prevLevel: 1,
    
    // Animation states
    scoreAnimation: '',
    correctAnimation: '',
    incorrectAnimation: '',
    levelAnimation: ''
  };

  componentDidMount() {
    // Initialize game - either from saved state or start fresh
    const savedState = loadGameState();
    
    if (savedState && savedState.cards && savedState.cards.length > 0) {
      // Check if the saved state has actual progress (not just default values)
      const hasProgress = savedState.score > 0 || 
                         savedState.correct > 0 || 
                         savedState.incorrect > 0 || 
                         savedState.level > 1 ||
                         savedState.cards.some(card => card.isMatched || card.isFlipped);
      
      // Resume from saved state but ensure no cards are temporarily flipped
      const cleanedCards = savedState.cards.map(card => ({
        ...card,
        isFlipped: card.isMatched // Only keep flipped state for matched cards
      }));
      
      this.setState({
        category: savedState.category,
        cards: cleanedCards,
        score: savedState.score,
        correct: savedState.correct,
        incorrect: savedState.incorrect,
        level: savedState.level,
        isGameComplete: savedState.isGameComplete,
        prevScore: savedState.score,
        prevCorrect: savedState.correct,
        prevIncorrect: savedState.incorrect,
        prevLevel: savedState.level,
        flippedCards: [], // Ensure flippedCards is reset
        isChecking: false // Ensure not in checking state
      });
      
      // Only show notification if there's actual progress to resume
      if (hasProgress) {
        this.setState({ isResumedGame: true });
        console.log('Resuming game from saved state:', savedState);
        
        // Hide the resumed indicator after notification timeout
        setTimeout(() => {
          this.setState({ isResumedGame: false });
        }, NOTIFICATION_TIMEOUT);
      }
    } else {
      // Start new game
      this.startGame("Animals");
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Save game state whenever important values change
    if (
      prevState.category !== this.state.category ||
      prevState.cards !== this.state.cards ||
      prevState.score !== this.state.score ||
      prevState.correct !== this.state.correct ||
      prevState.incorrect !== this.state.incorrect ||
      prevState.level !== this.state.level ||
      prevState.isGameComplete !== this.state.isGameComplete
    ) {
      // Clean cards before saving - only save matched cards as flipped
      const cleanedCards = this.state.cards.map(card => ({
        ...card,
        isFlipped: card.isMatched // Only keep flipped state for matched cards
      }));
      
      const gameState = {
        category: this.state.category,
        cards: cleanedCards,
        score: this.state.score,
        correct: this.state.correct,
        incorrect: this.state.incorrect,
        level: this.state.level,
        isGameComplete: this.state.isGameComplete
      };
      
      // Only save if we have cards (game has started)
      if (this.state.cards.length > 0) {
        saveGameState(gameState);
      }
    }

    // Check if level is completed
    const totalPairs = this.state.cards.length / 2;
    const allCardsMatched = this.state.cards.length > 0 && this.state.cards.every(card => card.isMatched);
    
    if (
      (prevState.correct !== this.state.correct || prevState.cards !== this.state.cards) &&
      this.state.cards.length > 0 && 
      (this.state.correct === totalPairs || allCardsMatched)
    ) {
      if (this.state.level === 6) {
        // Game complete - clear localStorage
        clearGameState();
        this.setState({ isGameComplete: true, showCongratulations: true });
      } else {
        // Level complete, show congratulations and move to next level
        this.setState({ showCongratulations: true });
        setTimeout(() => {
          this.setState({ showCongratulations: false });
          this.startNextLevel();
        }, LEVEL_COMPLETION_DELAY);
      }
    }

    // Check for match when flipped cards change
    if (prevState.flippedCards.length !== this.state.flippedCards.length && this.state.flippedCards.length === 2) {
      this.setState({ isChecking: true });
      setTimeout(() => this.checkForMatch(), CARD_FLIP_DELAY);
    }
  }

  generateCards = (selectedCategory, currentLevel = 1) => {
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

  startGame = (selectedCategory, resetLevel = true) => {
    this.setState({
      category: selectedCategory,
      score: 0,
      correct: 0,
      incorrect: 0,
      prevScore: 0,
      prevCorrect: 0,
      prevIncorrect: 0,
      scoreAnimation: '',
      correctAnimation: '',
      incorrectAnimation: '',
      levelAnimation: '',
      flippedCards: [],
      isChecking: false,
      showCongratulations: false,
      isGameComplete: false,
      isResumedGame: false,
    });
    
    // Clear localStorage when starting fresh
    clearGameState();
    
    let currentLevel = this.state.level;
    if (resetLevel) {
      currentLevel = 1;
      this.setState({ level: 1, prevLevel: 1 });
    }
    
    const newCards = this.generateCards(selectedCategory, currentLevel);
    
    // Preview phase with countdown
    this.setState({
      isPreviewing: true,
      previewTime: INITIAL_PREVIEW_TIME,
      cards: newCards.map(card => ({ ...card, isFlipped: true }))
    });
    
    const countdown = setInterval(() => {
      this.setState(prevState => {
        if (prevState.previewTime <= 1) {
          clearInterval(countdown);
          this.setState({
            cards: newCards.map(card => ({ ...card, isFlipped: false })),
            isPreviewing: false,
            previewTime: 0
          });
          return { previewTime: 0 };
        }
        return { previewTime: prevState.previewTime - 1 };
      });
    }, CARD_FLIP_DELAY);
  };

  startNextLevel = () => {
    const nextLevel = this.state.level + 1;
    this.setState({ level: nextLevel });
    this.triggerLevelAnimation(nextLevel);
    
    // Reset progress for new level
    this.setState({
      correct: 0,
      prevCorrect: 0,
      incorrect: 0,
      prevIncorrect: 0,
      flippedCards: [],
      isChecking: false,
    });
    
    const newCards = this.generateCards(this.state.category, nextLevel);
    
    // Preview phase with countdown for new level
    this.setState({
      isPreviewing: true,
      previewTime: INITIAL_PREVIEW_TIME,
      cards: newCards.map(card => ({ ...card, isFlipped: true }))
    });
    
    const countdown = setInterval(() => {
      this.setState(prevState => {
        if (prevState.previewTime <= 1) {
          clearInterval(countdown);
          this.setState({
            cards: newCards.map(card => ({ ...card, isFlipped: false })),
            isPreviewing: false,
            previewTime: 0
          });
          return { previewTime: 0 };
        }
        return { previewTime: prevState.previewTime - 1 };
      });
    }, CARD_FLIP_DELAY);
  };

  handleCardClick = (clickedCard) => {
    if (this.state.isChecking || this.state.isPreviewing || clickedCard.isFlipped || clickedCard.isMatched || this.state.flippedCards.length === 2) {
      return;
    }

    const newCards = this.state.cards.map((card) =>
      card.id === clickedCard.id ? { ...card, isFlipped: true } : card
    );

    const newFlippedCards = [...this.state.flippedCards, clickedCard];
    this.setState({ cards: newCards, flippedCards: newFlippedCards });
  };

  createFlyingEmoji = (emoji, startElement, currentProgress) => {
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

  checkForMatch = () => {
    const [card1, card2] = this.state.flippedCards;

    if (card1.emoji === card2.emoji) {
      // Calculate CURRENT progress (not future progress)
      const currentProgress = (this.state.correct / (this.state.cards.length / 2)) * 100;
      
      // Create flying emojis before updating state
      const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
      const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
      
      if (card1Element && card2Element) {
        // Slight delay between the two flying emojis for better visual effect
        setTimeout(() => this.createFlyingEmoji(card1.emoji, card1Element, currentProgress), FLYING_EMOJI_DELAY_1);
        setTimeout(() => this.createFlyingEmoji(card2.emoji, card2Element, currentProgress), FLYING_EMOJI_DELAY_2);
        
        // Delay state updates until flying emoji animation completes
        setTimeout(() => {
          const newCards = this.state.cards.map((card) =>
            card.emoji === card1.emoji ? { ...card, isMatched: true, isFlipped: true } : card
          );
          this.setState({
            cards: newCards,
            flippedCards: [],
          });
          this.triggerScoreAnimation(this.state.score + SCORE_POINTS_PER_MATCH);
          this.triggerCorrectAnimation(this.state.correct + 1);
          
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
        const newCards = this.state.cards.map((card) =>
          card.emoji === card1.emoji ? { ...card, isMatched: true, isFlipped: true } : card
        );
        this.setState({
          cards: newCards,
          flippedCards: [],
        });
        this.triggerScoreAnimation(this.state.score + SCORE_POINTS_PER_MATCH);
        this.triggerCorrectAnimation(this.state.correct + 1);
      }
    } else {
      setTimeout(() => {
        const newCards = this.state.cards.map((card) =>
          !card.isMatched ? { ...card, isFlipped: false } : card
        );
        this.setState({
          cards: newCards,
          flippedCards: [],
        });
        this.triggerIncorrectAnimation(this.state.incorrect + 1);
        // Use level-specific penalty for incorrect guess
        const penalty = LEVEL_CONFIG[this.state.level].penaltyPerIncorrect;
        this.triggerScoreAnimation(Math.max(0, this.state.score - penalty));
      }, CARD_FLIP_DELAY);
    }
    this.setState({ isChecking: false });
  };

  triggerScoreAnimation = (newScore) => {
    this.setState({ prevScore: this.state.score });
    if (newScore > this.state.score) {
      this.setState({ scoreAnimation: 'score-increase' });
      setTimeout(() => this.setState({ scoreAnimation: '' }), ANIMATION_DURATION);
    } else if (newScore < this.state.score) {
      this.setState({ scoreAnimation: 'score-decrease' });
      setTimeout(() => this.setState({ scoreAnimation: '' }), ANIMATION_DURATION - 100);
    }
    this.setState({ score: newScore });
  };

  triggerCorrectAnimation = (newCorrect) => {
    this.setState({ prevCorrect: this.state.correct });
    if (newCorrect > this.state.correct) {
      this.setState({ correctAnimation: 'stat-increase' });
    }
    this.setState({ correct: newCorrect });
    
    setTimeout(() => this.setState({ correctAnimation: '' }), ANIMATION_DURATION);
  };

  triggerIncorrectAnimation = (newIncorrect) => {
    this.setState({ prevIncorrect: this.state.incorrect });
    if (newIncorrect > this.state.incorrect) {
      this.setState({ incorrectAnimation: 'stat-increase' });
    }
    this.setState({ incorrect: newIncorrect });
    
    setTimeout(() => this.setState({ incorrectAnimation: '' }), ANIMATION_DURATION);
  };

  triggerLevelAnimation = (newLevel) => {
    this.setState({ prevLevel: this.state.level });
    if (newLevel > this.state.level) {
      this.setState({ levelAnimation: 'stat-increase' });
    }
    
    setTimeout(() => this.setState({ levelAnimation: '' }), ANIMATION_DURATION);
  };

  handleCategoryClick = (selectedCategory) => {
    if (selectedCategory === this.state.category) {
      // Don't allow clicking the active category
      return;
    }
    
    // Check if there's progress to lose
    if (this.state.score > 0 || this.state.correct > 0 || this.state.incorrect > 0 || this.state.level > 1) {
      this.setState({ pendingCategory: selectedCategory, showCategoryWarning: true });
    } else {
      // No progress to lose, switch directly
      this.startGame(selectedCategory, true);
    }
  };

  confirmCategorySwitch = () => {
    this.setState({ showCategoryWarning: false });
    if (this.state.pendingCategory) {
      this.startGame(this.state.pendingCategory, true);
      this.setState({ pendingCategory: null });
    }
  };

  cancelCategorySwitch = () => {
    this.setState({ showCategoryWarning: false, pendingCategory: null });
  };

  handleResetClick = () => {
    this.setState({ showResetConfirm: true });
  };

  confirmReset = () => {
    this.setState({ showResetConfirm: false });
    this.startGame(this.state.category, true);
  };

  cancelReset = () => {
    this.setState({ showResetConfirm: false });
  };

  handlePlayAgain = () => {
    clearGameState(); // Clear saved state when starting a new game
    this.startGame(this.state.category, true);
  };

  toggleRules = () => {
    this.setState({ showRules: !this.state.showRules });
  };

  render() {
    const { 
      category, cards, score, correct, incorrect, level, isPreviewing, previewTime,
      showCongratulations, isGameComplete, showRules, isResumedGame, showResetConfirm,
      showCategoryWarning, pendingCategory, levelAnimation, scoreAnimation, correctAnimation, incorrectAnimation
    } = this.state;

    const progress = cards.length > 0 ? (correct / (cards.length / 2)) * 100 : 0;
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];

    return (
      <div className="game-board">
        {/* Help Button */}
        <div className="help-button" onClick={this.toggleRules}>
          ?
        </div>

        {/* Rules Modal */}
        {showRules && (
          <div className="rules-overlay" onClick={() => this.setState({ showRules: false })}>
            <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rules-header">
                <h2>🎮 Game Rules</h2>
                <button className="close-rules" onClick={() => this.setState({ showRules: false })}>×</button>
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
                    <button className="play-again-button" onClick={this.handlePlayAgain}>
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
                onClick={() => this.handleCategoryClick(cat)}
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
              <div className="notification-close" onClick={() => this.setState({ isResumedGame: false })}>✓</div>
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
        <button className="reset-button" onClick={this.handleResetClick}>
          RESET GAME
        </button>
        
        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="confirmation-overlay" onClick={this.cancelReset}>
            <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="confirmation-header">
                <h3>🔄 Reset Game</h3>
              </div>
              <div className="confirmation-content">
                <p>Are you sure you want to reset the game?</p>
                <p>All progress will be lost.</p>
                <div className="confirmation-buttons">
                  <button className="confirm-button" onClick={this.confirmReset}>
                    Yes, Reset
                  </button>
                  <button className="cancel-button" onClick={this.cancelReset}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Switch Warning Dialog */}
        {showCategoryWarning && (
          <div className="confirmation-overlay" onClick={this.cancelCategorySwitch}>
            <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="confirmation-header">
                <h3>⚠️ Switch Category</h3>
              </div>
              <div className="confirmation-content">
                <p>Switching categories will reset your current progress.</p>
                <p>Level: {level}, Score: {score}, Correct: {correct}</p>
                <p>Continue to <strong>{pendingCategory}</strong>?</p>
                <div className="confirmation-buttons">
                  <button className="confirm-button" onClick={this.confirmCategorySwitch}>
                    Yes, Switch
                  </button>
                  <button className="cancel-button" onClick={this.cancelCategorySwitch}>
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
              onClick={() => this.handleCardClick(card)}
            >
              <div className="card-blank"></div>
              <div className="card-emoji">{card.emoji}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default MemoryGame;