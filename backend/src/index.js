const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS que acepta cualquier dominio de Vercel
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://auto-poster-flax.vercel.app'
    ];
    
    if (!origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const authRoutes = require('./routes/auth.routes');
const facebookAuthRoutes = require('./routes/facebookAuth.routes');
const postRoutes = require('./routes/post.routes');

app.use('/api/auth', authRoutes);
app.use('/api/facebook', facebookAuthRoutes);
app.use('/api/post', postRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const MONGODB_URL = process.env.MONGODB_URL;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URL) {
  console.error('❌ MONGODB_URL no está definida');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET no está definida');
  process.exit(1);
}

mongoose.connect(MONGODB_URL)
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`✅ CORS: localhost + *.vercel.app`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB error:', error);
    process.exit(1);
  });

module.exports = app;