(function criarAuditoriaKm(global){
  "use strict";
  const SERVICOS=Object.freeze(["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"]);
  const contemKm=valor=>/(?:KM|QUILOMETRAGEM|DIST[ÂA]NCIA|TOTAL\s+PAGAMENTO)/i.test(String(valor||""));
  const normalizarServico=valor=>{const texto=String(valor||"").trim().toUpperCase(),match=texto.match(/\bP(?:1[0-2]|[1-9])(?:\.[12])?\b/);return match?.[0]||texto;};
  async function paginar(criarConsulta,tamanho=1000){const resultado=[];for(let inicio=0;;inicio+=tamanho){const{data,error}=await criarConsulta().range(inicio,inicio+tamanho-1);if(error)throw error;const lote=data||[];resultado.push(...lote);if(lote.length<tamanho)return resultado;}}
  async function auditarKmMatrizRaw({importacaoId}={}){
    const cliente=global.supabaseClient,id=importacaoId||global.__CCO_IMPORTACAO_ATIVA__?.importacao_id||global.__CCO_IMPORTACAO_ATIVA__?.id||global.CCO_PERIODOS?.periodoAtual?.importacaoId;
    if(!cliente)throw new Error("window.supabaseClient indisponível.");if(!id)throw new Error("importacaoId selecionado não encontrado.");
    const[cabecalhos,linhas]=await Promise.all([
      paginar(()=>cliente.from("cabecalhos_planilha").select("importacao_id,aba,ordem,cabecalho_original,cabecalho_normalizado").eq("importacao_id",id).order("aba").order("ordem")),
      paginar(()=>cliente.from("planilha_linhas").select("id,importacao_id,aba,servico,numero_linha,dados,dados_originais").eq("importacao_id",id).order("id"))
    ]);
    const resultado=[];
    for(const servico of SERVICOS){
      const linhasServico=linhas.filter(item=>normalizarServico(item.servico||item.aba)===servico),abas=[...new Set(linhasServico.map(item=>item.aba).filter(Boolean))];
      const cabecalhosServico=cabecalhos.filter(item=>abas.includes(item.aba)&&contemKm(item.cabecalho_original));
      const literais=new Set(cabecalhosServico.map(item=>item.cabecalho_original));
      const normalizadas=new Set(cabecalhosServico.map(item=>item.cabecalho_normalizado));
      for(const linha of linhasServico){for(const chave of Object.keys(linha.dados_originais||{}))if(contemKm(chave))literais.add(chave);for(const chave of Object.keys(linha.dados||{}))if(contemKm(chave))normalizadas.add(chave);}
      resultado.push({servico,aba:abas,cabecalhosLiterais:[...literais],chavesNormalizadas:[...normalizadas],exemplos:linhasServico.slice(0,5).map(item=>({id:item.id,numero_linha:item.numero_linha,aba:item.aba,servico:item.servico,valoresLiterais:Object.fromEntries(Object.entries(item.dados_originais||{}).filter(([chave])=>contemKm(chave))),valoresNormalizados:Object.fromEntries(Object.entries(item.dados||{}).filter(([chave])=>contemKm(chave)))}))});
    }
    console.log("[KM MATRIZ]",{importacaoId:id,linhasRaw:linhas.length,matriz:resultado});console.table(resultado.map(item=>({servico:item.servico,aba:item.aba.join(" | "),cabecalhosLiterais:item.cabecalhosLiterais.join(" | "),chavesNormalizadas:item.chavesNormalizadas.join(" | "),exemplos:item.exemplos.length})));
    return resultado;
  }
  global.auditarKmMatrizRaw=auditarKmMatrizRaw;
})(window);
