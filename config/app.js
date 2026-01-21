require('dotenv').config();

const appConfig = {
  // Database schema configuration
  schema: process.env.DB_SCHEMA || 'dbo',
  
  // API Configuration
  apiSecretKey: process.env.API_SECRET_KEY,
  port: process.env.PORT || 3000,
  bindAddress: process.env.BIND_ADDRESS || '127.0.0.1',
};

// Helper functions
appConfig.getSchema = function() {
  return this.schema;
};

appConfig.getBindAddress = function() {
  return this.bindAddress;
};

module.exports = appConfig;
