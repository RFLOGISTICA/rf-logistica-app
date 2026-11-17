// estudio v20 (17/11/2026, RFL v897) -- PUBLICAR EM VARIAS REDES: publicar_decidir recebe redes (instagram/facebook/linkedin/gmb) e quando (agendar);
//   Instagram agora segue direto pela API; o resto (e o agendado) vai para a fila do robo de publicacao (Metricool) em estudio_publicacoes.redes;
//   links do video assinados por 30 dias em midia; nova acao publicar_cancelar.
// estudio v19 (15/11/2026, RFL v892) -- 🎬 DIRETOR IA: robo que faz o video inteiro (roteiro, voz premium, imagens escolhidas pela IA, animacao Cinema,
//   ritmo, montagem, critica e refaz cenas fracas; limite R$40/video; cron estudio-diretor; tabela estudio_diretor; nunca publica; avisa no WhatsApp).
// estudio v18 (15/11/2026, RFL v891) -- 🎬 CENA COM IA (fal.ai: imagem primeiro, depois anima; custo antes; teto R$150/mes; so master gasta; tabela
//   estudio_ia_uso) + ⚡ RITMO E PASSAGEM (sem silencio, passagem rapida/zoom/deslizar/flash dourado, whoosh, corte na batida, voz forte) + voz premium.
// estudio v17 (15/11/2026, RFL v890) -- 💡 REFERENCIAS: estudar video do Instagram/Facebook/LinkedIn (so para estudo, apaga em 15 dias), raio-x
//   da ideia, "nossa versao" 100% nossa e cena a cena com GRAVACAO NOSSA (+ ✨ Melhorar). Nunca usa imagem/marca de outra empresa.
// estudio v16.1 (14/11/2026): legenda sem palavra repetida na emenda e com rodavia360.com.br junto; escuro so abaixo de 42.
// estudio v16 (14/11/2026, RFL v889) -- 🎙️ MINHA GRAVACAO + 🧐 CRITICA (Renato aprovou as 4 imagens 14/11 19h39: "tem que ser uma area bem
//   didatica, pois eu vou ter que fazer tudo"). Acoes: gravacao_criar, gravacao_estado, gravacao_salvar, gravacao_reanalisar, gravacao_render,
//   critica, critica_corrigir. Worker rf-estudio-v7: job "audio" (tira a fala) e job "editar" (cortes, velocidade, enquadrar, luz, estabilizar,
//   audio, telas, textos, legendas, juntar videos, medidas p/ critica). Publicacao de gravacao exige nota >= 85 na critica.
// estudio v15 (14/11/2026, RFL v888) -- VIDEOS DOS MOTORISTAS (Renato aprovou 14/11: "o Ravi pede aos motoristas videos curtos (estrada,
//   carregamento, entrega) e eles entram direto na biblioteca"). O servidor do WhatsApp (ravi-wa-v12) nao recebe video e o codigo dele
//   nao esta guardado no sistema -- entao o video chega por um LINK PESSOAL (14 dias): pagina enviar-video.html no GitHub Pages da RF,
//   que manda o arquivo DIRETO para o storage (sem compressao do WhatsApp = mais qualidade) e entra em estudio_midias (origem 'motorista',
//   autorizada: todo video mandado a RF e da RF, regra do Renato 13/11). Acoes sem login, so com o token do link: link_info, link_inicio,
//   link_fim. pedir_videos (cron semanal ou master pelo app): o Ravi manda o link a cada motorista ativo -- SEMPRE gravar com o caminhao parado.
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
  { id: "base:demo-frota", tipo: "tela", nome: "Rodavia 360 — painel da frota (demonstração)", arq: "telas/demo-169c-frota.jpg", tags: ["rodavia", "demo", "frota", "computador"], ajuste: "conter",
    destaques: [{ x: 0.02, y: 0.412, w: 0.96, h: 0.135, rotulo: "Resumo da frota na hora" }, { x: 0.01, y: 0.662, w: 0.98, h: 0.18, rotulo: "Cada caminhão com motorista e status" }] },
  { id: "base:demo-dashboard", tipo: "tela", nome: "Rodavia 360 — dashboard do mês (demonstração)", arq: "telas/demo-169c-dashboard.jpg", tags: ["rodavia", "demo", "dashboard", "computador"], ajuste: "conter",
    destaques: [{ x: 0.016, y: 0.327, w: 0.97, h: 0.13, rotulo: "Faturamento, resultado e margem" }, { x: 0.016, y: 0.467, w: 0.32, h: 0.12, rotulo: "Ticket médio e receita por km" }] },
  { id: "base:demo-oleo", tipo: "tela", nome: "Rodavia 360 — óleo e filtros por km (demonstração)", arq: "telas/demo-169c-oleo.jpg", tags: ["rodavia", "demo", "manutencao", "computador"], ajuste: "conter",
    destaques: [{ x: 0.01, y: 0.252, w: 0.51, h: 0.05, rotulo: "Aviso automático pelo km" }, { x: 0.625, y: 0.402, w: 0.1, h: 0.44, rotulo: "Quanto falta para a troca" }] },
  { id: "base:demo-fracionado", tipo: "tela", nome: "Rodavia 360 — fracionado / espaço no baú (demonstração)", arq: "telas/demo-169c-frc_ofertas.jpg", tags: ["rodavia", "demo", "fracionado", "computador"], ajuste: "conter",
    destaques: [{ x: 0.508, y: 0.282, w: 0.45, h: 0.055, rotulo: "Ofertas, cotações e lotação" }, { x: 0.508, y: 0.597, w: 0.48, h: 0.14, rotulo: "Espaço livre estimado no baú" }] },
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
const VOZES: Record<string, { voice: string; nome: string; base: string }> = {   // v11: 13 vozes; "natural" = marin/cedar (as mais humanas da OpenAI)
  natural_f: { voice: "marin", nome: "⭐ Feminina — natural (mais humana)", base: "Voz feminina adulta, natural e calorosa, como uma pessoa real conversando com o cliente." },
  natural_m: { voice: "cedar", nome: "⭐ Masculina — natural (mais humana)", base: "Voz masculina adulta, natural e próxima, como uma pessoa real conversando com o cliente." },
  locutor: { voice: "onyx", nome: "Masculina — locutor", base: "Voz masculina adulta de locutor publicitário brasileiro: firme, confiante e calorosa." },
  jovem: { voice: "ash", nome: "Masculina — jovem e animada", base: "Voz masculina jovem, energética e simpática, de comercial para redes sociais." },
  ravi: { voice: "verse", nome: "Masculina — Ravi (baiana)", base: "Voz masculina adulta, sempre a mesma. Sotaque baiano de Feira de Santana: vogais abertas, 'de' e 'te' sem chiar. Tom calmo e simpático." },
  grave: { voice: "echo", nome: "Masculina — calma e grave", base: "Voz masculina grave, serena e segura, de quem transmite confiança." },
  emotiva: { voice: "ballad", nome: "Masculina — emotiva", base: "Voz masculina expressiva e emotiva, de vídeo institucional que emociona." },
  contador: { voice: "fable", nome: "Masculina — contador de histórias", base: "Voz masculina envolvente, de quem conta uma história com começo, meio e fim." },
  locutora: { voice: "coral", nome: "Feminina — locutora", base: "Voz feminina adulta de locutora publicitária brasileira: clara, confiante e acolhedora." },
  alegre: { voice: "nova", nome: "Feminina — jovem e alegre", base: "Voz feminina jovem, alegre e cheia de energia, de comercial para redes sociais." },
  suave: { voice: "shimmer", nome: "Feminina — suave", base: "Voz feminina suave e elegante, tom institucional e tranquilo." },
  serena: { voice: "sage", nome: "Feminina — serena", base: "Voz feminina serena e gentil, que passa calma e cuidado." },
  neutra: { voice: "alloy", nome: "Neutra — clara e direta", base: "Voz clara, neutra e direta, de vídeo explicativo." },
};
const HUMANO = " Soe como uma pessoa de verdade falando, nunca como robô: respiração natural, entonação que sobe e desce, ênfase nas palavras importantes, pequenas pausas para respirar e sorriso na voz quando a mensagem for positiva. Pronuncie a sigla 'RF' como 'érre éfe'.";
// v11: corrige ortografia/acentuação/pontuação ANTES de narrar (sem mudar o sentido nem trocar palavras)
async function corrigirTexto(texto: string) {
  try {
    const r = await oai("chat/completions", { model: "gpt-5.4-mini", messages: [{ role: "system", content: "Você revisa textos de narração em português do Brasil. Corrija ortografia, acentuação, maiúsculas e pontuação (para a fala soar natural) e também palavras digitadas erradas quando a palavra certa for óbvia pelo contexto (ex.: 'equei RF' → 'equipe RF', 'viajem' → 'viagem'). Não mude o sentido, não troque palavras certas por sinônimos, não acrescente nem corte frases. Mantenha nomes e siglas (ex.: RF, Rodavia 360). Responda APENAS o texto corrigido, sem aspas." }, { role: "user", content: texto }] });
    const j = await r.json(); const t = String(j?.choices?.[0]?.message?.content || "").trim().replace(/^["“]|["”]$/g, "");
    if (!t || t.length > texto.length * 1.5 + 20 || t.length < texto.length * 0.6) return texto;
    return t;
  } catch { return texto; }
}
const SERVICOS = [
  "Transporte rodoviário de cargas com frota própria, base em Feira de Santana/BA, atendendo a Bahia e o Nordeste",
  "Lotação / caminhão dedicado (toco e 3/4 baú)",
  "Carga fracionada: espaço no baú de caminhões que já vão para a rota, com cotação na hora em rflogistica.com.br/fretes",
  "Torre de Controle: acompanhamento dos caminhões em tempo real pelo rastreador",
  "Ravi: assistente virtual da RF no WhatsApp",
  "Rodavia 360: sistema de gestão de frota da RF Sistemas (frota, viagens, abastecimento, manutenção por km, óleo e filtros, dashboard, financeiro, Torre de Controle, fracionado, documentos fiscais, campanhas)",
];
const CONTATO = { site: "rflogistica.com.br", fretes: "rflogistica.com.br/fretes", horario: "segunda a sexta, 8h às 18h" };   // v19.2: Renato (15/11): nos videos NUNCA o numero dele -- so o site

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
    if (c.tipo === "encerramento") x.linhas = [CONTATO.site, CONTATO.fretes];
    return x;
  }).filter((c: any) => c.tipo !== "dados" || c.itens.length);
  if (!cenas.length || cenas[0].tipo !== "abertura") cenas.unshift({ id: "c0ab", tipo: "abertura", titulo: tipo === "demo" ? "Gestão de frota inteligente" : "Transporte e distribuição", transicao: "fade" });
  if (cenas[cenas.length - 1].tipo !== "encerramento") cenas.push({ id: "c9en", tipo: "encerramento", titulo: "Fale com a RF", linhas: [CONTATO.site, CONTATO.fretes], transicao: "fade" });
  const trilha = ["base:trilha-rota", "base:trilha-institucional", "base:trilha-tecnologia"].includes(o.trilha) ? o.trilha : (tipo === "demo" ? "base:trilha-tecnologia" : tipo === "institucional" ? "base:trilha-institucional" : "base:trilha-rota");
  return {
    titulo: String(o.titulo || "Vídeo RF").slice(0, 80), legenda: [String(o.legenda_post || "").slice(0, 1800), String(o.hashtags || "").slice(0, 300)].filter(Boolean).join("\n\n"), avisos,
    plano: { formato, voz: { id: VOZES[voz] ? voz : "locutor", estilo: "" }, trilha: { ref: trilha, volume: 0.30 }, logo: o.logo === "rodavia" || tipo === "demo" ? "rodavia" : "rf", marca: { ativo: true, pos: "sup-dir" }, legendas: true, cenas, diretor: nome },
  };
}

// ---------------------------------------------------------------- narracao + legenda sincronizada
// v19.4: o que a VOZ fala pode ser diferente do que a LEGENDA mostra (site falado por extenso; a voz gaguejava em "rodavia360.com.br")
function falarDe(tok: string) {
  const m = /^(.*?)([.,;:!?…]*)$/.exec(tok) || [tok, tok, ""]; let w = m[1]; const pont = m[2] || "";
  const sites: Record<string, string> = { "rodavia360.com.br": "rodavia trezentos e sessenta ponto com ponto bê érre", "rflogistica.com.br": "érre éfe logística ponto com ponto bê érre", "rflogistica.com.br/fretes": "érre éfe logística ponto com ponto bê érre barra fretes" };
  const k = w.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (sites[k]) return sites[k] + pont;
  if (/\.com(\.br)?(\/|$)/i.test(k)) return k.replace(/\./g, " ponto ").replace(/\//g, " barra ").replace(/\bbr\b/g, "bê érre") + pont;
  return tok;
}
const nchar = (x: string) => String(x || "").toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
// legenda sincronizada: ancora cada palavra falada na palavra que o whisper ouviu (igual), e o que sobra e interpolado entre as ancoras
const NUM: Record<string, string> = { "360": "trezentosesessenta", "br": "beerre", "rf": "erreefe" };
const igual = (a: string, b: string) => { const x = nchar(a), y = nchar(b); return !!x && (x === y || NUM[x] === y || NUM[y] === x); };
function alinharFala(tokens: string[], falas: string[], ws: any[]) {
  if (!ws.length) return [];
  const fw: { w: string; k: number; s?: number; e?: number }[] = []; falas.forEach((f, k) => f.split(/\s+/).filter(Boolean).forEach((w) => fw.push({ w, k })));
  let j = 0;
  for (const f of fw) { for (let d = 0; d < 5 && j + d < ws.length; d++) if (igual(f.w, ws[j + d].w)) { f.s = Number(ws[j + d].s); f.e = Number(ws[j + d].e); j = j + d + 1; break; } }
  const t0 = Number(ws[0].s) || 0, t1 = Number(ws[ws.length - 1].e) || t0 + fw.length * 0.35;
  for (let i = 0; i < fw.length; i++) {
    if (fw[i].s != null) continue;
    let a = i - 1; while (a >= 0 && fw[a].e == null) a--; let b = i + 1; while (b < fw.length && fw[b].s == null) b++;
    const ta = a >= 0 ? fw[a].e! : t0, tb = b < fw.length ? fw[b].s! : t1, n = b - a - 1, pos = i - a - 1, d = Math.max(0, tb - ta) / Math.max(1, n);
    fw[i].s = ta + pos * d; fw[i].e = ta + (pos + 1) * d;
  }
  return tokens.map((w, k) => { const p = fw.filter((x) => x.k === k); return { w, s: +Math.min(...p.map((x) => x.s!)).toFixed(2), e: +Math.max(...p.map((x) => x.e!)).toFixed(2) }; });
}
async function narrarCena(projId: string, c: any, vozId: string, estilo: string) {
  const v = VOZES[vozId] || VOZES.locutor;
  const bruto = String(c.narracao?.texto || "").replace(/[*_#`>|]/g, " ").replace(/\s+/g, " ").trim(); if (!bruto) return c;
  const texto = await corrigirTexto(bruto);
  const instr = v.base + " Português do Brasil. Ritmo de comercial: frases bem articuladas, pausas curtas nas vírgulas e pausa um pouco maior no ponto final." + HUMANO + " " + (estilo || c.narracao?.estilo || "");
  const tokens = texto.split(/\s+/).filter(Boolean), falas = tokens.map(falarDe), fala = falas.join(" ");   // v19.4
  let audio: Uint8Array;
  if (PREMIUM[vozId]) audio = await vozPremium(vozId, fala, estilo || c.narracao?.estilo || "");   // v18: voz premium (ElevenLabs pela fal)
  else { const r = await oai("audio/speech", { model: "gpt-4o-mini-tts", voice: v.voice, input: fala, instructions: instr, response_format: "mp3" }); audio = new Uint8Array(await r.arrayBuffer()); }
  const path = `estudio/narracao/${projId}/${c.id}-${Date.now()}.mp3`;
  const up = await sb.storage.from(BUCKET).upload(path, audio, { contentType: "audio/mpeg", upsert: true }); if (up.error) throw new Error("nao gravou o audio: " + up.error.message);
  // legenda: tempo de cada palavra (whisper-1, word timestamps) -- custo minimo na mesma conta
  let palavras: any[] = [], dur = 0;
  try {
    const fd = new FormData(); fd.append("file", new Blob([audio], { type: "audio/mpeg" }), "n.mp3"); fd.append("model", "whisper-1"); fd.append("language", "pt"); fd.append("response_format", "verbose_json"); fd.append("timestamp_granularities[]", "word");
    const rt = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: "Bearer " + Deno.env.get("OPENAI_API_KEY") }, body: fd });
    const jt = await rt.json(); dur = Number(jt.duration) || 0;
    const ws = (jt.words || []).map((w: any) => ({ w: String(w.word).trim(), s: +Number(w.start).toFixed(2), e: +Number(w.end).toFixed(2) }));
    palavras = alinharFala(tokens, falas, ws);   // v19.4: sincroniza pela posicao das letras (antes dividia por igual quando o numero de palavras nao batia e a legenda atrasava)
  } catch (_) { /* sem legenda sincronizada: divide pelo tempo */ }
  if (!palavras.length) { const orig = texto.split(/\s+/); dur = dur || orig.length / 2.4; let t = 0; const tot = orig.reduce((a, w) => a + w.length + 1, 0); palavras = orig.map((w) => { const d = dur * (w.length + 1) / tot; const p = { w, s: +t.toFixed(2), e: +(t + d).toFixed(2) }; t += d; return p; }); }
  if (!dur && palavras.length) dur = palavras[palavras.length - 1].e + 0.2;
  return { ...c, narracao: { ...(c.narracao || {}), texto, corrigido: texto !== bruto ? bruto : undefined, voz: vozId, path, dur: +dur.toFixed(2), palavras, gerado_em: new Date().toISOString() } };
}

// ---------------------------------------------------------------- 🎙️ MINHA GRAVACAO (v16, 14/11/2026) -- o Renato grava, o Estudio limpa, corrige, poe as telas e a critica da nota
// Fluxo: gravacao_criar (video da biblioteca) -> worker tira o audio -> analisarGravacao (whisper palavra a palavra + diretor: cortes de
// vicios/pausas/repeticoes, frases para corrigir com o porque, telas nos momentos citados) -> o Renato confere (passos 3 e 4) e ajusta (passo 5)
// -> gravacao_render (worker "editar") -> criticar (nota 0-100; publicar so com nota >= NOTA_MIN) -> publicar_pedir (aprovacao do Renato).
// Parte 1: "usar a sugestao" corrige a LEGENDA; regravar com a voz do Renato entra na parte 2 (depois da autorizacao e da contratacao).
const NOTA_MIN = 85;
const CLIENTES_PROIBIDOS = ["suzano", "jdl", "mercante", "mateus", "yamaha", "yamalog", "anjun", "são roque", "sao roque", "jt transportes", "fm transporte", "dexco", "fortlev"];
const TELAS_GRAV: Record<string, { cel: string; pc: string; rotulo: string; temas: string }> = {
  torre: { cel: "base:torre", pc: "base:torre", rotulo: "Torre de Controle", temas: "torre de controle, rastreamento, onde está o caminhão, acompanhar em tempo real, mapa, Ravi avisa" },
  dashboard: { cel: "base:demo-cel-dashboard", pc: "base:demo-dashboard", rotulo: "Dashboard", temas: "dashboard, painel, resultado do mês, números, lucro, faturamento, indicadores" },
  frota: { cel: "base:demo-cel-frota", pc: "base:demo-frota", rotulo: "Frota", temas: "frota, caminhões, veículos, placas, documentos do caminhão, status da frota, viagens" },
  inicio: { cel: "base:demo-cel-inicio", pc: "base:demo-inicio", rotulo: "Rodavia 360", temas: "sistema, aplicativo, tela inicial, tudo em um lugar, setores" },
  manutencao: { cel: "base:demo-oleo", pc: "base:demo-oleo", rotulo: "Manutenção por km", temas: "manutenção, óleo, filtros, preventiva, quilometragem" },
  fracionado: { cel: "base:demo-cel-fracionado", pc: "base:demo-fracionado", rotulo: "Espaço no baú", temas: "carga fracionada, espaço no baú, vender espaço, frete de retorno" },
  carregamento: { cel: "base:carregamento-3d", pc: "base:carregamento-3d", rotulo: "Carregamento 3D", temas: "carregamento, bipagem, montagem do baú, conferência da carga" },
  ecossistema: { cel: "base:ecossistema", pc: "base:ecossistema", rotulo: "Rodavia 360", temas: "ecossistema, robôs, assistente, tudo integrado" },
};
const AJ_PADRAO = { formato: "9:16", zoom: 1, luz: { brilho: 0, contraste: 1, saturacao: 1 }, estabilizar: false, limpar_audio: true, limpar_imagem: false, recorte: null, trechos_fora: [], velocidade: [], textos: [], extras: [], musica: null, legendas: true, logo: true };
const gid = () => Math.random().toString(36).slice(2, 9);

async function transcrever(audio: Uint8Array) {
  const fd = new FormData(); fd.append("file", new Blob([audio], { type: "audio/mpeg" }), "fala.mp3"); fd.append("model", "whisper-1"); fd.append("language", "pt");
  fd.append("response_format", "verbose_json"); fd.append("timestamp_granularities[]", "word"); fd.append("timestamp_granularities[]", "segment");
  fd.append("prompt", "Ééé, hum, tipo assim... Rodavia 360, Torre de Controle, RF Logística, Ravi, frota, caminhão, baú.");   // ajuda a manter os vicios na transcricao
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: "Bearer " + Deno.env.get("OPENAI_API_KEY") }, body: fd });
  if (!r.ok) throw new Error("transcrição: " + r.status + " " + (await r.text()).slice(0, 160));
  const j = await r.json();
  const palavras = (j.words || []).map((w: any) => ({ w: String(w.word).trim(), s: +Number(w.start).toFixed(2), e: +Number(w.end).toFixed(2) })).filter((w: any) => w.w);
  return { palavras, texto: String(j.text || ""), dur: Number(j.duration) || (palavras.length ? palavras[palavras.length - 1].e : 0) };
}

