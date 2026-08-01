const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const fonte=fs.readFileSync("services/painelService.js","utf8");
const utils=fs.readFileSync("utils.js","utf8");
const execucao=fs.readFileSync("execucao.js","utf8");
const periodos=["2026-07","2026-06","2026-05","2026-04","2026-03","2026-02","2026-01","2025-12","2025-11"];

function criarContexto({falharRpc=false}={}){
  let chamadasRpc=0,consultasOperacoes=0;
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
    dias_operacao:[]
  };
  function query(tabela){
    if(tabela==="operacoes")consultasOperacoes+=1;
    const q={select(){return q},not(){return q},order(){return q},limit(){return q},gt(){return q},then(resolve){resolve({data:consultas[tabela]||[],error:null})}};
    return q;
  }
  const cliente={rpc:async()=>{chamadasRpc+=1;return falharRpc?{data:null,error:{code:"PGRST202"}}:{data:dadosRpc,error:null}},from:tabela=>query(tabela)};
  const window={CCOCache:cache,CCOSupabase:{getClient:()=>cliente,paginar:async produtor=>(await produtor()).data||[]}};
  const contexto={window,performance:{now:()=>0},console:{log(){},warn(){},error(){},table(){}}};
  vm.createContext(contexto);vm.runInContext(fonte,contexto);
  return{window,get chamadasRpc(){return chamadasRpc},get consultasOperacoes(){return consultasOperacoes}};
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

  const fallback=criarContexto({falharRpc:true});
  const catalogoFallback=await fallback.window.CCOPainelService.getCatalogoPeriodos();
  assert.equal(fallback.chamadasRpc,1);
  assert.equal(fallback.consultasOperacoes,1,"fallback pesado deve executar uma única vez após falha da RPC");
  assert.equal(catalogoFallback[0].periodo,"2026-07");
  assert.equal(fallback.window.__CCO_CONTADOR_CATALOGO__.paginacaoCompleta,1);

  assert.match(fonte,/rpc\("cco_catalogo_periodos"\)/);
  assert.match(fonte,/\[CATÁLOGO\] fallback pesado ativado/);
  assert.match(fonte,/CCO_DEBUG_PAGINACAO===true/);
  assert.match(utils,/CCOPainelService\?\.getCatalogoPeriodos/);
  const legado=utils.match(/async function carregarCatalogoPeriodosV12[\s\S]*?(?=\n\s*async function obterImportacaoPrincipal)/)?.[0]||"";
  assert.doesNotMatch(legado,/from\(['"]operacoes['"]\)/);
  assert.match(execucao,/CCOPainelService\.getCatalogoPeriodos\(\)/);
  console.log("Catálogo RPC: Promise única, nove períodos, cache e fallback controlado aprovados.");
})().catch(error=>{console.error(error);process.exitCode=1});
