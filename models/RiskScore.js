const mongoose = require('mongoose');

const RiskScoreSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    risk_value: { type: Number, default: 0 }, // 0 to 1
    risk_level: { type: String, enum: ['Green', 'Yellow', 'Red'], default: 'Green' },
    trend_flag: { type: Boolean, default: false },
    trend_score: { type: Number, default: 0 },
    deviation_score: { type: Number, default: 0 },
    symptom_score: { type: Number, default: 0 },
    explanation: { type: String },
    confidence_score: { type: Number, default: 1 },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RiskScore', RiskScoreSchema);
