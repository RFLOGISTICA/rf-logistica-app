// ENSAIO DE RECUPERACAO (projeto isolado rf-ensaio) -- 15/11/2026
// Reconstroi a operacao da RF SO com a copia criptografada da VPS + chave privada do Renato + GitHub.
// Seguranca: segredos que mandam algo para fora (WhatsApp, Z-API, Meta, e-mail, Focus, CIOT, ATM, Gemini, Hunter, Instagram, VPS)
// sao trocados por "ENSAIO-DESATIVADO" logo apos a carga; crons sao criados INATIVOS; o kit de credenciais so e lido para inventario (nomes).
import postgres from "npm:postgres@3.4.4";
import { createClient } from "npm:@supabase/supabase-js@2";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const REF_NOVO = SB_URL.replace("https://", "").split(".")[0];
const REF_ANTIGO = "dpqgqgjhydrztouxscad";
const sb = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const novaConexao = () => postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 15 });
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
const B = "recuperacao";
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const depem = (p: string) => unb64(p.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
const NEUTRO = "ENSAIO-DESATIVADO";
const MANTER_SEGREDOS = new Set(["atm_codigo", "ciot_ambiente", "focus_ambiente", "sefaz_ambiente", "rf_agencia", "rf_banco", "rf_pix", "ravi_mail_provedor", "ravi_mail_ultimo_uid"]);

async function hex(buf: ArrayBuffer | Uint8Array) { const h = await crypto.subtle.digest("SHA-256", buf); return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
async function ungz(u: Uint8Array) { return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()); }
let sql: any = null;
async function ctlGet(k: string) { const r = await sql`select v from ensaio.ctl where k = ${k}`; return r[0]?.v ?? null; }
async function ctlSet(k: string, v: unknown) { await sql`insert into ensaio.ctl (k, v) values (${k}, ${sql.json(v)}) on conflict (k) do update set v = excluded.v`; }
async function logE(etapa: string, detalhe: unknown) { await sql`insert into ensaio.log (etapa, detalhe) values (${etapa}, ${sql.json(detalhe as any)})`; }
let chavePriv: CryptoKey | null = null;
async function priv() {
  if (chavePriv) return chavePriv;
  const [r] = await sql`select decrypted_secret s from vault.decrypted_secrets where name = 'ensaio_chave'`;
  if (!r) throw new Error("chave privada nao esta no cofre do ensaio");
  chavePriv = await crypto.subtle.importKey("pkcs8", depem(r.s), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
  return chavePriv;
}
async function decifrar(buf: Uint8Array) {
  const p1 = buf.indexOf(10), p2 = buf.indexOf(10, p1 + 1);
  if (new TextDecoder().decode(buf.subarray(0, p1)) !== "RFBK1") throw new Error("nao e RFBK1");
  const cab = JSON.parse(new TextDecoder().decode(buf.subarray(p1 + 1, p2)));
  const k = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, await priv(), unb64(cab.k));
  const ka = await crypto.subtle.importKey("raw", k, "AES-GCM", false, ["decrypt"]);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(cab.iv) }, ka, buf.subarray(p2 + 1)));
}
async function baixar(caminho: string) { const { data, error } = await sb.storage.from(B).download(caminho); if (error) throw new Error(caminho + ": " + error.message); return new Uint8Array(await data.arrayBuffer()); }
async function subir(bucket: string, caminho: string, u: Uint8Array, tipo = "application/octet-stream") { const { error } = await sb.storage.from(bucket).upload(caminho, u, { contentType: tipo, upsert: true }); if (error) throw new Error(caminho + ": " + error.message); }
async function jsonClaro(caminho: string) { return JSON.parse(new TextDecoder().decode(await ungz(await baixar("claro/" + caminho)))); }
const q = (s: string) => '"' + String(s).replace(/"/g, '""') + '"';

// ---------- 1) abrir: manifesto + arquivos do banco e da configuracao (decifra e grava em claro/<caminho original>)
async function abrir(dia: string, limite: number) {
  let man = await ctlGet("manifesto");
  if (!man) {
    man = JSON.parse(new TextDecoder().decode(await decifrar(await baixar(`vps/${dia}/manifesto.json.rfbk`))));
    await ctlSet("manifesto", man);
    await logE("manifesto_aberto", { dia: man.dia, banco: man.banco.length, config: man.config.length, objetos: man.objetos.length });
  }
  const itens = [...man.banco.map((x: any) => ({ ...x, g: "banco" })), ...man.config.map((x: any) => ({ ...x, g: "config" }))];
  const st = (await ctlGet("abrir")) || { i: 0, ok: 0, hash_ok: 0, hash_sem: 0, erros: [] as string[] };
  for (; st.i < itens.length; st.i++) {
    if (Date.now() > limite) break;
    const f = itens[st.i];
    try {
      const claro = await decifrar(await baixar(`vps/${dia}/${f.g}/${f.arquivo}`));
      if (f.sha256) { if ((await hex(claro)) === f.sha256) st.hash_ok++; else throw new Error("hash diferente"); } else st.hash_sem++;
      if (f.caminho.endsWith("credenciais.rfbk")) {   // kit: segunda camada; so o INVENTARIO (nomes) sai daqui
        const kit = JSON.parse(new TextDecoder().decode(await ungz(await decifrar(claro))));
        await ctlSet("kit_inventario", { gerado_em: kit.gerado_em, env_funcoes: Object.keys(kit.env_funcoes || {}).sort(), rf_segredos: (kit.rf_segredos || []).map((x: any) => x.chave), vault: (kit.vault || []).map((x: any) => x.name) });
      } else await subir(B, "claro/" + f.caminho, claro, "application/gzip");
      st.ok++;
    } catch (e) { st.erros.push(f.caminho + ": " + String((e as Error).message).slice(0, 120)); }
  }
  await ctlSet("abrir", st);
  const fim = st.i >= itens.length;
  if (fim) await logE("arquivos_abertos", { total: itens.length, ok: st.ok, hash_ok: st.hash_ok, sem_hash: st.hash_sem, erros: st.erros.slice(0, 20) });
  return { fim, ...st, total: itens.length, erros: st.erros.slice(0, 10) };
}

// ---------- 2) estrutura (antes dos dados): extensoes, esquema, funcoes SQL (sem validar corpo), sequencias, tabelas, visoes
async function exec(lista: string[], rotulo: string, rep: any) {
  let falhas: string[] = [];
  for (const s of lista) { try { await sql.unsafe(s); rep[rotulo] = (rep[rotulo] || 0) + 1; } catch (e) { falhas.push(s.slice(0, 80) + " -> " + String((e as Error).message).slice(0, 140)); } }
  return falhas;
}
async function estrutura(dia: string) {
  const est = await jsonClaro(`config/${dia}/estrutura.json.gz`);
  if (!est.ddl_tabelas) throw new Error("estrutura sem DDL completa (snapshot antigo)");
  const rep: any = {}; const falhas: Record<string, string[]> = {};
  const exts = (est.extensoes || []).map((x: any) => x.extname).filter((n: string) => !["plpgsql"].includes(n));
  falhas.extensoes = await exec(exts.map((n: string) => `create extension if not exists ${q(n)}${["pg_cron", "pg_net", "supabase_vault", "pg_stat_statements"].includes(n) ? "" : " with schema extensions"}`), "extensoes", rep);
  await sql.unsafe(`create schema if not exists privado`);
  await sql.unsafe(`set check_function_bodies = off`);
  falhas.funcoes = await exec([...est.funcoes, ...(est.funcoes_outros || [])].map((f: any) => f.def), "funcoes", rep);
  falhas.sequencias = await exec(est.sequencias.map((s: any) => s.ddl), "sequencias", rep);
  falhas.tabelas = await exec(est.ddl_tabelas.map((t: any) => t.ddl), "tabelas", rep);
  // visoes: varias passadas (uma pode depender da outra)
  let pend = est.visoes.map((v: any) => `create or replace view public.${q(v.viewname)} as ${v.definition}`);
  for (let p = 0; p < 4 && pend.length; p++) { const f2: string[] = []; for (const s of pend) { try { await sql.unsafe(s); rep.visoes = (rep.visoes || 0) + 1; } catch (_) { f2.push(s); } } pend = f2; }
  falhas.visoes = pend.map((s: string) => s.slice(0, 80));
  // chaves primarias/unicas/check agora (antes dos dados); estrangeiras depois da carga
  const rs = est.restricoes.filter((r: any) => !/^FOREIGN KEY/.test(r.def));
  falhas.restricoes = await exec(rs.map((r: any) => `alter table public.${q(r.tabela)} add constraint ${q(r.nome)} ${r.def}`), "restricoes", rep);
  await ctlSet("estrutura_rep", { rep, falhas });
  await logE("estrutura_criada", { rep, falhas: Object.fromEntries(Object.entries(falhas).map(([k, v]) => [k, v.length])), exemplos: Object.values(falhas).flat().slice(0, 15) });
  return { ok: true, rep, falhas };
}

// ---------- 3) dados: uma tabela por vez, partes do backup; colunas geradas ficam de fora; identity "always" com overriding
async function dados(dia: string, limite: number) {
  const idx = await jsonClaro(`diario/${dia}.json.gz`);
  const porTabela: Record<string, string[]> = {};
  for (const a of idx.arquivos) { const t = a.split("/").pop().replace(/\.parte\d+\.json\.gz$|\.json\.gz$/, ""); (porTabela[t] = porTabela[t] || []).push(a); }
  const nomes = Object.keys(porTabela).sort();
  const st = (await ctlGet("dados")) || { i: 0, j: 0, por_tabela: {} as Record<string, any> };
  for (; st.i < nomes.length; st.i++, st.j = 0) {
    const t = nomes[st.i];
    const cols = await sql`select column_name c, is_identity, identity_generation from information_schema.columns where table_schema = 'public' and table_name = ${t} and is_generated = 'NEVER' order by ordinal_position`;
    if (!cols.length) { st.por_tabela[t] = { ok: false, erro: "tabela nao existe no destino", no_backup: idx.linhas[t] }; continue; }
    const lista = cols.map((c: any) => q(c.c)).join(", ");
    const over = cols.some((c: any) => c.identity_generation === "ALWAYS") ? " overriding system value" : "";
    const reg = st.por_tabela[t] || { restauradas: 0, no_backup: idx.linhas[t] ?? null };
    for (; st.j < porTabela[t].length; st.j++) {
      if (Date.now() > limite) { st.por_tabela[t] = reg; await ctlSet("dados", st); return { fim: false, tabela: t, i: st.i, de: nomes.length }; }
      try {
        const txt = new TextDecoder().decode(await ungz(await baixar("claro/" + porTabela[t][st.j])));
        const r = await sql.unsafe(`insert into public.${q(t)} (${lista})${over} select ${lista} from json_populate_recordset(null::public.${q(t)}, ($1::text)::json)`, [txt]);
        reg.restauradas += r.count || 0;
      } catch (e) { reg.erro = String((e as Error).message).slice(0, 160); }
    }
    if (t === "rf_segredos") { const n = await sql`update public.rf_segredos set valor = ${NEUTRO} where not (chave = any(${[...MANTER_SEGREDOS]})) returning chave`; reg.neutralizados = n.length; }
    if (t === "torre_segredo") await sql.unsafe(`update public.torre_segredo set zapi_token = '${NEUTRO}', zapi_client_token = '${NEUTRO}'`);
    if (t === "rf_instagram_cfg") await sql.unsafe(`update public.rf_instagram_cfg set token = '${NEUTRO}'`);
    reg.ok = reg.restauradas === reg.no_backup && !reg.erro;
    st.por_tabela[t] = reg;
  }
  await ctlSet("dados", st);
  const v = Object.values(st.por_tabela) as any[];
  const rel = { tabelas: nomes.length, ok: v.filter((x) => x.ok).length, linhas: v.reduce((a, x) => a + (x.restauradas || 0), 0), esperado: Object.values(idx.linhas).reduce((a: number, x: any) => a + Number(x || 0), 0), problemas: Object.entries(st.por_tabela).filter(([, x]: any) => !x.ok).map(([k, x]: any) => k + ": " + (x.erro || `${x.restauradas}/${x.no_backup}`)).slice(0, 30) };
  await logE("dados_carregados", rel);
  return { fim: true, ...rel };
}

// ---------- 4) depois dos dados: sequencias, FKs, indices, gatilhos, RLS, politicas, permissoes, realtime
function aclParaGrants(nome: string, args: string, acl: string, esquema = "public") {
  const out = [`revoke all on function ${esquema}.${q(nome)}(${args}) from public, anon, authenticated`];
  for (const it of (acl.replace(/^\{|\}$/g, "").split(",").filter(Boolean))) {
    const [papel, resto] = it.split("="); if (!resto) continue;
    const r = papel.replace(/"/g, "") || "public";
    if (resto.split("/")[0].includes("X") && ["anon", "authenticated", "service_role", "public"].includes(r)) out.push(`grant execute on function ${esquema}.${q(nome)}(${args}) to ${r}`);
  }
  return out;
}
async function finalizar(dia: string) {
  const est = await jsonClaro(`config/${dia}/estrutura.json.gz`);
  const rep: any = {}; const falhas: Record<string, string[]> = {};
  falhas.setval = await exec(est.sequencias.filter((s: any) => s.valor !== null).map((s: any) => `select setval('public.${q(s.nome)}', ${s.valor}, true)`), "setval", rep);
  falhas.dono = await exec(est.sequencias.filter((s: any) => s.dono).map((s: any) => { const [t, c] = s.dono.split("."); return `alter sequence public.${q(s.nome)} owned by public.${q(t)}.${q(c)}`; }), "dono", rep);
  falhas.estrangeiras = await exec(est.restricoes.filter((r: any) => /^FOREIGN KEY/.test(r.def)).map((r: any) => `alter table public.${q(r.tabela)} add constraint ${q(r.nome)} ${r.def}`), "estrangeiras", rep);
  falhas.indices = await exec(est.indices.filter((i: any) => i.schemaname === "public").map((i: any) => i.indexdef.replace(/^CREATE (UNIQUE )?INDEX /, "CREATE $1INDEX IF NOT EXISTS ")), "indices", rep);
  falhas.gatilhos = await exec(est.gatilhos.filter((g: any) => !/ON storage\./.test(g.def) || true).map((g: any) => g.def), "gatilhos", rep);
  falhas.rls = await exec(est.rls.filter((r: any) => r.esquema === "public" && r.rls).map((r: any) => `alter table public.${q(r.tabela)} enable row level security`), "rls", rep);
  falhas.politicas = await exec(est.politicas.filter((p: any) => ["public", "storage"].includes(p.schemaname)).map((p: any) => {
    const roles = String(p.roles).replace(/^\{|\}$/g, "").split(",").map((r: string) => r === "public" ? "public" : q(r)).join(", ");
    return `create policy ${q(p.policyname)} on ${p.schemaname}.${q(p.tablename)} as ${p.permissive} for ${p.cmd} to ${roles}${p.qual ? ` using (${p.qual})` : ""}${p.with_check ? ` with check (${p.with_check})` : ""}`;
  }), "politicas", rep);
  // permissoes de tabela: igual a producao (revoga o padrao do projeto novo e aplica a lista)
  const tabs = [...new Set(est.ddl_tabelas.map((t: any) => t.nome))] as string[];
  const g: string[] = tabs.map((t) => `revoke all on public.${q(t)} from anon, authenticated`);
  for (const p of est.permissoes) if (p.grantee !== "service_role") g.push(`grant ${p.privs.split(",").filter((x: string) => x !== "TRUNCATE" || true).join(", ")} on public.${q(p.table_name)} to ${p.grantee}`);
  falhas.permissoes = await exec(g, "permissoes", rep);
  const fargs = new Map<string, string>(est.funcoes.map((f: any) => [f.nome, f.args]));
  const fa: string[] = [];
  for (const f of est.permissoes_funcoes) { const a = fargs.get(f.nome); if (a !== undefined && f.acl) fa.push(...aclParaGrants(f.nome, a, f.acl)); }
  falhas.permissoes_funcoes = await exec(fa, "permissoes_funcoes", rep);
  falhas.realtime = await exec((est.realtime || []).map((r: any) => `alter publication supabase_realtime add table public.${q(r.tablename)}`), "realtime", rep);
  await ctlSet("finalizar_rep", { rep, falhas });
  await logE("estrutura_finalizada", { rep, falhas: Object.fromEntries(Object.entries(falhas).map(([k, v]) => [k, v.length])), exemplos: Object.values(falhas).flat().slice(0, 20) });
  return { ok: true, rep, falhas: Object.fromEntries(Object.entries(falhas).map(([k, v]) => [k, v.slice(0, 6)])) };
}

// ---------- 5) usuarios (com o hash das senhas) e identidades
async function usuarios(dia: string) {
  const a = await jsonClaro(`config/${dia}/auth_usuarios.json.gz`);
  const res: any = {};
  for (const [tab, linhas] of [["users", a.usuarios], ["identities", a.identidades]] as [string, any[]][]) {
    const cols = await sql`select column_name c from information_schema.columns where table_schema = 'auth' and table_name = ${tab} and is_generated = 'NEVER' order by ordinal_position`;
    const presentes = cols.map((c: any) => c.c).filter((c: string) => linhas.length && c in linhas[0]);
    const lista = presentes.map(q).join(", ");
    const r = await sql.unsafe(`insert into auth.${tab} (${lista}) select ${lista} from json_populate_recordset(null::auth.${tab}, ($1::text)::json) on conflict do nothing`, [JSON.stringify(linhas)]);
    res[tab] = { no_backup: linhas.length, restaurados: r.count };
  }
  await logE("usuarios_restaurados", res);
  return res;
}

// ---------- 6) arquivos do storage: buckets + objetos (decifra, confere sha256, grava no caminho original)
async function arquivos(dia: string, limite: number) {
  const man = await ctlGet("manifesto");
  const est = await jsonClaro(`config/${dia}/estrutura.json.gz`);
  for (const b of est.buckets) if (b.id !== "backups") await sql`insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (${b.id}, ${b.name}, ${b.public}, ${b.file_size_limit}, ${b.allowed_mime_types}) on conflict (id) do nothing`;
  const st = (await ctlGet("arquivos")) || { i: 0, ok: 0, bytes: 0, erros: [] as string[] };
  const objs = man.objetos;
  for (; st.i < objs.length; st.i++) {
    if (Date.now() > limite) break;
    const o = objs[st.i];
    try {
      const claro = await decifrar(await baixar(`vps/objetos/${o.sha256}.rfbk`));
      if ((await hex(claro)) !== o.sha256) throw new Error("hash diferente");
      await subir(o.bucket, o.nome, claro, "application/octet-stream"); st.ok++; st.bytes += claro.length;
    } catch (e) { st.erros.push(o.bucket + "/" + o.nome + ": " + String((e as Error).message).slice(0, 100)); }
  }
  await ctlSet("arquivos", st);
  const fim = st.i >= objs.length;
  if (fim) await logE("arquivos_restaurados", { total: objs.length, ok: st.ok, bytes: st.bytes, erros: st.erros.slice(0, 20) });
  return { fim, total: objs.length, ...st, erros: st.erros.slice(0, 5) };
}

// ---------- 7) robos agendados: recriados INATIVOS, apontando para o projeto novo
async function crons(dia: string) {
  const est = await jsonClaro(`config/${dia}/estrutura.json.gz`);
  let ok = 0; const falhas: string[] = []; let comSegredoOmitido = 0;
  for (const c of est.crons) {
    try {
      const cmd = String(c.command).replaceAll(REF_ANTIGO, REF_NOVO);
      if (cmd.includes("<omitido>")) comSegredoOmitido++;
      await sql.begin(async (tx: any) => { const [r] = await tx`select cron.schedule(${c.jobname}, ${c.schedule}, ${cmd}) id`; await tx`select cron.alter_job(${r.id}, active := false)`; });
      ok++;
    } catch (e) { falhas.push(c.jobname + ": " + String((e as Error).message).slice(0, 100)); }
  }
  const [a] = await sql`select count(*)::int n, count(*) filter (where active)::int ativos from cron.job`;
  await logE("crons_recriados", { no_backup: est.crons.length, criados: ok, ativos: a.ativos, com_segredo_omitido: comSegredoOmitido, falhas });
  return { no_backup: est.crons.length, criados: ok, ativos_no_ensaio: a.ativos, falhas };
}

// ---------- 8) Edge Functions: publica no projeto novo com o token do cofre do ensaio (ensaio_pat)
async function funcoes(dia: string, limite: number) {
  const [p] = await sql`select decrypted_secret s from vault.decrypted_secrets where name = 'ensaio_pat'`;
  if (!p) return { fim: false, erro: "falta o token ensaio_pat no cofre do ensaio" };
  const lista = await jsonClaro(`config/${dia}/funcoes_lista.json.gz`);
  const st = (await ctlGet("funcoes")) || { i: 0, ok: 0, erros: [] as string[] };
  for (; st.i < lista.length; st.i++) {
    if (Date.now() > limite) break;
    const f = lista[st.i];
    if (f.slug === "ensaio") { st.ok++; continue; }
    try {
      const fx = await jsonClaro(`config/${dia}/funcoes/${f.slug}.json.gz`);
      const ep = fx.meta?.entrypoint_path || fx.entrypoint || "index.ts";
      const fd = new FormData();
      const nomes = fx.arquivos.map((a: any) => a.nome);
      const entry = nomes.find((n: string) => n.endsWith(ep.split("/").pop()!)) || nomes[0];
      fd.append("metadata", JSON.stringify({ name: f.slug, entrypoint_path: entry, verify_jwt: !!f.verify_jwt }));
      for (const a of fx.arquivos) fd.append("file", new Blob([a.texto], { type: "application/typescript" }), a.nome);
      const r = await fetch(`https://api.supabase.com/v1/projects/${REF_NOVO}/functions/deploy?slug=${encodeURIComponent(f.slug)}`, { method: "POST", headers: { Authorization: "Bearer " + p.s }, body: fd });
      if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 120));
      st.ok++;
    } catch (e) { st.erros.push(f.slug + ": " + String((e as Error).message).slice(0, 140)); }
  }
  await ctlSet("funcoes", st);
  const fim = st.i >= lista.length;
  if (fim) await logE("funcoes_publicadas", { total: lista.length, ok: st.ok, erros: st.erros });
  return { fim, total: lista.length, ok: st.ok, i: st.i, erros: st.erros.slice(0, 8) };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  sql = novaConexao();
  try {
    const [t] = await sql`select decrypted_secret s from vault.decrypted_secrets where name = 'ensaio_tok'`;
    const dado = req.headers.get("x-ensaio") || "";
    if (!t || !dado || dado !== t.s) return json({ ok: false, erro: "nao autorizado" }, 401);
    const b = await req.json().catch(() => ({}));
    const limite = Date.now() + 110000;
    const dia = String(b.dia || (await ctlGet("dia")) || "");
    switch (b.acao) {
      case "urls": {
        const out: string[] = [];
        for (const n of b.nomes as string[]) { const { data, error } = await sb.storage.from(B).createSignedUploadUrl(n, { upsert: true }); if (error) throw error; out.push(data.signedUrl); }
        return json({ ok: true, urls: out });
      }
      case "relato": { await logE("vps_" + b.etapa, b); if (b.dia) await ctlSet("dia", b.dia); return json({ ok: true }); }
      case "abrir": return json(await abrir(dia, limite));
      case "estrutura": return json(await estrutura(dia));
      case "dados": return json(await dados(dia, limite));
      case "finalizar": return json(await finalizar(dia));
      case "usuarios": return json(await usuarios(dia));
      case "arquivos": return json(await arquivos(dia, limite));
      case "crons": return json(await crons(dia));
      case "funcoes": return json(await funcoes(dia, limite));
      default: return json({ ok: false, erro: "acao?" }, 400);
    }
  } catch (e) { try { await logE("erro_" + String((await req.clone().json().catch(() => ({})))?.acao || "?"), { erro: String((e as Error).message || e).slice(0, 400) }); } catch (_) { /* */ } return json({ ok: false, erro: String((e as Error).message || e).slice(0, 400) }, 500); }
  finally { try { await sql.end({ timeout: 2 }); } catch (_) { /* */ } }
});
