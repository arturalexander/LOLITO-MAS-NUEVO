// backend/src/routes/auth.routes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserProfile = require('../models/UserProfile');
const { authenticateUser } = require('../middleware/auth.middleware');
const FacebookAuthService = require('../services/facebookAuth.service');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ========== REGISTRO con email/password ==========
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password y nombre son requeridos' });
    }

    // Verificar si ya existe
    const existingUser = await UserProfile.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await UserProfile.create({
      email,
      password: hashedPassword,
      name,
      brandColors: { color1: '#0077b6', color2: '#00b4d8' },
      brandFont: 'Inter',
    });

    // Generar token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        brandColors: user.brandColors,
        brandFont: user.brandFont,
        brandLogoUrl: user.brandLogoUrl,
        brandImageUrl: user.brandImageUrl,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// ========== LOGIN con email/password ==========
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    // Buscar usuario
    const user = await UserProfile.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        brandColors: user.brandColors,
        brandFont: user.brandFont,
        brandLogoUrl: user.brandLogoUrl,
        brandImageUrl: user.brandImageUrl,
        pageName: user.pageName,
        instagramUsername: user.instagramUsername,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// ========== Vincular Facebook/Instagram a cuenta existente ==========
router.post('/link-facebook', authenticateUser, async (req, res) => {
  try {
    const { accessToken, selectedPageId } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const authData = await FacebookAuthService.completeAuthFlow(accessToken, selectedPageId);

    // Actualizar el usuario actual con datos de Facebook
    const user = req.user;
    user.facebookUserId = authData.facebookUserId;
    user.pageId = authData.pageId;
    user.pageName = authData.pageName;
    user.pageAccessToken = authData.pageAccessToken;
    user.instagramAccountId = authData.instagramAccountId;
    user.instagramUsername = authData.instagramUsername;
    user.userAccessToken = authData.userAccessToken;
    user.tokenExpiry = authData.tokenExpiry;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        pageName: user.pageName,
        instagramUsername: user.instagramUsername,
      },
      availablePages: authData.availablePages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to link Facebook' });
  }
});

// ========== Actualizar configuración de marca ==========
// ========== Actualizar configuración de marca ==========
router.patch('/profile/branding', authenticateUser, async (req, res) => {
  try {
    const { brandColors, brandFont, brandLogoUrl, brandImageUrl, autoPublish } = req.body; // ✅ Añadido autoPublish

    const user = req.user;

    if (brandColors) user.brandColors = brandColors;
    if (brandFont) user.brandFont = brandFont;
    if (brandLogoUrl !== undefined) user.brandLogoUrl = brandLogoUrl;
    if (brandImageUrl !== undefined) user.brandImageUrl = brandImageUrl;
    if (autoPublish !== undefined) user.autoPublish = autoPublish; // ✅ Añadido

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        brandColors: user.brandColors,
        brandFont: user.brandFont,
        brandLogoUrl: user.brandLogoUrl,
        brandImageUrl: user.brandImageUrl,
        autoPublish: user.autoPublish, // ✅ Añadido
      },
    });
  } catch (error) {
    console.error('Update branding error:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// ========== Obtener perfil del usuario ==========
// ========== Obtener perfil del usuario ==========
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      brandColors: user.brandColors,
      brandFont: user.brandFont,
      brandLogoUrl: user.brandLogoUrl,
      brandImageUrl: user.brandImageUrl,
      autoPublish: user.autoPublish, // ✅ Añadido
      pageName: user.pageName,
      instagramUsername: user.instagramUsername,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// ========== Verificar estado de autenticación ==========
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ authenticated: false });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await UserProfile.findById(decoded.userId);

    if (!user) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        brandColors: user.brandColors,
        brandFont: user.brandFont,
        brandLogoUrl: user.brandLogoUrl,
        brandImageUrl: user.brandImageUrl,
      },
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

module.exports = router;