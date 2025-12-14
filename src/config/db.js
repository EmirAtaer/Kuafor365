const { Sequelize } = require("sequelize");
require("dotenv").config();

const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: false,
  }
);

module.exports = sequelize;
