require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3001;


connectDB();

// CORS: allow localhost for dev + Vercel domain for production
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL // Set this on Render after Vercel deploy
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    // Allow any .vercel.app subdomain
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'TripWise AI backend running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/trips', require('./routes/trips'));


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});