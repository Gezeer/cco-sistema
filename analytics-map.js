(function () {
  "use strict";

  const texto = valor => String(valor ?? "").trim();
  const escapar = valor => texto(valor).replace(/[&<>"]/g, caractere => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[caractere]));
  const numero = valor => {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : 0;
  };

  class CCOAnalyticsMap {
    constructor(container) {
      this.container = typeof container === "string" ? document.getElementById(container) : container;
      this.renderizado = false;
    }

    agruparRAs(registros) {
      const grupos = new Map();
      (registros || []).forEach(registro => {
        const ra = texto(registro.ra);
        if (!ra || /^(não informad[ao]|por demanda|n\/a)$/i.test(ra)) return;
        if (!grupos.has(ra)) grupos.set(ra, { nome: ra, registros: 0, velocidadeTotal: 0, velocidadesValidas: 0, servicos: new Set() });
        const grupo = grupos.get(ra);
        grupo.registros += 1;
        const velocidade = numero(registro.velocidade_media);
        if (velocidade > 0) { grupo.velocidadeTotal += velocidade; grupo.velocidadesValidas += 1; }
        const servico = texto(registro.servico);
        if (servico) grupo.servicos.add(servico);
      });
      return [...grupos.values()].map(grupo => ({
        nome: grupo.nome,
        registros: grupo.registros,
        velocidade: grupo.velocidadesValidas ? grupo.velocidadeTotal / grupo.velocidadesValidas : null,
        servicos: grupo.servicos.size
      })).sort((a, b) => b.registros - a.registros || a.nome.localeCompare(b.nome, "pt-BR"));
    }

    mostrar(registros) {
      if (!this.container) return false;
      const ras = this.agruparRAs(registros);
      this.container.hidden = false;
      this.renderizado = true;
      if (!ras.length) {
        this.container.innerHTML = '<div class="map-fallback" role="status"><strong>Mapa das RAs do Distrito Federal</strong><span>Não há Regiões Administrativas identificadas nos registros deste período.</span></div>';
        return false;
      }
      const maximo = Math.max(...ras.map(item => item.registros), 1);
      const pontos = [[18,24],[36,17],[55,22],[73,18],[84,35],[67,42],[48,36],[28,43],[14,56],[34,61],[55,57],[77,62]];
      this.container.innerHTML = `
        <header class="df-map-header"><div><span>MAPA OPERACIONAL</span><h2>Distrito Federal • Visão por RA</h2><p>Ilustração urbana com os indicadores reais do período selecionado.</p></div><strong>${ras.length}<small>RAs com dados</small></strong></header>
        <div class="df-operational-layout">
          <figure class="df-operational-figure">
            <img src="assets/mapa-df-operacional-v1.png" alt="Ilustração aérea estilizada do Distrito Federal e de Brasília">
            <div class="df-operational-shade"></div>
            ${ras.slice(0, 12).map((item, indice) => {
              const [x, y] = pontos[indice];
              const intensidade = Math.max(.18, item.registros / maximo);
              const velocidade = item.velocidade == null ? "—" : `${item.velocidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km/h`;
              return `<button class="df-operational-pin" type="button" style="left:${x}%;top:${y}%;--pin-scale:${(.82 + intensidade * .32).toFixed(2)}" title="${escapar(item.nome)} • ${item.registros.toLocaleString("pt-BR")} registros • ${velocidade}"><i>${indice + 1}</i><span><strong>${escapar(item.nome)}</strong><small>${velocidade}</small></span></button>`;
            }).join("")}
            <figcaption>Mapa ilustrativo • marcadores organizados para leitura, sem geolocalização estimada</figcaption>
          </figure>
          <aside class="df-operational-list" aria-label="Indicadores das Regiões Administrativas">
            <strong>Regiões monitoradas</strong>
            ${ras.map((item, indice) => `<article><i>${indice + 1}</i><span><b>${escapar(item.nome)}</b><small>${item.registros.toLocaleString("pt-BR")} registros · ${item.servicos} serviço(s)</small></span><em>${item.velocidade == null ? "—" : `${item.velocidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km/h`}</em></article>`).join("")}
          </aside>
        </div>`;
      return true;
    }

    mostrarVelocidades(gruposRA) {
      if (!this.container) return false;
      const ras = (gruposRA || []).map(item => ({
        nome: texto(item.nome),
        velocidade: numero(item.valor)
      })).filter(item => item.nome);
      const maximo = Math.max(...ras.map(item => item.velocidade), 1);
      const media = ras.length ? ras.reduce((total, item) => total + item.velocidade, 0) / ras.length : 0;

      if (!ras.length) {
        this.container.innerHTML = '<div class="map-fallback" role="status"><strong>Mapa do Distrito Federal</strong><span>Não há velocidades por RA para o período selecionado.</span></div>';
        return false;
      }

      const pontos = [[28,22],[48,15],[68,24],[20,42],[40,36],[60,40],[79,44],[29,57],[50,53],[69,61],[38,73],[58,76]];
      const marcadores = ras.slice(0, 12).map((item, indice) => {
        const [x, y] = pontos[indice];
        const intensidade = Math.max(.15, item.velocidade / maximo);
        const raio = 3.2 + intensidade * 2.2;
        return `<g class="ra-map-point" tabindex="0" style="--point-delay:${indice * 45}ms"><circle cx="${x}" cy="${y}" r="${raio.toFixed(1)}"></circle><text x="${x}" y="${y + .8}">${indice + 1}</text><title>${escapar(item.nome)}: ${item.velocidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km/h</title></g>`;
      }).join("");

      this.container.innerHTML = `
        <div class="ra-speed-map-layout">
          <div class="df-speed-figure">
            <svg viewBox="0 0 100 94" aria-hidden="true" focusable="false">
              <defs><linearGradient id="dfSpeedFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f614b"/><stop offset="1" stop-color="#082c24"/></linearGradient></defs>
              <path class="df-speed-outline" d="M8 43 24 18 52 7 82 18 93 42 82 71 57 87 28 80 11 61Z"></path>
              <path class="df-speed-axis" d="M19 48 80 48M50 16 50 78"></path>
              ${marcadores}
            </svg>
            <div class="df-speed-summary"><strong>${media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</strong><span>km/h<br>média das RAs</span></div>
            <small>Representação esquemática • marcadores sem posição geográfica</small>
          </div>
          <div class="ra-speed-list" role="list" aria-label="Velocidades médias por Região Administrativa">
            ${ras.map((item, indice) => `<div class="ra-speed-row" role="listitem"><i>${indice + 1}</i><span title="${escapar(item.nome)}">${escapar(item.nome)}</span><strong>${item.velocidade.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} <small>km/h</small></strong></div>`).join("")}
          </div>
        </div>`;
      return true;
    }

    recolher() {
      if (this.container) this.container.hidden = true;
    }
  }

  window.CCOAnalyticsMap = CCOAnalyticsMap;
})();