async function analisarGravacao(pid: string) {
  const { data: pj } = await sb.from("estudio_projetos").select("*").eq("id", pid).maybeSingle(); if (!pj) return;
  const plano: any = pj.plano || {}; const g: any = plano.gravacao || {};
  const salvar = async (gg: any, status?: string) => { await sb.from("estudio_projetos").update({ plano: { ...plano, gravacao: gg }, ...(status ? { status } : {}), atualizado_em: new Date().toISOString() }).eq("id", pid); };
  try {
    await salvar({ ...g, estado: "entendendo", etapa: "Transcrevendo a sua fala palavra por palavra…" });
    const { data: blob, error } = await sb.storage.from(BUCKET).download(g.audio_path); if (error || !blob) throw new Error("áudio da gravação não encontrado");
    const tr = await transcrever(new Uint8Array(await blob.arrayBuffer()));
    if (!tr.palavras.length) throw new Error("não ouvi fala na gravação — confira se o microfone estava ligado");
    const P = tr.palavras;
    // pausas longas (> 0,9 s entre palavras): corte deixando 0,25 s de respiro de cada lado
    const cortes: any[] = [];
    for (let i = 1; i < P.length; i++) { const gap = P[i].s - P[i - 1].e; if (gap > 0.9) cortes.push({ id: gid(), ini: +(P[i - 1].e + 0.25).toFixed(2), fim: +(P[i].s - 0.25).toFixed(2), motivo: "pausa", texto: "pausa de " + gap.toFixed(1) + " s", ativo: true }); }
    // vicios que a transcricao manteve
    P.forEach((w: any) => { if (/^(é{2,}|eh+|ã+h*|hum+|hm+|ahn+|é+\.\.\.)[,.]?$/i.test(w.w)) cortes.push({ id: gid(), ini: +(w.s - 0.03).toFixed(2), fim: +(w.e + 0.03).toFixed(2), motivo: "vicio", texto: "“" + w.w + "”", ativo: true }); });
    await salvar({ ...g, estado: "entendendo", etapa: "Procurando repetições, frases para melhorar e as telas do sistema…" });
    const vertical = ["9:16", "4:5"].includes(String(g.ajustes?.formato || pj.formato || "9:16"));
    const lista = P.map((w: any, i: number) => i + ":" + w.w).join(" ");
    const sys = `Você é editor de vídeo e revisor de português do Brasil. O dono de uma transportadora gravou um vídeo falando do sistema Rodavia 360 (gestão de frota) para vender a outros donos de transportadora.
Recebe a transcrição palavra a palavra (índice:palavra). Responda APENAS JSON:
{"titulo":"até 6 palavras","cortes":[{"de":i,"ate":j,"motivo":"repeticao|frase_abandonada|vicio","texto":"o trecho"}],
 "frases":[{"de":i,"ate":j,"original":"exatamente as palavras de i a j","sugestao":"frase corrigida","tipo":"concordancia|desorganizada|diccao|outro","porque":"explicação simples, 1 frase, para leigo"}],
 "telas":[{"idx":i,"tema":"${Object.keys(TELAS_GRAV).join("|")}","modo":"canto|cheia"}]}
REGRAS: 1) cortes = só repetições ("o sistema, o sistema"), começos abandonados e vícios ("tipo assim", "né" repetido). Nunca corte conteúdo.
2) frases = só erros reais de concordância/regência, frase desorganizada ou palavra mal pronunciada (transcrição estranha). A sugestão mantém o sentido e o jeito de falar dele, com o mínimo de mudança. No máximo 8.
3) telas = quando ele fala de um assunto que tem tela (${Object.entries(TELAS_GRAV).map(([k, v]) => k + ": " + v.temas).join(" | ")}). idx = palavra onde o assunto começa. Use "canto" quando ele está explicando e "cheia" quando diz "olha aqui", "veja", "nessa tela". No máximo 1 tela a cada 8 segundos.
4) Índices precisos. Não invente palavras que não estão na transcrição em "original".
5) IGNORE pontuação, vírgulas e maiúsculas (a transcrição não tem pontuação confiável) — isso NÃO é erro. Se não houver erro real, devolva "frases": [].`;
    const r = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: lista }] });
    const jr = await r.json(); let o: any = {}; try { o = JSON.parse(jr.choices[0].message.content); } catch (_) { o = {}; }
    const ok = (i: any) => Number.isInteger(i) && i >= 0 && i < P.length;
    for (const c of (o.cortes || []).slice(0, 30)) if (ok(c.de) && ok(c.ate) && c.ate >= c.de) cortes.push({ id: gid(), ini: +(P[c.de].s - 0.04).toFixed(2), fim: +(P[c.ate].e + 0.04).toFixed(2), motivo: ["repeticao", "frase_abandonada", "vicio"].includes(c.motivo) ? c.motivo : "repeticao", texto: P.slice(c.de, c.ate + 1).map((w: any) => w.w).join(" "), ativo: true });
    const frases = (o.frases || []).slice(0, 8).filter((f: any) => ok(f.de) && ok(f.ate) && f.ate >= f.de && String(f.sugestao || "").trim()).map((f: any) => ({
      id: gid(), de: f.de, ate: f.ate, ini: P[f.de].s, fim: P[f.ate].e, original: P.slice(f.de, f.ate + 1).map((w: any) => w.w).join(" "), sugestao: String(f.sugestao).trim().slice(0, 240),
      tipo: ["concordancia", "desorganizada", "diccao"].includes(f.tipo) ? f.tipo : "outro", porque: String(f.porque || "").slice(0, 240), decisao: null, texto: "" }));
    let ultTela = -99; const telas: any[] = [];
    for (const t of (o.telas || []).sort((a: any, b: any) => a.idx - b.idx)) {
      const T = TELAS_GRAV[String(t.tema)]; if (!T || !ok(t.idx)) continue; const ini = P[t.idx].s; if (ini - ultTela < 8) continue; ultTela = ini;
      telas.push({ id: gid(), ini: +Math.max(0, ini - 0.2).toFixed(2), fim: +Math.min(tr.dur, ini + 4.5).toFixed(2), palavra: P.slice(t.idx, t.idx + 4).map((w: any) => w.w).join(" "), tema: t.tema, ref: vertical ? T.cel : T.pc, rotulo: T.rotulo, modo: t.modo === "cheia" ? "cheia" : "canto", seta: true, ativo: true });
    }
    cortes.sort((a, b) => a.ini - b.ini);
    const ng = { ...g, estado: "pronto", etapa: "", transcricao: { palavras: P, texto: tr.texto, dur: tr.dur }, cortes, frases, telas,
      ajustes: { ...AJ_PADRAO, ...(g.ajustes || {}), recorte: g.ajustes?.recorte || { ini: +Math.max(0, P[0].s - 0.35).toFixed(2), fim: +Math.min(tr.dur + 1, P[P.length - 1].e + 0.6).toFixed(2) } },
      passo: Math.max(3, Number(g.passo) || 3), analisado_em: new Date().toISOString() };
    await sb.from("estudio_projetos").update({ titulo: pj.titulo && pj.titulo !== "Minha gravação" ? pj.titulo : String(o.titulo || "Minha gravação").slice(0, 70), plano: { ...plano, gravacao: ng }, status: "rascunho", atualizado_em: new Date().toISOString() }).eq("id", pid);
  } catch (e) {
    await salvar({ ...g, estado: "erro", etapa: "", erro: String((e as Error).message || e).slice(0, 300) }, "erro");
  }
}

// trechos mantidos do original (recorte - cortes ativos - frases cortadas - trechos fora), com a velocidade de cada pedaco
function trechosMantidos(g: any, dur: number) {
  const aj = g.ajustes || {}; const rc = aj.recorte || {};
  let ini = Math.max(0, Number(rc.ini) || 0), fim = Math.min(dur || 1e9, Number(rc.fim) || dur || 1e9);
  const fora: any[] = [...(g.cortes || []).filter((c: any) => c.ativo !== false), ...(g.frases || []).filter((f: any) => f.decisao === "cortar"), ...(aj.trechos_fora || [])]
    .map((x: any) => [Number(x.ini), Number(x.fim)]).filter((x) => x[1] > x[0]).sort((a, b) => a[0] - b[0]);
  let segs: any[] = [{ ini, fim }];
  for (const [a, b] of fora) { const nv: any[] = []; for (const s of segs) { if (b <= s.ini || a >= s.fim) { nv.push(s); continue; } if (a > s.ini) nv.push({ ini: s.ini, fim: a }); if (b < s.fim) nv.push({ ini: b, fim: s.fim }); } segs = nv; }
  // velocidade por trecho
  const vels = (aj.velocidade || []).map((v: any) => ({ ini: Number(v.ini), fim: Number(v.fim), f: Math.max(0.5, Math.min(2, Number(v.fator) || 1)) })).filter((v: any) => v.fim > v.ini);
  const out: any[] = [];
  for (const s of segs) {
    let pts = [s.ini, s.fim]; for (const v of vels) { if (v.ini > s.ini && v.ini < s.fim) pts.push(v.ini); if (v.fim > s.ini && v.fim < s.fim) pts.push(v.fim); }
    pts = Array.from(new Set(pts)).sort((a, b) => a - b);
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], m = (a + b) / 2; const v = vels.find((x: any) => m >= x.ini && m <= x.fim); if (b - a >= 0.12) out.push({ ini: +a.toFixed(3), fim: +b.toFixed(3), vel: v ? v.f : 1 }); }
  }
  return out;
}
// legenda: palavras originais; nas frases com "usar a sugestao" (ou texto proprio) entram as palavras corrigidas no mesmo intervalo
function palavrasLegenda(g: any) {
  const P: any[] = (g.transcricao?.palavras || []).map((w: any) => ({ ...w }));
  const trocas = (g.frases || []).filter((f: any) => f.decisao === "sugestao" || (f.decisao === "texto" && String(f.texto || "").trim()));
  let out = P.filter((w) => !/^(é{2,}|eh+|ã+h*|hum+|hm+|ahn+)[,.]?$/i.test(w.w));
  for (const f of trocas) {
    const novo = String(f.decisao === "texto" ? f.texto : f.sugestao).split(/\s+/).filter(Boolean); const a = Number(f.ini), b = Number(f.fim); const tot = novo.reduce((s, w) => s + w.length + 1, 0) || 1; let t = a;
    out = out.filter((w) => w.s < a - 0.01 || w.s > b + 0.01);
    novo.forEach((w) => { const d = (b - a) * (w.length + 1) / tot; out.push({ w, s: +t.toFixed(2), e: +(t + d * 0.92).toFixed(2) }); t += d; });
  }
  out.sort((x, y) => x.s - y.s);
  // limpeza: palavra repetida na emenda da correcao ("a a gestao") e endereco do site falado em pedacos ("rodavia360 com br")
  const lim: any[] = [];
  for (const w of out) { const ant = lim[lim.length - 1]; if (ant && ant.w.toLowerCase().replace(/[.,!?]/g, "") === w.w.toLowerCase().replace(/[.,!?]/g, "") && w.s - ant.e < 0.6 && w.w.length <= 4) { ant.e = w.e; continue; } lim.push({ ...w }); }
  for (let i = 0; i < lim.length - 2; i++) {
    if (/^rodavia/i.test(lim[i].w) && /^(\.?com|ponto)$/i.test(lim[i + 1].w.replace(/[.,]$/, ""))) {
      let j = i + 1, fimw = lim[i].e; while (j < lim.length && j <= i + 4 && /^(\.?com|ponto|\.?br|com\.br)[.,!?]?$/i.test(lim[j].w)) { fimw = lim[j].e; j++; }
      lim.splice(i, j - i, { w: "rodavia360.com.br", s: lim[i].s, e: fimw });
    }
  }
  return lim;
}
// receita do worker "editar" (links assinados na hora em que o worker pega o trabalho)
async function receitaGravacao(pj: any) {
  const g: any = pj.plano?.gravacao || {}; const aj = { ...AJ_PADRAO, ...(g.ajustes || {}) };
  const fonte = await refUrl(g.midia_id); if (!fonte) throw new Error("vídeo gravado não encontrado na biblioteca");
  const dur = Number(g.transcricao?.dur) || Number(g.dur) || 0;
  const telas: any[] = [];
  for (const t of (g.telas || []).filter((x: any) => x.ativo !== false)) { const u = await refUrl(t.ref); if (u) telas.push({ ini: t.ini, fim: t.fim, url: u.url, chave: u.chave, modo: t.modo, seta: t.seta !== false, rotulo: t.rotulo || "" }); }
  const extras: any[] = [];
  for (const x of (aj.extras || []).slice(0, 6)) { const u = await refUrl(x.midia_id); if (u && u.tipo === "video") extras.push({ url: u.url, chave: u.chave, ini: x.ini, fim: x.fim, posicao: x.posicao === "antes" ? "antes" : "depois" }); }
  const mus = aj.musica && aj.musica.ref ? await refUrl(aj.musica.ref) : null;
  const logo = aj.logo !== false ? await refUrl("base:logo-rodavia") : null;
  return { tipo: "editar", projeto_id: pj.id, fonte, formato: aj.formato === "original" ? "original" : (["9:16", "1:1", "16:9", "4:5"].includes(aj.formato) ? aj.formato : "9:16"),
    manter: trechosMantidos(g, dur || 1e9), zoom: aj.zoom, luz: aj.luz, estabilizar: !!aj.estabilizar, limpar_audio: aj.limpar_audio !== false, limpar_imagem: !!aj.limpar_imagem,
    telas, textos: (aj.textos || []).slice(0, 15), legendas: aj.legendas !== false, palavras: aj.legendas !== false ? palavrasLegenda(g) : [], extras,
    logo: logo ? { url: logo.url, chave: logo.chave } : null, musica: mus ? { url: mus.url, chave: mus.chave, volume: Number(aj.musica.volume) || 0.12 } : null };
}

// 🧐 critica: assiste como um comprador (folha de quadros + texto falado + medidas de luz e som) e da nota com o porque e o que fazer
async function criticar(pid: string, renderId?: string) {
  const { data: pj } = await sb.from("estudio_projetos").select("*").eq("id", pid).maybeSingle(); if (!pj) throw new Error("projeto não encontrado");
  const plano: any = pj.plano || {}; const g: any = plano.gravacao || {}; const aj = { ...AJ_PADRAO, ...(g.ajustes || {}) };
  let q = sb.from("estudio_renders").select("id,status,analise,duracao,formato").eq("projeto_id", pid).eq("status", "pronto").order("concluido_em", { ascending: false }).limit(1);
  if (renderId) q = sb.from("estudio_renders").select("id,status,analise,duracao,formato").eq("id", renderId).limit(1);
  const { data: rs } = await q; const rd: any = rs && rs[0]; if (!rd) throw new Error("monte o vídeo antes da crítica");
  const an: any = rd.analise || {}; const D = Number(an.dur || rd.duracao) || 0;
  const pal = palavrasLegenda(g); const texto = pal.map((w: any) => w.w).join(" ");
  const textosTela = (aj.textos || []).map((t: any) => t.texto).join(" | ");
  // medidas objetivas
  const luz: number[] = an.luz_por_seg || [], som: number[] = an.som_por_seg || [];
  const escuros = luz.map((y, i) => [i, y]).filter((x) => x[1] < 42).map((x) => x[0]);
  const baixos = som.map((v, i) => [i, v]).filter((x) => x[1] < -32).map((x) => x[0]);
  const faixas = (arr: number[]) => { const o: string[] = []; let a = -1, p = -1; for (const s of arr) { if (s !== p + 1) { if (a >= 0) o.push(a === p ? fmt(a) : fmt(a) + " a " + fmt(p)); a = s; } p = s; } if (a >= 0) o.push(a === p ? fmt(a) : fmt(a) + " a " + fmt(p)); return o.slice(0, 3).join(", "); };
  function fmt(s: number) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  const tudo = (texto + " " + textosTela).toLowerCase();
  const placas = (texto + " " + textosTela).match(/\b[A-Z]{3}-?\d[A-Z0-9]\d{2}\b/g) || [];
  const clientes = CLIENTES_PROIBIDOS.filter((c) => tudo.includes(c));
  const fim = pal.filter((w: any) => w.s > D * 0.75).map((w: any) => w.w).join(" ").toLowerCase() + " " + (aj.textos || []).filter((t: any) => t.no_fim).map((t: any) => t.texto).join(" ").toLowerCase();
  const temCTA = /rodavia|whatsapp|zap|site|link|chama|fale com|entre em contato|ponto com/.test(fim);
  const itens: any[] = [];
  const nLuz = escuros.length === 0 ? 10 : escuros.length <= 2 ? 8 : escuros.length <= 6 ? 6 : 4;
  const nSom = baixos.length <= 1 ? 10 : baixos.length <= 4 ? 7 : 5;
  const nImg = Math.min(nLuz, nSom);
  itens.push({ chave: "imagem_som", nome: "Imagem e som", nota: nImg, motivo: (escuros.length ? "Trecho escuro em " + faixas(escuros) + ". " : "") + (baixos.length ? "Som baixo em " + faixas(baixos) + ". " : "") + (!escuros.length && !baixos.length ? "Luz e som bons." : ""),
    auto: nImg < 9, acao: nImg < 9 ? "Eu clareio a imagem e limpo/igualo o som sozinho." : "" });
  const nSeg = placas.length || clientes.length ? 0 : 10;
  itens.push({ chave: "seguranca", nome: "Segurança", nota: nSeg, motivo: nSeg === 10 ? "Nenhuma placa, cliente ou número real." : "Aparece " + [...placas.map((p) => "placa " + p), ...clientes.map((c) => "o cliente “" + c + "”")].join(", ") + ".",
    auto: false, acao: nSeg === 10 ? "" : "Corte esse trecho (passo 5 › Recortar) ou regrave sem citar." });
  itens.push({ chave: "chamada", nome: "Chamada final", nota: temCTA ? 10 : 5, motivo: temCTA ? "Termina chamando para o site/WhatsApp." : "O vídeo não termina dizendo o que fazer (site/WhatsApp).",
    auto: !temCTA, acao: temCTA ? "" : "Eu coloco “rodavia360.com.br” na tela nos últimos 4 segundos." });
  const vertical = rd.formato === "9:16" || rd.formato === "4:5";
  const nFmt = D <= 60 ? 10 : D <= 90 ? 8 : 6;
  itens.push({ chave: "formato", nome: "Tamanho e formato", nota: vertical ? nFmt : Math.min(nFmt, 8), motivo: "Duração " + Math.round(D) + " s" + (D > 60 ? " — para Reels o ideal é até 60 s." : ".") + (vertical ? "" : " Para Reels/Status use o formato em pé (9:16)."),
    auto: false, acao: D > 60 ? "Corte as partes menos importantes no passo 5 (Recortar) até ficar perto de 60 s." : "" });
  // julgamento (IA): gancho, dor/beneficio, portugues
  let ia: any = {};
  try {
    const sys = `Você é um crítico exigente de vídeos de venda para redes sociais. O vídeo vende o sistema Rodavia 360 (gestão de frota) para DONOS DE TRANSPORTADORA. Avalie como um comprador ocupado.
Responda APENAS JSON: {"gancho":{"nota":0-10,"motivo":"","acao":""},"dor_beneficio":{"nota":0-10,"motivo":"","acao":""},"portugues":{"nota":0-10,"motivo":"","acao":""},"visual":{"nota":0-10,"motivo":"","acao":""},"resumo":"1 frase"}
- gancho: os 3 primeiros segundos fazem o dono de transportadora parar de rolar? "Bom dia, meu nome é" = nota baixa. Na "acao", dê a frase de abertura sugerida.
- dor_beneficio: fala de um problema real dele (caminhão parado, excesso de velocidade, custo sem controle, cliente cobrando entrega) e do ganho?
- portugues: erros que sobraram no texto falado (legenda).
- visual: pela folha de quadros, enquadramento, rosto, telas, legibilidade.
Seja direto e simples; "acao" sempre algo que ele consegue fazer. Nunca invente números.`;
    const conteudo: any[] = [{ type: "text", text: "TEXTO FALADO (legenda): " + texto.slice(0, 4000) + "\nTEXTOS NA TELA: " + (textosTela || "(nenhum)") + "\nDURAÇÃO: " + Math.round(D) + " s" }];
    if (an.folha_b64) conteudo.push({ type: "image_url", image_url: { url: "data:image/jpeg;base64," + an.folha_b64 } });
    let r: Response;
    try { r = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: conteudo }] }); }
    catch (_) { r = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: conteudo[0].text }] }); }
    const j = await r.json(); ia = JSON.parse(j.choices[0].message.content);
  } catch (_) { ia = {}; }
  const n10 = (x: any, d: number) => Math.max(0, Math.min(10, Math.round(Number(x) || d)));
  const it = (k: string, nome: string, d: number) => ({ chave: k, nome, nota: n10(ia[k]?.nota, d), motivo: String(ia[k]?.motivo || "").slice(0, 300), auto: false, acao: String(ia[k]?.acao || "").slice(0, 300) });
  itens.unshift(it("gancho", "Gancho (3 primeiros segundos)", 6), it("dor_beneficio", "Dor e benefício", 6), it("portugues", "Português e fala", 7));
  itens.push(it("visual", "Visual (enquadramento e telas)", 7));
  const PESO: Record<string, number> = { gancho: 2, dor_beneficio: 2, portugues: 1.5, imagem_som: 1.5, seguranca: 1, chamada: 1, formato: 1, visual: 1 };
  let soma = 0, pes = 0; itens.forEach((x) => { const p = PESO[x.chave] || 1; soma += x.nota * p; pes += p; });
  let nota = Math.round(soma / pes * 10); if (nSeg === 0) nota = Math.min(nota, 50);   // placa/cliente real nunca passa
  const critica = { nota, minimo: NOTA_MIN, aprovado: nota >= NOTA_MIN, itens, resumo: String(ia.resumo || "").slice(0, 300), render_id: rd.id, em: new Date().toISOString() };
  const { data: atual } = await sb.from("estudio_projetos").select("plano").eq("id", pid).maybeSingle();
  const pl: any = atual?.plano || plano; await sb.from("estudio_projetos").update({ plano: { ...pl, gravacao: { ...(pl.gravacao || {}), critica, passo: Math.max(6, Number(pl.gravacao?.passo) || 6) } }, atualizado_em: new Date().toISOString() }).eq("id", pid);
  return critica;
}

