const express = require('express');
const router = express.Router();
const Vital = require('../models/Vital');
const auth = require('../middleware/auth');

// Simulate complication scenario
router.post('/simulate', auth, async (req, res) => {
    try {
        const { scenario } = req.body;

        let simulatedVitals = [];
        const baseTime = new Date();

        switch (scenario) {
            case 'preeclampsia':
                // Simulate gradual BP increase over 5 readings
                for (let i = 0; i < 5; i++) {
                    simulatedVitals.push({
                        patient: req.user.id,
                        bp_sys: 120 + (i * 8), // 120, 128, 136, 144, 152
                        bp_dia: 80 + (i * 5),  // 80, 85, 90, 95, 100
                        hr: 75 + (i * 2),
                        glucose: 95,
                        weight: 65,
                        symptoms: i >= 3 ? ['Headache', 'Blurred Vision'] : [],
                        timestamp: new Date(baseTime.getTime() - (4 - i) * 24 * 60 * 60 * 1000)
                    });
                }
                break;

            case 'gestational_diabetes':
                // Simulate high glucose readings
                for (let i = 0; i < 5; i++) {
                    simulatedVitals.push({
                        patient: req.user.id,
                        bp_sys: 125,
                        bp_dia: 82,
                        hr: 78,
                        glucose: 140 + (i * 10), // Rising glucose
                        weight: 65 + (i * 0.5),
                        symptoms: i >= 2 ? ['Nausea'] : [],
                        timestamp: new Date(baseTime.getTime() - (4 - i) * 24 * 60 * 60 * 1000)
                    });
                }
                break;

            case 'normal':
                // Simulate normal readings
                for (let i = 0; i < 5; i++) {
                    simulatedVitals.push({
                        patient: req.user.id,
                        bp_sys: 118 + Math.floor(Math.random() * 6),
                        bp_dia: 78 + Math.floor(Math.random() * 4),
                        hr: 72 + Math.floor(Math.random() * 6),
                        glucose: 92 + Math.floor(Math.random() * 8),
                        weight: 65,
                        symptoms: [],
                        timestamp: new Date(baseTime.getTime() - (4 - i) * 24 * 60 * 60 * 1000)
                    });
                }
                break;

            default:
                return res.status(400).json({ message: 'Invalid scenario' });
        }

        // Insert simulated vitals
        await Vital.insertMany(simulatedVitals);

        res.json({
            message: `Simulated ${scenario} scenario with ${simulatedVitals.length} readings`,
            vitals: simulatedVitals
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Clear simulation data
router.delete('/clear', auth, async (req, res) => {
    try {
        await Vital.deleteMany({ patient: req.user.id });
        res.json({ message: 'All vitals cleared' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
