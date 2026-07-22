-- CCO V2 | Otimização pontual da conclusão de importações volumosas.
-- Execute uma vez no SQL Editor do novo projeto Supabase.
begin;

create index if not exists idx_planilha_linhas_importacao
  on public.planilha_linhas(importacao_id);
create index if not exists idx_operacoes_importacao
  on public.operacoes(importacao_id);
create index if not exists idx_operacoes_importacao_servico
  on public.operacoes(importacao_id,servico);
create index if not exists idx_operacoes_importacao_data
  on public.operacoes(importacao_id,data_operacao);
create index if not exists idx_dias_operacao_importacao
  on public.dias_operacao(importacao_id);
create index if not exists idx_painel_executivo_importacao
  on public.painel_executivo(importacao_id);
create index if not exists idx_importacao_erros_importacao
  on public.importacao_erros(importacao_id);

create or replace function public.finalizar_importacao(
  p_importacao_id uuid,
  p_com_avisos boolean default false
)
returns public.importacoes
language plpgsql
security definer
set search_path=public
as $$
declare
  v_importacao public.importacoes;
  v_raw bigint;
  v_operacoes bigint;
  v_dias bigint;
  v_painel bigint;
  v_erros bigint;
  v_p12 bigint;
  v_p12_executado bigint;
begin
  perform set_config('statement_timeout','120000',true);

  if not public.eh_administrador() then
    raise exception 'Apenas administradores podem concluir importações';
  end if;

  select * into v_importacao
  from public.importacoes
  where id=p_importacao_id
  for update;

  if v_importacao.id is null then raise exception 'Importação não encontrada'; end if;
  if v_importacao.status<>'processando' then raise exception 'Importação não está em processamento'; end if;

  select count(*) into v_raw
  from public.planilha_linhas
  where importacao_id=p_importacao_id;

  select
    count(*),
    count(*) filter(where upper(trim(servico))='P12'),
    count(*) filter(where upper(trim(servico))='P12' and executado is not null)
  into v_operacoes,v_p12,v_p12_executado
  from public.operacoes
  where importacao_id=p_importacao_id;

  select count(*) into v_dias
  from public.dias_operacao
  where importacao_id=p_importacao_id;

  select count(*) into v_painel
  from public.painel_executivo
  where importacao_id=p_importacao_id;

  select count(*) into v_erros
  from public.importacao_erros
  where importacao_id=p_importacao_id;

  if v_raw<>coalesce((v_importacao.detalhes->>'esperado_raw')::bigint,v_importacao.total_linhas) then
    raise exception 'Contagem RAW divergente: esperado %, encontrado %',coalesce((v_importacao.detalhes->>'esperado_raw')::bigint,v_importacao.total_linhas),v_raw;
  end if;
  if v_operacoes<>coalesce((v_importacao.detalhes->>'esperado_operacoes')::bigint,0) then
    raise exception 'Contagem de operações divergente: esperado %, encontrado %',coalesce((v_importacao.detalhes->>'esperado_operacoes')::bigint,0),v_operacoes;
  end if;
  if v_dias<>coalesce((v_importacao.detalhes->>'esperado_dias')::bigint,0) then
    raise exception 'Contagem de dias_operacao divergente';
  end if;
  if v_painel<>coalesce((v_importacao.detalhes->>'esperado_painel')::bigint,0) then
    raise exception 'Contagem do painel divergente';
  end if;
  if v_p12<>coalesce((v_importacao.detalhes->>'esperado_p12')::bigint,0) then
    raise exception 'Contagem P12 divergente';
  end if;
  if v_p12_executado<>coalesce((v_importacao.detalhes->>'esperado_p12_executado')::bigint,0) then
    raise exception 'P12 Executado divergente';
  end if;

  update public.importacoes
  set ativa=false
  where ano=v_importacao.ano and mes=v_importacao.mes
    and id<>v_importacao.id and ativa=true;

  update public.importacoes
  set status=case when p_com_avisos then 'concluida_com_avisos' else 'concluida' end,
      ativa=true,
      concluido_em=now(),
      linhas_importadas=v_raw,
      linhas_rejeitadas=v_erros,
      erro=null
  where id=v_importacao.id
  returning * into v_importacao;

  return v_importacao;
end;
$$;

grant execute on function public.finalizar_importacao(uuid,boolean) to authenticated;

commit;

-- Validação posterior:
-- select id,ano,mes,status,ativa,erro from public.importacoes
-- where ano=2026 and mes in (6,7) order by mes,criado_em desc;
-- select * from public.v_periodos_operacionais
-- where ano=2026 and mes in (6,7) order by mes;
