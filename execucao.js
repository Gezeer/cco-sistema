/* Execução P1 a P12 - carregamento completo, sem corte e sem delay. */
(function iniciarPaginaExecucao(){
  window.CCO_PAGE = "execucao";
  const n=valor=>{const numero=Number(valor);return Number.isFinite(numero)?numero:0;};
  function instalarRenderizacaoDiretaExecucao(){
    window.ccoFinalSecaoGrafico=function(tag,titulo,id){return`<section class="section chart-card" id="secao-${id}"><div class="section-title"><span>${tag}</span><h2>${titulo}</h2></div><div id="${id}" class="cco-chart-3d cco-chart-3d--principal" role="img" aria-label="${titulo}"></div></section>`;};
    window.ccoFinalDestruirGraficoCanvas=function(id){window.CCO_GRAFICOS_3D?.destruirGrafico?.(document.getElementById(id));};
    window.ccoFinalCriarBarra=function(id,label,labels,valores){const container=document.getElementById(id),temDados=(valores||[]).some(valor=>n(valor)>0),secao=container?.closest?.(".section, .chart-card");if(secao)secao.style.display=temDados?"":"none";window.CCO_GRAFICOS_3D?.destruirGrafico?.(container);if(!container||!temDados)return null;return window.CCO_GRAFICOS_3D?.criarBarrasCilindricas?.({container,categorias:labels,valores:(valores||[]).map(n),nomeSerie:label,formatarRotulo:window.ccoFinalFormatarNumero});};
    window.ccoFinalCriarLinha=function(id,label,labels,valores){const container=document.getElementById(id),temDados=(valores||[]).some(valor=>n(valor)!==0),secao=container?.closest?.(".section, .chart-card");if(secao)secao.style.display=temDados?"":"none";window.CCO_GRAFICOS_3D?.destruirGrafico?.(container);if(!container||!temDados)return null;return window.CCO_GRAFICOS_3D?.criarLinhaComProfundidade?.({container,categorias:labels,valores:(valores||[]).map(n),nomeSerie:label});};
  }
  instalarRenderizacaoDiretaExecucao();

  const MESES=window.MESES_BR||{"01":"Janeiro","02":"Fevereiro","03":"Março","04":"Abril","05":"Maio","06":"Junho","07":"Julho","08":"Agosto","09":"Setembro","10":"Outubro","11":"Novembro","12":"Dezembro"};
  let catalogoExecucaoPromise=null;
  const pad=valor=>String(Number(valor)).padStart(2,"0");
  const periodoChave=(ano,mes)=>`${Number(ano)}-${pad(mes)}`;
  const concluida=status=>["concluida","concluida_com_avisos"].includes(String(status||"").toLowerCase());
  function maisPrioritario(novo,atual){
    const criterios=[Boolean(novo.ativa)-Boolean(atual.ativa),Number(concluida(novo.status))-Number(concluida(atual.status)),Date.parse(novo.concluido_em||0)-Date.parse(atual.concluido_em||0),Date.parse(novo.criado_em||0)-Date.parse(atual.criado_em||0)];
    return criterios.find(valor=>valor!==0)>0;
  }
  function normalizarCatalogoExecucao(dados){
    const mapa=new Map();
    for(const bruto of dados||[]){const item={...bruto,importacao_id:bruto.importacao_id||bruto.id,ano:Number(bruto.ano),mes:Number(bruto.mes)};if(!item.importacao_id||!Number.isFinite(item.ano)||!Number.isFinite(item.mes))continue;const chave=periodoChave(item.ano,item.mes),atual=mapa.get(chave);if(!atual||maisPrioritario(item,atual))mapa.set(chave,item);}
    return[...mapa.values()].filter(item=>item.ativa!==false&&(!item.status||concluida(item.status))).sort((a,b)=>a.ano-b.ano||a.mes-b.mes);
  }
  async function carregarCatalogoExecucaoCCO(forcar=false){
    if(!forcar&&catalogoExecucaoPromise)return catalogoExecucaoPromise;
    catalogoExecucaoPromise=(async()=>{
      const banco=window.supabaseClient;if(!banco)throw new Error("Supabase indisponível.");
      let dados=[];
      const respostaView=await banco.from("v_periodos_operacionais").select("importacao_id,ano,mes,status,ativa,total_registros,primeira_data,ultima_data,concluido_em,criado_em").order("ano",{ascending:true}).order("mes",{ascending:true});
      if(!respostaView.error)dados=respostaView.data||[];
      else{
        console.warn("[EXECUÇÃO Períodos] view indisponível; usando importacoes.",{code:respostaView.error.code,message:respostaView.error.message});
        const respostaFallback=await banco.from("importacoes").select("id,ano,mes,status,ativa,concluido_em,criado_em").eq("ativa",true).in("status",["concluida","concluida_com_avisos"]).order("ano",{ascending:true}).order("mes",{ascending:true});
        if(respostaFallback.error)throw respostaFallback.error;
        dados=respostaFallback.data||[];
      }
      const catalogo=normalizarCatalogoExecucao(dados);console.log("[EXECUÇÃO Períodos] catálogo",catalogo);window.__CCO_CATALOGO_EXECUCAO__=catalogo;return catalogo;
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
  async function renderizarPeriodoExecucao(periodo){
    if(!periodo)throw new Error("Período de execução não encontrado no catálogo.");
    const normalizado={...periodo,ano:String(periodo.ano),mes:pad(periodo.mes),periodo:periodoChave(periodo.ano,periodo.mes),id:periodo.importacao_id};
    console.log("[EXECUÇÃO Períodos] carregando",{ano:Number(normalizado.ano),mes:Number(normalizado.mes),importacaoId:normalizado.importacao_id});
    await window.carregarPeriodoCCO(normalizado);
    window.filtroExecucaoAnoAtual=normalizado.ano;window.filtroExecucaoMesAtual=normalizado.mes;
    localStorage.setItem("cco_execucao_periodo",JSON.stringify({ano:Number(normalizado.ano),mes:Number(normalizado.mes)}));
    if(typeof carregarFiltroMesesComparativoExecucao==="function")carregarFiltroMesesComparativoExecucao();
    if(typeof renderTabelaContratualMensal==="function")renderTabelaContratualMensal();
    if(typeof renderComparativoMesesExecucao==="function")renderComparativoMesesExecucao();
    const codigo=window.obterServicoAtivo?.();if(codigo&&codigo!=="geral")window.renderDetalheServicoMensal?.(codigo);
    return true;
  }
  async function alterarAnoExecucaoCCO(){
    const catalogo=await carregarCatalogoExecucaoCCO(),selectAno=document.getElementById("filtroExecucaoAno"),selectMes=document.getElementById("filtroExecucaoMes"),ano=Number(selectAno?.value),meses=obterMesesDoAnoExecucao(catalogo,ano);
    console.log("[EXECUÇÃO Períodos] ano alterado",{ano,mesesDisponiveis:meses});
    preencherFiltroMesExecucao(selectMes,meses,Math.max(...meses));
    return renderizarPeriodoExecucao(localizarPeriodoExecucao(catalogo,ano,selectMes.value));
  }
  async function alterarMesExecucaoCCO(){const catalogo=await carregarCatalogoExecucaoCCO(),ano=Number(document.getElementById("filtroExecucaoAno")?.value),mes=Number(document.getElementById("filtroExecucaoMes")?.value);return renderizarPeriodoExecucao(localizarPeriodoExecucao(catalogo,ano,mes));}
  window.carregarCatalogoExecucaoCCO=carregarCatalogoExecucaoCCO;window.obterMesesDoAnoExecucao=obterMesesDoAnoExecucao;window.localizarPeriodoExecucao=localizarPeriodoExecucao;window.alterarAnoExecucaoCCO=alterarAnoExecucaoCCO;window.alterarMesExecucaoCCO=alterarMesExecucaoCCO;window.aplicarFiltroExecucaoMensal=alterarMesExecucaoCCO;

  const cacheEvolucaoExecucao=new Map();
  function invalidarCacheEvolucaoExecucaoCCO(){cacheEvolucaoExecucao.clear();}
  window.invalidarCacheEvolucaoExecucaoCCO=invalidarCacheEvolucaoExecucaoCCO;
  document.addEventListener("cco:importacao-concluida",()=>{invalidarCacheEvolucaoExecucaoCCO();const servico=window.obterServicoAtivo?.();if(servico&&servico!=="geral")renderizarEvolucaoHistoricaCCO(servico).catch(error=>console.error("[EXECUÇÃO Evolução] atualização após importação falhou",error));});
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
  function atualizarTendenciaEvolucaoCCO(categorias,valores){
    const elemento=garantirIndicadorTendenciaEvolucaoCCO();if(!elemento)return null;const tendencia=calcularTendenciaEvolucaoCCO(categorias,valores),texto=elemento.querySelector(".execucao-tendencia__texto"),formatar=valor=>n(valor).toLocaleString("pt-BR",{maximumFractionDigits:2}),formatarPercentual=valor=>Math.abs(valor).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});
    elemento.classList.remove("is-crescimento","is-queda","is-estavel","is-indisponivel","is-animando");elemento.classList.add(`is-${tendencia.tipo}`);
    if(tendencia.tipo==="indisponivel"){
      texto.textContent=tendencia.atual?"Comparação indisponível — somente um período com dados.":"Comparação indisponível";elemento.setAttribute("aria-label",texto.textContent);elemento.removeAttribute("title");return tendencia;
    }
    const anterior=tendencia.anterior,atual=tendencia.atual,pct=tendencia.percentual===null?null:formatarPercentual(tendencia.percentual);let mensagem;
    if(tendencia.tipo==="crescimento")mensagem=anterior.valor===0?`Crescimento a partir de zero • ${anterior.categoria} → ${atual.categoria}`:`Crescimento de ${pct}% • ${anterior.categoria} → ${atual.categoria}`;
    else if(tendencia.tipo==="queda")mensagem=pct===null?`Queda • ${anterior.categoria} → ${atual.categoria}`:`Queda de ${pct}% • ${anterior.categoria} → ${atual.categoria}`;
    else mensagem=anterior.valor===0&&atual.valor===0?`Estável — sem variação • ${anterior.categoria} → ${atual.categoria}`:`Estável • ${anterior.categoria} → ${atual.categoria}`;
    texto.textContent=mensagem;const acessivel=`${tendencia.tipo==="crescimento"?"Crescimento":tendencia.tipo==="queda"?"Queda":"Estável"}${pct!==null?` de ${pct} por cento`:""} entre ${anterior.categoria} e ${atual.categoria}.`;elemento.setAttribute("aria-label",acessivel);elemento.title=`Anterior: ${anterior.categoria} — ${formatar(anterior.valor)}\nAtual: ${atual.categoria} — ${formatar(atual.valor)}\nDiferença: ${formatar(tendencia.diferenca)}${pct!==null?`\nVariação: ${pct}%`:""}`;
    void elemento.offsetWidth;elemento.classList.add("is-animando");console.log("[EXECUÇÃO Tendência]",{tipo:tendencia.tipo,anterior,atual,diferenca:tendencia.diferenca,percentual:tendencia.percentual});return tendencia;
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
  async function buscarEvolucaoServicoCCO(servico){
    const catalogo=await carregarCatalogoExecucaoCCO(),assinatura=catalogo.map(item=>item.importacao_id).join("|"),chaveCache=`evolucao:${servico}`,armazenado=cacheEvolucaoExecucao.get(chaveCache);
    if(armazenado?.assinatura===assinatura)return{catalogo,linhas:armazenado.linhas};
    const idsAtivos=new Set(catalogo.map(item=>String(item.importacao_id))),banco=window.supabaseClient;
    let resposta=await banco.from("painel_executivo").select("importacao_id,ano,mes,servico,acumulado,previsto,percentual,valor_total").in("importacao_id",[...idsAtivos]).eq("servico",servico).order("ano",{ascending:true}).order("mes",{ascending:true});
    if(resposta.error){
      console.warn("[EXECUÇÃO Evolução] campo percentual indisponível; usando campos essenciais.",{code:resposta.error.code,message:resposta.error.message});
      resposta=await banco.from("painel_executivo").select("importacao_id,ano,mes,servico,acumulado,previsto,valor_total").in("importacao_id",[...idsAtivos]).eq("servico",servico).order("ano",{ascending:true}).order("mes",{ascending:true});
    }
    if(resposta.error)throw resposta.error;
    const porPeriodo=new Map();
    for(const item of resposta.data||[]){if(!idsAtivos.has(String(item.importacao_id)))continue;porPeriodo.set(periodoChave(item.ano,item.mes),item);}
    const linhas=[...porPeriodo.values()].sort((a,b)=>Number(a.ano)-Number(b.ano)||Number(a.mes)-Number(b.mes));cacheEvolucaoExecucao.set(chaveCache,{assinatura,linhas});return{catalogo,linhas};
  }
  async function renderizarEvolucaoHistoricaCCO(servicoSelecionado){
    const servico=String(servicoSelecionado||"").trim().toUpperCase();if(!servico||servico==="GERAL")return null;
    const{catalogo,linhas}=await buscarEvolucaoServicoCCO(servico),mapaValor=new Map(linhas.map(item=>[periodoChave(item.ano,item.mes),n(item.acumulado)])),categorias=catalogo.map(item=>`${MESES[pad(item.mes)]||pad(item.mes)}/${item.ano}`),valores=catalogo.map(item=>{const chave=periodoChave(item.ano,item.mes);return mapaValor.has(chave)?mapaValor.get(chave):null;});
    console.log("[EXECUÇÃO Evolução]",{servico,periodos:categorias,valores,total:valores.length});
    const container=garantirContainerEvolucao(servico);if(!container)return null;
    const ativo=window.obterServicoAtivo?.();if(ativo&&String(ativo).toUpperCase()!==servico)return null;
    const formatar=valor=>n(valor).toLocaleString("pt-BR",{maximumFractionDigits:2});
    const grafico=window.CCO_GRAFICOS_3D?.renderizarDireto?.(container,{tipo:"cilindro",categorias,series:[{nome:"Executado",valores,formatarRotulo:(valor,indice)=>valores[indice]==null?"":formatar(valor)}],tooltip:{formatter:parametros=>{const item=(Array.isArray(parametros)?parametros:[parametros])[0],indice=item?.dataIndex??0;return valores[indice]==null?`${categorias[indice]}<br>Sem dados válidos`:`${categorias[indice]}<br>Executado: ${formatar(valores[indice])}`;}}});
    posicionarSecoesDetalheExecucao();atualizarTendenciaEvolucaoCCO(categorias,valores);return grafico;
  }
  window.renderizarEvolucaoHistoricaCCO=renderizarEvolucaoHistoricaCCO;
  const renderDetalheServicoMensalOriginal=window.renderDetalheServicoMensal;
  if(typeof renderDetalheServicoMensalOriginal==="function"){
    const renderComEvolucao=function(codigo){const resultado=renderDetalheServicoMensalOriginal.apply(this,arguments);posicionarSecoesDetalheExecucao();renderizarEvolucaoHistoricaCCO(codigo).catch(error=>console.error("[EXECUÇÃO Evolução] falha",{servico:codigo,code:error?.code,message:error?.message}));return resultado;};
    window.renderDetalheServicoMensal=renderComEvolucao;try{renderDetalheServicoMensal=renderComEvolucao;}catch(_){}
  }

  async function iniciar(){
    try {
      if(!await window.CCOSupabase.exigirSessao())return false;
      if(window.__CCO_EXECUCAO_PERIODOS_INICIADOS__)return true;
      window.__CCO_EXECUCAO_PERIODOS_INICIADOS__=true;window.__CCO_CONTROLADOR_PERIODOS_LEGADO_DESATIVADO__=true;
      const[catalogo]=await Promise.all([carregarCatalogoExecucaoCCO(),window.carregarRegrasServicosCCO()]);
      if(!catalogo.length)throw new Error("Nenhum período ativo disponível para Execução.");
      let salvo=null;try{salvo=JSON.parse(localStorage.getItem("cco_execucao_periodo")||"null");}catch(_){salvo=null;}
      const ultimo=catalogo.at(-1),preferido=localizarPeriodoExecucao(catalogo,salvo?.ano,salvo?.mes)||ultimo,selectAno=document.getElementById("filtroExecucaoAno"),selectMes=document.getElementById("filtroExecucaoMes"),anos=[...new Set(catalogo.map(item=>Number(item.ano)))].filter(Number.isFinite).sort((a,b)=>a-b);
      preencherFiltroAnoExecucao(selectAno,anos,preferido.ano);preencherFiltroMesExecucao(selectMes,obterMesesDoAnoExecucao(catalogo,preferido.ano),preferido.mes);
      await renderizarPeriodoExecucao(preferido);
    } catch (erro) {
      window.__CCO_EXECUCAO_PERIODOS_INICIADOS__=false;
      console.error("Erro ao iniciar Execução P1 a P12:", erro);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded",iniciar,{once:true});
  } else {
    iniciar();
  }
})();
