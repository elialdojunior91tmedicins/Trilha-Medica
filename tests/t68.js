const {chromium}=require('playwright');const fs=require('fs');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const fake=fs.readFileSync(__dirname+'/fakefb.js','utf8');
const CFG='window.FIREBASE_CONFIG={apiKey:"AIzaTESTE",authDomain:"x.firebaseapp.com",projectId:"checklist-teste",storageBucket:"",messagingSenderId:"1",appId:"1:1:web:1"};';
const URL0='http://localhost:8765/';
async function ctxFor(b,opt={}){const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:1366,height:900},...opt});
  await ctx.addInitScript(()=>{try{localStorage.setItem('resid-onb-seen','1')}catch(e){}});await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
  await ctx.route(/www\.gstatic\.com\/firebasejs\//,r=>r.fulfill({contentType:'text/javascript',body:'/* ok */'}));
  await ctx.route(/www\.gstatic\.com\/firebasejs\/.*app-compat/,r=>r.fulfill({contentType:'text/javascript',body:fake}));
  await ctx.route(/config\.js/,r=>r.fulfill({contentType:'text/javascript',body:CFG}));return ctx}
const boot=async p=>{await p.goto(URL0);await p.waitForFunction(()=>typeof saveFac==='function'&&window.__site,null,{polling:100});await p.waitForFunction(()=>synced,null,{polling:100});await p.waitForTimeout(300)};
const login=async(p,tap,create)=>{const c=s=>tap?p.tap(s):p.click(s);await c('#profBtn');await c('#acctBtn');if(create)await c('.smodal button:has-text("Primeira vez? Criar conta")');
  await p.fill('.smodal input[type=email]','eli@teste.com');await p.fill('.smodal input[type=password]','segredo123');await Promise.all([p.waitForNavigation(),c('.smodal button[type=submit]')]);await boot(p)};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [tag,opt,tap] of (process.argv[2]==="d"?[["computador",{},false]]:[["celular",{viewport:{width:390,height:844},isMobile:true,hasTouch:true},true],["computador",{},false]])){
const c1=await ctxFor(b,opt);const p=await c1.newPage();p.on('pageerror',e=>errs.push(tag+":"+e.message));await boot(p);await login(p,tap,true);
const c=s=>tap?p.tap(s):p.click(s);
await c('#tabE');await p.waitForTimeout(150);await c('#eRegB');await p.fill('#erq','sepse');await p.waitForTimeout(500);await c('#eReg .qrpick');await p.waitForTimeout(100);
await p.fill('#erg-w','dei antibiótico depois de 3h');await p.fill('#erg-r','antibiótico na 1ª hora');await p.selectOption('#erg-t','confusao');await p.selectOption('#erg-c','Lembrei pela metade');await p.fill('#erg-s','ENARE');await c('#eReg button[type=submit]');await p.waitForTimeout(200);
await c('#eReg .dhead .link');
// erro antigo vencido + revisão + arquivar + cartão + anotação
await p.evaluate(()=>{const e=eNew("CM-1","marquei 130/80","140/90","conhecimento","",undefined);e.due=today();e.box=2;putErr(e);render()});await p.waitForTimeout(200);
await c('#erGo');await p.waitForTimeout(100);await c('#erShow');await p.waitForTimeout(80);
const first=await p.evaluate(()=>erRun.ids[0]);if(await p.$('#erArch'))await c('#erArch');else await c('#erGood');await p.waitForTimeout(150);
await p.evaluate(()=>{erRun=null;const e=errors.find(x=>x.k!=="CM-1")||errors[0];eCardBtn(e).click();eToNote(errors.find(x=>x.k==="CM-1"))});await p.waitForTimeout(1500);
ok(!(await p.evaluate(()=>window.__fbInvalid||0)),tag+": nada recusado pelo Firestore");
const db=await p.evaluate(()=>JSON.parse(localStorage.getItem("__fbdb")));const ed=Object.entries(db).filter(([k])=>/progress\/errors\//.test(k)).map(([,v])=>v);
ok(ed.length===2,tag+": 2 erros na conta");ok(ed.some(e=>e.c==="Lembrei pela metade"&&e.s==="ENARE"&&e.box===0&&e.due),tag+": causa e revisão gravadas");
ok(ed.some(e=>e.k==="CM-1"&&(e.arch||e.box===3)&&e.nt),tag+": revisão/arquivo e anotação gravados "+JSON.stringify(ed.find(e=>e.k==="CM-1")));
ok(ed.some(e=>e.cd)&&Object.keys(db).some(k=>/progress\/cards\//.test(k)),tag+": cartão gravado");
// outro aparelho: apaga o local e recarrega da conta
await p.evaluate(()=>{localStorage.removeItem("resid-erros-v1")});await p.reload();await boot(p);await p.waitForTimeout(800);
const back=await p.evaluate(()=>errors.map(e=>({k:e.k,c:e.c,arch:e.arch,box:e.box,due:e.due})));ok(back.length===2&&back.some(e=>e.c==="Lembrei pela metade")&&back.some(e=>e.k==="CM-1"&&(e.arch||e.box===3)),tag+": volta igual da conta "+JSON.stringify(back));
// backup ida e volta
const bk=await p.evaluate(()=>JSON.stringify(buildBackup()));ok(/Lembrei pela metade/.test(bk),tag+": backup leva a causa");
await c1.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
