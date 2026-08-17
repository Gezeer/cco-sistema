# CCO --- Centro Inteligente de Controle Operacional

Sistema web de **controle, acompanhamento e análise operacional**,
desenvolvido para centralizar indicadores, execução de serviços, KPIs,
histórico de importações, análises inteligentes e ocorrências de
interrupção de trecho.

O projeto combina dashboards operacionais, importação incremental de
planilhas Excel, persistência no Supabase, visualizações geográficas e
análises comparativas para apoiar o acompanhamento da operação.

## Visão geral

O CCO reúne diferentes áreas da operação em uma única interface:

-   **Painel Geral** --- visão executiva dos principais indicadores.
-   **KPI** --- acompanhamento de indicadores operacionais e desempenho.
-   **Execução P1 a P12** --- análise dos serviços e períodos
    operacionais.
-   **CCO Analytics AI** --- módulo analítico para exploração dos dados
    e geração de insights.
-   **Interrupção de Trecho** --- ocorrências, socorros, defeitos,
    sinistros e análise geográfica.
-   **Base Importada** --- acompanhamento dos dados carregados.
-   **Histórico** --- rastreabilidade das importações.
-   **Configurações** --- recursos administrativos do sistema.
-   **Login e controle de sessão** --- autenticação integrada ao
    backend.

## Interrupção de Trecho

O módulo de Interrupção de Trecho concentra a análise de ocorrências
operacionais e inclui:

-   filtros por ano, mês, serviço, tipo de defeito, RA, perímetro e
    pesquisa;
-   cards com indicadores consolidados;
-   mapa interativo de ocorrências;
-   agrupamento geográfico de marcadores;
-   evolução temporal das ocorrências;
-   distribuição por tipo de defeito;
-   ranking de veículos e regiões administrativas;
-   importação/atualização incremental via Excel;
-   comparação anual **2025 × 2026**;
-   datas apresentadas no padrão brasileiro `DD/MM/AAAA`;
-   proteção contra coordenadas geograficamente inválidas;
-   preservação de ocorrências legítimas em regiões adjacentes de Goiás.

### Análise de sinistros

Os registros identificados como `SINISTRO` recebem uma classificação
analítica derivada da descrição da ocorrência, sem modificar os dados
originais no banco.

Categorias utilizadas:

-   **Incidente**
-   **Pequena proporção**
-   **Média proporção**
-   **Grande proporção**

A classificação é apresentada em gráfico e acompanha os filtros ativos.
Registros sem evidências suficientes permanecem como **Incidente**,
evitando atribuição artificial de gravidade.

> A classificação de sinistros é uma estimativa analítica baseada no
> texto disponível e não substitui avaliação técnica ou laudo oficial.

## Comparativo anual

Quando o filtro de ano está em **Todos**, o sistema apresenta
comparações entre 2025 e 2026, incluindo:

-   ocorrências mensais;
-   tipos de defeito;
-   Top 10 RAs;
-   tempo médio mensal;
-   veículos com maior participação;
-   proporção estimada dos sinistros.

A comparação utiliza períodos equivalentes para evitar distorções quando
o ano mais recente ainda está incompleto.

## Importação de dados

O projeto possui fluxo de importação incremental de planilhas, com
mecanismos para:

-   leitura de Excel;
-   normalização de cabeçalhos e valores;
-   deduplicação;
-   identificação de registros novos e atualizados;
-   processamento em lotes;
-   histórico das cargas;
-   validações de integridade;
-   preservação de versões/períodos;
-   relatórios de importação;
-   tratamento de falhas sem substituir silenciosamente dados válidos.

A base pode ser atualizada periodicamente sem necessidade de reconstruir
todo o histórico.

## Arquitetura

``` text
cco-sistema/
├── index.html
├── kpi.html
├── execucao.html
├── analytics-ai.html
├── interrupcao-trecho.html
├── dados.html
├── historico.html
├── configuracoes.html
├── login.html
│
├── css/
│   └── estilos e layouts dos módulos
│
├── js/
│   └── configuração, cliente Supabase e regras compartilhadas
│
├── services/
│   └── serviços auxiliares
│
├── supabase/
│   └── scripts relacionados ao banco
│
├── interrupcao-trecho.js
├── interrupcao-trecho-mapa.js
├── interrupcao-trecho-comparativo.js
├── interrupcao-sinistro-proporcao.js
├── analytics-ai.js
├── analytics-agent.js
├── cco-importacao-semanal.js
│
├── *.test.js
└── *.sql
```

