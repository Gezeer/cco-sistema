/* KPI • gráficos renderizados diretamente por ECharts 3D. */
(function iniciarPaginaKpi3D(){
  "use strict";
  window.CCO_PAGE="kpi";
  const $=id=>document.getElementById(id),n=valor=>{const numero=Number(valor);return Number.isFinite(numero)?numero:0;};
  const tem=valores=>(valores||[]).some(valor=>Math.abs(n(valor))>0);
  const G=()=>window.CCO_GRAFICOS_3D;
  const IDS_GRAFICOS_KPI=["graficoKpiServicoDiario","graficoKpiPrevistoExecutado","graficoKpiServicoMensal","graficoKpiServicoIndicadores","graficoKpiComparativoMensal","graficoKpiProdutividadeMensal","graficoKpiVelocidadeMediaMensal","graficoFiltroDoisMeses"];
  let ultimoContextoGraficosKPI=null;
  let framePercurso=null,animacaoPausada=document.hidden,velocidadePercurso=0,progressoPercurso=0,inicioPercurso=0,duracaoPercurso=16000;
  function calcularDuracaoAnimacao(velocidade){const valor=Math.max(1,n(velocidade)||1);return Math.max(5000,Math.min(16000,16000-valor*500));}
  function cancelarPercurso(){if(framePercurso!==null)cancelAnimationFrame(framePercurso);framePercurso=null;}
  function atualizarPosicaoCarrinho(progresso=progressoPercurso,agora=performance.now()){
    const path=document.querySelector("#percursoPath"),car=$("ccoVeiculoVelocidade"),suspensao=$("ccoSuspensaoVeiculo");if(!path||!car)return false;
    let length=0;try{length=path.getTotalLength();}catch(error){console.warn("[CCO KPI] Percurso SVG indisponível.",error);return false;}
    const normalizado=Math.max(0,Math.min(1,n(progresso))),pos=normalizado*length,p1=path.getPointAtLength(pos),referencia=normalizado<1?Math.min(length,pos+2):Math.max(0,pos-2),p2=path.getPointAtLength(referencia),angulo=Math.atan2(normalizado<1?p2.y-p1.y:p1.y-p2.y,normalizado<1?p2.x-p1.x:p1.x-p2.x)*180/Math.PI,balanco=normalizado>0&&normalizado<1?Math.sin(agora/180)*1.5:0;
    car.setAttribute("transform",`translate(${p1.x} ${p1.y}) rotate(${angulo})`);if(suspensao)suspensao.setAttribute("transform",`translate(0 ${balanco})`);progressoPercurso=normalizado;return true;
  }
  window.atualizarPosicaoCarrinho=atualizarPosicaoCarrinho;
  function iniciarPercurso(velocidade){
    cancelarPercurso();velocidadePercurso=n(velocidade);progressoPercurso=0;duracaoPercurso=calcularDuracaoAnimacao(velocidadePercurso);inicioPercurso=performance.now();atualizarPosicaoCarrinho(0,inicioPercurso);
    const movimentoReduzido=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;if(movimentoReduzido||velocidadePercurso<=0)return;
    function animar(agora){if(animacaoPausada){framePercurso=null;return;}const tempo=Math.min(1,(agora-inicioPercurso)/duracaoPercurso),progresso=1-Math.pow(1-tempo,2.25);atualizarPosicaoCarrinho(progresso,agora);if(tempo<1)framePercurso=requestAnimationFrame(animar);else{framePercurso=null;atualizarPosicaoCarrinho(1,agora);}}
    framePercurso=requestAnimationFrame(animar);
  }
  document.addEventListener("visibilitychange",()=>{animacaoPausada=document.hidden;if(animacaoPausada)cancelarPercurso();else iniciarPercurso(velocidadePercurso);});
  function recalcularCarrinho(){atualizarPosicaoCarrinho(progressoPercurso,performance.now());}
  window.addEventListener("resize",recalcularCarrinho,{passive:true});window.visualViewport?.addEventListener?.("resize",recalcularCarrinho,{passive:true});
  function mostrar(id,visivel){const card=$(id)?.closest?.(".section, .chart-card");if(card){card.classList.add("kpi-card-grafico");card.style.display=visivel?"":"none";}}
  async function aguardarDimensaoKPI(container,tentativas=15){for(let i=0;i<tentativas;i+=1){if(container?.isConnected&&container.clientWidth>0&&container.clientHeight>0)return true;await new Promise(resolve=>requestAnimationFrame(resolve));}return false;}
  window.aguardarDimensaoKPI=aguardarDimensaoKPI;
  function render(id,tipo,categorias,series,opcoes={}){const container=$(id),possui=series.some(item=>tem(item.valores));mostrar(id,possui);G()?.destruirGrafico?.(container);if(!container||!possui)return null;container.classList.add("kpi-chart","cco-chart","cco-chart-host");const config={tipo,categorias,series,...opcoes},desenhar=()=>G()?.renderizarDireto?.(container,config);if(container.clientWidth>0&&container.clientHeight>0)return desenhar();const token=Symbol(id);container.__ccoKpiRenderToken=token;aguardarDimensaoKPI(container).then(pronto=>{if(pronto&&container.__ccoKpiRenderToken===token)desenhar();else if(!pronto)console.error("[CCO KPI] Container sem dimensão após aguardar layout.",{id,largura:container.clientWidth,altura:container.clientHeight,conectado:container.isConnected});});return null;}
  const rotuloMes=item=>typeof window.ccoLabelMesAnoKpi==="function"?window.ccoLabelMesAnoKpi(item):`${String(item.mes).padStart(2,"0")}/${item.ano}`;
  function mensalFiltrado(filtro={}){if(typeof window.ccoKpiMensalFiltrado==="function")return window.ccoKpiMensalFiltrado(filtro)||[];return(window.kpiMensal||[]).filter(item=>(!filtro.servico||item.servico===filtro.servico)&&(!filtro.ano||String(item.ano)===String(filtro.ano))&&(!filtro.mes||String(item.mes).padStart(2,"0")===String(filtro.mes).padStart(2,"0")));}
  function valorExecutado(servico,item){return typeof window.obterExecutadoKpiPorServico==="function"?n(window.obterExecutadoKpiPorServico(servico,item)):n(item.executado||item.peso||item.km||item.viagens||item.equipe);}
  const normalizarServico=servico=>String(servico||"").trim().toUpperCase();
  const chavePainel=(importacaoId,ano,mes,servico)=>[String(importacaoId||""),Number(ano)||0,Number(mes)||0,normalizarServico(servico)].join("|");
  function obterPrevistoMensalGraficoCCO(servico,linhaPainel,contexto={}){
    const seguro=typeof window.numeroSeguroCCO==="function"?window.numeroSeguroCCO:n,previstoPainel=seguro(linhaPainel?.previsto);
    if(previstoPainel>0)return previstoPainel;
    const previstoRegra=window.obterPrevistoCCO?.({...linhaPainel,...contexto,servico});
    return seguro(previstoRegra);
  }
  window.obterPrevistoMensalGraficoCCO=obterPrevistoMensalGraficoCCO;
  function dadosComparativoMensal(mensal,filtro={}){
    const mapa=window.__CCO_KPI_PAINEL_POR_SERVICO__||new Map(),periodo=window.__CCO_IMPORTACAO_ATIVA__||{},servicoSelecionado=normalizarServico(filtro.servico);
    return mensal.map(item=>{
      const servico=servicoSelecionado||normalizarServico(item.servico),ano=Number(item.ano||filtro.ano||periodo.ano),mes=Number(item.mes||filtro.mes||periodo.mes),importacaoId=item.importacao_id||periodo.importacao_id||periodo.id,linhaAtual=item.linhaPainel||mapa.get(chavePainel(importacaoId,ano,mes,servico))||null;
      const executado=linhaAtual?.acumulado!==null&&linhaAtual?.acumulado!==undefined&&linhaAtual?.acumulado!==""?n(linhaAtual.acumulado):n(item.executado);
      const previsto=obterPrevistoMensalGraficoCCO(servico,linhaAtual,{ano,mes,importacaoId});
      console.log("[KPI Previsto x Executado]",{servico,periodo:`${ano}-${String(mes).padStart(2,"0")}`,importacaoId,linhaPainel:linhaAtual,previsto,executado});
      return{...item,servico,ano,mes,importacao_id:importacaoId,linhaPainel:linhaAtual,previstoGrafico:previsto,executadoGrafico:executado};
    });
  }

  function renderVelocidade(dados){const mapa=new Map();for(const item of dados||[]){if(!item?.data_normalizada)continue;const valor=n(item.velocidade_media||item.velocidadeMedia||item["Velocidade Média"]||item["Velocidade Media"]||item.vm||item.VM||item.velocidade);if(valor<=0)continue;const mes=String(item.data_normalizada).slice(0,7),atual=mapa.get(mes)||{soma:0,qtd:0};atual.soma+=valor;atual.qtd+=1;mapa.set(mes,atual);}const linhas=[...mapa].sort(([a],[b])=>a.localeCompare(b)).map(([mes,item])=>({mes,valor:item.soma/item.qtd})),atual=linhas.at(-1)?.valor||0;const mostrador=$("kpiSpeedometerDrawing"),valorMostrador=$("kpiSpeedometerValue");if(mostrador)mostrador.style.setProperty("--needle-angle",`${-90+Math.min(atual/120,1)*180}deg`);if(valorMostrador)valorMostrador.textContent=atual.toLocaleString("pt-BR",{maximumFractionDigits:1});render("graficoKpiVelocidadeMediaMensal","linha",linhas.map(item=>item.mes),[{nome:"Velocidade média",valores:linhas.map(item=>item.valor),cor:"#22d3ee"}]);iniciarPercurso(atual);}

  window.renderGraficosKpiServicoCompleto=function renderGraficosKpiServicoCompleto3D(dados,filtro={},painel={}){
    ultimoContextoGraficosKPI={dados,filtro,painel};
    const mensal=mensalFiltrado(filtro),servico=filtro.servico||"",cores=window.CCO_CORES_GRAFICOS||{},executadoCor=cores.executado||"#10b981",previstoCor=cores.previsto||"#6ee7b7",mapaDiario=new Map();
    for(const item of dados||[]){if(!item?.data_normalizada)continue;const data=String(item.data_normalizada).slice(0,10);mapaDiario.set(data,(mapaDiario.get(data)||0)+valorExecutado(servico||item.servico,item));}
    const diario=[...mapaDiario].sort(([a],[b])=>a.localeCompare(b));
    const categoriasDiarias=diario.map(([data])=>typeof window.formatarDataBRSimples==="function"?window.formatarDataBRSimples(data):data),valoresDiarios=diario.map(([,valor])=>valor),containerDiario=$("graficoKpiServicoDiario");
    console.log("[KPI Execução Diária Mobile]",{id:containerDiario?.id,largura:containerDiario?.clientWidth,altura:containerDiario?.clientHeight,conectado:containerDiario?.isConnected,categorias:categoriasDiarias,valores:valoresDiarios,mobile:window.isMobileCCO?.()});
    render("graficoKpiServicoDiario",cfg=>cfg.mobile?"linha":"cilindro",categoriasDiarias,[{nome:"Executado diário",valores:valoresDiarios,cor:executadoCor}]);
    const previstoTotal=mensal.length?mensal.reduce((s,item)=>s+n(item.previsto),0):n(painel.previsto),executadoTotal=mensal.length?mensal.reduce((s,item)=>s+n(item.executado),0):n(painel.executado),labels=mensal.map(rotuloMes);
    render("graficoKpiPrevistoExecutado",cfg=>cfg.mobile?"horizontal":"cilindro",["Previsto","Executado"],[{nome:"Previsto x Executado",valores:[previstoTotal,executadoTotal],cor:executadoCor}],{grid:cfg=>cfg.mobile?{left:70,right:22,top:44,bottom:30,containLabel:true}:{}});
    render("graficoKpiServicoMensal",cfg=>cfg.mobile?"linha":"cilindro",labels,[{nome:"Executado mensal",valores:mensal.map(item=>n(item.executado)),cor:executadoCor}],{graphic:window.isMobileCCO?.()&&labels.length===1?[{type:"text",left:"center",bottom:12,style:{text:"Somente um período disponível.",fill:"#a7f3d0",font:"600 11px sans-serif"}}]:undefined});
    const indicadores=[mensal.reduce((s,i)=>s+n(i.peso_t),0),mensal.reduce((s,i)=>s+n(i.viagens),0),mensal.reduce((s,i)=>s+n(i.km_total),0),mensal.reduce((s,i)=>s+n(i.equipes),0)];
    const larguraTela=window.innerWidth||1200,raioIndicadores=larguraTela<=768?["38%","60%"]:larguraTela<=1024?["40%","63%"]:["42%","66%"],fonteIndicadores=larguraTela<=768?10:12;
    render("graficoKpiServicoIndicadores","rosca",["Peso","Viagens","KM","Equipes"],[{nome:"Indicadores",valores:indicadores}],{radius:raioIndicadores,center:["50%","58%"],mobileRadius:["34%","54%"],mobileCenter:["50%","43%"],legend:{top:6,left:"center",orient:"horizontal",type:"scroll",itemWidth:13,itemHeight:8,itemGap:14,textStyle:{fontSize:10,color:"#ecfdf5"}},label:{show:larguraTela>480,fontSize:fonteIndicadores,lineHeight:14,distanceToLabelLine:4,formatter:parametros=>`${parametros.name}\n${parametros.percent}%`},labelLine:{show:larguraTela>480,length:10,length2:8,smooth:.25},tooltip:{formatter:parametros=>`${parametros.name}<br>Valor: ${n(parametros.value).toLocaleString("pt-BR",{maximumFractionDigits:2})}<br>Participação: ${n(parametros.percent).toLocaleString("pt-BR",{maximumFractionDigits:2})}%`}});
    [["kpiCompositionPeso",indicadores[0]],["kpiCompositionViagens",indicadores[1]],["kpiCompositionKm",indicadores[2]],["kpiCompositionEquipes",indicadores[3]]].forEach(([id,valor])=>{if($(id))$(id).textContent=n(valor).toLocaleString("pt-BR",{maximumFractionDigits:1});});
    const comparativo=dadosComparativoMensal(mensal,filtro),labelsComparativo=comparativo.map(rotuloMes),seriePrevisto=comparativo.map(item=>item.previstoGrafico),serieExecutado=comparativo.map(item=>item.executadoGrafico),maiorValor=Math.max(...seriePrevisto,...serieExecutado,1);
    render("graficoKpiComparativoMensal",cfg=>cfg.mobile?"linha":"cilindro",labelsComparativo,[{nome:"Previsto",valores:seriePrevisto,cor:previstoCor},{nome:"Executado",valores:serieExecutado,cor:executadoCor}],{yAxis:{max:maiorValor},tooltip:{formatter:parametros=>{const itens=Array.isArray(parametros)?parametros:[parametros],titulo=itens[0]?.axisValueLabel||itens[0]?.name||"";return[titulo,...itens.map(item=>`${item.marker||""}${item.seriesName}: ${n(item.value?.[1]??item.value).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`)].join("<br>");}}});
    render("graficoKpiProdutividadeMensal",cfg=>cfg.mobile?"linha":"cilindro",labels,[{nome:"Ton/viagem",valores:mensal.map(i=>n(i.viagens)?n(i.peso_t)/n(i.viagens):0),cor:cores.peso||"#0f766e"},{nome:"KM/viagem",valores:mensal.map(i=>n(i.viagens)?n(i.km_total)/n(i.viagens):0),cor:cores.km||"#22c55e"}]);
    renderVelocidade(dados);
  };

  window.renderGraficoFiltroDoisMeses=function renderGraficoFiltroDoisMeses3D(){if(typeof window.carregarFiltrosGraficoDoisMeses==="function")window.carregarFiltrosGraficoDoisMeses();const mesA=$("compararMesA")?.value||"",mesB=$("compararMesB")?.value||"",servico=$("compararServico")?.value||"";if(!mesA||!mesB){G()?.destruirGrafico?.($("graficoFiltroDoisMeses"));return;}const obter=mes=>typeof window.somarPesoKmViagensPorMes==="function"?window.somarPesoKmViagensPorMes(mes):{mes,peso:0,km:0,viagens:0},dados=[obter(mesA),obter(mesB)];render("graficoFiltroDoisMeses","cilindro",dados.map(item=>item.mes),[{nome:servico?`Peso - ${servico}`:"Peso",valores:dados.map(i=>n(i.peso)),cor:"#a7f3d0"},{nome:servico?`KM - ${servico}`:"KM",valores:dados.map(i=>n(i.km)),cor:"#22d3ee"},{nome:servico?`Viagens - ${servico}`:"Viagens",valores:dados.map(i=>n(i.viagens)),cor:"#f59e0b"}]);};

  function destruirGraficosKPI(){IDS_GRAFICOS_KPI.forEach(id=>G()?.destruirGrafico?.($(id)));}
  function reconstruirGraficosKPI(){if(!ultimoContextoGraficosKPI)return false;destruirGraficosKPI();const contexto=ultimoContextoGraficosKPI;requestAnimationFrame(()=>window.renderGraficosKpiServicoCompleto(contexto.dados,contexto.filtro,contexto.painel));return true;}
  window.destruirGraficosKPI=destruirGraficosKPI;window.reconstruirGraficosKPI=reconstruirGraficosKPI;
  window.verificarGraficosKPIMobile=function verificarGraficosKPIMobile(){const resultado=IDS_GRAFICOS_KPI.map(id=>{const el=$(id);return{id,largura:el?.clientWidth||0,altura:el?.clientHeight||0,instancia:Boolean(el&&window.echarts?.getInstanceByDom?.(el)),filhos:el?.children.length||0,conectado:Boolean(el?.isConnected)};});console.table(resultado);return resultado;};
  window.addEventListener("cco:menu-fechado",()=>setTimeout(()=>{document.querySelectorAll(".kpi-chart,.cco-chart").forEach(container=>window.echarts?.getInstanceByDom?.(container)?.resize?.());recalcularCarrinho();},100));

  function preencherCatalogoKpi(catalogo,periodo){
    const selectAno=$("filtroKpiAno"),selectMes=$("filtroKpiMes");
    if(!selectAno||!selectMes||!periodo)return;
    const anos=[...new Set(catalogo.map(item=>String(item.ano)))].sort();
    const meses=catalogo.filter(item=>String(item.ano)===String(periodo.ano));
    selectAno.innerHTML=anos.map(ano=>`<option value="${ano}">${ano}</option>`).join("");
    selectAno.value=String(periodo.ano);
    selectMes.innerHTML=meses.map(item=>{const mes=String(item.mes).padStart(2,"0");return`<option value="${mes}">${window.MESES_BR?.[mes]||mes}</option>`;}).join("");
    selectMes.value=String(periodo.mes).padStart(2,"0");
    console.log("[KPI] opções inseridas no select",{periodosNoCatalogo:catalogo.length,opcoesAno:selectAno.options.length,opcoesMes:selectMes.options.length,anoExibido:selectAno.value});
  }
  async function iniciar(){if(window.__CCO_KPI_INIT_PROMISE__)return window.__CCO_KPI_INIT_PROMISE__;window.__CCO_KPI_INIT_PROMISE__=(async()=>{
    if(!await window.CCOSupabase.exigirSessao())return false;
    if(typeof atualizarData==="function")atualizarData();
    if(typeof aplicarRestricoesPerfil==="function")aplicarRestricoesPerfil();
    if(typeof preencherTexto==="function")preencherTexto("nomeArquivo","🔄 Carregando catálogo do KPI...");
    let catalogo;
    try{
      catalogo=await window.CCOPainelService.getCatalogoPeriodos();
      window.__CCO_CATALOGO_PERIODOS__=catalogo;
      console.log("[KPI] catálogo recebido",catalogo);
      const periodo=catalogo[0];
      console.log("[KPI] período inicial",periodo||null);
      if(!periodo)throw new Error("Nenhum período ativo disponível para o KPI.");
      preencherCatalogoKpi(catalogo,periodo);
      if(typeof preencherTexto==="function")preencherTexto("nomeArquivo","🔄 Carregando dados do período do KPI...");
      try{
        periodo.total_dias_mes=window.CCO_REGRAS.obterDiasOperacao(periodo.ano,periodo.mes);
        const[dadosPeriodo,linhasPainel]=await Promise.all([window.CCOKpiService.carregar(periodo.importacao_id,{ano:periodo.ano,mes:periodo.mes}),window.CCOPainelService.porImportacao(periodo.importacao_id),window.carregarRegrasServicosCCO()]);
        window.__CCO_IMPORTACAO_ATIVA__=periodo;window.__CCO_PERIODO_ATUAL__=periodo.periodo;window.operacoes=dadosPeriodo.operacoes;window.operacoesOriginal=dadosPeriodo.operacoes;window.__CCO_KPI_PAINEL_POR_SERVICO__=new Map((linhasPainel||[]).map(item=>[chavePainel(item.importacao_id,item.ano,item.mes,item.servico),item]));window.kpiMensal=dadosPeriodo.kpis.map(item=>{const linhaPainel=window.__CCO_KPI_PAINEL_POR_SERVICO__.get(chavePainel(item.importacao_id,item.ano,item.mes,item.servico))||null;return{...item,linhaPainel,peso_t:n(item.total_peso_t),viagens:n(item.total_viagens),km_total:n(item.total_km),executado:n(item.total_peso_t||item.total_km||item.total_viagens)};});
        if(typeof carregarFiltrosKpiServicoCompleto==="function")carregarFiltrosKpiServicoCompleto();
        if(typeof renderPaginaKpiPorServicoCompleto==="function")renderPaginaKpiPorServicoCompleto();
      }catch(error){
        console.error("[KPI] falha ao carregar dados do período; seletor permanece disponível",{status:error?.status,code:error?.code,details:error?.details,hint:error?.hint,message:error?.message});
        if(typeof preencherTexto==="function")preencherTexto("nomeArquivo","❌ Não foi possível carregar os dados do KPI. Selecione outro período ou tente novamente.");
      }
    }catch(error){
      console.error("Erro ao montar catálogo do KPI:",error);
      if(typeof preencherTexto==="function")preencherTexto("nomeArquivo","❌ Não foi possível carregar os períodos do KPI.");
    }
    return Boolean(catalogo?.length);
  })();return window.__CCO_KPI_INIT_PROMISE__;}
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",iniciar,{once:true}):iniciar();
})();
