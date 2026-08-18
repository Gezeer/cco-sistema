(function(global){
  "use strict";
  const fmt=(v,d=1)=>Number(v).toLocaleString("pt-BR",{maximumFractionDigits:d}),periods=e=>e.periods.map(p=>p.month?`${String(p.month).padStart(2,"0")}/${p.year}`:String(p.year)).join(" × ")||"período disponível";
  function compose(e,level="simple"){
    const v=e.values,metric=e.metrics[0],domain=e.domain;let text="";
    if(e.limitations.length&&!Object.keys(v).length)text=e.limitations.join(" ");
    else if(["INTERRUPCOES","SINISTROS"].includes(domain)){
      const label=domain==="SINISTROS"?"sinistros":"ocorrências";text=`Em ${periods(e)}, foram registrados ${fmt(v.total,0)} ${label}.`;
      if(v.ranking?.[0])text+=` A maior concentração foi em ${v.ranking[0].name}, com ${fmt(v.ranking[0].value,0)}.`;
      if(v.tempoMedioResposta!=null)text+=` O tempo médio de resposta válido foi ${fmt(v.tempoMedioResposta)} minutos.`;
      if(v.socorros!=null)text+=` Foram identificados ${fmt(v.socorros,0)} socorros, dos quais ${fmt(v.socorrosConcluidos,0)} foram concluídos (${fmt(v.percentualConcluido)}%).`;
    }else if(v.ranking?.length){const first=v.ranking[0];text=`O primeiro colocado foi ${first.name}, com ${fmt(first.value)} em ${metric.replaceAll("_"," ")}.`;if(metric==="percentual_execucao")text+=` O percentual foi recalculado por serviço a partir de acumulado e previsto, sem soma de percentuais.`;}
    else if(v.series?.length){const last=v.series.at(-1),value=last[metric];text=`Em ${last.period}, ${metric.replaceAll("_"," ")} foi ${fmt(value)}.`;if(metric==="percentual_execucao")text+=` O percentual foi recalculado como acumulado (${fmt(last.acumulado)}) ÷ previsto (${fmt(last.previsto)}), sem soma de percentuais.`;}
    else text="Não encontrei dados suficientes para responder com segurança.";
    if(e.limitations.length&&Object.keys(v).length)text+=` Limitação: ${e.limitations.join(" ")}`;
    if(level!=="simple"&&e.insights.length){text+=`\n\nACHADOS PRINCIPAIS\n${e.insights.map(i=>i.type==="CONCENTRACAO"?`FATO — concentração de ${fmt(i.value)}% no primeiro colocado.`:`TENDÊNCIA — variação de ${fmt(i.comparison)}% entre os dois últimos períodos comparáveis.`).join("\n")}`;text+="\n\nCONCLUSÃO\nOs resultados acima são fatos e tendências calculados; não foi inferida causalidade.";}
    return{text,domain,evidenceId:e.evidenceId,chartDataset:e.chartDataset,level};
  }
  global.CCOAnalyticsResponse=Object.freeze({compose});
})(window);
