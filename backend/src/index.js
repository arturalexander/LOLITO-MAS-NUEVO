const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS CORREGIDO
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://auto-poster-flax.vercel.app'
    ];
    
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Aumentar límite de payload
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ PROXY PARA IMÁGENES (ANTES DE LAS RUTAS)
// ✅ PROXY PARA IMÁGENES (ANTES DE LAS RUTAS)
app.get('/proxy/image/:hash', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).send('URL required');
    }
    
    console.log('[PROXY] Fetching:', url);
    
    // Seguir redirects automáticamente
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/jpeg,image/jpg,image/png,image/*',
        'Referer': 'https://www.azulvilla.pl/'
      },
      redirect: 'follow', // ✅ Seguir redirects
      follow: 5 // Máximo 5 redirects
    });
    
    if (!response.ok) {
      console.error('[PROXY] Failed:', response.status);
      return res.status(response.status).send('Failed to fetch image');
    }
    
    // Obtener tipo de contenido real
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Headers correctos para Instagram/Facebook
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'X-Content-Type-Options': 'nosniff'
    });
    
    // Stream la imagen directamente
    response.body.pipe(res);
    
    console.log('[PROXY] ✅ Image proxied successfully');
    
  } catch (error) {
    console.error('[PROXY] Error:', error.message);
    res.status(500).send('Proxy error: ' + error.message);
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
const authRoutes = require('./routes/auth.routes');
const facebookAuthRoutes = require('./routes/facebookAuth.routes');
const postRoutes = require('./routes/post.routes');
const scheduledPostsRoutes = require('./routes/scheduledPosts.routes');

app.use('/api/auth', authRoutes);
app.use('/api/facebook', facebookAuthRoutes);
app.use('/api/post', postRoutes);
app.use('/api/scheduled-posts', scheduledPostsRoutes);

// Error handler
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