const express = require('express');
const router = express.Router();
const Vital = require('../models/Vital');
const Baseline = require('../models/Baseline');
const RiskScore = require('../models/RiskScore');
const auth = require('../middleware/auth');

// Log vitals
router.post('/', auth, async (req, res) => {
    try {
        const { bp_sys, bp_dia, hr, glucose, weight, symptoms } = req.body;
        const vital = new Vital({
            patient: req.user.id,
            bp_sys,
            bp_dia,
            hr,
            glucose,
            weight,
            symptoms
        });
        await vital.save();

        // Baseline logic: check if we have 5 readings
        const count = await Vital.countDocuments({ patient: req.user.id });
        if (count === 5) {
            const firstFive = await Vital.find({ patient: req.user.id }).sort({ timestamp: 1 }).limit(5);
            const baselineData = {
                patient: req.user.id,
                avg_bp_sys: firstFive.reduce((acc, v) => acc + v.bp_sys, 0) / 5,
                avg_bp_dia: firstFive.reduce((acc, v) => acc + v.bp_dia, 0) / 5,
                avg_hr: firstFive.reduce((acc, v) => acc + v.hr, 0) / 5,
                avg_glucose: firstFive.reduce((acc, v) => acc + (v.glucose || 0), 0) / 5,
                avg_weight: firstFive.reduce((acc, v) => acc + (v.weight || 0), 0) / 5,
                is_established: true
            };
            await Baseline.findOneAndUpdate({ patient: req.user.id }, baselineData, { upsert: true });
        }

        // Trend & Risk Scoring Engine (Phase 8 & 9)
        const lastThree = await Vital.find({ patient: req.user.id }).sort({ timestamp: -1 }).limit(3);
        let trend_flag = false;
        let trend_score = 0;
        if (lastThree.length === 3) {
            // Check for continuous increase in systolic BP
            if (lastThree[0].bp_sys > lastThree[1].bp_sys && lastThree[1].bp_sys > lastThree[2].bp_sys) {
                trend_flag = true;
                trend_score = 20;
            }
        }

        const baseline = await Baseline.findOne({ patient: req.user.id });
        let deviation_score = 0;
        if (baseline) {
            const dev = Math.abs(bp_sys - baseline.avg_bp_sys) / baseline.avg_bp_sys;
            deviation_score = Math.min(dev * 100, 40); // Max 40 weight
        }

        const symptom_score = Math.min(symptoms.length * 10, 20); // 10 points per symptom, max 20

        // Simplified Risk Formula: normalize to 0-1
        // Risk = (Deviation + Trend + Symptoms) / 100
        const totalRisk = (deviation_score + trend_score + symptom_score) / 100;
        let risk_level = 'Green';
        if (totalRisk > 0.6) risk_level = 'Red';
        else if (totalRisk > 0.3) risk_level = 'Yellow';

        // Generate Explanation (Phase 10)
        let explanations = [];
        if (deviation_score > 10) explanations.push(`${Math.round(deviation_score)}% deviation from baseline`);
        if (trend_flag) explanations.push("Rising trend detected in last 3 readings");
        if (symptoms.length > 0) explanations.push(`Reported symptoms: ${symptoms.join(', ')}`);

        const explanation = explanations.length > 0 ? explanations.join('; ') : "All vitals within normal range";

        // Data Reliability / Confidence Score (Phase 13)
        let confidence_score = 1.0;
        if (!baseline) confidence_score -= 0.3; // No baseline reduces confidence
        if (count < 10) confidence_score -= 0.2; // Less than 10 readings
        if (!glucose || !weight) confidence_score -= 0.1; // Missing optional fields
        confidence_score = Math.max(confidence_score, 0.3); // Minimum 30% confidence

        const riskEntry = new RiskScore({
            patient: req.user.id,
            risk_value: totalRisk,
            risk_level,
            trend_flag,
            trend_score,
            deviation_score,
            symptom_score,
            explanation,
            confidence_score
        });
        await riskEntry.save();

        res.json({ vital, risk: riskEntry });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get recent vitals (last 10)
router.get('/', auth, async (req, res) => {
    try {
        const vitals = await Vital.find({ patient: req.user.id })
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(vitals);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get latest vital
router.get('/latest', auth, async (req, res) => {
    try {
        const vital = await Vital.findOne({ patient: req.user.id })
            .sort({ timestamp: -1 });
        res.json(vital);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get baseline
router.get('/baseline', auth, async (req, res) => {
    try {
        const baseline = await Baseline.findOne({ patient: req.user.id });
        res.json(baseline);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get risk history
router.get('/risk', auth, async (req, res) => {
    try {
        const risks = await RiskScore.find({ patient: req.user.id })
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(risks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
