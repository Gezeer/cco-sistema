(function configurarKmTotalP1CCO(global) {
  "use strict";

  function normalizarCabecalhoCCO(valor) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase()
      .replace(/[\s./\\-]+/g, "_")
      .replace(/[^A-Z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  function numeroPlanilhaCCO(valor) {
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
    if (valor === null || valor === undefined || valor === "") return null;
    let texto = String(valor).trim().replace(/\s+/g, "");
    if (!texto) return null;
    if (texto.includes(",") && texto.includes(".")) texto = texto.replace(/\./g, "").replace(",", ".");
    else if (texto.includes(",")) texto = texto.replace(",", ".");
    texto = texto.replace(/[^0-9.-]/g, "");
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
  }

  function numeroSeguroCCO(valor) {
    if (global.numeroSeguroCCO) return global.numeroSeguroCCO(valor);
    if (valor === null || valor === undefined || String(valor).trim() === "") return 0;
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
    let texto = String(valor).trim().replace(/\s/g, "");
    if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");
    const numero = Number(texto.replace(/[^0-9+\-.]/g, ""));
    return Number.isFinite(numero) ? numero : 0;
  }

  function obterKmTotalP1CCO(linha) {
    const valorNormalizado = Number(linha?.km_total);
    if (Number.isFinite(valorNormalizado)) return valorNormalizado;
    console.warn("[P1 KM TOTAL] coluna literal Km_Total não encontrada");
    return 0;
  }

  function intervaloMesCCO(ano,mes) {
    const a=Number(ano),m=Number(mes);
    if(!a||m<1||m>12)return{inicio:null,fim:null};
    return{inicio:`${a}-${String(m).padStart(2,"0")}-01`,fim:m===12?`${a+1}-01-01`:`${a}-${String(m+1).padStart(2,"0")}-01`};
  }

  function filtrarRegistrosP1PeriodoCCO(registros,{ano,mes,importacaoId}={}) {
    const{inicio,fim}=intervaloMesCCO(ano,mes);
    return(registros||[]).filter(item=>{
      if(String(item?.servico||"P1").trim().toUpperCase()!=="P1")return false;
      if(importacaoId&&String(item?.importacao_id||"")!==String(importacaoId))return false;
      const data=String(item?.data_operacao||item?.data_normalizada||item?.data||"").slice(0,10);
      if(inicio&&fim&&(!data||data<inicio||data>=fim))return false;
      return Boolean(importacaoId||(inicio&&fim));
    });
  }

  function somarKmTotalP1PeriodoCCO(registros,periodo={},obterValor=obterKmTotalP1CCO) {
    const considerados=filtrarRegistrosP1PeriodoCCO(registros,periodo);
    const somaKmTotal=considerados.reduce((soma,item)=>{
      const valor=obterValor(item),numero=typeof valor==="object"?valor?.valor:valor;
      return soma+(Number.isFinite(Number(numero))?Number(numero):0);
    },0);
    console.log("[P1 KM TOTAL][PERÍODO]",{ano:Number(periodo.ano)||null,mes:Number(periodo.mes)||null,importacaoId:periodo.importacaoId||null,registrosConsiderados:considerados.length,somaKmTotal});
    return{somaKmTotal,registrosConsiderados:considerados.length,registros:considerados};
  }

  function ehKmTotalP1Correto(chave) {
    return String(chave ?? "").trim() === "Km_Total";
  }

  function obterKmTotalP1DoRawCCO(linha) {
    const original = linha?.dados_originais || {};
    if (Object.prototype.hasOwnProperty.call(original, "Km_Total")) {
      return { valor:numeroPlanilhaCCO(original.Km_Total),campo:"Km_Total",chaveUnica:linha?.dados?.chave_origem_km_total||null,fonte:"dados_originais",valorOriginal:original.Km_Total };
    }
    const dados = linha?.dados || {};
    const chaveUnica=String(dados.chave_origem_km_total||"");
    if(dados.cabecalho_origem_km_total==="Km_Total"&&chaveUnica&&Object.prototype.hasOwnProperty.call(dados,chaveUnica)){
      return { valor:numeroPlanilhaCCO(dados[chaveUnica]),campo:chaveUnica,chaveUnica,fonte:"dados",valorOriginal:dados[chaveUnica] };
    }
    console.warn("[P1 KM TOTAL] coluna literal Km_Total não encontrada");
    return { valor:null,campo:null,campoNormalizado:null,fonte:null,valorOriginal:null };
  }

  function diagnosticarCamposKmP1(linha) {
    const encontrados = [];
    for (const fonte of [{ nome:"dados_originais", objeto:linha?.dados_originais },{ nome:"dados", objeto:linha?.dados }]) {
      for (const [chave, valor] of Object.entries(fonte.objeto || {})) {
        const normalizada = normalizarCabecalhoCCO(chave);
        if (normalizada.includes("KM") || normalizada.includes("QUILOMETR")) encontrados.push({ fonte:fonte.nome,chaveOriginal:chave,chaveNormalizada:normalizada,valor,tipo:typeof valor });
      }
    }
    return encontrados;
  }

  function normalizarAbaP1CCO(valor) {
    return String(valor || "").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9.]/g, "");
  }

  async function carregarRawP1CCO(importacaoId,{ano,mes}={}) {
    const{inicio,fim}=intervaloMesCCO(ano,mes);
    if(!importacaoId&&(!inicio||!fim))throw new Error("importacao_id ou período válido é obrigatório para consultar o RAW do P1.");
    const banco = global.supabaseClient;
    if (!banco) throw new Error("Supabase indisponível.");
    const linhas = [];
    for (let inicio = 0; ; inicio += 1000) {
      let consulta=banco.from("planilha_linhas").select("chave_linha,importacao_id,aba,servico,data_operacao,dados,dados_originais");
      if(importacaoId)consulta=consulta.eq("importacao_id",importacaoId);
      if(ano&&mes)consulta=consulta.gte("data_operacao",intervaloMesCCO(ano,mes).inicio).lt("data_operacao",intervaloMesCCO(ano,mes).fim);
      const { data, error } = await consulta.range(inicio, inicio + 999);
      if (error) throw error;
      const lote = data || [];
      linhas.push(...lote);
      if (lote.length < 1000) break;
    }
    return linhas.filter(item => normalizarAbaP1CCO(item.aba) === "P1");
  }

  function auditarCamposKmP1CCO(linhas) {
    const encontrados = new Set();
    const ignorados = new Set();
    for (const linha of linhas || []) {
      for (const fonte of [linha, linha?.dados, linha?.dados_originais].filter(Boolean)) {
        for (const chave of Object.keys(fonte)) {
          const normalizada = normalizarCabecalhoCCO(chave);
          if (normalizada === "KM_TOTAL") encontrados.add(chave);
          else if (/KM|QUILOMETR|DISTANC|ODOMETR/.test(normalizada)) ignorados.add(chave);
        }
      }
    }
    return { camposEncontrados: [...encontrados], camposIgnorados: [...ignorados] };
  }

  global.normalizarCabecalhoCCO = normalizarCabecalhoCCO;
  global.obterKmTotalP1CCO = obterKmTotalP1CCO;
  global.filtrarRegistrosP1PeriodoCCO = filtrarRegistrosP1PeriodoCCO;
  global.somarKmTotalP1PeriodoCCO = somarKmTotalP1PeriodoCCO;
  global.obterKmTotalP1DoRawCCO = obterKmTotalP1DoRawCCO;
  global.ehKmTotalP1Correto = ehKmTotalP1Correto;
  global.numeroPlanilhaCCO = numeroPlanilhaCCO;
  global.diagnosticarCamposKmP1 = diagnosticarCamposKmP1;
  global.normalizarAbaP1CCO = normalizarAbaP1CCO;
  global.carregarRawP1CCO = carregarRawP1CCO;
  global.auditarCamposKmP1CCO = auditarCamposKmP1CCO;
  global.CCO_P1_KM_TOTAL = Object.freeze({
    normalizarCabecalhoCCO,
    obterKmTotalP1CCO,
    filtrarRegistrosP1PeriodoCCO,
    somarKmTotalP1PeriodoCCO,
    obterKmTotalP1DoRawCCO,
    ehKmTotalP1Correto,
    numeroPlanilhaCCO,
    diagnosticarCamposKmP1,
    normalizarAbaP1CCO,
    carregarRawP1CCO,
    auditarCamposKmP1CCO
  });
})(window);
