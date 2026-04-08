const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  level: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, default: 'bandit' },
  description: String,
  objective: { type: String, required: true },
  challengeData: String,
  entryCommand: { type: String, default: 'bash' },
  validationMode: { type: String, default: 'flag' },
  expectedFlag: { type: String, required: true },
  hints: [String],
  difficulty: { type: Number, min: 1, max: 5 },
  points: { type: Number, required: true },
  category: String,
  walkthrough: String,
  prerequisites: [{ type: Number }],
  maxSessionMinutes: { type: Number, default: 20 }
});

module.exports = mongoose.model('Level', levelSchema);
