const express = require('express');
const ScheduledPost = require('../models/ScheduledPost');
const { authenticateUser } = require('../middleware/auth.middleware');
const fetch = require('node-fetch');
const UserProfile = require('../models/UserProfile');
const { generatePost, generateShortSummary } = require('../utils/aiService');
const FacebookService = require('../services/facebook.service');
const { uploadBase64Image } = require('../utils/imageUpload');
const { extractImageUrls } = require('../utils/assetExtractor');
const { createSocialImage } = require('../utils/imageGenerator');



const router = express.Router();

// Añadir múltiples URLs a la cola
router.post('/add', authenticateUser, async (req, res) => {
  try {
    const { urls } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de URLs' });
    }

    const user = req.user;

    const lastPost = await ScheduledPost.findOne({ userId: user._id })
      .sort({ position: -1 })
      .limit(1);

    let startPosition = lastPost ? lastPost.position + 1 : 1;

    const scheduledPosts = urls.map((url, index) => ({
      userId: user._id,
      url: url.trim(),
      scheduledTime: user.scheduledTime || '14:00',
      position: startPosition + index,
      status: 'pending',
    }));

    await ScheduledPost.insertMany(scheduledPosts);

    res.json({
      success: true,
      message: `${urls.length} URLs añadidas a la cola`,
      startPosition,
    });
  } catch (error) {
    console.error('Add scheduled posts error:', error);
    res.status(500).json({ error: 'Error al añadir URLs a la cola' });
  }
});

// Obtener cola de posts del usuario
router.get('/queue', authenticateUser, async (req, res) => {
  try {
    const posts = await ScheduledPost.find({ userId: req.user._id })
      .sort({ position: 1 })
      .select('-__v');

    const stats = {
      pending: posts.filter(p => p.status === 'pending').length,
      published: posts.filter(p => p.status === 'published').length,
      error: posts.filter(p => p.status === 'error').length,
      total: posts.length,
    };

    res.json({
      success: true,
      posts,
      stats,
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ error: 'Error al obtener la cola' });
  }
});

// Eliminar un post de la cola
router.delete('/:postId', authenticateUser, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ScheduledPost.findOne({
      _id: postId,
      userId: req.user._id,
    });

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post eliminado de la cola',
    });
  } catch (error) {
    console.error('Delete scheduled post error:', error);
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
});

