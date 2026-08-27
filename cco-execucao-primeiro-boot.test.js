const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const execucao=fs.readFileSync("execucao.js","utf8");
const utils=fs.readFileSync("utils.js","utf8");

test("primeiro acesso frio tem um dono, seleciona P1 e chama o histórico explicitamente",()=>{
  assert.match(execucao,/__CCO_EXEC_BOOT_EM_ANDAMENTO__=true/);
  assert.match(execucao,/__CCO_EXEC_BOOT_COUNT__\+=1/);
  assert.match(execucao,/selecionarP1InicialExecucaoCCO\(\)/);
  assert.match(execucao,/renderDetalheServicoMensal\?\.\(codigo,contexto\);await renderizarEvolucaoHistoricaCCO\(codigo\)/);
  assert.match(execucao,/finally \{\s*window\.__CCO_EXEC_BOOT_EM_ANDAMENTO__=false/);
  assert.match(utils,/__CCO_EXEC_BOOT_EM_ANDAMENTO__===true\)return false/);
});

test("contadores existem sem debug e debug pode ser ativado antes do reload",()=>{
  for(const contador of ["__CCO_EXEC_BOOT_COUNT__","__CCO_EXEC_HIST_CALLS__","__CCO_EXEC_DISCARDS__"])assert.match(execucao,new RegExp(contador));
  assert.match(execucao,/sessionStorage\.getItem\("CCO_DEBUG_EXECUCAO_PERFORMANCE"\)==="1"/);
  assert.match(execucao,/window\.__CCO_EXEC_HIST_CALLS__=\(window\.__CCO_EXEC_HIST_CALLS__\|\|0\)\+1/);
});

test("uma resposta preliminar obsoleta não elimina a carga oficial sucessora",async()=>{
  let boot=0,historicos=0,descartes=0,contextoAtual=null,bootEmAndamento=true;
  const criarContexto=servico=>contextoAtual={servico,sequencia:(contextoAtual?.sequencia||0)+1};
  const publicar=async contexto=>{await Promise.resolve();if(contexto!==contextoAtual){descartes++;return false;}return true;};
  boot++;
  const preliminar=criarContexto("GERAL"),respostaPreliminar=publicar(preliminar);
  const oficial=criarContexto("P1");
  assert.equal(await respostaPreliminar,false);
  assert.equal(await publicar(oficial),true);
  historicos++;
  bootEmAndamento=false;
  assert.deepEqual({boot,historicos,descartes,servico:contextoAtual.servico,bootEmAndamento},{boot:1,historicos:1,descartes:1,servico:"P1",bootEmAndamento:false});
});
