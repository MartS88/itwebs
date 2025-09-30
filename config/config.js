const dotenv = require('dotenv');
const envFile = `./.${process.env.NODE_ENV || 'development'}.env`;
dotenv.config({ path: envFile });

module.exports = {
  development: {
    username: process.env.MYSQL_USERNAME || defaultConfig.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD || defaultConfig.MYSQL_PASSWORD,
    database: process.env.MYSQL_NAME || defaultConfig.MYSQL_NAME,
    host: process.env.MYSQL_HOST || defaultConfig.MYSQL_HOST,
    port: process.env.MYSQL_PORT || defaultConfig.MYSQL_PORT,
    dialect: 'mysql',
    logging: console.log,
  },
  test: {
    username: process.env.MYSQL_USERNAME || defaultConfig.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD || defaultConfig.MYSQL_PASSWORD,
    database: process.env.MYSQL_NAME_TEST || 'nestjs_app_test',
    host: process.env.MYSQL_HOST || defaultConfig.MYSQL_HOST,
    port: process.env.MYSQL_PORT || defaultConfig.MYSQL_PORT,
    dialect: 'mysql',
    logging: false,
  },
  production: {
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_NAME,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
