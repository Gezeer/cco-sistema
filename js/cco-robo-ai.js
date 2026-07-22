(function criarControladorRoboAI(global){
  "use strict";
  const estados=new Set(["idle","listening","thinking","answering","success","error"]);
  function setEstado(estado,mensagem=null){const robo=document.getElementById("ccoRoboAnalytics");if(!robo||!estados.has(estado))return;for(const item of estados)robo.classList.remove(`is-${item}`);robo.classList.add(`is-${estado}`);robo.dataset.estado=estado;if(mensagem){const texto=document.getElementById("ccoRoboMensagem");if(texto)texto.textContent=mensagem;}}
  global.CCO_ROBO_AI=Object.freeze({setEstado});
})(window);
