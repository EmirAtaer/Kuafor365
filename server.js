const express = require("express");
const cors = require("cors");
const path = require("path");

// ÖNEMLİ DEĞİŞİKLİK: Modelleri index.js üzerinden çağırıyoruz
// Böylece BarberInviteCode modeline erişebiliriz.
const { sequelize, BarberInviteCode } = require("./src/models");

const productRoutes = require("./src/routes/productRoutes");
const serviceRoutes = require("./src/routes/serviceRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const expenseRoutes = require("./src/routes/expenseRoutes");
const authRoutes = require("./src/routes/authRoutes"); 
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const barberDayStatusRoutes = require("./src/routes/barberDayStatus"); 

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/barber", barberDayStatusRoutes);  
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/expenses", expenseRoutes);

app.get("/", (req, res) => {
  res.send("Kuaför Randevu Sistemi API çalışıyor!");
});

const PORT = process.env.PORT || 3000;

// Güvenlik tavsiyesi: ADMIN_SECRET tanımlı mı göster
const adminSecretPresent = !!process.env.ADMIN_SECRET;
if (adminSecretPresent) console.log('🔒 ADMIN_SECRET tanımlı: Admin kayıtları korunuyor.');
else console.log('⚠️ ADMIN_SECRET tanımlı değil: Admin kayıtları kapalı (güvenlik riski).');

// DB sync options - avoid data loss by default
const forceRecreate = process.env.DB_FORCE_RECREATE === 'true';
const alterSchema = process.env.DB_ALTER === 'true';
const syncOptions = {};
if (forceRecreate) syncOptions.force = true;
else if (alterSchema) syncOptions.alter = true;

console.log('DB sync options:', syncOptions);
sequelize
  .sync(syncOptions)
  .then(async () => {
    if (forceRecreate) console.log("✅ Veritabanı başarıyla SIFIRLANDI ve tablolar oluşturuldu!");
    else if (alterSchema) console.log("✅ Veritabanı başarıyla güncellendi (alter)!");
    else console.log("✅ Veritabanı eşitlendi (sync) — veri korundu!");

    // --- OTOMATİK DAVET KODU OLUŞTURMA --- (sadece seed aktifse çalışır)
    const seedDb = process.env.SEED_DB === 'true';
    if (seedDb) {
      try {
        const [entry, created] = await BarberInviteCode.findOrCreate({
          where: { code: 'BERBER2024' },
          defaults: { is_used: false },
        });
        if (created) console.log('🔑 Test için davet kodu oluşturuldu: BERBER2024');
        else console.log('🔑 Test davet kodu zaten mevcut.');
      } catch (error) {
        console.log('⚠️ Davet kodu oluşturulurken hata oluştu:', error.message);
      }
    } else {
      console.log('Seed işlemi atlandı (SEED_DB != true)');
    }
    // -------------------------------------

    app.listen(PORT, () => {
      console.log(`🚀 Server port ${PORT} üzerinde çalışıyor`);
    });
  })
  .catch((err) => {
    console.error("❌ DB sync hatası:", err);
  });