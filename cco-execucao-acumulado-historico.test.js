const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");

function carregarMetricas(){const contexto={window:{},console};contexto.window.window=contexto.window;vm.createContext(contexto);vm.runInContext(fs.readFileSync("cco-metricas.js","utf8"),contexto);return contexto.window.CCOMetricas;}

test("P1 agosto/2026 preserva 5.239,29 e nunca converte campo ausente em resultado válido",()=>{
  const metricas=carregarMetricas(),registros=[5239,0.29].map((peso_t,indice)=>({importacao_id:"agosto",servico:"P1",data_operacao:`2026-08-${String(indice+1).padStart(2,"0")}`,peso_t}));
  assert.equal(metricas.calcularAcumuladoP1Periodo({ano:2026,mes:8,importacaoId:"agosto",registros}),5239.29);
  const fonte=fs.readFileSync("execucao.js","utf8");
  assert.match(fonte,/servico==="P4"\|\|servico==="P1"\?"id,importacao_id,servico,tipo_servico,data_operacao,peso_t"/);
});

test("P2.1 usa agregado normalizado e mantém acumulado 233",()=>{
  const contexto={window:{}},fonteComparativo=fs.readFileSync("js/cco-execucao-comparativo.js","utf8");vm.createContext(contexto);vm.runInContext(fonteComparativo,contexto);
  const resultado=contexto.window.CCOExecucaoComparativoMensal.montar({catalogo:[{ano:2026,mes:8,importacao_id:"agosto"}],linhas:[{ano:2026,mes:8,importacao_id:"agosto",servico:"P2.1",previsto:780,acumulado:233}]});
  assert.deepEqual([...resultado.previstos],[780]);assert.deepEqual([...resultado.acumulados],[233]);
  const fonte=fs.readFileSync("execucao.js","utf8");assert.match(fonte,/normalizarServicoHistorico/);assert.doesNotMatch(fonte,/select\("importacao_id,ano,mes,servico,acumulado"\)[^;]+\.eq\("servico",servico\)/);
});

test("ausência de lookup permanece null em todos os meses",()=>{
  const contexto={window:{}};vm.createContext(contexto);vm.runInContext(fs.readFileSync("js/cco-execucao-comparativo.js","utf8"),contexto);
  const catalogo=Array.from({length:10},(_,indice)=>({ano:indice<2?2025:2026,mes:indice<2?11+indice:indice-1,importacao_id:`id-${indice}`})),linhas=[{ano:2025,mes:11,importacao_id:"id-0",previsto:21223,acumulado:5239.29}];
  const resultado=contexto.window.CCOExecucaoComparativoMensal.montar({catalogo,linhas});assert.equal(resultado.acumulados[0],5239.29);assert.ok(resultado.acumulados.slice(1).every(valor=>valor===null));
});
