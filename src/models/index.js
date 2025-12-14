const sequelize = require('../config/db');
const User = require('./User');
const Service = require('./Service');
const Appointment = require('./Appointment');
const Product = require('./Product');
const ProductSale = require('./ProductSale');
const ServiceSale = require('./ServiceSale');
const Expense = require('./Expense');
const BarberDayStatus = require('./BarberDayStatus');
// Yeni eklediğimiz model:
const BarberInviteCode = require('./BarberInviteCode'); 

// --- İLİŞKİLER ---

// 1. Müşteri ve Randevu
User.hasMany(Appointment, { foreignKey: 'customerId', as: 'customerAppointments' });
Appointment.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

// 2. Berber ve Randevu
User.hasMany(Appointment, { foreignKey: 'barberId', as: 'barberAppointments' });
Appointment.belongsTo(User, { foreignKey: 'barberId', as: 'barber' });

// 3. Hizmet ve Randevu
Service.hasMany(Appointment, { foreignKey: 'serviceId' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// 4. Product -> ProductSale
Product.hasMany(ProductSale, { foreignKey: 'productId' });
ProductSale.belongsTo(Product, { foreignKey: 'productId', as: 'Product' });

// 5. Appointment -> ProductSale
Appointment.hasMany(ProductSale, { foreignKey: 'appointmentId', as: 'ProductSales' });
ProductSale.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'Appointment' });

// 6. Service -> ServiceSale
Service.hasMany(ServiceSale, { foreignKey: 'serviceId' });
ServiceSale.belongsTo(Service, { foreignKey: 'serviceId', as: 'Service' });

// 7. Appointment -> ServiceSale
Appointment.hasMany(ServiceSale, { foreignKey: 'appointmentId', as: 'ServiceSales' });
ServiceSale.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'Appointment' });

// 6. BarberDayStatus (db tablosu "barber_day_status")
// Model BarberDayStatus (barber_id, date, is_open) yönetimi için
// ilişki eklemiyoruz ama model export edilmesi yeterli

module.exports = {
    sequelize,
    User,
    Service,
    Appointment,
    Product,
    ProductSale,
    ServiceSale,
    Expense,
    BarberDayStatus,
    BarberInviteCode // Bunu dışarı aktarmayı unutma!
};