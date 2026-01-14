require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const dbConfig = require('./config/database');
const revenueRoutes = require('./routes/revenue');

const app = express();
const PORT = process.env.PORT || 3000;
const API_SECRET_KEY = process.env.API_SECRET_KEY;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple API key authentication middleware
// - Đọc key từ header: x-api-key
app.use((req, res, next) => {
  // Bỏ qua một số endpoint public
  if (req.path === '/' || req.path === '/health') {
    return next();
  }

  // Nếu không cấu hình API_SECRET_KEY thì không check (chỉ nên dùng ở dev)
  // if (!API_SECRET_KEY) {
  //   return next();
  // }

  const headerKey = req.headers['x-api-key'];
  const providedKey = headerKey;

  if (!providedKey || providedKey !== API_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing or invalid API secret key',
    });
  }

  return next();
});

// Database connection pool
let pool;

async function connectDatabase() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Đã kết nối thành công với SQL Server');
  } 
  catch (error) {
    console.error('❌ Lỗi kết nối database:', error);
    process.exit(1);
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'API lấy dữ liệu doanh thu từ SQL Server',
    version: '1.0.0',
    endpoints: {
      revenue: '/api/revenue',
      revenueByDate: '/api/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD',
      revenueByMonth: '/api/revenue/month?year=YYYY&month=MM',
      revenueByToday: '/api/revenue/today',
      revenueByYear: '/api/revenue/year?year=YYYY',
    }
  });
});

app.use('/api/revenue', revenueRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    if (pool && pool.connected) {
      res.json({ status: 'healthy', database: 'connected' });
    } 
    else {
      res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
    }
  } 
  catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 API Server running on port ${PORT}`);
    });

  } 
  catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1); // PM2 sẽ restart
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Đang tắt server...');
  if (pool) {
    await pool.close();
    console.log('✅ Đã đóng kết nối database');
  }
  process.exit(0);
});

startServer();

// Export pool for use in routes
module.exports = { getPool: () => pool };
