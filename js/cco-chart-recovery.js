(function () {
  "use strict";

  const nomes = {
    graficoExecucao: "Execução por Serviço",
    graficoValorServicoBarras: "Valor contratado por Serviço"
  };

  const pluginGlobal3D = {
    id: "ccoGlobal3D",
    beforeDatasetDraw(chart, argumentos) {
      const meta = chart.getDatasetMeta(argumentos.index);
      const ctx = chart.ctx;
      const profundidade = 18;
      ctx.save();
      ctx.globalAlpha = .16;
      ctx.shadowColor = "rgba(0,0,0,.72)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 7;
      ctx.shadowOffsetY = 10;
      for (let camada = profundidade; camada >= 1; camada -= 1) {
        ctx.save();
        ctx.translate(camada * .85, camada);
        meta.data.forEach(elemento => elemento?.draw?.(ctx));
        ctx.restore();
      }
      ctx.restore();
    },
    afterDatasetDraw(chart, argumentos) {
      const meta = chart.getDatasetMeta(argumentos.index);
      if (meta.type !== "bar") return;
      const horizontal = chart.options.indexAxis === "y";
      const ctx = chart.ctx;
      const profundidade = 18;
      meta.data.forEach(barra => {
        const p = barra.getProps(["x", "y", "base", "width", "height"], true);
        if (![p.x, p.y, p.base, p.width, p.height].every(Number.isFinite)) return;
        ctx.save();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = "rgba(209,250,229,.62)";
        if (horizontal) {
          const topo = p.y - p.height / 2;
          const baseVisual = p.y + p.height / 2;
          ctx.beginPath();
          ctx.moveTo(p.x, topo);
          ctx.lineTo(p.x + profundidade, topo - profundidade);
          ctx.lineTo(p.x + profundidade, baseVisual - profundidade);
          ctx.lineTo(p.x, baseVisual);
          ctx.closePath();
          const lateral = ctx.createLinearGradient(p.x, topo, p.x + profundidade, baseVisual);
          lateral.addColorStop(0, "rgba(52,211,153,.96)");
          lateral.addColorStop(1, "rgba(3,65,51,.98)");
          ctx.fillStyle = lateral;
          ctx.fill(); ctx.stroke();
        } else {
          const esquerda = p.x - p.width / 2;
          const direita = p.x + p.width / 2;
          ctx.beginPath();
          ctx.moveTo(esquerda, p.y);
          ctx.lineTo(esquerda + profundidade, p.y - profundidade);
          ctx.lineTo(direita + profundidade, p.y - profundidade);
          ctx.lineTo(direita, p.y);
          ctx.closePath();
          const topo3D = ctx.createLinearGradient(esquerda, p.y, direita + profundidade, p.y - profundidade);
          topo3D.addColorStop(0, "rgba(209,250,229,.98)");
          topo3D.addColorStop(.48, "rgba(52,211,153,.98)");
          topo3D.addColorStop(1, "rgba(6,95,70,.98)");
          ctx.fillStyle = topo3D;
          ctx.fill(); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(direita, p.y);
          ctx.lineTo(direita + profundidade, p.y - profundidade);
          ctx.lineTo(direita + profundidade, p.base - profundidade);
          ctx.lineTo(direita, p.base);
          ctx.closePath();
          const lado3D = ctx.createLinearGradient(direita, p.y, direita + profundidade, p.base);
          lado3D.addColorStop(0, "rgba(16,185,129,.98)");
          lado3D.addColorStop(1, "rgba(2,44,34,.98)");
          ctx.fillStyle = lado3D;
          ctx.fill();
        }
        ctx.restore();
      });
    }
  };

  function ativarGraficos3D() {
    const ChartJS = window.Chart;
    if (typeof ChartJS?.register !== "function" || !ChartJS.defaults?.elements) return false;
    if (!ChartJS.registry?.plugins?.get?.("ccoGlobal3D")) ChartJS.register(pluginGlobal3D);
    if (ChartJS.defaults.elements.bar) {
      ChartJS.defaults.elements.bar.borderSkipped = false;
      ChartJS.defaults.elements.bar.borderWidth = 1;
      ChartJS.defaults.elements.bar.borderRadius = 3;
    }
    if (ChartJS.defaults.elements.line) {
      ChartJS.defaults.elements.line.borderWidth = 3;
      ChartJS.defaults.elements.line.tension = .32;
    }
    if (ChartJS.defaults.elements.point) ChartJS.defaults.elements.point.radius = 4;
    ChartJS.defaults.color = "#d1fae5";
    ChartJS.defaults.borderColor = "rgba(167,243,208,.12)";
    ChartJS.defaults.layout = ChartJS.defaults.layout || {};
    ChartJS.defaults.layout.padding = { top: 16, right: 20, bottom: 6, left: 6 };
    Object.values(ChartJS.instances || {}).forEach(chart => {
      chart.options.animation = chart.options.animation || {};
      chart.options.animation.easing = "easeOutQuart";
      Object.values(chart.options.scales || {}).forEach(escala => {
        escala.ticks = { ...(escala.ticks || {}), color: "#d1fae5" };
        escala.grid = { ...(escala.grid || {}), color: "rgba(167,243,208,.1)" };
        escala.border = { ...(escala.border || {}), color: "rgba(167,243,208,.16)" };
      });
      try { chart.update("none"); } catch (erro) {}
    });
    document.documentElement.classList.remove("cco-charts-2d");
    document.documentElement.classList.add("cco-charts-3d");
    return true;
  }

  function diagnosticarCanvas(id) {
    const elementos = document.querySelectorAll(`[id="${id}"]`);
    const canvas = elementos[0];
    if (!canvas) return;
    const container = canvas.closest(".chart-card, .analytics-chart, .section, .chart-area") || canvas.parentElement;
    const chart = window.Chart?.getChart?.(canvas) || null;
    const labels = chart?.data?.labels || [];
    const dados = chart?.data?.datasets?.map((dataset) => dataset.data) || [];
    console.groupCollapsed(`[CCO][CHART] ${nomes[id] || id}`);
    console.log("canvas:", canvas);
    console.log("container:", container);
    console.log("canvas conectado:", canvas.isConnected);
    console.log("IDs encontrados:", elementos.length);
    console.log("largura container:", container?.clientWidth || 0);
    console.log("altura container:", container?.clientHeight || 0);
    console.log("largura canvas:", canvas.clientWidth || 0);
    console.log("altura canvas:", canvas.clientHeight || 0);
    console.log("Chart disponível:", typeof window.Chart !== "undefined");
    console.log("instância:", chart);
    console.log("labels:", labels);
    console.log("dados:", dados);
    console.groupEnd();
    if (elementos.length !== 1) console.error("[CCO][CHART] ID de canvas duplicado", { id, quantidade: elementos.length });
    if (!(canvas instanceof HTMLCanvasElement)) console.error("[CCO][CHART] Elemento não é canvas", { id, canvas });
    if (!container?.clientWidth || !container?.clientHeight) console.error("[CCO][CHART] Container sem dimensão útil", { id, container });
  }

  function auditarGraficos() {
    Object.keys(nomes).forEach(diagnosticarCanvas);
  }

  function prepararImpressao() {
    if (!window.Chart) return;
    document.querySelectorAll("canvas").forEach((canvas) => {
      const chart = window.Chart.getChart?.(canvas);
      if (!chart) return;
      try { chart.resize(); chart.update("none"); }
      catch (erro) { console.error("[CCO][CHART] Falha ao preparar gráfico para impressão", { id: canvas.id, erro }); }
    });
  }

  window.addEventListener("beforeprint", prepararImpressao);
  window.addEventListener("afterprint", prepararImpressao);
  ativarGraficos3D();
  window.addEventListener("cco:analytics-loaded", () => requestAnimationFrame(() => requestAnimationFrame(() => { ativarGraficos3D(); auditarGraficos(); })));
  window.addEventListener("load", () => requestAnimationFrame(() => requestAnimationFrame(() => { ativarGraficos3D(); auditarGraficos(); })), { once: true });
})();