// Limpiar posts publicados antiguos
router.delete('/cleanup/published', authenticateUser, async (req, res) => {
  try {
    const result = await ScheduledPost.deleteMany({
      userId: req.user._id,
      status: 'published',
    });

    res.json({
      success: true,
      message: `${result.deletedCount} posts publicados eliminados`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Error al limpiar posts' });
  }
});

// Endpoint para procesar posts programados (llamado por cron-job.org)
router.post('/process', async (req, res) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    console.log(`[CRON] Processing at ${currentTime}`);

    const users = await UserProfile.find({ 
      autoPublish: true,
      pageId: { $exists: true, $ne: null }
    });

    console.log(`[CRON] Found ${users.length} users with autoPublish`);

    const results = [];

    for (const user of users) {
      try {
        // Verificar si ya pasó la hora programada (convirtiendo a UTC)
        const [schedHour, schedMin] = user.scheduledTime.split(':').map(Number);

        // Madrid es UTC+1 (invierno) o UTC+2 (verano)
        // Detectar automáticamente el offset
        const madridTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
        const utcTime = new Date(now.toUTCString());
        const offsetHours = Math.round((madridTime - utcTime) / (1000 * 60 * 60));

        // Convertir hora programada de Madrid a UTC
        const scheduledUTCHour = (schedHour - offsetHours + 24) % 24;
        const scheduledDate = new Date(now);
        scheduledDate.setUTCHours(scheduledUTCHour, schedMin, 0, 0);

        if (now < scheduledDate) {
        console.log(`[CRON] User ${user.email}: Not time yet (scheduled Madrid: ${user.scheduledTime}, UTC: ${scheduledUTCHour}:${String(schedMin).padStart(2, '0')})`);
        continue;
        }

        const post = await ScheduledPost.findOne({
          userId: user._id,
          status: 'pending',
          $or: [
            { publishedAt: null },
            { publishedAt: { $lt: today } }
          ]
        }).sort({ position: 1 });

        if (!post) {
          console.log(`[CRON] User ${user.email}: No pending posts`);
          continue;
        }

        if (post.publishedAt && post.publishedAt >= today) {
          console.log(`[CRON] User ${user.email}: Already published today`);
          continue;
        }

        console.log(`[CRON] Processing post #${post.position} for ${user.email}`);
        post.lastAttemptAt = new Date();
        await post.save();

        const result = await processScheduledPost(post, user);
        results.push(result);

      } catch (userError) {
        console.error(`[CRON] Error processing user ${user.email}:`, userError);
        results.push({
          userId: user._id,
          error: userError.message
        });
      }
    }

    res.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('[CRON] General error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Función para procesar un post programado
async function processScheduledPost(post, user) {
  try {
    const proxyUrl = 'https://corsproxy.io/?';

    // 1. Extraer imágenes si no existen
    if (!post.imageUrls || post.imageUrls.length === 0) {
      console.log(`[PROCESS] Extracting images from ${post.url}`);
      const response = await fetch(`${proxyUrl}${encodeURIComponent(post.url)}`);
      const html = await response.text();
      post.imageUrls = extractImageUrls(html, post.url);
      await post.save();
    }

    if (post.imageUrls.length === 0) {
      throw new Error('No images found');
    }

    // 2. Generar post si no existe
    if (!post.socialPost) {
      console.log(`[PROCESS] Generating content with AI`);
      const response = await fetch(`${proxyUrl}${encodeURIComponent(post.url)}`);
      const html = await response.text();
      
      post.socialPost = await generatePost(html, post.url);
      post.shortSummary = await generateShortSummary(post.socialPost);
      await post.save();
    }

    // 3. Generar imagen de marketing si no existe
    if (!post.socialImageUrl) {
      console.log(`[PROCESS] Generating marketing image`);
      post.socialImageUrl = await createSocialImage(
        post.imageUrls[0],
        post.shortSummary,
        {
          colors: user.brandColors || { color1: '#0077b6', color2: '#00b4d8' },
          font: user.brandFont || 'Inter',
          logo: user.brandLogoUrl || null,
        }
      );
      await post.save();
    }

    // 4. Preparar carrusel
    const carouselImages = [post.socialImageUrl, ...post.imageUrls.slice(0, 3)];

    // Añadir imagen de marca si existe
    if (user.brandImageUrl) {
      if (user.brandImageUrl.startsWith('data:')) {
        const brandImageUrl = await uploadBase64Image(user.brandImageUrl);
        carouselImages.push(brandImageUrl);
      } else {
        carouselImages.push(user.brandImageUrl);
      }
    }

    // 5. Publicar en Facebook
    console.log(`[PROCESS] Publishing to Facebook`);
    await FacebookService.publishCarousel(
      user.pageId,
      carouselImages,
      post.socialPost,
      user.pageAccessToken
    );

    // 6. Marcar como publicado
    post.status = 'published';
    post.publishedAt = new Date();
    post.error = null;
    await post.save();

    console.log(`[PROCESS] Post #${post.position} published successfully`);

    return {
      success: true,
      userId: user._id,
      postId: post._id,
      position: post.position,
      url: post.url
    };

  } catch (error) {
    console.error(`[PROCESS] Error:`, error);
    post.status = 'error';
    post.error = error.message;
    await post.save();

    return {
      success: false,
      userId: user._id,
      postId: post._id,
      error: error.message
    };
  }
}

module.exports = router;