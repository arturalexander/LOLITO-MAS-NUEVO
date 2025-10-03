const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FacebookAuthService = require('../services/facebookAuth.service');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, selectedPageId } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const authData = await FacebookAuthService.completeAuthFlow(accessToken, selectedPageId);

    let user = await User.findOne({ facebookUserId: authData.facebookUserId });

    if (user) {
      Object.assign(user, authData);
      await user.save();
    } else {
      user = await User.create(authData);
    }

    const token = jwt.sign({ userId: user._id, facebookUserId: user.facebookUserId }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        pageName: user.pageName,
        instagramUsername: user.instagramUsername,
      },
      availablePages: authData.availablePages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Authentication failed' });
  }
});

module.exports = router;