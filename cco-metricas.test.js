const assert = require("node:assert/strict");
global.window = global;
require("./js/cco-regras-negocio.js");
require("./js/cco-p1-km-total.js");
require("./cco-metricas.js");

const m = global.CCOMetricas;
const perto = (atual, esperado, tolerancia = 1e-6) => assert.ok(Math.abs(atual - esperado) <= tolerancia, `${atual} != ${esperado}`);

const diasJunho = global.CCO_REGRAS.obterDiasOperacao(2026, 6);
const diasJulho = global.CCO_REGRAS.obterDiasOperacao(2026, 7);
const previsto = m.calcularPrevistoAcumulado({ previstoMensal: "38.541", diasOperacaoMes: diasJunho, diasExecutados: 10 });
perto(previsto, 14823.461538461539);
perto(m.calcularPercentualCumprimento({ acumuladoReal: "15.100", previstoAcumulado: previsto }), 101.8655457824, 1e-6);
assert.equal(m.calcularPercentualCumprimento({ acumuladoReal: 10, previstoAcumulado: 0 }), null);
assert.equal(m.calcularAcumuladoServico("P12", [{executado:"1.234,5"},{executado:"65,5"},{executado:200,peso_t:9999}]), 1500);

const registros = Array.from({length:10}, (_,i) => ({servico:"P5",data_operacao:`2026-06-${String((i%3)+1).padStart(2,"0")}`,km_total:1,equipe:3}));
assert.equal(m.calcularDiasExecutados(registros,"P5"), 3);
assert.equal(m.calcularQuantidadeEquipesMensal(Array.from({length:20},()=>({data_operacao:"2026-06-01",equipe:3}))), 3);
assert.notEqual(m.normalizarServico("P1"),m.normalizarServico("P10"));
assert.notEqual(m.normalizarServico("P1"),m.normalizarServico("P11"));
assert.notEqual(m.normalizarServico("P1"),m.normalizarServico("P12"));
assert.notEqual(m.normalizarServico("P2.1"),m.normalizarServico("P2.2"));
assert.equal(m.normalizarServico("Catação Em Área Verde"),"P9");
assert.equal(m.normalizarServico("Catação em Área Verde"),"P9");
assert.equal(m.normalizarServico("CATAÇÃO EM ÁREA VERDE"),"P9");
const equipesComparaveis=[
  {data_operacao:"2026-07-01",equipe:2,executado:2},
  {data_operacao:"2026-07-02",equipe:3,executado:3}
];
assert.equal(m.calcularAcumuladoServico("P3",equipesComparaveis),5);
assert.equal(m.calcularAcumuladoServico("P9",equipesComparaveis),5);
assert.equal(m.consolidarServico({servico:"P9",registros:equipesComparaveis,previstoMensal:11,diasOperacaoMes:diasJulho}).acumuladoReal,5);

const status = m.consolidarServico({servico:"P5",registros:[{data_operacao:"2026-06-01",km_total:10}],previstoMensal:0,diasOperacaoMes:diasJunho});
assert.equal(status.status,"com_dados");
assert.ok(status.avisos.some(x=>x.includes("previsto mensal indisponível")));
const trintaDias = Array.from({length:30},(_,i)=>({servico:"P5",data_operacao:`2026-06-${String(i+1).padStart(2,"0")}`,km_total:1,equipe:3}));
assert.ok(m.consolidarServico({servico:"P5",registros:trintaDias,diasOperacaoMes:diasJunho,previstoMensal:38541}).avisos.some(x=>x.includes("superiores")));

