(function criarFormatacaoAnalytics(global){
  "use strict";
  const MESES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const numero=valor=>{const n=Number(valor);return Number.isFinite(n)?n:0;};
  const formatarNumero=(valor,casas=2)=>numero(valor).toLocaleString("pt-BR",{maximumFractionDigits:casas});
  const formatarInteiro=valor=>Math.round(numero(valor)).toLocaleString("pt-BR");
  const formatarMoeda=valor=>numero(valor).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const formatarPercentual=valor=>`${formatarNumero(valor,1)}%`;
  const formatarPeriodo=(ano,mes)=>`${MESES[numero(mes)-1]||String(mes).padStart(2,"0")}/${ano}`;
  const chavePeriodo=(ano,mes)=>`${Number(ano)}-${String(Number(mes)).padStart(2,"0")}`;
  const escapar=valor=>String(valor??"").replace(/[&<>'"]/g,caractere=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[caractere]));
  const tabelaHTML=tabela=>{if(!tabela?.linhas?.length)return"";return`<details class="cco-ai-details"><summary>Ver dados detalhados (${tabela.linhas.length})</summary><div class="cco-ai-table"><table><thead><tr>${tabela.colunas.map(item=>`<th>${escapar(item)}</th>`).join("")}</tr></thead><tbody>${tabela.linhas.slice(0,50).map(linha=>`<tr>${linha.map(item=>`<td>${escapar(item)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;};
  global.CCOAnalyticsFormatacao=Object.freeze({MESES,numero,formatarNumero,formatarInteiro,formatarMoeda,formatarPercentual,formatarPeriodo,chavePeriodo,escapar,tabelaHTML});
})(window);
