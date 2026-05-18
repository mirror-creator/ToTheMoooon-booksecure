const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');
const { db } = require('./store');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-please-32chars';
function clean(v){ return sanitizeHtml(String(v ?? '').trim(), { allowedTags: [], allowedAttributes: {} }); }
function validEmail(email){ return validator.isEmail(String(email||'')); }
function validGmail(email){ return validEmail(email) && /@gmail\.com$/i.test(email); }
function validTWPhone(phone){ return /^09\d{8}$/.test(String(phone||'').replace(/[-\s]/g,'')); }
function signSession(payload){ return jwt.sign(payload, JWT_SECRET, { expiresIn:'8h', issuer:'booksecure' }); }
function auth(requiredType){ return (req,res,next)=>{
  try { const token = req.cookies.session || (req.headers.authorization||'').replace('Bearer ',''); if(!token) return res.status(401).json({error:'未登入'}); const payload = jwt.verify(token, JWT_SECRET, {issuer:'booksecure'}); if(requiredType && payload.type!==requiredType) return res.status(403).json({error:'權限不足'}); req.user=payload; next(); } catch(e){ return res.status(401).json({error:'登入已過期'}); }
};}
function role(...roles){ return (req,res,next)=>{ if(!req.user || !roles.includes(req.user.role)) return res.status(403).json({error:'權限不足'}); next(); }; }
function csrf(req,res,next){ if(['GET','HEAD','OPTIONS'].includes(req.method)) return next(); const sent=req.get('x-csrf-token'); const session=db().sessions.find(s=>s.tokenId===req.user?.sid); if(!session || !sent || sent!==session.csrf) return res.status(403).json({error:'CSRF token 不正確'}); next(); }
function makeCsrf(){ return crypto.randomBytes(24).toString('hex'); }
function hashOtp(email, code){ return crypto.createHmac('sha256', process.env.OTP_PEPPER || 'dev-pepper').update(`${email}:${code}`).digest('hex'); }
function cookieOpts(){ return { httpOnly:true, sameSite:'strict', secure:process.env.NODE_ENV==='production', maxAge:8*60*60*1000 }; }
module.exports={clean,validEmail,validGmail,validTWPhone,signSession,auth,role,csrf,makeCsrf,hashOtp,cookieOpts};
