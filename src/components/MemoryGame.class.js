import React, { Component } from 'react';
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

class MemoryGame extends Component {
  state = {
    cards: generateCards(),
    flippedCards: [],
    score: 0,
    correct: 0,
    incorrect: 0,
    level: 1,
  };

  componentDidMount() {
    this.startGame();
  }

  startGame = () => {
    this.setState({
      cards: generateCards(),
      flippedCards: [],
      score: 0,
      correct: 0,
      incorrect: 0,
    });
  };

  handleCardClick = (clickedCard) => {
    if (this.state.flippedCards.length === 2) {
      return;
    }

    const newCards = this.state.cards.map((card) =>
      card.id === clickedCard.id ? { ...card, isFlipped: true } : card
    );

    const newFlippedCards = [...this.state.flippedCards, clickedCard];
    this.setState({ cards: newCards, flippedCards: newFlippedCards }, () => {
      if (newFlippedCards.length === 2) {
        this.checkForMatch();
      }
    });
  };

  checkForMatch = () => {
    const [card1, card2] = this.state.flippedCards;

    if (card1.emoji === card2.emoji) {
      const newCards = this.state.cards.map((card) =>
        card.emoji === card1.emoji ? { ...card, isMatched: true } : card
      );
      this.setState((prevState) => ({
        cards: newCards,
        flippedCards: [],
        score: prevState.score + 10,
        correct: prevState.correct + 1,
      }));
    } else {
      setTimeout(() => {
        const newCards = this.state.cards.map((card) =>
          !card.isMatched ? { ...card, isFlipped: false } : card
        );
        this.setState((prevState) => ({
          cards: newCards,
          flippedCards: [],
          incorrect: prevState.incorrect + 1,
        }));
      }, 1000);
    }
  };

  render() {
    const { cards, score, correct, incorrect, level } = this.state;

    return (
      <div className="memory-game">
        <h1>Memory Game</h1>
        <div className="stats">
          <div>Level: {level}/6</div>
          <div>Score: {score}</div>
          <div>Correct: {correct}</div>
          <div>Incorrect: {incorrect}</div>
        </div>
        <button className="reset-button" onClick={this.startGame}>
          Reset Game
        </button>
        <div className="card-grid">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`card ${card.isFlipped || card.isMatched ? 'flipped' : ''}`}
              onClick={() => !card.isFlipped && !card.isMatched && this.handleCardClick(card)}
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
  }
}

export default MemoryGame; 