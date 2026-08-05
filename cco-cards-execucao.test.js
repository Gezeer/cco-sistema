const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

let reduzido=false,proximoId=1;const quadros=new Map(),cancelados=[];
const contexto={window:{matchMedia:consulta=>({matches:consulta.includes("prefers-reduced-motion")?reduzido:false}),performance:{now:()=>0},requestAnimationFrame:fn=>{const id=proximoId++;quadros.set(id,fn);return id;},cancelAnimationFrame:id=>{cancelados.push(id);quadros.delete(id);}},document:{getElementById:()=>null,querySelector:()=>null},Intl,Date,Error,console};
contexto.window.window=contexto.window;vm.createContext(contexto);vm.runInContext(fs.readFileSync("js/cco-cards-execucao.js","utf8"),contexto);
const api=contexto.window.CCOCardsExecucao;

const elemento={textContent:"R$ 10,50 km"};
api.animarNumeroCardCCO(elemento,20.5,{valorInicial:10.5,textoFinal:"R$ 20,50 km",prefixo:"R$ ",sufixo:" km",casas:2,duracao:700});
for(const fn of [...quadros.values()])fn(700);
assert.equal(elemento.textContent,"R$ 20,50 km","texto final deve ser exatamente o renderizado");

elemento.textContent="10,00";api.animarNumeroCardCCO(elemento,50,{valorInicial:10,textoFinal:"50,00",casas:2,duracao:700});const anterior=[...quadros.keys()].at(-1);api.animarNumeroCardCCO(elemento,25,{valorInicial:10,textoFinal:"25,00",casas:2,duracao:700});assert.ok(cancelados.includes(anterior),"a animação anterior deve ser cancelada");for(const fn of [...quadros.values()])fn(700);assert.equal(elemento.textContent,"25,00");

reduzido=true;elemento.textContent="0%";api.animarNumeroCardCCO(elemento,37.5,{textoFinal:"37,5%",sufixo:"%",casas:1});assert.equal(elemento.textContent,"37,5%","reduced motion deve atualizar imediatamente");

function listaClasses(){const valores=new Set();return{add:(...xs)=>xs.forEach(x=>valores.add(x)),remove:(...xs)=>xs.forEach(x=>valores.delete(x)),toggle:(x,on)=>on?valores.add(x):valores.delete(x),contains:x=>valores.has(x),valores};}
function card(titulo,valor){const tituloEl={textContent:titulo},valorEl={textContent:valor};return{dataset:{},style:{setProperty(){},removeProperty(){}},classList:listaClasses(),querySelector:seletor=>seletor.includes("span")?tituloEl:seletor.includes("strong")?valorEl:null,addEventListener(){throw new Error("reduced motion/mobile não deve instalar hover 3D");},tituloEl,valorEl};}
const cards=[card("Peso","100 t"),card("Distância Média","25 km/viagem"),card("Status","Não atingido")],container={querySelectorAll:()=>cards},area={classList:listaClasses()};contexto.document.getElementById=id=>id==="detalheServico"?area:null;contexto.document.querySelector=seletor=>seletor==="#detalheServico > .cards"?container:null;
api.animarCardsExecucaoCCO();api.animarCardsExecucaoCCO();assert.equal(cards[0].valorEl.textContent,"100 t");assert.equal(cards[1].valorEl.textContent,"25 km/viagem");assert.equal(cards[0].classList.valores.has("cco-card-entrada"),false,"reduced motion não deve aplicar entrada");
assert.equal(cards[2].classList.valores.has("cco-card-meta-atingida"),false,"Não atingido não pode receber pulso verde");

const fonte=fs.readFileSync("js/cco-cards-execucao.js","utf8");assert.doesNotMatch(fonte,/filtroExecucaoAno|filtroExecucaoMes/);assert.doesNotMatch(fonte,/addEventListener\(["'](?:change|input)["']/);assert.match(fs.readFileSync("execucao.html","utf8"),/20260805-mobile-performance-v1/);
const css=fs.readFileSync("css/execucao.css","utf8");assert.match(css,/@media \(max-width: 1100px\)/);assert.match(css,/@media \(max-width: 760px\)/);assert.match(css,/@media \(max-width: 520px\)/);assert.match(css,/grid-template-columns: minmax\(0, 1fr\)/);assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
console.log("Cards Execução: formato, cancelamento, reduced motion e renderização repetida aprovados.");
