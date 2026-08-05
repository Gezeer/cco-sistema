(function criarPerformanceMobileCCO(global){
  "use strict";
  const TTL=5*60*1000,agora=()=>global.performance?.now?.()??Date.now(),pagina=String(global.CCO_PAGE||location.pathname.split("/").pop()||"index").replace(/\.html$/,""),mobileMedia=global.matchMedia("(max-width: 767px)"),motionMedia=global.matchMedia("(prefers-reduced-motion: reduce)");
  global.CCOEhMobile=()=>mobileMedia.matches;
  global.CCO_PREFERS_REDUCED_MOTION=motionMedia.matches;
  global.__CCO_DADOS_PROMISES__=global.__CCO_DADOS_PROMISES__||new Map();
  global.__CCO_DADOS_CACHE__=global.__CCO_DADOS_CACHE__||new Map();
  global.__CCO_LISTENERS_REGISTRADOS__=global.__CCO_LISTENERS_REGISTRADOS__||new Set();
  const metricas=global.__CCO_PERFORMANCE_METRICAS__={pagina,mobile:global.CCOEhMobile(),largura:global.innerWidth,consultasSupabase:0,graficosCriados:0,listenersRegistrados:0,registrosRecebidos:0,cacheHits:0,cacheMisses:0,inicio:agora(),fases:{}};
  const debug=()=>global.CCO_DEBUG_PERFORMANCE===true;
  function log(etapa,dados={}){if(debug())console.log(`[PERFORMANCE MOBILE][${etapa}]`,{...metricas,...dados,duracaoMs:Number((agora()-metricas.inicio).toFixed(2))});}
  function fase(nome,dados={}){metricas.fases[nome]=agora();log(nome.toUpperCase(),dados);}
  function chaveDados({pagina:pag=pagina,ano="",mes="",servico="",importacaoId=""}={}){return`${pag}|${ano}|${mes}|${servico}|${importacaoId}`;}
  async function dados(contexto,produtor){
    const chave=typeof contexto==="string"?contexto:chaveDados(contexto),item=global.__CCO_DADOS_CACHE__.get(chave),tempo=Date.now();
    if(item&&tempo-item.criadoEm<TTL){metricas.cacheHits++;log("CACHE HIT",{chave});return item.valor;}
    if(global.__CCO_DADOS_PROMISES__.has(chave)){metricas.cacheHits++;log("PROMISE REUTILIZADA",{chave});return global.__CCO_DADOS_PROMISES__.get(chave);}
    metricas.cacheMisses++;metricas.consultasSupabase++;log("CACHE MISS",{chave});
    const promessa=Promise.resolve().then(produtor).then(valor=>{global.__CCO_DADOS_CACHE__.set(chave,{valor,criadoEm:Date.now()});metricas.registrosRecebidos+=Array.isArray(valor)?valor.length:Number(valor?.data?.length||0);fase("CONSULTA",{chave});return valor;}).finally(()=>global.__CCO_DADOS_PROMISES__.delete(chave));
    global.__CCO_DADOS_PROMISES__.set(chave,promessa);return promessa;
  }
  function invalidar(importacaoId=null){for(const mapa of[global.__CCO_DADOS_CACHE__,global.__CCO_DADOS_PROMISES__])for(const chave of mapa.keys())if(!importacaoId||chave.endsWith(`|${importacaoId}`))mapa.delete(chave);}
  function registrarListener(chave,alvo,tipo,listener,opcoes){if(!alvo?.addEventListener||global.__CCO_LISTENERS_REGISTRADOS__.has(chave))return false;alvo.addEventListener(tipo,listener,opcoes);global.__CCO_LISTENERS_REGISTRADOS__.add(chave);metricas.listenersRegistrados++;return true;}
  const graficos=new WeakMap(),timers=new Map();let observador=null;
  function debounce(chave,funcao,espera=275){return function(...args){clearTimeout(timers.get(chave));return new Promise(resolve=>{timers.set(chave,setTimeout(()=>{timers.delete(chave);resolve(funcao.apply(this,args));},espera));});};}
  function observer(){if(observador||!global.IntersectionObserver)return observador;observador=new IntersectionObserver(entradas=>entradas.forEach(entrada=>{if(!entrada.isIntersecting)return;const estado=graficos.get(entrada.target);if(!estado||estado.renderizado||estado.carregando)return;estado.carregando=true;Promise.resolve().then(estado.render).then(()=>{estado.renderizado=true;estado.aguardando=false;metricas.graficosCriados++;fase("GRÁFICOS",{grafico:entrada.target.id});}).finally(()=>estado.carregando=false);observador.unobserve(entrada.target);}),{rootMargin:"200px 0px"});return observador;}
  function agendarGrafico(container,render,{forcar=false}={}){
    if(!global.CCOEhMobile()||forcar){render();metricas.graficosCriados++;return"renderizado";}
    const existente=graficos.get(container);if(existente?.renderizado||existente?.carregando||existente?.aguardando)return existente;
    container.dataset.ccoLazyChart="true";container.setAttribute("aria-busy","true");
    const executar=()=>{container.setAttribute("aria-busy","false");return render();},estado={aguardando:true,carregando:false,renderizado:false,destruido:false,render:executar};graficos.set(container,estado);
    const perto=container.getBoundingClientRect?.().top<=(global.innerHeight||800)+200;if(perto||!observer()){executar();estado.renderizado=true;estado.aguardando=false;metricas.graficosCriados++;return estado;}
    observer().observe(container);return estado;
  }
  function destruirGrafico(container){const estado=graficos.get(container);if(estado){observer()?.unobserve(container);estado.destruido=true;estado.renderizado=false;estado.aguardando=false;}}
  registrarListener("performance:importacao-concluida",document,"cco:importacao-concluida",()=>invalidar(),{passive:true});
  registrarListener("performance:load",global,"load",()=>{for(const nome of["CATÁLOGO","CONSULTA","CARDS","GRÁFICOS"])if(!metricas.fases[nome])log(nome,{observado:false});fase("TOTAL",{nosDOM:document.getElementsByTagName("*").length,memoria:global.performance?.memory?.usedJSHeapSize??null});},{once:true});
  log("INÍCIO");
  global.CCOMobilePerformance=Object.freeze({metricas,log,fase,chaveDados,dados,invalidar,registrarListener,debounce,agendarGrafico,destruirGrafico});
})(window);
