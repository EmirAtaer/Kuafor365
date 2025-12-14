// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();

// Controller'ı doğru şekilde içe aktar
const authController = require("../controllers/authController");

// KAYIT
router.post("/register", authController.register);

// GİRİŞ
router.post("/login", authController.login);

module.exports = router;
