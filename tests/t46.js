const {chromium}=require('playwright');const fs=require('fs');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({serviceWorkers:'block',acceptDownloads:true,viewport:{width:1366,height:900}});
await ctx.addInitScript(()=>{try{localStorage.setItem('resid-onb-seen','1')}catch(e){}});await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await ctx.route(/config\.js/,r=>r.fulfill({contentType:'text/javascript',body:'window.FIREBASE_CONFIG={apiKey:"COLE_AQUI"};'}));
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
await p.click('#profBtn');await p.click('#pfBody button:has-text("Exportar PDF")');
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('.pdfpan button:has-text("Gerar PDF")')]);
const f=await dl.path();const head=fs.readFileSync(f).slice(0,5).toString();ok(head==="%PDF-"&&/\.pdf$/.test(dl.suggestedFilename()),"site baixa o PDF: "+dl.suggestedFilename());
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