// ---------------------------------------------------------------- v17: 💡 REFERENCIAS (Renato aprovou a imagem 15/11 15h47)
// O video de fora e SO PARA ESTUDO: fica em estudio/referencias/<id>/ (nunca entra em estudio_midias nem na montagem) e e apagado em 15 dias.
// Da referencia aproveitamos a IDEIA, a ESTRUTURA e as CENAS. A "nossa versao" e texto 100% nosso; cada cena e preenchida com GRAVACAO NOSSA.
const REF_DIAS = 15;
const REF_PLAT = (u: string) => /instagram\.com/i.test(u) ? "Instagram" : /(facebook\.com|fb\.watch)/i.test(u) ? "Facebook" : /linkedin\.com/i.test(u) ? "LinkedIn" : "";
async function salvarRef(pid: string, mudar: (r: any) => any, extra: any = {}) {
  const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", pid).maybeSingle(); const pl: any = pj?.plano || {};
  const r = mudar({ ...(pl.ref || {}) });
  await sb.from("estudio_projetos").update({ plano: { ...pl, ref: r }, atualizado_em: new Date().toISOString(), ...extra }).eq("id", pid);
  return r;
}
async function analisarReferencia(pid: string) {
  try {
    const { data: pj } = await sb.from("estudio_projetos").select("*").eq("id", pid).maybeSingle(); if (!pj) return;
    const r: any = pj.plano?.ref || {};
    await salvarRef(pid, (x) => ({ ...x, estado: "analisando", etapa: "Ouvindo a fala e olhando as cenas…" }));
    let tr: any = { palavras: [], texto: "", dur: Number(r.dur) || 0 };
    if (r.audio_path) { try { const { data: bl } = await sb.storage.from(BUCKET).download(r.audio_path); if (bl) tr = await transcrever(new Uint8Array(await bl.arrayBuffer())); } catch (_) { /* video sem fala: segue so com as imagens */ } }
    const D = Number(r.dur) || tr.dur || 0, nq = Number(r.quadros_n) || 16;
    const tempos = Array.from({ length: nq }, (_, i) => +((i + 0.5) * D / nq).toFixed(1));
    // fala em blocos de ~3 s com tempo (para a IA saber o que e dito em cada cena)
    const blocos: string[] = []; let bl: any[] = [];
    for (const w of tr.palavras) { bl.push(w); if (w.e - bl[0].s >= 3 || /[.!?]$/.test(w.w)) { blocos.push(`[${bl[0].s.toFixed(1)}-${w.e.toFixed(1)}] ` + bl.map((x) => x.w).join(" ")); bl = []; } }
    if (bl.length) blocos.push(`[${bl[0].s.toFixed(1)}-${bl[bl.length - 1].e.toFixed(1)}] ` + bl.map((x: any) => x.w).join(" "));
    const sys = `Você é diretor de criação e estuda vídeos de referência de OUTRAS empresas para a RF Logística criar vídeos PRÓPRIOS do sistema Rodavia 360 (gestão de frota para donos de transportadora) e da RF (transporte e distribuição na Bahia e Nordeste).
Você recebe: a duração, a fala com tempos e uma folha com ${nq} quadros do vídeo (da esquerda para a direita, de cima para baixo), tirados nos segundos ${tempos.join(", ")}.
Responda APENAS JSON:
{"titulo":"até 6 palavras que descrevem a IDEIA (sem nome de empresa)","tags":["até 4 rótulos curtos: gancho forte, antes x depois, depoimento, números na tela, tutorial, bastidores..."],
 "nota":0-10 (quanto prende a atenção),
 "gancho":"o que acontece nos 3 primeiros segundos e por que funciona",
 "cenas":[{"ini":s,"fim":s,"descricao":"o que se VÊ na cena (enquadramento, ação, movimento de câmera) sem citar marca/nome","fala":"o que é dito (resumo)","funcao":"gancho|dor|virada|prova|chamada|outro"}],
 "por_que_prende":["3 a 5 itens curtos: ritmo de cortes, legenda, fala em 2ª pessoa..."],
 "nossa":{"gancho":"frase de abertura NOSSA","dor":"","virada":"","chamada":"","cenas":[{"funcao":"igual à cena da referência","titulo":"texto curto para a tela (até 6 palavras)","narracao":"o que NÓS falamos nessa cena (1 a 2 frases)","gravar":"o que gravar com a NOSSA equipe para essa cena (caminhão da RF, tela do Rodavia 360, motorista, escritório...)"}]}}
REGRAS DURAS: 1) cenas cobrem o vídeo inteiro, em ordem, de 3 a 10 cenas, com ini/fim em segundos dentro de 0..${Math.round(D)}.
2) A "nossa" versão tem UMA cena para cada cena da referência, na mesma ordem e com a mesma função — mas TEXTO 100% NOSSO: nunca copie frases da referência, nunca cite o nome, a marca, o slogan, o produto ou o perfil da outra empresa.
3) Benefícios do Rodavia 360 que pode usar: viagens com custo e lucro por viagem, Torre de Controle com rastreamento, controle de diesel e KM, manutenção por caminhão, documentos (CT-e, MDF-e), robô Ravi no WhatsApp, app do motorista. Nunca invente números, clientes ou placas. Chamada final sempre "rodavia360.com.br" (ou WhatsApp (75) 99971-7578 para a RF).
4) Português do Brasil simples, direto, para dono de transportadora.`;
    const conteudo: any[] = [{ type: "text", text: `DURAÇÃO: ${D.toFixed(1)} s\nPLATAFORMA: ${r.plataforma || "?"}\nFALA:\n${blocos.join("\n").slice(0, 6000) || "(sem fala — vídeo só com música/texto na tela)"}` }];
    if (r.folha_path) { try { conteudo.push({ type: "image_url", image_url: { url: await assinar(r.folha_path, 900) } }); } catch (_) { /* */ } }
    const resp = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: conteudo }] });
    const j = await resp.json(); let o: any = {}; try { o = JSON.parse(j.choices[0].message.content); } catch (_) { throw new Error("a IA não devolveu o raio-x — tente 🔄 Refazer"); }
    const s = (x: any, n: number) => String(x || "").trim().slice(0, n);
    let cenas = (Array.isArray(o.cenas) ? o.cenas : []).map((c: any) => ({ id: gid(), ini: Math.max(0, Math.min(D, Number(c.ini) || 0)), fim: Math.max(0, Math.min(D, Number(c.fim) || 0)), descricao: s(c.descricao, 300), fala: s(c.fala, 300), funcao: s(c.funcao, 20) || "outro" }))
      .filter((c: any) => c.fim > c.ini + 0.3).sort((a: any, b: any) => a.ini - b.ini).slice(0, 10);
    if (!cenas.length) cenas = [{ id: gid(), ini: 0, fim: D, descricao: "vídeo inteiro", fala: tr.texto.slice(0, 300), funcao: "outro" }];
    const no: any = o.nossa || {}; const nc = Array.isArray(no.cenas) ? no.cenas : [];
    const nossa = { gancho: s(no.gancho, 240), dor: s(no.dor, 300), virada: s(no.virada, 300), chamada: s(no.chamada, 200),
      cenas: cenas.map((c: any, i: number) => ({ cena_id: c.id, funcao: c.funcao, titulo: s(nc[i]?.titulo, 60), narracao: s(nc[i]?.narracao, 400), gravar: s(nc[i]?.gravar, 240) })) };
    const raiox = { titulo: s(o.titulo, 60) || "Referência", tags: (Array.isArray(o.tags) ? o.tags : []).slice(0, 4).map((t: any) => s(t, 24)), nota: Math.max(0, Math.min(10, Number(o.nota) || 0)),
      gancho: s(o.gancho, 300), cenas, por_que_prende: (Array.isArray(o.por_que_prende) ? o.por_que_prende : []).slice(0, 5).map((t: any) => s(t, 140)) };
    await salvarRef(pid, (x) => ({ ...x, estado: "pronto", etapa: "", erro: null, transcricao: { texto: tr.texto.slice(0, 8000), blocos }, raiox, nossa, analisado_em: new Date().toISOString() }), { titulo: "Ref: " + raiox.titulo, status: "pronto" });
  } catch (e) {
    await salvarRef(pid, (x) => ({ ...x, estado: "erro", etapa: "", erro: String((e as Error).message || e).slice(0, 300) }), { status: "erro" });
  }
}
// apaga o que venceu (o video de fora, o audio e a folha); o raio-x e o link ficam
async function limparReferencias() {
  const { data: L } = await sb.from("estudio_projetos").select("id,plano").eq("tipo", "referencia").limit(300);
  for (const p of L || []) {
    const r: any = (p as any).plano?.ref || {}; if (r.apagado_em || !r.apaga_em || new Date(r.apaga_em).getTime() > Date.now()) continue;
    const arqs = [r.video_path, r.audio_path, r.folha_path, r.capa_path, r.upload_path].filter(Boolean);
    if (arqs.length) await sb.storage.from(BUCKET).remove(arqs);
    await salvarRef(p.id, (x) => ({ ...x, video_path: null, audio_path: null, folha_path: null, capa_path: null, upload_path: null, apagado_em: new Date().toISOString() }));
  }
}
// "Criar video com este roteiro": projeto NOSSO com a estrutura da referencia (cada cena = cartao com o nosso texto, ate trocar pela nossa gravacao)
function planoNosso(r: any) {
  const rx = r.raiox || {}, no = r.nossa || {}; const cenas: any[] = [];
  cenas.push({ id: "c0ab", tipo: "abertura", titulo: String(no.gancho || "Gestão de frota inteligente").slice(0, 70), transicao: "fade", dur: 2.6 });
  (rx.cenas || []).forEach((c: any, i: number) => {
    const n = (no.cenas || [])[i] || {}; const d = Math.max(2, Math.min(15, +(c.fim - c.ini).toFixed(1)));
    cenas.push({ id: "r" + i + gid().slice(0, 4), ref_cena: c.id, tipo: "cartao", selo: String(c.funcao || "").toUpperCase().slice(0, 28), titulo: String(n.titulo || "").slice(0, 70), subtitulo: String(n.gravar ? "🎥 " + n.gravar : "").slice(0, 120),
      transicao: "corte", dur: d, ...(n.narracao ? { narracao: { texto: String(n.narracao).slice(0, 500) } } : {}) });
  });
  cenas.push({ id: "c9en", tipo: "encerramento", titulo: "Rodavia 360", linhas: ["rodavia360.com.br"], transicao: "fade" });
  return { formato: "9:16", voz: { id: "natural_m", estilo: "" }, trilha: { ref: "base:trilha-tecnologia", volume: 0.25 }, logo: "rodavia", marca: { ativo: true, pos: "sup-dir" }, legendas: true, cenas, referencia: true };
}

