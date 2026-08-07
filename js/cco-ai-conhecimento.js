(function criarConhecimentoCCO(global){
  "use strict";
  const SERVICOS=Object.freeze({
    P1:{nome:"Coleta orgânica",unidade:"operacional"},
    "P2.1":{nome:"Coleta seletiva",unidade:"viagens"},
    "P2.2":{nome:"Rejeito IRR",unidade:"viagens"},
    P3:{nome:"Remoção manual",unidade:"equipes"},
    P4:{nome:"Remoção mecanizada",unidade:"operacional"},
    P5:{nome:"Varrição manual",unidade:"km",indicadores:["km_total","peso_t","viagens","produtividade"]},
    P6:{nome:"Varrição mecanizada",unidade:"km"},
    P7:{nome:"Serviço P7",unidade:"equipes"},P8:{nome:"Serviço P8",unidade:"equipes"},
    P9:{nome:"Catação em Área Verde",unidade:"equipes"},P10:{nome:"Serviço P10",unidade:"equipes"},
    P11:{nome:"Serviço P11",unidade:"equipes"},P12:{nome:"Serviço P12",unidade:"regra oficial CCOMetricas"}
  });
  const obterServico=codigo=>{const normalizado=global.CCOMetricas?.normalizarServico?.(codigo)||String(codigo||"").toUpperCase();const base=SERVICOS[normalizado];if(!base)return null;const previsto=global.CCOMetricas?.obterPrevistoEquipeServico?.(normalizado);return Object.freeze({codigo:normalizado,...base,previstoEquipe:previsto??null});};
  const SYSTEM_PROMPT="Você é a CCO Analytics AI, analista especialista em serviços de limpeza urbana. Interprete exclusivamente dados oficiais estruturados do CCO. Nunca invente números; diferencie previsto, acumulado, percentual, unidade operacional e valor financeiro. Quando os dados forem insuficientes, declare a limitação. Use linguagem profissional para analistas, gestores e diretoria.";
  global.CCOAIConhecimento=Object.freeze({SERVICOS,obterServico,SYSTEM_PROMPT,servicosValidos:Object.freeze(Object.keys(SERVICOS))});
})(window);
