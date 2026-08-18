const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

test("histórico usa dois produtores Supabase em lote, sem N+1",()=>{
  const fonte=fs.readFileSync("services/painelService.js","utf8");
  const inicio=fonte.indexOf("async function resolverImportacoesCatalogo");
  const fim=fonte.indexOf("async function ultimoPeriodo",inicio);
  const lote=fonte.slice(inicio,fim);
  const produtores=[...lote.matchAll(/CCOSupabase\.paginar\(/g)];
  assert.equal(produtores.length,2,"o resolvedor em lote deve ter exatamente dois produtores paginados");
  assert.match(lote,/Promise\.allSettled/);
  assert.doesNotMatch(lote,/faltantes\.map\([^)]*resolverImportacaoPeriodo/);
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
