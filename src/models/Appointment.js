const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    dateTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'date' // DB'deki kolon adı 'date' olarak kalıyor
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'cancelled', 'completed'),
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'note' // DB kolonu 'note' olarak kalıyor
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    barberId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: true,
    }
}, {
    timestamps: true
});

// İlişkiler:
const ProductSale = require('./ProductSale');

// ServiceSale entegrasyonu kaldırıldı

// ProductSale ilişkisi index.js içinde tanımlanıyor; burada tekrar etmeyelim

module.exports = Appointment;