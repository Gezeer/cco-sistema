const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");

function boot(){
  const operacoes=[{id:1,importacao_id:"A",servico:"P2.1",data_operacao:"2025-11-01"},{id:2,importacao_id:"B",servico:"P1",data_operacao:"2025-11-01"},{id:3,importacao_id:"B",servico:"P2.1",data_operacao:"2025-11-02"},{id:4,importacao_id:"B",servico:"P3",data_operacao:"2025-11-03"}],painel=[{id:1,importacao_id:"A",ano:2025,mes:11,servico:"P2.1"},{id:2,importacao_id:"B",ano:2025,mes:11,servico:"P1"},{id:3,importacao_id:"B",ano:2025,mes:11,servico:"P2.1"},{id:4,importacao_id:"B",ano:2025,mes:11,servico:"P3"}];
  const criarQuery=tabela=>{const q={filtros:[],select(){return q},gte(c,v){q.filtros.push(["gte",c,v]);return q},lt(c,v){q.filtros.push(["lt",c,v]);return q},eq(c,v){q.filtros.push(["eq",c,v]);return q},order(){return q},then(resolve){let dados=tabela==="operacoes"?operacoes:painel;for(const[f,c,v]of q.filtros)dados=dados.filter(x=>f==="eq"?x[c]===v:f==="gte"?x[c]>=v:x[c]<v);return Promise.resolve(dados).then(resolve)}};return q};
  const window={CCOSupabase:{getClient:()=>({from:criarQuery}),paginar:async produtor=>await produtor()},CCOMetricas:{normalizarServico:v=>String(v||"").toUpperCase()},CCOCache:{chave:(a,b)=>a+JSON.stringify(b),invalidar(){},lembrar:async(_c,p)=>p()},CCOMobilePerformance:null};window.window=window;const contexto={window,console,AbortController,setTimeout,clearTimeout,performance};vm.createContext(contexto);vm.runInContext(fs.readFileSync("services/painelService.js","utf8"),contexto);return window;
}

test("resolvedor escolhe uma versão completa sem misturar importações e sobrevive a reloads",async()=>{
  for(let reload=0;reload<5;reload++){const w=boot(),r=await w.CCOPainelService.resolverImportacaoPeriodo(2025,11,"A");assert.equal(r.importacao_id,"B");assert.deepEqual([...r.servicos],["P1","P2.1","P3"]);assert.equal(r.operacoesCount,3);assert.equal(r.painelExecutivoCount,3);assert.equal((await w.CCOPainelService.resolverImportacaoPeriodo(2025,12,"D")).importacao_id,"D");assert.equal((await w.CCOPainelService.resolverImportacaoPeriodo(2025,11,"A")).importacao_id,"B");}
});

test("histórico aguarda resolvedor, dias e operações antes do cálculo",()=>{
  const fonte=fs.readFileSync("execucao.js","utf8");assert.match(fonte,/resolverImportacaoPeriodo\(periodo\.ano,periodo\.mes,periodo\.importacao_id\)/);assert.match(fonte,/diasOperacaoPorPeriodo\(periodo\.importacao_id,periodo\.ano,periodo\.mes\)/);assert.match(fonte,/calcularPrevisto\(servico,totalDias\)/);assert.match(fonte,/calcularAcumuladoP1Periodo/);assert.match(fonte,/\[EXECUCAO HISTORICO PERIODO\]/);assert.match(fonte,/importacao-periodo-compartilhada-v3/);assert.doesNotMatch(fonte,/ano\s*===?\s*2025\s*&&\s*mes\s*===?\s*11/);
});
