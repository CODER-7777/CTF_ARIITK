import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { apiUrl } from '../config/api';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(apiUrl('/api/leaderboard'));
        setUsers(res.data || []);
      } catch (err) {
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto mb-4" />
          <span className="text-sm text-gray-500 font-mono tracking-widest">LOADING RANKINGS</span>
        </div>
      </div>
    );
  }

  const medals = ['', '', ''];
  const medalColors = [
    'from-yellow-300 to-amber-500',
    'from-gray-300 to-gray-500',
    'from-orange-400 to-amber-700'
  ];

  return (
    <div className="min-h-screen pt-20 px-4 md:px-8 pb-16">
      <div className="fixed top-1/3 right-0 w-[400px] h-[400px] bg-neon-pink/3 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mt-8 mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-white tracking-wider mb-2"
          >
            GLOBAL <span className="text-neon-pink text-glow-pink">RANKINGS</span>
          </motion.h1>
          <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">
            Top agents by score
          </p>
        </div>

        {/* Top 3 Podium (if enough users) */}
        {users.length >= 3 && (
          <div className="flex justify-center items-end gap-4 mb-10">
            {[1, 0, 2].map((idx) => {
              const u = users[idx];
              if (!u) return null;
              const heights = ['h-32', 'h-24', 'h-20'];
              const order = [0, 1, 2];
              return (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="text-center"
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${medalColors[idx]} mx-auto mb-2 flex items-center justify-center text-black font-black text-sm`}>
                    #{idx + 1}
                  </div>
                  <div className="text-white font-bold text-sm mb-1">{u.username}</div>
                  <div className="text-neon-green font-mono text-xs mb-2">{u.score} pts</div>
                  <div className={`${heights[idx]} w-20 bg-gradient-to-t ${medalColors[idx]} rounded-t-lg opacity-20`} />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full table */}
        <div className="glass-strong rounded-xl overflow-hidden cyber-corner">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Rank</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Agent</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Squad</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Levels</th>
                  <th className="px-6 py-4 text-[10px] font-mono text-gray-500 tracking-widest uppercase text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/3 hover:bg-white/3 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className={`font-mono font-bold text-sm
                        ${index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-400' :
                          'text-gray-600'}`}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-neon-blue">
                          {user.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-bold text-white text-sm group-hover:text-neon-blue transition-colors">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">{user.team || '--'}</td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                      {user.levelsCompleted || 0}/20
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-bold text-neon-green text-sm text-glow-green">{user.score}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="p-12 text-center text-gray-600 font-mono text-sm">
              No agents have registered yet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
