const Service = require("../models/Service");

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({ order: [["name", "ASC"]] });
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hizmetler getirilemedi." });
  }
};

exports.createService = async (req, res) => {
  try {
    const { name, price, durationMinutes, description } = req.body;
    if (!name || price == null) {
      return res
        .status(400)
        .json({ message: "Hizmet adı ve fiyat zorunludur." });
    }

    const s = await Service.create({ name, price, durationMinutes, description });
    res.status(201).json(s);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hizmet eklenemedi." });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, durationMinutes, description } = req.body;

    const s = await Service.findByPk(id);
    if (!s) return res.status(404).json({ message: "Hizmet bulunamadı." });

    if (name != null) s.name = name;
    if (price != null) s.price = price;
    if (durationMinutes != null) s.durationMinutes = durationMinutes;
    if (description != null) s.description = description;

    await s.save();
    res.json(s);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hizmet güncellenemedi." });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const s = await Service.findByPk(id);
    if (!s) return res.status(404).json({ message: "Hizmet bulunamadı." });

    await s.destroy();
    res.json({ message: "Hizmet silindi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hizmet silinemedi." });
  }
};
