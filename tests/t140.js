// t140: limite de texto do caderno dobrado para 60 mil caracteres — anotação do tema (caixa e saveNote) e página do caderno livre (caixa e frClean).
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:1366,height:900}});
await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
const R=await p.evaluate(()=>{const big="a".repeat(59000)+"\n| x | y |\n| --- | --- |\n| 1 | 2 |\n",over="b".repeat(70000);
  saveNote("CM-1",big);const keep=notes["CM-1"]===big;
  saveNote("CM-1",over);const cut=notes["CM-1"].length;
  const f=frClean({id:"t140",t:"Página",b:over,tags:[],ks:[]});
  return {max:NOTE_MAX,keep,cut,free:f.b.length}});
ok(R.max===60000,"NOTE_MAX = 60 mil ("+R.max+")");
ok(R.keep,"anotação de 59 mil caracteres com tabela é guardada inteira");
ok(R.cut===60000,"anotação acima do limite é cortada em 60 mil ("+R.cut+")");
ok(R.free===60000,"página do caderno livre aceita até 60 mil ("+R.free+")");
const ml=await p.evaluate(()=>{const T=[...document.querySelectorAll("textarea.ntext")].map(t=>t.maxLength).filter(x=>x>0);return T});
ok(!ml.length||ml.every(x=>x===60000),"caixas de texto do caderno com maxlength 60000 ("+ml.join(",")+")");
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));
await b.close()})();
