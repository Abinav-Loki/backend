const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const ReminderLog = require('../models/ReminderLog');
const auth = require('../middleware/auth');

// Get all reminders
router.get('/', auth, async (req, res) => {
    try {
        const reminders = await Reminder.find({ patient: req.user.id });
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create reminder
router.post('/', auth, async (req, res) => {
    try {
        const { type, medicine_name, time, frequency } = req.body;
        const reminder = new Reminder({
            patient: req.user.id,
            type,
            medicine_name,
            time,
            frequency
        });
        await reminder.save();
        res.json(reminder);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Log adherence
router.post('/log', auth, async (req, res) => {
    try {
        const { reminder_id, date, status } = req.body;
        const log = new ReminderLog({
            reminder: reminder_id,
            patient: req.user.id,
            date,
            status
        });
        await log.save();
        res.json(log);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get adherence %
router.get('/adherence', auth, async (req, res) => {
    try {
        const totalLogs = await ReminderLog.countDocuments({ patient: req.user.id });
        const takenLogs = await ReminderLog.countDocuments({ patient: req.user.id, status: 'taken' });

        const adherence = totalLogs === 0 ? 100 : Math.round((takenLogs / totalLogs) * 100);
        res.json({ adherence, total: totalLogs, taken: takenLogs });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
