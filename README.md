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
- Database có bảng `DoanhThuTCKT` trong schema `dbo`
  - Bảng phải có cột `Modified` (datetime) để filter theo ngày
  - Các cột khác tùy thuộc vào cấu trúc dữ liệu của bạn

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

# Secret key để bảo vệ API (bắt buộc cho môi trường staging/production)
API_SECRET_KEY=your_strong_secret_key
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
      // Tất cả các cột từ bảng DoanhThuTCKT
      "Modified": "2024-01-15T10:30:00.000Z",
      // ... các cột khác trong bảng
    }
  ]
}
```

**Lưu ý:** Cấu trúc của `data` phụ thuộc vào các cột trong bảng `DoanhThuTCKT` của bạn. API sẽ trả về tất cả các cột từ bảng.

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

API sử dụng bảng `DoanhThuTCKT` trong schema `dbo`. Bảng này phải có:

**Yêu cầu bắt buộc:**
- Cột `Modified` (DATETIME) - được sử dụng để filter theo ngày và sắp xếp

**Ví dụ cấu trúc bảng:**
```sql
-- Bảng DoanhThuTCKT phải tồn tại trong database
-- Cột Modified là bắt buộc để filter và sort
SELECT * FROM [dbo].[DoanhThuTCKT] WHERE [Modified] >= '2024-01-01'
```

**Lưu ý:**
- API sẽ trả về tất cả các cột từ bảng `DoanhThuTCKT`
- Cấu trúc dữ liệu trả về phụ thuộc vào các cột trong bảng của bạn
- Nên có index trên cột `Modified` để tối ưu hiệu suất:

```sql
CREATE INDEX IX_DoanhThuTCKT_Modified ON [dbo].[DoanhThuTCKT]([Modified] DESC);
```

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
- Đảm bảo bảng `DoanhThuTCKT` tồn tại trong schema `dbo`
- Kiểm tra quyền truy cập của user database

### Performance issues
- Tạo index trên cột `Modified`
- Sử dụng `limit` hợp lý (khuyến nghị: 50-100)
- Kiểm tra connection pool settings trong `config/database.js`

## 📄 License

ISC

## 👤 Author

iamduler