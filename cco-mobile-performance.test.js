const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const fonte=fs.readFileSync("js/cco-mobile-performance.js","utf8"),historico=fs.readFileSync("historico.js","utf8"),graficos=fs.readFileSync("js/cco-graficos-3d.js","utf8");
function ambiente({mobile=true,reduzido=false}={}){
  const listeners=[],observados=new Set();let callbackIO=null;
  const document={addEventListener(tipo,fn){listeners.push([document,tipo,fn]);},getElementsByTagName:()=>({length:25})};
  const window={innerWidth:mobile?390:1280,innerHeight:700,performance:{now:()=>10},matchMedia:q=>({matches:q.includes("767")?mobile:q.includes("reduced")?reduzido:false}),addEventListener(tipo,fn){listeners.push([window,tipo,fn]);}};
  class IntersectionObserver{constructor(fn,opcoes){callbackIO=fn;this.opcoes=opcoes;}observe(el){observados.add(el)}unobserve(el){observados.delete(el)}}window.IntersectionObserver=IntersectionObserver;
  const contexto={window,document,location:{pathname:"/execucao.html"},IntersectionObserver,Map,WeakMap,Promise,Date,console};vm.createContext(contexto);vm.runInContext(fonte,contexto);return{window,document,listeners,observados,entrar:el=>callbackIO?.([{target:el,isIntersecting:true}])};
}
(async()=>{
  const a=ambiente(),api=a.window.CCOMobilePerformance;assert.equal(a.window.CCOEhMobile(),true);assert.equal(a.window.CCO_PREFERS_REDUCED_MOTION,false);
  let consultas=0;const contexto={pagina:"kpi",ano:2026,mes:7,servico:"P1",importacaoId:"imp-7"},produtor=async()=>{consultas++;return[1,2]};
  const p1=api.dados(contexto,produtor),p2=api.dados(contexto,produtor);assert.strictEqual(await p1,await p2);assert.equal(consultas,1,"Promise compartilhada deve impedir consulta duplicada");
  await api.dados(contexto,produtor);assert.equal(consultas,1,"cache hit não deve consultar novamente");
  api.invalidar("imp-7");await api.dados(contexto,produtor);assert.equal(consultas,2,"invalidação deve permitir nova consulta");
  let eventos=0;assert.equal(api.registrarListener("teste:unico",a.window,"resize",()=>eventos++),true);assert.equal(api.registrarListener("teste:unico",a.window,"resize",()=>eventos++),false);
  const container={id:"grafico",dataset:{},setAttribute(){},getBoundingClientRect:()=>({top:1200})};let renders=0;api.agendarGrafico(container,()=>renders++);assert.equal(renders,0,"gráfico fora da viewport deve aguardar");a.entrar(container);await Promise.resolve();await Promise.resolve();assert.equal(renders,1);a.entrar(container);await Promise.resolve();assert.equal(renders,1,"segunda entrada não pode duplicar gráfico");
  const desktop=ambiente({mobile:false}),containerDesktop={dataset:{},setAttribute(){},getBoundingClientRect:()=>({top:2000})};let desktopRenders=0;desktop.window.CCOMobilePerformance.agendarGrafico(containerDesktop,()=>desktopRenders++);assert.equal(desktopRenders,1,"desktop deve manter renderização imediata");
  assert.match(graficos,/animacao:mobile\?250:900/);assert.match(graficos,/movimentoReduzido\?0:cfg\.animacao/);assert.match(graficos,/atualizarEsperaResize\(\)/);assert.match(graficos,/\?450:150/);
  assert.match(fonte,/function debounce\(chave,funcao,espera=275\)/);assert.match(fs.readFileSync("execucao.js","utf8"),/execucao:filtro-mes[\s\S]*275/);
  assert.match(historico,/const esc=[\s\S]*LOTE=20/);assert.match(historico,/dados\.slice\(0,visiveis\)/);assert.match(historico,/global\.CCOEhMobile\?\.\(\)\?Math\.min\(LOTE,dados\.length\):dados\.length/);
  assert.match(fs.readFileSync("js/cco-analytics-graficos.js","utf8"),/CCOMobilePerformance\.agendarGrafico/);
  assert.doesNotMatch(fonte,/peso_t|km_total|previsto|acumulado/,"camada de desempenho não pode conter fórmulas operacionais");
  console.log("Performance mobile: cache, Promise, invalidação, lazy chart, listeners, histórico e desktop aprovados.");
})().catch(error=>{console.error(error);process.exitCode=1});
