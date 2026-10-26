if(window.__noShuffle===undefined)window.__noShuffle=true;// testes antigos escolhem a alternativa pela posição
try{if(!window.__wantOnb&&!localStorage.getItem("resid-onb-seen"))localStorage.setItem("resid-onb-seen","1")}catch(e){}
/* Firebase falso para testes: mesma interface "compat" usada pelo site */
(function(){
const DB=()=>JSON.parse(localStorage.getItem("__fbdb")||"{}"),SAVE=d=>localStorage.setItem("__fbdb",JSON.stringify(d));
const USERS=()=>JSON.parse(localStorage.getItem("__fbusers")||"{}");
const wait=()=>new Promise(r=>setTimeout(r,15));
let cur=JSON.parse(localStorage.getItem("__fbcur")||"null");
const err=c=>{const e=new Error(c);e.code=c;return e};
const withProv=u=>u&&Object.assign({},u,{providerData:(USERS()[u.email]||{}).prov||[]});
const authObj={get currentUser(){return cur&&Object.assign(withProv(cur),{linkWithCredential:async c=>{await wait();const us=USERS();const r=us[cur.email];if((r.prov||[]).some(p=>p.providerId==="password"))throw err("auth/provider-already-linked");r.p=c.pw;r.prov=[...(r.prov||[]),{providerId:"password"}];localStorage.setItem("__fbusers",JSON.stringify(us))}})},
 onAuthStateChanged(cb){setTimeout(()=>cb(withProv(cur)),20);return()=>{}},
 async signInWithPopup(){await wait();if(window.__popupFail)throw err(window.__popupFail);const e=window.__googleEmail||"g@gmail.com";const us=USERS();if(us[e]&&!(us[e].prov||[]).some(p=>p.providerId==="google.com")){us[e].prov=[...(us[e].prov||[]),{providerId:"google.com"}]}if(!us[e])us[e]={uid:"uid_g"+Object.keys(us).length,p:null,prov:[{providerId:"google.com"}]};localStorage.setItem("__fbusers",JSON.stringify(us));cur={uid:us[e].uid,email:e};localStorage.setItem("__fbcur",JSON.stringify(cur));return {user:cur}},
 async signInWithEmailAndPassword(e,p){await wait();const u=USERS()[e];if(!u||!u.p||u.p!==p)throw err("auth/invalid-credential");cur={uid:u.uid,email:e};localStorage.setItem("__fbcur",JSON.stringify(cur));return {user:cur}},
 async createUserWithEmailAndPassword(e,p){await wait();if(!/@/.test(e))throw err("auth/invalid-email");if(p.length<6)throw err("auth/weak-password");const us=USERS();if(us[e])throw err("auth/email-already-in-use");us[e]={uid:"uid_"+Object.keys(us).length,p,prov:[{providerId:"password"}]};localStorage.setItem("__fbusers",JSON.stringify(us));cur={uid:us[e].uid,email:e};localStorage.setItem("__fbcur",JSON.stringify(cur));return {user:cur}},
 async signOut(){cur=null;localStorage.removeItem("__fbcur")},
 async sendPasswordResetEmail(e){await wait();window.__resetSent=e}};
/* onSnapshot: as gravações desta página avisam na hora (hasPendingWrites); outra página (outro "aparelho") avisa pelo evento storage */
const subs=[];const inCol=(path,k)=>k.startsWith(path+"/")&&!k.slice(path.length+1).includes("/");
const dsnap=(path,pp,db)=>{db=db||DB();const v=db[path];return {exists:!!v,id:path.split("/").pop(),data:()=>v?JSON.parse(JSON.stringify(v)):undefined,metadata:{fromCache:false,hasPendingWrites:pp===path}}};
const qsnap=(path,pp)=>{const db=DB();const docs=Object.keys(db).filter(k=>inCol(path,k)).map(k=>dsnap(k,pp,db));return {docs,size:docs.length,empty:!docs.length,metadata:{fromCache:false,hasPendingWrites:!!pp&&inCol(path,pp)},docChanges:()=>[]}};
/* docChanges como o Firestore: só o que mudou desde a última resposta desta assinatura */
const fire=(s,pp)=>setTimeout(()=>{if(!s.col)return s.next(dsnap(s.path,pp));const q=qsnap(s.path,pp),db=DB(),now={},ch=[];
  q.docs.forEach(d=>{const j=JSON.stringify(db[s.path+"/"+d.id]);now[d.id]=j;if(!s.last||s.last[d.id]!==j)ch.push({type:s.last&&d.id in s.last?"modified":"added",doc:d})});
  if(s.last)for(const id in s.last)if(!(id in now))ch.push({type:"removed",doc:{id}});s.last=now;q.docChanges=()=>ch;s.next(q)},0);
const notify=changed=>subs.forEach(s=>{if(s.col?inCol(s.path,changed):s.path===changed)fire(s,changed)});
window.addEventListener("storage",e=>{if(e.key==="__fbdb"){window.__remoteHits=(window.__remoteHits||0)+1;subs.forEach(s=>fire(s,null))}});
const listen=(path,col)=>(next,error,e2)=>{if(next&&typeof next==="object"){next=error;error=e2}/* (opções, próximo, erro), como o Firestore */const s={path,col,next};subs.push(s);fire(s,null);return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1)}};
const docRef=path=>({id:path.split("/").pop(),onSnapshot:listen(path,false),
 async get(){await wait();const v=DB()[path];return {exists:!!v,id:path.split("/").pop(),data:()=>v?JSON.parse(JSON.stringify(v)):undefined}},
 async set(d,opts){if(!cur){await wait();throw err("permission-denied")}const bad=(v,inArr)=>{if(v===undefined)return true;if(Array.isArray(v)){if(inArr)return true;return v.some(x=>bad(x,true))}if(v&&typeof v==="object")return Object.values(v).some(x=>bad(x,false));return typeof v==="number"&&!isFinite(v)};if(bad(d,false)){window.__fbInvalid=(window.__fbInvalid||0)+1;throw err("invalid-argument")}const s=JSON.stringify(d);const db=DB();const v=JSON.parse(s);
  /* set(dados,{merge:true}) como o Firestore: junta mapas por dentro; FieldValue.delete() apaga o campo */
  if(opts&&opts.merge){const mg=(t,o)=>{for(const k in o){const x=o[k];if(x&&x.__del)delete t[k];else if(x&&typeof x==="object"&&!Array.isArray(x)){if(!t[k]||typeof t[k]!=="object"||Array.isArray(t[k]))t[k]={};mg(t[k],x)}else t[k]=x}return t};db[path]=mg(db[path]||{},v);window.__fbMerges=(window.__fbMerges||0)+1}
  else db[path]=v;SAVE(db);notify(path);await wait()},
 async delete(){const db=DB();delete db[path];SAVE(db);notify(path);await wait()},
 collection:n=>colRef(path+"/"+n)});
const colRef=path=>({doc:id=>docRef(path+"/"+id),onSnapshot:listen(path,true),async get(){await wait();const db=DB();const docs=Object.keys(db).filter(k=>k.startsWith(path+"/")&&!k.slice(path.length+1).includes("/")).map(k=>({id:k.split("/").pop(),exists:true,data:()=>JSON.parse(JSON.stringify(db[k]))}));return {docs,size:docs.length,empty:!docs.length}}});
const fsObj={enablePersistence:()=>Promise.resolve(),doc:docRef,collection:colRef,terminate:async()=>{},clearPersistence:async()=>{window.__cleared=true}};
const authFn=()=>authObj;authFn.GoogleAuthProvider=function(){};authFn.EmailAuthProvider={credential:(email,pw)=>({email,pw})};
const fsFn=()=>fsObj;fsFn.FieldValue={delete:()=>({__del:1})};
window.firebase={initializeApp:c=>{window.__fbcfg=c;return{}},auth:authFn,firestore:fsFn};
})();
