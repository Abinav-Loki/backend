const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/patients', require('./routes/patients'));
// app.use('/api/reminders', require('./routes/reminders'));
// app.use('/api/vitals', require('./routes/vitals'));
// app.use('/api/simulation', require('./routes/simulation'));
app.use('/api/sms', require('./routes/sms'));

// Database Connection (Supabase is handled on the Frontend)
// mongoose.connect(process.env.MONGODB_URI)
//     .then(() => console.log('MongoDB connected'))
//     .catch(err => console.log('MongoDB connection error:', err));

// Health Check Route
app.get('/api/status', (req, res) => {
    console.log('--- Health Check Ping Received ---');
    res.json({ status: 'ok', message: 'Momlytics Backend is running' });
});

// Root Route for Railway confirmation
app.get('/', (req, res) => {
    console.log('--- Root Route Ping Received ---');
    res.send('<h1>Maatri Shield Backend is Online</h1><p>API endpoints are available at /api</p>');
});

// Start Server
console.log(`--- Server attempting to start on port ${PORT} ---`);
app.listen(PORT, () => {
    console.log(`--- Server is LIVE on port ${PORT} ---`);
});
