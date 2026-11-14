// RF Logistica - RAVI VELOCIDADE (excesso de velocidade por motorista) - v2 (14/11/2026)
// v2 (Renato 14/11: "tem que sair para cada motorista uma msg, se possivel uma imagem de excesso de velocidade, vamos conscientizar os
//   motoristas"): mensagem PESSOAL ao motorista com a imagem de conscientizacao (painel_dados.velocidade_cfg.imagem) -- 'grave' (1 por dia,
//   a partir do aviso velocidade_grave da torre-monitor) e 'dia' (resumo das 18h05, se passou 5+ min acima de 80 ou de 100 km/h).
//   SO SAI COM O CAMINHAO PARADO (posicoes dos ultimos 10 min abaixo de 3 km/h) e das 6h as 21h; ligado por velocidade_cfg.avisar_motoristas.
//   Fila em rf_velocidade_avisos; modo {entregar:true} (cron de 10 em 10 min) cria os 'grave' e entrega a fila.
// Renato (14/11/2026): 224 alertas de velocidade em 7 dias (pico 117 km/h) e ninguem recebia -- ficavam so na tela da Torre.
// Todo dia as 18h05 da Bahia: le o rastreador do dia (todos os caminhoes, com ou sem viagem), grava rf_velocidade_dia
// (vmax, minutos acima de 80 e de 100 km/h, km do dia, picos) e manda o RESUMO no privado do Renato e do Marcelo.
// O aviso NA HORA (acima de 100 km/h) e da torre-monitor v65, no grupo Torre.
// Minutos acima: soma dos intervalos entre posicoes seguidas acima do limite (cada intervalo limitado a 5 min).
// Pico falso do GPS: ignora posicao com gps=0, acima de 140 km/h, ou isolada (vizinhas abaixo de 60).
// Teste: {simular:true} (nao grava nem manda) · {dia:"2026-11-13"} · {enviar:false} (grava sem mandar)
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BA = -3 * 3600e3;
const json = (o: unknown, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { "Content-Type": "application/json" } });
const hojeBA = () => new Date(Date.now() + BA).toISOString().slice(0, 10);
const somaDias = (d: string, n: number) => new Date(Date.parse(d + "T12:00:00Z") + n * 86400e3).toISOString().slice(0, 10);
const ddmm = (d: string) => d.split("-").reverse().slice(0, 2).join("/");
const hora = (d: string) => new Date(Date.parse(d) + BA).toISOString().slice(11, 16);
function distKm(a: number, b: number, c: number, d: number) { const R = 6371, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r; const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
const LIM1 = 80, LIM2 = 100;
const DESTINOS = [{ nome: "Renato", fone: "5575999717578" }, { nome: "Marcelo", fone: "5575987018067" }];

async function segredos() {
  const { data } = await sb.from("rf_segredos").select("chave,valor").or("chave.like.wa_*");
  const o: Record<string, string> = {}; for (const x of data || []) o[x.chave] = x.valor; return o;
}
async function enviar(s: Record<string, string>, phone: string, message: string) {
  if (!s.wa_url || !phone) return false;
  // @ts-ignore Deno API
  const client = Deno.createHttpClient({ caCerts: [s.wa_ca] });
  try {
    const r = await fetch(`${s.wa_url}/send-text`, { method: "POST", client, headers: { "Content-Type": "application/json", "X-RF-Token": s.wa_token }, body: JSON.stringify({ phone, message, mencoes: [] }) } as any);
    return r.status === 200;
  } catch (_) { return false; }
}
const primeiro = (n: string) => { const p = String(n || "").split(/[.\s]/)[0]; return p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : ""; };


async function cfgVel() { const { data } = await sb.from("painel_dados").select("valor").eq("chave", "velocidade_cfg").maybeSingle(); return (data?.valor || {}) as any; }
async function foneMot(login: string) {
  const toks = String(login || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[\s._]+/).filter((t) => t.length >= 3);
  if (!toks.length) return "";
  const { data } = await sb.from("painel_dados").select("valor").eq("chave", "motoristasCad").maybeSingle();
  for (const f of (data?.valor || [])) {
    if (!f || f.tipo === "ajudante" || !f.mot) continue;
    if (f.loginNome && String(f.loginNome).toLowerCase() === String(login).toLowerCase()) { let d = String(f.mot.celular || "").replace(/\D/g, ""); if (d) return d.startsWith("55") ? d : "55" + d; }
    const nome = String(f.mot.nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!toks.every((t) => new RegExp("\\b" + t + "\\b").test(nome))) continue;
    let d = String(f.mot.celular || f.mot.telefone || "").replace(/\D/g, ""); if (!d) continue; return d.startsWith("55") ? d : "55" + d;
  }
  return "";
}
async function enviarImagem(s: Record<string, string>, phone: string, b64: string, caption: string) {
  if (!s.wa_url || !phone) return false;
  // @ts-ignore Deno API
  const client = Deno.createHttpClient({ caCerts: [s.wa_ca] });
  try {
    const r = await fetch(`${s.wa_url}/send-image`, { method: "POST", client, headers: { "Content-Type": "application/json", "X-RF-Token": s.wa_token }, body: JSON.stringify({ phone, image_b64: b64, mimetype: "image/png", caption, mencoes: [] }) } as any);
    return r.status === 200;
  } catch (_) { return false; }
}
let IMG: string | null = null;
async function imagemB64(url: string) {
  if (IMG) return IMG;
  try { const r = await fetch(url + "?v=" + Date.now()); if (!r.ok) return null; const u = new Uint8Array(await r.arrayBuffer()); let bin = ""; for (let i = 0; i < u.length; i += 32768) bin += String.fromCharCode(...u.subarray(i, i + 32768)); IMG = btoa(bin); return IMG; } catch (_) { return null; }
}
const RODAPE = "\n🤖 _Ravi - RF Logística_\n_(Mandei agora porque o caminhão está parado. Nunca leia o celular dirigindo.)_";
function textoGrave(nome: string, placa: string, vel: number, quando: string, local: string) {
  return `🚦 Oi, ${nome}! Aqui é o Ravi, da RF Logística.\n\nEm ${ddmm(new Date(Date.parse(quando) + BA).toISOString().slice(0, 10))} às ${hora(quando)} o rastreador marcou o caminhão *${placa}* a *${vel} km/h*${local ? " em " + local : ""}. O limite de segurança da RF é *80 km/h*.\n\nNão é bronca: é cuidado. Acima disso o risco de acidente dispara, e ainda vem multa e ponto na CNH. A gente quer você voltando bem pra casa. 🙏\n\nConto com você! 💛` + RODAPE;
}
function textoDia(nome: string, l: any) {
  return `🚦 ${nome}, seu resumo de direção de ${ddmm(l.dia)} no *${l.placa}*:\n• Velocidade máxima: *${l.vmax} km/h*\n• Tempo acima de 80 km/h: *${l.min_80} min*` + (l.min_100 ? `\n• Acima de 100 km/h: *${l.min_100} min*` : "") + `\n• Rodou ${l.km_dia} km\n\nO limite de segurança da RF é *80 km/h*. A meta é zero minuto acima disso — pé leve, volta seguro! 💛` + RODAPE;
}
const primeiroN = (n: string) => { const p = String(n || "").split(/[.\s]/)[0]; return p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : "motorista"; };
async function parado(placa: string) {
  const { data } = await sb.from("rastreio_posicoes").select("velocidade,data_pacote").eq("placa", placa).gte("data_pacote", new Date(Date.now() - 10 * 60e3).toISOString()).limit(50);
  if (data && data.length) return data.every((p: any) => (Number(p.velocidade) || 0) < 3);
  const { data: u } = await sb.from("rastreio_ultima").select("velocidade,ignicao").eq("placa", placa).maybeSingle();
  return !!u && (Number(u.velocidade) || 0) < 3 && Number(u.ignicao) === 0;
}
async function entregar(s: Record<string, string>, simular: boolean) {
  const out: any = { criados: 0, enviados: [], esperando: 0, erros: [] };
  // 1) avisos 'grave' a partir da torre-monitor (1 por motorista por dia)
  const { data: evs } = await sb.from("torre_eventos").select("id,placa,dados,msg,em,viagem_id").eq("tipo", "velocidade_grave").gte("em", new Date(Date.now() - 12 * 3600e3).toISOString());
  for (const e of evs || []) {
    const { data: tv } = await sb.from("torre_viagens").select("motorista").eq("id", e.viagem_id).maybeSingle();
    const login = String(tv?.motorista || ""); if (!login) continue;
    const dia = new Date(Date.parse(e.em) + BA).toISOString().slice(0, 10);
    const local = ((String(e.msg || "").match(/📍 ([^\n]+)/) || [])[1] || "").trim();
    const vel = Number(e.dados?.vel) || 0;
    const { data: ja } = await sb.from("rf_velocidade_avisos").select("id").eq("dia", dia).eq("tipo", "grave").eq("motorista", login).maybeSingle();
    if (ja) continue;
    const fone = await foneMot(login), nome = primeiroN(login);
    if (!simular) { const { error } = await sb.from("rf_velocidade_avisos").insert({ dia, tipo: "grave", ref: "g", placa: e.placa, motorista: login, nome, fone: fone || null, texto: textoGrave(nome, e.placa, vel, e.em, local) }); if (!error) out.criados++; }
    else out.criados++;
  }
  // 2) entrega com o caminhao parado, das 6h as 21h
  const cfg = await cfgVel(); const h = new Date(Date.now() + BA).getUTCHours();
  if (!cfg.avisar_motoristas) { out.desligado = true; return out; }
  if (h < 6 || h >= 21) { out.fora_do_horario = true; return out; }
  const { data: fila } = await sb.from("rf_velocidade_avisos").select("*").is("enviado_em", null).lt("tentativas", 30).gte("criado_em", new Date(Date.now() - 36 * 3600e3).toISOString()).order("id").limit(20);
  for (const a of fila || []) {
    if (!a.fone) { await sb.from("rf_velocidade_avisos").update({ erro: "motorista sem celular na ficha", tentativas: 99 }).eq("id", a.id); out.erros.push(a.nome + ": sem celular"); continue; }
    if (!(await parado(a.placa))) { out.esperando++; await sb.from("rf_velocidade_avisos").update({ tentativas: (a.tentativas || 0) + 1 }).eq("id", a.id); continue; }
    if (simular) { out.enviados.push(a.nome + " (simulado)"); continue; }
    const b64 = cfg.imagem ? await imagemB64(String(cfg.imagem)) : null;
    let ok = b64 ? await enviarImagem(s, a.fone, b64, a.texto) : false;
    if (!ok) ok = await enviar(s, a.fone, a.texto);
    await sb.from("rf_velocidade_avisos").update(ok ? { enviado_em: new Date().toISOString(), erro: null } : { erro: "falha no envio", tentativas: (a.tentativas || 0) + 1 }).eq("id", a.id);
    if (ok) out.enviados.push(a.nome + " " + a.placa + " (" + a.tipo + ")"); else out.erros.push(a.nome + ": falha no envio");
    await new Promise((r) => setTimeout(r, 1500));
  }
  return out;
}
Deno.serve(async (req) => {
  try {
    const tok = req.headers.get("x-cron-token") || "";
    const tk = tok ? (await sb.rpc("rastreio_cron_ok", { tok })).data : null;
    const s = await segredos();
    const okWa = s.wa_token && req.headers.get("x-rf-token") === s.wa_token;
    if (!tk && !okWa) return json({ ok: false, erro: "nao autorizado" }, 401);
    const b = await req.json().catch(() => ({}));
    const simular = !!b.simular;
    if (b.entregar) return json({ ok: true, versao: "v2", ...(await entregar(s, simular)) });
    const dia = /^\d{4}-\d{2}-\d{2}$/.test(String(b.dia || "")) ? String(b.dia) : hojeBA();

    // motorista do dia: viagem do sistema que cobre o dia; senao o motorista do cadastro do veiculo
    const [{ data: pv }, { data: pveic }] = await Promise.all([
      sb.from("painel_dados").select("valor").eq("chave", "viagens").maybeSingle(),
      sb.from("painel_dados").select("valor").eq("chave", "veiculos").maybeSingle(),
    ]);
    const viagens: any[] = Array.isArray(pv?.valor) ? pv!.valor : [];
    const veiculos: any[] = Array.isArray(pveic?.valor) ? pveic!.valor : [];
    const fimV = (v: any) => (v.dataFim && /^\d{4}-\d{2}-\d{2}/.test(v.dataFim)) ? String(v.dataFim).slice(0, 10) : somaDias(String(v.data).slice(0, 10), Math.max(1, Math.round(Number(v.dias) || 1)) - 1);
    const quem = (pl: string) => {
      const vg = viagens.filter((v) => v && String(v.placa || "").toUpperCase() === pl && /^\d{4}-\d{2}-\d{2}/.test(String(v.data || "")) && String(v.data).slice(0, 10) <= dia && (fimV(v) >= dia || (v.statusMotorista === "em_andamento" && String(v.data).slice(0, 10) >= somaDias(dia, -15))))
        .sort((a, c) => String(c.data).localeCompare(String(a.data)))[0];
      const ve = veiculos.find((x) => x && String(x.placa || "").toUpperCase() === pl);
      return { motorista: String((vg && (vg.motoristaNaEpoca || vg.motoristaDesignadoNome)) || (ve && ve.motorista) || "").trim() || null, cliente: (vg && vg.cliente) || null };
    };

    const ini = new Date(Date.parse(dia + "T00:00:00-03:00")).toISOString(), fim = new Date(Date.parse(dia + "T23:59:59-03:00")).toISOString();
    const pos: any[] = [];
    for (let pg = 0; pg < 80; pg++) {
      const { data: lote } = await sb.from("rastreio_posicoes").select("placa,data_pacote,lat,lng,velocidade,gps,cidade,uf,rua").gte("data_pacote", ini).lte("data_pacote", fim).not("lat", "is", null).order("placa").order("data_pacote").range(pg * 1000, pg * 1000 + 999);
      pos.push(...(lote || [])); if (!lote || lote.length < 1000) break;
    }
    const porPlaca = new Map<string, any[]>();
    for (const p of pos) { const pl = String(p.placa).toUpperCase(); if (/^TES/.test(pl)) continue; (porPlaca.get(pl) || porPlaca.set(pl, []).get(pl)!).push(p); }

    const linhas: any[] = [];
    for (const [pl, ps] of porPlaca) {
      let vmax = 0, m80 = 0, m100 = 0, km = 0; const picos: any[] = [];
      const vel = (i: number) => Number(ps[i]?.velocidade) || 0;
      const valido = (i: number) => { const v = vel(i); if (ps[i].gps === 0 || v > 140) return false; if (v > LIM1 && vel(i - 1) < 60 && vel(i + 1) < 60) return false; return true; };
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (i > 0) { const d = distKm(Number(ps[i - 1].lat), Number(ps[i - 1].lng), Number(p.lat), Number(p.lng)); const h = Math.max((Date.parse(p.data_pacote) - Date.parse(ps[i - 1].data_pacote)) / 3600e3, 1 / 3600); if (d >= 0.03 && d / h <= 140) km += d; }
        if (!valido(i)) continue;
        const v = vel(i); if (v > vmax) vmax = v;
        if (i > 0 && valido(i - 1)) {
          const dt = Math.min((Date.parse(p.data_pacote) - Date.parse(ps[i - 1].data_pacote)) / 60e3, 5);
          if (v > LIM1 && vel(i - 1) > LIM1) m80 += dt;
          if (v > LIM2 && vel(i - 1) > LIM2) m100 += dt;
        }
        if (v > LIM2) picos.push({ vel: v, em: p.data_pacote, local: [p.rua ? String(p.rua).split(",")[0] : "", [p.cidade, p.uf].filter(Boolean).join("/")].filter(Boolean).join(", ") });
      }
      if (km < 1 && vmax === 0) continue;
      picos.sort((a, c) => c.vel - a.vel);
      const q = quem(pl);
      linhas.push({ dia, placa: pl, motorista: q.motorista, cliente: q.cliente, vmax, min_80: Math.round(m80), min_100: Math.round(m100), km_dia: Math.round(km), picos: picos.slice(0, 3), atualizado_em: new Date().toISOString() });
    }
    linhas.sort((a, c) => c.min_100 - a.min_100 || c.min_80 - a.min_80 || c.vmax - a.vmax);

    const exc = linhas.filter((l) => l.min_80 >= 1 || l.vmax > LIM2);
    let msg = `🚦 *Velocidade da frota — ${ddmm(dia)}*\n`;
    if (!exc.length) msg += `Nenhum caminhão passou de ${LIM1} km/h hoje. 👏`;
    else {
      msg += `Limite de atenção ${LIM1} km/h · grave acima de ${LIM2} km/h\n\n` + exc.map((l, i) => {
        const p = l.picos[0];
        return `${i + 1}. *${l.placa}*${l.motorista ? " · " + primeiro(l.motorista) : ""}${l.cliente ? " · " + l.cliente : ""}\n   pico *${l.vmax} km/h*${p ? " às " + hora(p.em) + (p.local ? " (" + p.local + ")" : "") : ""}\n   ${l.min_80} min acima de ${LIM1}${l.min_100 ? " · *" + l.min_100 + " min acima de " + LIM2 + "*" : ""} · ${l.km_dia} km no dia`;
      }).join("\n");
      const ok = linhas.filter((l) => l.km_dia >= 20 && !(l.min_80 >= 1 || l.vmax > LIM2)).map((l) => l.placa);
      if (ok.length) msg += `\n\n✅ Sem excesso (até 80 km/h): ${ok.join(", ")}`;
    }
    msg += `\n\nRanking completo no app: Jornada dos Caminhões → 🚦 Velocidade.\n🤖 _Ravi - RF Logística_`;

    if (simular) return json({ ok: true, simulado: true, dia, posicoes: pos.length, linhas, msg });
    if (linhas.length) { const { error } = await sb.from("rf_velocidade_dia").upsert(linhas, { onConflict: "dia,placa" }); if (error) return json({ ok: false, erro: error.message }); }
    const enviados: string[] = [];
    if (b.enviar !== false) for (const d of DESTINOS) if (await enviar(s, d.fone, msg)) enviados.push(d.nome);
    // v2: resumo pessoal ao motorista (vai para a fila; sai com o caminhao parado)
    let avisosDia = 0;
    if (b.enviar !== false) for (const l of linhas) {
      if (!l.motorista || !(l.min_80 >= 5 || l.min_100 > 0 || l.vmax > LIM2)) continue;
      const nome = primeiroN(l.motorista), fone = await foneMot(l.motorista);
      const { error } = await sb.from("rf_velocidade_avisos").insert({ dia, tipo: "dia", ref: l.placa, placa: l.placa, motorista: l.motorista, nome, fone: fone || null, texto: textoDia(nome, l) });
      if (!error) avisosDia++;
    }
    return json({ ok: true, versao: "v2", dia, caminhoes: linhas.length, com_excesso: exc.length, enviados, avisos_motoristas: avisosDia });
  } catch (e) {
    return json({ ok: false, erro: String((e as Error).message || e).slice(0, 300) });
  }
});
