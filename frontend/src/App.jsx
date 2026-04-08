import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Level from './pages/Level';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';
import MatrixBackground from './components/MatrixBackground';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen relative">
          <MatrixBackground />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10"
          >
            <Navbar />
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/level/:levelId" 
                element={
                  <ProtectedRoute>
                    <Level />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/leaderboard" 
                element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </motion.div>
          <Toaster position="top-right" toastOptions={{
            style: {
              background: 'rgba(0,0,0,0.9)',
              border: '1px solid #00f5ff',
              color: '#e0e0e0',
              backdropFilter: 'blur(10px)'
            }
          }} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
