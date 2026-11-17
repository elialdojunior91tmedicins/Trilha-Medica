// t155 (defeito de 17/11/2026): "Caso novo com a mesma regra" só aceita a questão irmã cuja resposta tem o núcleo da regra;
// o raciocínio vem do caso mostrado; "Este caso não é da mesma regra" desfaz o par
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 /* o núcleo da resposta */
 const C=await p.evaluate(()=>({mac:eSameCore("Azitromicina 1.200 mg VO uma vez por semana","Itraconazol 200 mg por via oral uma vez ao dia"),
   same:eSameCore("Azitromicina 1.200 mg VO uma vez por semana","Iniciar azitromicina semanal"),
   neuro:eSameCore("Penicilina G cristalina IV 18 a 24 milhões UI/dia por 14 dias","Penicilina G cristalina IV por 14 dias"),
   vazio:eSameCore("Sim","Sim")}));
 ok(C.mac===false&&C.same===true&&C.neuro===true&&C.vazio===false,name+": núcleo da resposta (MAC × histoplasmose não casa; mesma droga casa) "+JSON.stringify(C));
 /* erro: profilaxia de MAC; no acervo, uma irmã de histoplasmose (não pode casar) */
 const Q=(en,alts,c,cm,pc)=>({enunciado:en,alternativas:alts.map((t,i)=>({letra:"ABCD"[i],texto:t})),correta:c,comentario:cm,pc});
 await p.evaluate(Q=>{errors=[];redo=[];const k=ALL.find(i=>/HIV/.test(i.t)).key;window.__k=k;Q=eval(Q);
   const q=Q("Homem de 40 anos com infecção pelo HIV apresenta contagem de T CD4 de 35 células/mm³, assintomático e ainda não iniciou a terapia antirretroviral TARV. Qual a profilaxia primária indicada contra o complexo Mycobacterium avium?",["Azitromicina 1.200 mg VO uma vez por semana","Sulfametoxazol-trimetoprima diário","Fluconazol 200 mg ao dia"],"A","Gabarito: A. Por que está correta: com CD4 abaixo de 50 sem TARV, a profilaxia primária contra MAC é azitromicina semanal.","Azitromicina 1.200 mg semanal é a profilaxia primária de escolha contra MAC em pacientes com CD4 < 50 sem TARV.");
   const D=qDraft(q,"B","Simulado HIV/AIDS 2");const e=eNew(k,D.w,D.r,D.t,D.s,"",D.p,{pc:D.pc,dd:D.dd,qf:D.qf});e.rev=3;e.due=today();window.__e=e.id;
   exams.push(exClean({id:"exh",name:"simulado-hiv-aids-medio",banca:"X",ano:"2026",qs:[
     {n:1,k,g:"b",q:Q("Um paciente com HIV e CD4 de 80 células/mm³, residente em área endêmica para histoplasmose, não iniciou a terapia antirretroviral TARV. Para prevenir histoplasmose disseminada (CD4 < 150 células/mm³), qual a profilaxia primária indicada?",["Itraconazol 200 mg por via oral uma vez ao dia","Azitromicina semanal","Fluconazol"],"A","Profilaxia primária contra histoplasmose com itraconazol em área endêmica, CD4 abaixo de 150, sem TARV.")}]}));
   saveErrsLocal();backStack=[];setView("erros");render()},`(${Q})`);await p.waitForTimeout(200);
 await click('#erGo');
 ok(await p.evaluate(()=>!/Caso novo com a mesma regra/.test(document.querySelector('.erv2').textContent)&&/CD4 de 35/.test(document.querySelector('.ercx').textContent)),name+": a irmã de histoplasmose não vira caso novo; volta o caso original");
 /* agora uma irmã de verdade (azitromicina contra MAC), com dados diferentes */
 await p.evaluate(()=>{const ex=exams.find(x=>x.id==="exh");ex.qs.push({n:2,k:window.__k,g:"b",q:{enunciado:"Mulher de 29 anos vivendo com HIV, CD4 de 22 células/mm³ e carga viral alta, sem terapia antirretroviral TARV por recusa. Nega febre ou perda de peso. Qual a profilaxia primária contra o complexo Mycobacterium avium?",
     alternativas:[{letra:"A",texto:"Azitromicina 1.200 mg por via oral uma vez por semana"},{letra:"B",texto:"Itraconazol"}],correta:"A",comentario:"Gabarito: A. Por que está correta: CD4 de 22 sem TARV indica profilaxia de MAC com azitromicina semanal."}});
   erRun={ids:[window.__e],i:0,show:false,ok:0,done:0,res:[]};render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>/Caso novo com a mesma regra/.test(document.querySelector('.erv2').textContent)&&/CD4 de 22/.test(document.querySelector('.ercx').textContent)),name+": a irmã com a mesma resposta (azitromicina) vira caso novo");
 await click('#erShow');
 const V=await p.evaluate(()=>{const c=document.querySelector('.erv2');return {ans:c.querySelector('.ercok p').textContent,ps:[...c.querySelectorAll('.erps li')].map(x=>x.textContent).join(" | "),lab:(c.querySelector('.erpsw .glabel')||{}).textContent,btn:!!document.querySelector('#erNot2')}});
 ok(/Azitromicina/.test(V.ans)&&!/CD4 de 35/.test(V.ps)&&/raciocínio deste caso/.test(V.lab||"")&&V.btn,name+": o raciocínio é montado com os dados do caso mostrado "+JSON.stringify(V));
 /* desfazer o par */
 await click('#erNot2');
 const U=await p.evaluate(()=>{const e=errors.find(x=>x.id===window.__e);return {n2:(e.ra.nao2||[]).length,src:e.ra.src,txt:document.querySelector('.erv2').textContent,ps:[...document.querySelectorAll('.erps li')].map(x=>x.textContent).join(" ")}});
 ok(U.n2===1&&U.src==="app"&&!/Caso novo com a mesma regra/.test(U.txt)&&/CD4 de 35/.test(U.txt),name+": \"Este caso não é da mesma regra\" desfaz o par e mostra o caso original (a organização continua do app)");
 ok(await p.evaluate(()=>{const e=errors.find(x=>x.id===window.__e);return eSister(e)===null&&eRaClean(JSON.parse(JSON.stringify(e.ra))).nao2.length===1}),name+": o par desfeito não volta e sobrevive à limpeza da carga");
 /* caso novo do Claude com resposta de outra regra é ignorado */
 ok(await p.evaluate(()=>{const e=errors.find(x=>x.id===window.__e);e.ra={...e.ra,caso2:{e:"Caso.",ask:"Qual?",ans:"Itraconazol diário"}};const bad=eCaso2(e);e.ra.caso2.ans="Azitromicina semanal";const good=eCaso2(e);return bad===null&&good&&good.src==="Claude"}),name+": caso novo do Claude só vale se a resposta bater com a regra");
 await p.keyboard.press('3');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>{const e=errors.find(x=>x.id===window.__e);return e.rev===4}),name+": a nota vale para o erro original");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
