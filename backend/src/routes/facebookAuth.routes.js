const express = require('express');
const FacebookAuthService = require('../services/facebookAuth.service');
const UserProfile = require('../models/UserProfile');
const { authenticateUser } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/connect', authenticateUser, async (req, res) => {
  try {
    const { accessToken, selectedPageId } = req.body;
    const user = req.user;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const authData = await FacebookAuthService.completeAuthFlow(accessToken, selectedPageId);

    user.facebookUserId = authData.facebookUserId;
    user.pageId = authData.pageId;
    user.pageName = authData.pageName;
    user.pageAccessToken = authData.pageAccessToken;
    user.instagramAccountId = authData.instagramAccountId;
    user.instagramUsername = authData.instagramUsername;
    user.tokenExpiry = authData.tokenExpiry;

    await user.save();

    res.json({
      success: true,
      user: {
        pageName: user.pageName,
        instagramUsername: user.instagramUsername,
      },
      availablePages: authData.availablePages,
    });
  } catch (error) {
    console.error('Facebook connect error:', error);
    res.status(500).json({ error: error.message || 'Failed to connect Facebook' });
  }
});

router.get('/status', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    const isConnected = !!(user.pageId && user.pageAccessToken);
    const needsReauth = user.tokenExpiry ? user.tokenExpiry < new Date() : false;

    res.json({
      connected: isConnected,
      needsReauth,
      pageName: user.pageName,
      instagramUsername: user.instagramUsername,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking Facebook status' });
  }
});

module.exports = router;