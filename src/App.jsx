import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [voted, setVoted] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8000/api/votes/')
      .then(res => setOptions(res.data))
      .catch(err => console.error('Error fetching options', err));
  }, []);

  const handleVote = async (optionId) => {
    if (!name) {
      alert("Please enter your name before voting.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/votes/cast/', {
        id: optionId,
        name: name,
      });
      setSelected(response.data.title);
      setVoted(true);
      // Update vote count locally (optional refresh)
      setOptions(prev =>
        prev.map(opt => opt.id === optionId ? response.data : opt)
      );
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  return (
    <div className="container">
      <h1>🗳️ Real-Time Voting</h1>
      <p>Enter your name to vote:</p>
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={voted}
      />

      <p>Select an option to vote:</p>
      <div className="options">
        {options.length === 0 ? (
          <p>Loading options...</p>
        ) : (
          options.map(option => (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              className={`option-btn ${selected === option.title ? 'selected' : ''}`}
              disabled={voted}
            >
              {option.title} ({option.votes})
            </button>
          ))
        )}
      </div>

      {voted && (
        <div className="result-msg">
          ✅ <strong>{name}</strong> voted for <strong>{selected}</strong>!
        </div>
      )}
    </div>
  );
}

export default App;
