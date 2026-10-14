// t87: backup diário no Google Drive (tools/backup-drive.gs) — roda o script do Apps Script num Firestore/Drive falsos
// montados com os dados de verdade gravados pelo site, compara com o "Exportar backup" do app e restaura numa conta nova.
const {chromium}=require('playwright');const fs=require('fs');const vm=require('vm');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const fake=fs.readFileSync(__dirname+'/fakefb.js','utf8');
const GS=fs.readFileSync(__dirname+'/../tools/backup-drive.gs','utf8');
const CFG='window.FIREBASE_CONFIG={apiKey:"AIzaTESTE",authDomain:"x.firebaseapp.com",projectId:"trilha-medica",storageBucket:"",messagingSenderId:"1",appId:"1:1:web:1"};';
const URL0='http://localhost:8765/';
async function ctxFor(b,uid,email){const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:1366,height:900}});
  await ctx.addInitScript(([uid,email])=>{try{localStorage.setItem('resid-onb-seen','1');if(!sessionStorage.__u){const us=JSON.parse(localStorage.getItem("__fbusers")||"{}");us[email]={uid,p:"segredo123",prov:[{providerId:"password"}]};localStorage.setItem("__fbusers",JSON.stringify(us));localStorage.setItem("__fbcur",JSON.stringify({uid,email}));sessionStorage.__u=1}}catch(e){}},[uid,email]);
  await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
  await ctx.route(/www\.gstatic\.com\/firebasejs\//,r=>r.fulfill({contentType:'text/javascript',body:'/* ok */'}));
  await ctx.route(/www\.gstatic\.com\/firebasejs\/.*app-compat/,r=>r.fulfill({contentType:'text/javascript',body:fake}));
  await ctx.route(/config\.js/,r=>r.fulfill({contentType:'text/javascript',body:CFG}));return ctx}
const boot=async p=>{await p.goto(URL0);await p.waitForFunction(()=>typeof saveFac==='function'&&window.__site&&synced&&notesStore,null,{polling:100,timeout:60000});await p.waitForTimeout(400)};
const navTo=async(p,act)=>{await p.evaluate(()=>window.__navMark=1);await act();await p.waitForFunction(()=>!window.__navMark,null,{timeout:90000,polling:100})};
const importInto=async(p,text)=>{await p.evaluate(t=>__site.importFlow(t),text);await p.waitForTimeout(300);await navTo(p,()=>p.click('.smodal button:has-text("Importar")'));await boot(p)};
// JSON com chaves em ordem, para comparar
const norm=v=>JSON.stringify(v,(k,x)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.keys(x).sort().reduce((o,k)=>(o[k]=x[k],o),{}):x);

/* ---------- Firestore REST e Drive falsos ---------- */
function enc(v){if(v===null||v===undefined)return {nullValue:null};if(typeof v==="string")return {stringValue:v};if(typeof v==="boolean")return {booleanValue:v};
  if(typeof v==="number")return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};if(Array.isArray(v))return {arrayValue:v.length?{values:v.map(enc)}:{}};
  const f={};for(const k in v)f[k]=enc(v[k]);return {mapValue:Object.keys(f).length?{fields:f}:{}}}
