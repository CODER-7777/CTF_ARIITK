import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { apiUrl } from '../config/api';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLevelDb, setShowLevelDb] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await axios.get(apiUrl('/api/admin/users'));
      setUsers(res.data.users);
      setStats(res.data.stats);
      setLevels(res.data.levels || []);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (userId, username) => {
    if (!window.confirm(`Reset all progress for "${username}"? This cannot be undone.`)) return;
    try {
      await axios.post(apiUrl(`/api/admin/users/${userId}/reset`));
      toast.success(`Progress reset for ${username}`);
      setSelectedUser(null);
      fetchAdminData();
    } catch (err) {
      toast.error('Reset failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-pink/30 border-t-neon-pink rounded-full animate-spin mx-auto mb-4" />
          <span className="text-sm text-gray-500 font-mono tracking-widest">LOADING ADMIN DATA</span>
        </div>
      </div>
    );
  }

  const statCards = stats ? [
    { label: 'Total Agents', value: stats.totalUsers, color: 'neon-blue' },
    { label: 'Total Score', value: stats.totalScore, color: 'neon-green' },
    { label: 'Avg Score', value: stats.avgScore?.toFixed(1), color: 'neon-pink' },
    { label: 'Levels Solved', value: stats.levelsSolved, color: 'yellow-400' }
  ] : [];

  return (
    <div className="min-h-screen pt-20 px-4 md:px-8 pb-16">
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-neon-pink/3 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mt-8 mb-10">
          <div className="flex justify-between items-end mb-2">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black text-white tracking-wider mb-2"
              >
                ADMIN <span className="text-neon-pink text-glow-pink">OVERRIDE</span>
              </motion.h1>
              <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">
                System monitoring -- privileged access -- user answers visible
              </p>
            </div>
            <button
              onClick={() => setShowLevelDb(!showLevelDb)}
              className={`px-4 py-2 rounded font-mono text-xs tracking-tighter border transition-all ${
                showLevelDb 
                  ? 'bg-neon-pink/20 border-neon-pink text-neon-pink glow-pink' 
                  : 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue hover:bg-neon-blue/20'
              }`}
            >
              {showLevelDb ? 'SHOW AGENT REGISTRY' : 'VIEW MISSION DATABASE (SOLUTIONS)'}
            </button>
          </div>
          <div className="neon-line mt-4" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass p-5 rounded-xl border-l-2"
              style={{ borderLeftColor: `var(--${stat.color})` }}
            >
              <div className={`text-3xl font-black text-${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {!showLevelDb ? (
          <>
            {/* Users Table */}
            <div className="glass-strong rounded-xl overflow-hidden cyber-corner">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
              Agent Registry -- Click "Details" to see submitted answers
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Agent</th>
                  <th className="px-5 py-3 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Email</th>
                  <th className="px-5 py-3 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Squad</th>
                  <th className="px-5 py-3 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Score</th>
                  <th className="px-5 py-3 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Progress</th>
                  <th className="px-5 py-3 text-[10px] font-mono text-gray-500 tracking-widest uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const completedLevels = u.progress?.filter(p => p.completed).length || 0;
                  const progressPercent = Math.min((completedLevels / 20) * 100, 100);

                  return (
                    <motion.tr
                      key={u._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b border-white/3 hover:bg-white/3 transition-colors
                        ${selectedUser?._id === u._id ? 'bg-neon-blue/5' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-neon-blue">
                            {u.username?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm">{u.username}</span>
                            {u.isAdmin && (
                              <span className="ml-2 text-[9px] text-neon-pink border border-neon-pink/30 px-1.5 py-0.5 rounded tracking-widest uppercase">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 font-mono">{u.email}</td>
                      <td className="px-5 py-4 text-xs text-gray-400 font-mono">{u.team || '--'}</td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-neon-green text-sm">{u.score}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-neon-blue to-neon-pink rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">{completedLevels}/20</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)}
                            className={`text-[10px] border px-3 py-1.5 rounded font-mono tracking-wider transition-colors
                              ${selectedUser?._id === u._id 
                                ? 'text-neon-blue border-neon-blue/40 bg-neon-blue/10' 
                                : 'text-neon-blue border-neon-blue/20 hover:bg-neon-blue/10'}`}
                          >
                            {selectedUser?._id === u._id ? 'Hide' : 'Details'}
                          </button>
                          <button
                            onClick={() => handleReset(u._id, u.username)}
                            className="text-[10px] text-red-400 border border-red-500/20 hover:bg-red-500/10 px-3 py-1.5 rounded font-mono tracking-wider transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="p-12 text-center text-gray-600 font-mono text-sm">
              No agents registered yet.
            </div>
          )}
        </div>
      </>
    ) : (
      /* MISSION DATABASE (LEVEL SOLUTIONS) */
          <div className="space-y-6">
            <div className="glass-strong p-6 cyber-corner">
              <h2 className="text-lg font-black text-neon-blue text-glow-blue mb-4 tracking-widest uppercase">
                MASTER MISSION DATABASE (WALKTHROUGHS & FLAGS)
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {levels.sort((a, b) => a.level - b.level).map((lvl) => (
                  <div key={lvl._id} className="glass p-5 border border-white/5 rounded-xl hover:border-neon-blue/30 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-xl font-black text-neon-blue">
                          {lvl.level}
                        </div>
                        <div>
                          <h3 className="font-bold text-white tracking-wider">{lvl.name}</h3>
                          <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">{lvl.category} | {lvl.points} PTS</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Correct Flag</div>
                        <code className="text-xs text-neon-green bg-black/40 px-3 py-1.5 rounded font-mono border border-neon-green/20">
                          {lvl.flag}
                        </code>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                        <div className="text-[10px] text-neon-pink font-mono uppercase tracking-widest mb-2">Walkthrough / Solution</div>
                        <p className="text-xs text-gray-400 leading-relaxed font-mono">
                          {lvl.walkthrough || 'No walkthrough available for this mission.'}
                        </p>
                      </div>
                      <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                        <div className="text-[10px] text-yellow-500 font-mono uppercase tracking-widest mb-2">Available Hints</div>
                        <p className="text-xs text-gray-400 leading-relaxed font-mono italic">
                          {lvl.hints && lvl.hints.length > 0 ? lvl.hints.join(' | ') : 'No hints configured.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expanded User Detail with ANSWERS */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-strong p-6 rounded-xl mt-6 cyber-corner"
            >
              {/* User info header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-neon-blue tracking-widest uppercase font-mono">
                  Agent Detail: {selectedUser.username}
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-xs text-gray-500 hover:text-white transition-colors font-mono"
                >
                  Close
                </button>
              </div>

              {/* User stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Email</div>
                  <div className="text-sm text-white font-mono">{selectedUser.email}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Squad</div>
                  <div className="text-sm text-white">{selectedUser.team || '--'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Score</div>
                  <div className="text-sm text-neon-green font-mono font-bold">{selectedUser.score}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Levels Done</div>
                  <div className="text-sm text-neon-blue font-mono font-bold">{selectedUser.progress?.filter(p => p.completed).length || 0}/20</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Joined</div>
                  <div className="text-sm text-gray-300 font-mono">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="neon-line mb-6" />

              {/* Submitted Proof Table */}
              <div className="mb-2">
                <h4 className="text-xs text-neon-pink font-mono tracking-widest uppercase mb-4">
                  Submitted Proof / Expected Flags
                </h4>
              </div>

              {selectedUser.progress?.filter(p => p.completed).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-4 py-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Level</th>
                        <th className="px-4 py-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Name</th>
                        <th className="px-4 py-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Category</th>
                        <th className="px-4 py-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Proof Submitted</th>
                        <th className="px-4 py-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Expected Flag</th>
                        <th className="px-4 py-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Points</th>
                        <th className="px-4 py-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Attempts</th>
                        <th className="px-4 py-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Solved At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.progress
                        .filter(p => p.completed)
                        .sort((a, b) => a.level - b.level)
                        .map(p => (
                          <tr key={p.level} className="border-b border-white/3 hover:bg-white/3">
                            <td className="px-4 py-3">
                              <span className="font-mono text-neon-blue text-sm font-bold">
                                {p.level < 10 ? `0${p.level}` : p.level}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-white">{p.levelName || '--'}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">{p.category || '--'}</td>
                            <td className="px-4 py-3">
                              <code className="text-xs text-neon-green bg-black/40 px-2 py-1 rounded font-mono">
                                {p.proof || 'N/A'}
                              </code>
                            </td>
                            <td className="px-4 py-3">
                              <code className="text-xs text-yellow-400 bg-black/40 px-2 py-1 rounded font-mono">
                                {p.expectedFlag || 'N/A'}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-xs text-neon-green font-mono font-bold">+{p.points}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">{p.attempts || 1}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                              {p.solvedAt ? new Date(p.solvedAt).toLocaleString() : '--'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-600 font-mono text-sm bg-black/20 rounded-lg">
                  This agent has not completed any levels yet.
                </div>
              )}

              {/* Unsolved levels summary */}
              {selectedUser.progress && (
                <div className="mt-6">
                  <h4 className="text-xs text-gray-500 font-mono tracking-widest uppercase mb-3">
                    Unsolved Levels
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({length: 20}, (_, i) => i + 1)
                      .filter(lvl => !selectedUser.progress.some(p => p.level === lvl && p.completed))
                      .map(lvl => (
                        <span key={lvl} className="px-2.5 py-1 rounded bg-white/5 border border-white/5 text-gray-600 text-xs font-mono">
                          Lvl {lvl}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
