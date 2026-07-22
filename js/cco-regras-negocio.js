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

  const EQUIPES_FIXAS = Object.freeze({ "P3":12, "P7":2, "P8":2, "P9":11, "P10":3, "P11":1 });

  function chavePeriodo(ano, mes) {
    return `${Number(ano)}-${String(Number(mes)).padStart(2, "0")}`;
  }

  function obterDiasOperacao(ano, mes) {
    const chave = chavePeriodo(ano, mes);
    const dias = DIAS_OPERACAO[chave] ?? 0;
    if (!dias) console.warn(`Dias de operação não configurados para ${chave}`);
    return dias;
  }

  function obterValorServico(servico) { return Number(VALORES_SERVICOS[String(servico || "").toUpperCase()] ?? 0); }
  function obterEquipeFixa(servico) { return EQUIPES_FIXAS[String(servico || "").toUpperCase()] ?? null; }
  function calcularPrevistoEquipeFixa(servico) {
    const equipe = obterEquipeFixa(servico);
    return equipe !== null ? Number(equipe) : 0;
  }
  function calcularPrevisto(servico, ano, mes, previstoAtual = 0, diasOrigem = 0) {
    if (obterEquipeFixa(servico) !== null) return calcularPrevistoEquipeFixa(servico);
    const dias = obterDiasOperacao(ano, mes);
    if (!dias) return 0;
    const previsto = Number(previstoAtual) || 0, baseDias = Number(diasOrigem) || dias;
    return previsto > 0 && baseDias > 0 ? previsto * dias / baseDias : previsto;
  }

  global.CCO_REGRAS = Object.freeze({
    DIAS_OPERACAO, VALORES_SERVICOS, EQUIPES_FIXAS,
    obterDiasOperacao, obterValorServico, obterEquipeFixa, calcularPrevistoEquipeFixa, calcularPrevisto
  });
})(typeof window !== "undefined" ? window : globalThis);
