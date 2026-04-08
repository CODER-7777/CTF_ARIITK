import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    team: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'username', type: 'text', placeholder: 'agent_codename', label: 'Callsign', required: true },
    { key: 'email', type: 'email', placeholder: 'agent@network.io', label: 'Secure Channel', required: true },
    { key: 'password', type: 'password', placeholder: '**************', label: 'Passphrase', required: true, minLength: 8 },
    { key: 'team', type: 'text', placeholder: 'squad_name', label: 'Squad (Optional)', required: false }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
      {/* Ambient orbs */}
      <div className="fixed top-1/3 right-1/4 w-80 h-80 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 left-1/4 w-80 h-80 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="glass-strong p-10 cyber-corner relative overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-green to-transparent" />

          {/* Header */}
          <div className="text-center mb-10">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black text-neon-green text-glow-green mb-3 tracking-wider"
            >
              NEW IDENTITY
            </motion.h1>
            <div className="neon-line mb-4" />
            <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">
              Initialize Agent Profile<span className="typed-cursor" />
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <label className="block text-xs font-bold mb-2 text-neon-green/70 tracking-widest uppercase font-mono">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.required}
                  minLength={field.minLength}
                  value={formData[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full terminal-input px-4 py-3.5 rounded-lg text-base"
                  id={`register-${field.key}`}
                />
              </motion.div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="cyber-btn w-full bg-gradient-to-r from-neon-green/90 to-neon-blue/90 text-black py-4 px-8 rounded-lg text-sm tracking-[0.2em] glow-green disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              id="register-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  INITIALIZING
                </span>
              ) : (
                'CREATE AGENT'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500 font-mono tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="inline-block text-sm text-neon-blue/80 hover:text-neon-blue transition-colors font-mono tracking-wider group"
            >
              <span className="border-b border-neon-blue/20 group-hover:border-neon-blue/60 pb-0.5 transition-colors">
                EXISTING AGENT? LOG IN
              </span>
            </Link>
          </div>

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-blue to-transparent" />
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
