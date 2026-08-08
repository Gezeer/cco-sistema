const fs=require("node:fs");
const assert=require("node:assert/strict");

const service=fs.readFileSync("services/kpiService.js","utf8");
const kpi=fs.readFileSync("kpi.js","utf8");
const fixes=fs.readFileSync("cco-fixes.js","utf8");
const html=fs.readFileSync("kpi.html","utf8");

assert.match(service,/window\.__CCO_KPI_DADOS_PROMISES__|global\.__CCO_KPI_DADOS_PROMISES__/);
assert.match(service,/global\.__CCO_KPI_DADOS_CACHE__/);
assert.match(service,/const TTL=5\*60\*1000/);
assert.match(service,/CCOPageDataCache\?\.obter/);
assert.match(service,/contexto=\{pagina:"kpi",ano:ano\|\|"",mes:mes\|\|"",servico,importacaoId:importacaoId\|\|"",dia\}/);
assert.equal((service.match(/from\("operacoes"\)/g)||[]).length,1,"deve existir uma única consulta principal de operações");
assert.doesNotMatch(service,/select\("\*"\)/);
for(const campo of["servico","tipo_servico","data_operacao","peso_t","viagens","km_total","velocidade_media","qtd_equipe","equipe","executado","turno","ra","importacao_id"])assert.ok(service.includes(campo));
assert.match(service,/document\?\.addEventListener\?\.\("cco:importacao-concluida",invalidarCache/);

assert.match(kpi,/new IntersectionObserver\([\s\S]*rootMargin:"200px 0px"/);
for(const id of["graficoKpiServicoMensal","graficoKpiServicoIndicadores","graficoKpiComparativoMensal","graficoKpiProdutividadeMensal","graficoKpiVelocidadeMediaMensal"])assert.ok(kpi.includes(id));
assert.match(kpi,/dataset\.ccoLazyEstado="aguardando"/);
assert.match(kpi,/estado\.estado="renderizado"/);
assert.match(kpi,/catch\(error\)\{estado\.estado="aguardando"/,"falha de dimensão/render deve permanecer pendente");
assert.match(kpi,/container\.__ccoKpiDataset===assinatura/,"dataset idêntico deve reutilizar instância");
assert.match(kpi,/function consolidarDadosKPI\(registros,mensal,contexto=/);
assert.match(kpi,/const consolidado=consolidarDadosKPI\(dados,mensal,/);
assert.match(kpi,/window\.__CCO_KPI_INICIALIZADO__=true/);
assert.match(kpi,/window\.__CCO_KPI_LISTENERS__/);
assert.match(kpi,/\[KPI PERFORMANCE\]\[\$\{etapa\}\]/);
for(const etapa of["INÍCIO","CATÁLOGO","OPERAÇÕES","CARDS","TOTAL"])assert.ok(kpi.includes(`\"${etapa}\"`)||kpi.includes(`"${etapa}"`));
assert.match(fixes,/setTimeout\(trocarKpi,275\)/,"mudanças consecutivas devem usar debounce");
assert.match(fixes,/\[KPI RESPOSTA DESCARTADA\]/);
assert.match(fixes,/tokenKpi!==window\.__CCO_KPI_SEQUENCIA__/);
assert.match(kpi,/renderVelocidade\(dados\)/,"velocidade deve consumir os registros compartilhados");
assert.doesNotMatch(kpi,/from\(["']operacoes["']\)/,"renderizadores não podem consultar operações");

assert.match(html,/services\/kpiService\.js\?v=20260807-performance-boot-v2/);
assert.match(html,/cco-fixes\.js\?v=20260806-kpi-init-mes-sincronizado-v2/);
assert.match(html,/kpi\.js\?v=20260806-kpi-producao-altura-v3/);

console.log("KPI performance: consulta única, Promise/cache, lazy render, debounce, token e cache-buster aprovados.");
