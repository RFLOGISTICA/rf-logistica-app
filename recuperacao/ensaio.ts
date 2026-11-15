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
  let partes = 0;
  for (; st.i < nomes.length; st.i++, st.j = 0) {
    const t = nomes[st.i];
    const cols = await sql`select column_name c, is_identity, identity_generation from information_schema.columns where table_schema = 'public' and table_name = ${t} and is_generated = 'NEVER' order by ordinal_position`;
    if (!cols.length) { st.por_tabela[t] = { ok: false, erro: "tabela nao existe no destino", no_backup: idx.linhas[t] }; continue; }
    const lista = cols.map((c: any) => q(c.c)).join(", ");
    const over = cols.some((c: any) => c.identity_generation === "ALWAYS") ? " overriding system value" : "";
    const reg = st.j === 0 ? { restauradas: 0, no_backup: idx.linhas[t] ?? null } : (st.por_tabela[t] || { restauradas: 0, no_backup: idx.linhas[t] ?? null });
    if (st.j === 0) await sql.unsafe(`truncate table public.${q(t)}`);   // retomada segura: a tabela recomeca do zero
    for (; st.j < porTabela[t].length; st.j++) {
      // limite de CPU do Edge (546 WORKER_RESOURCE_LIMIT): poucas partes por chamada e cursor salvo a cada parte
      if (Date.now() > limite || partes >= 12) { st.por_tabela[t] = reg; await ctlSet("dados", st); return { fim: false, tabela: t, i: st.i, de: nomes.length }; }
      partes++;
      try {
        const txt = new TextDecoder().decode(await ungz(await baixar("claro/" + porTabela[t][st.j])));
        const r = await sql.unsafe(`insert into public.${q(t)} (${lista})${over} select ${lista} from json_populate_recordset(null::public.${q(t)}, ($1::text)::json) on conflict do nothing`, [txt]);
        reg.restauradas += r.count || 0;
      } catch (e) { reg.erro = String((e as Error).message).slice(0, 160); }
      st.por_tabela[t] = reg; st.j++; await ctlSet("dados", st); st.j--;
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
  // funcoes que dependem do tipo de uma tabela (ex.: frc_disponivel(frc_ofertas)) so entram depois das tabelas
  await sql.unsafe(`set check_function_bodies = off`);
  const existentes = new Set((await sql`select p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' k from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','privado')`).map((x: any) => x.k));
  falhas.funcoes_2a = await exec([...est.funcoes, ...(est.funcoes_outros || [])].filter((f: any) => !existentes.has(f.nome + "(" + f.args + ")")).map((f: any) => f.def), "funcoes_2a", rep);
  falhas.setval = await exec(est.sequencias.filter((s: any) => s.valor !== null).map((s: any) => `select setval('public.${q(s.nome)}', ${s.valor}, true)`), "setval", rep);
  // achado do ensaio 15/11: coluna "identity" cria a propria sequencia (<nome>1) no projeto novo -- recebe o valor da original
  falhas.identity = await exec((await sql`select pg_get_serial_sequence('public.'||quote_ident(c.relname), a.attname) s from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and a.attidentity in ('a','d')`)
    .map((r: any) => { const orig = est.sequencias.find((x: any) => "public." + x.nome + "1" === r.s || "public." + x.nome === r.s); return orig && orig.valor !== null ? `select setval('${r.s}', ${orig.valor}, true)` : null; }).filter(Boolean) as string[], "identity", rep);
  falhas.dono = await exec(est.sequencias.filter((s: any) => s.dono).map((s: any) => { const [t, c] = s.dono.split("."); return `alter sequence public.${q(s.nome)} owned by public.${q(t)}.${q(c)}`; }), "dono", rep);
  falhas.estrangeiras = await exec(est.restricoes.filter((r: any) => /^FOREIGN KEY/.test(r.def)).map((r: any) => `alter table public.${q(r.tabela)} add constraint ${q(r.nome)} ${r.def}`), "estrangeiras", rep);
  falhas.indices = await exec(est.indices.filter((i: any) => i.schemaname === "public").map((i: any) => i.indexdef.replace(/^CREATE (UNIQUE )?INDEX /, "CREATE $1INDEX IF NOT EXISTS ")), "indices", rep);
  falhas.gatilhos = await exec(est.gatilhos.map((g: any) => g.def), "gatilhos", rep);
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
  // v2 (achado do ensaio 15/11): funcoes com o mesmo nome e argumentos diferentes (sobrecarga) -- a permissao vai por nome+argumentos
  const fa: string[] = [];
  for (const f of est.permissoes_funcoes) {
    if (f.args !== undefined) { if (f.acl) fa.push(...aclParaGrants(f.nome, f.args, f.acl)); continue; }
    const vers = est.funcoes.filter((x: any) => x.nome === f.nome);   // snapshot antigo (sem args): so aplica se NAO houver sobrecarga
    if (vers.length === 1 && f.acl) fa.push(...aclParaGrants(f.nome, vers[0].args, f.acl)); else if (vers.length > 1) falhas.sobrecarga_sem_args = [...(falhas.sobrecarga_sem_args || []), f.nome];
  }
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


// o manifesto nao guarda o tipo do arquivo; buckets com lista de tipos (ex.: contratos so PDF) recusam octet-stream
const TIPOS: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", heic: "image/heic", xml: "application/xml", json: "application/json", txt: "text/plain", csv: "text/csv", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xls: "application/vnd.ms-excel", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", mp4: "video/mp4", ogg: "audio/ogg", opus: "audio/ogg", mp3: "audio/mpeg", m4a: "audio/mp4", zip: "application/zip" };
const tipoPorNome = (n: string) => TIPOS[(n.split(".").pop() || "").toLowerCase()] || "application/octet-stream";

// ---------- 6) arquivos do storage: buckets + objetos (decifra, confere sha256, grava no caminho original)
async function arquivos(dia: string, limite: number, parte = 0, partes = 1) {
  const man = await ctlGet("manifesto");
  const est = await jsonClaro(`config/${dia}/estrutura.json.gz`);
  for (const b of est.buckets) if (b.id !== "backups") await sql`insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (${b.id}, ${b.name}, ${b.public}, ${b.file_size_limit}, ${b.allowed_mime_types}) on conflict (id) do nothing`;
  const K = partes > 1 ? `arquivos_${parte}` : "arquivos";
  const st = (await ctlGet(K)) || { i: parte, ok: 0, bytes: 0, erros: [] as string[] };
  const objs = man.objetos;
  if (!st.feitos) st.feitos = [];
  let n = 0;
  for (; st.i < objs.length; st.i += partes) {
    if (Date.now() > limite - 45000 || n++ >= 80) break;   // termina em ~65 s: o chamador (cron/http) corta em 120 s   // limite de recurso do Edge: ate 60 arquivos por chamada
    const o = objs[st.i];
    try {
      const claro = await decifrar(await baixar(`vps/objetos/${o.sha256}.rfbk`));
      if ((await hex(claro)) !== o.sha256) throw new Error("hash diferente");
      await subir(o.bucket, o.nome, claro, tipoPorNome(o.nome)); st.ok++; st.bytes += claro.length;
    } catch (e) { st.erros.push(o.bucket + "/" + o.nome + ": " + String((e as Error).message).slice(0, 100)); }
  }
  await ctlSet(K, st);
  const fim = st.i >= objs.length;
  if (fim) await logE("arquivos_restaurados_" + parte, { total: objs.length, ok: st.ok, bytes: st.bytes, erros: st.erros.slice(0, 20) });
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


// ---------- 9) TESTE DA OPERACAO como o app faz: login real (usuarios de teste criados SO no ensaio), RLS, documentos, robos
async function testar() {
  const R: any = { em: new Date().toISOString(), etapas: {} };
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  // senhas: impressao digital dos hashes (sem abrir nenhuma senha)
  const [h] = await sql`select count(*)::int n, md5(string_agg(id::text||coalesce(encrypted_password,''), ',' order by id)) impressao from auth.users where email not like 'ensaio-%@teste.invalid'`;
  R.senhas = h;
  // usuarios de teste (so neste projeto)
  const senha = crypto.randomUUID() + "Aa1!";
  const mk = async (email: string, papel: string, extra: Record<string, unknown>) => {
    const { data: ex } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const ant = ex?.users?.find((u: any) => u.email === email); if (ant) await sb.auth.admin.deleteUser(ant.id);
    const { data, error } = await sb.auth.admin.createUser({ email, password: senha, email_confirm: true });
    if (error) throw new Error("criar " + email + ": " + error.message);
    await sql`delete from public.profiles where id = ${data.user.id}`;
    await sql`insert into public.profiles ${sql({ id: data.user.id, nome: "ENSAIO " + papel, papel, ativo: true, ...extra } as any)}`;
    return data.user.id;
  };
  const [adm] = await sql`select modulos from public.profiles where papel = 'admin' and ativo order by criado_em limit 1`;
  const [mot] = await sql`select placa_motorista, placa from public.profiles where papel = 'motorista' and ativo and coalesce(placa_motorista, placa) is not null order by criado_em desc limit 1`;
  await mk("ensaio-admin@teste.invalid", "admin", { modulos: adm?.modulos || null });
  const placaMot = mot?.placa_motorista || mot?.placa || null;
  await mk("ensaio-motorista@teste.invalid", "motorista", { placa_motorista: placaMot, placa: placaMot });
  const login = async (email: string) => {
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: senha }) });
    const j = await r.json(); if (!r.ok) throw new Error("login " + email + ": " + r.status + " " + JSON.stringify(j).slice(0, 120)); return j.access_token as string;
  };
  const tA = await login("ensaio-admin@teste.invalid"), tM = await login("ensaio-motorista@teste.invalid");
  R.etapas.login = { admin: !!tA, motorista: !!tM };
  const cli = (tok?: string) => createClient(SB_URL, anonKey, { global: { headers: tok ? { Authorization: "Bearer " + tok } : {} }, auth: { persistSession: false } });
  const A = cli(tA), M = cli(tM), N = cli();
  // tabelas que o app le (Torre, viagens, financeiro, documentos fiscais, comercial, fracionado, manutencao)
  const TABS = ["profiles", "painel_dados", "torre_viagens", "torre_eventos", "torre_config", "entregas", "viagens_finalizadas_motorista", "rf_km_viagem", "rf_jt_cte", "contratos", "rf_excecoes", "rf_leads", "rf_com_mensagens", "frc_pedidos", "frc_ofertas", "manut_pendencias", "rf_frota_dia", "cliente_cadastro", "estudio_projetos", "sr_bips", "conferencia_romaneios"];
  const conta = async (c: any, t: string) => { const { count, error } = await c.from(t).select("*", { count: "exact", head: true }); return error ? "ERRO " + error.message.slice(0, 60) : count; };
  R.etapas.leitura = {};
  for (const t of TABS) {
    const [real] = await sql.unsafe(`select count(*)::int n from public.${q(t)}`).catch(() => [{ n: "sem tabela" }]);
    R.etapas.leitura[t] = { total: real?.n, admin: await conta(A, t), motorista: await conta(M, t), anonimo: await conta(N, t) };
  }
  // painel_dados: o "estado" do app (viagens, financeiro etc.) -- confere que o admin abre o JSON inteiro
  const { data: pd, error: epd } = await A.from("painel_dados").select("*").limit(3);
  R.etapas.painel = epd ? { erro: epd.message } : { linhas: pd.length, chaves: pd.length ? Object.keys(pd[0]).slice(0, 12) : [], bytes: JSON.stringify(pd).length };
  // documentos: admin baixa; motorista so o da propria placa; anonimo nada
  const docs = await sql`select name from storage.objects where bucket_id = 'documentos' order by created_at desc limit 400`;
  const outro = docs.find((d: any) => placaMot && !String(d.name).includes(placaMot));
  const proprio = docs.find((d: any) => placaMot && String(d.name).includes(placaMot));
  const baixa = async (c: any, n?: string) => { if (!n) return "sem amostra"; const { data, error } = await c.storage.from("documentos").download(n); return error ? "negado" : "ok " + (data as Blob).size + " bytes"; };
  R.etapas.documentos = { total_no_bucket: (await sql`select count(*)::int n from storage.objects where bucket_id = 'documentos'`)[0].n, admin_baixa: await baixa(A, outro?.name || docs[0]?.name), motorista_outra_placa: await baixa(M, outro?.name), motorista_propria_placa: await baixa(M, proprio?.name), anonimo: await baixa(N, docs[0]?.name) };
  // robos: catalogo de testes sem efeito externo (rf-testes-robos) contra o ENSAIO
  try {
    const [tk] = await sql`select valor from public.rf_segredos where chave = 'wa_token'`;
    const r = await fetch(`${SB_URL}/functions/v1/rf-testes-robos`, { method: "POST", headers: { "Content-Type": "application/json", "x-rf-token": tk?.valor || "" }, body: JSON.stringify({ acao: "rodar" }), signal: AbortSignal.timeout(100000) });
    R.etapas.robos = { http: r.status, resposta: (await r.text()).slice(0, 1500) };
  } catch (e) { R.etapas.robos = { erro: String((e as Error).message) }; }
  await logE("teste_operacao", R);
  return R;
}


