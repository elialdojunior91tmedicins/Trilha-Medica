/* Checklist Residência — ponte do site.
   No Claude, o app usa recursos do próprio Claude (conta, IA, salvar arquivos).
   Aqui eles são substituídos por: Firebase (conta por e-mail e senha + banco de dados),
   "copiar e colar no Claude" para a IA, e download/compartilhamento normal de arquivos.
   O código do app (index.html) é o mesmo da versão do Claude. */
(function () {
  "use strict";
  window.SITE_BATCH = 20; // questões por pedido no copiar e colar

  /* ---------------- Firebase ---------------- */
  const CFG = window.FIREBASE_CONFIG || null;
  const configured = !!(CFG && CFG.apiKey && CFG.projectId && !/COLE|SUA_|xxxx/i.test(CFG.apiKey));
  let auth = null, fs = null, authReady;
  if (configured && window.firebase) {
    try {
      firebase.initializeApp(CFG);
      auth = firebase.auth();
      fs = firebase.firestore();
      fs.enablePersistence({ synchronizeTabs: true }).catch(() => {}); // funciona sem internet
      authReady = new Promise(res => { const un = auth.onAuthStateChanged(u => { un(); res(u); }); });
    } catch (e) { console.error(e); authReady = Promise.resolve(null); }
  } else authReady = Promise.resolve(null);

  const clean = d => JSON.parse(JSON.stringify(d)); // o Firestore não aceita "undefined"
  const wrapDoc = ref => ({
    id: ref.id,
    get: () => ref.get().then(s => ({ exists: s.exists, id: s.id, data: () => s.data() })),
    set: d => ref.set(clean(d)),
    delete: () => ref.delete(),
    collection: n => wrapCol(ref.collection(n))
  });
  const wrapCol = ref => ({
    doc: id => wrapDoc(ref.doc(id)),
    get: () => ref.get().then(q => ({ docs: q.docs.map(s => ({ id: s.id, exists: true, data: () => s.data() })), size: q.size, empty: q.empty }))
  });
  const dbApi = { doc: p => wrapDoc(fs.doc(p)), collection: p => wrapCol(fs.collection(p)) };

  /* ---------------- salvar arquivos ---------------- */
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const downloads = {
    async save({ filename, data }) {
      const type = /\.json$/i.test(filename) ? "application/json" : /\.pdf$/i.test(filename) ? "application/pdf" : "text/markdown";
      const blob = new Blob([data], { type });
      if (isIOS && navigator.canShare) {
        const file = new File([blob], filename, { type });
        if (navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: filename }); return; }
          catch (e) { if (e && e.name === "AbortError") throw { code: "cancelled" }; }
        }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }
  };

  /* ---------------- janelas (modais) ---------------- */
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "class") e.className = attrs[k];
      else if (k.startsWith("on")) e[k] = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach(c => c != null && e.append(c));
    return e;
  }
  function modal(title, build, opts = {}) {
    const back = h("div", { class: "smodal-back" });
    const box = h("div", { class: "smodal", role: "dialog", "aria-modal": "true", "aria-label": title });
    const close = () => { back.remove(); document.removeEventListener("keydown", esc); if (opts.onClose) opts.onClose(); };
    const esc = e => { if (e.key === "Escape" && !opts.locked) close(); };
    box.append(h("div", { class: "smodal-head" }, h("h2", { text: title }),
      opts.locked ? null : h("button", { class: "mini", type: "button", "aria-label": "Fechar", onclick: close, text: "Fechar" })));
    const body = h("div", { class: "smodal-body" });
    box.append(body); back.append(box); document.body.append(back);
    document.addEventListener("keydown", esc);
    build(body, close);
    return close;
  }

  /* ---------------- IA: copiar e colar no Claude ---------------- */
  const flatten = input => typeof input === "string" ? input
    : (input || []).map(t => (t.role === "assistant" ? "[Sua resposta anterior]\n" : "") + t.content).join("\n\n");
  function extractJSON(t) {
    t = (t || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    try { return JSON.parse(t); } catch (e) {}
    const starts = ["[", "{"].map(c => t.indexOf(c)).filter(x => x >= 0);
    if (!starts.length) return undefined;
    const i = Math.min(...starts), j = Math.max(t.lastIndexOf("]"), t.lastIndexOf("}"));
    if (j > i) { try { return JSON.parse(t.slice(i, j + 1)); } catch (e) {} }
    return undefined;
  }
  function manual(input, opts, asJson) {
    return new Promise((resolve, reject) => {
      const prompt = flatten(input) + (asJson
        ? "\n\nIMPORTANTE: responda somente com o JSON pedido, sem nenhum texto antes ou depois."
        : "\n\nResponda somente com o texto final, em Markdown, sem comentários antes ou depois.");
      let done = false;
      const finish = (fn, v) => { if (done) return; done = true; closeIt(); fn(v); };
      const closeIt = modal(asJson ? "Gerar questões com o Claude" : "Pedir ao Claude", (body) => {
        const msg = h("p", { class: "gstatus", role: "status" });
        const copy = h("button", { class: "btn primary", type: "button", text: "Copiar pedido" });
        copy.onclick = async () => {
          try { await navigator.clipboard.writeText(prompt); msg.textContent = "Pedido copiado. Cole numa conversa no Claude."; }
          catch (e) { pre.parentElement.open = true; msg.textContent = "Não deu para copiar automaticamente: selecione o texto abaixo e copie."; }
        };
        const pre = h("pre", { class: "sprompt", text: prompt });
        const ta = h("textarea", { class: "ntext spaste", placeholder: asJson ? "Cole aqui a resposta inteira do Claude (o texto que começa com [ )" : "Cole aqui a resposta do Claude", "aria-label": "Resposta do Claude" });
        const err = h("p", { class: "err", role: "alert" });
        const paste = h("button", { class: "btn", type: "button", text: "Colar" });
        paste.onclick = async () => { try { ta.value = await navigator.clipboard.readText(); } catch (e) { ta.focus(); err.textContent = "Toque e segure no campo e escolha Colar."; } };
        const use = h("button", { class: "btn primary", type: "button", text: asJson ? "Usar estas questões" : "Usar esta resposta" });
        use.onclick = () => {
          const v = ta.value.trim();
          if (!v) { err.textContent = "Cole a resposta do Claude primeiro."; return; }
          if (asJson) {
            const j = extractJSON(v);
            if (j === undefined) { err.textContent = "Não reconheci as questões nessa resposta. Copie a resposta inteira do Claude (do primeiro [ até o último ]) e cole de novo."; return; }
            finish(resolve, j);
          } else finish(resolve, { text: v, truncated: false });
        };
        body.append(
          h("p", { class: "gtext" }, h("b", { text: "1. " }), "Copie o pedido e cole numa conversa no app do Claude ou em claude.ai."),
          h("div", { class: "btns" }, copy, h("a", { class: "btn", href: "https://claude.ai/new", target: "_blank", rel: "noopener", text: "Abrir o Claude ↗" })),
          msg,
          h("details", { class: "plain" }, h("summary", { text: "Ver o pedido" }), pre),
          h("p", { class: "gtext" }, h("b", { text: "2. " }), "Quando o Claude terminar, copie a resposta inteira e cole aqui:"),
          ta, err,
          h("div", { class: "btns" }, paste, use)
        );
      }, { onClose: () => { if (!done) { done = true; reject({ code: "cancelled" }); } } });
      if (opts && opts.signal) opts.signal.addEventListener("abort", () => finish(reject, { code: "cancelled" }));
    });
  }
  const sample = (input, opts) => manual(input, opts || {}, false);
  sample.json = (input, opts) => manual(input, opts || {}, true);
  sample.limits = async () => ({ images: false });

  /* ---------------- o "claude.use" do site ---------------- */
  window.claude = {
    use: async (name) => {
      if (name === "sample") return sample;
      if (name === "downloads") return downloads;
      if (name === "db") { const u = await authReady; return u && fs ? dbApi : null; }
      if (name === "user") {
        const u = await authReady; if (!u) return null;
        return { id: async () => u.uid, isOwner: async () => true, canEdit: () => true, can: () => true, me: async () => ({ id: u.uid, name: u.email || "" }) };
      }
      return null;
    }
  };

  /* ---------------- conta ---------------- */
  const AUTH_ERR = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/invalid-login-credentials": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Já existe uma conta com este e-mail. Use Entrar.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente de novo.",
    "auth/network-request-failed": "Sem conexão com a internet.",
    "auth/operation-not-allowed": "O login por e-mail e senha ainda não foi ativado no Firebase (Authentication › Sign-in method)."
  };
  Object.assign(AUTH_ERR, {
    "auth/popup-blocked": "O navegador bloqueou a janela do Google. Permita janelas para este site e tente de novo.",
    "auth/popup-closed-by-user": "A janela do Google foi fechada antes de terminar.",
    "auth/cancelled-popup-request": "A janela do Google foi fechada antes de terminar.",
    "auth/account-exists-with-different-credential": "Este e-mail já tem conta com senha. Entre com e-mail e senha.",
    "auth/credential-already-in-use": "Este e-mail já está em uso em outra conta.",
    "auth/provider-already-linked": "Esta conta já tem senha. Use Esqueci minha senha para trocar.",
    "auth/requires-recent-login": "Por segurança, saia e entre de novo com o Google e tente outra vez.",
    "auth/unauthorized-domain": "O endereço do site ainda não foi autorizado no Firebase (Authentication › Configurações › Domínios autorizados)."
  });
  const authMsg = e => AUTH_ERR[e && e.code] || "Não foi possível agora. Tente novamente.";
  // app instalado na tela inicial: o login com Google (janela) não funciona no iPhone/iPad
  const standalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const hasPassword = u => (u.providerData || []).some(p => p && p.providerId === "password");
  const hasGoogle = u => (u.providerData || []).some(p => p && p.providerId === "google.com");

  function openAccount() {
    authReady.then(u => {
      if (!configured) {
        modal("Conta e sincronização", b => b.append(h("p", { class: "gtext", text: "A sincronização ainda não foi configurada neste site. Por enquanto, tudo fica salvo só neste aparelho." })));
        return;
      }
      if (!auth) {
        modal("Sem conexão", b => b.append(h("p", { class: "gtext", text: "Não foi possível carregar o sistema de login, provavelmente por falta de internet. O checklist continua funcionando e salvando neste aparelho. Tente entrar de novo quando estiver conectado." }),
          h("div", { class: "btns" }, h("button", { class: "btn primary", type: "button", text: "Tentar de novo", onclick: () => location.reload() }))));
        return;
      }
      if (u) {
        modal("Sua conta", (b) => {
          const err = h("p", { class: "err", role: "alert" });
          const out = h("button", { class: "btn", type: "button", text: "Sair deste aparelho" });
          let armed = false;
          out.onclick = async () => {
            if (!armed) { armed = true; out.textContent = "Toque de novo para sair"; out.classList.add("warn"); return; }
            out.disabled = true;
            try {
              await auth.signOut();
              try { await fs.terminate(); await fs.clearPersistence(); } catch (e) {}
              Object.keys(localStorage).filter(k => k.startsWith("resid-")).forEach(k => localStorage.removeItem(k));
              location.reload();
            } catch (e) { err.textContent = authMsg(e); out.disabled = false; }
          };
          const pwBox = [];
          if (hasGoogle(u) && !hasPassword(u)) {
            const pw = h("input", { class: "etext", type: "password", autocomplete: "new-password", placeholder: "Nova senha (mínimo 6 caracteres)", "aria-label": "Nova senha" });
            const st = h("p", { class: "gstatus", role: "status" }), e2 = h("p", { class: "err", role: "alert" });
            const mk = h("button", { class: "btn primary", type: "button", text: "Criar senha" });
            mk.onclick = async () => {
              e2.textContent = ""; st.textContent = "";
              if ((pw.value || "").length < 6) { e2.textContent = AUTH_ERR["auth/weak-password"]; return; }
              mk.disabled = true;
              try {
                await auth.currentUser.linkWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, pw.value));
                st.textContent = "Senha criada. No app instalado, entre com " + u.email + " e esta senha."; pw.value = "";
              } catch (x) { e2.textContent = authMsg(x); mk.disabled = false; }
            };
            pwBox.push(h("p", { class: "gtext" }, h("b", { text: "Usar no app instalado: " }), "no app da tela inicial do iPhone/iPad, o botão do Google não funciona. Crie uma senha para esta mesma conta e entre lá com seu e-mail e ela."), pw, h("div", { class: "btns" }, mk), st, e2);
          }
          b.append(
            h("p", { class: "gtext" }, "Conectado como ", h("b", { text: u.email || "" }), "."), ...pwBox,
            h("p", { class: "gtext", text: "Seu progresso fica salvo na sua conta e aparece em todos os aparelhos em que você entrar com este e-mail. Sem internet, o app continua funcionando e sincroniza quando a conexão voltar." }),
            h("p", { class: "gtext how", text: "Ao sair, os dados são apagados deste aparelho (continuam na sua conta)." }),
            h("div", { class: "btns" }, out), err);
        });
        return;
      }
      modal("Entrar", (b) => {
        let mode = "entrar";
        const email = h("input", { class: "etext", type: "email", autocomplete: "username", placeholder: "seu@email.com", "aria-label": "E-mail" });
        const pass = h("input", { class: "etext", type: "password", autocomplete: "current-password", placeholder: "Senha (mínimo 6 caracteres)", "aria-label": "Senha" });
        const err = h("p", { class: "err", role: "alert" }), ok = h("p", { class: "gstatus", role: "status" });
        const go = h("button", { class: "btn primary", type: "submit" });
        const sw = h("button", { class: "link", type: "button" });
        const forgot = h("button", { class: "link", type: "button", text: "Esqueci minha senha" });
        const intro = h("p", { class: "gtext" });
        const paint = () => {
          go.textContent = mode === "entrar" ? "Entrar" : "Criar conta";
          sw.textContent = mode === "entrar" ? "Primeira vez? Criar conta" : "Já tenho conta: entrar";
          pass.autocomplete = mode === "entrar" ? "current-password" : "new-password";
          intro.textContent = mode === "entrar" ? "Entre com o e-mail e a senha da sua conta do checklist." : "Crie sua conta uma vez. Depois, entre com o mesmo e-mail e senha no iPad, no iPhone e no computador.";
          forgot.hidden = mode !== "entrar"; err.textContent = "";
        };
        sw.onclick = () => { mode = mode === "entrar" ? "criar" : "entrar"; paint(); };
        forgot.onclick = async () => {
          err.textContent = ""; ok.textContent = "";
          if (!email.value.trim()) { err.textContent = "Digite seu e-mail acima e toque de novo em Esqueci minha senha."; return; }
          try { await auth.sendPasswordResetEmail(email.value.trim()); ok.textContent = "Enviamos um link para redefinir a senha. Confira também a caixa de spam."; }
          catch (e) { err.textContent = authMsg(e); }
        };
        const form = h("form", { class: "sform" }, intro, email, pass, h("div", { class: "btns" }, go), err, ok, h("div", { class: "btns" }, sw, forgot));
        if (!standalone()) {
          const gErr = h("p", { class: "err", role: "alert" });
          const g = h("button", { class: "btn gbtn", type: "button", text: "Entrar com Google" });
          g.onclick = async () => {
            gErr.textContent = ""; g.disabled = true;
            try {
              await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
              try { sessionStorage.setItem("resid-justin", "1"); } catch (x) {}
              location.reload();
            } catch (x) { gErr.textContent = authMsg(x); g.disabled = false; }
          };
          b.append(h("div", { class: "btns" }, g), gErr, h("p", { class: "sor", text: "ou com e-mail e senha" }));
        } else {
          b.append(h("p", { class: "gtext how", text: "Criou a conta com o Google? No app instalado, entre com o mesmo e-mail e a senha criada em Conta › Criar senha (pelo Safari)." }));
        }
        form.onsubmit = async (e) => {
          e.preventDefault(); err.textContent = ""; go.disabled = true;
          const em = email.value.trim(), pw = pass.value;
          try {
            if (mode === "entrar") await auth.signInWithEmailAndPassword(em, pw);
            else await auth.createUserWithEmailAndPassword(em, pw);
            try { sessionStorage.setItem("resid-justin", "1"); } catch (x) {}
            location.reload();
          } catch (x) { err.textContent = authMsg(x); go.disabled = false; }
        };
        paint(); b.append(form); setTimeout(() => email.focus(), 50);
      });
    });
  }

  /* ---------------- backup: importar e desfazer ---------------- */
  const PRE = "resid-preimport";
  function validBackup(B) {
    if (!B || typeof B !== "object") return "Este arquivo não é um backup do checklist.";
    if (B.app !== "checklist-residencia") return "Este arquivo não é um backup do checklist.";
    if (B.format !== 1) return "Este backup é de uma versão diferente do checklist. Atualize a página e tente de novo.";
    const d = B.data;
    if (!d || typeof d !== "object") return "O backup está incompleto.";
    if (d.topics && typeof d.topics !== "object") return "O backup está corrompido (temas).";
    if (d.notes && typeof d.notes !== "object") return "O backup está corrompido (anotações).";
    if (d.errors && !Array.isArray(d.errors)) return "O backup está corrompido (caderno de erros).";
    if (d.fac && !facValid(d.fac)) return "O backup está corrompido (faculdade).";
    return "";
  }
  function countsOf(d) {
    const own = d.fac && d.fac.own ? Object.keys(d.fac.own) : [];
    const known = k => BYKEY[k] || (k.startsWith("F-") && own.includes(k.slice(2)));
    const t = d.topics || {};
    return {
      temas: Object.keys(t).filter(k => known(k) && t[k] && (t[k].last || t[k].l || (t[k].sd || []).length || t[k].qt)).length,
      anotacoes: Object.keys(d.notes || {}).filter(k => known(k) && typeof d.notes[k] === "string" && d.notes[k].trim()).length,
      erros: (d.errors || []).length,
      disciplinas: d.fac ? d.fac.discs.length : 0,
      provas: d.fac ? d.fac.provas.length : 0,
      diasHistorico: Object.keys(d.hist || {}).length,
      foco: Array.isArray(d.focus) ? d.focus.length : 0,
      refazer: Array.isArray(d.redo) ? d.redo.length : 0,
      cartoes: Array.isArray(d.cards) ? d.cards.length : 0
    };
  }
  const isEmpty = c => !c.temas && !c.anotacoes && !c.erros && !c.disciplinas; // o histórico de hoje é criado pelo próprio plano do dia
  const ready = () => new Promise(res => { const t = setInterval(() => { if (synced && (!store || notesStore)) { clearInterval(t); res(); } }, 100); });

  async function applyBackup(B) {
    await ready();
    const d = B.data, now = new Date().toISOString();
    fac = d.fac && facValid(d.fac) ? d.fac : { sems: [], discs: [], provas: [], own: {} };
    registerOwn(); // temas próprios precisam existir antes do resto
    state = migrate(d.topics || {});
    hist = d.hist && typeof d.hist === "object" ? d.hist : {};
    dayPlan = d.plan && d.plan.d === today() && Array.isArray(d.plan.items) ? d.plan : null;
    const nn = {}, na = {};
    for (const k in d.notes || {}) if (BYKEY[k] && typeof d.notes[k] === "string" && d.notes[k].trim()) { nn[k] = d.notes[k].slice(0, NOTE_MAX); if (d.noteAt && d.noteAt[k]) na[k] = d.noteAt[k]; }
    notes = nn; noteAt = na;
    errors = (Array.isArray(d.errors) ? d.errors : []).filter(errOk);
    if (typeof d.prompt === "string" && d.prompt.trim()) promptText = d.prompt;
    const hasFocus = Array.isArray(d.focus) && typeof foOk === "function";
    const hasRedo = Array.isArray(d.redo) && typeof rdOk === "function";
    const hasCards = Array.isArray(d.cards) && typeof cdOk === "function";
    if (hasCards) { cards = d.cards.filter(cdOk).map(cdClean); try { localStorage.setItem(LSCD, JSON.stringify(cards)); } catch (e) {} }
    if (hasRedo) { redo = d.redo.filter(rdOk).map(rdClean); try { localStorage.setItem(LSRD, JSON.stringify(redo)); } catch (e) {} }
    if (hasFocus) { foSess = d.focus.filter(foOk).map(foClean); try { localStorage.setItem(LSFO, JSON.stringify(foSess)); } catch (e) {} }
    if (d.ui && typeof d.ui === "object" && typeof uiSanitize === "function") { ui = uiSanitize(d.ui); try { localStorage.setItem(LSUI, JSON.stringify(ui)); } catch (e) {} }
    const ls = (k, v) => { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} };
    ls(LS2, state); ls(LSH, hist); ls(LSDP, dayPlan); ls(LSN, notes); ls(LSN + "-at", noteAt); ls(LSE, errors); ls(LSF, fac); ls(LSP, promptText);
    if (d.sort === "inc" || d.sort === "num") ls("resid-sort", d.sort);
    if (store) {
      await store.set({ version: 2, topics: state, hist, plan: dayPlan, updatedAt: now });
      await facStore.set({ ...fac, updatedAt: now });
      if (settingsDoc) await settingsDoc.set({ prompt: promptText, updatedAt: now });
      if (d.ui && typeof uiDoc !== "undefined" && uiDoc) await uiDoc.set({ ...ui, updatedAt: now });
      const es = await errStore.get(), ids = new Set(errors.map(e => e.id));
      await Promise.all(es.docs.filter(x => !ids.has(x.id)).map(x => errStore.doc(x.id).delete()));
      await Promise.all(errors.map(e => errStore.doc(e.id).set({ ...e })));
      const ns = await notesStore.get();
      await Promise.all(ns.docs.filter(x => !notes[x.id]).map(x => notesStore.doc(x.id).delete()));
      await Promise.all(Object.keys(notes).map(k => notesStore.doc(k).set({ t: notes[k], updatedAt: noteAt[k] || now })));
      if (hasCards && typeof cardStore !== "undefined" && cardStore) {
        const cs = await cardStore.get(), cids = new Set(cards.map(x => x.id));
        await Promise.all(cs.docs.filter(x => !cids.has(x.id)).map(x => cardStore.doc(x.id).delete()));
        await Promise.all(cards.map(x => cardStore.doc(x.id).set({ ...x })));
      }
      if (hasRedo && typeof redoStore !== "undefined" && redoStore) {
        const rs = await redoStore.get(), rids = new Set(redo.map(x => x.id));
        await Promise.all(rs.docs.filter(x => !rids.has(x.id)).map(x => redoStore.doc(x.id).delete()));
        await Promise.all(redo.map(x => redoStore.doc(x.id).set({ ...x })));
      }
      if (hasFocus && typeof focStore !== "undefined" && focStore) {
        const fs = await focStore.get(), fids = new Set(foSess.map(x => x.id));
        await Promise.all(fs.docs.filter(x => !fids.has(x.id)).map(x => focStore.doc(x.id).delete()));
        await Promise.all(foSess.map(x => focStore.doc(x.id).set({ ...x })));
      }
    }
  }
  const summaryLine = c => backupSummaryText(c);
  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); };

  function importFlow(text) {
    let B; try { B = JSON.parse(text); } catch (e) { B = null; }
    const problem = validBackup(B);
    if (problem) { modal("Importar backup", b => b.append(h("p", { class: "err", text: problem }), h("p", { class: "gtext", text: "Nada foi alterado." }))); return; }
    ready().then(() => {
      const incoming = countsOf(B.data), current = backupCounts(), hasData = !isEmpty(current);
      modal("Importar backup", (b, close) => {
        const err = h("p", { class: "err", role: "alert" }), st = h("p", { class: "gstatus", role: "status" });
        const go = h("button", { class: "btn primary", type: "button", text: "Importar" });
        b.append(
          h("p", { class: "gtext" }, h("b", { text: "Backup de " + fmtDate(B.exportedAt) }), ""),
          h("p", { class: "gtext", text: "Contém: " + summaryLine(incoming) + "." }));
        let snapshotOK = true;
        if (hasData) {
          b.append(h("p", { class: "gtext warnbox", text: "Importar vai substituir o que o site tem agora: " + summaryLine(current) + ". Uma cópia disso fica guardada neste aparelho, e você pode desfazer a importação depois." }));
          const snap = JSON.stringify({ at: new Date().toISOString(), backup: buildBackup() });
          try { localStorage.setItem(PRE, snap); } catch (e) {
            snapshotOK = false; go.disabled = true;
            const dl = h("button", { class: "btn", type: "button", text: "Baixar cópia do que existe agora" });
            dl.onclick = async () => { try { await downloads.save({ filename: `checklist-antes-da-importacao-${today()}.json`, data: JSON.stringify(buildBackup(), null, 1) }); go.disabled = false; st.textContent = "Cópia salva. Agora você pode importar."; } catch (x) { err.textContent = "Não foi possível salvar a cópia."; } };
            b.append(h("p", { class: "gtext", text: "Este aparelho não tem espaço para guardar a cópia automática. Baixe a cópia antes de importar:" }), h("div", { class: "btns" }, dl));
          }
        } else b.append(h("p", { class: "gtext", text: "O site ainda está vazio, então nada será substituído." }));
        go.onclick = async () => {
          go.disabled = true; err.textContent = ""; st.textContent = store ? "Importando e salvando na sua conta…" : "Importando…";
          try {
            await applyBackup(B);
            try { sessionStorage.setItem("resid-imported", JSON.stringify(incoming)); } catch (e) {}
            location.reload();
          } catch (e) {
            console.error(e);
            err.textContent = "A importação não terminou (" + (e && e.code === "unavailable" ? "sem conexão" : "erro ao salvar na conta") + "). Seus dados neste aparelho estão importados; toque em Importar de novo quando estiver com internet para completar.";
            go.disabled = false;
          }
        };
        b.append(h("div", { class: "btns" }, go, h("button", { class: "btn", type: "button", text: "Cancelar", onclick: () => { if (hasData && snapshotOK) { try { localStorage.removeItem(PRE); } catch (e) {} } close(); } })), st, err);
      });
    });
  }
  function pickFile() {
    const inp = h("input", { type: "file", accept: ".json,application/json,text/plain" });
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => importFlow(String(r.result)); r.onerror = () => modal("Importar backup", b => b.append(h("p", { class: "err", text: "Não foi possível ler o arquivo." }))); r.readAsText(f); };
    inp.click();
  }
  function pasteFlow() {
    modal("Colar backup", (b, close) => {
      const ta = h("textarea", { class: "ntext spaste", placeholder: "Cole aqui o texto copiado em Copiar backup", "aria-label": "Backup" });
      const go = h("button", { class: "btn primary", type: "button", text: "Continuar" });
      go.onclick = () => { const v = ta.value.trim(); if (!v) return; close(); importFlow(v); };
      b.append(h("p", { class: "gtext", text: "Na versão do Claude, use Copiar backup e cole aqui." }), ta, h("div", { class: "btns" }, go));
    });
  }
  function undoFlow() {
    let P; try { P = JSON.parse(localStorage.getItem(PRE) || "null"); } catch (e) { P = null; }
    if (!P || !P.backup) return;
    modal("Desfazer importação", (b, close) => {
      const st = h("p", { class: "gstatus", role: "status" }), err = h("p", { class: "err", role: "alert" });
      const go = h("button", { class: "btn primary", type: "button", text: "Voltar ao que era antes" });
      go.onclick = async () => {
        go.disabled = true; st.textContent = "Restaurando…";
        try { await applyBackup(P.backup); localStorage.removeItem(PRE); try { sessionStorage.setItem("resid-undone", "1"); } catch (e) {} location.reload(); }
        catch (e) { err.textContent = "Não foi possível restaurar agora. Tente com internet."; go.disabled = false; }
      };
      b.append(h("p", { class: "gtext", text: "Volta o site para como estava em " + fmtDate(P.at) + ", antes da importação: " + summaryLine(countsOf(P.backup.data)) + "." }), h("div", { class: "btns" }, go), st, err);
    });
  }

  /* ---------------- elementos na página ---------------- */
  function toast(text) {
    const t = h("div", { class: "stoast", role: "status", text });
    document.body.append(t); setTimeout(() => t.classList.add("on"), 20);
    setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 400); }, 4200);
  }
  function mount() {
    // botão de conta no cabeçalho
    const header = document.querySelector("body > .wrap > header");
    const slot = document.getElementById("acctSlot"); // página Perfil do app
    if (configured && (slot || header)) {
      const btn = h("button", { class: slot ? "btn primary" : "acct", type: "button", id: "acctBtn", text: "Entrar" });
      btn.onclick = openAccount;
      if (slot) slot.append(btn); else { header.classList.add("hasacct"); (header.querySelector(".hacts") || header).prepend(btn); }
      authReady.then(u => { btn.textContent = u ? (slot ? "Gerenciar conta (sair, criar senha)" : "Conta") : (slot ? "Entrar ou criar conta" : "Entrar"); btn.title = u ? (u.email || "") : "Entrar para sincronizar"; if (slot) btn.className = u ? "btn" : "btn primary"; });
    }
    // banners
    const bannerHost = h("div", { class: "sbanners" });
    if (header) header.append(bannerHost); // dentro do cabeçalho: fica no lugar certo em todos os layouts
    const dismissed = k => { try { const v = +localStorage.getItem(k); return v && Date.now() - v < 3 * 864e5; } catch (e) { return false; } };
    const dismiss = k => { try { localStorage.setItem(k, String(Date.now())); } catch (e) {} };
    authReady.then(u => {
      if (configured && !u && !dismissed("resid-ban-login")) {
        const bn = h("div", { class: "sbanner" }, h("span", { text: "Entre para salvar na nuvem e usar em todos os aparelhos." }),
          h("button", { class: "btn primary", type: "button", text: "Entrar", onclick: openAccount }),
          h("button", { class: "link", type: "button", text: "Agora não", onclick: () => { dismiss("resid-ban-login"); bn.remove(); } }));
        bannerHost.append(bn);
      }
      ready().then(() => {
        if ((u || !configured) && isEmpty(backupCounts()) && !dismissed("resid-ban-import")) {
          const bn = h("div", { class: "sbanner" }, h("span", { text: "Trazer seu progresso da versão do Claude?" }),
            h("button", { class: "btn primary", type: "button", text: "Importar backup", onclick: pickFile }),
            h("button", { class: "link", type: "button", text: "Colar", onclick: pasteFlow }),
            h("button", { class: "link", type: "button", text: "Agora não", onclick: () => { dismiss("resid-ban-import"); bn.remove(); } }));
          bannerHost.append(bn);
        }
      });
    });
    // cartão de backup (tela ⚙ Instruções e backup)
    const card = document.getElementById("bkh") && document.getElementById("bkh").parentElement;
    if (card) {
      const row = h("div", { class: "btns", id: "bkImportRow" },
        h("button", { class: "btn", type: "button", text: "Importar backup", onclick: pickFile }),
        h("button", { class: "btn", type: "button", text: "Colar backup", onclick: pasteFlow }));
      const undo = h("button", { class: "link", type: "button", id: "bkUndo", text: "Desfazer a última importação", onclick: undoFlow });
      const acct = h("p", { class: "gtext how", id: "bkAcct" });
      card.querySelector("#bkMsg").before(row);
      card.append(undo, acct);
      const paintUndo = () => { let P = null; try { P = JSON.parse(localStorage.getItem(PRE) || "null"); } catch (e) {} undo.hidden = !(P && P.at && Date.now() - new Date(P.at) < 7 * 864e5); };
      paintUndo(); setInterval(paintUndo, 3000);
      authReady.then(u => { acct.textContent = !configured ? "Sincronização não configurada: os dados ficam só neste aparelho." : u ? `Conta: ${u.email}. Tudo sincroniza entre os aparelhos.` : "Você não entrou: os dados ficam só neste aparelho."; });
    }
    // avisos depois de recarregar
    try {
      const imp = sessionStorage.getItem("resid-imported");
      if (imp) { sessionStorage.removeItem("resid-imported"); toast("Backup importado: " + summaryLine(JSON.parse(imp)) + "."); }
      if (sessionStorage.getItem("resid-undone")) { sessionStorage.removeItem("resid-undone"); toast("Importação desfeita."); }
      if (sessionStorage.getItem("resid-justin")) { sessionStorage.removeItem("resid-justin"); authReady.then(u => u && toast("Conectado como " + u.email + ".")); }
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  window.__site = { openAccount, importFlow, pickFile, pasteFlow, undoFlow, configured, authReady, extractJSON };

  /* ---------------- app instalável (funciona sem internet) ---------------- */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
