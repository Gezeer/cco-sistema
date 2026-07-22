(function criarImportadorService(global) {
  "use strict";
  function invalidarPeriodos(importacoes) {
    global.CCOCache?.invalidar("periodos");
    (importacoes || []).forEach(item => {
      const id = item?.importacao?.id || item?.importacao_id;
      if (!id) return;
      ["painel", "kpi", "analytics"].forEach(ns => global.CCOCache.invalidar(`${ns}:${id}`));
    });
  }
  async function importarArquivo(arquivo, usuario) {
    if (!global.CCOImportacaoPrincipal) throw new Error("Motor de importação não carregado.");
    const resultado = await global.CCOImportacaoPrincipal.importarArquivo(arquivo, usuario);
    invalidarPeriodos(resultado);
    return resultado;
  }
  global.CCOImportadorService = Object.freeze({ importarArquivo, invalidarPeriodos });
})(window);
