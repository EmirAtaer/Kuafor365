// src/routes/appointmentRoutes.js
const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");

// Randevu oluştur
router.post("/", appointmentController.createAppointment);

// Tüm randevuları listele
router.get("/", appointmentController.getAllAppointments);

// Randevu durumunu güncelle (onay / iptal)
router.patch("/:id/status", appointmentController.updateStatus);

// Randevuyu sil (no-show vb.)
router.delete("/:id", appointmentController.deleteAppointment);

module.exports = router;
