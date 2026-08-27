const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const fonte=fs.readFileSync("painel-geral.js","utf8");

test("Painel Geral não baixa operações brutas de P1, P4 ou P12",()=>{
  const inicio=fonte.indexOf("async function buscarOperacoesPainel");
  const fim=fonte.indexOf("async function buscarDatasOperacoesPainel",inicio);
  const consultas=fonte.slice(inicio,fim);
  assert.match(consultas,/valor:\[\.\.\.SERVICOS_EQUIPE\]/);
  assert.match(consultas,/peso_t:peso_t\.sum\(\)/,"P4 deve ser agregado no servidor");
  assert.doesNotMatch(consultas,/colunas:[^\n]*peso_t,km_total/);
  for(const servico of ["P1","P4","P12"])assert.doesNotMatch(consultas,new RegExp(`SERVICOS_EQUIPE[^\\n]*${servico}`));
});

test("boot usa resolvedor em lote, dias por ano/mês e telemetria opt-in",()=>{
  assert.match(fonte,/resolverImportacoesCatalogo\(\[importacao\]\)/);
  assert.doesNotMatch(fonte.slice(fonte.indexOf("async function resolverImportacaoCompletaNovembro2025"),fonte.indexOf("function diagnosticarPrevistosPainel")),/resolverImportacaoPeriodo/);
  assert.match(fonte,/diasOperacaoPorPeriodo\(importacao\.importacao_id,importacao\.ano,importacao\.mes\)/);
  assert.match(fonte,/CCO_DEBUG_PAINEL_PERFORMANCE===true/);
  for(const campo of ["catalogoMs","diasOperacaoMs","painelExecutivoMs","operacoesMs","resolverImportacaoMs","consolidacaoMs","renderMs","totalMs","quantidadeRequests","quantidadeOperacoesBaixadas","quantidadePainelExecutivo","cacheHit","periodo","importacaoId"])assert.match(fonte,new RegExp(campo));
});

test("falhas secundárias têm fallback e resposta obsoleta é descartada",()=>{
  assert.match(fonte,/Promise\.allSettled/);
  assert.match(fonte,/operações de equipe \(fallback executivo\)/);
  assert.match(fonte,/agregado P4 \(fallback executivo\)/);
  assert.ok((fonte.match(/if\(token!==estado\.token\)return/g)||[]).length>=2);
  assert.match(fonte,/quantidadeRenders\+=1/);
});

test("Painel publica telemetria padronizada somente em debug",()=>{
  assert.match(fonte,/CCO_DEBUG_PAINEL_PERFORMANCE!==true/);
  assert.match(fonte,/window\.__CCO_PERF__\.painel=relatorio/);
  assert.match(fonte,/console\.log\("PAINEL_START"\)/);
  for(const campo of ["catalogoMs","diasOperacaoMs","painelExecutivoMs","operacoesMs","resolverMs","consolidacaoMs","renderMs","totalMs","requests","registros","cacheHits"])assert.match(fonte,new RegExp(campo));
});
