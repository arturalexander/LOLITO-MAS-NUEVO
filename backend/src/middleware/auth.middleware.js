const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    try {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      if (user.tokenExpiry < new Date()) {
        return res.status(401).json({ error: 'Facebook token expired', needsReauth: true });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  });
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