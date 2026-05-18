# BookSecure Real
## 高資安活動預約系統

BookSecure Real 是一套以「高安全性預約流程」為核心設計的可執行全端活動預約系統。

本專案最初源自 `booking-system.html` 的前端視覺展示版，後續延伸為具備完整前後端邏輯、身份驗證、權限控管、Email 通知、資安防護與預約狀態管理的實際可執行系統。

系統設計參考 inline、OpenTable 等現代 SaaS 預約平台架構，並導入 OWASP 安全概念與企業級權限管理流程。

---

# 專案特色

本系統不只是一般表單預約網站，而是一套具備：

- 顧客前台預約流程
- 店家後台管理系統
- OTP 驗證登入
- 預約狀態管理
- 名額交易鎖定
- 稽核紀錄（Audit Log）
- RBAC 權限控管
- AES-256-GCM 個資加密
- API 防濫用保護

的完整高資安預約系統。

---

# 系統架構

```text
Frontend（HTML / CSS / JS）
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
加密資料存儲 / Database
        │
        ▼
Mailer Service（SMTP / JSON Transport）
```

---

# 核心功能

# 一、顧客前台功能

顧客前台提供完整的線上活動預約流程。

## 1. Email OTP 無密碼登入

系統採用 Email OTP 驗證登入：

- 不需記憶密碼
- OTP 驗證碼有效期限控制
- OTP 嘗試次數限制
- 防暴力破解機制
- 安全 Session Cookie

---

## 2. 活動預約功能

顧客可：

- 查看活動列表
- 查看活動資訊
- 選擇活動時段
- 即時查看剩餘名額
- 預約活動
- 查看個人預約紀錄
- 取消預約

---

## 3. 自動化通知

完成預約後：

- 系統自動寄送確認信
- 顧客收到預約資訊
- 顧客可從個人頁面取消預約

取消後：

- 系統寄送取消通知
- 名額自動釋出
- 店家後台同步更新

---

## 4. 預約完整性保護

系統內建：

- 重複預約防止
- 名額交易鎖定
- 超額預約防護
- 預約期限檢查
- 取消期限檢查

避免多人同時搶名額造成超額預約問題。

---

# 二、店家後台功能

店家後台提供完整管理能力。

---

## 1. 儀表板 Dashboard

後台可查看：

- 本月預約數
- 今日新增預約
- Email 失敗紀錄
- 活動名額狀況
- 快額滿提醒
- 取消率分析

---

## 2. 活動管理

店家可：

- 建立活動
- 修改活動
- 設定活動時段
- 設定名額上限
- 設定預約期限
- 設定取消期限

---

## 3. 預約名單管理

後台可：

- 查看所有預約者
- 查看預約狀態
- 查看 Email 狀態
- 店家取消預約
- 匯出資料（RBAC 限制）

---

## 4. Email 失敗處理

若 Email 發送失敗：

- 系統自動記錄
- 後台顯示警告
- 提醒店家人工聯絡顧客

模擬：

```text
fail@example.com
```

即可觸發失敗流程。

---

## 5. 員工帳號與權限管理

系統內建 RBAC（Role-Based Access Control）。

角色包含：

| 角色 | 權限 |
|---|---|
| Admin | 完整管理 |
| Staff | 活動與預約管理 |
| Viewer | 僅檢視 |

可避免：

- 任意匯出個資
- 未授權刪除資料
- 員工越權操作

---

## 6. 稽核紀錄（Audit Log）

系統記錄：

- 登入紀錄
- 修改活動
- 取消預約
- 匯出資料
- 失敗登入
- 安全事件

方便後續：

- 稽核
- 問題追蹤
- 資安分析

---

# 資安設計

本專案核心重點之一即為資安架構。

系統參考 OWASP Web Security 建議實作多層防護。

---

# 一、身份驗證安全

## Email OTP 驗證

- OTP 過期控制
- OTP 嘗試限制
- 防暴力破解
- 安全 Token

---

## Session 安全

- HttpOnly Cookie
- SameSite Cookie
- Secure Session 驗證
- CSRF Token 驗證

避免：

- Session Hijacking
- CSRF 攻擊
- Cookie 竊取

---

# 二、Web 攻擊防護

## Helmet HTTP Security Headers

系統使用 Helmet：

- CSP
- HSTS
- XSS Protection
- Frameguard
- MIME Sniffing Protection

---

## Rate Limit

防止：

- API 濫用
- OTP 狂刷
- 暴力登入
- 惡意攻擊

---

## CSRF Protection

所有：

- POST
- PUT
- DELETE

請求皆需 CSRF 驗證。

---

## XSS 防護

系統對輸入進行：

- 危險字元過濾
- Script 清理
- HTML 消毒

---

# 三、個資加密保護

## AES-256-GCM 加密

以下資料加密存放：

- 姓名
- 手機
- Email

---

## 加密特色

- Random IV
- Authentication Tag
- 高安全性對稱加密

即使資料庫外洩，也無法直接還原個資。

