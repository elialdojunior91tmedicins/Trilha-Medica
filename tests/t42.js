const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
await p.evaluate(()=>{localStorage.clear();state={};hist={};fac={sems:[],discs:[],provas:[],own:{}};saveFac();commit()});
// 1) marcar e desmarcar no mesmo dia
const r1=await p.evaluate(()=>{const it=BYKEY["CM-6"];const e0=(hist[today()]||{}).e||0;toggleSub(it,subList(it)[0]);const mid={last:get("CM-6").last,e:(hist[today()]||{}).e};toggleSub(it,subList(it)[0]);const s=get("CM-6");return {mid,last:s.last||null,l:s.l||0,pre:!!s.pre,e:(hist[today()]||{}).e||0,e0}});
ok(r1.mid.last&&!r1.last&&r1.l===0&&!r1.pre&&r1.e===r1.e0,"marcar e desmarcar no mesmo dia desfaz o estudo: "+JSON.stringify(r1));
// estudo anterior não é desfeito
const r2=await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state["CM-7"]={l:1,last:D(-3),step:1,sd:[0],sv:2};const it=BYKEY["CM-7"];toggleSub(it,subList(it)[0]);const s=get("CM-7");return {last:s.last,l:s.l}});
ok(r2.last&&r2.l===1,"desmarcar tema estudado em outro dia não apaga o estudo: "+JSON.stringify(r2));
// dois subtópicos: desmarcar um mantém
const r3=await p.evaluate(()=>{const it=BYKEY["CM-8"];toggleSub(it,subList(it)[0]);toggleSub(it,subList(it)[1]);toggleSub(it,subList(it)[0]);return !!get("CM-8").last});
ok(r3,"desmarcar um de dois subtópicos mantém o estudo");
// 2) Não estudei na revisão
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state["CM-9"]={l:1,last:D(-2),step:0,sd:[0,1],sv:2,qt:5,qc:3};commit();setView("inicio")});await p.waitForTimeout(200);
const card=p.locator('#viewInicio .rcard',{hasText:BYKEY_T="x"}).first();
const txt=await p.evaluate(()=>BYKEY["CM-9"].t);
await p.locator('#viewInicio .rcard',{hasText:txt}).locator('.psum').tap();await p.waitForTimeout(150);await p.locator('#viewInicio .rcard',{hasText:txt}).locator('button:has-text("Não estudei")').tap();await p.waitForTimeout(150);
await p.locator('#viewInicio .rcard',{hasText:txt}).locator('button:has-text("Toque de novo")').tap();await p.waitForTimeout(200);
const r4=await p.evaluate(()=>{const s=get("CM-9");return {last:s.last||null,l:s.l,sd:s.sd||null,qt:s.qt,due:isDue(s),card:[...document.querySelectorAll('#viewInicio .rcard .ptitle')].some(x=>x.textContent===BYKEY["CM-9"].t)}});
ok(!r4.last&&r4.l===0&&!r4.sd&&r4.qt===5&&!r4.due&&!r4.card,"Não estudei tira da revisão e mantém questões: "+JSON.stringify(r4));
// nível Não iniciado também
const r5=await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state["CM-10"]={l:1,last:D(-2),step:0};openTopic("CM-10");const b=[...document.querySelectorAll('#t-CM-10 .seg button')].find(x=>x.textContent==="Não iniciado");b.click();const s=get("CM-10");return {last:s.last||null,due:isDue(s)}});
ok(!r5.last&&!r5.due,"nível Não iniciado cancela a revisão");
// 3) véspera só com o estudado
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state={};state["CM-37"]={l:1,last:D(-1),step:0};fac={sems:[{id:"s",name:"6°",archived:false}],discs:[{id:"d",semId:"s",name:"NCS 6",items:["T:CM-37","T:CM-34","T:CM-35"],info:{},eixos:[],sps:[]}],provas:[{id:"p",discId:"d",name:"Prova 1",date:D(2),items:["T:CM-37","T:CM-34","T:CM-35"],done:[]}],own:{}};saveFac();commit();setView("inicio")});await p.waitForTimeout(200);
const v=await p.evaluate(()=>{const c=document.querySelector('#viewInicio .vcard');return c&&{n:c.querySelectorAll('.psubs li').length,txt:c.textContent}});
ok(v&&v.n===1&&/2 conteúdos ainda não estudados/.test(v.txt)&&!/ainda pendente/.test(v.txt),"véspera mostra só o já estudado e avisa o resto: "+(v&&v.n));
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
