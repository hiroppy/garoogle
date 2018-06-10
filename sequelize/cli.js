'use strict';

const config = {
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  host: 'mysql',
  dialect: 'mysql'
};

module.exports = {
  development: config,
  test: config,
  production: config
};
