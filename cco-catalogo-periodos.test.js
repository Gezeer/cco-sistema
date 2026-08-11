const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const fonte=fs.readFileSync("services/painelService.js","utf8");
const utils=fs.readFileSync("utils.js","utf8");
const execucao=fs.readFileSync("execucao.js","utf8");
const periodos=["2026-07","2026-06","2026-05","2026-04","2026-03","2026-02","2026-01","2025-12","2025-11"];

function criarContexto({falharRpc=false,rpcError=null}={}){
  let chamadasRpc=0,consultasOperacoes=0,consultasDias=0,consultasFallback=0;
  const memoria=new Map(),pendentes=new Map();
  const cache={
    chave:(ns,partes)=>`${ns}:${partes.join(":")}`,
    get:chave=>memoria.get(chave),
    invalidar(ns){for(const chave of memoria.keys())if(chave.startsWith(ns))memoria.delete(chave);},
    async lembrar(chave,produtor){if(memoria.has(chave))return memoria.get(chave);if(pendentes.has(chave))return pendentes.get(chave);const promessa=Promise.resolve().then(produtor).then(valor=>(memoria.set(chave,valor),valor));pendentes.set(chave,promessa);try{return await promessa}finally{pendentes.delete(chave)}}
  };
  const dadosRpc=periodos.map((periodo,indice)=>({ano:Number(periodo.slice(0,4)),mes:Number(periodo.slice(5)),periodo,importacao_id:`00000000-0000-0000-0000-${String(indice+1).padStart(12,"0")}`}));
  const consultas={
    operacoes:[{id:1,importacao_id:"fallback",data_operacao:"2026-07-01"}],
    importacoes:[{id:"fallback",ano:2026,mes:7,status:"concluida",ativa:true}],
    v_catalogo_periodos:dadosRpc,
    dias_operacao:[]
  };
  function query(tabela){
    if(tabela==="operacoes")consultasOperacoes+=1;
    if(tabela==="dias_operacao")consultasDias+=1;
    if(tabela==="v_catalogo_periodos")consultasFallback+=1;
    const q={select(){return q},not(){return q},order(){return q},limit(){return q},gt(){return q},in(){return q},then(resolve){resolve({data:consultas[tabela]||[],error:null})}};
    return q;
  }
  const cliente={rpc:async()=>{chamadasRpc+=1;return falharRpc||rpcError?{data:null,error:rpcError||{code:"PGRST202"}}:{data:dadosRpc,error:null}},from:tabela=>query(tabela)};
  const window={CCOCache:cache,CCOSupabase:{getClient:()=>cliente,paginar:async produtor=>(await produtor()).data||[]}};
  const contexto={window,performance:{now:()=>0},console:{log(){},warn(){},error(){},table(){}},setTimeout,clearTimeout,AbortController};
  vm.createContext(contexto);vm.runInContext(fonte,contexto);
  return{window,get chamadasRpc(){return chamadasRpc},get consultasOperacoes(){return consultasOperacoes},get consultasDias(){return consultasDias},get consultasFallback(){return consultasFallback}};
}

