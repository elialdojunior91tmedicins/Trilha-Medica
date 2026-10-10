// t79: marca Nexus (nome, logo, cores e fontes) nos 6 aparelhos e nos dois temas
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
const man=JSON.parse(fs.readFileSync(__dirname+'/../manifest.webmanifest','utf8'));ok(man.name==="Nexus - Trilha Médica"&&man.short_name==="Nexus","manifest com o nome novo");
ok(/<title>Nexus - Trilha Médica<\/title>/.test(fs.readFileSync(__dirname+'/../index.html','utf8')),"site com o título novo");
for(const name of Object.keys(DEV))for(const scheme of ["light","dark"]){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,colorScheme:scheme,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');
 await p.waitForFunction(()=>typeof render==='function'&&synced,null,{polling:100});await p.waitForTimeout(150);
 const r=await p.evaluate(()=>{const h=document.querySelector('h1.brand'),l=h&&h.querySelector('.blogo'),cs=getComputedStyle(document.documentElement),bb=l&&l.getBoundingClientRect(),hb=h&&h.getBoundingClientRect();
   const acts=document.querySelector('#hacts').getBoundingClientRect();
   return {title:document.title,txt:h&&h.textContent,lw:bb&&bb.width,inView:bb&&bb.left>=0&&bb.right<=innerWidth,overlap:hb&&document.querySelector('.bname').getBoundingClientRect().right>acts.left&&hb.top<acts.bottom,
     acc:cs.getPropertyValue('--accent').trim(),bg:cs.getPropertyValue('--bg').trim(),disp:cs.getPropertyValue('--display'),scroll:document.documentElement.scrollWidth<=innerWidth}});
 ok(r.title==="Nexus - Trilha Médica"&&r.txt==="Nexus - Trilha Médica",`${name}/${scheme}: nome no título e no cabeçalho`);
 ok(r.lw>=50&&r.inView,`${name}/${scheme}: logo visível (${Math.round(r.lw)}px)`);
 ok(!r.overlap,`${name}/${scheme}: nome não encosta nos botões do topo`);
 ok(scheme==="light"?(r.acc==="#16264a"&&r.bg==="#f3f0e9"):(r.acc==="#cfab63"&&r.bg==="#0a1121"),`${name}/${scheme}: paleta Nexus (${r.acc} sobre ${r.bg})`);
 ok(/Cormorant Garamond/.test(r.disp),`${name}/${scheme}: títulos em Cormorant Garamond`);
 ok(r.scroll,`${name}/${scheme}: sem rolagem lateral`);
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