function mkGoogle(db){const FSB="https://firestore.googleapis.com/v1/projects/trilha-medica/databases/(default)/documents/";
  const drive={files:{},n:0};const log=[];const PAGE=3;// página pequena para exercitar a paginação
  const res=(c,o)=>({getResponseCode:()=>c,getContentText:()=>o==null?"":JSON.stringify(o)});
  const fetch=(url,o)=>{o=o||{};const m=(o.method||"get").toLowerCase();log.push(m+" "+url.split("?")[0]);
    if(!/^Bearer tok$/.test(o.headers.Authorization)||o.headers["X-Goog-User-Project"]!=="trilha-medica")return res(401,{error:"sem token"});
    if(url.startsWith(FSB)){const [p,qs]=url.slice(FSB.length).split("?");
      if(m==="post"&&p==="data/users:listCollectionIds"){const ids=[...new Set(Object.keys(db).filter(k=>k.startsWith("data/users/")).map(k=>k.split("/")[2]))];return res(200,{collectionIds:ids})}
      if(m!=="get")return res(400,{error:"só leitura"});
      const segs=p.split("/").length;
      if(segs%2===0){const v=db[p];if(!v)return res(404,{error:"not found"});return res(200,{name:"projects/x/databases/(default)/documents/"+p,fields:enc(v).mapValue.fields||{}})}
      const all=Object.keys(db).filter(k=>k.startsWith(p+"/")&&k.split("/").length===segs+1).sort();
      const q=new URLSearchParams(qs||"");const st=+(q.get("pageToken")||0);const page=all.slice(st,st+PAGE);
      const r={documents:page.map(k=>({name:"projects/x/databases/(default)/documents/"+k,fields:enc(db[k]).mapValue.fields||{}}))};
      if(!page.length)delete r.documents;if(st+PAGE<all.length)r.nextPageToken=String(st+PAGE);return res(200,r)}
    if(url.startsWith("https://www.googleapis.com/upload/drive/v3/files")){const body=Buffer.from(o.payload).toString("utf8");const b=/boundary=(\S+)/.exec(o.contentType)[1];
      const parts=body.split("--"+b).slice(1,3).map(x=>x.slice(x.indexOf("\r\n\r\n")+4).replace(/\r\n$/,""));const meta=JSON.parse(parts[0]);
      const id="f"+(++drive.n);drive.files[id]={id,name:meta.name,parents:meta.parents,mime:meta.mimeType,text:parts[1],createdTime:new Date(Date.now()+drive.n).toISOString(),trashed:false};return res(200,{id})}
    if(url.startsWith("https://www.googleapis.com/drive/v3/files")){const rest=url.slice("https://www.googleapis.com/drive/v3/files".length);const [p,qs]=rest.split("?");const q=new URLSearchParams(qs||"");
      if(p&&p!=="/"){const f=drive.files[p.slice(1)];if(!f)return res(404,{});if(m==="patch"){Object.assign(f,JSON.parse(o.payload));return res(200,{id:f.id})}return res(200,{id:f.id,trashed:f.trashed})}
      if(m==="post"){const meta=JSON.parse(o.payload);const id="d"+(++drive.n);drive.files[id]={id,name:meta.name,mime:meta.mimeType,parents:[],createdTime:new Date().toISOString(),trashed:false};return res(200,{id})}
      const qq=q.get("q")||"";let L=Object.values(drive.files).filter(f=>!f.trashed);
      const nm=/name='((?:[^'\\]|\\.)*)'/.exec(qq);if(nm)L=L.filter(f=>f.name===nm[1].replace(/\\'/g,"'"));
      const par=/'([^']+)' in parents/.exec(qq);if(par)L=L.filter(f=>(f.parents||[]).includes(par[1]));
      const nc=/name contains '([^']+)'/.exec(qq);if(nc)L=L.filter(f=>f.name.includes(nc[1]));
      if(/folder/.test(qq))L=L.filter(f=>f.mime==="application/vnd.google-apps.folder");
      if(/createdTime desc/.test(q.get("orderBy")||""))L.sort((a,b)=>a.createdTime<b.createdTime?1:-1);
      return res(200,{files:L.map(f=>({id:f.id,name:f.name,createdTime:f.createdTime}))})}
    return res(404,{})};
  const props={};const triggers=[];
  const ctx={UrlFetchApp:{fetch},Logger:{log:x=>log.push("LOG "+x)},Session:{getScriptTimeZone:()=>"America/Fortaleza"},
    Utilities:{formatDate:(d,tz,f)=>d.toISOString().slice(0,10)+"_"+String(drive.n).padStart(4,"0"),newBlob:(s,t)=>({getBytes:()=>Buffer.from(s,"utf8")})},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>{props[k]=v}})},
    ScriptApp:{getOAuthToken:()=>"tok",getProjectTriggers:()=>triggers.slice(),deleteTrigger:t=>triggers.splice(triggers.indexOf(t),1),
      newTrigger:fn=>{const t={fn,getHandlerFunction:()=>fn};const c={timeBased:()=>c,everyDays:n=>{t.days=n;return c},atHour:h=>{t.hour=h;return c},create:()=>{triggers.push(t);return t}};return c}},
    Date,JSON,Object,Array,String,Number,Error,encodeURIComponent,decodeURIComponent,Buffer};
  vm.createContext(ctx);vm.runInContext(GS,ctx);return {ctx,drive,log,triggers,props}}

