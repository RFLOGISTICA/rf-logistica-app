// RF Logistica - Estudio de Video (worker de renderizacao na VPS) - rf-estudio-v1 13/11/2026
// Roda SEPARADO do WhatsApp do Ravi (servico systemd proprio, prioridade baixa, CPU/memoria limitadas).
// Nao abre porta nenhuma: ele mesmo pergunta ao sistema (Edge Function "estudio") se tem video para montar,
// baixa as midias (links assinados), monta com FFmpeg + SVG (rsvg-convert), sobe o MP4 pronto no armazenamento
// do sistema e informa o andamento. Sem custo por video.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";

const VERSAO = "rf-estudio-v1";
const BASE = process.env.RF_BASE || "/opt/rf-estudio";
const API = process.env.RF_API || "https://dpqgqgjhydrztouxscad.supabase.co/functions/v1/estudio";
const TOKEN = (() => { try { return fs.readFileSync(path.join(BASE, "token"), "utf8").trim(); } catch { return process.env.RF_TOKEN || ""; } })();
const CACHE = path.join(BASE, "cache");
const TMP = path.join(BASE, "tmp");
const LOCAL = process.env.RF_LOCAL === "1";   // teste local (sem API)
const THREADS = Math.max(1, Math.min(4, os.cpus().length - 1));
const OURO = "#D4A017";
for (const d of [CACHE, TMP]) { try { fs.mkdirSync(d, { recursive: true }); } catch { /* */ } }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---------------------------------------------------------------- utilitarios
function run(cmd, args, opts = {}) {
  return new Promise((ok, falha) => {
    const p = spawn(LOCAL ? cmd : "nice", LOCAL ? args : ["-n", "15", cmd, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let err = "", out = "";
    p.stdout.on("data", (d) => { out += d; if (opts.onOut) opts.onOut(String(d)); if (out.length > 2e6) out = out.slice(-1e6); });
    p.stderr.on("data", (d) => { err += d; if (err.length > 2e5) err = err.slice(-1e5); });
    p.on("close", (c) => c === 0 ? ok(out) : falha(new Error(cmd + " saiu com " + c + ": " + err.slice(-1500))));
    p.on("error", falha);
  });
}
function probe(f) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", f], { encoding: "utf8" });
  try {
    const j = JSON.parse(r.stdout || "{}");
    const v = (j.streams || []).find((s) => s.codec_type === "video");
    const a = (j.streams || []).find((s) => s.codec_type === "audio");
    return { dur: Number(j.format && j.format.duration) || 0, w: v ? v.width : 0, h: v ? v.height : 0, audio: !!a };
  } catch { return { dur: 0, w: 0, h: 0, audio: false }; }
}
async function baixar(url, chave) {
  if (!url) throw new Error("midia sem link");
  if (!/^https?:\/\//.test(url) && fs.existsSync(url)) return url;   // teste local
  const nome = crypto.createHash("sha1").update(chave || url).digest("hex").slice(0, 20) + (path.extname((chave || url).split("?")[0]).slice(0, 6) || ".bin");
  const dest = path.join(CACHE, nome);
  if (chave && fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;
  let ultimo = null;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error("download " + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(dest + ".tmp", buf); fs.renameSync(dest + ".tmp", dest);
      return dest;
    } catch (e) { ultimo = e; await sleep(1500 * (i + 1)); }
  }
  throw new Error("nao baixou a midia: " + (ultimo && ultimo.message));
}
function limparCache() {   // cache de midias: mantem no maximo ~3 GB / 14 dias
  try {
    const fs2 = fs.readdirSync(CACHE).map((n) => { const p = path.join(CACHE, n); const s = fs.statSync(p); return { p, t: s.mtimeMs, n: s.size }; }).sort((a, b) => b.t - a.t);
    let tot = 0;
    for (const f of fs2) { tot += f.n; if (tot > 3e9 || Date.now() - f.t > 14 * 864e5) { try { fs.unlinkSync(f.p); } catch { /* */ } } }
  } catch { /* */ }
}

// ---------------------------------------------------------------- texto (SVG)
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function largura(txt, px, fonte) {   // largura aproximada do texto (sem medir fonte): conservadora
  let em = 0;
  for (const ch of String(txt)) {
    if (" ".includes(ch)) em += 0.28;
    else if ("iIljtfr1.,:;'!|".includes(ch)) em += 0.30;
    else if ("mwMW".includes(ch)) em += 0.86;
    else if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9]/.test(ch)) em += 0.68;
    else em += 0.57;
  }
  const f = fonte === "Anton" ? 0.66 : fonte === "PoppinsB" ? 1.04 : 1.0;
  return em * px * f;
}
function quebrar(txt, px, maxW, fonte) {
  const pal = String(txt || "").split(/\s+/).filter(Boolean); const lin = []; let cur = "";
  for (const p of pal) { const t = cur ? cur + " " + p : p; if (largura(t, px, fonte) > maxW && cur) { lin.push(cur); cur = p; } else cur = t; }
  if (cur) lin.push(cur);
  return lin;
}
function caber(txt, fonte, maxW, maxLin, ini, min) {   // maior fonte que cabe em maxLin linhas
  for (let px = ini; px >= min; px -= 2) { const l = quebrar(txt, px, maxW, fonte); if (l.length <= maxLin && l.every((x) => largura(x, px, fonte) <= maxW)) return { px, l }; }
  return { px: min, l: quebrar(txt, min, maxW, fonte).slice(0, maxLin + 1) };
}
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); };
const fase = (t, a, b) => ease((t - a) / (b - a));
const svgIni = (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
const DEFS = `<defs>
<linearGradient id="scrimB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.82"/></linearGradient>
<linearGradient id="scrimT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.78"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="ouro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B8860B"/><stop offset="0.5" stop-color="#F2C94C"/><stop offset="1" stop-color="#D4A017"/></linearGradient>
<radialGradient id="graf" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="#2a2a2a"/><stop offset="0.6" stop-color="#141414"/><stop offset="1" stop-color="#050505"/></radialGradient>
<filter id="sombra" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.7"/></filter>
<filter id="brilho" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
</defs>`;

function layout(W, H) {
  const k = Math.min(W, H) / 1080, vert = H > W * 1.2, horiz = W > H * 1.2;
  return { k, vert, horiz, mx: Math.round((horiz ? 110 : 70) * k), tituloY: vert ? Math.round(H * 0.15) : (horiz ? Math.round(H * 0.60) : Math.round(H * 0.10)),
    legY: vert ? Math.round(H * 0.70) : (horiz ? Math.round(H * 0.86) : Math.round(H * 0.80)) };
}

// bloco de texto (selo / titulo / subtitulo) com animacao de entrada
function blocoTexto(c, W, H, t, opt = {}) {
  const L = layout(W, H), k = L.k, maxW = W - 2 * L.mx;
  const centro = opt.centro || c.texto_pos === "centro";
  let y = opt.y != null ? opt.y : (c.texto_pos === "baixo" ? Math.round(H * (L.vert ? 0.52 : 0.58)) : (centro ? Math.round(H * 0.36) : L.tituloY));
  const anc = centro || L.vert ? "middle" : "start", x0 = anc === "middle" ? W / 2 : L.mx;
  let s = "";
  const a0 = opt.atraso || 0.15;
  if (c.selo) {
    const px = Math.round(30 * k), tw = largura(String(c.selo).toUpperCase(), px, "PoppinsB") + 44 * k, hh = px + 26 * k;
    const p = fase(t, a0, a0 + 0.45), sx = anc === "middle" ? x0 - tw / 2 : x0;
    s += `<g opacity="${p}" transform="translate(0 ${(1 - p) * 20 * k})"><rect x="${sx}" y="${y}" rx="${hh / 2}" width="${tw}" height="${hh}" fill="url(#ouro)"/>`
      + `<text x="${sx + tw / 2}" y="${y + hh / 2 + px * 0.36}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="${px}" letter-spacing="${2 * k}" fill="#111">${esc(String(c.selo).toUpperCase())}</text></g>`;
    y += hh + 26 * k;
  }
  if (c.titulo) {
    const T = String(c.titulo).toUpperCase();
    const f = caber(T, "Anton", maxW, L.vert ? 4 : 3, Math.round((L.vert ? 118 : 104) * k), Math.round(56 * k));
    const p = fase(t, a0 + 0.15, a0 + 0.75);
    s += `<g opacity="${p}" transform="translate(0 ${(1 - p) * 46 * k})" filter="url(#sombra)">`;
    f.l.forEach((ln, i) => { s += `<text x="${x0}" y="${y + f.px * 0.92 + i * f.px * 1.04}" text-anchor="${anc}" font-family="Anton" font-size="${f.px}" fill="#FFFFFF" letter-spacing="${1 * k}">${esc(ln)}</text>`; });
    s += `</g>`;
    y += f.l.length * f.px * 1.04 + 18 * k;
    const bw = Math.min(maxW * 0.42, 260 * k) * fase(t, a0 + 0.5, a0 + 1.0);
    s += `<rect x="${anc === "middle" ? x0 - bw / 2 : x0}" y="${y}" width="${bw}" height="${8 * k}" rx="${4 * k}" fill="url(#ouro)"/>`;
    y += 34 * k;
  }
  if (c.subtitulo) {
    const f = caber(c.subtitulo, "Poppins", maxW, 4, Math.round(46 * k), Math.round(30 * k));
    const p = fase(t, a0 + 0.45, a0 + 1.05);
    s += `<g opacity="${p}" transform="translate(0 ${(1 - p) * 30 * k})" filter="url(#sombra)">`;
    f.l.forEach((ln, i) => { s += `<text x="${x0}" y="${y + f.px + i * f.px * 1.3}" text-anchor="${anc}" font-family="Poppins" font-weight="500" font-size="${f.px}" fill="#F2F2F2">${esc(ln)}</text>`; });
    s += `</g>`;
    y += f.l.length * f.px * 1.3 + 10 * k;
  }
  return { svg: s, fimY: y };
}

// destaques (caixas douradas pulsando) -- telas do sistema
function destaques(c, W, H, t, area) {
  let s = "";
  (c.destaques || []).forEach((d, i) => {
    const a = (Number(d.ini) || (0.8 + i * 1.2));
    const p = fase(t, a, a + 0.4); if (p <= 0) return;
    const x = area.x + area.w * (Number(d.x) || 0), y = area.y + area.h * (Number(d.y) || 0), w = area.w * (Number(d.w) || 0.2), h = area.h * (Number(d.h) || 0.1);
    const pulso = 0.6 + 0.4 * Math.abs(Math.sin((t - a) * 3));
    s += `<g opacity="${p}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${OURO}" stroke-width="${6 * layout(W, H).k}" opacity="${pulso}"/>`;
    if (d.rotulo) {
      const k = layout(W, H).k, px = Math.round(30 * k), tw = largura(d.rotulo, px, "PoppinsB") + 36 * k;
      let ly = y + h + 14 * k; if (ly + px + 24 * k > H - 40 * k) ly = y - px - 40 * k;
      const lx = Math.max(20 * k, Math.min(W - tw - 20 * k, x));
      s += `<rect x="${lx}" y="${ly}" width="${tw}" height="${px + 22 * k}" rx="${12 * k}" fill="#111" stroke="${OURO}" stroke-width="2"/>`
        + `<text x="${lx + tw / 2}" y="${ly + px * 0.9 + 6 * k}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="${px}" fill="${OURO}">${esc(d.rotulo)}</text>`;
    }
    s += `</g>`;
  });
  return s;
}

// ---------------------------------------------------------------- cenas graficas (quadro a quadro)
let MAPA = null;
function quadro(c, W, H, t, ctx) {
  const L = layout(W, H), k = L.k;
  let s = svgIni(W, H) + DEFS;
  if (c.tipo === "midia" || c.tipo === "tela") {
    if (c.titulo || c.subtitulo || c.selo) {
      if (c.texto_pos === "baixo" || !L.vert) s += `<rect x="0" y="${H * 0.45}" width="${W}" height="${H * 0.55}" fill="url(#scrimB)"/>`;
      else s += `<rect x="0" y="0" width="${W}" height="${H * 0.55}" fill="url(#scrimT)"/>`;
    }
    if (ctx.legendas && L.vert) s += `<rect x="0" y="${H * 0.6}" width="${W}" height="${H * 0.4}" fill="url(#scrimB)" opacity="0.55"/>`;
    s += blocoTexto(c, W, H, t).svg;
    if (c.tipo === "tela" && ctx.area) s += destaques(c, W, H, t, ctx.area);
  } else if (c.tipo === "cartao") {
    s += blocoTexto(c, W, H, t, { centro: true, y: Math.round(H * (L.vert ? 0.33 : 0.26)) }).svg;
  } else if (c.tipo === "dados") {
    const b = blocoTexto({ titulo: c.titulo, selo: c.selo }, W, H, t, { centro: true, y: Math.round(H * (L.vert ? 0.15 : 0.08)) });
    s += b.svg;
    const itens = (c.itens || []).slice(0, 4), n = itens.length || 1;
    const col = L.horiz ? n : (n > 2 ? 2 : 1), lin = Math.ceil(n / col);
    const areaY = b.fimY + 40 * k, areaH = H * (L.vert ? 0.62 : 0.70) - areaY + H * 0.1;
    const cw = (W - 2 * L.mx) / col, ch = Math.min(areaH / lin, 380 * k);
    itens.forEach((it, i) => {
      const linha = Math.floor(i / col), naLinha = Math.min(col, n - linha * col), cx = W / 2 + ((i % col) - (naLinha - 1) / 2) * cw, cy = areaY + linha * ch;
      const a = 0.5 + i * 0.25, p = fase(t, a, a + 0.5), cnt = fase(t, a, a + 1.4);
      const num = Number(String(it.valor).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
      const mostra = isFinite(num) && /^[\d.,]+$/.test(String(it.valor).replace(/[^\d.,]/g, "")) ? Math.round(num * cnt).toLocaleString("pt-BR") + String(it.valor).replace(/^[\d.,]+/, "") : String(it.valor);
      const px = Math.round(Math.min(150, 520 / Math.max(3, String(it.valor).length)) * k * (col > 1 ? 0.9 : 1.1));
      s += `<g opacity="${p}" transform="translate(0 ${(1 - p) * 30 * k})">`
        + `<rect x="${cx - cw / 2 + 14 * k}" y="${cy}" width="${cw - 28 * k}" height="${ch - 28 * k}" rx="${22 * k}" fill="#111" fill-opacity="0.78" stroke="${OURO}" stroke-opacity="0.55" stroke-width="2"/>`
        + `<text x="${cx}" y="${cy + (ch - 28 * k) * 0.52}" text-anchor="middle" font-family="Anton" font-size="${px}" fill="url(#ouro)">${esc(mostra)}</text>`;
      const r = caber(it.rotulo || "", "Poppins", cw - 70 * k, 2, Math.round(36 * k), Math.round(24 * k));
      r.l.forEach((ln, j) => { s += `<text x="${cx}" y="${cy + (ch - 28 * k) * 0.52 + r.px * 1.5 + j * r.px * 1.25}" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="${r.px}" fill="#EDEDED">${esc(ln)}</text>`; });
      s += `</g>`;
    });
  } else if (c.tipo === "mapa") {
    s += mapaSVG(c, W, H, t, ctx);
  } else if (c.tipo === "abertura") {
    const p = fase(t, 0.1, 0.9), lw = W * (L.vert ? 0.82 : 0.56), lh = lw * (ctx.logoH / ctx.logoW);
    const sc = 0.88 + 0.12 * p, cx = W / 2, cy = H * (L.vert ? 0.44 : 0.42);
    const sweep = fase(t, 0.4, 1.6);
    s += `<rect width="${W}" height="${H}" fill="url(#graf)"/>`;
    s += `<rect x="${-W * 0.6 + sweep * W * 1.8}" y="0" width="${W * 0.18}" height="${H}" fill="#F2C94C" opacity="${0.10 * (1 - Math.abs(sweep - 0.5) * 2)}" transform="skewX(-18)"/>`;
    s += `<g opacity="${p}" transform="translate(${cx} ${cy}) scale(${sc}) translate(${-lw / 2} ${-lh / 2})"><image width="${lw}" height="${lh}" xlink:href="${ctx.logo}"/></g>`;
    const bw = W * 0.5 * fase(t, 0.7, 1.4);
    s += `<rect x="${W / 2 - bw / 2}" y="${cy + lh / 2 + 40 * k}" width="${bw}" height="${6 * k}" rx="${3 * k}" fill="url(#ouro)"/>`;
    if (c.titulo) {
      const f = caber(c.titulo, "Poppins", W - 2 * L.mx, 2, Math.round(44 * k), Math.round(28 * k)), q = fase(t, 1.0, 1.6);
      f.l.forEach((ln, i) => { s += `<text opacity="${q}" x="${W / 2}" y="${cy + lh / 2 + 110 * k + i * f.px * 1.3}" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="${f.px}" letter-spacing="${3 * k}" fill="#EDEDED">${esc(ln.toUpperCase())}</text>`; });
    }
  } else if (c.tipo === "encerramento") {
    s += `<rect width="${W}" height="${H}" fill="url(#graf)"/>`;
    const lw = W * (L.vert ? 0.70 : 0.42), lh = lw * (ctx.logoH / ctx.logoW), p = fase(t, 0.1, 0.8);
    const cy = H * (L.vert ? 0.27 : 0.25);
    s += `<g opacity="${p}"><image x="${W / 2 - lw / 2}" y="${cy - lh / 2}" width="${lw}" height="${lh}" xlink:href="${ctx.logo}"/></g>`;
    let y = cy + lh / 2 + 70 * k;
    if (c.titulo) {
      const f = caber(String(c.titulo).toUpperCase(), "Anton", W - 2 * L.mx, 2, Math.round(96 * k), Math.round(54 * k)), q = fase(t, 0.4, 1.0);
      f.l.forEach((ln, i) => { s += `<text opacity="${q}" transform="translate(0 ${(1 - q) * 30 * k})" x="${W / 2}" y="${y + f.px + i * f.px * 1.05}" text-anchor="middle" font-family="Anton" font-size="${f.px}" fill="#FFF">${esc(ln)}</text>`; });
      y += f.l.length * f.px * 1.05 + 40 * k;
    }
    (c.linhas || []).slice(0, 4).forEach((ln, i) => {
      const q = fase(t, 0.7 + i * 0.2, 1.2 + i * 0.2), px = Math.round(40 * k), tw = Math.min(W - 2 * L.mx, largura(ln, px, "PoppinsB") + 80 * k), hh = px + 34 * k;
      const by = y + i * (hh + 22 * k);
      s += `<g opacity="${q}" transform="translate(0 ${(1 - q) * 24 * k})"><rect x="${W / 2 - tw / 2}" y="${by}" width="${tw}" height="${hh}" rx="${hh / 2}" fill="${i === 0 ? "url(#ouro)" : "#161616"}" stroke="${OURO}" stroke-width="2"/>`
        + `<text x="${W / 2}" y="${by + hh / 2 + px * 0.36}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="${px}" fill="${i === 0 ? "#111" : "#F2F2F2"}">${esc(ln)}</text></g>`;
    });
  }
  return s + `</svg>`;
}

function mapaSVG(c, W, H, t, ctx) {
  const L = layout(W, H), k = L.k;
  const cid = (c.cidades || []).filter((x) => isFinite(x.lat) && isFinite(x.lng));
  if (!cid.length || !MAPA) return "";
  // enquadramento: rota + margem, mantendo proporcao (equiretangular corrigida pela latitude)
  let la0 = Math.min(...cid.map((x) => x.lat)), la1 = Math.max(...cid.map((x) => x.lat)), lo0 = Math.min(...cid.map((x) => x.lng)), lo1 = Math.max(...cid.map((x) => x.lng));
  const latc = (la0 + la1) / 2, cosl = Math.cos(latc * Math.PI / 180);
  const top = H * (L.vert ? 0.30 : 0.24), bot = H * (L.vert ? 0.72 : 0.82), lef = L.mx, rig = W - L.mx;
  let dw = (lo1 - lo0) * cosl, dh = la1 - la0; const minSpan = 4.2; if (dw < minSpan) { lo0 -= (minSpan - dw) / cosl / 2; lo1 += (minSpan - dw) / cosl / 2; dw = minSpan; } if (dh < minSpan) { la0 -= (minSpan - dh) / 2; la1 += (minSpan - dh) / 2; dh = minSpan; }
  const sc = Math.min((rig - lef) / (dw * 1.25), (bot - top) / (dh * 1.25));
  const cxg = (lo0 + lo1) / 2, cyg = (la0 + la1) / 2, mx = (lef + rig) / 2, my = (top + bot) / 2;
  const P = (lng, lat) => [mx + (lng - cxg) * cosl * sc, my - (lat - cyg) * sc];
  let s = `<rect width="${W}" height="${H}" fill="url(#graf)"/>`;
  for (const uf of Object.keys(MAPA)) {
    const dest = uf === (c.uf || "BA");
    for (const ring of MAPA[uf]) {
      const d = ring.map((p, i) => (i ? "L" : "M") + P(p[0], p[1]).map((v) => v.toFixed(1)).join(" ")).join("") + "Z";
      s += `<path d="${d}" fill="${dest ? "#222" : "#141414"}" stroke="${dest ? "#9c7a12" : "#353535"}" stroke-width="${(dest ? 3 : 1.5) * k}" stroke-linejoin="round"/>`;
    }
  }
  const pts = cid.map((x) => P(x.lng, x.lat));
  if (c.modo === "pontos") return s + mapaPontos(c, W, H, t, ctx, cid, pts, k, L, bot);
  let tot = 0; const seg = [0]; for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(tot); }
  const A = Math.max(1.2, Math.min(ctx.animDur - 0.3, 3.2));
  const pr = fase(t, 0.4, 0.4 + A), feito = tot * pr;
  const dpath = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
  s += `<path d="${dpath}" fill="none" stroke="#F2C94C" stroke-width="${16 * k}" stroke-opacity="0.25" filter="url(#brilho)" stroke-dasharray="${feito} ${tot + 10}" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="${dpath}" fill="none" stroke="url(#ouro)" stroke-width="${7 * k}" stroke-dasharray="${feito} ${tot + 10}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // caminhao na ponta
  let hx = pts[0][0], hy = pts[0][1];
  for (let i = 1; i < pts.length; i++) if (seg[i] >= feito) { const f = (feito - seg[i - 1]) / Math.max(1e-6, seg[i] - seg[i - 1]); hx = pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]); hy = pts[i - 1][1] + f * (pts[i][1] - pts[i - 1][1]); break; } else { hx = pts[i][0]; hy = pts[i][1]; }
  const labs = [];
  cid.forEach((x, i) => {
    const vis = i === 0 || seg[i] <= feito + 0.5; if (!vis) return;
    const pp = i === 0 ? fase(t, 0.1, 0.5) : Math.min(1, (feito - seg[i]) / (30 * k) + 0.4);
    const [px, py] = pts[i], base = i === 0 || x.base;
    s += `<circle cx="${px}" cy="${py}" r="${(base ? 16 : 10) * k * Math.min(1, pp + 0.3)}" fill="${base ? "#F2C94C" : "#FFFFFF"}" stroke="#111" stroke-width="${3 * k}"/>`;
    labs.push({ x: px, y: py, nome: x.nome, base, o: Math.min(1, pp), i });
  });
  // rotulos: evita sobrepor (alterna lado)
  const fs0 = Math.round((cid.length > 9 ? 28 : 34) * k), usados = [];
  for (const l of labs) {
    const tw = largura(l.nome, fs0, "PoppinsB");
    let lx = l.x + 18 * k, ly = l.y + fs0 * 0.35, anc = "start";
    if (lx + tw > W - 20 * k) { lx = l.x - 18 * k; anc = "end"; }
    const caixa = () => anc === "start" ? [lx, ly - fs0, lx + tw, ly + 6] : [lx - tw, ly - fs0, lx, ly + 6];
    for (let tent = 0; tent < 6; tent++) { const b = caixa(); if (!usados.some((u) => b[0] < u[2] && b[2] > u[0] && b[1] < u[3] && b[3] > u[1])) break; ly += (tent % 2 ? -1 : 1) * (fs0 + 6) * (tent + 1); }
    usados.push(caixa());
    s += `<text opacity="${l.o}" x="${lx}" y="${ly}" text-anchor="${anc}" font-family="Poppins" font-weight="${l.base ? 800 : 600}" font-size="${l.base ? fs0 * 1.15 : fs0}" fill="${l.base ? "#F2C94C" : "#F5F5F5"}" stroke="#000" stroke-width="${5 * k}" paint-order="stroke">${esc(l.nome)}</text>`;
  }
  if (pr > 0 && pr < 1) s += `<g transform="translate(${hx} ${hy})"><circle r="${24 * k}" fill="#111" stroke="${OURO}" stroke-width="${4 * k}"/><path transform="scale(${1.15 * k}) translate(-14 -10)" d="M0 4h16v12H0zM16 8h7l5 5v3h-12z" fill="${OURO}"/><circle transform="scale(${1.15 * k})" cx="-8" cy="7" r="3" fill="#111"/><circle transform="scale(${1.15 * k})" cx="7" cy="7" r="3" fill="#111"/></g>`;
  s += blocoTexto({ titulo: c.titulo, subtitulo: c.subtitulo, selo: c.selo }, W, H, t, { centro: true, y: Math.round(H * (L.vert ? 0.135 : 0.05)) }).svg;
  if (c.rodape) {
    const px = Math.round(34 * k), r = caber(c.rodape, "Poppins", W - 2 * L.mx, 3, px, Math.round(26 * k)), y0 = bot + 40 * k, q = fase(t, 0.8, 1.4);
    r.l.forEach((ln, i) => { s += `<text opacity="${q}" x="${W / 2}" y="${y0 + i * r.px * 1.35}" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="${r.px}" fill="#EDEDED">${esc(ln)}</text>`; });
  }
  return s;
}

