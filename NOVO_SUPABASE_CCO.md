# Novo Supabase principal do CCO

O banco antigo não é utilizado. O arquivo `supabase_cco_v2_arquitetura.sql` cria o schema canônico em um projeto Supabase vazio.

## Implantação

1. Crie um novo projeto no Supabase.
2. Abra **SQL Editor**, cole e execute todo o arquivo `supabase_cco_v2_arquitetura.sql`.
3. Em **Authentication > Users**, crie o primeiro usuário. Usuários e senhas do projeto antigo não são transferidos nem recuperáveis.
4. Copie o UUID desse usuário e, no SQL Editor, execute:

```sql
insert into public.perfis_usuario(usuario_id,nome,email,perfil,ativo)
values ('UUID_DO_USUARIO','Administrador CCO','EMAIL_DO_USUARIO','administrador',true)
on conflict (usuario_id) do update set perfil='administrador',ativo=true,atualizado_em=now();
```

5. Obtenha **Project URL** e **anon/public key** em **Project Settings > API**. Nunca copie a `service_role` para o navegador.
6. Antes de `supabase.js`, configure uma única vez na hospedagem:

```html
<script>
window.CCO_SUPABASE_CONFIG = {
  url: "https://SEU-PROJETO.supabase.co",
  anonKey: "SUA-ANON-KEY"
};
</script>
```

O navegador lê a configuração exclusivamente de `js/config.js`. Não use `localStorage`, chaves privadas ou configurações alternativas por página.

7. Sirva o projeto por HTTP/HTTPS; não abra `analytics-ai.html` diretamente com `file://`.
8. Entre com o usuário criado, abra o Painel Geral e importe a planilha TabelaPadrão.
9. Acompanhe o bloco **Auditoria da importação**. A nova importação só fica ativa depois que RAW, operações, dias, painel, erros e KPI terminarem.
10. Execute `supabase_cco_auditoria.sql`, substituindo `<UUID>` pelo ID exibido na tela.

Se a planilha possuir mais de um mês, o importador cria uma importação independente para cada período detectado nas datas reais. Somente os meses presentes são substituídos. A versão anterior de cada mês permanece ativa até a validação integral da nova versão; os outros meses não são alterados.

## Arquitetura

- Identidade e acesso: `usuarios` e `perfis_usuario`.
- Configuração: `regras_servicos`.
- Importação e auditoria: `importacoes`, `cabecalhos_planilha` e `importacao_erros`.
- Operacional: `operacoes`, `dias_operacao`, `painel_executivo` e `kpi_mensal`.
- Consulta: `v_catalogo_periodos`, `v_auditoria_importacoes` e RPCs.

## Regras preservadas

- P12 usa exclusivamente a soma de `operacoes.executado`; o parser reconhece Executado, Executado Total, Quantidade Executada, Qtd Executado, Qtd Executada e Execução.
- P3, P7, P8, P9, P10 e P11 continuam com equipes fixas somente no Painel Geral.
- KPI, Execução e Analytics AI consultam operações reais da importação ativa.
- Nesta fase, dias oficiais vêm exclusivamente de `js/cco-regras-negocio.js`; `public.dias_operacao` não é consultada pelo frontend.

## Limitações de recuperação

Somente dados presentes na planilha TabelaPadrão ou em backups podem ser reconstruídos. Dados existentes apenas no banco antigo foram perdidos. Contas do Supabase Auth, perfis e senhas também não migram automaticamente.
