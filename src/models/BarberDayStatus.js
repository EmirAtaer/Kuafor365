const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BarberDayStatus = sequelize.define('BarberDayStatus', {
  barberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'barber_id'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_open: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'barber_day_status',
  timestamps: false
});

module.exports = BarberDayStatus;