---

# 四、預約交易安全

## 名額交易鎖定

系統實作：

- Reservation Lock
- Atomic Transaction
- Rollback 機制

避免：

- 超額預約
- Race Condition
- Double Booking

---

# 技術棧（Tech Stack）

| 類型 | 技術 |
|---|---|
| Frontend | HTML / CSS / Vanilla JS |
| Backend | Node.js + Express.js |
| Authentication | Email OTP |
| Security | Helmet / CSRF / Rate Limit |
| Encryption | AES-256-GCM |
| Email | Nodemailer |
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

## 1. Clone 專案

```bash
git clone https://github.com/mirror-creator/ToTheMoooon-booksecure.git
cd booksecure-real
```

---

## 2. 安裝套件

```bash
npm install
```

---

## 3. 設定環境變數

複製：

```bash
cp .env.example .env
```

產生加密金鑰：

```bash
node src/generate-key.js
```

將輸出的 Key 貼入：

```env
DATA_ENCRYPTION_KEY=
```

---

## 4. 啟動系統

```bash
npm start
```

啟動後：

```text
http://localhost:3000
```

---

# 開發模式帳號

# 顧客 OTP

任意有效 Email：

```text
OTP：123456
```

---

# 店家後台

```text
Email：
admin@store.com

Password：
AdminPass123!
```

---

# Email 行為

若未設定 SMTP：

系統會自動使用：

```text
Nodemailer JSON Transport
```

並將信件輸出至：

```text
data/email-outbox.json
```

---

# 模擬 Email 發送失敗

若 Email 包含：

```text
fail
```

系統會故意模擬寄送失敗。

方便測試：

- 後台警示
- 人工聯絡流程
- 失敗紀錄

---

# 開發版與正式版差異

# 開發版

目前使用：

- Local JSON Storage
- Mock OTP
- Debug Log
- JSON Mail Transport

---

# 正式版建議

正式部署前建議：

- PostgreSQL / MySQL
- Redis Session
- HTTPS Reverse Proxy
- Docker 化
- CI/CD
- 雲端部署
- WAF
- SIEM

---

# 正式上線前安全建議

建議進行：

- OWASP ZAP 掃描
- 滲透測試
- 備份演練
- Secret Rotation
- Log Retention
- TLS 1.3
- Disaster Recovery

---

# 未來擴充方向

規劃功能：

- Google OAuth
- QRCode 報到
- 候補機制
- SMS 通知
- Docker Deployment
- Kubernetes
- Multi-Store 架構
- Webhook Integration
- 即時 Dashboard

---

# 專案用途

本專案適合：

- 資安導向專題
- 全端作品集
- SaaS Prototype
- 預約系統研究
- OWASP 安全實作展示

---

# 免責聲明

本專案已具備完整安全流程設計，但正式商業部署前，仍建議經過：

- 專業滲透測試
- Infrastructure Hardening
- 雲端安全設定
- 第三方安全審查

後再正式上線。

---

# License

本專案主要作為：

- 教學
- 研究
- 專題
- 技術展示

用途。

# BookSecure Real
## Enterprise-Grade Secure Event Reservation System

BookSecure Real is a production-oriented secure reservation platform developed from the original `booking-system.html` prototype UI into a fully executable full-stack web application.

The project focuses on both **real reservation workflow implementation** and **high-security architecture design**, simulating the operational flow of modern reservation SaaS platforms such as inline, OpenTable, and enterprise event booking systems.

This system includes a complete customer-facing reservation flow, merchant administration backend, OTP authentication, email notification handling, reservation state management, audit logging, RBAC permission control, encrypted personal data storage, and anti-abuse protection mechanisms.

---

# System Architecture

```text
Frontend (HTML/CSS/JS)
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
Encrypted Local Storage / Database
        │
        ▼
Mailer Service (SMTP / JSON Transport)
```

---

# Core Features

## Customer Frontend

The customer-facing reservation interface provides a streamlined and secure reservation experience.

### Authentication
- Passwordless Email OTP Login
- OTP expiration control
- OTP retry limitation
- Brute-force protection
- Secure session cookies

### Reservation Features
- Browse available activities
- View event information and slot capacity
- Reserve event time slots
- Personal reservation dashboard
- Reservation cancellation
- Real-time capacity release after cancellation
- Reservation confirmation email
- Cancellation notification email

### Reservation Protection
- Duplicate booking prevention
- Capacity transaction rollback
- Reservation deadline validation
- Cancellation deadline validation

---

## Merchant Backend

The merchant administration backend allows staff to manage events, reservations, and system security operations.

### Dashboard
- Reservation statistics
- Upcoming events overview
- Reservation status summary
- Email failure alerts
- Capacity warning indicators

### Event Management
- Create activities
- Configure reservation slots
- Set reservation limits
- Modify booking windows
- Manage cancellation policies

### Reservation Administration
- View reservation lists
- Manual reservation cancellation
- Email delivery status monitoring
- Failed email handling workflow
- Customer contact fallback support

