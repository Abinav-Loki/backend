const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['water', 'medicine'], required: true },
    medicine_name: { type: String },
    time: { type: String, required: true }, // HH:mm
    frequency: { type: String, default: 'daily' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reminder', ReminderSchema);
