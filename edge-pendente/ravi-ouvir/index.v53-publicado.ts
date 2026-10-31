// RF Logistica - RAVI OUVE E RESPONDE NO WHATSAPP - v3 (RFL v702, 24/10/2026)
// v53 (31/10): viagem da Yamaha tambem pelo PRINT da PLANILHA de programacao da Yamalog (ravi-motor v8 le os dois formatos).
// v52 (31/10): (1) tarefa com horario pode cobrar MOTORISTA (celular da ficha) -- Renato pediu cobrar o Gustavo de 30 em 30 min e o Ravi
//   dizia que nao tinha o numero (so procurava na equipe). (2) finalizar_viagem_motorista: placa e motorista ditos juntos tem que ser a
//   mesma viagem -- o Ravi encerrou a viagem do Daniel (OTQ9B07, 27/10) achando que era a do Ricardo.
// v51 (30/10): EQUIPE FINALIZA A VIAGEM DO MOTORISTA -- Renato e Sandra mandaram a foto do painel do Antonio (QEN6J82) e o Ravi dizia que nao
//   tinha ferramenta (finalizar_viagem so servia para o proprio motorista). Nova ferramenta finalizar_viagem_motorista (Renato e Marcelo):
//   acha a viagem em andamento pela placa ou motorista, usa a foto do painel mandada na conversa (2 h), le o KM, guarda a foto e deixa
//   aguardando a aprovacao (igual o app). v51.1: vale tambem viagem com foto/KM ja anexados no sistema e ja fica CONCLUIDA (aprovada), igual o
//   botao Encerrar viagem da equipe no app. Corrigido tambem o abastecimento do proprio motorista pelo WhatsApp (lia _motorista_ antes de existir).
// v45 (28/10, RFL v768): na resposta do "libera P<n>" o valor do motorista e o do ajudante vao separados (antes somava).
// v50 (29/10): grupo CONSOLIDACAO JT -- qualquer mensagem da JT e entendida e respondida pelo ravi-financeiro (mensagem_grupo).
// v49 (29/10): grupo CONSOLIDACAO JT -- mensagem de quem nao e da equipe registra a resposta ao extrato (ravi_fin_envios.respondido_em) e avisa o Renato.
// v48 (29/10): cache de 24 h da OpenAI (prompt_cache_key/retention) e a parte que muda por pessoa (nivel) saiu do comeco das instrucoes -- a parte fixa e igual para todos e fica no cache.
// v47 (29/10): gpt-5.6 com ferramentas usa reasoning_effort "none" (low/medium dava erro 400 e caia no modelo reserva).
// v46 (29/10): erro da OpenAI fica registrado em integracao_log (fonte ravi-ia) para diagnostico.
// v44 (28/10 23h, RFL v767): "libera P<n>" do Marcelo (ou Renato) libera o pagamento da viagem do motorista (rf_pag_motorista + viagem.pagLiberado).
// v43 (28/10 22h10, RFL v765, pedido #14 do Renato): na tela do Ravi a caixa que fica acesa na resposta e a do ASSUNTO DA PERGUNTA.
//   Pelo app o modelo termina com a linha [[CAIXAS: ...]] (1 a 3, das 9), que sai do texto antes de falar/gravar. As ferramentas passam a
//   seguir os grupos do app: abastecimento, torre e chamados de motorista = viagens; consumo da IA = administracao.
// v42 (28/10 22h, RFL v764): RAVI NO CENTRO -- pelo app (icone de voz) cada ferramenta consultada vira um "acendimento" da caixa do
//   setor na tela (Frota, Manutencao, Viagens, Carregamento, Financeiro, Cadastros, Marketing, Pessoal, Administracao): o app manda req_id,
//   o Ravi grava em ravi_progresso {req_id, uid, ferramenta, setor} ANTES de executar, e a resposta traz "setores" na ordem. Sem ferramenta
//   (respondeu pelo contexto), os setores saem das palavras da pergunta/resposta. Ferramentas novas: saude_frota (Saude da frota e
//   manutencao prevista, rf_saude/rf_previsoes) e excecoes_abertas (Central de Excecoes, rf_excecoes).
// v41 (28/10 18h15): GRUPO FINANCEIRO DA JT ("CONSOLIDACAO JT x RF") -- comprovante (PDF/foto) que chega no grupo vai para o ravi-financeiro
//   (acao "comprovante"): ele le, confere com o extrato do sistema, da baixa/registra e responde no grupo (viagem, linha do PDF, quanto falta).
//   Mensagem de texto chamando o Ravi nesse grupo: responde que vai verificar e repassa ao Renato no privado. Resto: nao responde.
// v40 (28/10 18h): FINANCEIRO JT -- o ravi-financeiro pergunta ao Renato se a JT ja pagou a viagem (12 h depois do inicio, sem pagamento
//   no extrato). A resposta "pagou F<n>" / "cobra F<n>" (ou so "pagou"/"cobra" quando ha uma pergunta so em aberto) e lida aqui e vai
//   para o ravi-financeiro (acao "resposta"): pagou = marca a viagem paga; cobra = o Ravi cobra no grupo "CONSOLIDACAO JT x RF".
// v39 (27/10 19h): DOCUMENTO VAI COMO ARQUIVO -- Renato (pedido 12): "toda vez que eu pedir um documento, eu quero o arquivo em PDF", nao link.
//   No WhatsApp, todo arquivo da resposta (portfolio, CRLV, documento do caminhao) vai como DOCUMENTO pelo servidor ravi-wa-v11 (/send-document);
//   so se o envio falhar vai o link. Ferramentas novas: documentos_caminhao (lista os arquivos guardados de uma placa) e enviar_documento.
// v38 (27/10 14h30): ROBO DE COMPRAS E MANUTENCAO -- quem da equipe mandar ao Ravi a foto/PDF de OS, orcamento ou nota de oficina/pecas
//   (ex.: Sandra com a OS 008643 da Auto Molas), o Ravi chama lancar_compra_foto -> funcao ravi-compras le e ABRE A COMPRA na aba Compras
//   (mesmo formato da recepcao: OS + docLido + itens + boleto) e manda para o Renato e o Marcelo aprovarem ("confirma N" / "reprova N").
//   Aprovado: a compra fica aprovada e o lancamento entra na Manutencao do caminhao (ligado a compra). Tabela ravi_aprovacoes.
// v37 (27/10 10h20): "GRAVA ESTA ROTA" -- o Renato respondeu ao alerta "Fora da rota programada -- QDG7I41" com "esta se deslocando
//   para os povoados, ja grava esta rota!!" e o Ravi respondeu sobre OUTRO caminhao (QDG7J21) dizendo que gravou -- sem gravar nada.
//   (1) o servidor ravi-wa-v10 manda o texto da mensagem CITADA (b.citada): o Ravi sabe de qual alerta/placa estao falando;
//   (2) ferramenta aprovar_desvio: libera o desvio da viagem ativa (sem novo alerta ate voltar a rota) e grava a AREA (15 km) como
//       desvio conhecido em torre_config.desvios_aprovados -- proximas viagens nao alertam ali; (3) regra: nunca dizer que gravou/registrou
//       sem a ferramenta devolver ok.
// v30 (26/10 18h50): VIAGEM DA YAMAHA -- o Renato mandou a foto do PICKING LIST DE EXPEDICAO da Yamalog e pediu para o Ravi lancar.
//   criar_viagem com cliente "Yamaha" chama o ravi-motor (criar_yamaha): le a foto, placa/motorista/data saem do proprio picking list
//   (a pessoa pode corrigir), frete = quantidade x tarifa da cidade (igual a calculadora do app).
// v29 (26/10 14h45): ARQUIVO (portfolio) CHEGA CERTO -- Renato pediu o portfolio no painel e nao conseguiu: o modelo REDIGITAVA o link
//   assinado (600 caracteres) e errava letras (link quebrado); no palco nao aparece texto e a voz ia ler o link. Agora a ferramenta devolve
//   um CODIGO ([[ARQ1]]) e o sistema troca pelo link exato: no WhatsApp o link vai no texto (e a resposta vai escrita, nao em audio, para o
//   link nao se perder); no painel (app v732+) o arquivo vem separado em "arquivos" e vira botao de baixar; app antigo recebe o link no texto.
// v28 (26/10 14h30): VOZ BAIANA -- Renato pediu voz mais humana e com sotaque do Nordeste/Bahia; escolheu a amostra "D" (voz "verse" do
//   gpt-4o-mini-tts com sotaque de Feira de Santana). A resposta em audio tambem sai no jeito de falar de um colega baiano (informal, sem lista).
// v27 (26/10 11h30, RFL v727): KM DE CADA CAMINHAO -- referencia pela RPC rf_km_referencia (grupo de registros que batem entre si;
//   o maior numero do historico nao serve: PKK1G22 tinha 736.789 de outro caminhao). Foto do painel cujo KM nao pertence ao caminhao
//   e RECUSADA (iniciar/finalizar viagem e abastecimento pelo WhatsApp): nada e gravado e o Ravi pede foto nova do painel certo.
// v26.1 (26/10 10h50): motorista pelo primeiro nome ('Ricardo' acha 'Ricardo.Santos').
// v26 (26/10 10h50): (1) EQUIPE LANCA ABASTECIMENTO PELO MOTORISTA -- Marcelo mandou as 3 fotos do abastecimento que o Ricardo esqueceu de
//   lancar (QDE8A82) e o Ravi dizia que nao tinha ferramenta. Nova ferramenta lancar_abastecimento_motorista (Renato e Marcelo): usa as fotos
//   mandadas na conversa e lanca no caminhao/motorista da viagem em andamento (placa ou motorista), mesmo fluxo do motorista (fotos no
//   bucket, leitura de KM/litros/valor, ravi-aprovador na hora). Obs "[Ravi] lancado pelo WhatsApp a pedido de X".
//   (2) RASCUNHO EM INGLES VAZANDO -- o modelo as vezes devolvia o proprio raciocinio ("We cannot tools create fuel...") e isso ia para o
//   WhatsApp. Agora a resposta e conferida (pareceRascunho); se for rascunho, pede de novo so a mensagem final em portugues.
// v25 (25/10 18h): CHAMADOS DOS MOTORISTAS -- cobrancas e pedidos dos motoristas (despesa nao entrou, falta pagar a viagem, caminhao
//   com problema, quero abastecer...). Ferramentas do motorista: minhas_viagens_situacao, abrir_chamado, meus_chamados; da equipe:
//   chamados, atualizar_chamado, encaminhar_chamado. Tabela ravi_chamados; rotas em torre_config.ravi_chamados_rotas; cobranca automatica.
// v24 (25/10 15h40): QUANDO O RENATO DIZ QUE A RESPOSTA NAO E AQUELA -- Renato: "ele tem que parar e pensar de novo o que vai
//   responder". Frase de correcao ("nao e isso", "ta errado", "nao foi isso que perguntei", "pensa de novo"...) faz o Ravi
//   pensar MAIS nessa resposta (reasoning medio no gpt-5.6, em vez de nenhum) e recebe a instrucao de reler a pergunta, achar
//   o que entendeu errado, consultar de novo e responder diferente -- sem repetir nem se justificar; na duvida, pergunta.
// v23 (25/10 14h30): CANAL RAVI -> CLAUDE -- Renato: "prefiro que voce fale diretamente com o Claude o que voce precisa".
//   Ferramentas pedir_ao_claude (grava na tabela ravi_pedidos_claude) e pedidos_ao_claude (le o andamento e a resposta).
//   O Claude le a caixa toda vez que o Renato abre o projeto RFL, faz, e devolve status/resposta/versao -- o Ravi conta para a equipe.
//   E o Ravi passa a saber que NAO enxerga a propria imagem: nao opina sobre a aparencia, pergunta o que a pessoa viu.
// v22 (25/10 12h20): PORTFOLIO OFICIAL -- ferramenta portfolio_institucional: link (7 dias) do portfolio aprovado pelo Renato em
//   25/10 (10 pag., 9 parceiros) em documentos/institucional/ -- versao "completa" (12 MB, e-mail/WhatsApp/impressao) ou "leve"
//   (848 KB, site de cadastro com limite de 1 MB). O Ravi manda o link na resposta ou, a pedido do Renato/Marcelo, para alguem.
// v21.1 (25/10 11h10): CONTEXTO ENXUTO -- o texto do sistema que vai em toda pergunta caiu de 60 mil para 20 mil caracteres
//   (o Ravi ja consulta o banco pelas ferramentas). Teste com 8 perguntas (25/10): mesmas respostas, ~12 mil tokens por pensada
//   em vez de ~24,5 mil (metade do custo). Com 8 mil ja errava contagem. Teste: {teste_ctx: N} com x-rf-token (nao grava conversa).
// v21 (25/10 11h20): (1) CONTROLE DE CONSUMO -- toda chamada a OpenAI (pensar, pesquisar na internet, ler documento) grava os
//   tokens em ravi_uso (origem = conversa/tarefa/resumo); precos estimados em torre_config.ravi_precos (ajustaveis); ferramenta
//   consumo_ia responde quanto o Ravi gastou (so Renato e Marcelo). (2) DOCUMENTOS -- ferramentas documentos e ler_documento:
//   o Ravi abre os PDFs do cofre de Contratos (tabela contratos + bucket privado "contratos") e responde citando a clausula.
//   SO O RENATO (o cofre e do login master).
// v20.1 (25/10 11h): a tarefa le a memoria do Ravi e trata cadastro desatualizado como pedido de correcao ao Marcelo/Sandra.
// v20 (25/10 10h45): TAREFAS COM HORARIO -- Renato: "quero" (o Ravi transformar ordem em rotina). Tabela ravi_tarefas: o Renato/Marcelo
//   pedem ("todo dia as 9h cobra o Marcelo das manutencoes") e o Ravi cria a tarefa (criar_tarefa / listar_tarefas / parar_tarefa).
//   pg_cron ravi-tarefas a cada 15 min chama acao "tarefas": em cada horario o Ravi consulta o sistema, ve se o responsavel respondeu
//   no WhatsApp, cobra (cada vez mais firme) e, depois de N cobrancas sem resposta no dia, avisa o Renato. Historico em ravi_tarefas_log.
//   {acao:"tarefas", simular:true, id} roda sem mandar nada.
// v19 (25/10 02h): TAREFAS DO ESCRITORIO pelo Ravi (Renato e Marcelo): marcar_viagens_pagas, mudar_data_viagem,
//   aprovar_abastecimento e rejeitar_abastecimento -- gravam igual ao app (viagem com atualizadoEm, para o app nao desfazer;
//   abastecimento so se ainda estiver pendente, item de combustivel na viagem igual ao ravi-aprovador). Consultas de viagens e
//   abastecimentos passam a devolver o id. Corrige: registrar_motivo mudava a data da viagem sem atualizadoEm.
// v18 (25/10 01h30): "DEIXA O RAVI UMA MAQUINA" (Renato).
//   (1) RESUMO DA MANHA: acao "resumo_manha" (pg_cron 07:00 da Bahia) junta frota (oleo, documentos, preventiva), contas vencidas e
//       vencendo, viagens de hoje, viagens sem receber, abastecimentos pendentes, CNH dos motoristas, consumo e a Torre, e manda ao
//       Renato no WhatsApp so o que precisa de atencao. Um por dia (tabela ravi_resumos). {simular:true} so devolve o texto.
//   (2) MEMORIA DE LONGO PRAZO: tabela ravi_memoria + ferramentas lembrar/esquecer. O que a equipe decide fica guardado e entra
//       em toda conversa (antes ele esquecia em 12 h).
// v17 (25/10 01h10): MANDA MENSAGEM -- Renato pediu pelo icone "manda mensagem para a Flavia pelo WhatsApp" e o Ravi disse que nao
//   tinha permissao. Renato: "ele tem que ficar autonomo e fazer tudo". Nova ferramenta enviar_whatsapp: manda para alguem da equipe
//   (torre_config.ravi_equipe), um motorista (cadastro), o grupo da RF ou um numero. Quem pode mandar: Renato e Marcelo
//   (torre_config.ravi_criadores; no app, pelo e-mail do login em ravi_financeiro com o mesmo telefone). No app, Renato e Marcelo
//   tambem passam a poder criar viagem pelo icone.
// v16 (25/10 01h): MAIS RAPIDO -- Renato: "ele esta autonomo, mas ainda demora". Cronometro mostrou: pergunta de internet 14,7 s,
//   sendo 8,7 s so na pesquisa. Agora: (1) a pesquisa corre em DOIS buscadores ao mesmo tempo e vale o primeiro que responder
//   (gpt-5.4-mini com pouco raciocinio e busca enxuta x gpt-4o-mini-search-preview); (2) quando a pergunta e so de internet,
//   a resposta da pesquisa ja sai pronta no estilo do Ravi, sem a 2a pensada; (3) as consultas iniciais ao banco rodam em paralelo;
//   (4) a parte fixa das instrucoes vem primeiro e a hora/pessoa no fim, para a OpenAI reaproveitar (cache) de uma pergunta para outra.
//   Campo "tempos" na resposta mostra quanto levou cada etapa.
// v15 (25/10 00h40): IGUAL AO CLAUDE -- Renato: "ele tem que ficar igual a voce, Claude, responder qualquer pergunta" e "ele demora".
//     (1) perguntas GERAIS (fora da RF) respondidas com o conhecimento do modelo; o que muda com o tempo (clima, noticias, precos,
//     leis, horarios) usa a ferramenta pesquisar_internet (OpenAI web search). Assuntos da RF continuam so com dados reais.
//     Motorista continua restrito a viagem dele. (2) ENTRADA DO APP: o icone de voz do painel (RFL v711) chama esta funcao com o
//     login do usuario (JWT conferido por getClaims; perfil admin/user ativo = nivel TUDO; valores so para e-mails em
//     torre_config.ravi_financeiro[].email). Para o app volta so o texto (o app fala com a ravi-voz em stream); chat = "app:<uid>".
// v14 (24/10 23h): quem esta em torre_config.ravi_voz (Renato) recebe a resposta SEMPRE EM AUDIO, mesmo perguntando por texto
//     ("quando eu fizer pergunta ao Ravi nao quero que ele escreva, quero que me responda em audio"). Se pedir "por escrito" na
//     pergunta, vai texto. Se a voz falhar, vai o texto (como antes).
// v13.1: resposta ao 'caminhao nao saiu' -> parabens a quem respondeu; Renato recebe o resolvido se tinha sido avisado com urgencia
// v13: abastecimento lancado pelo Ravi ja e conferido e aprovado na hora (ravi-aprovador)
// v12.1: so quando o motorista nao consegue pelo app (pergunta de 'como faz' -> ensina o app)
// v12: MOTORISTA pelo Ravi -- inicia/finaliza viagem e lanca abastecimento pela foto no WhatsApp (igual o app; a equipe aprova; grupo Torre avisado)
// v11: responde a pergunta "caminhao nao saiu" (ravi-cobrador v6): ferramenta registrar_motivo grava o motivo e, para Renato/Marcelo, muda a data (reprogramada)
// v2: assinatura da Torre no fim da resposta
// v10 (RFL v705): VALORES SO PARA QUEM PODE (decisao do Renato): frete, faturamento, contas, compras, custo, lucro -> so Renato, Marcelo
//     e Flavia (torre_config.ravi_financeiro) e SO NO PRIVADO. No grupo Torre e para o resto da equipe: sem valores (gaveta financeiro
//     fechada, linhas com R$ fora, ferramentas de contas/compras fora, campos de valor tirados de viagens/frota/criar_viagem).
// v9 (RFL v705): PRINT/FOTO/PDF -- o arquivo que chega (servidor ravi-wa-v6) e guardado em ravi_anexos; criar_viagem da JT/Mateus usa
//     a ultima programacao recebida na conversa (ravi-motor le com o mesmo prompt da ler-programacao-mateus e monta com as funcoes do app).
// v8 (RFL v705): FUNCIONARIO CIBERNETICO -- ferramenta criar_viagem (so quem esta em torre_config.ravi_criadores: Renato e Marcelo).
//     Chama a funcao ravi-motor, que monta a viagem com as MESMAS funcoes do app (motor-ravi.js), grava acrescentando, envia ao
//     motorista e avisa ele no WhatsApp. Por enquanto: JDL/Mercante pela lista de cidades.
// v7 (RFL v704): VOZ -- audio chega em base64 do servidor (ravi-wa-v5), e transcrito (gpt-4o-transcribe), respondido e devolvido
//     falado (gpt-4o-mini-tts, voz masculina, ogg/opus). No grupo, audio so e respondido se comecar com "Ravi" (ou se for resposta a msg do Ravi).
// v6.2: viagens/fiscais sem filtro de lapides (batia diferente do app); filtro de texto ignora espaco e pontuacao.
// v6.1: "esse mes" = mes inteiro (igual ao app); contas a pagar so de compra em "pagamento"/"nota" (igual ao app).
// v6 (RFL v703): RAVI AUTONOMO -- ferramentas de consulta ao banco (viagens, contas a pagar, compras, frota, manutencoes, motoristas,
//     entregas, abastecimentos, documentos fiscais, torre). O texto do sistema (gavetas) fica so como pano de fundo (60 mil).
// v5: limite estourado -> fica com as linhas de maior nota (palavras da pergunta, dado, lista), nao com o comeco do texto.
// v4: linha longa e quebrada em pedacos (frases / itens separados por ; ou |) e cada pedaco vai para a sua gaveta -- antes
//     o encurtamento cortava o meio da linha e perdia dado (ex.: parcelas VENCIDAS dentro da linha de compras).
// v3: GAVETAS POR ASSUNTO -- o conhecimento do sistema tem 300 mil+ caracteres (metade e manual do app); antes o Ravi lia so os 60 mil
//     primeiros e perdia financeiro/viagens do fim. Agora cada linha vai para a(s) gaveta(s) do assunto dela e a pergunta abre so
//     as gavetas certas (sem assunto reconhecido abre todas); linhas longas de manual sao encurtadas. Placa fora da frota sai do rastreio.
// Chamado pelo servidor do Ravi (VPS, ravi-wa-v3) a cada mensagem recebida que interessa:
//   - grupo Torre Rf Logistica (torre_config.zapi_grupo_rf): so quando chamado ("Ravi ..." ou marcado) -> nivel TUDO (decisao do Renato)
//   - privado: equipe do escritorio (torre_config.ravi_equipe) -> TUDO; motorista com login ATIVO e celular na ficha -> MOTORISTA
//     (so a viagem, a rota, as entregas e o caminhao dele; nada de financeiro nem de outros motoristas)
//   - qualquer outro chat/numero: ignora (nao responde)
// Conhecimento: ravi_contexto (o mesmo texto do assistente do app, enviado pelo sistema quando um admin esta logado)
//   + dados ao vivo da Torre/rastreio lidos aqui. Memoria curta por conversa em ravi_conversas.
// Autorizacao: header X-RF-Token = rf_segredos.wa_token (o mesmo segredo do servidor).
import { createClient } from "jsr:@supabase/supabase-js@2";
const SB_URL = Deno.env.get("SUPABASE_URL");
const sb = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const MODELO_PRINCIPAL = "gpt-5.6-terra";
// v36 (27/10/2026, Renato aprovou "deixar o Ravi mais inteligente", itens 1 e 3):
//   1) PENSA MAIS QUANDO PRECISA: pergunta de conta/comparacao/analise usa raciocinio (esforco low/medium); conversa simples segue rapida.
//   3) PICKING DA YAMALOG VIRA VIAGEM COM APROVACAO: foto no grupo da Yamaha -> o Ravi le o picking (ravi-motor simular_yamaha), manda o
//      resumo no alerta do Renato/Marcelo e, quando um deles responde "confirma" no privado, lanca a viagem (criar_yamaha com a mesma leitura).
// v35.1: Renato -- "eles nunca vao falar de valor, ja existe contrato e os valores nao sao com esta equipe": o Ravi nao fala de valor no grupo do cliente e nao aciona ninguem por isso.
// v35 (26/10/2026, Renato): quando a Yamalog manda o PICKING LIST (foto) pedindo para confirmar o caminhao e a hora no patio, o Ravi responde
//   no grupo que acionou a equipe e chama Renato e Marcelo URGENTE (privado dos dois + grupo da RF marcando os dois), e INSISTE a cada 5 min
//   (torre-monitor v31) ate um dos dois responder: escrever no grupo do cliente, ou responder ao Ravi no privado ("ok", "vi", "ja respondi").
//   Tabela ravi_alertas_cliente. Vale para tudo que o Ravi nao sabe/nao pode responder no grupo do cliente.
// v34 (26/10/2026, Renato): "Ravi tem que ficar atento as perguntas da Iza/Romulo; se perguntarem algo, responde; se nao souber me chama no zap".
//   No grupo do cliente o Ravi agora le TODA mensagem (o servidor do WhatsApp v9 passa a mandar tudo do grupo): pergunta ou pedido do pessoal
//   do cliente sobre as cargas ele responde mesmo sem chamar "Ravi"; conversa entre eles, "ok", "obrigado" e mensagem da equipe da RF ele
//   deixa passar (so responde a equipe se chamarem "Ravi"). Quando nao tem o dado ou o assunto e com o Renato (valores, comercial), responde
//   que vai confirmar e manda na hora um alerta no privado do Renato (ravi_cobrar.urgente) com a pergunta e o que respondeu.
// v33 (26/10/2026, Renato): GRUPO DO CLIENTE (Yamaha: "QEN6J82 - RF LOGISTICA", Iza/Romulo/Paulo). torre_config.grupos_clientes.
//   No grupo do cliente o Ravi so responde quando chamado ("Ravi ..."), e so sobre as cargas DAQUELE cliente (Torre + viagens do sistema):
//   onde esta, quando chega, o que ja entregou, o que vai na carga. Nunca valores (frete, custos), nunca outro cliente, nunca assunto interno.
//   Enquanto o grupo estiver ativo=false ele NAO responde no grupo; o teste e pelo token do servidor (teste_cliente) e vai para o teste_fone.
const MODELO_RESERVA = "gpt-5.4-mini";
const BA = -3 * 3600e3;
const json = (o, st = 200)=>new Response(JSON.stringify(o), {
    status: st,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  }); // v15: CORS para o app
