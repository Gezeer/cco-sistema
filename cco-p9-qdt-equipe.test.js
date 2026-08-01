const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const contexto={window:{},document:{readyState:"loading",addEventListener(){},getElementById(){return null;}},console,Blob,crypto:globalThis.crypto,CustomEvent:function(){}};
contexto.window.window=contexto.window;
vm.createContext(contexto);
vm.runInContext(fs.readFileSync("js/cco-p1-km-total.js","utf8"),contexto);
vm.runInContext(fs.readFileSync("cco-importacao-principal.js","utf8"),contexto);
contexto.XLSX={utils:{sheet_to_json:folha=>folha}};

const api=contexto.window.CCOImportacaoPrincipal;
assert.deepEqual({...api.extrairValorOperacionalP9({Qdt_Catador:15,Qdt_Equipe:1})},{valor:1,campo:"Qdt_Equipe"});
assert.deepEqual({...api.extrairValorOperacionalP9({qdt_catador:15,qdt_equipe:1})},{valor:1,campo:"qdt_equipe"});
assert.equal(api.extrairValorOperacionalP9({Qdt_Catador:15}).valor,null);
assert.equal(api.extrairValorOperacionalP9({qdt_catador:15}).valor,null);
assert.equal(api.ehRawP9({aba:"P9"}),true);
assert.equal(api.ehRawP9({aba:"Catação Em Área Verde",servico:null}),true);
assert.equal(api.ehRawP9({aba:"Outra",dados_originais:{descricao:"Catação em Área Verde"}}),true);
assert.equal(api.ehRawP9({aba:"P8",servico:"P8"}),false);

const workbook={SheetNames:["Catação Em Área Verde"],Sheets:{"Catação Em Área Verde":[
  ["Dados","Qdt_Catador","Qdt_Equipe","Ra","Turno"],
  ["01/07/2026",15,1,"RA I","Diurno"]
]}};
const resultado=api.analisarWorkbook(workbook,"p9-qdt-equipe.xlsx");
assert.equal(resultado.operacoes.length,1);
assert.deepEqual(
  Object.fromEntries(["servico","tipo_servico","aba","qtd_equipe","equipe","executado","data_operacao"].map(campo=>[campo,resultado.operacoes[0][campo]])),
  {servico:"P9",tipo_servico:"P9",aba:"P9",qtd_equipe:1,equipe:1,executado:1,data_operacao:"2026-07-01"}
);
assert.notEqual(resultado.operacoes[0].qtd_equipe,15);

const semEquipe={SheetNames:["P9"],Sheets:{P9:[
  ["Dados","Qdt_Catador","Ra","Turno"],
  ["01/07/2026",15,"RA I","Diurno"]
]}};
const descartado=api.analisarWorkbook(semEquipe,"p9-sem-qdt-equipe.xlsx");
assert.equal(descartado.operacoes.length,0);
assert.ok(descartado.erros.some(item=>item.codigo==="P9_QDT_EQUIPE_AUSENTE"));
assert.equal(typeof contexto.window.reprocessarP9Periodo,"function");

const fonte=fs.readFileSync("cco-importacao-principal.js","utf8");
assert.match(fonte,/\.ilike\("aba","%Cata%"\)/);
assert.match(fonte,/\.ilike\("aba","%rea Verde%"\)/);
assert.match(fonte,/\[P9 OPERAÇÕES CARREGADAS\]/);
assert.match(fonte,/\[P9 DESCARTE\]/);
assert.match(fonte,/window\.confirm\(/);
assert.doesNotMatch(fonte,/Qdt_Catador[^\n]*valorEquipeEscolhido:\s*(?:original|linha)/);
console.log("P9 Qdt_Equipe: parser literal, descarte seguro e rotina administrativa aprovados.");