const junho = registros.filter(x=>x.data_operacao.startsWith("2026-06"));
const julho = [{servico:"P5",data_operacao:"2026-07-01",km_total:500}];
assert.equal(m.calcularAcumuladoServico("P5",junho),10);
assert.equal(m.calcularAcumuladoServico("P5",julho),500);
const p1DoisPeriodos=[
  {importacao_id:"importacao-julho",servico:"P1",data_operacao:"2026-07-05",peso_t:40,km_total:999},
  {importacao_id:"importacao-julho",servico:"P1",data_operacao:"2026-07-06",peso_t:60,km_total:888},
  {importacao_id:"importacao-junho",servico:"P1",data_operacao:"2026-06-05",peso_t:200,km_total:777}
];
const acumuladoP1Julho=m.calcularAcumuladoP1Periodo({ano:2026,mes:7,importacaoId:"importacao-julho",registros:p1DoisPeriodos});
const acumuladoP1Junho=m.calcularAcumuladoP1Periodo({ano:2026,mes:6,importacaoId:"importacao-junho",registros:p1DoisPeriodos});
assert.equal(acumuladoP1Julho,100);
assert.equal(acumuladoP1Junho,200);
assert.equal(m.consolidarServico({servico:"P1",ano:2026,mes:7,importacaoId:"importacao-julho",registros:p1DoisPeriodos,previstoMensal:300,diasOperacaoMes:diasJulho}).acumuladoReal,acumuladoP1Julho);
assert.equal(m.consolidarServico({servico:"P1",ano:2026,mes:6,importacaoId:"importacao-junho",registros:p1DoisPeriodos,previstoMensal:300,diasOperacaoMes:diasJunho}).acumuladoReal,acumuladoP1Junho);
const p1IndicadoresOficiais=[
  {importacao_id:"importacao-julho",servico:"P1",data_operacao:"2026-07-05",peso_t:40,viagens:4,dados_originais:{Km_Total:100}},
  {importacao_id:"importacao-julho",servico:"P1",data_operacao:"2026-07-06",peso_t:60,viagens:6,dados_originais:{Km_Total:150}}
];
const pesoP1=m.calcularAcumuladoP1Periodo({ano:2026,mes:7,importacaoId:"importacao-julho",registros:p1IndicadoresOficiais});
const kmP1=global.calcularKmTotalP1Periodo({ano:2026,mes:7,importacaoId:"importacao-julho",registrosRaw:p1IndicadoresOficiais});
const viagensP1=p1IndicadoresOficiais.reduce((total,item)=>total+item.viagens,0);
assert.deepEqual({acumulado:pesoP1,peso:pesoP1,kmExecutado:kmP1,produtividade:pesoP1/viagensP1,distanciaMedia:kmP1/viagensP1},{acumulado:100,peso:100,kmExecutado:250,produtividade:10,distanciaMedia:25});
assert.notEqual(kmP1,pesoP1,"KM Executado não pode reutilizar calcularAcumuladoP1Periodo()");
const fonteUtils=require("node:fs").readFileSync("utils.js","utf8");
assert.match(fonteUtils,/window\.CCOMetricas\.calcularAcumuladoP1Periodo\(/);
assert.doesNotMatch(fonteUtils,/const totalKm = codigo === "P1" && rawP1Atual/);

perto(m.calcularPercentualCumprimento({acumuladoReal:"1.320,08",previstoAcumulado:"9.040"}),14.602654867256636);

(async()=>{
  const base=Array.from({length:1505},(_,id)=>({id}));
  const paginados=await m.consultarOperacoesPaginadas(()=>({range:async(inicio,fim)=>({data:base.slice(inicio,fim+1),error:null})}));
  assert.equal(paginados.length,1505);
  const consultas=[];
  global.__CCO_COLUNAS_OPERACOES_VALIDAS__=null;
  global.__CCO_SCHEMA_OPERACOES__=null;
  const ausentes=new Set(["id","velocidade_media","tempo_produtivo_minutos","dados_originais"]);
  global.supabaseClient={from:()=>{let colunas="";const q={select(v){colunas=v;return q;},gte(){return q;},lt(){return q;},order(){return q;},eq(){return q;},async limit(){consultas.push({tipo:"limit",colunas});return ausentes.has(colunas)?{data:null,error:{code:"42703",message:`column ${colunas} does not exist`}}:{data:base.slice(0,1),error:null};},async range(inicio,fim){consultas.push({tipo:"range",colunas,inicio,fim});return{data:base.slice(inicio,fim+1),error:null};}};return q;}};
  const resilientes=await m.carregarOperacoesResiliente({importacaoId:"importacao-julho",inicio:"2026-07-01",fimExclusivo:"2026-08-01"});
  assert.equal(resilientes.length,1505);
  assert.ok(global.__CCO_COLUNAS_OPERACOES_VALIDAS__.includes("executado"));
  assert.equal(consultas[0].colunas,"importacao_id,rd,servico,tipo_servico,data_operacao");
  assert.ok(!consultas[0].colunas.split(",").includes("id"));
  assert.deepEqual(global.__CCO_SCHEMA_OPERACOES__.opcionaisAusentes.sort(),["dados_originais","id","tempo_produtivo_minutos","velocidade_media"].sort());
  const testesSchema=consultas.filter(x=>x.tipo==="limit").length;
  assert.equal(testesSchema,1+m.COLUNAS_OPERACOES_OPCIONAIS.length);
  await m.carregarOperacoesResiliente({importacaoId:"importacao-julho",inicio:"2026-07-01",fimExclusivo:"2026-08-01"});
  assert.equal(consultas.filter(x=>x.tipo==="limit").length,testesSchema);
  assert.ok(m.consolidarServico({servico:"P12",registros:[{data_operacao:"2026-07-01"}],previstoMensal:10,diasOperacaoMes:diasJulho}).avisos.some(x=>x.includes("executado indisponível")));
  console.log("CCOMetricas: cenários determinísticos aprovados, incluindo fallback memorizado e paginação acima de 1000 registros.");
})().catch(error=>{console.error(error);process.exitCode=1;});
