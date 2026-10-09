window.__mock=(seed,delay)=>{
  try{if(!window.__wantOnb&&!localStorage.getItem("resid-onb-seen"))localStorage.setItem("resid-onb-seen","1")}catch(e){}
  const store=JSON.parse(JSON.stringify(seed||{}));window.__store=store;
  const wait=()=>new Promise(r=>setTimeout(r,delay||0));
  const docRef=path=>({path,
    async get(){await wait();const v=store[path];return {exists:!!v,id:path.split("/").pop(),data:()=>JSON.parse(JSON.stringify(v))}},
    async set(d){await wait();store[path]=JSON.parse(JSON.stringify(d))},
    async delete(){await wait();delete store[path]},
    collection:sub=>colRef(path+"/"+sub)});
  const colRef=path=>({path,doc:id=>docRef(path+"/"+id),
    async get(){await wait();const docs=Object.keys(store).filter(k=>k.startsWith(path+"/")&&k.slice(path.length+1).indexOf("/")<0).map(k=>({id:k.split("/").pop(),exists:true,data:()=>JSON.parse(JSON.stringify(store[k]))}));return {docs,size:docs.length,empty:!docs.length}}});
  const db={doc:docRef,collection:colRef};
  const user={id:async()=>"u1",isOwner:async()=>true};
  const sample=async(i,o)=>{o&&o.onText&&o.onText({text:"## R\n- a"});return {text:"## Resumo\n- **a** ==b==",truncated:false}};
  let c=0;sample.json=async(input)=>{const n=+input.match(/Crie (\d+)/)[1];return Array.from({length:n},()=>({enunciado:"Caso "+(++c),alternativas:["A","B","C","D"].map(l=>({letra:l,texto:"Alt "+l})),correta:"B",comentario:"c",conceito:"Conceito "+c,alerta:""}))};
  window.claude={use:async n=>({db,user,sample,downloads:{save:async()=>{}}})[n]||null};
};
