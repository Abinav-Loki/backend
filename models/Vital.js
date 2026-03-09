const mongoose = require('mongoose');

const VitalSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bp_sys: { type: Number, required: true },
    bp_dia: { type: Number, required: true },
    hr: { type: Number, required: true },
    glucose: { type: Number },
    weight: { type: Number },
    symptoms: [{ type: String }],
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vital', VitalSchema);
