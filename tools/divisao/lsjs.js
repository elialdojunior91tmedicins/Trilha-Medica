// lista os .js de uma pasta, também em subpastas, na ordem do build (caminho relativo, ordem de texto)
const fs=require("fs"),path=require("path");
module.exports=function lsjs(dir,rel=""){let out=[];for(const e of fs.readdirSync(path.join(dir,rel),{withFileTypes:true})){const r=rel?rel+"/"+e.name:e.name;if(e.isDirectory())out=out.concat(lsjs(dir,r));else if(e.name.endsWith(".js"))out.push(r)}return rel?out:out.sort()};
