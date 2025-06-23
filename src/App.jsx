import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'https://fast-api-backend-srz0.onrender.com';

function App() {
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [voted, setVoted] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    // Restore voting state from localStorage
    const storedName = localStorage.getItem('voter_name');
    const hasVoted = localStorage.getItem('voted') === 'true';

    if (storedName && hasVoted) {
      setName(storedName);
      setVoted(true);
    }

    // Fetch voting options
    axios.get(`${API_BASE}/api/votes/`)
      .then(res => setOptions(res.data))
      .catch(err => {
        console.error('Failed to load options:', err);
        alert("Could not fetch voting options. Try again later.");
      });

    // Connect to WebSocket for real-time updates
    const socket = new WebSocket('wss://fast-api-backend-srz0.onrender.com/ws');

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'update') {
        setOptions(message.payload);
      }
    };

    return () => socket.close();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Enter your name before voting.");
      return;
    }

    if (!selectedId) {
      alert("Please select an option.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/votes/cast/`, {
        id: selectedId,
        name: name.trim(),
      });

      setVoted(true);
      localStorage.setItem('voted', 'true');
      localStorage.setItem('voter_name', name.trim());

      setOptions(prev =>
        prev.map(opt => opt.id === selectedId ? res.data : opt)
      );
    } catch (err) {
      console.error('Vote failed:', err);
      alert(err?.response?.data?.detail || "Something went wrong while voting.");
    }
  };

  const handleRemoveVote = () => {
    localStorage.removeItem('voted');
    localStorage.removeItem('voter_name');
    setVoted(false);
    setSelectedId(null);
    setName('');
  };

  return (
    <div className="app-container">
      <div className="voting-card">
        <h1>Real-Time Voting</h1>

        <label>
          <p>Your Name:</p>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={voted}
            className="name-input"
          />
        </label>

        <p>Select an Option:</p>
        <div className="options-grid">
          {options.length === 0 ? (
            <p>Loading options...</p>
          ) : (
            options.map(option => (
              <button
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={`option-btn ${selectedId === option.id ? 'selected' : ''}`}
                disabled={voted}
              >
                {option.title} <span className="vote-count">({option.votes})</span>
              </button>
            ))
          )}
        </div>

        {!voted && (
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!name.trim() || !selectedId}
          >
            Submit Vote
          </button>
        )}

        {voted && (
          <>
            <div className="result-msg">
              Thanks, <strong>{name}</strong>. Your vote has been recorded!
            </div>
            <button
              onClick={handleRemoveVote}
              className="remove-vote-btn"
              style={{ marginTop: '10px' }}
            >
              Remove My Vote
            </button>
          </>
        )}

        <div className="live-results">
          <h2>Live Results</h2>
          <ul>
            {options.map(opt => (
              <li key={opt.id}>
                <span>{opt.title}</span>
                <span className="live-count">{opt.votes} votes</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
