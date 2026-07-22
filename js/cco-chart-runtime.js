(function iniciarRuntimeGraficosCCO(global){
  "use strict";
  if(global.CCO_CHART_RUNTIME)return;
  const registros=new Map();
  const mediaGraficosCCO=global.matchMedia("(max-width: 900px)");
  let timerBreakpointCCO=null,timerResizeCCO=null;

  function registrar(config){
    if(!config?.id)return null;
    const atual=registros.get(config.id)||{id:config.id,instancia:null,observer:null,ultimoModo:null};
    const registro={...atual,...config};registros.set(config.id,registro);return registro;
  }
  const obter=id=>registros.get(id)||null;
  function destruir(id){
    const registro=registros.get(id),host=document.getElementById(id),instancia=host?global.echarts?.getInstanceByDom?.(host):registro?.instancia;
    registro?.observer?.disconnect?.();if(registro)registro.observer=null;
    if(instancia&&!instancia.isDisposed?.())instancia.dispose();
    if(registro)registro.instancia=null;
  }
  function destruirTodos(){for(const id of registros.keys())destruir(id);}
  async function aguardarHostGraficoCCO(id,tentativas=20){
    for(let tentativa=0;tentativa<tentativas;tentativa+=1){
      const host=document.getElementById(id),estilo=host?getComputedStyle(host):null;
      if(host?.isConnected&&host.clientWidth>=120&&host.clientHeight>=120&&estilo?.display!=="none"&&estilo?.visibility!=="hidden")return host;
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }
    return null;
  }
  async function renderizarGraficoCCO(id,criarOpcaoDesktop,criarOpcaoMobile,dados){
    const host=await aguardarHostGraficoCCO(id);if(!host){console.error("[CCO Gráficos] Host inválido",id);return null;}
    const mobile=mediaGraficosCCO.matches,modo=mobile?"mobile":"desktop",existente=global.echarts?.getInstanceByDom?.(host);if(existente&&!existente.isDisposed())existente.dispose();
    host.replaceChildren();
    const instancia=global.echarts.init(host,null,{renderer:"canvas",width:host.clientWidth,height:host.clientHeight}),opcao=(mobile?criarOpcaoMobile:criarOpcaoDesktop)(dados);
    instancia.setOption(opcao,{notMerge:true,replaceMerge:["series","xAxis","yAxis","legend","grid","dataZoom"],lazyUpdate:false});
    requestAnimationFrame(()=>{if(!instancia.isDisposed())instancia.resize({width:host.clientWidth,height:host.clientHeight});});
    const registro=registrar({id,criarOpcaoDesktop,criarOpcaoMobile,dados,render:()=>renderizarGraficoCCO(id,criarOpcaoDesktop,criarOpcaoMobile,dados)});registro.instancia=instancia;registro.ultimoModo=modo;return instancia;
  }
  function redimensionarTodos(){for(const registro of registros.values()){const host=document.getElementById(registro.id);if(host&&registro.instancia&&!registro.instancia.isDisposed?.()&&host.clientWidth>0&&host.clientHeight>0)registro.instancia.resize({width:host.clientWidth,height:host.clientHeight});}}
  mediaGraficosCCO.addEventListener?.("change",()=>{clearTimeout(timerBreakpointCCO);timerBreakpointCCO=setTimeout(async()=>{const renderizadores=[...registros.values()].map(item=>item.render).filter(Boolean);destruirTodos();await Promise.all(renderizadores.map(render=>render()));global.dispatchEvent(new CustomEvent("cco:breakpoint-alterado",{detail:{mobile:mediaGraficosCCO.matches,mudouBreakpoint:true}}));},180);});
  global.addEventListener("resize",()=>{clearTimeout(timerResizeCCO);timerResizeCCO=setTimeout(redimensionarTodos,120);},{passive:true});
  global.addEventListener("cco:menu-fechado",()=>setTimeout(redimensionarTodos,100));
  global.diagnosticarGraficosCCO=function diagnosticarGraficosCCO(){const linhas=[];document.querySelectorAll(".cco-chart-host").forEach(host=>{const instancia=global.echarts?.getInstanceByDom?.(host),canvas=host.querySelector("canvas"),estilo=getComputedStyle(host),estiloCanvas=canvas?getComputedStyle(canvas):null;linhas.push({id:host.id,largura:host.clientWidth,altura:host.clientHeight,display:estilo.display,canvas:Boolean(canvas),canvasDisplay:estiloCanvas?.display??null,canvasVisibility:estiloCanvas?.visibility??null,instancia:Boolean(instancia)});});console.table(linhas);return linhas;};
  global.aguardarHostGraficoCCO=aguardarHostGraficoCCO;global.renderizarGraficoCCO=renderizarGraficoCCO;
  global.CCO_CHART_RUNTIME=Object.freeze({registrar,obter,destruir,destruirTodos,renderizarGraficoCCO,aguardarHostGraficoCCO,redimensionarTodos,registros,mediaGraficosCCO});
})(window);
