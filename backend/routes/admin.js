const express = require('express');
const User = require('../models/User');
const Level = require('../models/Level');
const { auth, adminAuth } = require('../middleware/auth');
const { sessions } = require('../services/containerRuntime');
const router = express.Router();

router.use(auth, adminAuth);

// Get all users with progress AND their submitted answers
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -sessions -mfaSecret')
      .sort({ score: -1, createdAt: -1 })
      .lean();

    // Get all levels so we can show level names alongside answers
    const levels = await Level.find().lean();
    const levelMap = {};
    levels.forEach(l => { levelMap[l.level] = l; });

    // Enrich each user's progress with level names and expected proof
    const enrichedUsers = users.map(u => ({
      ...u,
      progress: (u.progress || []).map(p => ({
        ...p,
        levelName: levelMap[p.level]?.name || `Level ${p.level}`,
        category: levelMap[p.level]?.category || 'Unknown',
        expectedFlag: levelMap[p.level]?.expectedFlag || '',
        points: levelMap[p.level]?.points || 0
      }))
    }));
    
    const stats = {
      totalUsers: users.length,
      totalScore: users.reduce((sum, u) => sum + (u.score || 0), 0),
      avgScore: users.reduce((sum, u) => sum + (u.score || 0), 0) / (users.length || 1),
      levelsSolved: users.reduce((sum, u) => sum + (u.progress ? u.progress.filter(p => p.completed).length : 0), 0)
    };

    res.json({ users: enrichedUsers, stats, levels, activeSessions: sessions.size });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user detailed progress with answers
router.get('/users/:id/progress', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -sessions -mfaSecret')
      .lean();

    const levels = await Level.find().lean();
    const levelMap = {};
    levels.forEach(l => { levelMap[l.level] = l; });

    // Attach full level details and completion proof
    const enrichedProgress = (user.progress || []).map(p => ({
      ...p,
      levelName: levelMap[p.level]?.name || `Level ${p.level}`,
      category: levelMap[p.level]?.category || 'Unknown',
      expectedFlag: levelMap[p.level]?.expectedFlag || '',
      points: levelMap[p.level]?.points || 0,
      description: levelMap[p.level]?.description || ''
    }));

    res.json({ ...user, progress: enrichedProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset user progress (admin only)
router.post('/users/:id/reset', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        progress: [],
        score: 0,
        totalTime: 0 
      },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'User progress reset', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics dashboard
router.get('/analytics', async (req, res) => {
  try {
    const users = await User.find().lean();
    const levels = await Level.find().lean();
    
    const analytics = {
      totalUsers: users.length,
      adminUsers: users.filter(u => u.isAdmin).length,
      avgScore: users.reduce((sum, u) => sum + (u.score || 0), 0) / (users.length || 1),
      levelStats: levels.map(l => ({
        level: l.level,
        name: l.name,
        solvedBy: users.filter(u => u.progress && u.progress.some(p => p.level === l.level && p.completed)).length,
        solveRate: users.length > 0
          ? Math.round((users.filter(u => u.progress && u.progress.some(p => p.level === l.level && p.completed)).length / users.length) * 100)
          : 0
      }))
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
