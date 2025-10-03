const express = require('express');
const { authenticateUser, requireInstagram, requireFacebookPage } = require('../middleware/auth.middleware');
const InstagramService = require('../services/instagram.service');
const FacebookService = require('../services/facebook.service');

const router = express.Router();

router.post('/instagram', authenticateUser, requireInstagram, async (req, res) => {
  try {
    const { imageUrls, caption, type = 'single' } = req.body;
    const user = req.user;

    let postId;
    if (type === 'carousel' && imageUrls.length > 1) {
      postId = await InstagramService.publishCarousel(user.instagramAccountId, imageUrls.slice(0, 10), caption, user.pageAccessToken);
    } else {
      postId = await InstagramService.publishSinglePost(user.instagramAccountId, imageUrls[0], caption, user.pageAccessToken);
    }

    res.json({ success: true, postId, platform: 'instagram', instagramUrl: `https://www.instagram.com/p/${postId}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish to Instagram', details: error.message });
  }
});

router.post('/facebook', authenticateUser, requireFacebookPage, async (req, res) => {
  try {
    const { imageUrls, message } = req.body;
    const user = req.user;

    let result;
    if (imageUrls.length === 1) {
      result = { photoId: await FacebookService.publishPhoto(user.pageId, imageUrls[0], message, user.pageAccessToken) };
    } else {
      result = { photoIds: await FacebookService.publishMultiplePhotos(user.pageId, imageUrls, message, user.pageAccessToken) };
    }

    res.json({ success: true, ...result, platform: 'facebook' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish to Facebook', details: error.message });
  }
});

router.post('/both', authenticateUser, requireInstagram, requireFacebookPage, async (req, res) => {
  try {
    const { imageUrls, caption, type = 'single' } = req.body;
    const user = req.user;
    const results = { instagram: null, facebook: null, errors: [] };

    try {
      let postId;
      if (type === 'carousel' && imageUrls.length > 1) {
        postId = await InstagramService.publishCarousel(user.instagramAccountId, imageUrls.slice(0, 10), caption, user.pageAccessToken);
      } else {
        postId = await InstagramService.publishSinglePost(user.instagramAccountId, imageUrls[0], caption, user.pageAccessToken);
      }
      results.instagram = { success: true, postId, url: `https://www.instagram.com/p/${postId}` };
    } catch (error) {
      results.errors.push({ platform: 'instagram', error: error.message });
    }

    try {
      if (imageUrls.length === 1) {
        results.facebook = { success: true, photoId: await FacebookService.publishPhoto(user.pageId, imageUrls[0], caption, user.pageAccessToken) };
      } else {
        results.facebook = { success: true, photoIds: await FacebookService.publishMultiplePhotos(user.pageId, imageUrls, caption, user.pageAccessToken) };
      }
    } catch (error) {
      results.errors.push({ platform: 'facebook', error: error.message });
    }

    res.json({ success: !!(results.instagram?.success || results.facebook?.success), results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish', details: error.message });
  }
});

module.exports = router;