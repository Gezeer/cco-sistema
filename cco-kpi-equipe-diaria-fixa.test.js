const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const fonte=fs.readFileSync("kpi.js","utf8");
const html=fs.readFileSync("kpi.html","utf8");
const funcao=fonte.match(/function criarSerieEquipeContratualDiariaKPI\(servico,ano,mes\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(funcao,"função do dataset diário deve permanecer testável");

const matriz={P3:12,P7:2,P8:2,P9:11,P10:3,P11:1};
const contexto={window:{CCOMetricas:{obterPrevistoEquipeServico:servico=>matriz[servico]??null}}};
vm.createContext(contexto);
vm.runInContext(`${funcao};window.criar=criarSerieEquipeContratualDiariaKPI;`,contexto);
const criar=contexto.window.criar;

for(const [servico,previsto] of Object.entries(matriz)){
  const serie=criar(servico,2026,7);
  assert.equal(serie.length,31,`${servico} deve possuir todos os dias de julho`);
  assert.ok(serie.every(item=>item.previsto===previsto&&item.executado===previsto),`${servico} deve usar ${previsto} nas duas séries`);
}
assert.equal(criar("P9",2026,6).length,30);
assert.equal(criar("P9",2026,2).length,28);
assert.equal(criar("P9",2024,2).length,29);
assert.equal(criar("P1",2026,7),null,"serviço fora da matriz não pode usar a regra fixa");

const p9=criar("P9",2026,7),primeiro=p9[0];
assert.deepEqual({...primeiro},{data:"2026-07-01",previsto:11,executado:11});
assert.equal(primeiro.executado-primeiro.previsto,0);
assert.equal(primeiro.executado/primeiro.previsto*100,100);
assert.match(fonte,/nome:"Previsto"[\s\S]*nome:"Executado"/);
assert.match(fonte,/Diferença: \$\{formatar\(diferenca\)\}/);
assert.match(fonte,/Execução: \$\{percentual\.toLocaleString/);
assert.doesNotMatch(funcao,/registros|peso|km|viagens|valor|executado genérico/i);
assert.match(html,/kpi\.js\?v=20260805-kpi-rotulos-mensais-v1/);

console.log("KPI diário de equipes: matriz oficial, calendário real e séries fixas aprovados.");
