// t107: gabarito lido errado — "Incorreta – A deficiência…" não vira resposta A; "Justificativa D (correta)" dá a letra;
// questão salva com comentário que contradiz o gabarito ganha selo, filtro Conferir e aviso na prova.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["fone",390,844,true],["note",1366,768,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});
  const K=await p.evaluate(()=>{const T={
    a:"Questão 3\nJustificativa A – Incorreta – A deficiência de Fator XII não provoca sangramento.\nJustificativa D (correta): A deficiência prolonga o TTPA in vitro.",
    b:"RESPOSTA 3\nAlternativa A: Incorreta: a deficiência não sangra.\nCorreta: D",
    c:"Questão 3 — Gabarito: D\nJustificativa A — Incorreta. A deficiência",
    d:"1-A 2-C 3-D 4-ANULADA 5-B",e:"01. B\n02. C\nQuestão 3: D",f:"1 2 3 4\nA B C D",
    g:"QUESTÃO 7 Resposta correta: letra E. Comentário…",h:"3 - A deficiência de fator XII é benigna"};
    const o={};for(const k in T)o[k]=parseKey(T[k]);return o});
  ok(K.a[3]==="D"&&K.b[3]==="D"&&K.c[3]==="D",name+": \"Incorreta – A …\" não vira A; a justificativa (correta) ou o Correta: D vencem "+JSON.stringify([K.a,K.b,K.c]));
  ok(K.d[1]==="A"&&K.d[3]==="D"&&K.d[4]==="X"&&K.d[5]==="B"&&K.e[1]==="B"&&K.e[3]==="D"&&K.f[4]==="D"&&K.g[7]==="E",name+": formatos antigos continuam "+JSON.stringify([K.d,K.e,K.f,K.g]));
  ok(!K.h[3],name+": número seguido de frase com artigo \"A\" não é gabarito "+JSON.stringify(K.h));
  /* prova já salva com o gabarito errado */
  await p.evaluate(()=>{const alts=[{letra:"A",texto:"Repor fator XII",porque:""},{letra:"B",texto:"Anticoagulante lúpico",porque:"Incorreta. O teste de mistura corrigiu."},{letra:"D",texto:"Operar sem repor",porque:"Correta. A deficiência do fator XII não sangra."}];
    const ex=exClean({id:"exk",name:"Simulado-Coagulopatias",banca:"",ano:"",at:new Date().toISOString(),qs:[{n:3,p:1,pe:1,k:"CM-12",q:{enunciado:"Homem de 48 anos com TTPA prolongado e fator XII 8%. Conduta?",alternativas:alts,correta:"A",comentario:"Incorreta. A deficiência de fator XII não provoca sangramento.",conceito:""},g:"b",an:false,im:false,ck:"A"}]});
    exams=[ex];exSaveLocal();exEdit={id:"exk",flt:"chk",show:12,T:null};backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");render()});
  await p.waitForTimeout(200);
  const r=await p.evaluate(()=>({clash:exClash(exams[0].qs[0]),badge:[...document.querySelectorAll('#exr-exk .exb')].map(x=>x.textContent).join("|"),chk:exFilterOk(exams[0].qs[0],"chk")}));
  ok(r.clash&&/contradiz o gabarito/.test(r.badge)&&r.chk,name+": selo e filtro Conferir na questão em conflito "+JSON.stringify(r));
  await p.evaluate(()=>{const P=exPg("exk");P.mode="e";P.a={0:{l:"D",d:today(),s:30}};exRun={id:"exk",view:"q",i:0,shown:Date.now(),cad:{}};exEdit=null;render()});await p.waitForTimeout(150);
  const note=await p.evaluate(()=>[...document.querySelectorAll('.exqc .pnote')].map(x=>x.textContent).join("|"));
  ok(/contradiz o gabarito A: ele diz que a certa é a D/.test(note),name+": aviso na questão aponta a D "+note.slice(0,120));
  /* sem conflito: nada */
  ok(await p.evaluate(()=>{const q=JSON.parse(JSON.stringify(exams[0].qs[0]));q.q.correta="D";q.q.comentario="A deficiência não sangra.";q.q.alternativas[2].porque="";q.q.alternativas[0].porque="Incorreta. Não precisa repor.";return !exClash(q)}),name+": questão coerente não ganha aviso");
  await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
