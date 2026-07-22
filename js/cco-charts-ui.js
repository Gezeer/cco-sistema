(function () {
  "use strict";

  const reduzirMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  const dispositivoCompacto = window.matchMedia?.("(max-width: 768px)")?.matches === true;
  const profundidadePorCanvas = new WeakMap();

  function graficoAutorizado(chart) {
    const canvas = chart?.canvas;
    return Boolean(canvas?.closest?.(".chart-card, .analytics-chart, .grafico-painel-grande, .ranking-medicao-chart"));
  }

  function ehBarra(chart) {
    return chart?.config?.type === "bar" || chart?.data?.datasets?.some((dataset) => dataset.type === "bar");
  }

  function criarGradienteCCO(contexto, chartArea, horizontal) {
    if (!contexto || !chartArea) return "#0b6e4f";
    const gradient = horizontal
      ? contexto.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
      : contexto.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, "rgba(6, 78, 59, 0.96)");
    gradient.addColorStop(0.55, "rgba(11, 110, 79, 0.92)");
    gradient.addColorStop(1, "rgba(56, 189, 248, 0.86)");
    return gradient;
  }

  function configurarAnimacaoCCO(tipo) {
    if (reduzirMovimento) return { duration: 1, delay: 0 };
    if (tipo === "doughnut" || tipo === "pie") return { animateRotate: true, animateScale: true, duration: 900, easing: "easeOutQuart" };
    return {
      duration: dispositivoCompacto ? 620 : 1100,
      easing: "easeOutQuart",
      delay(context) {
        if (context.type !== "data" || dispositivoCompacto) return 0;
        return Math.min(context.dataIndex * 50, 650);
      }
    };
  }

  function calcularMaximoEixoCCO(valores) {
    const validos = (valores || []).map(Number).filter(Number.isFinite);
    const maior = Math.max(...validos, 100);
    return Math.ceil((maior + 10) / 20) * 20;
  }

  function formatarNumeroBR(valor, casas = 1) {
    return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: casas });
  }

  function configurarTooltipCCO(chart) {
    const plugins = chart.options.plugins ||= {};
    const legend = plugins.legend ||= {};
    legend.labels = { color: "#d1fae5", usePointStyle: true, ...(legend.labels || {}) };
    const tooltip = plugins.tooltip ||= {};
    Object.assign(tooltip, {
      enabled: true,
      backgroundColor: "rgba(7, 23, 18, 0.97)",
      titleColor: "#ffffff",
      bodyColor: "#dbeafe",
      borderColor: "rgba(74, 222, 128, 0.32)",
      borderWidth: 1,
      padding: 13,
      cornerRadius: 12,
      caretPadding: 8,
      displayColors: true,
      usePointStyle: true,
      boxPadding: 6
    });
    if (chart.canvas?.id !== "graficoExecucao") return;
    const callbacks = tooltip.callbacks ||= {};
    callbacks.title = (items) => items?.[0]?.label || "Serviço";
    callbacks.label = (context) => `Execução: ${formatarNumeroBR(context.raw, 2)}%`;
    callbacks.afterBody = (items) => {
      const servico = items?.[0]?.label;
      const linha = [...document.querySelectorAll("#tabelaPainelExecutivo tr")].find((row) => row.cells?.[0]?.textContent?.trim() === servico);
      if (!linha) return [];
      return [
        `Acumulado: ${linha.cells[1]?.textContent?.trim() || "—"}`,
        `Previsto: ${linha.cells[3]?.textContent?.trim() || "—"}`,
        `Dias: ${linha.cells[5]?.textContent?.trim() || "—"} de ${linha.cells[6]?.textContent?.trim() || "—"}`,
        `Status: ${linha.cells[8]?.textContent?.trim() || "—"}`
      ];
    };
  }

  function aplicarTemaGraficoCCO(chart) {
    if (!graficoAutorizado(chart)) return;
    chart.options.animation = configurarAnimacaoCCO(chart.config.type);
    chart.options.transitions ||= {};
    chart.options.transitions.active = { animation: { duration: reduzirMovimento ? 1 : 520, easing: "easeOutQuart" } };
    chart.options.interaction = { mode: "nearest", intersect: false, ...(chart.options.interaction || {}) };
    configurarTooltipCCO(chart);
    if (chart.options.scales) {
      Object.values(chart.options.scales).forEach((scale) => {
        scale.grid = { color: "rgba(167,243,208,.08)", drawBorder: false, ...(scale.grid || {}) };
        scale.ticks = { color: "#d1fae5", ...(scale.ticks || {}) };
        scale.border = { display: false, ...(scale.border || {}) };
      });
    }

    if (ehBarra(chart)) {
      const horizontal = chart.options.indexAxis === "y";
      chart.data.datasets.forEach((dataset) => {
        if (dataset.type && dataset.type !== "bar") return;
        const coresIndividuais = Array.isArray(dataset.backgroundColor) && dataset.backgroundColor.length > 1;
        if (!coresIndividuais) {
          dataset.backgroundColor = (context) => criarGradienteCCO(context.chart.ctx, context.chart.chartArea, horizontal);
          dataset.hoverBackgroundColor = dispositivoCompacto ? "#0b6e4f" : "#16a34a";
        }
        dataset.borderColor = dataset.borderColor || "rgba(6, 78, 59, 0.72)";
        dataset.borderWidth = 1;
        dataset.hoverBorderWidth = 2;
        dataset.borderRadius = { topLeft: 9, topRight: 9, bottomLeft: 2, bottomRight: 2 };
        dataset.borderSkipped = false;
        dataset.barPercentage = dataset.barPercentage ?? 0.72;
        dataset.categoryPercentage = dataset.categoryPercentage ?? 0.76;
      });
    }

    if (chart.config.type === "line") {
      chart.data.datasets.forEach((dataset) => {
        dataset.tension = dataset.tension ?? 0.35;
        dataset.pointRadius = dataset.pointRadius ?? 2;
        dataset.pointHoverRadius = dataset.pointHoverRadius ?? 6;
        dataset.pointBackgroundColor = dataset.pointBackgroundColor || "#22d3ee";
        dataset.pointBorderColor = dataset.pointBorderColor || "#071712";
        dataset.borderWidth = dataset.borderWidth ?? 2.5;
        dataset.fill = dataset.fill ?? true;
        if (!Array.isArray(dataset.backgroundColor)) {
          dataset.backgroundColor = (context) => {
            const area = context.chart.chartArea;
            if (!area) return "rgba(11,110,79,.14)";
            const gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            gradient.addColorStop(0, "rgba(56,189,248,.28)");
            gradient.addColorStop(1, "rgba(11,110,79,.025)");
            return gradient;
          };
        }
      });
    }

    if (["doughnut", "pie"].includes(chart.config.type)) {
      chart.data.datasets.forEach((dataset) => {
        dataset.borderColor = dataset.borderColor || "rgba(255,255,255,.9)";
        dataset.borderWidth = dataset.borderWidth ?? 2;
        dataset.hoverOffset = dataset.hoverOffset ?? 7;
      });
    }

    if (chart.canvas?.id === "graficoExecucao") {
      const valores = chart.data.datasets.flatMap((dataset) => dataset.data || []);
      chart.options.scales ||= {};
      chart.options.scales.y ||= {};
      chart.options.scales.y.suggestedMax = calcularMaximoEixoCCO(valores);
      chart.options.layout ||= {};
      chart.options.layout.padding = { top: 28, right: 14, bottom: 8, left: 8, ...(chart.options.layout.padding || {}) };
    }
  }

  const ccoBarDepthPlugin = {
    id: "ccoBarDepth",
    beforeInit(chart) {
      if (!graficoAutorizado(chart)) return;
      const canvas = chart.canvas;
      canvas.setAttribute("role", "img");
      if (!canvas.getAttribute("aria-label")) canvas.setAttribute("aria-label", `Gráfico ${chart.config.type} com os dados do período selecionado. Consulte a tabela equivalente para os valores completos.`);
      if (!profundidadePorCanvas.has(canvas)) profundidadePorCanvas.set(canvas, !dispositivoCompacto);
      try { aplicarTemaGraficoCCO(chart); } catch (error) { console.warn("CCO Charts: configuração padrão preservada.", error); }
    },
    beforeUpdate(chart) {
      try { aplicarTemaGraficoCCO(chart); } catch (error) { console.warn("CCO Charts: tema padrão mantido.", error); }
    },
    beforeDatasetDraw(chart, args) {
      if (!ehBarra(chart) || !graficoAutorizado(chart) || !profundidadePorCanvas.get(chart.canvas)) return;
      if (args.meta?.type !== "bar") return;
      chart.ctx.save();
      chart.ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
      chart.ctx.shadowBlur = 12;
      chart.ctx.shadowOffsetX = 0;
      chart.ctx.shadowOffsetY = 7;
    },
    afterDatasetDraw(chart, args) {
      if (!ehBarra(chart) || !graficoAutorizado(chart) || !profundidadePorCanvas.get(chart.canvas) || args.meta?.type !== "bar") return;
      const ctx = chart.ctx;
      ctx.restore();
      ctx.save();
      try {
        (args.meta.data || []).forEach((bar, index) => {
          const props = bar?.getProps?.(["x", "y", "base", "width", "height"], true);
          const raw = chart.data?.datasets?.[args.index]?.data?.[index];
          if (!props || !Number(raw)) return;
          const horizontal = chart.options.indexAxis === "y";
          const depth = Math.min(6, Math.max(3, (horizontal ? props.height : props.width) * 0.12));
          ctx.beginPath();
          if (horizontal) {
            const top = props.y - props.height / 2;
            ctx.moveTo(props.x, top);ctx.lineTo(props.x + depth, top - depth);ctx.lineTo(props.x + depth, top + props.height - depth);ctx.lineTo(props.x, top + props.height);ctx.closePath();
          } else {
            const left = props.x - props.width / 2;
            ctx.moveTo(left, props.y);ctx.lineTo(left + depth, props.y - depth);ctx.lineTo(left + props.width + depth, props.y - depth);ctx.lineTo(left + props.width, props.y);ctx.closePath();
          }
          ctx.fillStyle = "rgba(125, 211, 252, 0.28)";ctx.fill();
          ctx.beginPath();
          if (horizontal) {
            const top = props.y - props.height / 2;
            ctx.moveTo(props.x, top);ctx.lineTo(props.x + depth, top - depth);ctx.lineTo(props.x + depth, top + props.height - depth);ctx.lineTo(props.x, top + props.height);ctx.closePath();
          } else {
            const right = props.x + props.width / 2;
            ctx.moveTo(right, props.y);ctx.lineTo(right + depth, props.y - depth);ctx.lineTo(right + depth, props.base - depth);ctx.lineTo(right, props.base);ctx.closePath();
          }
          ctx.fillStyle = "rgba(6, 19, 31, 0.24)";ctx.fill();
        });
      } catch (error) {
        console.warn("CCO Charts: profundidade desativada para este gráfico.", error);
        profundidadePorCanvas.set(chart.canvas, false);
      } finally { ctx.restore(); }
    },
    afterDatasetsDraw(chart) {
      if (chart.canvas?.id !== "graficoExecucao") return;
      const ctx = chart.ctx;
      ctx.save();
      try {
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (meta.type !== "bar") return;
          (meta.data || []).forEach((bar, index) => {
            if (dispositivoCompacto && index % 2) return;
            const value = Number(dataset.data?.[index]);
            if (!Number.isFinite(value)) return;
            const props = bar.getProps?.(["x", "y"], true);
            if (!props) return;
            const label = `${formatarNumeroBR(value, 1)}%`;
            ctx.font = "700 10px Inter, Segoe UI, sans-serif";
            const width = ctx.measureText(label).width + 10;
            const height = 18;
            const x = Math.min(Math.max(props.x - width / 2, chart.chartArea.left), chart.chartArea.right - width);
            const y = Math.max(chart.chartArea.top + 2, props.y - height - 7);
            ctx.fillStyle = "rgba(7, 23, 18, 0.92)";
            ctx.beginPath();
            if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, width, height, 6);
            else ctx.rect(x, y, width, height);
            ctx.fill();
            ctx.fillStyle = "#ffffff";ctx.textAlign = "center";ctx.textBaseline = "middle";ctx.fillText(label, x + width / 2, y + height / 2 + .5);
          });
        });
      } catch (error) {
        console.warn("CCO Charts: labels superiores mantidos no modo padrão.", error);
      } finally { ctx.restore(); }
    },
    afterDraw(chart) {
      if (chart.config.type === "doughnut") {
        const valores = chart.data?.datasets?.[0]?.data?.map(Number)?.filter(Number.isFinite) || [];
        const centro = chart.getDatasetMeta(0)?.data?.[0];
        if (centro && valores.length) {
          const total = valores.reduce((sum, value) => sum + value, 0);
          const ctx = chart.ctx;
          ctx.save();ctx.textAlign = "center";ctx.textBaseline = "middle";ctx.fillStyle = "#f0fdf4";ctx.font = "800 18px Inter, Segoe UI, sans-serif";ctx.fillText(total.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 }), centro.x, centro.y - 4);ctx.fillStyle = "#a7c7b7";ctx.font = "600 10px Inter, Segoe UI, sans-serif";ctx.fillText("Total", centro.x, centro.y + 14);ctx.restore();
        }
      }
      if (chart.canvas?.id !== "graficoExecucao") return;
      const ctx = chart.ctx;
      const yScale = chart.scales?.y;
      const area = chart.chartArea;
      if (!yScale || !area || yScale.max < 100) return;
      const y = yScale.getPixelForValue(100);
      ctx.save();ctx.setLineDash([6, 5]);ctx.strokeStyle = "rgba(34,211,238,.82)";ctx.lineWidth = 1;ctx.beginPath();ctx.moveTo(area.left, y);ctx.lineTo(area.right, y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle = "#a5f3fc";ctx.font = "600 10px Inter, Segoe UI, sans-serif";ctx.fillText("Meta 100%", area.right - 54, Math.max(area.top + 10, y - 6));ctx.restore();
    }
  };

  function adicionarControleProfundidade() {
    const canvas = document.getElementById("graficoExecucao");
    const card = canvas?.closest?.(".chart-card, .section");
    const title = card?.querySelector?.(".section-title");
    if (!canvas || !title || title.querySelector(".cco-chart-mode")) return;
    if (!profundidadePorCanvas.has(canvas)) profundidadePorCanvas.set(canvas, !dispositivoCompacto);
    const control = document.createElement("div");
    control.className = "cco-chart-mode";
    control.setAttribute("role", "group");
    control.setAttribute("aria-label", "Estilo visual do gráfico");
    control.innerHTML = '<button type="button" data-depth="false">Padrão</button><button type="button" data-depth="true">Profundidade</button>';
    title.appendChild(control);
    const refresh = () => control.querySelectorAll("button").forEach((button) => button.classList.toggle("active", String(profundidadePorCanvas.get(canvas)) === button.dataset.depth));
    control.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-depth]");
      if (!button) return;
      profundidadePorCanvas.set(canvas, button.dataset.depth === "true" && !dispositivoCompacto);
      refresh();
      window.Chart?.getChart?.(canvas)?.update(reduzirMovimento ? "none" : "active");
    });
    refresh();
  }

  function registrarPluginsCCO() {
    if (!window.Chart || window.__CCO_CHARTS_UI__) return false;
    try {
      window.Chart.register(ccoBarDepthPlugin);
      window.__CCO_CHARTS_UI__ = Object.freeze({ criarGradienteCCO, configurarAnimacaoCCO, configurarTooltipCCO, aplicarTemaGraficoCCO, calcularMaximoEixoCCO, ccoBarDepthPlugin });
      return true;
    } catch (error) {
      console.warn("CCO Charts: plugin visual não registrado; gráficos padrão preservados.", error);
      return false;
    }
  }

  registrarPluginsCCO();
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", adicionarControleProfundidade, { once: true }) : adicionarControleProfundidade();
})();
