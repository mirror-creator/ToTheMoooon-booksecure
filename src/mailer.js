const fs = require('fs'); const path = require('path'); const nodemailer = require('nodemailer'); const { db, tx, id, now } = require('./store');
const OUTBOX = path.join(__dirname,'..','data','email-outbox.json');
function transport(){ if(process.env.SMTP_HOST){ return nodemailer.createTransport({host:process.env.SMTP_HOST, port:Number(process.env.SMTP_PORT||587), secure:String(process.env.SMTP_SECURE)==='true', auth: process.env.SMTP_USER ? {user:process.env.SMTP_USER, pass:process.env.SMTP_PASS}:undefined}); } return nodemailer.createTransport({jsonTransport:true}); }
async function sendMail({reservationId,to,subject,html,type}){
  let status='sent', error='';
  try{ if(!to || to.includes('fail')) throw new Error('mailbox rejected or simulated bounce'); const info = await transport().sendMail({from:process.env.MAIL_FROM || 'BookSecure <no-reply@booksecure.local>', to, subject, html}); if(!process.env.SMTP_HOST){ const arr=fs.existsSync(OUTBOX)?JSON.parse(fs.readFileSync(OUTBOX,'utf8')):[]; arr.unshift({at:now(), to, subject, html, info}); fs.writeFileSync(OUTBOX, JSON.stringify(arr,null,2)); }}
  catch(e){ status='failed'; error=e.message; }
  tx(d=>{ d.emailLogs.unshift({id:id('EML'), reservationId, to, subject, type, status, error, at:now()}); const r=d.reservations.find(r=>r.id===reservationId); if(r) r.emailStatus=status; });
  return {status,error};
}
module.exports={sendMail};