function iguais(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for(let i = 0; i < a.length; i++)d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
// chave do telefone: DDD + ultimos 8 digitos (resolve 9o digito e o 55)
function chaveFone(x) {
  let n = String(x || "").split("@")[0].split(":")[0].replace(/\D/g, "");
  if (n.startsWith("55") && n.length >= 12) n = n.slice(2);
  if (n.length < 10) return "";
  return n.slice(0, 2) + n.slice(-8);
}
function dataHora(d) {
  if (!d) return "—";
  const t = new Date(new Date(d).getTime() + BA).toISOString();
  return t.slice(8, 10) + "/" + t.slice(5, 7) + " " + t.slice(11, 16);
}
function agoraTxt() {
  const t = new Date(Date.now() + BA).toISOString();
  const dias = [
    "domingo",
    "segunda",
    "terça",
    "quarta",
    "quinta",
    "sexta",
    "sábado"
  ];
  return dias[new Date(Date.now() + BA).getUTCDay()] + ", " + t.slice(8, 10) + "/" + t.slice(5, 7) + "/" + t.slice(0, 4) + " " + t.slice(11, 16);
}
function norm(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
async function quemFala(fones, cfg) {
  const chaves = fones.map(chaveFone).filter(Boolean);
  if (!chaves.length) return null;
  for (const e of Array.isArray(cfg.ravi_equipe) ? cfg.ravi_equipe : []){
    if (e && chaves.includes(chaveFone(e.fone))) return {
      nivel: "tudo",
      nome: e.nome || e.login,
      login: e.login
    };
  }
  const { data: cad } = await sb.from("painel_dados").select("valor").eq("chave", "motoristasCad").maybeSingle();
  const lista = Array.isArray(cad?.valor) ? cad.valor : [];
  const achado = lista.find((m)=>m && m.loginNome && m.mot && chaves.includes(chaveFone(m.mot.celular || "")));
  if (!achado) return null;
  const { data: pf } = await sb.from("profiles").select("nome,papel,ativo").ilike("nome", achado.loginNome).maybeSingle();
  if (!pf || pf.ativo !== true || pf.papel !== "motorista") return null;
  const primeiro = String(achado.mot.nome || achado.loginNome).split(/\s+/)[0];
  return {
    nivel: "motorista",
    nome: primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase(),
    login: achado.loginNome,
    nomeCompleto: achado.mot.nome
  };
}
// v3: gavetas por assunto
const GAVETAS = {
  financeiro: /fatur|receita|caixa|saldo|a pagar|a receber|pagament|pago|receb|extrato|concilia|boleto|\bpix\b|pente|lucro|margem|despesa|custo|imposto|\bdas\b|financ|dinheiro|r\$|gasto|compra|parcela|vencid|venciment|fornecedor|banco/i,
  viagens: /viage|rota|entreg|parada|roteir|carregament|romaneio|client|suzano|yamaha|yamalog|jdl|mateus|\bjt\b|anjun|roque|goias|ct-?e|mdf|frete|canhoto|\bnf|nota fiscal|ciot|averba|focri|reversa/i,
  frota: /placa|caminh|veicul|manuten|oleo|óleo|\bkm\b|hodometr|pneu|abastec|combust|diesel|tanque|crlv|multa|licenci|ipva|revis|oficina|frota|toco|3\/4|seguro|pedagio/i,
  pessoas: /motorist|ajudant|cadastr|ficha|cnh|login|funcion|equipe|diaria|salari|\bclt\b|ferias|ponto|jornada/i,
  torre: /torre|rastre|sascar|posi[cç]|sinal|onde est|localiz|parad[oa]|ignic|velocid|chegada|atraso/i
};
const PARADAS = new Set([
  "ravi",
  "quais",
  "qual",
  "quanto",
  "quantos",
  "quantas",
  "esta",
  "estao",
  "como",
  "onde",
  "esse",
  "essa",
  "este",
  "isso",
  "para",
  "pela",
  "pelo",
  "tem",
  "temos",
  "algum",
  "alguma",
  "voce",
  "hoje",
  "agora",
  "favor",
  "sobre",
  "mais",
  "menos",
  "todos",
  "todas"
]);
function norm2(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9$%/ ]+/g, " ");
}
function gavetasDa(t) {
  return Object.keys(GAVETAS).filter((g)=>GAVETAS[g].test(t));
}
function encurta(l, max) {
  return l.length <= max ? l : l.slice(0, Math.round(max * 0.35)) + " [...] " + l.slice(-Math.round(max * 0.65));
}
function montarConhecimento(texto, pedido, limite = 150000, semValores = false) {
  let abrir = gavetasDa(pedido);
  const todas = !abrir.length;
  if (todas) abrir = Object.keys(GAVETAS);
  if (semValores) abrir = abrir.filter((g)=>g !== "financeiro"); // v10
  const linhas = [];
  for (const l of String(texto || "").split("\n")){
    if (!l.trim()) continue;
    if (l.length <= 1200) {
      linhas.push(l);
      continue;
    }
    // v4: linha longa -> pedacos; o primeiro pedaco (titulo do bloco) vai junto de cada parte escolhida
    const partes = l.split(/(?<=[.;|])\s+/);
    const tit = partes[0].slice(0, 160);
    let atual = "";
    for (const p of partes){
      if ((atual + " " + p).length > 900 && atual) {
        linhas.push(atual === tit ? atual : atual.startsWith(tit) ? atual : "[" + tit + "] " + atual);
        atual = "";
      }
      atual = atual ? atual + " " + p : p;
    }
    if (atual) linhas.push(atual.startsWith(tit) ? atual : "[" + tit + "] " + atual);
  }
  // v5: quando a gaveta passa do limite, nao corta o fim -- da nota a cada linha e fica com as melhores, na ordem original:
  //     palavras da pergunta na linha (peso alto), linha com dado (numero, R$, placa, data) e linha curta (lista/situacao) sobem;
  //     linha de manual (explicacao de versao "(v123)") desce.
  const palavras = Array.from(new Set(norm2(pedido).split(" ").filter((w)=>w.length >= 4 && !PARADAS.has(w)).map((w)=>w.slice(0, 6))));
  const escolhidas = linhas.map((l, i)=>({
      l,
      i,
      g: gavetasDa(l)
    })).filter((x)=>(x.g.length ? x.g.some((g)=>abrir.includes(g)) : x.l.length < 400) && !(semValores && (x.g.includes("financeiro") || /r\$\s?\d|fatura|lucro|margem|sobra|salari|a receber|a pagar/i.test(x.l))));
  for (const x of escolhidas){
    const ln = norm2(x.l);
    let p = 0;
    for (const w of palavras)if (ln.includes(w)) p += 5;
    if (/\d/.test(x.l) && /(r\$|\b[a-z]{3}\d[a-z0-9]\d{2}\b|\d{2}\/\d{2}|\bkm\b|\d+%)/i.test(x.l)) p += 3;
    if (/^\s*[-•]/.test(x.l) || x.l.length < 300) p += 2;
    if (/\(v\d{3}/i.test(x.l.slice(0, 120)) || /^\[?v\d{3}/i.test(x.l)) p -= 3;
    x.p = p;
  }
  let usado = 0;
  const ficar = new Set();
  for (const x of [
    ...escolhidas
  ].sort((a, b)=>b.p - a.p || a.i - b.i)){
    const t = Math.min(x.l.length, 2400) + 1;
    if (usado + t > limite) continue;
    usado += t;
    ficar.add(x.i);
  }
  const saida = escolhidas.filter((x)=>ficar.has(x.i)).map((x)=>encurta(x.l, 2400)).join("\n");
  return {
    texto: saida.slice(0, limite),
    gavetas: todas ? "todas" : abrir.join(","),
    total: texto.length
  };
}
function linhaTorre(v) {
  const ps = Array.isArray(v.paradas) ? v.paradas : [];
  const feitas = ps.filter((p)=>p.sit === "entregue").length, prov = ps.filter((p)=>p.sit === "provavel").length;
  const prox = ps.find((p)=>!p.sit && !p.chegada);
  const cid = ps.length ? ps.map((p, i)=>i + 1 + "." + p.nome + "(" + (p.sit === "entregue" ? "entrega possivelmente feita" + (p.min ? " " + p.min + "min" : "") : p.sit === "provavel" ? "provavel, passou sem sinal" : p.sit === "passou" ? "so passou" : p.chegada ? "esta la agora" : "falta") + ")").join(" ") : "sem cidades programadas";
  const parado = v.parado_desde ? "parado desde " + dataHora(v.parado_desde) : (v.ultima_vel ?? 0) + " km/h";
  return `- ${v.placa} | motorista ${v.motorista || "?"} | cliente ${v.cliente || "?"} | status ${v.status}${v.largada ? "/" + v.largada : ""} | saiu ${dataHora(v.saida_em)} | agora em ${[
    v.ultima_rua,
    [
      v.ultima_cidade,
      v.ultima_uf
    ].filter(Boolean).join("/")
  ].filter(Boolean).join(", ") || "sem endereco"} (posicao de ${dataHora(v.ultima_pos_em)}, ${parado}, ignicao ${v.ultima_ignicao === 1 ? "ligada" : v.ultima_ignicao === 0 ? "desligada" : "?"})${v.fora_rota ? " | FORA DA ROTA" : ""}${v.alerta_sinal ? " | SEM SINAL" : ""} | cidades: ${feitas} de ${ps.length} entregues${prov ? ", " + prov + " provaveis" : ""}${prox ? ", proxima " + prox.nome : ""} | faltam ${v.km_restante ?? "?"} km, chegada prevista ${dataHora(v.eta)} | ${cid}`;
}
async function blocoAoVivo(filtroPlaca) {
  let q = sb.from("torre_viagens").select("placa,motorista,cliente,status,largada,saida_em,ultima_rua,ultima_cidade,ultima_uf,ultima_pos_em,ultima_vel,ultima_ignicao,parado_desde,fora_rota,alerta_sinal,paradas,km_restante,eta").in("status", [
    "ativa",
    "aguardando"
  ]);
  if (filtroPlaca) q = q.eq("placa", filtroPlaca);
  let qr = sb.from("rastreio_ultima").select("placa,cidade,uf,rua,velocidade,ignicao,data_pacote,fonte");
  if (filtroPlaca) qr = qr.eq("placa", filtroPlaca);
  const desde = new Date(Date.now() - 12 * 3600e3).toISOString();
  let qe = sb.from("torre_eventos").select("tipo,placa,msg,em,enviado").gte("em", desde).order("em", {
    ascending: false
  }).limit(30);
  if (filtroPlaca) qe = qe.eq("placa", filtroPlaca);
  // v16: as quatro leituras juntas · v3: so caminhao da FROTA (a Sascar manda placa que nao e da RF -- mesma regra da Torre no app, v661)
  const [{ data: tv }, { data: ru0 }, { data: vx }, { data: ev }] = await Promise.all([
    q.order("placa"),
    qr.order("placa"),
    sb.from("painel_dados").select("valor").eq("chave", "veiculos").maybeSingle(),
    qe
  ]);
  const frota = new Set((Array.isArray(vx?.valor) ? vx.valor : []).map((x)=>String(x?.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "")).filter(Boolean));
  const ru = (ru0 || []).filter((u)=>!/^TST/.test(u.placa || "") && (!frota.size || frota.has(String(u.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, ""))));
  const l = [];
  l.push("TORRE DE CONTROLE AO VIVO (" + agoraTxt() + "):");
  l.push((tv || []).length ? (tv || []).map(linhaTorre).join("\n") : "- nenhuma viagem em monitoramento agora");
  l.push("POSICAO ATUAL DOS CAMINHOES COM RASTREADOR:");
  l.push((ru || []).map((u)=>`- ${u.placa}: ${[
      u.rua,
      [
        u.cidade,
        u.uf
      ].filter(Boolean).join("/")
    ].filter(Boolean).join(", ") || "sem endereco"} | ${u.velocidade ?? 0} km/h | ignicao ${u.ignicao === 1 ? "ligada" : u.ignicao === 0 ? "desligada" : "?"} | posicao de ${dataHora(u.data_pacote)} (${u.fonte || ""})`).join("\n") || "- nenhum");
  l.push("ALERTAS/EVENTOS DAS ULTIMAS 12 HORAS:");
  l.push((ev || []).map((e)=>`- ${dataHora(e.em)} ${e.tipo} ${e.placa || ""}: ${String(e.msg || "").split("\n").slice(0, 2).join(" / ").replace(/\*/g, "").slice(0, 220)}`).join("\n") || "- nenhum");
  return l.join("\n");
}
// motorista: so a viagem/caminhao dele
async function blocoMotorista(p) {
  const { data } = await sb.from("painel_dados").select("valor").eq("chave", "viagens").maybeSingle();
  const vgs = Array.isArray(data?.valor) ? data.valor : [];
  const meu = (g)=>[
      g.motoristaNaEpoca,
      g.motoristaDesignadoNome,
      g.motorista
    ].some((x)=>x && norm(x) === norm(p.login));
  const minhas = vgs.filter((g)=>g && meu(g)).sort((a, b)=>String(b.data || "").localeCompare(String(a.data || ""))).slice(0, 5);
  const atual = minhas.find((g)=>g.statusMotorista === "em_andamento") || minhas[0] || null;
  const placa = atual ? String(atual.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  const l = [];
  l.push(`MOTORISTA FALANDO: ${p.nomeCompleto || p.nome} (login ${p.login}).`);
  if (atual) {
    l.push(`VIAGEM ATUAL DELE: data ${atual.data}, placa ${placa}, cliente ${atual.cliente || "?"}, situacao ${atual.statusMotorista || "?"}, dias previstos ${atual.dias || "?"}${atual.obs ? ", obs: " + String(atual.obs).slice(0, 300) : ""}.`);
    const { data: es } = await sb.from("entregas").select("ordem,cidade,recebedor,status,entregue_em,ocorrencia").eq("viagem_id", String(atual.id)).order("ordem", {
      ascending: true
    }).limit(60);
    if (es && es.length) l.push("ENTREGAS DA VIAGEM: " + es.map((e)=>`${e.ordem}. ${e.cidade}${e.recebedor ? " - " + e.recebedor : ""}${e.status ? " (" + e.status + (e.entregue_em ? " " + dataHora(e.entregue_em) : "") + ")" : ""}${e.ocorrencia ? " ocorrencia: " + e.ocorrencia : ""}`).join("; "));
  } else l.push("Nenhuma viagem encontrada no nome dele.");
  l.push("VIAGENS RECENTES DELE (sem valores): " + (minhas.map((g)=>`${g.data} ${String(g.placa || "").toUpperCase()} ${g.cliente || ""} (${g.statusMotorista || "?"})`).join("; ") || "nenhuma"));
  if (placa) l.push(await blocoAoVivo(placa));
  return l.join("\n");
}
// ===================== v6 (RFL v703): FERRAMENTAS -- o Ravi consulta o banco sozinho =====================
// Leitura apenas. Contas do app (despesa/sobra, parcelas, oleo, preventiva) vem prontas em ravi_dados (gravado pelo app);
// o resto (manutencoes, motoristas, entregas, abastecimentos, fiscais, torre) e lido direto do banco na hora.
const hojeBA = ()=>new Date(Date.now() + BA).toISOString().slice(0, 10);
const brl = (n)=>"R$ " + (Number(n) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
const nrm = (s)=>String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tem = (campo, filtro)=>!filtro || nrm(campo).replace(/[^a-z0-9]/g, "").includes(nrm(filtro).replace(/[^a-z0-9]/g, "")); // v6.2: "Manutencao/pecas" acha "Manutenção / peças"
const placaN = (p)=>String(p || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const noPeriodo = (d, de, ate)=>(!de || (d || "") >= de) && (!ate || (d || "") <= ate);
let _dados = null, _dadosEm = "";
async function dadosApp() {
  if (_dados) return _dados;
  const { data } = await sb.from("ravi_dados").select("dados,em").eq("id", 1).maybeSingle();
  _dados = data?.dados || {};
  _dadosEm = data?.em ? dataHora(data.em) : "nunca";
  return _dados;
}
async function painel(chave) {
  const { data } = await sb.from("painel_dados").select("valor").eq("chave", chave).maybeSingle();
  return Array.isArray(data?.valor) ? data.valor : [];
}
async function lapides() {
  const l = await painel("lapides");
  return new Set(l.map((x)=>String(x?.id)));
}
function corta(lista, max) {
  return {
    total: lista.length,
    mostrando: Math.min(lista.length, max),
    itens: lista.slice(0, max)
  };
}
let _arquivos = []; // v29: arquivos gerados nesta resposta
let _simularEnvio = false, _pedidoPor = "", _semValores = false, _estiloFalado = false, _pergOriginal = ""; // v10 · v16
const FERRAMENTA_CRIAR = {
  type: "function",
  function: {
    name: "criar_viagem",
    description: "CRIA uma viagem no sistema da RF ja enviada ao motorista (e avisa o motorista no WhatsApp). Use quando o Renato ou o Marcelo pedirem para criar/lancar/abrir viagem. Funciona para: (1) Mercante/JDL com a LISTA DE CIDADES escrita ou falada -- copie as cidades exatamente como a pessoa escreveu/falou, na mesma ordem; placa e motorista sao obrigatorios (se faltar, PERGUNTE); (2) JT/Mateus com o PRINT/PDF da programacao que a pessoa mandou nesta conversa -- placa e motorista sao opcionais: sem placa o sistema escolhe o caminhao livre da JT que comporta a carga (igual o app), sem motorista usa o motorista do caminhao; (3) Yamaha com a FOTO do PICKING LIST EXPEDICAO da Yamalog mandada nesta conversa -- placa, motorista e data saem do proprio picking list (so passe placa/motorista/data se a pessoa disser outro).",
    parameters: {
      type: "object",
      properties: {
        cliente: {
          type: "string",
          description: "Mercante/JDL, JT/Mateus ou Yamaha"
        },
        placa: {
          type: "string"
        },
        motorista: {
          type: "string",
          description: "nome ou login do motorista, como foi dito"
        },
        cidades: {
          type: "array",
          items: {
            type: "string"
          },
          description: "so para JDL: o nome de cada cidade, SEM o que estiver entre parenteses"
        },
        entregas: {
          type: "array",
          items: {
            type: "number"
          },
          description: "so para JDL: quantidade de entregas/paradas de cada cidade, na MESMA ordem das cidades (ex.: 'PONTO NOVO (cinco entregas)' -> 5; sem numero -> 0)"
        },
        data: {
          type: "string",
          description: "data de saida AAAA-MM-DD (padrao: hoje)"
        },
        rota: {
          type: "string"
        }
      },
      required: [
        "cliente"
      ]
    }
  }
};
let _chatAtual = "";
let _podeCriar = false, _ehMaster = false, _cfgAtual = null; // v21: _ehMaster = login/numero do Renato   // v11 · v17
// v11: resposta da equipe a pergunta do Ravi "caminhao nao saiu" (ravi-cobrador v6) -- grava o motivo e, se quem fala e o Renato ou o Marcelo
//      e disse a nova data, ja muda a data da viagem (reprogramada)
const FERRAMENTA_MOTIVO = {
  type: "function",
  function: {
    name: "registrar_motivo",
    description: "Registra a RESPOSTA da equipe a uma pergunta aberta do Ravi sobre caminhao que NAO SAIU da base (o motivo, o que mudou na programacao, se foi reprogramada e para quando). Use sempre que alguem explicar por que um caminhao das PERGUNTAS ABERTAS nao saiu. Se disserem a nova data de saida, passe nova_data (AAAA-MM-DD): quando quem fala e o Renato ou o Marcelo, a data da viagem e alterada no sistema.",
    parameters: {
      type: "object",
      properties: {
        placa: {
          type: "string"
        },
        motivo: {
          type: "string",
          description: "o motivo com as palavras da pessoa"
        },
        nova_data: {
          type: "string",
          description: "nova data de saida AAAA-MM-DD, se foi reprogramada"
        }
      },
      required: [
        "placa",
        "motivo"
      ]
    }
  }
};
async function perguntasAbertas() {
  const { data } = await sb.from("ravi_cobrancas").select("chave,placa,motorista,viagem_id,ref,primeira_em").eq("tipo", "parado").is("resolvida_em", null).gte("criado_em", new Date(Date.now() - 3 * 86400e3).toISOString());
  return data || [];
}
async function registrarMotivo(a) {
  const pl = placaN(a.placa);
  const abertas = (await perguntasAbertas()).filter((x)=>placaN(x.placa) === pl);
  const viagens = await painel("viagens");
  let alvo = abertas.sort((x, y)=>String(y.primeira_em).localeCompare(String(x.primeira_em)))[0];
  const resposta = {
    motivo: String(a.motivo || "").slice(0, 500),
    por: _pedidoPor,
    em: new Date().toISOString(),
    nova_data: a.nova_data || null
  };
  let dataMudou = false, avisoData = "";
  const vId = alvo ? alvo.viagem_id : (viagens.filter((v)=>placaN(v.placa) === pl && [
      "em_andamento",
      "aguardando_motorista"
    ].includes(v.statusMotorista) && !(Number(v.kmChegada) > 0)).sort((x, y)=>String(y.data).localeCompare(String(x.data)))[0] || {}).id;
  if (a.nova_data && /^\d{4}-\d{2}-\d{2}$/.test(String(a.nova_data)) && vId) {
    if (_podeCriar) {
      const v0 = viagens.find((v)=>v.id === vId) || {};
      const { error } = await sb.rpc("ravi_viagem_atualizar", {
        p_id: vId,
        p_campos: {
          data: a.nova_data,
          atualizadoEm: Date.now(),
          reprogramadaRavi: {
            de: v0.data || null,
            para: a.nova_data,
            motivo: resposta.motivo,
            por: _pedidoPor,
            em: resposta.em
          }
        }
      });
      dataMudou = !error;
      if (error) avisoData = "nao consegui mudar a data: " + error.message;
    } else avisoData = "a data da viagem NAO foi mudada (so o Renato ou o Marcelo mudam pelo Ravi) -- peca para alterar no sistema";
  }
  if (alvo) await sb.from("ravi_cobrancas").update({
    resolvida_em: new Date().toISOString(),
    ref: {
      ...alvo.ref || {},
      resposta
    }
  }).eq("chave", alvo.chave);
  if (alvo && alvo.ref?.escalado_em) {
    const { data: cf } = await sb.from("torre_config").select("ravi_cobrar").eq("id", 1).maybeSingle();
    const urg = cf?.ravi_cobrar?.urgente || [
      {
        fone: "5575999717578"
      }
    ];
    for (const u of urg)await enviarPara(String(u.fone).replace(/\D/g, ""), `✅ *Resolvido* — o ${pl} que eu te avisei com urgência: ${_pedidoPor} respondeu "${resposta.motivo}"${dataMudou ? " e a viagem foi reprogramada para " + String(a.nova_data).split("-").reverse().join("/") : ""}.`);
  } else if (vId) await sb.from("ravi_cobrancas").upsert({
    chave: "parado:" + vId + ":resposta:" + Date.now(),
    tipo: "parado_info",
    viagem_id: vId,
    placa: pl,
    ref: {
      resposta
    },
    primeira_em: resposta.em,
    ultima_em: resposta.em,
    vezes: 0,
    resolvida_em: resposta.em
  });
  return {
    ok: true,
    registrado: !!(alvo || vId),
    pergunta_aberta: !!alvo,
    resposta_ao_grupo: "confirme que registrou, diga que a pendencia esta RESOLVIDA e de parabens/obrigado a " + _pedidoPor + " pelo retorno",
    data_alterada: dataMudou ? a.nova_data : false,
    aviso: avisoData || undefined
  };
}
// ===================== v12: MOTORISTA PELO RAVI -- inicio, fim e abastecimento pela FOTO no WhatsApp =====================
// Pedido do Renato: se o app nao funcionar, o motorista manda a foto ao Ravi e ele faz o mesmo que o app faz:
//   INICIO  = foto do painel -> fotoKmSaida, KM lido, statusMotorista em_andamento, inicioRealMs (igual motorista_confirmar_inicio)
//   FIM     = foto do painel -> fotoKmChegada, KM lido, statusMotorista aguardando_equipe (igual motorista_confirmar_fim; a equipe aprova)
//   ABASTEC = fotos do painel, da bomba e da nota -> linha em abastecimentos_motorista (pendente, a equipe aprova)
// Mesmas pastas do app no bucket "documentos" (km/<placa>/..., abast/<placa>/...), mesmos prompts da ler-foto-abastecimento,
// foto repetida recusada pela tabela fotos_hash (igual o app). O grupo Torre e avisado de tudo que o Ravi lancar.
const PROMPT_TIPO_FOTO = "Classifique esta foto enviada por um motorista de caminhao. Responda SO uma palavra, sem pontuacao: painel (painel ou hodometro do caminhao mostrando quilometragem), bomba (visor da bomba de combustivel com valor e litros), nota (nota fiscal, cupom ou comprovante de abastecimento), canhoto (canhoto de entrega assinado) ou outro.";
const PROMPT_KM_FOTO = "Essa e uma foto do painel de um caminhao. NAO escolha nada e NAO tente adivinhar qual numero e o certo: sua unica tarefa e LISTAR os numeros de quilometragem que aparecem no painel. Muitos paineis mostram DOIS numeros empilhados: o hodometro TOTAL (a quilometragem da vida do veiculo, tipicamente 5 a 7 digitos, sempre inteiro) e o PARCIAL/TRIP (menor, zera de vez em quando, muitas vezes com uma casa decimal). Liste os DOIS, e qualquer outro numero de quilometragem que enxergar. FORMATO DE RESPOSTA OBRIGATORIO: os numeros separados por barra vertical |, na ordem de cima pra baixo, exatamente como aparecem no visor. Se o numero tiver casa decimal, MANTENHA o ponto decimal (escreva 2499.9, nao 24999). NUNCA use separador de milhar. NAO inclua velocidade, rotacao, temperatura, nivel de combustivel, relogio, pressao nem codigo de erro -- so quilometragem. NAO escreva unidade, rotulo, texto nem explicacao. Exemplo real: painel mostrando 'km 2499.9' na linha de cima e '169625' na linha de baixo -- responda exatamente: 2499.9|169625. Outro exemplo: painel com 'km 17943' em cima e '84170' embaixo -- responda exatamente: 17943|84170. Se so houver um numero de quilometragem legivel, responda so ele. Se a foto nao mostrar um painel de caminhao ou nenhum numero estiver legivel, responda exatamente: ERRO";
const PROMPT_BOMBA_FOTO = "Essa e uma foto do visor de uma bomba de combustivel, mostrando o VALOR PAGO em reais e a QUANTIDADE DE LITROS abastecidos. Leia esses dois numeros. FORMATO DE RESPOSTA OBRIGATORIO: VALOR|LITROS -- um UNICO ponto decimal em cada numero, SEM separador de milhar, SEM virgula, SEM simbolo de moeda, SEM unidade, SEM texto adicional. Exemplos corretos: se o visor mostra R$ 1.000,00 e 142,046 L, responda '1000.00|142.046'. Se mostra R$ 182,19 e 19,59 L, responda '182.19|19.59'. Se nao conseguir ler os dois valores com confianca, responda exatamente: ERRO";
const PROMPT_NOTA_FOTO = "Essa e uma foto de uma nota fiscal ou comprovante de abastecimento em papel. Leia o VALOR TOTAL da nota (procure o campo 'Valor Total' ou 'TOTAL'). FORMATO DE RESPOSTA OBRIGATORIO: um UNICO ponto decimal, SEM separador de milhar, SEM virgula, SEM simbolo de moeda, SEM texto adicional. Exemplo: se a nota mostra 'Valor Total R$ 1.000,00', responda exatamente '1000.00' (nao '1.000.00'). Se mostra 'R$ 182,19', responda '182.19'. Se nao conseguir ler com confianca, responda exatamente: ERRO";
function numSeguro(txt) {
  txt = (txt || "").trim();
  if (!txt) return 0;
  if (txt.indexOf(",") !== -1) txt = txt.replace(/\./g, "").replace(",", ".");
  else {
    const partes = txt.split(".");
    if (partes.length > 2) {
      const dec = partes.pop();
      txt = partes.join("") + "." + dec;
    }
  }
  const n = parseFloat(txt.replace(/[^\d.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}
async function visao(prompt, b64, mime, maxTok) {
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer " + Deno.env.get("OPENAI_API_KEY")
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        max_completion_tokens: maxTok,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: "data:" + (mime || "image/jpeg") + ";base64," + b64
                }
              }
            ]
          }
        ]
      })
    });
    if (!r.ok) return "";
    const j = await r.json();
    return String(j?.choices?.[0]?.message?.content || "").trim();
  } catch (_) {
    return "";
  }
}
async function tipoDaFoto(b64, mime) {
  const t = nrm(await visao(PROMPT_TIPO_FOTO, b64, mime, 20));
  return [
    "painel",
    "bomba",
    "nota",
    "canhoto"
  ].find((x)=>t.includes(x)) || "outro";
}
function b64Bytes(b64) {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++)u[i] = bin.charCodeAt(i);
  return u;
}
async function sha256(u) {
  const h = await crypto.subtle.digest("SHA-256", u);
  return Array.from(new Uint8Array(h)).map((x)=>x.toString(16).padStart(2, "0")).join("");
}
async function kmReferenciaInfo(placa) {
  try {
    const { data } = await sb.rpc("rf_km_referencia", {
      p_placa: placa
    });
    if (data && Number(data.km) > 0) return {
      km: Number(data.km),
      data: String(data.data || "")
    };
  } catch (_) {}
  return {
    km: 0,
    data: ""
  };
}
async function kmReferencia(placa, vgs) {
  const ri = await kmReferenciaInfo(placa);
  if (ri.km > 0) return ri.km; // v27: referencia confiavel; o resto e a regra antiga
  const kms = [];
  for (const v of vgs)if (placaN(v.placa) === placa) kms.push(Number(v.kmSaida) || 0, Number(v.kmChegada) || 0);
  const { data } = await sb.from("abastecimentos_motorista").select("km_atual").eq("placa", placa).neq("status", "rejeitado").order("criado_em", {
    ascending: false
  }).limit(10);
  for (const a of data || [])kms.push(Number(a.km_atual) || 0);
  const ord = kms.filter((k)=>k > 1000).sort((a, b)=>b - a);
  while(ord.length > 1 && ord[0] - ord[1] > 3000)ord.shift(); // v39: KM digitado errado (ex.: 168718 no lugar de 160718 no OTQ9B07) nao vira referencia
  return ord[0] || 0;
}
// mesma regra do app (rfKmCandidatos/rfKmEscolher): decimal = parcial, fica com o MAIOR inteiro que fecha com o historico do caminhao
async function lerKmFoto(b64, mime, placa, vgs) {
  const t = await visao(PROMPT_KM_FOTO, b64, mime, 80);
  const nums = /^ERRO/i.test(t) ? [] : t.split("|").map(numSeguro).filter((n)=>n > 0 && n < 10000000 && n === Math.floor(n));
  const ri = await kmReferenciaInfo(placa); // v27
  const ref = ri.km || await kmReferencia(placa, vgs);
  const dias = ri.data ? Math.max(0, Math.round((Date.parse(hojeBA() + "T12:00:00Z") - Date.parse(ri.data + "T12:00:00Z")) / 864e5)) : 30;
  const teto = ref + Math.max(1500, dias * 400);
  const ok = nums.filter((n)=>!ref || n >= ref - 300 && n <= teto);
  // v27: leu numero(s) e nenhum e deste caminhao (bem acima do teto ou mais de 1.500 km abaixo) -> foto recusada
  const recusada = !!ref && nums.length > 0 && !ok.length && nums.every((n)=>n > teto || n < ref - 1500);
  const dataBR = ri.data ? ri.data.split("-").reverse().join("/") : "";
  return {
    km: ok.length ? Math.max(...ok) : 0,
    lidos: nums,
    referencia: ref,
    recusada,
    aviso: recusada ? "FOTO RECUSADA: o KM da foto (" + Math.max(...nums).toLocaleString("pt-BR") + ") nao pertence ao caminhao " + placa + " -- o ultimo KM dele e " + ref.toLocaleString("pt-BR") + (dataBR ? " (" + dataBR + ")" : "") + ". Nada foi gravado. Peca AGORA uma foto nova do painel do " + placa + " (foto antiga da galeria ou de outro caminhao nao vale)." : ""
  };
}
let _motorista = null;
async function fotosRecentes(minutos) {
  const { data } = await sb.from("ravi_anexos").select("id,mime,b64,em").eq("chat", _chatAtual).like("mime", "image/%").gte("em", new Date(Date.now() - minutos * 60e3).toISOString()).order("em", {
    ascending: false
  }).limit(6);
  const out = [];
  for (const f of data || []){
    const bytes = b64Bytes(String(f.b64 || ""));
    const sha = await sha256(bytes);
    const { data: ja } = await sb.from("fotos_hash").select("hash").eq("hash", sha).limit(1);
    if (ja && ja.length) continue; // foto repetida (ja usada antes): nao vale
    out.push({
      ...f,
      bytes,
      sha
    });
  }
  return out;
}
async function guardarFoto(f, path, placa, contexto, referencia) {
  const { error } = await sb.storage.from("documentos").upload(path, f.bytes, {
    contentType: f.mime || "image/jpeg",
    upsert: false
  });
  if (error) throw new Error("a foto nao subiu: " + error.message);
  await sb.from("fotos_hash").insert({
    hash: f.sha,
    contexto,
    caminho: path,
    placa,
    referencia,
    quem_nome: "Ravi (WhatsApp) - " + (_motorista?.login || ""),
    criado_em: Date.now()
  });
  return path;
}
async function enviarPara(phone, msg) {
  try {
    const { data: ss } = await sb.from("rf_segredos").select("chave,valor").or("chave.like.wa_*");
    const s = {};
    for (const x of ss || [])s[x.chave] = x.valor;
    const { data: c } = await sb.from("torre_config").select("assinatura").eq("id", 1).maybeSingle();
    if (!s.wa_url || !phone) return;
    // @ts-ignore Deno API
    const client = Deno.createHttpClient({
      caCerts: [
        s.wa_ca
      ]
    });
    await fetch(`${s.wa_url}/send-text`, {
      method: "POST",
      client,
      headers: {
        "Content-Type": "application/json",
        "X-RF-Token": s.wa_token
      },
      body: JSON.stringify({
        phone,
        message: msg + "\n\n" + (c?.assinatura || "🤖 _Ravi - RF Logística_")
      })
    });
  } catch (_) {}
}
async function avisarGrupo(msg) {
  try {
    const { data: ss } = await sb.from("rf_segredos").select("chave,valor").or("chave.like.wa_*");
    const s = {};
    for (const x of ss || [])s[x.chave] = x.valor;
    const { data: c } = await sb.from("torre_config").select("zapi_grupo_rf,assinatura").eq("id", 1).maybeSingle();
    if (!s.wa_url || !c?.zapi_grupo_rf) return;
    // @ts-ignore Deno API
    const client = Deno.createHttpClient({
      caCerts: [
        s.wa_ca
      ]
    });
    await fetch(`${s.wa_url}/send-text`, {
      method: "POST",
      client,
      headers: {
        "Content-Type": "application/json",
        "X-RF-Token": s.wa_token
      },
      body: JSON.stringify({
        phone: c.zapi_grupo_rf,
        message: msg + "\n\n" + (c.assinatura || "🤖 _Ravi - RF Logística_")
      })
    });
  } catch (_) {}
}
function minhasViagensDe(vgs, login) {
  return vgs.filter((g)=>g && [
      g.motoristaNaEpoca,
      g.motoristaDesignadoNome,
      g.motorista
    ].some((x)=>x && norm(x) === norm(login)));
}
async function fotoDoPainel(fotos) {
  for (const f of fotos)if (await tipoDaFoto(f.b64, f.mime) === "painel") return f;
  return null;
}
async function iniciarPeloRavi() {
  if (!_motorista) return {
    ok: false,
    erro: "so o motorista inicia a propria viagem"
  };
  const vgs = await painel("viagens"), hj = hojeBA();
  const cands = minhasViagensDe(vgs, _motorista.login).filter((v)=>v.statusMotorista === "aguardando_motorista").sort((a, b)=>(a.data <= hj ? 0 : 1) - (b.data <= hj ? 0 : 1) || (a.data <= hj ? String(b.data).localeCompare(String(a.data)) : String(a.data).localeCompare(String(b.data))));
  const v = cands[0];
  if (!v) {
    const and = minhasViagensDe(vgs, _motorista.login).find((x)=>x.statusMotorista === "em_andamento" && !(Number(x.kmChegada) > 0));
    return {
      ok: false,
      erro: and ? "a viagem dele (" + placaN(and.placa) + ") ja esta iniciada" : "nao ha viagem enviada para ele aguardando inicio -- a equipe precisa enviar a viagem primeiro"
    };
  }
  const f = await fotoDoPainel(await fotosRecentes(60));
  if (!f) return {
    ok: false,
    erro: "falta a FOTO DO PAINEL (KM de saida), tirada agora -- foto repetida nao vale"
  };
  const placa = placaN(v.placa);
  const k = await lerKmFoto(f.b64, f.mime, placa, vgs);
  if (k.recusada) return {
    ok: false,
    recusada: true,
    erro: k.aviso
  }; // v27
  const path = await guardarFoto(f, "km/" + placa + "/" + v.id + "-inicio-" + Date.now() + ".jpg", placa, "km/inicio", "viagem " + v.id);
  const agora = Date.now();
  const campos = {
    fotoKmSaida: path,
    statusMotorista: "em_andamento",
    inicioRealMs: agora,
    atualizadoEm: agora,
    inicioPeloRavi: true
  };
  if (k.km > 0) campos.kmSaida = k.km;
  const { error } = await sb.rpc("ravi_viagem_atualizar", {
    p_id: String(v.id),
    p_campos: campos
  });
  if (error) return {
    ok: false,
    erro: "nao consegui gravar: " + error.message
  };
  await avisarGrupo(`▶️ *Viagem iniciada pelo Ravi* — ${placa} (${v.motoristaNaEpoca || _motorista.login}, ${v.cliente || ""}): o motorista não conseguiu pelo app e mandou a foto do painel no WhatsApp.${k.km > 0 ? " KM de saída: *" + k.km.toLocaleString("pt-BR") + "*." : " Não consegui ler o KM — confiram a foto no sistema."}`);
  return {
    ok: true,
    iniciada: true,
    placa,
    cliente: v.cliente,
    data_viagem: v.data,
    km_lido: k.km || "nao consegui ler -- a equipe confere a foto"
  };
}
async function finalizarPeloRavi(alvo) {
  // v51: alvo = pedido da equipe (Renato/Marcelo) para finalizar a viagem de um motorista: { placa?, motorista? }
  if (!_motorista && !alvo) return {
    ok: false,
    erro: "so o motorista finaliza a propria viagem (para a equipe: finalizar_viagem_motorista)"
  };
  const vgs = await painel("viagens");
  let v = null;
  if (alvo) {
    const pl = placaN(alvo.placa || ""), mo = norm(alvo.motorista || "");
    const prim = (n)=>norm2(n).split(/[ ._]+/).filter(Boolean)[0] || "";
    const moP = prim(String(alvo.motorista || "").replace(/[._]/g, " "));
    // v51.1: a equipe pode ter anexado a foto/KM de chegada no sistema sem encerrar -- continua em andamento e entra aqui
    const and = vgs.filter((x)=>x && [
        "em_andamento",
        "aguardando_equipe"
      ].includes(String(x.statusMotorista))).sort((a, b)=>String(b.data).localeCompare(String(a.data)));
    const achadas = and.filter((x)=>pl && placaN(x.placa) === pl);
    const porNome = and.filter((x)=>mo && [
        x.motoristaNaEpoca,
        x.motoristaDesignadoNome
      ].some((n)=>n && (norm(n) === mo || moP && prim(String(n).replace(/[._]/g, " ")) === moP)));
    // v52: placa E motorista ditos tem que ser a MESMA viagem (Ravi fechou a do Daniel no OTQ9B07 achando que era do Ricardo)
    if (pl && mo && achadas.length && !achadas.some((x)=>porNome.includes(x))) return {
      ok: false,
      erro: "a viagem em andamento da placa " + pl + " e de " + (achadas[0].motoristaNaEpoca || achadas[0].motoristaDesignadoNome || "outro motorista") + " (" + achadas[0].data + "), nao de " + alvo.motorista + " -- confirme com quem pediu antes de encerrar"
    };
    v = (pl && mo ? achadas.find((x)=>porNome.includes(x)) : null) || achadas[0] || porNome[0] || null;
    if (!v) return {
      ok: false,
      erro: "nao achei viagem em andamento " + (pl ? "da placa " + pl : alvo.motorista ? "do motorista " + alvo.motorista : "-- diga a placa ou o motorista")
    };
    if (!achadas.length && porNome.length > 1) return {
      ok: false,
      erro: "o motorista tem mais de uma viagem em andamento (" + porNome.map((x)=>placaN(x.placa) + " de " + x.data).join(", ") + ") -- pergunte a placa"
    };
  } else {
    v = minhasViagensDe(vgs, _motorista.login).filter((x)=>x.statusMotorista === "em_andamento" && !x.fotoKmChegada).sort((a, b)=>String(b.data).localeCompare(String(a.data)))[0];
  }
  if (!v) return {
    ok: false,
    erro: "nao ha viagem em andamento no nome dele para finalizar"
  };
  if (alvo) return await encerrarPelaEquipeRavi(v, vgs); // v51.1
  const f = await fotoDoPainel(await fotosRecentes(60));
  if (!f) return {
    ok: false,
    erro: "falta a FOTO DO PAINEL (KM de chegada), tirada agora -- foto repetida nao vale"
  };
  const placa = placaN(v.placa);
  const k = await lerKmFoto(f.b64, f.mime, placa, vgs);
  if (k.recusada) return {
    ok: false,
    recusada: true,
    erro: k.aviso
  }; // v27
  const path = await guardarFoto(f, "km/" + placa + "/" + v.id + "-fim-" + Date.now() + ".jpg", placa, "km/fim", "viagem " + v.id);
  const kmOk = k.km > 0 && k.km >= (Number(v.kmSaida) || 0);
  const campos = {
    fotoKmChegada: path,
    statusMotorista: "aguardando_equipe",
    atualizadoEm: Date.now(),
    fimPeloRavi: true
  };
  if (alvo) campos.fimPeloRaviPedidoPor = _pedidoPor || "equipe"; // v51
  if (kmOk) campos.kmChegada = k.km;
  const { error } = await sb.rpc("ravi_viagem_atualizar", {
    p_id: String(v.id),
    p_campos: campos
  });
  if (error) return {
    ok: false,
    erro: "nao consegui gravar: " + error.message
  };
  const rodou = kmOk && Number(v.kmSaida) > 0 ? k.km - Number(v.kmSaida) : 0;
  await avisarGrupo(`🏁 *Viagem finalizada pelo Ravi* — ${placa} (${v.motoristaNaEpoca || (_motorista ? _motorista.login : "")}, ${v.cliente || ""}): ${alvo ? (_pedidoPor || "A equipe") + " mandou a foto do painel pelo WhatsApp e pediu para finalizar." : "o motorista não conseguiu pelo app e mandou a foto do painel no WhatsApp."}${kmOk ? " KM de chegada: *" + k.km.toLocaleString("pt-BR") + "*" + (rodou > 0 ? " (rodou " + rodou.toLocaleString("pt-BR") + " km)" : "") + "." : " Não consegui ler o KM — confiram a foto."} Aguardando a aprovação da equipe.`);
  return {
    ok: true,
    finalizada: true,
    placa,
    km_lido: kmOk ? k.km : "nao consegui ler -- a equipe confere a foto",
    rodou_km: rodou || undefined,
    proximo: "a equipe confere e aprova"
  };
}
// v51.1: ENCERRAR PELA EQUIPE (igual o botao "Encerrar viagem" da equipe no app, v368): quem pede e quem revisaria, entao ja fica APROVADA,
//   com encerradaPelaEquipe/encerradaPor/encerradaEm. Usa o KM de chegada ja lancado no sistema; se nao tiver, le da foto mandada na conversa.
async function encerrarPelaEquipeRavi(v, vgs) {
  const placa = placaN(v.placa);
  const campos = {};
  let km = Number(v.kmChegada) || 0;
  if (!(km > 0) || !v.fotoKmChegada) {
    const f = await fotoDoPainel(await fotosRecentes(120));
    if (!f && !(km > 0)) return {
      ok: false,
      erro: "falta a FOTO DO PAINEL com o KM de chegada -- peca a foto (pode ser encaminhada ou print)"
    };
    if (f) {
      const k = await lerKmFoto(f.b64, f.mime, placa, vgs);
      if (k.recusada) return {
        ok: false,
        recusada: true,
        erro: k.aviso
      };
      const path = await guardarFoto(f, "km/" + placa + "/" + v.id + "-fim-" + Date.now() + ".jpg", placa, "km/fim", "viagem " + v.id);
      if (!v.fotoKmChegada) campos.fotoKmChegada = path;
      if (!(km > 0) && k.km > 0) km = k.km;
    }
  }
  if (!(km > 0)) return {
    ok: false,
    erro: "nao consegui ler o KM de chegada na foto -- peca o numero do KM do painel"
  };
  if (Number(v.kmSaida) > 0 && km <= Number(v.kmSaida)) return {
    ok: false,
    erro: "o KM de chegada (" + km + ") e menor ou igual ao KM de saida (" + v.kmSaida + ") -- confira a foto"
  };
  const agora = Date.now(), quem = (_pedidoPor || "equipe") + " (pelo Ravi)";
  Object.assign(campos, {
    kmChegada: km,
    statusMotorista: "aprovada",
    encerradaPelaEquipe: true,
    encerradaPor: quem,
    encerradaEm: agora,
    revisadoEm: agora,
    revisadoPor: quem,
    atualizadoEm: agora
  });
  const { error } = await sb.rpc("ravi_viagem_atualizar", {
    p_id: String(v.id),
    p_campos: campos
  });
  if (error) return {
    ok: false,
    erro: "nao consegui gravar: " + error.message
  };
  const rodou = Number(v.kmSaida) > 0 ? km - Number(v.kmSaida) : 0;
  await avisarGrupo(`🏁 *Viagem encerrada* — ${placa} (${v.motoristaNaEpoca || v.motoristaDesignadoNome || ""}, ${v.cliente || ""}): encerrada por ${_pedidoPor || "a equipe"} pelo Ravi. KM de chegada: *${km.toLocaleString("pt-BR")}*${rodou > 0 ? " (rodou " + rodou.toLocaleString("pt-BR") + " km)" : ""}.`);
  return {
    ok: true,
    encerrada: true,
    status: "concluida (aprovada)",
    placa,
    km_chegada: km,
    rodou_km: rodou || undefined
  };
}
async function abastecerPeloRavi(alvo) {
  // v26: alvo = pedido da equipe (Renato/Marcelo) para lancar pelo motorista: { placa?, motorista? }
  const vgs = await painel("viagens");
  let login = _motorista ? _motorista.login : "", v = null; // v51: antes lia _motorista_ antes de existir (erro no abastecimento do proprio motorista)
  if (alvo) {
    const pl = placaN(alvo.placa || ""), mo = norm(alvo.motorista || "");
    const prim = (n)=>norm2(n).split(/[ ._]+/).filter(Boolean)[0] || ""; // v26.1: "Ricardo.Santos" -> "ricardo"
    const moP = prim(String(alvo.motorista || "").replace(/[._]/g, " "));
    const and = vgs.filter((x)=>x && x.statusMotorista === "em_andamento" && !(Number(x.kmChegada) > 0)).sort((a, b)=>String(b.data).localeCompare(String(a.data)));
    v = and.find((x)=>pl && placaN(x.placa) === pl) || and.find((x)=>mo && [
        x.motoristaNaEpoca,
        x.motoristaDesignadoNome
      ].some((n)=>n && (norm(n) === mo || moP && prim(String(n).replace(/[._]/g, " ")) === moP)));
    if (!v) return {
      ok: false,
      erro: "nao achei viagem em andamento com " + (pl ? "a placa " + pl : "o motorista " + (alvo.motorista || "?")) + " -- confirme a placa"
    };
    login = v.motoristaNaEpoca || v.motoristaDesignadoNome || "";
    if (!login) return {
      ok: false,
      erro: "a viagem " + placaN(v.placa) + " esta sem motorista no sistema"
    };
  } else {
    if (!_motorista) return {
      ok: false,
      erro: "so o motorista lanca o proprio abastecimento (para a equipe: lancar_abastecimento_motorista)"
    };
    v = minhasViagensDe(vgs, login).filter((x)=>x.statusMotorista === "em_andamento").sort((a, b)=>String(b.data).localeCompare(String(a.data)))[0];
  }
  const _motorista_ = {
    login
  };
  const { data: pf } = await sb.from("profiles").select("id,nome,placa_motorista").ilike("nome", login).maybeSingle();
  const placa = placaN(v?.placa || pf?.placa_motorista || "");
  if (!placa) return {
    ok: false,
    erro: "nao sei a placa do caminhao dele -- pergunte a placa"
  };
  const fotos = await fotosRecentes(120);
  const porTipo = {};
  for (const f of fotos){
    const t = await tipoDaFoto(f.b64, f.mime);
    if ([
      "painel",
      "bomba",
      "nota"
    ].includes(t) && !porTipo[t]) porTipo[t] = f;
  }
  if (!Object.keys(porTipo).length) return {
    ok: false,
    erro: "nao achei foto do abastecimento (painel, bomba ou nota) -- peca as fotos"
  };
  // completa um abastecimento que o Ravi abriu ha pouco (o motorista manda as fotos aos poucos)
  const { data: abertos } = await sb.from("abastecimentos_motorista").select("*").eq("placa", placa).eq("status", "pendente").like("obs", "[Ravi]%").gte("criado_em", Date.now() - 3 * 3600e3).order("criado_em", {
    ascending: false
  }).limit(1);
  const a = abertos && abertos[0] ? {
    ...abertos[0]
  } : {
    id: Math.random().toString(36).slice(2, 9),
    motorista_uid: pf?.id || null,
    motorista_nome: _motorista_.login,
    placa,
    data: hojeBA(),
    km_atual: 0,
    litros: 0,
    valor: 0,
    foto_km: "",
    foto_bomba: "",
    foto_nota: "",
    obs: "[Ravi] lançado pelo WhatsApp" + (alvo ? " a pedido de " + (_pedidoPor || "equipe") : ""),
    status: "pendente",
    motivo_rejeicao: "",
    viagem_id: v ? String(v.id) : "",
    criado_em: Date.now()
  };
  const lido = {};
  if (porTipo.painel && !a.foto_km) {
    const k0 = await lerKmFoto(porTipo.painel.b64, porTipo.painel.mime, placa, vgs);
    if (k0.recusada) return {
      ok: false,
      recusada: true,
      erro: k0.aviso
    };
    a.foto_km = await guardarFoto(porTipo.painel, "abast/" + placa + "/" + a.id + "-km-" + Date.now() + ".jpg", placa, "abastecimento/km", "abast " + a.id);
    if (k0.km > 0) {
      a.km_atual = k0.km;
      lido.km = k0.km;
    }
  }
  if (porTipo.bomba && !a.foto_bomba) {
    a.foto_bomba = await guardarFoto(porTipo.bomba, "abast/" + placa + "/" + a.id + "-bomba-" + Date.now() + ".jpg", placa, "abastecimento/bomba", "abast " + a.id);
    const p = (await visao(PROMPT_BOMBA_FOTO, porTipo.bomba.b64, porTipo.bomba.mime, 50)).split("|");
    const val = numSeguro(p[0] || ""), lt = numSeguro(p[1] || "");
    if (val > 0 && val < 100000) a.valor = val;
    if (lt > 0 && lt < 10000) {
      a.litros = lt;
      lido.litros = lt;
    }
  }
  if (porTipo.nota && !a.foto_nota) {
    a.foto_nota = await guardarFoto(porTipo.nota, "abast/" + placa + "/" + a.id + "-nota-" + Date.now() + ".jpg", placa, "abastecimento/nota", "abast " + a.id);
    const val = numSeguro(await visao(PROMPT_NOTA_FOTO, porTipo.nota.b64, porTipo.nota.mime, 50));
    if (val > 0 && val < 100000 && !(a.valor > 0)) a.valor = val;
  }
  const { error } = await sb.from("abastecimentos_motorista").upsert(a);
  if (error) return {
    ok: false,
    erro: "nao consegui gravar: " + error.message
  };
  const faltam = [
    !a.foto_km && "foto do painel (KM)",
    !a.foto_bomba && "foto da bomba",
    !a.foto_nota && "foto da nota"
  ].filter(Boolean);
  let aprovacao = null;
  if (!faltam.length) {
    await avisarGrupo(`⛽ *Abastecimento lançado pelo Ravi* — ${placa} (${_motorista_.login}): ${a.litros > 0 ? Number(a.litros).toLocaleString("pt-BR") + " L" : "litros a conferir"}${a.km_atual > 0 ? ", KM " + Number(a.km_atual).toLocaleString("pt-BR") : ""}. ${alvo ? (_pedidoPor || "A equipe") + " mandou as fotos de painel, bomba e nota pelo WhatsApp (o motorista não lançou no app)." : "O motorista não conseguiu pelo app e mandou as fotos de painel, bomba e nota pelo WhatsApp."} Vou conferir e aprovar.`);
    try {
      const { data: sg } = await sb.from("rf_segredos").select("valor").eq("chave", "wa_token").maybeSingle();
      const r = await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/ravi-aprovador", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rf-token": sg?.valor || ""
        },
        body: JSON.stringify({
          id: a.id
        })
      });
      const j = await r.json();
      const f = (j.feitos || [])[0] || {};
      aprovacao = f.aprovado ? "APROVADO pelo Ravi" : f.motivos ? "NAO aprovado automaticamente -- a equipe confere: " + f.motivos.join("; ") : "em conferencia";
    } catch (_) {
      aprovacao = "em conferencia";
    }
  }
  return {
    ok: true,
    lancado: true,
    placa,
    litros: a.litros || "a conferir",
    km: a.km_atual || "a conferir",
    faltam_fotos: faltam,
    aprovacao: aprovacao || undefined,
    proximo: faltam.length ? "pedir as fotos que faltam (ele pode mandar agora)" : "dizer se foi aprovado"
  };
}
// v26: equipe (Renato/Marcelo) lanca o abastecimento de um motorista com as fotos que mandou na conversa
const FERRAMENTA_ABAST_EQUIPE = {
  type: "function",
  function: {
    name: "lancar_abastecimento_motorista",
    description: "LANCA no sistema o abastecimento de um MOTORISTA (que esqueceu ou nao conseguiu lancar no app) com as fotos que voce (equipe) mandou nesta conversa: painel/KM, bomba e nota -- pode mandar aos poucos, chamar de novo completa o mesmo lancamento. Vai para o caminhao e o motorista da VIAGEM EM ANDAMENTO: passe a placa ou o nome do motorista (ex.: 'a viagem de hoje do Ricardo' -> motorista Ricardo). Use direto, sem pedir confirmacao, sempre que a equipe mandar fotos de abastecimento e disser de quem e. O Ravi le KM, litros e valor, guarda as fotos e confere/aprova na hora.",
    parameters: {
      type: "object",
      properties: {
        placa: {
          type: "string"
        },
        motorista: {
          type: "string",
          description: "nome ou login do motorista, como foi dito"
        }
      }
    }
  }
};
// v51: equipe (Renato/Marcelo) finaliza a viagem de um motorista com a foto do painel mandada na conversa
const FERRAMENTA_FIM_EQUIPE = {
  type: "function",
  function: {
    name: "finalizar_viagem_motorista",
    description: "FINALIZA no sistema a VIAGEM EM ANDAMENTO de um MOTORISTA (que nao finalizou pelo app) usando a FOTO DO PAINEL (KM de chegada) que voce (equipe) mandou nesta conversa -- pode ser foto encaminhada ou print. Passe a placa ou o nome do motorista (ex.: 'finaliza a viagem do Antonio' -> motorista Antonio). Use DIRETO, sem pedir confirmacao, quando a equipe pedir para finalizar/encerrar/fechar a viagem de alguem e tiver mandado a foto do painel; se a foto ainda nao veio, peca. Igual ao botao Encerrar viagem da equipe no app: usa o KM de chegada ja lancado ou le da foto, guarda a foto e a viagem ja fica CONCLUIDA (aprovada). Se a foto/KM ja foi anexada no sistema, nao precisa de foto nova.",
    parameters: {
      type: "object",
      properties: {
        placa: {
          type: "string"
        },
        motorista: {
          type: "string",
          description: "nome ou login do motorista, como foi dito"
        }
      }
    }
  }
};
const FERRAMENTAS_MOTORISTA = [
  {
    type: "function",
    function: {
      name: "iniciar_viagem",
      description: "INICIA no sistema a viagem que a equipe enviou para este motorista, usando a FOTO DO PAINEL (KM de saida) que ele mandou aqui (igual o botao Iniciar viagem do app). Use quando ele pedir para iniciar ou quando mandar a foto do painel e tiver viagem aguardando inicio.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "finalizar_viagem",
      description: "FINALIZA a viagem em andamento deste motorista usando a FOTO DO PAINEL (KM de chegada) que ele mandou aqui (igual o botao Finalizar viagem do app; depois a equipe aprova). Use quando ele pedir para finalizar/fechar/encerrar ou disser que chegou e mandou a foto do painel.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "lancar_abastecimento",
      description: "LANCA o abastecimento deste motorista com as fotos que ele mandou aqui (painel/KM, bomba e nota; pode mandar aos poucos -- chamar de novo completa o mesmo lancamento). Use quando ele disser que abasteceu ou mandar foto da bomba ou da nota.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];
async function criarViagem(a) {
  const ehJT = /jt|mateus/i.test(String(a.cliente || "")), ehJDL = /jdl|mercante/i.test(String(a.cliente || "")), ehYam = /yama/i.test(String(a.cliente || ""));
  if (!ehJT && !ehJDL && !ehYam) return {
    ok: false,
    erro: "por enquanto eu crio viagem da Mercante/JDL (lista de cidades), da JT/Mateus (print/PDF da programacao) e da Yamaha (foto do picking list ou print da planilha de programacao da Yamalog). Os outros clientes ainda sao lancados no sistema."
  };
  if (ehYam) {
    const { data: segY } = await sb.from("rf_segredos").select("valor").eq("chave", "wa_token").maybeSingle();
    const rY = await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/ravi-motor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rf-token": segY?.valor || ""
      },
      body: JSON.stringify({
        acao: "criar_yamaha",
        chat: _chatAtual,
        placa: a.placa,
        motorista: a.motorista,
        data: a.data,
        pedidoPor: _pedidoPor
      })
    });
    const jY = await rY.json().catch(()=>({
        ok: false,
        erro: "resposta invalida do motor"
      }));
    if (jY && jY.ok) {
      if (_semValores) {
        delete jY.frete;
        (jY.destinos || []).forEach((d)=>delete d.frete);
      } else {
        jY.frete = brl(jY.frete);
        (jY.destinos || []).forEach((d)=>d.frete = brl(d.frete));
      }
    }
    return jY;
  }
  if (ehJDL && (!a.placa || !a.motorista || !(a.cidades || []).length)) return {
    ok: false,
    erro: "para a JDL preciso da placa, do motorista e da lista de cidades"
  };
  const { data: seg } = await sb.from("rf_segredos").select("valor").eq("chave", "wa_token").maybeSingle();
  const corpo = ehJT ? {
    acao: "criar_jt",
    chat: _chatAtual,
    placa: a.placa,
    motorista: a.motorista,
    data: a.data,
    pedidoPor: _pedidoPor
  } : {
    acao: "criar_jdl",
    cliente: "Mercante/JDL",
    placa: a.placa,
    motorista: a.motorista,
    cidades: a.cidades,
    entregas: a.entregas,
    data: a.data,
    rota: a.rota,
    pedidoPor: _pedidoPor
  }; // v32: entregas por cidade
  const r = await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/ravi-motor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rf-token": seg?.valor || ""
    },
    body: JSON.stringify(corpo)
  });
  const j = await r.json().catch(()=>({
      ok: false,
      erro: "resposta invalida do motor"
    }));
  if (j && j.ok) {
    if (_semValores) delete j.frete;
    else j.frete = brl(j.frete);
  } // v10
  return j;
}
// v15: pesquisa na internet (perguntas gerais que mudam com o tempo)
const FERRAMENTA_INTERNET = {
  type: "function",
  function: {
    name: "pesquisar_internet",
    description: "Pesquisa na INTERNET e devolve um resumo com as fontes. Use para o que muda com o tempo ou nao esta no sistema da RF: clima/previsao do tempo, noticias, cotacao do dolar/diesel, precos, resultados de jogos, leis e regras de transito novas, horarios, enderecos e telefones de empresas, quem ocupa um cargo hoje. Nao use para dados da RF (viagens, financeiro, frota): para isso ha as outras ferramentas.",
    parameters: {
      type: "object",
      properties: {
        pergunta: {
          type: "string",
          description: "o que pesquisar, em portugues, com cidade e data quando fizer sentido (ex.: 'previsao do tempo Feira de Santana amanha')"
        }
      },
      required: [
        "pergunta"
      ]
    }
  }
};
// v17: mandar mensagem no WhatsApp a pedido do Renato/Marcelo
const FERRAMENTA_ENVIAR = {
  type: "function",
  function: {
    name: "enviar_whatsapp",
    description: "MANDA uma mensagem pelo WhatsApp do Ravi para alguem da equipe da RF (ex.: Flavia, Marcelo, Sandra), para um motorista (pelo nome), para o grupo da RF (para: 'grupo') ou para um numero de telefone. Use sempre que pedirem para mandar, avisar, falar, cobrar, lembrar ou passar recado a alguem -- mande direto, sem pedir confirmacao. Escreva a mensagem pronta, educada e clara, em nome de quem pediu (ex.: 'Flavia, o Renato pediu para avisar que...').",
    parameters: {
      type: "object",
      properties: {
        para: {
          type: "string",
          description: "nome da pessoa (como foi dito), 'grupo' para o grupo da RF, ou o numero com DDD"
        },
        mensagem: {
          type: "string",
          description: "o texto que vai na mensagem"
        }
      },
      required: [
        "para",
        "mensagem"
      ]
    }
  }
};
async function enviarWhatsapp(a) {
  if (!_podeCriar) return {
    ok: false,
    erro: "so o Renato e o Marcelo podem pedir para o Ravi mandar mensagem"
  };
  const para = String(a.para || "").trim(), mensagem = trocarArq(String(a.mensagem || "").trim(), "url").slice(0, 3500); // v29: codigo do arquivo -> link exato
  if (!para || !mensagem) return {
    ok: false,
    erro: "faltou para quem ou o texto da mensagem"
  };
  const cfg = _cfgAtual || {};
  let fone = "", nome = "";
  const n = norm(para), dig = para.replace(/\D/g, "");
  if (/^(o |a )?(grupo|torre|equipe toda|todo mundo|pessoal)/i.test(para)) {
    fone = String(cfg.zapi_grupo_rf || "");
    nome = "grupo da RF";
  } else if (dig.length >= 10) {
    fone = dig.length <= 11 ? "55" + dig : dig;
    nome = para;
  } else {
    const casa = (x)=>{
      const k = norm(x);
      return !!k && (k === n || k.startsWith(n) || n.startsWith(k) || norm(String(x).split(/\s+/)[0]) === n);
    };
    const eq = (Array.isArray(cfg.ravi_equipe) ? cfg.ravi_equipe : []).find((e)=>e && e.fone && (casa(e.nome) || casa(e.login)));
    if (eq) {
      fone = String(eq.fone).replace(/\D/g, "");
      nome = eq.nome || eq.login;
    } else {
      const { data: cad } = await sb.from("painel_dados").select("valor").eq("chave", "motoristasCad").maybeSingle();
      const achados = (Array.isArray(cad?.valor) ? cad.valor : []).filter((m)=>m && m.mot && m.mot.celular && (casa(m.mot.nome) || casa(m.loginNome)));
      if (achados.length > 1) return {
        ok: false,
        erro: "tem mais de uma pessoa com esse nome: " + achados.map((m)=>m.mot.nome).join(", ") + ". Pergunte qual."
      };
      if (achados.length === 1) {
        fone = String(achados[0].mot.celular).replace(/\D/g, "");
        if (fone.length <= 11) fone = "55" + fone;
        nome = achados[0].mot.nome;
      }
    }
  }
  if (!fone) return {
    ok: false,
    erro: "nao achei o WhatsApp de '" + para + "' na equipe nem no cadastro de motoristas. Peca o numero."
  };
  if (_simularEnvio) return {
    ok: true,
    simulado: true,
    enviaria_para: nome,
    fone,
    mensagem
  }; // v20
  try {
    const { data: ss } = await sb.from("rf_segredos").select("chave,valor").or("chave.like.wa_*");
    const sx = {};
    for (const x of ss || [])sx[x.chave] = x.valor;
    if (!sx.wa_url) return {
      ok: false,
      erro: "o WhatsApp do Ravi nao esta configurado"
    };
    // @ts-ignore Deno API
    const client = Deno.createHttpClient({
      caCerts: [
        sx.wa_ca
      ]
    });
    const r = await fetch(`${sx.wa_url}/send-text`, {
      method: "POST",
      client,
      headers: {
        "Content-Type": "application/json",
        "X-RF-Token": sx.wa_token
      },
      body: JSON.stringify({
        phone: fone,
        message: mensagem + "\n\n" + (cfg.assinatura || "🤖 _Ravi - RF Logística_")
      })
    });
    const corpo = await r.text().catch(()=>"");
    if (!r.ok) return {
      ok: false,
      erro: "o servidor do WhatsApp recusou (" + r.status + "): " + corpo.slice(0, 120)
    };
    await sb.from("ravi_conversas").insert({
      chat: fone.includes("-") ? fone.replace(/-group$/, "@g.us") : fone + "@s.whatsapp.net",
      quem: "Ravi",
      papel: "ravi",
      texto: "(a pedido de " + _pedidoPor + ") " + mensagem.slice(0, 3000)
    });
    return {
      ok: true,
      enviado_para: nome,
      mensagem
    };
  } catch (e) {
    return {
      ok: false,
      erro: "nao consegui mandar: " + String(e.message || e).slice(0, 150)
    };
  }
}
// v18: memoria de longo prazo
const FERRAMENTAS_DOC_CAMINHAO = [
  {
    type: "function",
    function: {
      name: "documentos_caminhao",
      description: "LISTA os arquivos guardados no sistema de um caminhao (CRLV, apolice, laudos, notas, fotos): nome, data e caminho. Use quando pedirem um documento de um caminhao.",
      parameters: {
        type: "object",
        properties: {
          placa: {
            type: "string"
          }
        },
        required: [
          "placa"
        ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "enviar_documento",
      description: "MANDA O ARQUIVO (PDF) de um documento guardado no sistema para quem pediu -- o arquivo vai anexado na resposta, nunca link. Use o caminho que veio de documentos_caminhao (ou dos dados do sistema, ex.: documentos/QDO1A52/...-CRLV.pdf). Regra do Renato: documento pedido vai SEMPRE como arquivo PDF.",
      parameters: {
        type: "object",
        properties: {
          caminho: {
            type: "string"
          },
          nome: {
            type: "string",
            description: "nome do arquivo para quem recebe (opcional)"
          }
        },
        required: [
          "caminho"
        ]
      }
    }
  }
];
const FERRAMENTA_COMPRA = {
  type: "function",
  function: {
    name: "lancar_compra_foto",
    description: "ABRE UMA COMPRA (aba Compras) pela FOTO/PDF que a pessoa mandou aqui de uma ORDEM DE SERVICO (OS) de oficina, ORCAMENTO, NOTA FISCAL, CUPOM ou RECIBO de peca, pneu, mola, eletrica, borracharia, servico em caminhao. O robo de compras le o documento (fornecedor, itens, valores, placa, boleto), confere se ja foi lancado e manda para o Renato e o Marcelo aprovarem; aprovado, entra na Manutencao do caminhao. Use quando alguem da equipe mandar esse tipo de documento (com ou sem texto). NAO use para programacao da JT, picking da Yamaha, foto de painel/bomba/canhoto. Se o robo disser que falta a placa, pergunte de qual caminhao e e chame de novo com a placa.",
    parameters: {
      type: "object",
      properties: {
        placa: {
          type: "string",
          description: "placa que a pessoa disse (se disse)"
        }
      }
    }
  }
};
const FERRAMENTA_DESVIO = {
  type: "function",
  function: {
    name: "aprovar_desvio",
    description: "APROVA/GRAVA um desvio de rota: use quando alguem da equipe responder a um alerta 'Fora da rota programada' (ou falar de um caminhao fora da rota) dizendo que esta tudo certo, que e entrega nos povoados/interior, ou pedindo para gravar/liberar essa rota. A viagem ativa da placa fica sem novo alerta de desvio ate voltar para a rota, e a area (raio de 15 km da posicao atual) fica gravada como desvio conhecido: nas proximas viagens o Ravi nao alerta ali. Use a PLACA do alerta citado (nunca de outro caminhao).",
    parameters: {
      type: "object",
      properties: {
        placa: {
          type: "string",
          description: "placa do caminhao do alerta (ex.: QDG7I41)"
        },
        motivo: {
          type: "string",
          description: "o que a pessoa disse (ex.: entrega nos povoados de Itiuba)"
        }
      },
      required: [
        "placa"
      ]
    }
  }
};
const FERRAMENTA_LEMBRAR = {
  type: "function",
  function: {
    name: "lembrar",
    description: "GUARDA na memoria permanente do Ravi uma decisao, regra ou fato duradouro que a equipe disse (ex.: 'a JDL nao deve nada de julho e agosto', 'o Gustavo abastece no Piaui na volta', 'a partir de hoje a Sandra cuida dos cadastros'). Use quando pedirem para lembrar/anotar/guardar ou quando a pessoa disser uma decisao que vai valer daqui para frente. Nao guarde coisa passageira (onde o caminhao esta agora, um valor do dia).",
    parameters: {
      type: "object",
      properties: {
        fato: {
          type: "string",
          description: "o fato em uma frase clara, com nomes, placas e datas"
        }
      },
      required: [
        "fato"
      ]
    }
  }
};
const FERRAMENTA_ESQUECER = {
  type: "function",
  function: {
    name: "esquecer",
    description: "APAGA da memoria permanente um fato que mudou ou que pediram para esquecer. Passe o numero [id] que aparece na MEMORIA DO RAVI.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "number"
        }
      },
      required: [
        "id"
      ]
    }
  }
};
async function memoriaTexto() {
  const { data } = await sb.from("ravi_memoria").select("id,fato,quem,em").eq("ativo", true).order("em", {
    ascending: true
  }).limit(120);
  if (!data || !data.length) return "";
  return "MEMORIA DO RAVI (decisoes e fatos que a equipe pediu para lembrar -- valem mais que o texto do sistema; se algo aqui mudou, use esquecer e lembrar):\n" + data.map((m)=>"- [" + m.id + "] " + m.fato + " (" + (m.quem || "?") + ", " + String(m.em).slice(8, 10) + "/" + String(m.em).slice(5, 7) + ")").join("\n") + "\n";
}
async function documentosCaminhao(a) {
  const placa = String(a.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (placa.length !== 7) return {
    ok: false,
    erro: "informe a placa"
  };
  const arqs = [];
  for (const pasta of [
    "documentos/" + placa,
    placa
  ]){
    const { data } = await sb.storage.from("documentos").list(pasta, {
      limit: 100,
      sortBy: {
        column: "created_at",
        order: "desc"
      }
    });
    for (const x of data || [])if (x && x.name && x.id) arqs.push({
      ...x,
      pasta
    });
  }
  const arqs2 = arqs.map((x)=>({
      caminho: x.pasta + "/" + x.name,
      nome: x.name.replace(/^\d{10,}-/, ""),
      tamanho_kb: Math.round((x.metadata?.size || 0) / 1024),
      em: String(x.created_at || "").slice(0, 10)
    }));
  return {
    ok: true,
    placa,
    arquivos: arqs2,
    dica: "para mandar um deles, chame enviar_documento com o caminho"
  };
}
async function enviarDocumento(a) {
  let caminho = String(a.caminho || "").trim().replace(/^\/+/, "");
  if (!caminho || caminho.includes("..")) return {
    ok: false,
    erro: "faltou o caminho do arquivo (use documentos_caminhao para achar)"
  };
  const nome = String(a.nome || caminho.split("/").pop() || "documento").replace(/^\d{10,}-/, "");
  let { data, error } = await sb.storage.from("documentos").createSignedUrl(caminho, 7 * 86400, {
    download: nome
  });
  if (error || !data?.signedUrl) {
    const alt = caminho.startsWith("documentos/") ? caminho.slice(11) : "documentos/" + caminho;
    const r2 = await sb.storage.from("documentos").createSignedUrl(alt, 7 * 86400, {
      download: nome
    });
    if (r2.data?.signedUrl) {
      data = r2.data;
      error = null;
      caminho = alt;
    }
  }
  if (error || !data?.signedUrl) return {
    ok: false,
    erro: "nao achei esse arquivo no sistema: " + (error?.message || caminho)
  };
  const cod = "[[ARQ" + (_arquivos.length + 1) + "]]";
  _arquivos.push({
    cod,
    nome,
    url: data.signedUrl,
    arq: nome,
    mime: /\.pdf$/i.test(nome) ? "application/pdf" : /\.png$/i.test(nome) ? "image/png" : /\.jpe?g$/i.test(nome) ? "image/jpeg" : "application/octet-stream"
  });
  return {
    ok: true,
    codigo: cod,
    arquivo: nome,
    diga: "diga curto que o arquivo " + nome + " vai junto nesta mensagem (o sistema anexa o PDF sozinho; nao escreva link)"
  };
}
async function mandarArquivoWA(chatDest, x) {
  try {
    const r = await fetch(x.url);
    if (!r.ok) return false;
    const buf = new Uint8Array(await r.arrayBuffer());
    if (!buf.length || buf.length > 12 * 1024 * 1024) return false;
    let s = "";
    for(let i = 0; i < buf.length; i += 32768)s += String.fromCharCode(...buf.subarray(i, i + 32768));
    const { data: ss } = await sb.from("rf_segredos").select("chave,valor").or("chave.like.wa_*");
    const sx = {};
    for (const y of ss || [])sx[y.chave] = y.valor;
    if (!sx.wa_url) return false;
    // @ts-ignore Deno API
    const client = Deno.createHttpClient({
      caCerts: [
        sx.wa_ca
      ]
    });
    const nomeArq = (x.arq || x.nome || "documento").replace(/[\\/:*?"<>|]+/g, " ").trim();
    const fn = /\.[a-z0-9]{2,4}$/i.test(nomeArq) ? nomeArq : nomeArq.replace(/\s*—\s*PDF$/i, "") + ".pdf";
    const resp = await fetch(`${sx.wa_url}/send-document`, {
      method: "POST",
      client,
      headers: {
        "Content-Type": "application/json",
        "X-RF-Token": sx.wa_token
      },
      body: JSON.stringify({
        phone: chatDest,
        doc_b64: btoa(s),
        mimetype: x.mime || r.headers.get("content-type") || "application/pdf",
        fileName: fn,
        caption: ""
      })
    });
    return resp.ok;
  } catch (_e) {
    return false;
  }
}
async function chamarCompras(corpo) {
  const { data: seg } = await sb.from("rf_segredos").select("valor").eq("chave", "wa_token").maybeSingle();
  const r = await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/ravi-compras", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rf-token": seg?.valor || ""
    },
    body: JSON.stringify(corpo)
  });
  return await r.json().catch(()=>({
      ok: false,
      erro: "resposta invalida do robo de compras"
    }));
}
async function lancarCompraFoto(a) {
  const { data: ax } = await sb.from("ravi_anexos").select("mime,nome,b64,em").eq("chat", _chatAtual).gte("em", new Date(Date.now() - 2 * 3600e3).toISOString()).order("em", {
    ascending: false
  }).limit(1);
  const an = ax && ax[0];
  if (!an) return {
    ok: false,
    erro: "nao achei foto/PDF recente nesta conversa -- peca para mandar a foto da OS ou nota aqui"
  };
  const r = await chamarCompras({
    acao: "ler",
    b64: an.b64,
    mime: an.mime,
    nome: an.nome,
    placa: a.placa || "",
    quem: _pedidoPor,
    teste: _simularEnvio
  });
  if (!r.ok) return r;
  if (r.teste) return {
    ok: true,
    teste: true,
    resumo: r.resumo,
    diga: "modo teste: nada foi lancado"
  };
  const cfg = _cfgAtual || {};
  const alvos = (Array.isArray(cfg.ravi_criadores) ? cfg.ravi_criadores : []).filter((c)=>c && c.fone);
  const eq = (Array.isArray(cfg.ravi_equipe) ? cfg.ravi_equipe : []).find((p)=>p && norm(p.nome) === norm(_pedidoPor));
  const R = r.resumo;
  const txt = `🧾 *Compra nº ${r.numero} para aprovar* — ${R.placa}\n${R.fornecedor}${R.numero ? " · " + R.tipo + " " + R.numero : ""}${R.data ? " · " + R.data : ""}\n${R.itensTxt}\n*Total ${"R$ " + Number(R.total).toFixed(2).replace(".", ",")}* · ${R.pagamento}${R.soma_itens_bate ? "" : "\n⚠️ A soma dos itens não bate com o total — confira a foto na aba Compras."}\nMandada por ${_pedidoPor}.\n\nResponda *confirma ${r.numero}* para aprovar e lançar na Manutenção do ${R.placa}, ou *reprova ${r.numero}*.`;
  await sb.from("ravi_aprovacoes").insert({
    tipo: "compra",
    ref: r.compraId,
    numero: r.numero,
    resumo: txt,
    alvos,
    pedido_por: _pedidoPor,
    chat: eq && eq.fone ? eq.fone : _chatAtual
  });
  const env = [];
  for (const al of alvos){
    if (eq && chaveFone(eq.fone) === chaveFone(al.fone)) continue;
    env.push({
      para: al.nome,
      ...await waEnviar(al.fone, txt, cfg, "compra nº " + r.numero)
    });
  }
  return {
    ok: true,
    numero: r.numero,
    resumo: R,
    enviado_para_aprovar: env.filter((e)=>e.ok).map((e)=>e.para),
    diga: "confirme curto: compra nº " + r.numero + " aberta (" + R.placa + ", " + R.fornecedor + ", total R$ " + Number(R.total).toFixed(2).replace(".", ",") + ", " + R.pagamento + ") e enviada para aprovacao" + (eq && alvos.some((al)=>chaveFone(al.fone) === chaveFone(eq.fone)) ? "; como voce aprova, e so responder confirma " + r.numero : "")
  };
}
async function aprovarDesvio(a) {
  const placa = String(a.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!placa) return {
    ok: false,
    erro: "faltou a placa"
  };
  const { data: vs } = await sb.from("torre_viagens").select("id,placa,motorista,cliente,ultima_lat,ultima_lng,ultima_cidade,ultima_uf,tracking").eq("status", "ativa").ilike("placa", placa).limit(1);
  const v = vs && vs[0];
  if (!v) return {
    ok: false,
    erro: "nao achei viagem ATIVA na Torre para a placa " + placa
  };
  if (v.ultima_lat == null) return {
    ok: false,
    erro: "a viagem nao tem posicao para gravar a area"
  };
  const motivo = String(a.motivo || "").slice(0, 200);
  const tr = {
    ...v.tracking || {},
    desvio_ok: {
      em: new Date().toISOString(),
      por: _pedidoPor,
      motivo
    }
  };
  const { error: e1 } = await sb.from("torre_viagens").update({
    tracking: tr
  }).eq("id", v.id);
  if (e1) return {
    ok: false,
    erro: e1.message
  };
  const { data: cfg } = await sb.from("torre_config").select("desvios_aprovados").eq("id", 1).maybeSingle();
  const lista = Array.isArray(cfg?.desvios_aprovados) ? cfg.desvios_aprovados : [];
  const nome = [
    v.ultima_cidade,
    v.ultima_uf
  ].filter(Boolean).join("/");
  lista.push({
    lat: v.ultima_lat,
    lng: v.ultima_lng,
    raio_km: 15,
    nome,
    cliente: v.cliente || null,
    placa: v.placa,
    motivo,
    por: _pedidoPor,
    em: new Date().toISOString()
  });
  const { error: e2 } = await sb.from("torre_config").update({
    desvios_aprovados: lista.slice(-200)
  }).eq("id", 1);
  if (e2) return {
    ok: false,
    erro: e2.message
  };
  return {
    ok: true,
    placa: v.placa,
    motorista: v.motorista,
    area: nome + " (raio de 15 km)",
    diga: "confirme curto: desvio do " + v.placa + " aprovado, sem novo alerta ate voltar para a rota, e a area de " + nome + " ficou gravada para as proximas viagens"
  };
}
async function lembrar(a) {
  const fato = String(a.fato || "").trim().slice(0, 600);
  if (!fato) return {
    ok: false,
    erro: "faltou o fato"
  };
  const { data, error } = await sb.from("ravi_memoria").insert({
    fato,
    quem: _pedidoPor,
    chat: _chatAtual
  }).select("id").maybeSingle();
  return error ? {
    ok: false,
    erro: error.message
  } : {
    ok: true,
    id: data?.id,
    guardado: fato
  };
}
async function esquecer(a) {
  const id = Number(a.id);
  if (!id) return {
    ok: false,
    erro: "faltou o numero do fato"
  };
  const { data, error } = await sb.from("ravi_memoria").update({
    ativo: false
  }).eq("id", id).select("fato").maybeSingle();
  return error ? {
    ok: false,
    erro: error.message
  } : data ? {
    ok: true,
    esquecido: data.fato
  } : {
    ok: false,
    erro: "nao achei esse numero na memoria"
  };
}
// v18: resumo da manha para o Renato
async function resumoManha(simular, cfg) {
  const hoje = hojeBA();
  if (!simular) {
    const { data: ja } = await sb.from("ravi_resumos").select("enviado_em").eq("dia", hoje).maybeSingle();
    if (ja?.enviado_em) return {
      ok: true,
      msg: "ja mandou hoje"
    };
  }
  _semValores = false;
  _ehMaster = false;
  _pedidoPor = "Ravi (resumo da manha)";
  _chatAtual = "resumo";
  _estiloFalado = false;
  const mais = (n)=>new Date(Date.now() - 3 * 3600e3 + n * 86400e3).toISOString().slice(0, 10);
  const pega = async (nome, args)=>{
    try {
      return JSON.stringify(await executarFerramenta(nome, args)).slice(0, 14000);
    } catch (e) {
      return JSON.stringify({
        erro: String(e.message || e)
      });
    }
  };
  const [frota, contas, viagHoje, naoPagas, abast, mot, torre, cons, memo] = await Promise.all([
    pega("frota", {}),
    pega("contas_a_pagar", {
      situacao: "abertas",
      ate: mais(3)
    }),
    pega("viagens", {
      de: hoje,
      ate: mais(1)
    }),
    pega("viagens", {
      de: mais(-45),
      ate: mais(-1),
      so_nao_pagas: true
    }),
    pega("abastecimentos", {
      de: mais(-4)
    }),
    pega("motoristas", {}),
    pega("torre_ao_vivo", {}),
    sb.from("ravi_consumo").select("placa,km_l_norte,km_l_medido,confiavel,trechos").then((r)=>JSON.stringify(r.data || []).slice(0, 6000)),
    memoriaTexto()
  ]);
  const prompt = `Voce e o RAVI, funcionario cibernetico da RF Logistica (Feira de Santana/BA). Hoje e ${agoraTxt()}. Monte o RESUMO DA MANHA para o Renato (dono), pelo WhatsApp, em portugues do Brasil.
REGRAS: comece com "Bom dia, Renato!" e uma frase com o dia. Depois SO o que precisa de atencao ou decisao, do mais urgente ao menos: (1) contas VENCIDAS e que vencem hoje/ate 3 dias (fornecedor, valor, data); (2) troca de oleo vencida ou faltando menos de 1.500 km; preventiva vencida; seguro, cronotacografo, emplacamento/licenciamento vencidos ou vencendo em 15 dias; (3) CNH de motorista vencida ou vencendo em 30 dias; (4) abastecimentos pendentes de aprovacao; (5) viagens concluidas e ainda nao pagas ha mais de 7 dias (cliente, total); (6) consumo: caminhao com km/L medido e confiavel muito abaixo do norte (mais de 15% pior); (7) viagens de hoje/amanha (placa, motorista, destino) e caminhoes em viagem agora. CUIDADO COM CADASTRO DESATUALIZADO (decisao do Renato, 25/10: "nenhum carro da frota esta vencido"): data de emplacamento/licenciamento, seguro ou cronotacografo que JA PASSOU quase sempre e cadastro que nao foi atualizado depois de pagar -- NUNCA diga "vencido"; junte num bloco "📋 Cadastro para atualizar" (ex.: "PLY0A97: data do emplacamento no cadastro passou, confirme e atualize"). O mesmo para oleo "vencido" ha mais de 15.000 km (e KM ou ultima troca nao lancados). Nunca recomende parar/bloquear caminhao por dado de cadastro. Se um assunto nao tem nada, NAO escreva ele. Feche com 1 linha "Hoje eu recomendo:" com a acao mais importante.
Formato WhatsApp: *negrito* com UM asterisco so em palavras-chave, emojis discretos no inicio dos blocos (⚠️ 🛢️ 🪪 💰 ⛽ 🚚), listas com "•", maximo uns 30 linhas, sem tabela, sem titulo com #. Use SO os dados abaixo, nunca invente; valores em R$ com virgula. Nao assine.
${memo}
FROTA: ${frota}
CONTAS A PAGAR (abertas, ate ${mais(3)}): ${contas}
VIAGENS DE HOJE E AMANHA: ${viagHoje}
VIAGENS NAO PAGAS (ultimos 45 dias): ${naoPagas}
ABASTECIMENTOS (ultimos 4 dias): ${abast}
MOTORISTAS: ${mot}
TORRE AO VIVO: ${torre}
CONSUMO MEDIDO (ravi_consumo): ${cons}`;
  let texto = "";
  for (const m of [
    MODELO_PRINCIPAL,
    MODELO_RESERVA
  ]){
    const r = await chamarOpenAI(m, [
      {
        role: "user",
        content: prompt
      }
    ]);
    if (r.ok) {
      const j = await r.json();
      texto = String(j?.choices?.[0]?.message?.content || "").trim();
      if (texto) break;
    }
  }
  if (!texto) {
    await sb.from("ravi_resumos").upsert({
      dia: hoje,
      erro: "IA nao respondeu"
    });
    return {
      ok: false,
      erro: "IA nao respondeu"
    };
  }
  texto = texto.replace(/\*\*(.+?)\*\*/g, "*$1*").replace(/^#+\s*/gm, "");
  if (simular) return {
    ok: true,
    simulado: true,
    texto
  };
  const fone = String(((Array.isArray(cfg?.ravi_voz) ? cfg.ravi_voz : [])[0] || {}).fone || "5575999717578").replace(/\D/g, "");
  await enviarPara(fone, texto);
  await sb.from("ravi_resumos").upsert({
    dia: hoje,
    texto,
    enviado_em: new Date().toISOString(),
    erro: null
  });
  await sb.from("ravi_conversas").insert({
    chat: fone + "@s.whatsapp.net",
    quem: "Ravi",
    papel: "ravi",
    texto: "(resumo da manha) " + texto.slice(0, 3800)
  });
  return {
    ok: true,
    enviado: true,
    texto
  };
}
// v19: tarefas do escritorio (so Renato e Marcelo)
const FERRAMENTAS_ESCRITORIO = [
  {
    type: "function",
    function: {
      name: "marcar_viagens_pagas",
      description: "Da BAIXA de recebimento: marca viagens como PAGAS pelo cliente (igual marcar 'pago' na aba Viagens), ou desmarca. Antes, consulte a ferramenta viagens para pegar os ids certos. Ate 40 por vez.",
      parameters: {
        type: "object",
        properties: {
          ids: {
            type: "array",
            items: {
              type: "string"
            }
          },
          data_pagamento: {
            type: "string",
            description: "AAAA-MM-DD (padrao: hoje)"
          },
          desmarcar: {
            type: "boolean"
          }
        },
        required: [
          "ids"
        ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "mudar_data_viagem",
      description: "MUDA a data (de saida) de uma viagem -- reprogramacao. Consulte viagens antes para pegar o id.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          nova_data: {
            type: "string",
            description: "AAAA-MM-DD"
          },
          motivo: {
            type: "string"
          }
        },
        required: [
          "id",
          "nova_data"
        ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "aprovar_abastecimento",
      description: "APROVA um abastecimento PENDENTE por ordem de quem fala (igual o botao aprovar do app): soma o combustivel na viagem do caminhao. Consulte abastecimentos com status pendente antes para pegar o id.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string"
          }
        },
        required: [
          "id"
        ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "rejeitar_abastecimento",
      description: "REJEITA um abastecimento PENDENTE, com o motivo.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          motivo: {
            type: "string"
          }
        },
        required: [
          "id",
          "motivo"
        ]
      }
    }
  }
];
const _uid = ()=>Math.random().toString(36).slice(2, 9);
async function viagemPorId(id) {
  const { data } = await sb.from("painel_dados").select("valor").eq("chave", "viagens").maybeSingle();
  return (Array.isArray(data?.valor) ? data.valor : []).find((v)=>v && String(v.id) === String(id)) || null;
}
async function escritorio(nome, a) {
  if (!_podeCriar) return {
    ok: false,
    erro: "so o Renato e o Marcelo podem pedir isso ao Ravi"
  };
  const carimbo = {
    por: _pedidoPor,
    em: new Date().toISOString()
  };
  if (nome === "marcar_viagens_pagas") {
    if (_semValores) return {
      ok: false,
      erro: "baixa de pagamento so no privado de quem tem permissao de valores"
    };
    const ids = (Array.isArray(a.ids) ? a.ids : []).map(String).slice(0, 40);
    if (!ids.length) return {
      ok: false,
      erro: "faltou dizer quais viagens (ids)"
    };
    const pago = !a.desmarcar, dataPg = pago ? /^\d{4}-\d{2}-\d{2}$/.test(String(a.data_pagamento || "")) ? a.data_pagamento : hojeBA() : "";
    const feitas = [], erros = [];
    for (const id of ids){
      const v = await viagemPorId(id);
      if (!v) {
        erros.push({
          id,
          erro: "viagem nao encontrada"
        });
        continue;
      }
      const { error } = await sb.rpc("ravi_viagem_atualizar", {
        p_id: id,
        p_campos: {
          pago,
          dataPagamento: dataPg,
          atualizadoEm: Date.now(),
          pagoPeloRavi: pago ? carimbo : null
        }
      });
      if (error) erros.push({
        id,
        erro: error.message
      });
      else feitas.push({
        id,
        data: v.data,
        placa: v.placa,
        cliente: v.cliente,
        valor: brl(Number(v.valorViagem) || 0)
      });
    }
    return {
      ok: !erros.length,
      [pago ? "marcadas_pagas" : "desmarcadas"]: feitas,
      data_pagamento: dataPg || undefined,
      erros: erros.length ? erros : undefined
    };
  }
  if (nome === "mudar_data_viagem") {
    const nd = String(a.nova_data || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nd)) return {
      ok: false,
      erro: "data invalida (use AAAA-MM-DD)"
    };
    const v = await viagemPorId(String(a.id));
    if (!v) return {
      ok: false,
      erro: "viagem nao encontrada"
    };
    if (Number(v.kmChegada) > 0 || v.statusMotorista === "concluida") return {
      ok: false,
      erro: "essa viagem ja terminou; a data de viagem concluida se muda no sistema"
    };
    const { error } = await sb.rpc("ravi_viagem_atualizar", {
      p_id: String(v.id),
      p_campos: {
        data: nd,
        atualizadoEm: Date.now(),
        reprogramadaRavi: {
          de: v.data || null,
          para: nd,
          motivo: String(a.motivo || ""),
          ...carimbo
        }
      }
    });
    return error ? {
      ok: false,
      erro: error.message
    } : {
      ok: true,
      viagem: v.id,
      placa: v.placa,
      de: v.data,
      para: nd
    };
  }
  if (nome === "aprovar_abastecimento" || nome === "rejeitar_abastecimento") {
    const { data: ab } = await sb.from("abastecimentos_motorista").select("*").eq("id", String(a.id)).maybeSingle();
    if (!ab) return {
      ok: false,
      erro: "abastecimento nao encontrado"
    };
    if (ab.status !== "pendente") return {
      ok: false,
      erro: "esse abastecimento ja esta " + ab.status
    };
    if (nome === "rejeitar_abastecimento") {
      const mot = String(a.motivo || "").trim().slice(0, 300) || "rejeitado pelo Ravi a pedido de " + _pedidoPor;
      const { data: cl, error } = await sb.from("abastecimentos_motorista").update({
        status: "rejeitado",
        motivo_rejeicao: mot,
        obs: (String(ab.obs || "") + " [rejeitado pelo Ravi a pedido de " + _pedidoPor + "]").trim()
      }).eq("id", ab.id).eq("status", "pendente").select("id");
      if (error || !cl?.length) return {
        ok: false,
        erro: error ? error.message : "mudou no meio, confira no sistema"
      };
      return {
        ok: true,
        rejeitado: ab.id,
        placa: ab.placa,
        motorista: ab.motorista_nome,
        motivo: mot
      };
    }
    const valor = Number(ab.valor) || 0, litros = Number(ab.litros) || 0;
    if (!(valor > 0) || !(litros > 0)) return {
      ok: false,
      erro: "esse lancamento esta sem valor ou litros; precisa completar no sistema"
    };
    const { data: pd } = await sb.from("painel_dados").select("chave,valor").in("chave", [
      "viagens",
      "veiculos"
    ]);
    const viagens = (pd || []).find((x)=>x.chave === "viagens")?.valor || [], veiculos = (pd || []).find((x)=>x.chave === "veiculos")?.valor || [];
    const placa = placaN(ab.placa);
    const veic = veiculos.find((v)=>placaN(v.placa) === placa);
    if (!veic) return {
      ok: false,
      erro: "a placa " + ab.placa + " nao e da frota"
    };
    // mesma escolha de viagem do ravi-aprovador / app
    let vg = viagens.find((v)=>ab.viagem_id && String(v.id) === String(ab.viagem_id));
    if (!vg) vg = viagens.filter((v)=>placaN(v.placa) === placa && v.statusMotorista === "em_andamento" && !(Number(v.kmChegada) > 0)).sort((x, y)=>String(y.data).localeCompare(String(x.data)))[0];
    if (!vg) vg = viagens.find((v)=>placaN(v.placa) === placa && v.data === ab.data);
    let vgId = vg ? String(vg.id) : "";
    if (!vgId) {
      vgId = _uid();
      const nova = {
        id: vgId,
        placa: veic.placa,
        cliente: "",
        data: ab.data || hojeBA(),
        criadoEm: Date.now(),
        atualizadoEm: Date.now(),
        valorViagem: 0,
        km: 0,
        dias: 1,
        kmSaida: 0,
        kmChegada: 0,
        fotoKmSaida: "",
        fotoKmChegada: "",
        combustivelItens: [],
        vgPagMotorista: 500,
        vgPagAjudante: 300,
        temAjudante: true,
        pago: false,
        dataPagamento: "",
        pagoMotorista: false,
        dataPagamentoMotorista: "",
        motoristaNaEpoca: veic.motorista || "",
        outrosItens: [],
        origemMotorista: true,
        origemMotoristaNome: ab.motorista_nome || "",
        criadaPeloRavi: true
      };
      const { error: e0 } = await sb.rpc("ravi_viagem_acrescentar", {
        p_item: nova
      });
      if (e0) return {
        ok: false,
        erro: "viagem solta: " + e0.message
      };
    }
    const obs = (String(ab.obs || "") + " [aprovado pelo Ravi a pedido de " + _pedidoPor + "]").trim();
    const { data: claim } = await sb.from("abastecimentos_motorista").update({
      status: "aprovado",
      viagem_id: vgId,
      obs
    }).eq("id", ab.id).eq("status", "pendente").select("id");
    if (!claim?.length) return {
      ok: false,
      erro: "mudou no meio, confira no sistema"
    };
    const item = {
      id: _uid(),
      valor,
      litros,
      desc: "Abastecimento lançado por " + (ab.motorista_nome || "motorista") + " (aprovado a pedido de " + _pedidoPor + ")",
      aprovadoPeloRavi: true,
      abastId: ab.id
    };
    const { error: e1 } = await sb.rpc("ravi_viagem_add_combustivel", {
      p_id: vgId,
      p_item: item
    });
    if (e1) {
      await sb.from("abastecimentos_motorista").update({
        status: "pendente",
        obs: ab.obs || ""
      }).eq("id", ab.id);
      return {
        ok: false,
        erro: e1.message
      };
    }
    return {
      ok: true,
      aprovado: ab.id,
      placa: ab.placa,
      motorista: ab.motorista_nome,
      litros,
      valor: _semValores ? undefined : brl(valor),
      viagem: vg ? vg.id : "viagem solta nova (" + vgId + ")"
    };
  }
  return {
    ok: false,
    erro: "acao desconhecida"
  };
}
// v20: tarefas com horario
const FERRAMENTAS_TAREFA = [
  {
    type: "function",
    function: {
      name: "criar_tarefa",
      description: "CRIA uma tarefa com horario (rotina) que o Ravi executa sozinho: conferir algo no sistema e cobrar alguem pelo WhatsApp ate resolver, avisando o Renato se a pessoa nao responder. Use quando o Renato/Marcelo pedirem 'todo dia', 'a partir de segunda', 'fica cobrando', 'acompanha', 'me avisa se'.",
      parameters: {
        type: "object",
        properties: {
          titulo: {
            type: "string"
          },
          instrucao: {
            type: "string",
            description: "o que o Ravi deve conferir e quando cobrar, em detalhe (ex.: 'veja os caminhoes em manutencao e as manutencoes lancadas hoje; para cada caminhao em manutencao sem registro, cobre o Marcelo pedindo servico, previsao de saida e liberacao')"
          },
          responsavel: {
            type: "string",
            description: "nome de quem sera cobrado (equipe ou MOTORISTA -- o celular do motorista vem da ficha dele) ou 'Renato' se for so aviso"
          },
          horarios: {
            type: "array",
            items: {
              type: "string"
            },
            description: "HH:MM da Bahia, ex. ['09:00','15:00']"
          },
          dias_semana: {
            type: "array",
            items: {
              type: "number"
            },
            description: "0=domingo ... 6=sabado; padrao segunda a sexta [1,2,3,4,5]"
          },
          inicio: {
            type: "string",
            description: "AAAA-MM-DD (padrao hoje)"
          },
          fim: {
            type: "string"
          },
          escalar_apos: {
            type: "number",
            description: "quantas cobrancas sem resposta no dia antes de avisar o Renato (padrao 2)"
          }
        },
        required: [
          "titulo",
          "instrucao",
          "horarios"
        ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "listar_tarefas",
      description: "Lista as tarefas com horario do Ravi (ativas) e o que aconteceu na ultima vez.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "parar_tarefa",
      description: "PARA (desliga) uma tarefa com horario. Passe o id.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "number"
          }
        },
        required: [
          "id"
        ]
      }
    }
  }
];
function foneDaEquipe(nome) {
  const n = norm(nome);
  if (!n) return "";
  const eq = (Array.isArray(_cfgAtual?.ravi_equipe) ? _cfgAtual.ravi_equipe : []).find((e)=>e && e.fone && [
      e.nome,
      e.login
    ].some((x)=>{
      const k = norm(x);
      return k && (k === n || k.startsWith(n) || n.startsWith(k) || norm(String(x).split(/\s+/)[0]) === n);
    }));
  return eq ? String(eq.fone).replace(/\D/g, "") : "";
}
// v52: celular do MOTORISTA pela ficha (motoristasCad: nome ou login); "" se nao achar ou se tiver mais de um com o mesmo nome
async function foneMotoristaCad(nome) {
  const n = norm(nome);
  if (!n) return "";
  const { data: cad } = await sb.from("painel_dados").select("valor").eq("chave", "motoristasCad").maybeSingle();
  const casa = (x)=>{
    const k = norm(x);
    return !!k && (k === n || k.startsWith(n) || n.startsWith(k) || norm(String(x).split(/[\s._]+/)[0]) === n);
  };
  const ach = (Array.isArray(cad?.valor) ? cad.valor : []).filter((m)=>m && m.mot && m.mot.celular && (casa(m.mot.nome) || casa(m.loginNome)));
  if (ach.length !== 1) return "";
  let f = String(ach[0].mot.celular).replace(/\D/g, "");
  if (f.length <= 11) f = "55" + f;
  return f;
}
async function tarefaFerramenta(nome, a) {
  if (nome === "listar_tarefas") {
    const { data } = await sb.from("ravi_tarefas").select("id,titulo,responsavel,horarios,dias_semana,inicio,fim,estado").eq("ativo", true).order("id");
    return {
      tarefas: data || []
    };
  }
  if (!_podeCriar) return {
    ok: false,
    erro: "so o Renato e o Marcelo podem criar ou parar tarefas do Ravi"
  };
  if (nome === "parar_tarefa") {
    const { data, error } = await sb.from("ravi_tarefas").update({
      ativo: false
    }).eq("id", Number(a.id)).select("titulo").maybeSingle();
    return error ? {
      ok: false,
      erro: error.message
    } : data ? {
      ok: true,
      parada: data.titulo
    } : {
      ok: false,
      erro: "tarefa nao encontrada"
    };
  }
  const hs = (Array.isArray(a.horarios) ? a.horarios : []).map((h)=>String(h).trim()).filter((h)=>/^\d{1,2}:\d{2}$/.test(h)).map((h)=>h.padStart(5, "0"));
  if (!hs.length) return {
    ok: false,
    erro: "faltou o horario (HH:MM)"
  };
  const resp = String(a.responsavel || "").trim();
  const fone = resp ? foneDaEquipe(resp) || await foneMotoristaCad(resp) : ""; // v52: motorista tambem pode ser cobrado (celular da ficha)
  if (resp && !fone && !/renato/i.test(resp)) return {
    ok: false,
    erro: "nao achei o WhatsApp de " + resp + " na equipe nem na ficha dos motoristas"
  };
  const linha = {
    titulo: String(a.titulo).slice(0, 120),
    instrucao: String(a.instrucao).slice(0, 2000),
    responsavel: resp || null,
    responsavel_fone: fone || null,
    horarios: hs,
    dias_semana: Array.isArray(a.dias_semana) && a.dias_semana.length ? a.dias_semana.map(Number) : [
      1,
      2,
      3,
      4,
      5
    ],
    inicio: /^\d{4}-\d{2}-\d{2}$/.test(String(a.inicio || "")) ? a.inicio : hojeBA(),
    fim: /^\d{4}-\d{2}-\d{2}$/.test(String(a.fim || "")) ? a.fim : null,
    escalar_apos: Number(a.escalar_apos) > 0 ? Number(a.escalar_apos) : 2,
    criado_por: _pedidoPor
  };
  const { data, error } = await sb.from("ravi_tarefas").insert(linha).select("id").maybeSingle();
  return error ? {
    ok: false,
    erro: error.message
  } : {
    ok: true,
    id: data?.id,
    ...linha
  };
}
// executor: roda as tarefas no horario
async function rodarTarefas(simular, soId, cfg) {
  const agora = new Date(Date.now() + BA), hoje = agora.toISOString().slice(0, 10), hm = agora.toISOString().slice(11, 16), dow = agora.getUTCDay();
  let q = sb.from("ravi_tarefas").select("*").eq("ativo", true);
  if (soId) q = q.eq("id", soId);
  const { data: ts } = await q;
  const saida = [];
  for (const t of ts || []){
    if (!soId) {
      if (t.inicio > hoje || t.fim && t.fim < hoje || !(t.dias_semana || []).includes(dow)) continue;
    }
    const passados = (t.horarios || []).filter((h)=>h <= hm).sort();
    const slot = soId ? passados[passados.length - 1] || (t.horarios || [])[0] : passados[passados.length - 1];
    if (!slot) continue;
    const est = t.estado || {};
    const chaveSlot = hoje + " " + slot;
    if (!soId && est.ultimo_slot === chaveSlot) continue;
    if (!soId && est.ultimo_slot && String(est.ultimo_slot) > chaveSlot) continue;
    const doDia = est.dia === hoje ? est : {
      dia: hoje,
      cobrancas: 0,
      escalou: false,
      resolvido: false
    };
    if (doDia.resolvido && !soId) {
      await sb.from("ravi_tarefas").update({
        estado: {
          ...doDia,
          ultimo_slot: chaveSlot
        }
      }).eq("id", t.id);
      continue;
    }
    // o que o responsavel falou com o Ravi hoje
    let conversa = "";
    if (t.responsavel_fone) {
      const { data: cv } = await sb.from("ravi_conversas").select("papel,texto,em").like("chat", t.responsavel_fone + "%").gte("em", hoje + "T03:00:00Z").order("em").limit(30);
      conversa = (cv || []).map((c)=>(c.papel === "ravi" ? "Ravi" : t.responsavel) + " (" + new Date(new Date(c.em).getTime() + BA).toISOString().slice(11, 16) + "): " + String(c.texto).slice(0, 500)).join("\n");
    }
    _simularEnvio = simular;
    _ehMaster = false;
    _podeCriar = true;
    _semValores = false;
    _pedidoPor = "Renato (tarefa: " + t.titulo + ")";
    _chatAtual = "tarefa:" + t.id;
    _estiloFalado = false;
    _cfgAtual = cfg;
    _motorista = null;
    const tools = [
      ...FERRAMENTAS.filter((x)=>![
          "contas_a_pagar",
          "compras"
        ].includes(x.function.name)),
      FERRAMENTA_ENVIAR
    ];
    const ultimaVez = slot === (t.horarios || []).slice().sort().slice(-1)[0];
    const sys = `Voce e o RAVI, funcionario cibernetico da RF Logistica, executando uma TAREFA COM HORARIO que o Renato mandou. Agora e ${agoraTxt()}.
TAREFA #${t.id}: ${t.titulo}
INSTRUCAO DO RENATO: ${t.instrucao}
RESPONSAVEL: ${t.responsavel || "(nenhum)"}${t.responsavel_fone ? " (WhatsApp " + t.responsavel_fone + ")" : ""}
HOJE: ja cobrou ${doDia.cobrancas || 0} vez(es); ${doDia.escalou ? "o Renato JA foi avisado hoje" : "o Renato ainda nao foi avisado hoje"}. Avisar o Renato depois de ${t.escalar_apos} cobranca(s) sem resposta. ${ultimaVez ? "Este e o ULTIMO horario do dia." : ""}
CONVERSA DE HOJE ENTRE O RAVI E O RESPONSAVEL:
${conversa || "(nenhuma mensagem hoje)"}
COMO FAZER: 1) consulte o sistema com as ferramentas (ex.: frota para ver caminhoes em Manutencao, manutencoes com de/ate de hoje). 2) Decida se o que o Renato pediu ja foi feito (pelo sistema ou pela resposta do responsavel na conversa). 3) Se NAO foi feito, mande UMA mensagem ao responsavel com enviar_whatsapp: objetiva, educada, citando placas e o que falta; a cada cobranca do dia fique mais firme (1a: pedido; 2a: "ainda nao recebi"; 3a+: "e urgente, o Renato pediu"). 4) Se ja cobrou ${t.escalar_apos}+ vezes hoje sem resposta e o Renato ainda nao foi avisado, mande tambem ao Renato (para: 'Renato') um aviso curto. 5) Se estiver tudo feito, nao mande nada ao responsavel (se ele resolveu depois de cobrado, mande a ele um agradecimento curto). Nunca invente dados. Nunca mande valores em dinheiro ao responsavel.
Se achar cadastro desatualizado (data de documento que ja passou, oleo/preventiva "vencidos" ha muitos km, KM errado), nao trate como vencido: peca ao Marcelo/Sandra que corrijam no sistema (decisao do Renato).
${await memoriaTexto()}
NO FIM responda SO um JSON: {"resolvido": true|false, "cobrou": true|false, "avisou_renato": true|false, "resumo": "uma frase"}`;
    const messages = [
      {
        role: "system",
        content: sys
      },
      {
        role: "user",
        content: "Execute a tarefa agora."
      }
    ];
    let fim = null;
    const usadas = [];
    for(let r = 0; r < 8; r++){
      let resp = await chamarOpenAI(MODELO_PRINCIPAL, messages, r < 7 ? tools : undefined);
      if (!resp.ok) resp = await chamarOpenAI(MODELO_RESERVA, messages, r < 7 ? tools : undefined);
      if (!resp.ok) break;
      const j = await resp.json();
      const msg = j?.choices?.[0]?.message || {};
      if (msg.tool_calls && msg.tool_calls.length) {
        messages.push({
          role: "assistant",
          content: msg.content || null,
          tool_calls: msg.tool_calls
        });
        for (const tc of msg.tool_calls){
          let out;
          try {
            const args = JSON.parse(tc.function?.arguments || "{}");
            usadas.push(tc.function?.name + JSON.stringify(args).slice(0, 300));
            out = await executarFerramenta(tc.function?.name, args);
          } catch (e) {
            out = {
              erro: String(e.message || e).slice(0, 200)
            };
          }
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(out).slice(0, 40000)
          });
        }
        continue;
      }
      const txt = String(msg.content || "");
      const m = txt.match(/\{[\s\S]*\}/);
      try {
        fim = m ? JSON.parse(m[0]) : {
          resumo: txt.slice(0, 300)
        };
      } catch (_) {
        fim = {
          resumo: txt.slice(0, 300)
        };
      }
      break;
    }
    _simularEnvio = false;
    const cobrou = usadas.some((u)=>u.startsWith("enviar_whatsapp") && !/"para":"Renato"/i.test(u));
    const avisou = usadas.some((u)=>/^enviar_whatsapp.*"para":"Renato"/i.test(u));
    const novo = {
      ...doDia,
      ultimo_slot: chaveSlot,
      cobrancas: (doDia.cobrancas || 0) + (cobrou ? 1 : 0),
      escalou: doDia.escalou || avisou,
      resolvido: !!(fim && fim.resolvido),
      ultimo_resumo: fim?.resumo || ""
    };
    if (!simular) {
      await sb.from("ravi_tarefas").update({
        estado: novo
      }).eq("id", t.id);
      await sb.from("ravi_tarefas_log").insert({
        tarefa_id: t.id,
        slot: chaveSlot,
        resultado: {
          ...fim,
          ferramentas: usadas
        }
      });
    }
    saida.push({
      id: t.id,
      titulo: t.titulo,
      slot: chaveSlot,
      resultado: fim,
      ferramentas: usadas,
      estado: novo
    });
  }
  return {
    ok: true,
    agora: hoje + " " + hm,
    rodadas: saida
  };
}
// v21: consumo e documentos
const FERRAMENTA_CONSUMO = {
  type: "function",
  function: {
    name: "consumo_ia",
    description: "Quanto o Ravi gastou de IA (OpenAI) num periodo: chamadas, tokens e custo ESTIMADO em US$ e R$, por dia e por origem (conversas do app, WhatsApp, tarefas, resumo). Use quando perguntarem quanto o Ravi custa/gasta.",
    parameters: {
      type: "object",
      properties: {
        de: {
          type: "string",
          description: "AAAA-MM-DD (padrao: 7 dias atras)"
        },
        ate: {
          type: "string",
          description: "AAAA-MM-DD (padrao: hoje)"
        }
      }
    }
  }
};
const FERRAMENTAS_DOCS = [
  {
    type: "function",
    function: {
      name: "documentos",
      description: "Lista os documentos do cofre de Contratos da RF (contratos com clientes, fornecedores, seguro, rastreamento): id, outra parte, tipo, data e arquivo.",
      parameters: {
        type: "object",
        properties: {
          busca: {
            type: "string",
            description: "filtro por nome da outra parte, tipo ou arquivo (opcional)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ler_documento",
      description: "ABRE um documento do cofre (pelo id da lista) e responde uma pergunta sobre ele, citando a clausula/pagina. Use para prazos, multas, reajuste, rescisao, valores, obrigacoes, coberturas de seguro etc.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          pergunta: {
            type: "string"
          }
        },
        required: [
          "id",
          "pergunta"
        ]
      }
    }
  }
];
async function consumoIA(a) {
  if (!_podeCriar) return {
    erro: "consumo da IA so o Renato e o Marcelo veem"
  };
  const hoje = hojeBA(), de = /^\d{4}-\d{2}-\d{2}$/.test(String(a.de || "")) ? a.de : new Date(Date.now() + BA - 6 * 86400e3).toISOString().slice(0, 10), ate = /^\d{4}-\d{2}-\d{2}$/.test(String(a.ate || "")) ? a.ate : hoje;
  const { data: cfg } = await sb.from("torre_config").select("ravi_precos").eq("id", 1).maybeSingle();
  const P = cfg?.ravi_precos || {};
  const dolar = Number(P.dolar) || 5.3, buscaUsd = Number(P.busca_usd) || 0.01;
  const linhas = [];
  let pg = 0;
  while(pg < 20){
    const { data } = await sb.from("ravi_uso").select("em,origem,modelo,entrada,cache,saida,buscas").gte("em", de + "T03:00:00Z").lt("em", new Date(Date.parse(ate + "T03:00:00Z") + 86400e3).toISOString()).order("id").range(pg * 1000, pg * 1000 + 999);
    if (!data?.length) break;
    linhas.push(...data);
    if (data.length < 1000) break;
    pg++;
  }
  const custo = (l)=>{
    const p = (P.modelos || {})[l.modelo] || [
      2,
      0.2,
      12
    ];
    return ((l.entrada - l.cache) * p[0] + l.cache * p[1] + l.saida * p[2]) / 1e6 + (l.buscas || 0) * buscaUsd;
  };
  const tipo = (o)=>/^app:/.test(o) ? "app (icone de voz)" : /^tarefa:/.test(o) ? "tarefas" : o === "resumo" ? "resumo da manha" : /@g\.us$/.test(o) ? "grupo WhatsApp" : /@s\.whatsapp\.net$/.test(o) ? "WhatsApp privado" : "outros";
  const porDia = {}, porOrigem = {};
  let tot = 0, ch = 0;
  for (const l of linhas){
    const c = custo(l);
    tot += c;
    ch++;
    const d = new Date(Date.parse(l.em) + BA).toISOString().slice(0, 10);
    porDia[d] = (porDia[d] || 0) + c;
    const t = tipo(String(l.origem || ""));
    porOrigem[t] = porOrigem[t] || {
      chamadas: 0,
      usd: 0
    };
    porOrigem[t].chamadas++;
    porOrigem[t].usd += c;
  }
  const f = (u)=>({
      usd: "US$ " + u.toFixed(2),
      reais: brl(u * dolar)
    });
  return {
    periodo: de + " a " + ate,
    chamadas_ia: ch,
    total: f(tot),
    por_dia: Object.fromEntries(Object.entries(porDia).sort().map(([d, u])=>[
        d,
        f(u)
      ])),
    por_origem: Object.fromEntries(Object.entries(porOrigem).map(([k, v])=>[
        k,
        {
          chamadas: v.chamadas,
          ...f(v.usd)
        }
      ])),
    aviso: "custo ESTIMADO pelos precos em torre_config.ravi_precos (" + (P.obs || "") + "); dolar " + dolar + ". Voz (fala e transcricao) ainda nao entra na conta. O valor oficial e a fatura da OpenAI.",
    registro_desde: "25/10/2026"
  };
}
async function docsFerramenta(nome, a) {
  if (!_ehMaster) return {
    erro: "o cofre de Contratos e so do Renato (login master)"
  };
  if (nome === "documentos") {
    const { data } = await sb.from("contratos").select("id,parte,documento,tipo,data_contrato,nome_arquivo,observacao").order("data_contrato", {
      ascending: false
    });
    const b = norm(String(a.busca || ""));
    return {
      documentos: (data || []).filter((d)=>!b || norm([
          d.parte,
          d.tipo,
          d.nome_arquivo,
          d.observacao
        ].join(" ")).includes(b)).map((d)=>({
          id: d.id,
          parte: d.parte,
          tipo: d.tipo,
          data: d.data_contrato,
          arquivo: d.nome_arquivo,
          obs: d.observacao || undefined
        }))
    };
  }
  const { data: d } = await sb.from("contratos").select("id,parte,tipo,caminho,nome_arquivo").eq("id", String(a.id)).maybeSingle();
  if (!d) return {
    erro: "documento nao encontrado -- use a ferramenta documentos para ver os ids"
  };
  const { data: arq, error } = await sb.storage.from("contratos").download(d.caminho);
  if (error || !arq) return {
    erro: "nao consegui abrir o arquivo: " + (error?.message || "?")
  };
  const u = new Uint8Array(await arq.arrayBuffer());
  if (u.length > 15 * 1024 * 1024) return {
    erro: "arquivo grande demais para ler"
  };
  let b64 = "";
  for(let i = 0; i < u.length; i += 0x8000)b64 += String.fromCharCode(...u.subarray(i, i + 0x8000));
  b64 = btoa(b64);
  const mime = /\.pdf$/i.test(d.nome_arquivo || d.caminho) ? "application/pdf" : arq.type || "application/pdf";
  const pedido = "Voce e o Ravi, assistente da RF Logistica. Leia o documento anexo (" + (d.tipo || "contrato") + " com " + (d.parte || "?") + ") e responda em portugues do Brasil, curto e exato, a pergunta abaixo. Cite a clausula ou o item (e a pagina, se der). Se o documento nao tratar disso, diga claramente que nao encontrou. Nao invente. Pergunta: " + String(a.pergunta || "resuma os pontos principais: objeto, prazo, valores, reajuste, multas e rescisao");
  for (const modelo of [
    MODELO_PRINCIPAL,
    MODELO_RESERVA
  ]){
    try {
      const r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: "Bearer " + Deno.env.get("OPENAI_API_KEY")
        },
        body: JSON.stringify({
          model: modelo,
          .../^gpt-5\.6/.test(modelo) ? {
            reasoning: {
              effort: "low"
            }
          } : {},
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_file",
                  filename: d.nome_arquivo || "documento.pdf",
                  file_data: "data:" + mime + ";base64," + b64
                },
                {
                  type: "input_text",
                  text: pedido
                }
              ]
            }
          ]
        })
      });
      if (!r.ok) continue;
      const j = await r.json();
      await registrarUso(modelo, j?.usage);
      const t = String(j.output_text || (j.output || []).flatMap((o)=>o.content || []).map((c)=>c.text || "").join("\n")).trim();
      if (t) return {
        documento: (d.tipo || "") + " — " + (d.parte || ""),
        arquivo: d.nome_arquivo,
        resposta: t.slice(0, 6000)
      };
    } catch (_) {}
  }
  return {
    erro: "nao consegui ler o documento agora"
  };
}
// v23: canal Ravi -> Claude (pedidos de melhoria do sistema e do proprio Ravi)
const FERRAMENTA_PEDIR_CLAUDE = {
  type: "function",
  function: {
    name: "pedir_ao_claude",
    description: "REGISTRA um pedido de melhoria para o CLAUDE, a IA que programa o rf-logistica-app e o proprio Ravi (quando o Renato diz 'manda para a IA', 'fala com o Claude', 'Iar', 'pede para ajustar no codigo'). Escreva o pedido concreto e o detalhe com as PALAVRAS de quem pediu (o que viu, o que incomodou, o que quer). Uma melhoria por pedido. O Claude le a caixa quando o Renato abre o projeto e responde.",
    parameters: {
      type: "object",
      properties: {
        pedido: {
          type: "string",
          description: "o que precisa ser feito, em uma frase"
        },
        detalhe: {
          type: "string",
          description: "contexto: o que a pessoa disse ou viu, exemplo, prioridade"
        }
      },
      required: [
        "pedido"
      ]
    }
  }
};
const FERRAMENTA_PEDIDOS_CLAUDE = {
  type: "function",
  function: {
    name: "pedidos_ao_claude",
    description: "MOSTRA os pedidos ja feitos ao Claude e o andamento (aberto, em andamento, feito) com a resposta e a versao publicada. Use quando perguntarem se o Claude ja fez, o que esta pendente, ou antes de registrar um pedido repetido.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "aberto, feito ou todos (padrao todos)"
        }
      }
    }
  }
};
async function pedidoClaude(nome, a) {
  if (nome === "pedir_ao_claude") {
    const pedido = String(a.pedido || "").trim().slice(0, 500);
    if (!pedido) return {
      ok: false,
      erro: "faltou o pedido"
    };
    const { data, error } = await sb.from("ravi_pedidos_claude").insert({
      pedido,
      detalhe: String(a.detalhe || "").slice(0, 2000) || null,
      quem: _pedidoPor,
      chat: _chatAtual
    }).select("id").maybeSingle();
    return error ? {
      ok: false,
      erro: error.message
    } : {
      ok: true,
      numero: data?.id,
      aviso: "registrado na caixa do Claude; ele le quando o Renato abrir o projeto RFL"
    };
  }
  let q = sb.from("ravi_pedidos_claude").select("id,pedido,status,resposta,versao,quem,em,feito_em").order("id", {
    ascending: false
  }).limit(15);
  const st = String(a.status || "todos");
  if (st !== "todos") q = q.eq("status", st);
  const { data, error } = await q;
  return error ? {
    ok: false,
    erro: error.message
  } : {
    ok: true,
    pedidos: data
  };
}
// ===================== v25: CHAMADOS DOS MOTORISTAS =====================
// Renato (25/10/2026): "vai chegar um momento que os motoristas vao falar com ele e fazer algumas cobrancas -- minha despesa nao entrou,
// falta pagar a minha viagem, o caminhao esta com problemas, quero abastecer -- e o Ravi tem que estar pronto para resolver ou colocar
// alguem que possa resolver no circuito e acompanhar a solicitacao ate ser tratada".
// Fluxo: o Ravi primeiro olha os dados do proprio motorista (minhas_viagens_situacao) e responde se ja esta resolvido; se precisa de
// alguem, abre um CHAMADO (abrir_chamado) e manda no WhatsApp do responsavel (rotas em torre_config.ravi_chamados_rotas). A equipe
// responde ao Ravi ("chamado 12 resolvido: ...") -> atualizar_chamado -> o Ravi avisa o motorista. Sem retorno no prazo, o Ravi cobra
// o responsavel (vigiarChamados, junto com as tarefas a cada 15 min) e, depois de 2 cobrancas, avisa o Renato.
const TIPOS_CHAMADO = [
  "despesa",
  "pagamento",
  "manutencao",
  "emergencia",
  "abastecimento",
  "documento",
  "viagem",
  "outro"
];
const ROTAS_PADRAO = {
  despesa: [
    "Flávia"
  ],
  pagamento: [
    "Flávia"
  ],
  manutencao: [
    "Marcelo",
    "Sandra"
  ],
  emergencia: [
    "Marcelo",
    "Renato"
  ],
  abastecimento: [
    "Marcelo"
  ],
  documento: [
    "Sandra"
  ],
  viagem: [
    "Marcelo"
  ],
  outro: [
    "Marcelo"
  ]
};
const PRAZO_MIN = {
  emergencia: 20,
  urgente: 60,
  normal: 240
};
const ROTULO_TIPO = {
  despesa: "despesa de viagem",
  pagamento: "pagamento da viagem",
  manutencao: "problema no caminhão",
  emergencia: "EMERGÊNCIA",
  abastecimento: "abastecimento",
  documento: "documento/cadastro",
  viagem: "viagem/rota",
  outro: "outro assunto"
};
function equipePorNome(nome, cfg) {
  const n = norm(nome);
  return (Array.isArray(cfg?.ravi_equipe) ? cfg.ravi_equipe : []).find((e)=>e && e.fone && (norm(e.nome) === n || norm(e.login) === n || norm(String(e.nome || "").split(/\s+/)[0]) === n));
}
// manda um texto pelo WhatsApp do Ravi (mesmo servidor do enviar_whatsapp)
async function waEnviar(fone, mensagem, cfg, rotulo) {
  if (_simularEnvio) return {
    ok: true,
    simulado: true,
    fone,
    mensagem
  };
  try {
    const { data: ss } = await sb.from("rf_segredos").select("chave,valor").or("chave.like.wa_*");
    const sx = {};
    for (const x of ss || [])sx[x.chave] = x.valor;
    if (!sx.wa_url) return {
      ok: false,
      erro: "WhatsApp do Ravi nao configurado"
    };
    // @ts-ignore Deno API
    const client = Deno.createHttpClient({
      caCerts: [
        sx.wa_ca
      ]
    });
    const r = await fetch(`${sx.wa_url}/send-text`, {
      method: "POST",
      client,
      headers: {
        "Content-Type": "application/json",
        "X-RF-Token": sx.wa_token
      },
      body: JSON.stringify({
        phone: fone,
        message: mensagem + "\n\n" + (cfg?.assinatura || "🤖 _Ravi - RF Logística_")
      })
    });
    const corpo = await r.text().catch(()=>"");
    if (!r.ok) return {
      ok: false,
      erro: "servidor do WhatsApp recusou (" + r.status + "): " + corpo.slice(0, 120)
    };
    await sb.from("ravi_conversas").insert({
      chat: fone + "@s.whatsapp.net",
      quem: "Ravi",
      papel: "ravi",
      texto: "(" + rotulo + ") " + mensagem.slice(0, 3000)
    });
    return {
      ok: true
    };
  } catch (e) {
    return {
      ok: false,
      erro: String(e.message || e).slice(0, 150)
    };
  }
}
async function cadastroMotorista(login) {
  const { data: cad } = await sb.from("painel_dados").select("valor").eq("chave", "motoristasCad").maybeSingle();
  const m = (Array.isArray(cad?.valor) ? cad.valor : []).find((x)=>x && x.loginNome && norm(x.loginNome) === norm(login));
  let fone = String(m?.mot?.celular || "").replace(/\D/g, "");
  if (fone && fone.length <= 11) fone = "55" + fone;
  return {
    fone,
    nome: m?.mot?.nome || login
  };
}
async function viagensDoMotorista(login) {
  const { data } = await sb.from("painel_dados").select("valor").eq("chave", "viagens").maybeSingle();
  const vgs = Array.isArray(data?.valor) ? data.valor : [];
  const meu = (g)=>[
      g.motoristaNaEpoca,
      g.motoristaDesignadoNome,
      g.motorista
    ].some((x)=>x && norm(x) === norm(login));
  return vgs.filter((g)=>g && meu(g)).sort((a, b)=>String(b.data || "").localeCompare(String(a.data || "")));
}
const FERRAMENTAS_CHAMADO_MOTORISTA = [
  {
    type: "function",
    function: {
      name: "minhas_viagens_situacao",
      description: "MOSTRA a situacao das ultimas viagens DESTE motorista: datas, placa, cliente, situacao, as DESPESAS que ja foram lancadas na viagem (descricao, sem valor), os abastecimentos lancados e se o PAGAMENTO da viagem dele ja consta como feito (e em que data). Use SEMPRE antes de responder cobranca de despesa, pagamento ou abastecimento -- muitas vezes ja esta resolvido. ATENCAO: as despesas nao tem data propria, so a data da viagem; so diga que a despesa dele 'ja entrou' se a descricao E a viagem baterem com o que ele falou -- na duvida, diga o que consta e abra chamado de despesa para a equipe conferir.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "abrir_chamado",
      description: "ABRE UM CHAMADO para a equipe da RF resolver algo que o motorista pediu ou cobrou e que voce nao resolve sozinho: despesa que nao entrou, pagamento da viagem atrasado, caminhao com problema, pedir autorizacao/ajuda para abastecer, documento, duvida da viagem. O Ravi manda na hora para o responsavel certo e acompanha ate ser tratado. Escreva o assunto curto e o detalhe com TUDO que o motorista disse (o que, quando, onde, valor que ELE informou, placa, viagem). Nao abra outro se ja existe chamado aberto do mesmo assunto (veja meus_chamados).",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: TIPOS_CHAMADO,
            description: "despesa | pagamento | manutencao (caminhao com problema) | emergencia (acidente, quebrou na estrada, roubo, saude, risco) | abastecimento | documento | viagem | outro"
          },
          assunto: {
            type: "string",
            description: "uma frase curta"
          },
          detalhe: {
            type: "string",
            description: "tudo que ele contou"
          },
          urgente: {
            type: "boolean",
            description: "true se atrapalha a viagem agora (ex.: sem combustivel para seguir, caminhao parado)"
          }
        },
        required: [
          "tipo",
          "assunto"
        ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "meus_chamados",
      description: "MOSTRA os chamados deste motorista e o andamento (aberto, em andamento, resolvido) com a resposta da equipe. Use quando ele cobrar algo que ja pediu antes.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];
const FERRAMENTAS_CHAMADO_EQUIPE = [
  {
    type: "function",
    function: {
      name: "chamados",
      description: "LISTA os chamados dos motoristas (padrao: os que nao foram resolvidos) com numero, motorista, assunto, responsavel, ha quanto tempo e quantas vezes o Ravi ja cobrou.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "abertos (padrao), resolvidos ou todos"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "atualizar_chamado",
      description: "ATUALIZA um chamado de motorista quando alguem da equipe diz que tratou, esta tratando ou precisa de algo do motorista (ex.: 'chamado 12 resolvido, lancei a despesa'; 'ja paguei o Anderson'; 'manda ele levar na oficina X'). O Ravi avisa o motorista na hora com a resposta.",
      parameters: {
        type: "object",
        properties: {
          numero: {
            type: "number"
          },
          status: {
            type: "string",
            enum: [
              "em_andamento",
              "aguardando_motorista",
              "resolvido",
              "cancelado"
            ]
          },
          resposta: {
            type: "string",
            description: "o que foi feito ou o que o motorista precisa fazer, em linguagem simples para ele"
          },
          avisar_motorista: {
            type: "boolean",
            description: "padrao true"
          }
        },
        required: [
          "numero",
          "status"
        ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "encaminhar_chamado",
      description: "PASSA um chamado para outra pessoa da equipe (ex.: 'isso e com a Sandra'). O Ravi manda o chamado para ela e passa a cobrar ela.",
      parameters: {
        type: "object",
        properties: {
          numero: {
            type: "number"
          },
          para: {
            type: "string",
            description: "nome da pessoa da equipe"
          }
        },
        required: [
          "numero",
          "para"
        ]
      }
    }
  }
];
function textoChamadoEquipe(c) {
  return `📌 *Chamado #${c.id}* — ${c.prioridade === "emergencia" ? "🚨 *EMERGÊNCIA* — " : c.prioridade === "urgente" ? "⚠️ *urgente* — " : ""}motorista *${c.motorista}*${c.placa ? " (" + c.placa + ")" : ""}
Assunto: ${ROTULO_TIPO[c.tipo] || c.tipo} — ${c.assunto}${c.detalhe ? "\nO que ele disse: " + c.detalhe : ""}${c.fone ? "\nWhatsApp dele: " + c.fone : ""}

Quando tratar, me responda aqui: _chamado ${c.id} resolvido: o que foi feito_ (ou _chamado ${c.id} em andamento_). Eu aviso o motorista e acompanho.`;
}
async function abrirChamado(a) {
  const p = _motorista;
  if (!p) return {
    ok: false,
    erro: "so motorista abre chamado por aqui"
  };
  const tipo = TIPOS_CHAMADO.includes(a.tipo) ? a.tipo : "outro";
  const assunto = String(a.assunto || "").trim().slice(0, 200);
  if (!assunto) return {
    ok: false,
    erro: "faltou o assunto"
  };
  const { data: ja } = await sb.from("ravi_chamados").select("id,assunto,status").eq("login", p.login).eq("tipo", tipo).in("status", [
    "aberto",
    "em_andamento",
    "aguardando_motorista"
  ]).limit(1);
  if (ja && ja.length) return {
    ok: false,
    ja_existe: ja[0],
    aviso: "ja tem chamado aberto desse assunto -- informe o andamento em vez de abrir outro"
  };
  const cfg = _cfgAtual || {};
  const rotas = cfg.ravi_chamados_rotas && typeof cfg.ravi_chamados_rotas === "object" ? cfg.ravi_chamados_rotas : ROTAS_PADRAO;
  const nomes = rotas[tipo] || ROTAS_PADRAO[tipo] || [
    "Marcelo"
  ];
  const resp = nomes.map((n)=>equipePorNome(n, cfg)).filter(Boolean).map((e)=>({
      nome: e.nome || e.login,
      fone: String(e.fone).replace(/\D/g, "")
    }));
  const prioridade = tipo === "emergencia" ? "emergencia" : a.urgente ? "urgente" : "normal";
  const vgs = await viagensDoMotorista(p.login);
  const atual = vgs.find((g)=>g.statusMotorista === "em_andamento") || vgs[0] || null;
  const cad = await cadastroMotorista(p.login);
  const linha = {
    motorista: p.nome,
    login: p.login,
    fone: cad.fone,
    chat: _chatAtual,
    placa: atual ? placaN(atual.placa) : null,
    viagem_id: atual ? String(atual.id) : null,
    tipo,
    prioridade,
    assunto,
    detalhe: String(a.detalhe || "").slice(0, 1500) || null,
    responsaveis: resp,
    prazo_em: new Date(Date.now() + PRAZO_MIN[prioridade] * 60e3).toISOString(),
    historico: [
      {
        em: new Date().toISOString(),
        evento: "aberto pelo Ravi",
        por: p.nome
      }
    ]
  };
  const { data: c, error } = await sb.from("ravi_chamados").insert(linha).select("*").maybeSingle();
  if (error || !c) return {
    ok: false,
    erro: error?.message || "nao gravou"
  };
  const envios = [];
  for (const r of resp)envios.push({
    para: r.nome,
    ...await waEnviar(r.fone, textoChamadoEquipe(c), cfg, "chamado #" + c.id)
  });
  return {
    ok: true,
    numero: c.id,
    responsaveis: resp.map((r)=>r.nome),
    prioridade,
    envios,
    diga_ao_motorista: `chamado #${c.id} aberto e enviado para ${resp.map((r)=>r.nome).join(" e ")}; o Ravi acompanha e avisa quando for tratado`
  };
}
async function meusChamados() {
  const p = _motorista;
  if (!p) return {
    ok: false
  };
  const { data } = await sb.from("ravi_chamados").select("id,tipo,assunto,status,resposta,responsaveis,criado_em,resolvido_em").eq("login", p.login).order("id", {
    ascending: false
  }).limit(10);
  return {
    ok: true,
    chamados: (data || []).map((c)=>({
        numero: c.id,
        assunto: c.assunto,
        status: c.status,
        com: (c.responsaveis || []).map((r)=>r.nome).join(" e "),
        aberto: dataHora(c.criado_em),
        resposta: c.resposta || null
      }))
  };
}
async function minhasViagensSituacao() {
  const p = _motorista;
  if (!p) return {
    ok: false
  };
  const vgs = (await viagensDoMotorista(p.login)).slice(0, 6);
  return {
    ok: true,
    viagens: vgs.map((g)=>({
        data: g.data,
        fim: g.dataFim || null,
        placa: placaN(g.placa),
        cliente: g.cliente || "",
        situacao: g.statusMotorista || "",
        despesas_lancadas: (Array.isArray(g.outrosItens) ? g.outrosItens : []).map((o)=>o && (o.desc || "despesa sem descricao")).filter(Boolean),
        abastecimentos_lancados: Array.isArray(g.combustivelItens) ? g.combustivelItens.length : 0,
        pagamento_do_motorista: g.pagoMotorista === true || g.pagoMotorista === "true" ? "pago" + (g.dataPagamentoMotorista ? " em " + String(g.dataPagamentoMotorista).split("-").reverse().join("/") : "") : "ainda nao consta como pago"
      }))
  };
}
async function chamadosEquipe(nome, a) {
  const cfg = _cfgAtual || {};
  if (nome === "chamados") {
    let q = sb.from("ravi_chamados").select("*").order("id", {
      ascending: false
    }).limit(25);
    const st = String(a.status || "abertos");
    if (st === "abertos") q = q.in("status", [
      "aberto",
      "em_andamento",
      "aguardando_motorista"
    ]);
    else if (st === "resolvidos") q = q.eq("status", "resolvido");
    const { data } = await q;
    return {
      ok: true,
      chamados: (data || []).map((c)=>({
          numero: c.id,
          motorista: c.motorista,
          placa: c.placa,
          tipo: c.tipo,
          prioridade: c.prioridade,
          assunto: c.assunto,
          detalhe: c.detalhe,
          status: c.status,
          com: (c.responsaveis || []).map((r)=>r.nome).join(" e "),
          aberto: dataHora(c.criado_em),
          cobrancas: c.cobrancas,
          resposta: c.resposta
        }))
    };
  }
  const id = Number(a.numero);
  if (!id) return {
    ok: false,
    erro: "faltou o numero do chamado"
  };
  const { data: c } = await sb.from("ravi_chamados").select("*").eq("id", id).maybeSingle();
  if (!c) return {
    ok: false,
    erro: "nao achei o chamado #" + id
  };
  const hist = Array.isArray(c.historico) ? c.historico : [];
  if (nome === "encaminhar_chamado") {
    const e = equipePorNome(String(a.para || ""), cfg);
    if (!e) return {
      ok: false,
      erro: "nao achei '" + a.para + "' na equipe"
    };
    const resp = [
      {
        nome: e.nome || e.login,
        fone: String(e.fone).replace(/\D/g, "")
      }
    ];
    await sb.from("ravi_chamados").update({
      responsaveis: resp,
      cobrancas: 0,
      prazo_em: new Date(Date.now() + PRAZO_MIN[c.prioridade || "normal"] * 60e3).toISOString(),
      atualizado_em: new Date().toISOString(),
      historico: [
        ...hist,
        {
          em: new Date().toISOString(),
          evento: "encaminhado para " + resp[0].nome,
          por: _pedidoPor
        }
      ]
    }).eq("id", id);
    const env = await waEnviar(resp[0].fone, textoChamadoEquipe({
      ...c,
      responsaveis: resp
    }) + "\n(" + _pedidoPor + " passou para você)", cfg, "chamado #" + id);
    return {
      ok: true,
      numero: id,
      agora_com: resp[0].nome,
      envio: env
    };
  }
  // atualizar_chamado
  const status = [
    "em_andamento",
    "aguardando_motorista",
    "resolvido",
    "cancelado"
  ].includes(a.status) ? a.status : "em_andamento";
  const resposta = String(a.resposta || "").trim().slice(0, 1500);
  const agoraIso = new Date().toISOString();
  await sb.from("ravi_chamados").update({
    status,
    resposta: resposta || c.resposta,
    tratado_por: _pedidoPor,
    atualizado_em: agoraIso,
    resolvido_em: status === "resolvido" ? agoraIso : c.resolvido_em,
    prazo_em: status === "em_andamento" ? new Date(Date.now() + PRAZO_MIN[c.prioridade || "normal"] * 60e3).toISOString() : c.prazo_em,
    historico: [
      ...hist,
      {
        em: agoraIso,
        evento: status,
        por: _pedidoPor,
        resposta
      }
    ]
  }).eq("id", id);
  let aviso = null;
  if (a.avisar_motorista !== false && c.fone) {
    const frase = status === "resolvido" ? `✅ ${c.motorista}, seu chamado *#${id}* (${c.assunto}) foi *resolvido* por ${_pedidoPor}.${resposta ? "\n" + resposta : ""}` : status === "cancelado" ? `${c.motorista}, o chamado *#${id}* (${c.assunto}) foi encerrado por ${_pedidoPor}.${resposta ? "\n" + resposta : ""}` : status === "aguardando_motorista" ? `${c.motorista}, sobre o chamado *#${id}* (${c.assunto}), ${_pedidoPor} precisa de você:${resposta ? "\n" + resposta : ""}` : `${c.motorista}, seu chamado *#${id}* (${c.assunto}) está *em andamento* com ${_pedidoPor}.${resposta ? "\n" + resposta : ""}`;
    aviso = await waEnviar(c.fone, frase, cfg, "chamado #" + id);
  }
  return {
    ok: true,
    numero: id,
    status,
    motorista_avisado: !!(aviso && aviso.ok),
    aviso
  };
}
async function blocoChamadosAbertos() {
  const { data } = await sb.from("ravi_chamados").select("id,motorista,placa,tipo,prioridade,assunto,status,responsaveis,criado_em,cobrancas").in("status", [
    "aberto",
    "em_andamento",
    "aguardando_motorista"
  ]).order("id").limit(20);
  if (!data || !data.length) return "";
  return "\nCHAMADOS DE MOTORISTAS EM ABERTO (quando alguem da equipe disser que tratou um deles, use atualizar_chamado; se disser que e com outra pessoa, encaminhar_chamado):\n" + data.map((c)=>`- #${c.id} ${c.motorista}${c.placa ? " " + c.placa : ""}: ${c.assunto} [${c.tipo}${c.prioridade !== "normal" ? ", " + c.prioridade : ""}] ${c.status}, com ${(c.responsaveis || []).map((r)=>r.nome).join(" e ")}, aberto ${dataHora(c.criado_em)}${c.cobrancas ? ", ja cobrei " + c.cobrancas + "x" : ""}`).join("\n");
}
// cobra quem nao deu retorno no prazo; depois de 2 cobrancas avisa o Renato (roda com as tarefas, a cada 15 min)
async function vigiarChamados(cfg, simular) {
  const agora = new Date(), ba = new Date(Date.now() + BA), h = ba.getUTCHours(), dow = ba.getUTCDay();
  const expediente = dow >= 1 && dow <= 6 && h >= 7 && h < 19;
  const { data } = await sb.from("ravi_chamados").select("*").in("status", [
    "aberto",
    "em_andamento"
  ]).lte("prazo_em", agora.toISOString()).order("id").limit(20);
  const feitos = [];
  _simularEnvio = simular;
  for (const c of data || []){
    if (c.prioridade !== "emergencia" && !expediente) continue; // fora do expediente so cobra emergencia
    const horas = (agora.getTime() - new Date(c.criado_em).getTime()) / 3600e3;
    const tempo = horas < 1 ? Math.round(horas * 60) + " min" : (Math.round(horas * 10) / 10).toString().replace(".", ",") + " h";
    const hist = Array.isArray(c.historico) ? c.historico : [];
    if ((c.cobrancas || 0) < 2) {
      for (const r of c.responsaveis || [])await waEnviar(r.fone, `🔔 Cobrança do *chamado #${c.id}* — motorista *${c.motorista}*${c.placa ? " (" + c.placa + ")" : ""}: ${c.assunto}. Está sem retorno há ${tempo}.\nJá tratou? Me responda aqui: _chamado ${c.id} resolvido: o que foi feito_ — ou me diga quando vai resolver.`, cfg, "cobrança chamado #" + c.id);
      if (!simular) await sb.from("ravi_chamados").update({
        cobrancas: (c.cobrancas || 0) + 1,
        prazo_em: new Date(Date.now() + PRAZO_MIN[c.prioridade || "normal"] * 60e3).toISOString(),
        historico: [
          ...hist,
          {
            em: agora.toISOString(),
            evento: "Ravi cobrou " + (c.responsaveis || []).map((r)=>r.nome).join(" e ")
          }
        ]
      }).eq("id", c.id);
      feitos.push({
        id: c.id,
        cobrou: true
      });
    } else if (!c.escalou) {
      const ren = equipePorNome("Renato", cfg);
      if (ren) await waEnviar(String(ren.fone).replace(/\D/g, ""), `⚠️ Renato, o *chamado #${c.id}* do motorista *${c.motorista}*${c.placa ? " (" + c.placa + ")" : ""} — ${c.assunto} — está sem solução há ${tempo}. Já cobrei ${(c.responsaveis || []).map((r)=>r.nome).join(" e ")} ${c.cobrancas} vezes.`, cfg, "escalada chamado #" + c.id);
      if (!simular) await sb.from("ravi_chamados").update({
        escalou: true,
        prazo_em: new Date(Date.now() + 24 * 3600e3).toISOString(),
        historico: [
          ...hist,
          {
            em: agora.toISOString(),
            evento: "Ravi avisou o Renato"
          }
        ]
      }).eq("id", c.id);
      feitos.push({
        id: c.id,
        avisou_renato: true
      });
    }
  }
  _simularEnvio = false;
  return feitos;
}
// ===================== fim v25 =====================
// v22: portfolio institucional oficial
const FERRAMENTA_PORTFOLIO = {
  type: "function",
  function: {
    name: "portfolio_institucional",
    description: "Gera o LINK (vale 7 dias) do PORTFOLIO INSTITUCIONAL OFICIAL da RF (apresentacao da empresa, 10 paginas: quem somos, estrutura, frota de 21 caminhoes, solucoes, 9 parceiros, compliance, contato). Use SEMPRE que pedirem apresentacao institucional, portfolio ou material da empresa -- nao monte outro. versao 'completa' (12 MB, para WhatsApp, e-mail e impressao) ou 'leve' (848 KB, para site de cadastro de fornecedor com limite de 1 MB). Para mandar a alguem, use depois enviar_whatsapp com o link.",
    parameters: {
      type: "object",
      properties: {
        versao: {
          type: "string",
          enum: [
            "completa",
            "leve"
          ]
        }
      }
    }
  }
};
async function portfolioLink(a) {
  const leve = String(a.versao || "") === "leve";
  const caminho = "institucional/RF_Logistica_Portfolio_2026-10" + (leve ? "_Envio" : "") + ".pdf";
  const { data, error } = await sb.storage.from("documentos").createSignedUrl(caminho, 7 * 86400, {
    download: leve ? "RF_Logistica_Portfolio_Envio.pdf" : "RF_Logistica_Portfolio.pdf"
  });
  if (error || !data?.signedUrl) return {
    erro: "nao consegui gerar o link do portfolio: " + (error?.message || "?")
  };
  _arquivos.push({
    cod: "[[ARQ" + (_arquivos.length + 1) + "]]",
    nome: "Portfólio RF Logística" + (leve ? " (versão leve)" : "") + " — PDF",
    url: data.signedUrl
  }); // v29
  const cod = _arquivos[_arquivos.length - 1].cod;
  return {
    versao: leve ? "leve (848 KB)" : "completa (12 MB)",
    link: cod,
    como_usar_o_link: "NUNCA escreva o link por extenso: escreva exatamente " + cod + " onde o link deve ir (na mensagem do enviar_whatsapp, por exemplo) -- o sistema troca pelo link certo. Para quem pediu, o arquivo ja vai anexado na sua resposta: so diga que esta mandando o portfolio (nao precisa escrever o codigo).",
    valido_ate: new Date(Date.now() + BA + 7 * 86400e3).toISOString().slice(0, 10).split("-").reverse().join("/"),
    paginas: 10,
    aprovado: "Renato, 25/10/2026"
  };
}
async function pesquisarInternet(q) {
  q = q.trim().slice(0, 500);
  if (!q) return {
    erro: "sem pergunta"
  };
  const key = Deno.env.get("OPENAI_API_KEY");
  // v16: a resposta da pesquisa pode ir direto para a pessoa, entao ja sai no estilo do Ravi
  const estilo = _estiloFalado ? "A resposta sera FALADA em audio: curta (ate uns 30 segundos), frases simples, sem asterisco, sem lista, sem emoji, sem link; numeros e valores do jeito que se fala (ex.: 'sete reais e sessenta centavos'). " : "Estilo WhatsApp: curto (ate uns 6 linhas), sem titulos, sem tabela, sem link; negrito com UM asterisco so em 1 a 3 palavras-chave (o numero ou o dado principal), nunca na frase ou no paragrafo inteiro. ";
  const pedido = "Voce e o Ravi, assistente da RF Logistica (Feira de Santana/BA). Pesquise na internet e responda em portugues do Brasil, direto ao ponto, com o dado principal primeiro, e diga de qual site veio (ex.: segundo o Climatempo). Nunca diga que a fonte e a OpenAI ou o sistema. " + estilo + "Hoje e " + hojeBA() + " (horario da Bahia)." + (_pergOriginal ? " A pessoa perguntou: \"" + _pergOriginal.slice(0, 400) + "\"." : "") + " Pesquisa: " + q;
  const local = {
    country: "BR",
    region: "Bahia",
    city: "Feira de Santana",
    timezone: "America/Bahia"
  };
  // v16: medido em 25/10 -- gpt-5.4-mini SEM raciocinio e no maximo 2 buscas: 1,5 a 3 s (com raciocinio "low" chegava a 16 s e 8 buscas).
  //   O gpt-4o-mini-search-preview foi desativado pela OpenAI; a reserva agora e o modelo principal.
  const buscar = async (modelo)=>{
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer " + key
      },
      body: JSON.stringify({
        model: modelo,
        reasoning: {
          effort: "none"
        },
        max_tool_calls: 2,
        tools: [
          {
            type: "web_search",
            search_context_size: "low",
            user_location: {
              type: "approximate",
              ...local
            }
          }
        ],
        input: pedido
      })
    });
    if (!r.ok) throw new Error(modelo + " " + r.status);
    const j = await r.json();
    await registrarUso(modelo, j?.usage, (j.output || []).filter((o)=>o.type === "web_search_call").length); // v21
    const t = String(j.output_text || (j.output || []).flatMap((o)=>o.content || []).map((c)=>c.text || "").join("\n"));
    if (!t.trim()) throw new Error("vazio");
    return {
      resultado: t.slice(0, 6000),
      via: modelo
    };
  };
  for (const m of [
    MODELO_RESERVA,
    MODELO_PRINCIPAL
  ]){
    try {
      return await buscar(m);
    } catch (_) {}
  }
  return {
    erro: "nao consegui pesquisar na internet agora"
  };
}
// limpa links que o buscador coloca no texto (a resposta e falada ou vai pelo WhatsApp)
// v29: troca o codigo [[ARQn]] pelo link exato (ou tira)
function trocarArq(t, modo) {
  return String(t || "").replace(/\[\[ARQ(\d+)\]\]/g, (_m, n)=>{
    const a = _arquivos[Number(n) - 1];
    return modo === "url" && a ? a.url : "";
  });
}
function semLinks(t) {
  let x = String(t || "").replace(/\s*\(\[[^\]]+\]\([^)]+\)\)/g, "").replace(/\*\*(.+?)\*\*/g, "*$1*");
  if (_estiloFalado) x = x.replace(/\*/g, "");
  return x.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1").replace(/\(?https?:\/\/\S+\)?/g, "").replace(/\s+([.,;])/g, "$1").replace(/[ \t]{2,}/g, " ").trim();
}
// v15: login do painel -- confere o token do Supabase e o perfil (admin/user ativo)
const CORS_APP = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const jsonApp = (o, st = 200)=>new Response(JSON.stringify(o), {
    status: st,
    headers: {
      ...CORS_APP,
      "Content-Type": "application/json"
    }
  });
