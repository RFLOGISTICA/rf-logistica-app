// RF Logistica - BACKUP EXTERNO na VPS (rf-backup-v1, 14/11/2026)
// Servico SEPARADO do Ravi e do Estudio. Roda como usuario "rfbackup", 1x por dia (systemd timer).
// PUXA do Supabase (nao abre porta): backup do banco do dia, configuracao (estrutura, funcoes, usuarios) e os
// arquivos do storage (documentos, contratos, midias). Tudo e CRIPTOGRAFADO aqui antes de gravar no disco
// (RSA-OAEP-256 + AES-256-GCM, chave PUBLICA). A chave PRIVADA nao fica nesta maquina.
// O Supabase NAO consegue apagar nada daqui: a retencao e local (35 dias + o dia 01 de cada mes por 12 meses).
// Uso manual para abrir um arquivo (recuperacao):  node rf-backup.mjs abrir <chave-privada.pem> <arquivo.rfbk> <saida>
const VERSAO = "rf-backup-v1";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const DADOS = process.env.RF_BACKUP_DADOS || "/var/lib/rf-backup";
const CONF = process.env.RF_BACKUP_CONF || "/etc/rf-backup/config.json";
const RETER_DIAS = 35, RETER_MESES = 12;

function log(...a) { console.log(new Date().toISOString(), ...a); }

// ---------------------------------------------------------------- criptografia (formato RFBK1)
function cifrar(buf, pubPem) {
  const chave = crypto.randomBytes(32), iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", chave, iv);
  const corpo = Buffer.concat([c.update(buf), c.final(), c.getAuthTag()]);
  const k = crypto.publicEncrypt({ key: pubPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, chave);
  const cab = JSON.stringify({ v: 1, alg: "RSA-OAEP-256+A256GCM", k: k.toString("base64"), iv: iv.toString("base64") });
  return Buffer.concat([Buffer.from("RFBK1\n" + cab + "\n"), corpo]);
}
function decifrar(buf, privPem) {
  const p1 = buf.indexOf(10), p2 = buf.indexOf(10, p1 + 1);
  if (buf.subarray(0, p1).toString() !== "RFBK1") throw new Error("arquivo nao e RFBK1");
  const cab = JSON.parse(buf.subarray(p1 + 1, p2).toString());
  const chave = crypto.privateDecrypt({ key: privPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, Buffer.from(cab.k, "base64"));
  const corpo = buf.subarray(p2 + 1), tag = corpo.subarray(corpo.length - 16), dados = corpo.subarray(0, corpo.length - 16);
  const d = crypto.createDecipheriv("aes-256-gcm", chave, Buffer.from(cab.iv, "base64")); d.setAuthTag(tag);
  return Buffer.concat([d.update(dados), d.final()]);
}
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");

if (process.argv[2] === "abrir") {
  const [, , , pem, arq, saida] = process.argv;
  fs.writeFileSync(saida, decifrar(fs.readFileSync(arq), fs.readFileSync(pem, "utf8")));
  console.log("aberto:", saida); process.exit(0);
}

// ---------------------------------------------------------------- API
const cfg = JSON.parse(fs.readFileSync(CONF, "utf8"));
async function api(acao, corpo = {}, tentativas = 3) {
  for (let t = 1; ; t++) {
    try {
      const r = await fetch(cfg.api, { method: "POST", headers: { "Content-Type": "application/json", "x-bkx-token": cfg.token }, body: JSON.stringify({ acao, ...corpo }), signal: AbortSignal.timeout(120000) });
      const j = await r.json().catch(() => ({ ok: false, erro: "resposta invalida " + r.status }));
      if (!r.ok || j.ok === false) throw new Error(acao + ": " + (j.erro || r.status));
      return j;
    } catch (e) { if (t >= tentativas) throw e; await new Promise((ok) => setTimeout(ok, 5000 * t)); }
  }
}
async function baixar(url) {
  for (let t = 1; ; t++) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(300000) }); if (!r.ok) throw new Error("http " + r.status); return Buffer.from(await r.arrayBuffer()); }
    catch (e) { if (t >= 3) throw e; await new Promise((ok) => setTimeout(ok, 4000 * t)); }
  }
}
function gravarAtomico(arq, buf, modo = 0o600) { fs.mkdirSync(path.dirname(arq), { recursive: true, mode: 0o700 }); fs.writeFileSync(arq + ".tmp", buf, { mode: modo }); fs.renameSync(arq + ".tmp", arq); }
function discoLivreGB() { try { const o = execFileSync("df", ["-BG", "--output=avail", DADOS]).toString().split("\n")[1]; return Number(o.replace(/\D/g, "")); } catch { return null; } }
function tamanhoDir(d) { try { return Number(execFileSync("du", ["-sb", d]).toString().split("\t")[0]); } catch { return null; } }

