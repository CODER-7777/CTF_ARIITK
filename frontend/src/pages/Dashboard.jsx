import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { apiUrl } from '../config/api';

const categoryColors = {
  'Basics': 'from-green-400 to-emerald-600',
  'Linux': 'from-orange-400 to-red-500',
  'Strings': 'from-yellow-400 to-amber-600',
  'Encoding': 'from-blue-400 to-indigo-600',
  'Archives': 'from-purple-400 to-violet-600',
  'Authentication': 'from-pink-400 to-rose-600',
  'Stealth': 'from-gray-400 to-slate-600',
  'Access Control': 'from-cyan-400 to-teal-600',
  'Automation': 'from-lime-400 to-green-600',
  'Web': 'from-fuchsia-400 to-pink-600',
  'Exploitation': 'from-red-500 to-orange-600',
  'Network': 'from-sky-400 to-blue-600',
  'Crypto': 'from-amber-400 to-yellow-600',
  'Final': 'from-neon-blue to-neon-pink',
  'Team': 'from-neon-green to-neon-blue'
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [levels, setLevels] = useState([]);
  const [progress, setProgress] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLevels();
    fetchProgress();
  }, []);

  const fetchLevels = async () => {
    try {
      const res = await axios.get(apiUrl('/api/levels'), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLevels(res.data);
    } catch (err) {
      toast.error('Failed to load levels');
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await axios.get(apiUrl('/api/levels/user-progress'), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProgress(res.data.progress || []);
    } catch (err) {
      toast.error('Failed to load progress');
    }
  };

  const getLevelStatus = (levelNum) => {
    const progressItem = progress.find(p => p.level === levelNum);
    if (progressItem?.completed) return 'completed';
    const levelMeta = levels.find((l) => l.level === levelNum);
    const prerequisites = levelMeta?.prerequisites || (levelNum > 1 ? [levelNum - 1] : []);
    const blocked = prerequisites.some((requiredLevel) => {
      const prerequisiteProgress = progress.find((p) => p.level === requiredLevel);
      return !prerequisiteProgress?.completed;
    });
    if (blocked) return 'locked';
    return 'available';
  };

  const completedCount = progress.filter(p => p.completed).length;
  const progressPercent = levels.length > 0 ? Math.round((completedCount / levels.length) * 100) : 0;

  return (
    <div className="min-h-screen pt-20 px-4 md:px-8 pb-16">
      {/* Ambient */}
      <div className="fixed top-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 bg-neon-blue/3 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <div className="text-center mt-8 mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-white tracking-wider mb-2"
          >
            MISSION <span className="text-neon-blue text-glow-blue">CONTROL</span>
          </motion.h1>
          <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">
            Select your next target
          </p>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-strong p-6 mb-10 cyber-corner"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-green/5 border border-neon-green/20 flex items-center justify-center">
                <span className="text-2xl font-black text-neon-green text-glow-green">{user?.score || 0}</span>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-mono tracking-widest uppercase">Total Score</div>
                <div className="text-white font-bold">{user?.username || 'Agent'}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex-1 max-w-md w-full">
              <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
                <span>PROGRESS</span>
                <span>{completedCount}/{levels.length} completed</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-pink rounded-full"
                />
              </div>
            </div>

            {/* Percentage */}
            <div className="text-center">
              <div className="text-3xl font-black text-neon-blue text-glow-blue">{progressPercent}%</div>
              <div className="text-xs text-gray-500 font-mono tracking-widest">COMPLETE</div>
            </div>
          </div>
        </motion.div>

        {/* Levels Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {levels.map((level, i) => {
            const status = getLevelStatus(level.level);
            const isCompleted = status === 'completed';
            const isLocked = status === 'locked';
            const isAvailable = status === 'available';
            const gradientClass = categoryColors[level.category] || 'from-gray-400 to-gray-600';

            return (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.4 }}
                onClick={() => {
                  if (isLocked) {
                    toast.error(`Complete level ${level.level - 1} first`);
                    return;
                  }
                  navigate(`/level/${level.level}`);
                }}
                className={`group relative glass p-5 rounded-xl cursor-pointer overflow-hidden card-hover
                  ${isCompleted ? 'border-neon-green/40' : ''}
                  ${isLocked ? 'opacity-40 pointer-events-none' : ''}
                  ${isAvailable ? 'border-neon-blue/20' : ''}
                `}
              >
                {/* Category color bar */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradientClass} opacity-60`} />

                {/* Level number + name */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black
                      ${isCompleted ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' :
                        isAvailable ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20' :
                        'bg-white/5 text-gray-600 border border-white/5'}`}
                    >
                      {level.level < 10 ? `0${level.level}` : level.level}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight group-hover:text-neon-blue transition-colors">
                        {level.name}
                      </h3>
                      <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">
                        {level.category}
                      </span>
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="w-6 h-6 rounded-full bg-neon-green/20 border border-neon-green/40 flex items-center justify-center">
                      <span className="text-neon-green text-xs font-bold">&#10003;</span>
                    </div>
                  )}
                </div>

                {/* Footer: difficulty + points */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(d => (
                      <div key={d} className={`diff-dot ${d <= level.difficulty ? 'active' : 'inactive'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-mono text-neon-green/80">+{level.points}pts</span>
                </div>

                {/* Locked overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-xs font-mono text-gray-500 tracking-widest uppercase">Locked</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
