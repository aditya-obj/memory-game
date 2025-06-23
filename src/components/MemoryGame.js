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

  const checkForMatch = () => {
    const [card1, card2] = flippedCards;
    if (card1.emoji === card2.emoji) {
      setCards(prevCards =>
        prevCards.map(card =>
          card.emoji === card1.emoji ? { ...card, isMatched: true, isFlipped: true } : card
        )
      );
      setScore(prevScore => prevScore + 10);
      setCorrect(prevCorrect => prevCorrect + 1);
    } else {
      setCards(prevCards =>
        prevCards.map(card =>
          (card.id === card1.id || card.id === card2.id) ? { ...card, isFlipped: false } : card
        )
      );
      setIncorrect(prevIncorrect => prevIncorrect + 1);
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
      </header>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="preview-status">
        {isPreviewing ? `Preview: ${previewTime}s` : "Preview: 0s"}
      </div>
      <div className="stats-container">
        <div className="stat-item">Level <br/> <span>{level}/6</span></div>
        <div className="stat-item">Score <br/> <span>{score}</span></div>
        <div className="stat-item">Correct <br/> <span>{correct}</span></div>
        <div className="stat-item">Incorrect <br/> <span>{incorrect}</span></div>
      </div>
      <button className="reset-button" onClick={() => startGame(category)}>
        RESET GAME
      </button>
      <div className="card-grid">
        {cards.map((card) => (
          <div
            key={card.id}
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