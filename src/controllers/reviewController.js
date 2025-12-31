const { Review, User } = require('../models');

exports.createReview = async (req, res) => {
  try {
    const { appointmentId, rating, message } = req.body;
    const customerId = req.user.id; // JWT'den gelen kullanıcı ID

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Geçerli bir puan seçin (1-5).' });
    }

    // Aynı randevu için zaten değerlendirme var mı?
    if (appointmentId) {
      const existing = await Review.findOne({ where: { appointmentId } });
      if (existing) {
        return res.status(400).json({ message: 'Bu randevu için zaten değerlendirme yapılmış.' });
      }
    }

    const review = await Review.create({
      customerId,
      appointmentId: appointmentId || null,
      rating,
      message: message || ''
    });

    res.status(201).json({ message: 'Değerlendirme kaydedildi.', review });
  } catch (err) {
    console.error('createReview error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(reviews);
  } catch (err) {
    console.error('getAllReviews error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
