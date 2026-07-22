(function () {
  "use strict";
  const core = () => window.CCOMetricas;
  const texto = valor => String(valor ?? "").trim();
  function normalizarNumero(valor) {
    if (core()) return core().normalizarNumero(valor);
    if (valor === null || valor === undefined || valor === "") return 0;
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
    let t = String(valor).trim().replace(/\s/g, "").replace(/R\$/gi, "").replace(/%/g, "");
    if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
    else if (t.includes(",")) t = t.replace(",", ".");
    const numero = Number(t);
    return Number.isFinite(numero) ? numero : 0;
  }
  function normalizarServico(valor) { return core() ? core().normalizarServico(valor) : texto(valor).toUpperCase(); }
  function soma(registros, campo) { return registros.reduce((total, item) => total + normalizarNumero(item[campo]), 0); }
  function media(valores) { const validos = valores.filter(Number.isFinite); return validos.length ? validos.reduce((a,b)=>a+b,0) / validos.length : 0; }
  function mediana(valores) { const lista = valores.filter(Number.isFinite).sort((a,b)=>a-b); if (!lista.length) return 0; const meio=Math.floor(lista.length/2); return lista.length%2?lista[meio]:(lista[meio-1]+lista[meio])/2; }
  function desvioPadrao(valores) { const validos=valores.filter(Number.isFinite); if(!validos.length)return 0; const m=media(validos); return Math.sqrt(validos.reduce((s,v)=>s+(v-m)**2,0)/validos.length); }
  function calcularVelocidadeMedia(registros) { return media(registros.map(x=>normalizarNumero(x.velocidade_media)).filter(v=>v>0)); }
  function agrupar(registros, campo) { const mapa=new Map(); registros.forEach(item=>{const chave=texto(typeof campo==="function"?campo(item):item[campo])||"Não informado";if(!mapa.has(chave))mapa.set(chave,[]);mapa.get(chave).push(item);});return mapa; }
  function calcularAcumuladoPadrao(servico, registros) {
    const s=normalizarServico(servico);
    if(["P5","P6"].includes(s))return soma(registros,"km_total");
    if(["P2.1","P2.2"].includes(s))return soma(registros,"viagens");
    if(["P3","P7","P8","P9","P10","P11"].includes(s))return soma(registros,"equipe")||soma(registros,"executado");
    return soma(registros,"peso_t")||soma(registros,"executado")||soma(registros,"viagens")||soma(registros,"km_total");
  }
  function calcularAcumuladoServico(servico, registros) { return core() ? core().calcularAcumuladoServico(servico,registros) : (normalizarServico(servico)==="P12" ? soma(registros,"executado") : calcularAcumuladoPadrao(servico,registros)); }
  function calcularExecutadoTotal(registros) { return [...agrupar(registros,"servico")].reduce((total,[servico,linhas])=>total+calcularAcumuladoServico(servico,linhas),0); }
  function calcularProdutividade(registros) { const equipes=core()?core().calcularQuantidadeEquipesMensal(registros):soma(registros,"equipe"); if(equipes<=0)return{valor:null,metrica:"Sem quantidade de equipe",equipes:0};const servico=normalizarServico(registros[0]?.servico),acumulado=calcularAcumuladoServico(servico,registros);return{valor:acumulado/equipes,metrica:"Executado/equipe",equipes}; }
  function obterPrevisto(servico, contexto={}) { const chave=normalizarServico(servico); return normalizarNumero(contexto.metas?.[chave]?.previsto ?? contexto.metas?.[chave] ?? 0); }
  function cumprimento(executado,previsto){return core()?core().calcularPercentualCumprimento({acumuladoReal:executado,previstoAcumulado:previsto}):(previsto>0?executado/previsto*100:null);}
  function ranking(registros,campo){return [...agrupar(registros,campo)].map(([nome,linhas])=>({nome,velocidade:calcularVelocidadeMedia(linhas),executado:calcularExecutadoTotal(linhas),produtividade:calcularProdutividade(linhas).valor,registros:linhas.length})).sort((a,b)=>(b.velocidade||b.produtividade||b.executado)-(a.velocidade||a.produtividade||a.executado));}
  function evolucaoDiaria(registros){return [...agrupar(registros,"data_operacao")].sort((a,b)=>a[0].localeCompare(b[0])).map(([data,linhas])=>({data,velocidade:calcularVelocidadeMedia(linhas),executado:calcularExecutadoTotal(linhas)}));}
  function detectarValoresForaPadrao(registros){const dias=evolucaoDiaria(registros).filter(x=>x.velocidade>0),valores=dias.map(x=>x.velocidade),m=media(valores),d=desvioPadrao(valores);if(dias.length<3||d===0)return[];return dias.filter(x=>x.velocidade<m-2*d||x.velocidade>m+2*d).map(x=>({...x,tipo:x.velocidade<m?"abaixo":"acima"}));}
  function variacao(atual,anterior){return anterior>0?(atual-anterior)/anterior*100:null;}
  function comparar(registros,anteriores,contexto={}){const atualExec=calcularExecutadoTotal(registros),antExec=calcularExecutadoTotal(anteriores),atualProd=calcularProdutividade(registros).valor,antProd=calcularProdutividade(anteriores).valor,previsto=Object.keys(contexto.metas||{}).reduce((s,k)=>s+obterPrevisto(k,contexto),0),previstoAnt=Object.keys(contexto.metasAnteriores||{}).reduce((s,k)=>s+normalizarNumero(contexto.metasAnteriores[k]?.previsto??contexto.metasAnteriores[k]),0);return{velocidade:variacao(calcularVelocidadeMedia(registros),calcularVelocidadeMedia(anteriores)),executado:variacao(atualExec,antExec),produtividade:variacao(atualProd,antProd),percentual:variacao(cumprimento(atualExec,previsto),cumprimento(antExec,previstoAnt))};}
  function projetarFechamento(registros,ano,mes){if(!registros.length)return null;const executado=calcularExecutadoTotal(registros),hoje=new Date(),fechado=ano<hoje.getFullYear()||(ano===hoje.getFullYear()&&mes<hoje.getMonth()+1);if(fechado)return{valor:executado,real:true,dias:new Set(registros.map(x=>x.data_operacao)).size};const dias=new Set(registros.map(x=>x.data_operacao).filter(Boolean)).size,totalDias=window.CCO_REGRAS.obterDiasOperacao(ano,mes);return dias&&totalDias?{valor:executado/dias*totalDias,real:false,dias,totalDias}:null;}
  function extrairServicosDaPergunta(pergunta){const achados=String(pergunta||"").toUpperCase().match(/\bP\s?(?:1[0-2]|[1-9])(?:[.,][12])?\b/g)||[];return[...new Set(achados.map(x=>x.replace(/\s/g,"").replace(",",".")))];}
  function compararMultiplosServicos(servicos,registros,contexto={}){const anteriores=contexto.anteriores||[],ano=contexto.filtros?.ano,mes=contexto.filtros?.mes;return servicos.map(servico=>{const atual=registros.filter(x=>normalizarServico(x.servico)===servico),ant=anteriores.filter(x=>normalizarServico(x.servico)===servico),diasOperacao=window.CCO_REGRAS.obterDiasOperacao(ano,mes),previsto=window.CCO_REGRAS.calcularPrevisto(servico,ano,mes,obterPrevisto(servico,contexto),contexto.metas?.[servico]?.total_dias_mes),consolidado=core()?.consolidarServico({servico,registros:atual,previstoMensal:previsto,diasOperacaoMes:diasOperacao,valorUnitario:window.CCO_REGRAS.obterValorServico(servico)}),executado=consolidado?.acumuladoReal??calcularAcumuladoServico(servico,atual),previstoAcumulado=consolidado?.previstoAcumulado??previsto;return{servico,executado,previsto,previstoAcumulado,percentual:consolidado?.percentualCumprimento??cumprimento(executado,previstoAcumulado),equipes:consolidado?.quantidadeEquipes??0,diasExecutados:consolidado?.diasExecutados??0,diasOperacao,avisos:consolidado?.avisos||[],fonte:"operacoes + painel_executivo + regras compartilhadas",velocidade:calcularVelocidadeMedia(atual),produtividade:consolidado?.produtividade??calcularProdutividade(atual).valor,variacao:variacao(executado,calcularAcumuladoServico(servico,ant)),registros:atual.length};}).sort((a,b)=>(b.percentual||b.velocidade||b.executado)-(a.percentual||a.velocidade||a.executado)).map((x,i)=>({...x,ranking:i+1}));}
  window.CCOAnalyticsCalculations=Object.freeze({normalizarNumero,normalizarServico,soma,media,mediana,desvioPadrao,agrupar,calcularVelocidadeMedia,calcularAcumuladoPadrao,calcularAcumuladoServico,calcularExecutadoTotal,calcularProdutividade,obterPrevisto,cumprimento,ranking,evolucaoDiaria,detectarValoresForaPadrao,comparar,projetarFechamento,extrairServicosDaPergunta,compararMultiplosServicos});
})();
