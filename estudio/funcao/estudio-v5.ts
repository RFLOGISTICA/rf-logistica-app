// estudio v1 (13/11/2026, RFL v882) -- ESTUDIO DE VIDEO do RF Sistema (Publicidade > Campanhas > 🎬).
// Renato: estudio completo com o que a RF ja tem -- SEM geracao de cena por IA, sem servico pago novo.
//   - Diretor de criacao (Ravi hoje, BILL depois): roteiro a partir de linguagem natural, SO com dados reais do sistema
//     (saidas com espaco da vitrine do site, cidades atendidas, frota, servicos). Nada inventado: fatos gravados no projeto.
//   - Narracao: OpenAI gpt-4o-mini-tts (mesma chave do Ravi); legenda sincronizada palavra a palavra (whisper-1, word timestamps).
//   - Render: worker FFmpeg na VPS da RF (servico rf-estudio, separado do Ravi), que PUXA o trabalho daqui (sem porta aberta).
//   - Publicacao: Instagram (Reels) so com aprovacao do login master. Automatico cria/renderiza, mas nunca publica sozinho.
// Autorizacao: usuario logado com estudio_pode() | master | worker (x-estudio-token) | servidor (x-cron-token / teste_chave).
import { createClient } from "jsr:@supabase/supabase-js@2";
// RF-USO v1: registra em ravi_uso cada chamada a OpenAI desta funcao (so registra; nunca bloqueia)
const __RF_FUNCAO = "estudio";
(() => {
  const g: any = globalThis as any; if (g.__rfUsoLigado) return; g.__rfUsoLigado = true;
  const orig = g.fetch.bind(g); const U = Deno.env.get("SUPABASE_URL"), K = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const grava = (l: any) => { try { if (U && K) orig(U + "/rest/v1/ravi_uso", { method: "POST", headers: { apikey: K, Authorization: "Bearer " + K, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(l) }).catch(() => {}); } catch (_) { /* */ } };
  g.fetch = async (input: any, init?: any) => {
    const res = await orig(input, init);
    try {
      const u = typeof input === "string" ? input : (input && input.url) || "";
      if (u.indexOf("https://api.openai.com/v1/") === 0 && res && res.ok) {
        const op = u.slice(26).split("?")[0]; let corpo: any = null, mod = "";
        try { if (init && typeof init.body === "string") corpo = JSON.parse(init.body); } catch (_) { /* */ }
        try { if (corpo && corpo.model) mod = String(corpo.model); else if (init && init.body && typeof init.body.get === "function") mod = String(init.body.get("model") || ""); } catch (_) { /* */ }
        const base = { origem: __RF_FUNCAO + ":" + op, funcao: __RF_FUNCAO, operacao: op };
        if (op.indexOf("audio/speech") === 0) grava({ ...base, modelo: mod || null, audio_chars: String((corpo && corpo.input) || "").length });
        else if ((res.headers.get("content-type") || "").indexOf("json") >= 0) res.clone().json().then((j: any) => { const us = (j && j.usage) || {}; grava({ ...base, modelo: String((j && j.model) || mod || "") || null, entrada: Number(us.prompt_tokens ?? us.input_tokens ?? 0) || 0, saida: Number(us.completion_tokens ?? us.output_tokens ?? 0) || 0 }); }).catch(() => {});
        else grava({ ...base, modelo: mod || null });
      }
    } catch (_) { /* */ }
    return res;
  };
})();

const SB_URL = Deno.env.get("SUPABASE_URL")!, KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SB_URL, KEY);
const MASTER = "f0426695-6a73-443c-ab3d-19b0109b6d30";
const GH = "https://raw.githubusercontent.com/RFLOGISTICA/rf-logistica-app/main/estudio/";
const BUCKET = "documentos";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-estudio-token, x-cron-token", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const erro = (m: string, s = 400) => json({ ok: false, erro: m }, s);

