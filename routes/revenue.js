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
    } catch (error) {
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
 */
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    let query = `
      SELECT TOP (@limit)
        [Date] AS date,
        [Revenue] AS revenue,
        [ProductName] AS productName,
        [Quantity] AS quantity,
        [UnitPrice] AS unitPrice,
        [TotalAmount] AS totalAmount
      FROM [Revenue]
      WHERE 1=1
    `;
    
	const request = (await getPool()).request();
    request.input('limit', sql.Int, parseInt(limit));
    
    if (startDate) {
      query += ` AND [Date] >= @startDate`;
      request.input('startDate', sql.Date, startDate);
    }
    
    if (endDate) {
      query += ` AND [Date] <= @endDate`;
      request.input('endDate', sql.Date, endDate);
    }
    
    query += ` ORDER BY [Date] DESC`;
    
    const result = await request.query(query);
    
    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy dữ liệu doanh thu',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue/summary
 * Lấy tổng hợp doanh thu theo ngày/tháng/năm
 * Query params:
 * - startDate: Ngày bắt đầu (YYYY-MM-DD)
 * - endDate: Ngày kết thúc (YYYY-MM-DD)
 * - groupBy: 'day', 'month', 'year' (mặc định: 'day')
 */
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    let dateFormat, groupByField;
    switch (groupBy) {
      case 'year':
        dateFormat = 'YYYY';
        groupByField = 'YEAR([Date])';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        groupByField = 'FORMAT([Date], \'yyyy-MM\')';
        break;
      case 'day':
      default:
        dateFormat = 'YYYY-MM-DD';
        groupByField = 'FORMAT([Date], \'yyyy-MM-dd\')';
        break;
    }
    
    let query = `
      SELECT 
        ${groupByField} AS period,
        SUM([TotalAmount]) AS totalRevenue,
        SUM([Quantity]) AS totalQuantity,
        COUNT(*) AS transactionCount,
        AVG([UnitPrice]) AS avgUnitPrice
      FROM [Revenue]
      WHERE 1=1
    `;
    
	const request = (await getPool()).request();
    
    if (startDate) {
      query += ` AND [Date] >= @startDate`;
      request.input('startDate', sql.Date, startDate);
    }
    
    if (endDate) {
      query += ` AND [Date] <= @endDate`;
      request.input('endDate', sql.Date, endDate);
    }
    
    query += ` GROUP BY ${groupByField} ORDER BY period DESC`;
    
    const result = await request.query(query);
    
    res.json({
      success: true,
      groupBy: groupBy,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy tổng hợp doanh thu',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue/month
 * Lấy doanh thu theo tháng
 * Query params:
 * - year: Năm (YYYY)
 * - month: Tháng (MM)
 */
router.get('/month', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp year và month'
      });
    }
    
    const query = `
      SELECT 
        [Date] AS date,
        [Revenue] AS revenue,
        [ProductName] AS productName,
        [Quantity] AS quantity,
        [UnitPrice] AS unitPrice,
        [TotalAmount] AS totalAmount
      FROM [Revenue]
      WHERE YEAR([Date]) = @year AND MONTH([Date]) = @month
      ORDER BY [Date] DESC
    `;
    
	const request = (await getPool()).request();
    request.input('year', sql.Int, parseInt(year));
    request.input('month', sql.Int, parseInt(month));
    
    const result = await request.query(query);
    
    const totalRevenue = result.recordset.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
    
    res.json({
      success: true,
      year: year,
      month: month,
      totalRevenue: totalRevenue,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy doanh thu theo tháng',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue/today
 * Lấy doanh thu hôm nay
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        [Date] AS date,
        [Revenue] AS revenue,
        [ProductName] AS productName,
        [Quantity] AS quantity,
        [UnitPrice] AS unitPrice,
        [TotalAmount] AS totalAmount
      FROM [Revenue]
      WHERE CAST([Date] AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY [Date] DESC
    `;
    
	const request = (await getPool()).request();
    const result = await request.query(query);
    
    const totalRevenue = result.recordset.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
    
    res.json({
      success: true,
      date: today,
      totalRevenue: totalRevenue,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching today revenue:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy doanh thu hôm nay',
      message: error.message
    });
  }
});

module.exports = router;
