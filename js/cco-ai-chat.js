(function criarChatCCOAI(global){
  "use strict";
  const contexto=global.CCOAIContext=global.CCOAIContext||{servico:"",ano:null,mes:null,dia:null,ra:"",turno:"",importacaoId:null,pergunta:""};
  const historico=[];
  function atualizar(parcial={}){Object.assign(contexto,parcial);return contexto;}
  function registrar(papel,conteudo){historico.push({papel,conteudo,criadoEm:Date.now()});return historico.at(-1);}
  function limpar(){historico.length=0;Object.assign(contexto,{pergunta:"",dia:null});}
  function contextoParaPergunta(pergunta){contexto.pergunta=String(pergunta||"");return{...contexto};}
  global.CCOAIChat=Object.freeze({contexto,historico,atualizar,registrar,limpar,contextoParaPergunta});
})(window);
