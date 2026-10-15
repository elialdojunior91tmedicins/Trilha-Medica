// t80: vários aparelhos ao mesmo tempo — o que outro aparelho grava aparece aqui sem recarregar (onSnapshot + conferência ao voltar)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const fake=fs.readFileSync(__dirname+'/fakefb.js','utf8');
const CFG='window.FIREBASE_CONFIG={apiKey:"AIzaTESTE",authDomain:"x.firebaseapp.com",projectId:"checklist-teste",storageBucket:"",messagingSenderId:"1",appId:"1:1:web:1"};';
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false]};
const U="data/users/u1/";
(async()=>{const b=await chromium.launch();const errs=[];
/* ---------- artefato (banco do Claude) ---------- */
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());
 const seed={[U+"progress"]:{version:3,split:true,hist:{},plan:null},[U+"progress/topics/CM-1"]:{l:1,last:"2026-10-01",step:0}};
 await ctx.addInitScript(mock+`;window.__mock(${JSON.stringify(seed)},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&window.__subs&&window.__subs.length>=12,null,{polling:100,timeout:15000});await p.waitForTimeout(1500);
 const remote=async(path,d,ms=250)=>{await p.evaluate(([a,x])=>window.__remote(a,x),[U+path,d]);await p.waitForTimeout(ms)};
 const T=await p.evaluate(()=>today());
 ok(await p.evaluate(()=>window.__subs.length)<=20,name+": ouve poucos documentos e coleções ("+await p.evaluate(()=>window.__subs.length)+")");
 /* 1. tema mudou em outro aparelho */
 await remote("progress/topics/CM-1",{l:3,last:T,step:1});
 ok(await p.evaluate(()=>state["CM-1"].l===3&&state["CM-1"].step===1),name+": tema alterado em outro aparelho aparece sem recarregar");
 ok(await p.evaluate(()=>/Atualizado com seus outros aparelhos/.test(document.querySelector('#save').textContent)),name+": avisa que atualizou");
 await p.evaluate(()=>{setView("temas")});await p.waitForTimeout(100);
 await remote("progress/topics/CM-2",{l:2,last:T,step:0});
 ok(await p.evaluate(()=>state["CM-2"]&&state["CM-2"].l===2&&JSON.parse(localStorage.getItem(LS2))["CM-2"].l===2),name+": tema novo de outro aparelho entra (e fica salvo no aparelho)");
 await remote("progress/topics/CM-2",null);
 ok(await p.evaluate(()=>!state["CM-2"]),name+": tema zerado em outro aparelho sai daqui também");
 /* 2. mudança local ainda não enviada não é atropelada */
 await p.evaluate(()=>{state["CM-3"]={l:2,last:today(),step:0};persist()});
 await remote("progress/topics/CM-3",{l:1,last:"2026-01-01",step:0},100);
 ok(await p.evaluate(()=>state["CM-3"].l===2),name+": não passa por cima de mudança deste aparelho ainda não enviada");
 await p.waitForTimeout(1100);
 ok(await p.evaluate(u=>window.__store[u+"progress/topics/CM-3"].l===2,U),name+": e a mudança local é enviada depois");
 /* 3. caderno de erros: novo, alterado no lugar, apagado */
 await remote("progress/errors/e1",{id:"e1",k:"CM-1",w:"Errei a dose",r:"Dose certa",t:"c",s:"",d:T});
 ok(await p.evaluate(()=>{window.__e=errors.find(x=>x.id==="e1");return !!window.__e}),name+": erro registrado em outro aparelho aparece");
 await remote("progress/errors/e1",{id:"e1",k:"CM-1",w:"Errei a dose (editado)",r:"Dose certa",t:"c",s:"",d:T});
 ok(await p.evaluate(()=>window.__e.w==="Errei a dose (editado)"&&errors.find(x=>x.id==="e1")===window.__e),name+": erro editado em outro aparelho é atualizado no mesmo objeto");
 await remote("progress/errors/e1",null);
 ok(await p.evaluate(()=>!errors.some(x=>x.id==="e1")),name+": erro apagado em outro aparelho sai daqui");
 /* 4. faculdade */
 await remote("faculdade",{sems:[{id:"s1",name:"6º semestre",archived:false}],discs:[],provas:[],own:{},updatedAt:new Date().toISOString()});
 ok(await p.evaluate(()=>fac.sems.length===1&&fac.sems[0].name==="6º semestre"),name+": Faculdade alterada em outro aparelho chega");
 /* 5. anotações e campo em edição */
 await remote("progress/notes/CM-1",{t:"Anotação feita no iPad",updatedAt:new Date().toISOString()});
 ok(await p.evaluate(()=>notes["CM-1"]==="Anotação feita no iPad"),name+": anotação de outro aparelho chega");
 await p.evaluate(()=>{noteTimers["CM-1"]=1});
 await remote("progress/notes/CM-1",{t:"Outra versão",updatedAt:new Date().toISOString()});
 ok(await p.evaluate(()=>notes["CM-1"]==="Anotação feita no iPad"),name+": anotação ainda sendo salva aqui não é trocada");
 await p.evaluate(()=>{noteTimers["CM-1"]=0;setView("temas")});await p.waitForTimeout(100);
 await p.evaluate(()=>{const i=document.createElement("input");i.id="tq80";i.type="text";document.querySelector("main,#app,body").prepend(i);i.focus()});
 await remote("progress/topics/CM-4",{l:2,last:T,step:0});
 ok(await p.evaluate(()=>state["CM-4"].l===2&&liveDirty&&document.activeElement.id==="tq80"),name+": com um campo em edição, guarda o dado mas não redesenha a tela");
 await p.evaluate(()=>{document.activeElement.blur();document.getElementById("tq80").remove()});await p.waitForTimeout(700);
 ok(await p.evaluate(()=>!liveDirty),name+": redesenha quando você sai do campo");
 /* 5b. aparelho em uso: guarda o dado e só redesenha depois de alguns segundos parado */
 await p.mouse.move(5,5);await p.mouse.down();await p.mouse.up();
 await remote("progress/topics/CM-5",{l:2,last:T,step:0},300);
 ok(await p.evaluate(()=>state["CM-5"].l===2&&liveDirty),name+": em uso, o dado chega mas a tela espera");
 await p.waitForTimeout(5600);
 ok(await p.evaluate(()=>!liveDirty&&/Atualizado/.test(document.querySelector('#save').textContent)),name+": parado por uns segundos, a tela se atualiza sozinha");
 /* 6. preferências e histórico */
 const ui0=await p.evaluate(()=>JSON.parse(JSON.stringify(ui)));ui0.prefs.theme="dark";
 await remote("prefs",ui0);
 ok(await p.evaluate(()=>document.documentElement.getAttribute("data-theme")==="dark"),name+": preferência mudada em outro aparelho é aplicada");
 await p.evaluate(()=>{hist[today()]={q:5,c:4};persist()});await p.waitForTimeout(900);
 await remote("progress",{version:3,split:true,hist:{[T]:{q:30,c:20,e:1}},plan:null});
 ok(await p.evaluate(()=>hist[today()].q===30&&hist[today()].c===20&&hist[today()].e===1),name+": questões do dia de outro aparelho somam no placar (maior valor)");
 /* 7. sem eco: depois de tudo, o app para de gravar */
 await p.waitForTimeout(1200);const s1=await p.evaluate(()=>JSON.stringify(window.__store));await p.waitForTimeout(2000);
 ok(s1===await p.evaluate(()=>JSON.stringify(window.__store)),name+": não fica regravando sozinho (sem eco entre aparelhos)");
 /* 8. conexão caiu: ao voltar para o app, confere tudo */
 await p.evaluate(u=>{window.__store[u+"progress/topics/CM-6"]={l:3,last:today(),step:2};liveRefAt=0;liveHidAt=Date.now()-400000;document.dispatchEvent(new Event("visibilitychange"))},U);await p.waitForTimeout(400);
 ok(await p.evaluate(()=>state["CM-6"]&&state["CM-6"].l===3),name+": ao voltar para o app depois de um tempo, busca o que não chegou ao vivo");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
/* ---------- site: dois aparelhos com a mesma conta (Firebase falso, mesma base) ---------- */
for(const [name,w,h,mob] of [["fone",390,844,true],["note",1366,768,false]]){
 const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:w,height:h},isMobile:mob,hasTouch:mob});
 await ctx.addInitScript(()=>{try{localStorage.setItem('resid-onb-seen','1');if(!localStorage.getItem('__fbusers')){localStorage.setItem('__fbusers',JSON.stringify({"a@b.com":{uid:"uid_1",p:"123456",prov:[{providerId:"password"}]}}));localStorage.setItem('__fbcur',JSON.stringify({uid:"uid_1",email:"a@b.com"}))}}catch(e){}});
 await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await ctx.route(/www\.gstatic\.com\/firebasejs\//,r=>r.fulfill({contentType:'text/javascript',body:'/* ok */'}));
 await ctx.route(/www\.gstatic\.com\/firebasejs\/.*app-compat/,r=>r.fulfill({contentType:'text/javascript',body:fake}));await ctx.route(/config\.js/,r=>r.fulfill({contentType:'text/javascript',body:CFG}));
 const A=await ctx.newPage(),B=await ctx.newPage();for(const [x,l] of [[A,"A"],[B,"B"]])x.on('pageerror',e=>errs.push("site-"+name+l+":"+e.message));
 for(const x of [A,B]){await x.goto('http://localhost:8765/');await x.waitForFunction(()=>window.__site&&typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000})}
 await A.waitForTimeout(400);
 await B.evaluate(()=>{state["CM-5"]={l:2,last:today(),step:0};commit();const e={id:"eB1",k:"CM-5",w:"Confundi critérios",r:"Critérios certos",t:"c",s:"",d:today()};errors.push(e);putErr(e);
   fac.sems.push({id:"sB",name:"7º semestre",archived:false});saveFac();saveNote("CM-5","Resumo feito no notebook")});
 await A.waitForTimeout(2500);
 ok(await A.evaluate(()=>state["CM-5"]&&state["CM-5"].l===2),"site "+name+": o tema marcado no outro aparelho aparece no aparelho parado");
 ok(await A.evaluate(()=>errors.some(e=>e.id==="eB1")&&fac.sems.some(s=>s.id==="sB")&&notes["CM-5"]==="Resumo feito no notebook"),"site "+name+": erro, Faculdade e anotação também chegam");
 ok(await A.evaluate(()=>/Atualizado com seus outros aparelhos/.test(document.querySelector('#save').textContent)),"site "+name+": o aparelho parado avisa que atualizou");
 await A.evaluate(()=>{state["CM-7"]={l:1,last:today(),step:0};commit()});await B.waitForTimeout(2000);
 ok(await B.evaluate(()=>state["CM-7"]&&state["CM-7"].l===1&&state["CM-5"].l===2),"site "+name+": e o contrário também (sem perder o que já estava)");
 const d1=await A.evaluate(()=>localStorage.getItem("__fbdb"));await A.waitForTimeout(2500);
 ok(d1===await A.evaluate(()=>localStorage.getItem("__fbdb")),"site "+name+": os dois aparelhos param de gravar (sem eco)");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
