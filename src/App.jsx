import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import Wheel from './components/Wheel'
import './App.css'

function App() {
  const [namesText, setNamesText] = useState(() => {
    const saved = localStorage.getItem('wheelNames');
    return saved || "Alice\nBob\nCharlie\nDiana\nEvan\nFiona\nGeorge";
  });
  
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState(null);

  // Parse valid segments from textarea
  const segments = namesText.split('\n').map(n => n.trim()).filter(n => n.length > 0);

  // Save to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('wheelNames', namesText);
  }, [namesText]);

  const handleSpinClick = () => {
    if (mustSpin || segments.length === 0) return;
    
    // Pick a random winner cryptographically
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const randomNumber = randomBuffer[0] / (0xffffffff + 1);
    
    const newPrizeNumber = Math.floor(randomNumber * segments.length);
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
    setWinner(null); // Clear previous winner overlay
  }

  const handleStopSpinning = () => {
    setMustSpin(false);
    const winningName = segments[prizeNumber];
    setWinner(winningName);
    
    // Trigger celebration
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#f8fafc', '#38bdf8']
    });
    
    // Remove winning name logic (removes ALL instances of that name)
    setTimeout(() => {
      const newSegments = segments.filter(name => name.toLowerCase() !== winningName.toLowerCase());
      setNamesText(newSegments.join('\n'));
    }, 3000); // Wait 3s before removing so user can see it on the wheel
  };

  const currentNamesCount = segments.length;

  return (
    <div className="app-container">
      {/* Interactive Wheel Area */}
      <div className="wheel-section">
        <Wheel 
          segments={segments}
          mustSpin={mustSpin}
          prizeNumber={prizeNumber}
          onStopSpinning={handleStopSpinning}
        />
        
        {/* Winner Overlay */}
        {winner && !mustSpin && (
          <div className="winner-announcement">
            <h1 className="winner-name">{winner}!</h1>
            <p className="winner-subtext">is the winner</p>
          </div>
        )}
      </div>

      {/* Input and Controls Area */}
      <div className="sidebar-section">
        <div className="sidebar-header">
          <h2>Name Wheel</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {currentNamesCount} {currentNamesCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        
        <div className="entries-container">
          <textarea 
            className="entries-textarea"
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            disabled={mustSpin}
            placeholder="Alice&#10;Bob&#10;Charlie"
            spellCheck="false"
          />
        </div>
        
        <button 
          className="spin-button" 
          onClick={handleSpinClick}
          disabled={mustSpin || currentNamesCount === 0}
          style={{ 
            opacity: (mustSpin || currentNamesCount === 0) ? 0.5 : 1,
            cursor: (mustSpin || currentNamesCount === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {mustSpin ? 'Spinning...' : 'Spin Wheel!'}
        </button>
      </div>
    </div>
  )
}

export default App
