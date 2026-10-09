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
const c1=await ctxFor(b);const p=await c1.newPage();p.on('pageerror',e=>errs.push("pc:"+e.message));await boot(p);await login(p,false,true);
// registro com banca e tempo, foco, questão errada, metas
await p.click('#tabQ');await p.click('#qRegB');await p.fill('#qrq','sepse');await p.waitForTimeout(500);await p.click('.qrpick');await p.waitForTimeout(100);
await p.fill('#qrt','12');await p.fill('#qrc','9');await p.fill('#qrm','30');await p.fill('#qrb','ENARE');await p.click('#qrSave');await p.waitForTimeout(200);
await p.evaluate(()=>{rdAdd("CM-37",{enunciado:"Caso X",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"c",conceito:"k",alerta:""});
  foSess.unshift({id:"foT1",d:today(),s:new Date().toISOString(),sec:1500,m:"p",ref:"T:CM-37",lab:"x"});foPut(foSess[0]);ui.prefs.qgoal=200;ui.prefs.fgoal=120;ui.prefs.qpace=150;saveUI();render()});
await p.waitForTimeout(1500);
ok(!(await p.evaluate(()=>window.__fbInvalid||0)),"nada recusado pelo Firestore");
const db=await p.evaluate(()=>JSON.parse(localStorage.getItem("__fbdb")));const ks=Object.keys(db);
ok(ks.some(k=>/progress\/redo\//.test(k))&&ks.some(k=>/progress\/focus\//.test(k)),"refazer e foco gravados na conta");
const pk=ks.find(k=>/progress\/topics\/CM-16$/.test(k));ok(db[pk]&&db[pk].qb&&db[pk].qb.ENARE,"banca gravada na conta");
const pg=ks.find(k=>/progress$/.test(k));ok(db[pg].hist&&Object.values(db[pg].hist).some(h=>h.tq===12),"ritmo gravado no histórico da conta");
// celular, mesma conta
const st={db:JSON.stringify(db),us:await p.evaluate(()=>localStorage.getItem("__fbusers"))};
const c2=await ctxFor(b,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await c2.addInitScript(s=>{if(!sessionStorage.__seeded){localStorage.setItem("__fbdb",s.db);localStorage.setItem("__fbusers",s.us);sessionStorage.__seeded=1}},st);
const q=await c2.newPage();q.on('pageerror',e=>errs.push("fone:"+e.message));await boot(q);await login(q,true,false);await q.waitForTimeout(800);
const r=await q.evaluate(()=>({redo:redo.length,fo:foSess.length,qb:!!(get("CM-16").qb||{}).ENARE,qg:ui.prefs.qgoal,fg:ui.prefs.fgoal,qp:ui.prefs.qpace,tq:(hist[today()]||{}).tq}));
ok(r.redo===1&&r.fo===1&&r.qb&&r.qg===200&&r.fg===120&&r.qp===150&&r.tq===12,"celular recebeu tudo: "+JSON.stringify(r));
await q.tap('#tabQ');await q.waitForTimeout(200);await q.evaluate(()=>setQSeg("praticar"));await q.waitForTimeout(150);ok(await q.isVisible('#rdGo'),"celular: refazer disponível");
// simulado pelo copiar e colar do site
await q.evaluate(()=>{simCfg={src:"filter",n:5};render()});await q.tap('#simGo');await q.waitForTimeout(500);
const modal=await q.evaluate(()=>{const m=document.querySelector('.smodal');return m?m.textContent.slice(0,200):""});ok(/simulado|Copiar|copiar/i.test(modal),"site: simulado abre o copiar e colar");
const prompt=await q.evaluate(()=>{const t=[...document.querySelectorAll('.smodal textarea,.smodal pre')].map(x=>x.value||x.textContent).join("\n");return t});
ok(/Monte um simulado com 5/.test(prompt),"pedido do simulado no copiar e colar");
const ans=JSON.stringify(Array.from({length:5},(_,i)=>({enunciado:"S"+i,alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:"",conceito:"",alerta:""})));
await q.fill('.smodal textarea',ans);await q.tap('.smodal button:has-text("Usar estas questões")');
await q.waitForTimeout(600);ok(await q.evaluate(()=>sim&&sim.status==="run"&&sim.qs.length===5),"site: simulado recebe as questões coladas");
// backup com as novidades -> importar em conta nova (computador)
const bk=await p.evaluate(()=>JSON.stringify(buildBackup()));const B=JSON.parse(bk);
ok(B.data.focus.length===1&&B.data.redo.length===1&&B.data.topics["CM-16"].qb.ENARE,"backup leva foco, refazer e bancas");
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
