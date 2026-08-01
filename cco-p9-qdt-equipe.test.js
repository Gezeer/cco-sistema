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
assert.equal(api.extrairValorOperacionalP9({Qdt_Equipe:4.5333333}).valor,null,"Qdt_Equipe fracionário não pode ser gravado");
assert.equal(api.ehRawP9({aba:"P9"}),true);
assert.equal(api.ehRawP9({aba:"Catação Em Área Verde",servico:null}),true);
assert.equal(api.ehRawP9({aba:"Outra",dados_originais:{descricao:"Catação em Área Verde"}}),true);
assert.equal(api.ehRawP9({aba:"P8",servico:"P8"}),false);
assert.deepEqual(
  {...api.obterQdtEquipeP9({dados_originais:{Qdt_Catador:15,Qdt_Equipe:1}})},
  {valor:1,fonte:'dados_originais["Qdt_Equipe"]',valorOriginal:1,cabecalhoLiteral:"Qdt_Equipe"}
);

assert.equal(api.obterQdtEquipeP9({dados:{qdt_equipe:1}}).valor,null,"qdt_equipe sem metadado literal deve ser rejeitado");
assert.equal(api.obterQdtEquipeP9({dados:{qdt_equipe:1,cabecalho_origem_qdt_equipe:"Qdt_Equipe"}}).valor,1);
assert.deepEqual({...api.obterDataP9({dados_originais:{Data:"03/07/2026"}},2026,7)},{data:"2026-07-03",valorOriginal:"03/07/2026",motivo:null});

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

const rawBase={importacao_id:"imp-julho",aba:"Catação Em Área Verde",servico:null,rd:"RD",dados_originais:{Data:"03/07/2026",Qdt_Catador:15,Qdt_Equipe:1,Ra:"RA I",Turno:"Diurno"},dados:{}};
const operacaoLegada={id:100,importacao_id:"imp-julho",chave_operacao:"chave-antiga",data_operacao:"2026-07-03",ra:"RA I",turno:"Diurno",numero_linha:7,qtd_equipe:4.5333333,equipe:4.5333333,executado:4.5333333};
const preparacaoLegada=api.prepararReprocessamentoP9({raw:[{...rawBase,numero_linha:7}],ano:2026,mes:7,importacaoId:"imp-julho",chavesExistentes:[operacaoLegada]});
assert.equal(preparacaoLegada.prontas.length,1,"chave diferente não pode ser tratada como a mesma operação");
const chaveNova=preparacaoLegada.prontas[0].chave_operacao,preparacaoAmbigua=api.prepararReprocessamentoP9({raw:[{...rawBase,numero_linha:7}],ano:2026,mes:7,importacaoId:"imp-julho",chavesExistentes:[{...operacaoLegada,chave_operacao:chaveNova},{...operacaoLegada,id:101,chave_operacao:chaveNova}]});
assert.equal(preparacaoAmbigua.ambiguidades.length,1,"mais de uma operação com a mesma chave deve abortar a linha");
const operacao1=api.criarOperacaoP9Raw({...rawBase,id:"raw-1",numero_linha:2},{ano:2026,mes:7,importacaoId:"imp-julho"}).operacao;
const operacao2=api.criarOperacaoP9Raw({...rawBase,id:"raw-2",numero_linha:3},{ano:2026,mes:7,importacaoId:"imp-julho"}).operacao;
assert.notEqual(operacao1.chave_operacao,operacao2.chave_operacao,"cada linha deve possuir chave estável distinta");
assert.match(operacao1.chave_operacao,/^P9\|imp-julho\|2026-07-03\|RA I\|Diurno\|2$/);
const preparacao=api.prepararReprocessamentoP9({
  raw:[{...rawBase,id:"raw-1",numero_linha:2},{...rawBase,id:"raw-2",numero_linha:3},{...rawBase,id:"raw-3",numero_linha:3},{aba:"P9",id:"sem-equipe",numero_linha:4,dados_originais:{Data:"03/07/2026",Qdt_Catador:15}},{aba:"P8",servico:"P8",id:"p8",numero_linha:5,dados_originais:{Data:"03/07/2026",Qdt_Equipe:9}}],
  ano:2026,mes:7,importacaoId:"imp-julho",chavesExistentes:[{id:1,...operacao1}]
});
assert.equal(preparacao.identificadas.length,4);
assert.equal(preparacao.rejeitadasIdentificacao.length,1,"P8 não pode entrar na transformação P9");
assert.equal(preparacao.descartadas.filter(item=>item.motivo==="P9_QDT_EQUIPE_AUSENTE").length,1);
assert.equal(preparacao.jaExistentes.length,1);
assert.equal(preparacao.duplicadasNoLote.length,1);
assert.equal(preparacao.prontas.length,1,"a prévia deve manter operação pronta mesmo com chave null entre as existentes");

