const path = require("path");
const envFile = `.env.${process.env.NODE_ENV}`;

require("dotenv").config({ path: path.resolve(__dirname, "..", envFile) });

const commonConfig = {
  username: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME ,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  pool: {
    max: 5,           
    min: 0,           // Reduced from 2 to allow all connections to be released
    acquire: 60000,   // Increased from 30000 to give more time for connection acquisition
    idle: 10000,
  },
  logging: false,
};

module.exports = {
  development: {
    ...commonConfig,
    logging: console.log, // Enable logging in development
  },
  test: {
    ...commonConfig,
  },
  production: {
    ...commonConfig,
  },
};