// mapa "pontos": cidades de coleta/atendidas aparecem uma a uma e seguem para a base (sem inventar ordem de rota)
function mapaPontos(c, W, H, t, ctx, cid, pts, k, L, bot) {
  let s = ""; const bi = cid.findIndex((x) => x.base); const outros = cid.map((x, i) => i).filter((i) => i !== bi);
  const A = Math.max(1.2, Math.min(ctx.animDur - 1.4, 2.6)), passo = A / Math.max(1, outros.length);
  const fs0 = Math.round((cid.length > 9 ? 28 : 34) * k), usados = [];
  const rot = (i, o) => {
    const [px, py] = pts[i], base = i === bi, nome = cid[i].nome, tw = largura(nome, fs0, "PoppinsB");
    let lx = px + 18 * k, ly = py + fs0 * 0.35, anc = "start"; if (lx + tw > W - 20 * k) { lx = px - 18 * k; anc = "end"; }
    const caixa = () => anc === "start" ? [lx, ly - fs0, lx + tw, ly + 6] : [lx - tw, ly - fs0, lx, ly + 6];
    for (let tent = 0; tent < 6; tent++) { const b = caixa(); if (!usados.some((u) => b[0] < u[2] && b[2] > u[0] && b[1] < u[3] && b[3] > u[1])) break; ly += (tent % 2 ? -1 : 1) * (fs0 + 6) * (tent + 1); }
    usados.push(caixa());
    return `<text opacity="${o}" x="${lx}" y="${ly}" text-anchor="${anc}" font-family="Poppins" font-weight="${base ? 800 : 600}" font-size="${base ? fs0 * 1.15 : fs0}" fill="${base ? "#F2C94C" : "#F5F5F5"}" stroke="#000" stroke-width="${5 * k}" paint-order="stroke">${esc(nome)}</text>`;
  };
  let labs = "";
  outros.forEach((i, j) => {
    const a = 0.4 + j * passo, o = fase(t, a, a + 0.35); if (o <= 0) return;
    const [px, py] = pts[i];
    s += `<circle cx="${px}" cy="${py}" r="${(22 * (1 - o) + 10) * k}" fill="#F2C94C" fill-opacity="${0.25 * (1 - o)}"/><circle cx="${px}" cy="${py}" r="${10 * k * o}" fill="#FFF" stroke="#111" stroke-width="${3 * k}"/>`;
    labs += rot(i, o);
  });
  if (bi >= 0) {
    const cx = outros.reduce((a, i) => a + pts[i][0], 0) / Math.max(1, outros.length), cy = outros.reduce((a, i) => a + pts[i][1], 0) / Math.max(1, outros.length);
    const [bx, by] = pts[bi], len = Math.hypot(bx - cx, by - cy), pr = fase(t, 0.5 + A, 1.6 + A);
    if (pr > 0 && outros.length) {
      s += `<path d="M${cx.toFixed(1)} ${cy.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}" stroke="#F2C94C" stroke-width="${14 * k}" stroke-opacity="0.25" filter="url(#brilho)" stroke-dasharray="${len * pr} ${len + 10}"/>`
        + `<path d="M${cx.toFixed(1)} ${cy.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}" stroke="url(#ouro)" stroke-width="${7 * k}" stroke-linecap="round" stroke-dasharray="${len * pr} ${len + 10}"/>`;
      if (pr < 1) { const hx = cx + (bx - cx) * pr, hy = cy + (by - cy) * pr; s += `<g transform="translate(${hx} ${hy})"><circle r="${24 * k}" fill="#111" stroke="${OURO}" stroke-width="${4 * k}"/><path transform="scale(${1.15 * k}) translate(-14 -10)" d="M0 4h16v12H0zM16 8h7l5 5v3h-12z" fill="${OURO}"/></g>`; }
    }
    s += `<circle cx="${bx}" cy="${by}" r="${16 * k}" fill="#F2C94C" stroke="#111" stroke-width="${3 * k}"/>`;
    labs = rot(bi, 1) + labs;
  }
  s += labs;
  s += blocoTexto({ titulo: c.titulo, subtitulo: c.subtitulo, selo: c.selo }, W, H, t, { centro: true, y: Math.round(H * (L.vert ? 0.135 : 0.05)) }).svg;
  if (c.rodape) {
    const r = caber(c.rodape, "Poppins", W - 2 * L.mx, 3, Math.round(34 * k), Math.round(26 * k)), y0 = bot + 40 * k, q = fase(t, 0.8, 1.4);
    r.l.forEach((ln, i) => { s += `<text opacity="${q}" x="${W / 2}" y="${y0 + i * r.px * 1.35}" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="${r.px}" fill="#EDEDED">${esc(ln)}</text>`; });
  }
  return s;
}

