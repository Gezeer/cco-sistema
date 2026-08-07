(function criarGraficosCCOAI(global){
  "use strict";
  const TIPOS=new Set(["bar","linha","comparativo","rosca","ranking","evolucao"]);
  function validar(spec){if(!spec||!TIPOS.has(spec.tipo)||!Array.isArray(spec.categorias))throw new Error("Especificação de gráfico inválida.");const series=spec.series||[{nome:spec.nome||"Resultado",dados:spec.dados||spec.valores||[]}];if(series.some(item=>!Array.isArray(item.dados)&&!Array.isArray(item.valores)))throw new Error("Série de gráfico inválida.");return{...spec,series:series.map(item=>({...item,dados:item.dados||item.valores}))};}
  function render(container,spec){const inicio=performance.now(),segura=validar(spec),tipo=segura.tipo==="evolucao"?"linha":segura.tipo==="comparativo"?"bar":segura.tipo;const config={tipo,titulo:segura.titulo,categorias:segura.categorias,series:segura.series.map(item=>({nome:item.nome,valores:item.dados})),nome:segura.series[0]?.nome,unidade:segura.unidade};const instancia=global.CCOAnalyticsGraficos.renderizar(container,config);if(global.CCO_DEBUG_ANALYTICS_AI===true)console.log("[CCO AI GRÁFICO]",{tipo,categorias:segura.categorias.length,series:segura.series.length,tempoMs:performance.now()-inicio});return instancia;}
  global.CCOAICharts=Object.freeze({render,validar,tipos:Object.freeze([...TIPOS])});
})(window);