// cadeia: a funcao chama a si mesma ate terminar (o DNS do banco do projeto novo falhou no pg_net/http; edge->edge funciona)
async function seguir(acao: string, b: any) {
  if ((await ctlGet("parar")) === true) return;
  const tok = (await sql`select decrypted_secret s from vault.decrypted_secrets where name = 'ensaio_tok'`)[0].s;
  // @ts-ignore EdgeRuntime existe no Supabase
  EdgeRuntime.waitUntil(new Promise((ok) => setTimeout(ok, 1500)).then(() => fetch(`${SB_URL}/functions/v1/ensaio`, { method: "POST", headers: { "Content-Type": "application/json", "x-ensaio": tok }, body: JSON.stringify({ ...b, acao }), signal: AbortSignal.timeout(4000) }).catch(() => {})));
}


// recarga de tabelas com linha repetida no backup (paginacao por ctid em tabela que muda durante o backup):
// fica a ULTIMA versao lida de cada chave (on conflict do update), e o relatorio conta as repeticoes
async function recarregar(dia: string, tabelas: string[]) {
  const idx = await jsonClaro(`diario/${dia}.json.gz`);
  const out: any = {};
  for (const t of tabelas) {
    const partes = idx.arquivos.filter((a: string) => a.split("/").pop().replace(/\.parte\d+\.json\.gz$|\.json\.gz$/, "") === t);
    const cols = await sql`select column_name c from information_schema.columns where table_schema = 'public' and table_name = ${t} and is_generated = 'NEVER' order by ordinal_position`;
    const [pk] = await sql`select string_agg(quote_ident(a.attname), ',') k from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey) where i.indrelid = ${"public." + t}::regclass and i.indisprimary`;
    const lista = cols.map((c: any) => q(c.c)).join(", ");
    const set = cols.map((c: any) => `${q(c.c)} = excluded.${q(c.c)}`).join(", ");
    await sql.unsafe(`truncate table public.${q(t)}`);
    let lidas = 0;
    for (const a of partes) {
      const txt = new TextDecoder().decode(await ungz(await baixar("claro/" + a)));
      const arr = JSON.parse(txt); lidas += arr.length;
      // dentro da mesma parte tambem pode repetir: deduplica pela chave primaria mantendo a ultima
      await sql.unsafe(`insert into public.${q(t)} (${lista}) select distinct on (${pk.k}) ${lista} from (select *, row_number() over () rn from json_populate_recordset(null::public.${q(t)}, ($1::text)::json)) x order by ${pk.k}, rn desc on conflict (${pk.k}) do update set ${set}`, [txt]);
    }
    // outras chaves unicas (ex.: rastreio_posicoes fonte+id_pacote) podem barrar: tenta de novo linha a linha nao e necessario se der erro
    const [n] = await sql.unsafe(`select count(*)::int n from public.${q(t)}`);
    out[t] = { linhas_no_backup: idx.linhas[t], lidas, restauradas: n.n, repetidas_no_backup: lidas - n.n };
  }
  await logE("recarga_dedup", out);
  return out;
}
async function existentes() {
  const out: string[] = []; let off = 0;
  for (;;) { const { data } = await sb.storage.from(B).list("vps/objetos", { limit: 1000, offset: off }); for (const f of data || []) out.push("vps/objetos/" + f.name); if (!data || data.length < 1000) break; off += 1000; }
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  sql = novaConexao();
  let acao = "?";
  try {
    const [t] = await sql`select decrypted_secret s from vault.decrypted_secrets where name = 'ensaio_tok'`;
    const dado = req.headers.get("x-ensaio") || "";
    if (!t || !dado || dado !== t.s) return json({ ok: false, erro: "nao autorizado" }, 401);
    const b = await req.json().catch(() => ({}));
    acao = String(b.acao || "?");
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
      case "dados": { const r = await dados(dia, limite); if (b.cadeia && !r.fim) await seguir("dados", b); else if (b.cadeia && r.fim && b.depois) await seguir(b.depois, { ...b, depois: undefined }); return json(r); }
      case "finalizar": return json(await finalizar(dia));
      case "usuarios": return json(await usuarios(dia));
      case "arquivos": { const r = await arquivos(dia, limite, Number(b.parte || 0), Number(b.partes || 1)); if (b.cadeia && !r.fim) await seguir("arquivos", b); return json(r); }
      case "crons": return json(await crons(dia));
      case "funcoes": return json(await funcoes(dia, limite));
      case "testar": return json(await testar());
      case "recarregar": return json(await recarregar(dia, b.tabelas || []));
      case "existentes": return json({ ok: true, nomes: await existentes() });
      default: return json({ ok: false, erro: "acao?" }, 400);
    }
  } catch (e) { try { await logE("erro_" + acao, { erro: String((e as Error).message || e).slice(0, 400) }); } catch (_) { /* */ } return json({ ok: false, erro: String((e as Error).message || e).slice(0, 400) }, 500); }
  finally { try { await sql.end({ timeout: 2 }); } catch (_) { /* */ } }
});
