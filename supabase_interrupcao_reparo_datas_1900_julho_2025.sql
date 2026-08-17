-- REPARO DIRECIONADO: 19 datas de julho/2025 interpretadas como seriais Excel de 1900.
-- Revisar antes de executar. Este arquivo não faz DELETE nem cria importações.

begin;

create temporary table reparo_interrupcao_datas_1900 (
  id bigint primary key,
  rd text not null,
  veiculo text not null,
  hora_solicitacao time not null,
  importacao_id uuid not null,
  data_antes date not null,
  data_raw_planilha integer not null,
  data_depois date not null,
  chave_antes text not null,
  chave_depois text not null
) on commit drop;

insert into reparo_interrupcao_datas_1900
  (id, rd, veiculo, hora_solicitacao, importacao_id, data_antes, data_raw_planilha, data_depois, chave_antes, chave_depois)
values
  (3960, '12022958', 'VA425',         time '06:41:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-28', 28, date '2025-07-28', '12022958|1900-01-28|VA425|06:41:00',         '12022958|2025-07-28|VA425|06:41:00'),
  (3961, '12024274', 'ASA70',         time '07:49:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-28', 28, date '2025-07-28', '12024274|1900-01-28|ASA70|07:49:00',         '12024274|2025-07-28|ASA70|07:49:00'),
  (3962, '12024318', 'VA256',         time '11:52:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-28', 28, date '2025-07-28', '12024318|1900-01-28|VA256|11:52:00',         '12024318|2025-07-28|VA256|11:52:00'),
  (3963, '12023624', 'VA266',         time '13:17:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-28', 28, date '2025-07-28', '12023624|1900-01-28|VA266|13:17:00',         '12023624|2025-07-28|VA266|13:17:00'),
  (3964, '12023688', 'ASA89',         time '14:29:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-28', 28, date '2025-07-28', '12023688|1900-01-28|ASA89|14:29:00',         '12023688|2025-07-28|ASA89|14:29:00'),
  (3965, '12022598', 'ASA50',         time '16:41:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-28', 28, date '2025-07-28', '12022598|1900-01-28|ASA50|16:41:00',         '12022598|2025-07-28|ASA50|16:41:00'),
  (3966, '12024584', 'ASA111(VA307)', time '18:04:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-28', 28, date '2025-07-28', '12024584|1900-01-28|ASA111(VA307)|18:04:00', '12024584|2025-07-28|ASA111(VA307)|18:04:00'),
  (3967, '12026658', 'ASA112',        time '20:23:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-28', 28, date '2025-07-28', '12026658|1900-01-28|ASA112|20:23:00',        '12026658|2025-07-28|ASA112|20:23:00'),
  (3968, '12026700', 'ASA118',        time '00:19:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12026700|1900-01-29|ASA118|00:19:00',        '12026700|2025-07-29|ASA118|00:19:00'),
  (3969, '12027085', 'ASA117',        time '07:53:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12027085|1900-01-29|ASA117|07:53:00',        '12027085|2025-07-29|ASA117|07:53:00'),
  (3970, '12029662', 'ASA76',         time '08:54:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12029662|1900-01-29|ASA76|08:54:00',         '12029662|2025-07-29|ASA76|08:54:00'),
  (3971, '12028927', 'VA401',         time '09:26:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12028927|1900-01-29|VA401|09:26:00',         '12028927|2025-07-29|VA401|09:26:00'),
  (3972, '12029073', 'VA256',         time '11:50:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12029073|1900-01-29|VA256|11:50:00',         '12029073|2025-07-29|VA256|11:50:00'),
  (3973, '12029752', 'ASA25',         time '12:08:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12029752|1900-01-29|ASA25|12:08:00',         '12029752|2025-07-29|ASA25|12:08:00'),
  (3974, '12029126', 'ASA140',        time '13:42:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12029126|1900-01-29|ASA140|13:42:00',        '12029126|2025-07-29|ASA140|13:42:00'),
  (3975, '12029272', 'VA259',         time '16:23:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12029272|1900-01-29|VA259|16:23:00',         '12029272|2025-07-29|VA259|16:23:00'),
  (3976, '12030915', 'ASA49',         time '18:06:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12030915|1900-01-29|ASA49|18:06:00',         '12030915|2025-07-29|ASA49|18:06:00'),
  (3977, '12031339', 'ASA76',         time '21:17:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12031339|1900-01-29|ASA76|21:17:00',         '12031339|2025-07-29|ASA76|21:17:00'),
  (3978, '12030883', 'VA256',         time '22:48:00', 'd92659f9-9ebd-44a8-beda-40463fcf5025', date '1900-01-29', 29, date '2025-07-29', '12030883|1900-01-29|VA256|22:48:00',         '12030883|2025-07-29|VA256|22:48:00');

