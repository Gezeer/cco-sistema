const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");

async function testarRuntime(){
  const armazenamento=new Map(),sessionStorage={getItem:k=>armazenamento.get(k)||null,setItem:(k,v)=>armazenamento.set(k,v),removeItem:k=>armazenamento.delete(k),key:i=>[...armazenamento.keys()][i]||null,get length(){return armazenamento.size;}};
  const window={CCO_PAGE:"kpi"},contexto={window,sessionStorage,Date,Map,WeakMap,Promise};vm.createContext(contexto);vm.runInContext(fs.readFileSync("services/cache.js","utf8"),contexto);
  let producoes=0,resolver;const produtor=()=>{producoes++;return new Promise(resolve=>{resolver=resolve;});},filtro={pagina:"kpi",servico:"P4",ano:2025,mes:12,dia:"",importacaoId:"imp-dez"};
  const primeira=window.CCOPageDataCache.obter(filtro,produtor),segunda=window.CCOPageDataCache.obter(filtro,produtor);await Promise.resolve();assert.equal(producoes,1,"consultas concorrentes devem compartilhar a Promise");resolver([1]);assert.deepEqual(await primeira,[1]);assert.deepEqual(await segunda,[1]);
  assert.notEqual(window.CCOPageDataCache.chave(filtro),window.CCOPageDataCache.chave({...filtro,mes:2,importacaoId:"imp-fev"}),"cache não pode misturar períodos");
  let boots=0,concluir;const boot=()=>{boots++;return new Promise(resolve=>{concluir=resolve;});},boot1=window.CCOPageRuntime.inicializar("KPI",boot),boot2=window.CCOPageRuntime.inicializar("KPI",boot);await Promise.resolve();assert.strictEqual(boot1,boot2);assert.equal(boots,1);concluir(true);assert.equal(await boot1,true);
  const alvo={addEventListener(){this.total=(this.total||0)+1;}};assert.equal(window.CCOPageRuntime.ouvirUmaVez("filtro",alvo,"change",()=>{}),true);assert.equal(window.CCOPageRuntime.ouvirUmaVez("filtro",alvo,"change",()=>{}),false);assert.equal(alvo.total,1);
}

const ler=arquivo=>fs.readFileSync(arquivo,"utf8"),cache=ler("services/cache.js"),painel=ler("painel-geral.js"),execucao=ler("execucao.js"),kpi=ler("kpi.js"),historico=ler("historico.js"),dados=ler("dados.js"),analytics=ler("analytics-ai.js"),utils=ler("utils.js");
assert.match(cache,/CCOPageDataCache/);assert.match(cache,/CCOPageContext/);assert.match(cache,/CCOPageRuntime/);assert.match(cache,/5\*60\*1000/);
for(const [nome,fonte] of [["PAINEL",painel],["EXECUCAO",execucao],["KPI",kpi],["HISTORICO",historico],["DADOS",dados],["ANALYTICS",analytics]])assert.match(fonte,new RegExp(`(?:CCOPageRuntime\\.inicializar\\("${nome}"|__CCO_${nome}_INIT_PROMISE__)`),`init oficial ausente: ${nome}`);
assert.match(painel,/P9 reutilizado do lote principal de operacoes/);assert.doesNotMatch(painel,/p9PorPeriodo\(importacao\.importacao_id/);assert.doesNotMatch(dados,/CCOKpiService\.operacoes/);assert.match(dados,/from\("operacoes"\).*eq\("importacao_id",periodo\.importacao_id\)/s);
assert.doesNotMatch(ler("historico.html"),/utils\.js/);assert.match(utils,/paginaControlada[\s\S]*__CCO_PAINEL_CONTROLADOR_OFICIAL__[\s\S]*__CCO_EXECUCAO_CONTROLADOR_OFICIAL__/);
for(const html of["index.html","kpi.html","execucao.html","historico.html","dados.html","analytics-ai.html"]){const versao=html==="index.html"?"20260811-painel-performance-log-real-v3":"20260807-performance-boot-v2";assert.match(ler(html),new RegExp(`services/cache\\.js\\?v=${versao}`));}

testarRuntime().then(()=>console.log("Performance boot v2: init única, Promise compartilhada, cache isolado, catálogo/controladores e consultas deduplicadas aprovados.")).catch(error=>{console.error(error);process.exitCode=1;});
