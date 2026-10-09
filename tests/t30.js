const {chromium}=require('playwright');const fs=require('fs');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const fake=fs.readFileSync(__dirname+'/fakefb.js','utf8');
const CFG='window.FIREBASE_CONFIG={apiKey:"AIzaTESTE",authDomain:"x.firebaseapp.com",projectId:"checklist-teste",storageBucket:"",messagingSenderId:"1",appId:"1:1:web:1"};';
const BK=JSON.parse(fs.readFileSync(__dirname+'/backup-sample.json','utf8'));
const URL0='http://localhost:8765/';
async function ctxFor(b,configured,opt={}){const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:1366,height:900},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true,...opt});
  await ctx.addInitScript(()=>{try{localStorage.setItem('resid-onb-seen','1')}catch(e){}});await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
  await ctx.route(/www\.gstatic\.com\/firebasejs\//,r=>r.fulfill({contentType:'text/javascript',body:'/* ok */'}));
  await ctx.route(/www\.gstatic\.com\/firebasejs\/.*app-compat/,r=>r.fulfill({contentType:'text/javascript',body:fake}));
  await ctx.route(/config\.js/,r=>r.fulfill({contentType:'text/javascript',body:configured?CFG:'window.FIREBASE_CONFIG={apiKey:"COLE_AQUI"};'}));
  return ctx}
const boot=async p=>{await p.goto(URL0);await p.waitForFunction(()=>typeof saveFac==='function'&&window.__site,null,{polling:100});await p.waitForFunction(()=>synced,null,{polling:100});await p.waitForTimeout(300)};
(async()=>{const b=await chromium.launch();
// ===== 1. sem Firebase configurado =====
let ctx=await ctxFor(b,false);let p=await ctx.newPage();let errs=[];p.on('pageerror',e=>errs.push(e.message));
await boot(p);
ok(await p.evaluate(()=>!document.getElementById("acctBtn")),"sem configuração: sem botão de conta");
ok(await p.evaluate(()=>[...document.querySelectorAll(".sbanner")].some(x=>/Trazer seu progresso/.test(x.textContent))),"site vazio oferece importar backup");
// arquivo inválido
await p.evaluate(()=>__site.importFlow('{"oi":1}'));await p.waitForTimeout(200);
ok(await p.evaluate(()=>/não é um backup/.test(document.querySelector(".smodal").textContent)&&/Nada foi alterado/.test(document.querySelector(".smodal").textContent)),"arquivo errado é recusado sem alterar nada");
await p.click('.smodal-head button');
await p.evaluate(()=>__site.importFlow('{"app":"checklist-residencia","format":1,"data":{"errors":"x"}}'));await p.waitForTimeout(200);
ok(await p.evaluate(()=>/corrompido/.test(document.querySelector(".smodal").textContent)),"backup corrompido é recusado");
await p.click('.smodal-head button');
// importar pelo arquivo
await p.click('#tabQ');await p.click('#cfgBtn');await p.click('#cfBody .cflink:has-text("Instruções")');
const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#bkImportRow button:has-text("Importar backup")')]);
await fc.setFiles({name:'checklist-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(BK))});await p.waitForTimeout(300);
const txt=await p.textContent('.smodal');
ok(/Contém: 2 temas com progresso · 1 anotação · 1 erro/.test(txt)&&/ainda está vazio/.test(txt),"resumo do backup antes de importar");
await Promise.all([p.waitForNavigation(),p.click('.smodal button:has-text("Importar")')]);await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});await p.waitForTimeout(400);
ok(await p.evaluate(()=>state["CM-1"]&&state["CM-1"].qt===10&&notes["CM-1"].includes("pré-eclâmpsia")&&errors.length===1&&fac.own.a.t==="Anatomia"&&BYKEY["F-a"]),"dados importados (temas, anotações, erros, faculdade, tema próprio)");
ok(await p.evaluate(()=>/Backup importado/.test((document.querySelector(".stoast")||{}).textContent||"")),"aviso de importação concluída");
// importar de novo com dados: snapshot + desfazer
await p.evaluate(()=>{state["CM-2"]={l:1,last:today(),step:0};commit()});
const bk2=JSON.parse(JSON.stringify(BK));delete bk2.data.topics["CM-1"].qt;bk2.data.notes={};
await p.evaluate(t=>__site.importFlow(t),JSON.stringify(bk2));await p.waitForTimeout(300);
ok(/vai substituir o que o site tem agora: 3 temas/.test(await p.textContent('.smodal')),"avisa que vai substituir e mostra o que existe");
await Promise.all([p.waitForNavigation(),p.click('.smodal button:has-text("Importar")')]);await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});await p.waitForTimeout(400);
ok(await p.evaluate(()=>!state["CM-2"]&&!notes["CM-1"]),"segunda importação substituiu");
await p.evaluate(()=>setView("instr"));await p.waitForTimeout(3200);
ok(await p.evaluate(()=>!document.getElementById("bkUndo").hidden),"botão Desfazer a última importação aparece");
await p.click('#bkUndo');await p.waitForTimeout(200);
await Promise.all([p.waitForNavigation(),p.click('.smodal button:has-text("Voltar ao que era antes")')]);await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});await p.waitForTimeout(400);
ok(await p.evaluate(()=>state["CM-2"]&&notes["CM-1"]&&state["CM-1"].qt===10),"desfazer volta exatamente ao estado anterior");
// exportar no site
await p.evaluate(()=>setView("instr"));
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#bkSave')]);
const saved=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));ok(dl.suggestedFilename().startsWith("checklist-backup-")&&saved.data.errors.length===1,"exportar backup no site baixa o arquivo");
ok(!errs.length,"sem erros JS (sem configuração) "+errs.join("|"));await ctx.close();