// legenda (palavra atual em dourado)
function legendaSVG(W, H, palavras, atual) {
  const L = layout(W, H), k = L.k, px = Math.round((L.horiz ? 46 : 54) * k), maxW = W - 2 * L.mx - 40 * k;
  const linhas = []; let cur = [];
  for (let i = 0; i < palavras.length; i++) { const t = [...cur, palavras[i]].map((x) => x.w).join(" "); if (largura(t, px, "PoppinsB") > maxW && cur.length) { linhas.push(cur); cur = [palavras[i]]; } else cur.push(palavras[i]); }
  if (cur.length) linhas.push(cur);
  const lh = px * 1.28, bh = linhas.length * lh + 28 * k;
  const bw = Math.max(...linhas.map((l) => largura(l.map((x) => x.w).join(" "), px, "PoppinsB"))) + 56 * k;
  let s = svgIni(W, H) + `<rect x="${W / 2 - bw / 2}" y="${L.legY - 14 * k}" width="${bw}" height="${bh}" rx="${18 * k}" fill="#000" fill-opacity="0.62"/>`;
  linhas.forEach((ln, i) => {
    s += `<text xml:space="preserve" x="${W / 2}" y="${L.legY + px * 0.95 + i * lh}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="${px}">`;
    ln.forEach((p, j) => { s += `<tspan fill="${p.i === atual ? "#F2C94C" : "#FFFFFF"}">${esc(p.w)}${j < ln.length - 1 ? " " : ""}</tspan>`; });
    s += `</text>`;
  });
  return s + `</svg>`;
}
function blocosLegenda(palavras) {   // grupos de ate 4 palavras / 26 caracteres, quebrando na pontuacao
  const out = []; let cur = [];
  for (const p of palavras) {
    cur.push(p);
    const txt = cur.map((x) => x.w).join(" ");
    if (cur.length >= 4 || txt.length >= 26 || /[.,;:!?]$/.test(p.w)) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
}

async function svgPng(svg, png, W, H) {
  const f = png.replace(/\.png$/, ".svg"); fs.writeFileSync(f, svg);
  await run("rsvg-convert", ["-w", String(W), "-h", String(H), "-f", "png", "-o", png, f]);
  fs.unlinkSync(f);
}
function dataUri(f) { const ext = path.extname(f).toLowerCase(); return "data:image/" + (ext === ".jpg" || ext === ".jpeg" ? "jpeg" : "png") + ";base64," + fs.readFileSync(f).toString("base64"); }

// ---------------------------------------------------------------- render
async function render(rec, dir, prog) {
  const FMT = { "9:16": [1080, 1920], "1:1": [1080, 1080], "16:9": [1920, 1080], "4:5": [1080, 1350] };
  const [W, H] = FMT[rec.formato] || FMT["9:16"];
  const FPS = 30, k = Math.min(W, H) / 1080;
  const cenas = (rec.cenas || []).filter((c) => c && c.tipo);
  if (!cenas.length) throw new Error("projeto sem cenas");
  prog(2, "baixando midias");
  if (rec.mapa_url && cenas.some((c) => c.tipo === "mapa")) { try { MAPA = JSON.parse(fs.readFileSync(await baixar(rec.mapa_url, "mapa-ne.json"), "utf8")); } catch { MAPA = null; } }
  // logo (abertura / encerramento / marca d'agua) -- reduzida para o SVG ficar leve
  const logos = {};
  async function logoPrep(url, chave) {
    if (!url) return null; if (logos[chave]) return logos[chave];
    const src = await baixar(url, chave); const dst = path.join(dir, "logo-" + crypto.createHash("md5").update(chave).digest("hex").slice(0, 8) + ".png");
    await run("ffmpeg", ["-y", "-v", "error", "-i", src, "-vf", "scale='min(1000,iw)':-1", dst]);
    const pr = probe(dst); logos[chave] = { f: dst, uri: dataUri(dst), w: pr.w || 1000, h: pr.h || 330 }; return logos[chave];
  }
  for (const c of cenas) {
    if (c.midia && c.midia.url) { c._arq = await baixar(c.midia.url, c.midia.chave); c._pr = probe(c._arq); }
    if (c.narracao && c.narracao.url) { c._narr = await baixar(c.narracao.url, c.narracao.chave); c._narrDur = c.narracao.dur || probe(c._narr).dur; }
    if (c.tipo === "abertura" || c.tipo === "encerramento") c._logo = await logoPrep(c.logo_url || rec.logo_url, c.logo_chave || rec.logo_chave || "logo-rf.png");
  }
  const marca = rec.marca && rec.marca.url ? await logoPrep(rec.marca.url, rec.marca.chave || "marca.png") : null;
  // duracoes (a narracao manda; transicao entra/sai)
  const TR = { corte: 0.04 };
  cenas.forEach((c, i) => {
    c._tin = i === 0 ? 0 : (c.transicao === "corte" ? 0.04 : Math.max(0.2, Math.min(1.2, Number(c.trans_dur) || 0.6)));
  });
  cenas.forEach((c, i) => {
    const tout = i < cenas.length - 1 ? cenas[i + 1]._tin : 0;
    c._tout = tout;
    const vel = Math.max(0.7, Math.min(1.4, Number((c.narracao && c.narracao.velocidade) || rec.velocidade_voz || 1)));
    c._vel = vel;
    c._atraso = c._tin + 0.25;
    const nd = c._narr ? c._narrDur / vel : 0;
    const min = c._narr ? c._atraso + nd + 0.45 + tout : 0;
    let d = Number(c.dur) || (c.tipo === "abertura" ? 2.6 : c.tipo === "encerramento" ? 4.5 : 5);
    if (c.midia && c._pr && c._pr.dur && c.midia.tipo === "video" && !c.dur) d = Math.min(d, c._pr.dur / (Number(c.velocidade) || 1));
    c._dur = Math.max(d, min, c._tin + tout + 1.0);
  });
  let total = 0; const ofs = [];
  cenas.forEach((c, i) => { ofs.push(i === 0 ? 0 : total - c._tin); total = (i === 0 ? c._dur : total - c._tin + c._dur); });
  const TOTAL = total;
  if (TOTAL > 180) throw new Error("video passou de 3 minutos (" + Math.round(TOTAL) + " s)");

  // ---- cada cena vira um clipe
  const clipes = [];
  for (let i = 0; i < cenas.length; i++) {
    const c = cenas[i], cd = path.join(dir, "c" + i); fs.mkdirSync(cd, { recursive: true });
    prog(5 + Math.round(70 * i / cenas.length), "montando cena " + (i + 1) + " de " + cenas.length);
    const dur = c._dur, N = Math.round(dur * FPS);
    // 1) fundo
    const fundo = path.join(cd, "fundo.mp4");
    const enc = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(FPS), "-threads", String(THREADS)];
    let area = null;
    if (c._arq && (c.tipo === "midia" || c.tipo === "tela")) {
      const ehVideo = c.midia.tipo === "video" || (c._pr && c._pr.dur > 0.5 && /\.(mp4|mov|webm|m4v|mkv)$/i.test(c._arq));
      const iw = c._pr.w || W, ih = c._pr.h || H;
      let modo = c.ajuste || (c.tipo === "tela" ? "conter" : "auto");
      if (modo === "auto") modo = (iw / ih > W / H * 1.35 || iw / ih < W / H / 1.35) ? "desfocado" : "cobrir";
      const mov = c.movimento || (ehVideo ? "nenhum" : (c.tipo === "tela" ? (ih / iw > H / W * 1.15 ? "rolar" : "zoom_in") : ["zoom_in", "zoom_out", "pan_dir", "pan_esq"][i % 4]));
      let pre;
      if (modo === "cobrir") pre = `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}`;
      else if (modo === "conter" || modo === "desfocado") {
        const sw = Math.round(W * (c.tipo === "tela" ? (H > W ? 0.98 : 0.90) : 0.96)), sh = Math.round(H * (c.tipo === "tela" ? (H > W ? 0.62 : 0.74) : 0.90));
        const fit = Math.min(sw / iw, sh / ih), fw = Math.round(iw * fit / 2) * 2, fh = Math.round(ih * fit / 2) * 2;
        area = { x: (W - fw) / 2, y: (H - fh) / 2 + (c.tipo === "tela" && H > W ? H * 0.04 : 0), w: fw, h: fh };
        const bgf = modo === "desfocado" ? `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=40:3,eq=brightness=-0.18:saturation=0.85` : `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=60:4,eq=brightness=-0.42:saturation=0.4`;
        if (mov === "rolar" && !ehVideo) {
          const fw2 = Math.round(W * 0.92 / 2) * 2, fh2 = Math.round(ih * (fw2 / iw) / 2) * 2, vh = Math.round(H * 0.74 / 2) * 2;
          area = { x: (W - fw2) / 2, y: (H - vh) / 2 + H * 0.04, w: fw2, h: vh };
          pre = `split[a][b];[a]${bgf}[f];[b]scale=${fw2}:${fh2}:flags=lanczos,crop=${fw2}:${Math.min(vh, fh2)}:0:'(ih-oh)*(1-cos(PI*min(1,max(0,(t-0.6)/${Math.max(1, dur - 1.6)}))))/2'[p];[f][p]overlay=${area.x}:${area.y}`;
        } else pre = `split[a][b];[a]${bgf}[f];[b]scale=${fw}:${fh}:flags=lanczos[p];[f][p]overlay=${area.x}:${area.y}`;
      }
      let vf;
      if (ehVideo) {
        const vel = Math.max(0.25, Math.min(4, Number(c.velocidade) || 1));
        const ini = Math.max(0, Number(c.corte_ini) || 0);
        const args = ["-y", "-v", "error", "-ss", String(ini), "-t", String(dur * vel + 0.5), "-i", c._arq];
        vf = `[0:v]setpts=(PTS-STARTPTS)/${vel},fps=${FPS},${pre},eq=contrast=1.05:saturation=1.08,tpad=stop_mode=clone:stop_duration=${dur},trim=duration=${dur},setsar=1,format=yuv420p[v]`;
        await run("ffmpeg", [...args, "-filter_complex", vf, "-map", "[v]", "-an", ...enc, fundo]);
      } else {
        const Z = 0.13, zexp = mov === "zoom_out" ? `${1 + Z}-${Z}*on/${N}` : (mov === "nenhum" || mov === "rolar" ? "1" : `1+${Z}*on/${N}`);
        const xexp = mov === "pan_dir" ? `(iw-iw/zoom)*on/${N}` : mov === "pan_esq" ? `(iw-iw/zoom)*(1-on/${N})` : `(iw-iw/zoom)/2`;
        const yexp = `(ih-ih/zoom)/2`;
        const zoom = (mov === "nenhum" || mov === "rolar") ? "" : `,scale=${W * 2}:${H * 2}:flags=bicubic,zoompan=z='${zexp}':x='${xexp}':y='${yexp}':d=1:s=${W}x${H}:fps=${FPS}`;
        const pan = (mov === "pan_dir" || mov === "pan_esq") ? "" : "";
        vf = `[0:v]${pre},eq=contrast=1.05:saturation=1.08${zoom}${pan},trim=duration=${dur},setsar=1,format=yuv420p[v]`;
        if ((mov === "pan_dir" || mov === "pan_esq") && modo === "cobrir") vf = vf.replace(`zoompan=z='${zexp}'`, `zoompan=z='1.12'`);
        await run("ffmpeg", ["-y", "-v", "error", "-loop", "1", "-framerate", String(FPS), "-t", String(dur), "-i", c._arq, "-filter_complex", vf, "-map", "[v]", ...enc, "-t", String(dur), fundo]);
      }
    } else {
      // fundo grafico: grafite com leve movimento de luz
      await run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=0x0b0b0b:s=${W}x${H}:r=${FPS}:d=${dur}`, "-vf", "format=yuv420p", ...enc, fundo]);
    }
    // 2) camada animada (PNG com transparencia) quadro a quadro so na animacao; depois segura o ultimo quadro
    const animDur = c.tipo === "mapa" ? Math.min(dur - 0.2, c.modo === "pontos" ? 5 : 4.2) : (c.tipo === "dados" ? Math.min(dur, 2.6) : (c.tipo === "tela" && (c.destaques || []).length ? Math.min(dur, 1.2 + 1.2 * c.destaques.length + 1) : Math.min(dur, 1.9)));
    const ctx = { legendas: rec.legendas !== false && !!c._narr, area, animDur, logo: c._logo && c._logo.uri, logoW: c._logo ? c._logo.w : 1, logoH: c._logo ? c._logo.h : 1 };
    const temCamada = c.tipo !== "midia" || c.titulo || c.subtitulo || c.selo || ctx.legendas;
    const nq = Math.max(1, Math.round(animDur * FPS));
    if (temCamada) {
      const passo = c.tipo === "mapa" ? 1 : 1;
      for (let q = 0; q < nq; q += passo) await svgPng(quadro(c, W, H, c._tin * 0 + q / FPS, ctx), path.join(cd, "q" + String(q).padStart(4, "0") + ".png"), W, H);
    }
    // 3) legendas (palavra a palavra)
    const legs = [];
    if (ctx.legendas && c.narracao && Array.isArray(c.narracao.palavras) && c.narracao.palavras.length) {
      const pal = c.narracao.palavras.map((p, j) => ({ w: String(p.w || p.word || "").trim(), s: Number(p.s ?? p.start) / c._vel + c._atraso, e: Number(p.e ?? p.end) / c._vel + c._atraso, i: j })).filter((p) => p.w);
      const blocos = blocosLegenda(pal);
      for (let b = 0; b < blocos.length; b++) {
        const bl = blocos[b], fimBloco = b < blocos.length - 1 ? blocos[b + 1][0].s : bl[bl.length - 1].e + 0.35;
        for (let j = 0; j < bl.length; j++) {
          const a = j === 0 ? bl[0].s - 0.05 : bl[j].s, z = j < bl.length - 1 ? bl[j + 1].s : fimBloco;
          if (z - a < 0.02) continue;
          const f = path.join(cd, "l" + legs.length + ".png");
          await svgPng(legendaSVG(W, H, bl, bl[j].i), f, W, H);
          legs.push({ f, a: Math.max(0, a), z: Math.min(dur, z) });
        }
      }
    }
    // 4) junta
    const clip = path.join(dir, "cena" + i + ".mp4");
    if (!temCamada && !legs.length) { fs.renameSync(fundo, clip); }
    else {
      const ins = ["-y", "-v", "error", "-i", fundo];
      let fc = "", ult = "[0:v]";
      if (temCamada) {
        ins.push("-framerate", String(FPS), "-i", path.join(cd, "q%04d.png"));
        fc += `[1:v]format=rgba,tpad=stop_mode=clone:stop_duration=${dur}[cam];[0:v][cam]overlay=0:0:shortest=0:eof_action=repeat[x0];`; ult = "[x0]";
      }
      const base = temCamada ? 2 : 1;
      legs.forEach((l, j) => { ins.push("-i", l.f); fc += `${ult}[${base + j}:v]overlay=0:0:enable='between(t,${l.a.toFixed(3)},${l.z.toFixed(3)})'[y${j}];`; ult = `[y${j}]`; });
      fc += `${ult}trim=duration=${dur},format=yuv420p[v]`;
      const scr = path.join(cd, "fc.txt"); fs.writeFileSync(scr, fc);
      await run("ffmpeg", [...ins, "-filter_complex_script", scr, "-map", "[v]", ...enc, "-t", String(dur), clip]);
    }
    clipes.push(clip);
    try { fs.rmSync(cd, { recursive: true, force: true }); } catch { /* */ }
  }

  // ---- montagem final: transicoes + marca + audio
  prog(80, "juntando cenas, narracao e trilha");
  const ins = []; let fc = "";
  clipes.forEach((c) => ins.push("-i", c));
  let ult = "[0:v]", acum = cenas[0]._dur;
  const XF = { fade: "fade", dissolve: "dissolve", slideleft: "slideleft", slideright: "slideright", slideup: "slideup", wipeleft: "wipeleft", wiperight: "wiperight", circleopen: "circleopen", zoomin: "zoomin", smoothleft: "smoothleft", smoothup: "smoothup", fadeblack: "fadeblack", corte: "fade" };
  for (let i = 1; i < clipes.length; i++) {
    const c = cenas[i], d = c._tin, off = acum - d;
    fc += `${ult}[${i}:v]xfade=transition=${XF[c.transicao] || "fade"}:duration=${d.toFixed(3)}:offset=${off.toFixed(3)}[j${i}];`;
    ult = `[j${i}]`; acum = off + c._dur;
  }
  let nIn = clipes.length;
  if (marca) {
    const mw = Math.round((W > H ? 150 : 150) * k);
    ins.push("-i", marca.f); const mi = nIn++;
    const iniM = cenas[0].tipo === "abertura" ? cenas[0]._dur : 0, fimM = cenas[cenas.length - 1].tipo === "encerramento" ? ofs[ofs.length - 1] + 0.3 : TOTAL;
    const pos = rec.marca.pos === "inf-dir" ? `W-w-${Math.round(40 * k)}:H-h-${Math.round(60 * k)}` : rec.marca.pos === "sup-esq" ? `${Math.round(40 * k)}:${Math.round(60 * k)}` : `W-w-${Math.round(36 * k)}:${Math.round((H > W ? 70 : 36) * k)}`;
    fc += `[${mi}:v]scale=${mw}:-1,format=rgba,colorchannelmixer=aa=0.88[mk];${ult}[mk]overlay=${pos}:enable='between(t,${iniM.toFixed(2)},${fimM.toFixed(2)})'[vm];`;
    ult = "[vm]";
  }
  fc += `${ult}format=yuv420p[vout];`;
  // audio
  const narr = [];
  cenas.forEach((c, i) => { if (c._narr) { ins.push("-i", c._narr); narr.push({ idx: nIn++, ini: ofs[i] + c._atraso, vel: c._vel }); } });
  const vozes = [];
  narr.forEach((n, j) => { const at = Math.abs(n.vel - 1) > 0.01 ? `atempo=${n.vel.toFixed(3)},` : ""; fc += `[${n.idx}:a]${at}aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(n.ini * 1000)}|${Math.round(n.ini * 1000)},volume=${Number(rec.volume_voz || 1).toFixed(2)}[n${j}];`; vozes.push(`[n${j}]`); });
  let trilha = null;
  if (rec.trilha && rec.trilha.url) { trilha = await baixar(rec.trilha.url, rec.trilha.chave); ins.push("-stream_loop", "-1", "-i", trilha); }
  const ti = trilha ? nIn++ : -1;
  const vol = Math.max(0, Math.min(1, Number(rec.trilha && rec.trilha.volume != null ? rec.trilha.volume : 0.30)));
  if (vozes.length) fc += `${vozes.join("")}amix=inputs=${vozes.length}:normalize=0:dropout_transition=0,apad,atrim=0:${TOTAL.toFixed(3)}[voz];`;
  if (trilha) fc += `[${ti}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${TOTAL.toFixed(3)},volume=${vol.toFixed(2)},afade=t=in:d=1.2,afade=t=out:st=${Math.max(0, TOTAL - 2.5).toFixed(2)}:d=2.5[mus];`;
  if (vozes.length && trilha) fc += `[voz]asplit=2[voz1][sc];[mus][sc]sidechaincompress=threshold=0.025:ratio=7:attack=25:release=420:makeup=1[musd];[voz1][musd]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]`;
  else if (vozes.length) fc += `[voz]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]`;
  else if (trilha) fc += `[mus]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]`;
  else fc += `anullsrc=r=48000:cl=stereo,atrim=0:${TOTAL.toFixed(3)}[aout]`;
  const scr = path.join(dir, "final.txt"); fs.writeFileSync(scr, fc);
  const saida = path.join(dir, "video.mp4");
  await run("ffmpeg", ["-y", "-v", "error", ...ins, "-filter_complex_script", scr, "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p", "-r", String(FPS), "-g", String(FPS * 2), "-threads", String(THREADS),
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-t", TOTAL.toFixed(3), "-progress", "pipe:1", "-nostats", saida],
  { onOut: (o) => { const m = /out_time_ms=(\d+)/.exec(o); if (m) prog(80 + Math.min(17, Math.round(17 * (Number(m[1]) / 1e6) / TOTAL)), "codificando o video final"); } });
  // capa e previa
  prog(97, "capa e previa");
  const capa = path.join(dir, "capa.jpg");
  const tCapa = cenas.length > 1 ? Math.min(TOTAL - 0.2, ofs[1] + cenas[1]._dur * 0.6) : TOTAL / 2;
  await run("ffmpeg", ["-y", "-v", "error", "-ss", tCapa.toFixed(2), "-i", saida, "-frames:v", "1", "-q:v", "3", capa]);
  const previa = path.join(dir, "previa.jpg"), tw = W > H ? 320 : 180;
  const sel = []; for (let j = 0; j < 6; j++) sel.push((TOTAL * (j + 0.5) / 6).toFixed(2));
  const pins = []; sel.forEach((s) => pins.push("-ss", s, "-i", saida));
  await run("ffmpeg", ["-y", "-v", "error", ...pins, "-filter_complex", sel.map((_, j) => `[${j}:v]trim=end_frame=1,scale=${tw}:-2,setsar=1[p${j}]`).join(";") + ";" + sel.map((_, j) => `[p${j}]`).join("") + `hstack=6`, "-frames:v", "1", "-q:v", "5", previa]);
  const pr = probe(saida);
  return { video: saida, capa, previa, dur: pr.dur || TOTAL, w: pr.w, h: pr.h, tamanho: fs.statSync(saida).size };
}

// ---------------------------------------------------------------- comunicacao com o sistema
function sistema() {
  let disco = null;
  try { const s = fs.statfsSync(BASE); disco = { livre_gb: +(s.bavail * s.bsize / 1e9).toFixed(1), total_gb: +(s.blocks * s.bsize / 1e9).toFixed(1) }; } catch { /* */ }
  const ativo = (u) => { try { return spawnSync("systemctl", ["is-active", u], { encoding: "utf8" }).stdout.trim(); } catch { return "?"; } };
  let ff = ""; try { ff = (spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout || "").split("\n")[0].slice(0, 60); } catch { /* */ }
  return { versao: VERSAO, cpus: os.cpus().length, cpu: (os.cpus()[0] || {}).model || "", mem_total_mb: Math.round(os.totalmem() / 1048576), mem_livre_mb: Math.round(os.freemem() / 1048576),
    carga: os.loadavg().map((x) => +x.toFixed(2)), disco, uptime_h: Math.round(os.uptime() / 3600), ffmpeg: ff, threads: THREADS,
    servicos: { ravi: ativo("rf-ravi"), ciot: ativo("rf-ciot"), estudio: "active" } };
}
async function api(acao, corpo = {}) {
  const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json", "x-estudio-token": TOKEN }, body: JSON.stringify({ acao, ...corpo }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j && (j.erro || j.error)) || ("HTTP " + r.status));
  return j;
}
async function processar(job) {
  const dir = path.join(TMP, String(job.id).replace(/[^a-z0-9-]/gi, "")); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  let ultimoEnvio = 0, cancelar = false;
  const prog = (p, etapa) => {
    if (Date.now() - ultimoEnvio < 4000 && p < 99) return; ultimoEnvio = Date.now();
    log(job.id, p + "%", etapa);
    api("worker_status", { job_id: job.id, status: "renderizando", progresso: p, etapa }).then((r) => { if (r && r.cancelar) cancelar = true; }).catch(() => {});
    if (cancelar) throw new Error("cancelado pelo sistema");
  };
  const t0 = Date.now();
  try {
    const r = await render(job.receita, dir, prog);
    prog(98, "enviando o video");
    const up = async (url, f, tipo) => { const b = fs.readFileSync(f); const rr = await fetch(url, { method: "PUT", headers: { "Content-Type": tipo, "x-upsert": "true" }, body: b }); if (!rr.ok) throw new Error("upload " + rr.status + " " + (await rr.text()).slice(0, 200)); };
    await up(job.upload_video, r.video, "video/mp4");
    if (job.upload_capa) await up(job.upload_capa, r.capa, "image/jpeg");
    await api("worker_status", { job_id: job.id, status: "pronto", progresso: 100, etapa: "pronto", duracao: +r.dur.toFixed(2), tamanho: r.tamanho, largura: r.w, altura: r.h,
      previa_b64: fs.readFileSync(r.previa).toString("base64"), segundos_render: Math.round((Date.now() - t0) / 1000) });
    log(job.id, "pronto", Math.round((Date.now() - t0) / 1000) + "s");
  } catch (e) {
    log(job.id, "erro", e.message);
    await api("worker_status", { job_id: job.id, status: "erro", erro: String(e.message || e).slice(0, 1500) }).catch(() => {});
  } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }
}
async function laco() {
  log(VERSAO, "iniciado; threads", THREADS);
  let n = 0;
  for (;;) {
    try {
      const r = await api("worker_pull", { sistema: sistema() });
      if (r.comando === "atualizar" && typeof r.codigo === "string" && r.codigo.includes("rf-estudio-v") && r.codigo.length > 5000) {
        const atual = new URL(import.meta.url).pathname;
        fs.copyFileSync(atual, atual + ".anterior"); fs.writeFileSync(atual + ".novo", r.codigo); fs.renameSync(atual + ".novo", atual);
        log("atualizado; reiniciando"); process.exit(0);
      }
      if (r.job) { await processar(r.job); continue; }
      if (++n % 50 === 0) limparCache();
      await sleep(Number(r.espera) || 8000);
    } catch (e) { log("sem contato:", e.message); await sleep(20000); }
  }
}

if (LOCAL) {
  const rec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const dir = process.argv[3] || path.join(TMP, "local"); fs.mkdirSync(dir, { recursive: true });
  render(rec, dir, (p, e) => log(p + "%", e)).then((r) => log("OK", JSON.stringify(r))).catch((e) => { console.error(e); process.exit(1); });
} else laco();