(async()=>{
  const normal=criarContexto(),servico=normal.window.CCOPainelService;
  const promessaA=servico.getCatalogoPeriodos(),promessaB=servico.getCatalogoPeriodos();
  assert.strictEqual(promessaA,promessaB,"consumidores devem compartilhar exatamente a mesma Promise");
  const[catalogoA,catalogoB]=await Promise.all([promessaA,promessaB]);
  assert.strictEqual(catalogoA,catalogoB);
  assert.equal(normal.chamadasRpc,1);
  assert.equal(normal.consultasOperacoes,0,"fluxo normal não pode baixar operacoes");
  assert.equal(catalogoA.length,9);
  assert.equal(catalogoA[0].periodo,"2026-07","mês inexistente não pode ser selecionado");
  assert.ok(catalogoA.some(item=>item.periodo==="2025-11"));
  assert.ok(catalogoA.some(item=>item.periodo==="2025-12"));
  await servico.getCatalogoPeriodos();
  assert.equal(normal.chamadasRpc,1,"troca de consumidor deve reutilizar catálogo em memória");
  assert.equal(normal.window.__CCO_CONTADOR_CATALOGO__.paginacaoCompleta,0);
  assert.equal(normal.window.__CCO_CONTADOR_CATALOGO__.promiseCompartilhada,true);
  assert.equal(normal.consultasDias,1,"dias_operacao deve executar uma única consulta no boot");

  const cacheDias=criarContexto(),catalogoDias=periodos.slice(0,2).map((periodo,indice)=>({periodo,ano:Number(periodo.slice(0,4)),mes:Number(periodo.slice(5)),importacao_id:`dias-${indice}`}));
  const[diasA,diasB]=await Promise.all([cacheDias.window.CCOPainelService.carregarDiasOperacao(catalogoDias),cacheDias.window.CCOPainelService.carregarDiasOperacao([...catalogoDias].reverse())]);
  assert.strictEqual(diasA,diasB,"consultas concorrentes de dias devem compartilhar a mesma Promise/cache");assert.equal(cacheDias.consultasDias,1);
  await cacheDias.window.CCOPainelService.carregarDiasOperacao(catalogoDias);assert.equal(cacheDias.consultasDias,1,"cache quente de dias não pode consultar novamente");

  const falha=criarContexto({falharRpc:true});
  await assert.rejects(falha.window.CCOPainelService.getCatalogoPeriodos(),/Falha na RPC cco_catalogo_periodos/);
  assert.equal(falha.chamadasRpc,1);
  assert.equal(falha.consultasOperacoes,0,"falha da RPC não pode ativar paginação de operacoes");
  assert.equal(falha.window.__CCO_CONTADOR_CATALOGO__.paginacaoCompleta,0);

  const timeout=criarContexto({rpcError:{code:"57014",message:"canceling statement due to statement timeout"}}),catalogoFallback=await timeout.window.CCOPainelService.getCatalogoPeriodos();
  assert.equal(catalogoFallback.length,9,"timeout deve usar o catálogo leve sem perder períodos");
  assert.equal(catalogoFallback[0].periodo,"2026-07");
  assert.equal(timeout.consultasOperacoes,0,"timeout não pode paginar operacoes");
  assert.equal(timeout.consultasFallback,1,"timeout deve fazer somente uma consulta de fallback leve");
  assert.equal(timeout.window.__CCO_CONTADOR_CATALOGO__.paginacaoCompleta,0);

  assert.match(fonte,/rpc\("cco_catalogo_periodos"\)/);
  assert.match(fonte,/\[CATÁLOGO RPC\]/);
  assert.doesNotMatch(fonte,/from\("operacoes"\)/,"service de catálogo não pode consultar operacoes");
  assert.match(utils,/CCOPainelService\?\.getCatalogoPeriodos/);
  const legado=utils.match(/async function carregarCatalogoPeriodosV12[\s\S]*?(?=\n\s*async function obterImportacaoPrincipal)/)?.[0]||"";
  assert.doesNotMatch(legado,/from\(['"]operacoes['"]\)/);
  assert.match(execucao,/CCOPainelService\.getCatalogoPeriodos\(\)/);
  const sql=fs.readFileSync("supabase_cco_catalogo_periodos.sql","utf8");
  const corpoFuncao=sql.match(/create or replace function[\s\S]*?\$\$;\s*\n\s*grant execute/i)?.[0]||"";
  assert.doesNotMatch(corpoFuncao,/row_number\s*\(/i);
  assert.doesNotMatch(corpoFuncao,/select\s+distinct/i);
  assert.match(sql,/max\(o\.id\)/i);
  assert.match(sql,/group by[\s\S]*extract\(year[\s\S]*extract\(month/i);
  assert.match(sql,/operacoes_catalogo_ano_mes_id_idx/);
  assert.match(sql,/include \(importacao_id\)/i);
  console.log("Catálogo RPC: Promise única, nove períodos e fallback pesado restrito ao timeout aprovados.");
})().catch(error=>{console.error(error);process.exitCode=1});
