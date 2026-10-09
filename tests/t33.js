const {chromium}=require('playwright');const fs=require('fs');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const fake=fs.readFileSync(__dirname+'/fakefb.js','utf8');
const CFG='window.FIREBASE_CONFIG={apiKey:"AIzaTESTE",authDomain:"x.firebaseapp.com",projectId:"p",storageBucket:"",messagingSenderId:"1",appId:"1"};';
async function mk(b,opt={},init=""){const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:820,height:1180},...opt});
 await ctx.addInitScript(()=>{try{localStorage.setItem('resid-onb-seen','1')}catch(e){}});await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await ctx.route(/firebasejs\//,r=>r.fulfill({contentType:'text/javascript',body:''}));await ctx.route(/firebasejs\/.*app-compat/,r=>r.fulfill({contentType:'text/javascript',body:fake}));await ctx.route(/config\.js/,r=>r.fulfill({contentType:'text/javascript',body:CFG}));
 if(init)await ctx.addInitScript(init);return ctx}
const boot=async p=>{await p.goto('http://localhost:8765/');await p.waitForFunction(()=>typeof saveFac==='function'&&window.__site&&synced,null,{polling:100});await p.waitForTimeout(300)};
(async()=>{const b=await chromium.launch();
// Safari (não instalado): botão do Google
let ctx=await mk(b,{},`window.__googleEmail="eli@gmail.com"`);let p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await boot(p);
await p.click('#profBtn');await p.click('#acctBtn');ok(await p.isVisible('.smodal button:has-text("Entrar com Google")'),"Safari: botão Entrar com Google aparece");
await Promise.all([p.waitForNavigation(),p.click('.smodal button:has-text("Entrar com Google")')]);await boot(p);
ok(await p.evaluate(()=>/Gerenciar conta/.test(document.getElementById("acctBtn").textContent)&&!!store),"entrou com Google e salva na conta");
await p.evaluate(()=>{const it=BYKEY["CM-1"];toggleSub(it,subList(it)[0])});await p.waitForTimeout(1200);
await p.click('#profBtn');await p.click('#acctBtn');ok(await p.isVisible('.smodal button:has-text("Criar senha")'),"conta Google oferece Criar senha para o app instalado");
await p.fill('.smodal input[type=password]','123');await p.click('.smodal button:has-text("Criar senha")');ok(/6 caracteres/.test(await p.textContent('.smodal .err')),"senha curta recusada");
await p.fill('.smodal input[type=password]','minhasenha');await p.click('.smodal button:has-text("Criar senha")');await p.waitForTimeout(200);
ok(/Senha criada/.test(await p.textContent('.smodal')),"senha criada na mesma conta");
const st=await p.evaluate(()=>({db:localStorage.getItem("__fbdb"),us:localStorage.getItem("__fbusers")}));
// popup bloqueado
await ctx.close();ctx=await mk(b,{},`window.__popupFail="auth/popup-blocked"`);p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await boot(p);
await p.click('#profBtn');await p.click('#acctBtn');await p.click('.smodal button:has-text("Entrar com Google")');await p.waitForTimeout(200);
ok(/bloqueou a janela/.test(await p.textContent('.smodal')),"janela bloqueada: mensagem clara");
await ctx.close();
// App instalado (tela inicial): sem botão do Google; entra com e-mail + senha criada
ctx=await mk(b,{isMobile:true,hasTouch:true},`Object.defineProperty(navigator,'standalone',{get:()=>true});if(!sessionStorage.__s){localStorage.setItem("__fbdb",${JSON.stringify(st.db)});localStorage.setItem("__fbusers",${JSON.stringify(st.us)});sessionStorage.__s=1}`);
p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await boot(p);
await p.tap('#profBtn');await p.tap('#acctBtn');ok(!(await p.isVisible('.smodal button:has-text("Entrar com Google")'))&&/Criou a conta com o Google/.test(await p.textContent('.smodal')),"app instalado: sem Google e com a explicação");
await p.fill('.smodal input[type=email]','eli@gmail.com');await p.fill('.smodal input[type=password]','minhasenha');
await Promise.all([p.waitForNavigation(),p.tap('.smodal button[type=submit]')]);await boot(p);
ok(await p.evaluate(()=>(get("CM-1").sd||[]).length===1),"app instalado: entrou com e-mail e senha e recebeu o progresso da conta Google");
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