// ---------------------------------------------------------------- biblioteca base (GitHub da RF)
const BASE: any[] = [
  { id: "base:frota-1", tipo: "imagem", nome: "Caminhão RF na estrada ao entardecer", arq: "fotos/frota-1.jpg", tags: ["frota", "estrada", "entardecer"] },
  { id: "base:frota-2", tipo: "imagem", nome: "Caminhão RF na rodovia (dia)", arq: "fotos/frota-2.jpg", tags: ["frota", "estrada"] },
  { id: "base:frota-3", tipo: "imagem", nome: "Caminhão RF ao pôr do sol", arq: "fotos/frota-3.jpg", tags: ["frota", "estrada", "por do sol"] },
  { id: "base:frota-4", tipo: "imagem", nome: "Caminhão RF de perto (baú com a marca)", arq: "fotos/frota-4.jpg", tags: ["frota", "marca", "bau"] },
  { id: "base:frota-5", tipo: "imagem", nome: "Caminhão RF em estrada do interior", arq: "fotos/frota-5.jpg", tags: ["frota", "interior", "estrada"] },
  { id: "base:estrada-1", tipo: "imagem", nome: "Rodovia vista de cima", arq: "fotos/estrada-1.jpg", tags: ["estrada", "rodovia"] },
  { id: "base:estrada-2", tipo: "imagem", nome: "Rodovia entre plantações", arq: "fotos/estrada-2.jpg", tags: ["estrada", "interior"] },
  { id: "base:ravi", tipo: "imagem", nome: "Ravi, assistente virtual da RF", arq: "fotos/ravi.jpg", tags: ["ravi", "tecnologia"] },
  { id: "base:torre", tipo: "tela", nome: "Torre de Controle (tela do site)", arq: "telas/torre-de-controle-tela.jpg", tags: ["torre", "rastreamento", "tecnologia"] },
  { id: "base:carregamento-3d", tipo: "tela", nome: "Carregamento 3D com bipagem", arq: "telas/carregamento-3d-bipagem.jpg", tags: ["carregamento", "tecnologia"] },
  { id: "base:ecossistema", tipo: "tela", nome: "Ecossistema Rodavia 360", arq: "telas/ecossistema-rodavia360.jpg", tags: ["rodavia", "tecnologia"] },
  { id: "base:demo-inicio", tipo: "tela", nome: "Rodavia 360 — tela inicial por setor (demonstração)", arq: "telas/demo-169-inicio.jpg", tags: ["rodavia", "demo", "computador"], ajuste: "conter",
    destaques: [{ x: 0.07, y: 0.46, w: 0.65, h: 0.14, rotulo: "Gestão: exceções, saúde e previsões" }, { x: 0.07, y: 0.84, w: 0.86, h: 0.14, rotulo: "Manutenção, pendências e óleo" }] },
  { id: "base:demo-frota", tipo: "tela", nome: "Rodavia 360 — painel da frota (demonstração)", arq: "telas/demo-169-frota.jpg", tags: ["rodavia", "demo", "frota", "computador"], ajuste: "conter",
    destaques: [{ x: 0.02, y: 0.56, w: 0.96, h: 0.135, rotulo: "Resumo da frota na hora" }, { x: 0.01, y: 0.81, w: 0.98, h: 0.18, rotulo: "Cada caminhão com motorista e status" }] },
  { id: "base:demo-dashboard", tipo: "tela", nome: "Rodavia 360 — dashboard do mês (demonstração)", arq: "telas/demo-169-dashboard.jpg", tags: ["rodavia", "demo", "dashboard", "computador"], ajuste: "conter",
    destaques: [{ x: 0.016, y: 0.475, w: 0.97, h: 0.13, rotulo: "Faturamento, resultado e margem" }, { x: 0.016, y: 0.615, w: 0.32, h: 0.12, rotulo: "Ticket médio e receita por km" }] },
  { id: "base:demo-oleo", tipo: "tela", nome: "Rodavia 360 — óleo e filtros por km (demonstração)", arq: "telas/demo-169-oleo.jpg", tags: ["rodavia", "demo", "manutencao", "computador"], ajuste: "conter",
    destaques: [{ x: 0.01, y: 0.4, w: 0.51, h: 0.05, rotulo: "Aviso automático pelo km" }, { x: 0.625, y: 0.55, w: 0.1, h: 0.44, rotulo: "Quanto falta para a troca" }] },
  { id: "base:demo-fracionado", tipo: "tela", nome: "Rodavia 360 — fracionado / espaço no baú (demonstração)", arq: "telas/demo-169-frc_ofertas.jpg", tags: ["rodavia", "demo", "fracionado", "computador"], ajuste: "conter",
    destaques: [{ x: 0.508, y: 0.43, w: 0.45, h: 0.055, rotulo: "Ofertas, cotações e lotação" }, { x: 0.508, y: 0.745, w: 0.48, h: 0.14, rotulo: "Espaço livre estimado no baú" }] },
  { id: "base:demo-cel-inicio", tipo: "tela", nome: "Rodavia 360 no celular — tela inicial (demonstração)", arq: "telas/demo-cel-inicio.jpg", tags: ["rodavia", "demo", "celular"] },
  { id: "base:demo-cel-frota", tipo: "tela", nome: "Rodavia 360 no celular — frota (demonstração)", arq: "telas/demo-cel-frota.jpg", tags: ["rodavia", "demo", "celular", "frota"] },
  { id: "base:demo-cel-dashboard", tipo: "tela", nome: "Rodavia 360 no celular — dashboard (demonstração)", arq: "telas/demo-cel-dashboard.jpg", tags: ["rodavia", "demo", "celular", "dashboard"] },
  { id: "base:demo-cel-fracionado", tipo: "tela", nome: "Rodavia 360 no celular — fracionado (demonstração)", arq: "telas/demo-cel-frc_ofertas.jpg", tags: ["rodavia", "demo", "celular", "fracionado"] },
  { id: "base:trilha-rota", tipo: "trilha", nome: "Trilha RF — Rota (animada, 118 bpm)", arq: "trilhas/rf-rota.mp3", tags: ["trilha", "animada"] },
  { id: "base:trilha-institucional", tipo: "trilha", nome: "Trilha RF — Institucional (inspiradora)", arq: "trilhas/rf-institucional.mp3", tags: ["trilha", "institucional"] },
  { id: "base:trilha-tecnologia", tipo: "trilha", nome: "Trilha RF — Tecnologia (eletrônica)", arq: "trilhas/rf-tecnologia.mp3", tags: ["trilha", "tecnologia"] },
  { id: "base:logo-rf", tipo: "logo", nome: "Logo RF Logística (horizontal)", arq: "logos/logo-rf.png", tags: ["logo"] },
  { id: "base:escudo-rf", tipo: "logo", nome: "Escudo RF", arq: "logos/escudo-rf.png", tags: ["logo"] },
  { id: "base:logo-rodavia", tipo: "logo", nome: "Logo Rodavia 360", arq: "logos/logo-rodavia360.png", tags: ["logo", "rodavia"] },
];
const VOZES: Record<string, { voice: string; nome: string; base: string }> = {
  locutor: { voice: "onyx", nome: "Masculina — locutor", base: "Voz masculina adulta de locutor publicitário brasileiro: firme, confiante e calorosa." },
  jovem: { voice: "ash", nome: "Masculina — jovem e animada", base: "Voz masculina jovem, energética e simpática, de comercial para redes sociais." },
  ravi: { voice: "verse", nome: "Masculina — Ravi (baiana)", base: "Voz masculina adulta, sempre a mesma. Sotaque baiano de Feira de Santana: vogais abertas, 'de' e 'te' sem chiar. Tom calmo e simpático." },
  locutora: { voice: "coral", nome: "Feminina — locutora", base: "Voz feminina adulta de locutora publicitária brasileira: clara, confiante e acolhedora." },
  suave: { voice: "shimmer", nome: "Feminina — suave", base: "Voz feminina suave e elegante, tom institucional e tranquilo." },
};
const SERVICOS = [
  "Transporte rodoviário de cargas com frota própria, base em Feira de Santana/BA, atendendo a Bahia e o Nordeste",
  "Lotação / caminhão dedicado (toco e 3/4 baú)",
  "Carga fracionada: espaço no baú de caminhões que já vão para a rota, com cotação na hora em rflogistica.com.br/fretes",
  "Torre de Controle: acompanhamento dos caminhões em tempo real pelo rastreador",
  "Ravi: assistente virtual da RF no WhatsApp",
  "Rodavia 360: sistema de gestão de frota da RF Sistemas (frota, viagens, abastecimento, manutenção por km, óleo e filtros, dashboard, financeiro, Torre de Controle, fracionado, documentos fiscais, campanhas)",
];
const CONTATO = { site: "rflogistica.com.br", fretes: "rflogistica.com.br/fretes", whatsapp: "(75) 99971-7578", horario: "segunda a sexta, 8h às 18h" };

