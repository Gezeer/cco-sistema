const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const fonte=fs.readFileSync("painel-geral.js","utf8");

test("Painel reutiliza o resolvedor compartilhado de importação completa",()=>{
  assert.match(fonte,/function resolverImportacaoCompletaNovembro2025/);
  assert.match(fonte,/CCOPainelService\.resolverImportacaoPeriodo\(importacao\.ano,importacao\.mes,importacao\.importacao_id\)/);
  assert.match(fonte,/imp=await resolverImportacaoCompletaNovembro2025\(imp\)/);
  assert.match(fonte,/\[NOVEMBRO 2025 DIAGNOSTICO\]/);
  assert.match(fonte,/\[PAINEL PERIODO FONTES\]/);
  assert.match(fonte,/\[PAINEL SERVICOS ENCONTRADOS\]/);
  assert.match(fonte,/\[PAINEL SERVICOS RENDER\]/);
});

test("P1 na primeira página não elimina serviços das páginas seguintes",()=>{
  const paginas=[[{servico:"P1"}],[{servico:"P2.1"},{servico:"P3"}],[{servico:"P4"},{servico:"P12"}]],ordem=["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];
  const todos=paginas.flat(),servicos=[...new Set(todos.map(item=>item.servico))];
  assert.deepEqual(ordem.filter(item=>servicos.includes(item)),["P1","P2.1","P3","P4","P12"]);
  assert.equal(todos.length,5);
});
