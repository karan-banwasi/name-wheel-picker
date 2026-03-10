import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import Wheel from './components/Wheel'
import './App.css'

function App() {
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('wheelEntries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate schema: must be an array of objects with valid string names and integer counts >= 0
        if (Array.isArray(parsed) && parsed.every(e => 
            e && typeof e.id === 'string' && 
            typeof e.name === 'string' && 
            Number.isInteger(e.count) && e.count >= 0)) {
          return parsed;
        }
        console.warn('Invalid wheel entries in localStorage, falling back to default.');
      } catch (e) {
        console.warn('Failed to parse wheel entries from localStorage, falling back to default.');
      }
    }
    return [
      { id: '1', name: 'Alice', count: 1 },
      { id: '2', name: 'Bob', count: 1 },
      { id: '3', name: 'Charlie', count: 2 },
      { id: '4', name: 'Diana', count: 1 }
    ];
  });
  
  const [newName, setNewName] = useState("");
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState(null); // Will now store { id, name }

  // Generate array of full entry objects for exact winner resolution
  const wheelSegments = entries.flatMap(entry => Array(entry.count).fill(entry));
  
  // Pluck just the names for the Canvas renderer
  const segments = wheelSegments.map(e => e.name);

  // Save to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('wheelEntries', JSON.stringify(entries));
  }, [entries]);

  const handleAddName = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setEntries(prev => [
      ...prev, 
      { id: Date.now().toString(), name: newName.trim(), count: 1 }
    ]);
    setNewName("");
  };

  const updateCount = (id, delta) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const newCount = Math.max(0, entry.count + delta);
        return { ...entry, count: newCount };
      }
      return entry;
    }).filter(e => e.count > 0)); // Auto-remove if count reaches 0
  };

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
    
    // Map the exact prize index back to the specific entry object that won
    const winningEntry = wheelSegments[prizeNumber];
    setWinner({ id: winningEntry.id, name: winningEntry.name });
    
    // Trigger celebration
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#f8fafc', '#38bdf8']
    });
  };

  const resolveWinner = (action) => {
    if (!winner) return;

    if (action === 'remove_one') {
      updateCount(winner.id, -1);
    } else if (action === 'remove_all') {
      setEntries(prev => prev.filter(e => e.id !== winner.id));
    }
    // 'keep' does nothing to state

    setWinner(null);
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
            <h1 className="winner-name">{winner.name}!</h1>
            <p className="winner-subtext">is the winner</p>
            
            <div className="winner-actions">
              <button className="action-btn remove-1" onClick={() => resolveWinner('remove_one')}>
                Remove 1 Ticket
              </button>
              <button className="action-btn remove-all" onClick={() => resolveWinner('remove_all')}>
                Remove All
              </button>
              <button className="action-btn keep" onClick={() => resolveWinner('keep')}>
                Keep All
              </button>
            </div>
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
          <form className="add-entry-form" onSubmit={handleAddName}>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              placeholder="Add a new name..."
              className="add-input"
              disabled={mustSpin}
            />
            <button type="submit" className="add-btn" disabled={mustSpin || !newName.trim()}>
              +
            </button>
          </form>

          <div className="entries-list">
            {entries.map(entry => (
              <div key={entry.id} className="entry-row">
                <span className="entry-name">{entry.name}</span>
                <div className="entry-controls">
                  <button 
                    className="count-btn" 
                    onClick={() => updateCount(entry.id, -1)}
                    disabled={mustSpin}
                  >
                    -
                  </button>
                  <span className="entry-count">{entry.count}</span>
                  <button 
                    className="count-btn" 
                    onClick={() => updateCount(entry.id, 1)}
                    disabled={mustSpin}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="empty-state">No entries yet. Add some above!</div>
            )}
          </div>
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
