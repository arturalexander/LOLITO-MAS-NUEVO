const jwt = require('jsonwebtoken');
const UserProfile = require('../models/UserProfile'); // ✅ Debe ser UserProfile, no User

const JWT_SECRET = process.env.JWT_SECRET;

async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await UserProfile.findById(decoded.userId); // ✅ UserProfile
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireInstagram(req, res, next) {
  if (!req.user || !req.user.instagramAccountId) {
    return res.status(400).json({ error: 'Instagram account not connected' });
  }
  next();
}

function requireFacebookPage(req, res, next) {
  if (!req.user || !req.user.pageId) {
    return res.status(400).json({ error: 'Facebook Page not connected' });
  }
  next();
}

module.exports = { authenticateUser, requireInstagram, requireFacebookPage };