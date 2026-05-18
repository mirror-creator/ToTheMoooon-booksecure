# BookSecure Real 可執行高資安活動預約系統

此專案是從 `booking-system.html` 的視覺展示版延伸成可執行的前後端系統。

## 功能
- 顧客前台：Email OTP 登入、活動列表、預約、個人頁面、取消預約、確認信與取消信。
- 店家後台：登入、活動新增、總覽、預約名單、店家取消預約、Email 失敗紀錄、稽核紀錄。
- 資安：Helmet、Rate Limit、HttpOnly Cookie、SameSite Cookie、CSRF Token、OTP 過期與嘗試次數限制、RBAC、AES-256-GCM 個資欄位加密、輸入清理、名額交易回滾。

## 執行方式
```bash
cd booksecure-real
cp .env.example .env
node src/generate-key.js
# 將輸出的 key 貼到 .env 的 DATA_ENCRYPTION_KEY
npm install
npm start
```

瀏覽：`http://localhost:3000`

## 開發模式帳號
- 顧客 OTP：任一有效 Email，開發模式驗證碼為 `123456`
- 後台：`admin@store.com`
- 後台密碼：`AdminPass123!`

## Email 行為
若沒有設定 SMTP，系統會使用 Nodemailer JSON Transport，並把信件輸出到：
`data/email-outbox.json`

若 Email 包含 `fail` 字樣，系統會模擬寄送失敗，讓後台看到需要人工聯絡的紀錄。

## 注意
此版本已具備可落地的後端安全流程，但正式上線前仍需：
1. 改用正式資料庫如 PostgreSQL。
2. 使用正式 SMTP，例如 SendGrid、Amazon SES 或 Mailgun。
3. 放在 HTTPS / Reverse Proxy 後方。
4. 進行 OWASP ZAP、滲透測試與備份演練。
