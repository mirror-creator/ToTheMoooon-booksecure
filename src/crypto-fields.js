const crypto = require('crypto');
function key(){ const raw = process.env.DATA_ENCRYPTION_KEY; if(raw){ const b=Buffer.from(raw,'base64'); if(b.length===32) return b; } return crypto.createHash('sha256').update(process.env.JWT_SECRET || 'dev-secret').digest(); }
function enc(text){ const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv('aes-256-gcm', key(), iv); const ct=Buffer.concat([cipher.update(String(text),'utf8'), cipher.final()]); const tag=cipher.getAuthTag(); return Buffer.concat([iv,tag,ct]).toString('base64'); }
function dec(payload){ try{ const b=Buffer.from(payload,'base64'); const iv=b.subarray(0,12), tag=b.subarray(12,28), ct=b.subarray(28); const decipher=crypto.createDecipheriv('aes-256-gcm', key(), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8'); }catch(e){ return ''; } }
function maskPhone(p){ return String(p).replace(/(\d{4})\d{3}(\d{3})/,'$1***$2'); }
function maskName(n){ return n ? n[0]+'○'+(n.length>2?n.at(-1):'') : ''; }
module.exports={enc,dec,maskPhone,maskName};