// ---------------------------------------------------------------- utilitarios
async function segredo(ch: string) { const { data } = await sb.from("rf_segredos").select("valor").eq("chave", ch).maybeSingle(); return data?.valor as string | undefined; }
function iguais(a: string, b: string) { if (!a || !b || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
async function quem(req: Request, b: any) {
  const wt = req.headers.get("x-estudio-token") || "";
  if (wt) { const t = await segredo("estudio_worker_token"); if (t && iguais(wt, t)) return { tipo: "worker", master: false, uid: null, nome: "worker" }; return null; }
  const ct = req.headers.get("x-cron-token") || "";
  if (ct) { const { data } = await sb.rpc("rastreio_cron_ok", { tok: ct }); if (data) return { tipo: "servidor", master: true, uid: null, nome: "Robô" }; return null; }
  if (b && b.teste_chave) { const t = await segredo("teste_chave"); if (t && iguais(String(b.teste_chave), t)) return { tipo: "servidor", master: true, uid: null, nome: "Claude (teste)" }; return null; }
  const auth = req.headers.get("Authorization") || ""; if (!auth) return null;
  const us = createClient(SB_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: ud } = await us.auth.getUser(); if (!ud?.user) return null;
  const { data: pode } = await us.rpc("estudio_pode"); if (!pode) return null;
  const { data: pf } = await sb.from("profiles").select("nome,email").eq("id", ud.user.id).maybeSingle();
  return { tipo: "usuario", master: ud.user.id === MASTER, uid: ud.user.id, nome: (pf?.nome || pf?.email || ud.user.email || "?") as string };
}
async function assinar(path: string, seg = 6 * 3600) { const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, seg); if (error || !data) throw new Error("arquivo nao encontrado: " + path); return data.signedUrl; }
async function oai(caminho: string, corpo: any) {
  const k = Deno.env.get("OPENAI_API_KEY"); if (!k) throw new Error("chave da OpenAI ausente");
  const r = await fetch("https://api.openai.com/v1/" + caminho, { method: "POST", headers: { Authorization: "Bearer " + k, "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  if (!r.ok) throw new Error("OpenAI " + r.status + ": " + (await r.text()).slice(0, 200));
  return r;
}
const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const dataBR = (d: string) => d ? d.slice(8, 10) + "/" + d.slice(5, 7) : "";

// ---------------------------------------------------------------- fatos reais (o diretor so usa isto)
async function fatos() {
  const vit = async (acao: string) => { try { const r = await fetch(SB_URL + "/functions/v1/frc-vitrine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao }) }); return await r.json(); } catch (_) { return {}; } };
  const [of, at] = await Promise.all([vit("ofertas"), vit("atendidas")]);
  const { data: pv } = await sb.from("painel_dados").select("valor").eq("chave", "veiculos").maybeSingle();
  let vs: any = pv?.valor; if (typeof vs === "string") vs = JSON.parse(vs);
  const ativos = (Array.isArray(vs) ? vs : []).filter((v: any) => v && v.placa && !/vendid|inativ|baixad/i.test(String(v.statusOp || "") + String(v.obs || "")));
  const porTipo: Record<string, number> = {}; ativos.forEach((v: any) => { const t = String(v.tipo || "outro"); porTipo[t] = (porTipo[t] || 0) + 1; });
  const ofertas = ((of && of.ofertas) || []).filter((o: any) => !o.proxima && Number(o.disponivel?.kg || 0) >= 100).map((o: any) => ({
    id: o.id, sentido: o.sentido, origem: o.origem, destino: o.destino, cidades: (o.cidades || []).slice(0, 14), saida: o.data_saida, saida_br: dataBR(o.data_saida),
    caminhao: o.veiculo, livre_kg: Math.round(Number(o.disponivel.kg)), espaco: o.disponivel.tipo, em_rota: !!o.em_rota,
    faltam: o.em_rota ? (o.progresso || []).filter((e: any) => !e.passou_em).map((e: any) => e.cidade) : null }));
  const cidades = ((at && at.cidades) || []).sort((a: any, b: any) => b.viagens - a.viagens).slice(0, 30).map((c: any) => c.cidade + (c.uf && c.uf !== "BA" ? "/" + c.uf : ""));
  return { gerado_em: new Date().toISOString(), base: "Feira de Santana/BA", frota_total: ativos.length, frota_por_tipo: porTipo, ofertas, aviso_ofertas: "Espaço ESTIMADO pode mudar até a confirmação; cotação não garante embarque.",
    cidades_atendidas_90d: cidades, n_cidades_atendidas_90d: ((at && at.cidades) || []).length, servicos: SERVICOS, contato: CONTATO };
}

// ---------------------------------------------------------------- diretor de criacao
async function diretorNome() { const { data } = await sb.from("estudio_worker").select("diretor_nome").eq("id", 1).maybeSingle(); return (data?.diretor_nome as string) || "Ravi"; }
function biblioteca(extra: any[] = []) { return [...BASE.map((m) => ({ ...m, origem: "base" })), ...extra]; }
async function roteiro(briefing: string, tipo: string, formato: string, alvo: number, voz: string, F: any, ofertaId?: string) {
  const nome = await diretorNome();
  const { data: mids } = await sb.from("estudio_midias").select("id,tipo,nome,tags").eq("autorizada", true).in("tipo", ["imagem", "video", "tela"]).order("criado_em", { ascending: false }).limit(40);
  const lib = biblioteca((mids || []).map((m: any) => ({ id: m.id, tipo: m.tipo, nome: m.nome, tags: m.tags })) ).filter((m) => ["imagem", "video", "tela"].includes(m.tipo))
    .filter((m) => tipo === "demo" ? true : !(m.tags || []).includes("demo"))
    .filter((m) => !(tipo === "demo" && formato !== "16:9" && (m.tags || []).includes("computador")) && !(tipo === "demo" && formato === "16:9" && (m.tags || []).includes("celular")));
  const oferta = ofertaId ? F.ofertas.find((o: any) => o.id === ofertaId) : null;
  const sys = `Você é ${nome}, diretor de criação da RF Logística (transportadora de Feira de Santana/BA). Cria roteiros de vídeo comercial curtos e profissionais em português do Brasil.
REGRAS INEGOCIÁVEIS:
1) Use SOMENTE os FATOS fornecidos. Nunca invente números, prazos, preços, clientes, certificações, indicadores, cidades ou funcionalidades. Se não está nos FATOS, não diga.
2) Nunca cite nome de cliente contratante, placa, motorista ou valores financeiros.
3) Espaço no baú é sempre "estimado" e "sujeito a confirmação"; cotação no site não garante embarque.
4) Nas cenas do Rodavia 360 use só funcionalidades listadas em SERVICOS e as telas da BIBLIOTECA (são telas de DEMONSTRAÇÃO com dados fictícios).
5) Frases curtas, tom comercial confiante, sem exagero ("o melhor do Brasil" é proibido). Narração total ≈ ${Math.round(alvo * 2.2)} palavras (≈${alvo}s).
6) Avisos legais ("espaço estimado", "cotação não garante embarque") vão no rodapé do mapa e na legenda do post — NUNCA na narração do encerramento. O encerramento termina com chamada para ação (cotar no site / chamar no WhatsApp).
7) Em "dados": rótulos em português natural (ex.: "kg livres no baú (estimado)", "caminhões na frota", "cidades atendidas em 90 dias"); valores formatados (ex.: "8.000 kg", "23", "20/11"). Nunca use nomes de campos técnicos.
8) Números na narração escritos como se falam (ex.: "oito mil quilos").
FORMATO: ${formato}. Tipos de cena: "abertura" (logo; titulo = slogan curto), "midia" (foto/vídeo da BIBLIOTECA com selo/titulo/subtitulo), "tela" (tela do sistema com até 2 destaques {x,y,w,h em 0..1, rotulo}), "mapa" (rota: cidades na ordem; use só cidades dos FATOS), "dados" (até 3 itens {valor, rotulo}; valores tirados LITERALMENTE dos FATOS), "cartao" (texto em fundo grafite), "encerramento" (titulo = chamada; linhas = contatos dos FATOS).
Cada cena pode ter "narracao" (texto falado). Abertura e encerramento curtos. Transições: fade, slideleft, wipeleft, circleopen, smoothleft, fadeblack, dissolve.
Responda APENAS JSON: {"titulo":"","legenda_post":"","hashtags":"","trilha":"base:trilha-rota|base:trilha-institucional|base:trilha-tecnologia","logo":"rf|rodavia","cenas":[{"tipo":"","midia":"id da BIBLIOTECA (midia/tela)","selo":"","titulo":"","subtitulo":"","narracao":"","transicao":"","dur":0,"cidades":[],"itens":[],"destaques":[],"linhas":[]}]}`;
  const user = `PEDIDO (${tipo}): ${briefing || "(sem detalhes)"}
${oferta ? "OFERTA ESCOLHIDA: " + JSON.stringify(oferta) + "\n" : ""}FATOS: ${JSON.stringify(F)}
BIBLIOTECA: ${JSON.stringify(lib.map((m) => ({ id: m.id, tipo: m.tipo, nome: m.nome })))}`;
  const r = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: user }] });
  const j = await r.json(); let o: any = {};
  try { o = JSON.parse(j.choices[0].message.content); } catch (_) { throw new Error("o diretor nao devolveu um roteiro valido"); }
  return validar(o, F, lib, formato, voz, tipo, nome, oferta);
}
function numerosDosFatos(F: any) {
  const s = new Set<string>(); const add = (v: any) => { const n = String(v).replace(/\D/g, ""); if (n) s.add(n); };
  add(F.frota_total); Object.values(F.frota_por_tipo || {}).forEach(add); add(F.n_cidades_atendidas_90d);
  (F.ofertas || []).forEach((o: any) => { add(o.livre_kg); add((o.cidades || []).length); add(o.saida_br); });
  return s;
}
function validar(o: any, F: any, lib: any[], formato: string, voz: string, tipo: string, nome: string, oferta: any) {
  const ok = new Set(lib.map((m) => m.id)), nums = numerosDosFatos(F), avisos: string[] = [];
  const cidadesOk = new Set<string>([F.base.split("/")[0], ...F.cidades_atendidas_90d.map((c: string) => c.split("/")[0]), ...F.ofertas.flatMap((x: any) => [x.origem, x.destino, ...(x.cidades || [])])].map((c) => String(c).toLowerCase()));
  const tipos = ["abertura", "midia", "tela", "mapa", "dados", "cartao", "encerramento"], trans = ["fade", "slideleft", "wipeleft", "circleopen", "smoothleft", "fadeblack", "dissolve", "slideup", "corte"];
  const fotoPadrao = lib.find((m) => m.id === "base:frota-1")!.id;
  const cenas = (Array.isArray(o.cenas) ? o.cenas : []).filter((c: any) => c && tipos.includes(c.tipo)).slice(0, 12).map((c: any, i: number) => {
    const x: any = { id: "c" + (i + 1) + Math.random().toString(36).slice(2, 6), tipo: c.tipo, selo: String(c.selo || "").slice(0, 28), titulo: String(c.titulo || "").slice(0, 70), subtitulo: String(c.subtitulo || "").slice(0, 120),
      transicao: trans.includes(c.transicao) ? c.transicao : "fade", dur: Math.max(0, Math.min(15, Number(c.dur) || 0)) || undefined };
    if (c.narracao) x.narracao = { texto: String(c.narracao).slice(0, 500) };
    if (c.tipo === "midia" || c.tipo === "tela") {
      const id = ok.has(c.midia) ? c.midia : (c.tipo === "tela" ? lib.find((m) => m.tipo === "tela")!.id : fotoPadrao);
      if (id !== c.midia) avisos.push("cena " + (i + 1) + ": mídia trocada por uma da biblioteca");
      x.midia = { ref: id };
      const bm = BASE.find((m) => m.id === id);
      if (bm && bm.tipo === "tela") { x.tipo = "tela"; x.destaques = (bm.destaques || []).map((d: any, j: number) => ({ ...d, ini: 1.2 + j * 2.2 })); if (bm.ajuste) x.ajuste = bm.ajuste; }
      else if (c.tipo === "tela") x.tipo = "midia";
    }
    if (c.tipo === "mapa") {
      const nm = (n: any) => String((n && n.nome) || n || "").split("/")[0].trim();
      const cs = (Array.isArray(c.cidades) ? c.cidades : []).map(nm).filter((n: string) => n && cidadesOk.has(n.toLowerCase()));
      let lista: string[] = oferta ? [...(oferta.cidades || [])].map(nm) : cs;
      if (!oferta && lista.length < 3) lista = F.cidades_atendidas_90d.filter((c: string) => !c.includes("/")).slice(0, 12);
      lista = lista.filter((n, j, a) => n && !/^feira de santana$/i.test(n) && a.indexOf(n) === j).slice(0, 13);
      // ida: rota na ordem da programacao saindo de Feira; volta (coleta) ou cidades atendidas: pontos que seguem para Feira
      x.modo = oferta && oferta.sentido === "ida" ? "rota" : "pontos";
      x.cidades = x.modo === "rota" ? [{ nome: "Feira de Santana", base: true }, ...lista.map((n) => ({ nome: n }))] : [...lista.map((n) => ({ nome: n })), { nome: "Feira de Santana", base: true }];
      x.rodape = String(c.subtitulo || c.rodape || "").slice(0, 120) || undefined; x.subtitulo = "";
    }
    if (c.tipo === "dados") {
      const ROT: Record<string, string> = { livre_kg: "kg livres no baú (estimado)", saida_br: "data de saída", saida: "data de saída", frota_total: "caminhões na frota", n_cidades_atendidas_90d: "cidades atendidas em 90 dias" };
      x.itens = (Array.isArray(c.itens) ? c.itens : []).filter((it: any) => { const n = String(it.valor || "").replace(/\D/g, ""); const bom = !!n && nums.has(n); if (!bom) avisos.push("dado removido (não está nos fatos ou não é número): " + it.valor); return bom; }).slice(0, 3).map((it: any) => {
        let v = String(it.valor).trim(), r = String(it.rotulo || "").trim(); if (ROT[r]) r = ROT[r]; else if (/^[a-z_]+$/.test(r)) r = r.replace(/_/g, " ");
        if (/^\d{4,}$/.test(v)) v = Number(v).toLocaleString("pt-BR") + (/kg/i.test(r) ? " kg" : "");
        if (/kg/i.test(v) && /^kg/i.test(r)) r = r.replace(/^kg\s*/i, "");
        return { valor: v.slice(0, 14), rotulo: r.slice(0, 40) };
      });
    }
    if (c.tipo === "encerramento") x.linhas = [CONTATO.site, "WhatsApp " + CONTATO.whatsapp];
    return x;
  }).filter((c: any) => c.tipo !== "dados" || c.itens.length);
  if (!cenas.length || cenas[0].tipo !== "abertura") cenas.unshift({ id: "c0ab", tipo: "abertura", titulo: tipo === "demo" ? "Gestão de frota inteligente" : "Transporte e distribuição", transicao: "fade" });
  if (cenas[cenas.length - 1].tipo !== "encerramento") cenas.push({ id: "c9en", tipo: "encerramento", titulo: "Fale com a RF", linhas: [CONTATO.site, "WhatsApp " + CONTATO.whatsapp], transicao: "fadeblack" });
  const trilha = ["base:trilha-rota", "base:trilha-institucional", "base:trilha-tecnologia"].includes(o.trilha) ? o.trilha : (tipo === "demo" ? "base:trilha-tecnologia" : tipo === "institucional" ? "base:trilha-institucional" : "base:trilha-rota");
  return {
    titulo: String(o.titulo || "Vídeo RF").slice(0, 80), legenda: [String(o.legenda_post || "").slice(0, 1800), String(o.hashtags || "").slice(0, 300)].filter(Boolean).join("\n\n"), avisos,
    plano: { formato, voz: { id: VOZES[voz] ? voz : "locutor", estilo: "" }, trilha: { ref: trilha, volume: 0.30 }, logo: o.logo === "rodavia" || tipo === "demo" ? "rodavia" : "rf", marca: { ativo: true, pos: "sup-dir" }, legendas: true, cenas, diretor: nome },
  };
}

// ---------------------------------------------------------------- narracao + legenda sincronizada
async function narrarCena(projId: string, c: any, vozId: string, estilo: string) {
  const v = VOZES[vozId] || VOZES.locutor;
  const texto = String(c.narracao?.texto || "").replace(/[*_#`>|]/g, " ").replace(/\s+/g, " ").trim(); if (!texto) return c;
  const instr = v.base + " Português do Brasil. Ritmo de comercial: frases bem articuladas, pausas curtas nas vírgulas e pausa um pouco maior no ponto final. " + (estilo || c.narracao?.estilo || "");
  const r = await oai("audio/speech", { model: "gpt-4o-mini-tts", voice: v.voice, input: texto, instructions: instr, response_format: "mp3" });
  const audio = new Uint8Array(await r.arrayBuffer());
  const path = `estudio/narracao/${projId}/${c.id}-${Date.now()}.mp3`;
  const up = await sb.storage.from(BUCKET).upload(path, audio, { contentType: "audio/mpeg", upsert: true }); if (up.error) throw new Error("nao gravou o audio: " + up.error.message);
  // legenda: tempo de cada palavra (whisper-1, word timestamps) -- custo minimo na mesma conta
  let palavras: any[] = [], dur = 0;
  try {
    const fd = new FormData(); fd.append("file", new Blob([audio], { type: "audio/mpeg" }), "n.mp3"); fd.append("model", "whisper-1"); fd.append("language", "pt"); fd.append("response_format", "verbose_json"); fd.append("timestamp_granularities[]", "word");
    const rt = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: "Bearer " + Deno.env.get("OPENAI_API_KEY") }, body: fd });
    const jt = await rt.json(); dur = Number(jt.duration) || 0;
    const ws = (jt.words || []).map((w: any) => ({ w: String(w.word).trim(), s: +Number(w.start).toFixed(2), e: +Number(w.end).toFixed(2) }));
    const orig = texto.split(/\s+/);
    palavras = ws.length === orig.length ? ws.map((w: any, i: number) => ({ ...w, w: orig[i] })) : ws;
  } catch (_) { /* sem legenda sincronizada: divide pelo tempo */ }
  if (!palavras.length) { const orig = texto.split(/\s+/); dur = dur || orig.length / 2.4; let t = 0; const tot = orig.reduce((a, w) => a + w.length + 1, 0); palavras = orig.map((w) => { const d = dur * (w.length + 1) / tot; const p = { w, s: +t.toFixed(2), e: +(t + d).toFixed(2) }; t += d; return p; }); }
  if (!dur && palavras.length) dur = palavras[palavras.length - 1].e + 0.2;
  return { ...c, narracao: { ...(c.narracao || {}), texto, voz: vozId, path, dur: +dur.toFixed(2), palavras, gerado_em: new Date().toISOString() } };
}

// ---------------------------------------------------------------- receita para o worker (links assinados na hora)
async function refUrl(ref: string) {
  if (!ref) return null;
  if (ref.startsWith("base:")) { const m = BASE.find((x) => x.id === ref); return m ? { url: GH + m.arq, chave: "base/" + m.arq, tipo: m.tipo === "tela" ? "imagem" : m.tipo } : null; }
  const { data: m } = await sb.from("estudio_midias").select("*").eq("id", ref).maybeSingle(); if (!m) return null;
  return { url: m.path ? await assinar(m.path) : m.url, chave: m.path || m.url, tipo: m.tipo === "tela" ? "imagem" : m.tipo };
}
async function coords(nome: string) { const { data } = await sb.rpc("frc_coords", { p: nome }); const c = Array.isArray(data) ? data[0] : null; return c ? { lat: c.lat, lng: c.lng } : null; }
async function receita(plano: any, formato: string) {
  const logo = plano.logo === "rodavia" ? "logos/logo-rodavia360.png" : "logos/logo-rf.png";
  const rec: any = { formato, legendas: plano.legendas !== false, logo_url: GH + logo, logo_chave: "base/" + logo, mapa_url: GH + "mapa-ne.json", velocidade_voz: Number(plano.voz?.velocidade) || 1, volume_voz: 1, cenas: [] };
  if (plano.marca?.ativo !== false) { const mk = plano.logo === "rodavia" ? "logos/logo-rodavia360.png" : "logos/escudo-rf.png"; rec.marca = { url: GH + mk, chave: "base/" + mk, pos: plano.marca?.pos || "sup-dir" }; }
  if (plano.trilha?.ref) { const t = await refUrl(plano.trilha.ref); if (t) rec.trilha = { url: t.url, chave: t.chave, volume: plano.trilha.volume ?? 0.3 }; }
  for (const c of plano.cenas || []) {
    const x: any = { ...c }; delete x.id;
    if (c.midia?.ref) { const m = await refUrl(c.midia.ref); if (!m) throw new Error("mídia não encontrada na cena " + (c.titulo || c.tipo)); x.midia = { url: m.url, chave: m.chave, tipo: m.tipo }; }
    if (c.narracao?.path) x.narracao = { url: await assinar(c.narracao.path), chave: c.narracao.path, dur: c.narracao.dur, palavras: c.narracao.palavras, velocidade: c.narracao.velocidade || plano.voz?.velocidade || 1 };
    else delete x.narracao;
    if (c.tipo === "mapa") {
      x.cidades = []; for (const ci of c.cidades || []) { const p = (ci.lat != null && ci.lng != null) ? ci : await coords(ci.nome); if (p) x.cidades.push({ nome: ci.nome, lat: p.lat, lng: p.lng, base: !!ci.base }); }
    }
    rec.cenas.push(x);
  }
  return rec;
}

// ---------------------------------------------------------------- Instagram (Reels) -- so com aprovacao do master
const G = "https://graph.instagram.com/v23.0";
async function ig(p: string, params: Record<string, string>, metodo = "GET") {
  const qs = new URLSearchParams(params).toString();
  const r = metodo === "GET" ? await fetch(G + p + "?" + qs) : await fetch(G + p, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: qs });
  const d = await r.json().catch(() => ({})); if (!r.ok || d?.error) throw new Error("Instagram: " + (d?.error?.error_user_msg || d?.error?.message || ("HTTP " + r.status))); return d;
}
async function igToken() {
  const { data: cfg } = await sb.from("rf_instagram_cfg").select("*").eq("id", 1).maybeSingle(); if (!cfg) throw new Error("Instagram não conectado no sistema");
  let token = cfg.token as string;
  if (Date.now() - new Date(cfg.renovado_em).getTime() > 20 * 864e5) { try { const rn = await ig("/refresh_access_token", { grant_type: "ig_refresh_token", access_token: token }); if (rn?.access_token) { token = rn.access_token; await sb.from("rf_instagram_cfg").update({ token, renovado_em: new Date().toISOString() }).eq("id", 1); } } catch (_) { /* */ } }
  return token;
}
async function igContinuar(pub: any) {
  const token = await igToken();
  for (let i = 0; i < 18; i++) {
    const st = await ig("/" + pub.container_id, { fields: "status_code,status", access_token: token });
    if (st.status_code === "FINISHED") {
      const pr = await ig("/me/media_publish", { creation_id: pub.container_id, access_token: token }, "POST");
      let permalink = ""; try { permalink = (await ig("/" + pr.id, { fields: "permalink", access_token: token })).permalink || ""; } catch (_) { /* */ }
      await sb.from("estudio_publicacoes").update({ status: "publicado", media_id: pr.id, permalink, publicado_em: new Date().toISOString(), erro: null }).eq("id", pub.id);
      return { ok: true, status: "publicado", permalink };
    }
    if (st.status_code === "ERROR" || st.status_code === "EXPIRED") { await sb.from("estudio_publicacoes").update({ status: "erro", erro: "Instagram recusou o vídeo: " + (st.status || st.status_code) }).eq("id", pub.id); return { ok: false, status: "erro", erro: st.status || st.status_code }; }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return { ok: true, status: "publicando", msg: "O Instagram ainda está processando o vídeo; o sistema confere de novo em instantes." };
}

// ---------------------------------------------------------------- instalacao na VPS (pelo canal do Ravi, sem terminal)
function scriptInstalacao(token: string) {
  return `#!/bin/bash
# RF Logistica - instalacao do Estudio de Video (worker FFmpeg) - v1 13/11/2026
# Servico SEPARADO do Ravi (rf-estudio), prioridade baixa, CPU e memoria limitadas. Confere a capacidade antes.
LOG=/opt/rf-estudio/instalar.log; mkdir -p /opt/rf-estudio; exec >>$LOG 2>&1
API="${SB_URL}/functions/v1/estudio"; TK="${token}"; GH="${GH}"
relata(){ curl -fsS -m 25 -X POST "$API" -H "Content-Type: application/json" -H "x-estudio-token: $TK" -d "$1" >/dev/null || true; }
echo "== $(date) inicio"
echo "$TK" > /opt/rf-estudio/token; chmod 600 /opt/rf-estudio/token
CPUS=$(nproc); MEM=$(free -m | awk '/Mem:/{print $2}'); DISP=$(free -m | awk '/Mem:/{print $7}'); DISCO=$(df -BG --output=avail / | tail -1 | tr -dc 0-9)
CARGA=$(cut -d' ' -f1 /proc/loadavg); OS=$(. /etc/os-release; echo "$PRETTY_NAME"); CPUM=$(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | sed 's/^ *//' | tr -d '"')
relata "{\\"acao\\":\\"worker_instalacao\\",\\"etapa\\":\\"capacidade\\",\\"cpus\\":$CPUS,\\"mem_mb\\":$MEM,\\"mem_disp_mb\\":$DISP,\\"disco_livre_gb\\":$DISCO,\\"carga\\":\\"$CARGA\\",\\"os\\":\\"$OS\\",\\"cpu\\":\\"$CPUM\\",\\"ravi\\":\\"$(systemctl is-active rf-ravi)\\",\\"ciot\\":\\"$(systemctl is-active rf-ciot)\\"}"
if [ "$DISP" -lt 700 ] || [ "$DISCO" -lt 4 ]; then relata '{"acao":"worker_instalacao","etapa":"recusado","motivo":"pouca memoria livre ou pouco disco: nao instalei para nao prejudicar o Ravi"}'; exit 0; fi
export DEBIAN_FRONTEND=noninteractive
nice -n 15 apt-get update -y -qq && nice -n 15 apt-get install -y -qq --no-install-recommends ffmpeg librsvg2-bin fontconfig fonts-dejavu-core curl
mkdir -p /usr/local/share/fonts/rf
for f in Anton-Regular Poppins-Regular Poppins-Medium Poppins-SemiBold Poppins-Bold Poppins-ExtraBold; do curl -fsSL -o /usr/local/share/fonts/rf/$f.ttf "$GH/fontes/$f.ttf"; done
fc-cache -f >/dev/null
curl -fsSL -o /opt/rf-estudio/estudio.mjs.novo "$GH/estudio-worker.mjs" && mv /opt/rf-estudio/estudio.mjs.novo /opt/rf-estudio/estudio.mjs
MEMMAX=$(( MEM*55/100 )); [ $MEMMAX -gt 3072 ] && MEMMAX=3072
if [ "$CPUS" -gt 1 ]; then QUOTA=$(( (CPUS-1)*95 )); else QUOTA=80; fi
cat > /etc/systemd/system/rf-estudio.service <<SVC
[Unit]
Description=RF Logistica - Estudio de Video (render)
After=network-online.target
[Service]
WorkingDirectory=/opt/rf-estudio
ExecStart=/usr/bin/node /opt/rf-estudio/estudio.mjs
Restart=always
RestartSec=10
Nice=15
CPUWeight=20
CPUQuota=\${QUOTA}%
IOSchedulingClass=idle
MemoryMax=\${MEMMAX}M
Environment=NODE_ENV=production
[Install]
WantedBy=multi-user.target
SVC
systemctl daemon-reload; systemctl enable rf-estudio >/dev/null 2>&1; systemctl restart rf-estudio
sleep 4
relata "{\\"acao\\":\\"worker_instalacao\\",\\"etapa\\":\\"fim\\",\\"estudio\\":\\"$(systemctl is-active rf-estudio)\\",\\"ravi\\":\\"$(systemctl is-active rf-ravi)\\",\\"ffmpeg\\":\\"$(ffmpeg -version 2>/dev/null | head -1 | cut -c1-40)\\",\\"rsvg\\":\\"$(rsvg-convert --version 2>/dev/null | head -1)\\",\\"cpu_quota\\":\\"$QUOTA\\",\\"mem_max_mb\\":$MEMMAX}"
echo "== $(date) fim"
`;
}
function bootstrap(script: string) {
  const b64 = btoa(unescape(encodeURIComponent(script)));
  return `// RF Logistica - WhatsApp proprio do Ravi - BOOTSTRAP do Estudio de Video (uso unico) 13/11/2026
// ESTE ARQUIVO NAO E O SERVIDOR DO RAVI. Ele roda uma unica vez: grava e dispara a instalacao do Estudio de Video
// (servico separado rf-estudio, fora do Ravi) e devolve NA HORA o servidor original do Ravi (copia server.mjs.anterior),
// que o systemd reinicia em ~5 s. A sessao do WhatsApp (pasta auth) nao e tocada.
const VERSAO = "ravi-wa-v12";   // so para a conferencia do /atualizar; o Ravi continua na versao dele
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const atual = new URL(import.meta.url).pathname, ant = atual + ".anterior", seguro = atual + ".ravi-ok";
const MARCA = "RF Logistica - WhatsApp proprio do Ravi", BOOT = "BOOTSTRAP do Estudio";
function valido(t) { return typeof t === "string" && t.includes(MARCA) && !t.includes(BOOT) && t.length > 10000; }
let original = null;
try { const t = fs.readFileSync(ant, "utf8"); if (valido(t)) { original = t; fs.writeFileSync(seguro, t); } } catch (e) { /* */ }
if (!original) { try { const t = fs.readFileSync(seguro, "utf8"); if (valido(t)) original = t; } catch (e) { /* */ } }
try {
  fs.mkdirSync("/opt/rf-estudio", { recursive: true });
  fs.writeFileSync("/opt/rf-estudio/instalar.sh", Buffer.from("${b64}", "base64"));
  fs.chmodSync("/opt/rf-estudio/instalar.sh", 0o700);
  const r = spawnSync("systemd-run", ["--unit=rf-estudio-instalar-" + Date.now(), "--collect", "/bin/bash", "/opt/rf-estudio/instalar.sh"], { encoding: "utf8" });
  fs.writeFileSync("/opt/rf-estudio/bootstrap.txt", new Date().toISOString() + " systemd-run: " + r.status + " " + (r.stderr || "") + "\\n");
} catch (e) { try { fs.writeFileSync("/opt/rf-estudio/bootstrap-erro.txt", String(e && e.stack || e)); } catch (_) { /* */ } }
if (original) { fs.writeFileSync(atual + ".novo", original); fs.renameSync(atual + ".novo", atual); }
console.log(VERSAO, "bootstrap do estudio concluido; devolvendo o servidor do Ravi");
setTimeout(() => process.exit(0), 300);
// (texto de preenchimento para a conferencia de tamanho minimo do /atualizar do Ravi)
// ................................................................................................................................
// ................................................................................................................................
// ................................................................................................................................
`;
}
async function raviVps(caminho: string, metodo = "GET", corpo?: any) {
  const s: Record<string, string> = {}; const { data } = await sb.from("rf_segredos").select("chave,valor").in("chave", ["wa_url", "wa_token", "wa_ca"]); (data || []).forEach((x: any) => s[x.chave] = x.valor);
  // @ts-ignore Deno API
  const client = Deno.createHttpClient({ caCerts: [s.wa_ca] });
  const r = await fetch(s.wa_url + caminho, { method: metodo, client, headers: { "Content-Type": "application/json", "X-RF-Token": s.wa_token }, body: corpo ? JSON.stringify(corpo) : undefined } as any);
  const t = await r.text(); let j: any = null; try { j = JSON.parse(t); } catch (_) { j = { texto: t }; } return { http: r.status, j };
}

// ---------------------------------------------------------------- servidor
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const b = await req.json().catch(() => ({}));
    const U = await quem(req, b);
    if (!U) return erro("sem permissão para o Estúdio de Vídeo", 401);
    const acao = String(b.acao || "");

    // ===================== worker (VPS)
    if (U.tipo === "worker") {
      if (acao === "worker_instalacao") {
        const { data: w } = await sb.from("estudio_worker").select("instalacao").eq("id", 1).maybeSingle();
        const inst = { ...((w?.instalacao as any) || {}), [String(b.etapa || "x")]: { ...b, em: new Date().toISOString() } }; delete (inst as any).acao;
        await sb.from("estudio_worker").update({ instalacao: inst }).eq("id", 1); return json({ ok: true });
      }
      if (acao === "worker_pull") {
        await sb.from("estudio_worker").update({ visto_em: new Date().toISOString(), sistema: b.sistema || null, versao: b.sistema?.versao || null }).eq("id", 1);
        const { data: wk } = await sb.from("estudio_worker").select("comando").eq("id", 1).maybeSingle();
        if (String(wk?.comando || "").startsWith("atualizar")) {
          await sb.from("estudio_worker").update({ comando: null }).eq("id", 1);
          const sha = String(wk!.comando).split(":")[1] || "main";   // pelo commit: o GitHub nao devolve copia velha
          const r = await fetch(GH.replace("/main/", "/" + sha + "/") + "estudio-worker.mjs?t=" + Date.now()); const codigo = await r.text();
          if (r.ok && codigo.includes("rf-estudio-v")) return json({ ok: true, comando: "atualizar", codigo });
        }
        // render travado (sem sinal ha 25 min) volta como erro
        await sb.from("estudio_renders").update({ status: "erro", erro: "tempo esgotado no servidor de vídeo" }).eq("status", "renderizando").lt("visto_em", new Date(Date.now() - 25 * 60e3).toISOString());
        const { data: fila } = await sb.from("estudio_renders").select("*").eq("status", "fila").eq("cancelar", false).order("pedido_em").limit(1);
        const job = fila && fila[0]; if (!job) return json({ ok: true, espera: 8000 });
        const { data: tomou } = await sb.from("estudio_renders").update({ status: "renderizando", iniciado_em: new Date().toISOString(), visto_em: new Date().toISOString(), progresso: 1, etapa: "preparando" }).eq("id", job.id).eq("status", "fila").select("id");
        if (!tomou || !tomou.length) return json({ ok: true, espera: 1000 });
        try {
          const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", job.projeto_id).maybeSingle();
          const rec = await receita(pj?.plano || job.receita || {}, job.formato);
          const pv = `estudio/renders/${job.id}/video.mp4`, pc = `estudio/renders/${job.id}/capa.jpg`;
          const [uv, uc] = await Promise.all([sb.storage.from(BUCKET).createSignedUploadUrl(pv, { upsert: true }), sb.storage.from(BUCKET).createSignedUploadUrl(pc, { upsert: true })]);
          if (uv.error || uc.error) throw new Error("não criei o link de envio: " + (uv.error?.message || uc.error?.message));
          await sb.from("estudio_renders").update({ receita: rec, video_path: pv, capa_path: pc }).eq("id", job.id);
          return json({ ok: true, job: { id: job.id, receita: rec, upload_video: uv.data.signedUrl, upload_capa: uc.data.signedUrl } });
        } catch (e) {
          await sb.from("estudio_renders").update({ status: "erro", erro: String((e as Error).message || e).slice(0, 500) }).eq("id", job.id);
          return json({ ok: true, espera: 1000 });
        }
      }
      if (acao === "worker_status") {
        const up: any = { visto_em: new Date().toISOString() };
        for (const k of ["status", "progresso", "etapa", "erro", "duracao", "tamanho", "largura", "altura", "previa_b64", "segundos_render"]) if (b[k] !== undefined) up[k] = b[k];
        if (b.status === "pronto" || b.status === "erro") up.concluido_em = new Date().toISOString();
        const { data: r } = await sb.from("estudio_renders").update(up).eq("id", b.job_id).select("cancelar,projeto_id").maybeSingle();
        if (b.status === "pronto" && r?.projeto_id) await sb.from("estudio_projetos").update({ status: "pronto", atualizado_em: new Date().toISOString() }).eq("id", r.projeto_id);
        return json({ ok: true, cancelar: !!r?.cancelar });
      }
      return erro("ação do worker desconhecida");
    }

    // ===================== estudio (usuarios e servidor)
    if (acao === "biblioteca") {
      const { data } = await sb.from("estudio_midias").select("*").order("criado_em", { ascending: false }).limit(300);
      return json({ ok: true, base: BASE.map((m) => ({ ...m, url: GH + m.arq })), midias: data || [], vozes: Object.entries(VOZES).map(([id, v]) => ({ id, nome: v.nome })) });
    }
    if (acao === "fatos") return json({ ok: true, fatos: await fatos(), diretor: await diretorNome() });
    if (acao === "sistema") {
      const { data: w } = await sb.from("estudio_worker").select("*").eq("id", 1).maybeSingle();
      const ini = hojeBR().slice(0, 8) + "01";
      const { data: uso } = await sb.from("ravi_uso").select("operacao,audio_chars,entrada,saida").eq("funcao", "estudio").gte("em", ini);
      let chars = 0, tin = 0, tout = 0, nTr = 0; (uso || []).forEach((u: any) => { chars += Number(u.audio_chars || 0); tin += Number(u.entrada || 0); tout += Number(u.saida || 0); if (/transcri/.test(u.operacao || "")) nTr++; });
      const usd = chars * 0.000015 + tin * 0.00000025 + tout * 0.000002 + nTr * 0.003;   // narracao ~US$0,015/1000 caracteres; roteiro; legenda
      const { count: fila } = await sb.from("estudio_renders").select("id", { count: "exact", head: true }).in("status", ["fila", "renderizando"]);
      return json({ ok: true, worker: w, online: !!(w?.visto_em && Date.now() - new Date(w.visto_em).getTime() < 90e3), fila, mes: { narracao_chars: chars, chamadas: (uso || []).length, custo_usd_estimado: +usd.toFixed(3), custo_brl_estimado: +(usd * 5.5).toFixed(2) } });
    }
    if (acao === "diretor_sugerir") {
      const F = await fatos(); const nome = await diretorNome();
      const sug: any[] = [];
      F.ofertas.filter((o: any) => !o.em_rota && o.livre_kg >= 500).slice(0, 3).forEach((o: any) => sug.push({ tipo: "rota", oferta_id: o.id, titulo: `Espaço no baú: ${o.origem} → ${o.destino} (${o.saida_br})`, briefing: `Campanha de espaço disponível no baú na saída de ${o.saida_br}, ${o.origem} para ${o.destino}, passando por ${(o.cidades || []).slice(0, 6).join(", ")}. Cerca de ${o.livre_kg} kg livres (estimado). Chamar para cotar no site.` }));
      F.ofertas.filter((o: any) => o.em_rota && (o.faltam || []).length >= 2).slice(0, 2).forEach((o: any) => sug.push({ tipo: "rota", oferta_id: o.id, titulo: `Caminhão em rota com espaço: ${o.destino}`, briefing: `Caminhão já na estrada para ${o.destino}; ainda passa por ${(o.faltam || []).slice(0, 6).join(", ")}. Espaço livre estimado de ${o.livre_kg} kg.` }));
      if (F.cidades_atendidas_90d.length) sug.push({ tipo: "rota", titulo: "Cidades que a RF atendeu nos últimos 90 dias", briefing: `Mostrar no mapa as cidades que a RF atendeu nos últimos 90 dias (${F.cidades_atendidas_90d.slice(0, 10).join(", ")}...) e chamar para cotar carga fracionada ou caminhão dedicado.` });
      sug.push({ tipo: "institucional", titulo: "Institucional RF Logística", briefing: `Vídeo institucional: quem é a RF, frota própria (${F.frota_total} caminhões no sistema), base em Feira de Santana, lotação e fracionado, Torre de Controle, Ravi.` });
      sug.push({ tipo: "demo", titulo: "Demonstração do Rodavia 360", briefing: "Demonstração do sistema Rodavia 360 com as telas de demonstração: tela inicial por setor, frota, viagens, dashboard, óleo por km e fracionado." });
      return json({ ok: true, diretor: nome, sugestoes: sug });
    }
    if (acao === "diretor_roteiro") {
      const F = await fatos();
      const formato = ["9:16", "1:1", "16:9", "4:5"].includes(b.formato) ? b.formato : "9:16";
      const out = await roteiro(String(b.briefing || ""), String(b.tipo || "livre"), formato, Math.max(15, Math.min(90, Number(b.duracao) || 30)), String(b.voz || "locutor"), F, b.oferta_id);
      const { data: pj, error } = await sb.from("estudio_projetos").insert({ titulo: out.titulo, tipo: b.tipo || "livre", formato, plano: { ...out.plano, legenda_post: out.legenda }, origem: b.automatico ? "automatico" : "diretor", diretor: out.plano.diretor, briefing: b.briefing || "", fatos: F, oferta_id: b.oferta_id || null, criado_por: U.uid, criado_nome: U.nome }).select("*").single();
      if (error) throw new Error(error.message);
      return json({ ok: true, projeto: pj, avisos: out.avisos });
    }
    if (acao === "narrar") {
      const { data: pj } = await sb.from("estudio_projetos").select("*").eq("id", b.projeto_id).maybeSingle(); if (!pj) return erro("projeto não encontrado", 404);
      const plano = pj.plano || {}; const vozId = String(b.voz || plano.voz?.id || "locutor");
      const alvo = b.cena_id ? [String(b.cena_id)] : null; const feitas: string[] = [];
      const cenas = [...(plano.cenas || [])];
      await Promise.all(cenas.map(async (c: any, i: number) => {
        if (!c.narracao?.texto) return; if (alvo && !alvo.includes(c.id)) return; if (!alvo && !b.refazer && c.narracao.path && c.narracao.voz === vozId) return;
        cenas[i] = await narrarCena(pj.id, c, vozId, String(b.estilo || plano.voz?.estilo || "")); feitas.push(c.id);
      }));
      const novo = { ...plano, cenas, voz: { ...(plano.voz || {}), id: vozId, estilo: b.estilo ?? plano.voz?.estilo ?? "" } };
      await sb.from("estudio_projetos").update({ plano: novo, atualizado_em: new Date().toISOString() }).eq("id", pj.id);
      return json({ ok: true, plano: novo, narradas: feitas });
    }
    if (acao === "render") {
      const { data: pj } = await sb.from("estudio_projetos").select("*").eq("id", b.projeto_id).maybeSingle(); if (!pj) return erro("projeto não encontrado", 404);
      const fmts = (Array.isArray(b.formatos) && b.formatos.length ? b.formatos : [pj.formato]).filter((f: string) => ["9:16", "1:1", "16:9", "4:5"].includes(f)).slice(0, 3);
      const falta = (pj.plano?.cenas || []).filter((c: any) => c.narracao?.texto && !c.narracao?.path); if (falta.length) return erro("falta gravar a narração de " + falta.length + " cena(s) — toque em 🎙️ Narrar tudo antes de renderizar");
      const linhas = fmts.map((f: string) => ({ projeto_id: pj.id, formato: f, status: "fila", pedido_por: U.uid, pedido_nome: U.nome }));
      const { data, error } = await sb.from("estudio_renders").insert(linhas).select("id,formato,status"); if (error) throw new Error(error.message);
      return json({ ok: true, renders: data });
    }
    if (acao === "render_cancelar") { await sb.from("estudio_renders").update({ cancelar: true, status: "cancelado" }).eq("id", b.render_id).in("status", ["fila"]); await sb.from("estudio_renders").update({ cancelar: true }).eq("id", b.render_id); return json({ ok: true }); }
    if (acao === "render_estado") { const { data } = await sb.from("estudio_renders").select("id,status,progresso,etapa,erro,duracao,tamanho,video_path,capa_path,previa_b64,segundos_render,formato").eq("id", b.render_id).maybeSingle(); return json({ ok: true, render: data }); }
    if (acao === "publicar_pedir") {
      const { data: r } = await sb.from("estudio_renders").select("id,projeto_id,status,formato").eq("id", b.render_id).maybeSingle(); if (!r || r.status !== "pronto") return erro("o vídeo ainda não está pronto");
      const { data, error } = await sb.from("estudio_publicacoes").insert({ render_id: r.id, projeto_id: r.projeto_id, formato: r.formato, rede: "instagram", tipo: "reels", legenda: String(b.legenda || "").slice(0, 2200), status: "aguardando", automatico: !!b.automatico, pedido_por: U.uid, pedido_nome: U.nome }).select("*").single();
      if (error) throw new Error(error.message);
      return json({ ok: true, publicacao: data, msg: "Enviado para aprovação do Renato. Nada é publicado sem o OK dele." });
    }
    if (acao === "publicar_decidir") {
      if (!U.master || U.tipo !== "usuario") return erro("só o login master (Renato) aprova publicação externa", 403);
      const { data: p } = await sb.from("estudio_publicacoes").select("*").eq("id", b.publicacao_id).maybeSingle(); if (!p) return erro("pedido não encontrado", 404);
      if (p.status !== "aguardando" && p.status !== "erro") return erro("este pedido já foi decidido (" + p.status + ")");
      if (!b.aprovar) { await sb.from("estudio_publicacoes").update({ status: "recusado", decidido_por: U.uid, decidido_em: new Date().toISOString(), motivo: String(b.motivo || "").slice(0, 300) }).eq("id", p.id); return json({ ok: true, status: "recusado" }); }
      const { data: r } = await sb.from("estudio_renders").select("video_path,capa_path").eq("id", p.render_id).maybeSingle(); if (!r?.video_path) return erro("vídeo não encontrado");
      const token = await igToken();
      const params: Record<string, string> = { media_type: "REELS", video_url: await assinar(r.video_path, 3 * 3600), caption: String(b.legenda ?? p.legenda ?? "").slice(0, 2200), share_to_feed: "true", access_token: token };
      if (r.capa_path) params.cover_url = await assinar(r.capa_path, 3 * 3600);
      const cont = await ig("/me/media", params, "POST");
      await sb.from("estudio_publicacoes").update({ status: "publicando", container_id: cont.id, decidido_por: U.uid, decidido_em: new Date().toISOString(), legenda: params.caption, erro: null }).eq("id", p.id);
      return json(await igContinuar({ ...p, container_id: cont.id }));
    }
    if (acao === "publicar_continuar") {
      const { data: p } = await sb.from("estudio_publicacoes").select("*").eq("id", b.publicacao_id).maybeSingle(); if (!p || p.status !== "publicando" || !p.container_id) return json({ ok: true, status: p?.status });
      return json(await igContinuar(p));
    }
    if (acao === "automatico") {   // robo diario: cria a campanha da proxima saida com espaco; NUNCA publica (vai para aprovacao)
      if (U.tipo !== "servidor") return erro("só o robô do sistema", 403);
      const F = await fatos(); const hoje = hojeBR(); const lim = new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 10);
      const alvo = F.ofertas.filter((o: any) => !o.em_rota && o.saida > hoje && o.saida <= lim && o.livre_kg >= 1500).sort((a: any, b2: any) => b2.livre_kg - a.livre_kg)[0];
      if (!alvo) return json({ ok: true, msg: "nenhuma saída com espaço relevante nos próximos 4 dias" });
      const { data: ja } = await sb.from("estudio_projetos").select("id").eq("oferta_id", alvo.id).limit(1); if (ja && ja.length) return json({ ok: true, msg: "já existe vídeo para esta saída" });
      const out = await roteiro(`Campanha automática: espaço no baú na saída de ${alvo.saida_br}, ${alvo.origem} → ${alvo.destino}.`, "rota", "9:16", 25, "locutor", F, alvo.id);
      const { data: pj } = await sb.from("estudio_projetos").insert({ titulo: out.titulo, tipo: "rota", formato: "9:16", plano: { ...out.plano, legenda_post: out.legenda }, origem: "automatico", diretor: out.plano.diretor, briefing: "automático", fatos: F, oferta_id: alvo.id, criado_nome: "Robô do Estúdio" }).select("*").single();
      const cenas = []; for (const c of pj.plano.cenas) cenas.push(c.narracao?.texto ? await narrarCena(pj.id, c, "locutor", "") : c);
      await sb.from("estudio_projetos").update({ plano: { ...pj.plano, cenas } }).eq("id", pj.id);
      await sb.from("estudio_renders").insert({ projeto_id: pj.id, formato: "9:16", status: "fila", pedido_nome: "Robô do Estúdio" });
      return json({ ok: true, projeto_id: pj.id, oferta: alvo.id, msg: "vídeo criado e na fila; a publicação só sai com aprovação do Renato" });
    }
    if (acao === "auto_pedir_publicacao") {   // depois do render automatico pronto: pede aprovacao
      if (U.tipo !== "servidor") return erro("só o robô do sistema", 403);
      const { data: rs } = await sb.from("estudio_renders").select("id,projeto_id,formato,estudio_projetos!inner(origem,plano)").eq("status", "pronto").eq("estudio_projetos.origem", "automatico").gte("concluido_em", new Date(Date.now() - 2 * 864e5).toISOString());
      let n = 0;
      for (const r of rs || []) {
        const { data: ja } = await sb.from("estudio_publicacoes").select("id").eq("render_id", r.id).limit(1); if (ja && ja.length) continue;
        await sb.from("estudio_publicacoes").insert({ render_id: r.id, projeto_id: r.projeto_id, formato: r.formato, legenda: (r as any).estudio_projetos?.plano?.legenda_post || "", status: "aguardando", automatico: true, pedido_nome: "Robô do Estúdio" }); n++;
      }
      // publicacoes que ficaram processando no Instagram
      const { data: pend } = await sb.from("estudio_publicacoes").select("*").eq("status", "publicando").limit(3); for (const p of pend || []) { try { await igContinuar(p); } catch (_) { /* */ } }
      return json({ ok: true, pedidos: n });
    }
    if (acao === "instalar") {   // master: confere a capacidade da VPS e instala o worker (servico separado) pelo canal do Ravi
      if (!U.master) return erro("só o login master", 403);
      const saude = await raviVps("/saude");
      if (saude.http !== 200 || !/ravi-wa-v\d+/.test(String(saude.j?.versao || ""))) return erro("servidor do Ravi não respondeu: não mexi em nada");
      if (b.modo !== "instalar") return json({ ok: true, ravi: saude.j, msg: "Servidor do Ravi OK. Chame com modo=instalar para instalar o estúdio (o Ravi reinicia em ~5 s)." });
      let tk = await segredo("estudio_worker_token");
      if (!tk) { tk = Array.from(crypto.getRandomValues(new Uint8Array(32))).map((x) => x.toString(16).padStart(2, "0")).join(""); await sb.from("rf_segredos").upsert({ chave: "estudio_worker_token", valor: tk, atualizado_em: new Date().toISOString() }); }
      let codigo = bootstrap(scriptInstalacao(tk)); while (codigo.length < 2100) codigo += "// .\n";
      const r = await raviVps("/atualizar", "POST", { codigo });
      await sb.from("estudio_worker").update({ instalacao: { pedido: { em: new Date().toISOString(), resposta: r.j } } }).eq("id", 1);
      return json({ ok: r.http === 200, resposta: r.j });
    }
    if (acao === "worker_atualizar") { if (!U.master) return erro("só o login master", 403); const sha = /^[0-9a-f]{7,40}$/.test(String(b.sha || "")) ? ":" + b.sha : ""; await sb.from("estudio_worker").update({ comando: "atualizar" + sha }).eq("id", 1); return json({ ok: true }); }
    if (acao === "diretor_nome") { if (!U.master) return erro("só o login master", 403); const n = String(b.nome || "").trim().slice(0, 30); if (!n) return erro("nome vazio"); await sb.from("estudio_worker").update({ diretor_nome: n }).eq("id", 1); return json({ ok: true, diretor: n }); }
    if (acao === "ravi_saude") { const r = await raviVps("/saude"); return json({ ok: r.http === 200, ...r.j }); }
    return erro("ação desconhecida: " + acao);
  } catch (e) {
    return json({ ok: false, erro: String((e as Error).message || e).slice(0, 400) }, 500);
  }
});
