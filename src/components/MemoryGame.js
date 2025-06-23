import React, { useState, useEffect } from 'react';
import './MemoryGame.css';

const EMOJIS = ["😊", "😂", "😍", "😎", "🤔", "😴", "🥳", "🤯"];

const shuffleArray = (array) => {
  return array.sort(() => 0.5 - Math.random());
};

const generateCards = () => {
  const emojis = shuffleArray([...EMOJIS, ...EMOJIS]);
  return emojis.map((emoji, index) => ({
    id: index,
    emoji: emoji,
    isFlipped: false,
    isMatched: false,
  }));
};

const MemoryGame = () => {
  const [cards, setCards] = useState(generateCards());
  const [flippedCards, setFlippedCards] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const level = 1; // Static for now
  const [isChecking, setIsChecking] = useState(false);

  const startGame = () => {
    setCards(generateCards());
    setFlippedCards([]);
    setScore(0);
    setCorrect(0);
    setIncorrect(0);
    setIsChecking(false);
  };

  useEffect(() => {
    startGame();
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
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.emoji === card1.emoji ? { ...card, isMatched: true } : card
        )
      );
      setScore((prevScore) => prevScore + 10);
      setCorrect((prevCorrect) => prevCorrect + 1);
    } else {
      setCards((prevCards) =>
        prevCards.map((card) =>
          (card.id === card1.id || card.id === card2.id) ? { ...card, isFlipped: false } : card
        )
      );
      setIncorrect((prevIncorrect) => prevIncorrect + 1);
    }
    setFlippedCards([]);
    setIsChecking(false);
  };

  const handleCardClick = (clickedCard) => {
    if (isChecking || clickedCard.isFlipped || clickedCard.isMatched || flippedCards.length === 2) {
      return;
    }

    const newFlippedCard = { ...clickedCard, isFlipped: true };
    setCards(cards.map(card => card.id === clickedCard.id ? newFlippedCard : card));
    setFlippedCards([...flippedCards, newFlippedCard]);
  };

  return (
    <div className="memory-game">
      <h1>Memory Game</h1>
      <div className="stats">
        <div>Level: {level}/6</div>
        <div>Score: {score}</div>
        <div>Correct: {correct}</div>
        <div>Incorrect: {incorrect}</div>
      </div>
      <button className="reset-button" onClick={startGame}>
        Reset Game
      </button>
      <div className="card-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`card ${card.isFlipped || card.isMatched ? 'flipped' : ''}`}
            onClick={() => handleCardClick(card)}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">{card.emoji}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryGame; 