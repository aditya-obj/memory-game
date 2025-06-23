import React from 'react';
import './App.css';
import MemoryGame from './components/MemoryGame';

/**
 * Main App component that renders the Memory Game
 * @returns {JSX.Element} The main application component
 */
function App() {
  return (
    <div className="App">
      <MemoryGame />
    </div>
  );
}

export default App;
