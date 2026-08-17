-- Diagnóstico somente leitura. Não altera nem remove registros.
-- Execute no SQL Editor do mesmo projeto Supabase usado pelo CCO.

select count(*) as total_registros_ano_1900
from public.interrupcoes_trecho
where data_ocorrencia >= date '1900-01-01'
  and data_ocorrencia < date '1901-01-01';

select
  it.id,
  it.rd,
  it.data_ocorrencia,
  it.mes,
  it.veiculo,
  it.hora_solicitacao,
  it.chave_registro,
  it.importacao_id,
  ii.nome_arquivo,
  ii.criado_em as importado_em,
  it.criado_em,
  it.atualizado_em
from public.interrupcoes_trecho as it
left join public.interrupcoes_importacoes as ii
  on ii.id = it.importacao_id
where it.data_ocorrencia >= date '1900-01-01'
  and it.data_ocorrencia < date '1901-01-01'
order by it.data_ocorrencia, it.id;

