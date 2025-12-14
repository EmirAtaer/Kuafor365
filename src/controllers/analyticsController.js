// src/controllers/analyticsController.js
const Appointment = require("../models/Appointment");
const Product = require("../models/Product");
// Hizmet ve hizmet satışları
const Service = require("../models/Service");
const ServiceSale = require("../models/ServiceSale");
const ProductSale = require("../models/ProductSale");
const Expense = require("../models/Expense");
const { Op } = require("sequelize");
const sequelize = require("../config/db");

exports.getOverview = async (req, res) => {
  try {
    // İsteğe bağlı olarak belirli bir haftanın başlangıç tarihini al
    const { weekStart } = req.query;

    // Tarih stringini (YYYY-MM-DD) zaman kayması olmadan parse et
    function parseDateOnly(str) {
      if (!str || typeof str !== 'string') return null;
      const parts = str.split('-').map((n) => Number(n));
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
      const [y, m, d] = parts;
      // Lokal tarih oluştur (00:00 yerel saat)
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }

    const parsed = parseDateOnly(weekStart);
    const isValidBase = parsed && !isNaN(parsed.getTime());
    const refDate = isValidBase ? parsed : new Date();

    // --- Temel sayılar ---
    const [totalAppointments, pendingAppointments, totalProducts, products, allAppointments] =
      await Promise.all([
        Appointment.count(),                                 // tüm randevular
        Appointment.count({ where: { status: "pending" } }), // bekleyen
        Product.count(),                                     // toplam ürün
        Product.findAll(),                                   // ürün listesi
        Appointment.findAll({ attributes: ["dateTime"], raw: true }), // grafikler için
      ]);

    // düşük stok sınırı (analitik kartında kullanacağız)
    const LOW_STOCK_THRESHOLD = 10;
    const lowStockCount = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
    const totalUsage = products.reduce((sum, p) => sum + (p.usageCount || 0), 0);

    // --- Günlere göre yoğunluk (dailyCounts + en yoğun gün) ---
    const dailyCounts = {};
    allAppointments.forEach(a => {
      const d = new Date(a.dateTime);
      const dayName = d.toLocaleDateString('tr-TR', { weekday: 'long' });
      dailyCounts[dayName] = (dailyCounts[dayName] || 0) + 1;
    });

    const hourlyCounts = {};
    allAppointments.forEach(a => {
      const d = new Date(a.dateTime);
      const hour = d.getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    // En yoğun gün
    let busiestDay = null;
    const dailyEntries = Object.entries(dailyCounts);
    if (dailyEntries.length > 0) {
      dailyEntries.sort((a, b) => b[1] - a[1]);
      const [day, count] = dailyEntries[0];
      busiestDay = { day, count };
    }


    // --- En çok kullanılan ürünler (grafik) ---
    // Önce gerçek satışlardan toplayarak en çok kullanılanları çıkarmayı dene; yoksa usageCount'a düş.
    const productUsageRows = await ProductSale.findAll({
      attributes: [
        "productId",
        [sequelize.fn("SUM", sequelize.col("quantity")), "usage"]
      ],
      include: [{
        model: Appointment,
        as: "Appointment",
        attributes: [],
        required: true,
        where: { status: { [Op.in]: ["approved", "completed"] } },
      }],
      group: ["productId"],
      raw: true,
    });

    // Kullanım rakamlarını hem satışlardan hem de usageCount'tan derle
    const usageFromSales = productUsageRows.reduce((acc, row) => {
      acc[row.productId] = Number(row.usage) || 0;
      return acc;
    }, {});

    const productDetails = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      usageCount: usageFromSales[p.id] ?? p.usageCount ?? 0,
    }));

    // En çok kullanılan ürünler: ürün özetindeki usageCount'a göre (satışlardan gelen veriyi içerir)
    let topProducts = [...productDetails]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5)
      .map((p) => ({ name: p.name, usageCount: p.usageCount || 0 }));

    // Eğer hepsi sıfırsa bile (ve ürün varsa) ilk 5 ürünü göster ki grafik boş kalmasın
    if (topProducts.length === 0 && productDetails.length > 0) {
      topProducts = productDetails
        .slice(0, 5)
        .map((p) => ({ name: p.name, usageCount: p.usageCount || 0 }));
    }

    // Ürün yoksa tek bir placeholder gönder
    if (topProducts.length === 0) {
      topProducts = [{ name: 'Ürün yok', usageCount: 0 }];
    }

    // --- Gelir hesaplamaları ---
    const now = new Date(refDate);
    // Seçilen tarihin ait olduğu haftanın pazartesini bul
    const startOfWeek = new Date(refDate);
    const dow = startOfWeek.getDay(); // Pazar=0, Pazartesi=1
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Hizmet Geliri: onaylanmış veya tamamlanmış randevular - SQL query ile
    const weeklyServiceRevenueRows = await sequelize.query(
      `SELECT COALESCE(SUM(ServiceSales.totalPrice), 0) as total
       FROM ServiceSales
       INNER JOIN Appointments ON ServiceSales.appointmentId = Appointments.id
       WHERE DATE(ServiceSales.date) BETWEEN DATE(?) AND DATE(?) AND Appointments.status IN ('approved', 'completed')`,
      { replacements: [startOfWeek, endOfWeek], type: sequelize.QueryTypes.SELECT }
    );
    const weeklyServiceRevenueRaw = weeklyServiceRevenueRows[0]?.total || 0;

    const monthlyServiceRevenueRows = await sequelize.query(
      `SELECT COALESCE(SUM(ServiceSales.totalPrice), 0) as total
       FROM ServiceSales
       INNER JOIN Appointments ON ServiceSales.appointmentId = Appointments.id
       WHERE DATE(ServiceSales.date) BETWEEN DATE(?) AND DATE(?) AND Appointments.status IN ('approved', 'completed')`,
      { replacements: [startOfMonth, endOfMonth], type: sequelize.QueryTypes.SELECT }
    );
    const monthlyServiceRevenueRaw = monthlyServiceRevenueRows[0]?.total || 0;

    // Weekly / monthly expenses (from Expense model)
    const weeklyExpenseRaw = await sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM Expenses WHERE DATE(date) BETWEEN DATE(?) AND DATE(?)`,
      { replacements: [startOfWeek, endOfWeek], type: sequelize.QueryTypes.SELECT }
    );
    const weeklyExpenseVal = weeklyExpenseRaw[0]?.total || 0;
    
    const monthlyExpenseRaw = await sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM Expenses WHERE DATE(date) BETWEEN DATE(?) AND DATE(?)`,
      { replacements: [startOfMonth, endOfMonth], type: sequelize.QueryTypes.SELECT }
    );
    const monthlyExpenseVal = monthlyExpenseRaw[0]?.total || 0;
    
    const weeklyExpense = isNaN(Number(weeklyExpenseVal)) ? 0 : Number(weeklyExpenseVal);
    // Eğer aylık gider 0 dönerse (örn. tarih aralığı/format farkı) haftalık gideri yedek olarak kullan
    let monthlyExpense = isNaN(Number(monthlyExpenseVal)) ? 0 : Number(monthlyExpenseVal);
    if (monthlyExpense === 0 && weeklyExpense > 0) {
      monthlyExpense = weeklyExpense;
    }

    const weeklyServiceRevenue = isNaN(Number(weeklyServiceRevenueRaw)) ? 0 : Number(weeklyServiceRevenueRaw);
    const monthlyServiceRevenue = isNaN(Number(monthlyServiceRevenueRaw)) ? 0 : Number(monthlyServiceRevenueRaw);

    // Product sales revenue (ProductSale model) - SQL query ile
    const weeklyProductRevenueRows = await sequelize.query(
      `SELECT COALESCE(SUM(ProductSales.totalPrice), 0) as total
       FROM ProductSales
       INNER JOIN Appointments ON ProductSales.appointmentId = Appointments.id
       WHERE DATE(ProductSales.date) BETWEEN DATE(?) AND DATE(?) AND Appointments.status IN ('approved', 'completed')`,
      { replacements: [startOfWeek, endOfWeek], type: sequelize.QueryTypes.SELECT }
    );
    const weeklyProductRevenueRaw = weeklyProductRevenueRows[0]?.total || 0;

    const monthlyProductRevenueRows = await sequelize.query(
      `SELECT COALESCE(SUM(ProductSales.totalPrice), 0) as total
       FROM ProductSales
       INNER JOIN Appointments ON ProductSales.appointmentId = Appointments.id
       WHERE DATE(ProductSales.date) BETWEEN DATE(?) AND DATE(?) AND Appointments.status IN ('approved', 'completed')`,
      { replacements: [startOfMonth, endOfMonth], type: sequelize.QueryTypes.SELECT }
    );
    const monthlyProductRevenueRaw = monthlyProductRevenueRows[0]?.total || 0;
    
    const weeklyProductRevenue = isNaN(Number(weeklyProductRevenueRaw)) ? 0 : Number(weeklyProductRevenueRaw);
    const monthlyProductRevenue = isNaN(Number(monthlyProductRevenueRaw)) ? 0 : Number(monthlyProductRevenueRaw);

    const weeklyRevenue = Number(weeklyServiceRevenue || 0) + Number(weeklyProductRevenue || 0);
    let monthlyRevenue = Number(monthlyServiceRevenue || 0) + Number(monthlyProductRevenue || 0);
    if (monthlyRevenue === 0 && weeklyRevenue > 0) {
      monthlyRevenue = weeklyRevenue;
    }

    const weeklyNet = weeklyRevenue - Number(weeklyExpense || 0);
    const monthlyNet = monthlyRevenue - Number(monthlyExpense || 0);

    // --- Gün bazlı gelir/gider (son 30 gün) ---
    const daysBack = 30;
    const startDate = new Date(refDate);
    startDate.setDate(startDate.getDate() - (daysBack - 1));
    startDate.setHours(0, 0, 0, 0);

    const serviceRevenueRows = await sequelize.query(
      `SELECT ServiceSales.date, ServiceSales.totalPrice
       FROM ServiceSales
       INNER JOIN Appointments ON ServiceSales.appointmentId = Appointments.id
       WHERE DATE(ServiceSales.date) BETWEEN DATE(?) AND DATE(?) AND Appointments.status IN ('approved', 'completed')`,
      { replacements: [startDate, endOfWeek], type: sequelize.QueryTypes.SELECT }
    );

    const expenseRows = await Expense.findAll({
      attributes: ["date", "amount"],
      where: { date: { [Op.between]: [startDate, endOfWeek] } },
      raw: true,
    });

    const productSaleRows = await sequelize.query(
      `SELECT ProductSales.date, ProductSales.totalPrice
       FROM ProductSales
       INNER JOIN Appointments ON ProductSales.appointmentId = Appointments.id
       WHERE DATE(ProductSales.date) BETWEEN DATE(?) AND DATE(?) AND Appointments.status IN ('approved', 'completed')`,
      { replacements: [startDate, endOfWeek], type: sequelize.QueryTypes.SELECT }
    );

    // build date -> sum maps
    function buildDailyMap(rows, dateField, valueField) {
      const map = {};
      rows.forEach((r) => {
        const d = new Date(r[dateField]);
        if (isNaN(d)) return;
        const ymd = d.toISOString().split("T")[0];
        map[ymd] = (map[ymd] || 0) + Number(r[valueField] || 0);
      });
      return map;
    }

    const serviceRevenueMap = buildDailyMap(serviceRevenueRows, 'date', 'totalPrice');
    const productRevenueMap = buildDailyMap(productSaleRows, 'date', 'totalPrice');
    // Combine maps: combinedRevenueMap = serviceRevenueMap + productRevenueMap
    const combinedRevenueMap = { ...serviceRevenueMap };
    Object.keys(productRevenueMap).forEach((k) => {
      combinedRevenueMap[k] = (combinedRevenueMap[k] || 0) + productRevenueMap[k];
    });
    const expenseMap = buildDailyMap(expenseRows, 'date', 'amount');

    // create arrays for last N days
    const dates = [];
    const revenueByDay = [];
    const serviceRevenueByDay = []; // Yeni Hizmet Geliri dizisi
    const productRevenueByDay = [];
    const expenseByDay = [];
    for (let i = 0; i < daysBack; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const ymd = d.toISOString().split('T')[0];
      dates.push(ymd);
      revenueByDay.push(combinedRevenueMap[ymd] || 0);
      // also include separate arrays
      serviceRevenueByDay.push(serviceRevenueMap[ymd] || 0); // Kullanımı güncellendi
      productRevenueByDay.push(productRevenueMap[ymd] || 0);
      expenseByDay.push(expenseMap[ymd] || 0);
    }
    
    res.json({
      statsCards: {
        totalAppointments,
        pendingAppointments,
        totalProducts,
        lowStockCount,
        totalUsage,
        weeklyRevenue,
        monthlyRevenue,
        weeklyServiceRevenue, // Hizmet geliri artık ServiceSale'den geliyor
        monthlyServiceRevenue, // Hizmet geliri artık ServiceSale'den geliyor
        weeklyProductRevenue,
        monthlyProductRevenue,
        weeklyExpense,
        monthlyExpense,
        weeklyNet,
        monthlyNet,
        busiestDay,
        // ... (rest of statsCards)
      },
      charts: {
        topProducts,
        dailyCounts,
        hourlyCounts,
        revenueByDay: { dates, revenueByDay },
        serviceRevenueByDay: { dates, revenueByDay: serviceRevenueByDay },
        productRevenueByDay: { dates, revenueByDay: productRevenueByDay },
        expenseByDay: { dates, expenseByDay },
      },
      productDetails,
    });
  } catch (err) {
    console.error("analytics getOverview error MESSAGE:", err.message);
    console.error("analytics getOverview error STACK:", err.stack);
    res.status(500).json({ message: "Analytics error: " + err.message, errorDetails: err.toString() });
  }
};