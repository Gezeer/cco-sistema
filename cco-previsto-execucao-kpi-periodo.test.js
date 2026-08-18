const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");

test("Execução e KPI aguardam dias_operacao e não reutilizam previsto persistido",()=>{
  const fixes=fs.readFileSync("cco-fixes.js","utf8"),execucao=fs.readFileSync("execucao.js","utf8"),kpi=fs.readFileSync("kpi.js","utf8");
  assert.match(fixes,/CCOPainelService\.diasOperacaoPorPeriodo\(periodo\.importacao_id,periodo\.ano,periodo\.mes\)/);
  assert.match(fixes,/calcularPrevisto\(servico,diasOperacao\)/);
  assert.match(fixes,/Dias de operação indisponíveis/);
  assert.doesNotMatch(fixes,/Promise\.resolve\(window\.CCO_REGRAS\.obterDiasOperacao\(periodo\.ano, periodo\.mes\)\)/);
  assert.match(execucao,/diasOperacaoPorPeriodo\(periodo\.importacao_id,periodo\.ano,periodo\.mes\)/);
  assert.match(kpi,/calcularPrevisto\(servico,totalDias\)/);
  assert.doesNotMatch(kpi,/if\(previstoPainel>0\)return previstoPainel/);
  assert.match(fixes,/\[EXECUCAO PREVISTO\]/);assert.match(fixes,/\[KPI PREVISTO\]/);
  assert.match(fixes,/linha\.acumulado_mes\)\/numeroSeguro\(linha\.previsto_mes\)\*100/);
});

test("regra compartilhada mantém previstos proporcionais e fixos",()=>{
  const contexto={window:{},console};contexto.window.window=contexto.window;vm.createContext(contexto);vm.runInContext(fs.readFileSync("js/cco-regras-negocio.js","utf8"),contexto);
  const regras=contexto.window.CCO_REGRAS;
  for(let boot=0;boot<5;boot++){regras.registrarDiasOperacao([{ano:2026,mes:8,total_dias:26}]);assert.equal(regras.calcularPrevisto("P2.1",2026,8),780);assert.equal(regras.calcularPrevisto("P3",2026,8),12);}
  regras.registrarDiasOperacao([{ano:2026,mes:7,total_dias:27},{ano:2027,mes:1,total_dias:25}]);
  assert.equal(regras.calcularPrevisto("P2.1",2026,7),780/26*27);
  assert.equal(regras.calcularPrevisto("P12",2027,1),1698432/26*25);
  assert.ok(Math.abs(233/780*100-29.871794871794872)<1e-12);
});
