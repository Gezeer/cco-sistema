const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const fonte=fs.readFileSync("js/cco-graficos-3d.js","utf8");
const window={innerWidth:1200,matchMedia:()=>({matches:false}),addEventListener(){}};
vm.createContext({window,console,Number,String,Math,Intl,Map,Symbol,requestAnimationFrame(){}});
vm.runInContext(fonte,vm.createContext({window,console,Number,String,Math,Intl,Map,Symbol,requestAnimationFrame(){}}));
const api=window.CCO_GRAFICOS_3D;

assert.equal(api.formatarRotuloGrafico3D(21223,false),"21.223");
assert.equal(api.formatarRotuloGrafico3D(21196.85,false),"21.196,85");
assert.equal(api.formatarRotuloGrafico3D(20573.42,false),"20.573,42");
assert.equal(api.formatarRotuloGrafico3D(null,false),"");
assert.equal(api.formatarRotuloGrafico3D(22000,true),"22 mil");
assert.equal(api.formatarRotuloGrafico3D(20500,true),"20,5 mil");
assert.doesNotMatch(api.formatarRotuloGrafico3D(20500,true),/\n/);

const previsto=api.calcularPosicaoRotulo3D({indiceSerie:0,centroX:100,topoY:80,texto:"21.223",fonte:12});
const acumuladoProximo=api.calcularPosicaoRotulo3D({indiceSerie:1,centroX:118,topoY:81,texto:"21.196,85",fonte:12,comparacao:previsto});
assert.equal(acumuladoProximo.deslocado,true,"valores próximos devem ativar separação vertical");
assert.equal(api.detectarColisaoRotulos3D(previsto,acumuladoProximo,8),false,"as caixas finais devem respeitar a distância mínima");

const igual=api.calcularPosicaoRotulo3D({indiceSerie:1,centroX:118,topoY:80,texto:"21.223",fonte:12,comparacao:previsto});
assert.equal(igual.deslocado,true,"valores iguais também devem permanecer legíveis");
const distante=api.calcularPosicaoRotulo3D({indiceSerie:1,centroX:118,topoY:180,texto:"2.000",fonte:12,comparacao:previsto});
assert.equal(distante.deslocado,false,"valores muito diferentes devem continuar alinhados ao topo da barra");

assert.match(fonte,/fill:"rgba\(3,24,18,\.82\)"/,"rótulo deve possuir cápsula escura discreta");
assert.match(fonte,/const guia=posicaoRotulo\.deslocado/,"deslocamentos devem poder criar linha-guia");
assert.match(fonte,/CCO_DEBUG_GRAFICOS_3D===true/,"log deve existir somente no modo debug");
assert.match(fonte,/Diferença:/,"tooltip deve incluir a diferença com valor completo");
assert.match(fonte,/destruirGrafico\(container\)/,"uma nova renderização deve remover a instância anterior");

console.log("Rótulos 3D: formatação pt-BR, anticolisão, mobile, null e tooltip aprovados.");
