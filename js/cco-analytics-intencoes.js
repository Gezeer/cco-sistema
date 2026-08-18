(function criarInterpretadorAnalytics(global){
  "use strict";
  const INTENCOES_PERMITIDAS=new Set(["resumo_geral","resumo_diretoria","melhor_periodo","pior_periodo","consultar_servico","comparar_periodos","evolucao_mensal","ranking_financeiro","ranking_servicos","ranking_ra","ranking_turnos","consultar_dia","consultar_valor","consultar_velocidade","consultar_equipes","consultar_p12","qualidade_dados","importacoes","erros","anomalias","tendencia","pergunta_livre"]);
  const MESES={janeiro:1,jan:1,fevereiro:2,fev:2,marco:3,mar:3,abril:4,abr:4,maio:5,mai:5,junho:6,jun:6,julho:7,jul:7,agosto:8,ago:8,setembro:9,set:9,outubro:10,out:10,novembro:11,nov:11,dezembro:12,dez:12};
  const SINONIMOS_SERVICOS=Object.freeze({P1:["coleta organica","coleta convencional"],"P2.1":["coleta seletiva"],"P2.2":["rejeito seletivo","rejeito das irr"],P3:["remocao manual"],P4:["remocao mecanizada"],P5:["varricao manual","quilometragem"],P6:["varricao mecanizada"],P7:[],P8:[],P9:[],P10:[],P11:[],P12:["tonelada x quilometro x viagem","t x km/vg"]});
  const normalizar=valor=>String(valor||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();

  function extrairServicos(texto,contexto={}){
    const encontrados=new Set(),regex=/\bp\s*[-.]?\s*(1[0-2]|[1-9])(?:\s*[.,]\s*([12]))?\b/gi;
    let match;
    while((match=regex.exec(texto)))encontrados.add(`P${match[1]}${match[2]?`.`+match[2]:""}`);
    for(const[codigo,sinonimos]of Object.entries(SINONIMOS_SERVICOS))if(sinonimos.some(item=>texto.includes(item)))encontrados.add(codigo);
    if(!encontrados.size&&contexto.ultimoServico&&/^(e\b|e o\b|e a\b|o pior\b|o melhor\b|como ele\b|quanto ele\b)/.test(texto))encontrados.add(contexto.ultimoServico);
    return[...encontrados];
  }

  function extrairPeriodos(texto,catalogo=[]){
    const periodos=[],vistos=new Set(),registrar=(ano,mes)=>{const chave=`${ano}-${String(mes).padStart(2,"0")}`;if(!vistos.has(chave)){vistos.add(chave);periodos.push({ano:Number(ano),mes:Number(mes)});}};
    const anosTexto=[...texto.matchAll(/\b(20\d{2})\b/g)].map(item=>Number(item[1]));
    for(const[nome,mes]of Object.entries(MESES)){
      const regex=new RegExp(`\\b${nome}\\b(?:\\s+de)?\\s+(20\\d{2})`,`g`);let match;
      while((match=regex.exec(texto)))registrar(match[1],mes);
    }
    for(const match of texto.matchAll(/\b(0?[1-9]|1[0-2])[\/-](20\d{2})\b/g))registrar(match[2],match[1]);
    const mesesCitados=[...new Set(Object.entries(MESES).filter(([nome])=>new RegExp(`\\b${nome}\\b`).test(texto)).map(([,mes])=>mes))];
    if(anosTexto.length===1)mesesCitados.forEach(mes=>registrar(anosTexto[0],mes));
    if(!anosTexto.length&&mesesCitados.length)mesesCitados.forEach(mes=>{const item=[...catalogo].filter(x=>Number(x.mes)===mes).sort((a,b)=>b.ano-a.ano)[0];if(item)registrar(item.ano,item.mes);});
    if(!periodos.length&&anosTexto.length)catalogo.filter(item=>anosTexto.includes(Number(item.ano))).forEach(item=>registrar(item.ano,item.mes));
    if(/ultimo mes/.test(texto)&&catalogo.length){const ultimo=[...catalogo].sort((a,b)=>b.ano-a.ano||b.mes-a.mes)[0];registrar(ultimo.ano,ultimo.mes);}
    if(/mes anterior/.test(texto)&&catalogo.length){const ordenado=[...catalogo].sort((a,b)=>b.ano-a.ano||b.mes-a.mes);if(ordenado[1])registrar(ordenado[1].ano,ordenado[1].mes);}
    return periodos.sort((a,b)=>a.ano-b.ano||a.mes-b.mes);
  }

  function interpretar(pergunta,{catalogo=[],contexto={}}={}){
    const texto=normalizar(pergunta),servicos=extrairServicos(texto,contexto),periodos=extrairPeriodos(texto,catalogo),metricas=[],datas=[],turnos=[];
    for(const item of texto.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g))datas.push(item[0]);
    for(const item of texto.matchAll(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/g))datas.push(`${item[3]}-${item[2]}-${item[1]}`);
    ["diurno","noturno","matutino","vespertino"].forEach(turno=>{if(texto.includes(turno))turnos.push(turno);});
    if(/valor|financeir|gasto|custo/.test(texto))metricas.push("valor_total");
    if(/percentual|porcent|execucao|desempenho/.test(texto))metricas.push("percentual_execucao");
    if(/velocidade/.test(texto))metricas.push("velocidade_media");
    if(/registro|operac/.test(texto))metricas.push("registros");
    if(/peso|tonelada/.test(texto))metricas.push("peso_total");
    if(/viage/.test(texto))metricas.push("viagens_total");
    if(/\bkm\b|quilometr/.test(texto))metricas.push("km_total");
    if(/equipe/.test(texto))metricas.push("equipes");
    if(/acumulado|executado|producao/.test(texto))metricas.push("acumulado");
    if(/previsto|previsao/.test(texto))metricas.push("previsto");
    if(/\bdias?\b/.test(texto))metricas.push("dias_acumulados");
    let intencao="pergunta_livre";
    if(/diretoria/.test(texto))intencao="resumo_diretoria";
    else if(/resumo|visao geral/.test(texto)||(/todos os meses/.test(texto)&&!servicos.length))intencao="resumo_geral";
    else if(/erro|rejei/.test(texto))intencao="erros";
    else if(/qualidade|incomplet|diverg/.test(texto))intencao="qualidade_dados";
    else if(/anomalia|fora do padrao/.test(texto))intencao="anomalias";
    else if(/importac/.test(texto))intencao="importacoes";
    else if(/turno/.test(texto))intencao="ranking_turnos";
    else if(/\bra\b|regiao administrativa/.test(texto))intencao="ranking_ra";
    else if(/velocidade/.test(texto))intencao="consultar_velocidade";
    else if(/equipe/.test(texto)&&!servicos.length)intencao="consultar_equipes";
    else if(/\b\d{4}-\d{2}-\d{2}\b|\b\d{2}\/\d{2}\/\d{4}\b/.test(texto))intencao="consultar_dia";
    else if(/evolucao|evoluiu|ao longo/.test(texto))intencao="evolucao_mensal";
    else if(/compare|comparacao|mudou|versus|\bvs\b/.test(texto)||periodos.length>1)intencao="comparar_periodos";
    else if(/^(e\s+)?o melhor\b/.test(texto)&&contexto.ultimoServico)intencao="melhor_periodo";
    else if(/^(e\s+)?o pior\b/.test(texto)&&contexto.ultimoServico)intencao="pior_periodo";
    else if(/melhor.*mes|melhor periodo/.test(texto))intencao="melhor_periodo";
    else if(/pior.*mes|pior periodo/.test(texto))intencao="pior_periodo";
    else if(/ranking financeiro|servico.*maior valor|maior valor.*servico/.test(texto))intencao="ranking_financeiro";
    else if(/ranking|maior valor|melhor|pior|segundo|atencao/.test(texto))intencao="ranking_servicos";
    else if(servicos.includes("P12"))intencao="consultar_p12";
    else if(servicos.length)intencao="consultar_servico";
    else if(/valor|financeir|gasto/.test(texto))intencao="consultar_valor";
    else if(/tendencia|queda|crescimento/.test(texto))intencao="tendencia";
    if(!INTENCOES_PERMITIDAS.has(intencao))intencao="pergunta_livre";
    const agrupamento=intencao==="ranking_ra"?"ra":intencao==="ranking_turnos"?"turno":"mes",anos=[...new Set(periodos.map(item=>item.ano))],meses=[...new Set(periodos.map(item=>item.mes))];
    return{intencao,servicos,periodos,anos,meses,ras:[],datas,turnos,metricas:metricas.length?metricas:["acumulado","percentual_execucao","valor_total"],agrupamento,textoOriginal:String(pergunta||"")};
  }
  function estruturar(pergunta,{catalogo=[],contexto={}}={}){
    const base=interpretar(pergunta,{catalogo,contexto}),texto=normalizar(pergunta),followup=/^(e\b|e em\b|e agosto\b|agora\b|nesse caso\b)/.test(texto),anterior=contexto.domain?contexto:{};
    let domain=followup&&anterior.domain?anterior.domain:global.CCOAnalyticsDomains.infer(texto,base.servicos);if(/pior servico/.test(texto))domain="EXECUCAO";
    const metric=global.CCOAnalyticsDomains.metric(domain,texto,followup?anterior.metrics?.[0]:null);
    let periods=base.periodos.map(p=>({year:Number(p.ano),month:Number(p.mes)}));
    if(!periods.length&&followup)periods=(anterior.periods||[]).map(p=>({...p}));
    if(followup&&/\be\s+(?:janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/.test(texto))periods=[...(anterior.periods||[]),...periods].filter((p,i,a)=>a.findIndex(x=>x.year===p.year&&x.month===p.month)===i);
    const explicitYear=/\b20\d{2}\b/.test(texto);if(followup&&explicitYear&&periods.length)periods=periods;
    let intent=base.intencao;if(domain==="SINISTROS"||domain==="INTERRUPCOES"){if(/compar|versus|\bvs\b/.test(texto))intent="comparar_periodos";else if(/ranking|qual .*mais|principa/.test(texto))intent="ranking";else intent=/resumo|analise|diretoria/.test(texto)?"analisar_periodo":"consultar_total";}
    if(/pior servico/.test(texto)&&!/(percent|execu|valor|ocorr|veloc|km|peso|viage)/.test(texto))intent="metrica_ambigua";
    else if(domain==="EXECUCAO"&&/qual servico.*(?:maior|menor)|(?:maior|menor).*servico/.test(texto))intent="ranking_servicos";
    else if(/compar|versus|\bvs\b/.test(texto))intent="comparar_periodos";
    if(/some.*percent/.test(texto))intent="operacao_invalida";
    const ui=global.CCOAIChat?.contexto||{},filters={services:base.servicos.length?base.servicos:[...(anterior.filters?.services||[])]||[],ras:base.ras.length?base.ras:[...(anterior.filters?.ras||[])],shifts:base.turnos.length?base.turnos:[...(anterior.filters?.shifts||[])]};if(!filters.services.length&&ui.servico)filters.services=[ui.servico];if(!filters.ras.length&&ui.ra)filters.ras=[ui.ra];if(!filters.shifts.length&&ui.turno)filters.shifts=[ui.turno];if(!periods.length&&ui.ano&&ui.mes)periods=[{year:Number(ui.ano),month:Number(ui.mes)}];
    return{question:String(pergunta||""),intent,domain,metrics:[metric],periods,filters,grouping:base.agrupamento,dates:base.datas,followup};
  }
  global.CCOAnalyticsIntencoes=Object.freeze({INTENCOES_PERMITIDAS,SINONIMOS_SERVICOS,normalizar,interpretar,estruturar});
})(window);
