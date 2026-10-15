// t89: Faculdade com UC opcional, SP como conteúdo, + SP / + Conteúdo com ligação à residência, Mover para…, migração dos eixos
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
const SHOTS=process.env.SHOTS==="1";
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV).filter(n=>!process.env.DEVS||process.env.DEVS.split(",").includes(n))){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 const shot=async(tag,sel)=>{if(!SHOTS&&!(name==="fone"&&tag==="disc"))return;if(sel)await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"start"});scrollBy(0,-70)},sel);await p.waitForTimeout(150);await p.screenshot({path:`t89-${tag}-${name}.png`})};
 /* dados no formato antigo: eixo com área, SPs com conteúdos, conteúdo com nome de SP solto, disciplina sem divisões */
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
   fac={sems:[{id:"s6",name:"6º semestre",archived:false,lv:{eixo:"Eixo"}}],discs:[
     {id:"d1",semId:"s6",name:"Tutoria",items:["O:x"],info:{},links:[],eixos:[{id:"e1",name:"Eixo de Hematologia",area:"CM",spec:"Hematologia e oncologia"}],
      sps:[{id:"sp1",name:"SP 2.1 Hemostasia",eixoId:"e1",items:["O:a","T:CM-34"],objs:["Descrever a cascata da coagulação"]},{id:"sp2",name:"SP 2.2 Anemias",eixoId:"e1",items:[],objs:[]}]},
     {id:"d2",semId:"s6",name:"PMSUS",items:["O:c"],info:{},links:[],sps:[]},
     {id:"d3",semId:"s6",name:"HMEC",items:[],info:{},links:[],sps:[]}],
     provas:[{id:"p1",discId:"d1",name:"D2",date:D(10),items:["O:a","T:CM-34"],done:[],sps:["sp1"]}],
     own:{a:{t:"Anatomia do fígado",discId:"d1",spId:"sp1"},x:{t:"SP 2.3 Trombofilias",discId:"d1"},c:{t:"Vigilância epidemiológica",discId:"d2"}}};
   registerOwn();facSyncAll();saveFac();commit();backStack=[];setView("fac")});
 const mg=await p.evaluate(()=>{const d1=discOf("d1"),s1=d1.sps[0];return {noEixo:!d1.eixos&&!s1.eixoId&&!(fac.sems[0].lv&&fac.sems[0].lv.eixo),self:s1.items[0]==="O:sp1"&&fac.own.sp1.t===s1.name,area:fac.own.sp1.area==="CM"&&fac.own.sp2.area==="CM",
   nestedArea:fac.own.a.area==="CM",div:d1.div==="sp"&&discOf("d2").div==="",prova:itemStudied(fac.provas[0],"O:sp1")===false&&provaSps(fac.provas[0]).includes("sp1"),
   reg:!!BYKEY["F-sp2"]&&BYKEY["F-sp2"].area.code==="CM"&&!BYKEY["F-sp1"],link:ownLinks("sp1").map(L=>L.k).join()==="CM-34"&&!s1.items.includes("T:CM-34")&&fac.provas[0].items.join()==="O:a,O:sp1",
   objs:subList(BYKEY["CM-34"]).some(x=>x.t==="Descrever a cascata da coagulação")}});
 ok(Object.values(mg).every(Boolean),name+": migração: eixo sai, área vai para as SPs, cada SP vira conteúdo de estudo com os objetivos "+JSON.stringify(mg));
 /* UC pelo Ajustes do semestre */
 await p.evaluate(()=>{facOpenSem.add("s6");facSemAdj="s6";openEdit("uc:s6");render()});await p.waitForTimeout(150);
 await p.fill('#fucnew-s6','NCS');await p.press('#fucnew-s6','Enter');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>fac.sems[0].ucs.length===1&&fac.sems[0].ucs[0].name==="NCS"),name+": cria a UC só com o nome");
 await p.evaluate(()=>{fac.sems[0].ucs.push({id:"u2",name:"PMSUS 6"});closeEdit();facSemAdj=null;const u=fac.sems[0].ucs[0].id;discOf("d1").ucId=u;saveFac();render()});
 /* disciplina aberta */
 await p.evaluate(()=>{facOpenDisc.add("d1");facOpenDisc.add("d2");render()});await p.waitForTimeout(150);
 const uc=await p.evaluate(()=>[...document.querySelectorAll('#facSems .fuch .fucn')].map(x=>x.textContent));
 ok(uc.join("|")==="NCS 6|PMSUS 6|Sem UC",name+": UC agrupa as disciplinas e mostra NCS 6 pelo número do semestre "+uc.join("|"));
 const dv=await p.evaluate(()=>{const c=document.querySelector('#fd-d1'),c2=document.querySelector('#fd-d2');return {spBtn:!!c.querySelector('#faddsp-d1'),cBtn:!!c.querySelector('#faddc-d1'),noOrg:!/Organizar/.test(c.textContent),
   conv:!!c.querySelector('#fspconv-d1'),subs:[...c.querySelectorAll('.flsub')].map(x=>x.textContent).join("|"),sp2:!c2.querySelector('#faddsp-d2')&&!c2.querySelector('.flsub')}});
 ok(dv.spBtn&&dv.cBtn&&dv.noOrg&&dv.conv&&dv.subs==="SPs|Outros conteúdos"&&dv.sp2,name+": NCS com + SP e + Conteúdo, sem Organizar; PMSUS só com a lista "+JSON.stringify(dv));
 await shot("disc",'#fd-d1');
 /* conteúdo com nome de SP vira SP em um toque */
 await click('#fspconv-d1');
 ok(await p.evaluate(()=>{const d=discOf("d1");return d.sps.length===3&&d.sps[2].id==="x"&&d.sps[2].items[0]==="O:x"&&!d.items.includes("O:x")&&fac.own.x.spId==="x"}),name+": Transformar em SPs leva o conteúdo para as SPs");
 /* + SP com ligação sugerida */
 await click('#faddsp-d1');await p.fill('#fq-cd1','SP 2.4 Anemia falciforme');await p.waitForTimeout(250);
 const chips=await p.evaluate(()=>[...document.querySelectorAll('#fd-d1 .fclink .chip')].map(x=>x.textContent));
 ok(chips.length>0,name+": + SP sugere temas parecidos da residência "+chips.slice(0,2).join("|"));
 await shot("addsp",'#fd-d1 .fadder');
 await click('#fcl-d1-0');const ck=await p.evaluate(()=>facNew.clkd1.keys[0]);
 await p.evaluate(()=>document.querySelector('#fd-d1 .fcreate button').click());await p.waitForTimeout(200);
 const ns=await p.evaluate(k=>{const d=discOf("d1"),s=d.sps.find(x=>x.name==="SP 2.4 Anemia falciforme");return s&&{self:s.items[0]==="O:"+s.id,link:ownLinks(s.id).map(L=>L.k).join()===k,id:s.id}},ck);
 ok(ns&&ns.self&&ns.link,name+": cria a SP já ligada ao tema escolhido "+JSON.stringify(ns));
 /* abrir a SP: estudar, objetivos, ligar, mover */
 await p.evaluate(()=>{facOpenSP.clear();facOpenSP.add("sp1");facAddC=null;render()});await p.waitForTimeout(150);
 const sd=await p.evaluate(()=>{const s=document.querySelector('#sp-sp1');return {study:!!s.querySelector('.fspstudy .detail'),obj:/cascata/.test(s.textContent),link:!!s.querySelector('#flk-sp1'),move:!!s.querySelector('.fspact select'),nested:/Outros conteúdos desta SP/.test(s.textContent)}});
 ok(Object.values(sd).every(Boolean),name+": a SP aberta tem estudo, objetivos, ligar à residência, outros conteúdos e Mover para "+JSON.stringify(sd));
 await shot("sp",'#sp-sp1');
 /* + Conteúdo na disciplina sem divisões, ligado a 2 temas */
 await click('#faddc-d2');await p.fill('#fq-cd2','Hipertensão arterial');await p.waitForTimeout(250);
 const n2=await p.evaluate(()=>document.querySelectorAll('#fd-d2 .fclink .chip').length);
 for(let i=0;i<Math.min(2,n2);i++)await click('#fcl-d2-'+i);
 if(process.env.DBG)console.log('DBG',n2,await p.evaluate(()=>JSON.stringify(facNew.clkd2)+[...document.querySelectorAll('#fd-d2 .fclink .chip')].map(x=>x.id+x.textContent).join()));
 await p.evaluate(()=>document.querySelector('#fd-d2 .fcreate button').click());await p.waitForTimeout(200);
 const nc=await p.evaluate(()=>{const id=Object.keys(fac.own).find(i=>fac.own[i].t==="Hipertensão arterial");return id&&{n:ownLinks(id).length,inD2:discOf("d2").items.includes("O:"+id),id}});
 ok(nc&&nc.inD2&&nc.n===Math.min(2,n2),name+": + Conteúdo cria já ligado aos temas marcados "+JSON.stringify(nc));
 /* Mover para outra SP */
 await p.evaluate(()=>{openKey="F-c";render()});await p.waitForTimeout(150);
 const sel=await p.evaluate(()=>{const s=document.querySelector('#fd-d2 li.t.open .fracts select');return s&&s.id});
 ok(!!sel,name+": conteúdo aberto oferece Mover para…");
 if(sel){await p.selectOption('#'+sel,'s:sp2');await p.waitForTimeout(150)}
 ok(await p.evaluate(()=>{const s=discOf("d1").sps.find(x=>x.id==="sp2");return s.items.includes("O:c")&&!discOf("d2").items.includes("O:c")&&fac.own.c.discId==="d1"&&fac.own.c.spId==="sp2"}),name+": Mover para leva o conteúdo para a SP de outra disciplina");
 /* conteúdo da faculdade fechado oferece Ligar à residência */
 await p.evaluate(()=>{openKey=null;facOpenSP.add("sp2");render()});await p.waitForTimeout(100);
 ok(await p.evaluate(()=>!!document.querySelector('#flq-c')),name+": conteúdo sem ligação mostra o atalho Ligar à residência");
 /* Detalhes e ajustes: divisões e UC */
 await p.evaluate(()=>{facOpenDisc.add("d3");render()});await click('#fdet-d3');
 ok(await p.evaluate(()=>!!document.querySelector('#fd-d3 .fdset')&&!!document.querySelector('#fduc-d3')),name+": Detalhes e ajustes tem UC e divisões");
 await p.selectOption('#fduc-d3','u2');ok(await p.evaluate(()=>discOf("d3").ucId==="u2"),name+": escolher a UC da disciplina");
 await shot("det",'#fd-d3');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 ok(await p.evaluate(()=>{const s=JSON.stringify(fac);return s.indexOf("undefined")<0&&s.indexOf("eixo")<0&&fac.discs.every(d=>d.sps.every(s=>s.items[0]==="O:"+s.id&&fac.own[s.id]))}),name+": dados válidos, sem eixos, toda SP com o próprio conteúdo");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
