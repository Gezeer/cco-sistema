(function () {
  "use strict";

  const icons = {
    services: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    status: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    database: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v7c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12v7c0 1.7 4 3 9 3s9-1.3 9-3v-7"/></svg>',
    activity: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>'
  };

  function addBreadcrumb(main) {
    const header = main.querySelector(":scope > .topbar, :scope > .page-header, :scope > .analytics-hero");
    if (!header || header.querySelector(".page-breadcrumb")) return;
    const title = header.querySelector("h1")?.textContent?.trim() || document.title.split("•")[0].trim();
    const crumb = document.createElement("div");
    crumb.className = "page-breadcrumb";
    crumb.innerHTML = `<a href="index.html">Home</a><span>/</span><span>${title}</span>`;
    header.prepend(crumb);
  }

  function addTableSearch() {
    document.querySelectorAll(".table-wrap").forEach((wrap) => {
      if (wrap.dataset.tools) return;
      wrap.dataset.tools = "1";
      const input = document.createElement("input");
      input.className = "table-search";
      input.type = "search";
      input.placeholder = "Pesquisar na tabela…";
      input.setAttribute("aria-label", "Pesquisar nesta tabela");
      const tools = document.createElement("div");
      tools.className = "table-tools";
      tools.appendChild(input);
      wrap.before(tools);
      input.addEventListener("input", () => {
        const query = input.value.toLocaleLowerCase("pt-BR");
        wrap.querySelectorAll("tbody tr").forEach((row) => {
          row.hidden = Boolean(query) && !row.textContent.toLocaleLowerCase("pt-BR").includes(query);
        });
      });
    });
  }

  function addExecutiveIndicators(main) {
    if (window.CCO_PAGE !== "painel" || document.querySelector(".cco-kpi-strip")) return;
    const header = main.querySelector(":scope > .topbar, :scope > .page-header");
    if (!header) return;
    const strip = document.createElement("section");
    strip.className = "cco-kpi-strip cco-kpi-grid";
    strip.setAttribute("aria-label", "Resumo do painel");
    strip.innerHTML = `
      <article class="cco-kpi-card"><span class="cco-kpi-icon">${icons.services}</span><div><span class="cco-kpi-label">Serviços monitorados</span><strong data-kpi="services">—</strong><small>Linhas da tabela executiva</small></div></article>
      <article class="cco-kpi-card"><span class="cco-kpi-icon">${icons.activity}</span><div><span class="cco-kpi-label">Execução média</span><strong data-kpi="execution">—</strong><small>Percentuais exibidos na tabela</small></div></article>
      <article class="cco-kpi-card"><span class="cco-kpi-icon">${icons.calendar}</span><div><span class="cco-kpi-label">Dias acumulados</span><strong data-kpi="days">—</strong><small>Maior valor exibido no período</small></div></article>
      <article class="cco-kpi-card"><span class="cco-kpi-icon">${icons.calendar}</span><div><span class="cco-kpi-label">Total de dias</span><strong data-kpi="total-days">—</strong><small>Referência mensal da tabela</small></div></article>
      <article class="cco-kpi-card"><span class="cco-kpi-icon">${icons.database}</span><div><span class="cco-kpi-label">Valor acumulado</span><strong data-kpi="value">—</strong><small>Soma dos valores exibidos</small></div></article>
      <article class="cco-kpi-card"><span class="cco-kpi-icon">${icons.status}</span><div><span class="cco-kpi-label">Serviços em atenção</span><strong data-kpi="attention">—</strong><small>Status atual da tabela</small></div></article>`;
    const anchor = document.getElementById("cardsOriginaisAnchor");
    if (anchor) anchor.replaceWith(strip);
    else header.after(strip);

    const tableBody = document.getElementById("tabelaPainelExecutivo");
    const numberFromText = (text) => {
      const source = String(text || "");
      if (!/\d/.test(source)) return null;
      const normalized = source.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
      const value = Number(normalized);
      return Number.isFinite(value) ? value : null;
    };
    const update = () => {
      const rows = [...(tableBody?.querySelectorAll("tr") || [])];
      strip.querySelector('[data-kpi="services"]').textContent = rows.length ? String(rows.length) : "—";
      const percentages = rows.map((row) => numberFromText(row.cells[4]?.textContent)).filter((value) => value !== null);
      const days = rows.map((row) => numberFromText(row.cells[5]?.textContent)).filter((value) => value !== null);
      const totalDays = rows.map((row) => numberFromText(row.cells[6]?.textContent)).filter((value) => value !== null);
      const values = rows.map((row) => numberFromText(row.cells[7]?.textContent)).filter((value) => value !== null);
      const attention = rows.filter((row) => /aten|alert|problema|cr[ií]tic|sem dados/i.test(row.cells[8]?.textContent || "")).length;
      strip.querySelector('[data-kpi="execution"]').textContent = percentages.length ? `${(percentages.reduce((sum, value) => sum + value, 0) / percentages.length).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—";
      strip.querySelector('[data-kpi="days"]').textContent = days.length ? String(Math.max(...days)) : "—";
      strip.querySelector('[data-kpi="total-days"]').textContent = totalDays.length ? String(Math.max(...totalDays)) : "—";
      strip.querySelector('[data-kpi="value"]').textContent = values.length ? values.reduce((sum, value) => sum + value, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }) : "—";
      strip.querySelector('[data-kpi="attention"]').textContent = rows.length ? String(attention) : "—";
    };
    update();
    if (tableBody) new MutationObserver(update).observe(tableBody, { childList: true, subtree: true, characterData: true });
    document.getElementById("filtroMes")?.addEventListener("change", update);
    document.getElementById("filtroAno")?.addEventListener("change", update);
  }

  function init() {
    const main = document.querySelector("main.content, main.analytics-content");
    if (!main) return;
    addBreadcrumb(main);
    addTableSearch();
    addExecutiveIndicators(main);
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init();
})();
