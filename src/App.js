import './App.css';
import MemoryGame from './components/MemoryGame';
import MemoryGameClass from './components/MemoryGame.class.js';

function App() {
  return (
    <div className="App">
      <div className="component-container">
        {/* <h2>Functional Component (Hooks)</h2> */}
        <MemoryGame />
      </div>
      <div className="component-container">
        {/* <h2>Class-Based Component</h2> */}
        {/* <MemoryGameClass /> */}
      </div>
    </div>
  );
}

export default App;
