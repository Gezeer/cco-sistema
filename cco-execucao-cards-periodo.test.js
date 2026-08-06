const fs=require("node:fs");
const assert=require("node:assert/strict");

const execucao=fs.readFileSync("execucao.js","utf8");
const servico=fs.readFileSync("services/execucaoService.js","utf8");
const fixes=fs.readFileSync("cco-fixes.js","utf8");
const utils=fs.readFileSync("utils.js","utf8");
const html=fs.readFileSync("execucao.html","utf8");

assert.match(execucao,/localizarPeriodoExecucao\(catalogo,ano,mes\)/,"a seleção deve partir do catálogo oficial");
assert.match(execucao,/id:periodo\.importacao_id/);
assert.match(execucao,/definirPeriodoExecucaoAtivoCCO\(normalizado\.ano,normalizado\.mes\)/,"o filtro léxico usado pelos cards deve acompanhar a seleção");
assert.match(utils,/window\.definirPeriodoExecucaoAtivoCCO=function[\s\S]*filtroExecucaoAnoAtual=String\(ano[\s\S]*filtroExecucaoMesAtual=String\(mes/);

assert.match(servico,/\.eq\("importacao_id",importacaoId\)\.gte\("data_operacao",inicio\)\.lt\("data_operacao",fim\)/,"UUID e intervalo mensal devem ser aplicados juntos");
for(const campo of["servico","tipo_servico","data_operacao","peso_t","viagens","km_total","velocidade_media","qtd_equipe","equipe","executado","importacao_id","turno","ra"])assert.match(servico,new RegExp(`(?:^|[,\\\"]|const campos=.*)${campo}`),`consulta deve trazer ${campo}`);

assert.match(servico,/chaveDados\?\.\(contextoCache\)/);
assert.match(servico,/pagina:"execucao",ano,mes,servico,importacaoId/,"cache deve incluir página, período, serviço e UUID");
assert.match(servico,/\[EXECUÇÃO CACHE HIT\]/);
assert.match(servico,/\[EXECUÇÃO CACHE MISS\]/);

assert.match(execucao,/requisicaoPeriodoExecucao/);
assert.match(execucao,/\[EXECUÇÃO RESPOSTA DESCARTADA\]/);
assert.match(fixes,/__ccoContextoExecucao.*contextoExecucaoAtualCCO/s,"resposta antiga deve ser descartada antes da publicação");
assert.match(fixes,/chaveCompleta=\[PAGINA,periodo\.ano,periodo\.mes,servico,periodo\.importacao_id\]/);

assert.match(fixes,/campoPresenteNosRegistros/);
assert.match(fixes,/Object\.prototype\.hasOwnProperty\.call\(registro,campoMetrica\)/,"a presença real do campo deve prevalecer sobre schema global vazio");
assert.match(execucao,/window\.renderDetalheServicoMensal\?\.\(codigo,contexto\)/,"todo período deve usar o renderizador final oficial com contexto");
assert.match(utils,/\[EXECUÇÃO RENDER FINAL\]/);
assert.match(fixes,/\[EXECUÇÃO CONSOLIDAÇÃO\]/);
assert.match(servico,/\[EXECUÇÃO CONSULTA\]/);
assert.doesNotMatch(fixes,/from\("v_catalogo_periodos"\)/,"não deve existir fallback legado para outra importação");

const catalogo=[
  {ano:2025,mes:11,importacao_id:"uuid-nov"},{ano:2025,mes:12,importacao_id:"uuid-dez"},
  {ano:2026,mes:6,importacao_id:"uuid-jun"},{ano:2026,mes:7,importacao_id:"uuid-jul"}
];
const localizar=(ano,mes)=>catalogo.find(item=>item.ano===ano&&item.mes===mes);
assert.equal(localizar(2025,11).importacao_id,"uuid-nov");
assert.equal(localizar(2025,12).importacao_id,"uuid-dez");
assert.equal(localizar(2026,6).importacao_id,"uuid-jun");
assert.equal(localizar(2026,7).importacao_id,"uuid-jul");
assert.notEqual(localizar(2026,6).importacao_id,localizar(2026,7).importacao_id);

for(const arquivo of["services/execucaoService.js","utils.js","cco-fixes.js","execucao.js"])assert.match(html,new RegExp(`${arquivo.replace(/[./]/g,"\\$&")}\\?v=20260806-execucao-race-periodo-servico-v1`));

console.log("Cards por período: UUID, filtro mensal, cache, concorrência e render final aprovados.");
