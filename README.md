# Node.js API - Lấy dữ liệu doanh thu từ SQL Server

API RESTful để lấy dữ liệu doanh thu từ SQL Server database.

## 🚀 Tính năng

- ✅ Lấy dữ liệu doanh thu với filter theo ngày (cột `Modified`)
- ✅ Pagination (phân trang) - hỗ trợ `page` và `limit`
- ✅ Connection pooling cho hiệu suất tốt
- ✅ Error handling đầy đủ
- ✅ Health check endpoint để kiểm tra trạng thái
- ✅ Graceful shutdown để đóng kết nối database an toàn

## 📋 Yêu cầu

- Node.js >= 18.x
- SQL Server (local hoặc Azure)
- Database có table/view (cấu hình qua biến môi trường)
  - Mặc định: view `DoanhThuVND` trong schema `dbo`
  - Phải có cột datetime (mặc định: `Modified`) để filter theo ngày
  - Các cột khác tùy thuộc vào cấu trúc dữ liệu của table/view

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
# Server Configuration
PORT=3000

# SQL Server Database Configuration
DB_SERVER=localhost
DB_NAME=your_database
DB_USER=sa
DB_PASSWORD=your_password
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true

# Database Table/View Configuration
DB_REVENUE_SCHEMA=dbo
DB_REVENUE_TABLE=DoanhThuVND
DB_REVENUE_DATE_COLUMN=Modified

# API Secret Key (bắt buộc cho môi trường staging/production)
API_SECRET_KEY=your_strong_secret_key
```

**Lưu ý về cấu hình Table/View:**
- `DB_REVENUE_SCHEMA`: Schema của table/view (mặc định: `dbo`)
- `DB_REVENUE_TABLE`: Tên table hoặc view (mặc định: `DoanhThuVND`)
- `DB_REVENUE_DATE_COLUMN`: Tên cột datetime để filter và sort (mặc định: `Modified`)

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

**Kiểm tra API:**
```bash
# Health check
curl http://localhost:3000/health

# Lấy dữ liệu
curl http://localhost:3000/api/revenue?limit=10&page=1
```

## 📡 API Endpoints

### 1. Lấy dữ liệu doanh thu (với Pagination)
```
GET /api/revenue
```

**Query Parameters:**
- `startDate` (optional): Ngày bắt đầu (YYYY-MM-DD) - filter theo cột `Modified`
- `endDate` (optional): Ngày kết thúc (YYYY-MM-DD) - filter theo cột `Modified`
- `limit` (optional): Số lượng bản ghi mỗi trang (mặc định: 100, tối đa: 1000)
- `page` (optional): Trang hiện tại (mặc định: 1)

**Ví dụ:**
```bash
# Lấy trang đầu tiên với 50 bản ghi
GET /api/revenue?limit=50&page=1

# Lấy dữ liệu trong khoảng thời gian
GET /api/revenue?startDate=2024-01-01&endDate=2024-01-31&limit=50&page=1

# Lấy trang 2
GET /api/revenue?page=2&limit=100
```

**Response với Pagination:**
- `success`: Trạng thái thành công
- `count`: Số lượng bản ghi trong trang hiện tại
- `currentPage`: Trang hiện tại
- `totalPages`: Tổng số trang
- `data`: Mảng dữ liệu doanh thu

### 2. Health Check
```
GET /health
```

Kiểm tra trạng thái server và kết nối database.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## 📝 Response Format

### Success Response (với Pagination):
```json
{
  "success": true,
  "count": 10,
  "currentPage": 1,
  "totalPages": 5,
  "data": [
    {
      // Tất cả các cột từ view DoanhThuVND
      "Modified": "2024-01-15T10:30:00.000Z",
      // ... các cột khác trong bảng
    }
  ]
}
```

**Lưu ý:** Cấu trúc của `data` phụ thuộc vào các cột trong view `DoanhThuVND` của bạn. API sẽ trả về tất cả các cột từ view.

### Error Response:
```json
{
  "success": false,
  "error": "Lỗi khi lấy dữ liệu doanh thu",
  "message": "Error details..."
}
```

### Ví dụ Response thực tế:
```json
{
  "success": true,
  "count": 50,
  "currentPage": 1,
  "totalPages": 10,
  "data": [
    {
      "Id": 1,
      "Modified": "2024-01-15T10:30:00.000Z",
      // ... các cột khác
    }
  ]
}
```

## 🗄️ Database Schema

API sử dụng table/view được cấu hình qua biến môi trường (mặc định: view `DoanhThuVND` trong schema `dbo`).

**Cấu hình trong `.env`:**
```env
DB_REVENUE_SCHEMA=dbo          # Schema của table/view
DB_REVENUE_TABLE=DoanhThuVND   # Tên table hoặc view
DB_REVENUE_DATE_COLUMN=Modified # Tên cột datetime để filter
```

**Yêu cầu bắt buộc:**
- Table/view phải tồn tại trong database
- Phải có cột datetime (cấu hình qua `DB_REVENUE_DATE_COLUMN`) để filter theo ngày và sắp xếp

**Ví dụ query:**
```sql
-- Với cấu hình mặc định
SELECT * FROM [dbo].[DoanhThuVND] WHERE [Modified] >= '2024-01-01'

