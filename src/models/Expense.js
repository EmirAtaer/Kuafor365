const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Expense = sequelize.define(
  'Expense',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    category: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.DATE, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'expenses', timestamps: true }
);

module.exports = Expense;
