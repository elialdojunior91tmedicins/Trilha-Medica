/**
 * Nexus - Trilha Médica — backup automático diário no Google Drive.
 *
 * Roda no Google Apps Script, na SUA conta Google (a dona do projeto Firebase "trilha-medica").
 * Todo dia lê seus dados do Firestore e salva um arquivo de backup na pasta
 * "Nexus - Trilha Médica (backups)" do seu Drive, no mesmo formato do "Exportar backup" do app.
 * Para restaurar: no site, Configurações › Backup › Importar backup, e escolha o arquivo.
 *
 * Só LÊ seus dados (não altera nada no app). Guarda as últimas KEEP cópias; as mais antigas vão
 * para a lixeira do Drive. Se um backup falhar, o Google manda um e-mail avisando.
 *
 * Instalar: cole este arquivo e o appsscript.json num projeto novo em script.google.com,
 * escolha a função "instalar" e toque em Executar (autorize). Veja tools/backup-drive-LEIA.md.
 */

var PROJECT = "trilha-medica";          // projectId do Firebase (config.js)
var FOLDER = "Nexus - Trilha Médica (backups)";
var KEEP = 30;                          // quantas cópias guardar
var HOUR = 3;                           // hora do backup diário (fuso do appsscript.json)
var USER_UID = "";                      // vazio = descobre sozinho; preencha só se houver mais de uma conta

var FS = "https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents/";
var DRIVE = "https://www.googleapis.com/drive/v3/files";

/* ---------- funções para escolher em "Executar" ---------- */

/** Liga o backup diário e já faz o primeiro. */
function instalar() {
  desinstalar();
  ScriptApp.newTrigger("backupDiario").timeBased().everyDays(1).atHour(HOUR).create();
  var r = backupAgora();
  Logger.log("Backup diário ligado (por volta das " + HOUR + "h). " + r);
}

/** Desliga o backup diário (os arquivos já salvos continuam no Drive). */
function desinstalar() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "backupDiario") ScriptApp.deleteTrigger(t);
  });
}

/** Faz um backup agora. */
function backupAgora() {
  var uids = USER_UID ? [USER_UID] : findUids();
  if (!uids.length) throw new Error("Nenhuma conta encontrada no Firestore do projeto " + PROJECT + ".");
  var folder = folderId();
  var out = [];
  uids.forEach(function (uid) {
    var bk = buildBackup(uid);
    if (!bk.data.topics || !Object.keys(bk.data.topics).length) {
      if (uids.length > 1) return; // conta vazia: ignora quando há várias
    }
    var name = "nexus-backup-" + stamp() + (uids.length > 1 ? "-" + uid.slice(0, 6) : "") + ".json";
    upload(folder, name, JSON.stringify(bk));
    out.push(name + " (" + resumo(bk.data) + ")");
  });
  limpar(folder);
  return "Salvo: " + out.join("; ");
}

function backupDiario() { backupAgora(); }

/* ---------- Firestore (somente leitura) ---------- */

function http(method, url, body, extra) {
  var o = {
    method: method, muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken(), "X-Goog-User-Project": PROJECT }
  };
  if (body != null) { o.contentType = (extra && extra.contentType) || "application/json"; o.payload = body; }
  var r = UrlFetchApp.fetch(url, o), c = r.getResponseCode(), t = r.getContentText();
  if (c === 404 && extra && extra.allow404) return null;
  if (c < 200 || c >= 300) throw new Error(method + " " + url.split("?")[0] + " → " + c + ": " + t.slice(0, 400));
  return t ? JSON.parse(t) : {};
}

function findUids() {
  var r = http("post", FS + "data/users:listCollectionIds", JSON.stringify({ pageSize: 100 }));
  return (r.collectionIds || []);
}

/* converte o formato tipado do Firestore REST em JSON comum */
function val(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("mapValue" in v) return fields((v.mapValue || {}).fields);
  if ("arrayValue" in v) return ((v.arrayValue || {}).values || []).map(val);
  if ("referenceValue" in v) return v.referenceValue;
  if ("geoPointValue" in v) return v.geoPointValue;
  if ("bytesValue" in v) return v.bytesValue;
  return null;
}
function fields(f) { var o = {}; for (var k in (f || {})) o[k] = val(f[k]); return o; }
function idOf(name) { return decodeURIComponent(String(name).split("/").pop()); }

function getDoc(path) {
  var d = http("get", FS + path, null, { allow404: true });
  return d ? fields(d.fields) : null;
}
function listCol(path) {
  var out = [], tok = "";
  do {
    var r = http("get", FS + path + "?pageSize=300" + (tok ? "&pageToken=" + encodeURIComponent(tok) : ""), null, { allow404: true });
    if (!r) break;
    (r.documents || []).forEach(function (d) { out.push({ id: idOf(d.name), data: fields(d.fields) }); });
    tok = r.nextPageToken || "";
  } while (tok);
  return out;
}

