const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const fonte=fs.readFileSync("js/cco-graficos-3d.js","utf8");
const execucao=fs.readFileSync("execucao.js","utf8");
const html=fs.readFileSync("execucao.html","utf8");
const window={innerWidth:1200,matchMedia:()=>({matches:false}),addEventListener(){}};
const contexto=vm.createContext({window,console,Number,String,Math,Intl,Map,Symbol,requestAnimationFrame(){}});
vm.runInContext(fonte,contexto);
const api=window.CCO_GRAFICOS_3D,legenda={esquerda:-1e6,direita:1e6,topo:8,base:34};

for(const valor of[12,11]){
  const previsto=api.calcularPosicaoRotuloExecucao({indiceSerie:0,centroX:100,topoY:100,texto:String(valor),fonte:12,limiteSuperior:48,legenda});
  const acumulado=api.calcularPosicaoRotuloExecucao({indiceSerie:1,centroX:120,topoY:100,texto:String(valor),fonte:12,comparacao:previsto,limiteSuperior:48,legenda});
  assert.equal(api.detectarColisaoRotulos3D(previsto,acumulado,8),false,`${valor}/${valor} deve manter rótulos separados`);
  assert.equal(api.detectarColisaoRotulos3D(previsto,legenda,8),false,"Previsto não pode tocar a legenda");
  assert.equal(api.detectarColisaoRotulos3D(acumulado,legenda,8),false,"Acumulado não pode tocar a legenda");
  assert.notEqual(previsto.x,acumulado.x);
  assert.notEqual(previsto.y,acumulado.y);
  assert.ok(previsto.topo>=48&&acumulado.topo>=48,"rótulos devem respeitar o limite superior");
}

const render=execucao.match(/async function renderizarEvolucaoHistoricaCCO[\s\S]*?(?=\n  window\.renderizarEvolucaoHistoricaCCO)/)?.[0]||"";
assert.match(render,/layoutRotulosExecucao:true/);
assert.match(render,/grid:cfg=>cfg\.mobile\?\{\}:\{top:100\}/,"grid desktop deve reservar a área superior sem mudar mobile");
assert.match(render,/legend:\{show:true,top:10,left:"center"\}/);
assert.match(render,/modoMobileCompacto:true/,"mobile deve continuar sem rótulos fixos");
assert.match(render,/nome:"Previsto"[\s\S]*nome:"Acumulado"/,"as duas séries devem permanecer visíveis");
assert.match(fonte,/const guia=posicaoRotulo\?\.deslocado/,"linha-guia deve permanecer disponível");
assert.match(html,/20260806-execucao-rotulos-legenda-espacamento-v1/);

console.log("Execução: legenda, faixa de rótulos, grid superior, anticolisão e mobile preservado aprovados.");
