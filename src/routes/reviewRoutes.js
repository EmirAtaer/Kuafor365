const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../controllers/authController');

// POST /api/reviews - Yeni değerlendirme oluştur (müşteri giriş yapmış olmalı)
router.post('/', authenticateToken, reviewController.createReview);

// GET /api/reviews - Tüm değerlendirmeleri getir (public)
router.get('/', reviewController.getAllReviews);

module.exports = router;
