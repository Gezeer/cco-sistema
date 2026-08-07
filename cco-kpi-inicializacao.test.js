const fs=require("node:fs"),assert=require("node:assert/strict");
const kpi=fs.readFileSync("kpi.js","utf8"),html=fs.readFileSync("kpi.html","utf8"),utils=fs.readFileSync("utils.js","utf8"),fixes=fs.readFileSync("cco-fixes.js","utf8"),service=fs.readFileSync("services/kpiService.js","utf8");

assert.match(kpi,/async function inicializarKPI\(\)/);
assert.match(kpi,/if\(window\.__CCO_KPI_INIT_PROMISE__\)return window\.__CCO_KPI_INIT_PROMISE__/);
assert.match(kpi,/exigirSessao\(\)[\s\S]*getCatalogoPeriodos\(\)[\s\S]*prepararFiltroServicoKPI\(\)[\s\S]*resolverPeriodoInicialKPI/s);
assert.match(kpi,/if\(!periodo\.importacao_id\)throw new Error\("\[KPI INIT\] importacao_id ausente"\)/);
assert.match(kpi,/preencherCatalogoKpi\(catalogo,periodo\)[\s\S]*window\.aplicarMesKPI\(\{/s);
assert.match(kpi,/origem:"init"/,"a inicialização usa o aplicador central de mês");
assert.match(fixes,/async function trocarKpi\(\)\{return aplicarMesKPI\(\{origem:"change"\}\);\}/,"o change usa o mesmo aplicador central");
assert.match(fixes,/const periodoPublicado=await carregarPeriodo[\s\S]*if\(periodoPublicado===false\)[\s\S]*return false/s,"resposta antiga não pode publicar nem renderizar");
assert.match(fixes,/publicarPeriodo\(linhas, painelLinhas, periodo, diasOperacao\)/,"o caminho central publica os bindings oficiais");
assert.match(utils,/window\.definirPeriodoKPIAtivo=function definirPeriodoKPIAtivo/);
assert.match(utils,/__CCO_KPI_CONTEXTO_PERIODO__/);
assert.match(service,/\["kpi",ano\|\|"",mes\|\|"",servico,importacaoId\|\|"",dia\]/);
assert.match(kpi,/definirPeriodoKPIAtivo[\s\S]*const sequencia=\+\+sequenciaCargaKPI,token=\[servico,contextoInicial\.periodo,contextoInicial\.importacaoId,sequencia\]/s,"token nasce somente após serviço, período e importação válidos");
for(const etapa of["INÍCIO","CATÁLOGO OK","SERVIÇO OK","ANO OK","MÊS OK","FILTROS OK","IMPORTAÇÃO OK","CONSULTA INÍCIO","CONSULTA FIM","PERÍODO SINCRONIZADO","DADOS OK","CARDS OK","GRÁFICO DIÁRIO OK","LAZY REGISTRADO","RENDER OK","CONCLUÍDO"])assert.ok(kpi.includes(`\"${etapa}\"`),`log ausente: ${etapa}`);
for(const log of["[KPI MÊS INIT]","[KPI MÊS CHANGE]","[KPI MÊS SINCRONIZAÇÃO]","[KPI MÊS RENDER]","[KPI INIT CACHE]","[KPI GRÁFICO INIT]"])assert.ok(`${kpi}\n${fixes}\n${service}`.includes(log),`diagnóstico ausente: ${log}`);
assert.match(kpi,/estado\.estado="renderizando"[\s\S]*await aguardarDimensaoKPI\(container,10\)[\s\S]*if\(!instancia\)\{estado\.estado="aguardando"/s);
assert.match(kpi,/new ResizeObserver[\s\S]*clientWidth>0&&container\.clientHeight>0[\s\S]*estado\.executar\(\)/s,"container que ganha dimensão deve retomar sozinho");
assert.doesNotMatch(kpi,/estado\.estado="renderizado"[^;]+;[^\n]*renderizar\(\)/,"não pode marcar renderizado antes de criar instância");
assert.match(kpi,/visivelComMargemKPI\(container\).*estado\.executar\(\).*observer\.observe/s);
assert.match(utils,/\["painel","kpi","execucao","dados","historico"\].*return/s,"inicializador genérico permanece bloqueado no KPI");
assert.match(utils,/function aplicarPeriodoInicialAoAbrirCCO\(\) \{\s*if \(String\(window\.CCO_PAGE \|\| ""\)\.toLowerCase\(\) === "kpi"\) return false;/,"temporizador legado de correção de período deve ser inerte no KPI");
assert.match(html,/kpi\.js\?v=20260806-kpi-producao-altura-v2/);
for(const arquivo of["services/kpiService.js","utils.js","cco-fixes.js"])assert.ok(html.includes(`${arquivo}?v=20260806-kpi-init-mes-sincronizado-v2`),`cache-buster ausente: ${arquivo}`);
assert.doesNotMatch(`${kpi}\n${fixes}`,/dispatchEvent\(/,"a inicialização não deve simular change");

async function initUnica(){let promessa,consultas=0,renders=0;return function iniciar(){if(promessa)return promessa;promessa=(async()=>{await Promise.resolve();consultas++;renders++;return{servico:"P1",periodo:"2026-07",importacaoId:"julho",consultas,renders};})();return promessa;};}
function aplicarModelo({catalogo,salvo,servico="P3"}){const periodo=catalogo.find(p=>p.ano===salvo?.ano&&p.mes===salvo?.mes)||[...catalogo].sort((a,b)=>b.ano-a.ano||b.mes-a.mes)[0];return{servico,ano:periodo.ano,mes:periodo.mes,importacaoId:periodo.importacao_id,chave:["kpi",periodo.ano,periodo.mes,servico,periodo.importacao_id].join("|")};}
(async()=>{const iniciar=await initUnica(),[a,b]=await Promise.all([iniciar(),iniciar()]);assert.strictEqual(a,b);assert.deepEqual(a,{servico:"P1",periodo:"2026-07",importacaoId:"julho",consultas:1,renders:1});const catalogo=[{ano:2026,mes:6,importacao_id:"junho"},{ano:2026,mes:7,importacao_id:"julho"}];const abertura=aplicarModelo({catalogo,salvo:{ano:2026,mes:6}}),change=aplicarModelo({catalogo,salvo:{ano:2026,mes:6}});assert.deepEqual(abertura,change,"primeira carga deve equivaler à troca manual");assert.equal(aplicarModelo({catalogo,salvo:{ano:2024,mes:1}}).importacaoId,"julho","preferência inválida usa o período mais recente");assert.notEqual(aplicarModelo({catalogo,salvo:{ano:2026,mes:6}}).chave,aplicarModelo({catalogo,salvo:{ano:2026,mes:7}}).chave,"meses distintos não compartilham cache");console.log("KPI init: primeira carga e change equivalentes, período sincronizado, cache isolado e resposta obsoleta protegida.");})().catch(error=>{console.error(error);process.exitCode=1;});
