const express = require('express');
const { authenticateUser, requireFacebookPage, requireInstagram } = require('../middleware/auth.middleware');
const FacebookService = require('../services/facebook.service');
const InstagramService = require('../services/instagram.service');

const router = express.Router();

// 🔵 RUTA FACEBOOK (siempre disponible)
router.post('/facebook', authenticateUser, requireFacebookPage, async (req, res) => {
  try {
    const { imageUrl, imageUrls, message } = req.body;
    const user = req.user;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    if (!imageUrl && (!imageUrls || imageUrls.length === 0)) {
      return res.status(400).json({ error: 'imageUrl or imageUrls is required' });
    }

    if (imageUrls && imageUrls.length > 1) {
      const postId = await FacebookService.publishCarousel(
        user.pageId,
        imageUrls,
        message,
        user.pageAccessToken
      );

      return res.json({
        success: true,
        postId,
        platform: 'facebook',
        message: 'Carousel published successfully'
      });
    }

    const singleImageUrl = imageUrl || (imageUrls && imageUrls[0]);
    const photoId = await FacebookService.publishPhoto(
      user.pageId,
      singleImageUrl,
      message,
      user.pageAccessToken
    );

    res.json({
      success: true,
      photoId,
      platform: 'facebook',
      message: 'Published successfully'
    });
  } catch (error) {
    console.error('Facebook post error:', error);
    res.status(500).json({
      error: 'Failed to publish to Facebook',
      details: error.message
    });
  }
});

// 🟣 RUTA INSTAGRAM (solo si está conectado)
router.post('/instagram', authenticateUser, requireInstagram, async (req, res) => {
  try {
    const { imageUrls, caption } = req.body;
    const user = req.user;

    if (!caption) {
      return res.status(400).json({ error: 'caption is required' });
    }

    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ error: 'imageUrls is required' });
    }

    let mediaId;
    if (imageUrls.length > 1) {
      mediaId = await InstagramService.publishCarousel(
        user.instagramAccountId,
        imageUrls,
        caption,
        user.pageAccessToken
      );
    } else {
      mediaId = await InstagramService.publishSinglePost(
        user.instagramAccountId,
        imageUrls[0],
        caption,
        user.pageAccessToken
      );
    }

    res.json({
      success: true,
      mediaId,
      platform: 'instagram',
      message: 'Published successfully to Instagram'
    });
  } catch (error) {
    console.error('Instagram post error:', error);
    res.status(500).json({
      error: 'Failed to publish to Instagram',
      details: error.message
    });
  }
});

module.exports = router;