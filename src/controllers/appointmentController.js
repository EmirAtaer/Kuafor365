// src/controllers/appointmentController.js
const { Appointment, User, Product, ProductSale, Service, ServiceSale } = require("../models");
const sequelize = require("../config/db");
const { QueryTypes, Op } = require("sequelize");

// Yardımcı: Date -> "YYYY-MM-DD" (yerel zamana göre)
function formatDateToYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Randevu oluştur
exports.createAppointment = async (req, res) => {
  try {
    const { dateTime, customerId, barberId, notes, totalPrice: initialTotalPrice, selectedProducts, selectedServices } = req.body;

    if (!dateTime || !customerId || !barberId) {
      return res
        .status(400)
        .json({ message: "Tarih, müşteri ve kuaför zorunludur." });
    }

    const apptDate = new Date(dateTime);
    const now = new Date();

    // Geçmiş tarih kontrolü
    if (apptDate <= now) {
      return res
        .status(400)
        .json({ message: "Geçmiş tarihe randevu oluşturulamaz." });
    }

    // 1) SAAT KONTROLÜ: sadece 09:00 - 20:00 arası ve TAM SAATLER
    const hour = apptDate.getHours();
    const minute = apptDate.getMinutes();

    // Tam saat değilse (örn. 09:15, 12:30 vs.)
    if (minute !== 0) {
      return res.status(400).json({
        message:
          "Randevular yalnızca tam saatlerde alınabilir (ör. 09:00, 10:00, 11:00...).",
      });
    }

    const tooEarly = hour < 9;
    const tooLate = hour > 20 || (hour === 20 && minute > 0);

    if (tooEarly || tooLate) {
      return res.status(400).json({
        message: "Randevu saatleri sadece 09:00 - 20:00 arasındadır.",
      });
    }

    // 2) GÜN AÇIK MI? (barber_day_status tablosundan kontrol)
    const dateStr = formatDateToYMD(apptDate); // "YYYY-MM-DD"

    const rows = await sequelize.query(
      "SELECT is_open FROM barber_day_status WHERE barber_id = :barberId AND date = :dateStr",
      {
        replacements: { barberId: barberId, dateStr: dateStr },
        type: QueryTypes.SELECT,
      }
    );

    // Kayıt yoksa gün varsayılan olarak AÇIK
    const isOpen = rows.length === 0 ? true : !!rows[0].is_open;

    if (!isOpen) {
      return res.status(400).json({
        message: "Kuaför bu günü kapattığı için randevu alınamaz.",
      });
    }

    // 3) AYNI SAATTE BAŞKA RANDEVU VAR MI? (ÇAKIŞMA KONTROLÜ)
    const existing = await Appointment.findOne({
      where: {
        barberId,
        dateTime: apptDate,
        status: {
          [Op.in]: ["pending", "approved"], // iptal edilenleri önemsemiyoruz
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        message:
          "Bu saat için zaten bir randevu bulunuyor. Lütfen başka bir saat seçiniz.",
      });
    }

    // 4) Tüm kontroller geçtiyse randevuyu oluştur
    const t = await sequelize.transaction();
    try {
      let finalTotalPrice = 0; // Backend kendi hesaplar, frontend değerini kullanmaz
      
      // Önce toplam fiyatı hesapla ve validasyonları yap
      const serviceData = [];
      const productData = [];
      
      // --- Hizmet validasyonu ve veri hazırlama ---
      if (Array.isArray(selectedServices) && selectedServices.length > 0) {
        for (const ss of selectedServices) {
          const sid = Number(ss.serviceId);
          const qty = Number(ss.quantity || 1);
          if (!sid || qty <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Geçersiz hizmet bilgisi.' });
          }

          const service = await Service.findByPk(sid, { transaction: t });
          if (!service) {
            await t.rollback();
            return res.status(404).json({ message: `Hizmet bulunamadı: ${sid}` });
          }

          const totalPrice = Number(service.price) * qty;
          finalTotalPrice += totalPrice;
          
          serviceData.push({
            serviceId: sid,
            quantity: qty,
            unitPrice: service.price,
            totalPrice: totalPrice,
            date: dateStr,
          });
        }
      }

      // --- Ürün validasyonu ve veri hazırlama ---
      if (Array.isArray(selectedProducts) && selectedProducts.length > 0) {
        for (const sp of selectedProducts) {
          const pid = Number(sp.productId);
          const qty = Number(sp.quantity || 0);
          if (!pid || qty <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Geçersiz ürün bilgisi.' });
          }

          const prod = await Product.findByPk(pid, { transaction: t });
          if (!prod) {
            await t.rollback();
            return res.status(404).json({ message: `Ürün bulunamadı: ${pid}` });
          }
          if (prod.stock < qty) {
            await t.rollback();
            return res.status(400).json({ message: `Yetersiz stok: ${prod.name}` });
          }

          // Stok düşürme işlemi randevu onaylandığında yapılacak
          // Burada sadece stok kontrolü yapıyoruz

          const totalPrice = prod.price * qty;
          finalTotalPrice += Number(totalPrice);
          
          productData.push({
            productId: pid,
            quantity: qty,
            unitPrice: prod.price,
            totalPrice: totalPrice,
            date: dateStr,
          });
        }
      }
      
      // Randevuyu oluştur (toplam fiyatı hesaplanmış haliyle)
      const appointment = await Appointment.create({
        dateTime: apptDate,
        customerId,
        barberId,
        notes,
        totalPrice: finalTotalPrice,
        status: "pending",
      }, { transaction: t });

      // Şimdi ServiceSale ve ProductSale'leri appointmentId ile birlikte oluştur
      const createdServiceSales = [];
      const createdProductSales = [];
      const serviceNamesMap = {};
      const productNamesMap = {};
      
      // Hizmet isimlerini topla
      for (const sd of serviceData) {
        const service = await Service.findByPk(sd.serviceId, { transaction: t });
        if (service) {
          serviceNamesMap[sd.serviceId] = service.name;
        }
        const sale = await ServiceSale.create({
          ...sd,
          appointmentId: appointment.id,
        }, { transaction: t });
        createdServiceSales.push(sale);
      }
      
      // Ürün isimlerini topla
      for (const pd of productData) {
        const product = await Product.findByPk(pd.productId, { transaction: t });
        if (product) {
          productNamesMap[pd.productId] = product.name;
        }
        const sale = await ProductSale.create({
          ...pd,
          appointmentId: appointment.id,
        }, { transaction: t });
        createdProductSales.push(sale);
      }
      
      // Özet bilgileri oluştur (isimlerle)
      const serviceSummary = createdServiceSales.map(s => 
        `${serviceNamesMap[s.serviceId] || 'Hizmet'} (${s.quantity} x ${s.unitPrice}₺)`
      ).join(', ');
      
      const productSummary = createdProductSales.map(s => 
        `${productNamesMap[s.productId] || 'Ürün'} (${s.quantity} x ${s.unitPrice}₺)`
      ).join(', ')

      // Notları güncelle
      let finalNotes = notes || '';
      if (productSummary) {
          finalNotes += (finalNotes ? ' | ' : '') + 'Ürünler: ' + productSummary;
      }
        if (serviceSummary) {
          finalNotes += (finalNotes ? ' | ' : '') + 'Hizmetler: ' + serviceSummary;
        }

      if (finalNotes !== appointment.notes) {
          appointment.notes = finalNotes;
          await appointment.save({ transaction: t });
      }

      await t.commit();
      console.log('Created appointment', { 
          id: appointment.id, 
          serviceSales: createdServiceSales.map(s => ({ id: s.id, serviceId: s.serviceId, quantity: s.quantity })),
          productSales: createdProductSales.map(s => ({ id: s.id, productId: s.productId, quantity: s.quantity })) 
      });
      res.status(201).json({
        message: "Randevu oluşturuldu.",
        appointment,
        serviceSales: createdServiceSales,
        productSales: createdProductSales,
      });
    } catch (innerErr) {
      await t.rollback();
      throw innerErr;
    }
  } catch (err) {
    console.error("createAppointment error:", err);
    res.status(500).json({ message: "Sunucu hatası.", error: err.message });
  }
};

// Tüm randevuları getir
exports.getAllAppointments = async (req, res) => {
  try {
    const { date, status } = req.query; // date: YYYY-MM-DD

    const where = {};

    if (status) {
      // tek bir status ya da virgülle ayrılmış dizin olabilir
      const statuses = status.split(",").map((s) => s.trim());
      where.status = { [Op.in]: statuses };
    }

    if (date) {
      // local timezone gün aralığı
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.dateTime = { [Op.gte]: start, [Op.lt]: end };
    }

    const appointments = await Appointment.findAll({
      where,
      order: [["dateTime", "ASC"]],
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "fullName", "phone", "email"],
        },
        {
          model: ProductSale,
          as: 'ProductSales',
          attributes: ['id', 'productId', 'quantity', 'unitPrice', 'totalPrice'],
          include: [{ model: Product, as: 'Product', attributes: ['id', 'name'] }],
        },
        {
          model: ServiceSale,
          as: 'ServiceSales',
          attributes: ['id', 'serviceId', 'quantity', 'unitPrice', 'totalPrice'],
          include: [{ model: Service, as: 'Service', attributes: ['id', 'name'] }],
        },
      ],
    });

    res.json(appointments);
  } catch (err) {
    console.error("getAllAppointments error:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

exports.updateStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      await t.rollback();
      return res.status(400).json({ message: "Status gerekli." });
    }

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: ProductSale, as: 'ProductSales' },
        { model: ServiceSale, as: 'ServiceSales' }
      ],
      transaction: t
    });
    
    if (!appointment) {
      await t.rollback();
      return res.status(404).json({ message: "Randevu bulunamadı." });
    }

    const oldStatus = appointment.status;
    appointment.status = status;

    // Eğer randevu "approved" (onaylandı) durumuna geçiyorsa, stokları düş
    if (status === 'approved' && oldStatus !== 'approved') {
      if (appointment.ProductSales && appointment.ProductSales.length > 0) {
        for (const sale of appointment.ProductSales) {
          const product = await Product.findByPk(sale.productId, { transaction: t });
          if (product) {
            product.stock = product.stock - sale.quantity;
            product.usageCount = (product.usageCount || 0) + sale.quantity;
            await product.save({ transaction: t });
          }
        }
      }
    }

    // Onaylandıktan sonra iptal edilemesin
    if (status === 'cancelled' && oldStatus === 'approved') {
      await t.rollback();
      return res.status(400).json({ message: "Onaylanan randevu iptal edilemez." });
    }

    await appointment.save({ transaction: t });
    await t.commit();

    res.json({ message: "Randevu durumu güncellendi.", appointment });
  } catch (err) {
    await t.rollback();
    console.error("updateStatus error:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// Randevuyu tamamen sil (no-show vb.)
exports.deleteAppointment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: ProductSale, as: 'ProductSales' },
        { model: ServiceSale, as: 'ServiceSales' },
      ],
      transaction: t,
    });

    if (!appointment) {
      await t.rollback();
      return res.status(404).json({ message: 'Randevu bulunamadı.' });
    }

    // Ürün satışları varsa stoğu geri yükle ve usageCount'u azalt
    if (appointment.ProductSales && appointment.ProductSales.length > 0) {
      for (const sale of appointment.ProductSales) {
        const product = await Product.findByPk(sale.productId, { transaction: t });
        if (product) {
          product.stock = product.stock + sale.quantity;
          product.usageCount = Math.max(0, (product.usageCount || 0) - sale.quantity);
          await product.save({ transaction: t });
        }
        await sale.destroy({ transaction: t });
      }
    }

    // Hizmet satışlarını temizle
    if (appointment.ServiceSales && appointment.ServiceSales.length > 0) {
      for (const sale of appointment.ServiceSales) {
        await sale.destroy({ transaction: t });
      }
    }

    await appointment.destroy({ transaction: t });

    await t.commit();
    return res.json({ message: 'Randevu silindi (no-show).', id });
  } catch (err) {
    await t.rollback();
    console.error('deleteAppointment error:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};