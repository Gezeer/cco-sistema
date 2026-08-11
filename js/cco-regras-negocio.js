(function definirRegrasNegocioCCO(global) {
  "use strict";

  const DIAS_OPERACAO = Object.freeze({
    "2025-11": 18,
    "2025-12": 26,
    "2026-01": 26,
    "2026-02": 24,
    "2026-03": 26,
    "2026-04": 26,
    "2026-05": 24,
    "2026-06": 26,
    "2026-07": 27
  });

  const VALORES_SERVICOS = Object.freeze({
    "P1": 296.00, "P2.1": 1027.42, "P2.2": 1027.42,
    "P3": 41992.93, "P4": 68.80, "P5": 160.94, "P6": 76.24,
    "P7": 49811.72, "P8": 81001.04, "P9": 122039.23,
    "P10": 346660.01, "P11": 272459.08, "P12": 0.83
  });

  const METAS_BASE_26_DIAS = Object.freeze({
    "P1":21223, "P2.1":780, "P2.2":260, "P4":15779,
    "P5":38541, "P6":9040, "P12":1698432
  });

  const EQUIPES_FIXAS = Object.freeze({ "P3":12, "P7":2, "P8":2, "P9":11, "P10":3, "P11":1 });
  const DIAS_OPERACAO_BANCO = new Map();
  if(global.CCO_DEBUG_AGOSTO===undefined)global.CCO_DEBUG_AGOSTO=true;

  function chavePeriodo(ano, mes) {
    return `${Number(ano)}-${String(Number(mes)).padStart(2, "0")}`;
  }

  function obterDiasOperacao(ano, mes) {
    const chave = chavePeriodo(ano, mes);
    const dias = DIAS_OPERACAO_BANCO.get(chave) ?? DIAS_OPERACAO[chave] ?? 0;
    if (!dias) console.warn(`Dias de operação não configurados para ${chave}`);
    return dias;
  }
  function registrarDiasOperacao(registros=[]) { for(const item of registros){const total=Number(item?.total_dias);if(Number.isInteger(total)&&total>0)DIAS_OPERACAO_BANCO.set(chavePeriodo(item.ano,item.mes),total);}return DIAS_OPERACAO_BANCO.size; }

  function obterValorServico(servico) { return Number(VALORES_SERVICOS[String(servico || "").toUpperCase()] ?? 0); }
  function obterEquipeFixa(servico) { return EQUIPES_FIXAS[String(servico || "").toUpperCase()] ?? null; }
  function calcularPrevistoEquipeFixa(servico) {
    const equipe = obterEquipeFixa(servico);
    return equipe !== null ? Number(equipe) : 0;
  }
  function calcularPrevisto(servico, anoOuTotalDias, mes, _previstoAtual = 0, totalDiasInformado = 0) {
    const codigo=String(servico||"").trim().toUpperCase(),chamadaDireta=arguments.length===2;
    const dias=chamadaDireta?Number(anoOuTotalDias):(obterDiasOperacao(anoOuTotalDias,mes)||Number(totalDiasInformado)||0);
    const equipe=obterEquipeFixa(codigo),valorBase=METAS_BASE_26_DIAS[codigo]??null;
    const resultado=equipe!==null?Number(equipe):(valorBase!==null&&dias>0?valorBase/26*dias:0);
    if((chamadaDireta&&dias===26)||(Number(anoOuTotalDias)===2026&&Number(mes)===8&&global.CCO_DEBUG_AGOSTO===true))console.log("[REGRA PREVISTO 26 DIAS]",{servico:codigo,periodo:chamadaDireta?null:chavePeriodo(anoOuTotalDias,mes),totalDiasRecebido:dias,regraEncontrada:equipe!==null||valorBase!==null,valorBase:equipe??valorBase,previstoBanco:Number(_previstoAtual)||0,previstoCalculado:resultado,previstoFinal:resultado});
    return resultado;
  }

  global.CCO_REGRAS = Object.freeze({
    DIAS_OPERACAO, VALORES_SERVICOS, METAS_BASE_26_DIAS, EQUIPES_FIXAS,
    registrarDiasOperacao, obterDiasOperacao, obterValorServico, obterEquipeFixa, calcularPrevistoEquipeFixa, calcularPrevisto
  });
})(typeof window !== "undefined" ? window : globalThis);
