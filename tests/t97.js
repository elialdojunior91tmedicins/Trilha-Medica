// t97: Foco › "Nas últimas 12 semanas" no fim da aba, largura inteira em 2 colunas, minutos em cada dia, total da semana e legenda com minutos
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],ipad820:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],full:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(()=>{const t=dnum(today()),ws=foWeekStart(),S=(n,min)=>({id:"x"+n+"_"+min,d:fromNum(n),s:new Date(fromNum(n)+"T15:00:00").toISOString(),sec:min*60,m:"p",ref:"",lab:""});
   foSess=[S(t-7,50),S(ws-7,40),S(ws-14,100),S(t,20)];ui.prefs.hgoal=630;ui.prefs.wday=[180,180,180,180,180,180,180];ui.prefs.wplans={};saveUI();commit();backStack=[];setView("foco")});await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{const c=document.querySelector('#foBody .foheat'),kids=[...document.querySelector('#foBody').children].filter(x=>x.offsetParent);
   const last=[...document.querySelectorAll('#foBody .card')].filter(x=>x.offsetParent).sort((a,b)=>b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom)[0];
   const em=c.querySelector('.fohm > i.l4 em, .fohm > i.l1 em');
   return {last:last===c,w:Math.round(c.getBoundingClientRect().width),bw:Math.round(document.querySelector('#foBody').getBoundingClientRect().width),em:em?getComputedStyle(em).display:"",
     days:c.querySelectorAll('.fohm > i').length,wk:[...c.querySelectorAll('.fohwt b')].map(x=>x.textContent),leg:[...c.querySelectorAll('.fohli')].map(x=>x.textContent),st:c.querySelector('.fohstats').textContent,title:c.querySelector('h2').textContent}});
 const wide=["tabDeitado","note","full"].includes(name);
 ok(r.last&&r.title==="Nas últimas 12 semanas",name+": o cartão fica no fim da aba");
 ok(wide?r.w>=r.bw-2:true,name+": em duas colunas ocupa a largura toda "+r.w+"/"+r.bw);
 ok(r.w>=640?r.em==="block":r.em==="none",name+(r.w>=640?": minutos escritos dentro de cada dia":": no celular, só as cores (sem texto nos quadradinhos)"));
 ok(r.days===84&&r.wk.length===12&&r.wk[11]==="20"&&r.wk[10]==="1h30",name+": 84 dias e total de cada semana "+r.wk.slice(9).join(","));
 ok(r.leg.length===5&&/menos de 30 min/.test(r.leg[1])&&/30 min a 1h00/.test(r.leg[2])&&/1h30 ou mais \(meta\)/.test(r.leg[4]),name+": legenda diz os minutos de cada tom "+r.leg.join(" | "));
 ok(/Esta semana/.test(r.st)&&/que a anterior até/.test(r.st)&&/Melhor semana/.test(r.st),name+": resumo compara com a semana anterior até o mesmo dia");
 if(name==="fone"||name==="note")await p.evaluate(()=>document.querySelector('.foheat').scrollIntoView({block:"start"})),await p.waitForTimeout(150),await p.screenshot({path:`t97-${name}.png`});
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
