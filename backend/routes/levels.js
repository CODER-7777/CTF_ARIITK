const express = require('express');
const { auth } = require('../middleware/auth');
const Level = require('../models/Level');
const User = require('../models/User');
const {
  createSession,
  getSession,
  getUserLevelSession,
  stopSession,
  resetSession,
  runSessionCommand
} = require('../services/containerRuntime');

const router = express.Router();

const HINT_PENALTY = 5; // points deducted per hint revealed

function getOrCreateProgress(user, levelNumber) {
  let progress = user.progress.find((p) => p.level === levelNumber);
  if (!progress) {
    user.progress.push({
      level: levelNumber,
      completed: false,
      attempts: 0,
      hintsUsed: 0,
      sessionState: 'idle'
    });
    progress = user.progress[user.progress.length - 1];
  }
  return progress;
}

// Get all levels (without secrets)
router.get('/', auth, async (_req, res) => {
  try {
    const levels = await Level.find().select('-expectedFlag -walkthrough').sort('level');
    res.json(levels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Use a hint (deducts points)
router.post('/use-hint', auth, async (req, res) => {
  try {
    const { level, hintIndex } = req.body;
    
    const levelData = await Level.findOne({ level });
    if (!levelData) {
      return res.status(404).json({ error: 'Level not found' });
    }

    const totalHints = levelData.hints?.length || 0;
    if (hintIndex >= totalHints) {
      return res.status(400).json({ error: 'No more hints available' });
    }

    const user = await User.findById(req.userId);
    const progress = getOrCreateProgress(user, level);

    // Already revealed this hint — no penalty
    if (hintIndex < progress.hintsUsed) {
      return res.json({
        hint: levelData.hints[hintIndex],
        hintsUsed: progress.hintsUsed,
        pointsDeducted: 0,
        newScore: user.score
      });
    }

    // Deduct points
    user.score = Math.max(0, user.score - HINT_PENALTY);
    progress.hintsUsed = hintIndex + 1;
    await user.save();

    res.json({
      hint: levelData.hints[hintIndex],
      hintsUsed: progress.hintsUsed,
      pointsDeducted: HINT_PENALTY,
      newScore: user.score
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start (or resume) a terminal session for a level
router.post('/:level/session/start', auth, async (req, res) => {
  try {
    const levelNumber = Number(req.params.level);
    const level = await Level.findOne({ level: levelNumber });
    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    const user = await User.findById(req.userId);
    const progress = getOrCreateProgress(user, levelNumber);
    const previousLevelProgress = user.progress.find((p) => p.level === levelNumber - 1);
    if (levelNumber > 1 && !previousLevelProgress?.completed) {
      return res.status(403).json({ error: 'Complete previous level first' });
    }

    let session = getUserLevelSession(req.userId, levelNumber);
    if (!session) {
      session = await createSession({ userId: req.userId, level });
    }

    progress.sessionState = 'running';
    progress.sessionId = session.sessionId;
    progress.startedAt = progress.startedAt || session.startedAt;
    await user.save();

    res.json({
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      containerId: session.containerId || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:level/session/status', auth, async (req, res) => {
  try {
    const levelNumber = Number(req.params.level);
    const user = await User.findById(req.userId);
    const progress = user.progress.find((p) => p.level === levelNumber);
    if (!progress?.sessionId) {
      return res.json({ active: false });
    }

    const runtimeSession = getSession(progress.sessionId);
    if (!runtimeSession) {
      progress.sessionState = 'expired';
      await user.save();
      return res.json({ active: false, state: 'expired' });
    }

    res.json({
      active: true,
      state: progress.sessionState,
      sessionId: progress.sessionId,
      expiresAt: runtimeSession.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:level/session/stop', auth, async (req, res) => {
  try {
    const levelNumber = Number(req.params.level);
    const user = await User.findById(req.userId);
    const progress = getOrCreateProgress(user, levelNumber);
    if (progress.sessionId) {
      await stopSession(progress.sessionId);
    }
    progress.sessionState = 'stopped';
    progress.endedAt = new Date();
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:level/session/reset', auth, async (req, res) => {
  try {
    const levelNumber = Number(req.params.level);
    const level = await Level.findOne({ level: levelNumber });
    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    const user = await User.findById(req.userId);
    const progress = getOrCreateProgress(user, levelNumber);
    const newSession = progress.sessionId
      ? await resetSession(progress.sessionId, { userId: req.userId, level })
      : await createSession({ userId: req.userId, level });
    progress.sessionState = 'running';
    progress.sessionId = newSession.sessionId;
    progress.containerId = newSession.containerId || null;
    progress.startedAt = new Date();
    progress.endedAt = null;
    await user.save();

    res.json({ success: true, sessionId: newSession.sessionId, expiresAt: newSession.expiresAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:level/session/command', auth, async (req, res) => {
  try {
    const levelNumber = Number(req.params.level);
    const { command } = req.body;
    const user = await User.findById(req.userId);
    const progress = user.progress.find((p) => p.level === levelNumber);
    if (!progress?.sessionId) {
      return res.status(400).json({ error: 'No active session for this level' });
    }
    const output = await runSessionCommand(progress.sessionId, command);
    res.json(output);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate objective completion
router.post('/:level/validate', auth, async (req, res) => {
  try {
    const levelNumber = Number(req.params.level);
    const { proof } = req.body;
    const level = await Level.findOne({ level: levelNumber });
    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    const user = await User.findById(req.userId);
    const progress = getOrCreateProgress(user, levelNumber);
    progress.attempts += 1;

    if (progress.completed) {
      return res.json({ success: false, message: 'Already completed' });
    }

    const success = String(proof || '').trim() === level.expectedFlag;
    if (!success) {
      await user.save();
      return res.json({ success: false, message: 'Validation failed. Keep digging.' });
    }

    const hintsUsed = progress.hintsUsed || 0;
    const hintPenalty = hintsUsed * HINT_PENALTY;
    const pointsAwarded = Math.max(0, level.points - hintPenalty);

    progress.completed = true;
    progress.sessionState = 'stopped';
    progress.proof = proof;
    progress.solvedAt = new Date();
    progress.endedAt = new Date();

    user.score += pointsAwarded;
    await user.save();

    if (progress.sessionId) {
      await stopSession(progress.sessionId);
    }

    res.json({
      success: true,
      message: `Level ${levelNumber} completed! +${pointsAwarded} points`,
      points: pointsAwarded,
      hintsUsed,
      hintPenalty,
      newScore: user.score
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user levels progress
router.get('/user-progress', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('progress score totalTime');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
