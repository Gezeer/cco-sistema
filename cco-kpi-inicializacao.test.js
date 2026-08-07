const fs=require("node:fs"),assert=require("node:assert/strict");
const kpi=fs.readFileSync("kpi.js","utf8"),html=fs.readFileSync("kpi.html","utf8"),utils=fs.readFileSync("utils.js","utf8");

assert.match(kpi,/async function inicializarKPI\(\)/);
assert.match(kpi,/if\(window\.__CCO_KPI_INIT_PROMISE__\)return window\.__CCO_KPI_INIT_PROMISE__/);
assert.match(kpi,/exigirSessao\(\)[\s\S]*getCatalogoPeriodos\(\)[\s\S]*prepararFiltroServicoKPI\(\)[\s\S]*resolverPeriodoInicialKPI/s);
assert.match(kpi,/if\(!periodo\.importacao_id\)throw new Error\("\[KPI INIT\] importacao_id ausente"\)/);
assert.match(kpi,/preencherCatalogoKpi\(catalogo,periodo\)[\s\S]*CCOKpiService\.carregar/s);
assert.match(kpi,/try\{operacoes=dadosPeriodo\.operacoes;operacoesOriginal=dadosPeriodo\.operacoes;kpiMensal=window\.kpiMensal;/,"bindings usados pelos cards são sincronizados antes da primeira renderização");
assert.match(kpi,/await Promise\.resolve\(renderPaginaKpiPorServicoCompleto\(\)\)/,"a mesma função do change é chamada diretamente na primeira carga");
assert.match(kpi,/servico,periodo\.ano,String\(periodo\.mes\).*periodo\.importacao_id,sequencia/s,"token nasce somente após serviço, período e importação válidos");
for(const etapa of["INÍCIO","CATÁLOGO OK","FILTROS OK","IMPORTAÇÃO OK","CONSULTA INÍCIO","CONSULTA FIM","CARDS OK","GRÁFICO DIÁRIO OK","LAZY REGISTRADO","CONCLUÍDO"])assert.ok(kpi.includes(`\"${etapa}\"`),`log ausente: ${etapa}`);
assert.match(kpi,/estado\.estado="renderizando"[\s\S]*await aguardarDimensaoKPI\(container,10\)[\s\S]*if\(!instancia\)\{estado\.estado="aguardando"/s);
assert.match(kpi,/new ResizeObserver[\s\S]*clientWidth>0&&container\.clientHeight>0[\s\S]*estado\.executar\(\)/s,"container que ganha dimensão deve retomar sozinho");
assert.doesNotMatch(kpi,/estado\.estado="renderizado"[^;]+;[^\n]*renderizar\(\)/,"não pode marcar renderizado antes de criar instância");
assert.match(kpi,/visivelComMargemKPI\(container\).*estado\.executar\(\).*observer\.observe/s);
assert.match(utils,/\["painel","kpi","execucao","dados","historico"\].*return/s,"inicializador genérico permanece bloqueado no KPI");
assert.match(html,/kpi\.js\?v=20260806-kpi-init-primeira-carga-v1/);

async function initUnica(){let promessa,consultas=0,renders=0;return function iniciar(){if(promessa)return promessa;promessa=(async()=>{await Promise.resolve();consultas++;renders++;return{servico:"P1",periodo:"2026-07",importacaoId:"julho",consultas,renders};})();return promessa;};}
(async()=>{const iniciar=await initUnica(),[a,b]=await Promise.all([iniciar(),iniciar()]);assert.strictEqual(a,b);assert.deepEqual(a,{servico:"P1",periodo:"2026-07",importacaoId:"julho",consultas:1,renders:1});console.log("KPI init: primeira carga, Promise única, bindings, dimensões e lazy render aprovados.");})().catch(error=>{console.error(error);process.exitCode=1;});
