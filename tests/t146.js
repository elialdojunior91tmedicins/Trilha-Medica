// t146 (Banco de questões, B1): o que já existe entra no banco com o histórico, sem duplicatas e sem somar de novo;
// o gerador e o simulado guardam TODAS as questões (também as acertadas); IndexedDB, conta em pacotes, outro aparelho e backup.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
 const ctx=await b.newContext({viewport:{width:1366,height:900}});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__packs=1;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{polling:100,timeout:15000});await p.evaluate(()=>bankBootP);await p.waitForTimeout(300);
 ok(await p.evaluate(()=>bankOn&&bankSynced&&bankStore&&bankStore.pack),"banco carregado do aparelho e ligado à conta (em pacotes)");
 /* 1. o que já existe */
 const R1=await p.evaluate(async()=>{const Q=(e,a,c,extra)=>({enunciado:e,alternativas:a.map((t,i)=>({letra:"ABCD"[i],texto:t})),correta:c,comentario:"",conceito:"",...(extra||{})});
   const q1=Q("Mulher de 30 anos com TSH baixo e T4 livre alto. Qual o diagnóstico?",["Hipotireoidismo","Hipertireoidismo","Eutireoidismo","Tireoidite subaguda"],"B",{comentario:"TSH suprimido com T4L alto = hipertireoidismo."});
   const q2=Q("Criança com febre e exantema após 3 dias. Agente mais provável?",["HHV-6","Sarampo","Rubéola","Parvovírus"],"A");
   exams=[exClean({id:"exA",name:"ENARE 2024",banca:"ENARE",ano:"2024",at:"2026-10-01T10:00:00.000Z",qs:[{n:1,k:"CM-1",g:"b",q:q1},{n:2,k:"PED-1",g:"b",q:q2,fg:1}]})];
   exProg=[exPClean({id:"exA",a:{0:{l:"B",d:"2026-10-20",s:50},1:{l:"C",d:"2026-10-20",s:30}},h:{0:[{l:"A",d:"2026-10-10"}]}})];
   const q3=Q("Homem com dor torácica e supra de ST em DII, DIII e aVF. Artéria acometida?",["Descendente anterior","Coronária direita","Circunflexa","Tronco"],"B");
   sims=[smClean({id:"smA",d:"2026-10-25",at:"2026-10-25T09:00:00.000Z",n:1,hit:0,ans:1,qs:[{k:"CM-1",q:q3,a:"A",t:40}],cfg:{}})];
   /* Refazer da prova (alternativas embaralhadas) = a mesma questão q1 */
   const sh={...q1,alternativas:[q1.alternativas[3],q1.alternativas[1],q1.alternativas[0],q1.alternativas[2]].map((a,i)=>({...a,letra:"ABCD"[i]})),correta:"B"};
   redo=[rdClean({id:"rdA",k:"CM-1",d:"2026-10-10",fd:"2026-10-10",n:1,q:sh,src:"exam"})];
   /* erro do caderno com a questão inteira = a mesma q3 do simulado */
   errors=[{id:"erB",k:"CM-1",w:"Marquei A",r:"B",t:"conhecimento",s:"ENARE 2024",d:"2026-10-21",rev:0,box:0,due:"2026-10-22",q:{e:q1.enunciado,a:q1.alternativas.map(a=>({l:a.letra,t:a.texto})),c:"B",m:"A"}},{id:"erA",k:"CM-1",w:"Marquei DA",r:"CD",t:"conhecimento",s:"Simulado",d:"2026-10-25",rev:0,box:0,due:"2026-10-26",q:{e:q3.enunciado,a:q3.alternativas.map(a=>({l:a.letra,t:a.texto})),c:"B",m:"A"}}];
   window.__st=JSON.stringify({s:state,h:hist});bankFeedAll();await bankFlush();
   const by=e=>bank.find(x=>x.q.enunciado.startsWith(e)),h=x=>(bankHById.get(x.id)||{a:[]}).a;
   const b1=by("Mulher"),b2=by("Criança"),b3=by("Homem");
   return {n:bank.length,o:[b1.o,b2.o,b3.o],b1:{ban:b1.ban,ano:b1.ano,pv:b1.pv,pn:b1.pn,ex:b1.ex,ei:b1.ei},fg:b2.fg,h1:h(b1).map(y=>y.d+y.l+y.ok+(y.c||0)),h2:h(b2).map(y=>y.l+y.ok),h3:h(b3).map(y=>y.src+y.l+y.ok),
     same:window.__st===JSON.stringify({s:state,h:hist}),m:[...h(b1),...h(b2),...h(b3)].every(y=>y.m)}});
 ok(R1.n===3,"provas, simulados, Refazer e erros entram no banco, a mesma questão uma vez só ("+R1.n+")");
 ok(R1.o.join()==="prova,prova,simulado"&&R1.b1.ban==="ENARE"&&R1.b1.ano==="2024"&&R1.b1.pv==="ENARE 2024"&&R1.b1.pn===1&&R1.b1.ex==="exA"&&R1.b1.ei===0&&R1.fg===1,"origem, banca, ano, prova, número e figura "+JSON.stringify(R1));
 ok(R1.h1.join()==="2026-10-10A00,2026-10-20B11","histórico da prova: a tentativa antiga e a atual (só a atual contou); o Refazer e o erro guardado no caderno depois não duplicam "+R1.h1);
 ok(R1.h2.join()==="C0","resposta errada da 2ª questão");
 ok(R1.h3.join()==="simA0","simulado e erro do caderno no mesmo dia viram uma resposta só "+R1.h3);
 ok(R1.same,"nada é somado de novo no acerto dos temas nem no histórico do dia");
 ok(R1.m,"respostas trazidas ficam marcadas como trazidas");
 /* rodar de novo não muda nada */
 ok(await p.evaluate(async()=>{const a=stab({bank,bankH});bankFeedAll();await bankFlush();return stab({bank,bankH})===a&&!bankDirty.size}),"trazer de novo (a cada abertura) não muda nem regrava nada");
 /* gabarito corrigido na prova: a mesma questão, o acerto da resposta acompanha */
 ok(await p.evaluate(async()=>{const ex=exams[0];ex.qs[1].q.correta="C";exSaveLocal();await new Promise(r=>setTimeout(r,1700));await bankFlush();const b2=bank.find(x=>x.ex==="exA"&&x.ei===1);return bank.length===3&&b2.q.correta==="C"&&bankHById.get(b2.id).a[0].ok===1}),"gabarito colado na prova atualiza a questão do banco e o histórico");
 /* 2. gerador: todas as questões, inclusive as acertadas */
 await p.evaluate(()=>{window.__noShuffle=true;const mk=i=>({enunciado:`Questão gerada número ${i} sobre hipertensão: qual a conduta?`,alternativas:[{letra:"A",texto:"Conduta A "+i,porque:"não"},{letra:"B",texto:"Conduta B "+i,porque:""},{letra:"C",texto:"Conduta C "+i,porque:"não"},{letra:"D",texto:"Conduta D "+i,porque:"não"}],correta:"B",comentario:"Porque sim.",conceito:"Conceito "+i,fonte:"Diretriz X, 2024"});
   sampleFn.json=async()=>[mk(1),mk(2),mk(3)];qCount=3;detTab["CM-1"]="questoes";openTopic("CM-1");generate(BYKEY["CM-1"])});
 await p.waitForFunction(()=>gen["CM-1"]&&gen["CM-1"].qs.length===3,null,{timeout:8000});await p.waitForTimeout(200);
 const G=await p.evaluate(async()=>{const g=gen["CM-1"],q0=g.qs[0];const qd0=JSON.stringify(get("CM-1").qd||{});answer(BYKEY["CM-1"],0,q0.correta);await bankFlush();
   const gb=bank.filter(x=>x.o==="gerada"),b0=gb.find(x=>bqT(x.q.enunciado)===bqT(q0.enunciado));const H=bankHById.get(b0.id).a;
   const qd=get("CM-1").qd[today()];return {n:gb.length,ks:b0.ks.join(),h:H.map(y=>y.src+y.ok+(y.c||0)+(y.m||0)).join(),porq:b0.q.alternativas.filter(a=>a.porque).length,fonte:b0.q.fonte,qdAdd:qd&&qd[0]}});
 ok(G.n===3&&G.ks==="CM-1","as 3 questões geradas ficam no banco, ligadas ao tema, antes mesmo de responder "+JSON.stringify(G));
 ok(G.h==="gen110","resposta certa registrada (contou no tema uma vez, pelo caminho de sempre)");
 ok(G.porq===3&&G.fonte==="Diretriz X, 2024","guarda o porquê das alternativas e a referência");
 /* a mesma questão gerada de novo com outra ordem não duplica; a letra acompanha pelo texto */
 ok(await p.evaluate(async()=>{const g=gen["CM-1"],q=g.qs[1],sh={...q,alternativas:[q.alternativas[2],q.alternativas[0],q.alternativas[3],q.alternativas[1]].map((a,i)=>({...a,letra:"ABCD"[i]})),correta:"D"};
   const n0=bank.length;bankAdd(sh,"gerada","CM-1");bankAns(sh,"gerada","CM-1","D",12,"sim",1);await bankFlush();const b=bank.find(x=>bqT(x.q.enunciado)===bqT(q.enunciado));
   return bank.length===n0&&bankHById.get(b.id).a.some(y=>y.l==="B"&&y.ok===1&&y.s===12)}),"mesma questão em outra ordem: uma só no banco, e a letra da resposta é a da ordem guardada");
 /* 3. simulado: questões e respostas; refazer não conta no tema */
 const SM=await p.evaluate(async()=>{const q={enunciado:"Simulado: gestante com PA 160x110 e cefaleia. Conduta inicial?",alternativas:[{letra:"A",texto:"Sulfato de magnésio"},{letra:"B",texto:"Observação"},{letra:"C",texto:"Alta"},{letra:"D",texto:"Diurético"}],correta:"A",comentario:"",conceito:""};
   sim={status:"run",items:[{k:"GO-1"}],qs:[{...q,k:"GO-1"}],i:0,ans:{},t:{},msg:"",src:"week",cfg:simCfgSnap(),gen:true,start:Date.now(),shown:Date.now()-20000};bankAdd(q,"simulado","GO-1");simAnswer("B");
   sim={status:"run",items:[{k:"GO-1"}],qs:[{...q,k:"GO-1"}],i:0,ans:{},t:{},msg:"",gen:true,rerun:true,fromId:"x",start:Date.now(),shown:Date.now()-5000};simAnswer("A");sim=null;await bankFlush();
   const b=bank.find(x=>x.q.enunciado.startsWith("Simulado:"));return {o:b.o,ks:b.ks.join(),h:bankHById.get(b.id).a.map(y=>y.src+y.ok+(y.c||0)).join()}});
 ok(SM.o==="simulado"&&SM.ks==="GO-1"&&SM.h==="sim01,rerun10","simulado: a errada conta no tema; a refeita fica no histórico sem contar "+JSON.stringify(SM));
 /* 4. aparelho e conta */
 const AC2=await p.evaluate(async()=>{const st=await bkAll("q"),s=await bankStore.get(),h=await bankHStore.get();return {idb:st.length,acc:s.docs.length,acch:h.docs.length,n:bank.length,nh:bankH.length}});
 ok(AC2.idb===AC2.n&&AC2.acc===AC2.n&&AC2.acch===AC2.nh,"guardado no aparelho (IndexedDB) e na conta "+JSON.stringify(AC2));
 ok(await p.evaluate(async()=>{const s=await bankStore.get();return bankStore.pack&&s.docs.length>0}),"na conta, em pacotes");
 /* outro aparelho grava uma questão e uma resposta */
 const OD=await p.evaluate(async()=>{const q={enunciado:"Do outro aparelho: lactente com sibilância no 1º episódio. Diagnóstico?",alternativas:[{letra:"A",texto:"Bronquiolite"},{letra:"B",texto:"Asma"}],correta:"A"};
   const n=bqFrom(q,"gerada",["PED-1"],{});const uid=(await (await window.claude.use("user")).id());const base="data/users/"+uid+"/progress/";
   window.__remote(base+"bankpk/p99",{i:{[n.id]:JSON.stringify(n)}});const H={id:n.id,a:[{d:today(),l:"A",ok:1,s:9,src:"gen",c:1}]};window.__remote(base+"bankhpk/p15",{i:{[n.id]:JSON.stringify(H)}});
   await new Promise(r=>setTimeout(r,400));const h=bankHById.get(n.id);return {has:bankById.has(n.id),h:h&&h.a.length,idb:(await bkAll("q")).some(x=>x.id===n.id)}});
 ok(OD.has&&OD.h===1&&OD.idb,"questão e resposta gravadas em outro aparelho chegam aqui e vão para o IndexedDB "+JSON.stringify(OD));
 /* 5. backup */
 const BK=await p.evaluate(async()=>{const B=buildBackup().data;const pv=B.bank.filter(x=>x.o==="prova").length,gen=B.bank.filter(x=>x.o==="gerada").length;
   const bq=JSON.parse(JSON.stringify(B.bank)),bh=JSON.parse(JSON.stringify(B.bankh)),before=stab({bank:[...bank].sort(bankById2).map(x=>({...x,u:0,at:0})),bankH:[...bankH].sort(bankById2)});
   await bankRestore([],[]);const empty=bank.filter(x=>x.o!=="prova").length;await bankRestore(bq,bh);
   const after=stab({bank:[...bank].sort(bankById2).map(x=>({...x,u:0,at:0})),bankH:[...bankH].sort(bankById2)});let dif="";for(let i=0;i<before.length;i++)if(before[i]!==after[i]){dif=before.slice(i-80,i+80)+" ### "+after.slice(i-80,i+80);break}return {pv,gen,nh:B.bankh.length,empty,eq:before===after,dif,
     noArr:!JSON.stringify(B.bank).includes("[[")}});
 ok(BK.pv===0&&BK.gen>=4&&BK.nh>=5,"backup leva o histórico e as questões que não voltam pela prova "+JSON.stringify(BK));
 ok(BK.empty===2,"restaurar um backup sem banco deixa só o que volta pelas provas, simulados, Refazer e erros guardados");
 ok(BK.eq,BK.dif+" restaurar o backup devolve o banco inteiro (as questões das provas voltam pela própria prova)");
 /* 6. ao abrir de novo, vem do aparelho */
 const n1=await p.evaluate(()=>bank.length);await p.reload();await p.waitForFunction(()=>typeof bankOn!=="undefined"&&bankOn,null,{timeout:15000});
 ok(await p.evaluate(n=>bank.length===n,n1),"ao abrir de novo, o banco vem do aparelho ("+n1+")");
 await ctx.close();
 /* 7. sem conta: só no aparelho */
 const c2=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await c2.route(/googleapis|gstatic/,r=>r.abort());
 await c2.addInitScript(`window.claude=undefined;`);const p2=await c2.newPage();p2.on('pageerror',e=>errs.push("semconta:"+e.message));await p2.goto('http://localhost:8765/tests/preview.html');
 await p2.waitForFunction(()=>typeof bankBootP!=="undefined"&&bankBootP,null,{timeout:15000});
 ok(await p2.evaluate(async()=>{await bankBootP;bankAdd({enunciado:"Sem conta: questão teste?",alternativas:[{letra:"A",texto:"um"},{letra:"B",texto:"dois"}],correta:"A"},"gerada","CM-1");await bankFlush();return !bankStore&&bank.length===1&&(await bkAll("q")).length===1}),"sem conta, o banco fica no aparelho");
 await c2.close();
 ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
