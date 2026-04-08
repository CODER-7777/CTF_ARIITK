const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  team: { type: String, default: 'solo' },
  isAdmin: { type: Boolean, default: false },
  
  // MFA
  mfaSecret: String,
  mfaEnabled: { type: Boolean, default: false },
  lastLogin: Date,
  
  // Security
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  sessions: [{
    token: String,
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Progress & Stats
  progress: [{
    level: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    sessionState: { type: String, enum: ['idle', 'running', 'expired', 'stopped'], default: 'idle' },
    containerId: String,
    sessionId: String,
    startedAt: Date,
    endedAt: Date,
    timeTaken: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    proof: String,
    solvedAt: Date,
    lastSeenPrompt: String
  }],
  
  score: { type: Number, default: 0 },
  totalTime: { type: Number, default: 0 },
  avgSolveTime: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 }, // % correct flags
  rank: { type: Number, default: 0 }
  
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