// ---------------------------------------------------------------- receita para o worker (links assinados na hora)
async function refUrl(ref: string) {
  if (!ref) return null;
  if (ref.startsWith("base:")) { const m = BASE.find((x) => x.id === ref); return m ? { url: GH + m.arq, chave: "base/" + m.arq, tipo: m.tipo === "tela" ? "imagem" : m.tipo } : null; }
  const { data: m } = await sb.from("estudio_midias").select("*").eq("id", ref).maybeSingle(); if (!m) return null;
  return { url: m.path ? await assinar(m.path) : m.url, chave: m.path || m.url, tipo: m.tipo === "tela" ? "imagem" : m.tipo };
}
// legenda: sempre o TEXTO do roteiro (nao o que a transcricao escreveu, ex.: "sete" e nao "7"), com o tempo das palavras ouvidas
function alinhar(texto: string, ws: any[]) {
  const orig = String(texto || "").split(/\s+/).filter(Boolean); if (!Array.isArray(ws) || !ws.length || !orig.length) return ws || [];
  if (ws.length === orig.length) return ws.map((w: any, i: number) => ({ ...w, w: orig[i] }));
  const ini = Number(ws[0].s) || 0, fim = Number(ws[ws.length - 1].e) || ini + orig.length * 0.4;
  const tot = orig.reduce((a, w) => a + w.length + 1, 0); let t = ini;
  return orig.map((w) => { const d = (fim - ini) * (w.length + 1) / tot; const r = { w, s: +t.toFixed(2), e: +(t + d * 0.92).toFixed(2) }; t += d; return r; });
}
async function coords(nome: string) { const { data } = await sb.rpc("frc_coords", { p: nome }); const c = Array.isArray(data) ? data[0] : null; return c ? { lat: c.lat, lng: c.lng } : null; }
async function receita(plano: any, formato: string) {
  const logo = plano.logo === "rodavia" ? "logos/logo-rodavia360.png" : "logos/logo-rf.png";
  const rec: any = { formato, ritmo: plano.ritmo || null, legendas: plano.legendas !== false, logo_url: GH + logo, logo_chave: "base/" + logo, mapa_url: GH + "mapa-ne.json", velocidade_voz: Number(plano.voz?.velocidade) || 1, volume_voz: 1, cenas: [] };
  if (plano.marca?.ativo !== false) { const mk = plano.logo === "rodavia" ? "logos/logo-rodavia360.png" : "logos/escudo-rf.png"; rec.marca = { url: GH + mk, chave: "base/" + mk, pos: plano.marca?.pos || "sup-dir" }; }
  if (plano.trilha?.ref) { const t = await refUrl(plano.trilha.ref); if (t) rec.trilha = { url: t.url, chave: t.chave, volume: plano.trilha.volume ?? 0.3 }; }
  for (const c of plano.cenas || []) {
    const x: any = { ...c }; delete x.id;
    if (c.midia?.ref) { const m = await refUrl(c.midia.ref); if (!m) throw new Error("mídia não encontrada na cena " + (c.titulo || c.tipo)); x.midia = { url: m.url, chave: m.chave, tipo: m.tipo }; }
    const bt = c.midia?.ref ? BASE.find((m) => m.id === c.midia.ref && m.destaques) : null;   // telas da biblioteca: destaques sempre na posicao certa da tela
    if (bt && c.tipo === "tela") { x.destaques = bt.destaques.map((d: any, j: number) => ({ ...d, ini: (c.destaques && c.destaques[j] && c.destaques[j].ini) || 1.2 + j * 2.2 })); x.ajuste = bt.ajuste || x.ajuste; }
    if (c.narracao?.path) x.narracao = { url: await assinar(c.narracao.path), chave: c.narracao.path, dur: c.narracao.dur, palavras: alinhar(c.narracao.texto, c.narracao.palavras), velocidade: c.narracao.velocidade || plano.voz?.velocidade || 1 };
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


// ---------------------------------------------------------------- v18 (15/11/2026, RFL v891): 🎬 CENA COM IA (fal.ai) + ⚡ RITMO E PASSAGEM
// Renato assinou a fal.ai (pago por uso; chave so no cofre: secret FAL_KEY) -- "os videos serao feitos dentro do Studio e com qualidade".
// Regra: o custo aparece ANTES de cada acao paga; nada e cobrado sem o toque dele; teto de R$ 150 por mes (estudio_ia_uso). So o login master gasta.
// Primeiro a IMAGEM da cena (barato, para aprovar) e so depois anima. Personagem sempre igual: Ravi (foto de referencia da biblioteca).
const IA_TETO = 150;
const IA_IOF = 1.035;   // compra internacional no cartao
const IA_IMG = { modelo: "fal-ai/nano-banana-2/edit", usd: 0.08 };   // por imagem (1K)
const IA_ANIM: Record<string, { nome: string; modelo: string; usd_s: number; res?: string; fixo?: boolean }> = {
  rascunho: { nome: "Rascunho · 512p", modelo: "fal-ai/minimax/hailuo-02-fast/image-to-video", usd_s: 0.017, fixo: true },
  bom: { nome: "Bom · 768p", modelo: "minimax/h3-max/image-to-video", usd_s: 0.08, res: "768P" },
  cinema: { nome: "🎬 Cinema · 1080p", modelo: "minimax/h3-max/image-to-video", usd_s: 0.16, res: "1080P" },
};
const IA_VOZ_USD_1000 = 0.10;   // ElevenLabs multilingual v2 na fal: US$ 0,10 por 1.000 letras
const PREMIUM: Record<string, { voice: string; nome: string }> = {
  premium_locutor: { voice: "Brian", nome: "⭐ Premium — locutor (mais humano) · pago" },
  premium_jovem: { voice: "Liam", nome: "⭐ Premium — jovem e animado · pago" },
  premium_feminina: { voice: "Sarah", nome: "⭐ Premium — feminina · pago" },
};
const FORCA: Record<string, string> = {
  calma: "Tom calmo, seguro e acolhedor, sem pressa.",
  firme: "Tom firme e confiante, articulação forte, frases curtas com peso.",
  energica: "Energia alta de comercial de TV: entusiasmo, voz projetada e vibrante, ênfase forte nas palavras-chave, ritmo acelerado, sorriso na voz.",
  vendedor: "Tom de vendedor persuasivo: próximo, convincente, chamada para ação com urgência no final.",
};
let _cot: { v: number; em: number } | null = null;
async function cotacao() {
  if (_cot && Date.now() - _cot.em < 6 * 3600e3) return _cot.v;
  let v = 5.6;
  try { const r = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL"); const j = await r.json(); const x = Number(j?.USDBRL?.ask || j?.USDBRL?.bid); if (x > 3 && x < 12) v = x; } catch (_) { /* tenta a outra */ }
  if (v === 5.6) { try { const r = await fetch("https://open.er-api.com/v6/latest/USD"); const j = await r.json(); const x = Number(j?.rates?.BRL); if (x > 3 && x < 12) v = x; } catch (_) { /* usa 5,60 */ } }
  _cot = { v, em: Date.now() }; return v;
}
const brl = async (usd: number) => +(usd * (await cotacao()) * IA_IOF).toFixed(2);
async function iaGastoMes() {
  const ini = new Date(); const d = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth(), 1, 3));   // 1o dia do mes, 00h na Bahia
  const { data } = await sb.from("estudio_ia_uso").select("custo_brl,status").gte("criado_em", d.toISOString());
  return +((data || []).filter((x: any) => x.status !== "erro").reduce((a: number, x: any) => a + Number(x.custo_brl || 0), 0)).toFixed(2);
}
async function iaPodeGastar(brlNovo: number) {
  const g = await iaGastoMes();
  if (g + brlNovo > IA_TETO) throw new Error(`passaria do teto do mês: já gastou R$ ${g.toFixed(2).replace(".", ",")} de R$ ${IA_TETO},00 e esta ação custa ≈ R$ ${brlNovo.toFixed(2).replace(".", ",")}`);
  return g;
}
function falKey() { const k = Deno.env.get("FAL_KEY"); if (!k) throw new Error("a chave da fal.ai não está no cofre (FAL_KEY)"); return k; }
async function falRun(modelo: string, corpo: any) {
  const r = await fetch("https://fal.run/" + modelo, { method: "POST", headers: { Authorization: "Key " + falKey(), "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const t = await r.text(); let j: any = null; try { j = JSON.parse(t); } catch (_) { /* */ }
  if (!r.ok) throw new Error("a IA de vídeo recusou (" + r.status + "): " + String((j && (j.detail?.[0]?.msg || j.detail || j.error)) || t).slice(0, 200));
  return j;
}
async function falFila(modelo: string, corpo: any) {
  const r = await fetch("https://queue.fal.run/" + modelo, { method: "POST", headers: { Authorization: "Key " + falKey(), "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || !j.status_url) throw new Error("a IA de vídeo recusou (" + r.status + "): " + String(j.detail || j.error || "").slice(0, 200));
  return j as { request_id: string; status_url: string; response_url: string };
}
async function falGet(url: string) { const r = await fetch(url, { headers: { Authorization: "Key " + falKey() } }); const j: any = await r.json().catch(() => ({})); return { http: r.status, j }; }
async function baixarPara(url: string, path: string, tipo: string) {
  let buf = new Uint8Array(0), st = 0;
  for (let t = 0; t < 5; t++) {   // fal.media as vezes responde 500 (HTML) logo depois de gerar
    if (t) await new Promise((ok) => setTimeout(ok, 1500 * t));
    const r = await fetch(url); st = r.status; buf = new Uint8Array(await r.arrayBuffer());
    if (r.ok && buf.length > 2000 && !/text\/html/i.test(r.headers.get("content-type") || "")) break;
    buf = new Uint8Array(0);
  }
  if (!buf.length) throw new Error("não baixei o resultado (" + st + ")"); if (buf.length > 80e6) throw new Error("arquivo grande demais");
  const up = await sb.storage.from(BUCKET).upload(path, buf, { contentType: tipo, upsert: true }); if (up.error) throw new Error(up.error.message);
  return buf.length;
}
async function iaProjCena(pid: string, cid: string) {
  const { data: pj } = await sb.from("estudio_projetos").select("id,titulo,formato,plano").eq("id", pid).maybeSingle(); if (!pj) throw new Error("projeto não encontrado");
  const cenas: any[] = (pj.plano as any)?.cenas || []; const i = cenas.findIndex((c: any) => c.id === cid); if (i < 0) throw new Error("cena não encontrada");
  return { pj, i, c: cenas[i] };
}
async function iaSalvarCena(pid: string, cid: string, mudar: (c: any) => any) {   // rele o plano e troca so esta cena
  const { data: at } = await sb.from("estudio_projetos").select("plano").eq("id", pid).maybeSingle(); const pl: any = at?.plano || {};
  const cenas = (pl.cenas || []).map((c: any) => c.id === cid ? mudar(c) : c);
  await sb.from("estudio_projetos").update({ plano: { ...pl, cenas }, atualizado_em: new Date().toISOString() }).eq("id", pid);
  return cenas.find((c: any) => c.id === cid);
}
function iaDurCena(c: any, plano: any) {   // a cena dura o tamanho da fala (+ respiro)
  const vel = Number(c.narracao?.velocidade || plano?.voz?.velocidade || 1) || 1;
  const nd = c.narracao?.dur ? c.narracao.dur / vel : (c.narracao?.texto ? String(c.narracao.texto).split(/\s+/).length / 2.6 : 0);
  return Math.max(3, Math.min(15, Math.round((nd + 0.8) * 2) / 2 || Number(c.dur) || 5));
}
async function iaPrecos(seg: number) {
  const out: any = { imagens3: await brl(IA_IMG.usd * 3), imagem1: await brl(IA_IMG.usd), animar: {} };
  for (const [k, q] of Object.entries(IA_ANIM)) { const s = q.fixo ? (seg > 6.5 ? 10 : 6) : seg; out.animar[k] = { nome: q.nome, segundos: s, usd: +(q.usd_s * s).toFixed(3), brl: await brl(q.usd_s * s) }; }
  return out;
}
async function iaTextoCena(pj: any, c: any) {   // o diretor descreve o que acontece na cena (pode mudar)
  const r = await oai("chat/completions", { model: "gpt-5.4-mini", messages: [
    { role: "system", content: "Você é o diretor de arte do Estúdio da RF Logística (transportadora de Feira de Santana/BA; sistema Rodavia 360). Descreva em 2 ou 3 frases, em português, o que a CÂMERA mostra numa cena de vídeo vertical de animação 3D estilo cartoon de alta qualidade. Personagem: o Ravi (assistente virtual da RF), um ROBÔ cartoon branco e dourado, sempre o mesmo (nunca uma pessoa). Use caminhão baú branco, estrada da Bahia, escritório de transportadora, celular com o sistema. Cores da marca: dourado e preto. Diga ação, cenário, emoção e câmera. NUNCA escreva texto/letreiro na imagem, nem logo ou nome de outra empresa, nem placa legível. Responda só a descrição." },
    { role: "user", content: `Vídeo: ${pj.titulo}\nCena (${c.tipo}): ${c.titulo || ""} ${c.subtitulo || ""}\nFala da cena: ${c.narracao?.texto || "(sem fala)"}` }] });
  const j = await r.json(); return String(j?.choices?.[0]?.message?.content || "").trim().slice(0, 700);
}
function iaPromptImagem(texto: string, personagem: string, formato: string, ajuste?: string) {
  return (personagem === "ravi" ? "Main character: Ravi, the friendly white-and-gold cartoon ROBOT from the reference image (keep the exact logo on his chest, as in the reference) -- keep him EXACTLY the same (same head, screen face, colors, proportions). He is a robot, never a human. Other people, if any, are generic cartoon people. " : "")
    + "High quality 3D animated cartoon still, cinematic lighting, vertical composition " + (formato || "9:16") + ". Scene: " + texto
    + (ajuste ? " Adjustment requested: " + ajuste : "")
    + " Brand colors gold (#D4A017) and black as accents. Absolutely no text, no letters, no readable license plates, no other company brand or logo anywhere -- including vehicle brands on trucks, cars and steering wheels (no VW, Mercedes-Benz, Volvo, Scania, Ford, Iveco, DAF badges): use plain unbranded vehicles.";
}
// v18: narracao premium (ElevenLabs pela fal) -- mesma legenda palavra a palavra (whisper) do caminho normal
async function vozPremium(vozId: string, texto: string, estilo: string) {
  const v = PREMIUM[vozId]; if (!v) throw new Error("voz premium desconhecida");
  const forte = /energ|vibrant|comercial de tv|urg/i.test(estilo || "");
  const j = await falRun("fal-ai/elevenlabs/tts/multilingual-v2", { text: texto, voice: v.voice, language_code: "pt", stability: forte ? 0.32 : 0.45, similarity_boost: 0.8, style: forte ? 0.55 : 0.3, speed: 1 });
  const url = j?.audio?.url; if (!url) throw new Error("a voz premium não devolveu o áudio");
  for (let t = 0; t < 5; t++) {   // o arquivo as vezes ainda nao esta pronto na fal (500 com pagina HTML): espera e tenta de novo
    if (t) await new Promise((ok) => setTimeout(ok, 1500 * t));
    const r = await fetch(url); const b = new Uint8Array(await r.arrayBuffer());
    if (r.ok && b.length > 2000 && !/text\/html/i.test(r.headers.get("content-type") || "")) return b;
  }
  throw new Error("o áudio da voz premium não baixou");
}
async function iaConferir(id: string): Promise<any> {
  const { data: u } = await sb.from("estudio_ia_uso").select("*").eq("id", id).maybeSingle(); if (!u) throw new Error("animação não encontrada");
  if (u.status !== "fila") return { status: u.status, erro: u.erro, midia_id: u.resultado?.midia_id || null };
  const st = await falGet(u.status_url);
  const s = String(st.j?.status || "");
  if (s === "IN_QUEUE" || s === "IN_PROGRESS") return { status: "fila", fase: s === "IN_QUEUE" ? "na fila da IA" + (st.j.queue_position != null ? " (posição " + (st.j.queue_position + 1) + ")" : "") : "animando", desde: u.criado_em };
  if (s !== "COMPLETED") { if (st.http >= 400 && st.http !== 404) { await sb.from("estudio_ia_uso").update({ status: "erro", erro: "a IA respondeu " + st.http, custo_brl: 0 }).eq("id", id); return { status: "erro", erro: "a IA respondeu " + st.http }; } return { status: "fila", fase: "aguardando" }; }
  const { data: tomou } = await sb.from("estudio_ia_uso").update({ status: "importando", atualizado_em: new Date().toISOString() }).eq("id", id).eq("status", "fila").select("id");
  if (!tomou || !tomou.length) return { status: "importando" };
  try {
    const res = await falGet(u.response_url); const vurl = res.j?.video?.url;
    if (!vurl) { const msg = String(res.j?.detail?.[0]?.msg || res.j?.detail || res.j?.error || "a IA não gerou o vídeo").slice(0, 300); await sb.from("estudio_ia_uso").update({ status: "erro", erro: msg, custo_brl: 0 }).eq("id", id); return { status: "erro", erro: msg }; }
    const { pj, i, c } = await iaProjCena(u.projeto_id, u.cena_id);
    const path = `estudio/midias/ia-${crypto.randomUUID()}.mp4`; await baixarPara(vurl, path, "video/mp4");
    const { data: m, error } = await sb.from("estudio_midias").insert({ tipo: "video", nome: ("🎬 IA · " + pj.titulo + " · cena " + (i + 1) + " (" + (IA_ANIM[u.qualidade]?.nome || u.qualidade) + ")").slice(0, 80), path, duracao: Number(u.segundos) || null,
      origem: "ia", autorizada: true, tags: ["ia", "fal", String(u.qualidade || "")], criado_por: u.pedido_por }).select("id").single();
    if (error) throw new Error(error.message);
    await iaSalvarCena(pj.id, c.id, (x) => { const y: any = { ...x, tipo: "midia", midia: { ref: m.id }, ajuste: "cobrir", movimento: "nenhum", velocidade: 1, ia: { ...(x.ia || {}), video_midia: m.id, qualidade: u.qualidade } }; delete y.corte_ini; delete y.corte_fim; delete y.dur; return y; });
    await sb.from("estudio_ia_uso").update({ status: "pronto", resultado: { ...(u.resultado || {}), midia_id: m.id, path }, atualizado_em: new Date().toISOString() }).eq("id", id);
    return { status: "pronto", midia_id: m.id };
  } catch (e) { await sb.from("estudio_ia_uso").update({ status: "fila" }).eq("id", id).eq("status", "importando"); throw e; }
}


// ---------------------------------------------------------------- v19 (15/11/2026, RFL v892): 🎬 DIRETOR IA -- o robo que faz o video inteiro
// Renato (15/11 18h17): "preciso de um robo/ia para fazer esse controle, precisa que esses videos sai profissional". Aprovou a tela (18h26).
// Decisoes dele: limite de R$ 40 por video; faz tudo sozinho (nao para nas imagens); so para no final para ele aprovar; nunca publica sozinho.
// Etapas (uma por vez, pelo cron estudio-diretor a cada minuto, com trava): roteiro -> narrar (voz premium energica) -> imagens (3 por cena)
// -> escolher (a IA olha as 3 e escolhe; refaz se ruim) -> animar (Cinema) -> animando -> montar (ritmo) -> montando -> criticar (nota 0-100;
// refaz ate 3 cenas fracas, ate 2 rodadas, dentro do limite) -> pronto (avisa o Renato no WhatsApp).
const DIR_NOTA = 85, DIR_RODADAS = 2;
// v19.3: Ravi oficial dos videos do Rodavia 360 (Renato escolheu a opcao 1 em 15/11 19h20): logo Rodavia 360 no peito
async function raviRef(pl: any) { if (pl?.logo === "rodavia") { try { return await assinar("estudio/fotos/ravi-rodavia.png", 3600); } catch (_) { /* cai no padrao */ } } return GH + "fotos/ravi.jpg"; }
const DIR_TELAS: Record<string, string> = { dashboard: "base:demo-cel-dashboard", frota: "base:demo-cel-frota", inicio: "base:demo-cel-inicio", fracionado: "base:demo-cel-frc_ofertas", torre: "base:torre" };
async function dirGasto(pid: string | null) {
  if (!pid) return 0; const { data } = await sb.from("estudio_ia_uso").select("custo_brl,status").eq("projeto_id", pid);
  return +((data || []).filter((x: any) => x.status !== "erro").reduce((a: number, x: any) => a + Number(x.custo_brl || 0), 0)).toFixed(2);
}
async function dirLog(J: any, txt: string) {
  const log = [...(J.log || []), { em: new Date().toISOString(), t: txt.slice(0, 400) }].slice(-80); J.log = log;
  await sb.from("estudio_diretor").update({ log, atualizado_em: new Date().toISOString() }).eq("id", J.id);
}
async function dirSalvar(J: any, campos: any) { Object.assign(J, campos); await sb.from("estudio_diretor").update({ ...campos, atualizado_em: new Date().toISOString() }).eq("id", J.id); }
async function dirCabe(J: any, brlNovo: number) {   // limite do video + teto do mes
  const g = await dirGasto(J.projeto_id); if (g + brlNovo > Number(J.limite_brl)) return false;
  try { await iaPodeGastar(brlNovo); return true; } catch (_) { return false; }
}
async function dirAvisar(texto: string) {
  try { const { data } = await sb.from("ravi_pessoal").select("telefone,ativo").eq("id", 1).maybeSingle(); if (!data?.telefone) return; await raviVps("/send-text", "POST", { phone: data.telefone, message: texto }); } catch (_) { /* sem aviso */ }
}
async function dirPlano(J: any) { const { data } = await sb.from("estudio_projetos").select("id,titulo,formato,plano").eq("id", J.projeto_id).maybeSingle(); if (!data) throw new Error("projeto do Diretor sumiu"); return data; }
async function dirSalvarPlano(pid: string, mudar: (pl: any) => any) { const { data } = await sb.from("estudio_projetos").select("plano").eq("id", pid).maybeSingle(); const pl = mudar((data?.plano as any) || {}); await sb.from("estudio_projetos").update({ plano: pl, atualizado_em: new Date().toISOString() }).eq("id", pid); return pl; }
const dirCenasIA = (pl: any) => (pl.cenas || []).filter((c: any) => c.ia && c.ia.diretor);

async function dirRoteiro(J: any) {
  const F = await fatos();
  const n = J.duracao <= 30 ? 5 : J.duracao <= 45 ? 6 : 8;
  const sys = `Você é o diretor de criação de comerciais curtos da RF Logística (transportadora de Feira de Santana/BA) e do sistema Rodavia 360 (gestão de frota da RF Sistemas).
Escreva um comercial vertical PROFISSIONAL de ${J.duracao} segundos para ${J.publico || "dono de transportadora"}, em animação 3D cartoon com o personagem Ravi (assistente virtual da RF: um ROBÔ cartoon branco e dourado, sempre o mesmo; nunca uma pessoa). Pessoas de cartoon genéricas (o dono, o motorista) podem aparecer junto dele.
Estrutura obrigatória: cena 1 = GANCHO forte nos 2 primeiros segundos (pergunta ou dor que faz parar de rolar; nunca "olá" nem "eu sou"); depois DOR concreta, VIRADA (o sistema/serviço resolve), PROVA (o que ele vê na tela) e CHAMADA final.
Use SÓ fatos reais do JSON (nunca invente número, cliente, preço ou prazo). Nunca cite clientes da RF nem outra empresa.
Responda APENAS JSON: {"titulo":"curto","legenda_post":"legenda do post com 2-4 hashtags","cenas":[{"fala":"narração em português do Brasil, 12 a 18 palavras, frase falada natural","visual":"o que a câmera mostra: ação do Ravi, cenário, emoção, câmera (sem texto/letreiro/logo/placa)","tela":"" }]}
Exatamente ${n} cenas. Em ATÉ 2 cenas use "tela" (dashboard|frota|inicio|fracionado|torre) para mostrar a TELA REAL do sistema -- nessa cena "visual" fica vazio. SEMPRE que a fala disser o que aparece no sistema ("na tela", "no celular você vê", "o painel mostra"), essa cena é "tela" (a tela real), nunca o Ravi segurando um celular. Nas cenas do Ravi, ele não segura celular com tela visível. A última cena é a chamada para o site rodavia360.com.br. NUNCA ponha número de telefone ou WhatsApp na fala nem na tela.`;
  const r = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: "PEDIDO DO RENATO: " + J.pedido + "\nFATOS REAIS: " + JSON.stringify({ servicos: F.servicos, contato: F.contato, frota_total: F.frota_total, cidades: F.cidades_atendidas_90d?.slice(0, 12), base: F.base }) }] });
  const j = await r.json(); const R = JSON.parse(j.choices[0].message.content);
  const cenas: any[] = (R.cenas || []).slice(0, 9).map((c: any, i: number) => {
    const tela = DIR_TELAS[String(c.tela || "").trim()];
    const base: any = { id: "d" + (i + 1) + gid().slice(0, 3), narracao: { texto: String(c.fala || "").trim() } };
    if (tela) return { ...base, tipo: "tela", midia: { ref: tela }, ajuste: "conter" };
    return { ...base, tipo: "midia", ia: { diretor: true, texto: String(c.visual || "").trim(), personagem: "ravi" } };
  }).filter((c: any) => c.narracao.texto);
  if (cenas.length < 3) throw new Error("o roteiro saiu curto demais");
  cenas.push({ id: "dfim" + gid().slice(0, 3), tipo: "encerramento", titulo: "Rodavia 360", linhas: ["rodavia360.com.br"], dur: 3.2 });
  const plano = { formato: J.formato, voz: { id: "premium_locutor", estilo: FORCA.energica, velocidade: 1.08, forca: "energica" }, trilha: { ref: "base:trilha-rota", volume: 0.22 }, logo: "rodavia", marca: { ativo: true, pos: "sup-dir" }, legendas: true,
    ritmo: { sem_silencio: true, respiro: 0.25, passagem: "manter", som: "whoosh", batida: true, ducking: true }, cenas: cenas.map((c, i) => i === 0 ? c : { ...c, transicao: "dissolve", trans_dur: 0.35 }), diretor: "Diretor IA", legenda_post: String(R.legenda_post || "") };
  const { data: pj, error } = await sb.from("estudio_projetos").insert({ titulo: ("🎬 " + String(R.titulo || "Diretor IA")).slice(0, 80), tipo: "diretor", formato: J.formato, plano, origem: "diretor_ia", diretor: "Diretor IA", briefing: J.pedido, fatos: F, criado_por: J.pedido_por, criado_nome: J.pedido_nome }).select("id,titulo").single();
  if (error) throw new Error(error.message);
  await dirSalvar(J, { projeto_id: pj.id, etapa: "narrar" });
  await dirLog(J, `Roteiro “${pj.titulo}”: ${cenas.length} cenas. Gancho: “${cenas[0].narracao.texto}”`);
}
async function dirNarrar(J: any) {
  const pj = await dirPlano(J); const pl: any = pj.plano; const vozId = pl.voz?.id || "premium_locutor";
  const falta = (pl.cenas || []).filter((c: any) => c.narracao?.texto && !c.narracao?.path);
  if (!falta.length) { await dirSalvar(J, { etapa: "imagens" }); return; }
  let voz = vozId;
  if (PREMIUM[voz]) { const letras = falta.reduce((a: number, c: any) => a + String(c.narracao.texto).length, 0); const usd = letras / 1000 * IA_VOZ_USD_1000, custo = await brl(usd);
    if (await dirCabe(J, custo)) await sb.from("estudio_ia_uso").insert({ acao: "voz_premium", modelo: "elevenlabs/multilingual-v2", projeto_id: pj.id, custo_usd: usd, custo_brl: custo, status: "feito", pedido_por: J.pedido_por, pedido_nome: "Diretor IA" });
    else { voz = "locutor"; await dirLog(J, "Voz premium não coube no limite: usei a voz locutor (grátis)."); } }
  const feitas: any = {};
  await Promise.all(falta.map(async (c: any) => { try { feitas[c.id] = await narrarCena(pj.id, c, voz, pl.voz?.estilo || FORCA.energica); } catch (e) {
    if (voz !== "locutor") { feitas[c.id] = await narrarCena(pj.id, c, "locutor", pl.voz?.estilo || FORCA.energica); } else throw e; } }));
  await dirSalvarPlano(pj.id, (p) => ({ ...p, voz: { ...(p.voz || {}), id: voz }, cenas: (p.cenas || []).map((c: any) => feitas[c.id] || c) }));
  await dirLog(J, `Narração gravada (${Object.keys(feitas).length} falas, voz ${voz.startsWith("premium") ? "premium enérgica" : "locutor enérgica"}).`);
  await dirSalvar(J, { etapa: "imagens" });
}
async function dirImagens(J: any) {
  const pj = await dirPlano(J); const pl: any = pj.plano; const est = J.cenas || {};
  const alvo = dirCenasIA(pl).filter((c: any) => !(c.ia.imagens || []).length || (est[c.id] && est[c.id].refazer_img)).slice(0, 3);
  if (!alvo.length) { await dirSalvar(J, { etapa: "escolher" }); return; }
  for (const c of alvo) {
    const custo = await brl(IA_IMG.usd * 3);
    if (!(await dirCabe(J, custo))) { await dirLog(J, "Limite do vídeo atingido nas imagens — sigo com o que já tenho."); const e2 = { ...est }; dirCenasIA(pl).forEach((x: any) => { if (e2[x.id]) e2[x.id].refazer_img = false; }); await dirSalvar(J, { cenas: e2, etapa: "escolher" }); return; }
  }
  const novas: Record<string, string[]> = {};
  await Promise.all(alvo.map(async (c: any) => {
    const ajuste = est[c.id]?.ajuste || "";
    const refs = [await raviRef(pl)]; if (/caminh|baú|bau|frota|estrada|carga/i.test(c.ia.texto)) refs.push(GH + "fotos/frota-4.jpg");
    const usd = IA_IMG.usd * 3, custo = await brl(usd);
    const { data: uso } = await sb.from("estudio_ia_uso").insert({ acao: "imagens", modelo: IA_IMG.modelo, projeto_id: pj.id, cena_id: c.id, custo_usd: usd, custo_brl: custo, status: "fila", pedido_por: J.pedido_por, pedido_nome: "Diretor IA" }).select("id").single();
    try {
      const j = await falRun(IA_IMG.modelo, { prompt: iaPromptImagem(c.ia.texto, "ravi", pj.formato, ajuste), num_images: 3, aspect_ratio: ["9:16", "1:1", "16:9", "4:5"].includes(pj.formato) ? pj.formato : "9:16", output_format: "jpeg", resolution: "1K", image_urls: refs });
      const urls: string[] = (j?.images || []).map((x: any) => x.url).filter(Boolean); if (!urls.length) throw new Error("sem imagem");
      const paths: string[] = []; for (const u of urls) { const p = `estudio/ia/${pj.id}/${c.id}-${Date.now()}-${paths.length}.jpg`; await baixarPara(u, p, "image/jpeg"); paths.push(p); }
      await sb.from("estudio_ia_uso").update({ status: "feito", resultado: { paths } }).eq("id", uso!.id);
      novas[c.id] = paths;   // grava tudo de uma vez no fim (em paralelo uma gravacao apagava a outra)
      est[c.id] = { ...(est[c.id] || {}), refazer_img: false, escolhida: false, tent_img: (est[c.id]?.tent_img || 0) + 1 };
    } catch (e) { await sb.from("estudio_ia_uso").update({ status: "erro", custo_brl: 0, erro: String((e as Error).message).slice(0, 300) }).eq("id", uso!.id); est[c.id] = { ...(est[c.id] || {}), tent_img: (est[c.id]?.tent_img || 0) + 1 }; if ((est[c.id].tent_img || 0) >= 3) throw new Error("a IA não gerou imagens da cena " + c.id); }
  }));
  if (Object.keys(novas).length) await dirSalvarPlano(pj.id, (p) => ({ ...p, cenas: (p.cenas || []).map((x: any) => novas[x.id] ? { ...x, ia: { ...(x.ia || {}), imagens: novas[x.id], escolhida: 0 } } : x) }));
  await dirSalvar(J, { cenas: est }); await dirLog(J, `Imagens geradas: ${Object.keys(novas).length} cena(s), 3 opções cada.`);
}
async function dirEscolher(J: any) {
  const pj = await dirPlano(J); const pl: any = pj.plano; const est = J.cenas || {};
  const alvo = dirCenasIA(pl).filter((c: any) => (c.ia.imagens || []).length && !(est[c.id] && est[c.id].escolhida));
  if (!alvo.length) { await dirSalvar(J, { etapa: "animar" }); return; }
  let refazer = 0;
  for (const c of alvo.slice(0, 4)) {
    const urls = await Promise.all(c.ia.imagens.slice(-3).map((p: string) => assinar(p, 1800)));
    const conteudo: any[] = [{ type: "text", text: `Cena pedida: ${c.ia.texto}\nFala: ${c.narracao?.texto || ""}\nA referência do Ravi vem primeiro e NÃO é opção. As opções são OPÇÃO 1 a OPÇÃO ${urls.length}; "melhor" e "notas" se referem só às opções.` }, { type: "text", text: "REFERÊNCIA DO RAVI (não é opção):" }, { type: "image_url", image_url: { url: await raviRef(pl) } }, ...urls.flatMap((u, k) => [{ type: "text", text: "OPÇÃO " + (k + 1) + ":" }, { type: "image_url", image_url: { url: u } }])];
    let R: any = {};
    try { const r = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: "Você é o diretor de arte exigente de um comercial profissional. O Ravi é um ROBÔ cartoon branco e dourado (a referência vem primeiro); o logo no peito do Ravi (RF ou Rodavia 360, igual à referência) é OBRIGATÓRIO e não conta como texto -- Ravi sem o logo da referência no peito vale no máximo 5. Pessoas genéricas de cartoon podem aparecer junto. Avalie cada opção de 0 a 10: Ravi (robô) IGUAL à referência (cabeça, rosto de tela, cores), cena pedida bem contada, emoção clara, composição vertical bonita, qualidade de cinema. Nota máxima 3 se tiver: texto/letreiro/letras legíveis, logo ou marca de outra empresa (inclusive marca de veículo no caminhão, carro ou volante: VW, Mercedes, Volvo, Scania, Ford...), placa legível, mãos/rosto deformados, pessoa real reconhecível. Responda APENAS JSON {\"notas\":[n,...],\"melhor\":1,\"motivo\":\"curto\",\"ajuste\":\"o que pedir se todas forem ruins (em inglês, curto)\"}" }, { role: "user", content: conteudo }] }); const j = await r.json(); R = JSON.parse(j.choices[0].message.content); } catch (_) { R = { notas: [7], melhor: 1, motivo: "avaliação indisponível" }; }
    const notas: number[] = (R.notas || []).map((x: any) => Number(x) || 0); const melhor = Math.max(1, Math.min(urls.length, Number(R.melhor) || (notas.indexOf(Math.max(...notas)) + 1)));
    const nota = notas[melhor - 1] ?? 7; const idx = c.ia.imagens.length - urls.length + melhor - 1;
    const n = (pl.cenas || []).findIndex((x: any) => x.id === c.id) + 1;
    if (nota < 7 && (est[c.id]?.tent_img || 1) < 2) { est[c.id] = { ...(est[c.id] || {}), refazer_img: true, ajuste: String(R.ajuste || R.motivo || "").slice(0, 200) }; refazer++; await dirLog(J, `Cena ${n}: as 3 imagens ficaram fracas (${nota}/10: ${R.motivo || ""}) — vou gerar de novo.`); continue; }
    await iaSalvarCena(pj.id, c.id, (x) => ({ ...x, ia: { ...(x.ia || {}), escolhida: idx } }));
    est[c.id] = { ...(est[c.id] || {}), escolhida: true, nota_img: nota };
    await dirLog(J, `Cena ${n}: imagem ${melhor} escolhida (${nota}/10) — ${R.motivo || ""}`);
  }
  await dirSalvar(J, { cenas: est, etapa: refazer ? "imagens" : "escolher" });
}
async function dirAnimar(J: any) {
  const pj = await dirPlano(J); const pl: any = pj.plano; const est = J.cenas || {};
  const alvo = dirCenasIA(pl).filter((c: any) => (c.ia.imagens || []).length && !(est[c.id] && est[c.id].uso && !est[c.id].refazer_anim));
  // planeja antes: se o Cinema em todas nao cabe no que sobrou, anima TODAS em 768p (melhor que deixar cena parada)
  const resto = Number(J.limite_brl) - (await dirGasto(J.projeto_id)); let qPlan = J.qualidade === "bom" ? "bom" : "cinema";
  if (qPlan === "cinema") { let need = 0; for (const c of alvo) need += await brl(IA_ANIM.cinema.usd_s * iaDurCena(c, pl)); if (need > resto) { qPlan = "bom"; await dirLog(J, `O Cinema em todas as cenas (≈ R$ ${need.toFixed(2).replace(".", ",")}) passaria do limite: animo todas em 768p.`); } }
  const enviadas: string[] = [];
  for (const c of alvo) {
    let q = qPlan; const seg = iaDurCena(c, pl);
    let usd = IA_ANIM[q].usd_s * seg, custo = await brl(usd);
    if (!(await dirCabe(J, custo)) && q === "cinema") { q = "bom"; usd = IA_ANIM.bom.usd_s * seg; custo = await brl(usd); }
    if (!(await dirCabe(J, custo))) { await dirLog(J, "Limite do vídeo atingido: não animei todas as cenas (as que faltam ficam com a imagem parada)."); break; }
    const img = c.ia.imagens[c.ia.escolhida ?? 0];
    const mov = "Animate this exact image as a cinematic shot of a professional commercial. Keep the character identical. " + c.ia.texto + " Smooth natural motion, expressive face, natural hands, subtle camera move. No text on screen, no vehicle brand badges. Start and end on a fully lit frame (no fade to black).";
    const f = await falFila(IA_ANIM[q].modelo, { prompt: mov, image_url: await assinar(img, 3600), duration: seg, resolution: IA_ANIM[q].res, prompt_expansion_mode: "balanced" });
    const { data: uso } = await sb.from("estudio_ia_uso").insert({ acao: "animar", modelo: IA_ANIM[q].modelo, projeto_id: pj.id, cena_id: c.id, qualidade: q, segundos: seg, custo_usd: +usd.toFixed(3), custo_brl: custo, status: "fila", status_url: f.status_url, response_url: f.response_url, resultado: { request_id: f.request_id, imagem: img }, pedido_por: J.pedido_por, pedido_nome: "Diretor IA" }).select("id").single();
    est[c.id] = { ...(est[c.id] || {}), uso: uso!.id, refazer_anim: false, tent_anim: (est[c.id]?.tent_anim || 0) + 1 }; enviadas.push(q);
  }
  await dirSalvar(J, { cenas: est, etapa: "animando" });
  if (enviadas.length) await dirLog(J, `Animando ${enviadas.length} cena(s): ${enviadas.filter((x) => x === "cinema").length} em Cinema 1080p, ${enviadas.filter((x) => x === "bom").length} em 768p.`);
}
async function dirAnimando(J: any) {
  const est = J.cenas || {}; let pend = 0, errs = 0;
  for (const [cid, s] of Object.entries(est) as any) {
    if (!s.uso || s.anim_ok) continue;
    let r: any; try { r = await iaConferir(s.uso); } catch (_) { pend++; continue; }
    if (r.status === "pronto") s.anim_ok = true;
    else if (r.status === "erro") { if ((s.tent_anim || 1) < 2) { s.refazer_anim = true; s.uso = null; errs++; } else s.anim_ok = true; }
    else pend++;
  }
  if (errs) { await dirSalvar(J, { cenas: est, etapa: "animar" }); await dirLog(J, `${errs} animação(ões) falharam na IA (não cobradas) — mandando de novo.`); return; }
  await dirSalvar(J, { cenas: est });
  if (!pend) { await dirSalvar(J, { etapa: "montar" }); await dirLog(J, "Todas as cenas animadas e colocadas no vídeo."); }
}
async function dirMontar(J: any) {
  // cena da IA que nao foi animada (limite) entra com a IMAGEM escolhida, com movimento de camera -- nunca fundo vazio
  const pj0 = await dirPlano(J); const semVideo = dirCenasIA(pj0.plano).filter((c: any) => !c.midia?.ref && (c.ia.imagens || []).length);
  if (semVideo.length) {
    const novos: Record<string, string> = {};
    for (const c of semVideo) {
      const path = c.ia.imagens[c.ia.escolhida ?? 0];
      const { data: m } = await sb.from("estudio_midias").insert({ tipo: "imagem", nome: ("🖼️ IA · " + pj0.titulo + " · imagem").slice(0, 80), path, origem: "ia", autorizada: true, tags: ["ia", "fal"], criado_por: J.pedido_por }).select("id").single();
      if (m) novos[c.id] = m.id;
    }
    await dirSalvarPlano(J.projeto_id, (p) => ({ ...p, cenas: (p.cenas || []).map((x: any) => novos[x.id] ? { ...x, midia: { ref: novos[x.id] }, ajuste: "cobrir", movimento: "zoom_in" } : x) }));
    await dirLog(J, `${semVideo.length} cena(s) sem animação entram com a imagem e movimento de câmera.`);
  }
  const { data, error } = await sb.from("estudio_renders").insert({ projeto_id: J.projeto_id, formato: J.formato, status: "fila", pedido_por: J.pedido_por, pedido_nome: "Diretor IA" }).select("id").single();
  if (error) throw new Error(error.message);
  await dirSalvar(J, { render_id: data.id, etapa: "montando" }); await dirLog(J, "Montando o vídeo no servidor (ritmo sem silêncio, whoosh, corte na batida, legenda, logo Rodavia 360).");
}
async function dirMontando(J: any) {
  const { data: r } = await sb.from("estudio_renders").select("status,erro").eq("id", J.render_id).maybeSingle();
  if (!r || r.status === "fila" || r.status === "renderizando") return;
  if (r.status === "pronto") { await dirSalvar(J, { etapa: "criticar" }); return; }
  if ((J.erros || 0) < 2) { await dirSalvar(J, { etapa: "montar", erros: (J.erros || 0) + 1 }); await dirLog(J, "A montagem falhou (" + String(r.erro || "").slice(0, 120) + ") — tentando de novo."); return; }
  throw new Error("a montagem falhou: " + r.erro);
}
async function dirCriticar(J: any) {
  const pj = await dirPlano(J); const pl: any = pj.plano;
  const { data: rd } = await sb.from("estudio_renders").select("id,analise,duracao").eq("id", J.render_id).maybeSingle(); const an: any = rd?.analise || {};
  const cenas = (pl.cenas || []).map((c: any, i: number) => `${i + 1}. [${c.tipo === "tela" ? "tela do sistema" : c.tipo === "encerramento" ? "encerramento" : "cena IA"}] fala: “${c.narracao?.texto || ""}”`).join("\n");
  const som: number[] = an.som_por_seg || []; const baixos = som.filter((v) => v < -32).length;
  const conteudo: any[] = [{ type: "text", text: `VÍDEO de ${Math.round(Number(rd?.duracao) || 0)} s, formato ${pj.formato}. Cenas:\n${cenas}\nSegundos com som baixo: ${baixos}.\n${an.folha_b64 ? "A folha de quadros mostra 2 quadros por cena, na ordem das cenas (da esquerda para a direita, de cima para baixo)." : "(sem folha de quadros)"}` }];
  if (an.folha_b64) conteudo.push({ type: "image_url", image_url: { url: "data:image/jpeg;base64," + an.folha_b64 } });
  let R: any = {};
  try { const r = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: `Você é um crítico de publicidade MUITO exigente avaliando um comercial vertical do Rodavia 360 para ${J.publico || "dono de transportadora"}. Notas de 0 a 10: gancho (2 primeiros segundos param o dedo?), historia (dor, virada, prova, chamada clara), visual (qualidade de cinema, Ravi igual em todas as cenas, sem mãos/rostos deformados, sem texto ou logo estranho na imagem, sem marca de veículo (VW, Mercedes, Volvo, Scania...) em caminhão, carro ou volante, sem telefone na tela; o Ravi é um robô branco e dourado com o logo Rodavia 360 no peito -- tem que aparecer; sem ele é defeito), ritmo (sem parada, cortes no tempo), som (voz forte e clara), chamada (termina dizendo o que fazer). Liste as cenas a REFAZER (no máximo 3, só se tiverem defeito visual claro). Responda APENAS JSON {"gancho":n,"historia":n,"visual":n,"ritmo":n,"som":n,"chamada":n,"refazer":[{"cena":n,"motivo":"curto em português","ajuste":"o que mudar na imagem, em inglês curto"}],"resumo":"1 frase"}` }, { role: "user", content: conteudo }] }); const j = await r.json(); R = JSON.parse(j.choices[0].message.content); } catch (_) { R = {}; }
  // 🛡️ revisor objetivo (medido, nao opiniao): preto na troca de cena, telefone na fala/tela, som baixo
  const telasT = ((an.cenas || []) as any[]).map((x: any, i: number) => ({ ...x, tipo: (pl.cenas || [])[i]?.tipo })).filter((x: any) => x.tipo === "tela");   // tela do sistema e escura (tema preto/dourado): nao e falha
  const pretos: any[] = (an.pretos || []).filter((p: any) => !telasT.some((t: any) => p.ini >= t.ini - 0.2 && p.fim <= t.ini + t.dur + 0.2)); const tels = (pl.cenas || []).some((c: any) => /\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/.test(String(c.narracao?.texto || "") + " " + (c.linhas || []).join(" ")));
  const revisor = [{ item: "Sem tela preta na troca de cena", ok: !pretos.length, detalhe: pretos.length ? pretos.map((x: any) => x.ini + "s").join(", ") : "" }, { item: "Sem telefone na fala/tela (só o site)", ok: !tels, detalhe: "" }, { item: "Som sem buraco", ok: baixos <= 2, detalhe: baixos ? baixos + " s baixos" : "" }];
  if (pretos.length) R.ritmo = Math.min(Number(R.ritmo) || 7, 5);
  const P: Record<string, number> = { gancho: 2, historia: 2, visual: 2, ritmo: 1, som: 1, chamada: 1 }; let s = 0, p = 0;
  for (const [k, w] of Object.entries(P)) { s += Math.max(0, Math.min(10, Number(R[k]) || 7)) * w; p += w; }
  const nota = Math.round(s / p * 10); const crit = { nota, itens: Object.fromEntries(Object.keys(P).map((k) => [k, Number(R[k]) || null])), refazer: R.refazer || [], revisor, resumo: String(R.resumo || "").slice(0, 300), rodada: J.rodada, em: new Date().toISOString() };
  await dirSalvar(J, { critica: crit }); await dirLog(J, `Crítica: nota ${nota}/100 — ${crit.resumo}`);
  const ids = (crit.refazer || []).map((x: any) => ({ c: (pl.cenas || [])[Number(x.cena) - 1], x })).filter((y: any) => y.c && y.c.ia && y.c.ia.diretor).slice(0, 3);
  const estimativa = ids.length ? (await brl(IA_IMG.usd * 3 + IA_ANIM[J.qualidade === "bom" ? "bom" : "cinema"].usd_s * 7)) * ids.length : 0;
  if (nota >= DIR_NOTA || !ids.length || J.rodada >= DIR_RODADAS || !(await dirCabe(J, estimativa))) {
    await dirSalvar(J, { etapa: "pronto", status: "pronto", trava: null });
    const gasto = await dirGasto(J.projeto_id);
    await dirLog(J, nota >= DIR_NOTA ? `Pronto: nota ${nota}/100, custo R$ ${gasto.toFixed(2).replace(".", ",")}.` : `Pronto com nota ${nota}/100 (${J.rodada >= DIR_RODADAS ? "já refiz " + J.rodada + " vez(es)" : !ids.length ? "nada claro para refazer" : "o limite não dá para refazer"}). Custo R$ ${gasto.toFixed(2).replace(".", ",")}.`);
    await dirAvisar(`🎬 *Diretor IA*: o vídeo “${pj.titulo.replace(/^🎬 /, "")}” ficou pronto.\nNota da crítica: *${nota}/100* · custo R$ ${gasto.toFixed(2).replace(".", ",")}.\nAbra o sistema › Campanhas › Estúdio › 🎬 Diretor IA para assistir e aprovar. Nada foi publicado.`);
    return;
  }
  const est = J.cenas || {};
  for (const y of ids) { est[y.c.id] = { ...(est[y.c.id] || {}), refazer_img: true, escolhida: false, uso: null, anim_ok: false, refazer_anim: true, tent_img: 0, tent_anim: 0, ajuste: String(y.x.ajuste || y.x.motivo || "").slice(0, 200) }; await dirLog(J, `Refazendo a cena ${y.x.cena}: ${y.x.motivo || ""}`); }
  await dirSalvar(J, { cenas: est, rodada: (J.rodada || 0) + 1, etapa: "imagens" });
}
async function diretorPasso(id?: string) {
  let q = sb.from("estudio_diretor").select("*").eq("status", "rodando").order("criado_em").limit(3); if (id) q = sb.from("estudio_diretor").select("*").eq("id", id).limit(1);
  const { data: lista } = await q;
  for (const J0 of lista || []) {
    if (J0.status !== "rodando") continue;
    const { data: tomou } = await sb.from("estudio_diretor").update({ trava: new Date().toISOString() }).eq("id", J0.id).eq("status", "rodando").or(`trava.is.null,trava.lt.${new Date(Date.now() - 6 * 60e3).toISOString()}`).select("*");
    if (!tomou || !tomou.length) continue;
    const J: any = tomou[0];
    try {
      const E: Record<string, (J: any) => Promise<void>> = { roteiro: dirRoteiro, narrar: dirNarrar, imagens: dirImagens, escolher: dirEscolher, animar: dirAnimar, animando: dirAnimando, montar: dirMontar, montando: dirMontando, criticar: dirCriticar };
      const f = E[J.etapa]; if (f) await f(J);
      if (J.status === "rodando") await sb.from("estudio_diretor").update({ trava: null }).eq("id", J.id);
    } catch (e) {
      const msg = String((e as Error).message || e).slice(0, 300); const errs = (J.erros || 0) + 1;
      await dirLog(J, "⚠ " + msg + (errs >= 4 ? " — parei." : " — tento de novo no próximo minuto."));
      await sb.from("estudio_diretor").update({ erros: errs, trava: null, ...(errs >= 4 ? { status: "erro" } : {}) }).eq("id", J.id);
      if (errs >= 4) await dirAvisar(`🎬 *Diretor IA*: parei o vídeo pedido (“${String(J.pedido).slice(0, 60)}…”) por erro: ${msg}. Nada foi publicado.`);
    }
  }
}
async function diretorVer(J: any) {
  const out: any = { ...J, gasto: await dirGasto(J.projeto_id) }; delete out.trava;
  if (J.projeto_id) {
    const { data: pj } = await sb.from("estudio_projetos").select("titulo,plano").eq("id", J.projeto_id).maybeSingle();
    out.titulo = pj?.titulo; const cs = ((pj?.plano as any)?.cenas || []);
    out.cenas_vis = await Promise.all(cs.map(async (c: any, i: number) => { const im = c.ia?.imagens?.[c.ia.escolhida ?? 0]; return { n: i + 1, id: c.id, tipo: c.tipo, fala: c.narracao?.texto || "", img: im ? await assinar(im, 3600).catch(() => null) : null, animada: !!c.ia?.video_midia, nota: J.cenas?.[c.id]?.nota_img ?? null }; }));
  }
  if (J.render_id) { const { data: r } = await sb.from("estudio_renders").select("status,progresso,video_path,capa_path,duracao").eq("id", J.render_id).maybeSingle(); out.render = r; if (r?.status === "pronto" && r.video_path) { out.video_url = await assinar(r.video_path, 3600).catch(() => null); out.leve_url = await assinar(r.video_path.replace(/video\.mp4$/, "leve.mp4"), 3600).catch(() => null); out.capa_url = r.capa_path ? await assinar(r.capa_path, 3600).catch(() => null) : null; } }
  return out;
}

