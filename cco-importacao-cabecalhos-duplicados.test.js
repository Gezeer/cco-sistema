const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const contexto = {
  window: {},
  document: { readyState:"loading",addEventListener() {},getElementById() { return null; } },
  console,
  Blob,
  crypto:globalThis.crypto,
  CustomEvent:function CustomEvent() {}
};
contexto.window.window=contexto.window;
vm.createContext(contexto);
vm.runInContext(fs.readFileSync("cco-importacao-principal.js","utf8"),contexto);

const api=contexto.window.CCOImportacaoPrincipal;
const cabecalhos=api.criarMapaCabecalhosUnicos(["KM Total","Km_Total","Km Executado","Km Executado (%)"]);
assert.deepEqual(
  cabecalhos.map(item=>({indice:item.indice,literal:item.literal,normalizado:item.normalizado,chave:item.chave})),
  [
    {indice:0,literal:"KM Total",normalizado:"km_total",chave:"km_total"},
    {indice:1,literal:"Km_Total",normalizado:"km_total",chave:"km_total_2"},
    {indice:2,literal:"Km Executado",normalizado:"km_executado",chave:"km_executado"},
    {indice:3,literal:"Km Executado (%)",normalizado:"km_executado",chave:"km_executado_2"}
  ]
);

const original={"KM Total":69,"Km_Total":66.9};
const normalizado={km_total:69,km_total_2:66.9};
assert.deepEqual(
  {...api.obterCampoOperacionalCCO("P1",original,normalizado)},
  {valor:66.9,campo:"Km_Total",fonte:"original"}
);
assert.deepEqual(
  {...api.obterCampoOperacionalCCO("P1",{},normalizado)},
  {valor:66.9,campo:"km_total_2",fonte:"normalizada"}
);
assert.equal(api.obterCampoOperacionalCCO("P1",{"KM Total":69},{km_total:69}).valor,null);

const p5Original={"Km Executado":41,"Km Executado (%)":92};
assert.equal(api.obterCampoOperacionalCCO("P5",p5Original,{}).valor,41);
const p6Original={"Total Pagamento - KM":1234,"Total Pagamento - KM (%)":88};
assert.equal(api.obterCampoOperacionalCCO("P6",p6Original,{}).valor,1234);
const relatorioP5=api.preValidarCabecalhosCCO("P5","P5",[
  {ordem:0,original:"Km Executado",normalizado:"km_executado",chave:"km_executado"},
  {ordem:1,original:"Km Executado (%)",normalizado:"km_executado",chave:"km_executado_2"}
]);
assert.equal(relatorioP5.camposOficiaisLocalizados[0].chave,"km_executado");
assert.equal(relatorioP5.camposOficiaisLocalizados[0].percentualChave,"km_executado_2");
assert.throws(()=>api.preValidarCabecalhosCCO("P1","P1",[
  {ordem:0,original:"KM Total",normalizado:"km_total",chave:"km_total"}
]),/Pré-validação/);

console.log("Importador CCO: cabeçalhos únicos e campos literais P1/P5/P6 aprovados.");
