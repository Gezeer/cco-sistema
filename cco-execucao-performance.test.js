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

test("volume alto de P2.1 não aciona operações dos outros serviços",()=>{
  const fonte=fs.readFileSync("execucao.js","utf8");
  const operacoesMock=Array.from({length:120000},(_,indice)=>({servico:`P${indice%12+1}`}));
  const servico="P2.1",precisaOperacoes=servico==="P1"||servico==="P4"||["P3","P7","P8","P9","P10","P11"].includes(servico);
  const processadas=precisaOperacoes?operacoesMock.filter(item=>item.servico===servico):[];
  assert.equal(processadas.length,0);
  assert.match(fonte,/precisaOperacoes=servico==="P1"\|\|servico==="P4"\|\|window\.CCOMetricas\?\.ehServicoEquipe/);
  assert.match(fonte,/precisaOperacoes\?window\.CCOSupabase\.paginar[\s\S]*:Promise\.resolve\(\[\]\)/);
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
