// t120: "Exportar um cartão de teste (.apkg)" em Cartões › Prontos para o Anki quando nenhum cartão está pronto (≥40 dias):
// gera um .apkg válido com 1 cartão (prefere o mais firme), não tira nada do app (sem cdExp) e funciona até com cartão novo (fator padrão).
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const PY=`import sys,zipfile,sqlite3,tempfile,os,json
z=zipfile.ZipFile(sys.argv[1]);d=tempfile.mkdtemp();p=os.path.join(d,"c.anki2");open(p,"wb").write(z.read("collection.anki2"))
c=sqlite3.connect(p);r=c.execute("select count(*) from notes").fetchone()[0];k=c.execute("select type,queue,ivl,factor from cards").fetchall()
f=c.execute("select flds from notes").fetchone()[0].split("\\x1f")
print(json.dumps({"ic":c.execute("pragma integrity_check").fetchone()[0],"notes":r,"cards":k,"q":f[0]}))`;
(async()=>{const b=await chromium.launch();const errs=[];const pyf=path.join(__dirname,"_t120.py");fs.writeFileSync(pyf,PY);
for(const [name,w,h,mob] of [["fone",390,844,true],["note",1366,900,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const run=async(setup,label,wantQ,wantFactor)=>{
    await p.evaluate(setup);await p.evaluate(()=>{window.__dl=null;downloadsFn={save:async o=>{window.__dl=new Uint8Array(await o.data.arrayBuffer())}};cdTestMsg="";setView("notas");nSeg="revisar";render()});await p.waitForTimeout(300);
    const vis=await p.evaluate(()=>{const b=document.querySelector('#cdApkgTest');if(b)b.scrollIntoView({block:"center"});return !!b&&!document.querySelector('#cdApkg')});
    ok(vis,name+": "+label+" · link de teste aparece (sem o botão normal, nada pronto)");
    await (mob?p.tap('#cdApkgTest'):p.click('#cdApkgTest'));await p.waitForFunction(()=>window.__dl,null,{timeout:8000});await p.waitForTimeout(150);
    const R=await p.evaluate(()=>{let s="";const u=window.__dl;for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
      return {b64:btoa(s),n:cards.length,exp:cdExp,msg:document.querySelector('#cdTestMsg')?.textContent||""}});
    const f=path.join(__dirname,`_t120-${name}.apkg`);fs.writeFileSync(f,Buffer.from(R.b64,"base64"));let A={};try{A=JSON.parse(execFileSync("python3",[pyf,f]).toString())}catch(e){A={err:String(e)}}fs.unlinkSync(f);
    ok(A.ic==="ok"&&A.notes===1&&A.cards.length===1&&A.q.includes(wantQ)&&(!wantFactor||(A.cards[0][3]>=1300&&A.cards[0][3]<=3000)),name+": "+label+" · .apkg válido com o cartão certo "+JSON.stringify(A));
    ok(R.exp==null&&/Nada saiu do app/.test(R.msg),name+": "+label+" · nada sai do app "+JSON.stringify({n:R.n,exp:R.exp}));
    return R.n};
  /* só cartões novos: usa um deles, com fator padrão */
  const n1=await run(()=>{cards.length=0;cdAdd("CM-1","Pergunta nova A","R","eu");cdAdd("CM-1","Pergunta nova B","R","eu")},"só novos","Pergunta nova",2500);
  ok(n1===2,name+": continua com os 2 cartões");
  /* com um em revisão (ainda <40 dias): prefere ele */
  await run(()=>{cards.length=0;cdAdd("CM-1","Pergunta nova","R","eu");const r=cdAdd("CM-4","Firme","R","eu");r.f={st:2,s:12,d:5,last:fromNum(dnum(today())-3),reps:3,lapses:0,first:""};r.due=fromNum(dnum(today())+12);cdPut(r)},"um em revisão","Firme");
  await ctx.close()}
fs.unlinkSync(pyf);ok(!errs.length,"sem erros de página "+errs.join(" | "));await b.close()})();
