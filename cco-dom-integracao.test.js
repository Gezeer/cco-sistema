const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const contexto={window:{},console:{log(){},warn(){},error(){},table(){}},Date,Error};
contexto.window.window=contexto.window;
vm.createContext(contexto);
vm.runInContext(fs.readFileSync("js/cco-p1-km-total.js","utf8"),contexto);

const painelFonte=fs.readFileSync("painel-geral.js","utf8");
const primeiroFonte=painelFonte.match(/function primeiroNumeroPositivo\(\.\.\.valores\)[\s\S]*?(?=\s*function primeiroNumeroPositivoCCO)/)?.[0];
const consolidacaoP9Fonte=painelFonte.match(/function calcularConsolidacaoP9Painel\(operacoesP9,valorAtual=0\)[\s\S]*?(?=\s*function calcularP9PorOperacoes)/)?.[0];
const calcularP9Fonte=painelFonte.match(/function calcularP9PorOperacoes\(operacoesP9\)[\s\S]*?(?=\s*function obterAcumuladoRealP9)/)?.[0];
assert.ok(primeiroFonte&&consolidacaoP9Fonte&&calcularP9Fonte,"funções finais do P9 devem permanecer rastreáveis");
vm.runInContext(`const numero=v=>{const n=Number(v);return Number.isFinite(n)?n:0};const dataIso=v=>String(v||"").slice(0,10);${primeiroFonte};${consolidacaoP9Fonte};${calcularP9Fonte};window.calcularP9PorOperacoes=calcularP9PorOperacoes;`,contexto);

const p1=[
  {importacao_id:"julho",servico:"P1",data_operacao:"2026-07-10",peso_t:40,viagens:4,dados_originais:{Km_Total:100}},
  {importacao_id:"julho",servico:"P1",data_operacao:"2026-07-11",peso_t:60,viagens:6,dados_originais:{Km_Total:150}}
];
const p9=[
  {servico:"P9",data_operacao:"2026-07-10",qtd_equipe:0,equipe:2,executado:9},
  {servico:"P9",data_operacao:"2026-07-11",qtd_equipe:null,equipe:0,executado:3}
];
const elementos=Object.fromEntries(["acumulado","peso","km","produtividade","distancia","p9Acumulado","p9Valor"].map(id=>[id,{textContent:""}]));
function renderizarDOM(){
  const peso=p1.reduce((total,item)=>total+item.peso_t,0),viagens=p1.reduce((total,item)=>total+item.viagens,0);
  const km=contexto.window.calcularKmTotalP1Periodo({ano:2026,mes:7,importacaoId:"julho",registrosRaw:p1});
  const acumuladoP9=contexto.window.calcularP9PorOperacoes(p9),valorUnitarioP9=50;
  elementos.acumulado.textContent=String(peso);elementos.peso.textContent=String(peso);elementos.km.textContent=String(km);
  elementos.produtividade.textContent=String(peso/viagens);elementos.distancia.textContent=String(km/viagens);
  elementos.p9Acumulado.textContent=String(acumuladoP9);elementos.p9Valor.textContent=String(acumuladoP9*valorUnitarioP9);
}
renderizarDOM();renderizarDOM();
assert.deepEqual(Object.fromEntries(Object.entries(elementos).map(([id,el])=>[id,Number(el.textContent)])),{acumulado:100,peso:100,km:250,produtividade:10,distancia:25,p9Acumulado:5,p9Valor:250});
assert.ok(Number(elementos.p9Acumulado.textContent)>0);

const utilsFonte=fs.readFileSync("utils.js","utf8"),execucaoHtml=fs.readFileSync("execucao.html","utf8"),indexHtml=fs.readFileSync("index.html","utf8");
assert.match(utilsFonte,/\[ÚLTIMA ESCRITA CCO\]/);
assert.match(utilsFonte,/\[RENDER EXECUÇÃO\]/);
assert.match(utilsFonte,/\[RENDER PAINEL\]/);
assert.match(utilsFonte,/ccoAtivarListenersExecucaoDinamica\(\) \{\s*if\(String\(window\.CCO_PAGE/);
assert.match(execucaoHtml,/utils\.js\?v=20260806-execucao-race-periodo-servico-v1/);
assert.match(indexHtml,/const VERSAO_CCO = "20260731-ultima-escrita-v1"/);
console.log("Integração DOM: duas renderizações preservaram P1 e P9 sem sobrescrita legada.");
