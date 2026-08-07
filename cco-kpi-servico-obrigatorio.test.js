const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

const html=fs.readFileSync("kpi.html","utf8");
const kpi=fs.readFileSync("kpi.js","utf8");
const utils=fs.readFileSync("utils.js","utf8");
const service=fs.readFileSync("services/kpiService.js","utf8");
const fixes=fs.readFileSync("cco-fixes.js","utf8");
const blocoSelect=html.slice(html.indexOf('<select id="filtroKpiServico">'),html.indexOf("</select>",html.indexOf('<select id="filtroKpiServico">'))+9);
const oficiais=["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];

assert.doesNotMatch(blocoSelect,/Todos os serviços|value=""/i);
assert.deepEqual([...blocoSelect.matchAll(/option value="([^"]+)"/g)].map(item=>item[1]),oficiais);

const memoria=new Map(),armazenamento={getItem:chave=>memoria.get(chave)||"",setItem:(chave,valor)=>memoria.set(chave,valor)};
const document={hidden:false,readyState:"loading",getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
const window={innerWidth:1200,location:{search:""},localStorage:armazenamento,sessionStorage:armazenamento,addEventListener(){},matchMedia:()=>({matches:false}),visualViewport:null};
const contexto={window,document,console:{log(){},warn(){},error(){},table(){}},performance:{now:()=>0},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout(){},Symbol,Map,Set,WeakMap,Math,Number,String,Array,Object,decodeURIComponent};
vm.runInContext(kpi,vm.createContext(contexto));

memoria.clear();assert.equal(window.CCOObterServicoKPIObrigatorio(""),"P1");
memoria.set("cco:kpi:servico","P9");assert.equal(window.CCOObterServicoKPIObrigatorio("P1"),"P9");
for(const invalido of["Todos os serviços","todos","all","","P99"]){memoria.clear();memoria.set("cco:kpi:servico",invalido);assert.equal(window.CCOObterServicoKPIObrigatorio(""),"P1",`${invalido||"vazio"} deve virar P1`);}
for(const codigo of oficiais)assert.equal(window.CCONormalizarServicoKPIObrigatorio(codigo),codigo);

const inicioFiltro=utils.indexOf("function carregarFiltrosKpiServicoCompleto()");
const fimFiltro=utils.indexOf("function ccoKpiMensalFiltrado",inicioFiltro);
const filtroFonte=utils.slice(inicioFiltro,fimFiltro);
assert.doesNotMatch(filtroFonte,/selectServico\.innerHTML[^\n]*(?:Todos os serviços|option value="")/);
assert.match(filtroFonte,/CCOObterServicoKPIObrigatorio/);
assert.match(utils,/item\.servico !== servico/,"dados KPI devem ser sempre filtrados por um serviço");
assert.match(utils,/item\.servico === servico/,"mensal KPI não pode executar agregado");
assert.match(service,/servico=SERVICOS_VALIDOS\.has\(normalizado\)\?normalizado:"P1"/);
assert.match(service,/consulta = consulta\.eq\("servico", servico\)/,"Supabase deve receber serviço válido");
assert.match(service,/\["kpi",ano\|\|"",mes\|\|"",servico,importacaoId\|\|"",dia\]/,"cache deve incluir período, serviço obrigatório, importação e dia");
assert.match(fixes,/servico:servicoKpi/);

assert.match(html,/services\/kpiService\.js\?v=20260806-kpi-init-mes-sincronizado-v2/);
assert.match(html,/utils\.js\?v=20260806-kpi-init-mes-sincronizado-v2/);
assert.match(html,/cco-fixes\.js\?v=20260806-kpi-init-mes-sincronizado-v2/);
assert.match(html,/kpi\.js\?v=20260806-kpi-producao-altura-v2/);
assert.match(html,/id="filtroKpiAno"[\s\S]*Todos os anos/);
assert.match(html,/id="filtroKpiMes"[\s\S]*Todos os meses/);
assert.match(html,/id="filtroKpiDia"[\s\S]*Todos os dias/);

console.log("KPI serviço obrigatório: opções, preferência, P1, consulta, cache e isolamento aprovados.");
