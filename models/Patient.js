const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    age: { type: Number },
    gestational_week: { type: Number },
    complications: { type: Boolean, default: false },
    conditions: [{ type: String }],
    previous_reports: [{ type: String }], // URLs or descriptions
    assigned_doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patient_code: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);
