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
for(const [serial,ano,mes,total] of [[46174,2026,6,26],[46204,2026,7,27],[46235,2026,8,26]]){
  const resultado=contexto.window.CCOImportacaoPrincipal.analisarWorkbook({SheetNames:["Dias_Operação"],Sheets:{"Dias_Operação":[["Mês","Dias_Operação"],[serial,total]]}},"TabelaPadrão.xlsx");
  assert.equal(JSON.stringify(resultado.dias.map(item=>({ano:item.ano,mes:item.mes,total_dias:item.total_dias}))),JSON.stringify([{ano,mes,total_dias:total}]),`serial ${serial} deve resultar em ${ano}-${String(mes).padStart(2,"0")} → ${total}`);
  assert.equal(resultado.dias[0].dados.__cco_serial_mes,serial);
  assert.equal(resultado.dias[0].dados.__cco_data_interpretada,`${ano}-${String(mes).padStart(2,"0")}-01`);
}

const regras={console};regras.globalThis=regras;
vm.createContext(regras);
vm.runInContext(fs.readFileSync("js/cco-regras-negocio.js","utf8"),regras);
regras.CCO_DEBUG_AGOSTO=false;
regras.CCO_REGRAS.registrarDiasOperacao([{ano:2026,mes:8,total_dias:26}]);
assert.equal(regras.CCO_REGRAS.obterDiasOperacao(2026,8),26);
for(const servico of ["P1","P4","P5","P6","P12"])assert.ok(regras.CCO_REGRAS.calcularPrevisto(servico,2026,8,100,10)>0,`${servico} deve manter sua regra com dias oficiais`);
assert.deepEqual(Object.fromEntries(["P3","P7","P8","P9","P10","P11"].map(servico=>[servico,regras.CCO_REGRAS.calcularPrevisto(servico,2026,8)])),{P3:12,P7:2,P8:2,P9:11,P10:3,P11:1});

const fonte=fs.readFileSync("cco-importacao-principal.js","utf8"),inicioReparo=fonte.indexOf("hash_armazenado_dias_reparados"),trechoReparo=fonte.slice(Math.max(0,inicioReparo-2500),inicioReparo+100);
assert.match(trechoReparo,/gravarDiasOperacao/);
assert.match(trechoReparo,/from\("painel_executivo"\)\.update/);
assert.doesNotMatch(trechoReparo,/from\("operacoes"\)/,"reparo de dias não pode regravar operações");

console.log("Agosto: variantes de Dias_Operação, fonte dinâmica e previstos oficiais aprovados.");
