const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const contexto = {
  window: {},
  document: { readyState:"loading",addEventListener() {},getElementById() { return null; } },
  console,
  Blob,
  crypto:globalThis.crypto,
  CustomEvent:function CustomEvent() {}
};
contexto.window.window=contexto.window;
vm.createContext(contexto);
vm.runInContext(fs.readFileSync("js/cco-p1-km-total.js","utf8"),contexto);
vm.runInContext(fs.readFileSync("cco-importacao-principal.js","utf8"),contexto);

const api=contexto.window.CCOImportacaoPrincipal;
assert.equal(api.ehAbaP9CatacaoAreaVerde("Catação Em Área Verde"),true);
assert.equal(api.ehAbaP9CatacaoAreaVerde("P8"),false);
contexto.XLSX={utils:{sheet_to_json:folha=>folha}};
const workbookP9={
  SheetNames:["Catação Em Área Verde"],
  Sheets:{"Catação Em Área Verde":[
    ["Data","Equipe","Descrição","Nome Serviço"],
    ["01/07/2026",4,"Catação Em Área Verde","Catação Em Área Verde"]
  ]}
};
const resultadoP9=api.analisarWorkbook(workbookP9,"p9.xlsx");
assert.equal(resultadoP9.operacoes.length,1);
assert.equal(resultadoP9.operacoes[0].servico,"P9");
assert.equal(resultadoP9.operacoes[0].aba,"P9");
assert.equal(resultadoP9.operacoes[0].valor_original.descricao,"Catação Em Área Verde");
assert.equal(resultadoP9.operacoes[0].valor_original.nome_servico,"Catação Em Área Verde");
assert.equal(resultadoP9.raw[0].dados_originais._aba_original,"Catação Em Área Verde");
const cabecalhos=api.criarMapaCabecalhosUnicos(["KM Total","Km_Total","Km Executado","Km Executado (%)"]);
assert.deepEqual(
  cabecalhos.map(item=>({indice:item.indice,literal:item.literal,normalizado:item.normalizado,chave:item.chave})),
  [
    {indice:0,literal:"KM Total",normalizado:"km_total",chave:"km_total"},
    {indice:1,literal:"Km_Total",normalizado:"km_total",chave:"km_total_2"},
    {indice:2,literal:"Km Executado",normalizado:"km_executado",chave:"km_executado"},
    {indice:3,literal:"Km Executado (%)",normalizado:"km_executado",chave:"km_executado_2"}
  ]
);

const original={"KM Total":69,"Km_Total":66.9};
const normalizado={km_total:69,km_total_2:66.9};
assert.deepEqual(
  {...api.obterCampoOperacionalCCO("P1",original,normalizado)},
  {valor:66.9,campo:"Km_Total",fonte:"original"}
);
assert.deepEqual(
  {...api.obterCampoOperacionalCCO("P1",{},normalizado,{Km_Total:"km_total_2"})},
  {valor:66.9,campo:"km_total_2",fonte:"normalizada"}
);
assert.equal(api.obterCampoOperacionalCCO("P1",{"KM Total":69},{km_total:69}).valor,null);
const workbookP1={
  SheetNames:["P1"],
  Sheets:{P1:[
    ["Data","KM Total","Km_Total"],
    ["01/07/2026",100,25],
    ["02/07/2026",200,30]
  ]}
};
const resultadoP1=api.analisarWorkbook(workbookP1,"p1.xlsx");
assert.equal(resultadoP1.operacoes.map(item=>item.km_total).join(","),"25,30");
assert.equal(resultadoP1.operacoes.reduce((s,item)=>s+item.km_total,0),55);
assert.equal(resultadoP1.raw[0].dados.km_total,100);
assert.equal(resultadoP1.raw[0].dados.km_total_2,25);
assert.equal(resultadoP1.raw[0].dados.cabecalho_origem_km_total,"Km_Total");
assert.equal(resultadoP1.raw[0].dados.chave_origem_km_total,"km_total_2");

const p5Original={"Km Executado":41,"Km Executado (%)":92};
assert.equal(api.obterCampoOperacionalCCO("P5",p5Original,{}).valor,41);
const p6Original={"Total Pagamento - KM":1234,"Total Pagamento - KM (%)":88};
assert.equal(api.obterCampoOperacionalCCO("P6",p6Original,{}).valor,1234);
const relatorioP5=api.preValidarCabecalhosCCO("P5","P5",[
  {ordem:0,original:"Km Executado",normalizado:"km_executado",chave:"km_executado"},
  {ordem:1,original:"Km Executado (%)",normalizado:"km_executado",chave:"km_executado_2"}
]);
assert.equal(relatorioP5.camposOficiaisLocalizados[0].chave,"km_executado");
assert.equal(relatorioP5.camposOficiaisLocalizados[0].percentualChave,"km_executado_2");
assert.throws(()=>api.preValidarCabecalhosCCO("P1","P1",[
  {ordem:0,original:"KM Total",normalizado:"km_total",chave:"km_total"}
]),/Pré-validação/);
const diasDeduplicados=api.deduplicarDiasOperacao([
  {ano:2026,mes:7,total_dias:26,dados:{linha:1}},
  {ano:2026,mes:7,total_dias:27,dados:{linha:2}}
],"importacao-teste");
assert.equal(diasDeduplicados.payload.length,1);
assert.equal(diasDeduplicados.duplicidades.length,1);
assert.equal(diasDeduplicados.payload[0].total_dias,27);
assert.equal(api.detectarChaveUnicaDiasOperacao({
  status:409,
  error:{code:"23505",details:null,message:'duplicate key value violates unique constraint "dias_operacao_ano_mes_unique"'}
}),"ano,mes");
assert.equal(api.detectarChaveUnicaDiasOperacao({
  status:409,
  error:{code:"23505",details:"Key (importacao_id, ano, mes)=(x, 2026, 7) already exists."}
}),"importacao_id,ano,mes");

async function testarFallbackDiasOperacao() {
  const chamadas=[];
  contexto.window.supabaseClient={
    from(tabela){
      assert.equal(tabela,"dias_operacao");
      return{upsert(payload,opcoes){
        chamadas.push({payload,opcoes});
        return{select:async()=>chamadas.length===1
          ?{data:null,status:409,statusText:"Conflict",error:{code:"23505",constraint:null,details:null,hint:null,message:'duplicate key value violates unique constraint "dias_operacao_ano_mes_unique"'}}
          :{data:payload,status:201,statusText:"Created",error:null}};
      }};
    }
  };
  const resultado=await api.gravarDiasOperacao([{ano:2026,mes:7,total_dias:26,dados:{origem:"teste"}}],"importacao-teste");
  assert.equal(chamadas.length,2);
  assert.equal(chamadas[0].opcoes.onConflict,"importacao_id,ano,mes");
  assert.equal(chamadas[1].opcoes.onConflict,"ano,mes");
  assert.equal(resultado.fallback,true);
  assert.equal(resultado.chaveUsada,"ano,mes");
}

testarFallbackDiasOperacao().then(()=>{
  const painelGeral=fs.readFileSync("painel-geral.js","utf8");
  assert.match(painelGeral,/colunas:"aba,dados,dados_originais".*coluna:"importacao_id".*coluna:"aba",valor:"P9"/s);
  assert.match(painelGeral,/colunas:"id,dados".*coluna:"importacao_id".*coluna:"aba",valor:"P9"/s);
  console.log("Importador CCO: cabeçalhos únicos, campos literais e fallback de dias_operacao aprovados.");
}).catch(error=>{
  console.error(error);
  process.exitCode=1;
});
