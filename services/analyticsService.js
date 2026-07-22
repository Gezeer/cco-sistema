(function criarAnalyticsService(global) {
  "use strict";
  async function periodo(importacaoId, filtros = {}) {
    if (!importacaoId) throw new Error("importacao_id é obrigatório para consultar Analytics.");
    const chave = global.CCOCache.chave("analytics", [importacaoId, filtros.servico, filtros.ra, filtros.turno]);
    return global.CCOCache.lembrar(chave, () => global.CCOKpiService.operacoes(importacaoId, filtros), 10 * 60 * 1000);
  }
  global.CCOAnalyticsService = Object.freeze({ periodo });
})(window);
