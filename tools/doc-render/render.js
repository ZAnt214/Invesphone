const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [,,html,out,w,h,s]=process.argv;const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:+s});await p.goto('file://'+html);await p.waitForTimeout(700);await p.screenshot({path:out});await b.close()})();
