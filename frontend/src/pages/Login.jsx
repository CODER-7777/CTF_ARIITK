import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [showMFA, setShowMFA] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, mfaRequired } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData, showMFA ? mfaCode : null);
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.data?.mfaRequired) {
        setShowMFA(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
      {/* Ambient orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-pink/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative"
      >
        {/* Card */}
        <div className="glass-strong p-10 cyber-corner relative overflow-hidden">
          {/* Top neon accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-blue to-transparent" />

          {/* Header */}
          <div className="text-center mb-10">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black text-neon-blue text-glow-blue mb-3 tracking-wider"
            >
              SYSTEM ACCESS
            </motion.h1>
            <div className="neon-line mb-4" />
            <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">
              Authentication Required<span className="typed-cursor" />
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold mb-2 text-neon-blue/70 tracking-widest uppercase font-mono">
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full terminal-input px-4 py-3.5 rounded-lg text-base"
                placeholder="agent_codename"
                id="login-username"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2 text-neon-blue/70 tracking-widest uppercase font-mono">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full terminal-input px-4 py-3.5 rounded-lg text-base"
                placeholder="**************"
                id="login-password"
              />
            </div>

            {showMFA && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-xs font-bold mb-2 text-neon-green/70 tracking-widest uppercase font-mono">
                  MFA Token
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full terminal-input px-4 py-3.5 rounded-lg text-center text-2xl tracking-[0.5em]"
                  placeholder="------"
                  id="login-mfa"
                />
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cyber-btn w-full bg-gradient-to-r from-neon-blue/90 to-neon-pink/90 text-white py-4 px-8 rounded-lg text-sm tracking-[0.2em] glow-neon disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              id="login-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AUTHENTICATING
                </span>
              ) : (
                'INITIATE LOGIN'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500 font-mono tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Register link */}
          <div className="text-center">
            <Link
              to="/register"
              className="inline-block text-sm text-neon-blue/80 hover:text-neon-blue transition-colors font-mono tracking-wider group"
            >
              <span className="border-b border-neon-blue/20 group-hover:border-neon-blue/60 pb-0.5 transition-colors">
                CREATE NEW IDENTITY
              </span>
            </Link>
          </div>

          {/* Bottom neon accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-pink to-transparent" />
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
