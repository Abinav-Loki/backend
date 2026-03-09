const mongoose = require('mongoose');

const ReminderLogSchema = new mongoose.Schema({
    reminder: { type: mongoose.Schema.Types.ObjectId, ref: 'Reminder', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ['taken', 'missed'], default: 'taken' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReminderLog', ReminderLogSchema);
