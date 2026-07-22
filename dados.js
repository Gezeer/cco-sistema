/* Base Importada - completa, paginada e sem travar o navegador. */
(function iniciarPaginaDados(){
  window.CCO_PAGE = "dados";

  const SERVICOS_VALIDOS = ["P1", "P2.1", "P2.2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11", "P12"];
  const ESTADO = { pagina: 1, porPagina: 500, dados: [] };

  function texto(v){ return String(v ?? "").trim(); }
  function normalizarServico(v){
    const valor=texto(v).toUpperCase().replace(/\s+/g,"").replace(/^PROGRAMA[-_]?/,"P").replace(/^P[-_]?/,"P").replace(/^P(\d+)[,_-](\d+)$/,"P$1.$2");
    const m=valor.match(/^P(0*(?:1[0-2]|[1-9]))(?:[.]?([12]))?$/);
    return m?`P${Number(m[1])}${m[2]?`.${Number(m[2])}`:""}`:valor;
  }
  function n(v){
    if (typeof numero === "function") return numero(v);
    const s = String(v ?? 0).replace(/\./g, "").replace(",", ".");
    return Number(s) || 0;
  }
  function dataBR(v){
    const valor = texto(v);
    if (!valor) return "-";
    if (typeof formatarDataBRSimples === "function") return formatarDataBRSimples(valor);
    const [ano, mes, dia] = valor.slice(0, 10).split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
  }
  function numeroBR(v, casas = 2){ return n(v).toLocaleString("pt-BR", { maximumFractionDigits: casas, minimumFractionDigits: casas }); }

  function obterOperacoesBase(){
    const base = Array.isArray(window.dadosBaseAtiva) && window.dadosBaseAtiva.length
      ? window.dadosBaseAtiva
      : (Array.isArray(window.operacoesOriginal) && window.operacoesOriginal.length ? window.operacoesOriginal : window.operacoes || []);

    return (base || []).filter(item => SERVICOS_VALIDOS.includes(normalizarServico(item.servico || item.Servico)));
  }

  function aplicarFiltros(dados){
    const busca = typeof normalizar === "function" ? normalizar(document.getElementById("busca")?.value || "") : texto(document.getElementById("busca")?.value || "").toLowerCase();
    const filtroPrograma = document.getElementById("filtroPrograma")?.value || "Todos";
    const filtroStatus = document.getElementById("filtroStatus")?.value || "Todos";
    const filtroData = document.getElementById("filtroDataBase")?.value || "";

    return dados.filter(item => {
      const servico = normalizarServico(item.servico || item.Servico);
      const data = texto(item.data_normalizada || item.data || item.Data);
      const status = texto(item.status || item.Status || "Com dados");
      const bruto = Object.values(item || {}).join(" ");
      const txt = typeof normalizar === "function" ? normalizar(bruto) : bruto.toLowerCase();

      return (!busca || txt.includes(busca)) &&
        (filtroPrograma === "Todos" || servico === filtroPrograma) &&
        (filtroStatus === "Todos" || status === filtroStatus) &&
        (!filtroData || data.slice(0, 10) === filtroData);
    });
  }

  function garantirPaginador(){
    let div = document.getElementById("paginacaoDados");
    if (div) return div;
    const tabela = document.getElementById("tabelaDados");
    if (!tabela) return null;
    div = document.createElement("div");
    div.id = "paginacaoDados";
    div.className = "paginacao-dados";
    div.style.cssText = "display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap;margin:12px 0;font-weight:800;";
    tabela.parentElement?.insertBefore(div, tabela.parentElement.firstChild);
    return div;
  }

  function renderPaginador(total){
    const div = garantirPaginador();
    if (!div) return;
    const totalPaginas = Math.max(1, Math.ceil(total / ESTADO.porPagina));
    ESTADO.pagina = Math.min(Math.max(1, ESTADO.pagina), totalPaginas);
    div.innerHTML = `
      <span>Registros: ${total.toLocaleString("pt-BR")}</span>
      <button class="btn-mini" id="dadosAnterior" ${ESTADO.pagina <= 1 ? "disabled" : ""}>◀ Anterior</button>
      <span>Página ${ESTADO.pagina} de ${totalPaginas}</span>
      <button class="btn-mini" id="dadosProxima" ${ESTADO.pagina >= totalPaginas ? "disabled" : ""}>Próxima ▶</button>
      <select id="dadosPorPagina" style="width:auto;min-width:110px;">
        <option value="250" ${ESTADO.porPagina===250?'selected':''}>250 linhas</option>
        <option value="500" ${ESTADO.porPagina===500?'selected':''}>500 linhas</option>
        <option value="1000" ${ESTADO.porPagina===1000?'selected':''}>1000 linhas</option>
      </select>
    `;
    document.getElementById("dadosAnterior")?.addEventListener("click", () => { ESTADO.pagina--; renderTabelaDadosCompleta(false); });
    document.getElementById("dadosProxima")?.addEventListener("click", () => { ESTADO.pagina++; renderTabelaDadosCompleta(false); });
    document.getElementById("dadosPorPagina")?.addEventListener("change", e => { ESTADO.porPagina = Number(e.target.value) || 500; ESTADO.pagina = 1; renderTabelaDadosCompleta(false); });
  }

  async function renderTabelaDadosCompleta(resetPagina = true) {
    const tabela = document.getElementById("tabelaDados");
    if (!tabela) return;

    const loading = document.getElementById("loadingOverlay");
    if (loading) loading.style.display = "flex";

    try {
      if (!window.operacoes || !window.operacoes.length) {
        const periodo=await window.CCOPainelService.ultimoPeriodo();
        if(!periodo)throw new Error("Nenhum período ativo disponível.");
        const registros=await window.CCOKpiService.operacoes(periodo.importacao_id);
        window.__CCO_IMPORTACAO_ATIVA__=periodo;
        window.__CCO_PERIODO_ATUAL__=periodo.periodo;
        window.operacoes=registros;window.operacoesOriginal=registros;window.dadosBaseAtiva=registros;
      }

      if (resetPagina) ESTADO.pagina = 1;
      ESTADO.dados = aplicarFiltros(obterOperacoesBase());

      const nomeArquivoHtml = document.getElementById("nomeArquivo");
      if (nomeArquivoHtml) nomeArquivoHtml.textContent = `📂 Base completa: ${ESTADO.dados.length.toLocaleString("pt-BR")} registros válidos P1 a P12.`;

      renderPaginador(ESTADO.dados.length);

      const inicio = (ESTADO.pagina - 1) * ESTADO.porPagina;
      const pagina = ESTADO.dados.slice(inicio, inicio + ESTADO.porPagina);

      const fragmento = document.createDocumentFragment();
      pagina.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${texto(item.servico || item.Servico) || "-"}</strong></td>
          <td>${texto(item.origem || item.Origem) || "-"}</td>
          <td>${dataBR(item.data_normalizada || item.data || item.Data)}</td>
          <td>${texto(item.turno || item.Turno) || "-"}</td>
          <td>${texto(item.ra || item.RA) || "-"}</td>
          <td>${numeroBR(item.peso ?? item.Peso)}</td>
          <td>${n(item.viagens ?? item.Viagens).toLocaleString("pt-BR")}</td>
          <td>${numeroBR(item.km ?? item.KM, 2)}</td>
          <td>${numeroBR(item.equipe ?? item.Equipe, 2)}</td>
        `;
        fragmento.appendChild(tr);
      });

      tabela.innerHTML = "";
      tabela.appendChild(fragmento);
      if (!pagina.length) tabela.innerHTML = `<tr><td colspan="9">Nenhum dado encontrado.</td></tr>`;
    } catch (error) {
      console.error("Erro ao renderizar dados completos:", error);
      tabela.innerHTML = `<tr><td colspan="9">Erro ao carregar a base. Veja o console.</td></tr>`;
    } finally {
      if (loading) loading.style.display = "none";
    }
  }

  window.renderTabelaDados = renderTabelaDadosCompleta;

  function iniciar(){
    window.CCOSupabase.exigirSessao().then(usuario=>{if(!usuario)return;
    if (typeof renderFiltros === "function") renderFiltros();
    renderTabelaDadosCompleta();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();