const preparacaoFracionaria=api.prepararReprocessamentoP9({
  raw:[{...rawBase,id:"raw-fracao",numero_linha:6}],ano:2026,mes:7,importacaoId:"imp-julho",
  chavesExistentes:[{id:99,chave_operacao:"P9|imp-julho|2026-07-03|RA I|Diurno|6",qtd_equipe:0.4666667,equipe:0.4666667,executado:4.5333333}]
});
assert.equal(preparacaoFracionaria.prontas.length,0);
assert.equal(preparacaoFracionaria.corrigirExistentes.length,1,"operação existente fracionária deve ser corrigida pelo Qdt_Equipe literal");
assert.equal(preparacaoFracionaria.corrigirExistentes[0].classificacao,"ATUALIZAR");
assert.deepEqual(
  Object.fromEntries(["qtd_equipe","equipe","executado"].map(campo=>[campo,preparacaoFracionaria.corrigirExistentes[0].operacao[campo]])),
  {qtd_equipe:1,equipe:1,executado:1}
);

const semEquipe={SheetNames:["P9"],Sheets:{P9:[
  ["Dados","Qdt_Catador","Ra","Turno"],
  ["01/07/2026",15,"RA I","Diurno"]
]}};
const descartado=api.analisarWorkbook(semEquipe,"p9-sem-qdt-equipe.xlsx");
assert.equal(descartado.operacoes.length,0);
assert.ok(descartado.erros.some(item=>item.codigo==="P9_QDT_EQUIPE_AUSENTE"));
assert.equal(typeof contexto.window.reprocessarP9Periodo,"function");

const fonte=fs.readFileSync("cco-importacao-principal.js","utf8");
assert.match(fonte,/\.eq\("importacao_id",importacaoId\)/);
assert.match(fonte,/\[P9 RAW CARREGADO\]/);
assert.match(fonte,/\[P9 OPERAÇÕES EXISTENTES\]/);
assert.match(fonte,/\[P9 OPERAÇÕES GERADAS\]/);
assert.match(fonte,/\[P9 DESCARTE\]/);
assert.match(fonte,/\[P9 INSERT ANTES\]/);
assert.match(fonte,/\[P9 INSERT DEPOIS\]/);
assert.match(fonte,/\[P9 ANTES DA CORREÇÃO\]/);
assert.match(fonte,/\[P9 CORREÇÃO PRÉVIA\]/);
assert.match(fonte,/\[P9 DEPOIS DA CORREÇÃO\]/);
assert.match(fonte,/\[P9 UPDATE\]/);
assert.match(fonte,/\[P9 CLASSIFICAÇÃO\]/);
assert.match(fonte,/quantidadeAtualizada/);
assert.match(fonte,/quantidadeInserida/);
assert.match(fonte,/quantidadeJaCorreta/);
assert.match(fonte,/AMBIGUIDADE_DE_VINCULO/);
assert.match(fonte,/quantidadeRealmenteInserida/);
assert.match(fonte,/primeiraLinhaEnviada/);
assert.match(fonte,/erroSupabase/);
assert.match(fonte,/window\.confirm\(/);
assert.match(fs.readFileSync("index.html","utf8"),/20260731-p9-reprocessamento-final-v1/);
assert.doesNotMatch(fonte,/Qdt_Catador[^\n]*valorEquipeEscolhido:\s*(?:original|linha)/);
console.log("P9 Qdt_Equipe: parser literal, descarte seguro e rotina administrativa aprovados.");
