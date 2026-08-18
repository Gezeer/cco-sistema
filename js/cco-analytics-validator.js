(function(global){
  "use strict";
  const nums=v=>String(v||"").replace(/\b\d{2}\/\d{2}(?:\/\d{4})?\b/g,"").replace(/\b\d{4}-\d{2}-\d{2}\b/g,"").match(/-?\d[\d.]*([,]\d+)?\s*%?/g)||[];
  const parse=v=>Number(String(v).replace(/\./g,"").replace(",",".").replace(/%/,""));
  function allowed(e){const out=[];const walk=v=>{if(typeof v==="number"&&Number.isFinite(v))out.push(v);else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==="object")Object.values(v).forEach(walk);};walk(e.values);walk(e.rows);walk(e.insights);return out;}
  function close(a,b){return Math.abs(a-b)<=Math.max(0.011,Math.abs(b)*0.00011);}
  function validate(response,evidence){const errors=[],values=allowed(evidence);for(const token of nums(response.text)){const n=parse(token);if(!Number.isFinite(n))continue;if(/\b20\d{2}\b/.test(token)||n>=1&&n<=12&&evidence.periods.some(p=>p.month===n))continue;if(!values.some(v=>close(n,v)))errors.push(`Número sem evidência: ${token.trim()}`);}for(const value of response.numbersUsed||[])if(!values.some(v=>close(Number(value),v)))errors.push(`numbersUsed sem evidência: ${value}`);const chart=evidence.chartDataset;if(chart){const chartValues=[];(chart.series||[]).forEach(s=>(s.values||[]).forEach(v=>chartValues.push(v)));if(chart.values)chart.values.forEach(v=>chartValues.push(v));if(chartValues.some(v=>!values.some(x=>close(Number(v),x))))errors.push("Gráfico contém valor ausente da evidência.");}if(response.domain!==evidence.domain)errors.push("Domínio da resposta divergente.");if(response.evidenceId!==evidence.evidenceId)errors.push("Resposta não vinculada à evidência.");return{valid:errors.length===0,errors};}
  function assert(response,evidence){const result=validate(response,evidence);if(!result.valid){const e=new Error(`Resposta bloqueada pelo validador: ${result.errors.join(" ")}`);e.validation=result;throw e;}return result;}
  global.CCOAnalyticsValidator=Object.freeze({validate,assert});
})(window);
