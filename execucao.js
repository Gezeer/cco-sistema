/* Execução P1 a P12 - carregamento completo, sem corte e sem delay. */
(function iniciarPaginaExecucao(){
  window.CCO_PAGE = "execucao";
  const n=valor=>{const numero=Number(valor);return Number.isFinite(numero)?numero:0;};
  const relogioExecucao=()=>globalThis.performance?.now?.()??Date.now();
  const performanceExecucao=window.CCOExecucaoPerformance=(()=>{let inicio=relogioExecucao(),dados={};const campos=["authMs","catalogoMs","resolverPeriodoMs","diasOperacaoMs","painelMs","operacoesMs","cardsMs","historicoMs","graficosMs"];const ativo=()=>window.CCO_DEBUG_EXECUCAO_PERFORMANCE===true;return{reiniciar(){inicio=relogioExecucao();dados=Object.fromEntries(campos.map(campo=>[campo,0]));dados.requestsSupabase=0;dados.cacheHits=0;},async medir(campo,tarefa){if(!ativo())return tarefa();const t=relogioExecucao();try{return await tarefa();}finally{dados[campo]=(dados[campo]||0)+(relogioExecucao()-t);}},contar(campo,qtd=1){if(ativo())dados[campo]=(dados[campo]||0)+qtd;},relatar(){if(!ativo())return;console.log("[EXECUCAO PERFORMANCE]",{...Object.fromEntries(campos.map(campo=>[campo,Number((dados[campo]||0).toFixed(2))])),totalMs:Number((relogioExecucao()-inicio).toFixed(2)),requestsSupabase:dados.requestsSupabase||0,cacheHits:dados.cacheHits||0});}};})();
  performanceExecucao.reiniciar();
  const medirHistorico=async(rotulo,tarefa)=>{const ativo=window.CCO_DEBUG_EXECUCAO_PERFORMANCE===true,label=`[EXEC HIST] ${rotulo}`;if(ativo)console.time(label);try{return await tarefa();}finally{if(ativo)console.timeEnd(label);}};
  const comTimeoutHistorico=(promessa,limiteMs=12000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Object.assign(new Error("Histórico excedeu o tempo limite."),{code:"CCO_EXEC_HIST_TIMEOUT"})),limiteMs);Promise.resolve(promessa).then(valor=>{clearTimeout(timer);resolve(valor);},erro=>{clearTimeout(timer);reject(erro);});});
  const IDS_GRAFICOS_EXECUCAO=Object.freeze(["graficoExecDetalheEvolucao","graficoExecDetalhePeso","graficoExecDetalheViagens","graficoExecDetalheKm","graficoExecDetalheEquipe","graficoExecDetalheHoras","graficoExecDetalheDistancia","graficoExecDetalheTempo"]);
  window.IDS_GRAFICOS_EXECUCAO=IDS_GRAFICOS_EXECUCAO;
  function instalarRenderizacaoDiretaExecucao(){
    window.ccoFinalSecaoGrafico=function(tag,titulo,id){return`<section class="section chart-card" id="secao-${id}"><div class="section-title"><span>${tag}</span><h2>${titulo}</h2></div><div class="cco-chart-wrapper"><div id="${id}" class="cco-chart-host cco-chart-3d cco-chart-3d--principal" role="img" aria-label="${titulo}"></div><div class="cco-chart-state" hidden></div></div></section>`;};
    window.ccoFinalDestruirGraficoCanvas=function(id){window.CCO_GRAFICOS_3D?.destruirGrafico?.(document.getElementById(id));};
    window.ccoFinalCriarBarra=function(id,label,labels,valores){const container=document.getElementById(id),temDados=(valores||[]).some(valor=>n(valor)>0),secao=container?.closest?.(".section, .chart-card");if(secao)secao.style.display=temDados?"":"none";window.CCO_GRAFICOS_3D?.destruirGrafico?.(container);if(!container||!temDados)return null;return window.CCO_GRAFICOS_3D?.renderizarDireto?.(container,{tipo:cfg=>cfg.mobile?"horizontal":"cilindro",categorias:labels,valores:(valores||[]).map(n),nomeSerie:label,formatarRotulo:window.ccoFinalFormatarNumero,altura:Math.max(250,(labels||[]).length*38)});};
    window.ccoFinalCriarLinha=function(id,label,labels,valores){const container=document.getElementById(id),temDados=(valores||[]).some(valor=>n(valor)!==0),secao=container?.closest?.(".section, .chart-card");if(secao)secao.style.display=temDados?"":"none";window.CCO_GRAFICOS_3D?.destruirGrafico?.(container);if(!container||!temDados)return null;return window.CCO_GRAFICOS_3D?.criarLinhaComProfundidade?.({container,categorias:labels,valores:(valores||[]).map(n),nomeSerie:label});};
  }
  instalarRenderizacaoDiretaExecucao();

  const MESES=window.MESES_BR||{"01":"Janeiro","02":"Fevereiro","03":"Março","04":"Abril","05":"Maio","06":"Junho","07":"Julho","08":"Agosto","09":"Setembro","10":"Outubro","11":"Novembro","12":"Dezembro"};
  let catalogoExecucaoPromise=null,requisicaoPeriodoExecucao=0;
  const pad=valor=>String(Number(valor)).padStart(2,"0");
  const periodoChave=(ano,mes)=>`${Number(ano)}-${pad(mes)}`;
  function criarContextoExecucaoCCO({ano,mes,servico,importacaoId}){
    const sequencia=++requisicaoPeriodoExecucao,contexto={pagina:"execucao",ano:String(ano),mes:pad(mes),servico:String(servico||"").toUpperCase(),importacaoId:String(importacaoId||""),sequencia};
    contexto.chave=[contexto.servico,contexto.ano,contexto.mes,contexto.importacaoId,sequencia].join("|");
    window.__CCO_EXECUCAO_CONTEXTO_ATUAL__=contexto;window.__CCO_EXECUCAO_REQUISICAO_ATUAL__=contexto.chave;window.__CCO_EXECUCAO_RENDER_TOKEN__=contexto.chave;
    return contexto;
  }
  function contextoExecucaoAtualCCO(contexto){
    if(!contexto||window.__CCO_EXECUCAO_CONTEXTO_ATUAL__?.chave!==contexto.chave)return false;
    const ano=String(document.getElementById("filtroExecucaoAno")?.value||""),mes=pad(document.getElementById("filtroExecucaoMes")?.value||0),servico=String(window.obterServicoAtivo?.()||"").toUpperCase();
    return ano===contexto.ano&&mes===contexto.mes&&servico===contexto.servico;
  }
  window.criarContextoExecucaoCCO=criarContextoExecucaoCCO;window.contextoExecucaoAtualCCO=contextoExecucaoAtualCCO;
  async function carregarCatalogoExecucaoCCO(forcar=false){
    if(!forcar&&catalogoExecucaoPromise)return catalogoExecucaoPromise;
    catalogoExecucaoPromise=(async()=>{
      if(!window.CCOPainelService?.getCatalogoPeriodos)throw new Error("painelService indisponível.");
      const catalogo=await window.CCOPainelService.getCatalogoPeriodos();
      window.__CCO_CATALOGO_EXECUCAO__=catalogo;
      return catalogo;
    })();
    try{return await catalogoExecucaoPromise;}catch(error){catalogoExecucaoPromise=null;throw error;}
  }
  function obterMesesDoAnoExecucao(catalogo,ano){return[...new Set((catalogo||[]).filter(item=>Number(item.ano)===Number(ano)).map(item=>Number(item.mes)).filter(Number.isFinite))].sort((a,b)=>a-b);}
  function localizarPeriodoExecucao(catalogo,ano,mes){return(catalogo||[]).find(item=>Number(item.ano)===Number(ano)&&Number(item.mes)===Number(mes))||null;}
  function preencherFiltroAnoExecucao(selectAno,anos,valorPreferido){
    const valorAtual=Number(valorPreferido);selectAno.replaceChildren();
    for(const ano of anos){const option=document.createElement("option");option.value=String(ano);option.textContent=String(ano);selectAno.appendChild(option);}
    if(anos.includes(valorAtual))selectAno.value=String(valorAtual);else if(anos.length)selectAno.value=String(Math.max(...anos));
  }
  function preencherFiltroMesExecucao(selectMes,meses,valorPreferido){
    const preferido=Number(valorPreferido);selectMes.replaceChildren();
    for(const mes of meses){const option=document.createElement("option");option.value=pad(mes);option.textContent=MESES[pad(mes)]||pad(mes);selectMes.appendChild(option);}
    if(meses.includes(preferido))selectMes.value=pad(preferido);else if(meses.length)selectMes.value=pad(Math.max(...meses));
  }
  async function renderizarPeriodoExecucaoInterno(periodo){
    if(!periodo){console.warn("[EXECUÇÃO] período solicitado não existe no catálogo oficial.");return false;}
    const servico=String(window.obterServicoAtivo?.()||"").toUpperCase(),normalizado={...periodo,ano:String(periodo.ano),mes:pad(periodo.mes),periodo:periodoChave(periodo.ano,periodo.mes),id:periodo.importacao_id},contexto=criarContextoExecucaoCCO({ano:periodo.ano,mes:periodo.mes,servico,importacaoId:periodo.importacao_id}),chaveRequisicao=contexto.chave;
    normalizado.__ccoChaveRequisicao=chaveRequisicao;normalizado.__ccoContextoExecucao=contexto;
    console.log("[EXECUÇÃO Períodos] carregando",{ano:Number(normalizado.ano),mes:Number(normalizado.mes),importacaoId:normalizado.importacao_id});
    window.animarCardsExecucaoCCO?.({carregando:true});
    try{const publicada=await window.carregarPeriodoCCO(normalizado);if(publicada===false||!contextoExecucaoAtualCCO(contexto)){console.warn("[EXECUÇÃO RESPOSTA DESCARTADA]",{ano:normalizado.ano,mes:normalizado.mes,servico,importacaoId:normalizado.importacao_id,chave:chaveRequisicao});return false;}}catch(error){window.animarCardsExecucaoCCO?.({carregando:false,erro:error});throw error;}
    if(typeof window.definirPeriodoExecucaoAtivoCCO==="function")window.definirPeriodoExecucaoAtivoCCO(normalizado.ano,normalizado.mes);else{window.filtroExecucaoAnoAtual=normalizado.ano;window.filtroExecucaoMesAtual=normalizado.mes;}
    localStorage.setItem("cco_execucao_periodo",JSON.stringify({ano:Number(normalizado.ano),mes:Number(normalizado.mes)}));
    const inicioCards=relogioExecucao();
    if(typeof carregarFiltroMesesComparativoExecucao==="function")carregarFiltroMesesComparativoExecucao();
    if(typeof renderTabelaContratualMensal==="function")renderTabelaContratualMensal();
    if(typeof renderComparativoMesesExecucao==="function")renderComparativoMesesExecucao();
    const codigo=window.obterServicoAtivo?.();if(codigo&&codigo!=="geral"&&contextoExecucaoAtualCCO(contexto))window.renderDetalheServicoMensal?.(codigo,contexto);
    performanceExecucao.contar("cardsMs",relogioExecucao()-inicioCards);if(!codigo||codigo==="geral")performanceExecucao.relatar();
    return true;
  }
  async function renderizarPeriodoExecucao(periodo){return window.CCOBootDiagnostics?window.CCOBootDiagnostics.medir("renderizarPeriodoExecucao","execucao.js",()=>renderizarPeriodoExecucaoInterno(periodo),periodo?.periodo||""):renderizarPeriodoExecucaoInterno(periodo);}
  async function alterarAnoExecucaoCCO(){
    const catalogo=await carregarCatalogoExecucaoCCO(),selectAno=document.getElementById("filtroExecucaoAno"),selectMes=document.getElementById("filtroExecucaoMes"),ano=Number(selectAno?.value),meses=obterMesesDoAnoExecucao(catalogo,ano);
    console.log("[EXECUÇÃO Períodos] ano alterado",{ano,mesesDisponiveis:meses});
    preencherFiltroMesExecucao(selectMes,meses,Math.max(...meses));
    return renderizarPeriodoExecucao(localizarPeriodoExecucao(catalogo,ano,selectMes.value));
  }
  async function alterarMesExecucaoCCOInterno(){const catalogo=await carregarCatalogoExecucaoCCO(),ano=Number(document.getElementById("filtroExecucaoAno")?.value),mes=Number(document.getElementById("filtroExecucaoMes")?.value);return renderizarPeriodoExecucao(localizarPeriodoExecucao(catalogo,ano,mes));}
  async function alterarMesExecucaoCCO(){return window.CCOBootDiagnostics?window.CCOBootDiagnostics.medir("alterarMesExecucaoCCO","execucao.js",alterarMesExecucaoCCOInterno):alterarMesExecucaoCCOInterno();}
  const debounceExecucao=window.CCOMobilePerformance?.debounce;window.carregarCatalogoExecucaoCCO=carregarCatalogoExecucaoCCO;window.obterMesesDoAnoExecucao=obterMesesDoAnoExecucao;window.localizarPeriodoExecucao=localizarPeriodoExecucao;window.alterarAnoExecucaoCCO=debounceExecucao?debounceExecucao("execucao:filtro-ano",alterarAnoExecucaoCCO,275):alterarAnoExecucaoCCO;window.alterarMesExecucaoCCO=debounceExecucao?debounceExecucao("execucao:filtro-mes",alterarMesExecucaoCCO,275):alterarMesExecucaoCCO;window.aplicarFiltroExecucaoMensal=window.alterarMesExecucaoCCO;

  const VERSAO_CACHE_EVOLUCAO_EXECUCAO="agregado-operacoes-v3",VERSAO_RESOLUCAO_HISTORICO="importacao-periodo-compartilhada-v3",cacheEvolucaoExecucao=new Map();
  let requisicaoEvolucaoExecucao=0,historicoLoading=false,historicoReady=false;
  const historicosPendentes=new Map();
  const logHistorico=(evento,dados={})=>{const contexto=window.__CCO_EXECUCAO_CONTEXTO_ATUAL__||{};console.log(evento,{agora:relogioExecucao(),ano:contexto.ano??null,mes:contexto.mes??null,servico:contexto.servico??null,importacao_id:contexto.importacaoId??null,quantidadePeriodos:0,quantidadeRequests:0,quantidadeRegistros:0,...dados});};
  function invalidarCacheEvolucaoExecucaoCCO(){cacheEvolucaoExecucao.clear();}
  window.invalidarCacheEvolucaoExecucaoCCO=invalidarCacheEvolucaoExecucaoCCO;
  document.addEventListener("cco:importacao-concluida",evento=>{catalogoExecucaoPromise=Promise.resolve(evento.detail?.catalogo||[]);invalidarCacheEvolucaoExecucaoCCO();catalogoExecucaoPromise.then(async catalogo=>{if(!catalogo.length)return null;window.__CCO_CATALOGO_EXECUCAO__=catalogo;const ultimo=[...catalogo].sort((a,b)=>Number(b.ano)-Number(a.ano)||Number(b.mes)-Number(a.mes))[0],selectAno=document.getElementById("filtroExecucaoAno"),selectMes=document.getElementById("filtroExecucaoMes");if(selectAno&&selectMes){preencherFiltroAnoExecucao(selectAno,[...new Set(catalogo.map(item=>Number(item.ano)))].sort((a,b)=>a-b),ultimo.ano);preencherFiltroMesExecucao(selectMes,obterMesesDoAnoExecucao(catalogo,ultimo.ano),ultimo.mes);await renderizarPeriodoExecucao(ultimo);}const servico=window.obterServicoAtivo?.();if(servico&&servico!=="geral")return renderizarEvolucaoHistoricaCCO(servico);return null;}).catch(error=>console.error("[EXECUÇÃO Evolução] atualização após importação falhou",error));});
  function posicionarSecoesDetalheExecucao(){
    const container=document.getElementById("graficoExecDetalheEvolucao"),evolucao=container?.closest?.(".section, .chart-card"),turno=document.querySelector("#detalheServico .exec-turn-section");
    if(turno)turno.id="secaoOperacaoTurno";
    if(!evolucao)return container||null;
    evolucao.id="secaoEvolucaoServico";evolucao.classList.add("execucao-secao","execucao-secao--largura-total");
    if(turno&&turno.nextElementSibling!==evolucao)turno.insertAdjacentElement("afterend",evolucao);
    requestAnimationFrame(()=>{const grafico=window.echarts?.getInstanceByDom?.(container);grafico?.resize?.();});
    return container;
  }
  function calcularTendenciaEvolucaoCCO(categorias,valores){
    const pontosValidos=(valores||[]).map((valor,indice)=>valor===null||valor===undefined?null:{valor:Number(valor),categoria:categorias[indice],indice}).filter(item=>item&&Number.isFinite(item.valor));
    if(pontosValidos.length<2)return{tipo:"indisponivel",percentual:null,diferenca:null,anterior:null,atual:pontosValidos.at(-1)||null};
    const anterior=pontosValidos.at(-2),atual=pontosValidos.at(-1),diferenca=atual.valor-anterior.valor,percentual=anterior.valor!==0?diferenca/Math.abs(anterior.valor)*100:null;
    let tipo="estavel";
    if(percentual!==null&&percentual>.5)tipo="crescimento";else if(percentual!==null&&percentual<-.5)tipo="queda";else if(anterior.valor===0&&atual.valor>0)tipo="crescimento";else if(anterior.valor>0&&atual.valor===0)tipo="queda";
    return{tipo,percentual,diferenca,anterior,atual};
  }
  window.calcularTendenciaEvolucaoCCO=calcularTendenciaEvolucaoCCO;
  function garantirIndicadorTendenciaEvolucaoCCO(){
    const secao=document.getElementById("secaoEvolucaoServico"),cabecalho=secao?.querySelector(".section-title");if(!cabecalho)return null;
    cabecalho.classList.add("secao-evolucao__cabecalho");let elemento=document.getElementById("tendenciaEvolucaoServico");
    if(!elemento){cabecalho.insertAdjacentHTML("beforeend",`<div id="tendenciaEvolucaoServico" class="execucao-tendencia is-indisponivel" aria-live="polite" aria-label="Comparação indisponível"><span class="execucao-tendencia__icone" aria-hidden="true"><svg viewBox="0 0 48 48" class="execucao-tendencia__svg"><g class="execucao-tendencia__direcional"><path class="execucao-tendencia__linha" d="M8 34 L22 20 L30 28 L42 12"/><path class="execucao-tendencia__ponta" d="M31 12 H42 V23"/></g><g class="execucao-tendencia__horizontal"><path d="M7 24 H41"/><path d="M31 14 L41 24 L31 34"/></g></svg></span><div class="execucao-tendencia__conteudo"><strong class="execucao-tendencia__titulo">Tendência</strong><span class="execucao-tendencia__texto">Comparação indisponível</span></div></div>`);elemento=document.getElementById("tendenciaEvolucaoServico");}
    return elemento;
  }
  function atualizarTendenciaEvolucaoCCO(comparativo){
    const elemento=garantirIndicadorTendenciaEvolucaoCCO();if(!elemento)return null;
    const periodoSelecionado=periodoChave(window.filtroExecucaoAnoAtual,window.filtroExecucaoMesAtual),indice=comparativo.itens.findIndex(item=>item.periodo===periodoSelecionado),item=comparativo.itens[indice]||null,texto=elemento.querySelector(".execucao-tendencia__texto"),formatar=valor=>n(valor).toLocaleString("pt-BR",{maximumFractionDigits:2});
    const disponivel=item&&item.previsto!==null&&item.acumulado!==null,diferenca=disponivel?item.acumulado-item.previsto:null,percentual=disponivel&&item.previsto!==0?item.acumulado/item.previsto*100:null,tipo=!disponivel?"indisponivel":Math.abs(diferenca)<.005?"estavel":diferenca>0?"crescimento":"queda";
    elemento.classList.remove("is-crescimento","is-queda","is-estavel","is-indisponivel","is-animando");elemento.classList.add(`is-${tipo}`);
    texto.textContent=!disponivel?"Comparação indisponível no mês selecionado":`${item.rotulo} • ${diferenca>=0?"acima":"abaixo"} do previsto em ${formatar(Math.abs(diferenca))}${percentual!==null?` • ${percentual.toLocaleString("pt-BR",{maximumFractionDigits:1})}%`:""}`;
    elemento.setAttribute("aria-label",texto.textContent);elemento.title=disponivel?`Previsto: ${formatar(item.previsto)}\nAcumulado: ${formatar(item.acumulado)}\nDiferença: ${formatar(diferenca)}`:"";
    void elemento.offsetWidth;elemento.classList.add("is-animando");return{tipo,item,diferenca,percentual};
  }
  window.atualizarTendenciaEvolucaoCCO=atualizarTendenciaEvolucaoCCO;
  function garantirContainerEvolucao(codigo){
    let container=document.getElementById("graficoExecDetalheEvolucao");if(container)return posicionarSecoesDetalheExecucao();
    const detalhe=document.getElementById("detalheServico");if(!detalhe)return null;
    let grade=detalhe.querySelector(".execucao-graficos-grid");
    if(!grade){grade=document.createElement("div");grade.className="execucao-graficos-grid";const cards=detalhe.querySelector(".cards");detalhe.insertBefore(grade,cards||null);}
    grade.insertAdjacentHTML("beforeend",window.ccoFinalSecaoGrafico("Comparativo mensal",`Evolução do serviço ${codigo}`,"graficoExecDetalheEvolucao"));
    return posicionarSecoesDetalheExecucao();
  }
  function resolverAcumuladoHistoricoP4CCO({periodo,operacoes,acumuladoPainelExecutivo}){
    const ano=Number(periodo?.ano),mes=Number(periodo?.mes),importacaoId=String(periodo?.importacao_id??periodo?.id??""),inicio=`${ano}-${pad(mes)}-01`,fim=mes===12?`${ano+1}-01-01`:`${ano}-${pad(mes+1)}-01`;
    const registros=(operacoes||[]).filter(item=>String(item.importacao_id||"")===importacaoId&&window.CCOMetricas.normalizarServico(item.servico||item.tipo_servico)==="P4"&&String(item.data_operacao||"").slice(0,10)>=inicio&&String(item.data_operacao||"").slice(0,10)<fim);
    const acumuladoOperacoes=registros.length?window.CCOMetricas.calcularAcumuladoServico("P4",registros):null,acumuladoPainel=acumuladoPainelExecutivo==null?null:n(acumuladoPainelExecutivo),acumuladoFinal=acumuladoOperacoes??acumuladoPainel,fonte=registros.length?"operacoes.peso_t + CCOMetricas.calcularAcumuladoServico":"painel_executivo.acumulado (fallback sem operações P4)";
    if(window.CCO_DEBUG_P4_EXECUCAO===true)console.log("[P4 EXECUÇÃO HISTÓRICO]",{periodo:periodoChave(ano,mes),importacaoId,quantidadeOperacoes:registros.length,acumuladoOperacoes,acumuladoPainelExecutivo:acumuladoPainel,acumuladoFinal,fonte,registrosCorrigidosEncontrados:registros.filter(item=>[112451,136549,136573].includes(Number(item.id))).map(item=>Number(item.id))});
    return{acumulado:acumuladoFinal,quantidadeOperacoes:registros.length,fonte,registros};
  }
  window.resolverAcumuladoHistoricoP4CCO=resolverAcumuladoHistoricoP4CCO;
  function atualizarEstadoEvolucaoHistoricaCCO(estado,mensagem){
    const container=document.getElementById("graficoExecDetalheEvolucao"),wrapper=container?.closest?.(".cco-chart-wrapper"),painel=wrapper?.querySelector?.(".cco-chart-state");
    if(!container||!painel)return null;
    const carregando=estado==="carregando";historicoLoading=carregando;historicoReady=estado==="pronto";
    container.hidden=carregando;container.setAttribute("aria-busy",String(carregando));
    painel.hidden=estado==="pronto";painel.classList.toggle("is-loading",carregando);
    if(estado==="erro"){painel.innerHTML=`<span>${mensagem||"Histórico indisponível no momento"}</span> <button type="button" class="btn secondary" data-cco-repetir-historico>Tentar novamente</button>`;painel.querySelector("[data-cco-repetir-historico]")?.addEventListener("click",()=>renderizarEvolucaoHistoricaCCO(window.obterServicoAtivo?.()).catch(error=>console.error("[EXECUCAO GRAFICO ERRO]",error)),{once:true});}
    else painel.textContent=carregando?(mensagem||"Carregando evolução histórica..."):"";
    return{container,painel};
  }
  window.atualizarEstadoEvolucaoHistoricaCCO=atualizarEstadoEvolucaoHistoricaCCO;
  async function buscarEvolucaoServicoCCO(servico){
    const metricas={requests:0,registros:0},catalogoCompleto=await medirHistorico("catalogo",()=>carregarCatalogoExecucaoCCO()),inicioHistorico=2025*12+11,catalogoBase=catalogoCompleto.filter(item=>Number(item.ano)*12+Number(item.mes)>=inicioHistorico).sort((a,b)=>Number(a.ano)-Number(b.ano)||Number(a.mes)-Number(b.mes));logHistorico("[EXEC HIST CATALOGO]",{servico,quantidadePeriodos:catalogoCompleto.length,quantidadeRequests:metricas.requests,quantidadeRegistros:catalogoCompleto.length});logHistorico("[EXEC HIST PERIODOS]",{servico,quantidadePeriodos:catalogoBase.length,periodos:catalogoBase.map(item=>periodoChave(item.ano,item.mes)),quantidadeRequests:metricas.requests,quantidadeRegistros:catalogoBase.length});
    let resolvidos=[];try{resolvidos=await medirHistorico("resolver",()=>performanceExecucao.medir("resolverPeriodoMs",()=>window.CCOPainelService.resolverImportacoesCatalogo(catalogoBase)));}catch(error){console.error("[EXECUCAO GRAFICO ERRO]",error);}
    /* allSettled permanece nas fontes; se o resolvedor falhar, cada período conserva
       o importacao_id do catálogo oficial, sem reintroduzir consultas individuais. */
    const catalogo=catalogoBase.map((periodo,indice)=>{const resolvida=resolvidos[indice];return resolvida?.importacao_id?{...periodo,importacao_id:resolvida.importacao_id,resolucaoImportacao:resolvida}:periodo;}),assinatura=catalogo.map(item=>`${periodoChave(item.ano,item.mes)}:${item.importacao_id}`).join("|"),chaveCache=`${VERSAO_CACHE_EVOLUCAO_EXECUCAO}|evolucao|${servico}|${assinatura}`,chaveCacheResolvida=`${VERSAO_RESOLUCAO_HISTORICO}|${chaveCache}`,armazenado=cacheEvolucaoExecucao.get(chaveCacheResolvida);logHistorico("[EXEC HIST IMPORTACOES]",{servico,quantidadePeriodos:catalogo.length,importacao_id:catalogo.map(item=>item.importacao_id),quantidadeRequests:metricas.requests,quantidadeRegistros:catalogo.length});
    if(armazenado){if(window.CCO_DEBUG_EXECUCAO_PERFORMANCE===true)console.log("[EXEC HIST] volume",{periodos:catalogo.length,importacoes:catalogo.map(item=>item.importacao_id),operacoesCarregadas:0,paginasOperacoes:0,paginasPainel:0,cacheHits:1,cacheMisses:0});return{catalogo,linhas:armazenado.linhas};}
    const idsAtivos=new Set(catalogo.map(item=>String(item.importacao_id))),banco=window.supabaseClient,precisaAgregadoOperacoes=servico==="P1"||servico==="P4";
    /* A coleção é pequena (uma linha agregada por serviço/período). Não aplicar eq
       literal em servico: aliases e espaços são normalizados antes do lookup. */
    const carregarPainelHistorico=()=>medirHistorico("painel",async()=>{metricas.requests+=1;logHistorico("[EXEC HIST PAINEL START]",{servico,quantidadePeriodos:catalogo.length,quantidadeRequests:metricas.requests,quantidadeRegistros:0});const resultado=await banco.from("painel_executivo").select("importacao_id,ano,mes,servico,acumulado").in("importacao_id",[...idsAtivos]).order("ano",{ascending:true}).order("mes",{ascending:true});logHistorico("[EXEC HIST PAINEL END]",{servico,quantidadePeriodos:catalogo.length,quantidadeRequests:metricas.requests,quantidadeRegistros:resultado.data?.length||0});return resultado;});
    /* PostgREST faz o SUM no servidor e agrupa pelas duas colunas não agregadas.
       Nunca paginar operações aqui: o navegador recebe no máximo uma linha por
       importação/serviço, independentemente do volume operacional do mês. */
    const carregarOperacoesHistorico=()=>medirHistorico("operacoes",async()=>{if(!precisaAgregadoOperacoes)return{data:[],error:null};metricas.requests+=1;logHistorico("[EXEC HIST P1 START]",{servico,quantidadePeriodos:catalogo.length,quantidadeRequests:metricas.requests,quantidadeRegistros:0});const resultado=await banco.from("operacoes").select("importacao_id,servico,acumulado:peso_t.sum()").in("importacao_id",[...idsAtivos]).eq("servico",servico).gte("data_operacao","2025-11-01");logHistorico("[EXEC HIST P1 END]",{servico,quantidadePeriodos:catalogo.length,quantidadeRequests:metricas.requests,quantidadeRegistros:resultado.data?.length||0,error:resultado.error?.message||null});return resultado;});
    const carregarDiasHistorico=()=>medirHistorico("dias",()=>Promise.allSettled(catalogo.map(periodo=>{metricas.requests+=1;return window.CCOPainelService.diasOperacaoPorPeriodo(periodo.importacao_id,periodo.ano,periodo.mes);}))); 
    const resultadosFontes=await Promise.allSettled([carregarPainelHistorico(),carregarOperacoesHistorico(),carregarDiasHistorico()]),resposta=resultadosFontes[0].status==="fulfilled"?resultadosFontes[0].value:{data:[],error:resultadosFontes[0].reason},respostaOperacoes=resultadosFontes[1].status==="fulfilled"?resultadosFontes[1].value:{data:[],error:resultadosFontes[1].reason},agregadosOperacoes=respostaOperacoes?.data||[],resultadosDias=resultadosFontes[2].status==="fulfilled"?resultadosFontes[2].value:catalogo.map(()=>({status:"rejected",reason:resultadosFontes[2].reason}));
    for(const resultado of resultadosFontes)if(resultado.status==="rejected")console.error("[EXECUCAO GRAFICO ERRO]",resultado.reason);if(resposta.error)console.error("[EXECUCAO GRAFICO ERRO]",resposta.error);if(respostaOperacoes.error)console.error("[EXECUCAO GRAFICO ERRO]",respostaOperacoes.error);
    if(window.CCO_DEBUG_EXECUCAO_PERFORMANCE===true)console.time("[EXEC HIST] montarDataset");
    const diasPorPeriodo=catalogo.map((periodo,indice)=>{const resultado=resultadosDias[indice];if(resultado?.status!=="fulfilled"){console.error("[EXECUCAO GRAFICO ERRO]",resultado?.reason);return[periodoChave(periodo.ano,periodo.mes),null];}const totalDias=Number(resultado.value?.total_dias);return[periodoChave(periodo.ano,periodo.mes),Number.isInteger(totalDias)&&totalDias>0?totalDias:null];});
    const normalizarServicoHistorico=valor=>window.CCOMetricas?.normalizarServico?.(valor)||String(valor||"").trim().toUpperCase(),servicoNormalizado=normalizarServicoHistorico(servico),porPeriodo=new Map(),agregadoPorImportacao=new Map();
    for(const item of resposta.data||[]){const codigo=normalizarServicoHistorico(item.servico);if(codigo!==servicoNormalizado)continue;const chavePainel=`${periodoChave(item.ano,item.mes)}|${String(item.importacao_id)}|${codigo}`;const existente=porPeriodo.get(chavePainel);if(!existente||existente.acumulado==null)porPeriodo.set(chavePainel,item);}
    for(const item of agregadosOperacoes){const codigo=normalizarServicoHistorico(item.servico);if(codigo===servicoNormalizado)agregadoPorImportacao.set(`${String(item.importacao_id)}|${codigo}`,item.acumulado==null?null:Number(item.acumulado));}
    const mapaDias=new Map(diasPorPeriodo),linhas=catalogo.map(periodo=>{const importacaoId=String(periodo.importacao_id),chave=periodoChave(periodo.ano,periodo.mes),chavePainel=`${chave}|${importacaoId}|${servicoNormalizado}`,base=porPeriodo.get(chavePainel)||null,chaveAgregado=`${importacaoId}|${servicoNormalizado}`,temAgregado=agregadoPorImportacao.has(chaveAgregado),agregado=temAgregado?agregadoPorImportacao.get(chaveAgregado):null;let acumulado=base?.acumulado??null,fonteHistorico=base?"painel_executivo.acumulado":"indisponível";if((servico==="P1"||servico==="P4")&&temAgregado){acumulado=agregado;fonteHistorico="operacoes.peso_t.sum (agregado no servidor)";}if(acumulado===null)console.error("[EXECUCAO HISTORICO ACUMULADO AUSENTE]",{periodo:chave,servico:servicoNormalizado,importacaoId,chaveLookup:chavePainel});const totalDias=mapaDias.get(chave),previsto=totalDias?window.CCO_REGRAS.calcularPrevisto(servico,totalDias):null,linha={...(base||{}),importacao_id:importacaoId,ano:Number(periodo.ano),mes:Number(periodo.mes),servico:servicoNormalizado,acumulado,previsto,total_dias_mes:totalDias,registros_historico:0,fonte_historico:fonteHistorico},periodoAtual=periodoChave(window.filtroExecucaoAnoAtual,window.filtroExecucaoMesAtual);if(chave===periodoAtual){const card=(window.painelExecutivoOriginal||[]).find(item=>normalizarServicoHistorico(item.servico)===servicoNormalizado);console.log("[EXECUCAO CARD VS HISTORICO]",{periodo:chave,servico:servicoNormalizado,importacaoId,cardAcumulado:card?.acumulado_mes??null,historicoAcumulado:acumulado,fonteCard:card?.fonte_metricas||"indisponível",fonteHistorico});}if(window.CCO_DEBUG_PREVISTO_EXECUCAO===true||window.CCO_DEBUG_EXECUCAO_HISTORICO===true)console.log("[EXECUCAO HISTORICO PERIODO]",{periodo:chave,servico:servicoNormalizado,importacaoId,totalDiasMes:totalDias,registros:0,acumulado,previsto,fonteHistorico});return linha;});
    if(window.CCO_DEBUG_EXECUCAO_PERFORMANCE===true){console.timeEnd("[EXEC HIST] montarDataset");console.log("[EXEC HIST] volume",{periodos:catalogo.length,importacoes:catalogo.map(item=>item.importacao_id),operacoesCarregadas:0,linhasAgregadasOperacoes:agregadosOperacoes.length,paginasOperacoes:0,paginasPainel:1,cacheHits:0,cacheMisses:1,fonteAcumulado:precisaAgregadoOperacoes?"SUM(operacoes.peso_t) no servidor + fallback painel_executivo":"painel_executivo agregado"});}
    cacheEvolucaoExecucao.set(chaveCacheResolvida,{linhas});return{catalogo,linhas,metricas};
  }
  async function executarEvolucaoHistoricaCCO(servicoSelecionado){
    const servico=String(servicoSelecionado||"").trim().toUpperCase(),token=++requisicaoEvolucaoExecucao,contexto=window.__CCO_EXECUCAO_CONTEXTO_ATUAL__;if(!servico||servico==="GERAL")return null;
    const containerInicial=garantirContainerEvolucao(servico);if(!containerInicial)return null;
    /* O detalhe mensal acabou de recriar o host. Limpe qualquer instância parcial antes
       que o navegador tenha oportunidade de pintá-la e deixe apenas este card esperando. */
    window.CCO_GRAFICOS_3D?.destruirGrafico?.(containerInicial);atualizarEstadoEvolucaoHistoricaCCO("carregando");
    let resultado;try{resultado=await comTimeoutHistorico(medirHistorico("total",()=>performanceExecucao.medir("historicoMs",()=>buscarEvolucaoServicoCCO(servico))));}catch(error){if(token===requisicaoEvolucaoExecucao)atualizarEstadoEvolucaoHistoricaCCO("erro","Histórico indisponível no momento");throw error;}
    if(token!==requisicaoEvolucaoExecucao||String(window.obterServicoAtivo?.()||"").toUpperCase()!==servico||!contextoExecucaoAtualCCO(contexto)){if(token===requisicaoEvolucaoExecucao)atualizarEstadoEvolucaoHistoricaCCO("erro","Histórico interrompido; tente novamente");return null;}
    const{catalogo,linhas}=resultado;
    const comparativo=window.CCOExecucaoComparativoMensal.montar({catalogo,linhas}),{labels,importacoes,previstos,acumulados,percentuais}=comparativo,ehEquipe=window.CCOMetricas?.ehServicoEquipe?.(servico)===true,sufixoUnidade=ehEquipe?" equipe":"";
    if(labels.length!==catalogo.length||previstos.length!==catalogo.length||acumulados.length!==catalogo.length)throw new Error("Comparativo mensal da Execução divergiu do catálogo oficial.");
    console.log("[EXECUÇÃO COMPARATIVO MENSAL]",{servico,periodos:labels,importacoes,previstos,acumulados,percentuais});
    const container=garantirContainerEvolucao(servico);if(!container)throw new Error("Container do histórico indisponível.");logHistorico("[EXEC HIST RENDER]",{servico,quantidadePeriodos:labels.length,quantidadeRequests:resultado.metricas?.requests||0,quantidadeRegistros:linhas.length,importacao_id:importacoes});
    console.log("[EXECUCAO GRAFICO DATASET]",{labels,previsto:previstos,acumulado:acumulados,quantidadePeriodos:labels.length,canvasExiste:Boolean(container)});
    if(!labels.length||previstos.length!==labels.length||acumulados.length!==labels.length){const error=new Error("Dataset histórico inválido para renderização.");console.error("[EXECUCAO GRAFICO ERRO]",error);atualizarEstadoEvolucaoHistoricaCCO("erro");return null;}
    const formatar=valor=>n(valor).toLocaleString("pt-BR",{maximumFractionDigits:2});
    const titulo=container.closest(".section, .chart-card")?.querySelector(".section-title h2");if(titulo)titulo.textContent=`Previsto x Acumulado — ${labels[0]||"Nov/2025"} a ${labels.at(-1)||"período atual"}`;
    const labelsMobile=labels.map(rotulo=>rotulo.replace("/20","/")),inicioGrafico=relogioExecucao();if(window.CCO_DEBUG_EXECUCAO_PERFORMANCE===true)console.time("[EXEC HIST] echarts");
    console.log("[EXECUÇÃO COMPARATIVO 3D]",{servico,periodos:labels,previsto:previstos,acumulado:acumulados,renderizador:"CCO_GRAFICOS_3D.renderizarDireto/barra3d",modo3D:true});
    if(!window.CCO_GRAFICOS_3D?.renderizarDireto){const error=new Error("Renderizador 3D indisponível.");console.error("[EXECUCAO GRAFICO ERRO]",error);atualizarEstadoEvolucaoHistoricaCCO("erro");return null;}let grafico;try{window.CCO_GRAFICOS_3D?.destruirGrafico?.(container);atualizarEstadoEvolucaoHistoricaCCO("pronto");grafico=window.CCO_GRAFICOS_3D.renderizarDireto(container,{tipo:"barra3d",agrupado:true,preservarNulos:true,modoMobileCompacto:true,layoutRotulosExecucao:true,altura:460,categorias:labels,categoriasMobile:labelsMobile,grid:cfg=>cfg.mobile?{}:{top:100},yAxis:ehEquipe?{name:"Equipes",min:0}:undefined,series:[{nome:"Previsto",valores:previstos,cor:"#047857",corTopo:"#6ee7b7",corLateral:"#064e3b",formatarRotulo:(valor,indice)=>previstos[indice]==null?"":formatar(valor)},{nome:"Acumulado",valores:acumulados,cor:"#10b981",corTopo:"#a7f3d0",corLateral:"#065f46",formatarRotulo:(valor,indice)=>acumulados[indice]==null?"":formatar(valor)}],legend:{show:true,top:10,left:"center"},tooltip:{formatter:parametros=>{const itens=Array.isArray(parametros)?parametros:[parametros],indice=itens[0]?.dataIndex??0,pct=percentuais[indice];return`${labels[indice]}<br>Previsto: ${previstos[indice]===null?"Sem dados":`${formatar(previstos[indice])}${sufixoUnidade}`}<br>Acumulado: ${acumulados[indice]===null?"Sem dados":`${formatar(acumulados[indice])}${sufixoUnidade}`}<br>Percentual: ${pct===null?"Sem dados":`${pct.toLocaleString("pt-BR",{maximumFractionDigits:1})}%`}`;}}});if(!grafico)throw new Error("Renderizador não criou a instância do gráfico histórico.");}catch(error){console.error("[EXECUCAO GRAFICO ERRO]",error);atualizarEstadoEvolucaoHistoricaCCO("erro");return null;}
    if(window.CCO_DEBUG_EXECUCAO_PERFORMANCE===true)console.timeEnd("[EXEC HIST] echarts");performanceExecucao.contar("graficosMs",relogioExecucao()-inicioGrafico);performanceExecucao.relatar();posicionarSecoesDetalheExecucao();atualizarTendenciaEvolucaoCCO(comparativo);return grafico;
  }
  function renderizarEvolucaoHistoricaCCO(servicoSelecionado){const servico=String(servicoSelecionado||"").trim().toUpperCase(),contexto=window.__CCO_EXECUCAO_CONTEXTO_ATUAL__,chave=[servico,contexto?.ano,contexto?.mes,contexto?.importacaoId].join("|");if(historicosPendentes.has(chave))return historicosPendentes.get(chave);window.__CCO_EXEC_HIST_CALLS__=(window.__CCO_EXEC_HIST_CALLS__||0)+1;logHistorico("[EXEC HIST START]",{ano:contexto?.ano,mes:contexto?.mes,servico,importacao_id:contexto?.importacaoId,quantidadePeriodos:0,quantidadeRequests:0,quantidadeRegistros:0,chamadas:window.__CCO_EXEC_HIST_CALLS__});const promessa=executarEvolucaoHistoricaCCO(servico).catch(error=>{const timeout=error?.code==="CCO_EXEC_HIST_TIMEOUT";logHistorico(timeout?"[EXEC HIST TIMEOUT]":"[EXEC HIST ERROR]",{ano:contexto?.ano,mes:contexto?.mes,servico,importacao_id:contexto?.importacaoId,quantidadePeriodos:0,quantidadeRequests:0,quantidadeRegistros:0,code:error?.code,message:error?.message});if(String(window.obterServicoAtivo?.()||"").toUpperCase()===servico)atualizarEstadoEvolucaoHistoricaCCO("erro",timeout?"Histórico excedeu o tempo limite":"Histórico indisponível no momento");throw error;}).finally(()=>{historicosPendentes.delete(chave);if(historicoLoading&&String(window.obterServicoAtivo?.()||"").toUpperCase()===servico)atualizarEstadoEvolucaoHistoricaCCO("erro","Histórico indisponível no momento");logHistorico("[EXEC HIST DONE]",{ano:contexto?.ano,mes:contexto?.mes,servico,importacao_id:contexto?.importacaoId,quantidadePeriodos:0,quantidadeRequests:0,quantidadeRegistros:0,estado:historicoReady?"pronto":"erro"});});historicosPendentes.set(chave,promessa);return promessa;}
  window.renderizarEvolucaoHistoricaCCO=renderizarEvolucaoHistoricaCCO;
  const renderDetalheServicoMensalOriginal=window.renderDetalheServicoMensal;
  if(typeof renderDetalheServicoMensalOriginal==="function"){
    const renderComEvolucao=function(codigo){const resultado=renderDetalheServicoMensalOriginal.apply(this,arguments);posicionarSecoesDetalheExecucao();renderizarEvolucaoHistoricaCCO(codigo).catch(error=>console.error("[EXECUÇÃO Evolução] falha",{servico:codigo,code:error?.code,message:error?.message}));return resultado;};
    window.renderDetalheServicoMensal=renderComEvolucao;try{renderDetalheServicoMensal=renderComEvolucao;}catch(_){}
  }

  async function iniciarInterno(){
    try {
      performanceExecucao.reiniciar();
      if(!await performanceExecucao.medir("authMs",()=>window.CCOSupabase.exigirSessao()))return false;
      if(window.__CCO_EXECUCAO_PERIODOS_INICIADOS__)return true;
      window.__CCO_EXECUCAO_PERIODOS_INICIADOS__=true;window.__CCO_EXECUCAO_INICIALIZADA__=true;window.__CCO_CONTROLADOR_PERIODOS_LEGADO_DESATIVADO__=true;
      const[catalogo]=await Promise.all([performanceExecucao.medir("catalogoMs",()=>carregarCatalogoExecucaoCCO()),window.carregarRegrasServicosCCO()]);
      if(!catalogo.length)throw new Error("Nenhum período ativo disponível para Execução.");
      let salvo=null;try{salvo=JSON.parse(localStorage.getItem("cco_execucao_periodo")||"null");}catch(_){salvo=null;}
      const ultimo=catalogo[0],preferido=localizarPeriodoExecucao(catalogo,salvo?.ano,salvo?.mes)||ultimo,selectAno=document.getElementById("filtroExecucaoAno"),selectMes=document.getElementById("filtroExecucaoMes"),anos=[...new Set(catalogo.map(item=>Number(item.ano)))].filter(Number.isFinite).sort((a,b)=>a-b);
      preencherFiltroAnoExecucao(selectAno,anos,preferido.ano);preencherFiltroMesExecucao(selectMes,obterMesesDoAnoExecucao(catalogo,preferido.ano),preferido.mes);
      const tela=document.getElementById("tela-contrato");
      if(tela&&!tela.dataset.ccoExecucaoServicoRace){tela.dataset.ccoExecucaoServicoRace="1";tela.addEventListener("click",evento=>{if(!evento.target.closest?.(".servico-btn"))return;queueMicrotask(()=>{const atual=localizarPeriodoExecucao(window.__CCO_CATALOGO_EXECUCAO__,selectAno?.value,selectMes?.value);renderizarPeriodoExecucao(atual).catch(erro=>console.error("[EXECUÇÃO] troca de serviço falhou",erro));});});}
      await renderizarPeriodoExecucao(preferido);
    } catch (erro) {
      window.__CCO_EXECUCAO_PERIODOS_INICIADOS__=false;
      console.error("Erro ao iniciar Execução P1 a P12:", erro);
    }
  }
  async function iniciar(){return window.CCOPageRuntime.inicializar("EXECUCAO",()=>window.CCOBootDiagnostics?window.CCOBootDiagnostics.medir("execucao.iniciar","execucao.js",iniciarInterno):iniciarInterno());}
  window.inicializarExecucao=iniciar;

  window.CCOBootDiagnostics?.instrumentarFuncao(window,"carregarPeriodoCCO","carregarPeriodoCCO","cco-fixes.js");
  window.CCOBootDiagnostics?.instrumentarFuncao(window,"renderDetalheServicoMensal","renderDetalheServicoMensal","utils.js/execucao.js");
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded",iniciar,{once:true});
  } else {
    iniciar();
  }
})();
