// t139: Lote 20E — plano alinhado ao eixo da faculdade (1 faculdade · 1 do eixo · 1 livre; vários eixos revezam; vizinhas; fixar à mão; SP sem área;
// trocar por outro do eixo; prova, 30 min e desligado ficam por cima) e folga planejada congelando a sequência, "Hoje não deu" (1 por semana) e o cartão da folga.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 /* semestre com uma SP de Hematologia que fecha em 5 dias e uma de Neurologia em 9 dias */
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);fac.sems=[{id:"s6",name:"6º período",archived:false,lv:{}}];
   const mkSp=(id,name,fech,objs)=>({id,name,items:["O:"+id],objs,fech});
   fac.discs=[{id:"d1",semId:"s6",name:"NCS 6 – Tutoria",div:"sp",info:{},items:[],sps:[mkSp("spA","SP 3.1 – Anemias",D(5),["Diferenciar anemia ferropriva de talassemia"]),mkSp("spB","SP 3.2 – Cefaleia",D(9),["Reconhecer sinais de alarme da cefaleia"])]}];
   fac.own={spA:{t:"SP 3.1 – Anemias",discId:"d1",spId:"spA",area:"CM",spec:"Hematologia e oncologia"},spB:{t:"SP 3.2 – Cefaleia",discId:"d1",spId:"spB",area:"CM",spec:"Neurologia"}};
   facNormalize&&facNormalize();saveFac();ui.prefs.wday=[180,180,180,180,180,180,180];delete ui.prefs.align;saveUI();commit()});
 const plan=()=>p.evaluate(()=>{dayPlan=null;const P=ensurePlan();return P.items.map(x=>({k:x.k,cls:x.cls,txt:x.txt,sp:BYKEY[x.k].sp,area:BYKEY[x.k].area.code}))});
 const A0=await p.evaluate(()=>{const AX=axNow();return {on:axOn(),n:AX.list.length,labs:AX.list.map(x=>x.lab)}});
 ok(A0.on&&A0.n===2&&A0.labs.includes("Hematologia e oncologia")&&A0.labs.includes("Neurologia"),name+": ciclo clínico liga o alinhamento; eixos = SPs da semana "+JSON.stringify(A0));
 const P1=await plan(),E1=await p.evaluate(()=>axToday(axNow()).lab);
 const ex=P1.find(x=>x.cls==="r-eixo");
 ok(P1.length===3&&P1.some(x=>x.cls==="r-fac")&&ex&&ex.sp===E1&&P1.some(x=>x.cls==="r-new"),name+": plano 1 faculdade · 1 do eixo ("+E1+") · 1 livre "+JSON.stringify(P1.map(x=>x.cls+":"+x.sp)));
 ok(/^Eixo · /.test(ex.txt),name+": selo do tema do eixo: "+ex.txt);
 /* reveza por dia */
 const R2=await p.evaluate(()=>{const AX=axNow(),a=AX.list[dnum(today())%2].lab,b2=AX.list[(dnum(today())+1)%2].lab;return a!==b2});
 ok(R2,name+": dois eixos revezam dia a dia");
 /* vizinha: Hematologia toda estudada → Hematologia pediátrica */
 const R3=await p.evaluate(()=>{const E=AX0=axNow().list.find(x=>x.spec==="Hematologia e oncologia");ALL.filter(i=>i.sp==="Hematologia e oncologia").forEach(i=>upd(i.key,s=>{s.last=today();s.step=0;s.l=1}));const r=axResPick(E,new Set());
   ui.prefs.anear=false;const r2=axResPick(E,new Set());delete ui.prefs.anear;ALL.filter(i=>i.sp==="Hematologia e oncologia").forEach(i=>upd(i.key,s=>{delete s.last;delete s.step;s.l=0}));commit();return {sp:r&&r.it.sp,txt:r&&r.txt,sp2:r2&&r2.it.sp}});
 ok(R3.sp==="Hematologia pediátrica"&&/vizinha de Hematologia e oncologia/.test(R3.txt),name+": sem tema novo no eixo, usa a área vizinha "+JSON.stringify(R3));
 ok(R3.sp2&&R3.sp2!=="Hematologia pediátrica"&&R3.sp2!=="Hematologia e oncologia",name+": com vizinhas desligadas, usa outra especialidade da mesma área ("+R3.sp2+")");
 /* trocar por outro do eixo */
 const R4=await p.evaluate(()=>{dayPlan=null;const P=ensurePlan(),i=P.items.findIndex(x=>x.cls==="r-eixo"),k0=P.items[i].k;axSwap(i);const k1=dayPlan.items[i].k;return {k0,k1,cls:dayPlan.items[i].cls,same:BYKEY[k0].sp===BYKEY[k1].sp}});
 ok(R4.k0!==R4.k1&&R4.cls==="r-eixo"&&R4.same,name+": Outro do eixo troca por outro tema da mesma especialidade");
 /* tela: linha do eixo, botão de troca e cartão em Configurações */
 await p.evaluate(()=>{backStack=[];setView("temas");if(typeof setTSeg==="function")setTSeg("hoje");render()});await p.waitForTimeout(200);
 const V1=await p.evaluate(()=>({ax:(document.getElementById("pAxis")||{}).textContent||"",sw:!!document.querySelector('[id^="axSw-"]')}));
 ok(/Eixo da faculdade: (Hematologia e oncologia|Neurologia)/.test(V1.ax)&&/reveza com/.test(V1.ax)&&V1.sw,name+": Estudar hoje mostra o eixo e o botão Outro do eixo · "+V1.ax.slice(0,90));
 await p.evaluate(()=>{goSub("config");render()});await p.waitForTimeout(200);
 ok(await p.evaluate(()=>{const c=document.getElementById("axCard");return !!c&&/Alinhar o plano ao eixo/.test(c.textContent)&&/1 faculdade · 1 do eixo · 1 livre/.test(c.textContent)}),name+": cartão do eixo em Configurações › Plano");
 /* fixar à mão */
 const R5=await p.evaluate(()=>{ui.prefs.eixo={a:"PED",sp:"Puericultura",until:fromNum(dnum(today())+20)};saveUI();const AX=axNow();dayPlan=null;const P=ensurePlan(),e=P.items.find(x=>x.cls==="r-eixo");delete ui.prefs.eixo;saveUI();return {fx:AX.fixed,lab:AX.list[0].lab,sp:e&&BYKEY[e.k].sp}});
 ok(R5.fx&&R5.lab==="Puericultura"&&R5.sp==="Puericultura",name+": eixo fixado à mão vale no plano "+JSON.stringify(R5));
 /* SP sem área */
 const R6=await p.evaluate(()=>{const o=fac.own.spB;delete o.area;delete o.spec;const AX=axNow();const t=axLineEl();o.area="CM";o.spec="Neurologia";return {na:AX.noArea.length,txt:t?t.textContent:""}});
 ok(R6.na===1&&/SP 3\.2 sem área/.test(R6.txt),name+": SP sem área pede a área "+R6.txt.slice(0,120));
 /* por cima: desligado, 30 min e semana da prova */
 const R7=await p.evaluate(()=>{ui.prefs.align=false;saveUI();dayPlan=null;const a=ensurePlan().items.some(x=>x.cls==="r-eixo");delete ui.prefs.align;
   const t=dnum(today());ui.prefs.wday[wdOf(t)]=30;saveUI();dayPlan=null;const b2=ensurePlan().items.some(x=>x.cls==="r-eixo");ui.prefs.wday[wdOf(t)]=180;saveUI();
   fac.provas.push({id:"pv1",discId:"d1",name:"Prova de NCS",date:fromNum(t+3),items:["O:spA"]});saveFac();dayPlan=null;const c2=ensurePlan().items.some(x=>x.cls==="r-eixo");fac.provas=[];saveFac();return {off:a,m30:b2,pw:c2}});
 ok(!R7.off&&!R7.m30&&!R7.pw,name+": sem eixo com o alinhamento desligado, no dia de 30 min e na semana da prova "+JSON.stringify(R7));
 /* ===== folga e sequência ===== */
 const S=await p.evaluate(()=>{const t=dnum(today()),D=n=>fromNum(t-n);hist={};[1,3,4].forEach(n=>hist[D(n)]={e:1});const off=wdOf(t-2);ui.prefs.wday=[180,180,180,180,180,180,180];ui.prefs.wday[off]=0;saveUI();
   const a=streak();hist[D(2)]={q:5};const b2=streak();delete hist[D(2)];ui.prefs.wday[off]=180;saveUI();const c2=streak();
   ui.prefs.wday[off]=0;saveUI();const m={};[1,3,4].forEach(n=>m[D(n)]=7200);const g=foGoalStreak(m);return {a,b:b2,c:c2,g}});
 ok(S.a===3,name+": folga planejada sem estudo congela a sequência (3) "+JSON.stringify(S));
 ok(S.b===4,name+": estudar na folga soma +1 (4)");
 ok(S.c===1,name+": sem a folga, o dia vazio quebra a sequência (1)");
 ok(S.g===3,name+": a meta do Foco segue a mesma regra (3)");
 ok(await p.evaluate(()=>{setView("foco");render();return !!document.querySelector(".fohm i.off .ofs")}),name+": ❄ no mapa das 12 semanas no dia de folga");
 /* Hoje não deu */
 await p.evaluate(()=>{ui.prefs.wday=[180,180,180,180,180,180,180];ui.prefs.wplans={};delete ui.prefs.hnd;saveUI();dayPlan=null;backStack=[];setView("temas");if(typeof setTSeg==="function")setTSeg("hoje");render()});await p.waitForTimeout(200);
 const jsc=s=>p.evaluate(s=>document.querySelector(s).click(),s).then(()=>p.waitForTimeout(250));
 ok(await p.evaluate(()=>!!document.getElementById("pHnd")),name+": botão Hoje não deu no Estudar hoje");
 await jsc('#pHnd');ok(await p.evaluate(()=>/Toque de novo/.test(document.getElementById("pHnd").textContent)&&!isOffDay()),name+": pede confirmação");
 await jsc('#pHnd');
 const H1=await p.evaluate(()=>({off:isOffDay(),items:ensurePlan().items.length,hnd:!!hndWeek(),on:!!document.getElementById("pHndOn")}));
 ok(H1.off&&H1.items===0&&H1.hnd&&H1.on,name+": hoje vira folga, plano vazio "+JSON.stringify(H1));
 /* cartão da folga no Início */
 await p.evaluate(()=>{errors.push({id:"ef1",k:"CM-1",w:"x",r:"y",t:"conhecimento",s:"S",d:fromNum(dnum(today())-3),due:fromNum(dnum(today())-1),box:1});saveErrsLocal();backStack=[];setView("inicio");render()});await p.waitForTimeout(250);
 const F1=await p.evaluate(()=>{const c=document.getElementById("iOff");return c?{t:c.textContent,errs:!!c.querySelector("#iOff-errs"),undo:!!c.querySelector("#iHndUndo")}:null});
 ok(F1&&/Hoje não deu/.test(F1.t)&&/sequência fica congelada/.test(F1.t)&&F1.errs&&F1.undo,name+": Início mostra a folga com sugestões leves e Desfazer");
 await jsc('#iOffRest');ok(await p.evaluate(()=>/Bom descanso/.test(document.getElementById("iOff").textContent)&&!document.querySelector("#iOff-errs")),name+": Hoje é só descanso esconde as sugestões");
 await jsc('#iHndUndo');ok(await p.evaluate(()=>!isOffDay()&&!hndWeek()&&ensurePlan().items.length>0),name+": Desfazer volta o dia de estudo e devolve o uso da semana");
 /* 1 por semana: usado em outro dia → aviso */
 const H2=await p.evaluate(()=>{const t=dnum(today()),mon=fromNum(wpMon(t));ui.prefs.hnd={[mon]:{d:fromNum(t-1),prev:180}};saveUI();backStack=[];setView("temas");render();return {btn:!!document.getElementById("pHnd"),txt:(document.querySelector(".phndu")||{}).textContent||""}});
 ok(!H2.btn&&/já usado nesta semana/.test(H2.txt),name+": só 1 por semana "+H2.txt);
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