do $reparo$
declare
  total_base_antes bigint;
  quantidade_2025_antes bigint;
  quantidade_2026_antes bigint;
  quantidade_1900_antes bigint;
  importacoes_antes bigint;
  total_base_depois bigint;
  quantidade_2025_depois bigint;
  quantidade_2026_depois bigint;
  quantidade_1900_depois bigint;
  importacoes_depois bigint;
  correspondencias bigint;
  conflitos bigint;
  atualizados bigint;
  divergencias text;
begin
  select count(*) into total_base_antes from public.interrupcoes_trecho;
  select count(*) into quantidade_2025_antes from public.interrupcoes_trecho where data_ocorrencia >= date '2025-01-01' and data_ocorrencia < date '2026-01-01';
  select count(*) into quantidade_2026_antes from public.interrupcoes_trecho where data_ocorrencia >= date '2026-01-01' and data_ocorrencia < date '2027-01-01';
  select count(*) into quantidade_1900_antes from public.interrupcoes_trecho where data_ocorrencia >= date '1900-01-01' and data_ocorrencia < date '1901-01-01';
  select count(*) into importacoes_antes from public.interrupcoes_importacoes;

  if total_base_antes <> 5466 then
    raise exception 'Reparo abortado: total atual esperado 5466, encontrado %.', total_base_antes;
  end if;
  if quantidade_1900_antes <> 19 then
    raise exception 'Reparo abortado: esperados 19 registros de 1900, encontrados %.', quantidade_1900_antes;
  end if;
  if (select count(*) from reparo_interrupcao_datas_1900) <> 19 then
    raise exception 'Reparo abortado: matriz de reparo não contém exatamente 19 linhas.';
  end if;
  if (select count(distinct id) from reparo_interrupcao_datas_1900) <> 19
     or (select count(distinct chave_depois) from reparo_interrupcao_datas_1900) <> 19 then
    raise exception 'Reparo abortado: IDs ou chaves novas duplicados na matriz.';
  end if;

  select count(*) into correspondencias
  from public.interrupcoes_trecho it
  join reparo_interrupcao_datas_1900 r
    on it.id = r.id
   and it.rd is not distinct from r.rd
   and it.veiculo is not distinct from r.veiculo
   and it.hora_solicitacao is not distinct from r.hora_solicitacao
   and it.importacao_id is not distinct from r.importacao_id
   and it.data_ocorrencia is not distinct from r.data_antes
   and it.chave_registro is not distinct from r.chave_antes;

  if correspondencias <> 19 then
    select string_agg(format('id=%s', r.id), ', ' order by r.id) into divergencias
    from reparo_interrupcao_datas_1900 r
    left join public.interrupcoes_trecho it
      on it.id = r.id
     and it.rd is not distinct from r.rd
     and it.veiculo is not distinct from r.veiculo
     and it.hora_solicitacao is not distinct from r.hora_solicitacao
     and it.importacao_id is not distinct from r.importacao_id
     and it.data_ocorrencia is not distinct from r.data_antes
     and it.chave_registro is not distinct from r.chave_antes
    where it.id is null;
    raise exception 'Reparo abortado: registros ausentes ou divergentes: %.', coalesce(divergencias, 'não identificados');
  end if;

  select count(*) into conflitos
  from public.interrupcoes_trecho it
  join reparo_interrupcao_datas_1900 r on it.chave_registro = r.chave_depois
  where it.id <> r.id;
  if conflitos <> 0 then
    raise exception 'Reparo abortado: % chave(s) nova(s) já existem em outros registros.', conflitos;
  end if;

  update public.interrupcoes_trecho it
     set data_ocorrencia = r.data_depois,
         mes = 7,
         chave_registro = r.chave_depois
    from reparo_interrupcao_datas_1900 r
   where it.id = r.id
     and it.rd is not distinct from r.rd
     and it.veiculo is not distinct from r.veiculo
     and it.hora_solicitacao is not distinct from r.hora_solicitacao
     and it.importacao_id is not distinct from r.importacao_id
     and it.data_ocorrencia is not distinct from r.data_antes
     and it.chave_registro is not distinct from r.chave_antes;
  get diagnostics atualizados = row_count;
  if atualizados <> 19 then
    raise exception 'Reparo abortado: esperados 19 updates, executados %.', atualizados;
  end if;

  if exists (
    select 1 from public.interrupcoes_trecho it
    join reparo_interrupcao_datas_1900 r on r.id = it.id
    where it.data_ocorrencia is distinct from r.data_depois
       or it.mes is distinct from 7
       or it.chave_registro is distinct from r.chave_depois
  ) then
    raise exception 'Reparo abortado: validação individual pós-update falhou.';
  end if;

  select count(*) into total_base_depois from public.interrupcoes_trecho;
  select count(*) into quantidade_2025_depois from public.interrupcoes_trecho where data_ocorrencia >= date '2025-01-01' and data_ocorrencia < date '2026-01-01';
  select count(*) into quantidade_2026_depois from public.interrupcoes_trecho where data_ocorrencia >= date '2026-01-01' and data_ocorrencia < date '2027-01-01';
  select count(*) into quantidade_1900_depois from public.interrupcoes_trecho where data_ocorrencia >= date '1900-01-01' and data_ocorrencia < date '1901-01-01';
  select count(*) into importacoes_depois from public.interrupcoes_importacoes;

  if quantidade_1900_depois <> 0 then raise exception 'Reparo abortado: ainda existem % registros de 1900.', quantidade_1900_depois; end if;
  if total_base_depois <> total_base_antes then raise exception 'Reparo abortado: total mudou de % para %.', total_base_antes, total_base_depois; end if;
  if quantidade_2026_depois <> quantidade_2026_antes then raise exception 'Reparo abortado: quantidade de 2026 mudou de % para %.', quantidade_2026_antes, quantidade_2026_depois; end if;
  if quantidade_2025_depois <> quantidade_2025_antes + 19 then raise exception 'Reparo abortado: quantidade de 2025 deveria aumentar em 19 (% -> %), mas terminou em %.', quantidade_2025_antes, quantidade_2025_antes + 19, quantidade_2025_depois; end if;
  if importacoes_depois <> importacoes_antes then raise exception 'Reparo abortado: quantidade de importações mudou de % para %.', importacoes_antes, importacoes_depois; end if;

  raise notice 'Reparo validado: total %, 2025 % -> %, 2026 %, 1900 % -> %, importações %.', total_base_depois, quantidade_2025_antes, quantidade_2025_depois, quantidade_2026_depois, quantidade_1900_antes, quantidade_1900_depois, importacoes_depois;
end
$reparo$;

-- Resultado de revisão pós-reparo dentro da mesma transação.
select id, rd, veiculo, hora_solicitacao, data_ocorrencia, mes, chave_registro, importacao_id
from public.interrupcoes_trecho
where id between 3960 and 3978
order by id;

select count(*) as total_registros_ano_1900_depois
from public.interrupcoes_trecho
where data_ocorrencia >= date '1900-01-01'
  and data_ocorrencia < date '1901-01-01';

commit;