(async()=>{const b=await chromium.launch();const errs=[];
// 1. conta com dados (backup de exemplo + foco, cartões, anotação livre e preferências)
const BK=JSON.parse(fs.readFileSync(__dirname+'/backup-sample.json','utf8'));const now=new Date().toISOString(),hoje=now.slice(0,10);
BK.data.focus=[{id:"fo1",d:hoje,s:now,sec:1500,m:"p",ref:"T:CM-1",lab:""}];
BK.data.cards=[{id:"cd1",k:"CM-1",q:"Pergunta com acentuação: ç ã é?",a:"Resposta",box:0,due:hoje,n:0,ok:0,src:"u"}];
BK.data.free=[{id:"fr1",t:"Livre",b:"texto “aspas” — travessão",tags:["x"],ks:["CM-1"],at:now}];
let ctx=await ctxFor(b,"uidA","eli@teste.com");let p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await boot(p);
await importInto(p,JSON.stringify(BK));await p.evaluate(()=>{ui.profile.name="Eli";saveUI()});await p.waitForTimeout(2500);
const expected=await p.evaluate(()=>JSON.parse(JSON.stringify(buildBackup().data)));
const db=await p.evaluate(()=>JSON.parse(localStorage.getItem("__fbdb")));
ok(Object.keys(expected.topics).length>=2&&expected.errors.length&&expected.focus.length&&expected.cards.length&&expected.free.length&&Object.keys(expected.notes).length,"conta de teste com temas, erros, anotações, foco, cartões e anotação livre");
ok(Object.keys(db).some(k=>/progress\/topics\//.test(k)),"dados gravados no Firestore falso: "+Object.keys(db).length+" documentos");
await ctx.close();

// 2. roda o script: instalar = liga o gatilho diário e faz o primeiro backup
const G=mkGoogle(db);let out;try{G.ctx.instalar();out=true}catch(e){out=e.message}ok(out===true,"instalar() roda sem erro "+(out===true?"":out));
ok(G.triggers.length===1&&G.triggers[0].fn==="backupDiario"&&G.triggers[0].days===1&&G.triggers[0].hour===3,"gatilho diário às 3h");
G.ctx.instalar();ok(G.triggers.length===1,"instalar de novo não duplica o gatilho");
const folders=Object.values(G.drive.files).filter(f=>f.mime==="application/vnd.google-apps.folder");ok(folders.length===1&&folders[0].name==="Nexus - Trilha Médica (backups)","uma pasta só no Drive");
const files=Object.values(G.drive.files).filter(f=>f.mime==="application/json");ok(files.length===2&&files.every(f=>f.parents[0]===folders[0].id&&/^nexus-backup-.*\.json$/.test(f.name)),"arquivos na pasta: "+files.map(f=>f.name).join(", "));
ok(G.log.some(l=>/LOG Backup diário ligado/.test(l)&&/temas/.test(l)),"mensagem com o resumo");
ok(!G.log.some(l=>/^(post|patch|delete) https:\/\/firestore/.test(l)&&!/listCollectionIds/.test(l)),"Firestore só é lido");
const got=JSON.parse(files[0].text);
ok(got.app==="checklist-residencia"&&got.format===1&&!!got.exportedAt,"formato do backup do app");
const diff=Object.keys(expected).filter(k=>k!=="sort"&&norm(expected[k])!==norm(got.data[k]));
ok(!diff.length,"conteúdo igual ao Exportar backup do app"+(diff.length?" — difere: "+diff.map(k=>k+" app="+norm(expected[k]).slice(0,160)+" script="+norm(got.data[k]).slice(0,160)).join(" | "):""));
ok(/ç ã é/.test(files[0].text)&&/“aspas” — travessão/.test(files[0].text),"acentos e símbolos preservados");

// 3. guarda só as 30 mais novas
for(let i=0;i<31;i++){const id="old"+i;G.drive.files[id]={id,name:"nexus-backup-2020-01-"+String(i).padStart(2,"0")+".json",parents:[folders[0].id],mime:"application/json",text:"{}",createdTime:new Date(Date.UTC(2020,0,1+i)).toISOString(),trashed:false}}
G.ctx.backupAgora();const live=Object.values(G.drive.files).filter(f=>f.mime==="application/json"&&!f.trashed);
ok(live.length===30&&live.filter(f=>!f.id.startsWith("old")).length===3,"guarda as 30 mais novas e manda as antigas para a lixeira ("+live.length+")");
ok(G.drive.files.old0.trashed&&!G.drive.files.old30.trashed,"as mais antigas vão primeiro");
// pasta apagada pelo usuário: cria de novo
G.drive.files[folders[0].id].trashed=true;G.ctx.backupAgora();ok(Object.values(G.drive.files).filter(f=>f.mime==="application/vnd.google-apps.folder"&&!f.trashed).length===1,"pasta apagada é recriada");
// sem token / erro: falha com mensagem (o Google avisa por e-mail)
const G2=mkGoogle({});let e2="";try{G2.ctx.backupAgora()}catch(e){e2=e.message}ok(/Nenhuma conta/.test(e2),"sem conta: erro claro");
const G3=mkGoogle(db);G3.ctx.ScriptApp.getOAuthToken=()=>"x";let e3="";try{G3.ctx.backupAgora()}catch(e){e3=e.message}ok(/401/.test(e3),"erro do Google interrompe com mensagem: "+e3.slice(0,60));
// conta antiga (v2, temas dentro do progress)
const old={...db};const pk=Object.keys(old).find(k=>/\/progress$/.test(k));old[pk]={...old[pk],topics:{"CM-9":{l:1,last:hoje}}};const G4=mkGoogle(old);G4.ctx.backupAgora();
const g4=JSON.parse(Object.values(G4.drive.files).find(f=>f.mime==="application/json").text);ok(g4.data.topics["CM-9"]&&g4.data.topics["CM-1"],"conta antiga: junta os temas do documento e da coleção");

// 4. restaurar numa conta nova pelo Importar backup do site
ctx=await ctxFor(b,"uidB","nova@teste.com");p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await boot(p);
await importInto(p,files[0].text);await p.waitForTimeout(800);
const back=await p.evaluate(()=>JSON.parse(JSON.stringify(buildBackup().data)));
const d2=["topics","notes","errors","fac","focus","cards","free","hist"].filter(k=>norm(expected[k])!==norm(back[k]));
ok(!d2.length,"restaurado numa conta nova fica igual"+(d2.length?" — difere: "+d2.join(","):""));
ok(await p.evaluate(()=>ui.profile.name==="Eli"),"preferências e perfil voltam");
await ctx.close();
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
