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
assert.equal(regras.CCO_REGRAS.calcularPrevisto("P1",2026,9),null,"sem dias_operacao oficial, previsto proporcional deve ficar indisponível");
const metas26={P1:21223,"P2.1":780,"P2.2":260,P4:15779,P5:38541,P6:9040,P12:1698432};
for(const [servico,esperado] of Object.entries(metas26))assert.equal(regras.CCO_REGRAS.calcularPrevisto(servico,26),esperado,`${servico} deve usar a meta-base oficial de 26 dias`);
const metas27={P1:22039.26923076923,"P2.1":810,"P2.2":270,P4:16385.884615384613,P5:40023.346153846156,P6:9387.692307692307,P12:1763756.3076923077};
for(const [servico,esperado] of Object.entries(metas27))assert.ok(Math.abs(regras.CCO_REGRAS.calcularPrevisto(servico,27)-esperado)<1e-9,`${servico} deve reproduzir a fórmula oficial para 27 dias`);
for(const [servico,base] of Object.entries(metas26))assert.equal(regras.CCO_REGRAS.calcularPrevisto(servico,24),base/26*24,`${servico} deve generalizar para 24 dias`);
for(const servico of Object.keys(metas26)){assert.equal(regras.CCO_REGRAS.calcularPrevisto(servico,2026,4),regras.CCO_REGRAS.calcularPrevisto(servico,2026,6));assert.equal(regras.CCO_REGRAS.calcularPrevisto(servico,2026,6),regras.CCO_REGRAS.calcularPrevisto(servico,2026,8));}
assert.deepEqual(Object.fromEntries(["P3","P7","P8","P9","P10","P11"].map(servico=>[servico,regras.CCO_REGRAS.calcularPrevisto(servico,2026,8)])),{P3:12,P7:2,P8:2,P9:11,P10:3,P11:1});
assert.equal(regras.CCO_REGRAS.calcularPrevisto("P1",2026,8,0,26),21223);
assert.notEqual(9,regras.CCO_REGRAS.obterDiasOperacao(2026,8),"dias acumulados de mês incompleto não podem substituir total_dias_mes");

contexto.window.CCO_REGRAS=regras.CCO_REGRAS;
assert.equal(contexto.window.CCOImportacaoPrincipal.normalizarData(28),null,"número pequeno não pode virar data de 1900");
const futuro=contexto.window.CCOImportacaoPrincipal.analisarWorkbook({SheetNames:["Dias_Operação"],Sheets:{"Dias_Operação":[
  ["Ano","Mês","Dias de Operação"],
  [2026,"Agosto",26],[2026,"Setembro",25],[2026,"Outubro",27],[2026,"Dezembro",24],[2027,"Janeiro",26]
] }},"periodos-futuros.xlsx");
assert.deepEqual(Array.from(futuro.periodos),["2026-08","2026-09","2026-10","2026-12","2027-01"]);
const gruposFuturos=contexto.window.CCOImportacaoPrincipal.separarPorPeriodo(futuro);
assert.equal(gruposFuturos.get("2026-09").dias[0].total_dias,25);
assert.equal(gruposFuturos.get("2027-01").dias[0].total_dias,26);
assert.equal(gruposFuturos.get("2026-10").painel.find(item=>item.servico==="P1").previsto,21223/26*27);
assert.equal(gruposFuturos.get("2027-01").painel.find(item=>item.servico==="P3").previsto,12);
const servicos=["P1","P2.1","P2.2","P4","P5","P6","P12"];
const painelAntes=[...servicos.map(servico=>({servico,previsto:0,acumulado:77})),...Object.entries({P3:12,P7:2,P8:2,P9:11,P10:3,P11:1}).map(([servico,previsto])=>({servico,previsto,acumulado:33}))];
const reparos=contexto.window.CCOImportacaoPrincipal.calcularReparosPrevisto({ano:2026,mes:8,periodo:"2026-08",dias:[{total_dias:26}]},painelAntes);
for(const servico of servicos)assert.ok(reparos.find(item=>item.servico===servico).previstoCalculado>0,`${servico} deve ser recalculado pela base oficial`);
assert.deepEqual(Object.fromEntries(reparos.filter(item=>!servicos.includes(item.servico)).map(item=>[item.servico,item.previstoCalculado])),{P3:12,P7:2,P8:2,P9:11,P10:3,P11:1});
assert.ok(reparos.every(item=>!("acumulado" in item)),"reparo não pode transportar nem alterar acumulados");

const metricas={window:{},console};metricas.window.window=metricas.window;vm.createContext(metricas);vm.runInContext(fs.readFileSync("cco-metricas.js","utf8"),metricas);
assert.notEqual(metricas.window.CCOMetricas.calcularPercentualCumprimento({acumuladoReal:50,previstoAcumulado:reparos.find(item=>item.servico==="P1").previstoCalculado}),null,"% execução deve ser calculável após o reparo");

const fonte=fs.readFileSync("cco-importacao-principal.js","utf8"),inicioReparo=fonte.indexOf("hash_armazenado_previsto_recalculado"),trechoReparo=fonte.slice(Math.max(0,inicioReparo-5000),inicioReparo+100);
assert.match(trechoReparo,/gravarDiasOperacao/);
assert.match(trechoReparo,/from\("painel_executivo"\)\.update/);
assert.doesNotMatch(trechoReparo,/from\("operacoes"\)/,"reparo de dias não pode regravar operações");
assert.match(trechoReparo,/precisaRepararPrevisto/,"previsto zero deve acionar reparo mesmo quando os dias já são 26");
assert.match(trechoReparo,/invalidarCachesPeriodo/,"cache com previsto zero deve ser invalidado");
assert.match(fonte,/\[REGRA PREVISTO 26 DIAS\]/);
const fontePainel=fs.readFileSync("painel-geral.js","utf8"),fonteService=fs.readFileSync("services/painelService.js","utf8");
assert.match(fontePainel,/diasOperacaoPorPeriodo\(importacao\.importacao_id,importacao\.ano,importacao\.mes\)/,"Painel deve carregar dias_operacao explicitamente para o período selecionado");
assert.match(fontePainel,/total_dias_mes:diasOperacao\?\.total_dias\?\?null/,"diagnóstico deve expor o total oficial recebido");
assert.match(fonteService,/from\("dias_operacao"\).*eq\("ano",Number\(ano\)\).*eq\("mes",Number\(mes\)\).*importacao_id\.eq\.\$\{id\},importacao_id\.is\.null/s,"consulta oficial deve ser vinculada à importação e ao período, aceitando configuração global");
assert.doesNotMatch(fonteService,/MAX\(data_operacao\)|max\("data_operacao"\)|dias distintos/i);
assert.doesNotMatch(fonte,/obterBasesOficiaisPrevisto|último período oficial|painel_executivo .* CCO_REGRAS\.calcularPrevisto/);
assert.match(fonte,/20260811-previsto-regra-planilha-v3/);

console.log("Agosto: variantes de Dias_Operação, fonte dinâmica e previstos oficiais aprovados.");
