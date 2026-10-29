window.__mock=(seed,delay)=>{
  if(window.__hour===undefined)window.__hour=10;// Lote 18: o Início muda à noite; os testes antigos rodam "de manhã"
  if(window.__noShuffle===undefined)window.__noShuffle=true;// testes antigos escolhem a alternativa pela posição (correta = B)
  if(window.__noSheet===undefined)window.__noSheet=true;// Lote 20: testes antigos tocam na tela com o painel de filtros aberto (no celular ele vira folha por cima)
  if(window.__noRefCheck===undefined)window.__noRefCheck=true;// testes antigos geram questões sem "fonte" (o artefato real descarta essas)
  try{if(!window.__wantOnb&&!localStorage.getItem("resid-onb-seen"))localStorage.setItem("resid-onb-seen","1")}catch(e){}
  const store=JSON.parse(JSON.stringify(seed||{}));window.__store=store;
  const wait=()=>new Promise(r=>setTimeout(r,delay||0));
  /* onSnapshot: as gravações deste app avisam com hasPendingWrites; window.__remote(caminho, dados|null) imita outro aparelho */
  const subs=[];window.__subs=subs;const R=window.__reads={};const hit=p=>{R[p]=(R[p]||0)+1};// leituras por caminho (get ou nova assinatura)
  const inCol=(path,k)=>k.startsWith(path+"/")&&k.slice(path.length+1).indexOf("/")<0;
  const dsnap=(path,pp)=>{const v=store[path];return {exists:!!v,id:path.split("/").pop(),data:()=>v?JSON.parse(JSON.stringify(v)):undefined,metadata:{fromCache:false,hasPendingWrites:pp===path}}};
  const qsnap=(path,pp)=>{const docs=Object.keys(store).filter(k=>inCol(path,k)).map(k=>dsnap(k,pp));return {docs,size:docs.length,empty:!docs.length,metadata:{fromCache:false,hasPendingWrites:!!pp&&inCol(path,pp)},docChanges:()=>[]}};
  const notify=(changed,own)=>subs.forEach(s=>{if(s.col?inCol(s.path,changed):s.path===changed)setTimeout(()=>s.fn(s.col?qsnap(s.path,own?changed:null):dsnap(s.path,own?changed:null)),0)});
  const listen=(path,col)=>(fn,err)=>{hit(path);const s={path,col,fn};subs.push(s);setTimeout(()=>fn(col?qsnap(path):dsnap(path)),0);return ()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1)}};
  window.__remote=(path,d)=>{if(d==null)delete store[path];else store[path]=JSON.parse(JSON.stringify(d));notify(path,false)};
  const docRef=path=>({path,
    async get(){hit(path);await wait();const v=store[path];return {exists:!!v,id:path.split("/").pop(),data:()=>JSON.parse(JSON.stringify(v))}},
    async set(d){if(window.__failSet&&window.__failSet.test(path)){await wait();const e=new Error("Document exceeds the maximum allowed size of 1,048,576 bytes");e.code="invalid-argument";throw e}// Lote 20: imita gravação recusada
      store[path]=JSON.parse(JSON.stringify(d));notify(path,true);await wait()},// como o Firestore: a gravação vale na hora para este aparelho
    async delete(){delete store[path];notify(path,true);await wait()},
    /* pacotes (Lote 18): o artefato do Claude não tem patch; window.__packs liga aqui para testar os pacotes pelo preview */
    ...(window.__packs?{async patch(f,m){const d=store[path]||{},o=d[f]&&typeof d[f]==="object"?d[f]:{};for(const k in m){if(m[k]===null)delete o[k];else o[k]=JSON.parse(JSON.stringify(m[k]))}d[f]=o;store[path]=d;hit("w:"+path);notify(path,true);await wait()}}:{}),
    onSnapshot:listen(path,false),
    collection:sub=>colRef(path+"/"+sub)});
  const colRef=path=>({path,doc:id=>docRef(path+"/"+id),onSnapshot:listen(path,true),
    async get(){hit(path);await wait();const docs=Object.keys(store).filter(k=>inCol(path,k)).map(k=>({id:k.split("/").pop(),exists:true,data:()=>JSON.parse(JSON.stringify(store[k]))}));return {docs,size:docs.length,empty:!docs.length}}});
  const db={doc:docRef,collection:colRef};
  const user={id:async()=>"u1",isOwner:async()=>true};
  const sample=async(i,o)=>{o&&o.onText&&o.onText({text:"## R\n- a"});return {text:"## Resumo\n- **a** ==b==",truncated:false}};
  let c=0;sample.json=async(input)=>{const n=+input.match(/Crie (\d+)/)[1];return Array.from({length:n},()=>({enunciado:"Caso "+(++c),alternativas:["A","B","C","D"].map(l=>({letra:l,texto:"Alt "+l})),correta:"B",comentario:"c",conceito:"Conceito "+c,alerta:""}))};
  window.claude={use:async n=>({db,user,sample,downloads:{save:async()=>{}}})[n]||null};
};
