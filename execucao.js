/* Execução P1 a P12 - carregamento completo, sem corte e sem delay. */
(function iniciarPaginaExecucao(){
  window.CCO_PAGE = "execucao";
  const n=valor=>{const numero=Number(valor);return Number.isFinite(numero)?numero:0;};
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
    if(typeof carregarFiltroMesesComparativoExecucao==="function")carregarFiltroMesesComparativoExecucao();
    if(typeof renderTabelaContratualMensal==="function")renderTabelaContratualMensal();
    if(typeof renderComparativoMesesExecucao==="function")renderComparativoMesesExecucao();
    const codigo=window.obterServicoAtivo?.();if(codigo&&codigo!=="geral"&&contextoExecucaoAtualCCO(contexto))window.renderDetalheServicoMensal?.(codigo,contexto);
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

  const VERSAO_CACHE_EVOLUCAO_EXECUCAO="p4-operacoes-v2",cacheEvolucaoExecucao=new Map();
  let requisicaoEvolucaoExecucao=0;
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
  async function buscarEvolucaoServicoCCO(servico){
    const catalogoCompleto=await carregarCatalogoExecucaoCCO(),inicioHistorico=2025*12+11,catalogo=catalogoCompleto.filter(item=>Number(item.ano)*12+Number(item.mes)>=inicioHistorico).sort((a,b)=>Number(a.ano)-Number(b.ano)||Number(a.mes)-Number(b.mes)),assinatura=catalogo.map(item=>`${periodoChave(item.ano,item.mes)}:${item.importacao_id}`).join("|"),chaveCache=`${VERSAO_CACHE_EVOLUCAO_EXECUCAO}|evolucao|${servico}|${assinatura}`,armazenado=cacheEvolucaoExecucao.get(chaveCache);
    if(armazenado)return{catalogo,linhas:armazenado.linhas};
    const idsAtivos=new Set(catalogo.map(item=>String(item.importacao_id))),banco=window.supabaseClient;
    const resposta=await banco.from("painel_executivo").select("importacao_id,ano,mes,servico,acumulado,previsto,valor_total").in("importacao_id",[...idsAtivos]).eq("servico",servico).order("ano",{ascending:true}).order("mes",{ascending:true});
    if(resposta.error)throw resposta.error;
    let linhas=(resposta.data||[]).filter(item=>idsAtivos.has(String(item.importacao_id)));
    if(servico==="P4"){
      const operacoes=await window.CCOSupabase.paginar(()=>banco.from("operacoes").select("id,importacao_id,servico,tipo_servico,data_operacao,peso_t").in("importacao_id",[...idsAtivos]).eq("servico","P4").gte("data_operacao","2025-11-01").order("data_operacao",{ascending:true}).order("id",{ascending:true}));
      const porPeriodo=new Map(linhas.map(item=>[`${periodoChave(item.ano,item.mes)}|${String(item.importacao_id)}`,item]));
      linhas=catalogo.map(periodo=>{const importacaoId=periodo.importacao_id??periodo.id,base=porPeriodo.get(`${periodoChave(periodo.ano,periodo.mes)}|${String(importacaoId)}`)||{},resultado=resolverAcumuladoHistoricoP4CCO({periodo:{...periodo,importacao_id:importacaoId},operacoes,acumuladoPainelExecutivo:base.acumulado});return{...base,importacao_id:importacaoId,ano:Number(periodo.ano),mes:Number(periodo.mes),servico:"P4",acumulado:resultado.acumulado};});
    }else if(window.CCOMetricas?.ehServicoEquipe?.(servico)){
      const operacoes=await window.CCOSupabase.paginar(()=>banco.from("operacoes").select("importacao_id,servico,tipo_servico,data_operacao,qtd_equipe,equipe,executado").in("importacao_id",[...idsAtivos]).eq("servico",servico).gte("data_operacao","2025-11-01").order("data_operacao",{ascending:true}));
      const porPeriodo=new Map(linhas.map(item=>[`${periodoChave(item.ano,item.mes)}|${String(item.importacao_id)}`,item]));
      linhas=catalogo.map(periodo=>{const importacaoId=periodo.importacao_id??periodo.id,base=porPeriodo.get(`${periodoChave(periodo.ano,periodo.mes)}|${String(importacaoId)}`)||{},equipe=window.CCOMetricas.calcularEquipeMensalServico({servico,registros:operacoes,ano:periodo.ano,mes:periodo.mes,importacaoId});return{...base,importacao_id:importacaoId,ano:Number(periodo.ano),mes:Number(periodo.mes),servico,previsto:equipe.previsto,acumulado:equipe.executado,unidade:equipe.unidade};});
    }
    const diasPorPeriodo=await Promise.all(catalogo.map(async periodo=>{const registro=await window.CCOPainelService.diasOperacaoPorPeriodo(periodo.importacao_id,periodo.ano,periodo.mes),totalDias=Number(registro?.total_dias);if(!Number.isInteger(totalDias)||totalDias<=0)throw new Error(`Dias de operação indisponíveis para ${periodoChave(periodo.ano,periodo.mes)}.`);return[`${periodoChave(periodo.ano,periodo.mes)}|${String(periodo.importacao_id)}`,totalDias];}));
    const mapaDias=new Map(diasPorPeriodo);linhas=linhas.map(linha=>{const totalDias=mapaDias.get(`${periodoChave(linha.ano,linha.mes)}|${String(linha.importacao_id)}`),previsto=window.CCO_REGRAS.calcularPrevisto(servico,totalDias);return{...linha,previsto,total_dias_mes:totalDias};});
    cacheEvolucaoExecucao.set(chaveCache,{linhas});return{catalogo,linhas};
  }
  async function renderizarEvolucaoHistoricaCCO(servicoSelecionado){
    const servico=String(servicoSelecionado||"").trim().toUpperCase(),token=++requisicaoEvolucaoExecucao,contexto=window.__CCO_EXECUCAO_CONTEXTO_ATUAL__;if(!servico||servico==="GERAL")return null;
    const{catalogo,linhas}=await buscarEvolucaoServicoCCO(servico);if(token!==requisicaoEvolucaoExecucao||String(window.obterServicoAtivo?.()||"").toUpperCase()!==servico||!contextoExecucaoAtualCCO(contexto))return null;
    const comparativo=window.CCOExecucaoComparativoMensal.montar({catalogo,linhas}),{labels,importacoes,previstos,acumulados,percentuais}=comparativo,ehEquipe=window.CCOMetricas?.ehServicoEquipe?.(servico)===true,sufixoUnidade=ehEquipe?" equipe":"";
    if(labels.length!==catalogo.length||previstos.length!==catalogo.length||acumulados.length!==catalogo.length)throw new Error("Comparativo mensal da Execução divergiu do catálogo oficial.");
    console.log("[EXECUÇÃO COMPARATIVO MENSAL]",{servico,periodos:labels,importacoes,previstos,acumulados,percentuais});
    const container=garantirContainerEvolucao(servico);if(!container)return null;
    const formatar=valor=>n(valor).toLocaleString("pt-BR",{maximumFractionDigits:2});
    const titulo=container.closest(".section, .chart-card")?.querySelector(".section-title h2");if(titulo)titulo.textContent=`Previsto x Acumulado — ${labels[0]||"Nov/2025"} a ${labels.at(-1)||"período atual"}`;
    window.CCO_GRAFICOS_3D?.destruirGrafico?.(container);
    const labelsMobile=labels.map(rotulo=>rotulo.replace("/20","/"));
    console.log("[EXECUÇÃO COMPARATIVO 3D]",{servico,periodos:labels,previsto:previstos,acumulado:acumulados,renderizador:"CCO_GRAFICOS_3D.renderizarDireto/barra3d",modo3D:true});
    const grafico=window.CCO_GRAFICOS_3D?.renderizarDireto?.(container,{tipo:"barra3d",agrupado:true,preservarNulos:true,modoMobileCompacto:true,layoutRotulosExecucao:true,altura:460,categorias:labels,categoriasMobile:labelsMobile,grid:cfg=>cfg.mobile?{}:{top:100},yAxis:ehEquipe?{name:"Equipes",min:0}:undefined,series:[{nome:"Previsto",valores:previstos,cor:"#047857",corTopo:"#6ee7b7",corLateral:"#064e3b",formatarRotulo:(valor,indice)=>previstos[indice]==null?"":formatar(valor)},{nome:"Acumulado",valores:acumulados,cor:"#10b981",corTopo:"#a7f3d0",corLateral:"#065f46",formatarRotulo:(valor,indice)=>acumulados[indice]==null?"":formatar(valor)}],legend:{show:true,top:10,left:"center"},tooltip:{formatter:parametros=>{const itens=Array.isArray(parametros)?parametros:[parametros],indice=itens[0]?.dataIndex??0,pct=percentuais[indice];return`${labels[indice]}<br>Previsto: ${previstos[indice]===null?"Sem dados":`${formatar(previstos[indice])}${sufixoUnidade}`}<br>Acumulado: ${acumulados[indice]===null?"Sem dados":`${formatar(acumulados[indice])}${sufixoUnidade}`}<br>Percentual: ${pct===null?"Sem dados":`${pct.toLocaleString("pt-BR",{maximumFractionDigits:1})}%`}`;}}});
    posicionarSecoesDetalheExecucao();atualizarTendenciaEvolucaoCCO(comparativo);return grafico;
  }
  window.renderizarEvolucaoHistoricaCCO=renderizarEvolucaoHistoricaCCO;
  const renderDetalheServicoMensalOriginal=window.renderDetalheServicoMensal;
  if(typeof renderDetalheServicoMensalOriginal==="function"){
    const renderComEvolucao=function(codigo){const resultado=renderDetalheServicoMensalOriginal.apply(this,arguments);posicionarSecoesDetalheExecucao();renderizarEvolucaoHistoricaCCO(codigo).catch(error=>console.error("[EXECUÇÃO Evolução] falha",{servico:codigo,code:error?.code,message:error?.message}));return resultado;};
    window.renderDetalheServicoMensal=renderComEvolucao;try{renderDetalheServicoMensal=renderComEvolucao;}catch(_){}
  }

  async function iniciarInterno(){
    try {
      if(!await window.CCOSupabase.exigirSessao())return false;
      if(window.__CCO_EXECUCAO_PERIODOS_INICIADOS__)return true;
      window.__CCO_EXECUCAO_PERIODOS_INICIADOS__=true;window.__CCO_EXECUCAO_INICIALIZADA__=true;window.__CCO_CONTROLADOR_PERIODOS_LEGADO_DESATIVADO__=true;
      const[catalogo]=await Promise.all([carregarCatalogoExecucaoCCO(),window.carregarRegrasServicosCCO()]);
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
