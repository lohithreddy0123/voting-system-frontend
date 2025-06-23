import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

// ✅ Deployed backend API URL
const API_BASE = 'https://fast-api-backend-srz0.onrender.com';

function App() {
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [voted, setVoted] = useState(false);
  const [name, setName] = useState('');

  // Load previous vote state from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('voter_name');
    const storedVote = localStorage.getItem('voted');

    if (storedName && storedVote === 'true') {
      setName(storedName);
      setVoted(true);
    }

    // Fetch options from deployed backend
    axios.get(`${API_BASE}/api/votes/`)
      .then(res => setOptions(res.data))
      .catch(err => {
        console.error('Error fetching options', err);
        alert("Failed to load voting options.");
      });

    // WebSocket for live updates (secure connection)
    const socket = new WebSocket('wss://fast-api-backend-srz0.onrender.com/ws');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        setOptions(data.payload);
      }
    };

    return () => socket.close();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!selectedId) {
      alert("Please select an option before submitting.");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/votes/cast/`, {
        id: selectedId,
        name: name.trim(),
      });

      setVoted(true);
      localStorage.setItem('voted', 'true');
      localStorage.setItem('voter_name', name.trim());

      setOptions(prev =>
        prev.map(opt => (opt.id === selectedId ? response.data : opt))
      );
    } catch (err) {
      console.error('Vote failed', err);
      alert(err?.response?.data?.detail || "Error submitting vote.");
    }
  };

  return (
    <div className="app-container">
      <div className="voting-card">
        <h1>🗳️ Real-Time Voting</h1>

        <p>Enter your name to vote:</p>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={voted}
          className="name-input"
        />

        <p>Select an option:</p>
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
            disabled={!selectedId || !name.trim()}
          >
            Submit Vote
          </button>
        )}

        {voted && (
          <div className="result-msg">
            ✅ <strong>{name}</strong>, your vote has been submitted!
          </div>
        )}

        <div className="live-results">
          <h2>📊 Live Results</h2>
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
