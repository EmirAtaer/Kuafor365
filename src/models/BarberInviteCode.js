// src/models/BarberInviteCode.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BarberInviteCode = sequelize.define('BarberInviteCode', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'barber_invite_codes', // Controller'daki SQL sorgusu bu ismi kullanıyor
    timestamps: true
});

module.exports = BarberInviteCode;