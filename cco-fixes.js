/* Correções consolidadas: períodos sob demanda, KPI único e importação idempotente. */
(function ccoCorrecoesConsolidadas() {
  "use strict";

  console.log("[PAINEL] build:", "20260718-dias-distintos-v6");

  const PAGINA = String(window.CCO_PAGE || "").toLowerCase();
  const SERVICOS_OFICIAIS = Object.freeze(["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"]);
  const EQUIPES_FIXAS_PAINEL = window.CCO_EQUIPES_FIXAS;
  const MEDICAO_POR_SERVICO = Object.freeze({P1:"Tonelada","P2.1":"Viagens","P2.2":"Viagens",P3:"Equipe",P4:"Tonelada",P5:"KM",P6:"KM",P7:"Equipe",P8:"Equipe",P9:"Equipe",P10:"Equipe",P11:"Equipe",P12:"Executado"});
  const MESES = window.MESES_BR || {"01":"Janeiro","02":"Fevereiro","03":"Março","04":"Abril","05":"Maio","06":"Junho","07":"Julho","08":"Agosto","09":"Setembro","10":"Outubro","11":"Novembro","12":"Dezembro"};
  let periodosPromise;
  let cargaPromise;
  let renderFrame = 0;

  function db() { return window.supabaseClient; }
  function pad(v) { return String(v || "").padStart(2, "0"); }
  function numeroSeguro(v) {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const texto=String(v??"").trim();if(!texto)return 0;
    const n=Number(texto.replace(/\s/g,"").replace(/\.(?=\d{3}(?:\D|$))/g,"").replace(",","."));
    return Number.isFinite(n) ? n : 0;
  }
  function numeroOpcional(v) { return v === undefined || v === null || v === "" ? null : numeroSeguro(v); }
  function normalizarServico(valor) {
    return String(valor ?? "").trim().toUpperCase().replace(/\s+/g, "").replace(/^P(\d+)[.,](\d+)$/, "P$1.$2");
  }
  function obterMedicaoOficial(servico) { return MEDICAO_POR_SERVICO[normalizarServico(servico)] || "Não definida"; }
  function obterExecutadoBruto(registro) { return registro?.executado; }
  function obterExecutado(registro) { return numeroSeguro(obterExecutadoBruto(registro)); }
  function calcularAcumuladoP12(registros) {
    return (registros || []).filter(item => normalizarServico(item.servico ?? item.servico_p ?? item.tipo_servico) === "P12").reduce((total,item) => total + obterExecutado(item), 0);
  }
  function normalizarDataISO(valor){const texto=String(valor??"").trim();if(/^\d{4}-\d{2}-\d{2}/.test(texto))return texto.slice(0,10);const m=texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`:"";}
  function calcularDiasAcumuladosServico(registros,servico,ano,mes){const codigo=normalizarServico(servico),anoAlvo=Number(ano),mesAlvo=Number(mes),datas=(registros||[]).filter(r=>normalizarServico(r.servico??r.servico_p??r.tipo_servico)===codigo).map(r=>normalizarDataISO(r.data_operacao??r.data??r.Data)).filter(data=>data&&Number(data.slice(0,4))===anoAlvo&&Number(data.slice(5,7))===mesAlvo);return new Set(datas).size;}
  function calcularMetricasContratuaisEquipePainel({servico,valorUnitario,previstoMensal,diasAcumulados,totalDiasMes}) {
    const codigo=normalizarServico(servico),equipesFixas=EQUIPES_FIXAS_PAINEL[codigo];
    if(!Number.isFinite(equipesFixas))return null;
    const previsto=numeroSeguro(valorUnitario)*numeroSeguro(equipesFixas)*numeroSeguro(totalDiasMes);
    return {acumulado:equipesFixas,medicao:"Equipe",previstoMensal:previsto,previstoAcumulado:previsto,percentual:previsto>0?equipesFixas/previsto*100:null,valor:equipesFixas*numeroSeguro(valorUnitario),origem:"contratual_fixa"};
  }
  window.__CCO_PAINEL_METRICAS__ = Object.freeze({SERVICOS_OFICIAIS,EQUIPES_FIXAS_PAINEL,MEDICAO_POR_SERVICO,normalizarServico,obterMedicaoOficial,calcularAcumuladoP12,calcularDiasAcumuladosServico,calcularMetricasContratuaisEquipePainel});
  function obterChaveRegistro(registro, indice) {
    return [registro.importacao_id || "", registro.rd || "", registro.servico || registro.tipo_servico || "", registro.data_operacao || "", indice].join("|");
  }
  function chavePeriodo(ano, mes) { return `${ano}-${pad(mes)}`; }

  async function carregarCatalogoPeriodos(forcar = false) {
    if (!forcar && periodosPromise) return periodosPromise;
    periodosPromise = (async () => {
      const cliente = db();
      if (!cliente) { console.error("Cliente Supabase não disponível."); return []; }

      try {
        const data=await window.CCOPainelService.catalogo();
        const catalogo=(data||[]).map(item=>({ano:String(item.ano),mes:pad(item.mes),periodo:chavePeriodo(item.ano,item.mes),importacao_id:item.importacao_id,nome_arquivo:item.nome_arquivo,status:item.status,ativa:item.ativa,origem:"v_catalogo_periodos"}));
        window.__CCO_IMPORTACOES_POR_PERIODO__=Object.fromEntries(catalogo.map(item=>[item.periodo,item]));
        window.__CCO_CATALOGO_PERIODOS__=catalogo;
        console.log("✅ Catálogo de períodos carregado:",catalogo);
        return catalogo;
      } catch(error) {
        console.error("Falha inesperada ao carregar catálogo de períodos:", { message:error?.message, code:error?.code, details:error?.details, hint:error?.hint });
        return [];
      }
    })();
    try { return await periodosPromise; }
    catch(error) { periodosPromise = null; console.error("Erro ao carregar catálogo", { message:error?.message, code:error?.code, details:error?.details, hint:error?.hint }); return []; }
  }

  const obterPeriodos = carregarCatalogoPeriodos;
  window.carregarCatalogoPeriodos = carregarCatalogoPeriodos;

  async function buscarImportacaoPeriodo(periodo){
    if(periodo.importacao_id)return{id:periodo.importacao_id,ativo:true,status:periodo.status||"concluida"};
    const {data,error}=await db().from("v_catalogo_periodos").select("importacao_id,status,ativa,criado_em").eq("ano",Number(periodo.ano)).eq("mes",Number(periodo.mes)).maybeSingle();
    if(error){console.warn("[DIAS] não foi possível selecionar a importação do período.",{message:error.message,code:error.code});return null;}
    return data?{...data,id:data.importacao_id}:null;
  }

  async function buscarTodasOperacoes(periodo) {
    const cliente = db();
    const resultado = [];
    const importacao=await buscarImportacaoPeriodo(periodo);
    if(!importacao?.id)throw new Error("Período sem importacao_id ativo.");
    const linhas=PAGINA==="execucao"
      ?await window.CCOExecucaoService.carregar(importacao.id,{ano:periodo.ano,mes:periodo.mes})
      :await window.CCOKpiService.operacoes(importacao.id);
    resultado.push(...linhas);
    periodo.importacao_id_usado=importacao?.id||null;
    console.log("[DIAS] período selecionado:",periodo.ano,periodo.mes);console.log("[DIAS] importacao_id usado:",periodo.importacao_id_usado);console.log("[DIAS] total de registros:",resultado.length);
    const vistos = new Set();
    return resultado.filter((item, indice) => {
      const chave = obterChaveRegistro(item, indice);
      if (vistos.has(chave)) return false;
      vistos.add(chave); return true;
    });
  }

  async function buscarPainel(periodo) {
    const importacao=await buscarImportacaoPeriodo(periodo);
    if(!importacao?.id)throw new Error("Período sem importacao_id ativo.");
    return window.CCOPainelService.porImportacao(importacao.id);
  }

  function publicarPeriodo(linhas, painelLinhas, periodo, diasOperacaoOficial) {
    const metricas = window.CCOMetricas;
    if (!metricas) throw new Error("CCOMetricas não foi carregado antes de cco-fixes.js");
    const convertidas = linhas.map(item => ({
      servico: metricas.normalizarServico(item.servico || item.tipo_servico), origem: "Banco Supabase",
      importacao_id: item.importacao_id, rd: String(item.rd || ""), data: item.data_operacao || "",
      data_operacao: item.data_operacao || "", data_normalizada: String(item.data_operacao || "").slice(0, 10), turno: item.turno || "",
      ra: item.ra || "", setor: "", peso: numeroOpcional(item.peso_t),
      viagens: numeroOpcional(item.viagens), km: numeroOpcional(item.km_total), km_total: numeroOpcional(item.km_total),
      equipe: numeroOpcional(item.equipe ?? item.qtd_equipe), executado: numeroOpcional(item.executado), velocidade_media: numeroOpcional(item.velocidade_media),
      tempo_produtivo_h: numeroOpcional(item.tempo_produtivo_minutos) == null ? null : numeroSeguro(item.tempo_produtivo_minutos) / 60,
      status: "Com dados", dados_originais:item.dados_originais || null
    }));
    window.operacoes = convertidas;
    window.operacoesOriginal = convertidas.slice();
    /* utils.js usa bindings globais léxicos, além das propriedades de window. */
    try { operacoes = convertidas; operacoesOriginal = convertidas.slice(); } catch (_) {}
    window.dadosBaseAtiva = convertidas;
    window.__CCO_PERIODO_ATUAL__ = periodo.periodo;
    window.__CCO_IMPORTACAO_ATIVA__ = {...periodo,id:periodo.importacao_id,importacao_id:periodo.importacao_id};

    const metas = new Map((painelLinhas || []).map(item => [normalizarServico(item.servico), item]));
    const schemaOperacoes = window.__CCO_SCHEMA_OPERACOES__ || { opcionaisDisponiveis: [] };
    if (PAGINA === "painel") {
      console.log("[PAINEL] chaves do primeiro registro:",Object.keys(linhas?.[0]||{}));
      console.table(SERVICOS_OFICIAIS.map(servico=>({servico,previstoEncontrado:numeroSeguro(metas.get(servico)?.previsto),fonte:metas.has(servico)?"painel_executivo":"não encontrado"})));
      console.table(Object.keys(EQUIPES_FIXAS_PAINEL).map(servico=>{const rs=linhas.filter(r=>normalizarServico(r.servico??r.servico_p??r.tipo_servico)===servico),datas=rs.map(r=>r.data_operacao??r.data??r.Data).filter(Boolean);return{servico,registros:rs.length,datasEncontradas:datas.length,diasDistintos:calcularDiasAcumuladosServico(rs,servico,periodo.ano,periodo.mes),primeiraData:datas[0]??null,ultimaData:datas.at(-1)??null};}));
    }
    const painelConvertido = SERVICOS_OFICIAIS.map(servico => {
      const item = metas.get(servico) || {};
      const registros = linhas.filter(linha => normalizarServico(linha.servico ?? linha.servico_p ?? linha.tipo_servico) === servico);
      const diasOperacao = window.CCO_REGRAS.obterDiasOperacao(periodo.ano,periodo.mes);
      const valoresOficiais = window.CCO_VALORES_FIXOS || (typeof VALORES_FIXOS !== "undefined" ? VALORES_FIXOS : {});
      const valorUnitario = numeroSeguro(item.valor_unitario) || numeroSeguro(valoresOficiais[servico]);
      const campoMetrica = metricas.METRICA_POR_SERVICO[servico];
      const metricaDisponivel = campoMetrica === "equipe"
        ? schemaOperacoes.opcionaisDisponiveis.some(c => c === "equipe" || c === "qtd_equipe")
        : schemaOperacoes.opcionaisDisponiveis.includes(campoMetrica);
      let linha,consolidado=null,diasAcumulados=calcularDiasAcumuladosServico(registros,servico,periodo.ano,periodo.mes);
      if(PAGINA==="painel"&&Object.prototype.hasOwnProperty.call(EQUIPES_FIXAS_PAINEL,servico)){
        const contrato=calcularMetricasContratuaisEquipePainel({servico,valorUnitario,previstoMensal:EQUIPES_FIXAS_PAINEL[servico],diasAcumulados,totalDiasMes:diasOperacao});
        linha={acumulado_mes:contrato.acumulado,metrica_disponivel:true,previsto_mes:contrato.previstoMensal,previsto_acumulado:contrato.previstoAcumulado,porcentagem_execucao:contrato.percentual,valor:contrato.valor,status:registros.length?"Com dados":"Regra contratual",fonte_metricas:contrato.origem};
      }else if(servico==="P12"){
        diasAcumulados=diasAcumulados||metricas.calcularDiasExecutados(registros,"P12");
        const colunaExecutado=schemaOperacoes.opcionaisDisponiveis.includes("executado")||registros.some(r=>Object.prototype.hasOwnProperty.call(r,"executado"));
        const chaveExecutadoEncontrada=registros.some(r=>Object.prototype.hasOwnProperty.call(r,"executado"))?"executado":null;
        const acumulado=calcularAcumuladoP12(registros),previsto=numeroSeguro(item.previsto),previstoAcumulado=metricas.calcularPrevistoAcumulado({previstoMensal:previsto,diasExecutados:diasAcumulados,diasOperacaoMes:diasOperacao});
        const temExecutadoPreenchido=registros.some(r=>{const v=obterExecutadoBruto(r);return v!==null&&v!==undefined&&String(v).trim()!=="";});
        linha={acumulado_mes:colunaExecutado?acumulado:null,metrica_disponivel:colunaExecutado,previsto_mes:previsto,previsto_acumulado:previstoAcumulado,porcentagem_execucao:colunaExecutado?metricas.calcularPercentualCumprimento({acumuladoReal:acumulado,previstoAcumulado}):null,valor:colunaExecutado?acumulado*valorUnitario:null,status:!registros.length?"Sem dados":temExecutadoPreenchido?"Com dados":"Executado ausente",fonte_metricas:"operacoes.executado"};
        if(PAGINA==="painel"){console.log("[P12] registros encontrados:",registros.length);console.log("[P12][SUPABASE] chaves do registro:",Object.keys(registros[0]||{}));console.log("[P12][SUPABASE] amostra:",registros.slice(0,3));console.log("[P12] coluna Executado encontrada:",chaveExecutadoEncontrada);console.table(registros.slice(0,20).map(r=>({data:r.data_operacao??r.data??null,executadoBruto:obterExecutadoBruto(r)??null,executadoNormalizado:obterExecutado(r)})));console.log("[P12] soma final:",acumulado);}
      }else{
        consolidado=metricas.consolidarServico({servico,registros,previstoMensal:item.previsto,diasOperacaoMes:diasOperacao,valorUnitario,nome:item.nome_servico||"",unidade:obterMedicaoOficial(servico)});
        linha={acumulado_mes:metricaDisponivel?consolidado.acumuladoReal:null,metrica_disponivel:metricaDisponivel,previsto_mes:consolidado.previstoMensal,previsto_acumulado:metricaDisponivel?consolidado.previstoAcumulado:null,porcentagem_execucao:metricaDisponivel?consolidado.percentualCumprimento:null,valor:metricaDisponivel?consolidado.valorAcumulado:null,status:metricaDisponivel&&consolidado.status==="com_dados"?"Com dados":"Sem dados",fonte_metricas:"operacoes + painel_executivo + dias_operacao"};
      }
      return {servico,nome_servico:item.nome_servico||"",medicao:obterMedicaoOficial(servico),dias_acumulados:diasAcumulados,total_dias_mes:diasOperacao,quantidade_equipes:consolidado?.quantidadeEquipes??null,produtividade:consolidado?.produtividade??null,avisos_consistencia:consolidado?.avisos||[],...linha};
    });
    window.painelExecutivo = painelConvertido;
    window.painelExecutivoOriginal = painelConvertido.slice();
    try { painelExecutivo = painelConvertido; painelExecutivoOriginal = painelConvertido.slice(); } catch (_) {}
    window.painelExecutivoAtivo = painelConvertido;
  }

  async function carregarPeriodo(periodo) {
    if (!periodo) return false;
    if (cargaPromise?.chave === periodo.periodo) return cargaPromise.promise;
    const promise = (async () => {
      const [linhas, painelLinhas, diasOperacao] = await Promise.all([
        buscarTodasOperacoes(periodo),
        buscarPainel(periodo),
        Promise.resolve(window.CCO_REGRAS.obterDiasOperacao(periodo.ano, periodo.mes))
      ]);
      publicarPeriodo(linhas, painelLinhas, periodo, diasOperacao);
      return true;
    })();
    cargaPromise = { chave: periodo.periodo, promise };
    try { return await promise; } finally { if (cargaPromise?.promise === promise) cargaPromise = null; }
  }
  window.carregarPeriodoCCO=carregarPeriodo;

  function preencherPeriodos(prefixo, periodos, preferido) {
    const anoEl = document.getElementById(`${prefixo}Ano`);
    const mesEl = document.getElementById(`${prefixo}Mes`);
    if (!anoEl || !mesEl || !periodos.length) return periodos[0];
    const escolhido = periodos.find(p => p.periodo === preferido) || periodos[0];
    const anos = [...new Set(periodos.map(p => p.ano))].sort((a,b) => b.localeCompare(a));
    anoEl.innerHTML = anos.map(a => `<option value="${a}">${a}</option>`).join("");
    anoEl.value = escolhido.ano;
    const meses = periodos.filter(p => p.ano === escolhido.ano);
    mesEl.innerHTML = meses.map(p => `<option value="${p.mes}">${MESES[p.mes] || p.mes}</option>`).join("");
    mesEl.value = escolhido.mes;
    return escolhido;
  }

  async function selecionarPeriodo(prefixo) {
    const periodos = await obterPeriodos();
    const ano = document.getElementById(`${prefixo}Ano`)?.value;
    const mes = document.getElementById(`${prefixo}Mes`)?.value;
    return periodos.find(p => p.ano === ano && p.mes === mes) || periodos[0];
  }

  function preencherPainelPeriodos(periodos, preferido) {
    return preencherPeriodos("filtro", periodos, preferido);
  }

  function desenharGraficoCanvas(canvas,dados,campo,cor) {
    if(!canvas)return;
    const largura=Math.max(canvas.clientWidth||900,320),altura=Math.max(canvas.clientHeight||360,260),escala=window.devicePixelRatio||1;
    canvas.width=largura*escala;canvas.height=altura*escala;
    const ctx=canvas.getContext("2d");ctx.scale(escala,escala);ctx.clearRect(0,0,largura,altura);
    const margem={top:22,right:18,bottom:42,left:56},w=largura-margem.left-margem.right,h=altura-margem.top-margem.bottom;
    const valores=dados.map(x=>Math.max(0,numeroSeguro(x[campo]))),max=Math.max(...valores,1),passo=w/dados.length,barra=Math.max(5,passo*.62);
    ctx.strokeStyle="#dceae5";ctx.beginPath();ctx.moveTo(margem.left,margem.top);ctx.lineTo(margem.left,margem.top+h);ctx.lineTo(margem.left+w,margem.top+h);ctx.stroke();
    dados.forEach((item,i)=>{const bh=h*(valores[i]/max),x=margem.left+i*passo+(passo-barra)/2,y=margem.top+h-bh;ctx.fillStyle=cor;ctx.fillRect(x,y,barra,bh);ctx.fillStyle="#29453c";ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillText(item.servico,x+barra/2,margem.top+h+18);});
    canvas.dataset.renderFallback="true";
  }

  async function renderizarPainelGeralSeguro() {
    try { window.atualizarDashboard?.(); }
    catch (error) { console.error("[PAINEL] Rotina anterior ao gráfico falhou; renderização essencial continuará.",error); }
    try { window.renderTabelaExecutiva?.(); }
    catch (error) { console.error("[PAINEL] Falha ao renderizar tabela executiva.",error); }
    for(let tentativa=0;tentativa<40&&!window.Chart;tentativa++)await new Promise(resolve=>setTimeout(resolve,50));
    const canvases={execucao:document.getElementById("graficoExecucao"),valor:document.getElementById("graficoValorServicoBarras")};
    const dados=SERVICOS_OFICIAIS.map(servico=>{
      const item=(window.painelExecutivoAtivo||[]).find(x=>normalizarServico(x.servico)===servico)||{};
      return {servico,percentual:numeroSeguro(item.porcentagem_execucao),valor:numeroSeguro(item.valor)};
    });
    console.log("[PAINEL][GRÁFICOS] diagnóstico",{chartJs:typeof window.Chart==="function",canvasExecucao:!!canvases.execucao,canvasValor:!!canvases.valor,dados});
    if(!canvases.execucao||!canvases.valor)return console.error("[PAINEL][GRÁFICOS] Canvas obrigatório não encontrado.");
    if(typeof window.Chart!=="function"){
      console.warn("[PAINEL][GRÁFICOS] Chart.js não foi carregado; usando canvas nativo.");
      desenharGraficoCanvas(canvases.execucao,dados,"percentual","#4f8f70");desenharGraficoCanvas(canvases.valor,dados,"valor","#77a9d4");return;
    }
    try {
      if(typeof window.renderGraficos!=="function")throw new Error("Função renderGraficos indisponível.");
      window.renderGraficos();
    } catch (error) {
      console.error("[PAINEL][GRÁFICOS] Chart.js falhou; usando canvas nativo.",error);
      desenharGraficoCanvas(canvases.execucao,dados,"percentual","#4f8f70");desenharGraficoCanvas(canvases.valor,dados,"valor","#77a9d4");
    }
  }

  async function iniciarPainel() {
    const periodos = await obterPeriodos();
    if (!periodos.length) return false;
    const escolhido = preencherPainelPeriodos(periodos, window.__CCO_PERIODO_ATUAL__);
    await carregarPeriodo(escolhido);
    await renderizarPainelGeralSeguro();
    window.aplicarRestricoesPerfil?.();
    return true;
  }

  async function aplicarPainel() {
    if (window.__CCO_FILTRO_PAINEL_EM_ANDAMENTO__) return false;
    window.__CCO_FILTRO_PAINEL_EM_ANDAMENTO__ = true;
    try {
      const periodos = await obterPeriodos();
      const ano = document.getElementById("filtroAno")?.value;
      const mesEl = document.getElementById("filtroMes");
      const mesesAno = periodos.filter(p => p.ano === ano);
      if (mesEl && !mesesAno.some(p => p.mes === mesEl.value)) mesEl.value = mesesAno[0]?.mes || "";
      const escolhido = await selecionarPeriodo("filtro");
      if (!escolhido) return false;
      preencherPainelPeriodos(periodos, escolhido.periodo);
      const status=document.getElementById("nomeArquivo");
      if(status)status.textContent=`Carregando ${MESES[escolhido.mes]||escolhido.mes}/${escolhido.ano}...`;
      await carregarPeriodo(escolhido);
      await renderizarPainelGeralSeguro();
      if(status)status.textContent=`Período ativo: ${MESES[escolhido.mes]||escolhido.mes}/${escolhido.ano}`;
      console.info("[FILTROS] período aplicado",escolhido);
      return true;
    } catch(error) {
      console.error("[FILTROS] falha ao aplicar período",error);
      const status=document.getElementById("nomeArquivo");
      if(status)status.textContent=`Erro ao carregar período: ${error?.message||error}`;
      return false;
    } finally {
      window.__CCO_FILTRO_PAINEL_EM_ANDAMENTO__ = false;
    }
  }

  async function iniciarExecucao() {
    try {
      const periodos = await obterPeriodos();
      if (!periodos.length) { window.filtroExecucaoAnoAtual=""; window.filtroExecucaoMesAtual=""; window.renderTabelaContratualMensal?.(); return false; }
      const escolhido = preencherPeriodos("filtroExecucao", periodos, window.__CCO_PERIODO_ATUAL__);
      await carregarPeriodo(escolhido);
      window.filtroExecucaoAnoAtual = escolhido.ano;
      window.filtroExecucaoMesAtual = escolhido.mes;
      window.renderTabelaContratualMensal?.();
      return true;
    } catch(error) {
      console.error("Erro ao carregar catálogo", { message:error?.message, code:error?.code, details:error?.details, hint:error?.hint });
      return false;
    }
  }

  async function aplicarExecucao() {
    const periodos = await obterPeriodos();
    if (!periodos.length) { window.renderTabelaContratualMensal?.(); return false; }
    const ano = document.getElementById("filtroExecucaoAno")?.value;
    const atuaisAno = periodos.filter(p => p.ano === ano);
    const mesEl = document.getElementById("filtroExecucaoMes");
    if (mesEl && !atuaisAno.some(p => p.mes === mesEl.value)) mesEl.value = atuaisAno[0]?.mes || "";
    const escolhido = await selecionarPeriodo("filtroExecucao");
    preencherPeriodos("filtroExecucao", periodos, escolhido?.periodo);
    await carregarPeriodo(escolhido);
    window.filtroExecucaoAnoAtual = escolhido.ano;
    window.filtroExecucaoMesAtual = escolhido.mes;
    window.renderTabelaContratualMensal?.();
    const codigo = window.obterServicoAtivo?.();
    if (codigo && codigo !== "geral") window.renderDetalheServicoMensal?.(codigo);
  }

  async function iniciarKpi() {
    const periodos = await obterPeriodos();
    const escolhido = periodos[0];
    await carregarPeriodo(escolhido);
    window.carregarFiltrosKpiServicoCompleto?.();
    preencherKpiPeriodos(periodos, escolhido);
    return true; /* kpi.js faz a única primeira renderização após o await. */
  }

  function preencherKpiPeriodos(periodos, escolhido) {
    const anoEl = document.getElementById("filtroKpiAno");
    const mesEl = document.getElementById("filtroKpiMes");
    if (!anoEl || !mesEl || !escolhido) return;
    const anos = [...new Set(periodos.map(p => p.ano))].sort((a,b) => b.localeCompare(a));
    anoEl.innerHTML = anos.map(a => `<option value="${a}">${a}</option>`).join("");
    anoEl.value = escolhido.ano;
    const meses = periodos.filter(p => p.ano === escolhido.ano);
    mesEl.innerHTML = meses.map(p => `<option value="${p.mes}">${MESES[p.mes] || p.mes}</option>`).join("");
    mesEl.value = escolhido.mes;
  }

  async function trocarKpi() {
    const periodos = await obterPeriodos();
    const ano = document.getElementById("filtroKpiAno")?.value;
    const mes = document.getElementById("filtroKpiMes")?.value;
    const periodo = periodos.find(p => p.ano === ano && p.mes === pad(mes)) || periodos.find(p => p.ano === ano) || periodos[0];
    if (periodo && periodo.periodo !== window.__CCO_PERIODO_ATUAL__) {await carregarPeriodo(periodo);await carregarKpiMensalNovoBanco();}
    /* Recria os dias a partir das operações do mês recém-carregado. */
    window.carregarFiltrosKpiServicoCompleto?.();
    preencherKpiPeriodos(periodos, periodo);
    agendarRenderKpi();
  }

  function agendarRenderKpi() {
    cancelAnimationFrame(renderFrame);
    renderFrame = requestAnimationFrame(() => {
      renderFrame = 0;
      window.renderPaginaKpiPorServicoCompleto?.();
    });
  }

  async function carregarKpiMensalNovoBanco() {
    const importacaoId=window.__CCO_IMPORTACAO_ATIVA__?.importacao_id;
    if(!importacaoId)return false;
    const[data,linhasPainel]=await Promise.all([
      window.CCOKpiService.mensal(importacaoId),
      window.CCOPainelService.porImportacao(importacaoId)
    ]);
    const chavePainel=(item)=>[String(item?.importacao_id||importacaoId),Number(item?.ano)||0,Number(item?.mes)||0,String(item?.servico||"").trim().toUpperCase()].join("|");
    const mapaPainel=new Map((linhasPainel||[]).map(item=>[chavePainel(item),item]));
    window.__CCO_KPI_PAINEL_POR_SERVICO__=mapaPainel;
    const convertido=(data||[]).map(item=>({
      ...item, ano:Number(item.ano), mes:Number(item.mes), servico:String(item.servico||"").toUpperCase(),
      peso_t:numeroSeguro(item.total_peso_t), viagens:numeroSeguro(item.total_viagens),
      km_total:numeroSeguro(item.total_km), equipes:0, tempo_produtivo:0,
      linhaPainel:mapaPainel.get(chavePainel(item))||null,
      previsto:numeroSeguro(mapaPainel.get(chavePainel(item))?.previsto),
      executado:numeroSeguro(item.total_peso_t || item.total_km || item.total_viagens), valor:0
    }));
    window.kpiMensal=convertido;
    try { kpiMensal=convertido; } catch(_) {}
    return true;
  }
  window.carregarKpiMensalSupabase=carregarKpiMensalNovoBanco;
  try { carregarKpiMensalSupabase=carregarKpiMensalNovoBanco; } catch(_) {}

  /* A planilha já é separada por data; esta camada torna a entrada idempotente antes do salvamento. */
  const salvarOriginal = window.salvarBaseCompletaSupabase;
  if (typeof salvarOriginal === "function") {
    const salvarIdempotente = async function(nomeArquivo) {
      const vistos = new Set();
      const baseImportada = (typeof operacoes !== "undefined" ? operacoes : window.operacoes) || [];
      window.operacoes = baseImportada.filter(item => {
        const chave = [item.servico,item.data_normalizada,item.turno,item.ra,item.setor,
          numeroSeguro(item.peso),numeroSeguro(item.viagens),numeroSeguro(item.km),
          numeroSeguro(item.equipe),numeroSeguro(item.executado)].join("|");
        if (vistos.has(chave)) return false;
        vistos.add(chave); return true;
      });
      window.operacoesOriginal = window.operacoes.slice();
      try { operacoes = window.operacoes; operacoesOriginal = window.operacoesOriginal; } catch (_) {}
      const ok = await salvarOriginal.call(this, nomeArquivo);
      if (ok) {
        periodosPromise = null;
        delete window.__CCO_IMPORTACAO_ATIVA__;
        delete window.__CCO_PERIODOS_REAIS_V12__;
        delete window.__CCO_IMPORTACOES_POR_PERIODO__;
        delete window.__CCO_CATALOGO_PERIODOS__;
      }
      return ok;
    };
    window.salvarBaseCompletaSupabase = salvarIdempotente;
    try { salvarBaseCompletaSupabase = salvarIdempotente; } catch (_) {}
  }

  if (PAGINA === "painel" || PAGINA === "index") {
    console.info("[CCO Períodos] controlador legado desativado no Painel Geral.");
  } else if (PAGINA === "execucao") {
    window.carregarBaseSupabase = iniciarExecucao;
    window.carregarFiltrosExecucaoMensal = async () => { try { const ps=await obterPeriodos(); return preencherPeriodos("filtroExecucao", ps, window.__CCO_PERIODO_ATUAL__); } catch(error) { console.error("Erro ao carregar catálogo", { message:error?.message, code:error?.code, details:error?.details, hint:error?.hint }); return null; } };
    window.aplicarFiltroExecucaoMensal = aplicarExecucao;
    window.limparFiltroExecucaoMensal = iniciarExecucao;
    try { carregarBaseSupabase = iniciarExecucao; aplicarFiltroExecucaoMensal = aplicarExecucao; limparFiltroExecucaoMensal = iniciarExecucao; } catch (_) {}
  } else if (PAGINA === "kpi") {
    window.carregarBaseSupabase = iniciarKpi;
    window.ccoAgendarRenderKpi = trocarKpi;
    try { carregarBaseSupabase = iniciarKpi; } catch (_) {}

    /* Bloqueia chamadas históricas repetidas sem impedir uma nova combinação de filtros. */
    const renderOriginal = window.renderPaginaKpiPorServicoCompleto;
    if (typeof renderOriginal === "function") {
      let ultimaAssinatura = "";
      const renderUnico = function() {
        const assinatura = ["filtroKpiServico","filtroKpiAno","filtroKpiMes","filtroKpiDia"]
          .map(id => document.getElementById(id)?.value || "").join("|") +
          `|${window.__CCO_PERIODO_ATUAL__ || ""}|${(window.operacoesOriginal || []).length}`;
        if (assinatura === ultimaAssinatura) return;
        ultimaAssinatura = assinatura;
        return renderOriginal.apply(this, arguments);
      };
      window.renderPaginaKpiPorServicoCompleto = renderUnico;
      try { renderPaginaKpiPorServicoCompleto = renderUnico; } catch (_) {}
    }
  } else if (PAGINA === "dados") {
    const iniciarDadosNovoBanco=async function(){
      const periodos=await obterPeriodos();
      if(!periodos.length)return false;
      return carregarPeriodo(periodos[0]);
    };
    window.carregarBaseSupabase=iniciarDadosNovoBanco;
    try { carregarBaseSupabase=iniciarDadosNovoBanco; } catch(_) {}
  }

  /* index.html carrega scripts depois do DOMContentLoaded; conecta o input explicitamente. */
  if (PAGINA === "painel" || PAGINA === "index") {
    const input = document.getElementById("arquivoExcel");
    if (input && typeof window.importarPlanilhas === "function") {
      input.onchange = window.importarPlanilhas;
      input.dataset.ccoImportacaoConectada = "sim";
    }
  }
})();
