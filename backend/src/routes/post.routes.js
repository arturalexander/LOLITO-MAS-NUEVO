const express = require('express');
const { authenticateUser, requireFacebookPage } = require('../middleware/auth.middleware');
const FacebookService = require('../services/facebook.service');

const router = express.Router();

router.post('/facebook', authenticateUser, requireFacebookPage, async (req, res) => {
  try {
    const { imageUrl, imageUrls, message } = req.body;
    const user = req.user;

    // Validación
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    if (!imageUrl && (!imageUrls || imageUrls.length === 0)) {
      return res.status(400).json({ error: 'imageUrl or imageUrls is required' });
    }

    // Si hay múltiples imágenes, publicar como carrusel
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

    // Si solo hay una imagen (o imageUrl), publicar como foto simple
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
    console.error('Post error:', error);
    res.status(500).json({
      error: 'Failed to publish to Facebook',
      details: error.message
    });
  }
});

module.exports = router;