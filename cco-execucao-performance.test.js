const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

test("resolvedor usa somente o agregado do painel, sem operações ou N+1",()=>{
  const fonte=fs.readFileSync("services/painelService.js","utf8");
  const inicio=fonte.indexOf("async function resolverImportacoesCatalogo");
  const fim=fonte.indexOf("async function ultimoPeriodo",inicio);
  const lote=fonte.slice(inicio,fim);
  const produtores=[...lote.matchAll(/CCOSupabase\.paginar\(/g)];
  assert.equal(produtores.length,1,"o resolvedor deve paginar somente painel_executivo");
  assert.match(lote,/Promise\.allSettled/);
  assert.doesNotMatch(lote,/from\(`operacoes`\)/);
  assert.doesNotMatch(lote,/faltantes\.map\([^)]*resolverImportacaoPeriodo/);
});

test("histórico de P1 agrega no servidor e nunca transfere milhares de operações",()=>{
  const fonte=fs.readFileSync("execucao.js","utf8");
  const inicio=fonte.indexOf("async function buscarEvolucaoServicoCCO");
  const fim=fonte.indexOf("async function renderizarEvolucaoHistoricaCCO",inicio);
  const historico=fonte.slice(inicio,fim);
  assert.match(historico,/select\("importacao_id,servico,acumulado:peso_t\.sum\(\)"\)/);
  assert.match(historico,/precisaAgregadoOperacoes=servico==="P1"\|\|servico==="P4"/);
  assert.doesNotMatch(historico,/CCOSupabase\.paginar/,"P1 não pode paginar operações brutas no histórico");
  assert.doesNotMatch(historico,/select\([^)]*data_operacao|select\(colunasOperacoes\)/,"P1 não pode selecionar linhas operacionais");
  assert.match(historico,/operacoesCarregadas:0/);
  assert.match(historico,/paginasOperacoes:0/);
  const importacoes=Array.from({length:10},(_,indice)=>`imp-${indice}`);
  const respostaAgregada=importacoes.map((importacao_id,indice)=>({importacao_id,servico:"P1",acumulado:String(1000+indice)}));
  assert.equal(respostaAgregada.length,10,"10 períodos devem produzir no máximo 10 linhas agregadas de P1");
});

test("dias_operacao do catálogo alimenta o cache reutilizado pelo histórico",()=>{
  const fonte=fs.readFileSync("services/painelService.js","utf8");
  assert.match(fonte,/diasOperacaoRegistros\.set\(periodo,item\)/);
  assert.match(fonte,/if\(salvo\)\{perf\("cacheHits"\)/);
});

test("telemetria só publica com a flag explícita",()=>{
  const fonte=fs.readFileSync("execucao.js","utf8");
  assert.match(fonte,/CCO_DEBUG_EXECUCAO_PERFORMANCE===true/);
  for(const campo of ["authMs","catalogoMs","resolverPeriodoMs","diasOperacaoMs","painelMs","operacoesMs","cardsMs","historicoMs","graficosMs","totalMs","requestsSupabase","cacheHits"])assert.match(fonte,new RegExp(campo));
});

test("histórico possui timeout recuperável e nova tentativa",()=>{
  const fonte=fs.readFileSync("execucao.js","utf8");
  assert.match(fonte,/comTimeoutHistorico/);
  assert.match(fonte,/CCO_EXEC_HIST_TIMEOUT/);
  assert.match(fonte,/Histórico indisponível no momento/);
  assert.match(fonte,/data-cco-repetir-historico/);
});
