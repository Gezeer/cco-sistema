const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

function carregar(configuracao){
  const contexto={window:{CCO_CONFIG_IMPORTACAO:configuracao},document:{readyState:"loading",addEventListener(){},getElementById(){return null;}},console,Blob,crypto:globalThis.crypto,CustomEvent:function(){}};
  contexto.window.window=contexto.window;
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync("cco-importacao-principal.js","utf8"),contexto);
  contexto.XLSX={utils:{sheet_to_json:folha=>folha}};
  return contexto;
}

function importar(linha,configuracao){
  const contexto=carregar(configuracao);
  const dados={...linha,Km_Total:1};
  const resultado=contexto.window.CCOImportacaoPrincipal.analisarWorkbook({SheetNames:["P4"],Sheets:{P4:[["Data",...Object.keys(dados)],["01/12/2025",...Object.values(dados)]]}},"p4.xlsx");
  return resultado.operacoes[0].peso_t;
}

assert.equal(importar({"Peso(T)":"12,60","Peso Total":12600}),12.6,"Peso(T) deve prevalecer sobre Peso Total");
assert.equal(importar({"Peso(T)":null,"Peso Total":12600}),null,"Peso Total sem unidade explícita não preenche peso_t");
assert.equal(importar({"Peso(T)":null,"Peso Total":12600},{P4:{pesoTotalUnidade:"kg"}}),12.6,"Peso Total explicitamente em kg deve ser convertido");
assert.equal(importar({"Peso(T)":"3,87"}),3.87);
assert.equal(importar({"Peso(T)":"24,60"}),24.6);

const fonte=fs.readFileSync("cco-importacao-principal.js","utf8");
assert.doesNotMatch(fonte,/peso_t:\s*\[[^\]]*"peso_total"/,"peso_total não pode ser alias automático de peso_t");
assert.doesNotMatch(fonte,/peso_t\s*>\s*100|pesoToneladas\.valor\s*>\s*100/,"a correção não pode depender da grandeza do valor");
assert.match(fs.readFileSync("index.html","utf8"),/cco-importacao-principal\.js", "20260811-painel-performance-log-real-v3"/);

console.log("Parser P4: origem em toneladas, Peso Total explícito em kg e ausência de heurística aprovados.");
