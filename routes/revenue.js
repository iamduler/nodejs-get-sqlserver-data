const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../config/database');

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
 * GET /api/revenue
 * Lấy dữ liệu doanh thu
 * Query params:
 * - startDate: Ngày bắt đầu (YYYY-MM-DD)
 * - endDate: Ngày kết thúc (YYYY-MM-DD)
 * - limit: Số lượng bản ghi (mặc định: 100)
 * - page: Trang hiện tại (mặc định: 1)
 */
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100, page = 1 } = req.query;
    
    let query = `
      SELECT *
      FROM [dbo].[DoanhThuTCKT]
      WHERE 1=1
    `;

    let totalQuery = `
      SELECT COUNT(*) AS totalCount
      FROM [dbo].[DoanhThuTCKT]
      WHERE 1=1
    `;

    // Calculate offset
    const offset = (page - 1) * limit;
    
	const request = (await getPool()).request();
    request.input('limit', sql.Int, parseInt(limit));
    request.input('offset', sql.Int, parseInt(offset));
    
    if (startDate) {
      query += ` AND [Modified] >= @startDate`;
      totalQuery += ` AND [Modified] >= @startDate`;

      // Check if startDate includes time
      if (startDate.includes('T')) {
        request.input('startDate', sql.Date, startDate);
      } 
      else {
        request.input('startDate', sql.Date, startDate + 'T00:00:00');
      }
    }
    
    if (endDate) {
      query += ` AND [Modified] <= @endDate`;
      totalQuery += ` AND [Modified] <= @endDate`;

      if (endDate.includes('T')) {
        request.input('endDate', sql.Date, endDate);
      }
      else {
        request.input('endDate', sql.Date, endDate + 'T23:59:59');
      }
    }
    
    query += ` ORDER BY [Modified] DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    
    const result = await request.query(query);
    const totalResult = await request.query(totalQuery);

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
    console.error('Error fetching revenue:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy dữ liệu doanh thu',
      message: error.message
    });
  }
});

module.exports = router;
