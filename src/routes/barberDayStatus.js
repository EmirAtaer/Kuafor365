// src/routes/barberDayStatus.js
const express = require("express");
const router = express.Router();
const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");

// Şimdilik sabit kuaför ID (login bağlamadık)
// İleride req.user.id vs. ile değiştireceğiz
const BARBER_ID = 1;

// GET /api/barber/day-status?date=YYYY-MM-DD
router.get("/day-status", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date parametresi gerekli" });
    }

    const rows = await sequelize.query(
      "SELECT is_open FROM barber_day_status WHERE barber_id = ? AND date = ?",
      {
        replacements: [BARBER_ID, date],
        type: QueryTypes.SELECT,
      }
    );

    // Kayıt yoksa: gün varsayılan olarak AÇIK kabul
    const isOpen = rows.length === 0 ? true : !!rows[0].is_open;

    res.json({ date, isOpen });
  } catch (err) {
    console.error("GET /api/barber/day-status error:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// POST /api/barber/day-status   body: { date: 'YYYY-MM-DD' }
// Toggle: açıksa kapat, kapalıysa aç
router.post("/day-status", async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: "date alanı gerekli" });
    }

    const rows = await sequelize.query(
      "SELECT is_open FROM barber_day_status WHERE barber_id = ? AND date = ?",
      {
        replacements: [BARBER_ID, date],
        type: QueryTypes.SELECT,
      }
    );

    let newStatus;

    if (rows.length === 0) {
      // İlk kayıt -> kapalı yapıyoruz (0)
      newStatus = 0;
      await sequelize.query(
        "INSERT INTO barber_day_status (barber_id, date, is_open) VALUES (?, ?, ?)",
        {
          replacements: [BARBER_ID, date, newStatus],
          type: QueryTypes.INSERT,
        }
      );
    } else {
      // Toggle: 1 ise 0, 0 ise 1
      newStatus = rows[0].is_open ? 0 : 1;
      await sequelize.query(
        "UPDATE barber_day_status SET is_open = ? WHERE barber_id = ? AND date = ?",
        {
          replacements: [newStatus, BARBER_ID, date],
          type: QueryTypes.UPDATE,
        }
      );
    }

    res.json({ date, isOpen: !!newStatus });
  } catch (err) {
    console.error("POST /api/barber/day-status error:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

module.exports = router;
