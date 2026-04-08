import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { apiUrl } from '../config/api';

const Level = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const terminalRef = useRef(null);

  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [proof, setProof] = useState('');
  const [revealedHints, setRevealedHints] = useState([]);
  const [hintLoading, setHintLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    fetchLevel();
    fetchStatus();
  }, [levelId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const fetchLevel = async () => {
    try {
      const res = await axios.get(apiUrl('/api/levels'), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const level = res.data.find((l) => l.level === Number(levelId));
      setLevelData(level || null);
    } catch (error) {
      toast.error('Failed to load level');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await axios.get(apiUrl(`/api/levels/${levelId}/session/status`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.active) {
        setSession({ sessionId: res.data.sessionId, expiresAt: res.data.expiresAt });
      }
    } catch (error) {
      // ignore
    }
  };

  const startSession = async () => {
    try {
      const res = await axios.post(apiUrl(`/api/levels/${levelId}/session/start`), {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSession({ sessionId: res.data.sessionId, expiresAt: res.data.expiresAt });
      setTerminalOutput((prev) => `${prev}\n[session started]\n`);
      toast.success('Session started');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start session');
    }
  };

  const stopSession = async () => {
    try {
      await axios.post(apiUrl(`/api/levels/${levelId}/session/stop`), {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSession(null);
      setTerminalOutput((prev) => `${prev}\n[session stopped]\n`);
      toast.success('Session stopped');
    } catch (error) {
      toast.error('Failed to stop session');
    }
  };

  const resetSession = async () => {
    try {
      const res = await axios.post(apiUrl(`/api/levels/${levelId}/session/reset`), {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSession({ sessionId: res.data.sessionId, expiresAt: res.data.expiresAt });
      setTerminalOutput('');
      setTerminalOutput('[session reset]\n');
      toast.success('Session reset');
    } catch (error) {
      toast.error('Failed to reset session');
    }
  };

  const submitTerminalInput = (e) => {
    e.preventDefault();
    if (!session?.sessionId || !terminalInput.trim()) return;
    axios.post(apiUrl(`/api/levels/${levelId}/session/command`), {
      command: terminalInput
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then((res) => {
      setTerminalOutput((prev) => `${prev}$ ${terminalInput}\n${res.data.output || ''}`);
    }).catch((error) => {
      setTerminalOutput((prev) => `${prev}$ ${terminalInput}\n${error.response?.data?.error || 'command failed'}\n`);
    });
    setTerminalInput('');
  };

  const revealHint = async () => {
    const nextIndex = revealedHints.length;
    setHintLoading(true);
    try {
      const res = await axios.post(apiUrl('/api/levels/use-hint'), {
        level: Number(levelId),
        hintIndex: nextIndex
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setRevealedHints((prev) => [...prev, res.data.hint]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'No more hints');
    } finally {
      setHintLoading(false);
    }
  };

  const validateLevel = async (e) => {
    e.preventDefault();
    setValidating(true);
    try {
      const res = await axios.post(apiUrl(`/api/levels/${levelId}/validate`), { proof }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        navigate('/dashboard');
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Loading level...</div>;
  }
  if (!levelData) {
    return <div className="min-h-screen pt-20 flex items-center justify-center text-red-400">Level not found.</div>;
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-5xl mx-auto space-y-4">
        <button onClick={() => navigate('/dashboard')} className="text-xs text-gray-500 hover:text-neon-blue">
          &lt;-- BACK TO MISSION CONTROL
        </button>

        <div className="glass-strong p-6 rounded-xl">
          <h1 className="text-2xl font-black text-white">L{levelData.level} - {levelData.name}</h1>
          <p className="text-sm text-gray-300 mt-2">{levelData.description}</p>
          <p className="text-xs text-neon-blue mt-2">Objective: {levelData.objective}</p>
          <pre className="mt-3 text-xs text-neon-green whitespace-pre-wrap">{levelData.challengeData}</pre>
        </div>

        <div className="glass p-4 rounded-xl">
          <div className="flex gap-2 mb-3">
            <button onClick={startSession} className="cyber-btn px-3 py-2 text-xs">Start Session</button>
            <button onClick={resetSession} className="cyber-btn px-3 py-2 text-xs">Reset Session</button>
            <button onClick={stopSession} className="cyber-btn px-3 py-2 text-xs">Stop Session</button>
          </div>
          <div ref={terminalRef} className="bg-black/70 border border-neon-blue/30 rounded p-3 h-72 overflow-y-auto text-xs font-mono text-neon-green whitespace-pre-wrap">
            {terminalOutput || '[no terminal output yet]'}
          </div>
          <form onSubmit={submitTerminalInput} className="mt-2 flex gap-2">
            <input
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              className="terminal-input flex-1 px-3 py-2 rounded"
              placeholder="Type command and press Enter"
            />
            <button className="cyber-btn px-3 py-2 text-xs" type="submit">Send</button>
          </form>
          {session && <div className="mt-2 text-[11px] text-gray-500">Session: {session.sessionId}</div>}
        </div>

        <div className="glass p-4 rounded-xl">
          <div className="text-yellow-400 text-xs mb-2">Hints ({revealedHints.length}/{levelData.hints?.length || 0})</div>
          {revealedHints.map((h, i) => (
            <div key={i} className="text-xs text-yellow-300 mb-1">- {h}</div>
          ))}
          <button disabled={hintLoading || revealedHints.length >= (levelData.hints?.length || 0)} onClick={revealHint} className="cyber-btn px-3 py-2 text-xs mt-2">
            Reveal Hint (-5 points)
          </button>
        </div>

        <form onSubmit={validateLevel} className="glass-strong p-4 rounded-xl">
          <label className="text-xs text-gray-400">Submit proof token</label>
          <div className="flex gap-2 mt-2">
            <input value={proof} onChange={(e) => setProof(e.target.value)} className="terminal-input flex-1 px-3 py-2 rounded" placeholder="bandit{...}" />
            <button disabled={validating} className="cyber-btn px-4 py-2 text-xs" type="submit">
              {validating ? 'Validating...' : 'Validate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Level;
