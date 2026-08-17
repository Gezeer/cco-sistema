-- Diagnóstico somente leitura. Não corrige os IDs 2404 e 726.
select
  it.id,it.rd,it.data_ocorrencia,it.veiculo,it.ra,it.lat_long,it.importacao_id,
  ii.nome_arquivo,ii.status,ii.criado_em as importado_em,
  case
    when it.id=2404 then 'Fonte original ainda não localizada; não reparar.'
    when it.id=726 then 'Banco negativo e coerente; cópias locais da planilha divergem; não reparar.'
  end as diagnostico
from public.interrupcoes_trecho it
left join public.interrupcoes_importacoes ii on ii.id=it.importacao_id
where it.id in (2404,726)
order by it.id;