// ---------------------------------------------------------------- servidor
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const b = await req.json().catch(() => ({}));
    // ===================== v15: link pessoal de envio de video (sem login; vale o token do link)
    if (b.acao === "link_info" || b.acao === "link_inicio" || b.acao === "link_fim") {
      const tk = String(b.k || "");
      if (!/^[A-Za-z0-9_-]{20,64}$/.test(tk)) return erro("link inválido", 400);
      const { data: L } = await sb.from("estudio_links").select("*").eq("token", tk).maybeSingle();
      if (!L || Date.parse(L.expira_em) < Date.now()) return json({ ok: false, erro: "Este link venceu. Peça um novo ao Ravi." });
      if (b.acao === "link_info") return json({ ok: true, nome: L.nome, expira_em: L.expira_em, enviados: L.usos || 0 });
      if ((L.usos || 0) >= 30) return json({ ok: false, erro: "Este link já recebeu 30 vídeos. Peça um novo ao Ravi." });
      if (b.acao === "link_inicio") {
        const tam = Number(b.tam) || 0, mime = String(b.mime || "");
        if (!/^video\//.test(mime)) return json({ ok: false, erro: "Escolha um arquivo de VÍDEO." });
        if (tam > 50 * 1024 * 1024) return json({ ok: false, erro: "Esse vídeo passou de 50 MB. Mande um mais curto (15 a 40 segundos)." });
        const ext = /webm/i.test(mime) ? "webm" : /quicktime|mov/i.test(mime) ? "mov" : "mp4";
        const path = "estudio/motoristas/" + hojeBR().slice(0, 7) + "/" + crypto.randomUUID() + "." + ext;
        const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
        if (error || !data) return json({ ok: false, erro: "Não consegui preparar o envio agora. Tente de novo em instantes." });
        return json({ ok: true, path, upload_url: data.signedUrl });
      }
      const path = String(b.path || "");
      if (!/^estudio\/motoristas\/\d{4}-\d{2}\/[0-9a-f-]{36}\.(mp4|mov|webm)$/.test(path)) return erro("caminho inválido", 400);
      const pasta = path.split("/").slice(0, -1).join("/"), arq = path.split("/").pop();
      const { data: lst } = await sb.storage.from(BUCKET).list(pasta, { search: arq, limit: 1 });
      if (!lst || !lst.length) return json({ ok: false, erro: "O vídeo não chegou completo. Tente de novo." });
      const leg = String(b.legenda || "").replace(/\s+/g, " ").trim().slice(0, 60);
      const { data: ja } = await sb.from("estudio_midias").select("id").eq("path", path).maybeSingle();
      if (!ja) {
        const { error } = await sb.from("estudio_midias").insert({ tipo: "video", nome: ("📱 " + (L.nome || "Motorista") + " · " + dataBR(hojeBR()) + (leg ? " · " + leg : "")).slice(0, 80), path,
          duracao: Number(b.duracao) || null, largura: Number(b.largura) || null, altura: Number(b.altura) || null, origem: "motorista", autorizada: true,
          tags: ["motorista", String(L.nome || "")].filter(Boolean), credito: null, criado_por: null });
        if (error) return json({ ok: false, erro: "Recebi, mas não consegui registrar. A equipe vai conferir." });
        await sb.from("estudio_links").update({ usos: (L.usos || 0) + 1, ultimo_uso: new Date().toISOString() }).eq("token", tk);
      }
      return json({ ok: true, msg: "Vídeo recebido! Obrigado, " + (L.nome || "") + "." });
    }
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
          if (job.receita?.tipo === "referencia") {   // v17: baixar o video de referencia (so para estudo)
            const pid = job.receita.projeto_id, base = `estudio/referencias/${pid}/`;
            const nomes = ["video.mp4", "audio.mp3", "folha.jpg", "capa.jpg"];
            const us = await Promise.all(nomes.map((n) => sb.storage.from(BUCKET).createSignedUploadUrl(base + n, { upsert: true })));
            const ruim = us.find((x) => x.error); if (ruim) throw new Error("não criei o link de envio: " + ruim.error!.message);
            const fonte = job.receita.upload_path ? await assinar(job.receita.upload_path, 3600) : null;
            return json({ ok: true, job: { id: job.id, receita: { ...job.receita, fonte }, upload_ref: Object.fromEntries(nomes.map((n, i) => [n, us[i].data!.signedUrl])) } });
          }
          if (job.receita?.tipo === "audio") {   // v16: tirar a fala da gravacao
            const fonte = await refUrl(job.receita.midia_id); if (!fonte) throw new Error("vídeo gravado não encontrado na biblioteca");
            const pa = `estudio/gravacoes/${job.receita.projeto_id}/audio-${job.id}.mp3`;
            const ua = await sb.storage.from(BUCKET).createSignedUploadUrl(pa, { upsert: true }); if (ua.error) throw new Error("não criei o link de envio: " + ua.error.message);
            await sb.from("estudio_renders").update({ video_path: pa }).eq("id", job.id);
            return json({ ok: true, job: { id: job.id, receita: { ...job.receita, fonte }, upload_audio: ua.data.signedUrl } });
          }
          if (job.receita?.tipo === "editar") {   // v16: montar a gravacao editada
            const { data: pj } = await sb.from("estudio_projetos").select("*").eq("id", job.projeto_id).maybeSingle(); if (!pj) throw new Error("gravação não encontrada");
            const rec = await receitaGravacao(pj);
            const pv = `estudio/renders/${job.id}/video.mp4`, pc = `estudio/renders/${job.id}/capa.jpg`;
            const [uv, uc] = await Promise.all([sb.storage.from(BUCKET).createSignedUploadUrl(pv, { upsert: true }), sb.storage.from(BUCKET).createSignedUploadUrl(pc, { upsert: true })]);
            if (uv.error || uc.error) throw new Error("não criei o link de envio: " + (uv.error?.message || uc.error?.message));
            await sb.from("estudio_renders").update({ receita: { ...rec, fonte: { chave: rec.fonte.chave } }, video_path: pv, capa_path: pc }).eq("id", job.id);
            return json({ ok: true, job: { id: job.id, receita: rec, upload_video: uv.data.signedUrl, upload_capa: uc.data.signedUrl } });
          }
          if (job.receita?.tipo === "melhorar") {   // ✨ Melhorar video: so o original + opcoes
            const fonte = await refUrl(job.receita.midia_id); if (!fonte) throw new Error("vídeo original não encontrado na biblioteca");
            const pv = `estudio/midias/melhorado-${job.id}.mp4`, pc = `estudio/midias/melhorado-${job.id}.jpg`;
            const [uv, uc] = await Promise.all([sb.storage.from(BUCKET).createSignedUploadUrl(pv, { upsert: true }), sb.storage.from(BUCKET).createSignedUploadUrl(pc, { upsert: true })]);
            if (uv.error || uc.error) throw new Error("não criei o link de envio: " + (uv.error?.message || uc.error?.message));
            await sb.from("estudio_renders").update({ video_path: pv, capa_path: pc }).eq("id", job.id);
            return json({ ok: true, job: { id: job.id, receita: { ...job.receita, fonte }, upload_video: uv.data.signedUrl, upload_capa: uc.data.signedUrl } });
          }
          const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", job.projeto_id).maybeSingle();
          const rec = await receita(pj?.plano || job.receita || {}, job.formato);
          const pv = `estudio/renders/${job.id}/video.mp4`, pc = `estudio/renders/${job.id}/capa.jpg`, pl = `estudio/renders/${job.id}/leve.mp4`;
          const [uv, uc, ul] = await Promise.all([sb.storage.from(BUCKET).createSignedUploadUrl(pv, { upsert: true }), sb.storage.from(BUCKET).createSignedUploadUrl(pc, { upsert: true }), sb.storage.from(BUCKET).createSignedUploadUrl(pl, { upsert: true })]);
          if (uv.error || uc.error) throw new Error("não criei o link de envio: " + (uv.error?.message || uc.error?.message));
          await sb.from("estudio_renders").update({ receita: rec, video_path: pv, capa_path: pc }).eq("id", job.id);
          return json({ ok: true, job: { id: job.id, receita: rec, upload_video: uv.data.signedUrl, upload_capa: uc.data.signedUrl, upload_leve: ul.data?.signedUrl || null } });   // v19.6: versao leve p/ assistir no app
        } catch (e) {
          await sb.from("estudio_renders").update({ status: "erro", erro: String((e as Error).message || e).slice(0, 500) }).eq("id", job.id);
          return json({ ok: true, espera: 1000 });
        }
      }
      if (acao === "worker_status") {
        const up: any = { visto_em: new Date().toISOString() };
        for (const k of ["status", "progresso", "etapa", "erro", "duracao", "tamanho", "largura", "altura", "previa_b64", "segundos_render", "analise"]) if (b[k] !== undefined) up[k] = b[k];
        if (b.status === "pronto" || b.status === "erro") up.concluido_em = new Date().toISOString();
        const { data: r } = await sb.from("estudio_renders").update(up).eq("id", b.job_id).select("cancelar,projeto_id,receita,video_path,pedido_por").maybeSingle();
        if (b.status === "pronto" && r?.receita?.tipo === "melhorar" && r.video_path) {   // entra na biblioteca como mídia nova (o original fica intacto)
          const rc: any = r.receita;
          const { data: nm } = await sb.from("estudio_midias").insert({ tipo: "video", nome: (String(rc.nome || "vídeo").slice(0, 66) + " (melhorado)"), path: r.video_path, duracao: b.duracao ?? null, largura: b.largura ?? null, altura: b.altura ?? null,
            origem: "melhorado", autorizada: rc.autorizada !== false, tags: Array.from(new Set([...(rc.tags || []), "melhorado"])), criado_por: r.pedido_por || null }).select("id").maybeSingle();
          if (nm?.id && rc.ref_troca?.projeto_id) {   // v17: cena de referencia -- a versao melhorada entra no lugar da original
            const { data: np } = await sb.from("estudio_projetos").select("plano").eq("id", rc.ref_troca.projeto_id).maybeSingle(); const pl: any = np?.plano;
            if (pl?.cenas) { const cs = pl.cenas.map((c: any) => c.id === rc.ref_troca.cena_id && c.midia?.ref === rc.midia_id ? { ...c, midia: { ref: nm.id }, melhorada: true } : c); await sb.from("estudio_projetos").update({ plano: { ...pl, cenas: cs } }).eq("id", rc.ref_troca.projeto_id); }
          }
        }
        // v17: referencia baixada => raio-x (IA); erro => mensagem simples para o Renato
        if (r?.receita?.tipo === "referencia" && r.projeto_id) {
          const base = `estudio/referencias/${r.projeto_id}/`;
          if (b.status === "pronto") {
            await salvarRef(r.projeto_id, (x) => ({ ...x, video_path: base + "video.mp4", audio_path: b.tem_audio ? base + "audio.mp3" : null, folha_path: base + "folha.jpg", capa_path: base + "capa.jpg", dur: b.duracao ?? null, largura: b.largura ?? null, altura: b.altura ?? null, quadros_n: Number(b.quadros_n) || 16, estado: "analisando", etapa: "Ouvindo a fala e olhando as cenas…" }));
            if (r.receita.upload_path) await sb.storage.from(BUCKET).remove([r.receita.upload_path]);
            // @ts-ignore EdgeRuntime
            const t = analisarReferencia(r.projeto_id); if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(t); else await t;
          } else if (b.status === "erro") await salvarRef(r.projeto_id, (x) => ({ ...x, estado: "erro", etapa: "", erro: String(b.erro || "não consegui baixar").slice(0, 300) }), { status: "erro" });
          return json({ ok: true, cancelar: !!r?.cancelar });
        }
        // v16: gravacao -- audio pronto => entende a fala; video editado pronto => critica automatica
        if (r?.receita?.tipo === "audio" && r.projeto_id) {
          const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", r.projeto_id).maybeSingle(); const pl: any = pj?.plano || {};
          if (b.status === "pronto") {
            await sb.from("estudio_projetos").update({ plano: { ...pl, gravacao: { ...(pl.gravacao || {}), audio_path: r.video_path, dur: b.duracao ?? null, largura: b.largura ?? null, altura: b.altura ?? null, estado: "entendendo", etapa: "Transcrevendo a sua fala…" } } }).eq("id", r.projeto_id);
            // @ts-ignore EdgeRuntime
            const t = analisarGravacao(r.projeto_id); if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(t); else await t;
          } else if (b.status === "erro") await sb.from("estudio_projetos").update({ status: "erro", plano: { ...pl, gravacao: { ...(pl.gravacao || {}), estado: "erro", erro: String(b.erro || "falha ao ler o vídeo").slice(0, 300) } } }).eq("id", r.projeto_id);
          return json({ ok: true, cancelar: !!r?.cancelar });
        }
        if (r?.receita?.tipo === "editar" && r.projeto_id && b.status === "pronto") {
          await sb.from("estudio_projetos").update({ status: "pronto", atualizado_em: new Date().toISOString() }).eq("id", r.projeto_id);
          // @ts-ignore EdgeRuntime
          const t = criticar(r.projeto_id, b.job_id).catch(() => null); if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(t); else await t;
          return json({ ok: true, cancelar: !!r?.cancelar });
        }
        if (b.status === "pronto" && r?.projeto_id) await sb.from("estudio_projetos").update({ status: "pronto", atualizado_em: new Date().toISOString() }).eq("id", r.projeto_id);
        return json({ ok: true, cancelar: !!r?.cancelar });
      }
      return erro("ação do worker desconhecida");
    }

    // v15: pedido de videos aos motoristas ativos (cron semanal; ou o master pelo app) -- link pessoal de 14 dias; nunca filmar dirigindo
    if (acao === "pedir_videos") {
      if (!(U.tipo === "servidor" || U.master)) return erro("só o login master", 403);
      const PAGINA = "https://rflogistica.github.io/rf-logistica-app/enviar-video.html";
      const { data: cad } = await sb.from("painel_dados").select("valor").eq("chave", "motoristasCad").maybeSingle();
      const lista = (Array.isArray(cad?.valor) ? cad!.valor : []).filter((m: any) => m && m.loginNome && m.mot && m.tipo !== "ajudante" && String(m.mot.celular || "").replace(/\D/g, "").length >= 10);
      const so = Array.isArray(b.so_logins) ? b.so_logins.map((x: any) => String(x).toLowerCase()) : null;
      const enviados: string[] = [], erros: string[] = [];
      for (const m of lista) {
        if (so && !so.includes(String(m.loginNome).toLowerCase())) continue;
        const { data: pf } = await sb.from("profiles").select("ativo,papel").ilike("nome", m.loginNome).maybeSingle();
        if (!pf || pf.ativo !== true || pf.papel !== "motorista") continue;
        const pn = String(m.mot.nome || m.loginNome).split(/[\s.]+/)[0]; const nomeP = pn.charAt(0).toUpperCase() + pn.slice(1).toLowerCase();
        let fone = String(m.mot.celular).replace(/\D/g, ""); if (!fone.startsWith("55")) fone = "55" + fone;
        const tk = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
        const msg = "🎬 Oi, " + nomeP + "! Aqui é o Ravi, da RF Logística.\n\nEstamos montando os vídeos de divulgação da RF e queremos mostrar o *seu trabalho*. Se puder, grave um *vídeo curto* (15 a 40 segundos) de:\n• o caminhão carregando ou descarregando;\n• uma entrega no cliente;\n• o caminhão estacionado na estrada ou no pátio.\n\n⚠️ *Só grave com o caminhão PARADO.* Nunca filme dirigindo.\nCelular deitado (na horizontal) ou em pé, firme, sem dedo na frente e sem mostrar rosto de cliente.\n\n📲 Mande pelo seu link (vale 14 dias, vai em qualidade máxima):\n" + PAGINA + "?k=" + tk + "\n\nObrigado! 🙌\n\n🤖 _Ravi - RF Logística_";
        if (b.simular) { enviados.push(nomeP + " (simulado)"); continue; }
        await sb.from("estudio_links").insert({ token: tk, login: m.loginNome, nome: nomeP, fone, tipo: "motorista", expira_em: new Date(Date.now() + 14 * 864e5).toISOString() });
        const r = await raviVps("/send-text", "POST", { phone: fone, message: msg });
        if (r.http === 200) enviados.push(nomeP); else erros.push(nomeP + ": " + String(r.j?.error || r.http));
        await new Promise((ok) => setTimeout(ok, 1500));
      }
      return json({ ok: true, enviados, erros });
    }
    // ===================== estudio (usuarios e servidor)
    if (acao === "biblioteca") {
      const { data } = await sb.from("estudio_midias").select("*").order("criado_em", { ascending: false }).limit(300);
      return json({ ok: true, base: BASE.map((m) => ({ ...m, url: GH + m.arq })), midias: data || [], vozes: Object.entries(VOZES).map(([id, v]) => ({ id, nome: v.nome })).concat(Object.entries(PREMIUM).map(([id, v]) => ({ id, nome: v.nome }))) });
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
      if (PREMIUM[vozId]) {   // v18: voz premium e paga -- so master, dentro do teto, registrada
        if (!U.master) return erro("a voz premium é paga — só o login master", 403);
        const letras = cenas.filter((c: any) => c.narracao?.texto && (!alvo || alvo.includes(c.id)) && (alvo || b.refazer || !c.narracao.path || c.narracao.voz !== vozId)).reduce((a: number, c: any) => a + String(c.narracao.texto).length, 0);
        if (letras) { const usd = letras / 1000 * IA_VOZ_USD_1000, custo = await brl(usd); await iaPodeGastar(custo); await sb.from("estudio_ia_uso").insert({ acao: "voz_premium", modelo: "elevenlabs/multilingual-v2", projeto_id: pj.id, custo_usd: usd, custo_brl: custo, status: "feito", pedido_por: U.uid, pedido_nome: U.nome }); }
      }
      await Promise.all(cenas.map(async (c: any, i: number) => {
        if (!c.narracao?.texto) return; if (alvo && !alvo.includes(c.id)) return; if (!alvo && !b.refazer && c.narracao.path && c.narracao.voz === vozId) return;
        cenas[i] = await narrarCena(pj.id, c, vozId, String(b.estilo || plano.voz?.estilo || "")); feitas.push(c.id);
      }));
      const { data: atual } = await sb.from("estudio_projetos").select("plano").eq("id", pj.id).maybeSingle();   // v11: relê e troca só as cenas gravadas agora
      const base = (atual?.plano as any) || plano; const porId: any = {}; cenas.forEach((c: any) => { if (feitas.includes(c.id)) porId[c.id] = c; });
      const novo = { ...base, cenas: (base.cenas || []).map((c: any) => porId[c.id] || c), voz: { ...(base.voz || {}), id: vozId, estilo: b.estilo ?? base.voz?.estilo ?? "" } };
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
    if (acao === "musica_buscar") {   // v13: musicas livres para uso comercial (Openverse: Jamendo, Freesound, Wikimedia) - gratis
      const q = String(b.q || "instrumental").slice(0, 80);
      const u = `https://api.openverse.org/v1/audio/?q=${encodeURIComponent(q)}&license=cc0,pdm,by,by-sa&category=music&page_size=20&page=${Math.max(1, Math.min(12, Number(b.pagina) || 1))}`;
      const r = await fetch(u, { headers: { "User-Agent": "RF-Estudio/1.0 (rflogistica.com.br)" } });
      if (!r.ok) return erro("a busca de músicas não respondeu agora (" + r.status + "). Tente de novo em instantes.");
      const j = await r.json();
      const lista = (j.results || []).filter((x: any) => x.url).map((x: any) => ({ id: x.id, titulo: x.title || "Música", autor: x.creator || "", licenca: (String(x.license || "").toUpperCase() + " " + (x.license_version || "")).trim(), fonte: x.source || x.provider || "", dur: x.duration ? Math.round(x.duration / 1000) : null, url: x.url, tipo: x.filetype || "", credito: `"${x.title}" — ${x.creator} (CC ${String(x.license || "").toUpperCase()} ${x.license_version || ""})`.replace(/\s+\)/, ")") }));
      return json({ ok: true, total: j.result_count || lista.length, lista });
    }
    if (acao === "musica_importar") {   // baixa a musica escolhida para a Biblioteca (com o credito da licenca)
      const id = String(b.id || ""); if (!/^[0-9a-f-]{20,}$/i.test(id)) return erro("música inválida");
      const { data: ja } = await sb.from("estudio_midias").select("id,nome").eq("path", `estudio/midias/musica-${id}.mp3`).maybeSingle(); if (ja) return json({ ok: true, midia: ja, ja: true });
      const r = await fetch(`https://api.openverse.org/v1/audio/${id}/`, { headers: { "User-Agent": "RF-Estudio/1.0 (rflogistica.com.br)" } }); if (!r.ok) return erro("não achei essa música (" + r.status + ")");
      const x = await r.json(); if (!["cc0", "pdm", "by", "by-sa"].includes(String(x.license))) return erro("licença não permite uso comercial em vídeo");
      const a = await fetch(x.url); if (!a.ok) return erro("não consegui baixar o arquivo (" + a.status + ")");
      const bytes = new Uint8Array(await a.arrayBuffer()); if (bytes.length > 25e6) return erro("arquivo muito grande (mais de 25 MB)");
      const ct = a.headers.get("content-type") || "audio/mpeg"; const ext = /ogg/.test(ct) ? "ogg" : /wav/.test(ct) ? "wav" : /flac/.test(ct) ? "flac" : "mp3";
      const path = `estudio/midias/musica-${id}.${ext}`;
      const up = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true }); if (up.error) throw new Error(up.error.message);
      const credito = `"${x.title}" — ${x.creator} (CC ${String(x.license).toUpperCase()} ${x.license_version || ""})`.replace(/\s+\)/, ")").slice(0, 300);
      const { data, error } = await sb.from("estudio_midias").insert({ tipo: "audio", nome: ("🎵 " + String(x.title || "Música")).slice(0, 80), path, duracao: x.duration ? x.duration / 1000 : null, origem: "openverse", autorizada: true, tags: ["musica", String(x.license)], credito: ["cc0", "pdm"].includes(String(x.license)) ? null : credito, licenca: (String(x.license).toUpperCase() + " " + (x.license_version || "")).trim(), criado_por: U.uid || null }).select("id,nome").maybeSingle();
      if (error) throw new Error(error.message);
      return json({ ok: true, midia: data });
    }
    if (acao === "voz_amostra") {   // v11: amostra de cada voz (gera uma vez, depois só reaproveita)
      if (PREMIUM[String(b.voz)]) {   // v18: amostra da voz premium (gera uma vez; centavos)
        const pid = String(b.voz), pp = `estudio/vozes/${pid}-v1.mp3`; const ja2 = await sb.storage.from(BUCKET).createSignedUrl(pp, 3600); if (ja2.data?.signedUrl) return json({ ok: true, url: ja2.data.signedUrl });
        if (!U.master) return erro("a voz premium é paga — só o login master", 403);
        const t = "Olá! Eu sou a voz premium do Estúdio da RF Logística. Transporte e distribuição com frota própria, em toda a Bahia e no Nordeste.";
        const au = await vozPremium(pid, t, ""); const usd = t.length / 1000 * IA_VOZ_USD_1000;
        await sb.from("estudio_ia_uso").insert({ acao: "voz_amostra", modelo: "elevenlabs/multilingual-v2", custo_usd: usd, custo_brl: await brl(usd), status: "feito", pedido_por: U.uid, pedido_nome: U.nome });
        const u2 = await sb.storage.from(BUCKET).upload(pp, au, { contentType: "audio/mpeg", upsert: true }); if (u2.error) throw new Error(u2.error.message);
        return json({ ok: true, url: await assinar(pp, 3600) });
      }
      const id = VOZES[String(b.voz)] ? String(b.voz) : "locutor"; const v = VOZES[id]; const path = `estudio/vozes/${id}-v1.mp3`;
      const ja = await sb.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (ja.data?.signedUrl) return json({ ok: true, url: ja.data.signedUrl });
      const r = await oai("audio/speech", { model: "gpt-4o-mini-tts", voice: v.voice, input: "Olá! Eu sou uma das vozes do Estúdio da RF Logística. Transporte e distribuição com frota própria, em toda a Bahia e no Nordeste.", instructions: v.base + " Português do Brasil." + HUMANO, response_format: "mp3" });
      const up = await sb.storage.from(BUCKET).upload(path, new Uint8Array(await r.arrayBuffer()), { contentType: "audio/mpeg", upsert: true }); if (up.error) throw new Error(up.error.message);
      return json({ ok: true, url: await assinar(path, 3600) });
    }
    if (acao === "melhorar") {   // ✨ Melhorar video: gratis, roda no nosso servidor (FFmpeg); o original nao e alterado
      const { data: m } = await sb.from("estudio_midias").select("*").eq("id", b.midia_id).maybeSingle();
      if (!m || m.tipo !== "video" || !m.path) return erro("escolha um vídeo enviado pela equipe");
      if (Number(m.duracao) > 180) return erro("vídeo muito longo para melhorar de uma vez (máx. 3 min) — corte em partes");
      const { count } = await sb.from("estudio_renders").select("id", { count: "exact", head: true }).eq("formato", "melhorar").in("status", ["fila", "renderizando"]).eq("receita->>midia_id", m.id);
      if (count) return erro("este vídeo já está na fila de melhoria");
      const op = b.opcoes || {}; const opcoes: any = {}; for (const k of ["estabilizar", "ruido", "cor", "nitidez", "hd", "audio"]) opcoes[k] = op[k] !== false;
      const { data, error } = await sb.from("estudio_renders").insert({ projeto_id: null, formato: "melhorar", status: "fila", pedido_por: U.uid, pedido_nome: U.nome,
        receita: { tipo: "melhorar", midia_id: m.id, nome: m.nome, autorizada: m.autorizada, tags: m.tags || [], opcoes } }).select("id,status").maybeSingle();
      if (error) throw new Error(error.message);
      return json({ ok: true, render: data });
    }
    // v17.1: traz para a Biblioteca um video gerado pela IA de video contratada (Higgsfield) -- so desse endereco, so master/servidor
    if (acao === "midia_importar_url") {
      if (!U.master) return erro("só o login master", 403);
      const url = String(b.url || ""); if (!/^https:\/\/d8j0ntlcm91z4\.cloudfront\.net\/[A-Za-z0-9_\/.-]+\.(mp4|jpg|png)$/.test(url)) return erro("endereço não permitido");
      const r = await fetch(url); if (!r.ok) return erro("não baixei: " + r.status);
      const buf = new Uint8Array(await r.arrayBuffer()); if (buf.length > 60e6) return erro("arquivo grande demais");
      const ext = url.split(".").pop()!; const path = `estudio/midias/ia-${crypto.randomUUID()}.${ext}`;
      const up = await sb.storage.from(BUCKET).upload(path, buf, { contentType: ext === "mp4" ? "video/mp4" : "image/" + (ext === "jpg" ? "jpeg" : ext), upsert: false }); if (up.error) throw new Error(up.error.message);
      const { data: m, error } = await sb.from("estudio_midias").insert({ tipo: ext === "mp4" ? "video" : "imagem", nome: String(b.nome || "Cena IA").slice(0, 70), path, duracao: Number(b.duracao) || null, largura: Number(b.largura) || null, altura: Number(b.altura) || null,
        origem: "ia", autorizada: true, tags: Array.from(new Set(["ia", ...((Array.isArray(b.tags) ? b.tags : []).map(String).slice(0, 5))])), criado_por: U.uid }).select("id").single();
      if (error) throw new Error(error.message);
      return json({ ok: true, midia_id: m.id, path });
    }
    // ===================== v19: 🎬 Diretor IA (robo que faz o video inteiro; nunca publica)
    if (acao === "diretor_passo") {   // cron estudio-diretor (a cada minuto) ou o app logo depois de criar
      if (U.tipo !== "servidor" && !U.master) return erro("sem permissão", 403);
      const t = diretorPasso(b.id ? String(b.id) : undefined);
      // @ts-ignore EdgeRuntime
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) { EdgeRuntime.waitUntil(t); return json({ ok: true, fundo: true }); }
      await t; return json({ ok: true });
    }
    if (acao === "diretor_criar") {
      if (!U.master) return erro("só o login master usa o Diretor IA (ele gasta com a IA de vídeo)", 403);
      const pedido = String(b.pedido || "").trim(); if (pedido.length < 15) return erro("escreva o que o vídeo deve dizer (pelo menos uma frase)");
      const limite = Math.max(10, Math.min(60, Number(b.limite) || 40));
      const g = await iaGastoMes(); if (g + limite > IA_TETO) return erro(`o teto do mês não comporta este vídeo: já foram R$ ${g.toFixed(2).replace(".", ",")} de R$ ${IA_TETO},00`);
      const { count } = await sb.from("estudio_diretor").select("id", { count: "exact", head: true }).eq("status", "rodando"); if ((count || 0) >= 2) return erro("já tem 2 vídeos sendo feitos pelo Diretor — espere um terminar");
      const { data: J, error } = await sb.from("estudio_diretor").insert({ pedido: pedido.slice(0, 1500), publico: String(b.publico || "dono de transportadora").slice(0, 60), duracao: [30, 45, 60].includes(Number(b.duracao)) ? Number(b.duracao) : 45,
        formato: ["9:16", "1:1", "16:9", "4:5"].includes(b.formato) ? b.formato : "9:16", qualidade: b.qualidade === "bom" ? "bom" : "cinema", limite_brl: limite, pedido_por: U.uid, pedido_nome: U.nome, log: [{ em: new Date().toISOString(), t: "Pedido recebido. Começando pelo roteiro." }] }).select("*").single();
      if (error) throw new Error(error.message);
      const t = diretorPasso(J.id);
      // @ts-ignore EdgeRuntime
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(t);
      return json({ ok: true, diretor: J });
    }
    if (acao === "diretor_lista") {
      const { data } = await sb.from("estudio_diretor").select("id,criado_em,status,etapa,pedido,limite_brl,projeto_id,critica,render_id,rodada").order("criado_em", { ascending: false }).limit(12);
      const ids = (data || []).map((x: any) => x.projeto_id).filter(Boolean); const tit: any = {};
      if (ids.length) { const { data: ps } = await sb.from("estudio_projetos").select("id,titulo").in("id", ids); (ps || []).forEach((p: any) => tit[p.id] = p.titulo); }
      return json({ ok: true, lista: await Promise.all((data || []).map(async (x: any) => ({ ...x, titulo: tit[x.projeto_id] || null, gasto: await dirGasto(x.projeto_id) }))), gasto_mes: await iaGastoMes(), teto: IA_TETO });
    }
    if (acao === "diretor_ver") { const { data: J } = await sb.from("estudio_diretor").select("*").eq("id", b.id).maybeSingle(); if (!J) return erro("não encontrado", 404); return json({ ok: true, diretor: await diretorVer(J) }); }
    if (acao === "diretor_parar") {
      if (!U.master) return erro("só o login master", 403);
      await sb.from("estudio_diretor").update({ status: "parado", trava: null }).eq("id", b.id).eq("status", "rodando");
      const { data: J } = await sb.from("estudio_diretor").select("*").eq("id", b.id).maybeSingle(); if (J) await dirLog(J, "Parado pelo Renato.");
      return json({ ok: true });
    }
    if (acao === "diretor_mudar") {   // "🔁 Pedir mudança": a IA decide o que mexer (fala e/ou imagem) e o Diretor refaz so isso
      if (!U.master) return erro("só o login master", 403);
      const { data: J } = await sb.from("estudio_diretor").select("*").eq("id", b.id).maybeSingle(); if (!J || !J.projeto_id) return erro("não encontrado", 404);
      if (J.status === "rodando") return erro("o Diretor ainda está trabalhando neste vídeo");
      const texto = String(b.texto || "").trim(); if (texto.length < 5) return erro("diga o que mudar");
      const pj = await dirPlano(J); const cs = (pj.plano as any).cenas || [];
      const r = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: "Você ajusta um comercial já pronto conforme o pedido do dono. Para cada cena que precisa mudar, diga a nova fala (se a fala muda; 12-18 palavras) e/ou o novo visual (se a imagem muda; sem texto/logo/placa). Mude o MÍNIMO. Responda APENAS JSON {\"mudar\":[{\"cena\":n,\"fala\":\"\",\"visual\":\"\"}],\"resumo\":\"o que vou mudar, 1 frase\"}" }, { role: "user", content: "PEDIDO: " + texto + "\nCENAS:\n" + cs.map((c: any, i: number) => `${i + 1}. [${c.tipo}] fala: ${c.narracao?.texto || ""} | visual: ${c.ia?.texto || "-"}`).join("\n") }] });
      const R = JSON.parse((await r.json()).choices[0].message.content);
      const est = J.cenas || {}; let nf = 0, nv = 0;
      await dirSalvarPlano(J.projeto_id, (pl) => ({ ...pl, cenas: (pl.cenas || []).map((c: any, i: number) => { const m = (R.mudar || []).find((x: any) => Number(x.cena) === i + 1); if (!m) return c; let y = { ...c };
        if (m.fala && m.fala.trim() && m.fala.trim() !== c.narracao?.texto) { y.narracao = { texto: m.fala.trim() }; nf++; }
        if (m.visual && m.visual.trim() && c.ia?.diretor) { y.ia = { ...c.ia, texto: m.visual.trim() }; est[c.id] = { ...(est[c.id] || {}), refazer_img: true, escolhida: false, uso: null, anim_ok: false, refazer_anim: true, tent_img: 0, tent_anim: 0, ajuste: "" }; nv++; }
        return y; }) }));
      const extra = 20; await sb.from("estudio_diretor").update({ status: "rodando", etapa: "narrar", cenas: est, rodada: 0, erros: 0, limite_brl: Number(J.limite_brl) + extra, trava: null }).eq("id", J.id);
      J.log = J.log || []; await dirLog(J, `Mudança pedida: “${texto.slice(0, 120)}” → ${R.resumo || ""} (${nf} fala(s), ${nv} imagem(ns); limite +R$ ${extra}).`);
      const t = diretorPasso(J.id);
      // @ts-ignore EdgeRuntime
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(t);
      return json({ ok: true, resumo: R.resumo || "", falas: nf, imagens: nv });
    }
    // ===================== v18: 🎬 cena com IA (fal.ai) -- custo antes; teto R$ 150/mes; so o master gasta
    if (acao === "ia_info") {
      const { pj, c } = await iaProjCena(String(b.projeto_id), String(b.cena_id));
      const seg = iaDurCena(c, pj.plano);
      // confere animacoes que ainda estao na fila (se ninguem ficou olhando a tela)
      const { data: pend } = await sb.from("estudio_ia_uso").select("id").eq("projeto_id", pj.id).in("status", ["fila"]).limit(5);
      for (const p of pend || []) { try { await iaConferir(p.id); } catch (_) { /* */ } }
      const { c: c2 } = await iaProjCena(String(b.projeto_id), String(b.cena_id));
      const ia: any = c2.ia || {};
      if (!ia.texto && b.gerar_texto !== false) { ia.texto = await iaTextoCena(pj, c2); await iaSalvarCena(pj.id, c2.id, (x) => ({ ...x, ia: { ...(x.ia || {}), texto: ia.texto, personagem: (x.ia && x.ia.personagem) || "ravi" } })); }
      const imgs = await Promise.all((ia.imagens || []).map((p: string) => assinar(p, 3600).catch(() => null)));
      const { data: ult } = await sb.from("estudio_ia_uso").select("id,status,qualidade,erro,criado_em,custo_brl").eq("projeto_id", pj.id).eq("cena_id", c2.id).eq("acao", "animar").order("criado_em", { ascending: false }).limit(1);
      return json({ ok: true, cena: { id: c2.id, tipo: c2.tipo, titulo: c2.titulo, fala: c2.narracao?.texto || "", segundos: seg }, ia: { ...ia, personagem: ia.personagem || "ravi", urls: imgs }, animacao: ult && ult[0] || null,
        precos: await iaPrecos(seg), gasto_mes: await iaGastoMes(), teto: IA_TETO, cotacao: +(await cotacao()).toFixed(2), pode_gastar: !!U.master, formato: pj.formato });
    }
    if (acao === "ia_texto") {   // so salva o texto que o Renato mudou (gratis)
      const c = await iaSalvarCena(String(b.projeto_id), String(b.cena_id), (x) => ({ ...x, ia: { ...(x.ia || {}), texto: String(b.texto || "").slice(0, 900), personagem: b.personagem === "nenhum" ? "nenhum" : "ravi" } }));
      return json({ ok: true, ia: c?.ia });
    }
    if (acao === "ia_imagens") {   // passo 1: 3 imagens da cena (ou 1 com ajuste)
      if (!U.master) return erro("só o login master gasta com a IA de vídeo", 403);
      const { pj, c } = await iaProjCena(String(b.projeto_id), String(b.cena_id));
      const ia: any = c.ia || {}; const texto = String(b.texto || ia.texto || "").trim(); if (!texto) return erro("escreva o que acontece na cena");
      const personagem = b.personagem === "nenhum" ? "nenhum" : (b.personagem || ia.personagem || "ravi");
      const ajuste = String(b.ajuste || "").trim(); const n = ajuste ? 1 : 3;
      const usd = IA_IMG.usd * n, custo = await brl(usd); await iaPodeGastar(custo);
      const refs: string[] = []; if (personagem === "ravi") refs.push(await raviRef(pj.plano));
      if (ajuste && ia.imagens && ia.escolhida != null && ia.imagens[ia.escolhida]) refs.unshift(await assinar(ia.imagens[ia.escolhida], 3600));
      if (/caminh|baú|bau|frota|estrada|carga/i.test(texto) && refs.length < 3) refs.push(GH + "fotos/frota-4.jpg");
      const corpo: any = { prompt: iaPromptImagem(texto, personagem, pj.formato, ajuste), num_images: n, aspect_ratio: ["9:16", "1:1", "16:9", "4:5"].includes(pj.formato) ? pj.formato : "9:16", output_format: "jpeg", resolution: "1K" };
      corpo.image_urls = refs.length ? refs : [GH + "fotos/estrada-1.jpg"];
      const { data: uso } = await sb.from("estudio_ia_uso").insert({ acao: ajuste ? "imagem_ajuste" : "imagens", modelo: IA_IMG.modelo, projeto_id: pj.id, cena_id: c.id, custo_usd: usd, custo_brl: custo, status: "fila", pedido_por: U.uid, pedido_nome: U.nome }).select("id").single();
      try {
        const j = await falRun(IA_IMG.modelo, corpo);
        const urls: string[] = (j?.images || []).map((x: any) => x.url).filter(Boolean); if (!urls.length) throw new Error("a IA não devolveu imagem (pode ter recusado o texto)");
        const paths: string[] = [];
        for (const u of urls) { const p = `estudio/ia/${pj.id}/${c.id}-${Date.now()}-${paths.length}.jpg`; await baixarPara(u, p, "image/jpeg"); paths.push(p); }
        await sb.from("estudio_ia_uso").update({ status: "feito", resultado: { paths }, atualizado_em: new Date().toISOString() }).eq("id", uso!.id);
        const novo = await iaSalvarCena(pj.id, c.id, (x) => { const old = (x.ia && x.ia.imagens) || []; const imagens = ajuste ? [...old, ...paths].slice(-6) : paths; return { ...x, ia: { ...(x.ia || {}), texto, personagem, imagens, escolhida: ajuste ? imagens.length - 1 : 0 } }; });
        return json({ ok: true, ia: { ...novo.ia, urls: await Promise.all(novo.ia.imagens.map((p: string) => assinar(p, 3600))) }, custo, gasto_mes: await iaGastoMes() });
      } catch (e) { await sb.from("estudio_ia_uso").update({ status: "erro", erro: String((e as Error).message).slice(0, 400) }).eq("id", uso!.id); throw e; }
    }
    if (acao === "ia_escolher") { const c = await iaSalvarCena(String(b.projeto_id), String(b.cena_id), (x) => ({ ...x, ia: { ...(x.ia || {}), escolhida: Math.max(0, Number(b.idx) || 0) } })); return json({ ok: true, ia: c?.ia }); }
    if (acao === "ia_animar") {   // passo 2: anima a imagem escolhida (vai para a fila da fal; ia_estado traz o video para a Biblioteca e poe na cena)
      if (!U.master) return erro("só o login master gasta com a IA de vídeo", 403);
      const q = IA_ANIM[String(b.qualidade)]; if (!q) return erro("escolha a qualidade");
      const { pj, c } = await iaProjCena(String(b.projeto_id), String(b.cena_id));
      const ia: any = c.ia || {}; const img = ia.imagens?.[ia.escolhida ?? 0]; if (!img) return erro("primeiro gere e escolha a imagem da cena");
      const { count } = await sb.from("estudio_ia_uso").select("id", { count: "exact", head: true }).eq("projeto_id", pj.id).eq("cena_id", c.id).eq("acao", "animar").in("status", ["fila", "importando"]);
      if (count) return erro("esta cena já está sendo animada — aguarde");
      const seg0 = iaDurCena(c, pj.plano); const seg = q.fixo ? (seg0 > 6.5 ? 10 : 6) : seg0;
      const usd = +(q.usd_s * seg).toFixed(3), custo = await brl(usd); await iaPodeGastar(custo);
      const mov = "Animate this exact image as a short cinematic shot. Keep the character identical. " + String(ia.texto || "") + " Smooth natural motion, expressive face, subtle camera move. No text on screen.";
      const corpo: any = q.fixo ? { prompt: mov, image_url: await assinar(img, 3600), duration: String(seg), prompt_optimizer: true }
        : { prompt: mov, image_url: await assinar(img, 3600), duration: seg, resolution: q.res, prompt_expansion_mode: "balanced" };
      const f = await falFila(q.modelo, corpo);
      const { data: uso, error } = await sb.from("estudio_ia_uso").insert({ acao: "animar", modelo: q.modelo, projeto_id: pj.id, cena_id: c.id, qualidade: String(b.qualidade), segundos: seg, custo_usd: usd, custo_brl: custo, status: "fila", status_url: f.status_url, response_url: f.response_url, resultado: { request_id: f.request_id, imagem: img }, pedido_por: U.uid, pedido_nome: U.nome }).select("id").single();
      if (error) throw new Error(error.message);
      return json({ ok: true, uso_id: uso.id, custo, segundos: seg, gasto_mes: await iaGastoMes() });
    }
    if (acao === "ia_estado") { const r = await iaConferir(String(b.uso_id)); return json({ ok: true, ...r }); }
    if (acao === "ia_gastos") {
      const { data } = await sb.from("estudio_ia_uso").select("criado_em,acao,qualidade,segundos,custo_brl,status,pedido_nome,projeto_id").order("criado_em", { ascending: false }).limit(40);
      return json({ ok: true, lista: data || [], gasto_mes: await iaGastoMes(), teto: IA_TETO, cotacao: +(await cotacao()).toFixed(2) });
    }
    // ===================== v18: ⚡ ritmo e passagem (gratis; roda no servidor de video da RF)
    if (acao === "ritmo_ouvir") {   // amostra da 1a fala com a voz/forca escolhidas (nao grava no projeto)
      const { data: pj } = await sb.from("estudio_projetos").select("id,plano").eq("id", b.projeto_id).maybeSingle(); if (!pj) return erro("projeto não encontrado", 404);
      const c = ((pj.plano as any)?.cenas || []).find((x: any) => x.narracao?.texto); if (!c) return erro("o vídeo não tem fala");
      const vozId = String(b.voz || "locutor"); const estilo = FORCA[String(b.forca)] || "";
      if (PREMIUM[vozId] && !U.master) return erro("a voz premium é paga — só o login master", 403);
      const texto = String(c.narracao.texto).slice(0, 400); let audio: Uint8Array;
      if (PREMIUM[vozId]) { const custo = await brl(texto.length / 1000 * IA_VOZ_USD_1000); await iaPodeGastar(custo); audio = await vozPremium(vozId, texto, estilo); await sb.from("estudio_ia_uso").insert({ acao: "voz_amostra", modelo: "elevenlabs/multilingual-v2", projeto_id: pj.id, custo_usd: texto.length / 1000 * IA_VOZ_USD_1000, custo_brl: custo, status: "feito", pedido_por: U.uid, pedido_nome: U.nome }); }
      else { const v = VOZES[vozId] || VOZES.locutor; const r = await oai("audio/speech", { model: "gpt-4o-mini-tts", voice: v.voice, input: texto, instructions: v.base + " Português do Brasil." + HUMANO + " " + estilo, response_format: "mp3" }); audio = new Uint8Array(await r.arrayBuffer()); }
      const path = `estudio/vozes/teste-${crypto.randomUUID()}.mp3`; const up = await sb.storage.from(BUCKET).upload(path, audio, { contentType: "audio/mpeg" }); if (up.error) throw new Error(up.error.message);
      return json({ ok: true, url: await assinar(path, 3600), velocidade: Number(b.velocidade) || 1 });
    }
    if (acao === "ritmo_aplicar") {
      const { data: pj } = await sb.from("estudio_projetos").select("*").eq("id", b.projeto_id).maybeSingle(); if (!pj) return erro("projeto não encontrado", 404);
      const R = b.ritmo || {}; const PAS = ["corte", "rapida", "zoom", "deslizar", "flash", "misturar", "manter"];
      const ritmo = { sem_silencio: R.sem_silencio !== false, respiro: Math.max(0.1, Math.min(1.2, Number(R.respiro) || 0.3)), passagem: PAS.includes(R.passagem) ? R.passagem : "rapida", som: ["whoosh", "batida", "nenhum"].includes(R.som) ? R.som : "whoosh", batida: R.batida !== false, ducking: R.ducking !== false, aplicado_em: new Date().toISOString() };
      const TR: Record<string, [string, number]> = { corte: ["corte", 0.04], rapida: ["fade", 0.2], zoom: ["zoomin", 0.35], deslizar: ["slideleft", 0.3], flash: ["flash", 0.04] };
      const mix = ["rapida", "zoom", "deslizar", "flash"];
      const plano: any = pj.plano || {};
      let cenas = (plano.cenas || []).map((c: any, i: number) => { if (!i || ritmo.passagem === "manter") return c; const k = ritmo.passagem === "misturar" ? mix[(i - 1) % mix.length] : ritmo.passagem; return { ...c, transicao: TR[k][0], trans_dur: TR[k][1] }; });
      const V = b.voz || {}; const vozId = String(V.id || plano.voz?.id || "locutor"); const estilo = V.forca ? (FORCA[String(V.forca)] || "") : (plano.voz?.estilo || "");
      const velocidade = Math.max(0.85, Math.min(1.3, Number(V.velocidade) || Number(plano.voz?.velocidade) || 1));
      if (PREMIUM[vozId] && !U.master) return erro("a voz premium é paga — só o login master", 403);
      const mudouVoz = vozId !== (plano.voz?.id || "locutor") || estilo !== (plano.voz?.estilo || "") || cenas.some((c: any) => c.narracao?.texto && !c.narracao?.path);
      let regravadas = 0;
      if (mudouVoz) {
        if (PREMIUM[vozId]) { const letras = cenas.reduce((a: number, c: any) => a + String(c.narracao?.texto || "").length, 0); const custo = await brl(letras / 1000 * IA_VOZ_USD_1000); await iaPodeGastar(custo); await sb.from("estudio_ia_uso").insert({ acao: "voz_premium", modelo: "elevenlabs/multilingual-v2", projeto_id: pj.id, custo_usd: letras / 1000 * IA_VOZ_USD_1000, custo_brl: custo, status: "feito", pedido_por: U.uid, pedido_nome: U.nome }); }
        cenas = await Promise.all(cenas.map(async (c: any) => { if (!c.narracao?.texto) return c; regravadas++; const n = await narrarCena(pj.id, c, vozId, estilo); return { ...n, narracao: { ...n.narracao, velocidade: undefined } }; }));
      }
      cenas = cenas.map((c: any) => c.narracao ? { ...c, narracao: { ...c.narracao, velocidade: undefined } } : c);
      const novo = { ...plano, cenas, ritmo, voz: { ...(plano.voz || {}), id: vozId, estilo, velocidade, forca: V.forca || plano.voz?.forca || "" } };
      await sb.from("estudio_projetos").update({ plano: novo, atualizado_em: new Date().toISOString() }).eq("id", pj.id);
      let render = null;
      if (b.montar !== false) { const { data } = await sb.from("estudio_renders").insert({ projeto_id: pj.id, formato: pj.formato, status: "fila", pedido_por: U.uid, pedido_nome: U.nome }).select("id,formato,status").single(); render = data; }
      return json({ ok: true, plano: novo, regravadas, render });
    }
    // ===================== v17: 💡 referencias (so para estudo; apaga em 15 dias)
    if (acao === "ref_lista") {
      limparReferencias().catch(() => null);
      const { data } = await sb.from("estudio_projetos").select("id,titulo,status,plano,criado_em,criado_nome").eq("tipo", "referencia").order("criado_em", { ascending: false }).limit(40);
      const L = [] as any[];
      for (const p of data || []) { const r: any = (p as any).plano?.ref || {}; let capa = null; if (r.capa_path) { try { capa = await assinar(r.capa_path, 3600); } catch (_) { /* */ } }
        L.push({ id: p.id, titulo: p.titulo, status: p.status, criado_em: p.criado_em, capa, ref: { url: r.url, plataforma: r.plataforma, estado: r.estado, etapa: r.etapa, erro: r.erro, dur: r.dur, apaga_em: r.apaga_em, apagado_em: r.apagado_em, projeto_nosso: r.projeto_nosso || null, tags: r.raiox?.tags || [], nota: r.raiox?.nota ?? null, titulo: r.raiox?.titulo || null } }); }
      return json({ ok: true, lista: L, dias: REF_DIAS });
    }
    if (acao === "ref_upload_url") {   // gravacao de tela do celular (quando o link nao baixa): vai direto para a pasta de referencias, nunca para a Biblioteca
      const nome = String(b.nome || "tela.mp4").toLowerCase(); const ext = (nome.match(/\.(mp4|mov|webm|m4v|mkv)$/) || [".mp4"])[0];
      const path = `estudio/referencias/envio-${crypto.randomUUID()}${ext}`;
      const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path); if (error) throw new Error(error.message);
      return json({ ok: true, path, url: data.signedUrl, token: data.token });
    }
    if (acao === "ref_criar") {
      const url = String(b.url || "").trim(), up = String(b.upload_path || "");
      let plataforma = "";
      if (up) { if (!/^estudio\/referencias\/envio-[0-9a-f-]{36}\.(mp4|mov|webm|m4v|mkv)$/.test(up)) return erro("envio inválido"); plataforma = "Gravação de tela"; }
      else { if (!/^https:\/\/[^\s]+$/.test(url) || url.length > 600) return erro("cole o link completo do vídeo (começando com https://)"); plataforma = REF_PLAT(url); if (!plataforma) return erro("por enquanto só links do Instagram, Facebook ou LinkedIn"); }
      const { count } = await sb.from("estudio_renders").select("id", { count: "exact", head: true }).eq("formato", "referencia").in("status", ["fila", "renderizando"]);
      if ((count || 0) >= 3) return erro("já tem 3 referências sendo baixadas — aguarde terminar");
      const apaga = new Date(Date.now() + REF_DIAS * 864e5).toISOString();
      const ref = { url: url || null, upload_path: up || null, plataforma, estado: "baixando", etapa: up ? "Preparando a gravação de tela…" : "Baixando o vídeo para estudo…", apaga_em: apaga, criado_em: new Date().toISOString() };
      const { data: pj, error } = await sb.from("estudio_projetos").insert({ titulo: "Referência (" + plataforma + ")", tipo: "referencia", formato: "9:16", plano: { ref }, status: "analisando", origem: "referencia", briefing: "", criado_por: U.uid, criado_nome: U.nome }).select("id").single();
      if (error) throw new Error(error.message);
      const { error: e2 } = await sb.from("estudio_renders").insert({ projeto_id: pj.id, formato: "referencia", status: "fila", pedido_por: U.uid, pedido_nome: U.nome, receita: { tipo: "referencia", projeto_id: pj.id, url: url || null, upload_path: up || null } });
      if (e2) throw new Error(e2.message);
      return json({ ok: true, projeto_id: pj.id });
    }
    if (acao === "ref_estado") {
      const { data: pj } = await sb.from("estudio_projetos").select("*").eq("id", b.projeto_id).eq("tipo", "referencia").maybeSingle(); if (!pj) return erro("referência não encontrada", 404);
      const r: any = (pj.plano as any)?.ref || {}; let video = null, capa = null;
      if (r.video_path) { try { video = await assinar(r.video_path, 3 * 3600); } catch (_) { /* */ } }
      if (r.capa_path) { try { capa = await assinar(r.capa_path, 3 * 3600); } catch (_) { /* */ } }
      const { data: rs } = await sb.from("estudio_renders").select("id,status,progresso,etapa,erro").eq("projeto_id", pj.id).order("pedido_em", { ascending: false }).limit(1);
      return json({ ok: true, projeto: { id: pj.id, titulo: pj.titulo, status: pj.status, ref: r }, video, capa, job: (rs || [])[0] || null });
    }
    if (acao === "ref_refazer") {
      const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", b.projeto_id).eq("tipo", "referencia").maybeSingle(); const r: any = (pj?.plano as any)?.ref;
      if (!r) return erro("referência não encontrada", 404); if (!r.folha_path && !r.audio_path) return erro("o vídeo já foi apagado (15 dias) — estude de novo pelo link");
      // @ts-ignore EdgeRuntime
      const t = analisarReferencia(String(b.projeto_id)); if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(t); else await t;
      return json({ ok: true });
    }
    if (acao === "ref_apagar") {
      const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", b.projeto_id).eq("tipo", "referencia").maybeSingle(); if (!pj) return erro("referência não encontrada", 404);
      const r: any = (pj.plano as any)?.ref || {}; const arqs = [r.video_path, r.audio_path, r.folha_path, r.capa_path, r.upload_path].filter(Boolean);
      if (arqs.length) await sb.storage.from(BUCKET).remove(arqs);
      await sb.from("estudio_projetos").delete().eq("id", b.projeto_id).eq("tipo", "referencia");
      return json({ ok: true });
    }
    // marcar uma CENA (inicio/fim): a IA descreve o que se ve e diz como fazer a NOSSA cena
    if (acao === "ref_cena") {
      const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", b.projeto_id).eq("tipo", "referencia").maybeSingle(); const r: any = (pj?.plano as any)?.ref;
      if (!r || r.estado !== "pronto") return erro("o raio-x ainda não terminou");
      const D = Number(r.dur) || 0; const ini = Math.max(0, Math.min(D, Number(b.ini) || 0)), fim = Math.max(0, Math.min(D, Number(b.fim) || 0));
      if (fim - ini < 0.5) return erro("marque um trecho de pelo menos meio segundo");
      const rx = r.raiox || {}; const sobre = (rx.cenas || []).filter((c: any) => c.fim > ini && c.ini < fim);
      const fala = (r.transcricao?.blocos || []).filter((t: string) => { const m = t.match(/^\[([\d.]+)-([\d.]+)\]/); return m && Number(m[2]) > ini && Number(m[1]) < fim; }).join("\n");
      const sys = `Você ajuda a RF Logística a fazer uma cena PRÓPRIA inspirada numa cena de referência de outra empresa, para vídeo do Rodavia 360 (gestão de frota) ou da RF (transporte na Bahia/Nordeste).
Responda APENAS JSON: {"descricao":"o que se vê na cena de referência (enquadramento, ação, câmera) sem marca/nome","titulo":"texto curto NOSSO para a tela (até 6 palavras)","narracao":"o que NÓS falamos (1-2 frases, texto 100% nosso)","gravar":"o que a equipe da RF deve gravar para ocupar essa cena (com caminhão da RF, tela do Rodavia 360, motorista, escritório...) — 1 frase prática"}
A NOSSA cena fala SEMPRE de transportadora/frota e de UM benefício real do Rodavia 360 (custo e lucro por viagem, Torre de Controle com rastreamento, diesel e KM, manutenção por caminhão, CT-e/MDF-e, robô Ravi no WhatsApp, app do motorista) — nunca do produto ou assunto da referência; da referência vem só o jeito de mostrar (enquadramento, ação, ritmo). Nunca copie frases da referência nem cite a outra empresa. Nunca invente números, clientes ou placas.`;
      const ctx = `CENA MARCADA: ${ini.toFixed(1)} s a ${fim.toFixed(1)} s (${(fim - ini).toFixed(1)} s)\nO QUE A ANÁLISE VIU NESSE TRECHO: ${sobre.map((c: any) => c.descricao + (c.fala ? " | fala: " + c.fala : "")).join(" || ") || "(sem descrição)"}\nFALA NO TRECHO:\n${fala || "(sem fala)"}`;
      const resp = await oai("chat/completions", { model: "gpt-5.4-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: ctx }] });
      const j = await resp.json(); let o: any = {}; try { o = JSON.parse(j.choices[0].message.content); } catch (_) { o = {}; }
      const cena = { id: gid(), ini: +ini.toFixed(2), fim: +fim.toFixed(2), descricao: String(o.descricao || sobre[0]?.descricao || "").slice(0, 300), titulo: String(o.titulo || "").slice(0, 60), narracao: String(o.narracao || "").slice(0, 400), gravar: String(o.gravar || "").slice(0, 240), midia_id: null, em: new Date().toISOString() };
      const nr = await salvarRef(String(b.projeto_id), (x) => ({ ...x, marcadas: [...(x.marcadas || []), cena].slice(-20) }));
      return json({ ok: true, cena, marcadas: nr.marcadas });
    }
    if (acao === "ref_cena_tirar") { const nr = await salvarRef(String(b.projeto_id), (x) => ({ ...x, marcadas: (x.marcadas || []).filter((c: any) => c.id !== b.cena_id) })); return json({ ok: true, marcadas: nr.marcadas }); }
    // nosso projeto com a estrutura da referencia (cria uma vez; depois so devolve)
    const refNosso = async (refId: string) => {
      const { data: pj } = await sb.from("estudio_projetos").select("titulo,plano").eq("id", refId).eq("tipo", "referencia").maybeSingle(); const r: any = (pj?.plano as any)?.ref;
      if (!r || r.estado !== "pronto") throw new Error("o raio-x ainda não terminou");
      if (r.projeto_nosso) { const { data: ex } = await sb.from("estudio_projetos").select("id").eq("id", r.projeto_nosso).maybeSingle(); if (ex) return { id: ex.id as string, r }; }
      const plano = planoNosso(r);
      const { data: np, error } = await sb.from("estudio_projetos").insert({ titulo: ("Nossa versão — " + String(r.raiox?.titulo || "referência")).slice(0, 70), tipo: "demo", formato: "9:16", plano, status: "rascunho", origem: "referencia", briefing: "Estrutura de referência (só a ideia; texto e imagens 100% nossos). Referência " + refId, criado_por: U.uid, criado_nome: U.nome, diretor: "Referências" }).select("id").single();
      if (error) throw new Error(error.message);
      await salvarRef(refId, (x) => ({ ...x, projeto_nosso: np.id }));
      return { id: np.id as string, r };
    };
    if (acao === "ref_nosso_projeto") { const n = await refNosso(String(b.projeto_id)); return json({ ok: true, projeto_id: n.id }); }
    // usar a NOSSA gravacao numa cena: entra no lugar da cena (mesma duracao) e, se pedido, passa pelo ✨ Melhorar (luz, cor, estabilizar, ruido, audio)
    if (acao === "ref_cena_usar") {
      const { data: m } = await sb.from("estudio_midias").select("id,tipo,path,nome,autorizada,tags,duracao,origem").eq("id", b.midia_id).maybeSingle();
      if (!m || !["video", "imagem"].includes(m.tipo)) return erro("escolha uma gravação ou foto NOSSA da Biblioteca");
      const n = await refNosso(String(b.projeto_id)); const r = n.r;
      const marc = (r.marcadas || []).find((c: any) => c.id === b.cena_id); const rc = marc || (r.raiox?.cenas || []).find((c: any) => c.id === b.cena_id);
      if (!rc) return erro("cena não encontrada");
      const { data: np } = await sb.from("estudio_projetos").select("plano").eq("id", n.id).maybeSingle(); const pl: any = np?.plano || {}; const cenas: any[] = pl.cenas || [];
      // cena do nosso projeto que mais se sobrepoe ao trecho
      let alvo = -1, melhor = -1;
      cenas.forEach((c: any, i: number) => { if (!c.ref_cena) return; const rcx = (r.raiox?.cenas || []).find((x: any) => x.id === c.ref_cena); if (!rcx) return; const ov = Math.min(rcx.fim, rc.fim) - Math.max(rcx.ini, rc.ini); if (ov > melhor) { melhor = ov; alvo = i; } });
      if (alvo < 0) return erro("não achei o lugar dessa cena no nosso vídeo");
      const d = Math.max(1.5, Math.min(15, +(rc.fim - rc.ini).toFixed(1))); const antes = cenas[alvo];
      cenas[alvo] = { ...antes, tipo: "midia", midia: { ref: m.id }, dur: d, ajuste: "auto", velocidade: 1, titulo: marc?.titulo || antes.titulo, subtitulo: "", ...(marc?.narracao ? { narracao: { texto: marc.narracao } } : {}) };
      await sb.from("estudio_projetos").update({ plano: { ...pl, cenas }, atualizado_em: new Date().toISOString() }).eq("id", n.id);
      if (marc) await salvarRef(String(b.projeto_id), (x) => ({ ...x, marcadas: (x.marcadas || []).map((c: any) => c.id === marc.id ? { ...c, midia_id: m.id, nosso_cena: antes.id } : c) }));
      let melhora = null;
      if (b.melhorar !== false && m.tipo === "video" && m.path && Number(m.duracao || 0) <= 180) {
        const { data: jr } = await sb.from("estudio_renders").insert({ projeto_id: null, formato: "melhorar", status: "fila", pedido_por: U.uid, pedido_nome: U.nome,
          receita: { tipo: "melhorar", midia_id: m.id, nome: m.nome, autorizada: m.autorizada, tags: m.tags || [], opcoes: { estabilizar: true, ruido: true, cor: true, nitidez: true, hd: true, audio: true }, ref_troca: { projeto_id: n.id, cena_id: antes.id } } }).select("id").maybeSingle();
        melhora = jr?.id || null;
      }
      return json({ ok: true, projeto_id: n.id, cena_id: antes.id, melhora });
    }
    // ===================== v16: 🎙️ minha gravacao
    if (acao === "gravacao_criar") {
      const { data: m } = await sb.from("estudio_midias").select("*").eq("id", b.midia_id).maybeSingle();
      if (!m || m.tipo !== "video" || !m.path) return erro("escolha um vídeo gravado (enviado ao Estúdio)");
      if (Number(m.duracao) > 600) return erro("gravação muito longa (máx. 10 min) — grave em partes");
      const formato = ["9:16", "1:1", "16:9", "4:5"].includes(b.formato) ? b.formato : (Number(m.largura) > Number(m.altura) ? "16:9" : "9:16");
      const g = { midia_id: m.id, estado: "extraindo", etapa: "Separando a sua fala do vídeo…", passo: 2, ajustes: { ...AJ_PADRAO, formato }, criado_em: new Date().toISOString() };
      const { data: pj, error } = await sb.from("estudio_projetos").insert({ titulo: String(b.titulo || "Minha gravação").slice(0, 70), tipo: "gravacao", formato, plano: { gravacao: g }, status: "analisando", origem: "gravacao", briefing: "", criado_por: U.uid, criado_nome: U.nome }).select("*").single();
      if (error) throw new Error(error.message);
      const { error: e2 } = await sb.from("estudio_renders").insert({ projeto_id: pj.id, formato: "audio", status: "fila", pedido_por: U.uid, pedido_nome: U.nome, receita: { tipo: "audio", midia_id: m.id, projeto_id: pj.id } });
      if (e2) throw new Error(e2.message);
      return json({ ok: true, projeto: pj });
    }
    if (acao === "gravacao_estado") {
      const { data: pj } = await sb.from("estudio_projetos").select("*").eq("id", b.projeto_id).maybeSingle(); if (!pj) return erro("gravação não encontrada", 404);
      const { data: rs } = await sb.from("estudio_renders").select("id,formato,status,progresso,etapa,erro,duracao,video_path,capa_path,pedido_em,concluido_em").eq("projeto_id", pj.id).order("pedido_em", { ascending: false }).limit(6);
      const ult = (rs || []).find((x: any) => x.formato !== "audio") || null;
      let video = null, capa = null; if (ult && ult.status === "pronto" && ult.video_path) { try { video = await assinar(ult.video_path); capa = ult.capa_path ? await assinar(ult.capa_path) : null; } catch (_) { /* */ } }
      const g: any = pj.plano?.gravacao || {}; let original = null; try { const o = await refUrl(g.midia_id); original = o?.url || null; } catch (_) { /* */ }
      return json({ ok: true, projeto: pj, renders: rs || [], ultimo: ult, video, capa, original, nota_minima: NOTA_MIN });
    }
    if (acao === "gravacao_salvar") {
      const { data: pj } = await sb.from("estudio_projetos").select("plano,tipo").eq("id", b.projeto_id).maybeSingle(); if (!pj || pj.tipo !== "gravacao") return erro("gravação não encontrada", 404);
      const g: any = { ...((pj.plano as any)?.gravacao || {}) }; const n = b.gravacao || {};
      for (const k of ["cortes", "frases", "telas", "passo"]) if (n[k] !== undefined) g[k] = n[k];
      if (n.ajustes) g.ajustes = { ...AJ_PADRAO, ...(g.ajustes || {}), ...n.ajustes };
      const up: any = { plano: { ...(pj.plano as any), gravacao: g }, atualizado_em: new Date().toISOString() };
      if (b.titulo) up.titulo = String(b.titulo).slice(0, 70); if (n.ajustes?.formato && ["9:16", "1:1", "16:9", "4:5"].includes(n.ajustes.formato)) up.formato = n.ajustes.formato;
      await sb.from("estudio_projetos").update(up).eq("id", b.projeto_id);
      return json({ ok: true, gravacao: g });
    }
    if (acao === "gravacao_reanalisar") {
      const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", b.projeto_id).maybeSingle(); const g: any = (pj?.plano as any)?.gravacao; if (!g?.audio_path) return erro("a fala ainda não foi separada");
      // @ts-ignore EdgeRuntime
      const t = analisarGravacao(b.projeto_id); if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(t); else await t;
      return json({ ok: true });
    }
    if (acao === "gravacao_render") {
      const { data: pj } = await sb.from("estudio_projetos").select("id,formato,plano,tipo").eq("id", b.projeto_id).maybeSingle(); if (!pj || pj.tipo !== "gravacao") return erro("gravação não encontrada", 404);
      const g: any = (pj.plano as any)?.gravacao || {}; if (g.estado !== "pronto") return erro("a análise da fala ainda não terminou");
      const { count } = await sb.from("estudio_renders").select("id", { count: "exact", head: true }).eq("projeto_id", pj.id).in("status", ["fila", "renderizando"]).neq("formato", "audio");
      if (count) return erro("este vídeo já está sendo montado — aguarde terminar");
      const formato = String(g.ajustes?.formato || pj.formato || "9:16");
      const { data, error } = await sb.from("estudio_renders").insert({ projeto_id: pj.id, formato: formato === "original" ? "original" : formato, status: "fila", pedido_por: U.uid, pedido_nome: U.nome, receita: { tipo: "editar", projeto_id: pj.id } }).select("id,status").single();
      if (error) throw new Error(error.message);
      await sb.from("estudio_projetos").update({ status: "montando", plano: { ...(pj.plano as any), gravacao: { ...g, critica: null, passo: Math.max(5, Number(g.passo) || 5) } } }).eq("id", pj.id);
      return json({ ok: true, render: data });
    }
    if (acao === "critica") return json({ ok: true, critica: await criticar(String(b.projeto_id), b.render_id) });
    if (acao === "critica_corrigir") {   // aplica sozinho o que da (luz, som, chamada final) e monta de novo
      const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", b.projeto_id).maybeSingle(); const pl: any = pj?.plano || {}; const g: any = pl.gravacao || {}; const c: any = g.critica; if (!c) return erro("rode a crítica antes");
      const aj: any = { ...AJ_PADRAO, ...(g.ajustes || {}) }; const feitos: string[] = [];
      const it = (k: string) => (c.itens || []).find((x: any) => x.chave === k);
      if (it("imagem_som")?.auto) { aj.luz = { ...(aj.luz || {}), brilho: Math.min(0.12, (Number(aj.luz?.brilho) || 0) + 0.06), contraste: Math.max(1.04, Number(aj.luz?.contraste) || 1) }; aj.limpar_audio = true; aj.limpar_imagem = true; feitos.push("clareei a imagem e limpei o som"); }
      if (it("chamada")?.auto && !(aj.textos || []).some((t: any) => t.no_fim)) { aj.textos = [...(aj.textos || []), { id: gid(), no_fim: true, dur: 4, texto: "rodavia360.com.br", pos: "meio" }]; feitos.push("coloquei rodavia360.com.br no final"); }
      if (!feitos.length) return json({ ok: true, feitos, msg: "Não há correção automática pendente — os outros pontos dependem de você (veja a lista)." });
      await sb.from("estudio_projetos").update({ plano: { ...pl, gravacao: { ...g, ajustes: aj } } }).eq("id", b.projeto_id);
      const { data, error } = await sb.from("estudio_renders").insert({ projeto_id: b.projeto_id, formato: aj.formato === "original" ? "original" : aj.formato, status: "fila", pedido_por: U.uid, pedido_nome: U.nome, receita: { tipo: "editar", projeto_id: b.projeto_id } }).select("id,status").single();
      if (error) throw new Error(error.message);
      return json({ ok: true, feitos, render: data });
    }
    if (acao === "render_cancelar") { await sb.from("estudio_renders").update({ cancelar: true, status: "cancelado" }).eq("id", b.render_id).in("status", ["fila"]); await sb.from("estudio_renders").update({ cancelar: true }).eq("id", b.render_id); return json({ ok: true }); }
    if (acao === "render_estado") { const { data } = await sb.from("estudio_renders").select("id,status,progresso,etapa,erro,duracao,tamanho,video_path,capa_path,previa_b64,segundos_render,formato").eq("id", b.render_id).maybeSingle(); return json({ ok: true, render: data }); }
    if (acao === "publicar_pedir") {
      const { data: r } = await sb.from("estudio_renders").select("id,projeto_id,status,formato").eq("id", b.render_id).maybeSingle(); if (!r || r.status !== "pronto") return erro("o vídeo ainda não está pronto");
      { const { data: pg } = await sb.from("estudio_projetos").select("tipo,plano").eq("id", r.projeto_id).maybeSingle();   // v16: gravacao so publica com a critica aprovada
        if (pg?.tipo === "gravacao") { const c: any = (pg.plano as any)?.gravacao?.critica; if (!c || c.render_id !== r.id) return erro("rode a crítica deste vídeo antes de publicar"); if (Number(c.nota) < NOTA_MIN) return erro("nota " + c.nota + " — precisa de " + NOTA_MIN + " para publicar. Veja o que a crítica pediu."); } }
      let legenda = String(b.legenda || "");   // v13: musica com licenca CC BY -> credito obrigatorio vai sozinho na legenda do post
      try { const { data: pj } = await sb.from("estudio_projetos").select("plano").eq("id", r.projeto_id).maybeSingle(); const tr = (pj?.plano as any)?.trilha?.ref;
        if (tr && !String(tr).startsWith("base:")) { const { data: mt } = await sb.from("estudio_midias").select("credito").eq("id", tr).maybeSingle(); if (mt?.credito && !legenda.includes(mt.credito)) legenda = (legenda + "\n\n🎵 Música: " + mt.credito).trim(); } } catch (_) { /* segue sem credito */ }
      const { data, error } = await sb.from("estudio_publicacoes").insert({ render_id: r.id, projeto_id: r.projeto_id, formato: r.formato, rede: "instagram", tipo: "reels", legenda: legenda.slice(0, 2200), status: "aguardando", automatico: !!b.automatico, pedido_por: U.uid, pedido_nome: U.nome }).select("*").single();
      if (error) throw new Error(error.message);
      return json({ ok: true, publicacao: data, msg: "Enviado para aprovação do Renato. Nada é publicado sem o OK dele." });
    }
    if (acao === "publicar_decidir") {   // v20 (RFL v897): escolhe as redes (Instagram, Facebook, LinkedIn, Google) e agora ou agendado
      if (!U.master || U.tipo !== "usuario") return erro("só o login master (Renato) aprova publicação externa", 403);
      const { data: p } = await sb.from("estudio_publicacoes").select("*").eq("id", b.publicacao_id).maybeSingle(); if (!p) return erro("pedido não encontrado", 404);
      if (p.status !== "aguardando" && p.status !== "erro") return erro("este pedido já foi decidido (" + p.status + ")");
      if (!b.aprovar) { await sb.from("estudio_publicacoes").update({ status: "recusado", decidido_por: U.uid, decidido_em: new Date().toISOString(), motivo: String(b.motivo || "").slice(0, 300) }).eq("id", p.id); return json({ ok: true, status: "recusado" }); }
      const { data: r } = await sb.from("estudio_renders").select("video_path,capa_path").eq("id", p.render_id).maybeSingle(); if (!r?.video_path) return erro("vídeo não encontrado");
      const REDES = ["instagram", "facebook", "linkedin", "gmb"];
      const sel = (Array.isArray(b.redes) && b.redes.length ? b.redes : ["instagram"]).map(String).filter((x: string) => REDES.includes(x));
      if (!sel.length) return erro("marque pelo menos uma rede");
      const qMs = Number(b.quando || 0), agendar = qMs > 0;
      if (agendar && qMs < Date.now() + 4 * 60e3) return erro("escolha um horário pelo menos 5 minutos à frente");
      if (agendar && qMs > Date.now() + 25 * 864e5) return erro("agende no máximo 25 dias à frente");
      const legenda = String(b.legenda ?? p.legenda ?? "").slice(0, 2200);
      const igAgora = sel.includes("instagram") && !agendar;
      const velhas: any = p.redes || {};
      const fila = sel.filter((k: string) => !(k === "instagram" && igAgora) && !(velhas[k] && velhas[k].st === "enviado"));
      const upd: any = { decidido_por: U.uid, decidido_em: new Date().toISOString(), legenda, erro: null, quando: agendar ? new Date(qMs).toISOString() : null };
      if (fila.length) {
        upd.midia = { video_url: await assinar(r.video_path, 30 * 86400), capa_url: r.capa_path ? await assinar(r.capa_path, 30 * 86400) : null, ate: new Date(Date.now() + 30 * 864e5).toISOString() };
        const nr: any = { ...velhas }; for (const k of fila) nr[k] = { st: "fila" }; upd.redes = nr;
      }
      if (!igAgora) {
        upd.status = "agendado";
        await sb.from("estudio_publicacoes").update(upd).eq("id", p.id);
        return json({ ok: true, status: "agendado", redes: fila, msg: "Na fila do robô de publicação: " + fila.length + " rede(s)" + (agendar ? " para " + new Date(qMs).toLocaleString("pt-BR", { timeZone: "America/Bahia", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : " (sai na próxima rodada, de hora em hora)") + "." });
      }
      const token = await igToken();
      const params: Record<string, string> = { media_type: "REELS", video_url: await assinar(r.video_path, 3 * 3600), caption: legenda, share_to_feed: "true", access_token: token };
      if (r.capa_path) params.cover_url = await assinar(r.capa_path, 3 * 3600);
      const cont = await ig("/me/media", params, "POST");
      await sb.from("estudio_publicacoes").update({ ...upd, status: "publicando", container_id: cont.id }).eq("id", p.id);
      return json(await igContinuar({ ...p, container_id: cont.id }));
    }
    if (acao === "publicar_cancelar") {   // v20: cancela as redes que ainda estao na fila do robo (as ja enviadas ao Metricool ficam)
      if (!U.master || U.tipo !== "usuario") return erro("só o login master (Renato) mexe em publicação", 403);
      const { data: p } = await sb.from("estudio_publicacoes").select("*").eq("id", b.publicacao_id).maybeSingle(); if (!p) return erro("pedido não encontrado", 404);
      const rd: any = { ...(p.redes || {}) }; let n = 0, env = 0;
      for (const k of Object.keys(rd)) { if (rd[k].st === "fila") { rd[k] = { ...rd[k], st: "cancelado", em: new Date().toISOString() }; n++; } else if (rd[k].st === "enviado") env++; }
      const upd: any = { redes: rd }; if (p.status === "agendado" && !env) upd.status = "cancelado";
      await sb.from("estudio_publicacoes").update(upd).eq("id", p.id);
      return json({ ok: true, canceladas: n, ja_enviadas: env, msg: n ? "Cancelado em " + n + " rede(s)." + (env ? " " + env + " já estava(m) agendada(s) no Metricool — peça ao Claude para tirar." : "") : (env ? "Já foi entregue ao Metricool — peça ao Claude para tirar o agendamento." : "Nada na fila para cancelar.") });
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
