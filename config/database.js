require('dotenv').config();

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'your_database',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // true for Azure, false for local
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // true for local dev
    enableArithAbort: true,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000, // 60 seconds default
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 30000 // 120 seconds default (2 minutes)
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

module.exports = dbConfig;
