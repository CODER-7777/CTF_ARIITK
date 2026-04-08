import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label, color = 'neon-blue') => (
    <Link
      to={to}
      className={`relative px-4 py-2 text-sm tracking-widest uppercase font-mono transition-all duration-300
        ${isActive(to)
          ? `text-${color} text-glow-${color === 'neon-pink' ? 'pink' : 'blue'}`
          : `text-gray-400 hover:text-${color}`
        }`}
    >
      {label}
      {isActive(to) && (
        <motion.div
          layoutId="nav-indicator"
          className={`absolute bottom-0 left-0 right-0 h-[2px] bg-${color}`}
        />
      )}
    </Link>
  );

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Navbar backdrop */}
      <div className="bg-[rgba(5,5,16,0.85)] backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-neon-blue to-neon-pink flex items-center justify-center">
              <span className="text-xs font-black text-white">CTF</span>
            </div>
            <span className="text-lg font-black tracking-[0.15em] text-white group-hover:text-neon-blue transition-colors">
              AERO<span className="text-neon-blue">PUNK</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {user ? (
            <div className="hidden md:flex items-center gap-1">
              {user.isAdmin && navLink('/admin', 'Admin', 'neon-pink')}
              {navLink('/dashboard', 'Terminal')}
              {navLink('/leaderboard', 'Rankings')}

              <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center text-xs font-bold text-black">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white leading-none">{user.username}</span>
                    <span className="text-[10px] text-neon-green font-mono">{user.score || 0} pts</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 hover:text-neon-pink transition-colors font-mono tracking-wider px-3 py-1.5 rounded border border-white/5 hover:border-neon-pink/30"
                >
                  EXIT
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/" className="text-sm text-gray-400 hover:text-neon-blue transition-colors font-mono tracking-wider px-3 py-2">
                Login
              </Link>
              <Link to="/register" className="text-sm text-neon-blue font-mono tracking-wider px-4 py-2 rounded-lg border border-neon-blue/30 hover:bg-neon-blue/10 transition-all">
                Register
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
          >
            <motion.div animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 8 : 0 }} className="w-5 h-0.5 bg-neon-blue" />
            <motion.div animate={{ opacity: isOpen ? 0 : 1 }} className="w-5 h-0.5 bg-neon-blue" />
            <motion.div animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -8 : 0 }} className="w-5 h-0.5 bg-neon-blue" />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-2">
                {user ? (
                  <>
                    {user.isAdmin && (
                      <Link to="/admin" onClick={() => setIsOpen(false)} className="text-neon-pink text-sm font-mono tracking-wider py-2">
                        Admin Portal
                      </Link>
                    )}
                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="text-gray-300 text-sm font-mono tracking-wider py-2">Terminal</Link>
                    <Link to="/leaderboard" onClick={() => setIsOpen(false)} className="text-gray-300 text-sm font-mono tracking-wider py-2">Rankings</Link>
                    <button onClick={() => { setIsOpen(false); handleLogout(); }} className="text-left text-neon-pink text-sm font-mono tracking-wider py-2 mt-2 border-t border-white/5 pt-4">
                      Exit System
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/" onClick={() => setIsOpen(false)} className="text-gray-300 text-sm font-mono py-2">Login</Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="text-neon-blue text-sm font-mono py-2">Register</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom glow line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent" />
    </motion.nav>
  );
};

export default Navbar;
