const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Service = sequelize.define('Service', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2), // Para birimi için en doğrusu
        allowNull: false
    },
    durationMinutes: {
        type: DataTypes.INTEGER, // Dakika cinsinden (örn: 30)
        allowNull: false,
        field: 'duration' // DB kolonu 'duration' olarak kalacak
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: false // Hizmetin ne zaman eklendiği çok önemli değilse false yapabilirsin
});

module.exports = Service;