async function usuarioDoApp(auth) {
  const jwt = String(auth || "").replace(/^Bearer\s+/i, "");
  if (!jwt || jwt.split(".").length !== 3) return null;
  let uid = "", email = "";
  try {
    const us = createClient(SB_URL, Deno.env.get("SUPABASE_ANON_KEY"), {
      global: {
        headers: {
          Authorization: "Bearer " + jwt
        }
      }
    });
    if (typeof us.auth.getClaims === "function") {
      const { data } = await us.auth.getClaims(jwt);
      const c = data?.claims;
      if (c && c.sub && c.role === "authenticated" && (!c.exp || c.exp * 1000 > Date.now())) {
        uid = String(c.sub);
        email = String(c.email || "");
      }
    }
    if (!uid) {
      const { data: ud } = await us.auth.getUser();
      uid = ud?.user?.id || "";
      email = String(ud?.user?.email || "");
    }
  } catch (_) {
    return null;
  }
  if (!uid) return null;
  const { data: pf } = await sb.from("profiles").select("id,nome,papel,ativo").eq("id", uid).maybeSingle();
  if (!pf || pf.ativo !== true || ![
    "admin",
    "user"
  ].includes(String(pf.papel))) return null;
  if (!email) {
    try {
      const { data: au } = await sb.auth.admin.getUserById(uid);
      email = String(au?.user?.email || "");
    } catch (_) {}
  }
  return {
    id: uid,
    nome: String(pf.nome || email || "equipe").split(/\s+/)[0],
    email
  };
}
// v42: setor (caixa da tela do Ravi) de cada ferramenta
const SETOR_DA_FERRAMENTA = {
  frota: "frota",
  abastecimentos: "viagens",
  lancar_abastecimento: "viagens",
  lancar_abastecimento_motorista: "viagens",
  finalizar_viagem_motorista: "viagens",
  aprovar_abastecimento: "viagens",
  rejeitar_abastecimento: "viagens",
  manutencoes: "manutencao",
  saude_frota: "manutencao",
  viagens: "viagens",
  entregas: "viagens",
  torre_ao_vivo: "viagens",
  criar_viagem: "viagens",
  iniciar_viagem: "viagens",
  finalizar_viagem: "viagens",
  mudar_data_viagem: "viagens",
  registrar_motivo: "viagens",
  aprovar_desvio: "viagens",
  minhas_viagens_situacao: "viagens",
  contas_a_pagar: "financeiro",
  compras: "financeiro",
  lancar_compra_foto: "financeiro",
  marcar_viagens_pagas: "financeiro",
  documentos_fiscais: "viagens",
  consumo_ia: "administracao",
  motoristas: "cadastros",
  documentos_caminhao: "cadastros",
  enviar_documento: "cadastros",
  portfolio_institucional: "marketing",
  chamados: "viagens",
  abrir_chamado: "viagens",
  atualizar_chamado: "viagens",
  encaminhar_chamado: "viagens",
  meus_chamados: "viagens",
  criar_tarefa: "administracao",
  listar_tarefas: "administracao",
  parar_tarefa: "administracao",
  enviar_whatsapp: "administracao",
  lembrar: "administracao",
  esquecer: "administracao",
  pedir_ao_claude: "administracao",
  pedidos_ao_claude: "administracao",
  documentos: "administracao",
  ler_documento: "administracao",
  excecoes_abertas: "administracao"
};
const SETOR_PALAVRAS = [
  [
    "manutencao",
    /manuten|oficina|[oó]leo|pneu|freio|correia|pe[cç]a|pend[eê]ncia de manut|sa[uú]de d|preventiv|arrefec|motor/i
  ],
  [
    "frota",
    /frota|caminh[aã]o|caminh[oõ]es|ve[ií]culo|abastec|consumo|km\/l|placa|[A-Z]{3}\d[A-Z0-9]\d{2}/i
  ],
  [
    "viagens",
    /viage|rota|entrega|torre|motorista em rota|parado|sa[ií]da|chegada/i
  ],
  [
    "carregamento",
    /carregament|carga|roteiriz|focri|suzano|mateus|jdl|s[aã]o roque|goi[aá]s/i
  ],
  [
    "financeiro",
    /financeir|pagament|pago|receb|conta|boleto|fatur|custo|lucro|margem|compra|extrato|r\$/i
  ],
  [
    "cadastros",
    /cadastr|cnh|documento|crlv|contrato/i
  ],
  [
    "marketing",
    /marketing|portf[oó]lio|apresenta[cç][aã]o|instagram|campanha|cliente novo/i
  ],
  [
    "pessoal",
    /pessoal|folha|sal[aá]rio|f[eé]rias|chamado|funcion[aá]rio/i
  ],
  [
    "administracao",
    /exce[cç][aã]o|central|previs[aã]o|tarefa|usu[aá]rio|lembr/i
  ]
];
const CAIXAS_TXT = "frota (caminhoes, cadastro e status de cada caminhao, alocacao por cliente) | manutencao (vencimentos, manutencoes, pendencias de manutencao, oleo e filtros, almoxarifado, saude da frota e manutencao prevista) | viagens (viagens, abastecimento, status do dia, torre de controle e onde estao os caminhoes, jornada, logistica reversa, documentos da viagem, CT-e/MDF-e/CIOT, motoristas e pagamento deles, chamados dos motoristas) | carregamento (Suzano, Goias, Sao Roque, carga Mateus, rota JDL, conferencia de carga, fracionado) | financeiro (dashboard, contas, financeiro, custos, graficos, saldo por caminhao, dividas, compras, conciliacao, medicoes, tributario, recebimentos de clientes) | cadastros (documentos, cadastro de motorista, contratos) | marketing (campanhas, publicacoes, redes sociais, portfolio) | pessoal (area pessoal e privada do Renato: aplicacoes, emprestimos) | administracao (usuarios, Central de Excecoes, previsoes, tarefas do Ravi, melhorias do sistema e pedidos ao Claude, memoria)";
function caixasDaResposta(t) {
  const ok = [
    "frota",
    "manutencao",
    "viagens",
    "carregamento",
    "financeiro",
    "cadastros",
    "marketing",
    "pessoal",
    "administracao"
  ];
  let caixas = [];
  const texto = String(t || "").replace(/\[\[\s*CAIXAS?\s*:([^\]]*)\]\]/gi, (_m, l)=>{
    caixas = l.split(/[,;\s]+/).map((x)=>x.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")).filter((x)=>ok.includes(x));
    return "";
  }).trim();
  return {
    texto,
    caixas: Array.from(new Set(caixas)).slice(0, 3)
  };
}
function setoresDoTexto(t) {
  const o = [];
  for (const [s, re] of SETOR_PALAVRAS)if (re.test(t)) o.push(s);
  return o.slice(0, 3);
}
const FERRAMENTAS_V42 = [
  {
    type: "function",
    function: {
      name: "saude_frota",
      description: "Saude da frota (manutencao preditiva, calculada todo dia pelo robo de Previsao): score 0-100 de cada caminhao com os motivos (falha que se repete, pendencia aberta, custo por km acima da media, manutencao vencida/perto, km e idade) e a MANUTENCAO PREVISTA (oleo, pneus, correia: em quantos dias, por volta de que data, confianca). Use para 'como esta o caminhao X', 'qual caminhao tem risco de quebrar', 'proxima manutencao'. Fale sempre 'provavelmente' e a confianca.",
      parameters: {
        type: "object",
        properties: {
          placa: {
            type: "string",
            description: "Placa (opcional)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "excecoes_abertas",
      description: "Central de Excecoes: divergencias abertas que os robos dos setores encontraram (abastecimento, financeiro JT, manutencao) com quem esta cobrado, prazo e gravidade. Use para 'o que esta pendente', 'o que precisa de mim', 'o que esta parado'.",
      parameters: {
        type: "object",
        properties: {
          setor: {
            type: "string",
            description: "abastecimento | financeiro | manutencao | gestor (opcional)"
          }
        }
      }
    }
  }
];
const FERRAMENTAS = [
  {
    type: "function",
    function: {
      name: "viagens",
      description: "Viagens da RF com faturado (valor), pago, despesas e sobra (lucro) calculados pelo sistema. Use para faturamento, a receber, lucro/margem, viagens de um cliente, placa ou motorista, viagens abertas. Datas no formato AAAA-MM-DD.",
      parameters: {
        type: "object",
        properties: {
          de: {
            type: "string"
          },
          ate: {
            type: "string"
          },
          cliente: {
            type: "string"
          },
          placa: {
            type: "string"
          },
          motorista: {
            type: "string"
          },
          so_nao_pagas: {
            type: "boolean"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "contas_a_pagar",
      description: "Parcelas de compras em aberto (com vencimento e se esta VENCIDA) e as dividas fixas mensais. Use para contas vencidas, a vencer, o que pagar na semana/mes.",
      parameters: {
        type: "object",
        properties: {
          situacao: {
            type: "string",
            enum: [
              "vencidas",
              "abertas",
              "todas"
            ]
          },
          ate: {
            type: "string",
            description: "vencimento ate esta data (AAAA-MM-DD)"
          },
          fornecedor: {
            type: "string"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compras",
      description: "Compras/gastos da RF (numero, fornecedor, descricao, categoria, placa, valor, situacao: aprovacao, nota, pagamento, conciliada, reprovada, cancelada). Use para quanto gastou, compras de um fornecedor ou placa, compras pendentes.",
      parameters: {
        type: "object",
        properties: {
          de: {
            type: "string"
          },
          ate: {
            type: "string"
          },
          fornecedor: {
            type: "string"
          },
          placa: {
            type: "string"
          },
          categoria: {
            type: "string"
          },
          situacao: {
            type: "string"
          },
          numero: {
            type: "number"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "frota",
      description: "Caminhoes da frota: modelo, tipo, motorista, situacao, KM atual, troca de oleo (proxima, quanto falta; negativo = vencida), vencimento de seguro/cronotacografo/emplacamento, receita e custo do mes, e itens de manutencao preventiva vencidos ou perto.",
      parameters: {
        type: "object",
        properties: {
          placa: {
            type: "string"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "manutencoes",
      description: "Historico de manutencoes lancadas (data, placa, categoria, oficina, pecas/servicos, valor).",
      parameters: {
        type: "object",
        properties: {
          placa: {
            type: "string"
          },
          de: {
            type: "string"
          },
          ate: {
            type: "string"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "motoristas",
      description: "Motoristas cadastrados: nome, celular, cidade, categoria e vencimento da CNH, placa e se o login esta ativo. Nunca devolve CPF, RG ou endereco.",
      parameters: {
        type: "object",
        properties: {
          nome: {
            type: "string"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "entregas",
      description: "Entregas/paradas das rotas: recebedor, cidade, placa, motorista, data prevista, status (pendente/concluida), entregue em, ocorrencia.",
      parameters: {
        type: "object",
        properties: {
          placa: {
            type: "string"
          },
          data: {
            type: "string",
            description: "data prevista AAAA-MM-DD"
          },
          status: {
            type: "string",
            enum: [
              "pendente",
              "concluida"
            ]
          },
          recebedor: {
            type: "string"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "abastecimentos",
      description: "Abastecimentos lancados pelos motoristas: id, data, placa, motorista, km, litros, valor, status (pendente/aprovado/rejeitado).",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: [
              "pendente",
              "aprovado",
              "rejeitado"
            ]
          },
          placa: {
            type: "string"
          },
          de: {
            type: "string"
          },
          ate: {
            type: "string"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "documentos_fiscais",
      description: "CT-e e MDF-e emitidos: tipo, numero, data, cliente, placa, motorista, valor do frete, valor da carga, cidade/UF, cancelado/encerrado.",
      parameters: {
        type: "object",
        properties: {
          placa: {
            type: "string"
          },
          de: {
            type: "string"
          },
          ate: {
            type: "string"
          },
          tipo: {
            type: "string"
          },
          numero: {
            type: "string"
          },
          cliente: {
            type: "string"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "torre_ao_vivo",
      description: "Posicao atual dos caminhoes (rastreador), viagens em monitoramento na Torre (cidades feitas, proxima, chegada prevista) e alertas das ultimas 12h.",
      parameters: {
        type: "object",
        properties: {
          placa: {
            type: "string"
          }
        }
      }
    }
  }
];
async function executarFerramenta(nome, a) {
  a = a || {};
  if (nome === "pesquisar_internet") return await pesquisarInternet(String(a.pergunta || "")); // v15
  if (_semValores && [
    "contas_a_pagar",
    "compras"
  ].includes(nome)) return {
    erro: "valores nao podem ser passados nesta conversa"
  }; // v10
  if ([
    "contas_a_pagar",
    "compras",
    "frota"
  ].includes(nome)) {
    const d0 = await dadosApp();
    if (!d0 || !d0.gerado) return {
      aviso: "os dados calculados pelo sistema ainda nao chegaram (chegam quando um administrador abre o sistema na versao v703 ou mais nova); use o texto do sistema que voce ja tem"
    };
  }
  if (nome === "viagens") {
    const d = await dadosApp();
    let l = Array.isArray(d.viagens) ? d.viagens : []; // v6.2: sem filtro de lapides -- a lista da nuvem ja e a valida (o filtro tirava 3 viagens que o app conta)
    if (!l.length) l = (await painel("viagens")).map((v)=>({
        id: v.id,
        data: v.data,
        cliente: v.cliente,
        placa: v.placa,
        motorista: v.motoristaNaEpoca || v.motoristaDesignadoNome,
        valor: Number(v.valorViagem) || 0,
        pago: !!v.pago,
        status: v.statusMotorista
      }));
    l = l.filter((v)=>noPeriodo(v.data, a.de, a.ate) && tem(v.cliente, a.cliente) && (!a.placa || placaN(v.placa) === placaN(a.placa)) && tem(v.motorista, a.motorista) && (!a.so_nao_pagas || !v.pago));
    l.sort((x, y)=>String(y.data).localeCompare(String(x.data)));
    const por = {};
    let fat = 0, pago = 0, desp = 0, sobra = 0;
    for (const v of l){
      const k = v.cliente || "(sem cliente)";
      por[k] = por[k] || {
        viagens: 0,
        faturado: 0,
        pago: 0,
        a_receber: 0,
        despesas: 0,
        sobra: 0
      };
      const p = por[k];
      p.viagens++;
      p.faturado += v.valor || 0;
      if (v.pago) p.pago += v.valor || 0;
      else p.a_receber += v.valor || 0;
      p.despesas += v.despesas || 0;
      p.sobra += v.sobra || 0;
      fat += v.valor || 0;
      if (v.pago) pago += v.valor || 0;
      desp += v.despesas || 0;
      sobra += v.sobra || 0;
    }
    for (const k of Object.keys(por))for (const c of [
      "faturado",
      "pago",
      "a_receber",
      "despesas",
      "sobra"
    ])por[k][c] = brl(por[k][c]);
    if (_semValores) return {
      aviso: "valores ocultos para esta conversa",
      total_viagens: l.length,
      ...corta(l.map((v)=>({
          id: v.id,
          data: v.data,
          cliente: v.cliente,
          placa: v.placa,
          motorista: v.motorista,
          rota: v.rota,
          km: v.km,
          dias: v.dias,
          status: v.status
        })), 60)
    }; // v10 · v19 id
    return {
      calculo_do_sistema_em: _dadosEm,
      totais: {
        viagens: l.length,
        faturado: brl(fat),
        pago: brl(pago),
        a_receber: brl(fat - pago),
        despesas: brl(desp),
        sobra: brl(sobra),
        margem: fat ? (sobra / fat * 100).toFixed(1) + "%" : "-"
      },
      por_cliente: por,
      ...corta(l, 60)
    };
  }
  if (nome === "contas_a_pagar") {
    const d = await dadosApp();
    const hoje = hojeBA();
    const sit = a.situacao || "abertas";
    const parc = [];
    for (const c of Array.isArray(d.compras) ? d.compras : []){
      if (![
        "pagamento",
        "nota"
      ].includes(c.status)) continue; // igual ao sistema (ccContextoAssistente): so compra aprovada esperando nota ou comprovante
      if (!tem(c.fornecedor, a.fornecedor)) continue;
      for (const p of c.parcelas || []){
        if (p.paga) continue;
        if (sit === "vencidas" && !p.vencida) continue;
        if (a.ate && p.venc && p.venc > a.ate) continue;
        parc.push({
          compra: c.numero,
          fornecedor: c.fornecedor,
          descricao: c.descricao,
          parcela: p.n + "/" + (c.parcelas || []).length,
          vencimento: p.venc,
          em_aberto: brl((p.valor || 0) - (p.pago || 0)),
          vencida: !!p.vencida,
          situacao_compra: c.status
        });
      }
    }
    parc.sort((x, y)=>String(x.vencimento).localeCompare(String(y.vencimento)));
    const tot = parc.reduce((s, p)=>s + Number(String(p.em_aberto).replace(/[^\d,]/g, "").replace(",", ".")), 0);
    return {
      calculo_do_sistema_em: _dadosEm,
      hoje,
      total_em_aberto: brl(tot),
      parcelas: corta(parc, 60),
      dividas_fixas_mensais: (d.dividas || []).filter((x)=>x.valorMes !== "" && x.valorMes != null).map((x)=>({
          descricao: x.descricao,
          categoria: x.categoria,
          valor_mes: brl(x.valorMes),
          dia_vencimento: x.diaVencimento,
          parcelas_total: x.parcelasTotal || "fixa",
          desde: x.mesInicio
        }))
    };
  }
  if (nome === "compras") {
    const d = await dadosApp();
    let l = (Array.isArray(d.compras) ? d.compras : []).filter((c)=>noPeriodo(c.criadoEm, a.de, a.ate) && tem(c.fornecedor, a.fornecedor) && tem(c.categoria, a.categoria) && tem(c.status, a.situacao) && (!a.placa || placaN(c.placa) === placaN(a.placa)) && (a.numero == null || Number(c.numero) === Number(a.numero)));
    l.sort((x, y)=>String(y.criadoEm).localeCompare(String(x.criadoEm)));
    const valer = l.filter((c)=>![
        "cancelada",
        "reprovada"
      ].includes(c.status));
    const porCat = {};
    for (const c of valer)porCat[c.categoria || "(sem categoria)"] = (porCat[c.categoria || "(sem categoria)"] || 0) + (c.valor || 0);
    for (const k of Object.keys(porCat))porCat[k] = brl(porCat[k]);
    return {
      calculo_do_sistema_em: _dadosEm,
      total_valido: brl(valer.reduce((s, c)=>s + (c.valor || 0), 0)),
      por_categoria: porCat,
      ...corta(l.map((c)=>({
          numero: c.numero,
          data: c.criadoEm,
          fornecedor: c.fornecedor,
          descricao: c.descricao,
          categoria: c.categoria,
          placa: c.placa,
          valor: brl(c.valor),
          forma: c.forma,
          situacao: c.status
        })), 50)
    };
  }
  if (nome === "saude_frota") {
    const { data: d0 } = await sb.from("rf_saude").select("dia").order("dia", {
      ascending: false
    }).limit(1);
    const dia = d0 && d0[0] ? d0[0].dia : null;
    if (!dia) return {
      aviso: "o robo de Previsao ainda nao calculou"
    };
    let sq = sb.from("rf_saude").select("placa,score,faixa,modelo,ano,km_atual,km_dia,custo60,custo_km,consumo,motivos").eq("dia", dia).order("score");
    let pq = sb.from("rf_previsoes").select("placa,item,estado,dias,data_prevista,km_falta,km_dia,confianca,base").eq("dia", dia).in("estado", [
      "ativa",
      "cadastro"
    ]).order("dias");
    if (a.placa) {
      sq = sq.eq("placa", placaN(a.placa));
      pq = pq.eq("placa", placaN(a.placa));
    }
    const [{ data: sd }, { data: pv }] = await Promise.all([
      sq,
      pq
    ]);
    return {
      calculado_em: dia,
      faixas: "80-100 Saudavel, 60-79 Atencao, 40-59 Risco, 0-39 Critico",
      saude: (sd || []).map((x)=>({
          ...x,
          motivos: (x.motivos || []).map((m)=>(m.peso ? "-" + m.peso + " " : "") + m.texto),
          ..._semValores ? {
            custo60: undefined,
            custo_km: undefined
          } : {}
        })),
      manutencao_prevista: (pv || []).slice(0, a.placa ? 20 : 25)
    };
  }
  if (nome === "excecoes_abertas") {
    let q = sb.from("rf_excecoes").select("id,setor,tipo,titulo,detalhe,placa,valor,gravidade,nivel,responsavel,prazo_em,cobrancas,criado_em").eq("estado", "aberta").order("gravidade").limit(60);
    if (a.setor) q = q.eq("setor", String(a.setor));
    const { data } = await q;
    return {
      abertas: (data || []).map((x)=>({
          ...x,
          com_quem: ((x.responsavel || [])[0] || {}).nome,
          responsavel: undefined,
          valor: _semValores ? undefined : x.valor
        }))
    };
  }
  if (nome === "frota") {
    const d = await dadosApp();
    const vs = (Array.isArray(d.veiculos) ? d.veiculos : []).filter((v)=>!a.placa || placaN(v.placa) === placaN(a.placa));
    if (_semValores) vs.forEach((v)=>{
      delete v.receitaMes;
      delete v.custoMes;
    }); // v10
    return {
      calculo_do_sistema_em: _dadosEm,
      veiculos: vs.map((v)=>({
          ...v,
          ..._semValores ? {} : {
            receitaMes: brl(v.receitaMes),
            custoMes: brl(v.custoMes)
          },
          oleo: v.oleo ? {
            ...v.oleo,
            situacao: v.oleo.falta <= 0 ? "VENCIDA (passou " + Math.abs(v.oleo.falta) + " km)" : "faltam " + v.oleo.falta + " km"
          } : "sem ultima troca informada"
        })),
      preventiva_vencida_ou_perto: (d.preventiva || []).filter((p)=>!a.placa || placaN(p.placa) === placaN(a.placa))
    };
  }
  if (nome === "manutencoes") {
    let l = (await painel("manutencoes")).filter((m)=>(!a.placa || placaN(m.placa) === placaN(a.placa)) && noPeriodo(m.data, a.de, a.ate));
    l.sort((x, y)=>String(y.data).localeCompare(String(x.data)));
    const val = (m)=>(m.itens || []).reduce((s, i)=>s + (Number(i.valor) || 0) * (Number(i.qtd) || 1), 0) + (Number(m.maoObra) || 0);
    return {
      total: brl(l.reduce((s, m)=>s + val(m), 0)),
      ...corta(l.map((m)=>({
          data: m.data,
          placa: m.placa,
          categoria: m.categoria,
          oficina: m.oficina,
          km: m.km,
          itens: (m.itens || []).map((i)=>[
              i.pecas,
              i.servico
            ].filter(Boolean).join(" - ")).join("; ").slice(0, 200),
          valor: brl(val(m))
        })), 40)
    };
  }
  if (nome === "motoristas") {
    const cad = await painel("motoristasCad");
    const { data: pf } = await sb.from("profiles").select("nome,papel,ativo").eq("papel", "motorista");
    const ativos = new Map((pf || []).map((p)=>[
        nrm(p.nome),
        p.ativo === true
      ]));
    const l = cad.filter((m)=>m?.mot && tem(m.mot.nome + " " + (m.loginNome || ""), a.nome)).map((m)=>({
        nome: m.mot.nome,
        login: m.loginNome || "",
        login_ativo: m.loginNome ? ativos.get(nrm(m.loginNome)) ?? false : false,
        celular: m.mot.celular || "",
        cidade: m.mot.cidade || "",
        cnh_categoria: m.mot.catCnh || "",
        cnh_vence: m.mot.vencCnh || "",
        placa: m.loginPlaca || m.veic?.placa || "",
        tipo: m.tipo || ""
      }));
    return corta(l, 40);
  }
  if (nome === "entregas") {
    let q = sb.from("entregas").select("recebedor,cidade,placa,motorista_nome,data_prevista,status,entregue_em,ocorrencia,cliente_contrato,ordem").order("data_prevista", {
      ascending: false
    }).order("ordem").limit(80);
    if (a.placa) q = q.eq("placa", placaN(a.placa));
    if (a.data) q = q.eq("data_prevista", a.data);
    if (a.status) q = q.eq("status", a.status);
    if (a.recebedor) q = q.ilike("recebedor", "%" + a.recebedor + "%");
    const { data } = await q;
    const l = (data || []).map((e)=>({
        ...e,
        entregue_em: e.entregue_em ? dataHora(e.entregue_em) : ""
      }));
    return {
      pendentes: l.filter((e)=>e.status !== "concluida").length,
      concluidas: l.filter((e)=>e.status === "concluida").length,
      ...corta(l, 60)
    };
  }
  if (nome === "abastecimentos") {
    let q = sb.from("abastecimentos_motorista").select("id,data,placa,motorista_nome,km_atual,litros,valor,status,motivo_rejeicao").order("data", {
      ascending: false
    }).limit(80); // v19: id
    if (a.placa) q = q.eq("placa", placaN(a.placa));
    if (a.status) q = q.eq("status", String(a.status)); // v19
    if (a.de) q = q.gte("data", a.de);
    if (a.ate) q = q.lte("data", a.ate);
    const { data } = await q;
    const l = data || [];
    const lit = l.reduce((s, x)=>s + (Number(x.litros) || 0), 0), val = l.reduce((s, x)=>s + (Number(x.valor) || 0), 0);
    return {
      litros: Math.round(lit),
      valor: brl(val),
      preco_medio_litro: lit ? brl(val / lit) : "-",
      ...corta(l.map((x)=>({
          ...x,
          valor: brl(x.valor)
        })), 50)
    };
  }
  if (nome === "documentos_fiscais") {
    let l = (await painel("fiscais")).filter((f)=>(!a.placa || placaN(f.placa || f.placaManual) === placaN(a.placa)) && noPeriodo(String(f.data || "").slice(0, 10), a.de, a.ate) && tem(f.tipo, a.tipo) && (!a.numero || String(f.numero) === String(a.numero)) && tem(f.cliente || f.contratante, a.cliente));
    l.sort((x, y)=>String(y.data).localeCompare(String(x.data)));
    return corta(l.map((f)=>({
        tipo: f.tipo,
        numero: f.numero,
        serie: f.serie,
        data: String(f.data || "").slice(0, 10),
        cliente: f.cliente || f.contratante || "",
        placa: f.placa || f.placaManual || "",
        motorista: f.motorista || "",
        frete: brl(f.valor),
        valor_carga: brl(f.valorCarga),
        destino: [
          f.cidade,
          f.uf
        ].filter(Boolean).join("/"),
        cancelado: !!f.cancelado,
        encerrado: !!f.encerrado,
        chave: f.chave || ""
      })), 40);
  }
  if (nome === "registrar_motivo") return await registrarMotivo(a); // v11
  if (nome === "iniciar_viagem") return await iniciarPeloRavi(); // v12
  if (nome === "finalizar_viagem") return await finalizarPeloRavi();
  if (nome === "lancar_abastecimento") return await abastecerPeloRavi();
  if (nome === "finalizar_viagem_motorista") return await finalizarPeloRavi({
    placa: a?.placa,
    motorista: a?.motorista
  }); // v51
  if (nome === "lancar_abastecimento_motorista") return await abastecerPeloRavi({
    placa: a?.placa,
    motorista: a?.motorista
  }); // v26
  if (nome === "criar_viagem") return await criarViagem(a);
  if (nome === "enviar_whatsapp") return await enviarWhatsapp(a); // v17
  if (nome === "lembrar") return await lembrar(a); // v18
  if (nome === "aprovar_desvio") return await aprovarDesvio(a); // v37
  if (nome === "lancar_compra_foto") return await lancarCompraFoto(a); // v38
  if (nome === "documentos_caminhao") return await documentosCaminhao(a); // v39
  if (nome === "enviar_documento") return await enviarDocumento(a);
  if (nome === "consumo_ia") return await consumoIA(a); // v21
  if (nome === "portfolio_institucional") return await portfolioLink(a); // v22
  if (nome === "pedir_ao_claude" || nome === "pedidos_ao_claude") return await pedidoClaude(nome, a); // v23
  if (nome === "abrir_chamado") return await abrirChamado(a); // v25
  if (nome === "meus_chamados") return await meusChamados();
  if (nome === "minhas_viagens_situacao") return await minhasViagensSituacao();
  if ([
    "chamados",
    "atualizar_chamado",
    "encaminhar_chamado"
  ].includes(nome)) {
    if (_motorista) return {
      erro: "so a equipe"
    };
    return await chamadosEquipe(nome, a);
  }
  if (nome === "documentos" || nome === "ler_documento") return await docsFerramenta(nome, a); // v21
  if ([
    "criar_tarefa",
    "listar_tarefas",
    "parar_tarefa"
  ].includes(nome)) return await tarefaFerramenta(nome, a); // v20
  if ([
    "marcar_viagens_pagas",
    "mudar_data_viagem",
    "aprovar_abastecimento",
    "rejeitar_abastecimento"
  ].includes(nome)) return await escritorio(nome, a); // v19
  if (nome === "esquecer") return await esquecer(a);
  if (nome === "torre_ao_vivo") return {
    texto: await blocoAoVivo(a.placa ? placaN(a.placa) : null)
  };
  return {
    erro: "ferramenta desconhecida"
  };
}
// ===================== fim das ferramentas =====================
// v7: voz
async function transcrever(b64, mime) {
  const bytes = Uint8Array.from(atob(b64), (c)=>c.charCodeAt(0));
  const ext = /mp4|m4a|aac/.test(mime) ? "m4a" : /mpeg|mp3/.test(mime) ? "mp3" : "ogg";
  for (const modelo of [
    "gpt-4o-transcribe",
    "whisper-1"
  ]){
    const fd = new FormData();
    fd.append("file", new Blob([
      bytes
    ], {
      type: mime.split(";")[0] || "audio/ogg"
    }), "audio." + ext);
    fd.append("model", modelo);
    fd.append("language", "pt");
    fd.append("prompt", "Conversa da transportadora RF Logistica com o robo Ravi. Placas como QDG7J21, clientes Suzano, JDL, Mercante, Mateus, Yamaha, Sao Roque; cidades da Bahia.");
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + Deno.env.get("OPENAI_API_KEY")
      },
      body: fd
    });
    if (r.ok) {
      const j = await r.json();
      const t = String(j?.text || "").trim();
      if (t) return t;
    }
  }
  return "";
}
// v32 (26/10 19h35): ENTREGAS POR CIDADE na viagem da JDL -- o Renato escreve "PONTO NOVO (cinco entregas)"; o Ravi passa a quantidade
//   (parametro entregas) e o motor guarda em entregasPrevistas -- a Torre conta 1 h por ENTREGA na previsao, nao 1 h por cidade.
// v31 (26/10 19h): VOZ SEMPRE A MESMA -- Renato: "escolhi a voz 4D e ele fica mudando de voz a cada audio, isso nao pode acontecer".
//   Causas: (1) quando o gpt-4o-mini-tts falhava, a reserva era OUTRA voz (tts-1 "onyx"); (2) a instrucao longa e "criativa" (alegre,
//   sorriso, cantada) fazia o modelo variar o timbre de um audio para outro. Agora: uma voz so ("verse"), instrucao CURTA e FIXA (sotaque
//   e tom), duas tentativas com o mesmo modelo e a mesma voz; se falhar, vai o texto escrito -- nunca outra voz.
const VOZ_RAVI = "verse";
const VOZ_INSTRUCAO = "Voz masculina adulta, sempre a mesma. Sotaque baiano de Feira de Santana: vogais abertas, 'de' e 'te' sem chiar. Tom calmo, simpatico e constante, ritmo de conversa, sem variar o timbre nem o jeito de falar. Portugues do Brasil. Placas de caminhao letra por letra e numero por numero.";
async function falar(texto) {
  const limpo = texto.replace(/[*_~`]/g, "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/[ \t]{2,}/g, " ").trim().slice(0, 3800); // v28: sem emoji
  if (!limpo) return "";
  const pedido = {
    model: "gpt-4o-mini-tts",
    voice: VOZ_RAVI,
    input: limpo,
    response_format: "opus",
    instructions: VOZ_INSTRUCAO
  };
  for(let t = 0; t < 2; t++){
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer " + Deno.env.get("OPENAI_API_KEY")
      },
      body: JSON.stringify(pedido)
    });
    if (r.ok) {
      const buf = new Uint8Array(await r.arrayBuffer());
      let s = "";
      for(let i = 0; i < buf.length; i += 0x8000)s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    }
  }
  return "";
}
const CHAMOU_RAVI = /^[\s"'“”‘’`*_~@.,;:!?()\[\]-]*(?:(?:o|ô|oi|ei|eí|e ai|e aí|ola|olá|alo|alô|bom dia|boa tarde|boa noite)[\s,!.]+){0,2}ravi\b/i;
// v21: registra o consumo de cada chamada (nunca trava a resposta)
async function registrarUso(modelo, u, buscas = 0) {
  try {
    if (!u) return;
    const entrada = Number(u.prompt_tokens ?? u.input_tokens ?? 0), cache = Number(u.prompt_tokens_details?.cached_tokens ?? u.input_tokens_details?.cached_tokens ?? 0), saida = Number(u.completion_tokens ?? u.output_tokens ?? 0);
    await sb.from("ravi_uso").insert({
      origem: String(_chatAtual || "").slice(0, 80),
      modelo,
      entrada,
      cache,
      saida,
      buscas
    });
  } catch (_) {}
}
async function chamarOpenAI(modelo, messages, tools) {
  const r = await chamarOpenAI0(modelo, messages, tools);
  if (r.ok) {
    try {
      const j = await r.clone().json();
      await registrarUso(modelo, j?.usage);
    } catch (_) {}
  } else {
    try {
      const t = await r.clone().text();
      await sb.from("integracao_log").insert({
        fonte: "ravi-ia",
        ok: false,
        msg: ("OpenAI " + modelo + " " + r.status + ": " + t).slice(0, 500),
        qtd: 0
      });
    } catch (_) {}
  }
  return r;
}
// v26: detecta resposta que e rascunho de raciocinio em ingles (nunca vai para o WhatsApp)
function pareceRascunho(t) {
  const x = " " + String(t || "").toLowerCase().replace(/[^a-z\u00c0-\u00ff ]+/g, " ") + " ";
  const en = (x.match(/ (we|need|should|cannot|maybe|perhaps|user|tool|tools|says|likely|the|instruction|respond|apologize|but|not|can|use) /g) || []).length;
  const pt = (x.match(/ (o|a|os|as|de|do|da|que|nao|não|para|com|um|uma|voce|você|está|esta|foi|no|na) /g) || []).length;
  return en >= 5 && en > pt;
}
let _semCache24 = false; // v48
let _esforco = "none"; // v24: "medium" quando a pessoa diz que a resposta estava errada
async function chamarOpenAI0(modelo, messages, tools) {
  const corpo = {
    model: modelo,
    max_completion_tokens: _esforco === "none" ? 900 : 3000,
    messages
  };
  if (tools && tools.length) {
    corpo.tools = tools;
    corpo.tool_choice = "auto";
  }
  if (/^gpt-5\.6/.test(modelo)) corpo.reasoning_effort = tools && tools.length ? "none" : _esforco; // v47: com ferramentas a OpenAI so aceita "none" (antes caia no modelo reserva)
  // v48 (29/10, Renato: "reduzir o custo sem perder a qualidade"): cache da OpenAI -- a parte fixa (ferramentas + instrucoes) fica
  //   guardada ate 24 h e sai 10x mais barata. Se o modelo nao aceitar o parametro, tenta de novo sem ele (e lembra).
  if (!_semCache24) {
    corpo.prompt_cache_key = "ravi-" + modelo;
    corpo.prompt_cache_retention = "24h";
  }
  const env = (c)=>fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer " + Deno.env.get("OPENAI_API_KEY")
      },
      body: JSON.stringify(c)
    });
  let r = await env(corpo);
  if (r.status === 400 && !_semCache24) {
    const t = await r.clone().text();
    if (/prompt_cache/i.test(t)) {
      _semCache24 = true;
      delete corpo.prompt_cache_retention;
      r = await env(corpo);
      if (r.status === 400 && /prompt_cache/i.test(await r.clone().text())) {
        delete corpo.prompt_cache_key;
        r = await env(corpo);
      }
    }
  }
  return r;
}
// ---------- v33: grupo do cliente ----------
function horaBA(iso) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 3 * 3600e3).toISOString();
  return d.slice(8, 10) + "/" + d.slice(5, 7) + " " + d.slice(11, 16);
}
function nomeCurto(m) {
  const p = String(m || "").split(/[\s.]+/)[0];
  return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : "";
}
function prevProx(t) {
  const ps = (Array.isArray(t.paradas) ? t.paradas : []).filter((p)=>p.lat != null && !p.sit && !p.chegada && !p.urbana).sort((a, b)=>(a.ordem || 0) - (b.ordem || 0));
  if (!ps.length || t.ultima_lat == null) return "todos os destinos concluidos (caminhao voltando para a base)";
  const R = (a1, o1, a2, o2)=>{
    const r = Math.PI / 180, x = Math.sin((a2 - a1) * r / 2) ** 2 + Math.cos(a1 * r) * Math.cos(a2 * r) * Math.sin((o2 - o1) * r / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(x));
  };
  const p = ps[0], km = R(Number(t.ultima_lat), Number(t.ultima_lng), p.lat, p.lng) * 1.25;
  return `proximo destino ${p.nome}: faltam uns ${Math.round(km / 10) * 10} km, previsao de chegada por volta de ${horaBA(new Date(Date.now() + km / 55 * 3600e3).toISOString())} se seguir direto (o motorista pode parar para descanso a noite)`;
}
async function contextoCliente(gc) {
  const re = new RegExp(String(gc.cliente_re), "i"), desde = new Date(Date.now() - 4 * 86400e3).toISOString();
  const { data: tv } = await sb.from("torre_viagens").select("placa,motorista,cliente,status,origem_nome,saida_em,chegou_em,encerrada_em,previsto_em,eta,paradas,ultima_cidade,ultima_uf,ultima_rua,ultima_pos_em,ultima_vel,ultima_lat,ultima_lng,viagem_ref,criado_em").gte("criado_em", desde).order("criado_em", {
    ascending: false
  }).limit(60);
  const torre = (tv || []).filter((v)=>re.test(String(v.cliente || "")));
  const { data: pv } = await sb.from("painel_dados").select("valor").eq("chave", "viagens").maybeSingle();
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), d4 = new Date(Date.now() - 3 * 3600e3 - 4 * 86400e3).toISOString().slice(0, 10);
  const app = (Array.isArray(pv?.valor) ? pv.valor : []).filter((g)=>g && re.test(String(g.cliente || "")) && String(g.data || "") >= d4 && !/TESTE/i.test(String(g.obs || "")));
  const linhas = [];
  for (const g of app){
    const t = torre.find((v)=>String(v.viagem_ref) === String(g.id));
    const yp = g.yamahaPicking || {};
    const carga = Array.isArray(yp.blocos) ? yp.blocos.map((x)=>`${x.cidade}: ${x.mix}${Array.isArray(x.clientes) && x.clientes.length ? " (clientes " + x.clientes.join(", ") + ")" : ""}${Array.isArray(x.prazos) && x.prazos.length ? " prazo " + x.prazos.join("/") : ""}`).join("; ") : "";
    let l = `- Viagem ${yp.viagemNum ? yp.viagemNum + " " : ""}do dia ${String(g.data).split("-").reverse().join("/")} | caminhao ${g.placa} | motorista ${nomeCurto(g.motoristaNaEpoca || g.motoristaDesignadoNome)} | ` + (Number(g.kmChegada) > 0 ? "VIAGEM ENCERRADA (caminhao ja voltou)" : t && t.status === "aguardando" ? `AINDA NAO SAIU (caminhao aguardando a saida${t.origem_nome ? " no " + t.origem_nome : ""}; so conta como saida quando o caminhao ligar e sair de la)` : t && t.status === "ativa" ? "EM VIAGEM" : g.statusMotorista === "em_andamento" && !t ? "EM VIAGEM (sem rastreio na Torre)" : "PROGRAMADA (ainda nao saiu)") + (carga ? ` | carga: ${carga}` : "");
    if (t && t.status !== "aguardando") {
      l += ` | saiu ${horaBA(t.saida_em)}`;
      const ps = (Array.isArray(t.paradas) ? t.paradas : []).filter((p)=>!p.urbana || p.planejada);
      if (ps.length) l += " | destinos: " + ps.map((p)=>`${p.nome}${p.sit === "entregue" ? " (entregas concluidas, chegou " + horaBA(p.chegada) + ", saiu " + horaBA(p.saida) + ")" : p.chegada ? " (chegou " + horaBA(p.chegada) + ", entregando)" : " (a caminho)"}`).join(", ");
      if (t.status === "ativa") l += ` | ultima posicao ${horaBA(t.ultima_pos_em)}: ${[
        t.ultima_cidade,
        t.ultima_uf
      ].filter(Boolean).join("/") || "estrada"}${Number(t.ultima_vel) > 5 ? " (andando)" : " (parado)"} | ${prevProx(t)}`;
    }
    linhas.push(l);
  }
  for (const t of torre)if (!app.some((g)=>String(g.id) === String(t.viagem_ref))) linhas.push(`- caminhao ${t.placa} | motorista ${nomeCurto(t.motorista)} | ${t.status} | saiu ${horaBA(t.saida_em)} | ultima posicao ${horaBA(t.ultima_pos_em)}: ${[
    t.ultima_cidade,
    t.ultima_uf
  ].filter(Boolean).join("/")}`);
  return {
    texto: linhas.join("\n") || "(nenhuma viagem deste cliente nos ultimos 4 dias)",
    hoje
  };
}
// v35: alerta urgente do grupo do cliente
async function alvosAlertaCliente() {
  const { data: c } = await sb.from("torre_config").select("ravi_criadores,ravi_cobrar,zapi_grupo_rf").eq("id", 1).maybeSingle();
  const cri = Array.isArray(c?.ravi_criadores) ? c.ravi_criadores : []; // Renato e Marcelo
  const alvos = cri.filter((x)=>x && x.fone).map((x)=>({
      fone: String(x.fone),
      nome: String(x.nome || "")
    }));
  return {
    alvos: alvos.length ? alvos : [
      {
        fone: "5575999717578",
        nome: "Renato"
      }
    ],
    grupoRF: String(c?.zapi_grupo_rf || "")
  };
}
async function enviarMencao(phone, msg, mencoes) {
  try {
    const { data: ss } = await sb.from("rf_segredos").select("chave,valor").or("chave.like.wa_*");
    const sx = {};
    for (const x of ss || [])sx[x.chave] = x.valor;
    if (!sx.wa_url || !phone) return;
    // @ts-ignore Deno API
    const client = Deno.createHttpClient({
      caCerts: [
        sx.wa_ca
      ]
    });
    await fetch(`${sx.wa_url}/send-text`, {
      method: "POST",
      client,
      headers: {
        "Content-Type": "application/json",
        "X-RF-Token": sx.wa_token
      },
      body: JSON.stringify({
        phone,
        message: msg + "\n\n🤖 _Ravi - RF Logística_",
        mencoes
      })
    });
  } catch (_) {}
}
function textoAlertaCliente(a, n) {
  return `🚨🚨 *URGENTE — ${String(a.cliente || "CLIENTE").toUpperCase()} ESPERANDO RESPOSTA*${n > 1 ? " (" + n + "ª chamada)" : ""} 🚨🚨\n\n*${a.quem}* no grupo *${a.grupo_nome || a.cliente}*:\n_"${String(a.pergunta || "").slice(0, 600)}"_\n\nEu respondi:\n_"${String(a.resposta || "").slice(0, 400)}"_\n\n👉 Respondam lá no grupo (confirmar caminhão e horário no pátio). Eu vou insistir a cada 5 minutos até o Renato ou o Marcelo responder no grupo — ou me mandem aqui "ok" / "já respondi".`;
}
async function abrirAlertaCliente(gc, quem, pergunta, resposta, teste, testeFone, acao) {
  const { alvos, grupoRF } = await alvosAlertaCliente();
  const dest = teste ? [
    {
      fone: testeFone || "5575999717578",
      nome: "Renato"
    }
  ] : alvos;
  const a = {
    grupo: String(gc.grupo || ""),
    grupo_nome: gc.grupo_nome || gc.nome,
    cliente: gc.nome,
    quem,
    pergunta: pergunta.slice(0, 2000),
    resposta: resposta.slice(0, 2000),
    alvos: dest
  };
  if (acao) a.acao = acao;
  const msg = (teste ? "🧪 *TESTE* — " : "") + textoAlertaCliente(a, 1) + (acao && acao.tipo === "criar_yamaha" ? "\n\n📋 *Viagem montada pelo picking:*\n" + acao.resumo + "\n👉 Responda *confirma* aqui para eu lançar no sistema (e mandar ao motorista)." : acao && acao.resumo ? "\n\n" + acao.resumo : "");
  for (const d of dest)await enviarPara(d.fone, msg);
  if (!teste && grupoRF) await enviarMencao(grupoRF, `🚨 *${String(gc.nome).toUpperCase()} AGUARDANDO A RF* — ${dest.map((d)=>"@" + d.fone).join(" ")}\n*${quem}* pediu no grupo *${a.grupo_nome}*: _"${pergunta.slice(0, 300)}"_\nRespondam lá, por favor.`, dest.map((d)=>d.fone));
  if (!teste) await sb.from("ravi_alertas_cliente").insert({
    ...a,
    ultimo_envio: new Date().toISOString(),
    envios: 1
  });
}
async function chamarMotor(corpo) {
  const { data: seg } = await sb.from("rf_segredos").select("valor").eq("chave", "wa_token").maybeSingle();
  const r = await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/ravi-motor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rf-token": seg?.valor || ""
    },
    body: JSON.stringify(corpo)
  });
  return await r.json().catch(()=>({
      ok: false,
      erro: "resposta invalida do motor"
    }));
}
async function resolverAlertasCliente(grupo, por) {
  const { data } = await sb.from("ravi_alertas_cliente").update({
    resolvido_em: new Date().toISOString(),
    resolvido_por: por
  }).eq("grupo", grupo).is("resolvido_em", null).select("id");
  return (data || []).length;
}
async function responderCliente(gc, b, texto0, porVoz, cfg, teste) {
  if (!teste && !gc.ativo) return {
    responder: false,
    motivo: "grupo do cliente ainda nao liberado pelo Renato"
  };
  let texto = texto0;
  const temArq = !!b.anexo_b64 || !!b.teste_arquivo; // v35: foto/PDF no grupo do cliente (ex.: picking list)
  if (temArq) texto = (texto ? texto + " " : "") + "[mandou uma foto/arquivo no grupo" + (b.anexo_nome ? ": " + String(b.anexo_nome) : "") + "]";
  if (porVoz && !teste) texto = (await transcrever(String(b.audio_b64), String(b.audio_mime || "audio/ogg"))).slice(0, 2000);
  if (!texto) return {
    responder: false,
    motivo: "sem texto (grupo do cliente)"
  };
  const chamou = teste ? b.chamado !== false : !!b.chamado || CHAMOU_RAVI.test(texto); // v34
  if (!chamou) {
    if (texto.replace(/[^A-Za-zÀ-ú0-9]/g, "").length < 4) return {
      responder: false,
      motivo: "grupo do cliente: mensagem curta"
    };
    if (!teste) {
      const eq = await quemFala([
        b.deAlt,
        b.de
      ].filter(Boolean), cfg);
      if (eq && eq.nivel === "tudo") {
        await resolverAlertasCliente(gc.grupo, eq.nome + " (respondeu no grupo)");
        return {
          responder: false,
          motivo: "grupo do cliente: mensagem da equipe da RF sem chamar o Ravi"
        };
      }
    }
  }
  const chatId = teste ? "teste-cliente:" + gc.nome : String(b.chat || "");
  const quem = String(b.nome || "").trim() || "alguem da " + gc.nome;
  const cx = await contextoCliente(gc);
  const { data: hist } = await sb.from("ravi_conversas").select("papel,texto").eq("chat", chatId).gte("em", new Date(Date.now() - 6 * 3600e3).toISOString()).order("em", {
    ascending: false
  }).limit(6);
  const agora = horaBA(new Date().toISOString());
  const sys = `Voce e o Ravi, o assistente da Torre de Controle da RF Logistica (transportadora de Feira de Santana/BA), atendendo no grupo de WhatsApp da ${gc.nome} (cliente da RF; no grupo estao ${gc.pessoas || "pessoas da " + gc.nome} e a equipe da RF). Agora sao ${agora} (horario da Bahia).
SEU PAPEL: informar sobre as cargas da ${gc.nome} transportadas pela RF -- onde o caminhao esta, quando sai e quando chega, o que ja foi entregue, o que vai na carga. Use SOMENTE os dados abaixo; se a informacao nao estiver neles, diga que vai confirmar com a equipe da RF e que eles retornam aqui. Nunca invente horario, local nem previsao.
NUNCA FALE: valores (frete, custos, pagamentos, notas fiscais da RF), outros clientes da RF, assuntos internos da RF (motoristas, salarios, manutencao, financeiro), telefone ou documento de ninguem. VALORES NAO SAO ASSUNTO DESTE GRUPO: a RF ja tem contrato com a ${gc.nome} e quem esta no grupo e a equipe de operacao (carregamento, expedicao); nunca puxe assunto de valor, frete ou tabela e nao cite valores em nenhuma resposta. Se alguem perguntar, diga apenas que segue o contrato vigente, sem acionar ninguem.
SO DIGA QUE O CAMINHAO SAIU SE A VIAGEM ESTIVER "EM VIAGEM" nos dados; "AINDA NAO SAIU" quer dizer carregado/aguardando a saida -- nao invente horario de saida. Previsao: e estimativa (estrada, descarga e descanso do motorista mudam o horario) -- diga "por volta de". Se a viagem esta programada e ainda nao saiu, diga isso.
${chamou ? "" : "ESTA MENSAGEM NAO CHAMOU O RAVI PELO NOME. Responda SO se for uma pergunta ou pedido do pessoal da " + gc.nome + " sobre as cargas, viagens, caminhoes, entregas ou previsoes (ou algo que a RF precisa responder). Se for conversa entre eles, agradecimento, confirmacao ('ok', 'blz'), aviso que nao pede resposta ou assunto que nao e com a RF, responda EXATAMENTE [[SILENCIO]] e nada mais.\n"}PICKING LIST / PROGRAMACAO / PEDIDO DE CONFIRMACAO: se o cliente mandar foto ou arquivo (picking list, programacao de carga) ou pedir para confirmar caminhao, motorista ou o HORARIO que o caminhao vai estar no patio deles, responda curto: agradeca, diga que recebeu e que ja acionou a equipe da RF (Renato e Marcelo) para confirmar o caminhao e o horario no patio e que eles respondem aqui em instantes -- e termine com [[CHAMAR_RENATO]]. Nunca confirme horario de patio por conta propria.
QUANDO NAO SOUBER OU NAO PUDER RESPONDER (dado que nao esta abaixo, carga extra ou caminhao a mais, reclamacao, pedido de mudanca, algo que precisa de decisao): responda com educacao que vai acionar o Renato da RF e que ele retorna aqui, e termine a resposta com [[CHAMAR_RENATO]].
ESTILO: cordial e profissional, simpatico (pode ser leve, nordestino sem exagero), curto (ate 6 linhas), WhatsApp: *negrito* so em palavra-chave, sem titulos, sem tabelas. Trate a pessoa pelo primeiro nome quando souber. Nao assine (a assinatura entra sozinha).
VIAGENS DA ${gc.nome.toUpperCase()} (ultimos 4 dias, dados da Torre e do sistema da RF):
${cx.texto}`;
  const msgs = [
    {
      role: "system",
      content: sys
    }
  ];
  for (const h of (hist || []).reverse())msgs.push({
    role: h.papel === "ravi" ? "assistant" : "user",
    content: String(h.texto || "").slice(0, 1500)
  });
  msgs.push({
    role: "user",
    content: quem + ": " + texto.replace(CHAMOU_RAVI, "").replace(/^[\s,:.!?-]+/, "").trim()
  });
  const r = await chamarOpenAI(MODELO_PRINCIPAL, msgs);
  let resp = "";
  try {
    const j = await r.json();
    resp = String(j?.choices?.[0]?.message?.content || "").trim();
  } catch (_) {
    resp = "";
  }
  if (/\[\[SILENCIO\]\]/.test(resp) && !chamou) return {
    responder: false,
    motivo: "grupo do cliente: nao era pergunta para a RF",
    teste: teste || undefined
  }; // v34
  let chamarRenato = /\[\[CHAMAR_RENATO\]\]/.test(resp);
  resp = resp.replace(/\[\[(CHAMAR_RENATO|SILENCIO)\]\]/g, "").trim();
  if (!resp || pareceRascunho(resp)) {
    resp = "Vou confirmar com a equipe da RF e já retorno aqui. 👍";
    chamarRenato = true;
  }
  resp = resp.replace(/\*\*(.+?)\*\*/g, "*$1*").replace(/^#+\s*/gm, "");
  if (chamarRenato) {
    const ehPickYam = temArq && !!b.anexo_b64 && /yama/i.test(String(gc.cliente_re || gc.nome || ""));
    if (ehPickYam) {
      const tarefa = (async ()=>{
        let acao = null;
        try {
          await sb.from("ravi_anexos").insert({
            chat: chatId,
            quem,
            mime: String(b.anexo_mime || "image/jpeg"),
            nome: String(b.anexo_nome || "picking.jpg"),
            b64: String(b.anexo_b64)
          });
          const sim = await chamarMotor({
            acao: "simular_yamaha",
            chat: chatId,
            devolver_leitura: true,
            pedidoPor: "Ravi (grupo " + gc.nome + ")"
          });
          if (sim && sim.ok) {
            const dests = (sim.destinos || []).map((d)=>"• " + d.cidade + ": " + (d.mix || d.itens + " itens")).join("\n");
            acao = {
              tipo: "criar_yamaha",
              chat: chatId,
              leitura: sim.leitura,
              resumo: `Caminhão *${sim.placa || "?"}* · motorista *${sim.motorista || "?"}* · ${String(sim.data || "").split("-").reverse().join("/")}${sim.viagemNum ? " · " + sim.viagemNum + " viagem" : ""}\n${dests}${sim.km ? "\n" + sim.km + " km" : ""}${(sim.avisos || []).length ? "\n⚠️ " + sim.avisos.join("; ") : ""}`
            };
          } else acao = {
            tipo: "erro_leitura",
            resumo: "⚠️ Não consegui ler o picking (" + String(sim?.erro || "erro").slice(0, 120) + "). Lance pelo sistema ou me mande a foto no privado."
          };
        } catch (e) {
          acao = {
            tipo: "erro_leitura",
            resumo: "⚠️ Não consegui ler o picking agora."
          };
        }
        try {
          await abrirAlertaCliente(gc, quem, texto, resp, teste, b.enviar_para ? String(b.enviar_para) : "", acao && acao.tipo === "criar_yamaha" ? acao : {
            resumo: acao?.resumo
          });
        } catch (_) {}
      })();
      // @ts-ignore EdgeRuntime existe no Supabase
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(tarefa);
      else await tarefa;
    } else {
      try {
        await abrirAlertaCliente(gc, quem, texto, resp, teste, b.enviar_para ? String(b.enviar_para) : "");
      } catch (_) {}
    }
  }
  const ass = String(cfg.assinatura || "🤖 _Ravi - RF Logística_").trim();
  await sb.from("ravi_conversas").insert([
    {
      chat: chatId,
      quem,
      papel: "pessoa",
      texto: texto.slice(0, 2000)
    },
    {
      chat: chatId,
      quem: "Ravi",
      papel: "ravi",
      texto: resp.slice(0, 4000)
    }
  ]);
  if (teste) {
    if (b.enviar_para) await enviarPara(String(b.enviar_para), `🧪 *TESTE — pergunta no grupo ${gc.grupo_nome || gc.nome}:*\n_${quem}: ${texto}_\n\n*Resposta do Ravi:*\n${resp}`);
    return {
      responder: false,
      teste: true,
      texto: resp,
      chamou_renato: chamarRenato,
      contexto: cx.texto
    };
  }
  return {
    responder: true,
    texto: resp + "\n\n" + ass,
    nivel: "cliente:" + gc.nome
  };
}
Deno.serve(async (req)=>{
  _dados = null;
  _dadosEm = "";
  _esforco = "none"; // v6: nada de cache entre uma mensagem e outra · v24
  const _t0 = Date.now();
  const tempos = [];
  const marca = (n)=>tempos.push(n + ":" + (Date.now() - _t0)); // v15.1: cronometro
  try {
    if (req.method === "OPTIONS") return new Response("ok", {
      headers: CORS_APP
    }); // v15: o app chama direto
    // v16: segredo e configuracao buscados juntos
    const [{ data: seg }, { data: cfg }] = await Promise.all([
      sb.from("rf_segredos").select("chave,valor").in("chave", [
        "wa_token"
      ]),
      sb.from("torre_config").select("ravi_ouvir,ravi_equipe,zapi_grupo_rf,assinatura,ravi_criadores,ravi_financeiro,ravi_voz,ravi_chamados_rotas").eq("id", 1).maybeSingle()
    ]);
    const tok = (seg || []).find((x)=>x.chave === "wa_token")?.valor || "";
    let appUser = null; // v15: pergunta vinda do painel (icone de voz), com o login do usuario
    if (!iguais(req.headers.get("x-rf-token") || "", tok)) {
      appUser = await usuarioDoApp(req.headers.get("Authorization") || "");
      if (!appUser) return jsonApp({
        erro: "nao autorizado"
      }, 401);
    }
    marca("login");
    const b = await req.json().catch(()=>({}));
    _simularEnvio = !appUser && !!b.simular_envio; // v25: teste -- nada sai pelo WhatsApp (as ferramentas devolvem o que mandariam)
    if (!appUser && b.acao === "tarefas") {
      const { data: cfgT } = await sb.from("torre_config").select("ravi_equipe,zapi_grupo_rf,assinatura,ravi_chamados_rotas").eq("id", 1).maybeSingle();
      const rt = await rodarTarefas(!!b.simular, b.id ? Number(b.id) : null, cfgT);
      try {
        rt.chamados = await vigiarChamados(cfgT, !!b.simular);
      } catch (e) {
        rt.chamados_erro = String(e.message || e);
      } // v25
      return json(rt);
    }
    if (!appUser && b.acao === "resumo_manha") {
      const { data: cfgR } = await sb.from("torre_config").select("ravi_voz,assinatura").eq("id", 1).maybeSingle();
      return json(await resumoManha(!!b.simular, cfgR));
    }
    if (!appUser && b.teste_busca) {
      const key = Deno.env.get("OPENAI_API_KEY");
      const q = String(b.teste_busca);
      const loc = {
        type: "approximate",
        country: "BR",
        region: "Bahia",
        city: "Feira de Santana",
        timezone: "America/Bahia"
      };
      const resp = async (nome, corpo)=>{
        const t = Date.now();
        try {
          const r = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              Authorization: "Bearer " + key
            },
            body: JSON.stringify({
              ...corpo,
              input: q
            })
          });
          const j = await r.json();
          const txt = (j.output || []).flatMap((o)=>o.content || []).map((c)=>c.text || "").join(" ") || j.error?.message || "";
          return {
            nome,
            ms: Date.now() - t,
            st: r.status,
            buscas: (j.output || []).filter((o)=>o.type === "web_search_call").length,
            txt: String(txt).slice(0, 200)
          };
        } catch (e) {
          return {
            nome,
            ms: Date.now() - t,
            erro: String(e)
          };
        }
      };
      const chat = async (nome, corpo)=>{
        const t = Date.now();
        try {
          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              Authorization: "Bearer " + key
            },
            body: JSON.stringify({
              ...corpo,
              messages: [
                {
                  role: "user",
                  content: q
                }
              ]
            })
          });
          const j = await r.json();
          return {
            nome,
            ms: Date.now() - t,
            st: r.status,
            txt: String(j?.choices?.[0]?.message?.content || j.error?.message || "").slice(0, 160)
          };
        } catch (e) {
          return {
            nome,
            ms: Date.now() - t,
            erro: String(e)
          };
        }
      };
      const ws = (x = {})=>[
          {
            type: "web_search",
            search_context_size: "low",
            user_location: loc,
            ...x
          }
        ];
      const out = await Promise.all([
        resp("5.4mini-low", {
          model: "gpt-5.4-mini",
          reasoning: {
            effort: "low"
          },
          tools: ws()
        }),
        resp("5.4mini-none", {
          model: "gpt-5.4-mini",
          reasoning: {
            effort: "none"
          },
          tools: ws()
        }),
        resp("4.1mini", {
          model: "gpt-4.1-mini",
          tools: ws()
        }),
        resp("4.1", {
          model: "gpt-4.1",
          tools: ws()
        }),
        resp("5.6terra-none", {
          model: MODELO_PRINCIPAL,
          reasoning: {
            effort: "none"
          },
          tools: ws()
        }),
        resp("5.4mini-none-med", {
          model: "gpt-5.4-mini",
          reasoning: {
            effort: "none"
          },
          tools: ws({
            search_context_size: "medium"
          })
        }),
        resp("4.1mini-forcado", {
          model: "gpt-4.1-mini",
          tools: ws(),
          tool_choice: "required"
        }),
        chat("4omini-search", {
          model: "gpt-4o-search-preview",
          web_search_options: {
            search_context_size: "low"
          }
        })
      ]);
      return json({
        teste: out
      });
    }
    const teste = !appUser && b.teste_ctx != null; // teste de tamanho do contexto: nao grava conversa, nao usa historico
    if (appUser) {
      b.grupo = false;
      b.chat = "app:" + appUser.id;
      b.nome = appUser.nome;
      delete b.audio_b64;
      delete b.anexo_b64;
    }
    if (!cfg || cfg.ravi_ouvir === false) return json({
      responder: false,
      motivo: "desligado"
    });
    const grupoRF = String(cfg.zapi_grupo_rf || "").replace(/-group$/, "@g.us");
    const chat = String(b.chat || "");
    let texto = String(b.texto || "").trim().slice(0, 2000);
    const porVoz = !!b.audio_b64; // v7
    const temAnexo = !!b.anexo_b64; // v9
    if (!texto && !porVoz && !temAnexo) return json({
      responder: false,
      motivo: "sem texto"
    });
    let pessoa = null, nivel = "";
    if (b.grupo && chat === "120363413847438838@g.us") {
      const assJ = String(cfg.assinatura || "🤖 _Ravi - RF Logística_");
      const { data: segJ } = await sb.from("rf_segredos").select("valor").eq("chave", "wa_token").maybeSingle();
      if (temAnexo) {
        const rJ = await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/ravi-financeiro", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rf-token": segJ?.valor || ""
          },
          body: JSON.stringify({
            acao: "comprovante",
            cliente: "jt",
            b64: b.anexo_b64,
            mime: b.anexo_mime,
            nome: b.anexo_nome,
            enviado_por: b.nome || "",
            chat,
            texto,
            simular: !!b.simular_envio
          })
        }).then((r)=>r.json()).catch(()=>null);
        return json({
          responder: !!(rJ && rJ.texto),
          texto: rJ && rJ.texto ? rJ.texto : ""
        });
      }
      // v50 (29/10, Renato: "deixar o Ravi atento a qualquer resposta do grupo"): toda mensagem escrita por alguem de fora da equipe RF
      //   vai para o ravi-financeiro (acao mensagem_grupo): ele entende, responde no grupo e ajusta a cobranca; o Renato recebe tudo.
      const fsJ = [
        b.deAlt,
        b.de,
        b.chatAlt
      ].filter(Boolean).map((x)=>String(x).replace(/\D/g, "").slice(-8));
      const daEquipe = (cfg.ravi_equipe || []).some((p)=>fsJ.includes(String(p.fone || "").replace(/\D/g, "").slice(-8)));
      if (texto && !daEquipe) {
        const rM = await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/ravi-financeiro", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rf-token": segJ?.valor || ""
          },
          body: JSON.stringify({
            acao: "mensagem_grupo",
            cliente: "jt",
            texto,
            nome: b.nome || "",
            simular: !!b.simular_envio
          })
        }).then((r)=>r.json()).catch(()=>null);
        if (rM && rM.ok) return json({
          responder: !!rM.texto,
          texto: rM.texto || ""
        });
      }
      if (texto && (b.chamado || CHAMOU_RAVI.test(texto))) {
        if (!b.simular_envio) await waEnviar("5575999717578", "💰 *Grupo CONSOLIDAÇÃO JT x RF* — " + (b.nome || "alguém da JT") + " escreveu:\n\"" + texto.slice(0, 600) + "\"\n\nRespondi que vou verificar. Me diga o que responder.\n\n" + assJ, cfg, "financeiro jt");
        return json({
          responder: true,
          texto: "Olá" + (b.nome ? ", " + String(b.nome).split(" ")[0] : "") + "! Recebi sua mensagem e vou verificar com a equipe. Para pagamentos, é só mandar o comprovante aqui que eu confiro e dou baixa. 🙏\n\n" + assJ
        });
      }
      return json({
        responder: false,
        motivo: "grupo financeiro: sem comprovante"
      });
    }
    if (b.grupo && chat !== grupoRF || !appUser && b.teste_cliente) {
      const { data: cgc } = await sb.from("torre_config").select("grupos_clientes").eq("id", 1).maybeSingle();
      const gs = Array.isArray(cgc?.grupos_clientes) ? cgc.grupos_clientes : [];
      const gc = b.teste_cliente ? gs.find((g)=>g && g.cliente_re && new RegExp(String(g.cliente_re), "i").test(String(b.teste_cliente))) : gs.find((g)=>g && String(g.grupo || "").replace(/-group$/, "@g.us") === chat);
      if (gc) return json(await responderCliente(gc, b, texto, porVoz, cfg, !!b.teste_cliente));
    }
    if (b.grupo) {
      if (!grupoRF || chat !== grupoRF) return json({
        responder: false,
        motivo: "grupo nao autorizado"
      });
      if (!b.chamado && !porVoz && !temAnexo && !CHAMOU_RAVI.test(texto)) return json({
        responder: false,
        motivo: "grupo da RF sem chamar o Ravi"
      }); // v34: o servidor v9 manda todas as mensagens dos grupos
      pessoa = await quemFala([
        b.deAlt,
        b.de
      ].filter(Boolean), cfg);
      nivel = "tudo"; // decisao do Renato: no grupo da RF o Ravi responde tudo
    } else if (appUser) {
      pessoa = {
        nivel: "tudo",
        nome: appUser.nome,
        login: appUser.email
      };
      nivel = "tudo";
    } else {
      pessoa = await quemFala([
        b.chatAlt,
        b.chat,
        b.deAlt,
        b.de
      ].filter(Boolean), cfg);
      if (!pessoa) return json({
        responder: false,
        motivo: "numero nao autorizado"
      });
      nivel = pessoa.nivel;
      const mApr = nivel === "tudo" && texto.length < 80 ? texto.match(/^\W*(confirma|confirmo|confirmado|aprova|aprovo|aprovado|pode lan[cç]ar|reprova|reprovo|reprovado|recusa)\b\D*(\d+)?/i) : null; // v38: aprovacao de compra pelo WhatsApp
      if (mApr) {
        const fs3 = [
          b.chatAlt,
          b.chat
        ].filter(Boolean).map(chaveFone);
        const { data: pend } = await sb.from("ravi_aprovacoes").select("*").eq("tipo", "compra").is("feito_em", null).gt("criado_em", new Date(Date.now() - 15 * 86400e3).toISOString()).order("id", {
          ascending: false
        });
        const minhas = (pend || []).filter((x)=>(x.alvos || []).some((d)=>fs3.includes(chaveFone(d.fone))));
        const nAlvo = mApr[2] ? Number(mApr[2]) : 0;
        const ap = nAlvo ? minhas.find((x)=>Number(x.numero) === nAlvo) : minhas.length === 1 ? minhas[0] : null;
        if (ap || nAlvo && minhas.length) {
          const ass = String(cfg.assinatura || "🤖 _Ravi - RF Logística_");
          if (!ap) return json({
            responder: true,
            texto: "Não achei a compra nº " + nAlvo + " esperando a sua aprovação. Pendentes: " + minhas.map((x)=>"nº " + x.numero).join(", ") + ".\n\n" + ass
          });
          const aprovar = !/^\W*(reprov|recusa)/i.test(texto);
          const { data: trava } = await sb.from("ravi_aprovacoes").update({
            feito_em: new Date().toISOString(),
            feito_por: pessoa.nome
          }).eq("id", ap.id).is("feito_em", null).select("id");
          if (!trava || !trava.length) return json({
            responder: true,
            texto: "A compra nº " + ap.numero + " já foi decidida.\n\n" + ass
          });
          const r = await chamarCompras({
            acao: "decidir",
            numero: ap.numero,
            por: pessoa.nome,
            aprovar
          });
          if (!r || !r.ok) {
            if (!r?.ja_decidida) await sb.from("ravi_aprovacoes").update({
              feito_em: null,
              feito_por: null
            }).eq("id", ap.id);
            return json({
              responder: true,
              texto: "Não consegui " + (aprovar ? "aprovar" : "reprovar") + " a compra nº " + ap.numero + ": " + String(r?.erro || "erro").slice(0, 300) + "\n\n" + ass
            });
          }
          const res = aprovar ? `✅ Compra nº ${ap.numero} *aprovada* por ${pessoa.nome}${r.lancou_manutencao ? " e lançada na Manutenção do " + r.placa : ""}.${r.aviso ? "\n⚠️ " + r.aviso : ""}${r.vencimentos && r.vencimentos.length ? "\n💳 " + r.pagamento + ": " + r.vencimentos.join(", ") : ""}${r.teto ? "\n" + r.teto : ""}\nFalta anexar a nota fiscal quando chegar (aba Compras).` : `❌ Compra nº ${ap.numero} *reprovada* por ${pessoa.nome}.`;
          await sb.from("ravi_aprovacoes").update({
            resultado: aprovar ? "aprovada" : "reprovada"
          }).eq("id", ap.id);
          const outros = [
            ...(ap.alvos || []).filter((d)=>!fs3.includes(chaveFone(d.fone))).map((d)=>d.fone),
            ap.chat
          ].filter((f, i, arr)=>f && !fs3.includes(chaveFone(f)) && arr.indexOf(f) === i);
          for (const f of outros)await waEnviar(f, res, cfg, "compra nº " + ap.numero);
          return json({
            responder: true,
            texto: res + "\n\n" + ass
          });
        }
      }
      const mLib = texto.length < 60 ? texto.match(/^\W*(libera|liberar|liberado|pode\s+pagar)\b\D*?(?:p\s*)?(\d+)?\s*\W*$/i) : null; // v44 (RFL v767): OK do Marcelo para pagar o motorista
      if (mLib && /^(marcelo|renato)/i.test(String(pessoa?.nome || ""))) {
        const assL = String(cfg.assinatura || "🤖 _Ravi - RF Logística_");
        const { data: pl } = await sb.from("rf_pag_motorista").select("*").is("liberado_em", null).not("avisado_em", "is", null).order("id", {
          ascending: false
        });
        const nP = mLib[2] ? Number(mLib[2]) : 0;
        const alvoP = nP ? (pl || []).find((x)=>Number(x.id) === nP) : (pl || []).length === 1 ? pl[0] : null;
        if (!alvoP && (pl || []).length > 1 && !nP) return json({
          responder: true,
          texto: "Tem mais de um pagamento esperando o seu OK: " + pl.map((x)=>"P" + x.id + " (" + String(x.placa) + " " + String(x.motorista || "").replace(/[._]/g, " ") + ")").join(", ") + ". Responda com o número, ex.: *libera P" + pl[0].id + "*.\n\n" + assL
        });
        if (alvoP) {
          const quando = new Date().toISOString();
          const { error: eL } = await sb.rpc("ravi_viagem_atualizar", {
            p_id: String(alvoP.viagem_id),
            p_campos: {
              pagLiberado: true,
              pagLiberadoPor: pessoa.nome,
              pagLiberadoEm: quando,
              atualizadoEm: Date.now()
            }
          });
          if (eL) return json({
            responder: true,
            texto: "Não consegui liberar: " + eL.message + "\n\n" + assL
          });
          await sb.from("rf_pag_motorista").update({
            liberado_em: quando,
            liberado_por: pessoa.nome
          }).eq("id", alvoP.id);
          const rs = (n)=>"R$ " + (Number(n) || 0).toFixed(2).replace(".", ","); // v45: motorista e ajudante separados, nunca somados
          return json({
            responder: true,
            texto: "✅ Pagamento *P" + alvoP.id + "* liberado — " + String(alvoP.placa) + ": motorista " + String(alvoP.motorista || "").replace(/[._]/g, " ") + " " + rs(alvoP.valor_mot) + (Number(alvoP.valor_aj) > 0 ? " · ajudante " + rs(alvoP.valor_aj) : "") + ". Já aviso a Flávia para pagar.\n\n" + assL
          });
        }
        if (nP) return json({
          responder: true,
          texto: "Não achei o pagamento P" + nP + " esperando liberação.\n\n" + assL
        });
      }
      const mFin = nivel === "tudo" && texto.length < 80 ? texto.match(/^\W*(j[aá]\s+pagou|j[aá]\s+pagaram|pagou|pagaram|foi\s+pago|pode\s+cobrar|cobra|cobrar|cobre)\b\D*?(?:f\s*)?(\d+)?\s*\W*$/i) : null; // v40: financeiro JT
      if (mFin) {
        const { data: pf } = await sb.from("ravi_fin_cobrancas").select("id,placa,data_viagem,rota,valor").eq("estado", "perguntado").order("id", {
          ascending: false
        });
        const nF = mFin[2] ? Number(mFin[2]) : 0;
        const alvoF = nF ? (pf || []).find((x)=>Number(x.id) === nF) : (pf || []).length === 1 ? pf[0] : null;
        const assF = String(cfg.assinatura || "🤖 _Ravi - RF Logística_");
        if (!alvoF && (pf || []).length > 1 && !nF) return json({
          responder: true,
          texto: "Tem mais de uma viagem esperando sua resposta: " + pf.map((x)=>"F" + x.id + " (" + String(x.placa) + " " + String(x.data_viagem || "").split("-").reverse().slice(0, 2).join("/") + ")").join(", ") + ". Responda com o número, ex.: *cobra F" + pf[0].id + "*.\n\n" + assF
        });
        if (alvoF) {
          const pagou = /pag/i.test(mFin[1]);
          const { data: segF } = await sb.from("rf_segredos").select("valor").eq("chave", "wa_token").maybeSingle();
          const rF = await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/ravi-financeiro", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-rf-token": segF?.valor || ""
            },
            body: JSON.stringify({
              acao: "resposta",
              cliente: "jt",
              id: alvoF.id,
              decisao: pagou ? "pagou" : "cobrar",
              por: pessoa.nome,
              simular: !!_simularEnvio
            })
          }).then((r)=>r.json()).catch(()=>null);
          const dv = String(alvoF.placa) + " de " + String(alvoF.data_viagem || "").split("-").reverse().join("/");
          if (!rF || !rF.ok) return json({
            responder: true,
            texto: "Não consegui registrar: " + String(rF?.erro || "erro no financeiro") + "\n\n" + assF
          });
          if (rF.ja) return json({
            responder: true,
            texto: "Essa viagem (" + dv + ") já estava resolvida.\n\n" + assF
          });
          return json({
            responder: true,
            texto: pagou ? "✅ Anotado: viagem " + dv + " marcada como *paga* (informado por " + pessoa.nome + "). Não vou cobrar a JT. Quando o extrato chegar, eu confiro.\n\n" + assF : rF.cobrou_agora ? "📤 Cobrança da viagem " + dv + " enviada no grupo *CONSOLIDAÇÃO JT x RF*. Eu acompanho e aviso quando o pagamento aparecer no extrato.\n\n" + assF : "👍 Combinado: cobro a viagem " + dv + " no grupo da JT no próximo horário comercial (seg a sex, 8h às 18h).\n\n" + assF
          });
        }
      }
      if (nivel === "tudo" && /^\W*(confirma|confirmo|confirmado|pode lan[cç]ar|lan[cç]a|lan[cç]ar)\b/i.test(texto) && texto.length < 80) {
        const fs2 = [
          b.chatAlt,
          b.chat
        ].filter(Boolean).map(chaveFone);
        const { data: pa } = await sb.from("ravi_alertas_cliente").select("id,alvos,acao,cliente").not("acao", "is", null).is("acao_feita_em", null).gt("criado_em", new Date(Date.now() - 24 * 3600e3).toISOString()).order("id", {
          ascending: false
        });
        const meu = (pa || []).find((x)=>x.acao && x.acao.tipo === "criar_yamaha" && (x.alvos || []).some((d)=>fs2.includes(chaveFone(d.fone))));
        if (meu) {
          await sb.from("ravi_alertas_cliente").update({
            acao_feita_em: new Date().toISOString(),
            acao_por: pessoa.nome
          }).eq("id", meu.id).is("acao_feita_em", null);
          const r = await chamarMotor({
            acao: "criar_yamaha",
            chat: meu.acao.chat,
            leitura: meu.acao.leitura,
            pedidoPor: pessoa.nome
          });
          const ass = String(cfg.assinatura || "🤖 _Ravi - RF Logística_");
          if (!r || !r.ok) {
            await sb.from("ravi_alertas_cliente").update({
              acao_feita_em: null
            }).eq("id", meu.id);
            return json({
              responder: true,
              texto: "Não consegui lançar a viagem do picking: " + String(r?.erro || "erro").slice(0, 300) + "\n\n" + ass
            });
          }
          return json({
            responder: true,
            texto: `✅ Viagem da ${meu.cliente} lançada: *${r.placa}* · ${r.motorista} · ${String(r.data || "").split("-").reverse().join("/")}\n${(r.destinos || []).map((d)=>"• " + d.cidade + ": " + (d.mix || "")).join("\n")}${r.enviadaAoMotorista ? "\n📲 Enviada ao motorista." : "\n⚠️ Não foi enviada a nenhum motorista — diga quem vai."}${(r.avisos || []).length ? "\n⚠️ " + r.avisos.join("; ") : ""}\n\nLembrem de confirmar o horário no pátio lá no grupo da ${meu.cliente}.\n\n${ass}`
          });
        }
      }
      if (nivel === "tudo" && /^\W*(ok|okay|blz|beleza|visto|vi|ja vi|já vi|ja respondi|já respondi|respondi|resolvido|certo|to vendo|tô vendo|estou vendo|vou responder|pode deixar|deixa comigo|feito)\b/i.test(texto) && texto.length < 60) {
        const fs = [
          b.chatAlt,
          b.chat
        ].filter(Boolean).map(chaveFone);
        const { data: ab } = await sb.from("ravi_alertas_cliente").select("id,alvos,grupo,cliente").is("resolvido_em", null);
        const meus = (ab || []).filter((x)=>(x.alvos || []).some((d)=>fs.includes(chaveFone(d.fone))));
        if (meus.length) {
          await sb.from("ravi_alertas_cliente").update({
            resolvido_em: new Date().toISOString(),
            resolvido_por: pessoa.nome + " (respondeu ao Ravi)"
          }).in("id", meus.map((x)=>x.id));
          return json({
            responder: true,
            texto: "Beleza, " + pessoa.nome + "! Parei de insistir no chamado da " + [
              ...new Set(meus.map((x)=>x.cliente))
            ].join(", ") + ". 👍\n\n" + String(cfg.assinatura || "🤖 _Ravi - RF Logística_")
          });
        }
      }
    }
    if (temAnexo) {
      await sb.from("ravi_anexos").insert({
        chat,
        quem: pessoa ? pessoa.nome : String(b.nome || ""),
        mime: String(b.anexo_mime || ""),
        nome: String(b.anexo_nome || ""),
        b64: String(b.anexo_b64)
      });
      await sb.from("ravi_anexos").delete().lt("em", new Date(Date.now() - 7 * 86400e3).toISOString());
      if (b.grupo && !b.chamado) return json({
        responder: false,
        motivo: "arquivo guardado (grupo, sem chamar o Ravi)"
      });
      if (!b.grupo && pessoa && pessoa.nivel === "motorista" && /^image\//.test(String(b.anexo_mime || ""))) {
        const tf = await tipoDaFoto(String(b.anexo_b64), String(b.anexo_mime || "image/jpeg"));
        b.anexo_nome = "foto " + (tf === "painel" ? "do PAINEL (KM)" : tf === "bomba" ? "da BOMBA de combustivel" : tf === "nota" ? "da NOTA do abastecimento" : tf === "canhoto" ? "de CANHOTO" : "(nao identificada)");
      }
      if (!texto) texto = "(mandou um arquivo: " + String(b.anexo_nome || "print") + ", sem texto)";
      else texto = texto + " (junto com um arquivo: " + String(b.anexo_nome || "print") + ")";
    }
    if (porVoz) {
      texto = (await transcrever(String(b.audio_b64), String(b.audio_mime || "audio/ogg"))).slice(0, 2000);
      if (!texto) return json({
        responder: !b.grupo,
        texto: "Não consegui entender o áudio. Pode mandar de novo, falando um pouco mais perto do celular?"
      });
      if (b.grupo && !b.chamado && !CHAMOU_RAVI.test(texto)) return json({
        responder: false,
        motivo: "audio no grupo sem chamar o Ravi",
        transcricao: texto
      });
    }
    if (b.citada && texto) texto = texto + "\n\n[ESTA MENSAGEM RESPONDE A " + (b.citada_do_ravi ? "UMA MENSAGEM DO RAVI" : "UMA MENSAGEM") + " (o assunto -- placa, caminhao, alerta -- e o desta mensagem citada): \"" + String(b.citada).slice(0, 1200) + "\"]"; // v37
    // v10: valores so no privado de quem esta em ravi_financeiro
    const fonesV = (b.grupo ? [
      b.deAlt,
      b.de
    ] : [
      b.chatAlt,
      b.chat,
      b.deAlt,
      b.de
    ]).filter(Boolean).map(chaveFone).filter(Boolean);
    const semValores = appUser ? !(Array.isArray(cfg.ravi_financeiro) ? cfg.ravi_financeiro : []).some((c)=>c && c.email && String(c.email).toLowerCase() === String(appUser.email || "").toLowerCase()) // v15
     : !!b.grupo || !(Array.isArray(cfg.ravi_financeiro) ? cfg.ravi_financeiro : []).some((c)=>c && fonesV.includes(chaveFone(c.fone)));
    _semValores = semValores;
    // v8: quem pode mandar CRIAR viagem (Renato e Marcelo)
    const fonesQuem = (b.grupo ? [
      b.deAlt,
      b.de
    ] : [
      b.chatAlt,
      b.chat,
      b.deAlt,
      b.de
    ]).filter(Boolean).map(chaveFone).filter(Boolean);
    const criadores = Array.isArray(cfg.ravi_criadores) ? cfg.ravi_criadores : [];
    const fonesDoLogin = appUser ? (Array.isArray(cfg.ravi_financeiro) ? cfg.ravi_financeiro : []).filter((c)=>c && c.email && String(c.email).toLowerCase() === String(appUser.email || "").toLowerCase()).map((c)=>chaveFone(c.fone)) : [];
    const foneMaster = chaveFone(String(((Array.isArray(cfg.ravi_financeiro) ? cfg.ravi_financeiro : []).find((c)=>c && /^comercial@/i.test(String(c.email || ""))) || {}).fone || ""));
    const ehMaster = !!foneMaster && (appUser ? /^comercial@rflogistica\.com\.br$/i.test(String(appUser.email || "")) : !b.grupo && fonesQuem.includes(foneMaster)); // v21: cofre de Contratos so do Renato, e so no privado/app
    const podeCriar = criadores.some((c)=>c && (fonesQuem.includes(chaveFone(c.fone)) || fonesDoLogin.includes(chaveFone(c.fone)))); // v17: no app tambem (Renato e Marcelo pelo e-mail do login)
    const pergunta = texto.replace(CHAMOU_RAVI, "").replace(/^[\s,:.!?-]+/, "").trim() || texto;
    const nomeQuem = pessoa ? pessoa.nome : String(b.nome || "").trim() || "alguém da equipe";
    // v14: resposta sempre em audio para quem esta em ravi_voz (Renato), salvo se pedir por escrito
    const vozSempre = (Array.isArray(cfg.ravi_voz) ? cfg.ravi_voz : []).some((c)=>c && fonesQuem.includes(chaveFone(c.fone)));
    const pedeEscrito = /por escrito|\bescrev|em texto|manda(r)? (o |em )?texto|digitad/i.test(texto);
    const emAudio = !appUser && (porVoz || vozSempre && !pedeEscrito);
    const estiloFalado = emAudio || !!appUser && !!b.falado; // v15: o app vai falar a resposta
    // conhecimento
    let conhecimento = "", leitura = null, memoBloco = "";
    if (nivel === "tudo") {
      // v3: abre so as gavetas do assunto da pergunta (e das ultimas mensagens da conversa) · v16: as tres leituras juntas
      const [{ data: cx }, { data: ult }, dApp, aoVivo] = await Promise.all([
        sb.from("ravi_contexto").select("texto,em").eq("id", 1).maybeSingle(),
        sb.from("ravi_conversas").select("texto").eq("chat", chat).eq("papel", "pessoa").gte("em", new Date(Date.now() - 2 * 3600e3).toISOString()).order("em", {
          ascending: false
        }).limit(2),
        dadosApp(),
        blocoAoVivo(null)
      ]);
      memoBloco = await memoriaTexto(); // v18
      const pedido = [
        pergunta,
        ...(ult || []).map((u)=>u.texto)
      ].join(" "); // v6: com os dados do app chegando, o texto vira pano de fundo (60 mil); sem eles, segue como na v5 (150 mil)
      const mc = cx ? montarConhecimento(String(cx.texto || ""), pedido, !appUser && b.teste_ctx != null && Number(b.teste_ctx) >= 0 ? Number(b.teste_ctx) : dApp && dApp.gerado ? 20000 : 40000, semValores) : null;
      if (mc) leitura = {
        gavetas: mc.gavetas,
        lido: mc.texto.length,
        total: mc.total
      };
      conhecimento = (mc ? `DADOS DO SISTEMA (copia gerada pelo sistema em ${dataHora(cx.em)} — numeros de financeiro, viagens, abastecimentos etc. sao dessa hora; assuntos abertos para esta pergunta: ${mc.gavetas}):\n${mc.texto}` : "DADOS DO SISTEMA: ainda nao recebidos (o sistema envia quando um administrador esta logado).") + "\n\n" + aoVivo;
    } else {
      conhecimento = await blocoMotorista(pessoa);
    }
    marca("conhecimento" + conhecimento.length);
    const { data: hist } = await sb.from("ravi_conversas").select("papel,texto,quem,em").eq("chat", teste ? "teste-sem-historico" : chat).gte("em", new Date(Date.now() - 12 * 3600e3).toISOString()).order("em", {
      ascending: false
    }).limit(12);
    const historico = (hist || []).reverse().map((h)=>({
        role: h.papel === "ravi" ? "assistant" : "user",
        content: h.papel === "ravi" ? h.texto : (h.quem ? h.quem + ": " : "") + h.texto
      }));
    const regrasNivel = nivel === "tudo" ? semValores ? "Quem fala com voce e da equipe da RF" + (b.grupo ? " no grupo Torre Rf Logistica" : "") + ". REGRA DE VALORES (decisao do Renato): NUNCA passe valores em dinheiro -- frete, faturamento, a receber, pagamentos, contas, compras, gastos, custo, lucro, margem, salario. Se pedirem, diga com educacao que valores o Ravi so passa no privado para quem tem permissao (Renato, Marcelo e Flavia). Operacao (onde esta, cidades, entregas, KM, dias, manutencao, motoristas, documentos) pode responder normalmente." : "Quem fala com voce tem permissao de VALORES (Renato, Marcelo ou Flavia) e esta no privado: pode responder qualquer assunto do sistema, inclusive financeiro." : `Quem fala com voce e o MOTORISTA ${nomeQuem}. Responda SO sobre a viagem, a rota, as entregas e o caminhao DELE. NUNCA passe valores financeiros (frete, faturamento, custos, pagamentos, saldo), nem dados de outros motoristas ou de outras viagens. Se ele pedir algo fora disso, diga com educacao que isso ele deve ver com o escritorio. O CAMINHO NORMAL E O APP DA RF. Voce so entra no circuito quando o motorista NAO PODE ou NAO CONSEGUE fazer pelo app (decisao do Renato): se ele so perguntar COMO iniciar, finalizar ou lancar abastecimento, explique o caminho no app (Iniciar viagem / Finalizar viagem com a foto do KM; Abastecimento com as fotos do painel, bomba e nota) e diga que, se o app nao funcionar, ele pode mandar as fotos aqui. Se ele disser que nao consegue pelo app (travou, nao abre, sem internet no app, esqueceu a senha) ou MANDAR AS FOTOS AQUI, faca por ele o que o app faz: INICIAR a viagem (iniciar_viagem), FINALIZAR a viagem (finalizar_viagem) e LANCAR ABASTECIMENTO (lancar_abastecimento), usando as FOTOS que ele manda aqui. Inicio e fim precisam da foto do PAINEL com o KM, tirada na hora; abastecimento precisa das fotos do painel, da bomba e da nota (pode mandar aos poucos). Se ele mandar a foto do painel e tiver viagem aguardando inicio, inicie; se a viagem estiver em andamento e ele disser que chegou/terminou, finalize; se disser que abasteceu ou mandar bomba/nota, lance o abastecimento. Se nao der para saber se a foto do painel e de inicio, fim ou abastecimento, pergunte numa frase curta. Depois de fazer, confirme curto o que foi feito e o KM lido (sem valores em dinheiro); se faltar foto, diga qual mandar. Nunca diga que fez algo se a ferramenta nao devolveu ok. COBRANCAS E PEDIDOS DO MOTORISTA (despesa que nao entrou, falta pagar a viagem, caminhao com problema, quero abastecer, documento, duvida da viagem): trate com respeito e resolva. 1) Primeiro CONSULTE minhas_viagens_situacao (e meus_chamados se ele ja tinha pedido) e, se ja estiver resolvido, diga (ex.: 'a janta de 22/10 ja esta lancada', 'o pagamento dessa viagem consta como feito em 17/10') -- sem valores em dinheiro. 2) Se precisar de alguem da equipe, ABRA UM CHAMADO (abrir_chamado) com tudo que ele contou, e diga o numero e com quem ficou (ex.: 'Abri o chamado 12 com a Flavia; eu acompanho e te aviso assim que ela tratar'). Pergunte antes so o que for essencial e faltar (qual viagem, o que aconteceu, onde esta). 3) EMERGENCIA (acidente, quebrou na estrada, roubo, mal-estar, risco): abra na hora como emergencia, diga para ele ficar em local seguro e sinalizar o caminhao, e que a equipe ja foi avisada. 4) Nunca prometa prazo nem valor; nao discuta nem culpe ninguem; se ele ja tem chamado aberto do assunto, informe o andamento em vez de abrir outro.`;
    // v11: perguntas abertas do Ravi (caminhao que nao saiu da base) -- a equipe responde aqui
    let blocoPerg = "";
    if (nivel === "tudo") {
      const pa = await perguntasAbertas();
      try {
        blocoPerg += await blocoChamadosAbertos();
      } catch (_) {}
      if (pa.length) blocoPerg += "\nPERGUNTAS ABERTAS DO RAVI NO GRUPO TORRE (caminhao que passou da hora de saida e nao saiu de Feira de Santana; sem resposta em 1 h o Ravi avisa o Renato com urgencia):\n" + pa.map((x)=>"- " + x.placa + " (" + (x.motorista || "?") + "), viagem de " + (x.ref?.data || "?") + ", perguntado " + dataHora(x.ref?.perguntado_em || x.primeira_em)).join("\n") + "\nSe a mensagem explicar o motivo de algum desses (ex.: reprogramada, aguardando carga, manutencao, sem motorista), CHAME registrar_motivo (com nova_data se disserem para quando) e responda curto confirmando o que registrou.\n";
    }
    const system = `Voce e o RAVI, robo de monitoramento 24h da RF Logistica (transportadora de Feira de Santana/BA). Voce e masculino, educado, direto e prestativo.
${estiloFalado ? (porVoz || appUser ? "A PERGUNTA VEIO POR AUDIO (transcrito automaticamente; pode ter erro de transcricao em placa ou nome -- se ficar ambiguo, confirme) E " : "A PERGUNTA VEIO ESCRITA, MAS ESTA PESSOA PEDIU PARA RECEBER TODA RESPOSTA EM AUDIO: ") + "SUA RESPOSTA SERA FALADA EM AUDIO, com voz de baiano: fale como um colega baiano conversando no WhatsApp (informal e simpatico; pode usar 'beleza', 'meu rei', 'viu?', 'valeu' com naturalidade, sem exagerar e sem girias pesadas), responda curto (ate uns 40 segundos falando), em frases simples e naturais, SEM asterisco, sem lista, sem emoji e sem simbolos; valores do jeito que se fala (ex.: 'cento e quarenta e oito mil e novecentos reais'); arredonde quando ajudar; diga horarios como 'onze e trinta e nove'. " : ""}REGRAS: responda em portugues do Brasil, curto e claro (no maximo uns 12 linhas), no estilo do WhatsApp: *negrito* com um asterisco so em palavras-chave (nunca na frase inteira), sem titulos com #, sem tabelas. VOCE E AUTONOMO: quando precisar de um dado, CONSULTE as ferramentas e responda -- nunca responda "posso consultar, se quiser" nem peca licenca para pesquisar; se for preciso somar ou comparar (ex.: qual caminhao rodou mais KM no mes), busque os dados e faca a conta voce mesmo. ${nivel === "tudo" ? "CHAMADOS DE MOTORISTAS: quando alguem da equipe disser que tratou, pagou, lancou, resolveu ou esta vendo o pedido de um motorista (ou responder a uma cobranca de chamado), chame atualizar_chamado com o numero certo e uma resposta simples para o motorista -- o Ravi avisa ele; se disser que e com outra pessoa, use encaminhar_chamado. " : ""}${nivel === "tudo" ? "MEMORIA: voce tem memoria permanente (ferramentas lembrar e esquecer). Quando alguem da equipe disser uma decisao, regra ou fato que vai valer daqui para frente, ou pedir para lembrar/anotar, chame lembrar e confirme curto que guardou; se um fato da MEMORIA DO RAVI mudou, chame esquecer (com o numero) e lembrar o novo. Siga sempre o que esta na memoria. DOCUMENTOS: quando pedirem um documento (CRLV, apolice, contrato, portfolio etc.), MANDE O ARQUIVO -- ache com documentos_caminhao (ou nos dados do sistema) e chame enviar_documento; nunca escreva link nem diga que mandou sem a ferramenta ter devolvido ok. COMPRAS PELA FOTO (qualquer pessoa da equipe pode): se mandarem aqui FOTO/PDF de OS de oficina, orcamento, nota fiscal, cupom ou recibo de peca, pneu ou servico de caminhao, chame lancar_compra_foto (com a placa, se disseram) -- o robo de compras abre a compra e manda para o Renato e o Marcelo aprovarem; diga o numero da compra e o resumo. Se faltar a placa, pergunte. Se o robo disser que ja foi lancado, avise e nao insista. RESPOSTA A UM ALERTA: quando a mensagem responder (citar) um alerta, o caminhao e a PLACA SAO OS DO ALERTA CITADO -- nunca troque por outro. Se for alerta de FORA DA ROTA e a pessoa disser que esta certo (povoados, interior, entrega) ou pedir para gravar/liberar a rota, chame aprovar_desvio com essa placa. NUNCA diga que gravou, registrou, lancou ou mandou algo sem a ferramenta ter devolvido ok -- se nao tiver ferramenta para isso, diga que nao consegue e registre com pedir_ao_claude. " : ""}${nivel === "tudo" ? "VOCE TEM FERRAMENTAS DE CONSULTA AO BANCO DA RF: para numeros (faturamento, a receber, lucro, contas, compras, gastos, manutencao, oleo, motoristas, entregas, abastecimentos, CT-e/MDF-e, posicao) CONSULTE a ferramenta certa antes de responder, com o periodo certo (hoje e " + hojeBA() + "; 'esse mes' = o MES INTEIRO, do dia 1 ao ultimo dia, igual ao sistema -- viagem com data mais adiante no mes tambem conta). Use os dados que a ferramenta devolver; o texto do sistema abaixo e so pano de fundo e pode estar desatualizado. " : ""}${nivel === "tudo" ? "ASSUNTOS DA RF (operacao, viagens, financeiro, frota, motoristas, clientes): use SOMENTE dados reais (das ferramentas ou do texto abaixo); se a informacao nao estiver neles, diga que nao tem esse dado agora, nunca invente. PERGUNTAS GERAIS (fora da RF -- conhecimento geral, contas, explicacoes, leis de transito, conselhos, ideias, textos, traducao, qualquer assunto): responda normalmente com o seu proprio conhecimento, como um assistente completo, sem recusar por nao ser da RF. O que MUDA COM O TEMPO (clima, noticias, cotacao, precos, resultados de jogos, leis e regras novas, horario de funcionamento, quem ocupa um cargo hoje): use a ferramenta pesquisar_internet antes de responder e diga de qual site veio (ex.: segundo o Climatempo); nunca diga que a fonte e a OpenAI." : "Use SOMENTE dados reais (das ferramentas ou do texto abaixo); se a informacao nao estiver neles, diga que nao tem esse dado agora, nunca invente."} Nunca passe CPF, RG ou endereco de pessoas. Quando citar posicao, diga de que horas e. Valores em R$ com virgula decimal. ${podeCriar ? "VOCE PODE CRIAR VIAGEM para esta pessoa (ferramenta criar_viagem): quando ela pedir, crie direto, sem pedir confirmacao (decisao do Renato). Se ela mandar o PRINT/PDF da programacao da JT/Mateus (mesmo sem texto, ou com 'cria essa'), chame criar_viagem com cliente JT/Mateus (placa/motorista so se ela disser). Se ela mandar a FOTO do PICKING LIST EXPEDICAO da Yamalog (folha da Yamaha com Placa, Motorista, NF, Tipo SMALL/BIG, Localizacao) OU o PRINT/FOTO da PLANILHA DE PROGRAMACAO da Yamalog (Excel com uma aba por motorista, Romaneio, colunas Minuta, CTe, Solicitacao, Tipo, Nome CCY, Localizacao, Prazo entrega, Chassi -- a placa sai do caminhao do motorista), chame criar_viagem com cliente Yamaha (placa/motorista/data so se ela disser outro) e depois diga placa, motorista, destinos com a quantidade e o tipo (ex.: 23 Rack Small + 1 Rack Big), frete e os avisos. Se ela mandar FOTO/PDF de OS de oficina, orcamento, nota ou cupom de peca/servico de caminhao, chame lancar_compra_foto. Se ela mandar um arquivo que nao parece programacao nem compra e nao disser nada, pergunte o que fazer com ele; depois diga o que criou (placa, motorista, cidades na ordem, KM, dias, frete) e avise se alguma cidade foi interpretada (ex.: 'do inacencio' = Dom Inocencio) ou se houve aviso. Se o motor recusar, explique o motivo e o que falta. VOCE TAMBEM MANDA MENSAGEM NO WHATSAPP para esta pessoa (ferramenta enviar_whatsapp): quando ela pedir para mandar, avisar, cobrar, lembrar ou dar recado a alguem da equipe, a um motorista ou ao grupo, mande DIRETO, sem pedir confirmacao e sem dizer que nao tem permissao; depois confirme curto para quem foi e o que disse. TAREFAS DO ESCRITORIO para esta pessoa, DIRETO e sem pedir confirmacao: dar baixa de recebimento (marcar_viagens_pagas -- consulte viagens antes e use os ids certos), mudar a data de uma viagem (mudar_data_viagem), aprovar ou rejeitar abastecimento pendente (consulte abastecimentos com status pendente antes), LANCAR O ABASTECIMENTO DE UM MOTORISTA que esqueceu ou nao conseguiu pelo app (lancar_abastecimento_motorista) com as fotos de painel, bomba e nota que esta pessoa mandou aqui -- se ela disser de quem e (placa, motorista ou 'a viagem de hoje do fulano'), lance direto, sem pedir de novo. FINALIZAR A VIAGEM DE UM MOTORISTA que nao finalizou pelo app (finalizar_viagem_motorista) com a foto do painel (KM de chegada) que esta pessoa mandou aqui -- foto encaminhada ou print valem; se ela disser que e a foto final, finalize direto. Se o pedido for ambiguo (mais de uma viagem ou abastecimento possivel), pergunte qual numa frase curta. Depois confirme exatamente o que fez. TAREFAS COM HORARIO: quando a pessoa pedir uma rotina ('todo dia', 'a partir de segunda', 'fica cobrando fulano', 'acompanha e me avisa'), crie com criar_tarefa (horarios da Bahia; padrao segunda a sexta) e confirme os horarios -- voce mesmo executa nos horarios, cobra e avisa o Renato se nao responderem. Apagar lancamentos e mexer em valores ainda e no sistema pela equipe. MELHORIAS NO SISTEMA OU EM VOCE MESMO: registre com pedir_ao_claude (o Claude e quem programa; nao e contato de WhatsApp) e diga o numero do pedido; para saber se ja foi feito, consulte pedidos_ao_claude. SUA APARENCIA: voce NAO enxerga a sua propria imagem nem a animacao na tela -- nunca diga se ficou bom ou ruim, nem invente o que mudou; pergunte o que a pessoa viu e mande as palavras dela ao Claude." : "Voce so CONSULTA e informa: se pedirem para lancar, criar, aprovar, mudar ou apagar algo, explique que isso e feito no sistema pela equipe (criar viagem pelo Ravi so o Renato e o Marcelo podem pedir)."} Nao assine a mensagem (a assinatura entra sozinha).

QUEM ESTA FALANDO: ${regrasNivel}
${memoBloco}
${conhecimento}
${blocoPerg}
AGORA: esta conversando ${appUser ? "pelo painel do sistema (icone de voz)" : "pelo WhatsApp" + (b.grupo ? " no grupo interno Torre Rf Logistica" : " no privado")} com ${nomeQuem}. Agora e ${agoraTxt()} (horario da Bahia).`;
    // v24: correcao -> pensa de novo
    const pergSA = pergunta.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const corrigiu = historico.length > 0 && /(nao e (isso|essa|esse|assim|bem isso)|nao era (isso|essa|esse)|nao foi (isso|essa|esse)|(ta|esta|tá) errad|resposta errad|voce errou|errou|nao perguntei|nao foi o que (eu )?(perguntei|pedi)|nao e o que (eu )?(perguntei|pedi|quero)|voce nao entendeu|nao entendeu|pensa (de novo|melhor|direito)|pense (de novo|melhor)|repensa|nao e essa a resposta|nada a ver|nao tem nada a ver)/.test(pergSA);
    if (corrigiu) _esforco = "medium";
    else if (nivel === "tudo" && /(por que|porque|analis|compar|vale a pena|o que (voce )?acha|estrateg|previs|tendenc|ranking|melhor|pior|explica)/.test(pergSA)) _esforco = "medium"; // v36
    else if (nivel === "tudo" && /(quant[oa]s?|total|soma|media|lucro|margem|custo|calcul|percent|%|mais (caro|barato|km|rodou)|menos)/.test(pergSA)) _esforco = "low"; // v36
    const avisoCorrecao = corrigiu ? [
      {
        role: "system",
        content: "ATENCAO: a pessoa acabou de dizer que a sua resposta anterior NAO e o que ela queria. PARE E PENSE DE NOVO antes de responder: releia a pergunta anterior dela e a sua resposta, descubra o que voce entendeu errado (o assunto, o periodo, a placa, a pessoa, ou se ela queria outra coisa), consulte de novo as ferramentas se for dado e responda DE OUTRO JEITO, ja corrigido. Nao repita a mesma resposta, nao se justifique e nao peca desculpas longas (no maximo 'Entendi, corrigindo:'). Se mesmo assim nao der para saber o que ela quer, pergunte em UMA frase curta o que ela quis dizer."
      }
    ] : [];
    const avisoCaixas = appUser ? [
      {
        role: "system",
        content: "TELA DO RAVI (app): no FIM da sua resposta final, numa linha separada, escreva exatamente [[CAIXAS: x, y]] com 1 a 3 caixas do ASSUNTO DA PERGUNTA da pessoa (a caixa daquela pergunta; se a informacao veio de outra area, ela pode entrar em seguida). Escolha so entre: " + CAIXAS_TXT + ". Use o nome em minusculas sem acento. Essa linha e para a tela acender a caixa certa: nao e falada nem mostrada."
      }
    ] : []; // v43
    const messages = [
      {
        role: "system",
        content: system
      },
      ...historico,
      ...avisoCorrecao,
      ...avisoCaixas,
      {
        role: "user",
        content: (b.grupo ? nomeQuem + ": " : "") + pergunta
      }
    ];
    // v6: ate 6 rodadas de consulta as ferramentas (so nivel "tudo"; motorista continua so com os dados dele)
    _estiloFalado = estiloFalado;
    _pergOriginal = pergunta;
    _cfgAtual = cfg;
    _ehMaster = ehMaster;
    _arquivos = []; // v16 · v17 · v29
    _pedidoPor = nomeQuem;
    _chatAtual = teste ? "teste-contexto" : chat;
    _podeCriar = podeCriar;
    _motorista = nivel === "motorista" ? pessoa : null; // v12
    const ferrBase = semValores ? FERRAMENTAS.filter((t)=>![
        "contas_a_pagar",
        "compras"
      ].includes(t.function.name)) : FERRAMENTAS; // v10
    const tools = nivel === "tudo" ? [
      ...ferrBase,
      FERRAMENTA_MOTIVO,
      FERRAMENTA_INTERNET,
      FERRAMENTA_LEMBRAR,
      FERRAMENTA_ESQUECER,
      FERRAMENTA_DESVIO,
      FERRAMENTA_COMPRA,
      ...FERRAMENTAS_DOC_CAMINHAO,
      FERRAMENTA_PORTFOLIO,
      ...FERRAMENTAS_CHAMADO_EQUIPE,
      ...podeCriar ? [
        FERRAMENTA_CRIAR,
        FERRAMENTA_ABAST_EQUIPE,
        FERRAMENTA_FIM_EQUIPE,
        FERRAMENTA_ENVIAR,
        ...FERRAMENTAS_ESCRITORIO,
        ...FERRAMENTAS_TAREFA,
        FERRAMENTA_CONSUMO,
        FERRAMENTA_PEDIR_CLAUDE,
        FERRAMENTA_PEDIDOS_CLAUDE
      ] : [],
      ...ehMaster ? FERRAMENTAS_DOCS : [],
      ...FERRAMENTAS_V42
    ] : [
      ...FERRAMENTAS_MOTORISTA,
      ...FERRAMENTAS_CHAMADO_MOTORISTA
    ]; // v15: pesquisar_internet · v25: chamados   // v11: registrar_motivo · v12: motorista inicia/finaliza/abastece pela foto
    let modelo = MODELO_PRINCIPAL, resp = "";
    const usadas = [], setoresUsados = []; // v42
    for(let rodada = 0; rodada < 7; rodada++){
      const ferr = rodada < 6 ? tools : undefined;
      let r = await chamarOpenAI(modelo, messages, ferr);
      if (!r.ok && modelo !== MODELO_RESERVA) {
        modelo = MODELO_RESERVA;
        r = await chamarOpenAI(modelo, messages, ferr);
      }
      if (!r.ok) return (appUser ? jsonApp : json)({
        responder: true,
        texto: "Desculpe, tive um problema para pensar agora. Tente de novo em alguns minutos."
      });
      const j = await r.json();
      marca("ia" + rodada + "(" + (j?.usage?.prompt_tokens || 0) + "/" + (j?.usage?.prompt_tokens_details?.cached_tokens || 0) + ")");
      const msg = j?.choices?.[0]?.message || {};
      if (msg.tool_calls && msg.tool_calls.length) {
        messages.push({
          role: "assistant",
          content: msg.content || null,
          tool_calls: msg.tool_calls
        });
        for (const tc of msg.tool_calls){
          let saida;
          const setorF = SETOR_DA_FERRAMENTA[String(tc.function?.name || "")] || ""; // v42: acende a caixa na tela do Ravi
          if (setorF && !setoresUsados.includes(setorF)) setoresUsados.push(setorF);
          if (appUser && b.req_id && setorF) {
            try {
              await sb.from("ravi_progresso").insert({
                req_id: String(b.req_id).slice(0, 60),
                uid: appUser.id,
                ferramenta: tc.function?.name,
                setor: setorF
              });
            } catch (_) {}
          }
          try {
            const args = JSON.parse(tc.function?.arguments || "{}");
            usadas.push(tc.function?.name + JSON.stringify(args));
            saida = await executarFerramenta(tc.function?.name, args);
          } catch (e) {
            saida = {
              erro: String(e.message || e).slice(0, 200)
            };
          }
          marca(String(tc.function?.name));
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(saida).slice(0, 60000)
          });
        }
        // v16: pergunta so de internet -> a resposta da pesquisa ja e a resposta (sem a 2a pensada)
        if (msg.tool_calls.length === 1 && msg.tool_calls[0].function?.name === "pesquisar_internet") {
          const ult = JSON.parse(String(messages[messages.length - 1].content || "{}") || "{}");
          if (ult && ult.resultado) {
            resp = semLinks(ult.resultado);
            marca("direto-" + ult.via);
            break;
          }
        }
        continue;
      }
      resp = String(msg.content || "").trim();
      if (pareceRascunho(resp)) {
        marca("rascunho");
        const r2 = await chamarOpenAI(modelo, [
          ...messages,
          {
            role: "system",
            content: "Sua ultima saida foi um rascunho interno e NAO foi enviado. Escreva agora SOMENTE a mensagem final para a pessoa, em portugues do Brasil, curta e direta, sem explicar seu raciocinio e sem falar de ferramentas."
          }
        ]);
        let r2t = "";
        if (r2.ok) {
          const j2 = await r2.json();
          r2t = String(j2?.choices?.[0]?.message?.content || "").trim();
        }
        resp = r2t && !pareceRascunho(r2t) ? r2t : "Desculpe, não consegui concluir agora. Pode repetir o pedido em uma frase?";
      }
      break;
    }
    let caixasPergunta = [];
    {
      const cx = caixasDaResposta(resp);
      resp = cx.texto;
      caixasPergunta = cx.caixas;
    }
    if (!resp) resp = "Não consegui responder agora. Pode repetir a pergunta?";
    // v29: arquivo gerado nesta resposta -- link exato fora do texto do modelo (ele erra ao copiar link assinado)
    const arquivos = _arquivos.map((x)=>({
        nome: x.nome,
        url: x.url
      }));
    if (arquivos.length) {
      resp = trocarArq(resp, "tirar").replace(/\(?https?:\/\/\S*supabase\.co\/storage\S*\)?/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/:\s*$/, ".").trim();
      if (appUser && !b.arquivos_ok) resp += "\n\n" + arquivos.map((x)=>"📄 " + x.nome + ":\n" + x.url).join("\n\n"); // app antigo: link exato no texto
      else if (!appUser) {
        const falhou = [];
        for (const x of _arquivos){
          const ok = !teste && await mandarArquivoWA(chat, x);
          if (!ok) falhou.push(x);
          else x.enviado = true;
        }
        if (falhou.length) resp += "\n\n" + falhou.map((x)=>"📄 " + x.nome + ":\n" + x.url).join("\n\n");
        else resp += "\n\n📎 " + (_arquivos.length > 1 ? _arquivos.length + " arquivos enviados aqui na conversa." : "Arquivo enviado aqui na conversa.");
      }
    } else resp = trocarArq(resp, "url");
    resp = resp.replace(/\*\*(.+?)\*\*/g, "*$1*").replace(/^#+\s*/gm, "");
    const ass = String(cfg.assinatura || "").trim();
    const final = ass && !resp.includes(ass) ? resp + "\n\n" + ass : resp; // v2: assinatura da Torre
    if (!teste) await sb.from("ravi_conversas").insert([
      {
        chat,
        quem: nomeQuem,
        papel: "pessoa",
        texto: (porVoz ? "(audio) " : "") + pergunta.slice(0, 2000)
      },
      {
        chat,
        quem: "Ravi",
        papel: "ravi",
        texto: (emAudio ? "(audio) " : "") + resp.slice(0, 4000)
      }
    ]);
    let audio_b64 = "";
    if (emAudio && (!arquivos.length || !appUser && _arquivos.every((x)=>x.enviado))) {
      try {
        audio_b64 = await falar(resp);
      } catch (_) {
        audio_b64 = "";
      }
    } // v7/v14: falhou a voz -> vai o texto · v29: com arquivo vai escrito (o link nao se perde)
    marca("fim");
    console.log("tempos " + tempos.join(" "));
    const setores = caixasPergunta.length ? caixasPergunta : setoresUsados.length ? setoresUsados : setoresDoTexto(pergunta + " " + resp); // v42 · v43: a caixa do assunto da pergunta manda
    if (appUser) return jsonApp({
      responder: true,
      texto: resp,
      arquivos,
      nivel,
      modelo,
      ferramentas: usadas,
      setores,
      setores_por: caixasPergunta.length ? "assunto" : setoresUsados.length ? "ferramentas" : "palavras",
      tempos
    }); // v29: arquivos   // v15: o app fala; sem assinatura
    return json({
      responder: true,
      texto: final,
      audio_b64: audio_b64 || undefined,
      transcricao: porVoz ? texto : undefined,
      nivel,
      modelo,
      leitura,
      ferramentas: usadas,
      tempos
    });
  } catch (e) {
    return json({
      responder: false,
      erro: String(e.message || e).slice(0, 300)
    }, 200);
  }
});
