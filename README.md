# Node.js API - Lấy dữ liệu doanh thu từ SQL Server

API RESTful để lấy dữ liệu doanh thu từ SQL Server database.

## 🚀 Tính năng

- ✅ Lấy dữ liệu doanh thu với filter theo ngày
- ✅ Tổng hợp doanh thu theo ngày/tháng/năm
- ✅ Lấy doanh thu theo tháng cụ thể
- ✅ Lấy doanh thu hôm nay
- ✅ Connection pooling cho hiệu suất tốt
- ✅ Error handling đầy đủ

## 📋 Yêu cầu

- Node.js >= 14.x
- SQL Server (local hoặc Azure)
- Database có bảng `Revenue` với các cột:
  - `Date` (datetime/date)
  - `Revenue` (decimal/float)
  - `ProductName` (nvarchar/varchar)
  - `Quantity` (int)
  - `UnitPrice` (decimal/float)
  - `TotalAmount` (decimal/float)

## 🔧 Cài đặt

1. Clone repository:
```bash
git clone https://github.com/iamduler/nodejs-get-sqlserver-data.git
cd nodejs-get-sqlserver-data
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

4. Cấu hình database trong file `.env`:
```env
DB_SERVER=localhost
DB_NAME=your_database
DB_USER=sa
DB_PASSWORD=your_password
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

## 🏃 Chạy ứng dụng

### Development mode (với nodemon):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## 📡 API Endpoints

### 1. Lấy tất cả doanh thu
```
GET /api/revenue
```

**Query Parameters:**
- `startDate` (optional): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (optional): Ngày kết thúc (YYYY-MM-DD)
- `limit` (optional): Số lượng bản ghi (mặc định: 100)

**Ví dụ:**
```bash
GET /api/revenue?startDate=2024-01-01&endDate=2024-01-31&limit=50
```

### 2. Tổng hợp doanh thu
```
GET /api/revenue/summary
```

**Query Parameters:**
- `startDate` (optional): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (optional): Ngày kết thúc (YYYY-MM-DD)
- `groupBy` (optional): 'day', 'month', 'year' (mặc định: 'day')

**Ví dụ:**
```bash
GET /api/revenue/summary?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
```

### 3. Doanh thu theo tháng
```
GET /api/revenue/month
```

**Query Parameters:**
- `year` (required): Năm (YYYY)
- `month` (required): Tháng (MM)

**Ví dụ:**
```bash
GET /api/revenue/month?year=2024&month=01
```

### 4. Doanh thu hôm nay
```
GET /api/revenue/today
```

### 5. Health Check
```
GET /health
```

## 📝 Response Format

### Success Response:
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "date": "2024-01-15",
      "revenue": 1500000,
      "productName": "Product A",
      "quantity": 10,
      "unitPrice": 150000,
      "totalAmount": 1500000
    }
  ]
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Lỗi khi lấy dữ liệu doanh thu",
  "message": "Error details..."
}
```

## 🔒 Security Notes

- Không commit file `.env` vào git
- Sử dụng environment variables cho thông tin nhạy cảm
- Cân nhắc thêm authentication/authorization cho production
- Sử dụng HTTPS trong production

## 📄 License

ISC

## 👤 Author

iamduler