O repositório também contém scripts SQL de diagnóstico, migração,
auditoria e reparos direcionados.

## Tecnologias

O projeto utiliza principalmente:

-   **HTML5**
-   **CSS3**
-   **JavaScript**
-   **Supabase**
-   **PostgreSQL**
-   **Chart.js**
-   bibliotecas de mapas web
-   processamento de planilhas Excel no navegador
-   Git e GitHub
-   GitHub Pages para publicação da interface

## Banco de dados

O Supabase funciona como backend principal para autenticação e
persistência dos dados operacionais.

Entre as estruturas utilizadas pelo projeto estão dados de:

-   importações;
-   operações;
-   períodos;
-   painel executivo;
-   dias de operação;
-   interrupções de trecho;
-   usuários/perfis;
-   informações utilizadas pelos módulos analíticos.

Scripts SQL de instalação, diagnóstico e manutenção estão versionados no
repositório.

> Credenciais privadas, chaves de serviço e segredos nunca devem ser
> adicionados ao Git. Configurações públicas do frontend devem respeitar
> as políticas de segurança e RLS definidas no Supabase.

## Qualidade e testes

O projeto possui uma suíte extensa de testes JavaScript cobrindo regras
de negócio e regressões, incluindo:

-   importação;
-   períodos;
-   métricas;
-   KPIs;
-   execução P1--P12;
-   responsividade;
-   gráficos;
-   performance;
-   mapa;
-   coordenadas;
-   formatação de datas;
-   comparativo anual;
-   classificação de sinistros;
-   comportamento de filtros.

Exemplos presentes no projeto:

``` text
interrupcao-trecho.test.js
interrupcao-trecho-mapa.test.js
interrupcao-dashboard-premium.test.js
interrupcao-comparativo-anual.test.js
interrupcao-sinistro-proporcao.test.js
interrupcao-sinistro-grafico.test.js
cco-metricas.test.js
cco-catalogo-periodos.test.js
```

## Executando localmente

Por utilizar módulos e recursos carregados pelo navegador, recomenda-se
executar o projeto por um servidor HTTP local em vez de abrir os
arquivos diretamente com `file://`.

No VS Code, uma opção é utilizar a extensão **Live Server**:

1.  clone ou baixe o repositório;
2.  abra a pasta do projeto no VS Code;
3.  inicie o Live Server a partir de `index.html`;
4.  configure o ambiente Supabase conforme a estrutura do projeto;
5.  acesse o sistema pelo endereço local fornecido.

## Publicação

A interface pode ser publicada como site estático pelo **GitHub Pages**,
enquanto os dados e a autenticação permanecem no Supabase.

Após alterações locais:

``` bash
git status
git add .
git commit -m "Atualiza CCO"
git push origin main
```

Depois do push, aguarde a atualização do GitHub Pages e faça uma recarga
forçada no navegador caso arquivos antigos ainda estejam em cache.

## Segurança

Antes de publicar alterações:

-   não versionar senhas;
-   não versionar `service_role` keys;
-   não expor tokens privados;
-   manter RLS habilitado e revisado nas tabelas necessárias;
-   validar operações destrutivas antes da execução;
-   utilizar scripts de reparo direcionados somente após auditoria;
-   manter backups antes de mudanças estruturais no banco.

## Status do projeto

O CCO está em desenvolvimento contínuo, com foco atual em:

-   consolidação dos dashboards;
-   atualização incremental dos dados;
-   análises comparativas;
-   inteligência analítica;
-   qualidade e consistência das informações;
-   experiência desktop e mobile;
-   visualização geográfica das ocorrências.

------------------------------------------------------------------------

**CCO --- Centro Inteligente de Controle Operacional**

Dashboard operacional, análise de dados e inteligência aplicada à
gestão.
