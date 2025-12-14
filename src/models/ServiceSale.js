const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ServiceSale = sequelize.define("ServiceSale", {
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2), // Hizmetin fiyatı
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2), // Toplam hizmet fiyatı (unitPrice * quantity)
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
    timestamps: false
});

module.exports = ServiceSale;