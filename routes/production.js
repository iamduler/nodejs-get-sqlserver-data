const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../config/database');
const appConfig = require('../config/app');

// Create a connection pool
let pool;

async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(dbConfig);
    } 
    catch (error) {
      throw new Error(`Database connection error: ${error.message}`);
    }
  }
  return pool;
}

/**
 * GET /api/production
 * Lấy dữ liệu sản lượng
 * Query params:
 * - startDate: Ngày bắt đầu (YYYY-MM-DD)
 * - endDate: Ngày kết thúc (YYYY-MM-DD)
 * - limit: Số lượng bản ghi (mặc định: 100)
 * - page: Trang hiện tại (mặc định: 1)
 */
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate and parse limit
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) {
      limit = 100; // Default value
    }

    if (limit > 10000) {
      limit = 10000; // Maximum limit
    }
    
    // Validate and parse page
    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1) {
      page = 1; // Default value
    }
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    const schema = appConfig.getSchema();
    const tableName = 'SanLuong';
    const dateColumn = 'Modified';
    
    let query = `
      SELECT *
      FROM ${schema}.${tableName}
      WHERE 1=1
    `;

    let totalQuery = `
      SELECT COUNT(*) AS totalCount
      FROM ${schema}.${tableName}
      WHERE 1=1
    `;
    
    // Tối ưu: Chạy query data và count song song để tăng tốc độ
    // Tạo 2 request riêng biệt để tránh conflict
    const dataRequest = (await getPool()).request();
    const countRequest = (await getPool()).request();
    
    // Set timeout cho cả 2 request (tăng timeout cho các query lớn)
    // Timeout được tính: base timeout + thêm thời gian cho offset lớn
    const baseTimeout = 120000; // 2 phút
    const additionalTimeout = Math.min(offset / 1000 * 1000, 180000); // Thêm tối đa 3 phút
    const requestTimeout = baseTimeout + additionalTimeout;
    
    dataRequest.timeout = requestTimeout;
    countRequest.timeout = requestTimeout;
    
    // Setup parameters cho data query
    dataRequest.input('limit', sql.Int, limit);
    dataRequest.input('offset', sql.Int, offset);
    
    // Setup parameters cho count query và build WHERE clause
    if (startDate) {
      query += ` AND [${dateColumn}] >= @startDate`;
      totalQuery += ` AND [${dateColumn}] >= @startDate`;

      // Check if startDate includes time
      if (startDate.includes('T')) {
        dataRequest.input('startDate', sql.Date, startDate);
        countRequest.input('startDate', sql.Date, startDate);
      } 
      else {
        dataRequest.input('startDate', sql.Date, startDate + 'T00:00:00');
        countRequest.input('startDate', sql.Date, startDate + 'T00:00:00');
      }
    }
    
    if (endDate) {
      query += ` AND [${dateColumn}] <= @endDate`;
      totalQuery += ` AND [${dateColumn}] <= @endDate`;

      if (endDate.includes('T')) {
        dataRequest.input('endDate', sql.Date, endDate);
        countRequest.input('endDate', sql.Date, endDate);
      }
      else {
        dataRequest.input('endDate', sql.Date, endDate + 'T23:59:59');
        countRequest.input('endDate', sql.Date, endDate + 'T23:59:59');
      }
    }
    
    query += ` ORDER BY [${dateColumn}] ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    
    // Chạy song song để tăng tốc độ
    const [result, totalResult] = await Promise.all([
      dataRequest.query(query),
      countRequest.query(totalQuery)
    ]);

    // Check if there are more pages
    const totalCount = totalResult.recordset[0].totalCount;
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      count: result.recordset.length,
      currentPage: page,
      totalPages: totalPages,
      data: result.recordset,
    });
  } 
  catch (error) {
    console.error('Error fetching production:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy dữ liệu sản lượng',
      message: error.message
    });
  }
});

module.exports = router;