// ---------------------------------------------------------------- rodada diaria
async function rodar() {
  const t0 = Date.now(), erros = [], rel = { versao: VERSAO };
  const pub = cfg.chave_publica;
  const plano = await api("plano");
  const dia = plano.dia; rel.dia = dia;
  const pastaDia = path.join(DADOS, "dias", dia);
  const manif = { dia, gerado_em: new Date().toISOString(), versao: VERSAO, banco: [], config: [], objetos: [] };

  // 1) banco + configuracao do dia
  for (const grupo of ["banco", "config"]) {
    for (const f of plano[grupo] || []) {
      try {
        const destino = path.join(pastaDia, grupo, f.caminho.replace(/[^A-Za-z0-9._-]/g, "_") + ".rfbk");
        if (!fs.existsSync(destino)) { const b = await baixar(f.url); gravarAtomico(destino, cifrar(b, pub)); manif[grupo].push({ caminho: f.caminho, bytes: b.length, sha256: sha(b), arquivo: path.basename(destino) }); }
        else manif[grupo].push({ caminho: f.caminho, arquivo: path.basename(destino), ja_tinha: true });
      } catch (e) { erros.push(grupo + " " + f.caminho + ": " + e.message); }
    }
  }
  rel.banco_arquivos = manif.banco.length; rel.config_arquivos = manif.config.length;
  if (!manif.banco.length) erros.push("nenhum arquivo do banco no plano");

  // 2) arquivos do storage: inventario completo, baixa so o que mudou (versoes antigas ficam guardadas)
  const idxArq = path.join(DADOS, "objetos-indice.json");
  let idx = {}; try { idx = JSON.parse(fs.readFileSync(idxArq, "utf8")); } catch { /* primeiro dia */ }
  const inv = []; let pagina = 0;
  for (;;) { const r = await api("inventario", { pagina }); inv.push(...r.itens); if (!r.mais) break; pagina++; }
  const chaveDe = (o) => o.bucket + "/" + o.nome;
  const faltam = inv.filter((o) => { const x = idx[chaveDe(o)]; return !x || x.atualizado !== o.atualizado || x.tamanho !== o.tamanho; });
  let novos = 0, bytesNovos = 0;
  for (let i = 0; i < faltam.length; i += 50) {
    const lote = faltam.slice(i, i + 50);
    let urls; try { urls = (await api("assinar", { itens: lote.map((o) => ({ bucket: o.bucket, nome: o.nome })) })).urls; } catch (e) { erros.push("assinar: " + e.message); continue; }
    for (let j = 0; j < lote.length; j++) {
      const o = lote[j], u = urls[j];
      if (!u) { erros.push("sem url: " + chaveDe(o)); continue; }
      try {
        const b = await baixar(u); const h = sha(b);
        const arq = path.join(DADOS, "objetos", h.slice(0, 2), h + ".rfbk");
        if (!fs.existsSync(arq)) { gravarAtomico(arq, cifrar(b, pub)); novos++; bytesNovos += b.length; }
        idx[chaveDe(o)] = { atualizado: o.atualizado, tamanho: o.tamanho, sha256: h };
      } catch (e) { erros.push("objeto " + chaveDe(o) + ": " + e.message); }
    }
    gravarAtomico(idxArq, Buffer.from(JSON.stringify(idx)));
  }
  for (const o of inv) { const x = idx[chaveDe(o)]; if (x) manif.objetos.push({ bucket: o.bucket, nome: o.nome, atualizado: o.atualizado, tamanho: o.tamanho, sha256: x.sha256 }); }
  rel.objetos_no_supabase = inv.length; rel.objetos_guardados_hoje = manif.objetos.length; rel.objetos_novos = novos; rel.bytes_novos = bytesNovos;
  if (manif.objetos.length < inv.length) erros.push((inv.length - manif.objetos.length) + " arquivo(s) do storage sem copia");

  // 3) manifesto do dia (criptografado) + lista de hashes em claro (so hashes, para a limpeza)
  gravarAtomico(path.join(pastaDia, "manifesto.json.rfbk"), cifrar(Buffer.from(JSON.stringify(manif)), pub));
  gravarAtomico(path.join(pastaDia, "refs.txt"), Buffer.from(manif.objetos.map((o) => o.sha256).join("\n")));
  rel.manifesto_sha256 = sha(Buffer.from(JSON.stringify(manif)));

  // 4) teste de restauracao pedido pelo servidor: devolve os arquivos CRIPTOGRAFADOS que estao NESTE disco
  if (plano.teste && plano.teste.dia) {
    try {
      const pd = path.join(DADOS, "dias", plano.teste.dia, "banco");
      const nomes = fs.existsSync(pd) ? fs.readdirSync(pd).filter((n) => n.endsWith(".rfbk")) : [];
      const amostra = Object.entries(idx).sort(() => Math.random() - 0.5).slice(0, 15).map(([k, v]) => ({ chave: k, sha256: v.sha256 }));
      const r = await api("teste_upload", { dia: plano.teste.dia, arquivos: nomes, amostra });
      let enviados = 0;
      for (const u of r.urls) {
        const arq = u.amostra ? path.join(DADOS, "objetos", u.sha256.slice(0, 2), u.sha256 + ".rfbk") : path.join(pd, u.nome);
        const up = await fetch(u.url, { method: "PUT", headers: { "Content-Type": "application/octet-stream", "x-upsert": "true" }, body: fs.readFileSync(arq), signal: AbortSignal.timeout(300000) });
        if (!up.ok) erros.push("teste upload " + u.nome + ": " + up.status + " " + (await up.text()).slice(0, 80)); else enviados++;
      }
      rel.teste = { dia: plano.teste.dia, enviados, de: r.urls.length };
    } catch (e) { erros.push("teste: " + e.message); }
  }

  // 5) retencao local (o servidor NUNCA manda apagar)
  try {
    const hoje = new Date(dia + "T12:00:00Z").getTime(), dias = fs.readdirSync(path.join(DADOS, "dias")).sort(), manter = [];
    for (const d of dias) {
      const idade = (hoje - new Date(d + "T12:00:00Z").getTime()) / 86400e3;
      if (idade <= RETER_DIAS || (d.endsWith("-01") && idade <= RETER_MESES * 31)) manter.push(d);
      else fs.rmSync(path.join(DADOS, "dias", d), { recursive: true, force: true });
    }
    const usados = new Set(); for (const d of manter) { try { for (const h of fs.readFileSync(path.join(DADOS, "dias", d, "refs.txt"), "utf8").split("\n")) if (h) usados.add(h); } catch { /* */ } }
    for (const o of Object.values(idx)) usados.add(o.sha256);
    let apagados = 0;
    for (const sub of fs.readdirSync(path.join(DADOS, "objetos"))) for (const f of fs.readdirSync(path.join(DADOS, "objetos", sub))) if (!usados.has(f.replace(".rfbk", ""))) { fs.rmSync(path.join(DADOS, "objetos", sub, f)); apagados++; }
    rel.dias_guardados = manter.length; rel.versoes_apagadas = apagados; rel.mais_antigo = manter[0];
  } catch (e) { erros.push("retencao: " + e.message); }

  rel.disco_livre_gb = discoLivreGB(); rel.ocupado_bytes = tamanhoDir(DADOS); rel.segundos = Math.round((Date.now() - t0) / 1000);
  rel.erros = erros.slice(0, 30); rel.status = erros.length ? "erro" : "ok";
  await api("relatorio", rel);
  log("fim", JSON.stringify({ ...rel, erros: erros.length }));
  if (erros.length) process.exitCode = 2;
}

rodar().catch(async (e) => {
  log("FALHOU", e.message);
  try { await api("relatorio", { versao: VERSAO, status: "erro", erros: [String(e.message || e).slice(0, 300)], disco_livre_gb: discoLivreGB() }, 2); } catch { /* o vigia do servidor percebe a falta do relatorio */ }
  process.exitCode = 1;
});
