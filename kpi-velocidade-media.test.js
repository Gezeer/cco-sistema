const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const api=require("./js/cco-kpi-velocidade.js");

assert.equal(api.resumir([{velocidade_media:10},{velocidade_media:20},{velocidade_media:30}]).media,20);
assert.equal(api.resumir([{velocidade_media:10},{velocidade_media:null},{velocidade_media:20}]).media,15);
assert.equal(api.resumir([{velocidade_media:"10,5"},{velocidade_media:"20,5"}]).media,15.5);
assert.deepEqual(api.resumir([{velocidade_media:10},{velocidade_media:""},{velocidade_media:"-"},{velocidade_media:"texto"},{velocidade_media:20}]).valores,[10,20]);
assert.deepEqual(api.agruparPorDia([
  {data_operacao:"2026-07-02",velocidade_media:30},{data_operacao:"2026-07-01",velocidade_media:10},
  {data_operacao:"2026-07-01",velocidade_media:20},{data_operacao:"2026-07-02",velocidade_media:10}
]).map(item=>[item.periodo,item.media]),[["2026-07-01",15],["2026-07-02",20]]);

async function testarConsulta(){
  const chamadas=[];
  const query={select(campos){chamadas.push(["select",campos]);return query},order(campo){chamadas.push(["order",campo]);return query},eq(campo,valor){chamadas.push(["eq",campo,valor]);return query},gte(campo,valor){chamadas.push(["gte",campo,valor]);return query},lt(campo,valor){chamadas.push(["lt",campo,valor]);return query}};
  const window={CCOKpiVelocidade:api,CCOMetricas:{normalizarServico:v=>String(v).trim().toUpperCase()},CCOCache:{chave:()=>"k",lembrar:async(_k,fn)=>fn()},CCOSupabase:{getClient:()=>({from:tabela=>(chamadas.push(["from",tabela]),query)}),paginar:async produtor=>{produtor();return[{importacao_id:"imp",servico:"P1",data_operacao:"2026-07-01",velocidade_media:10}]}}};
  const contexto={window,console:{log(){}}};vm.createContext(contexto);vm.runInContext(fs.readFileSync("services/kpiService.js","utf8"),contexto);
  await window.CCOKpiService.operacoes("imp",{ano:2026,mes:7,servico:"p1"});
  assert.ok(chamadas.some(item=>item.join("|")==="eq|importacao_id|imp"));
  assert.ok(chamadas.some(item=>item.join("|")==="gte|data_operacao|2026-07-01"));
  assert.ok(chamadas.some(item=>item.join("|")==="lt|data_operacao|2026-08-01"));
  assert.ok(chamadas.some(item=>item.join("|")==="eq|servico|P1"));
}

function testarRender(){
  let instancia=null,destruicoes=0,renders=0;
  const card={style:{}},container={id:"graficoKpiVelocidadeMediaMensal",isConnected:true,clientWidth:600,clientHeight:320,children:[],closest:()=>card,replaceChildren(){this.children=[]},appendChild(item){this.children.push(item)}},mostrador={style:{setProperty(){}}},valor={textContent:""};
  const elementos={graficoKpiVelocidadeMediaMensal:container,kpiSpeedometerDrawing:mostrador,kpiSpeedometerValue:valor};
  const document={hidden:false,readyState:"loading",getElementById:id=>elementos[id]||null,querySelector:()=>null,addEventListener(){},createElement:()=>({className:"",textContent:""})};
  const graficos={destruirGrafico(alvo){assert.strictEqual(alvo,container);if(instancia){destruicoes+=1;instancia=null}},renderizarDireto(alvo,config){assert.strictEqual(alvo,container);renders+=1;instancia={config};return instancia}};
  const window={CCOKpiVelocidade:api,CCO_GRAFICOS_3D:graficos,echarts:{getInstanceByDom:alvo=>alvo===container?instancia:null},addEventListener(){},visualViewport:null,matchMedia:()=>({matches:true})};
  const contexto={window,document,console:{log(){},warn(){},error(){}},performance:{now:()=>0},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout(){},Symbol,Map,Math,Number,String};
  vm.createContext(contexto);vm.runInContext(fs.readFileSync("kpi.js","utf8"),contexto);
  window.renderVelocidadeKPI([{data_operacao:"2026-07-01",data_normalizada:"2026-07-01",velocidade_media:10}]);
  window.renderVelocidadeKPI([{data_operacao:"2026-07-01",data_normalizada:"2026-07-01",velocidade_media:20}]);
  assert.equal(renders,2);assert.equal(destruicoes,1,"segunda renderização deve destruir somente a instância anterior de velocidade");
  window.renderVelocidadeKPI([{data_normalizada:"2026-07-01",velocidade_media:null},{data_normalizada:"2026-07-01",velocidade_media:""}]);
  assert.equal(renders,2,"estado vazio não pode renderizar zeros falsos");
  assert.equal(container.children[0].textContent,"Sem dados de velocidade para o período");
}

Promise.resolve().then(testarConsulta).then(testarRender).then(()=>console.log("KPI Velocidade Média: cálculo, consulta, filtros, render e estado vazio aprovados.")).catch(error=>{console.error(error);process.exitCode=1});
