const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

// Setup or Update Profile
router.post('/profile', auth, async (req, res) => {
    try {
        const { age, gestational_week, complications, conditions, previous_reports } = req.body;

        let patient = await Patient.findOne({ user: req.user.id });

        if (patient) {
            // Update
            patient = await Patient.findOneAndUpdate(
                { user: req.user.id },
                { age, gestational_week, complications, conditions, previous_reports },
                { new: true }
            );
        } else {
            // Create
            // Generate a simple patient code for demo PT2026 + random
            const patient_code = 'PT2026' + Math.floor(1000 + Math.random() * 9000);
            patient = new Patient({
                user: req.user.id,
                age,
                gestational_week,
                complications,
                conditions,
                previous_reports,
                patient_code
            });
            await patient.save();
        }

        res.json(patient);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const RiskScore = require('../models/RiskScore');
const Vital = require('../models/Vital');

// Get assigned patients for doctor
router.get('/assigned', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Access denied' });

        const patients = await Patient.find({ assigned_doctor: req.user.id }).populate('user', ['name', 'email']);

        const patientsWithRisk = await Promise.all(patients.map(async (p) => {
            const latestRisk = await RiskScore.findOne({ patient: p.user._id }).sort({ timestamp: -1 });
            const latestVital = await Vital.findOne({ patient: p.user._id }).sort({ timestamp: -1 });
            return {
                ...p._doc,
                latestRisk,
                latestVital
            };
        }));

        res.json(patientsWithRisk);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
