-- Execute primeiro para verificar o tipo atual da coluna.
select
  table_schema,
  table_name,
  column_name,
  data_type,
  udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'planilhas_importadas'
  and column_name = 'dados';

-- Execute somente se data_type/udt_name não indicar jsonb.
-- Faça backup antes caso existam valores textuais que não sejam JSON válido.
alter table public.planilhas_importadas
  alter column dados type jsonb
  using dados::jsonb;
