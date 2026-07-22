/* Painel Geral - compatível com orquestrador sequencial. */
(function iniciarPaginaPainel(){
  window.CCO_PAGE = "painel";

  async function iniciar(){
    if (window.__CCO_PAINEL_INIT_FORCADO__) return;
    window.__CCO_PAINEL_INIT_FORCADO__ = true;
    try {
      if (typeof inicializarPainelGeralAposLogin === "function") {
        await inicializarPainelGeralAposLogin();
      } else if (typeof carregarBaseSupabase === "function") {
        await carregarBaseSupabase();
      }
    } catch (erro) {
      console.error("Erro ao inicializar Painel Geral:", erro);
    }
  }

  if (window.__CCO_ORQUESTRADOR_ATIVO__) {
    console.log("Painel.js carregado; inicialização será feita pelo orquestrador.");
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();
