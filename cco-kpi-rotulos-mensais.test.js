const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const fonteGraficos=fs.readFileSync("js/cco-graficos-3d.js","utf8");
const fonteKpi=fs.readFileSync("kpi.js","utf8");
const html=fs.readFileSync("kpi.html","utf8");
const window={innerWidth:1200,matchMedia:()=>({matches:false}),addEventListener(){}};
vm.runInContext(fonteGraficos,vm.createContext({window,console,Number,String,Math,Intl,Map,WeakMap,Symbol,requestAnimationFrame(){}}));
const api=window.CCO_GRAFICOS_3D;

function posicoesIguais(valor){
  const previsto=api.calcularPosicaoRotuloKPI({indiceSerie:0,centroX:100,topoY:100,texto:String(valor),fonte:12,limiteSuperior:20});
  const executado=api.calcularPosicaoRotuloKPI({indiceSerie:1,centroX:120,topoY:100,texto:String(valor),fonte:12,comparacao:previsto,limiteSuperior:20});
  return{previsto,executado};
}

for(const valor of[3,11]){
  const {previsto,executado}=posicoesIguais(valor);
  assert.notEqual(previsto.x,executado.x,`Previsto e Executado ${valor} devem ter centros distintos`);
  assert.notEqual(previsto.y,executado.y,`Previsto e Executado ${valor} devem usar níveis distintos`);
  assert.equal(api.detectarColisaoRotulosKPI(executado,previsto,{limiteSuperior:20}),false);
  assert.ok(previsto.topo>=20&&executado.topo>=20,"rótulos não podem ultrapassar o topo da plotagem");
}

const previsto3=api.calcularPosicaoRotuloKPI({indiceSerie:0,centroX:100,topoY:90,texto:"3",fonte:12,limiteSuperior:20});
const executado2=api.calcularPosicaoRotuloKPI({indiceSerie:1,centroX:120,topoY:120,texto:"2",fonte:12,comparacao:previsto3,limiteSuperior:20});
assert.equal(api.detectarColisaoRotulosKPI(executado2,previsto3,{limiteSuperior:20}),false,"3 x 2 deve permanecer alinhado sem colisão");
assert.match(fonteKpi,/layoutRotulosKPI:true/,"modo isolado deve ser usado somente pelo comparativo mensal");
assert.match(fonteKpi,/calcularEscalaEixoComparativoKPI\(maiorValor\)/,"eixo deve reservar folga visual com escala legível");
assert.match(fonteKpi,/grid:cfg=>cfg\.mobile\?\{\}:\{top:92\}/,"desktop deve separar legenda e área de plotagem");
assert.match(fonteKpi,/cfg\.mobile\?"linha":"cilindro"/,"mobile deve preservar o comportamento compacto existente");
assert.match(fonteGraficos,/posicaoRotulo\.distanciaTopo>16/,"deslocamento amplo deve criar linha-guia");
assert.match(fonteGraficos,/destruirGrafico\(container\)/,"segunda renderização deve destruir a instância anterior");
assert.match(html,/js\/cco-graficos-3d\.js\?v=20260805-kpi-velocidade-mobile-v1/);
assert.match(html,/kpi\.js\?v=20260805-kpi-eixo-maximo-formatado-v1/);

console.log("KPI mensal: rótulos iguais/diferentes, legenda, eixo, mobile e ciclo de renderização aprovados.");
