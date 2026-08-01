const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const fonte=fs.readFileSync("painel-geral.js","utf8");
const primeiro=fonte.match(/function primeiroNumeroPositivo\(\.\.\.valores\)[\s\S]*?(?=\s*function primeiroNumeroPositivoCCO)/)?.[0];
const consolidar=fonte.match(/function calcularConsolidacaoP9Painel\(operacoesP9,valorAtual=0\)[\s\S]*?(?=\s*function calcularP9PorOperacoes)/)?.[0];
const obter=fonte.match(/function obterAcumuladoRealP9\(linhaPainel,operacoesP9\)[\s\S]*?(?=\s*function calcularAcumuladoP9)/)?.[0];
assert.ok(primeiro&&consolidar&&obter);

const contexto={window:{CCO_REGRAS:{obterEquipeFixa:()=>11}},console:{log(){}},Math,Object,Map,String,Number};
vm.createContext(contexto);
vm.runInContext(`const numero=v=>{const n=Number(v);return Number.isFinite(n)?n:0};const dataIso=v=>String(v||"").slice(0,10);${primeiro};${consolidar};${obter};window.calcularConsolidacaoP9Painel=calcularConsolidacaoP9Painel;window.obterAcumuladoRealP9=obterAcumuladoRealP9;`,contexto);

const registros=[
  {data_operacao:"2026-07-01",qtd_equipe:1},{data_operacao:"2026-07-01",qtd_equipe:2},{data_operacao:"2026-07-01",qtd_equipe:3},
  {data_operacao:"2026-07-02",qtd_equipe:5},{data_operacao:"2026-07-03",qtd_equipe:8},{data_operacao:"2026-07-03",qtd_equipe:11}
];
const resultado=contexto.window.calcularConsolidacaoP9Painel(registros,4.53);
const previsto=11,percentual=resultado.acumulado/previsto*100,valorTotal=resultado.acumulado*122039.23;
assert.deepEqual({acumulado:resultado.acumulado,previsto,percentual,valorTotal},{acumulado:11,previsto:11,percentual:100,valorTotal:1342431.53});
assert.equal(resultado.diagnostico.datasDistintas,3);
assert.equal(resultado.diagnostico.somaMaximosDiarios,19);
assert.notEqual(resultado.acumulado,4.53,"o acumulado não pode reutilizar a média antiga");
assert.notEqual(resultado.acumulado,19,"o acumulado não pode somar máximos diários");
assert.equal(contexto.window.calcularConsolidacaoP9Painel([...registros,{data_operacao:"2026-07-04",qtd_equipe:11}]).acumulado,11,"repetir 11 em vários dias não pode somar");
assert.equal(contexto.window.calcularConsolidacaoP9Painel([{data_operacao:"2026-07-01",qtd_equipe:15}]).acumulado,11,"Painel deve respeitar o limite contratual");
assert.equal(contexto.window.obterAcumuladoRealP9({acumulado:4.53},registros),11,"operações P9 devem ter prioridade sobre painel_executivo fracionário");
assert.equal(contexto.window.obterAcumuladoRealP9({acumulado:4.53},[]),4.53,"linha executiva permanece apenas como fallback sem operações");
console.log("Painel P9: máximo operacional mensal, teto 11 e valor financeiro aprovados.");
