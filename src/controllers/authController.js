// src/controllers/authController.js
const { User } = require("../models");
const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";




// KAYIT
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone, role, inviteCode } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Ad Soyad, e-posta ve şifre zorunludur." });
    }

    // Email zaten var mı?
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Bu e-posta ile zaten bir hesap mevcut." });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Varsayılan rol: customer
    let finalRole = "customer";

    // Eğer kullanıcı 'berber' seçtiyse, davet kodu kontrolü
    if (role === "barber") {
      if (!inviteCode) {
        return res.status(400).json({
          message: "Kuaför olarak kayıt olmak için davet kodu gereklidir.",
        });
      }

      // Kod var mı ve kullanılmamış mı?
      const rows = await sequelize.query(
        "SELECT id, is_used FROM barber_invite_codes WHERE code = ?",
        {
          replacements: [inviteCode],
          type: QueryTypes.SELECT,
        }
      );

      if (rows.length === 0) {
        return res
          .status(400)
          .json({ message: "Geçersiz kuaför davet kodu." });
      }

      const codeRow = rows[0];
      if (codeRow.is_used) {
        return res.status(400).json({
          message: "Bu kuaför davet kodu daha önce kullanılmış.",
        });
      }

      // Kod geçerli → rolü berber yap
      finalRole = "barber";

      // Kodu kullanılmış işaretle
      await sequelize.query(
        "UPDATE barber_invite_codes SET is_used = 1 WHERE id = ?",
        {
          replacements: [codeRow.id],
          type: QueryTypes.UPDATE,
        }
      );
    }

    // Eğer rol 'admin' ise: güvenlik için özel bir ADMIN_SECRET doğrulaması yap
    if (role === "admin") {
      const { adminSecret } = req.body;
      const ADMIN_SECRET = process.env.ADMIN_SECRET || null;
      // Eğer ortamda ADMIN_SECRET tanımlı ise eşleşmiyorsa izin verme
      if (ADMIN_SECRET && adminSecret !== ADMIN_SECRET) {
        return res.status(403).json({ message: "Yetkisiz admin kaydı." });
      }
      // Eğer ADMIN_SECRET tanımlı değilse yine izin verme (güvenlik)
      if (!ADMIN_SECRET) {
        return res.status(403).json({ message: "Admin kaydı şu anda desteklenmiyor." });
      }

      finalRole = "admin";
    }

    // ⭐ ÖNEMLİ FARK: password yerine passwordHash alanına yazıyoruz
    const user = await User.create({
      fullName,
      email,
      phone: phone || null,
      passwordHash: hashedPassword, // ← HATA BURADAYDI
      role: finalRole,
    });

    return res.status(201).json({
      message: "Kayıt başarılı.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

// GİRİŞ
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "E-posta ve şifre zorunludur." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Bu e-posta ile kayıtlı kullanıcı bulunamadı." });
    }

    // ⭐ Burada da user.password değil, user.passwordHash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Şifre hatalı." });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: "Giriş başarılı.",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

// JWT DOĞRULAMA MIDDLEWARE
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token bulunamadı.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Geçersiz token.' });
    }
    req.user = user; // { id, email, role }
    next();
  });
};
