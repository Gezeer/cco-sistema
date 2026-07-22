-- Fase temporária: dias oficiais são validados no frontend compartilhado.
-- Remove de finalizar_importacao a dependência de public.dias_operacao.
create or replace function public.finalizar_importacao(p_importacao_id uuid,p_com_avisos boolean default false)
returns public.importacoes language plpgsql security definer set search_path=public as $$
declare v public.importacoes; esperado bigint; encontrado bigint;
begin
  if not public.eh_administrador() then raise exception 'Apenas administradores podem concluir importações'; end if;
  select * into v from public.importacoes where id=p_importacao_id for update;
  if v.id is null or v.status<>'processando' then raise exception 'Importação inválida para conclusão'; end if;
  select count(*) into encontrado from public.operacoes where importacao_id=v.id;
  esperado=coalesce((v.detalhes->>'esperado_operacoes')::bigint,0);
  if encontrado=0 or encontrado<>esperado then raise exception 'Contagem de operações divergente'; end if;
  if (select count(*) from public.painel_executivo where importacao_id=v.id)<>13 then raise exception 'Painel executivo deve conter 13 serviços'; end if;
  update public.importacoes set ativa=false where ano=v.ano and mes=v.mes and id<>v.id and ativa;
  update public.importacoes set ativa=true,status=case when p_com_avisos then 'concluida_com_avisos' else 'concluida' end,
    concluido_em=now(),linhas_importadas=encontrado,
    linhas_rejeitadas=(select count(*) from public.importacao_erros where importacao_id=v.id)
  where id=v.id returning * into v;
  return v;
end $$;
grant execute on function public.finalizar_importacao(uuid,boolean) to authenticated;
