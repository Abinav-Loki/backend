const mongoose = require('mongoose');

const BaselineSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    avg_bp_sys: { type: Number, required: true },
    avg_bp_dia: { type: Number, required: true },
    avg_hr: { type: Number, required: true },
    avg_glucose: { type: Number },
    avg_weight: { type: Number },
    is_established: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Baseline', BaselineSchema);
