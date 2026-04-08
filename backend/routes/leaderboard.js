const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Public leaderboard - any logged-in user can see rankings
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select('username team score progress createdAt')
      .sort({ score: -1 })
      .lean();

    const leaderboard = users.map(u => ({
      _id: u._id,
      username: u.username,
      team: u.team,
      score: u.score,
      levelsCompleted: u.progress ? u.progress.filter(p => p.completed).length : 0,
      joinedAt: u.createdAt
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