### Employee Access Control
- Role-Based Access Control (RBAC)
- Admin / Staff / Viewer roles
- Permission separation
- Backend authorization middleware

### Audit Logging
- Login history
- Reservation modifications
- Export activity tracking
- Security event logging
- Failed login monitoring

---

# Security Design

Security is one of the primary focuses of this project.

The system implements multiple defense layers inspired by modern web security practices and OWASP recommendations.

---

## Authentication Security

### Email OTP Authentication
- Passwordless login
- OTP expiration timer
- Retry limitation
- Secure temporary token generation

### Session Protection
- HttpOnly Cookies
- SameSite Cookie policy
- Secure session validation
- CSRF token verification

---

## Application Security

### HTTP Security Headers
Implemented using Helmet middleware:
- CSP
- XSS Protection
- HSTS
- MIME sniffing protection
- Frameguard

### Rate Limiting
- API abuse prevention
- Login brute-force protection
- OTP request throttling

### Input Sanitization
- XSS payload filtering
- Request validation
- Dangerous input stripping

### CSRF Protection
All state-changing requests require CSRF token validation.

---

## Data Protection

### AES-256-GCM Encryption
Sensitive personal fields are encrypted:
- Customer names
- Phone numbers
- Email addresses

### Encryption Features
- Random IV generation
- Authentication tag validation
- Secure key management support

---

## Reservation Integrity

### Transaction Safety
The reservation flow includes:
- Capacity locking
- Atomic reservation processing
- Rollback on failure
- Duplicate prevention

This prevents:
- Overbooking
- Race-condition booking conflicts
- Double reservation exploits

---

# Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML / CSS / Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Security | Helmet / CSRF / Rate Limit |
| Authentication | Email OTP |
| Email Service | Nodemailer |
| Encryption | AES-256-GCM |
| Session | Secure Cookie Session |
| Storage | Local JSON Storage (Development) |

---

# Project Structure

```text
booksecure-real/
│
├── public/                 # Frontend static files
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── src/
│   ├── security.js         # Security middleware
│   ├── crypto-fields.js    # AES encryption
│   ├── mailer.js           # Email handling
│   ├── store.js            # Data persistence
│   └── generate-key.js     # Encryption key generator
│
├── data/
│   ├── reservations.json
│   ├── email-outbox.json
│   └── audit-log.json
│
├── server.js               # Main backend server
├── package.json
├── .env.example
└── README.md
```

---

# Getting Started

## 1. Clone Repository

```bash
git clone https://github.com/mirror-creator/ToTheMoooon-booksecure.git
cd booksecure-real
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Copy environment template:

```bash
cp .env.example .env
```

Generate encryption key:

```bash
node src/generate-key.js
```

Paste generated key into:

```env
DATA_ENCRYPTION_KEY=
```

---

## 4. Start Development Server

```bash
npm start
```

Server will run on:

```text
http://localhost:3000
```

---

# Development Test Accounts

## Customer OTP Login

Use any valid email address.

Development OTP:

```text
123456
```

---

## Merchant Backend

```text
Email:
admin@store.com

Password:
AdminPass123!
```

---

# Email Behavior

If SMTP credentials are not configured, the system automatically switches to:

```text
Nodemailer JSON Transport
```

Generated emails will be written into:

```text
data/email-outbox.json
```

---

## Simulated Email Failure

If the recipient email contains:

```text
fail
```

the system intentionally simulates email delivery failure.

This allows testing:
- Merchant fallback notification
- Manual customer contact workflow
- Failed delivery monitoring

---

# Development vs Production

## Development Environment
- Local JSON storage
- Mock OTP
- JSON email transport
- Debug logging enabled

## Recommended Production Upgrades
- PostgreSQL / MySQL
- Redis session storage
- Real SMTP provider
- HTTPS reverse proxy
- Docker deployment
- Cloud infrastructure
- CI/CD pipeline
- WAF integration

---

# Recommended Production Security Checklist

Before deployment, the following are strongly recommended:

- HTTPS / TLS 1.3
- Reverse Proxy (Nginx / Traefik)
- PostgreSQL migration
- Redis session store
- Secret rotation
- OWASP ZAP scanning
- Penetration testing
- Backup & disaster recovery
- SIEM monitoring
- Log retention policy
- Rate-limit tuning

---

# Future Roadmap

## Planned Features
- Google OAuth Login
- QRCode Check-in
- Waitlist System
- Calendar Sync
- SMS Notification
- Dockerization
- Kubernetes Deployment
- Multi-store Architecture
- Webhook Integration
- Real-time Dashboard

---

# Disclaimer

This project demonstrates a realistic secure reservation system architecture suitable for:
- Security-oriented academic projects
- Full-stack portfolio demonstrations
- SaaS prototype development
- Reservation system architecture studies

Although major security workflows are implemented, this repository should still undergo professional security review and infrastructure hardening before public production deployment.

---

# License

This project is intended for educational, research, and portfolio purposes.
