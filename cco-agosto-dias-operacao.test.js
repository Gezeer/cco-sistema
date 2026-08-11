const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const contexto={window:{},document:{readyState:"loading",addEventListener(){},getElementById(){return null;}},console,Blob,crypto:globalThis.crypto,CustomEvent:function(){}};
contexto.window.window=contexto.window;
vm.createContext(contexto);
vm.runInContext(fs.readFileSync("cco-importacao-principal.js","utf8"),contexto);
contexto.XLSX={utils:{sheet_to_json:folha=>folha}};

for(const cabecalho of ["Dias de Operação","Total de Dias","Total de Dias no Mês"]){
  const resultado=contexto.window.CCOImportacaoPrincipal.analisarWorkbook({SheetNames:["Dias_Operação"],Sheets:{"Dias_Operação":[["Ano","Mês",cabecalho],[2026,"Agosto",23]]}},"agosto.xlsx");
  assert.equal(JSON.stringify(resultado.dias.map(item=>({ano:item.ano,mes:item.mes,total_dias:item.total_dias}))),JSON.stringify([{ano:2026,mes:8,total_dias:23}]),`${cabecalho} deve preservar o valor oficial de agosto`);
}

const regras={console};regras.globalThis=regras;
vm.createContext(regras);
vm.runInContext(fs.readFileSync("js/cco-regras-negocio.js","utf8"),regras);
regras.CCO_DEBUG_AGOSTO=false;
regras.CCO_REGRAS.registrarDiasOperacao([{ano:2026,mes:8,total_dias:23}]);
assert.equal(regras.CCO_REGRAS.obterDiasOperacao(2026,8),23);
for(const servico of ["P1","P4","P5","P6","P12"])assert.ok(regras.CCO_REGRAS.calcularPrevisto(servico,2026,8,100,10)>0,`${servico} deve manter sua regra com dias oficiais`);
assert.deepEqual(Object.fromEntries(["P3","P7","P8","P9","P10","P11"].map(servico=>[servico,regras.CCO_REGRAS.calcularPrevisto(servico,2026,8)])),{P3:12,P7:2,P8:2,P9:11,P10:3,P11:1});

console.log("Agosto: variantes de Dias_Operação, fonte dinâmica e previstos oficiais aprovados.");
