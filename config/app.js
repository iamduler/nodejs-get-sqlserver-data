require('dotenv').config();

const appConfig = {
  // Database table/view configuration
  revenueTable: process.env.DB_REVENUE_TABLE || 'DoanhThuVND',
  revenueSchema: process.env.DB_REVENUE_SCHEMA || 'dbo',
  revenueDateColumn: process.env.DB_REVENUE_DATE_COLUMN || 'Modified',
  
  // API Configuration
  apiSecretKey: process.env.API_SECRET_KEY,
  port: process.env.PORT || 3000,
};

// Helper function to get full table/view name
appConfig.getRevenueTableName = function() {
  return `[${this.revenueSchema}].[${this.revenueTable}]`;
};

module.exports = appConfig;