// ===== 2. com Firebase (conta) =====
ctx=await ctxFor(b,true);p=await ctx.newPage();errs=[];p.on('pageerror',e=>errs.push(e.message));
await boot(p);
ok(await p.evaluate(()=>/^Entrar/.test(document.getElementById("acctBtn").textContent)),"botão Entrar no cabeçalho");
ok(await p.evaluate(()=>[...document.querySelectorAll(".sbanner")].some(x=>/Entre para salvar/.test(x.textContent))),"aviso para entrar");
await p.click('#profBtn');await p.click('#acctBtn');await p.click('.smodal button:has-text("Primeira vez? Criar conta")');
await p.fill('.smodal input[type=email]','eli@teste.com');await p.fill('.smodal input[type=password]','123');await p.click('.smodal button[type=submit]');await p.waitForTimeout(200);
ok(/pelo menos 6/.test(await p.textContent('.smodal form .err')),"senha curta: mensagem em português");
await p.fill('.smodal input[type=password]','segredo123');
await Promise.all([p.waitForNavigation(),p.click('.smodal button[type=submit]')]);await boot(p);
ok(await p.evaluate(()=>/Gerenciar conta/.test(document.getElementById("acctBtn").textContent)&&!!store),"conta criada e conectado (salvando na conta)");
await p.evaluate(t=>__site.importFlow(t),JSON.stringify(BK));await p.waitForTimeout(300);
await Promise.all([p.waitForNavigation(),p.click('.smodal button:has-text("Importar")')]);await boot(p);
const db=await p.evaluate(()=>JSON.parse(localStorage.getItem("__fbdb")));const ks=Object.keys(db);
ok(ks.some(k=>/progress$/.test(k))&&ks.some(k=>/faculdade$/.test(k))&&ks.some(k=>/notes\/CM-1$/.test(k))&&ks.some(k=>/errors\/e1$/.test(k))&&ks.some(k=>/settings$/.test(k)),"importação gravou tudo na conta: "+ks.length+" documentos");
ok(db[ks.find(k=>/progress\/topics\/CM-1$/.test(k))].qt===10,"progresso na conta confere");
// outro aparelho: entrar com o mesmo e-mail
const st=await p.evaluate(()=>({db:localStorage.getItem("__fbdb"),us:localStorage.getItem("__fbusers")}));
const ctx2=await ctxFor(b,true,{viewport:{width:820,height:1180},isMobile:true,hasTouch:true});
await ctx2.addInitScript(s=>{if(!sessionStorage.__seeded){localStorage.setItem("__fbdb",s.db);localStorage.setItem("__fbusers",s.us);sessionStorage.__seeded=1}},st);
const p2=await ctx2.newPage();p2.on('pageerror',e=>errs.push("ipad:"+e.message));await boot(p2);
await p2.tap('#profBtn');await p2.tap('#acctBtn');await p2.fill('.smodal input[type=email]','eli@teste.com');await p2.fill('.smodal input[type=password]','errada1');await p2.tap('.smodal button[type=submit]');await p2.waitForTimeout(200);
ok(/incorretos/.test(await p2.textContent('.smodal form .err')),"senha errada: mensagem clara");
await p2.fill('.smodal input[type=password]','segredo123');await Promise.all([p2.waitForNavigation(),p2.tap('.smodal button[type=submit]')]);await boot(p2);
ok(await p2.evaluate(()=>state["CM-1"]&&state["CM-1"].qt===10&&notes["CM-1"]&&errors.length===1&&fac.discs.length===1),"outro aparelho: entrou e recebeu todo o progresso");
// esqueci a senha
// sair limpa o aparelho
await p2.tap('#profBtn');await p2.tap('#acctBtn');await p2.tap('.smodal button:has-text("Sair deste aparelho")');await Promise.all([p2.waitForNavigation(),p2.tap('.smodal button:has-text("Toque de novo")')]);await boot(p2);
ok(await p2.evaluate(()=>!Object.keys(localStorage).some(k=>k.startsWith("resid-")&&!/ban-/.test(k))||Object.keys(state).length===0),"ao sair, os dados saem deste aparelho");
ok(await p2.evaluate(()=>Object.keys(state).length===0&&!notes["CM-1"]),"aparelho fica vazio depois de sair");
await ctx2.close();
// ===== 3. IA por copiar e colar =====
await p.evaluate(()=>{detTab["CM-4"]="questoes";openTopic("CM-4")});await p.waitForTimeout(300);
const genBtn=p.locator('#t-CM-4 button.btn.primary:has-text("Gerar questões")').first();await genBtn.click();await p.waitForTimeout(300);
ok(await p.evaluate(()=>!!document.querySelector(".smodal")&&/Gerar questões com o Claude/.test(document.querySelector(".smodal h2").textContent)),"gerar questões abre o passo a passo de copiar e colar");
await p.click('.smodal button:has-text("Copiar pedido")');const clip=await p.evaluate(()=>navigator.clipboard.readText());
ok(clip.includes(await p.evaluate(()=>BYKEY["CM-4"].t))&&/Minhas instruções personalizadas/.test(clip)&&/somente com o JSON/.test(clip),"pedido copiado tem o tema e a instrução do formato");if(!/Insuf/.test(clip))console.log("CLIP:",clip.slice(0,400));
await p.fill('.smodal textarea','O Claude respondeu sem JSON');await p.click('.smodal button:has-text("Usar estas questões")');
ok(/Não reconheci/.test(await p.textContent('.smodal .err')),"resposta sem questões: avisa e deixa tentar de novo");
const qs=Array.from({length:10},(_,i)=>({enunciado:"Caso "+(i+1)+": paciente com dispneia...",alternativas:["A","B","C","D"].map(l=>({letra:l,texto:"Opção "+l})),correta:"B",comentario:"Porque B.",conceito:"Conceito "+i,alerta:""}));
await p.fill('.smodal textarea','Claro! Aqui estão:\n```json\n'+JSON.stringify(qs)+'\n```\nBons estudos!');await p.click('.smodal button:has-text("Usar estas questões")');await p.waitForTimeout(400);
ok(await p.evaluate(()=>gen["CM-4"]&&gen["CM-4"].qs.length===10&&gen["CM-4"].status==="done"),"10 questões com um único copiar e colar (mesmo com texto e ``` em volta)");
// cancelar
await p.evaluate(()=>{delete gen["CM-4"];render()});await genBtn.click();await p.waitForTimeout(200);await p.click('.smodal-head button');await p.waitForTimeout(200);
ok(await p.evaluate(()=>!gen["CM-4"]&&!document.querySelector(".smodal")),"fechar a janela cancela sem erro");
// resumo das anotações
await p.evaluate(()=>{noteMode["CM-4"]="ler";render()});
await p.evaluate(()=>{detTab["CM-4"]="notas";render()});await p.waitForTimeout(150);await p.click('#t-CM-4 button:has-text("Gerar resumo com o Claude")');await p.waitForTimeout(200);
await p.fill('.smodal textarea','## Resumo IC\n- **4 pilares**');await p.click('.smodal button:has-text("Usar esta resposta")');await p.waitForTimeout(300);
ok(await p.evaluate(()=>noteAI["CM-4"]&&noteAI["CM-4"].status==="done"&&/4 pilares/.test(noteAI["CM-4"].text)),"resumo colado aparece para inserir nas anotações");
ok(!errs.length,"sem erros JS (com conta) "+errs.join("|"));
await p.screenshot({path:'site-desk.png'});
await b.close()})();
