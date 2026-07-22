# Instalação do banco CCO V2

## Importante

O pacote preserva o visual atual. A reconstrução é da camada de banco e dados.

## Passos

1. Crie um projeto Supabase novo.
2. Abra **SQL Editor**.
3. Execute o arquivo `supabase_cco_v2_arquitetura.sql` inteiro em um projeto novo.
4. Em `js/config.js`, informe a URL e a chave pública `anon` do novo projeto.
5. Crie o primeiro usuário em Authentication.
6. No SQL Editor, altere o perfil desse usuário para administrador:

```sql
update public.perfis_usuario
set perfil = 'administrador', ativo = true
where usuario_id = 'UUID_DO_USUARIO';
```

7. Abra `login.html`, entre e importe a planilha histórica.
8. Confirme a view `v_catalogo_periodos`: ela deve retornar um registro por período.
9. Confirme `select * from public.obter_ultimo_periodo();`: deve retornar Julho/2026 quando Julho for o período mais recente.

## Testes obrigatórios

```sql
select * from public.v_catalogo_periodos order by ano, mes;
select * from public.obter_ultimo_periodo();
select ano, mes, count(*) from public.importacoes where ativa group by ano, mes having count(*) > 1;
select servico, valor_unitario, equipe_fixa_painel from public.regras_servicos order by ordem;
```

A terceira consulta deve retornar zero linhas.