/* monta o mesmo objeto do "Exportar backup" do app (buildBackup) */
function buildBackup(uid) {
  var base = "data/users/" + uid + "/";
  var prog = getDoc(base + "progress") || {};
  var topics = {};
  if (prog.topics && typeof prog.topics === "object") topics = prog.topics; // conta antiga (v2)
  listCol(base + "progress/topics").forEach(function (d) { topics[d.id] = d.data; });
  var fac = getDoc(base + "faculdade");
  if (fac) { fac = { sems: fac.sems || [], discs: fac.discs || [], provas: fac.provas || [], own: fac.own || {}, crunch: fac.crunch }; if (!fac.crunch) delete fac.crunch; }
  var settings = getDoc(base + "settings") || {};
  var prefs = getDoc(base + "prefs");
  var notes = {}, noteAt = {};
  listCol(base + "progress/notes").forEach(function (d) {
    if (d.data && typeof d.data.t === "string" && d.data.t.trim()) { notes[d.id] = d.data.t; if (d.data.updatedAt) noteAt[d.id] = d.data.updatedAt; }
  });
  var arr = function (n) { return listCol(base + "progress/" + n).map(function (d) { return d.data; }); };
  /* erros, cartões, foco e Refazer ficam em pacotes (Lote 18): progress/<lista>pk/pN, campo i = {id: item em JSON};
     item grande e o que uma versão antiga gravou continuam na coleção antiga (que ganha quando o item está nos dois, como no app) */
  var packed = function (n) {
    var out = [], at = {};
    listCol(base + "progress/" + n + "pk").forEach(function (d) {
      var m = (d.data && d.data.i) || {};
      Object.keys(m).forEach(function (id) { if (typeof m[id] !== "string" || at[id] !== undefined) return; try { at[id] = out.length; out.push(JSON.parse(m[id])); } catch (e) {} });
    });
    arr(n).forEach(function (x) { if (x && at[x.id] !== undefined) out[at[x.id]] = x; else out.push(x); });
    return out;
  };
  var data = {
    topics: topics, hist: prog.hist || {}, plan: prog.plan || null, notes: notes, noteAt: noteAt,
    errors: packed("errors"), fac: fac || { sems: [], discs: [], provas: [], own: {} },
    prompt: typeof settings.prompt === "string" ? settings.prompt : undefined,
    focus: packed("focus"), redo: packed("redo"), cards: packed("cards"), free: arr("free"),
    exams: arr("exams"), examProg: arr("exprog"), sims: arr("sims"), exfigs: arr("exfig")
  };
  if (prefs) { delete prefs.updatedAt; data.ui = prefs; } // a conta guarda a data da gravação junto; o backup do app não
  if (data.prompt === undefined) delete data.prompt;
  return { app: "checklist-residencia", format: 1, exportedAt: new Date().toISOString(), source: "drive-auto", data: data };
}

function resumo(d) {
  var n = function (o) { return o ? (Array.isArray(o) ? o.length : Object.keys(o).length) : 0; };
  return n(d.topics) + " temas, " + n(d.notes) + " anotações, " + n(d.errors) + " erros, " + n(d.cards) + " cartões, " + n(d.focus) + " sessões de foco";
}

/* ---------- Drive (só enxerga a pasta e os arquivos criados por este script) ---------- */

function folderId() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty("folderId");
  if (id) {
    var f = http("get", DRIVE + "/" + id + "?fields=id,trashed", null, { allow404: true });
    if (f && !f.trashed) return id;
  }
  var q = "name='" + FOLDER.replace(/'/g, "\\'") + "' and mimeType='application/vnd.google-apps.folder' and trashed=false";
  var r = http("get", DRIVE + "?q=" + encodeURIComponent(q) + "&fields=files(id)");
  id = r.files && r.files.length ? r.files[0].id
    : http("post", DRIVE + "?fields=id", JSON.stringify({ name: FOLDER, mimeType: "application/vnd.google-apps.folder" })).id;
  props.setProperty("folderId", id);
  return id;
}

function upload(folder, name, text) {
  var b = "nexusbk" + Date.now();
  var meta = JSON.stringify({ name: name, parents: [folder], mimeType: "application/json" });
  var body = "--" + b + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" + meta +
    "\r\n--" + b + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" + text + "\r\n--" + b + "--";
  http("post", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    Utilities.newBlob(body, "multipart/related; boundary=" + b).getBytes(), { contentType: "multipart/related; boundary=" + b });
}

function limpar(folder) {
  var q = "'" + folder + "' in parents and trashed=false and name contains 'nexus-backup-'";
  var r = http("get", DRIVE + "?q=" + encodeURIComponent(q) + "&orderBy=createdTime desc&pageSize=200&fields=files(id,name,createdTime)");
  (r.files || []).slice(KEEP).forEach(function (f) {
    http("patch", DRIVE + "/" + f.id, JSON.stringify({ trashed: true }));
  });
}

function stamp() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmm"); }
