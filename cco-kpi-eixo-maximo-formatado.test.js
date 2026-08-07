const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const kpi=fs.readFileSync("kpi.js","utf8");
const html=fs.readFileSync("kpi.html","utf8");
const document={hidden:false,readyState:"loading",getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
const window={innerWidth:1200,location:{search:""},addEventListener(){},matchMedia:()=>({matches:false}),visualViewport:null};
const contexto={window,document,console:{log(){},warn(){},error(){},table(){}},performance:{now:()=>0},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout(){},Symbol,Map,Set,WeakMap,Math,Number,String,Array,Object,decodeURIComponent};
vm.runInContext(kpi,vm.createContext(contexto));

const escala=window.calcularEscalaEixoComparativoKPI(22039.27);
assert.deepEqual({...escala},{max:30000,intervalo:5000});
assert.notEqual(escala.max,27549.08653846154,"máximo decimal bruto não pode virar tick");
assert.deepEqual(Array.from({length:escala.max/escala.intervalo+1},(_,i)=>window.formatarNumeroEixoKPI(i*escala.intervalo)),["0","5.000","10.000","15.000","20.000","25.000","30.000"]);
assert.equal(window.formatarNumeroEixoKPI(27549.08),"27.549,08");

assert.deepEqual({...window.calcularEscalaEixoComparativoKPI(3)},{max:4,intervalo:1});
assert.deepEqual({...window.calcularEscalaEixoComparativoKPI(11)},{max:14,intervalo:2});
const inicio=kpi.indexOf('render("graficoKpiComparativoMensal"');
const fim=kpi.indexOf('render("graficoKpiProdutividadeMensal"',inicio);
const comparativo=kpi.slice(inicio,fim);
assert.match(comparativo,/valores:seriePrevisto[\s\S]*valores:serieExecutado/,"valores das barras devem permanecer nas séries oficiais");
assert.match(comparativo,/yAxis:\{max:escalaVisualComparativo\.max,interval:escalaVisualComparativo\.intervalo,axisLabel:\{formatter:formatarNumeroEixoKPI\}\}/);
assert.match(comparativo,/Previsto:[\s\S]*Executado:[\s\S]*Diferença:[\s\S]*Percentual:/,"tooltip deve permanecer completo");
assert.equal((kpi.match(/axisLabel:\{formatter:formatarNumeroEixoKPI\}/g)||[]).length,1,"formatação deve atingir somente o comparativo mensal");
assert.match(kpi,/destruirGrafico\?\.\(container\)/,"segunda renderização deve destruir a instância anterior");
assert.match(html,/kpi\.js\?v=20260806-kpi-producao-altura-v3/);

console.log("KPI eixo mensal: máximo agradável, ticks pt-BR, séries, tooltip e isolamento aprovados.");
