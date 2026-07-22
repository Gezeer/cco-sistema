(function () {
  "use strict";

  const COLUNAS_OPERACOES = Object.freeze([
    "importacao_id", "rd", "servico", "tipo_servico", "data_operacao"
  ]);
  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const PAGE_SIZE = 1000;
  const cache = new Map();
  const CACHE_TTL = 5 * 60 * 1000;
  const phase2Caches = Object.freeze({ previsao:new Map(), rankings:new Map(), alertas:new Map(), mapa:new Map() });
  const charts = {};
  let catalogoPeriodos = [];
  const importacoesPorPeriodo = new Map();
  let analyticsRequestId = 0;
  let analyticsAgent = null;
  let debounceTimer = 0;

  const $ = id => document.getElementById(id);
  const texto = value => String(value ?? "").trim();
  const normalizarServico = value => window.CCOMetricas.normalizarServico(value);
  const formatarNumero = (value, casas = 1) => Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: casas });
  const semDados = () => "Não há dados suficientes para esta análise no período selecionado.";

  function normalizarNumero(valor) {
    if (window.CCOMetricas) return window.CCOMetricas.normalizarNumero(valor);
    if (valor === null || valor === undefined || valor === "") return 0;
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
    let valorTexto = String(valor).trim();
    if (!valorTexto) return 0;
    valorTexto = valorTexto.replace(/\s/g, "").replace(/R\$/gi, "").replace(/%/g, "");
    if (valorTexto.includes(",") && valorTexto.includes(".")) valorTexto = valorTexto.replace(/\./g, "").replace(",", ".");
    else if (valorTexto.includes(",")) valorTexto = valorTexto.replace(",", ".");
    const numero = Number(valorTexto);
    return Number.isFinite(numero) ? numero : 0;
  }

  function obterIntervaloMes(ano, mes) {
    const mesTexto = String(mes).padStart(2, "0");
    const inicio = `${ano}-${mesTexto}-01`;
    const proximoMes = new Date(Date.UTC(ano, mes, 1));
    const fimExclusivo = proximoMes.toISOString().slice(0, 10);
    return { inicio, fimExclusivo };
  }

  function obterMesAnterior(ano, mes) {
    const data = new Date(Date.UTC(Number(ano), Number(mes) - 2, 1));
    return { ano: data.getUTCFullYear(), mes: data.getUTCMonth() + 1 };
  }

  function mediaValida(registros, campo = "velocidade_media") {
    const valores = registros.map(item => normalizarNumero(item[campo])).filter(valor => valor > 0);
    return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
  }

  function somar(registros, campo) { return registros.reduce((total, item) => total + normalizarNumero(item[campo]), 0); }

  function agrupar(registros, campo) {
    const grupos = new Map();
    registros.forEach(item => {
      const chave = texto(typeof campo === "function" ? campo(item) : item[campo]) || "Não informado";
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(item);
    });
    return grupos;
  }

  function calcularAcumuladoPadrao(servico, registros) {
    const codigo = normalizarServico(servico);
    if (["P5", "P6"].includes(codigo)) return somar(registros, "km_total");
    if (["P2.1", "P2.2"].includes(codigo)) return somar(registros, "viagens");
    if (["P3", "P7", "P8", "P9", "P10", "P11"].includes(codigo)) return somar(registros, "equipe") || somar(registros, "executado");
    return somar(registros, "peso_t") || somar(registros, "executado") || somar(registros, "viagens") || somar(registros, "km_total");
  }

  function calcularAcumuladoServico(servico, registros) {
    return window.CCOMetricas.calcularAcumuladoServico(servico, registros);
  }

  function totalExecutado(registros) {
    const grupos = agrupar(registros, "servico");
    return [...grupos].reduce((total, [servico, linhas]) => total + calcularAcumuladoServico(servico, linhas), 0);
  }

  function calcularProdutividade(registros) {
    const equipe = window.CCOMetricas.calcularQuantidadeEquipesMensal(registros);
    if (equipe <= 0) return { valor: 0, metrica: "Sem quantidade de equipe" };
    const prioridades = [["executado", "Executado/equipe"], ["km_total", "KM/equipe"], ["peso_t", "Peso/equipe"], ["viagens", "Viagens/equipe"]];
    for (const [campo, rotulo] of prioridades) {
      const total = somar(registros, campo);
      if (total > 0) return { valor: total / equipe, metrica: rotulo };
    }
    return { valor: 0, metrica: "Sem métrica operacional" };
  }

  function normalizarRegistros(registros) {
    return registros.map(item => ({
      ...item, servico: normalizarServico(item.servico) || "Não informado", ra: texto(item.ra) || "Não informada",
      turno: texto(item.turno) || "Não informado", data_operacao: texto(item.data_operacao).slice(0, 10),
      velocidade_media: normalizarNumero(item.velocidade_media), executado: normalizarNumero(item.executado),
      km_total: normalizarNumero(item.km_total), peso_t: normalizarNumero(item.peso_t), viagens: normalizarNumero(item.viagens),
      equipe: normalizarNumero(item.equipe)
    }));
  }

  async function buscarPaginado(config) {
    return normalizarRegistros(await window.CCOMetricas.carregarOperacoesResiliente({...config,tamanhoPagina:PAGE_SIZE}));
  }

  async function buscarMetas(importacaoId) {
    if(!importacaoId)return{};
    const data=await window.CCOPainelService.porImportacao(importacaoId);
    return Object.fromEntries(data.map(item => [normalizarServico(item.servico), item]));
  }

  async function carregarCatalogo() {
    const supabase = window.supabaseClient;
    const encontrados = new Set();
    const data = await window.CCOPainelService.catalogo();
    data.forEach(item=>{const periodo=`${item.ano}-${String(item.mes).padStart(2,"0")}`;encontrados.add(periodo);importacoesPorPeriodo.set(periodo,item);});
    catalogoPeriodos = [...encontrados].sort().reverse();
    const maisRecente=catalogoPeriodos[0]||"";
    preencherAnos(maisRecente.slice(0,4),Number(maisRecente.slice(5))||undefined);
  }

  function preencherAnos(preferido,mesPreferido) {
    const atual = new Date();
    const anos = [...new Set(catalogoPeriodos.map(p => p.slice(0, 4)).concat(["2025", "2026"]))].sort().reverse();
    const ano = preferido || (anos.includes(String(atual.getFullYear())) ? String(atual.getFullYear()) : anos[0]);
    $("analyticsAno").innerHTML = anos.map(valor => `<option value="${valor}">${valor}</option>`).join("");
    $("analyticsAno").value = ano;
    preencherMeses(mesPreferido);
  }

  function preencherMeses(preferido) {
    const ano = $("analyticsAno").value;
    const mesesReais = catalogoPeriodos.filter(p => p.startsWith(`${ano}-`)).map(p => Number(p.slice(5)));
    const atual = new Date();
    const padrao = preferido || (Number(ano) === atual.getFullYear() ? atual.getMonth() + 1 : mesesReais[0] || 1);
    $("analyticsMes").innerHTML = MESES.map((nome, i) => `<option value="${i + 1}">${nome}${mesesReais.includes(i + 1) ? " •" : ""}</option>`).join("");
    $("analyticsMes").value = String(padrao);
  }

  function filtrosAtuais() { return { ano: Number($("analyticsAno").value), mes: Number($("analyticsMes").value), servico: $("analyticsServico").value, ra: $("analyticsRA").value, turno: $("analyticsTurno").value }; }
  function chaveCache(f, tipo="periodo") { return `${f.ano}-${f.mes}-${f.servico}-${f.ra}-${f.turno}-${f.equipe||""}-${tipo}`; }
  function cacheGet(chave){const item=cache.get(chave);if(!item)return null;if(Date.now()-item.criadoEm>CACHE_TTL){cache.delete(chave);return null;}return item.valor;}
  function cacheSet(chave,valor){cache.set(chave,{valor,criadoEm:Date.now()});return valor;}
  function preencherSelect(id, valores, label, selecionado) {
    const el = $(id); const lista = [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
    el.innerHTML = `<option value="">${label}</option>` + lista.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
    if (lista.includes(selecionado)) el.value = selecionado;
  }
  function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

  function atualizarCatalogosFiltros(registros, filtros) {
    preencherSelect("analyticsServico", registros.map(x => x.servico), "Todos", filtros.servico);
    preencherSelect("analyticsRA", registros.map(x => x.ra), "Todas", filtros.ra);
    preencherSelect("analyticsTurno", registros.map(x => x.turno), "Todos", filtros.turno);
  }

  function variacao(atual, anterior) { return anterior > 0 ? ((atual - anterior) / anterior) * 100 : null; }
  function rotuloVariacao(valor) { if (valor === null) return "Sem base anterior"; if (Math.abs(valor) < 0.5) return "Estável"; return `${valor > 0 ? "Aumento" : "Queda"} de ${formatarNumero(Math.abs(valor))}%`; }

  function metricas(registros, anteriores, contexto) {
    const velocidade = mediaValida(registros), executado = totalExecutado(registros), produtividade = calcularProdutividade(registros);
    const gruposRA = [...agrupar(registros, "ra")].map(([nome, linhas]) => ({ nome, valor: mediaValida(linhas), linhas })).filter(x => x.valor > 0).sort((a, b) => b.valor - a.valor);
    const gruposServico = [...agrupar(registros, "servico")].map(([nome, linhas]) => ({ nome, valor: mediaValida(linhas), acumulado: calcularAcumuladoServico(nome, linhas), linhas })).filter(x => x.valor > 0).sort((a, b) => b.valor - a.valor);
    const velocidadeAnterior = mediaValida(anteriores), executadoAnterior = totalExecutado(anteriores), produtividadeAnterior = calcularProdutividade(anteriores).valor;
    return { velocidade, executado, produtividade, gruposRA, gruposServico, variacoes: { velocidade: variacao(velocidade, velocidadeAnterior), executado: variacao(executado, executadoAnterior), produtividade: variacao(produtividade.valor, produtividadeAnterior), meta: null }, contexto };
  }

  class CCOAnalyticsDashboardAgent {
    constructor(registros, contexto) { this.registros = registros; this.contexto = contexto; this.metricas = contexto.metricas; }
    analisarVelocidadeMedia() { return { media: mediaValida(this.registros), porServico: this.metricas.gruposServico }; }
    analisarServicos() { return this.metricas.gruposServico; }
    analisarRAs() { return this.metricas.gruposRA; }
    analisarTurnos() { return [...agrupar(this.registros, "turno")].map(([nome, linhas]) => ({ nome, velocidade: mediaValida(linhas), produtividade: calcularProdutividade(linhas).valor })).sort((a, b) => b.velocidade - a.velocidade); }
    analisarEquipes() { return [...agrupar(this.registros, item => texto(item.equipe) || "Não informada")].map(([nome, linhas]) => ({ nome, ...calcularProdutividade(linhas) })).filter(x => x.valor > 0).sort((a, b) => b.valor - a.valor); }
    analisarMetas() { const metas=this.contexto.metas||{}; const itens=[...agrupar(this.registros,"servico")].map(([servico,linhas])=>window.CCOMetricas.consolidarServico({servico,registros:linhas,previstoMensal:metas[servico]?.previsto,diasOperacaoMes:this.contexto.diasOperacaoMes||metas[servico]?.total_dias_mes})).map(x=>({servico:x.servico,previsto:x.previstoMensal,previstoAcumulado:x.previstoAcumulado,executado:x.acumuladoReal,percentual:x.percentualCumprimento,avisos:x.avisos})).filter(x=>x.previsto>0); return { disponivel:itens.length>0, itens }; }
    projetarFechamentoMes() {
      if (!this.registros.length) return null;
      const { ano, mes } = this.contexto.filtros, hoje = new Date(), totalDias = window.CCO_REGRAS.obterDiasOperacao(ano, mes);
      const fechado = ano < hoje.getFullYear() || (ano === hoje.getFullYear() && mes < hoje.getMonth() + 1);
      if (fechado) return { valor: this.metricas.executado, real: true };
      const dias = [...new Set(this.registros.map(x => x.data_operacao).filter(Boolean))].length;
      return dias > 0 && totalDias > 0 ? { valor: this.metricas.executado / dias * totalDias, real: false, dias } : null;
    }
    gerarInsights() {
      const itens = [], melhorS = this.metricas.gruposServico[0], piorS = this.metricas.gruposServico.at(-1), melhorRA = this.metricas.gruposRA[0], piorRA = this.metricas.gruposRA.at(-1), turnos = this.analisarTurnos(), projecao = this.projetarFechamentoMes();
      if (melhorS) itens.push(`Maior velocidade média: ${melhorS.nome}, com ${formatarNumero(melhorS.valor)} km/h.`);
      if (piorS) itens.push(`Menor velocidade média: ${piorS.nome}, com ${formatarNumero(piorS.valor)} km/h.`);
      if (melhorRA) itens.push(`Melhor RA: ${melhorRA.nome}, com ${formatarNumero(melhorRA.valor)} km/h.`);
      if (piorRA) itens.push(`Pior RA: ${piorRA.nome}, com ${formatarNumero(piorRA.valor)} km/h.`);
      if (turnos[0]?.velocidade) itens.push(`Melhor turno: ${turnos[0].nome}, com ${formatarNumero(turnos[0].velocidade)} km/h.`);
      if (turnos.at(-1)?.velocidade) itens.push(`Turno com menor velocidade: ${turnos.at(-1).nome}, com ${formatarNumero(turnos.at(-1).velocidade)} km/h.`);
      const metas=this.analisarMetas(); if(metas.disponivel){const abaixo=metas.itens.filter(x=>x.percentual<100).sort((a,b)=>a.percentual-b.percentual),acima=metas.itens.filter(x=>x.percentual>=100).sort((a,b)=>b.percentual-a.percentual);itens.push(abaixo.length?`Serviço abaixo da meta: ${abaixo[0].servico}, com ${formatarNumero(abaixo[0].percentual)}%.`:"Nenhum serviço com meta disponível está abaixo de 100%.");if(acima[0])itens.push(`Serviço acima da meta: ${acima[0].servico}, com ${formatarNumero(acima[0].percentual)}%.`);}else itens.push("Metas indisponíveis para o período selecionado.");
      if (this.metricas.variacoes.velocidade !== null) itens.push(`${rotuloVariacao(this.metricas.variacoes.velocidade)} na velocidade média em relação ao mês anterior.`);
      if (projecao) itens.push(projecao.real ? `Período fechado: resultado real de ${formatarNumero(projecao.valor)}.` : `Projeção simples de fechamento: ${formatarNumero(projecao.valor)}, baseada em ${projecao.dias} dia(s) com dados.`);
      const anomalias = detectarAnomalias(this.registros); if (anomalias.length) itens.push(`${anomalias.length} dia(s) apresentaram comportamento fora do padrão de velocidade.`);
      return itens;
    }
    responder(pergunta) {
      const p = texto(pergunta).toLowerCase(), media = this.metricas.velocidade;
      if (!this.registros.length) return semDados();
      const servicoPerguntado = (p.match(/\bp\s?\d+(?:[.,]\d+)?\b/i) || [])[0]?.replace(/\s/g, "").replace(",", ".").toUpperCase();
      if (servicoPerguntado) {
        const linhas = this.registros.filter(x => x.servico === servicoPerguntado); if (!linhas.length) return semDados();
        const acumulado = calcularAcumuladoServico(servicoPerguntado, linhas), velocidade = mediaValida(linhas);
        if (p.includes("meta") || p.includes("ating")) { const meta=this.contexto.metas?.[servicoPerguntado]||{},c=window.CCOMetricas.consolidarServico({servico:servicoPerguntado,registros:linhas,previstoMensal:meta.previsto,diasOperacaoMes:this.contexto.diasOperacaoMes||meta.total_dias_mes}); return c.percentualCumprimento==null?`O ${servicoPerguntado} possui ${formatarNumero(c.acumuladoReal)} executados no período. O previsto mensal está indisponível para este serviço.`:`O ${servicoPerguntado} acumulou ${formatarNumero(c.acumuladoReal)}; previsto mensal ${formatarNumero(c.previstoMensal)}, previsto até os ${c.diasExecutados} dias executados ${formatarNumero(c.previstoAcumulado)}, cumprimento ${formatarNumero(c.percentualCumprimento)}%.`; }
        return `O ${servicoPerguntado} possui ${formatarNumero(acumulado)} executados no período${servicoPerguntado === "P12" ? ", calculados pela soma da coluna executado" : ""}. Sua velocidade média é ${velocidade ? `${formatarNumero(velocidade)} km/h` : "indisponível"}.`;
      }
      if (p.includes("serviço") && (p.includes("maior") || p.includes("melhor")) && p.includes("velocidade")) {
        const item = this.metricas.gruposServico[0]; if (!item) return semDados(); const dif = media ? (item.valor / media - 1) * 100 : 0;
        return `No período selecionado, o serviço ${item.nome} apresentou a maior velocidade média, com ${formatarNumero(item.valor)} km/h, ficando ${formatarNumero(Math.abs(dif))}% ${dif >= 0 ? "acima" : "abaixo"} da média geral.`;
      }
      if (p.includes("ra") && (p.includes("pior") || p.includes("menor"))) {
        const item = this.metricas.gruposRA.at(-1); if (!item) return semDados(); const dif = media ? (1 - item.valor / media) * 100 : 0;
        return `A RA com menor desempenho foi ${item.nome}, com velocidade média de ${formatarNumero(item.valor)} km/h, ${formatarNumero(Math.abs(dif))}% ${dif >= 0 ? "abaixo" : "acima"} da média do período.`;
      }
      if (p.includes("turno") && (p.includes("produt") || p.includes("melhor"))) { const item = this.analisarTurnos().sort((a,b)=>b.produtividade-a.produtividade)[0]; return item?.produtividade ? `O turno mais produtivo foi ${item.nome}, com índice de ${formatarNumero(item.produtividade)} por equipe.` : semDados(); }
      if (p.includes("compare") || p.includes("mês anterior") || p.includes("mes anterior")) return `Comparação com o mês anterior: velocidade ${rotuloVariacao(this.metricas.variacoes.velocidade).toLowerCase()}, execução ${rotuloVariacao(this.metricas.variacoes.executado).toLowerCase()} e produtividade ${rotuloVariacao(this.metricas.variacoes.produtividade).toLowerCase()}.`;
      if (p.includes("proje") || p.includes("fechamento")) { const x = this.projetarFechamentoMes(); return x ? (x.real ? `O mês está fechado; o resultado real é ${formatarNumero(x.valor)}.` : `A projeção simples de fechamento é ${formatarNumero(x.valor)}, usando ${x.dias} dia(s) com dados.`) : semDados(); }
      return "Posso analisar velocidade por serviço, desempenho por RA, produtividade por turno, um serviço P1 a P12, projeção e comparação com o mês anterior.";
    }
  }

  function detectarAnomalias(registros) {
    const dias = [...agrupar(registros, "data_operacao")].map(([dia, linhas]) => ({ dia, valor: mediaValida(linhas) })).filter(x => x.valor > 0);
    if (dias.length < 3) return [];
    const media = dias.reduce((s, x) => s + x.valor, 0) / dias.length, desvio = Math.sqrt(dias.reduce((s, x) => s + (x.valor - media) ** 2, 0) / dias.length);
    return dias.filter(x => x.valor < media - 2 * desvio || x.valor > media + 2 * desvio);
  }

  function setCard(id, valor, subId, subtitulo) { $(id).textContent = valor; if (subId && subtitulo) $(subId).textContent = subtitulo; }
  function atualizarCards(m) {
    setCard("cardVelocidade", m.velocidade ? `${formatarNumero(m.velocidade)} km/h` : "—", "subVelocidade", rotuloVariacao(m.variacoes.velocidade));
    const valorVelocidade = Math.max(0, Number(m.velocidade) || 0);
    const velocidadesValidas = (m.contexto?.registros || []).map(item => normalizarNumero(item.velocidade_media)).filter(valor => valor > 0);
    const limiteVelocidade = Math.max(...velocidadesValidas, valorVelocidade, 1);
    const progressoVelocidade = Math.min(1, valorVelocidade / limiteVelocidade);
    const cardVelocidade = $("cardVelocidade")?.closest(".analytics-card");
    if (cardVelocidade) {
      cardVelocidade.classList.add("speedometer-card");
      let velocimetro = cardVelocidade.querySelector(".cco-speedometer");
      if (!velocimetro) {
        velocimetro = document.createElement("div");
        velocimetro.className = "cco-speedometer";
        velocimetro.innerHTML = '<div class="cco-speedometer-track"><i></i><b></b></div><span>0</span><span data-speed-max>—</span>';
        cardVelocidade.prepend(velocimetro);
      }
      velocimetro.style.setProperty("--speed-angle", `${(-180 + progressoVelocidade * 180).toFixed(1)}deg`);
      velocimetro.style.setProperty("--speed-fill", `${(progressoVelocidade * 50).toFixed(2)}%`);
      velocimetro.querySelector("[data-speed-max]").textContent = formatarNumero(limiteVelocidade, 1);
      velocimetro.setAttribute("role", "meter");
      velocimetro.setAttribute("aria-label", "Velocidade média do período");
      velocimetro.setAttribute("aria-valuemin", "0");
      velocimetro.setAttribute("aria-valuemax", String(limiteVelocidade));
      velocimetro.setAttribute("aria-valuenow", String(valorVelocidade));
    }
    setCard("cardExecutado", formatarNumero(m.executado), "subExecutado", rotuloVariacao(m.variacoes.executado));
    setCard("cardProdutividade", m.produtividade.valor ? formatarNumero(m.produtividade.valor) : "—", "subProdutividade", m.produtividade.metrica);
    setCard("cardMeta", m.percentualMeta == null ? "—" : `${formatarNumero(m.percentualMeta)}%`, "subMeta", m.previstoTotal ? `Mensal: ${formatarNumero(m.previstoTotal)} • até os dias executados: ${formatarNumero(m.previstoAcumuladoTotal)}` : "Previsto indisponível");
    setCard("cardMelhorRA", m.gruposRA[0]?.nome || "—", "subMelhorRA", m.gruposRA[0] ? `${formatarNumero(m.gruposRA[0].valor)} km/h` : "Sem velocidade válida");
    setCard("cardRisco", m.gruposServico.at(-1)?.nome || "—", "subRisco", "Menor velocidade média");
    const turnos = [...agrupar(m.contexto.registros || [], "turno")].map(([nome,linhas])=>({nome,valor:mediaValida(linhas)})).sort((a,b)=>b.valor-a.valor);
    setCard("cardTendencia", turnos[0]?.nome || "—", "subTendencia", turnos[0]?.valor ? `${formatarNumero(turnos[0].valor)} km/h` : "Sem velocidade válida");
    const projecao = m.contexto.projecao; setCard("cardRegistros", projecao ? formatarNumero(projecao.valor) : "—", "subRegistros", projecao?.real ? "Resultado real do mês fechado" : projecao ? `Base: ${projecao.dias} dia(s)` : "Sem base suficiente");
  }

  function estilizarDatasets(tipo, datasets) {
    return datasets.map(dataset => {
      const visual = { ...dataset };
      if (tipo === "bar") {
        visual.borderRadius = visual.borderRadius ?? 8;
        visual.borderSkipped = false;
        visual.borderWidth = 1;
        visual.borderColor = visual.borderColor || "rgba(74,222,128,.42)";
        if (!Array.isArray(visual.backgroundColor)) {
          visual.backgroundColor = contexto => {
            const area = contexto.chart.chartArea;
            if (!area) return "#0b6e4f";
            const horizontal = contexto.chart.options.indexAxis === "y";
            const gradiente = horizontal
              ? contexto.chart.ctx.createLinearGradient(area.left, 0, area.right, 0)
              : contexto.chart.ctx.createLinearGradient(0, area.bottom, 0, area.top);
            gradiente.addColorStop(0, "rgba(6,78,59,.96)");
            gradiente.addColorStop(.58, "rgba(11,110,79,.92)");
            gradiente.addColorStop(1, "rgba(34,211,238,.82)");
            return gradiente;
          };
        }
      }
      if (tipo === "line") {
        visual.tension = visual.tension ?? .35;
        visual.borderWidth = visual.borderWidth ?? 2.5;
        visual.pointRadius = visual.pointRadius ?? 2;
        visual.pointHoverRadius = visual.pointHoverRadius ?? 5;
        visual.pointBackgroundColor = "#22d3ee";
        visual.pointBorderColor = "#061712";
        if (visual.fill) visual.backgroundColor = contexto => {
          const area = contexto.chart.chartArea;
          if (!area) return "rgba(34,211,238,.14)";
          const gradiente = contexto.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
          gradiente.addColorStop(0, "rgba(34,211,238,.28)");
          gradiente.addColorStop(1, "rgba(11,110,79,.025)");
          return gradiente;
        };
      }
      return visual;
    });
  }

  function criarGrafico(nome, tipo, labels, datasets, options = {}) {
    const canvas = $(nome);
    if (!canvas || !window.Chart) {
      console.error("[CCO][CHART] Inicialização indisponível", { nome, canvas, chartDisponivel: typeof window.Chart !== "undefined" });
      return null;
    }
    try {
      const existente = window.Chart.getChart?.(canvas) || charts[nome];
      if (existente) existente.destroy();
      const movimentoReduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      charts[nome] = new Chart(canvas, { type: tipo, data: { labels, datasets: estilizarDatasets(tipo, datasets) }, options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: "index" }, animation: { duration: movimentoReduzido ? 0 : 900, easing: "easeOutQuart", delay: contexto => movimentoReduzido || contexto.type !== "data" ? 0 : contexto.dataIndex * 45 }, plugins: { legend: { position: "bottom", labels: { color: "#d1fae5", usePointStyle: true } }, tooltip: { backgroundColor: "#04100d", borderColor: "#22c55e", borderWidth: 1, titleColor: "#f0fdf4", bodyColor: "#d1fae5" } }, scales: tipo === "doughnut" ? undefined : { y: { beginAtZero: true, grid: { color: "rgba(167,243,208,.08)" }, ticks: { color: "#d1fae5" } }, x: { grid: { display: false }, ticks: { color: "#d1fae5" } } }, ...options } });
      return charts[nome];
    } catch (erro) {
      console.error("[CCO][CHART] Falha ao renderizar gráfico", { nome, erro, mensagem: erro?.message, canvasConectado: canvas.isConnected, largura: canvas.clientWidth, altura: canvas.clientHeight });
      return null;
    }
  }

  function renderGraficos(registros, anteriores, m, filtros) {
    Object.keys(charts).forEach(nome => {
      try { charts[nome]?.destroy(); } catch (erro) {}
      delete charts[nome];
    });
  }

  function renderInsights() { $("analyticsInsights").innerHTML = analyticsAgent.gerarInsights().map((x,i)=>`<div class="insight ${i===6?"alert":""}">${escapeHtml(x)}</div>`).join(""); }
  function mostrarEstado(tipo, mensagem) { const el=$("analyticsStatus"),badge=$("analyticsSyncBadge"),dashboard=$("analyticsDashboard"); el.className=`analytics-status visible ${tipo||""}`; el.textContent=mensagem; if(dashboard)dashboard.hidden=tipo!=="error"; if(badge){badge.className=`sync-badge ${tipo||""}`;badge.textContent=tipo==="error"?"Dados parciais":"Carregando dados";} }
  function ocultarEstado() { $("analyticsStatus").className="analytics-status"; $("analyticsDashboard").hidden=false; const badge=$("analyticsSyncBadge");if(badge){badge.className="sync-badge";badge.textContent="Dados sincronizados";} }

  async function carregarDadosAnalytics() {
    const requestId = ++analyticsRequestId, filtros = filtrosAtuais(), intervalo = obterIntervaloMes(filtros.ano, filtros.mes), anterior = obterMesAnterior(filtros.ano, filtros.mes), intervaloAnterior = obterIntervaloMes(anterior.ano, anterior.mes);
    $("periodoSelecionado").textContent = `${MESES[filtros.mes - 1]} de ${filtros.ano}`; mostrarEstado("loading", "Carregando dados do período...");
    try {
      const chave = chaveCache(filtros,"periodo"), chaveAnterior = chaveCache({...filtros,ano:anterior.ano,mes:anterior.mes},"mes-anterior");
      const atualImportacao=importacoesPorPeriodo.get(`${filtros.ano}-${String(filtros.mes).padStart(2,"0")}`);
      const anteriorImportacao=importacoesPorPeriodo.get(`${anterior.ano}-${String(anterior.mes).padStart(2,"0")}`);
      if(!atualImportacao)throw new Error("Período selecionado não possui importação ativa.");
      const filtrosBanco={servico:filtros.servico,ra:filtros.ra,turno:filtros.turno};
      const chaveMetas=`metas-${filtros.ano}-${filtros.mes}`, chaveMetasAnt=`metas-${anterior.ano}-${anterior.mes}`;
      const resultados = await Promise.allSettled([window.CCOAnalyticsService.periodo(atualImportacao.importacao_id,filtrosBanco),anteriorImportacao?window.CCOAnalyticsService.periodo(anteriorImportacao.importacao_id,filtrosBanco):Promise.resolve([]),cacheGet(chaveMetas)??buscarMetas(atualImportacao.importacao_id),cacheGet(chaveMetasAnt)??buscarMetas(anteriorImportacao?.importacao_id),window.CCOMetricas.obterDiasOperacaoOficial(filtros.ano,filtros.mes)]);
      if (resultados[0].status === "rejected") throw resultados[0].reason;
      resultados.slice(1).forEach((resultado, indice) => {
        if (resultado.status === "rejected") console.warn("[ANALYTICS AI] Métrica opcional indisponível", { indice: indice + 1, mensagem: resultado.reason?.message, code: resultado.reason?.code });
      });
      const registros = resultados[0].value;
      const anteriores = resultados[1].status === "fulfilled" ? resultados[1].value : [];
      const metasBrutas = resultados[2].status === "fulfilled" ? resultados[2].value : {};
      const metas = Object.fromEntries(Object.entries(metasBrutas).map(([servico,meta])=>[servico,{...meta,previsto:window.CCO_REGRAS.calcularPrevisto(servico,filtros.ano,filtros.mes,meta.previsto,meta.total_dias_mes),total_dias_mes:window.CCO_REGRAS.obterDiasOperacao(filtros.ano,filtros.mes)}]));
      const metasAnteriores = resultados[3].status === "fulfilled" ? resultados[3].value : {};
      const diasOperacaoMes = window.CCO_REGRAS.obterDiasOperacao(filtros.ano,filtros.mes);
      cacheSet(chave, registros); cacheSet(chaveAnterior, anteriores); if(requestId!==analyticsRequestId)return;
      cacheSet(chaveMetas,metas); cacheSet(chaveMetasAnt,metasAnteriores);
      if(!filtros.servico&&!filtros.ra&&!filtros.turno) atualizarCatalogosFiltros(registros,filtros);
      if(!registros.length){mostrarEstado("","Não foram encontrados registros para os filtros selecionados.");return;}
      const contexto={filtros,quantidade:registros.length,registros,anteriores,metas,metasAnteriores,diasOperacaoMes}, m=metricas(registros,anteriores,contexto); contexto.metricas=m;
      const servicosVisiveis=filtros.servico?[normalizarServico(filtros.servico)]:[...new Set([...Object.keys(metas),...registros.map(x=>normalizarServico(x.servico))])];
      const consolidados=servicosVisiveis.map(servico=>window.CCOMetricas.consolidarServico({servico,registros:registros.filter(x=>normalizarServico(x.servico)===servico),previstoMensal:window.CCO_REGRAS.calcularPrevisto(servico,filtros.ano,filtros.mes,metas[servico]?.previsto,metas[servico]?.total_dias_mes),diasOperacaoMes}));
      m.previstoTotal=consolidados.reduce((s,x)=>s+x.previstoMensal,0);m.previstoAcumuladoTotal=consolidados.reduce((s,x)=>s+x.previstoAcumulado,0);m.percentualMeta=window.CCOMetricas.calcularPercentualCumprimento({acumuladoReal:consolidados.reduce((s,x)=>s+x.acumuladoReal,0),previstoAcumulado:m.previstoAcumuladoTotal});m.consolidados=consolidados;
      const hoje=new Date(),fechado=filtros.ano<hoje.getFullYear()||(filtros.ano===hoje.getFullYear()&&filtros.mes<hoje.getMonth()+1),dias=new Set(registros.map(x=>x.data_operacao)).size,totalDias=window.CCO_REGRAS.obterDiasOperacao(filtros.ano,filtros.mes);contexto.projecao=dias&&totalDias?{valor:fechado?m.executado:m.executado/dias*totalDias,real:fechado,dias}:null;
      analyticsAgent=new CCOAnalyticsDashboardAgent(registros,contexto);
      atualizarCards(m); renderGraficos(registros,anteriores,m,filtros); renderInsights();
      if (window.CCOAnalyticsMap) new window.CCOAnalyticsMap("analyticsMap").mostrar(registros);
      ocultarEstado();
      window.CCO_ANALYTICS_CONTEXT={registros,contexto};window.dispatchEvent(new CustomEvent("cco:analytics-loaded",{detail:window.CCO_ANALYTICS_CONTEXT}));
    } catch(error) {
      if(requestId!==analyticsRequestId)return; console.error("[ANALYTICS AI] Falha ao carregar métricas:",{erro:error,mensagem:error?.message,code:error?.code,details:error?.details,hint:error?.hint}); mostrarEstado("error","Não foi possível atualizar os dados principais deste período. Os componentes disponíveis foram preservados.");
    }
  }

  function agendarCarga(){clearTimeout(debounceTimer);debounceTimer=setTimeout(carregarDadosAnalytics,250);}
  async function inicializar() {
    try {
      const supabase=window.supabaseClient; if(!supabase?.auth)throw new Error("Cliente Supabase não inicializado.");
      const {data,error}=await supabase.auth.getUser(); if(error||!data?.user){window.location.replace("login.html");return;}
      mostrarEstado("loading","Descobrindo períodos disponíveis…"); await carregarCatalogo();
      $("analyticsAno").addEventListener("change",()=>{preencherMeses();agendarCarga();});
      ["analyticsMes","analyticsServico","analyticsRA","analyticsTurno"].forEach(id=>$(id).addEventListener("change",agendarCarga));
      $("limparFiltros").addEventListener("click",()=>{ $("analyticsServico").value="";$("analyticsRA").value="";$("analyticsTurno").value="";agendarCarga(); });
      await carregarDadosAnalytics();
    } catch(error){console.error("Erro no CCO Analytics AI",{message:error?.message,code:error?.code,details:error?.details,hint:error?.hint});mostrarEstado("error","Não foi possível inicializar o CCO Analytics AI.");}
  }

  window.carregarDadosAnalytics=carregarDadosAnalytics;
  window.CCOAnalyticsCaches=phase2Caches;
  window.recarregarAnalytics=async function(){cache.clear();Object.values(phase2Caches).forEach(x=>x.clear());analyticsRequestId++;return carregarDadosAnalytics();};
  window.obterIntervaloMes=obterIntervaloMes;
  window.normalizarNumero=normalizarNumero;
  window.calcularAcumuladoServico=calcularAcumuladoServico;
  window.sair=async function sair(){
    try { await window.supabaseClient?.auth?.signOut(); }
    catch(error) { console.error("Erro ao encerrar sessão", { message:error?.message }); }
    finally { localStorage.removeItem("usuarioLogado"); window.location.replace("login.html"); }
  };
  window.addEventListener("DOMContentLoaded",inicializar,{once:true});
})();
