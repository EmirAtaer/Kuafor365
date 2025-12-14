const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductSale = sequelize.define("ProductSale", {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unitPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
});

module.exports = ProductSale;
