# BookSecure Real
## 高資安活動預約系統

BookSecure Real 是一套以「高安全性預約流程」為核心設計的可執行全端活動預約系統。本專案最初源自 `booking-system.html` 的前端視覺展示版，後續逐步延伸為具備完整前後端架構、身份驗證、權限管理、Email 通知、預約流程控制與資安防護能力的實際可執行系統。

整體系統設計參考 inline、OpenTable 等現代 SaaS 預約平台的運作方式，並結合 OWASP Web Security 的安全概念，目標是在模擬真實商業預約平台流程的同時，也能呈現完整的高資安系統設計能力。

---

# 系統簡介

BookSecure Real 分為「顧客前台」與「店家後台」兩大部分。顧客可以透過 Email OTP 驗證登入系統，查看活動資訊、選擇時段、完成預約，並於個人頁面中查看或取消預約。店家則可以在後台管理活動、查看預約名單、監控 Email 狀態、處理取消預約與檢視稽核紀錄。

本系統除了基本預約功能外，也特別強調預約完整性與資料安全性。例如系統內建名額交易鎖定機制，避免多人同時預約造成超額問題；同時也導入 RBAC（Role-Based Access Control）權限控管、AES-256-GCM 個資欄位加密、CSRF Token 驗證、Rate Limit 防濫用與完整 Audit Log 紀錄。

---

# 系統架構

```text
Frontend（HTML / CSS / JavaScript）
        │
        ▼
Express.js Backend API
        │
 ┌──────┼──────┐
 ▼      ▼      ▼
Auth  Booking  Security Layer
 │       │          │
 ▼       ▼          ▼
OTP    Reservation  RBAC / CSRF / Rate Limit
 │       │          │
 └──────┼───────────┘
        ▼
Encrypted Storage / Database
        │
        ▼
Mailer Service（SMTP / JSON Transport）
```

系統目前採用 Node.js + Express.js 作為後端核心，前端則以 HTML、CSS 與 Vanilla JavaScript 開發。雖然目前開發版本使用 Local JSON Storage 作為資料儲存方式，但整體架構已保留資料庫抽換能力，可直接延伸至 PostgreSQL 或 MySQL。

---

# 核心功能

## 顧客前台

顧客前台提供完整的活動預約流程。使用者可以透過 Email OTP 無密碼登入機制進入系統，OTP 驗證碼具備有效期限與嘗試次數限制，可降低暴力破解風險。登入後，顧客能查看所有活動資訊、即時名額狀況與活動時段，並完成線上預約。

完成預約後，系統會自動寄送確認 Email，顧客也能在「我的預約」頁面查看所有預約紀錄。如果需要取消活動，可直接在線上取消，系統將同步釋出名額並通知店家後台。

---

## 店家後台

店家後台提供活動管理、預約管理與資安管理功能。管理者可建立活動、設定時段與名額上限，並調整預約與取消期限。後台也會即時顯示活動狀態，例如快額滿提醒、Email 寄送失敗紀錄與取消率分析。

系統同時支援員工角色管理。不同角色具備不同權限，例如 Viewer 僅能查看資料，而 Staff 與 Admin 則可進行活動管理與預約處理。此設計可有效避免未授權操作與個資濫用。

此外，系統內建完整稽核紀錄功能，所有登入、修改、取消、匯出與安全事件皆會記錄於 Audit Log 中，方便後續稽核與問題追蹤。

---

# 資安設計

安全性是本專案最重要的核心之一。系統參考 OWASP 建議實作多層防護，並盡可能模擬企業級 Web 系統安全流程。

在身份驗證部分，系統採用 Email OTP 驗證登入，並搭配 OTP 過期控制、嘗試次數限制與 Rate Limit 防止暴力破解。Session 使用 HttpOnly Cookie 與 SameSite Cookie 保護，可降低 Session Hijacking 與 CSRF 攻擊風險。

在 Web 攻擊防護方面，系統使用 Helmet 建立 HTTP Security Headers，並加入 XSS 過濾、CSRF Token 驗證與輸入清理機制。所有 POST、PUT 與 DELETE 請求皆需通過 CSRF 驗證。

個資保護方面，姓名、手機與 Email 等敏感資料會以 AES-256-GCM 進行加密儲存。即使資料遭到外洩，也無法直接還原內容。

此外，預約流程採用 Reservation Lock 與 Atomic Transaction 設計，可避免多人同時搶名額造成超額預約問題，並於錯誤發生時自動 Rollback。

---

# 技術棧

| 類型 | 技術 |
|---|---|
| Frontend | HTML / CSS / Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Authentication | Email OTP |
| Security | Helmet / CSRF / Rate Limit |
| Encryption | AES-256-GCM |
| Email Service | Nodemailer |
| Session | Secure Cookie |
| Storage | Local JSON Storage（開發版） |

---

# 專案結構

```text
booksecure-real/
│
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── src/
│   ├── security.js
│   ├── crypto-fields.js
│   ├── mailer.js
│   ├── store.js
│   └── generate-key.js
│
├── data/
│   ├── reservations.json
│   ├── email-outbox.json
│   └── audit-log.json
│
├── server.js
├── package.json
├── .env.example
└── README.md
```

---

# 執行方式

首先 Clone 專案：

```bash
git clone https://github.com/mirror-creator/ToTheMoooon-booksecure.git
cd booksecure-real
```

安裝套件：

```bash
npm install
```

接著建立 `.env`：

```bash
cp .env.example .env
```

產生加密金鑰：

```bash
node src/generate-key.js
```

並將輸出的 Key 貼入：

```env
DATA_ENCRYPTION_KEY=
```

最後啟動系統：

```bash
npm start
```

系統將運行於：

```text
http://localhost:3000
```

---

# 開發模式帳號

顧客端可使用任意有效 Email 登入，開發模式 OTP 固定為：

```text
123456
```

店家後台測試帳號：

```text
Email：admin@store.com
Password：AdminPass123!
```

---

# Email 行為

若未設定 SMTP，系統將自動使用 Nodemailer JSON Transport，並將所有 Email 輸出至：

```text
data/email-outbox.json
```

若 Email 地址包含 `fail` 字樣，系統會故意模擬寄送失敗，以便測試店家後台的人工聯絡流程與錯誤通知機制。

---

# 未來規劃

未來版本預計導入 Google OAuth、QRCode 報到、候補機制、Docker 化部署、Redis Session、PostgreSQL、Webhook Integration 與 Kubernetes 架構，進一步提升系統可擴充性與商業部署能力。

---

# 免責聲明

本專案主要作為全端系統、資安流程與 SaaS 預約平台架構展示用途。雖然已具備完整安全流程設計，但正式商業部署前，仍建議進行專業滲透測試、基礎設施加固與第三方安全審查。

---

# License

本專案主要用於教學、研究、專題與技術展示用途。
