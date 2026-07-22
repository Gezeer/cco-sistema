(function configurarRegrasCCO() {
  "use strict";

  const regras = new Map();
  let carregamento = null;

  window.CCO_VALORES_FIXOS = Object.create(null);
  window.CCO_EQUIPES_FIXAS = Object.create(null);

  window.normalizarServicoCCO = function normalizarServicoCCO(valor) {
    const texto = String(valor || "").trim().toUpperCase().replace(/\s+/g, "")
      .replace(/^PROGRAMA[-_]?/, "P").replace(/^P[-_]?/, "P")
      .replace(/^P(\d+)[,_-](\d+)$/, "P$1.$2");
    const mapa = {"P01":"P1","P02.1":"P2.1","P021":"P2.1","P02.2":"P2.2","P022":"P2.2","P03":"P3","P04":"P4","P05":"P5","P06":"P6","P07":"P7","P08":"P8","P09":"P9","P010":"P10","P011":"P11","P012":"P12"};
    return mapa[texto] || texto;
  };

  window.numeroSeguroCCO = function numeroSeguroCCO(valor) {
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
    const texto = String(valor ?? "").trim().replace(/\s/g, "").replace(/R\$/gi, "").replace(/%/g, "");
    if (!texto) return 0;
    let normalizado = texto;
    if (texto.includes(",") && texto.includes(".")) normalizado = texto.replace(/\./g, "").replace(",", ".");
    else if (texto.includes(",")) normalizado = texto.replace(",", ".");
    else if (/^[-+]?\d{1,3}(?:\.\d{3})+$/.test(texto)) normalizado = texto.replace(/\./g, "");
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  };

  window.obterValorFixoCCO = function obterValorFixoCCO(servico) {
    const codigo = window.normalizarServicoCCO(servico);
    const valor = regras.get(codigo)?.valor_unitario;
    if (!Number.isFinite(valor)) {
      console.error(`[CCO] Valor fixo não encontrado para ${codigo}.`);
      return 0;
    }
    return valor;
  };

  window.obterAcumuladoCCO = function obterAcumuladoCCO(item) {
    const servico = window.normalizarServicoCCO(item?.servico);
    const acumulado = servico === "P12"
      ? window.numeroSeguroCCO(item?.executado ?? item?.acumulado ?? item?.acumulado_mes ?? 0)
      : window.numeroSeguroCCO(item?.acumulado ?? item?.acumulado_mes ?? item?.executado ?? 0);
    return window.aplicarTetoEquipeCCO(servico, acumulado);
  };

  window.obterEquipeFixaCCO = function obterEquipeFixaCCO(servico) {
    const codigo = window.normalizarServicoCCO(servico);
    return regras.get(codigo)?.equipe_fixa_painel ?? null;
  };

  window.aplicarTetoEquipeCCO = function aplicarTetoEquipeCCO(servico, acumuladoReal) {
    const codigo = window.normalizarServicoCCO(servico);
    const previsto = Number(window.CCO_EQUIPES_FIXAS?.[codigo]);
    const acumulado = window.numeroSeguroCCO(acumuladoReal);
    if (!Number.isFinite(previsto) || previsto <= 0) return acumulado;
    return Math.min(acumulado, previsto);
  };

  window.obterPrevistoCCO = function obterPrevistoCCO(item) {
    const servico = window.normalizarServicoCCO(item?.servico);
    const previsto = window.numeroSeguroCCO(item?.previsto ?? item?.previsto_mes ?? 0);
    if (item?.ano && item?.mes) return window.CCO_REGRAS.calcularPrevisto(servico,item.ano,item.mes,previsto,item?.total_dias_mes);
    return previsto;
  };

  window.calcularPercentualExecucaoCCO = function calcularPercentualExecucaoCCO(item) {
    const acumulado = window.obterAcumuladoCCO(item);
    const previsto = window.obterPrevistoCCO(item);
    if (!previsto || previsto <= 0) return 0;
    return (acumulado / previsto) * 100;
  };

  window.calcularValorTotalCCO = function calcularValorTotalCCO(item) {
    return window.obterAcumuladoCCO(item) * window.obterValorFixoCCO(item?.servico);
  };

  window.formatarMoedaCCO = function formatarMoedaCCO(valor) {
    return window.numeroSeguroCCO(valor).toLocaleString("pt-BR", {style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2});
  };

  window.carregarRegrasServicosCCO = async function carregarRegrasServicosCCO(forcar = false) {
    if (regras.size && !forcar) return regras;
    if (carregamento && !forcar) return carregamento;
    carregamento = (async () => {
      if (!window.CCO_REGRAS) throw new Error("Regras de negócio compartilhadas não foram carregadas.");
      regras.clear();
      Object.keys(window.CCO_VALORES_FIXOS).forEach(chave => delete window.CCO_VALORES_FIXOS[chave]);
      Object.keys(window.CCO_EQUIPES_FIXAS).forEach(chave => delete window.CCO_EQUIPES_FIXAS[chave]);
      Object.entries(window.CCO_REGRAS.VALORES_SERVICOS).forEach(([servico, valor], indice) => {
        const codigo = window.normalizarServicoCCO(servico);
        const equipe = window.CCO_REGRAS.obterEquipeFixa(codigo);
        const regra = { servico:codigo, ordem:indice + 1, ativo:true, valor_unitario:valor, equipe_fixa_painel:equipe };
        regras.set(codigo, regra);
        window.CCO_VALORES_FIXOS[codigo] = regra.valor_unitario;
        if (regra.equipe_fixa_painel != null) window.CCO_EQUIPES_FIXAS[codigo] = regra.equipe_fixa_painel;
      });
      if (regras.size !== 13) throw new Error(`regras_servicos retornou ${regras.size} serviços; esperado: 13.`);
      return regras;
    })();
    try { return await carregamento; } finally { carregamento = null; }
  };

  window.CCORegrasServicos = Object.freeze({ carregar:window.carregarRegrasServicosCCO, obter:servico => regras.get(window.normalizarServicoCCO(servico)) || null });
})();
