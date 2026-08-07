(function criarAnalistaCCO(global){
  "use strict";
  const numero=valor=>valor===null||valor===undefined||valor===""?null:(Number.isFinite(Number(valor))?Number(valor):null);
  const valoresValidos=(itens,campo)=>itens.map(item=>numero(typeof campo==="function"?campo(item):item?.[campo])).filter(valor=>valor!==null);
  const calcularTotal=(itens,campo)=>{const valores=valoresValidos(itens,campo);return valores.length?valores.reduce((a,b)=>a+b,0):null;};
  const calcularMedia=(itens,campo)=>{const valores=valoresValidos(itens,campo);return valores.length?valores.reduce((a,b)=>a+b,0)/valores.length:null;};
  const calcularMediana=(itens,campo)=>{const v=valoresValidos(itens,campo).sort((a,b)=>a-b);if(!v.length)return null;const m=Math.floor(v.length/2);return v.length%2?v[m]:(v[m-1]+v[m])/2;};
  const calcularPercentual=(atual,previsto)=>{const a=numero(atual),p=numero(previsto);return a===null||p===null||p===0?null:a/p*100;};
  const calcularVariacao=(atual,anterior)=>{const a=numero(atual),b=numero(anterior);return a===null||b===null||b===0?null:(a-b)/b*100;};
  function calcularRanking(itens,chave,valor){const mapa=new Map();for(const item of itens){const nome=String(item?.[chave]??"Não informado"),n=numero(item?.[valor]);if(n!==null)mapa.set(nome,(mapa.get(nome)||0)+n);}return[...mapa].map(([nome,total])=>({nome,valor:total})).sort((a,b)=>b.valor-a.valor);}
  function analisarServico({servico,registros=[],previsto=null,ano,mes,importacaoId}){if(!registros.length)return{status:"DADOS_INSUFICIENTES",mensagem:"Não encontrei dados suficientes para calcular esse indicador.",valor:null};const acumulado=global.CCOMetricas.calcularAcumuladoServico(servico,registros),percentual=calcularPercentual(acumulado,previsto);return{servico,ano,mes,importacaoId,registros:registros.length,previsto:numero(previsto),acumulado,percentual,confianca:previsto===null?"Média confiança":"Alta confiança",fonte:"operacoes + CCOMetricas"};}
  function compararPeriodos(atual,anterior){return{atual,anterior,variacao:calcularVariacao(atual?.acumulado,anterior?.acumulado),mesmaImportacao:Boolean(atual?.importacaoId&&atual.importacaoId===anterior?.importacaoId)};}
  function detectarAnomalias(registros=[]){const alertas=[];registros.forEach((item,indice)=>{for(const campo of["executado","peso_t","km_total","viagens","velocidade_media"]){const valor=numero(item?.[campo]);if(valor!==null&&valor<0)alertas.push({tipo:"VALOR_NEGATIVO",campo,indice,valor});}if(!item?.data_operacao)alertas.push({tipo:"CAMPO_AUSENTE",campo:"data_operacao",indice});if(!item?.servico)alertas.push({tipo:"CAMPO_AUSENTE",campo:"servico",indice});});return alertas;}
  function resumirPeriodo(itens=[]){return{registros:itens.length,totalExecutado:calcularTotal(itens,"executado"),peso:calcularTotal(itens,"peso_t"),km:calcularTotal(itens,"km_total"),viagens:calcularTotal(itens,"viagens"),velocidadeMedia:calcularMedia(itens,"velocidade_media")};}
  global.CCOAIAnalista=Object.freeze({numero,calcularTotal,calcularMedia,calcularMediana,calcularPercentual,calcularVariacao,calcularRanking,analisarServico,compararPeriodos,detectarAnomalias,resumirPeriodo,analisarTendencia:compararPeriodos});
  global.detectarAnomaliasCCO=detectarAnomalias;
})(window);
