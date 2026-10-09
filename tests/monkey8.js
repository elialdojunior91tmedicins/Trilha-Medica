// teste aleatório em todos os aparelhos, com peso maior na aba Erros
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');
const seed=+process.argv[2]||1,N=+process.argv[3]||220,only=process.argv[4];let r=seed;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647};
const DEV={fone:[390,844,true,"dark"],ipad578:[578,820,true,"light"],tabEmPe:[820,1180,true,"light"],tabDeitado:[1180,820,true,"dark"],note:[1366,768,false,"light"],monitor:[1920,1080,false,"dark"]};
(async()=>{const b=await chromium.launch();const errs=new Set(),probs=[];
for(const [name,[w,h,mob,theme]] of Object.entries(DEV)){if(only&&only!==name)continue;
 const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,colorScheme:theme,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,x=>x.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.add(name+": "+e.message.slice(0,160)));p.on('console',m=>{if(m.type()==="error"&&!/net::|Failed to load|ERR_/.test(m.text()))errs.add(name+" console: "+m.text().slice(0,160))});
 await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&sampleFn,null,{polling:100});
 await p.evaluate(()=>{let c=0;sampleFn.json=async(input)=>{await new Promise(r=>setTimeout(r,30));const m=input.match(/simulado com (\d+)|Crie (\d+)/);const n=m?+(m[1]||m[2]):3;
     if(/cartões de memorização/.test(input))return [{pergunta:"P?",resposta:"R"}];
     return Array.from({length:n},()=>({enunciado:"Q"+(++c),alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"},{letra:"C",texto:"c"}],correta:"B",comentario:"x",conceito:"k",alerta:""}))};
   downloadsFn.save=async()=>{};
   const D=n=>fromNum(dnum(today())+n);["CM-37","CM-34","CM-6","CIR-55","PED-96","CM-1","CM-4"].forEach((k,i)=>{if(BYKEY[k])state[k]={l:1+i%3,last:D(-i-1),step:i%3,qt:10+i*3,qc:4+i,qd:{[D(-i-1)]:[5,2],[D(-40-i)]:[5+i*3,2+i]}}});
   const C=Object.values(ECAUSES).flat();
   for(let i=0;i<24;i++){const k=ALL[(i*7)%ALL.length].key,t=Object.keys(ETYPES)[i%3];errors.push({id:"m"+i,k,t,c:i%2?ECAUSES[t][i%ECAUSES[t].length]:undefined,w:"Errei "+i+" — texto longo ".repeat(i%4+1),r:"Correto "+i,s:["ENARE","USP","",""][i%4],d:D(-i*3),rev:i%3,lastRev:D(-i),box:i%5,due:D((i%7)-3),miss:i%4===0?2:0,...(i%9===0?{arch:D(-1)}:{})})}
   errors.forEach(e=>{if(e.c===undefined)delete e.c});notes["CM-1"]="## Resumo\n- a\n> pegadinha\n## Meus erros\n- x";
   const D2=n=>fromNum(dnum(today())+n);fac={sems:[{id:"s",name:"6",archived:false}],discs:[{id:"d",semId:"s",name:"NCS 6",items:["T:CM-1"],info:{},links:[{id:"l",u:"https://x.com/a",t:"A"}],eixos:[{id:"e1",name:"Eixo",area:"CM",spec:"Cardiologia"}],sps:[{id:"sp1",name:"SP 1",eixoId:"e1",items:["T:CM-4","O:c"],objs:["obj"]}]}],provas:[{id:"p1",discId:"d",name:"P1",date:D2(6),items:["T:CM-1","T:CM-4","O:c"],done:[]},{id:"p0",discId:"d",name:"P0",date:D2(-3),items:["T:CM-1"],done:[]}],own:{c:{t:"Coisa da fac",discId:"d",spId:"sp1"}}};saveFac();facOpenSem.add("s");facOpenDisc.add("d");facOpenSP.add("sp1");
   redo=[{id:"r1",k:"CM-1",d:today(),n:1,q:{enunciado:"E",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",conceito:"c",comentario:"m",alerta:""}}];commit()});
 const views=["quest","foco","foco","foco","inicio","temas","notas","erros","fac","mais"];
 for(let i=0;i<N;i++){
   if(rnd()<0.09){const v=views[Math.floor(rnd()*views.length)];await p.evaluate(v=>{backStack=[];setView(v)},v);continue}
   if(rnd()<0.04){await p.evaluate(s=>{if(typeof setQSeg==="function")setQSeg(s)},["resumo","praticar","temas"][Math.floor(rnd()*3)]);continue}
   const els=await p.$$('.wrap button:visible, .wrap select:visible, .wrap input[type=checkbox]:visible, .wrap textarea:visible, .wrap input[type=search]:visible, .wrap input[type=text]:visible, .appnav button:visible, .fopill:visible, .bulkbar button:visible, .smodal button:visible');
   if(!els.length)continue;const e=els[Math.floor(rnd()*els.length)];
   const tag=await e.evaluate(x=>x.tagName+(x.textContent||"").slice(0,30)).catch(()=>"");
   if(/Voltar tudo ao padrão|Apagar|Restaurar|Sair|Excluir conta|Desfazer troca|Importar|Zerar/.test(tag))continue;
   try{const t=await e.evaluate(x=>x.tagName+":"+(x.type||""));
     if(t.startsWith("SELECT")){const opts=await e.$$eval('option',o=>o.map(x=>x.value));if(opts.length)await e.selectOption(opts[Math.floor(rnd()*opts.length)],{timeout:800})}
     else if(/TEXTAREA|INPUT:(search|text)/.test(t))await e.fill(["sepse","hipert","x","Texto de teste com acento é ç","",""][Math.floor(rnd()*6)],{timeout:800});
     else if(mob)await e.tap({timeout:800});else await e.click({timeout:800})}catch(x){}
   if(i%15===0){const ov=await p.evaluate(()=>{const o=document.documentElement.scrollWidth-innerWidth;let bad=[];if(o>0)document.querySelectorAll('.wrap *').forEach(x=>{const r=x.getBoundingClientRect();if(r.width&&r.right>innerWidth+1&&!x.closest('[style*=overflow],.tbl,.mdview table,pre'))bad.push((x.className||x.tagName)+"")});return {o,v:view,bad:[...new Set(bad)].slice(0,4)}});
     if(ov.o>0)probs.push(`${name}: rolagem lateral ${ov.o}px em ${ov.v} (${ov.bad.join(",")})`);
     const nanTxt=await p.evaluate(()=>{const t=document.body.innerText;return /NaN|undefined|\[object Object\]|Invalid Date/.exec(t)?.[0]||""});if(nanTxt)probs.push(`${name}: texto "${nanTxt}" em ${await p.evaluate(()=>view)}`);
     await p.evaluate(()=>{if(foRun){foRun.t0-=60000*30;foTick()}})}
 }
 await ctx.close()}
console.log(`seed ${seed}: problemas: ${probs.length?[...new Set(probs)].join("\n  "):"nenhum"}`);console.log("erros distintos:",errs.size,[...errs].join("\n  "));await b.close()})();
