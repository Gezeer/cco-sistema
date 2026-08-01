(function criarPainelService(global) {
  "use strict";
  const TTL = 5 * 60 * 1000;
  const db = () => { const cliente=global.CCOSupabase?.getClient?.();if(!cliente)throw new Error("Supabase indisponível.");return cliente; };
  const validarId = id => { if (!id) throw new Error("importacao_id é obrigatório."); return String(id); };
  const diasOperacaoCache=new Map();

  function montarCatalogoPorOperacoes(operacoes,importacoes) {
    const importacoesPorId=new Map((importacoes||[]).map(item=>[String(item.id),item])),candidatos=new Map();
    for(const operacao of operacoes||[]){
      const data=String(operacao.data_operacao||"").slice(0,10),match=data.match(/^(\d{4})-(\d{2})-\d{2}$/);
      if(!match||!operacao.importacao_id)continue;
      const ano=Number(match[1]),mes=Number(match[2]),periodo=`${ano}-${String(mes).padStart(2,"0")}`,importacao=importacoesPorId.get(String(operacao.importacao_id))||{id:operacao.importacao_id};
      const lista=candidatos.get(periodo)||new Map();
      lista.set(String(operacao.importacao_id),{...importacao,id:operacao.importacao_id,ano,mes,periodo});
      candidatos.set(periodo,lista);
    }
    const pontuar=item=>Number(["concluida","concluida_com_avisos"].includes(item.status))*4+Number(Boolean(item.ativa))*2+Number(Number(item.ano)>0&&Number(item.mes)>0);
    return[...candidatos].map(([,porImportacao])=>[...porImportacao.values()].sort((a,b)=>pontuar(b)-pontuar(a)||String(b.concluido_em||b.criado_em||"").localeCompare(String(a.concluido_em||a.criado_em||"")))[0])
      .map(item=>({...item,importacao_id:item.id,origem:"operacoes.data_operacao"}))
      .sort((a,b)=>b.ano-a.ano||b.mes-a.mes);
  }

  async function paginarOperacoesCatalogo(tamanhoPagina=1000) {
    const resultado=[];
    let ultimoId=null,offsetLogico=0;
    for(;;){
      let consulta=db().from("operacoes").select("id,importacao_id,data_operacao")
        .not("data_operacao","is",null).order("id",{ascending:true}).limit(tamanhoPagina);
      if(ultimoId!==null)consulta=consulta.gt("id",ultimoId);
      const{data,error}=await consulta;
      if(error)throw error;
      const lote=data||[];
      resultado.push(...lote);
      console.log("[PAGINAÇÃO]",{offset:offsetLogico,quantidadeRetornada:lote.length,totalAcumulado:resultado.length});
      if(lote.length===0||lote.length<tamanhoPagina)return resultado;
      const proximoId=lote.at(-1)?.id;
      if(proximoId===null||proximoId===undefined||String(proximoId)===String(ultimoId))throw new Error("Paginação de operacoes sem avanço da chave id.");
      ultimoId=proximoId;
      offsetLogico+=lote.length;
    }
  }

  async function catalogo() {
    const chave = global.CCOCache.chave("periodos", ["operacoes-data-v2"]);
    const catalogoCache=await global.CCOCache.lembrar(chave, async () => {
      console.log("[CATÁLOGO] consulta executada",{
        operacoes:"select id,importacao_id,data_operacao; data_operacao not null; paginação incremental por id",
        importacoes:"select metadados; sem filtro ativa/ativo; paginação completa"
      });
      const[operacoes,importacoes,diasOperacao]=await Promise.all([
        paginarOperacoesCatalogo(),
        global.CCOSupabase.paginar(()=>db().from("importacoes").select("id,ano,mes,nome_arquivo,status,ativa,concluido_em,criado_em").order("criado_em",{ascending:false})),
        global.CCOSupabase.paginar(()=>db().from("dias_operacao").select("importacao_id,ano,mes,total_dias").order("ano",{ascending:false}).order("mes",{ascending:false}))
      ]);
      const resultado=montarCatalogoPorOperacoes(operacoes,importacoes);
      diasOperacaoCache.clear();
      for(const item of diasOperacao||[]){
        const periodo=`${Number(item.ano)}-${String(Number(item.mes)).padStart(2,"0")}`;
        if(item.importacao_id)diasOperacaoCache.set(`${item.importacao_id}|${periodo}`,Number(item.total_dias)||0);
        if(!diasOperacaoCache.has(periodo))diasOperacaoCache.set(periodo,Number(item.total_dias)||0);
      }
      console.log("[CATÁLOGO] períodos encontrados",resultado.map(item=>item.periodo));
      console.table(resultado.map(item=>({periodo:item.periodo,importacao_id:item.importacao_id,status:item.status||null,ativa:Boolean(item.ativa),origem:item.origem})));
      console.log("[CATÁLOGO] origem dos períodos","operacoes.data_operacao",{operacoesLidas:operacoes.length,importacoesLidas:importacoes.length});
      return resultado;
    }, TTL);
    if(!diasOperacaoCache.size){
      const diasOperacao=await global.CCOSupabase.paginar(()=>db().from("dias_operacao").select("importacao_id,ano,mes,total_dias").order("ano",{ascending:false}).order("mes",{ascending:false}));
      for(const item of diasOperacao||[]){
        const periodo=`${Number(item.ano)}-${String(Number(item.mes)).padStart(2,"0")}`;
        if(item.importacao_id)diasOperacaoCache.set(`${item.importacao_id}|${periodo}`,Number(item.total_dias)||0);
        if(!diasOperacaoCache.has(periodo))diasOperacaoCache.set(periodo,Number(item.total_dias)||0);
      }
    }
    return catalogoCache;
  }
  const getCatalogoPeriodos=()=>catalogo();
  function obterDiasOperacao(ano,mes,importacaoId=null){
    const periodo=`${Number(ano)}-${String(Number(mes)).padStart(2,"0")}`;
    return Number((importacaoId&&diasOperacaoCache.get(`${importacaoId}|${periodo}`))??diasOperacaoCache.get(periodo)??0);
  }
  async function ultimoPeriodo() { return (await catalogo())[0] || null; }
  async function porImportacao(importacaoId) {
    const id = validarId(importacaoId), chave = global.CCOCache.chave("painel", [id]);
    console.log("[P9 FLUXO LEITURA porImportacao]",{importacaoId:id,chaveCache:chave,fonte:"CCOCache.lembrar → painel_executivo",stack:new Error().stack});
    return global.CCOCache.lembrar(chave, async () => {
      const { data, error } = await db().from("painel_executivo").select("id,importacao_id,numero_linha,ano,mes,servico,descricao,nome_servico,medicao,previsto,acumulado,valor_unitario,valor_total,dias_acumulados,total_dias_mes,dados").eq("importacao_id", id).order("numero_linha");
      if (error) throw error;
      const p9=(data||[]).find(item=>String(item.servico||"").trim().toUpperCase()==="P9");
      console.log("[P9 PRIMEIRA LEITURA porImportacao]",{arquivo:"services/painelService.js",funcao:"porImportacao",origem:"painel_executivo.acumulado",importacaoId:id,linhaP9:p9,acumulado:p9?.acumulado??null,stack:new Error().stack});
      if(p9)global.CCODiagnosticoP9Etapa?.("services/painelService.js:porImportacao → painel_executivo.acumulado",p9.acumulado,"leitura direta da coluna painel_executivo.acumulado");
      return data || [];
    }, TTL);
  }
  async function p9PorPeriodo(importacaoId,ano,mes) {
    console.log("[P9 FLUXO LEITURA p9PorPeriodo]",{importacaoId,ano:Number(ano),mes:Number(mes),fonte:"painel_executivo",cacheLocal:false,stack:new Error().stack});
    const id=validarId(importacaoId),{data,error}=await db().from("painel_executivo")
      .select("id,importacao_id,numero_linha,ano,mes,servico,descricao,nome_servico,medicao,previsto,acumulado,valor_unitario,valor_total,dias_acumulados,total_dias_mes,dados")
      .eq("importacao_id",id).eq("ano",Number(ano)).eq("mes",Number(mes)).eq("servico","P9").maybeSingle();
    if(error)throw error;
    console.log("[P9 PRIMEIRA LEITURA p9PorPeriodo]",{arquivo:"services/painelService.js",funcao:"p9PorPeriodo",origem:"painel_executivo.acumulado",importacaoId:id,periodo:`${Number(ano)}-${String(Number(mes)).padStart(2,"0")}`,linhaP9:data,acumulado:data?.acumulado??null,stack:new Error().stack});
    if(data)global.CCODiagnosticoP9Etapa?.("services/painelService.js:p9PorPeriodo → painel_executivo.acumulado",data.acumulado,"leitura direta da coluna painel_executivo.acumulado");
    return data||null;
  }
  global.CCOPainelService = Object.freeze({ catalogo, getCatalogoPeriodos, ultimoPeriodo, porImportacao, p9PorPeriodo, obterDiasOperacao, montarCatalogoPorOperacoes, paginarOperacoesCatalogo });
})(window);
