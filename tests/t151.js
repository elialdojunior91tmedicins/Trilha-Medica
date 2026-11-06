// t151: abertura (fase 1.5 da divisão em módulos) — abre o app nos 6 tamanhos, com conta vazia e com 6 semanas de uso,
// passa por todas as abas e partes, e falha com QUALQUER erro de página. Rápido: rode a cada mudança de ordem do código.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const S=require('./seed10.js');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true,"dark"],ipad578:[578,820,true,"light"],tabEmPe:[820,1180,true,"light"],tabDeitado:[1180,820,true,"dark"],note:[1366,768,false,"light"],monitor:[1920,1080,false,"dark"]};
const VIEWS=["inicio","temas","fac","quest","notas","stats","foco","erros","mais"];
const QP=["banco","sim","redo","provas","resumo"],NS=["livre","revisar","pegadinhas"];
(async()=>{const b=await chromium.launch();const t0=Date.now();
for(const name of Object.keys(DEV)){const [w,h,mob,theme]=DEV[name];
  for(const cheio of [false,true]){
    const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,colorScheme:theme,screen:name==="ipad578"?{width:1180,height:820}:undefined});
    await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());
    await ctx.addInitScript(mock+";window.__mock({},2);window.__qLegacy=false;");
    const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof render==="function"&&document.querySelector('#iHero')&&document.querySelector('#iHero').firstChild,null,{timeout:15000});
    if(cheio){await p.evaluate(`(${S.toString()})()`);await p.evaluate(`(${S.fac.toString()})()`);await p.evaluate(()=>render())}
    const lab=`${name} · ${cheio?"com dados":"conta vazia"}`;
    const visit=async(fn,arg,what)=>{try{await p.evaluate(fn,arg);await p.waitForTimeout(60)}catch(e){errs.push(what+": "+e.message)}};
    for(const v of VIEWS)await visit(v=>setView(v),v,"aba "+v);
    for(const q of QP)await visit(q=>{setView("quest");qGo(q)},q,"Questões › "+q);
    for(const n of NS)await visit(n=>{setView("notas");typeof setNSeg==="function"?setNSeg(n):(nSeg=n,render())},n,"Caderno › "+n);
    for(const s of ["perfil","config"])await visit(s=>goSub(s),s,s);
    await visit(()=>goHelp&&goHelp("Comece aqui"),null,"ajuda");
    await visit(()=>{setView("temas");openKey=ALL[0].key;render()},null,"tema aberto");
    ok(errs.length===0,`${lab}: abre e passa por ${VIEWS.length} abas, ${QP.length+NS.length} partes, Perfil, Configurações, Ajuda e um tema sem erro${errs.length?" → "+[...new Set(errs)].slice(0,3).join(" | "):""}`);
    await ctx.close()}}
console.log(`(${((Date.now()-t0)/1000).toFixed(0)} s)`);await b.close()})();
