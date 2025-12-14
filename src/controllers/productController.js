const Product = require("../models/Product");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({ order: [["name", "ASC"]] });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürünler getirilemedi." });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;
    console.log('Creating product', { body: req.body });

    if (!name || price == null || stock == null) {
      return res
        .status(400)
        .json({ message: "Ürün adı, fiyat ve stok zorunludur." });
    }

    const product = await Product.create({
      name,
      category,
      price,
      stock,
      usageCount: 0,
    });
    console.log('Product created id=', product.id);

    res.status(201).json(product);
  } catch (err) {
    console.error('createProduct error', err);
    res.status(500).json({ message: "Ürün eklenemedi.", error: err.message });
  }
};

/**
 * Stok güncelleme
 * - Eğer body'de delta varsa: mevcut stoğun ÜZERİNE ekler/çıkarır (stock += delta)
 * - Eğer body'de stock varsa: stoğu doğrudan o değere set eder (eski davranış)
 */
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, stock } = req.body;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });

    let newStock;

    if (delta != null) {
      const d = Number(delta);
      if (Number.isNaN(d)) {
        return res.status(400).json({ message: "Geçersiz stok delta değeri." });
      }
      newStock = product.stock + d; // ekle/çıkar
    } else if (stock != null) {
      const s = Number(stock);
      if (Number.isNaN(s)) {
        return res.status(400).json({ message: "Geçersiz stok değeri." });
      }
      newStock = s; // doğrudan set et (eski mantık)
    } else {
      return res
        .status(400)
        .json({ message: "Stok güncellemek için delta veya stock gönderin." });
    }

    product.stock = Math.max(0, newStock); // 0'ın altına düşmesin
    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Stok güncellenemedi." });
  }
};

/**
 * Kullanım güncelleme
 * - delta: +1 / -1 gibi
 * - usageCount += delta
 * - stock      -= delta   (her kullanım stoktan 1 düşer, geri alırken 1 ekler)
 */
exports.updateUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });

    const d = Number(delta || 0);
    if (!d) {
      return res
        .status(400)
        .json({ message: "Geçersiz kullanım delta değeri." });
    }

    // usage ve stok birlikte güncellensin
    product.usageCount = Math.max(0, product.usageCount + d);
    // decrease stock when usage increases, increase when negative delta
    product.stock = Math.max(0, product.stock - d);

    await product.save();

    // Eğer pozitif delta ise (satış), ProductSale kaydı oluştur
    if (d > 0) {
      const ProductSale = require("../models/ProductSale");
      const { appointmentId } = req.body || {};
      const sale = await ProductSale.create({
        productId: product.id,
        quantity: d,
        appointmentId: appointmentId || null,
        unitPrice: product.price,
        totalPrice: product.price * d,
        date: new Date().toISOString().split("T")[0],
      });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kullanım güncellenemedi." });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });

    await product.destroy();
    res.json({ message: "Ürün silindi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ürün silinemedi." });
  }
};
