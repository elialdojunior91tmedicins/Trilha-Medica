/* Funciona sem internet: guarda os arquivos do app no aparelho.
   Arquivos do site: tenta a rede primeiro (para receber atualizações) e usa a cópia guardada se estiver sem internet.
   Fontes e Firebase: usa a cópia guardada. O banco de dados (Firestore) não passa por aqui. */
const V = "checklist-0b929e7c";
const CORE = ["./", "index.html", "bridge.js", "config.js", "site.css", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (req, res) => { if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)); } return res; };
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    const net = fetch(r).then(res => put(r, res));
    const cached = () => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("index.html"));
    // rede primeiro, mas sem esperar mais de 4 s se a conexão estiver ruim
    e.respondWith(Promise.race([net, new Promise((_, rej) => setTimeout(rej, 4000))]).catch(() => cached().then(m => m || net)));
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || (u.hostname === "www.gstatic.com" && u.pathname.startsWith("/firebasejs/"))) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => put(r, res))));
  }
});
