// t78: nova prova com Semestre › disciplina(s) desse semestre, no painel Próximas provas e dentro do semestre
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');
 await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&trashStore,null,{polling:100});await p.waitForTimeout(150);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(120)};
 const noScroll=async lab=>ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral ("+lab+")");
 await p.evaluate(()=>{const D=(id,semId,nm)=>({id,semId,name:nm,items:[],info:{},links:[],eixos:[],sps:[]});fac={sems:[{id:"s5",name:"5º semestre",archived:false},{id:"s6",name:"6º semestre",archived:false},{id:"s4",name:"4º semestre",archived:true},{id:"s7",name:"7º semestre",archived:false}],
   discs:[D("a5","s5","Clínica 5"),D("b5","s5","Cirurgia 5"),D("d1","s6","NCS 6 - Tutoria"),D("d2","s6","NCS 6 - Morfofuncional"),D("d3","s6","HMEC 6"),D("a4","s4","Pediatria 4")],provas:[],own:{}};
   fac.discs.find(d=>d.id==="d1").sps=[{id:"sp21",name:"SP 2.1 - Hemostasia",eixoId:null,items:["T:CM-1"],objs:[]}];
   registerOwn();saveFac();backStack=[];facProvNew=false;setView("fac")});await p.waitForTimeout(150);
 /* 1. painel do topo: botão e formulário em duas etapas */
 ok(await p.isVisible('#fpgNew'),name+": botão + Nova prova no painel Próximas provas");
 ok(await p.evaluate(()=>!document.querySelector('#fpsem-g')),name+": formulário fechado de início");
 await click('#fpgNew');
 ok(await p.evaluate(()=>{const s=document.querySelector('#fpsem-g');return !!s&&[...s.options].map(o=>o.textContent).join("|")==="5º semestre|6º semestre|4º semestre (arquivado)|7º semestre"}),name+": lista todos os semestres (arquivado marcado)");
 ok(await p.evaluate(()=>document.querySelector('#fpsem-g').value==="s5"&&!!document.querySelector('#fpdisc-g-a5')&&!document.querySelector('#fpdisc-g-d1')),name+": começa no primeiro semestre ativo, só com as disciplinas dele");
 await p.selectOption('#fpsem-g','s6');await p.waitForTimeout(120);
 ok(await p.evaluate(()=>['d1','d2','d3'].every(i=>document.querySelector('#fpdisc-g-'+i))&&!document.querySelector('#fpdisc-g-a5')&&document.querySelector('#fpdisc-g-d1').getAttribute('aria-pressed')==='true'),name+": trocar o semestre troca as disciplinas (a primeira já marcada)");
 await click('#fpdisc-g-d2');
 ok(await p.evaluate(()=>facNew.provg.ds.join()==="d1,d2"),name+": marca mais de uma disciplina do semestre");
 await noScroll("formulário do topo");if(name==="fone"||name==="tabDeitado")await p.screenshot({path:`t78-top-${name}.png`});
 await p.fill('#fpn-g','D2 NCS 6');await p.fill('#fpd-g',await p.evaluate(()=>fromNum(dnum(today())+13)));await p.dispatchEvent('#fpd-g','input');
 await p.evaluate(()=>document.querySelector('#facProvas form.fpform button[type=submit]').click());await p.waitForTimeout(250);
 const P1=await p.evaluate(()=>{const x=fac.provas.find(y=>y.name==="D2 NCS 6");return x&&{id:x.id,ids:provaDids(x),items:[...x.items]}});
 ok(P1&&P1.ids.join()==="d1,d2"&&P1.items.join()==="T:CM-1",name+": prova criada no semestre escolhido, com as duas disciplinas "+JSON.stringify(P1));
 ok(await p.evaluate(id=>!document.querySelector('#fpsem-g')&&facOpenSem.has("s6")&&facOpenProv.has("s6")&&!!document.getElementById('fp-'+id),P1.id),name+": formulário fecha e a prova aparece aberta no semestre 6");
 /* 2. formulário dentro do semestre também escolhe o semestre */
 await p.evaluate(()=>{facOpenSem.add("s5");facOpenProv.add("s5");render()});await p.waitForTimeout(100);
 ok(await p.evaluate(()=>{const s=document.querySelector('#fpsem-s5');return !!s&&s.value==="s5"&&s.options.length===4}),name+": o formulário dentro do semestre também tem o seletor de semestre");
 await p.selectOption('#fpsem-s5','s6');await p.waitForTimeout(120);
 ok(await p.evaluate(()=>!!document.querySelector('#fpdisc-s5-d3')&&!document.querySelector('#fpdisc-s5-a5')),name+": nele, escolher outro semestre mostra as disciplinas desse semestre");
 await click('#fpdisc-s5-d3');await p.fill('#fpn-s5','HMEC D2');await p.fill('#fpd-s5',await p.evaluate(()=>fromNum(dnum(today())+50)));await p.dispatchEvent('#fpd-s5','input');
 await p.evaluate(()=>document.querySelector('#fsp-s5 form.fpform button[type=submit]').click());await p.waitForTimeout(250);
 ok(await p.evaluate(()=>{const x=fac.provas.find(y=>y.name==="HMEC D2");return x&&provaDids(x).join()==="d1,d3"&&semDiscs("s6").some(d=>provaHas(x,d.id))}),name+": a prova vai para o semestre escolhido, não para o da pasta onde estava o formulário");
 /* 3. semestre sem disciplina e semestre arquivado */
 await click('#fpgNew');await p.selectOption('#fpsem-g','s7');await p.waitForTimeout(120);
 ok(await p.evaluate(()=>/ainda não tem/.test(document.querySelector('#facProvas .fpnone2').textContent)&&!document.querySelector('#fpn-g')),name+": semestre sem disciplina avisa e não deixa criar");
 await p.selectOption('#fpsem-g','s4');await p.waitForTimeout(120);
 await p.fill('#fpn-g','Prova antiga');await p.fill('#fpd-g',await p.evaluate(()=>fromNum(dnum(today())+9)));await p.dispatchEvent('#fpd-g','input');
 await p.evaluate(()=>document.querySelector('#facProvas form.fpform button[type=submit]').click());await p.waitForTimeout(200);
 ok(await p.evaluate(()=>{const x=fac.provas.find(y=>y.name==="Prova antiga");return x&&x.discId==="a4"&&facShowArch}),name+": semestre arquivado também aceita prova (e passa a aparecer)");
 /* 4. + Prova da disciplina já vem com semestre e disciplina */
 await p.evaluate(()=>{facProvNew=false;facOpenSem.add("s6");facOpenDisc.add("d3");render()});await p.waitForTimeout(100);
 await p.evaluate(()=>{[...document.querySelectorAll('#fd-d3 .fdtools button')].find(b=>b.textContent==="+ Prova").click()});await p.waitForTimeout(250);
 ok(await p.evaluate(()=>document.querySelector('#fpsem-s6').value==="s6"&&document.querySelector('#fpdisc-s6-d3').getAttribute('aria-pressed')==='true'&&document.querySelector('#fpdisc-s6-d1').getAttribute('aria-pressed')==='false'),name+": + Prova da disciplina já escolhe o semestre e a disciplina");
 await noScroll("dentro do semestre");if(name==="fone")await p.screenshot({path:`t78-sem-${name}.png`});
 /* 5. dados válidos */
 ok(await p.evaluate(()=>fac.provas.every(x=>x.discId&&Array.isArray(x.items)&&(!x.discIds||x.discIds.length>1))&&JSON.stringify(fac).indexOf("undefined")<0),name+": provas gravadas com dados válidos");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
