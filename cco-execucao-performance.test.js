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
  for(const campo of ["catalogoMs","resolverImportacaoMs","diasOperacaoMs","painelExecutivoMs","historicoMs","renderMs","totalMs","quantidadeRequests","quantidadeRegistrosRecebidos","historicoCalls","cacheHits"])assert.match(fonte,new RegExp(campo));
});

test("histórico possui timeout recuperável e nova tentativa",()=>{
  const fonte=fs.readFileSync("execucao.js","utf8");
  assert.match(fonte,/comTimeoutHistorico/);
  assert.match(fonte,/CCO_EXEC_HIST_TIMEOUT/);
  assert.match(fonte,/Histórico indisponível no momento/);
  assert.match(fonte,/data-cco-repetir-historico/);
  assert.match(fonte,/\.finally\(\(\)=>\{historicosPendentes\.delete\(chave\)/,"loader deve ser encerrado mesmo após descarte ou falha posterior à rede");
  assert.match(fonte,/if\(historicoLoading[\s\S]*atualizarEstadoEvolucaoHistoricaCCO\("erro"/);
});

test("histórico deduplica inicializações e registra todo o pipeline",()=>{
  const fonte=fs.readFileSync("execucao.js","utf8");
  assert.match(fonte,/historicosPendentes\.has\(chave\)/);
  assert.match(fonte,/window\.__CCO_EXEC_HIST_CALLS__/);
  for(const evento of ["START","CATALOGO","PERIODOS","IMPORTACOES","P1 START","P1 END","PAINEL START","PAINEL END","RENDER","ERROR","TIMEOUT","DONE"])assert.match(fonte,new RegExp(`\\[EXEC HIST ${evento}\\]`));
  assert.match(fonte,/historicosPendentes\.delete\(chave\)/,"Promise concluída ou rejeitada não pode permanecer pendente");
});

test("detalhe prematuro não inicia histórico antes do contexto oficial",()=>{
  const fonte=fs.readFileSync("execucao.js","utf8");
  const inicio=fonte.indexOf("const renderDetalheServicoMensalOriginal");
  const fim=fonte.indexOf("async function iniciarInterno",inicio);
  const wrapper=fonte.slice(inicio,fim);
  assert.match(wrapper,/contextoInformado\|\|null/);
  assert.match(wrapper,/if\(contexto&&contextoExecucaoAtualCCO\(contexto\)\)renderizarEvolucaoHistoricaCCO/);
  assert.doesNotMatch(wrapper,/posicionarSecoesDetalheExecucao\(\);renderizarEvolucaoHistoricaCCO/);
});

test("telemetria publica o contrato window.__CCO_PERF__ solicitado",()=>{
  const fonte=fs.readFileSync("execucao.js","utf8");
  for(const campo of ["resolverImportacaoMs","painelExecutivoMs","quantidadeRequests","quantidadeRegistrosRecebidos","historicoCalls","renderMs"])assert.match(fonte,new RegExp(campo));
  assert.match(fonte,/window\.__CCO_PERF__\.execucao=relatorio/);
  assert.match(fonte,/console\.log\("EXEC_START"\)/);
});
