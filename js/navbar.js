(function () {
  "use strict";

  const icons = {
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
  };

  function init() {
    if (document.querySelector(".cco-navbar") || document.body.classList.contains("login-page")) return;
    const sidebar = document.querySelector(".sidebar");
    const legacyMenu = sidebar?.querySelector(".menu");
    const navbar = document.createElement("header");
    navbar.className = "cco-navbar";
    navbar.innerHTML = `
      <div class="cco-nav-backdrop"></div>
      <div class="cco-nav-inner">
        <a class="cco-nav-brand" href="index.html"><img src="logo.png" alt="CCO"><span>CCO<small>Centro Inteligente de Controle Operacional</small></span></a>
        <button class="cco-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="ccoMainNavigation">${icons.menu}</button>
        <nav class="cco-nav-links" id="ccoMainNavigation" aria-label="Menu principal"></nav>
        <div class="cco-nav-tools">
          <label class="cco-global-search">${icons.search}<input type="search" placeholder="Pesquisar" aria-label="Pesquisar na página"></label>
          <button class="cco-icon-button cco-notifications" type="button" aria-label="Notificações">${icons.bell}<i></i></button>
        </div>
        <div class="cco-nav-user"><span class="cco-avatar">CC</span><span class="cco-user-copy"><strong>Usuário CCO</strong><small>Perfil operacional</small></span><span class="cco-user-chevron">${icons.chevron}</span></div>
      </div>`;

    const links = navbar.querySelector(".cco-nav-links");
    const user = navbar.querySelector(".cco-nav-user");
    const paginaExecucao = document.body.classList.contains("execution-page");
    navbar.classList.add("cco-nav-mobile");
    links.classList.add("cco-nav-mobile__lista");
    [...(legacyMenu?.children || [])].forEach((item) => {
      if (item.classList.contains("logout")) {
        item.className = "cco-logout";
        item.textContent = "Sair";
        user.appendChild(item);
        return;
      }
      if (item.id === "btnLimpezaTotal") return;
      item.innerHTML = `${icons.grid}<span>${item.textContent.replace(/^[^\p{L}]+/u, "").trim()}</span>`;
      item.classList.add("cco-nav-mobile__link");
      links.appendChild(item);
    });
    const settings = document.createElement("a");
    settings.href = "configuracoes.html";
    settings.innerHTML = `${icons.grid}<span>Configurações</span>`;
    settings.classList.add("cco-nav-mobile__link");
    if (location.pathname.endsWith("configuracoes.html")) settings.classList.add("active");
    links.appendChild(settings);

    document.body.prepend(navbar);
    const toggle = navbar.querySelector(".cco-menu-toggle");
    if (paginaExecucao) links.setAttribute("aria-hidden", String(window.innerWidth <= 1360));
    const redimensionarGraficos = () => requestAnimationFrame(() => {
      document.querySelectorAll(".cco-chart,.cco-chart-3d,.cco-echarts-3d,.grafico-echarts").forEach((container) => window.echarts?.getInstanceByDom?.(container)?.resize?.());
    });
    const close = () => {
      const estavaAberto = navbar.classList.contains("menu-open");
      navbar.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
      if (paginaExecucao) links.setAttribute("aria-hidden", String(window.innerWidth <= 1360));
      document.body.classList.remove("cco-menu-locked");
      document.body.classList.remove("cco-menu-aberto");
      if (estavaAberto) { redimensionarGraficos(); window.dispatchEvent(new CustomEvent("cco:menu-fechado")); }
    };
    toggle.addEventListener("click", () => {
      const open = navbar.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      if (paginaExecucao) links.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("cco-menu-locked", open);
      document.body.classList.toggle("cco-menu-aberto", open);
      redimensionarGraficos();
    });
    navbar.querySelector(".cco-nav-backdrop").addEventListener("click", close);
    links.addEventListener("click", close);
    navbar.querySelector(".cco-global-search input").addEventListener("input", (event) => {
      const tableSearch = document.querySelector(".table-search");
      if (!tableSearch) return;
      tableSearch.value = event.target.value;
      tableSearch.dispatchEvent(new Event("input", { bubbles: true }));
    });
    navbar.querySelector(".cco-notifications").addEventListener("click", () => {
      window.CCOToast?.show?.("Nenhuma nova notificação.");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1360) close();
    }, { passive: true });
    sidebar?.remove();
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init, { once: true }) : init();
})();
