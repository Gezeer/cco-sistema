const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const contexto={window:{}};
vm.createContext(contexto);
vm.runInContext(fs.readFileSync("services/painelService.js","utf8"),contexto);

const montar=contexto.window.CCOPainelService.montarCatalogoPorOperacoes;
const periodosEsperados=["2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07"];
const operacoes=periodosEsperados.flatMap((periodo,indice)=>{
  const[ano,mes]=periodo.split("-");
  return[
    {importacao_id:`importacao-${indice}`,data_operacao:`${ano}-${mes}-01`},
    {importacao_id:`importacao-${indice}`,data_operacao:`${ano}-${mes}-15`}
  ];
});
const importacoes=periodosEsperados.map((periodo,indice)=>({
  id:`importacao-${indice}`,
  ano:Number(periodo.slice(0,4)),
  mes:Number(periodo.slice(5)),
  status:"concluida",
  ativa:periodo==="2026-06"||periodo==="2026-07",
  criado_em:`2026-07-${String(indice+1).padStart(2,"0")}T00:00:00Z`
}));

const catalogo=montar(operacoes,importacoes);
assert.equal(catalogo.map(item=>item.periodo).join(","),[...periodosEsperados].reverse().join(","));
assert.equal(catalogo.length,9);
assert.ok(catalogo.some(item=>item.periodo==="2025-11"&&!item.ativa));
assert.ok(catalogo.every(item=>item.origem==="operacoes.data_operacao"));

const fonte=fs.readFileSync("services/painelService.js","utf8");
const execucao=fs.readFileSync("execucao.js","utf8");
const painelGeral=fs.readFileSync("painel-geral.js","utf8");
const utils=fs.readFileSync("utils.js","utf8");
assert.doesNotMatch(fonte,/from\("importacoes"\)[\s\S]{0,180}\.eq\("ativa",\s*true\)/);
assert.match(fonte,/from\("operacoes"\)\.select\("importacao_id,data_operacao"\)/);
assert.match(fonte,/getCatalogoPeriodos/);
assert.match(fonte,/from\("dias_operacao"\)\.select\("importacao_id,ano,mes,total_dias"\)/);
assert.doesNotMatch(execucao,/v_periodos_operacionais/);
assert.doesNotMatch(execucao,/painel_executivo"\)\.select\("[^"]*percentual/);
assert.match(execucao,/CCOPainelService\.getCatalogoPeriodos\(\)/);
assert.doesNotMatch(execucao,/Período de execução não encontrado no catálogo/);
assert.doesNotMatch(painelGeral,/v_periodos_operacionais/);
assert.doesNotMatch(utils,/Aba Dias_Operação não encontrada/);
assert.doesNotMatch(utils,/obterTotalDiasMesDaAbaDiasOperacao/);
console.log("Catálogo: 9 períodos derivados de operacoes.data_operacao aprovados.");
