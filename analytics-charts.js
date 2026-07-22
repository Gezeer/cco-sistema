(function () {
  "use strict";

  const chatCharts = new Map();
  const CORES = ["#22c55e", "#22d3ee", "#facc15", "#34d399", "#60a5fa", "#a78bfa"];
  const METRICAS = Object.freeze({
    peso: { campo: "peso_t", rotulo: "Peso (t)" },
    km: { campo: "km_total", rotulo: "Quilometragem (km)" },
    viagens: { campo: "viagens", rotulo: "Viagens" },
    equipes: { campo: "qtd_equipe", alternativo: "equipe", rotulo: "Equipes" },
    tempo: { campo: "tempo_produtivo_minutos", divisor: 60, rotulo: "Horas produtivas" },
    abastecimento: { campo: "valor_abastecido", rotulo: "Valor abastecido" },
    registros: { contador: true, rotulo: "Registros" },
    dias: { dias: true, rotulo: "Dias distintos" },
    executado: { executado: true, rotulo: "Executado" },
    velocidade: { campo: "velocidade_media", media: true, rotulo: "Velocidade média (km/h)" }
  });

  function destruir(id) {
    const chart = chatCharts.get(id);
    if (chart) {
      chart.destroy();
      chatCharts.delete(id);
    }
  }

  function destruirTodos() {
    chatCharts.forEach(chart => chart.destroy());
    chatCharts.clear();
  }

  function numero(valor) {
    return window.CCOAnalyticsCalculations?.normalizarNumero?.(valor) || 0;
  }

  function valorDoGrupo(registros, metrica, calculos) {
    const definicao = METRICAS[metrica] || METRICAS.executado;
    if (definicao.contador) return registros.length;
    if (definicao.dias) return new Set(registros.map(item => item.data_operacao || item.data).filter(Boolean)).size;
    if (definicao.executado) return calculos.calcularExecutadoTotal(registros);
    const valores = registros
      .map(item => numero(item[definicao.campo] ?? item[definicao.alternativo]))
      .filter(valor => definicao.media ? valor > 0 : Number.isFinite(valor));
    if (!valores.length) return 0;
    const total = valores.reduce((soma, valor) => soma + valor, 0);
    return (definicao.media ? total / valores.length : total) / (definicao.divisor || 1);
  }

  function agrupar(registros, campo, calculos) {
    return [...calculos.agrupar(registros, campo)]
      .map(([nome, linhas]) => ({ nome: nome || "Não informado", linhas }))
      .filter(item => item.nome !== "Não informado");
  }

  function config(intencao = {}, registros = [], contexto = {}) {
    const calculos = window.CCOAnalyticsCalculations;
    if (!calculos || !registros.length) return null;

    if (intencao.tipo === "projecao") {
      const projecao = new CCOForecastEngine(registros, contexto).projetarFechamentoMes();
      return projecao && !projecao.real ? {
        type: "bar",
        labels: ["Conservador", "Provável", "Otimista"],
        datasets: [{ label: "Projeção", data: [projecao.conservador, projecao.provavel, projecao.otimista], backgroundColor: CORES.slice(0, 3) }]
      } : null;
    }

    const metrica = METRICAS[intencao.metrica] ? intencao.metrica : (intencao.tipo === "velocidade" ? "velocidade" : "executado");
    const rotulo = METRICAS[metrica].rotulo;
    let campo = "servico";
    if (intencao.tipo === "ra" || intencao.tipo === "ranking") campo = "ra";
    if (intencao.tipo === "turno") campo = "turno";

    let grupos = agrupar(registros, campo, calculos);
    if (intencao.servicos?.length && campo === "servico") {
      const permitidos = new Set(intencao.servicos.map(item => calculos.normalizarServico(item)));
      grupos = grupos.filter(item => permitidos.has(calculos.normalizarServico(item.nome)));
    }
    grupos = grupos
      .map(item => ({ nome: item.nome, valor: valorDoGrupo(item.linhas, metrica, calculos) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, campo === "ra" ? 15 : 20);

    if (!grupos.length) return null;
    return {
      type: "bar",
      labels: grupos.map(item => item.nome),
      datasets: [{
        label: rotulo,
        data: grupos.map(item => item.valor),
        backgroundColor: grupos.map((_, indice) => CORES[indice % CORES.length]),
        borderColor: "rgba(167,243,208,.75)",
        borderWidth: 1
      }],
      indexAxis: campo === "ra" ? "y" : "x"
    };
  }

  function criarNaMensagem(container, intencao, registros, contexto) {
    if (!container || !window.Chart) return false;
    const id = container.dataset.chartId || `chart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    container.dataset.chartId = id;
    destruir(id);
    const cfg = config(intencao, registros, contexto);
    if (!cfg) {
      container.textContent = "Não há dados suficientes para este gráfico.";
      return false;
    }
    const canvas = document.createElement("canvas");
    container.replaceChildren(canvas);
    const chart = new Chart(canvas, {
      type: cfg.type,
      data: { labels: cfg.labels, datasets: cfg.datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: cfg.indexAxis || "x",
        interaction: { mode: "nearest", intersect: false },
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true } }
      }
    });
    chatCharts.set(id, chart);
    return true;
  }

  window.CCOAnalyticsCharts = Object.freeze({ chatCharts, criarNaMensagem, destruir, destruirTodos, config });
})();
