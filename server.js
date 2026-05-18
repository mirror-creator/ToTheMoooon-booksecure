require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db, tx, audit, id, now } = require('./src/store');
const { clean, validEmail, validGmail, validTWPhone, signSession, auth, role, csrf, makeCsrf, hashOtp, cookieOpts } = require('./src/security');
const { enc, dec, maskPhone, maskName } = require('./src/crypto-fields');
const { sendMail } = require('./src/mailer');
const app = express();
app.set('trust proxy', 1);
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'50kb'}));
app.use(cookieParser());
app.use(express.static('public'));
app.use('/api/auth/otp', rateLimit({windowMs:60*60*1000, max:5, message:{error:'同一小時 OTP 請求過多'}}));
app.use('/api/', rateLimit({windowMs:60*1000, max:120, message:{error:'請求過於頻繁'}}));
function publicEvent(e){ const slots=db().slots.filter(s=>s.eventId===e.id).map(s=>({...s, remain:Math.max(0,s.capacity-s.booked)})); return {...e, slots}; }
function requireBody(fields, body){ for(const f of fields) if(!body[f]) throw new Error(`缺少欄位：${f}`); }
app.get('/api/health',(req,res)=>res.json({ok:true, at:now()}));
app.get('/api/events',(req,res)=>res.json(db().events.filter(e=>e.active).map(publicEvent)));
app.post('/api/auth/otp', async (req,res)=>{
  const email=clean(req.body.email).toLowerCase(); if(!validEmail(email)) return res.status(400).json({error:'Email 格式錯誤'});
  const code = process.env.NODE_ENV==='development' ? '123456' : String(crypto.randomInt(100000,999999));
  const expiresAt = Date.now()+10*60*1000;
  tx(d=>{ d.otp = d.otp.filter(o=>o.email!==email || o.expiresAt>Date.now()); d.otp.push({email, codeHash:hashOtp(email,code), expiresAt, used:false, attempts:0}); });
  await sendMail({reservationId:null,to:email,type:'otp',subject:'BookSecure 登入驗證碼',html:`<p>您的驗證碼是 <b>${code}</b>，10 分鐘內有效。</p>`});
  res.json({ok:true, devCode:process.env.NODE_ENV==='development'?code:undefined});
});
app.post('/api/auth/verify', (req,res)=>{
  const email=clean(req.body.email).toLowerCase(); const code=clean(req.body.code); if(!validEmail(email)||!/^[0-9]{6}$/.test(code)) return res.status(400).json({error:'驗證資料錯誤'});
  const otp=db().otp.find(o=>o.email===email && !o.used && o.expiresAt>Date.now()); if(!otp) return res.status(400).json({error:'驗證碼過期'});
  if(otp.attempts>=5) return res.status(429).json({error:'驗證失敗次數過多'});
  if(otp.codeHash!==hashOtp(email,code)){ tx(d=>{ const o=d.otp.find(x=>x===otp || (x.email===email && !x.used)); if(o) o.attempts++; }); return res.status(400).json({error:'驗證碼錯誤'}); }
  let user; const sid=crypto.randomUUID(), csrf=makeCsrf(); tx(d=>{ otp.used=true; user=d.users.find(u=>u.email===email); if(!user){ user={id:id('USR'), email, createdAt:now()}; d.users.push(user); } d.sessions.push({tokenId:sid,userId:user.id,type:'customer',csrf,createdAt:now()}); });
  res.cookie('session', signSession({sid, sub:user.id, type:'customer', email}), cookieOpts()).json({ok:true, user:{id:user.id,email}, csrf});
});
app.post('/api/auth/merchant-login', (req,res)=>{
  const email=clean(req.body.email).toLowerCase(); const password=String(req.body.password||''); const staff=db().staff.find(s=>s.email===email && s.active); if(!staff || !bcrypt.compareSync(password, staff.passwordHash)) { audit(email,'後台登入失敗',{},req.ip); return res.status(401).json({error:'帳號或密碼錯誤'}); }
  const sid=crypto.randomUUID(), csrf=makeCsrf(); tx(d=>d.sessions.push({tokenId:sid,userId:staff.id,type:'merchant',csrf,createdAt:now()})); audit(staff.email,'後台登入成功',{role:staff.role},req.ip);
  res.cookie('session', signSession({sid, sub:staff.id, type:'merchant', email:staff.email, role:staff.role, merchantId:staff.merchantId}), cookieOpts()).json({ok:true, staff:{email:staff.email,name:staff.name,role:staff.role}, csrf});
});
app.post('/api/auth/logout', auth(), (req,res)=>{ tx(d=>{d.sessions=d.sessions.filter(s=>s.tokenId!==req.user.sid)}); res.clearCookie('session').json({ok:true}); });
app.get('/api/me', auth(), (req,res)=>res.json({user:req.user, csrf:db().sessions.find(s=>s.tokenId===req.user.sid)?.csrf}));
app.use('/api/customer', auth('customer'), csrf);
app.post('/api/customer/reservations', async (req,res)=>{
  try{ requireBody(['slotId','name','phone','email','count'], req.body); const slotId=clean(req.body.slotId); const name=clean(req.body.name); const phone=clean(req.body.phone).replace(/[-\s]/g,''); const email=clean(req.body.email).toLowerCase(); const count=Number(req.body.count); if(!name || name.length>40) throw new Error('姓名格式錯誤'); if(!validTWPhone(phone)) throw new Error('手機需為台灣 09 開頭 10 碼'); if(!validGmail(email)) throw new Error('Email 必須為有效 Gmail'); if(!Number.isInteger(count)||count<1||count>4) throw new Error('預約人數必須為 1 到 4 人');
    const reservation = tx(d=>{ const slot=d.slots.find(s=>s.id===slotId); if(!slot) throw new Error('找不到時段'); const event=d.events.find(e=>e.id===slot.eventId && e.active); if(!event) throw new Error('找不到活動'); if(count>event.maxPerBooking) throw new Error('超過單筆可預約人數'); if(new Date(event.bookingDeadline)<new Date()) throw new Error('已超過預約期限'); if(slot.capacity-slot.booked<count) throw new Error('該時段名額不足'); slot.booked += count; const r={id:id('BK'), userId:req.user.sub, eventId:event.id, slotId:slot.id, nameEnc:enc(name), phoneEnc:enc(phone), emailEnc:enc(email), count, status:'confirmed', emailStatus:'pending', createdAt:now(), cancelledAt:null}; d.reservations.unshift(r); return {reservation:r,event,slot}; });
    const mail=await sendMail({reservationId:reservation.reservation.id,to:email,type:'confirmation',subject:`預約成功：${reservation.event.title}`,html:`<h2>預約成功</h2><p>活動：${reservation.event.title}</p><p>時段：${reservation.slot.startTime}-${reservation.slot.endTime}</p><p>人數：${count}</p><p>預約編號：${reservation.reservation.id}</p>`}); audit(req.user.email,'顧客完成預約',{reservationId:reservation.reservation.id,event:reservation.event.title,count},req.ip); res.json({ok:true,reservationId:reservation.reservation.id,emailStatus:mail.status,emailError:mail.error});
  }catch(e){ res.status(400).json({error:e.message}); }
});
app.get('/api/customer/reservations', (req,res)=>{ const rows=db().reservations.filter(r=>r.userId===req.user.sub).map(r=>{ const e=db().events.find(x=>x.id===r.eventId); const s=db().slots.find(x=>x.id===r.slotId); return {id:r.id,event:e?.title,date:e?.date,location:e?.location,slot:`${s?.startTime}-${s?.endTime}`,count:r.count,status:r.status,emailStatus:r.emailStatus,createdAt:r.createdAt}; }); res.json(rows); });
app.post('/api/customer/reservations/:id/cancel', async (req,res)=>{
  try{ const rid=req.params.id; const out=tx(d=>{ const r=d.reservations.find(x=>x.id===rid && x.userId===req.user.sub); if(!r) throw new Error('找不到預約'); if(r.status==='cancelled') throw new Error('已取消'); const e=d.events.find(x=>x.id===r.eventId); if(new Date(e.cancelDeadline)<new Date()) throw new Error('已超過取消期限'); const s=d.slots.find(x=>x.id===r.slotId); s.booked=Math.max(0,s.booked-r.count); r.status='cancelled'; r.cancelledAt=now(); return {r,e,s,email:dec(r.emailEnc)}; }); await sendMail({reservationId:out.r.id,to:out.email,type:'cancel',subject:`取消成功：${out.e.title}`,html:`<p>您的預約 ${out.r.id} 已取消，名額已釋出。</p>`}); audit(req.user.email,'顧客取消預約',{reservationId:rid},req.ip); res.json({ok:true}); } catch(e){ res.status(400).json({error:e.message}); }
});
app.use('/api/merchant', auth('merchant'), csrf);
app.get('/api/merchant/dashboard', (req,res)=>{ const reservations=db().reservations; res.json({total:reservations.length,today:reservations.filter(r=>r.createdAt.slice(0,10)===now().slice(0,10)).length,emailFailed:reservations.filter(r=>r.emailStatus==='failed').length,cancelled:reservations.filter(r=>r.status==='cancelled').length,events:db().events.map(publicEvent)}); });
app.get('/api/merchant/reservations', (req,res)=>{ const rows=db().reservations.map(r=>{ const e=db().events.find(x=>x.id===r.eventId); const s=db().slots.find(x=>x.id===r.slotId); return {id:r.id,name:maskName(dec(r.nameEnc)),phone:maskPhone(dec(r.phoneEnc)),email:dec(r.emailEnc),event:e?.title,slot:`${s?.startTime}-${s?.endTime}`,count:r.count,status:r.status,emailStatus:r.emailStatus,createdAt:r.createdAt}; }); res.json(rows); });
app.post('/api/merchant/events', role('admin','staff'), (req,res)=>{ try{ requireBody(['title','category','date','location','slots'],req.body); const event=tx(d=>{ const eid=id('EVT'); const e={id:eid,merchantId:req.user.merchantId,title:clean(req.body.title),category:clean(req.body.category),date:clean(req.body.date),location:clean(req.body.location),description:clean(req.body.description),bookingOpenAt:req.body.bookingOpenAt||now(),bookingDeadline:req.body.bookingDeadline,cancelDeadline:req.body.cancelDeadline,maxPerBooking:Number(req.body.maxPerBooking||4),active:true,createdAt:now(),updatedAt:now()}; d.events.unshift(e); for(const sl of req.body.slots){ d.slots.push({id:id('SLT'),eventId:eid,startTime:clean(sl.startTime),endTime:clean(sl.endTime),capacity:Number(sl.capacity),booked:0}); } return e; }); audit(req.user.email,'新增活動',{eventId:event.id,title:event.title},req.ip); res.json({ok:true,event}); }catch(e){ res.status(400).json({error:e.message}); } });
app.post('/api/merchant/reservations/:id/cancel', role('admin','staff'), async (req,res)=>{ try{ const out=tx(d=>{ const r=d.reservations.find(x=>x.id===req.params.id); if(!r) throw new Error('找不到預約'); if(r.status==='cancelled') throw new Error('已取消'); const s=d.slots.find(x=>x.id===r.slotId); s.booked=Math.max(0,s.booked-r.count); r.status='cancelled'; r.cancelledAt=now(); return {r,e:d.events.find(x=>x.id===r.eventId),email:dec(r.emailEnc)}; }); await sendMail({reservationId:out.r.id,to:out.email,type:'merchant_cancel',subject:`店家取消預約：${out.e.title}`,html:`<p>店家已取消您的預約 ${out.r.id}。</p>`}); audit(req.user.email,'店家取消預約',{reservationId:out.r.id},req.ip); res.json({ok:true}); }catch(e){ res.status(400).json({error:e.message}); } });
app.get('/api/merchant/email-failures', role('admin','staff'), (req,res)=>res.json(db().emailLogs.filter(l=>l.status==='failed')));
app.get('/api/merchant/audit', role('admin'), (req,res)=>res.json(db().auditLogs.slice(0,200)));
const PORT=process.env.PORT||3000; app.listen(PORT,()=>console.log(`BookSecure running: http://localhost:${PORT}`));