-- Hoặc với table/view khác (tùy cấu hình)
SELECT * FROM [your_schema].[your_table] WHERE [your_date_column] >= '2024-01-01'
```

**Lưu ý:**
- API sẽ trả về tất cả các cột từ table/view được cấu hình
- Cấu trúc dữ liệu trả về phụ thuộc vào các cột trong table/view của bạn
- Nếu sử dụng view, đảm bảo các bảng cơ sở có index phù hợp để tối ưu hiệu suất
- Bạn có thể thay đổi table/view mà không cần sửa code, chỉ cần cập nhật file `.env`

## 🔒 Security Notes

- Không commit file `.env` vào git
- Sử dụng environment variables cho thông tin nhạy cảm
- Cân nhắc thêm authentication/authorization cho production
- Sử dụng HTTPS trong production
- Giới hạn `limit` tối đa để tránh query quá lớn (hiện tại: 1000)
- Sử dụng parameterized queries để tránh SQL injection

### API Secret Key

Để bảo vệ API, hệ thống hỗ trợ **secret key** đơn giản cấp độ ứng dụng:

- Cấu hình trong file `.env`:
  ```env
  API_SECRET_KEY=your_strong_secret_key
  ```
- Khi `API_SECRET_KEY` được set, tất cả các endpoint (trừ `/` và `/health`) sẽ yêu cầu secret key.
- Cách gửi secret key khi gọi API:
  - Qua header:
    ```http
    GET /api/revenue?limit=50&page=1 HTTP/1.1
    Host: your-domain.com
    x-api-key: your_strong_secret_key
    ```
  - Hoặc qua query string (ít an toàn hơn, chỉ dùng khi cần):
    ```
    GET /api/revenue?limit=50&page=1&secret_key=your_strong_secret_key
    ```

**Lưu ý:**
- Trong môi trường development, nếu không set `API_SECRET_KEY` thì middleware sẽ bỏ qua check để bạn test nhanh.
- Trong môi trường staging/production, **bắt buộc** nên set `API_SECRET_KEY` và dùng HTTPS.

## 🛠️ Troubleshooting

### Lỗi kết nối database
- Kiểm tra thông tin trong file `.env`
- Đảm bảo SQL Server đang chạy và có thể truy cập được
- Kiểm tra firewall và network settings
- Với Azure SQL, đảm bảo `DB_ENCRYPT=true`

### Lỗi "Invalid object name"
- Đảm bảo table/view được cấu hình trong `.env` tồn tại trong database
- Kiểm tra `DB_REVENUE_SCHEMA` và `DB_REVENUE_TABLE` trong file `.env`
- Kiểm tra quyền truy cập của user database đối với table/view và các bảng cơ sở (nếu dùng view)

### Performance issues
- Tạo index trên cột datetime (cột được cấu hình trong `DB_REVENUE_DATE_COLUMN`)
- Sử dụng `limit` hợp lý (khuyến nghị: 50-100)
- Kiểm tra connection pool settings trong `config/database.js`
- Nếu dùng view, đảm bảo các bảng cơ sở có index phù hợp

## 📄 License

ISC

## 👤 Author

iamduler