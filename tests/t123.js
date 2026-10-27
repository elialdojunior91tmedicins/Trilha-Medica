// t123: Lote 18 (1.2, 2º passo) — erros, cartões, foco e Refazer em pacotes (progress/<lista>pk/pN, campo i = {id: JSON}):
// migração da coleção antiga, gravação só do campo do item, item grande fica no documento próprio, outro aparelho, versão antiga, poucas leituras
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const U="data/users/u1/progress/";const t=new Date().toISOString().slice(0,10);
const E=(i,w)=>({id:"e"+i,k:"CM-"+(1+i%9),w:w||("Errei "+i),r:"Certo "+i,t:"conhecimento",s:"",d:t});
const SEED={["data/users/u1/progress"]:{version:3,split:true,hist:{},plan:null}};
for(let i=0;i<30;i++)SEED[U+"errors/e"+i]=E(i);
SEED[U+"errors/eBig"]={...E(1,"x".repeat(70000)),id:"eBig"};
for(let i=0;i<40;i++)SEED[U+"cards/c"+i]={id:"c"+i,k:"CM-1",q:"P "+i+"?",a:"R",src:"eu",due:t,n:0,ok:0,box:0};
for(let i=0;i<25;i++)SEED[U+"focus/f"+i]={id:"f"+i,d:t,s:t+"T1"+(i%10)+":00:00.000Z",sec:1500,m:"p",ref:"T:CM-1",lab:""};
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(seed,name,w,h,mob)=>{const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(mock+`;window.__packs=1;window.__mock(${JSON.stringify(seed)},3);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+": "+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:20000});await p.waitForTimeout(2500);return {ctx,p}};
for(const [name,w,h,mob] of [["note",1366,900,false],["fone",390,844,true]]){
let {ctx,p}=await open(SEED,name,w,h,mob);
let r=await p.evaluate(U=>{const S=window.__store,K=Object.keys(S);return {
  err:errors.length,cd:cards.length,fo:foSess.length,big:errors.some(e=>e.id==="eBig"&&e.w.length===70000),
  oldE:K.filter(k=>k.startsWith(U+"errors/")).map(k=>k.slice(U.length+7)),oldC:K.filter(k=>k.startsWith(U+"cards/")).length,oldF:K.filter(k=>k.startsWith(U+"focus/")).length,
  pkE:K.filter(k=>k.startsWith(U+"errorspk/")).reduce((n,k)=>n+Object.keys(S[k].i||{}).length,0),pkC:K.filter(k=>k.startsWith(U+"cardspk/")).reduce((n,k)=>n+Object.keys(S[k].i||{}).length,0),
  pkF:K.filter(k=>k.startsWith(U+"focuspk/")).reduce((n,k)=>n+Object.keys(S[k].i||{}).length,0),nE:K.filter(k=>k.startsWith(U+"errorspk/")).length,str:typeof Object.values(S[K.find(k=>k.startsWith(U+"errorspk/"))].i)[0]}},U);
ok(r.err===31&&r.cd===40&&r.fo===25&&r.big,name+": a conta antiga (um documento por item) abre com tudo");
ok(r.pkE===30&&r.pkC===40&&r.pkF===25&&r.str==="string",name+": os itens foram para os pacotes (erros "+r.pkE+", cartões "+r.pkC+", foco "+r.pkF+")");
ok(r.oldE.join()==="eBig"&&r.oldC===0&&r.oldF===0,name+": a coleção antiga ficou só com o item grande ("+r.oldE.join()+")");
ok(r.nE<=8,name+": erros em até 8 pacotes ("+r.nE+")");
/* gravar um item muda só o campo dele; apagar tira o campo */
r=await p.evaluate(async U=>{const S=window.__store;const e={id:"eN",k:"CM-2",w:"Novo erro",r:"Certo",t:"conhecimento",s:"",d:today()};errors.push(e);await putErr(e);
  const pk=Object.keys(S).find(k=>k.startsWith(U+"errorspk/")&&S[k].i&&S[k].i.eN),inPk=!!pk,noOld=!S[U+"errors/eN"];
  const x=errors.find(y=>y.id==="e3");x.w="Mudou";await putErr(x);const p3=Object.keys(S).find(k=>k.startsWith(U+"errorspk/")&&S[k].i&&S[k].i.e3);const ch=p3&&JSON.parse(S[p3].i.e3).w==="Mudou";
  await delErr("e5");const gone=!Object.keys(S).some(k=>k.startsWith(U+"errorspk/")&&S[k].i&&S[k].i.e5);
  const W=Object.keys(window.__reads).filter(k=>k.startsWith("w:"));return {inPk,noOld,ch,gone,others:p3&&Object.keys(S[p3].i).length>1}},U);
ok(r.inPk&&r.noOld,name+": erro novo vai para um pacote (não cria documento próprio)");
ok(r.ch&&r.others,name+": mudar um erro troca só o campo dele (o pacote mantém os outros)");
ok(r.gone,name+": apagar tira o campo do pacote");
/* cartões: avaliação grava no pacote; foco idem */
r=await p.evaluate(async U=>{const S=window.__store;const c=cards.find(x=>x.id==="c7");c.n=5;await cdPut(c);const fo={id:"fN",d:today(),s:new Date().toISOString(),sec:600,m:"c",ref:"",lab:""};foSess.unshift(fo);await foPut(fo);
  const f=k=>Object.keys(S).some(p=>p.startsWith(U+k)&&S[p].i&&Object.values(S[p].i).some(j=>/"id":"(c7|fN)"/.test(j)&&(/"n":5/.test(j)||/"id":"fN"/.test(j))));return {c:f("cardspk/"),f:f("focuspk/")}},U);
ok(r.c&&r.f,name+": cartão avaliado e sessão de foco gravados nos pacotes");
/* outro aparelho muda um item do pacote: chega aqui */
await p.evaluate(U=>{const S=window.__store,pk=Object.keys(S).find(k=>k.startsWith(U+"errorspk/")&&S[k].i&&S[k].i.e8),d=JSON.parse(JSON.stringify(S[pk]));
  const e=JSON.parse(d.i.e8);e.w="Do outro aparelho";d.i.e8=JSON.stringify(e);d.i.eR=JSON.stringify({id:"eR",k:"CM-3",w:"Remoto",r:"Certo",t:"conhecimento",s:"",d:today()});window.__remote(pk,d);liveAct=0},U);
await p.waitForTimeout(400);
r=await p.evaluate(()=>({a:(errors.find(e=>e.id==="e8")||{}).w,b:errors.some(e=>e.id==="eR"),n:errors.length}));
ok(r.a==="Do outro aparelho"&&r.b,name+": mudança de outro aparelho num pacote chega ("+r.a+")");
/* versão antiga do app grava na coleção antiga: aparece e vai para o pacote */
await p.evaluate(U=>{window.__remote(U+"errors/eOld",{id:"eOld",k:"CM-4",w:"Versão antiga",r:"Certo",t:"conhecimento",s:"",d:today()});liveAct=0},U);
await p.waitForTimeout(2500);
r=await p.evaluate(U=>({has:errors.some(e=>e.id==="eOld"),old:!!window.__store[U+"errors/eOld"],pk:Object.keys(window.__store).some(k=>k.startsWith(U+"errorspk/")&&window.__store[k].i&&window.__store[k].i.eOld)}),U);
ok(r.has&&!r.old&&r.pk,name+": item gravado por uma versão antiga aparece e vai para o pacote");
/* apagado em outro aparelho (campo some do pacote): some daqui */
await p.evaluate(U=>{const S=window.__store,pk=Object.keys(S).find(k=>k.startsWith(U+"errorspk/")&&S[k].i&&S[k].i.e9),d=JSON.parse(JSON.stringify(S[pk]));delete d.i.e9;window.__remote(pk,d);liveAct=0},U);
await p.waitForTimeout(400);
ok(await p.evaluate(()=>!errors.some(e=>e.id==="e9")),name+": apagado em outro aparelho some daqui");
/* nova abertura: lê poucos documentos */
const seed2=await p.evaluate(()=>JSON.parse(JSON.stringify(window.__store)));await ctx.close();
({ctx,p}=await open(seed2,name+"2",w,h,mob));
r=await p.evaluate(U=>{const R=window.__reads,docs=Object.keys(window.__store).filter(k=>/\/(errorspk|cardspk|focuspk|redopk)\//.test(k)).length;
  return {err:errors.length,cd:cards.length,fo:foSess.length,docs,rep:Object.keys(R).filter(k=>!/^w:|exfig/.test(k)&&R[k]>1)}},U);
ok(r.err===32&&r.cd===40&&r.fo===26,name+": reabrir traz tudo (erros "+r.err+", cartões "+r.cd+", foco "+r.fo+")");
ok(r.docs<=28&&!r.rep.length,name+": "+r.docs+" documentos de pacote no lugar de 96 documentos; cada caminho lido uma vez");
await ctx.close()}
/* backup: exportar e importar continua igual */
{const {ctx,p}=await open(SEED,"bk",1366,900,false);
const r=await p.evaluate(()=>{const B=buildBackup();return {e:B.data.errors.length,c:B.data.cards.length,f:B.data.focus.length}});
ok(r.e===31&&r.c===40&&r.f===25,"backup leva os itens dos pacotes (erros "+r.e+", cartões "+r.c+", foco "+r.f+")");await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
