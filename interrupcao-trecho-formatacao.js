(function(global){"use strict";
 function formatarDataBR(valor,vazio="—"){
  const texto=String(valor??"").trim();
  if(!texto)return vazio;
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(texto))return texto;
  const correspondencia=texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  return correspondencia?`${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`:texto;
 }
 global.InterrupcaoFormatacao=Object.freeze({formatarDataBR});global.formatarDataBR=formatarDataBR;
 if(typeof module!=="undefined")module.exports=global.InterrupcaoFormatacao;
})(typeof window!=="undefined"?window:globalThis);
