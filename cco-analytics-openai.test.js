const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const edge=fs.readFileSync("supabase/functions/cco-analytics-ai/index.ts","utf8"),front=fs.readFileSync("js/cco-analytics-orchestrator.js","utf8"),validator=fs.readFileSync("js/cco-analytics-validator.js","utf8");
const listeners={},window={console,performance,CCOAnalyticsFormatacao:{escapar:String},CCOAnalyticsValidator:null,document:{readyState:"loading",addEventListener:(n,f)=>listeners[n]=f,getElementById:()=>null}};window.window=window;const sandbox={window,document:window.document,console,performance,setTimeout,clearTimeout};vm.createContext(sandbox);vm.runInContext(validator,sandbox);vm.runInContext(front,sandbox);
const evidence={evidenceId:"ev-124",datasetVersion:"dataset-v1",digest:"digest-a",intent:"consultar_total",domain:"INTERRUPCOES",periods:[{year:2026,month:7}],filters:{services:[],ras:[],shifts:[]},metrics:["ocorrencias"],values:{total:124},rows:[{private:"must-not-leave"}],chartDataset:{values:[124]},insights:[],limitations:[]},fallback={text:"Foram registradas 124 ocorrências.",domain:"INTERRUPCOES",evidenceId:"ev-124",level:"simple"},plan={intent:"consultar_total",domain:"INTERRUPCOES",periods:evidence.periods,filters:evidence.filters,metrics:evidence.metrics};
const validStructured={evidenceId:"ev-124",summary:"Foram registradas 124 ocorrências.",findings:[],attentionPoints:[],conclusion:"",recommendation:"",numbersUsed:[124]};
async function invoke(data,error=null){window.supabaseClient={functions:{invoke:async(_name,request)=>({data,error,request})}};return window.CCOAnalyticsLLM.optionalLLM("Quantas ocorrências?",plan,fallback,evidence);}
(async()=>{
  let count=0,test=async(name,fn)=>{await fn();count++;};
  await test("valid response",async()=>assert.equal((await invoke({mode:"openai",fallbackUsed:false,evidenceId:"ev-124",structured:validStructured})).llm,true));
  for(const [name,data,error] of [["missing key",{fallbackUsed:true,reason:"missing_api_key"}], ["disabled",{fallbackUsed:true,reason:"llm_disabled"}], ["timeout",null,new Error("timeout")], ["429",{fallbackUsed:true,reason:"rate_limited"}], ["500",{fallbackUsed:true,reason:"openai_server_error"}], ["invalid json",{fallbackUsed:true,reason:"invalid_openai_json"}], ["empty",{mode:"openai",evidenceId:"ev-124",structured:null}]])await test(name,async()=>assert.equal((await invoke(data,error)).llm,undefined));
  await test("invented number",async()=>assert.equal((await invoke({mode:"openai",fallbackUsed:false,evidenceId:"ev-124",structured:{...validStructured,summary:"Foram 125 ocorrências.",numbersUsed:[125]}})).llm,undefined));
  await test("wrong percent",async()=>assert.equal((await invoke({mode:"openai",fallbackUsed:false,evidenceId:"ev-124",structured:{...validStructured,summary:"A taxa foi 99%.",numbersUsed:[99]}})).llm,undefined));
  await test("wrong evidence",async()=>assert.equal((await invoke({mode:"openai",fallbackUsed:false,evidenceId:"wrong",structured:{...validStructured,evidenceId:"wrong"}})).llm,undefined));
  await test("validator approve",async()=>assert.equal(window.CCOAnalyticsValidator.validate({...fallback,text:"Total: 124."},evidence).valid,true));
  await test("validator reject",async()=>assert.equal(window.CCOAnalyticsValidator.validate({...fallback,text:"Total: 999."},evidence).valid,false));
  await test("fallback preserved",async()=>assert.deepEqual(await invoke({fallbackUsed:true}),fallback));
  await test("sanitization",async()=>{const compact=window.CCOAnalyticsLLM.compactEvidence(evidence);assert.equal(compact.rows,undefined);assert.equal(compact.chartDataset,undefined);});
  await test("no frontend key",async()=>assert.doesNotMatch(front,/Deno\.env|get\("OPENAI_API_KEY"\)|Bearer\s+\$\{.*OPENAI/));
  await test("no literal secret",async()=>assert.doesNotMatch(front+edge,/sk-[A-Za-z0-9_-]{16,}/));
  await test("cache tuple",async()=>{for(const x of ["datasetVersion","digest","normalizeQuestion(question)","responseMode","model"])assert.match(edge,new RegExp(x.replace(/[()]/g,"\\$&")));});
  await test("new dataset separates cache",async()=>assert.match(edge,/evidence\.datasetVersion/));
  await test("follow-up compact plan",async()=>assert.deepEqual(plan.periods,[{year:2026,month:7}]));
  assert.match(edge,/Deno\.env\.get\("OPENAI_API_KEY"\)/);assert.match(edge,/Deno\.env\.get\("OPENAI_MODEL"\)/);assert.match(edge,/Deno\.env\.get\("CCO_LLM_ENABLED"\)/);assert.match(edge,/AbortController/);assert.match(edge,/api\.openai\.com\/v1\/responses/);assert.match(edge,/type:"json_schema"/);assert.match(edge,/strict:true/);assert.doesNotMatch(edge,/console\.(?:log|error)\([^\n]*apiKey/);
  console.log(`CCO Analytics OpenAI: ${count} cenários mockados aprovados; nenhuma chamada real executada.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
