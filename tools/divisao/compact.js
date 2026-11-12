// node compact.js <pasta> <arquivo>: uma linha por trecho entre comentários do topo: "linha  KB  # comentário | nomes"
const fs=require("fs"),path=require("path"),acorn=require("acorn");
const [dir,file]=process.argv.slice(2);const t=fs.readFileSync(path.join(dir,file),"utf8");
const lineAt=p=>t.slice(0,p).split("\n").length;const items=[];
const ast=acorn.parse(t,{ecmaVersion:2023,onComment:(b,txt,s)=>items.push({s,c:txt.replace(/\s+/g," ").trim()})});
for(const n of ast.body)items.push({s:n.start,n});items.sort((a,b)=>a.s-b.s);
const nm=n=>n.type==="FunctionDeclaration"?n.id.name:n.type==="VariableDeclaration"?n.declarations.map(d=>d.id.name||"{}").join(","):n.type==="ExpressionStatement"?"·"+t.slice(n.start,n.end).replace(/\s+/g,"").slice(0,25):"·"+n.type.slice(0,3);
let run=null;const out=[];
const flush=()=>{if(run)out.push(`${run.L}\t${(run.sz/1024).toFixed(1)}\t${run.c?"# "+run.c.slice(0,70)+" | ":""}${run.n.join(" ").slice(0,260)}`);run=null};
for(const it of items){if(it.c!=null){if(ast.body.some(n=>it.s>n.start&&it.s<n.end))continue;flush();run={L:lineAt(it.s),c:it.c,n:[],sz:0};continue}
 if(!run)run={L:lineAt(it.s),c:"",n:[],sz:0};run.n.push(nm(it.n));run.sz+=it.n.end-it.n.start}
flush();console.log(out.join("\n"));
