/* CCO | Importador principal único: RAW + operacional + auditoria. */
(function iniciarImportadorPrincipalCCO() {
  "use strict";

  const BUILD = "20260730-importador-cabecalhos-duplicados-v1";
  const TAMANHO_MAXIMO_LOTE = 2.5 * 1024 * 1024;
  const TAMANHO_LOTE_RAW = 200;
  const TAMANHO_LOTE_OPERACOES = 200;
  const TAMANHO_LOTE_ERROS = 200;
  const TAMANHO_LOTE_PADRAO = 200;
  const PERIODOS_ALVO = new Set(Array.isArray(window.CCO_PERIODOS_ALVO_IMPORTACAO)?window.CCO_PERIODOS_ALVO_IMPORTACAO:["2026-06","2026-07"]);
  const SERVICOS = new Set(["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"]);
  const ALIASES = Object.freeze({
    rd:["rd","registro_diario","registro","numero_rd","n_rd"],
    servico:["servico","servico_p","codigo_servico","programa"],
    tipo_servico:["tipo_servico","descricao_servico","atividade"],
    data_operacao:["data_operacao","data","data_analise","dia"],
    hora:["hora","horario","hora_inicio"], turno:["turno","periodo"],
    ra:["ra","regiao_administrativa","regiao"], setor:["setor"], circuito:["circuito"],
    veiculo:["veiculo","placa","prefixo"], equipe:["equipe"], qtd_equipe:["qtd_equipe","quantidade_equipe","quantidade_de_equipes"],
    peso_t:["peso_t","peso","toneladas","peso_total"], viagens:["viagens","qtd_viagens","quantidade_viagens"],
    km_total:["km_total","km_executado","km","quilometragem","quilometragem_total"],
    executado:["executado","km_executado","executado_total","quantidade_executada","qtd_executado","qtd_executada","execucao"],
    velocidade_media:["velocidade_media","velocidade","media_velocidade"],
    tempo_produtivo_minutos:["tempo_produtivo_minutos","tempo_produtivo","horas_produtivas"],
    tempo_total_minutos:["tempo_total_minutos","tempo_total"], tempo_parada_minutos:["tempo_parada_minutos","tempo_parada"],
    km_produtivo:["km_produtivo"], km_improdutivo:["km_improdutivo"], valor_abastecido:["valor_abastecido","abastecimento"]
  });
  const SERVICOS_KM_TOTAL_LITERAL = ["P1","P2.1","P2.2","P3","P4","P7","P8","P10","P11","P12"];
  const CAMPOS_PLANILHA_CCO = Object.freeze({
    ...Object.fromEntries(SERVICOS_KM_TOTAL_LITERAL.map(servico => [servico,Object.freeze({
      km_total:Object.freeze({literal:"Km_Total",fallbackNormalizado:"km_total_2"})
    })])),
    P5:Object.freeze({
      km_executado:Object.freeze({literal:"Km Executado",percentualLiteral:"Km Executado (%)"})
    }),
    P6:Object.freeze({
      total_pagamento_km:Object.freeze({literal:"Total Pagamento - KM",percentualLiteral:"Total Pagamento - KM (%)"})
    })
  });

  const banco = () => window.supabaseClient || null;
  const texto = valor => String(valor ?? "").trim();
  const vazio = valor => valor === null || valor === undefined || texto(valor) === "";
  const bytes = valor => new Blob([JSON.stringify(valor)]).size;
  const jsonSeguro = valor => JSON.parse(JSON.stringify(valor, (_chave, item) => item instanceof Date ? item.toISOString() : (typeof item === "number" && !Number.isFinite(item) ? null : item)));
  const MESES = Object.freeze({janeiro:1,fevereiro:2,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12});

  function normalizarCabecalho(valor) {
    return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r?\n|\r/g, " ").trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function normalizarServico(valor) {
    const v = texto(valor).toUpperCase().replace(/\s+/g, "")
      .replace(/^PROGRAMA[-_]?/, "P").replace(/^P[-_]?/, "P")
      .replace(/^P(\d+)[,_-](\d+)$/, "P$1.$2");
    const achado = v.match(/^P(0*(?:1[0-2]|[1-9]))(?:[.]?([12]))?$/);
    return achado ? `P${Number(achado[1])}${achado[2] ? `.${Number(achado[2])}` : ""}` : v;
  }

  function normalizarNumero(valor) {
    if (vazio(valor)) return null;
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
    let v = texto(valor).replace(/R\$/gi, "").replace(/%/g, "").replace(/\s/g, "");
    const negativo = /^\(.*\)$/.test(v); v = v.replace(/[()]/g, "");
    if (v.includes(",")) v = v.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(v)) v = v.replace(/\./g, "");
    const numero = Number(v.replace(/[^0-9+\-.]/g, ""));
    return Number.isFinite(numero) ? (negativo ? -Math.abs(numero) : numero) : null;
  }

  function normalizarData(valor) {
    if (vazio(valor)) return null;
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor.toISOString().slice(0,10);
    if (typeof valor === "number" && valor > 0 && window.XLSX?.SSF?.parse_date_code) {
      const d = XLSX.SSF.parse_date_code(valor);
      if (d?.y && d?.m && d?.d) return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
    }
    const v = texto(valor);
    let m = v.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
    m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})(?:\D|$)/);
    if (m) {
      const anoCurto = Number(m[3]);
      const ano = anoCurto >= 70 ? 1900 + anoCurto : 2000 + anoCurto;
      return `${ano}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    }
    return null;
  }

  function normalizarMes(valor) {
    const numero=normalizarNumero(valor);if(numero>=1&&numero<=12)return numero;
    return MESES[normalizarCabecalho(valor)] || null;
  }

  function periodoInformado(linha) {
    const candidato=texto(linha.periodo ?? linha.competencia ?? linha.referencia ?? linha.mes_ano ?? linha.mes);
    const iso=candidato.match(/^(\d{4})[\/-](\d{1,2})$/);
    if(iso)return{ano:Number(iso[1]),mes:Number(iso[2])};
    const numerico=candidato.match(/^(\d{1,2})[\/-](\d{4})$/);
    if(numerico)return{ano:Number(numerico[2]),mes:Number(numerico[1])};
    const nominal=normalizarCabecalho(candidato).match(/^([a-z]+)[_\/-]?(\d{4})$/);
    if(nominal&&MESES[nominal[1]])return{ano:Number(nominal[2]),mes:MESES[nominal[1]]};
    const ano=normalizarNumero(linha.ano),mes=normalizarMes(linha.mes_numero ?? linha.mes);
    return ano&&mes?{ano:Number(ano),mes:Number(mes)}:null;
  }

  function campo(linha, nome) {
    for (const alias of ALIASES[nome] || [nome]) if (!vazio(linha[alias])) return linha[alias];
    return null;
  }

  function normalizarCabecalhoCCO(valor){return String(valor||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase().replace(/[._/\-]+/g," ").replace(/[^a-z0-9º°\s]+/g," ").replace(/\s+/g," ").trim().replace(/^[nº°]+(?=\s|$)/,"n");}
  function indexarLinhaPorCabecalho(linha){const mapa=new Map();for(const[chave,valor]of Object.entries(linha||{}))mapa.set(normalizarCabecalhoCCO(chave),valor);return mapa;}
  function extrairValorOperacionalP9(linha){const mapa=indexarLinhaPorCabecalho(linha),candidatos=["equipe","equipes","qtd equipe","quantidade equipe","quantidade de equipe","quantidade de equipes","numero de equipes","numero equipes","n equipes","equipe executada","equipes executadas","executado","executado total","qtd executado","qtd executada","quantidade executada","acumulado","acumulado no mes","producao"];for(const chave of candidatos){if(!mapa.has(chave))continue;const numero=window.numeroSeguroCCO?window.numeroSeguroCCO(mapa.get(chave)):normalizarNumero(mapa.get(chave));if(numero>0)return{valor:numero,campo:chave};}return{valor:null,campo:null};}
  function extrairValorP9(linha){return extrairValorOperacionalP9(linha).valor;}

  function detectarCabecalho(matriz) {
    const conhecidos = new Set(Object.values(ALIASES).flat().concat(["mes","ano","total_dias","dias_operacao","previsto","valor_unitario"]));
    let melhor = { indice:0, pontos:-1 };
    matriz.slice(0,30).forEach((linha,indice) => {
      const normalizados = (linha || []).map(normalizarCabecalho).filter(Boolean);
      const pontos = normalizados.reduce((n,item) => n + (conhecidos.has(item) ? 20 : 1),0);
      if (normalizados.length >= 2 && pontos > melhor.pontos) melhor = { indice,pontos };
    });
    return melhor.indice;
  }

  function criarMapaCabecalhosUnicos(cabecalhos) {
    const contadores = new Map();
    return (cabecalhos || []).map((cabecalho,indice) => {
      const literal=texto(cabecalho) || `Coluna ${indice + 1}`;
      const normalizado=normalizarCabecalho(cabecalho) || `coluna_${indice + 1}`;
      const quantidade=(contadores.get(normalizado)||0)+1;
      contadores.set(normalizado,quantidade);
      return {indice,literal,normalizado,chave:quantidade===1?normalizado:`${normalizado}_${quantidade}`};
    });
  }

  function criarCabecalhos(linha) {
    return criarMapaCabecalhosUnicos(linha).map(item=>({
      ordem:item.indice,original:item.literal,normalizado:item.normalizado,chave:item.chave
    }));
  }

  function objetoDaLinha(valores,cabecalhos,chave) {
    return Object.fromEntries(cabecalhos.map(item => [item[chave], valores?.[item.ordem] ?? null]));
  }

  function obterCampoLiteralCCO(linhaOriginal,linhaNormalizada,configuracao) {
    const literal=configuracao?.literal;
    if(literal&&Object.prototype.hasOwnProperty.call(linhaOriginal||{},literal))return{valor:linhaOriginal[literal],campo:literal,fonte:"original"};
    const fallback=configuracao?.fallbackNormalizado;
    if(fallback&&Object.prototype.hasOwnProperty.call(linhaNormalizada||{},fallback))return{valor:linhaNormalizada[fallback],campo:fallback,fonte:"normalizada"};
    return{valor:null,campo:null,fonte:null};
  }

  function obterCampoOperacionalCCO(servico,linhaOriginal,linhaNormalizada) {
    if(SERVICOS_KM_TOTAL_LITERAL.includes(servico))return obterCampoLiteralCCO(linhaOriginal,linhaNormalizada,CAMPOS_PLANILHA_CCO[servico].km_total);
    if(servico==="P5")return obterCampoLiteralCCO(linhaOriginal,linhaNormalizada,CAMPOS_PLANILHA_CCO.P5.km_executado);
    if(servico==="P6")return obterCampoLiteralCCO(linhaOriginal,linhaNormalizada,CAMPOS_PLANILHA_CCO.P6.total_pagamento_km);
    return{valor:null,campo:null,fonte:null};
  }

  function preValidarCabecalhosCCO(aba,servico,headers) {
    const duplicados=[...headers.reduce((mapa,item)=>{const lista=mapa.get(item.normalizado)||[];lista.push(item);mapa.set(item.normalizado,lista);return mapa;},new Map())]
      .filter(([,itens])=>itens.length>1).map(([normalizado,itens])=>({normalizado,literais:itens.map(item=>item.original),chaves:itens.map(item=>item.chave)}));
    const configuracoes=Object.values(CAMPOS_PLANILHA_CCO[servico]||{});
    const oficiais=configuracoes.map(configuracao=>{
      const literais=headers.filter(item=>item.original===configuracao.literal);
      const fallbacks=headers.filter(item=>item.chave===configuracao.fallbackNormalizado);
      const valores=literais.length?literais:fallbacks,valor=valores[0];
      const percentuais=configuracao.percentualLiteral?headers.filter(item=>item.original===configuracao.percentualLiteral):[];
      const percentual=percentuais[0];
      return{literal:configuracao.literal,chave:valor?.chave||null,indice:valor?valor.ordem+1:null,origensEncontradas:valores.length,percentualLiteral:configuracao.percentualLiteral||null,percentualChave:percentual?.chave||null,percentuaisEncontrados:configuracao.percentualLiteral?percentuais.length:0};
    });
    const invalidos=oficiais.filter(item=>item.origensEncontradas!==1||(item.percentualLiteral&&item.percentuaisEncontrados!==1)||item.chave===item.percentualChave);
    const relatorio={aba,cabecalhosDuplicados:duplicados,chavesGeradas:headers.map(item=>item.chave),camposOficiaisLocalizados:oficiais};
    console.table([relatorio]);
    if(invalidos.length)throw new Error(`Pré-validação de cabeçalhos falhou na aba ${aba}: ${invalidos.map(item=>item.literal).join(", ")}.`);
    return relatorio;
  }

  function servicoDaAba(aba) {
    const n = normalizarCabecalho(aba).replace(/_/g,"");
    const m = n.match(/^p(1[0-2]|[1-9])(?:[.]?([12]))?/);
    return m ? `P${m[1]}${m[2] ? `.${m[2]}` : ""}` : null;
  }

  function chave(...partes) {
    return partes.map(item => texto(item).replace(/\|/g,"/")).join("|");
  }

  async function hashArquivo(arquivo) {
    const buffer = await arquivo.arrayBuffer();
    if (!crypto?.subtle) return `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`;
    const digest = await crypto.subtle.digest("SHA-256",buffer);
    return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2,"0")).join("");
  }

  async function usuarioAutorizado() {
    const cliente = banco();
    if (!cliente?.auth) throw new Error("Cliente Supabase não configurado.");
    const { data:{ user } = {}, error } = await cliente.auth.getUser();
    if (error || !user) throw new Error("Sessão expirada. Entre novamente.");
    const { data:perfil, error:erroPerfil } = await cliente.from("perfis_usuario").select("nome,email,perfil,ativo").eq("usuario_id",user.id).maybeSingle();
    if (erroPerfil) throw erroPerfil;
    if (!perfil?.ativo || perfil.perfil !== "administrador") throw new Error("A importação exige perfil administrador ativo.");
    return { id:user.id,email:user.email || perfil.email || "",nome:perfil.nome || user.user_metadata?.nome || user.email || "Administrador" };
  }

  function analisarWorkbook(workbook,nomeArquivo) {
    const abas=[],cabecalhos=[],raw=[],operacoes=[],dias=[],painel=[],erros=[],preValidacao=[];
    workbook.SheetNames.forEach(nomeAba => {
      const matriz = XLSX.utils.sheet_to_json(workbook.Sheets[nomeAba],{header:1,raw:true,defval:null,blankrows:false});
      if (!matriz.length) { abas.push({nome:nomeAba,total_linhas:0}); return; }
      const indiceCabecalho = detectarCabecalho(matriz), headers = criarCabecalhos(matriz[indiceCabecalho]);
      const servicoAba = servicoDaAba(nomeAba);
      const chaveData = headers.find(item => ALIASES.data_operacao.includes(item.normalizado))?.chave || null;
      if(SERVICOS.has(servicoAba))preValidacao.push(preValidarCabecalhosCCO(nomeAba,servicoAba,headers));
      headers.forEach(item => cabecalhos.push({aba:nomeAba,linha_cabecalho:indiceCabecalho+1,ordem:item.ordem+1,cabecalho_original:item.original,cabecalho_normalizado:item.chave}));
      let totalAba=0;
      matriz.slice(indiceCabecalho+1).forEach((valores,offset) => {
        if (!(valores || []).some(valor => !vazio(valor))) return;
        const numeroLinha=indiceCabecalho+2+offset;
        const linha=objetoDaLinha(valores,headers,"chave"),original=objetoDaLinha(valores,headers,"original");
        const servico=SERVICOS.has(servicoAba) ? servicoAba : normalizarServico(campo(linha,"servico"));
        const rd=texto(campo(linha,"rd")) || null, data=normalizarData(campo(linha,"data_operacao"));
        const periodoLinha=periodoInformado(linha);
        const rawAtual={aba:nomeAba,numero_linha:numeroLinha,servico:SERVICOS.has(servico)?servico:null,rd,data_operacao:data,ano:data?Number(data.slice(0,4)):periodoLinha?.ano||null,mes:data?Number(data.slice(5,7)):periodoLinha?.mes||null,chave_linha:chave(nomeAba,numeroLinha,servico,data,rd),dados:jsonSeguro(linha),dados_originais:jsonSeguro(original)};
        raw.push(rawAtual);
        totalAba++;
        if (SERVICOS.has(servico)) {
          if (!data) erros.push({aba:nomeAba,numero_linha:numeroLinha,codigo:"DATA_INVALIDA",mensagem:"Linha operacional sem data válida.",dados:jsonSeguro(original)});
          const campoOficial=obterCampoOperacionalCCO(servico,original,linha);
          const executado=normalizarNumero(servico==="P5"?campoOficial.valor:campo(linha,"executado")),extracaoP9=servico==="P9"?extrairValorOperacionalP9({...original,...linha}):{valor:null,campo:null},valorP9=extracaoP9.valor;
          const resultadoKmP1=servico==="P1"?window.obterKmTotalP1DoRawCCO({dados_originais:original,dados:linha}):null;
          const kmTotal=servico==="P1"?resultadoKmP1.valor:normalizarNumero(["P5","P6",...SERVICOS_KM_TOTAL_LITERAL].includes(servico)?campoOficial.valor:campo(linha,"km_total"));
          if(servico==="P1")rawAtual.dados={...rawAtual.dados,campo_origem_km_total:resultadoKmP1.campo,valor_original_km_total:resultadoKmP1.valorOriginal};
          if(servico==="P12"&&executado===null){
            erros.push({aba:nomeAba,numero_linha:numeroLinha,codigo:"P12_EXECUTADO_AUSENTE",mensagem:"Linha P12 sem valor Executado válido; preservada no RAW e excluída de operacoes.",dados:jsonSeguro(original)});
          }else if(servico==="P9"&&valorP9===null){
            erros.push({aba:nomeAba,numero_linha:numeroLinha,codigo:"P9_VALOR_AUSENTE",mensagem:"Linha P9 sem quantidade de equipe positiva; preservada no RAW e excluída de operacoes.",dados:jsonSeguro(original)});
          }else{
            const diagnosticoOriginal=servico==="P9"?{...original,campo_origem_p9:extracaoP9.campo}:servico==="P1"?{...original,campo_origem_km_total:resultadoKmP1.campo,valor_original_km_total:resultadoKmP1.valorOriginal}:original;
            operacoes.push({aba:nomeAba,numero_linha:numeroLinha,rd,servico,tipo_servico:texto(campo(linha,"tipo_servico"))||null,data_operacao:data,hora:texto(campo(linha,"hora"))||null,turno:texto(campo(linha,"turno"))||null,ra:texto(campo(linha,"ra"))||null,setor:texto(campo(linha,"setor"))||null,circuito:texto(campo(linha,"circuito"))||null,veiculo:texto(campo(linha,"veiculo"))||null,equipe:servico==="P9"?valorP9:normalizarNumero(campo(linha,"equipe")),qtd_equipe:servico==="P9"?valorP9:normalizarNumero(campo(linha,"qtd_equipe")),peso_t:normalizarNumero(campo(linha,"peso_t")),viagens:normalizarNumero(campo(linha,"viagens")),km_total:kmTotal,executado:servico==="P9"?valorP9:executado,velocidade_media:normalizarNumero(campo(linha,"velocidade_media")),tempo_produtivo_minutos:normalizarNumero(campo(linha,"tempo_produtivo_minutos")),tempo_total_minutos:normalizarNumero(campo(linha,"tempo_total_minutos")),tempo_parada_minutos:normalizarNumero(campo(linha,"tempo_parada_minutos")),km_produtivo:normalizarNumero(campo(linha,"km_produtivo")),km_improdutivo:normalizarNumero(campo(linha,"km_improdutivo")),valor_abastecido:normalizarNumero(campo(linha,"valor_abastecido")),valor_original:jsonSeguro(diagnosticoOriginal),chave_operacao:chave(nomeAba,numeroLinha,servico,data,rd)});
          }
        }
        const abaNorm=normalizarCabecalho(nomeAba);
        if (abaNorm.includes("dias_operacao")) {
          const dataRef=normalizarData(linha.data || linha.periodo || linha.mes),periodoDias=periodoInformado(linha),ano=Number(linha.ano || dataRef?.slice(0,4) || periodoDias?.ano),mes=normalizarMes(linha.mes_numero ?? (dataRef?dataRef.slice(5,7):linha.mes)) || periodoDias?.mes;
          const total=normalizarNumero(linha.total_dias ?? linha.dias_operacao ?? linha.dias);
          if (ano && mes && total !== null) {
            rawAtual.ano=ano;rawAtual.mes=mes;
            dias.push({ano,mes,total_dias:total,dados:jsonSeguro(original)});
          }
        }
        if (abaNorm.includes("painel_executivo")) painel.push({numero_linha:numeroLinha,ano:data?Number(data.slice(0,4)):normalizarNumero(linha.ano),mes:data?Number(data.slice(5,7)):normalizarNumero(linha.mes),servico:SERVICOS.has(servico)?servico:null,descricao:texto(linha.descricao || linha.nome_servico)||null,nome_servico:texto(linha.nome_servico || linha.descricao)||null,medicao:texto(linha.medicao || linha.unidade)||null,previsto:normalizarNumero(linha.previsto ?? linha.previsto_mes),acumulado:normalizarNumero(linha.acumulado ?? linha.acumulado_mes),dias_acumulados:normalizarNumero(linha.dias_acumulados ?? linha.dias_acumulado),total_dias_mes:normalizarNumero(linha.total_dias_mes ?? linha.total_de_dias_no_mes),valor_unitario:normalizarNumero(linha.valor_unitario),valor_total:normalizarNumero(linha.valor_total ?? linha.valor),dados:jsonSeguro(original)});
      });
      const operacoesAba = operacoes.filter(item => item.aba === nomeAba);
      const periodosAba = [...new Set(operacoesAba.map(item => item.data_operacao?.slice(0,7)).filter(Boolean))].sort();
      console.info("[IMPORTAÇÃO][ABA]", {
        aba: nomeAba,
        servico: servicoAba,
        linhaCabecalho: indiceCabecalho + 1,
        chaveData,
        linhas: totalAba,
        operacoes: operacoesAba.length,
        operacoesComData: operacoesAba.filter(item => item.data_operacao).length,
        periodos: periodosAba
      });
      abas.push({nome:nomeAba,total_linhas:totalAba,linha_cabecalho:indiceCabecalho+1,arquivo:nomeArquivo});
    });
    const periodos=[...new Set(raw.map(item=>item.data_operacao?.slice(0,7)).filter(Boolean))].sort();
    return {abas,cabecalhos,raw,operacoes,dias,painel,erros,periodos,preValidacao};
  }

  function tamanhoLoteTabela(tabela) {
    if (tabela === "planilha_linhas") return TAMANHO_LOTE_RAW;
    if (tabela === "operacoes") return TAMANHO_LOTE_OPERACOES;
    if (tabela === "importacao_erros") return TAMANHO_LOTE_ERROS;
    return TAMANHO_LOTE_PADRAO;
  }

  function lotesAdaptativos(linhas,tamanhoMaximo=TAMANHO_LOTE_PADRAO) {
    const lotes=[]; let atual=[],tamanho=2;
    linhas.forEach(linha => {
      const tamanhoLinha=bytes(linha)+1;
      if (atual.length && (atual.length>=tamanhoMaximo || tamanho+tamanhoLinha>TAMANHO_MAXIMO_LOTE)) { lotes.push(atual); atual=[]; tamanho=2; }
      atual.push(linha); tamanho+=tamanhoLinha;
    });
    if (atual.length) lotes.push(atual);
    return lotes;
  }

  async function inserirLotes(tabela,linhas,importacaoId,onConflict) {
    if (!linhas.length) return 0;
    const payload=linhas.map(item=>({...item,importacao_id:importacaoId})),lotes=lotesAdaptativos(payload,tamanhoLoteTabela(tabela));
    let inseridos=0;
    for(let indice=0;indice<lotes.length;indice+=1){
      const lote=lotes[indice];
      const consulta=onConflict?banco().from(tabela).upsert(lote,{onConflict,ignoreDuplicates:false}):banco().from(tabela).insert(lote);
      const {error}=await consulta;
      if(error){console.error(`[IMPORTAÇÃO] ${tabela} lote ${indice+1}/${lotes.length}`,{quantidade:lote.length,bytes:bytes(lote),code:error.code,message:error.message,details:error.details,hint:error.hint});throw error;}
      inseridos+=lote.length;
    }
    return inseridos;
  }

  async function gravarDiasOperacao(dias,importacaoId) {
    if(dias.length!==1)throw new Error("Cada período deve possuir exatamente um registro de Dias_Operação.");
    const registro={...dias[0],importacao_id:importacaoId};
    const {error}=await banco().from("dias_operacao").upsert(registro,{onConflict:"importacao_id,ano,mes",ignoreDuplicates:false});
    if(error)throw error;
  }

  async function obterContagensReais(importacaoId,contagensLocais) {
    const contar=(tabela,configurar=consulta=>consulta)=>configurar(banco().from(tabela).select("id",{count:"exact",head:true}).eq("importacao_id",importacaoId));
    const respostas=await Promise.all([
      contar("planilha_linhas"),contar("operacoes"),contar("dias_operacao"),contar("painel_executivo"),contar("importacao_erros")
    ]);
    const erro=respostas.find(item=>item.error)?.error;if(erro)throw erro;
    return{raw:Number(respostas[0].count||0),operacoes:Number(respostas[1].count||0),dias:Number(respostas[2].count||0),painel:Number(respostas[3].count||0),erros:Number(respostas[4].count||0),p12:contagensLocais.p12,p12ComExecutado:contagensLocais.p12ComExecutado};
  }

  async function atualizarAuditoriaEsperada(importacaoId,contagens,grupo) {
    const detalhes={build:BUILD,periodo:grupo.periodo,esperado_raw:contagens.raw,esperado_operacoes:contagens.operacoes,esperado_dias:contagens.dias,esperado_painel:contagens.painel,esperado_p12:contagens.p12,esperado_p12_executado:contagens.p12ComExecutado};
    const {error}=await banco().from("importacoes").update({total_linhas:contagens.raw,linhas_importadas:contagens.operacoes,linhas_rejeitadas:contagens.erros,detalhes}).eq("id",importacaoId);
    if(error)throw error;
  }

  function consolidarKpis(operacoes,ano,mes) {
    const grupos=new Map();
    operacoes.forEach(item=>{const g=grupos.get(item.servico)||[];g.push(item);grupos.set(item.servico,g);});
    return [...grupos].map(([servico,linhas])=>{const soma=campo=>linhas.reduce((n,item)=>n+(Number(item[campo])||0),0),vel=linhas.map(i=>Number(i.velocidade_media)).filter(n=>n>0);return{ano,mes,servico,total_operacoes:linhas.length,total_viagens:soma("viagens"),total_peso_t:soma("peso_t"),total_km:soma("km_total"),velocidade_media:vel.length?vel.reduce((a,b)=>a+b,0)/vel.length:null,quantidade_dias:new Set(linhas.map(i=>i.data_operacao).filter(Boolean)).size,dados:{fonte:"operacoes"}};});
  }

  const ORDEM_SERVICOS_PAINEL=Object.freeze(["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"]);
  const CAMPO_ACUMULADO=Object.freeze({P1:"peso_t","P2.1":"viagens","P2.2":"viagens",P3:"equipe",P4:"peso_t",P5:"km_total",P6:"km_total",P7:"equipe",P8:"equipe",P9:"equipe",P10:"equipe",P11:"equipe",P12:"executado"});
  const MEDICAO_SERVICO=Object.freeze({P1:"Tonelada","P2.1":"Viagens realizadas","P2.2":"Viagens realizadas",P3:"Equipe",P4:"Tonelada",P5:"KM",P6:"KM",P7:"Equipe",P8:"Equipe",P9:"Equipe",P10:"Equipe",P11:"Equipe",P12:"Executado"});
  function calcularAcumuladoPeriodo(servico,linhas){if(servico==="P9"){const valores=(linhas||[]).map(item=>extrairValorP9(item)).filter(valor=>valor>0);return valores.length?Math.min(Math.max(...valores),11):0;}const campo=CAMPO_ACUMULADO[servico];if(campo==="equipe"){const registros=(linhas||[]).map(item=>({data_operacao:item.data_operacao,equipe:item.equipe}));return window.CCOMetricas?.calcularAcumuladoServico?.(servico,registros)??0;}return(linhas||[]).reduce((total,item)=>total+(normalizarNumero(item[campo])||0),0);}
  function gerarPainelExecutivoPeriodo(grupo,metasOriginais){const metas=new Map((metasOriginais||[]).filter(item=>item.servico).map(item=>[normalizarServico(item.servico),item])),totalDias=window.CCO_REGRAS.obterDiasOperacao(grupo.ano,grupo.mes);return ORDEM_SERVICOS_PAINEL.map((servico,indice)=>{const meta=metas.get(servico)||{},linhas=grupo.operacoes.filter(item=>item.servico===servico),acumulado=calcularAcumuladoPeriodo(servico,linhas),previsto=window.CCO_REGRAS.calcularPrevisto(servico,grupo.ano,grupo.mes,normalizarNumero(meta.previsto),normalizarNumero(meta.total_dias_mes)),diasAcumulados=new Set(linhas.map(item=>item.data_operacao).filter(Boolean)).size,valorUnitario=window.CCO_REGRAS.obterValorServico(servico),valorTotal=acumulado*valorUnitario;return{numero_linha:meta.numero_linha||indice+2,ano:grupo.ano,mes:grupo.mes,servico,descricao:meta.descricao||meta.nome_servico||servico,nome_servico:meta.nome_servico||meta.descricao||servico,medicao:meta.medicao||MEDICAO_SERVICO[servico],previsto,acumulado,dias_acumulados:diasAcumulados,total_dias_mes:totalDias,valor_unitario:valorUnitario,valor_total:valorTotal,dados:{fonte:"consolidacao_mensal",periodo:grupo.periodo,registros:linhas.length}};});}

  function separarPorPeriodo(resultado) {
    const mapas=new Map(resultado.periodos.map(periodo=>[periodo,{periodo,ano:Number(periodo.slice(0,4)),mes:Number(periodo.slice(5,7))}]));
    const chaveItem=item=>{if(item.data_operacao)return item.data_operacao.slice(0,7);if(item.ano&&item.mes)return`${item.ano}-${String(item.mes).padStart(2,"0")}`;const dados=item.dados||{};const data=normalizarData(dados.data_operacao??dados.data??dados.dia??dados.periodo);if(data)return data.slice(0,7);const ano=Number(dados.ano),mes=normalizarMes(dados.mes_numero??dados.mes);return ano&&mes?`${ano}-${String(mes).padStart(2,"0")}`:null;};
    for(const grupo of mapas.values()){
      grupo.operacoes=resultado.operacoes.filter(item=>chaveItem(item)===grupo.periodo);
      grupo.raw=resultado.raw.filter(item=>{const chave=chaveItem(item);return !chave||chave===grupo.periodo;});
      const diasPeriodo=resultado.dias.filter(item=>Number(item.ano)===grupo.ano&&Number(item.mes)===grupo.mes);
      const totaisDias=[...new Set(diasPeriodo.map(item=>Number(item.total_dias)))];
      if(totaisDias.length!==1)throw new Error(`Dias_Operação inválido em ${grupo.periodo}: esperado um único total oficial, encontrados ${totaisDias.length}.`);
      grupo.dias=[{ano:grupo.ano,mes:grupo.mes,total_dias:totaisDias[0],dados:diasPeriodo.length===1?diasPeriodo[0].dados:{linhas_originais:diasPeriodo.map(item=>item.dados)}}];
      const metasPeriodo=resultado.painel.filter(item=>(!item.ano&&!item.mes)||(Number(item.ano)===grupo.ano&&Number(item.mes)===grupo.mes));
      grupo.painel=gerarPainelExecutivoPeriodo(grupo,metasPeriodo);
      const linhasRaw=new Set(grupo.raw.map(item=>`${item.aba}|${item.numero_linha}`));
      grupo.erros=resultado.erros.filter(item=>linhasRaw.has(`${item.aba}|${item.numero_linha}`));
      const contagemAbas=new Map();grupo.raw.forEach(item=>contagemAbas.set(item.aba,(contagemAbas.get(item.aba)||0)+1));
      grupo.abas=resultado.abas.map(aba=>({...aba,total_linhas:contagemAbas.get(aba.nome)||0}));
      grupo.cabecalhos=resultado.cabecalhos;
    }
    return mapas;
  }

  async function buscarRawP9(importacaoId) {
    const colunas="id,importacao_id,aba,numero_linha,rd,servico,data_operacao,dados,dados_originais",buscar=async configurar=>{const registros=[];for(let inicio=0;;inicio+=200){let consulta=banco().from("planilha_linhas").select(colunas).eq("importacao_id",importacaoId).order("numero_linha",{ascending:true}).range(inicio,inicio+199);consulta=configurar(consulta);const{data,error}=await consulta;if(error)throw error;const lote=data||[];registros.push(...lote);if(lote.length<200)break;}return registros;},[porServico,porAba]=await Promise.all([buscar(consulta=>consulta.in("servico",["P9","P 9","P-9","p9"])),buscar(consulta=>consulta.ilike("aba","%P9%"))]),mapa=new Map();[...porServico,...porAba].forEach((item,indice)=>mapa.set(item.id||`${item.importacao_id}|${item.aba}|${item.numero_linha}|${indice}`,item));return[...mapa.values()].sort((a,b)=>Number(a.numero_linha)-Number(b.numero_linha));
  }

  function montarOperacaoP9DoRaw(item) {
    const linha=item?.dados&&typeof item.dados==="object"?item.dados:{},original=item?.dados_originais&&typeof item.dados_originais==="object"?item.dados_originais:{},extracao=extrairValorOperacionalP9({...original,...linha}),valor=extracao.valor;
    if(!(valor>0))return null;
    const data=item.data_operacao||normalizarData(campo(linha,"data_operacao")),rd=item.rd||texto(campo(linha,"rd"))||null;
    return{aba:item.aba,numero_linha:item.numero_linha,rd,servico:"P9",tipo_servico:texto(campo(linha,"tipo_servico"))||null,data_operacao:data,hora:texto(campo(linha,"hora"))||null,turno:texto(campo(linha,"turno"))||null,ra:texto(campo(linha,"ra"))||null,setor:texto(campo(linha,"setor"))||null,circuito:texto(campo(linha,"circuito"))||null,veiculo:texto(campo(linha,"veiculo"))||null,equipe:valor,qtd_equipe:valor,peso_t:null,viagens:null,km_total:null,executado:valor,valor_original:jsonSeguro({...original,campo_origem_p9:extracao.campo}),chave_operacao:chave(item.aba,item.numero_linha,"P9",data,rd)};
  }

  async function reprocessarP9Ativos() {
    await usuarioAutorizado();
    await window.carregarRegrasServicosCCO();
    const {data:periodos,error}=await banco().from("importacoes").select("id,ano,mes,status,ativa").eq("ativa",true).in("status",["concluida","concluida_com_avisos"]).order("ano",{ascending:true}).order("mes",{ascending:true});
    if(error)throw error;
    const diagnostico=[];
    for(const periodo of periodos||[]){
      const raw=await buscarRawP9(periodo.id),validas=raw.map(montarOperacaoP9DoRaw).filter(Boolean),invalidas=raw.filter((item,indice)=>!montarOperacaoP9DoRaw(item)),valores=validas.map(item=>item.qtd_equipe).filter(valor=>valor>0),acumuladoReal=valores.length?Math.max(...valores):0,acumuladoExibido=Math.min(acumuladoReal,11),percentual=acumuladoExibido/11*100,valor=acumuladoExibido*window.CCO_REGRAS.obterValorServico("P9"),campoEncontrado=raw.map(item=>{const origem={...(item.dados_originais||{}),...(item.dados||{})};return Object.keys(origem).find(nome=>extrairValorP9({[nome]:origem[nome]})>0)||null;}).find(Boolean)||null;
      if(validas.length){const {error:erroExcluir}=await banco().from("operacoes").delete().eq("importacao_id",periodo.id).or('servico.ilike.P9,aba.ilike.%P9%');if(erroExcluir)throw erroExcluir;await inserirLotes("operacoes",validas,periodo.id);}
      const {error:erroLimparErros}=await banco().from("importacao_erros").delete().eq("importacao_id",periodo.id).eq("codigo","P9_VALOR_AUSENTE");if(erroLimparErros)throw erroLimparErros;
      await inserirLotes("importacao_erros",invalidas.map(item=>({aba:item.aba,numero_linha:item.numero_linha,codigo:"P9_VALOR_AUSENTE",mensagem:"Linha P9 sem quantidade de equipe positiva; preservada no RAW e excluída de operacoes.",dados:jsonSeguro(item.dados_originais||item.dados||{})})),periodo.id);
      const {data:linhaPainel,error:erroPainel}=await banco().from("painel_executivo").select("id,numero_linha,dados").eq("importacao_id",periodo.id).eq("servico","P9").maybeSingle();if(erroPainel)throw erroPainel;
      const painelP9={ano:periodo.ano,mes:periodo.mes,servico:"P9",descricao:"P9",nome_servico:"P9",medicao:"Equipe",previsto:11,acumulado:acumuladoExibido,dias_acumulados:new Set(validas.map(item=>item.data_operacao).filter(Boolean)).size,total_dias_mes:window.CCO_REGRAS.obterDiasOperacao(periodo.ano,periodo.mes),valor_unitario:window.CCO_REGRAS.obterValorServico("P9"),valor_total:valor,dados:{...(linhaPainel?.dados||{}),fonte:"reprocessamento_p9_raw",registros:validas.length,acumulado_real:acumuladoReal,campo_origem_p9:campoEncontrado}};
      if(validas.length&&linhaPainel?.id){const {error:erroAtualizar}=await banco().from("painel_executivo").update(painelP9).eq("id",linhaPainel.id);if(erroAtualizar)throw erroAtualizar;}else if(validas.length){await inserirLotes("painel_executivo",[{...painelP9,numero_linha:11}],periodo.id);}
      diagnostico.push({periodo:`${periodo.ano}-${String(periodo.mes).padStart(2,"0")}`,registrosRawP9:raw.length,operacoesP9:validas.length,campoEncontrado,acumuladoReal,acumuladoExibido,previsto:11,percentual,valor,status:acumuladoExibido>0?"Com dados":"Sem valor P9 no RAW"});
    }
    console.table(diagnostico);window.CCOCache?.invalidar?.("painel");window.CCOCache?.invalidar?.("kpi");window.CCOCache?.invalidar?.("analytics");if(typeof window.recarregarCatalogoPainelGeral==="function")await window.recarregarCatalogoPainelGeral();return diagnostico;
  }

  function renderAuditoria(importacoes) {
    const alvo=document.getElementById("auditoriaImportacao"); if(!alvo)return;
    const totais=importacoes.reduce((s,item)=>({raw:s.raw+item.grupo.raw.length,ops:s.ops+item.grupo.operacoes.length,erros:s.erros+item.grupo.erros.length}),{raw:0,ops:0,erros:0});
    const linhas=importacoes.map(item=>`<tr><td>${item.grupo.periodo}</td><td>${item.importacao.id}</td><td>${item.grupo.raw.length.toLocaleString("pt-BR")}</td><td>${item.grupo.operacoes.length.toLocaleString("pt-BR")}</td><td>${window.CCO_REGRAS.obterDiasOperacao(item.grupo.ano,item.grupo.mes)||"—"}</td><td>${Number(item.auditoria?.soma_p12||0).toLocaleString("pt-BR")}</td><td><span class="badge ok">ATIVA</span></td></tr>`).join("");
    alvo.hidden=false;alvo.innerHTML=`<div class="section-title"><span>Auditoria da importação</span><h2>${importacoes.length} período${importacoes.length===1?"":"s"} atualizado${importacoes.length===1?"":"s"}</h2></div><div class="cards"><article class="card"><span>RAW preservado</span><strong>${totais.raw.toLocaleString("pt-BR")}</strong></article><article class="card"><span>Operações</span><strong>${totais.ops.toLocaleString("pt-BR")}</strong></article><article class="card"><span>Períodos</span><strong>${importacoes.length}</strong></article><article class="card"><span>Rejeições</span><strong>${totais.erros}</strong></article></div><div class="table-wrap"><table><thead><tr><th>Período</th><th>Nova importação</th><th>RAW</th><th>Operações</th><th>Dias operação</th><th>Soma P12</th><th>Status</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
  }

  async function auditarPeriodo(importacaoId,grupo,contagens) {
    if(contagens.raw<=0||contagens.raw!==grupo.raw.length||contagens.operacoes!==grupo.operacoes.length||contagens.dias!==1||contagens.painel!==13||contagens.p12!==contagens.p12ComExecutado)throw new Error(`Auditoria divergente em ${grupo.periodo}.`);
    const somaP12=grupo.operacoes.filter(item=>item.servico==="P12"&&item.executado!==null).reduce((s,item)=>s+(Number(item.executado)||0),0);
    return {id:importacaoId,linhas_raw:contagens.raw,operacoes:contagens.operacoes,erros:contagens.erros,dias_operacao:contagens.dias,linhas_painel_executivo:contagens.painel,registros_p12:contagens.p12,p12_com_executado:contagens.p12ComExecutado,soma_p12:somaP12};
  }

  async function medirEtapa(periodo,etapa,tarefa) {
    const rotulo=`[IMPORTAÇÃO] ${periodo} ${etapa}`;
    console.time(rotulo);
    try{return await tarefa();}
    catch(error){console.error(`${rotulo} FALHOU`,{message:error?.message,code:error?.code,details:error?.details,hint:error?.hint,stack:error?.stack,error});throw error;}
    finally{console.timeEnd(rotulo);}
  }

  async function limparImportacoesTimeoutPeriodo(grupo) {
    const {data,error}=await banco().from("importacoes").select("id,ano,mes,status,erro").eq("ano",grupo.ano).eq("mes",grupo.mes).eq("status","erro").ilike("erro","%statement timeout%");
    if(error)throw error;
    const ids=(data||[]).map(item=>item.id).filter(Boolean);
    console.table((data||[]).map(item=>({periodo:grupo.periodo,id:item.id,status:item.status,erro:item.erro})));
    if(!ids.length)return 0;
    const {error:erroExclusao}=await banco().from("importacoes").delete().in("id",ids).eq("status","erro").ilike("erro","%statement timeout%");
    if(erroExclusao)throw erroExclusao;
    console.info(`[IMPORTAÇÃO] ${grupo.periodo} tentativas com timeout removidas`,{quantidade:ids.length,ids});
    return ids.length;
  }

  async function importarPeriodo(arquivo,hash,usuario,grupo) {
    console.log("[IMPORTAÇÃO] período",grupo.periodo);
    await medirEtapa(grupo.periodo,"limpar timeouts anteriores",()=>limparImportacoesTimeoutPeriodo(grupo));
    const {data:anterior,error:erroAnterior}=await banco().from("v_catalogo_periodos").select("importacao_id").eq("ano",grupo.ano).eq("mes",grupo.mes).maybeSingle();
    if(erroAnterior)throw erroAnterior;
    console.log("[IMPORTAÇÃO] importacao_id anterior",anterior?.importacao_id||null);
    const p12Validos=grupo.operacoes.filter(item=>item.servico==="P12"&&item.executado!==null),contagensLocais={raw:grupo.raw.length,operacoes:grupo.operacoes.length,dias:grupo.dias.length,painel:grupo.painel.length,erros:grupo.erros.length,p12:p12Validos.length,p12ComExecutado:p12Validos.length};
    const detalhes={build:BUILD,periodo:grupo.periodo,esperado_raw:contagensLocais.raw,esperado_operacoes:contagensLocais.operacoes,esperado_dias:contagensLocais.dias,esperado_painel:contagensLocais.painel,esperado_p12:contagensLocais.p12,esperado_p12_executado:contagensLocais.p12ComExecutado};
    const {data:importacao,error}=await medirEtapa(grupo.periodo,"criar importação",()=>banco().from("importacoes").insert({nome_arquivo:arquivo.name,hash_arquivo:hash,tamanho_arquivo:arquivo.size,usuario_id:usuario.id,usuario_email:usuario.email,usuario_nome:usuario.nome,ano:grupo.ano,mes:grupo.mes,status:"processando",ativa:false,total_abas:grupo.abas.length,total_linhas:grupo.raw.length,periodos:[grupo.periodo],abas:grupo.abas,detalhes}).select("id,ano,mes,status,ativa").single());
    if(error)throw error;
    console.log("[IMPORTAÇÃO] importacao_id nova",importacao.id);
    try {
      await medirEtapa(grupo.periodo,"cabeçalhos",()=>inserirLotes("cabecalhos_planilha",grupo.cabecalhos,importacao.id));
      await medirEtapa(grupo.periodo,"RAW",()=>inserirLotes("planilha_linhas",grupo.raw,importacao.id));
      await medirEtapa(grupo.periodo,"operações",()=>inserirLotes("operacoes",grupo.operacoes,importacao.id));
      await medirEtapa(grupo.periodo,"dias_operacao",()=>gravarDiasOperacao(grupo.dias,importacao.id));
      await medirEtapa(grupo.periodo,"painel_executivo",()=>inserirLotes("painel_executivo",grupo.painel,importacao.id));
      await medirEtapa(grupo.periodo,"erros",()=>inserirLotes("importacao_erros",grupo.erros,importacao.id));
      await medirEtapa(grupo.periodo,"kpi_mensal",()=>inserirLotes("kpi_mensal",consolidarKpis(grupo.operacoes,grupo.ano,grupo.mes),importacao.id,"importacao_id,servico"));
      console.log("[IMPORTAÇÃO] registros gravados",grupo.operacoes.length);
      const contagens=await medirEtapa(grupo.periodo,"auditoria de confirmação",()=>obterContagensReais(importacao.id,contagensLocais));
      console.table([{periodo:grupo.periodo,raw:contagens.raw,operacoes:contagens.operacoes,dias:contagens.dias,painel:contagens.painel,p12:contagens.p12,p12ComExecutado:contagens.p12ComExecutado,erros:contagens.erros}]);
      await medirEtapa(grupo.periodo,"atualizar auditoria",()=>atualizarAuditoriaEsperada(importacao.id,contagens,grupo));
      const auditoria=await medirEtapa(grupo.periodo,"validar auditoria",()=>auditarPeriodo(importacao.id,grupo,contagens));
      const {data:finalizadaRaw,error:erroFinal}=await medirEtapa(grupo.periodo,"finalizar",()=>banco().rpc("finalizar_importacao",{p_importacao_id:importacao.id,p_com_avisos:grupo.erros.length>0}));
      if(erroFinal)throw erroFinal;
      const finalizada=Array.isArray(finalizadaRaw)?finalizadaRaw[0]:finalizadaRaw;
      const idsEstado=[importacao.id,anterior?.importacao_id].filter(Boolean),{data:estados,error:erroEstados}=await banco().from("importacoes").select("id,status,ativa").in("id",idsEstado);
      if(erroEstados)console.warn("[IMPORTAÇÃO] não foi possível reler os estados finais",erroEstados);
      const novaAtiva=(estados||[]).some(item=>item.id===importacao.id&&item.ativa&&/^concluida/.test(item.status));
      const anteriorDesativada=!anterior?.importacao_id||(estados||[]).some(item=>item.id===anterior.importacao_id&&!item.ativa);
      console.log("[IMPORTAÇÃO] importação anterior desativada",{id:anterior?.importacao_id||null,validado:anteriorDesativada});
      console.log("[IMPORTAÇÃO] nova importação ativa",{id:importacao.id,validado:novaAtiva});
      console.table(grupo.operacoes.reduce((lista,item)=>{let linha=lista.find(x=>x.servico===item.servico);if(!linha){linha={servico:item.servico,total:0,dias:new Set()};lista.push(linha);}linha.total++;if(item.data_operacao)linha.dias.add(item.data_operacao);return lista;},[]).map(item=>({servico:item.servico,total:item.total,dias_distintos:item.dias.size})));
      console.log("[IMPORTAÇÃO] validação",auditoria);
      return {grupo,importacao:finalizada||importacao,auditoria:{...auditoria,nova_ativa:novaAtiva,anterior_desativada:anteriorDesativada},anterior:anterior?.importacao_id||null};
    } catch(error) {
      await banco().from("importacoes").update({status:"erro",ativa:false,erro:String(error.message||error),concluido_em:new Date().toISOString(),linhas_rejeitadas:grupo.erros.length}).eq("id",importacao.id);
      console.error("[IMPORTAÇÃO] erro",{periodo:grupo.periodo,importacaoId:importacao.id,message:error?.message,code:error?.code,details:error?.details,hint:error?.hint,stack:error?.stack});
      throw error;
    }
  }

  async function importarArquivo(arquivo,usuario) {
    await window.carregarRegrasServicosCCO();
    const hash=await hashArquivo(arquivo),buffer=await arquivo.arrayBuffer(),workbook=XLSX.read(buffer,{type:"array",cellDates:true,raw:true}),resultado=analisarWorkbook(workbook,arquivo.name);
    if(!resultado.raw.length)throw new Error("A planilha não contém linhas importáveis.");
    if(!resultado.periodos.length)throw new Error("Nenhum período foi encontrado nas datas reais da planilha.");
    const servicosDetectados=[...new Set(resultado.operacoes.filter(item=>item.data_operacao).map(item=>item.servico))].sort();
    console.info("[IMPORTAÇÃO] pré-validação concluída",{arquivo:arquivo.name,periodos:resultado.periodos,servicos:servicosDetectados,p5:resultado.operacoes.filter(item=>item.servico==="P5"&&item.data_operacao).length,p6:resultado.operacoes.filter(item=>item.servico==="P6"&&item.data_operacao).length});
    if(!servicosDetectados.includes("P5")||!servicosDetectados.includes("P6"))throw new Error("A pré-validação não encontrou dados válidos de P5 e P6. A importação foi interrompida antes de alterar a base.");
    const grupos=separarPorPeriodo(resultado),importacoes=[],falhas=[];
    for(const grupo of grupos.values()){
      if(!PERIODOS_ALVO.has(grupo.periodo)){console.info("[IMPORTAÇÃO] período ignorado nesta correção",grupo.periodo);continue;}
      try {
        importacoes.push(await importarPeriodo(arquivo,hash,usuario,grupo));
      } catch(error) {
        const falha={periodo:grupo.periodo,mensagem:String(error?.message||error),codigo:error?.code||null,detalhes:error?.details||null};
        falhas.push(falha);
        console.error("[IMPORTAÇÃO] período rejeitado; os próximos períodos continuarão",falha);
      }
    }
    window.__CCO_FALHAS_IMPORTACAO__=falhas;
    if(!importacoes.length)throw new Error(`Nenhum período alvo (2026-06 ou 2026-07) foi importado. ${falhas.map(item=>`${item.periodo}: ${item.mensagem}`).join(" | ")}`);
    return importacoes;
  }

  async function importarPlanilhas(evento) {
    const input=evento?.target || document.getElementById("arquivoExcel"),arquivos=[...(input?.files||[])];
    if(!arquivos.length)return false;
    if(!window.XLSX)throw new Error("Biblioteca XLSX não carregada.");
    const overlay=document.getElementById("loadingOverlay"); if(overlay)overlay.style.display="flex";
    try {
      const usuario=await usuarioAutorizado();
      const periodoSelecionado=window.__CCO_PERIODO_ATUAL__||null,resultados=[];
      for(const arquivo of arquivos)resultados.push(...await importarArquivo(arquivo,usuario));
      window.__CCO_IMPORTACOES_POR_PERIODO__={};window.__CCO_IMPORTACAO_ATIVA__=null;delete window.__CCO_CATALOGO_PERIODOS__;
      window.CCOMetricas?.invalidarCaches?.();window.CCOAnalyticsCharts?.destruirTodos?.();
      const periodosImportados=resultados.map(item=>item.grupo.periodo).sort(),falhas=window.__CCO_FALHAS_IMPORTACAO__||[];
      const resumoFalhas=falhas.length?`\n\nPeríodos com erro (${falhas.length}):\n${falhas.map(item=>`${item.periodo}: ${item.mensagem}`).join("\n")}`:"";
      alert(`Importação concluída e auditada. ${periodosImportados.length} períodos ativos: ${periodosImportados.join(", ")}.${resumoFalhas}`);
      const catalogo=typeof window.recarregarCatalogoPainelGeral==="function"?await window.recarregarCatalogoPainelGeral():typeof window.carregarCatalogoPeriodosCompleto==="function"?await window.carregarCatalogoPeriodosCompleto():typeof window.carregarCatalogoPeriodos==="function"?await window.carregarCatalogoPeriodos(true):[];
      console.log("[IMPORTAÇÃO] catálogo recarregado",catalogo);
      const manter=catalogo.find(item=>item.periodo===periodoSelecionado)||[...catalogo].sort((a,b)=>Number(b.ano)-Number(a.ano)||Number(b.mes)-Number(a.mes))[0];
      if(manter&&typeof window.carregarPeriodoCCO==="function")await window.carregarPeriodoCCO(manter);else if(typeof window.carregarBaseSupabase==="function")await window.carregarBaseSupabase();
      return true;
    } catch(error) {
      console.error("[IMPORTAÇÃO PRINCIPAL] falha",{message:error?.message,code:error?.code,details:error?.details,hint:error?.hint,error});
      alert(`Falha na importação. Nenhuma base parcial foi ativada. ${error.message||error}`);
      return false;
    } finally { if(overlay)overlay.style.display="none";if(input)input.value=""; }
  }

  async function buscarTudoPaginado(criarConsulta,tamanho=1000){
    const resultado=[];
    for(let inicio=0;;inicio+=tamanho){
      const{data,error}=await criarConsulta().range(inicio,inicio+tamanho-1);
      if(error)throw error;
      const lote=data||[];resultado.push(...lote);
      if(lote.length<tamanho)break;
    }
    return resultado;
  }

  async function reprocessarKmTotalP1Ativo(){
    const cliente=banco();if(!cliente)throw new Error("Supabase indisponível.");
    await usuarioAutorizado();
    const importacoes=await buscarTudoPaginado(()=>cliente.from("importacoes").select("id,ano,mes,ativa,status").eq("ativa",true).order("ano").order("mes"));
    const resumos=[];
    for(const importacao of importacoes){
      const rawConsulta=await buscarTudoPaginado(()=>cliente.from("planilha_linhas").select("chave_linha,aba,servico,dados,dados_originais").eq("importacao_id",importacao.id).order("chave_linha"));
      const raw=rawConsulta.filter(item=>window.normalizarAbaP1CCO(item.aba)==="P1");
      const operacoesAntes=await buscarTudoPaginado(()=>cliente.from("operacoes").select("id,chave_operacao,km_total").eq("importacao_id",importacao.id).eq("servico","P1").order("id"));
      const mapaRaw=new Map(),chavesDuplicadas=[];
      for(const linha of raw){if(!linha.chave_linha)throw new Error(`RAW P1 sem chave_linha na importação ${importacao.id}.`);if(mapaRaw.has(linha.chave_linha))chavesDuplicadas.push(linha.chave_linha);mapaRaw.set(linha.chave_linha,linha);}
      if(chavesDuplicadas.length)throw new Error(`RAW P1 possui chaves duplicadas na importação ${importacao.id}; reprocessamento abortado.`);
      const chavesOperacoes=new Set();
      for(const operacao of operacoesAntes){if(!operacao.chave_operacao||chavesOperacoes.has(operacao.chave_operacao))throw new Error(`Vínculo chave_operacao inválido ou duplicado na importação ${importacao.id}.`);chavesOperacoes.add(operacao.chave_operacao);}
      const semRaw=operacoesAntes.filter(item=>!mapaRaw.has(item.chave_operacao));
      const semOperacao=raw.filter(item=>!chavesOperacoes.has(item.chave_linha));
      if(semRaw.length||semOperacao.length)throw new Error(`Vínculo P1 incompleto na importação ${importacao.id}: ${semRaw.length} operação(ões) sem RAW e ${semOperacao.length} RAW sem operação. Nenhum update foi feito.`);
      let atualizados=0,somaRaw=0;
      const auditoria=window.auditarCamposKmP1CCO?.(raw)||{camposEncontrados:[],camposIgnorados:[]};
      const correcoes=operacoesAntes.map(operacao=>({operacao,resultadoKm:window.obterKmTotalP1DoRawCCO(mapaRaw.get(operacao.chave_operacao))}));
      const semKmTotal=correcoes.filter(item=>!Number.isFinite(item.resultadoKm.valor));
      if(semKmTotal.length)throw new Error(`Km_Total ausente em ${semKmTotal.length} linha(s) RAW da importação ${importacao.id}; nenhum update foi feito.`);
      somaRaw=correcoes.reduce((s,item)=>s+item.resultadoKm.valor,0);
      if(raw.length>0&&correcoes.length===0)throw new Error("Nenhum campo KM_TOTAL localizado no RAW P1. Reprocessamento cancelado.");
      if(somaRaw<=0)throw new Error("Soma KM_TOTAL inválida. Nenhuma atualização foi realizada.");
      for(const {operacao,resultadoKm} of correcoes){
        const kmTotal=resultadoKm.valor;
        const{data,error}=await cliente.from("operacoes").update({km_total:kmTotal}).eq("id",operacao.id).eq("importacao_id",importacao.id).eq("servico","P1").select("id");
        if(error)throw Object.assign(new Error(`Falha ao atualizar P1 em ${importacao.ano}-${String(importacao.mes).padStart(2,"0")}: ${error.message}`),{cause:error});
        if((data||[]).length!==1)throw new Error(`Update não confirmou exatamente uma operação P1 para ${operacao.chave_operacao}.`);
        atualizados+=(data||[]).length;
      }
      const operacoesDepois=await buscarTudoPaginado(()=>cliente.from("operacoes").select("id,km_total").eq("importacao_id",importacao.id).eq("servico","P1").order("id"));
      const somaAntes=operacoesAntes.reduce((s,item)=>s+(normalizarNumero(item.km_total)||0),0),somaDepois=operacoesDepois.reduce((s,item)=>s+(normalizarNumero(item.km_total)||0),0);
      if(Math.abs(somaDepois-somaRaw)>0.000001)throw new Error(`Verificação final divergente na importação ${importacao.id}: RAW ${somaRaw}, operações ${somaDepois}.`);
      const periodo=`${importacao.ano}-${String(importacao.mes).padStart(2,"0")}`;
      const resumo={periodo,importacaoId:importacao.id,registros:raw.length,somaAntes,somaRawCorreta:somaRaw,somaDepois,diferenca:somaRaw-somaAntes,registrosAtualizados:atualizados,...auditoria};resumos.push(resumo);
    }
    window.CCOMetricas?.invalidarCaches?.();window.CCO_CACHE?.limpar?.();window.invalidarCacheEvolucaoExecucaoCCO?.();
    console.table(resumos);
    window.dispatchEvent(new CustomEvent("cco:p1-km-total-reprocessado",{detail:resumos}));
    if(window.CCO_PAGE==="execucao"&&window.__CCO_IMPORTACAO_ATIVA__&&typeof window.carregarPeriodoCCO==="function")await window.carregarPeriodoCCO(window.__CCO_IMPORTACAO_ATIVA__);
    return resumos;
  }

  async function desativarBaseAtual() {
    if(!confirm("Deseja desativar a base atual? O histórico e todos os dados serão preservados."))return false;
    const usuario=await usuarioAutorizado();
    const {error}=await banco().from("importacoes").update({ativa:false,detalhes:{desativada_manualmente_por:usuario.email,desativada_em:new Date().toISOString()}}).eq("ativa",true);
    if(error)throw error;
    delete window.__CCO_CATALOGO_PERIODOS__;delete window.__CCO_IMPORTACOES_POR_PERIODO__;
    if(typeof window.carregarBaseSupabase==="function")await window.carregarBaseSupabase();
    return true;
  }

  function vincular() {
    const antigo=document.getElementById("arquivoExcel");
    if(!antigo || antigo.dataset.importadorPrincipal===BUILD)return;
    const novo=antigo.cloneNode(true);antigo.replaceWith(novo);novo.dataset.importadorPrincipal=BUILD;novo.addEventListener("change",importarPlanilhas);
  }

  window.CCOImportacaoPrincipal=Object.freeze({BUILD,PERIODOS_ALVO,TAMANHO_LOTE_RAW,TAMANHO_LOTE_OPERACOES,TAMANHO_LOTE_ERROS,CAMPOS_PLANILHA_CCO,normalizarCabecalho,normalizarCabecalhoCCO,criarMapaCabecalhosUnicos,obterCampoLiteralCCO,obterCampoOperacionalCCO,preValidarCabecalhosCCO,indexarLinhaPorCabecalho,normalizarNumero,normalizarData,extrairValorOperacionalP9,extrairValorP9,analisarWorkbook,separarPorPeriodo,calcularAcumuladoPeriodo,gerarPainelExecutivoPeriodo,lotesAdaptativos,reprocessarP9Ativos,reprocessarKmTotalP1Ativo,importarArquivo,importarPlanilhas});
  window.reprocessarP9AtivosCCO=reprocessarP9Ativos;
  window.reprocessarP9Ativo=reprocessarP9Ativos;
  window.reprocessarKmTotalP1Ativo=reprocessarKmTotalP1Ativo;
  window.importarPlanilhas=importarPlanilhas;
  window.limparBanco=desativarBaseAtual;
  try{limparBanco=desativarBaseAtual;}catch(_){}
  window.salvarBaseCompletaSupabase=()=>Promise.reject(new Error("Gravação legada desativada. Use o importador principal."));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",vincular,{once:true});else vincular();
})();
