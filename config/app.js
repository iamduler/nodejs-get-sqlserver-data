require('dotenv').config();

const appConfig = {
  // Database schema configuration
  schema: process.env.DB_SCHEMA || 'dbo',
  
  // API Configuration
  apiSecretKey: process.env.API_SECRET_KEY,
  port: process.env.PORT || 3000,
};

// Helper function to get full table/view name
appConfig.getSchema = function() {
  return this.schema;
};

module.exports = appConfig;
