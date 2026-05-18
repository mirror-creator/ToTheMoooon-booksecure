const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const defaultDb = () => ({
  users: [], merchants: [{ id: 'MER-STORE', name: 'BookSecure 示範店家', phone: '02-1234-5678' }],
  staff: [], events: [], slots: [], reservations: [], emailLogs: [], auditLogs: [], otp: [], sessions: []
});
let db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : defaultDb();
function save(){ fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function tx(fn){ const copy = JSON.parse(JSON.stringify(db)); try { const out = fn(db); save(); return out; } catch(e) { db = copy; throw e; } }
function audit(actor, action, meta={}, ip='unknown') { db.auditLogs.unshift({ id:id('AUD'), actor, action, meta, ip, at: now() }); save(); }
function seed(){
  if (!db.staff.find(s => s.email === process.env.MERCHANT_ADMIN_EMAIL)) {
    db.staff.push({ id:id('STF'), merchantId:'MER-STORE', name:'系統管理員', email:process.env.MERCHANT_ADMIN_EMAIL || 'admin@store.com', passwordHash:bcrypt.hashSync(process.env.MERCHANT_ADMIN_PASSWORD || 'AdminPass123!', 12), role:'admin', twoFactorEnabled:true, active:true, createdAt:now() });
  }
  if (db.events.length === 0) {
    const evs = [
      ['EVT-DESSERT','手作甜點體驗課','手作課程','2026-06-20','南港工坊 3F','活動前一天 20:00 截止預約，活動前兩天 12:00 截止取消。'],
      ['EVT-COOK','義大利料理私廚課','料理體驗','2026-06-25','大安廚藝教室','學習義大利麵、燉飯與甜點搭配。'],
      ['EVT-SAKE','日本清酒品鑑會','品鑑活動','2026-07-05','信義會館 B1','未滿 18 歲不可報名。'],
      ['EVT-COFFEE','手沖咖啡工作坊','手作課程','2026-07-12','中山咖啡實驗室','從研磨、水溫到萃取的實作課。']
    ];
    for (const [eid,title,cat,date,loc,desc] of evs) db.events.push({ id:eid, merchantId:'MER-STORE', title, category:cat, date, location:loc, description:desc, bookingOpenAt:'2026-01-01T00:00:00.000Z', bookingDeadline:`${date}T12:00:00.000Z`, cancelDeadline:`${date}T04:00:00.000Z`, maxPerBooking:4, active:true, createdAt:now(), updatedAt:now() });
    db.slots.push(
      {id:'SLT-D1', eventId:'EVT-DESSERT', startTime:'13:00', endTime:'15:00', capacity:40, booked:0},
      {id:'SLT-D2', eventId:'EVT-DESSERT', startTime:'16:00', endTime:'18:00', capacity:40, booked:0},
      {id:'SLT-C1', eventId:'EVT-COOK', startTime:'14:00', endTime:'17:00', capacity:40, booked:0},
      {id:'SLT-C2', eventId:'EVT-COOK', startTime:'18:00', endTime:'21:00', capacity:40, booked:0},
      {id:'SLT-S1', eventId:'EVT-SAKE', startTime:'19:00', endTime:'22:00', capacity:60, booked:0},
      {id:'SLT-FULL', eventId:'EVT-COFFEE', startTime:'13:00', endTime:'15:00', capacity:20, booked:20}
    );
  }
  save();
}
seed();
module.exports = { db:()=>db, tx, audit, id, now, save };
