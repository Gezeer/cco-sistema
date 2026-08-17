-- V2: reparo direcionado de sete latitudes com sinal incorreto.
-- Arquivo para revisão. Não foi executado automaticamente no Supabase.

begin;
do $reparo_coordenadas$
declare
  alvo record;
  total_antes bigint; qtd_2025_antes bigint; qtd_2026_antes bigint;
  total_depois bigint; qtd_2025_depois bigint; qtd_2026_depois bigint;
  correspondencias bigint:=0; atualizados bigint:=0; atualizados_item bigint;
  qtd_importacao_2025 bigint:=0; qtd_importacao_2026 bigint:=0;
begin
  select count(*) into total_antes from public.interrupcoes_trecho;
  select count(*) into qtd_2025_antes from public.interrupcoes_trecho where data_ocorrencia>=date '2025-01-01' and data_ocorrencia<date '2026-01-01';
  select count(*) into qtd_2026_antes from public.interrupcoes_trecho where data_ocorrencia>=date '2026-01-01' and data_ocorrencia<date '2027-01-01';

  for alvo in select * from (values
    (4079::bigint,'12084734'::text,'PLANO PILOTO'::text,'15.753102, -47.895064'::text,'-15.753102, -47.895064'::text,'d92659f9-9ebd-44a8-beda-40463fcf5025'::uuid),
    (4108::bigint,'12105621'::text,'PLANO PILOTO'::text,'15.738650, -47.886983'::text,'-15.738650, -47.886983'::text,'d92659f9-9ebd-44a8-beda-40463fcf5025'::uuid),
    (5083::bigint,'12547540'::text,'PLANO PILOTO'::text,'15.820796, -47.924626'::text,'-15.820796, -47.924626'::text,'d92659f9-9ebd-44a8-beda-40463fcf5025'::uuid),
    (713::bigint,'12920082'::text,'PLANO PILOTO'::text,'15.843646, -47.917075'::text,'-15.843646, -47.917075'::text,'9b13e987-b76f-41d5-a582-8e09b4ab374b'::uuid),
    (970::bigint,'13009164'::text,'TAGUATINGA'::text,'15.873377, -48.038367'::text,'-15.873377, -48.038367'::text,'9b13e987-b76f-41d5-a582-8e09b4ab374b'::uuid),
    (1187::bigint,'13090824'::text,'PLANO PILOTO'::text,'15.818825, -47.907219'::text,'-15.818825, -47.907219'::text,'9b13e987-b76f-41d5-a582-8e09b4ab374b'::uuid),
    (1293::bigint,'13135793'::text,'PLANO PILOTO'::text,'15.757381, -47.908252'::text,'-15.757381, -47.908252'::text,'9b13e987-b76f-41d5-a582-8e09b4ab374b'::uuid)
  ) as e(id,rd,ra,antes,depois,importacao_id)
  loop
    if alvo.importacao_id='d92659f9-9ebd-44a8-beda-40463fcf5025'::uuid then qtd_importacao_2025:=qtd_importacao_2025+1;
    elsif alvo.importacao_id='9b13e987-b76f-41d5-a582-8e09b4ab374b'::uuid then qtd_importacao_2026:=qtd_importacao_2026+1;
    else raise exception 'Reparo abortado: importacao_id inesperado para id %.',alvo.id; end if;

    select count(*) into atualizados_item from public.interrupcoes_trecho it
    where it.id=alvo.id and it.rd=alvo.rd and it.ra=alvo.ra and it.lat_long=alvo.antes and it.importacao_id=alvo.importacao_id;
    if atualizados_item<>1 then raise exception 'Reparo abortado: id % diverge em ID/RD/RA/lat_long/importacao_id ou não possui correspondência única.',alvo.id; end if;
    correspondencias:=correspondencias+atualizados_item;

    update public.interrupcoes_trecho set lat_long=alvo.depois
    where id=alvo.id and rd=alvo.rd and ra=alvo.ra and lat_long=alvo.antes and importacao_id=alvo.importacao_id;
    get diagnostics atualizados_item=row_count;
    if atualizados_item<>1 then raise exception 'Reparo abortado: update do id % afetou % linhas.',alvo.id,atualizados_item; end if;
    atualizados:=atualizados+atualizados_item;

    if not exists(select 1 from public.interrupcoes_trecho where id=alvo.id and lat_long=alvo.depois)
      or split_part(alvo.depois,',',1)::numeric not between -16.5 and -15.3
      or btrim(split_part(alvo.depois,',',2))::numeric not between -49 and -47.2 then
      raise exception 'Reparo abortado: valor final do id % não é exato, parseável e geograficamente plausível.',alvo.id;
    end if;
  end loop;

  if correspondencias<>7 then raise exception 'Reparo abortado: esperadas 7 correspondências; encontradas %.',correspondencias; end if;
  if atualizados<>7 then raise exception 'Reparo abortado: esperados 7 updates; executados %.',atualizados; end if;
  if qtd_importacao_2025<>3 or qtd_importacao_2026<>4 then raise exception 'Reparo abortado: estrutura deve conter 3 registros da importação 2025 e 4 da importação 2026; contém % e %.',qtd_importacao_2025,qtd_importacao_2026; end if;

  select count(*) into total_depois from public.interrupcoes_trecho;
  select count(*) into qtd_2025_depois from public.interrupcoes_trecho where data_ocorrencia>=date '2025-01-01' and data_ocorrencia<date '2026-01-01';
  select count(*) into qtd_2026_depois from public.interrupcoes_trecho where data_ocorrencia>=date '2026-01-01' and data_ocorrencia<date '2027-01-01';
  if total_depois<>total_antes then raise exception 'Reparo abortado: total mudou de % para %.',total_antes,total_depois; end if;
  if qtd_2025_depois<>qtd_2025_antes then raise exception 'Reparo abortado: quantidade 2025 mudou de % para %.',qtd_2025_antes,qtd_2025_depois; end if;
  if qtd_2026_depois<>qtd_2026_antes then raise exception 'Reparo abortado: quantidade 2026 mudou de % para %.',qtd_2026_antes,qtd_2026_depois; end if;
  raise notice 'Reparo validado: 7 coordenadas; 3 da importação 2025, 4 da importação 2026; total %, 2025 %, 2026 %.',total_depois,qtd_2025_depois,qtd_2026_depois;
end
$reparo_coordenadas$;
commit;
