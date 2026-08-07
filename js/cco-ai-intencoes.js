(function criarIntencoesCCO(global){
  "use strict";
  const MAPA=Object.freeze({consultar_servico:"ANALISAR_SERVICO",consultar_p12:"ANALISAR_SERVICO",comparar_periodos:"COMPARAR_PERIODOS",ranking_servicos:"RANKING_SERVICOS",ranking_financeiro:"RANKING_SERVICOS",ranking_ra:"ANALISAR_RA",ranking_turnos:"ANALISAR_TURNO",evolucao_mensal:"GERAR_GRAFICO",resumo_diretoria:"RESUMO_EXECUTIVO",resumo_geral:"RESUMO_EXECUTIVO",anomalias:"DETECTAR_ANOMALIA",consultar_valor:"CALCULAR",consultar_velocidade:"CALCULAR",pergunta_livre:"CONSULTA_GERAL"});
  function detectarIntencaoCCO(pergunta,{catalogo=[],contexto={}}={}){const plano=global.CCOAnalyticsIntencoes.interpretar(pergunta,{catalogo,contexto});const intencao=MAPA[plano.intencao]||"CONSULTA_GERAL";const resultado={...plano,intencao,acaoOriginal:plano.intencao};if(global.CCO_DEBUG_ANALYTICS_AI===true)console.log("[CCO AI INTENÇÃO]",resultado);return resultado;}
  global.CCOAIIntencoes=Object.freeze({detectarIntencaoCCO,INTENCOES:Object.freeze([...new Set(Object.values(MAPA))])});
  global.detectarIntencaoCCO=detectarIntencaoCCO;
})(window);
