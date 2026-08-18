(function(global){
  "use strict";
  let sequence=0;
  const stable=o=>JSON.stringify(o,Object.keys(o||{}).sort());
  const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(36);};
  function create({plan,datasetVersion,sources=[],values={},rows=[],chartDataset=null,limitations=[],insights=[]}){const evidence={evidenceId:`cco-${Date.now().toString(36)}-${(++sequence).toString(36)}`,datasetVersion:String(datasetVersion||"unknown"),intent:plan.intent,domain:plan.domain,sources,filters:plan.filters,periods:plan.periods,metrics:plan.metrics,values,rows,chartDataset,limitations,insights};return Object.freeze({...evidence,digest:hash(stable({values,rows,chartDataset}))});}
  global.CCOAnalyticsEvidence=Object.freeze({create});
})(window);
