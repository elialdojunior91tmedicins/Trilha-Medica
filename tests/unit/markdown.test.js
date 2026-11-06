// Markdown das anotações (md, inl, flowHTML): o texto vem do usuário e do Claude, então nada pode virar HTML ativo.
const test = require("node:test"), assert = require("node:assert/strict");
const A = require("./load")({ now: "2026-11-06T12:00:00" });

// Confere uma saída: só tags conhecidas, sem atributos on…=, sem links que não sejam http(s) ou "#".
const OK_TAGS = new Set(["p", "strong", "em", "b", "i", "mark", "a", "span", "div", "ul", "ol", "li", "h2", "h3", "h4", "br", "details", "summary", "button", "code", "pre", "blockquote", "hr", "table", "thead", "tbody", "tr", "th", "td", "sup", "sub", "small", "del", "s", "u"]);
function seguro(html) {
  for (const m of html.matchAll(/<\s*\/?\s*([a-zA-Z0-9-]+)([^>]*)>/g)) {
    const tag = m[1].toLowerCase(), attrs = m[2];
    if (!OK_TAGS.has(tag)) return "tag " + tag;
    if (/\son[a-z]+\s*=/i.test(attrs)) return "atributo on…= em " + tag;
    const href = attrs.match(/\shref="([^"]*)"/i);
    if (href && !/^(https?:\/\/|#)/i.test(href[1])) return "link " + href[1];
    if (/\s(src|style|srcdoc|formaction)\s*=/i.test(attrs)) return "atributo perigoso em " + tag;
  }
  return "";
}

const ATAQUES = [
  "<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "<svg onload=alert(1)>", "<iframe src=javascript:alert(1)>",
  "[x](javascript:alert(1))", "[x](JaVaScRiPt:alert(1))", "[x]( javascript:alert(1))", "[x](data:text/html,<script>1</script>)",
  "[x](vbscript:msgbox(1))", '[x"><b>](https://a.com/"onmouseover="alert(1))', "https://a.com/?q=<b>&x=\"y\"",
  "[[<script>alert(1)</script>]]", "[[Hiper|<img src=x onerror=1>]]", "==<i onclick=1>x</i>==", "**<u>x</u>**",
  "> Pegadinha: <svg onload=1>", "# Título <b onmouseover=1>", "- item\n  - sub <i>\n    - <script>", "{{e:\"><img src=x>}}",
  "{{q:x:1\"><script>}}", "`<code>`", "a\u0000 0 \u0000b<script>", "\u0001 1 <b>", "```fluxo\nInício <b>\n? decisão <img src=x onerror=1>\nSim: a → <script>\n```",
];

test("nenhum texto colado vira HTML ativo (" + ATAQUES.length + " casos)", () => {
  for (const t of ATAQUES) {
    const h = A.md(t);
    assert.equal(seguro(h), "", `${JSON.stringify(t)} → ${h}`);
    assert.ok(!/<script/i.test(h), "sem <script: " + h);
  }
});

test("o mesmo vale com a anotação recolhível (md com fold)", () => {
  for (const t of ATAQUES) assert.equal(seguro(A.md("# Seção\n" + t + "\n## Outra <b>\ntexto", { fold: "CM-1" })), "", t);
});

test("formatação: negrito, destaque, listas, títulos e citação", () => {
  assert.match(A.md("**forte**"), /<strong>forte<\/strong>/);
  assert.match(A.md("==atenção=="), /<mark>atenção<\/mark>/);
  assert.match(A.md("# Título"), /<h3 class="mdh">Título<\/h3>/);
  assert.match(A.md("- um\n  - dois"), /<ul><li>um<\/li><li class="sub2">dois<\/li><\/ul>/);
  assert.match(A.md("> Pegadinha: X"), /<div class="callout">Pegadinha: X<\/div>/);
});

test("links: só http(s) viram link, e abrem em outra aba sem acesso à página", () => {
  const h = A.md("[diretriz](https://example.com/a) e https://b.com/x");
  assert.equal((h.match(/<a /g) || []).length, 2);
  assert.ok((h.match(/rel="noopener"/g) || []).length === 2 && (h.match(/target="_blank"/g) || []).length === 2);
  assert.ok(!/<a /.test(A.md("[x](ftp://a.com)")), "ftp não vira link");
});

test("[[ligações]] entre temas: nome exato, prefixo único e texto próprio", () => {
  assert.match(A.md("[[Hipertensão arterial sistêmica]]"), /data-wk="t:CM-1"/);
  assert.match(A.md("[[Hiper|ver HAS]]"), /data-wk="t:CM-1"[^>]*>ver HAS<\/a>/);
  assert.match(A.md("[[Tema que não existe]]"), /class="wk miss"/);
});

test("fluxograma (```fluxo): etapas, decisão e caminho", () => {
  const h = A.md("```fluxo\nInício\n? Tem febre\nSim: antitérmico → reavaliar\n```");
  assert.match(h, /^<div class="flow">/);
  assert.equal((h.match(/class="fl-box/g) || []).length, 3);
  assert.match(h, /fl-q">Tem febre\?</);
});

test("esc: os 5 caracteres especiais do HTML", () => {
  assert.equal(A.esc(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});
