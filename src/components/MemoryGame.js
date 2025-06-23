import React, { useState, useEffect } from 'react';
import './MemoryGame.css';

const CARD_SETS = {
  Animals: ["🐘", "🦊", "🐞", "🐸", "🐨", "🐌", "🦁", "🐛"],
  Symbols: ["⚛️", "☯️", "☮️", "⚠️", "♻️", "⚜️", "➿", "🌀"],
  Foods: ["🍕", "🍔", "🍓", "🥑", "🌽", "🍩", "🍪", "🍉"],
};

const shuffleArray = (array) => {
  return array.sort(() => 0.5 - Math.random());
};

const MemoryGame = () => {
  const [category, setCategory] = useState("Animals");
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const level = 1;
  const [isChecking, setIsChecking] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewTime, setPreviewTime] = useState(3);
  
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

  const generateCards = (selectedCategory) => {
    const emojis = shuffleArray([...CARD_SETS[selectedCategory], ...CARD_SETS[selectedCategory]]);
    return emojis.map((emoji, index) => ({
      id: index,
      emoji: emoji,
      isFlipped: false,
      isMatched: false,
    }));
  };

  const startGame = (selectedCategory) => {
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
    
    const newCards = generateCards(selectedCategory);
    
    // Preview phase with countdown
    setIsPreviewing(true);
    setPreviewTime(3);
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
    }, 1000);
  };

  useEffect(() => {
    startGame("Animals");
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      setTimeout(checkForMatch, 1000);
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
      duration: 1500, // Reduced from 1800ms to 1500ms
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' // ease-in-out with custom curve
    });
    
    // Remove element when animation completes
    setTimeout(() => {
      flyingEmoji.remove();
    }, 1500); // Updated to match new duration
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
        setTimeout(() => createFlyingEmoji(card1.emoji, card1Element, currentProgress), 200);
        setTimeout(() => createFlyingEmoji(card2.emoji, card2Element, currentProgress), 400);
        
        // Delay state updates until flying emoji animation completes
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.emoji === card1.emoji ? { ...card, isMatched: true, isFlipped: true } : card
            )
          );
          triggerScoreAnimation(score + 10);
          triggerCorrectAnimation(correct + 1);
          
          // Trigger progress bar pulse immediately when progress increases
          setTimeout(() => {
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
              progressBar.classList.add('emoji-received');
              setTimeout(() => {
                progressBar.classList.remove('emoji-received');
              }, 500);
            }
          }, 50); // Very small delay to ensure progress bar has updated
        }, 1500); // Flying animation duration (1500ms)
      } else {
        // Fallback if elements not found - immediate update
        setCards(prevCards =>
          prevCards.map(card =>
            card.emoji === card1.emoji ? { ...card, isMatched: true, isFlipped: true } : card
          )
        );
        triggerScoreAnimation(score + 10);
        triggerCorrectAnimation(correct + 1);
      }
    } else {
      setCards(prevCards =>
        prevCards.map(card =>
          (card.id === card1.id || card.id === card2.id) ? { ...card, isFlipped: false } : card
        )
      );
      triggerIncorrectAnimation(incorrect + 1);
      // Decrease score by 1 for incorrect guess, but don't go below 0
      triggerScoreAnimation(Math.max(0, score - 1));
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
      setTimeout(() => setScoreAnimation(''), 600);
    } else if (newScore < score) {
      setScoreAnimation('score-decrease');
      setTimeout(() => setScoreAnimation(''), 500);
    }
    setScore(newScore);
  };

  const triggerCorrectAnimation = (newCorrect) => {
    setPrevCorrect(correct);
    if (newCorrect > correct) {
      setCorrectAnimation('stat-increase');
    }
    setCorrect(newCorrect);
    
    setTimeout(() => setCorrectAnimation(''), 600);
  };

  const triggerIncorrectAnimation = (newIncorrect) => {
    setPrevIncorrect(incorrect);
    if (newIncorrect > incorrect) {
      setIncorrectAnimation('stat-increase');
    }
    setIncorrect(newIncorrect);
    
    setTimeout(() => setIncorrectAnimation(''), 600);
  };

  const triggerLevelAnimation = (newLevel) => {
    setPrevLevel(level);
    if (newLevel > level) {
      setLevelAnimation('stat-increase');
    }
    
    setTimeout(() => setLevelAnimation(''), 600);
  };

  const progress = (correct / (cards.length / 2)) * 100;

  return (
    <div className="game-board">
      <header className="game-header">
        <div className="category-selector">
          {Object.keys(CARD_SETS).map((cat) => (
            <button
              key={cat}
              className={`category-button ${category === cat ? "active" : ""}`}
              onClick={() => startGame(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </header>
      
      <div className="preview-status">{isPreviewing ? `Preview: ${previewTime}s` : "Preview: 0s"}</div>
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
      <button className="reset-button" onClick={() => startGame(category)}>
        RESET GAME
      </button>
      <div className="card-grid">
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