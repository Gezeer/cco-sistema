-- Reparo direcionado de sete latitudes com sinal incorreto.
-- Não executado automaticamente. Revisar antes de aplicar no Supabase.

begin;

do $reparo_coordenadas$
declare
  esperados jsonb := '[
    {"id":4079,"rd":"12084734","ra":"PLANO PILOTO","antes":"15.753102, -47.895064","depois":"-15.753102, -47.895064","importacao_id":"d92659f9-9ebd-44a8-beda-40463fcf5025"},
    {"id":4108,"rd":"12105621","ra":"PLANO PILOTO","antes":"15.738650, -47.886983","depois":"-15.738650, -47.886983","importacao_id":"d92659f9-9ebd-44a8-beda-40463fcf5025"},
    {"id":5083,"rd":"12547540","ra":"PLANO PILOTO","antes":"15.820796, -47.924626","depois":"-15.820796, -47.924626","importacao_id":"d92659f9-9ebd-44a8-beda-40463fcf5025"},
    {"id":713,"rd":"12920082","ra":"PLANO PILOTO","antes":"15.843646, -47.917075","depois":"-15.843646, -47.917075","importacao_id":null},
    {"id":970,"rd":"13009164","ra":"TAGUATINGA","antes":"15.873377, -48.038367","depois":"-15.873377, -48.038367","importacao_id":null},
    {"id":1187,"rd":"13090824","ra":"PLANO PILOTO","antes":"15.818825, -47.907219","depois":"-15.818825, -47.907219","importacao_id":null},
    {"id":1293,"rd":"13135793","ra":"PLANO PILOTO","antes":"15.757381, -47.908252","depois":"-15.757381, -47.908252","importacao_id":null}
  ]'::jsonb;
  total_antes bigint;
  qtd_2025_antes bigint;
  qtd_2026_antes bigint;
  alvos_antes bigint;
  total_depois bigint;
  qtd_2025_depois bigint;
  qtd_2026_depois bigint;
  alvos_depois bigint;
  correspondencias bigint;
  atualizados bigint;
  importacao_2026 uuid;
  divergencias text;
begin
  select count(*) into total_antes from public.interrupcoes_trecho;
  select count(*) into qtd_2025_antes from public.interrupcoes_trecho where data_ocorrencia >= date '2025-01-01' and data_ocorrencia < date '2026-01-01';
  select count(*) into qtd_2026_antes from public.interrupcoes_trecho where data_ocorrencia >= date '2026-01-01' and data_ocorrencia < date '2027-01-01';
  select count(*) into alvos_antes from public.interrupcoes_trecho where id in (4079,4108,5083,713,970,1187,1293);

  if jsonb_array_length(esperados) <> 7 or alvos_antes <> 7 then
    raise exception 'Reparo abortado: esperados 7 IDs existentes; encontrados %.', alvos_antes;
  end if;

  with e as (
    select * from jsonb_to_recordset(esperados) as x(id bigint,rd text,ra text,antes text,depois text,importacao_id uuid)
  )
  select count(*) into correspondencias
  from e join public.interrupcoes_trecho it
    on it.id=e.id and it.rd=e.rd and it.ra=e.ra and it.lat_long=e.antes
   and (e.importacao_id is null or it.importacao_id=e.importacao_id);

  if correspondencias <> 7 then
    with e as (
      select * from jsonb_to_recordset(esperados) as x(id bigint,rd text,ra text,antes text,depois text,importacao_id uuid)
    )
    select string_agg(format('id=%s',e.id),', ' order by e.id) into divergencias
    from e left join public.interrupcoes_trecho it
      on it.id=e.id and it.rd=e.rd and it.ra=e.ra and it.lat_long=e.antes
     and (e.importacao_id is null or it.importacao_id=e.importacao_id)
    where it.id is null;
    raise exception 'Reparo abortado: ID/RD/RA/lat_long/importacao_id divergente: %.',coalesce(divergencias,'não identificado');
  end if;

  select min(importacao_id) into importacao_2026
  from public.interrupcoes_trecho where id in (713,970,1187,1293);
  if importacao_2026 is null
     or (select count(distinct importacao_id) from public.interrupcoes_trecho where id in (713,970,1187,1293)) <> 1
     or not exists (
       select 1 from public.interrupcoes_importacoes ii
       where ii.id=importacao_2026 and ii.status='concluida' and ii.nome_arquivo ilike '%2026%'
     ) then
    raise exception 'Reparo abortado: importacao_id dos quatro registros de 2026 não é único, válido e associado a arquivo 2026 concluído.';
  end if;

  with e as (
    select * from jsonb_to_recordset(esperados) as x(id bigint,rd text,ra text,antes text,depois text,importacao_id uuid)
  )
  update public.interrupcoes_trecho it
     set lat_long=e.depois
    from e
   where it.id=e.id and it.rd=e.rd and it.ra=e.ra and it.lat_long=e.antes
     and it.importacao_id=coalesce(e.importacao_id,importacao_2026);
  get diagnostics atualizados = row_count;
  if atualizados <> 7 then raise exception 'Reparo abortado: esperados 7 updates; executados %.',atualizados; end if;

  with e as (
    select * from jsonb_to_recordset(esperados) as x(id bigint,rd text,ra text,antes text,depois text,importacao_id uuid)
  )
  select count(*) into alvos_depois
  from e join public.interrupcoes_trecho it on it.id=e.id and it.lat_long=e.depois
  where split_part(e.depois,',',1)::numeric between -16.5 and -15.3
    and btrim(split_part(e.depois,',',2))::numeric between -49 and -47.2;
  if alvos_depois <> 7 then
    raise exception 'Reparo abortado: nem todas as 7 coordenadas finais são parseáveis e plausíveis para DF/Goiás adjacente.';
  end if;

  select count(*) into total_depois from public.interrupcoes_trecho;
  select count(*) into qtd_2025_depois from public.interrupcoes_trecho where data_ocorrencia >= date '2025-01-01' and data_ocorrencia < date '2026-01-01';
  select count(*) into qtd_2026_depois from public.interrupcoes_trecho where data_ocorrencia >= date '2026-01-01' and data_ocorrencia < date '2027-01-01';
  if total_depois <> total_antes then raise exception 'Reparo abortado: total mudou de % para %.',total_antes,total_depois; end if;
  if qtd_2025_depois <> qtd_2025_antes then raise exception 'Reparo abortado: quantidade 2025 mudou de % para %.',qtd_2025_antes,qtd_2025_depois; end if;
  if qtd_2026_depois <> qtd_2026_antes then raise exception 'Reparo abortado: quantidade 2026 mudou de % para %.',qtd_2026_antes,qtd_2026_depois; end if;
  raise notice 'Reparo validado: 7 coordenadas; total %, 2025 %, 2026 %.',total_depois,qtd_2025_depois,qtd_2026_depois;
end
$reparo_coordenadas$;

commit;
