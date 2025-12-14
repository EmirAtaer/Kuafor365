const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'name' // DB kolonu 'name' olarak kalmaya devam ediyor, model içinde fullName kullanıyoruz
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password' // DB kolonu 'password' olarak kalıyor
    },
    role: {
        type: DataTypes.ENUM('admin', 'barber', 'customer'),
        defaultValue: 'customer',
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    }
    // İstersen buraya avatar, bio vb. ekleyebilirsin
}, {
    timestamps: true
});

module.exports = User;