(function(global){
  "use strict";
  const initial=()=>({domain:null,intent:null,metrics:[],periods:[],filters:{services:[],ras:[],shifts:[]},lastEvidence:null,history:[]});
  let state=initial();
  function snapshot(){return JSON.parse(JSON.stringify(state));}
  function update(plan,evidence){state={...state,domain:plan.domain,intent:plan.intent,metrics:[...plan.metrics],periods:plan.periods.map(x=>({...x})),filters:JSON.parse(JSON.stringify(plan.filters)),lastEvidence:evidence||state.lastEvidence,history:[...state.history,{question:plan.question,domain:plan.domain,intent:plan.intent}].slice(-20)};return snapshot();}
  function reset(){state=initial();global.CCOAIChat?.limpar?.();return snapshot();}
  global.CCOAnalyticsContext=Object.freeze({get:snapshot,update,reset});
})(window);
