const dotenv = require('dotenv');

dotenv.config({
    path: '.env',
    sample: '.env.example',
    allowEmptyValues: false,
});

module.exports = {
    APP: {
      	PORT: process.env.APP_PORT
    },
    DB: {
      	host: process.env.DB_HOST,
      	user: process.env.DB_USER,
      	password: process.env.DB_PASSWORD,
      	port: process.env.DB_PORT,
      	database: process.env.DB_NAME
    }
}