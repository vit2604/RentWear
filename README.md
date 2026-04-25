# RentWear (Frontend + Backend)

## 1) Cài dependencies

```bash
# frontend
npm install

# backend
cd backend
npm install
cd ..
```

## 2) Cấu hình môi trường

### Frontend

Tạo file `.env` ở thư mục gốc `rent-clothes`:

```env
REACT_APP_API_BASE_URL=http://127.0.0.1:5000
```

### Backend

Tạo file `backend/.env` dựa trên `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/rentclothes?retryWrites=true&w=majority
JWT_SECRET=change_this_secret
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.vercel.app

PAYOS_BASE_URL=https://api-merchant.payos.vn
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_RETURN_URL=http://localhost:3000/payment?status=success
PAYOS_CANCEL_URL=http://localhost:3000/payment?status=cancel
```

## 3) Chạy project local

Mở 2 terminal:

```bash
# terminal 1: backend
cd backend
npm start
```

```bash
# terminal 2: frontend
npm start
```

## 4) Kiểm tra nhanh backend

```bash
curl http://127.0.0.1:5000/health
```

Kỳ vọng:

```json
{"ok":true,"service":"rentwear-backend","databaseReady":true}
```

## 5) Build kiểm tra trước khi push

```bash
npm run build
```

## 6) Deploy

- Frontend: Vercel/Netlify
  - Env cần set: `REACT_APP_API_BASE_URL=https://<backend-domain>`
- Backend: Render/Railway
  - Env cần set: `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `PAYOS_*`

## 7) Lưu ý bảo mật

- Không commit file `.env`
- Không commit mật khẩu MongoDB/PayOS
- Đổi key ngay nếu từng lộ trên chat/log
