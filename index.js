require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const dbConfig = require('./config/database');
const appConfig = require('./config/app');
const revenueRoutes = require('./routes/revenue');
const productionRoutes = require('./routes/production');

const app = express();
const PORT = appConfig.port || 3000;
const BIND_ADDRESS = appConfig.getBindAddress();
const API_SECRET_KEY = appConfig.apiSecretKey;

app.set('trust proxy', true);

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

  next();
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
    throw error; // ❗ KHÔNG exit ở đây
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'API lấy dữ liệu doanh thu từ SQL Server',
    version: '1.0.0',
    author: 'Duler@CloudGO',
  });
});

app.use('/api/revenue', revenueRoutes);
app.use('/api/production', productionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  if (pool && pool.connected) {
    return res.json({ status: 'healthy', database: 'connected' });
  }
  res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
let server;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(PORT, BIND_ADDRESS, () => {
      console.log(`🚀 API Server running at http://${BIND_ADDRESS}:${PORT}`);
    });

  } 
  catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1); // PM2 restart
  }
}

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n🛑 Nhận tín hiệu ${signal}, đang shutdown...`);

  if (server) {
    await new Promise(resolve => {
      server.close(() => {
        console.log('✅ HTTP server đã đóng');
        resolve();
      });
    });
  }

  if (pool) {
    await pool.close();
    console.log('✅ Đã đóng kết nối database');
  }

  process.exit(0);
};

process.on('SIGINT', shutdown);   // Ctrl+C
process.on('SIGTERM', shutdown);  // PM2 / systemctl

startServer();

// Export pool for use in routes
module.exports = { getPool: () => pool };
