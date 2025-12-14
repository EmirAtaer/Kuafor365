// src/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/overview", analyticsController.getOverview);

module.exports = router;
