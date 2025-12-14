const Expense = require('../models/Expense');

exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({ order: [['date', 'DESC']] });
    res.json(expenses);
  } catch (err) {
    console.error('getAllExpenses error', err);
    res.status(500).json({ message: 'Giderler alınamadı.' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { amount, category, date, notes, recurring } = req.body;
    if (amount == null) return res.status(400).json({ message: 'Tutar gerekli.' });
    const e = await Expense.create({ amount, category, date: new Date(date || Date.now()), notes, recurring: !!recurring });
    res.status(201).json(e);
  } catch (err) {
    console.error('createExpense error', err);
    res.status(500).json({ message: 'Gider eklenemedi.' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const e = await Expense.findByPk(id);
    if (!e) return res.status(404).json({ message: 'Gider bulunamadı.' });
    const { amount, category, date, notes, recurring } = req.body;
    if (amount != null) e.amount = amount;
    if (category != null) e.category = category;
    if (date != null) e.date = new Date(date);
    if (notes != null) e.notes = notes;
    if (recurring != null) e.recurring = !!recurring;
    await e.save();
    res.json(e);
  } catch (err) {
    console.error('updateExpense error', err);
    res.status(500).json({ message: 'Gider güncellenemedi.' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const e = await Expense.findByPk(id);
    if (!e) return res.status(404).json({ message: 'Gider bulunamadı.' });
    await e.destroy();
    res.json({ message: 'Gider silindi.' });
  } catch (err) {
    console.error('deleteExpense error', err);
    res.status(500).json({ message: 'Gider silinemedi.' });
  }
};
