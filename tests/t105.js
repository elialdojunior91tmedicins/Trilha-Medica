// t105: Lote 5 — cartões com FSRS (4 botões), limite de novos por dia, previsão de 7 dias, visual Osler, cartões a partir do erro
// (rascunho do app e do Claude), exportação .apkg dos cartões com ≥40 dias (SQLite + zip conferidos pelo Python) e "Já importei no Anki"
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {execFileSync}=require('child_process');
const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],ipad820:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],full:[1920,1080,false]};
const PY=`import sqlite3,zipfile,json,sys,io,tempfile,os
z=zipfile.ZipFile(sys.argv[1]);names=z.namelist();assert "collection.anki2" in names and "media" in names,names
t=tempfile.mktemp();open(t,"wb").write(z.read("collection.anki2"))
c=sqlite3.connect(t);ic=c.execute("pragma integrity_check").fetchone()[0]
col=c.execute("select crt,ver,models,decks from col").fetchone();m=json.loads(col[2]);d=json.loads(col[3])
notes=c.execute("select guid,mid,tags,flds,sfld,csum from notes").fetchall();cards=c.execute("select nid,did,type,queue,due,ivl,factor from cards").fetchall()
print(json.dumps({"ic":ic,"ver":col[1],"model":[x["name"] for x in m.values()],"flds":[f["name"] for x in m.values() for f in x["flds"]],"decks":sorted(x["name"] for x in d.values()),"notes":len(notes),"cards":len(cards),"f0":notes[0][3].split("\\x1f") if notes else [],"tags":notes[0][2] if notes else "","c0":cards[0] if cards else [],"media":z.read("media").decode()}))`;
(async()=>{const b=await chromium.launch();const errs=[];const pyf=path.join(__dirname,"_t105.py");fs.writeFileSync(pyf,PY);
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined,acceptDownloads:true});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(200)};
 /* 1. FSRS: intervalos crescentes por botão; cartão antigo migra */
 const F=await p.evaluate(()=>{const x=cdClean({id:"a",k:"CM-1",q:"Q",a:"A",box:3,due:fromNum(dnum(today())+2),n:4,ok:4});const nw=cdClean({id:"b",k:"CM-1",q:"Q",a:"A"});
   return {mig:[x.f.st,x.f.s],pv:fsPreview(nw),pr:fsPreview(x),lab:fsPreview(nw).map(fsLab)}});
 ok(F.mig[0]===2&&F.mig[1]===8&&F.pv[0]===0&&F.pv[1]<=F.pv[2]&&F.pv[2]<F.pv[3]&&F.pr[1]<=F.pr[2]&&F.pr[2]<F.pr[3]&&F.lab[0]==="<10 min",name+": FSRS dá intervalos crescentes; cartão antigo vira revisão "+JSON.stringify(F));
 /* 2. limite de novos por dia e fila */
 await p.evaluate(()=>{cards.length=0;for(let i=0;i<20;i++)cdAdd("CM-1","Pergunta "+i,"Resposta "+i,"eu");const r=cdAdd("CM-4","Revisão","R","eu");r.f={st:2,s:5,d:5,last:fromNum(dnum(today())-5),reps:2,lapses:0,first:""};r.due=today();cdPut(r);
   const ready=cdAdd("CM-34","<b>Anemia ferropriva.</b> Exame inicial?","<b>Ferritina.</b><br><br><i>Baixa confirma.</i>","eu",{h:1,ref:"<i>Anemias</i>, em <b>UpToDate</b>.",kind:"disc"});ready.f={st:2,s:60,d:4,last:fromNum(dnum(today())-20),reps:5,lapses:0,first:""};ready.due=fromNum(dnum(today())+45);cdPut(ready);
   ui.prefs.cdNew=14;commit();backStack=[];nSeg="revisar";setView("notas")});await p.waitForTimeout(250);
 const Q=await p.evaluate(()=>({due:cdDue().length,nw:cdDue().filter(x=>!x.f.st).length,go:document.querySelector('#cdGo').textContent,kpi:[...document.querySelectorAll('.cdsum .kpi b')].map(x=>x.textContent),fc:document.querySelectorAll('.cdfcc').length,ready:cdReady().length}));
 ok(Q.due===15&&Q.nw===14&&/Revisar 15 cartões/.test(Q.go)&&Q.kpi.join()==="1,14,1"&&Q.fc===7&&Q.ready===1,name+": fila = revisões + 14 novos; previsão de 7 dias; 1 pronto para o Anki "+JSON.stringify(Q));
 if(name==="fone"||name==="note"){await p.evaluate(()=>document.querySelector('.ncards').scrollIntoView({block:"start"}));await p.waitForTimeout(120);await p.screenshot({path:`t105-painel-${name}.png`})}
 /* 3. revisão com 4 botões */
 await click('#cdGo');await click('#cdShow');
 const B=await p.evaluate(()=>[...document.querySelectorAll('.osbtns .osb')].map(x=>x.querySelector('b').textContent+"|"+x.querySelector('.osi').textContent));
 ok(B.length===4&&/^Errei\|/.test(B[0])&&/^Fácil\|/.test(B[3]),name+": 4 botões com o intervalo em cima "+JSON.stringify(B));
 const first=await p.evaluate(()=>cdRun.ids[0]);await click('#cdR3');
 ok(await p.evaluate(id=>{const x=cards.find(c=>c.id===id);return x.f.st===2&&dnum(x.due)>dnum(today())&&x.f.last===today()},first),name+": Bom agenda para outro dia");
 await click('#cdShow');const sec=await p.evaluate(()=>cdRun.ids[cdRun.i]);await click('#cdR1');
 ok(await p.evaluate(id=>cdRun.ids.slice(cdRun.i).includes(id)&&cards.find(c=>c.id===id).due===today(),sec),name+": Errei volta nesta mesma sessão");
 ok(await p.evaluate(()=>cdNewToday()>=1&&cdDue().filter(x=>!x.f.st).length<=13),name+": os novos vistos hoje contam no limite");
 await p.keyboard.press('Space');await p.waitForTimeout(120);await p.keyboard.press('4');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>cdRun.done===3),name+": teclado: espaço mostra e 4 = Fácil");
 if(name==="fone"||name==="note"){await click('#cdShow');await p.evaluate(()=>document.querySelector('.ncards').scrollIntoView({block:"start"}));await p.waitForTimeout(120);await p.screenshot({path:`t105-rev-${name}.png`})}
 await p.evaluate(()=>{cdRun=null;render()});
 /* 4. cartões do erro: rascunho do app (2) e do Claude (4, dois marcados) */
 const eid=await p.evaluate(()=>{const e=eNew("CM-34","Marquei Linfoma folicular; a certa era LLA de linhagem T","Massa mediastinal + blastos em adolescente = LLA-T.\nPor que não a minha: linfoma folicular é indolente.","confusao","ENARE 2024","",
   "massa mediastinal anterior em adolescente");eGoTopic("CM-34");backStack=[];setView("erros");eMenu=e.id;render();return e.id});await p.waitForTimeout(200);
 await click('#ecd-'+eid);
 const D=await p.evaluate(id=>{const w=document.querySelector(`.cderr[data-eid="${id}"]`);return w&&{n:w.querySelectorAll('.cdit').length,k:[...w.querySelectorAll('.cdk')].map(x=>x.textContent),q:[...w.querySelectorAll('.osq')].map(x=>x.textContent),btn:w.querySelector('.btn.primary').textContent}},eid);
 ok(D&&D.n===2&&D.k.join()==="Discriminador,Por que não a sua"&&/^Anemias\. massa mediastinal/.test(D.q[0])&&/Por que não Linfoma folicular neste caso\?/.test(D.q[1])&&D.btn==="Guardar 2 cartões",name+": o app monta 2 cartões do erro "+JSON.stringify(D));
 await p.evaluate(()=>{window.__cp=null;sampleFn.json=async(pr)=>{window.__cp=pr;return [{tipo:"discriminador",question:"<b>LLA-T.</b> Massa mediastinal anterior + hiperleucocitose em adolescente?",answer:"<b>LLA de linhagem T.</b><br><br><i>O timo é a origem.</i>",reference:"<i>Acute lymphoblastic leukemia</i>, em <b>UpToDate</b>."},
   {tipo:"por-que-nao",question:"<b>Linfoma folicular.</b> Por que não neste caso?",answer:"<b>É indolente e de adulto.</b>",reference:""},{tipo:"lacuna",question:"<b>LLA-T.</b> Massa [...] anterior.",answer:"Massa <b>mediastinal</b> anterior.",reference:""},{tipo:"contraste",question:"<b>LLA-T vs. LLA-B.</b> O que separa?",answer:"<b>Massa mediastinal.</b><script>x</script>",reference:""}]}});
 await click('#cdAI-'+eid);await p.waitForTimeout(250);
 const C=await p.evaluate(id=>{const w=document.querySelector(`.cderr[data-eid="${id}"]`);return {k:[...w.querySelectorAll('.cdk')].map(x=>x.textContent),ck:[...w.querySelectorAll('.cdck input')].map(x=>x.checked),pr:window.__cp,ref:(w.querySelector('.osref')||{}).textContent,noscript:!w.innerHTML.includes("<script")}},eid);
 ok(C.k.length===4&&C.ck.join()==="true,true,false,false"&&/sugerido para este erro/.test(C.k[3])&&/Padrão Osler/.test(C.pr)&&/contraste/.test(C.pr)&&/Acute lymphoblastic leukemia/.test(C.ref)&&C.noscript,name+": o Claude cria 4 no padrão Osler; 2 marcados, contraste sugerido "+JSON.stringify(C.k));
 if(name==="fone"||name==="note"){await p.evaluate(id=>document.querySelector(`.cderr[data-eid="${id}"]`).scrollIntoView({block:"start"}),eid);await p.waitForTimeout(120);await p.screenshot({path:`t105-erro-${name}.png`})}
 await click('#cdSave-'+eid);
 ok(await p.evaluate(id=>{const L=cards.filter(x=>x.eid===id);return L.length===2&&L.every(x=>x.h&&x.src==="claude"&&!x.f.st)&&L[0].kind==="disc"&&/2 cartões ✓/.test(document.querySelector('#ecd-'+id).textContent)},eid),name+": guarda os 2 cartões ligados ao erro");
 /* 5. .apkg: SQLite e zip válidos, tipo de nota próprio, intervalo preservado */
 const out=path.join(__dirname,`_t105-${name}.apkg`);
 const b64=await p.evaluate(async()=>{const u=await apkgBuild(cdReady());let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)});fs.writeFileSync(out,Buffer.from(b64,"base64"));
 let A=null;try{A=JSON.parse(execFileSync("python3",[pyf,out]).toString())}catch(e){A={err:String(e)}}
 ok(A.ic==="ok"&&A.ver===11&&A.model.join()==="Osler Flashcard (Nexus)"&&A.flds.join()==="Question,Answer,Reference"&&A.decks.join()==="Default,Nexus::Cartões dos erros"&&A.notes===1&&A.cards===1&&A.media==="{}",name+": .apkg abre como banco do Anki "+JSON.stringify(A).slice(0,300));
 ok(A.f0&&/Anemia ferropriva/.test(A.f0[0])&&/UpToDate/.test(A.f0[2])&&A.c0[2]===2&&A.c0[3]===2&&A.c0[4]===45&&A.c0[5]===65&&/clinica-medica::hematologia-e-oncologia::anemias/.test(A.tags)&&/ nexus /.test(A.tags),name+": nota com 3 campos, cartão em revisão com o vencimento e o intervalo, tags hierárquicas "+JSON.stringify({c0:A.c0,tags:A.tags}));
 /* muitos cartões (páginas internas e transbordo) */
 const big=path.join(__dirname,`_t105b-${name}.apkg`);
 const b2=await p.evaluate(async()=>{const L=[];for(let i=0;i<400;i++){const x=cdClean({id:"z"+i,k:"CM-1",q:"Pergunta "+i+" "+"texto ".repeat(i%7?10:900),a:"Resposta "+i,box:0});x.f={st:2,s:50,d:5,last:today(),reps:3,lapses:0,first:""};x.due=fromNum(dnum(today())+50);L.push(x)}
   const u=await apkgBuild(L);let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)});fs.writeFileSync(big,Buffer.from(b2,"base64"));
 let A2=null;try{A2=JSON.parse(execFileSync("python3",[pyf,big]).toString())}catch(e){A2={err:String(e)}}
 ok(A2.ic==="ok"&&A2.notes===400&&A2.cards===400,name+": 400 cartões (com textos longos) continuam um banco íntegro "+JSON.stringify({ic:A2.ic,n:A2.notes,err:A2.err}));
 [out,big].forEach(f=>{try{fs.unlinkSync(f)}catch(e){}});
 /* 6. exportar pela tela e confirmar "Já importei no Anki" */
 await p.evaluate(()=>{backStack=[];nSeg="revisar";setView("notas")});await p.waitForTimeout(200);
 if(await p.evaluate(()=>!!document.querySelector('#cdApkg')&&!document.querySelector('#cdApkg').disabled)){await click('#cdApkg');await p.waitForTimeout(400);
   ok(await p.evaluate(()=>!!cdExp&&cdExp.ids.length===1&&!!document.querySelector('#cdAnkiDone')),name+": depois de exportar, pede para confirmar a importação");
   const before=await p.evaluate(()=>cards.length);await click('#cdAnkiDone');
   ok(await p.evaluate(n=>cards.length===n-1&&!cdExp&&trash.some(t=>t.kind==="cards"),before),name+": Já importei tira os exportados e guarda na lixeira");
   const tr=await p.evaluate(()=>trash.find(t=>t.kind==="cards").id);await p.evaluate(id=>trRestore(id),tr);ok(await p.evaluate(()=>cdReady().length===1),name+": a lixeira devolve os cartões exportados")}
 else ok(false,name+": botão de exportar ausente");
 /* 7. ajuste do limite de novos */
 await p.evaluate(()=>{ui.prefs.cdNew=7;render()});ok(await p.evaluate(()=>cdNewLimit()===7&&cdDue().filter(x=>!x.f.st).length<=7),name+": limite de novos ajustável");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
try{fs.unlinkSync(pyf)}catch(e){}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
