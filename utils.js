

/* =====================================================
   PATCH LIMPEZA FINAL • CCO
   - protege Chart.js contra canvas inexistente
   - cria alias seguro do Supabase
===================================================== */
(function ccoPatchLimpezaFinal(){
  try {
    if (window.supabaseClient && !window.banco) window.banco = window.supabaseClient;
  } catch(e) {}

  window.__CCO_CHARTS__ = window.__CCO_CHARTS__ || {};

  window.ccoGetCanvas = function(idOuCanvas){
    const el = typeof idOuCanvas === "string" ? document.getElementById(idOuCanvas) : idOuCanvas;
    if (!el) return null;
    if (el instanceof HTMLCanvasElement) return el;
    if (el.canvas instanceof HTMLCanvasElement) return el.canvas;
    return null;
  };

  window.ccoDestroyChart = function(idOuCanvas){
    try {
      const canvas = window.ccoGetCanvas(idOuCanvas);
      if (!canvas || !window.Chart) return;
      const atual = Chart.getChart ? Chart.getChart(canvas) : null;
      if (atual) atual.destroy();
    } catch(e) {}
  };

  window.ChartSeguroFinal = window.ChartSeguroFinal || function(idOuCanvas, config){
    try {
      const canvas = window.ccoGetCanvas(idOuCanvas);
      if (!canvas || !window.Chart) {
        console.warn("Chart ignorado: canvas inexistente", idOuCanvas);
        return ccoChartVazioFinal ? ccoChartVazioFinal() : null;
      }
      window.ccoDestroyChart(canvas);
      return new Chart(canvas, config);
    } catch (erro) {
      console.warn("Chart ignorado por segurança:", erro);
      return ccoChartVazioFinal ? ccoChartVazioFinal() : null;
    }
  };
})();

/* =====================================================
   GUARDAS CHART.JS • evita erro em canvas inexistente no GitHub Pages/mobile
===================================================== */
function ccoCanvasValidoFinal(item) {
  try {
    if (!item) return false;
    const canvas = item.canvas || item;
    if (!canvas) return false;
    if (typeof canvas.getContext === "function") return !!canvas.ownerDocument;
    if (canvas.canvas && typeof canvas.canvas.getContext === "function") return !!canvas.canvas.ownerDocument;
    return false;
  } catch (e) {
    return false;
  }
}
function ccoChartVazioFinal() {
  return {
    destroy: function(){},
    update: function(){},
    resize: function(){},
    render: function(){},
    clear: function(){},
    stop: function(){},
    data: { labels: [], datasets: [] },
    options: {},
    config: { type: "bar", data: { labels: [], datasets: [] }, options: {} }
  };
}

/* =========================================================
   DESIGN MODERNO PARA GRÁFICOS DE COLUNA - CCO
   Alteração visual apenas: não muda dados, filtros, cálculos ou lógica.
   ========================================================= */
(function aplicarDesignModernoGraficosColuna() {
  if (!window.Chart || window.__CCO_COLUNAS_MODERNAS__) return;
  window.__CCO_COLUNAS_MODERNAS__ = true;

  const ChartOriginal = window.Chart;

  const PALETAS = [
    ['rgba(11, 44, 4, 0.92)', 'rgba(97, 165, 63, 0.28)'],
    ['rgba(83, 196, 166, 0.92)', 'rgba(83, 196, 166, 0.25)'],
    ['rgba(255, 193, 112, 0.92)', 'rgba(255, 193, 112, 0.25)'],
    ['rgba(183, 148, 255, 0.92)', 'rgba(183, 148, 255, 0.25)'],
    ['rgba(255, 139, 160, 0.92)', 'rgba(255, 139, 160, 0.25)'],
    ['rgba(96, 211, 235, 0.92)', 'rgba(96, 211, 235, 0.25)']
  ];

  function ehGraficoBarra(config) {
    return config && (config.type === 'bar' || (config.data && Array.isArray(config.data.datasets) && config.data.datasets.some(d => d.type === 'bar')));
  }

  function gradiente(ctx, chartArea, cores) {
    if (!chartArea) return cores[0];
    const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, cores[0]);
    g.addColorStop(1, cores[1]);
    return g;
  }

  function aplicar(config) {
    if (!ehGraficoBarra(config)) return config;

    config.data = config.data || {};
    config.data.datasets = (config.data.datasets || []).map((dataset, i) => {
      const cores = PALETAS[i % PALETAS.length];
      const novo = Object.assign({}, dataset);

      novo.borderRadius = dataset.borderRadius ?? 12;
      novo.borderSkipped = false;
      novo.barPercentage = dataset.barPercentage ?? 0.72;
      novo.categoryPercentage = dataset.categoryPercentage ?? 0.68;
      novo.maxBarThickness = dataset.maxBarThickness ?? 54;
      novo.hoverBorderWidth = 0;
      novo.borderWidth = dataset.borderWidth ?? 1;
      novo.borderColor = dataset.borderColor ?? 'rgba(255,255,255,0.92)';

      // Mantém cores especiais quando o gráfico já usa várias cores por barra.
      const temListaDeCores = Array.isArray(dataset.backgroundColor) && dataset.backgroundColor.length > 1;
      if (!temListaDeCores) {
        novo.backgroundColor = function(context) {
          const chart = context.chart;
          return gradiente(chart.ctx, chart.chartArea, cores);
        };
        novo.hoverBackgroundColor = cores[0];
      }
      return novo;
    });

    config.options = config.options || {};
    config.options.responsive = true;
    config.options.maintainAspectRatio = config.options.maintainAspectRatio ?? false;
    config.options.animation = Object.assign({ duration: 900, easing: 'easeOutQuart' }, config.options.animation || {});
    config.options.layout = Object.assign({ padding: { top: 18, right: 18, bottom: 10, left: 8 } }, config.options.layout || {});

    config.options.plugins = config.options.plugins || {};
    config.options.plugins.legend = Object.assign({
      position: 'bottom',
      labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 18, color: '#FFFFFF', font: { size: 12, weight: '800' } }
    }, config.options.plugins.legend || {});
    config.options.plugins.tooltip = Object.assign({
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      titleColor: '#ffffff',
      bodyColor: '#e5e7eb',
      borderColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 12,
      displayColors: true
    }, config.options.plugins.tooltip || {});

    config.options.scales = config.options.scales || {};
    ['x', 'y'].forEach((axis) => {
      config.options.scales[axis] = Object.assign({
        grid: {
          color: axis === 'y' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.08)',
          drawBorder: false,
          tickLength: 0
        },
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
        border: { display: false }
      }, config.options.scales[axis] || {});
    });

    return config;
  }

  function ChartModerno(item, config) {
    if (!ccoCanvasValidoFinal(item)) return ccoChartVazioFinal();
    return new ChartOriginal(item, aplicar(config));
  }

  Object.setPrototypeOf(ChartModerno, ChartOriginal);
  ChartModerno.prototype = ChartOriginal.prototype;
  Object.getOwnPropertyNames(ChartOriginal).forEach((prop) => {
    try { if (!(prop in ChartModerno)) ChartModerno[prop] = ChartOriginal[prop]; } catch (e) {}
  });

  window.Chart = ChartModerno;
})();

/*
========================================================
INTRANET EXECUTIVA KPI CCO • SLU
APP.JS COMPLETO • VERSÃO CORRIGIDA PARA PLANILHAS GRANDES
========================================================

Correção principal:
- A planilha padrão possui muitas linhas, principalmente na aba P1.
- O navegador não suporta guardar a planilha inteira no localStorage.
- Esta versão NÃO salva todas as abas completas no localStorage.
- O localStorage guarda apenas um resumo leve.
- A base completa é enviada ao Supabase, quando ele estiver configurado.

Fluxo:
1. Importa Excel.
2. Lê Painel Executivo e abas P1 a P12.
3. Gera painel, gráficos, filtros e comparativo.
4. Salva resumo leve no navegador.
5. Tenta salvar base completa no Supabase.
6. Diretoria visualiza dados, mas não importa, exporta, limpa, nem acessa Base/Historico.
========================================================
*/

/* =====================================================
   VALORES CONTRATUAIS
===================================================== */
const VALORES_FIXOS = window.CCO_VALORES_FIXOS;

/*
  Serviços de valor fixo:
  - Não multiplicam valor unitário pelo acumulado.
*/
const SERVICOS_FIXOS = []; // Corrigido: nenhum serviço fica com valor unitário sozinho

/*
  Serviços cujo acumulado vem de Equipe.
*/
const SERVICOS_EQUIPE_LIMITADOS = ["P3", "P7", "P8", "P9", "P10", "P11"];

const MESES_BR = {
  "01": "Janeiro",
  "02": "Fevereiro",
  "03": "Março",
  "04": "Abril",
  "05": "Maio",
  "06": "Junho",
  "07": "Julho",
  "08": "Agosto",
  "09": "Setembro",
  "10": "Outubro",
  "11": "Novembro",
  "12": "Dezembro"
};

/* =====================================================
   STORAGE LEVE
   Não guardar todas as linhas no localStorage.
===================================================== */
const STORAGE_RESUMO_ATIVO = "cco_resumo_ativo_v20";
const STORAGE_HISTORICO_RESUMO = "cco_historico_resumo_v20";

/* =====================================================
   VARIÁVEIS GLOBAIS
===================================================== */
let painelExecutivo = [];
let painelExecutivoOriginal = [];

let operacoes = [];
let operacoesOriginal = [];

let sheetsOriginais = {};
let todasAsAbas = [];

let filtroExecucaoMesAtual = "";
let filtroExecucaoAnoAtual = "";

let graficoExecucao = null;
let graficoPizza = null;
let graficoPesoMensal = null;
let graficoKmMensal = null;
let graficoViagensMensal = null;
let graficoEquipeMensal = null;
let graficoExecucaoMensal = null;
let graficoPizzaMensal = null;
let graficoServicoDetalhe = null;

/* =====================================================
   INICIALIZAÇÃO
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  atualizarData();

  const input = document.getElementById("arquivoExcel");

  if (input) {
    input.addEventListener("change", importarPlanilhas);
  }

  aplicarRestricoesPerfil();

  /*
    Primeiro tenta carregar base ativa do Supabase.
    Se não tiver Supabase, carrega apenas resumo local.
  */
  /* A página KPI possui inicialização própria em kpi.js.
     Evita carregar a mesma base duas vezes durante o DOMContentLoaded. */
  if (["painel","kpi","execucao","dados","historico"].includes(String(window.CCO_PAGE || "").toLowerCase())) {
    return;
  }

  preencherTexto("nomeArquivo", "🔄 Carregando dados da base...");
  const carregouBanco = await carregarBaseSupabase();

  if (!carregouBanco) {
    carregarResumoLocal();
  }

  carregarHistorico();
});

/* =====================================================
   PERFIL
===================================================== */
function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado")) || {};
  } catch {
    return {};
  }
}

function ehDiretoria() {
  const usuario = obterUsuarioLogado();
  const perfil = String(usuario.perfil || "").toLowerCase();
  const login = String(usuario.usuario || "").toLowerCase();

  return perfil.includes("diretoria") || login.includes("diretoria");
}

function aplicarRestricoesPerfil() {

  const botaoLimpezaTotal = document.getElementById("btnLimpezaTotal");
  const usuarioAtualLimpeza = obterUsuarioLogado ? obterUsuarioLogado() : {};
  const usuarioAdminLimpeza =
    String(usuarioAtualLimpeza.usuario || "").toLowerCase() === "admin" ||
    String(usuarioAtualLimpeza.perfil || "").toLowerCase().includes("administrador");

  if (botaoLimpezaTotal && !usuarioAdminLimpeza) {
    botaoLimpezaTotal.style.display = "none";
    botaoLimpezaTotal.disabled = true;
  }

  if (!ehDiretoria()) return;

  const idsOcultar = [
    "btnImportar",
    "btnExportar",
    "btnLimpar",
    "menuBaseImportada",
    "menuHistorico"
  ];

  idsOcultar.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "none";
      el.disabled = true;
    }
  });

  ["tela-dados", "tela-historico"].forEach(id => {
    const tela = document.getElementById(id);
    if (tela) {
      tela.classList.remove("ativa");
      tela.style.display = "none";
    }
  });

  const ativa = document.querySelector(".tela.ativa");

  if (!ativa || ativa.id === "tela-dados" || ativa.id === "tela-historico") {
    const executivo = document.getElementById("tela-executivo");
    if (executivo) executivo.classList.add("ativa");
  }
}

function sair() {
  /*
    Remove apenas o usuário logado.
    Não remove resumo, histórico ou dados.
  */
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

/* =====================================================
   DATA
===================================================== */
function atualizarData() {
  const dataAtual = document.getElementById("dataAtual");

  if (!dataAtual) return;

  dataAtual.innerText =
    new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
}

/* =====================================================
   IMPORTAÇÃO
===================================================== */
async function importarPlanilhas(evento) {
  if (ehDiretoria()) {
    alert("Perfil Diretoria não possui permissão para importar planilhas.");
    evento.target.value = "";
    return;
  }

  const arquivos = Array.from(evento.target.files || []);

  if (!arquivos.length) return;

  if (!window.XLSX) {
    alert("A biblioteca XLSX não carregou. Verifique sua conexão com a internet.");
    return;
  }

  mostrarLoading(true);

  try {
    limparMemoria();

    for (const arquivo of arquivos) {
      const buffer = await arquivo.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: false
      });

      workbook.SheetNames.forEach(nomeAba => {
        const sheet = workbook.Sheets[nomeAba];

        const dados = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          raw: true,
          dateNF: "dd/mm/yyyy hh:mm"
        });

        const dadosFormatados =
          dados.map(linha => formatarLinhaEspelho(linha));

        const dadosNormalizados =
          dadosFormatados.map(linha => normalizarObjeto(linha));

        const nomeNormalizado = normalizar(nomeAba);

        sheetsOriginais[nomeNormalizado] = {
          nomeOriginal: nomeAba,
          codigoServico: extrairCodigo(nomeAba),
          dadosOriginais: dadosFormatados,
          dadosNormalizados
        };

        todasAsAbas.push({
          arquivo: arquivo.name,
          aba: nomeAba,
          linhas: dados.length
        });
      });
    }

    /*
      A aba Painel Executivo é obrigatória para montar a tabela oficial.
    */
    if (!sheetsOriginais["painel executivo"]) {
      alert("Aba 'Painel Executivo' não encontrada na planilha.");
      return;
    }

    gerarOperacoes();
    gerarPainelExecutivo();

    painelExecutivoOriginal = clonar(painelExecutivo);
    operacoesOriginal = clonar(operacoes);

    const nomeArquivo = arquivos.map(a => a.name).join(", ");
    const resumo = montarResumoLeve(nomeArquivo);

    /*
      Salva apenas resumo leve no navegador.
      Não salva a planilha inteira para evitar QuotaExceededError.
    */
    salvarResumoLocal(resumo);
    salvarHistoricoResumoLocal(resumo);

    preencherTexto(
      "nomeArquivo",
      `${arquivos.length} arquivo(s) importado(s) | ${todasAsAbas.length} aba(s) | ${operacoes.length} registros operacionais`
    );

    /*
      IMPORTANTE:
      Primeiro salva no Supabase e só depois renderiza gráficos.
      Assim, mesmo que algum canvas do navegador falhe, a base oficial
      fica gravada para abrir em outro navegador/celular.
    */
    const salvouBanco = await salvarBaseCompletaSupabase(nomeArquivo);

    try {
      atualizarDashboard();
      aplicarRestricoesPerfil();
    } catch (erroPainel) {
      console.warn("Dados salvos, mas houve erro ao atualizar gráficos:", erroPainel);
    }

    if (salvouBanco) {
      alert("Planilha importada e salva no Supabase para consulta dos usuários.");
    } else {
      alert(window.__CCO_ERRO_IMPORTACAO_MENSAGEM__ || "Planilha importada na tela, mas não foi salva no Supabase. Verifique Console e permissões do banco.");
      delete window.__CCO_ERRO_IMPORTACAO_MENSAGEM__;
    }

    carregarHistorico();

  } catch (erro) {
    console.error("Erro ao importar planilha:", erro);

    if (String(erro).includes("QuotaExceededError")) {
      alert("A planilha é muito grande para salvar no navegador. Esta versão salva apenas resumo local e envia a base completa ao Supabase.");
    } else {
      alert("Erro ao importar a planilha. Verifique se o arquivo está no padrão correto.");
    }
  } finally {
    mostrarLoading(false);
    evento.target.value = "";
  }
}

function limparMemoria() {
  painelExecutivo = [];
  painelExecutivoOriginal = [];
  operacoes = [];
  operacoesOriginal = [];
  sheetsOriginais = {};
  todasAsAbas = [];
}

/* =====================================================
   RESUMO LOCAL LEVE
===================================================== */
function montarResumoLeve(nomeArquivo) {
  const usuario = obterUsuarioLogado();

  return {
    id: `resumo_${Date.now()}`,
    nome_arquivo: nomeArquivo,
    usuario: usuario.usuario || "Não identificado",
    perfil: usuario.perfil || "Sem perfil",
    criado_em: new Date().toISOString(),
    total_abas: todasAsAbas.length,
    total_registros: operacoes.length,

    /*
      Guardar somente dados consolidados.
      Isso é leve e não trava o navegador.
    */
    painelExecutivo,
    operacoesResumo: gerarOperacoesResumoMensal(),
    abasResumo: todasAsAbas
  };
}

function salvarResumoLocal(resumo) {
  try {
    localStorage.setItem(STORAGE_RESUMO_ATIVO, JSON.stringify(resumo));
    return true;
  } catch (erro) {
    console.warn("Não foi possível salvar resumo local:", erro);
    return false;
  }
}

function salvarHistoricoResumoLocal(resumo) {
  try {
    let historico = [];

    try {
      historico = JSON.parse(localStorage.getItem(STORAGE_HISTORICO_RESUMO)) || [];
    } catch {
      historico = [];
    }

    historico.unshift(resumo);

    /*
      Limita o histórico local para evitar excesso de armazenamento.
      O histórico completo deve ficar no Supabase.
    */
    historico = historico.slice(0, 20);

    localStorage.setItem(STORAGE_HISTORICO_RESUMO, JSON.stringify(historico));
  } catch (erro) {
    console.warn("Não foi possível salvar histórico local:", erro);
  }
}


/* função duplicada removida: carregarResumoLocal */


/* =====================================================
   GERA RESUMO MENSAL DAS OPERAÇÕES
   Não guarda todos os registros, apenas agregado por mês/serviço.
===================================================== */
function gerarOperacoesResumoMensal() {
  const mapa = {};

  operacoes.forEach(item => {
    if (!item.data_normalizada) return;

    const mesAno = item.data_normalizada.substring(0, 7);
    const chave = `${mesAno}|${item.servico}`;

    if (!mapa[chave]) {
      mapa[chave] = {
        servico: item.servico,
        origem: "Resumo mensal",
        data_normalizada: `${mesAno}-01`,
        turno: "",
        ra: "",
        peso: 0,
        viagens: 0,
        km: 0,
        equipe: 0,
        status: "Com dados"
      };
    }

    mapa[chave].peso += numero(item.peso);
    mapa[chave].viagens += numero(item.viagens);
    mapa[chave].km += numero(item.km);
    mapa[chave].equipe += numero(item.equipe);
  });

  return Object.values(mapa);
}

/* =====================================================
   SUPABASE • MODO BANCO MENSAL
   Power Query atualiza a planilha e o sistema substitui
   o mês/ano correspondente, evitando duplicidade.
===================================================== */
function obterPeriodoImportado() {
  const datas = (operacoes || [])
    .map(item => item.data_normalizada)
    .filter(Boolean)
    .sort();

  const dataBase = datas[datas.length - 1] || new Date().toISOString().slice(0, 10);
  const ano = Number(String(dataBase).substring(0, 4));
  const mes = Number(String(dataBase).substring(5, 7));

  return { ano, mes };
}

function montarLinhasOperacoesSupabase(importacaoId) {
  return (operacoes || [])
    .filter(item => item.data_normalizada)
    .map(item => {
      const ano = Number(String(item.data_normalizada).substring(0, 4));
      const mes = Number(String(item.data_normalizada).substring(5, 7));

      return {
        importacao_id: importacaoId,
        servico: item.servico || '',
        data_operacao: item.data_normalizada || null,
        mes,
        ano,
        turno: item.turno || '',
        ra: item.ra || '',
        peso_t: numero(item.peso),
        viagens: numero(item.viagens),
        km_total: numero(item.km),
        equipe: numero(item.equipe),
        executado: numero(item.executado),
        json_original: item
      };
    });
}

function montarLinhasPainelSupabase(importacaoId, periodo) {
  return (painelExecutivo || []).map(item => ({
    importacao_id: importacaoId,
    servico: item.servico || '',
    nome_servico: item.nome_servico || '',
    previsto: numero(item.previsto_mes),
    acumulado: numero(item.acumulado_mes),
    percentual: numero(item.porcentagem_execucao),
    valor: numero(item.valor),
    medicao: item.medicao || '',
    dias_acumulados: numero(item.dias_acumulados),
    total_dias_mes: numero(item.total_dias_mes),
    mes: periodo.mes,
    ano: periodo.ano
  }));
}

async function inserirEmLotes(tabela, linhas, tamanho = 500) {
  if (!linhas.length) return true;

  for (let i = 0; i < linhas.length; i += tamanho) {
    const lote = linhas.slice(i, i + tamanho);
    const { error } = await banco.from(tabela).insert(lote);

    if (error) {
      console.error(`Erro ao inserir lote em ${tabela}:`, error);
      return false;
    }
  }

  return true;
}

/* =====================================================
   SUPABASE • SALVAR BASE COMPLETA
===================================================== */
async function salvarBaseCompletaSupabase(nomeArquivo) {
  if (!banco) return false;

  try {
    const usuario = obterUsuarioLogado();
    const periodo = obterPeriodoImportado();

    /*
      Como a planilha vem do Power Query, ela geralmente contém
      o mês atualizado. Então substituímos o mesmo mês/ano no banco
      antes de gravar novamente. Isso evita duplicidade.
    */
    const { data: importacoesMesmoPeriodo, error: erroBuscaPeriodo } =
      await banco
        .from('importacoes')
        .select('id')
        .eq('ano', periodo.ano)
        .eq('mes', periodo.mes);

    if (erroBuscaPeriodo) {
      console.error('Erro ao buscar importações do período:', erroBuscaPeriodo);
      return false;
    }

    const idsMesmoPeriodo = (importacoesMesmoPeriodo || []).map(item => item.id);

    if (idsMesmoPeriodo.length) {
      await banco.from('operacoes').delete().in('importacao_id', idsMesmoPeriodo);
      await banco.from('painel_executivo').delete().in('importacao_id', idsMesmoPeriodo);
      await banco.from('planilhas_importadas').delete().in('importacao_id', idsMesmoPeriodo);
      await banco.from('importacoes').delete().in('id', idsMesmoPeriodo);
    }

    /*
      Apenas marca como ativo o mês mais recente, mas mantém todos
      os meses no histórico para consulta e comparativos.
    */
    await banco.from('importacoes').update({ ativo: false }).eq('ativo', true);

    const { data: importacao, error: erroImportacao } =
      await banco
        .from('importacoes')
        .insert({
          nome_arquivo: nomeArquivo,
          usuario: usuario.usuario || 'Não identificado',
          perfil: usuario.perfil || 'Sem perfil',
          total_abas: todasAsAbas.length,
          mes: periodo.mes,
          ano: periodo.ano,
          tipo_importacao: 'substituir_periodo_power_query',
          ativo: true
        })
        .select()
        .single();

    if (erroImportacao) {
      console.error('Erro ao criar importação:', erroImportacao);
      return false;
    }

    for (const nomeAba of Object.keys(sheetsOriginais)) {
      const aba = sheetsOriginais[nomeAba];
      const lotesAba = dividirEmLotesSupabase(aba.dadosOriginais || [], 50);
      for (const loteAba of lotesAba) {
        const { error: erroInsertAba } = await banco.from('planilhas_importadas').insert({
            nome_arquivo: nomeArquivo,
            aba: aba.nomeOriginal,
            codigo_servico: aba.codigoServico || 'GERAL',
            dados: sanitizarParaSupabase(loteAba),
            importacao_id: importacao.id
          });
        if (erroInsertAba) {
          console.error(`Erro ao salvar aba ${aba.nomeOriginal}:`, erroInsertAba);
          return false;
        }
      }
    }

    const linhasOperacoes = montarLinhasOperacoesSupabase(importacao.id);
    const linhasPainel = montarLinhasPainelSupabase(importacao.id, periodo);

    const salvouOperacoes = await inserirEmLotes('operacoes', linhasOperacoes, 500);
    if (!salvouOperacoes) return false;

    const salvouPainel = await inserirEmLotes('painel_executivo', linhasPainel, 500);
    if (!salvouPainel) return false;

    return true;
  } catch (erro) {
    console.error('Erro geral ao salvar Supabase:', erro);
    return false;
  }
}

/* =====================================================
   SUPABASE • CARREGAR ÚLTIMO MÊS PRIMEIRO
===================================================== */
async function carregarBaseSupabase() {
  if (!banco) return false;

  try {
    const { data: ultima, error: erroUltima } =
      await banco
        .from('importacoes')
        .select('*')
        .order('ano', { ascending: false, nullsFirst: false })
        .order('mes', { ascending: false, nullsFirst: false })
        .order('criado_em', { ascending: false })
        .limit(1);

    if (erroUltima || !ultima || !ultima.length) {
      if (erroUltima) console.error('Erro ao buscar último mês:', erroUltima);
      return false;
    }

    const importacao = ultima[0];

    const { data: painelBanco, error: erroPainel } =
      await banco
        .from('painel_executivo')
        .select('*')
        .eq('importacao_id', importacao.id)
        .order('servico', { ascending: true });

    /*
      Carrega TODAS as operações salvas no banco.
      O Painel Geral abre com o último mês, mas os filtros, histórico
      e comparativo conseguem enxergar meses anteriores.
    */
    const { data: operacoesBanco, error: erroOperacoes } =
      await banco
        .from('operacoes')
        .select('*')
        .order('ano', { ascending: false, nullsFirst: false })
        .order('mes', { ascending: false, nullsFirst: false })
        .order('data_operacao', { ascending: false });

    if (erroPainel || erroOperacoes) {
      console.error('Erro ao carregar dados consolidados:', erroPainel || erroOperacoes);
      return false;
    }

    limparMemoria();

    painelExecutivo = (painelBanco || []).map(item => ({
      servico: item.servico || '',
      nome_servico: item.nome_servico || '',
      acumulado_mes: numero(item.acumulado),
      medicao: item.medicao || '',
      previsto_mes: numero(item.previsto),
      porcentagem_execucao: numero(item.percentual),
      dias_acumulados: numero(item.dias_acumulados),
      total_dias_mes: numero(item.total_dias_mes),
      valor: numero(item.valor),
      status: numero(item.acumulado) > 0 ? 'Com dados' : 'Sem dados'
    }));

    operacoes = (operacoesBanco || []).map(item => ({
      servico: item.servico || '',
      origem: 'Banco Supabase',
      data: item.data_operacao || '',
      data_normalizada: item.data_operacao || '',
      turno: item.turno || '',
      ra: item.ra || 'Por demanda',
      setor: '',
      peso: numero(item.peso_t),
      viagens: numero(item.viagens),
      km: numero(item.km_total),
      equipe: numero(item.equipe),
      executado: numero(item.executado),
      status: 'Com dados'
    }));

    painelExecutivoOriginal = clonar(painelExecutivo);
    operacoesOriginal = clonar(operacoes);

    todasAsAbas = [{
      arquivo: importacao.nome_arquivo || 'Banco Supabase',
      aba: 'Dados consolidados',
      linhas: operacoes.length
    }];

    sheetsOriginais = {};

    const resumo = montarResumoLeve(importacao.nome_arquivo || 'Banco Supabase');
    salvarResumoLocal(resumo);

    atualizarDashboard();
    aplicarRestricoesPerfil();

    const mesNome = MESES_BR[String(importacao.mes).padStart(2, '0')] || importacao.mes || '-';
    preencherTexto(
      'nomeArquivo',
      `Banco carregado: último mês ${mesNome}/${importacao.ano || '-'} primeiro | ${operacoes.length} registros em todos os meses`
    );

    return true;
  } catch (erro) {
    console.error('Erro geral ao carregar Supabase:', erro);
    return false;
  }
}

async function restaurarImportacaoSupabase(id) {
  if (!banco) return;

  try {
    await banco.from('importacoes').update({ ativo: false }).eq('ativo', true);

    const { error } =
      await banco
        .from('importacoes')
        .update({ ativo: true })
        .eq('id', id);

    if (error) {
      console.error('Erro ao restaurar importação:', error);
      alert('Erro ao restaurar importação.');
      return;
    }

    await carregarImportacaoPorIdSupabase(id);
    carregarHistorico();

    alert('Importação restaurada com sucesso.');
  } catch (erro) {
    console.error('Erro ao restaurar Supabase:', erro);
  }
}

async function carregarImportacaoPorIdSupabase(id) {
  const { data: importacao, error: erroImp } =
    await banco.from('importacoes').select('*').eq('id', id).single();

  if (erroImp || !importacao) return false;

  const { data: painelBanco } =
    await banco.from('painel_executivo').select('*').eq('importacao_id', id);

  const { data: operacoesBanco } =
    await banco.from('operacoes').select('*').eq('importacao_id', id).order('data_operacao', { ascending: true });

  limparMemoria();

  painelExecutivo = (painelBanco || []).map(item => ({
    servico: item.servico || '',
    nome_servico: item.nome_servico || '',
    acumulado_mes: numero(item.acumulado),
    medicao: item.medicao || '',
    previsto_mes: numero(item.previsto),
    porcentagem_execucao: numero(item.percentual),
    dias_acumulados: numero(item.dias_acumulados),
    total_dias_mes: numero(item.total_dias_mes),
    valor: numero(item.valor),
    status: numero(item.acumulado) > 0 ? 'Com dados' : 'Sem dados'
  }));

  operacoes = (operacoesBanco || []).map(item => ({
    servico: item.servico || '',
    origem: 'Banco Supabase',
    data: item.data_operacao || '',
    data_normalizada: item.data_operacao || '',
    turno: item.turno || '',
    ra: item.ra || 'Por demanda',
    setor: '',
    peso: numero(item.peso_t),
    viagens: numero(item.viagens),
    km: numero(item.km_total),
    equipe: numero(item.equipe),
    executado: numero(item.executado),
    status: 'Com dados'
  }));

  painelExecutivoOriginal = clonar(painelExecutivo);
  operacoesOriginal = clonar(operacoes);

  atualizarDashboard();
  return true;
}

/* =====================================================
   LEITURA DAS ABAS OPERACIONAIS
===================================================== */

/* função duplicada removida: gerarOperacoes */


/* =====================================================
   PAINEL EXECUTIVO
===================================================== */

/* função duplicada removida: gerarPainelExecutivo */



/* função duplicada removida: calcularAcumuladoPorServico */


function limitarPeloPrevisto(realizado, previstoMes) {
  const realizadoNumero = numero(realizado);
  const previstoNumero = numero(previstoMes);

  if (!previstoNumero) return realizadoNumero;

  return Math.min(realizadoNumero, previstoNumero);
}

/* =====================================================
   DASHBOARD
===================================================== */

/* função duplicada removida: atualizarDashboard */


function renderCards() {
  const servicosComDados =
    painelExecutivo.filter(item => item.status === "Com dados").length;

  const mediaExecucao =
    painelExecutivo.length
      ? painelExecutivo.reduce((soma, item) => soma + numero(item.porcentagem_execucao), 0) / painelExecutivo.length
      : 0;

  preencherTexto("kpiServicosDados", servicosComDados);
  preencherTexto("kpiExecucaoMedia", `${formatarNumero(mediaExecucao)}%`);
  preencherTexto("kpiAbas", todasAsAbas.length);
}


/* função duplicada removida: renderTabelaExecutiva */


function linhaTabelaOficial(item) {
  const percentual = item.porcentagem_execucao == null ? "Previsto indisponível" : `${formatarNumero(item.porcentagem_execucao)}%`;
  const metrica = item.metrica_disponivel === false ? "Indisponível" : formatarNumero(item.acumulado_mes);
  const avisos = Array.isArray(item.avisos_consistencia) && item.avisos_consistencia.length
    ? ` title="${item.avisos_consistencia.join(" ").replace(/"/g, "&quot;")}"` : "";
  return `
    <tr${avisos}>
      <td><strong>${item.servico}</strong></td>
      <td>${metrica}</td>
      <td>${item.medicao}</td>
      <td>${formatarNumero(item.previsto_mes)}</td>
      <td title="Percentual calculado sobre o previsto proporcional aos dias acumulados.">${percentual}</td>
      <td>${formatarNumero(item.dias_acumulados)}</td>
      <td>${formatarNumero(item.total_dias_mes)}</td>
      <td>${formatarMoeda(item.valor)}</td>
      <td><span class="badge ${item.status === "Com dados" ? "ok" : "info"}">${item.status}</span></td>
    </tr>
  `;
}

/* =====================================================
   FILTRO MENSAL PAINEL GERAL
===================================================== */

/* função duplicada removida: aplicarFiltroMensal */



/* função duplicada removida: limparFiltroPeriodo */



/* função duplicada removida: recalcularPainelPorFiltro */


/* =====================================================
   EXECUÇÃO P1 A P12
===================================================== */
function aplicarFiltroExecucaoMensal() {
  filtroExecucaoMesAtual = document.getElementById("filtroExecucaoMes")?.value || "";
  filtroExecucaoAnoAtual = document.getElementById("filtroExecucaoAno")?.value || "";

  renderTabelaContratualMensal();

  const detalhe = document.getElementById("servico-detalhe");

  if (detalhe && detalhe.classList.contains("ativa")) {
    const codigo = obterServicoAtivo();
    if (codigo) renderDetalheServicoMensal(codigo);
  }
}

function limparFiltroExecucaoMensal() {
  const mes = document.getElementById("filtroExecucaoMes");
  const ano = document.getElementById("filtroExecucaoAno");

  if (mes) mes.value = "";
  if (ano) ano.value = "";

  filtroExecucaoMesAtual = "";
  filtroExecucaoAnoAtual = "";

  renderTabelaContratualMensal();

  const detalhe = document.getElementById("servico-detalhe");

  if (detalhe && detalhe.classList.contains("ativa")) {
    const codigo = obterServicoAtivo();
    if (codigo) renderDetalheServicoMensal(codigo);
  }
}

function obterServicoAtivo() {
  const botao = document.querySelector("#tela-contrato .servico-btn.active");

  if (!botao) return "";

  const texto = botao.innerText || "";
  const match = texto.match(/P\d+(\.\d+)?/);

  return match ? match[0] : "";
}

function obterDadosExecucaoMensal() {
  let dados = clonar(operacoesOriginal);

  if (filtroExecucaoAnoAtual) {
    dados =
      dados.filter(item =>
        item.data_normalizada &&
        item.data_normalizada.substring(0, 4) === filtroExecucaoAnoAtual
      );
  }

  if (filtroExecucaoMesAtual) {
    dados =
      dados.filter(item =>
        item.data_normalizada &&
        item.data_normalizada.substring(5, 7) === filtroExecucaoMesAtual
      );
  }

  let descricao = "Todos os meses importados";

  if (filtroExecucaoMesAtual && filtroExecucaoAnoAtual) {
    descricao = formatarMesBrasil(`${filtroExecucaoAnoAtual}-${filtroExecucaoMesAtual}`);
  } else if (filtroExecucaoAnoAtual) {
    descricao = `Ano ${filtroExecucaoAnoAtual}`;
  }

  return {
    dados,
    descricao,
    mes: filtroExecucaoMesAtual,
    ano: filtroExecucaoAnoAtual
  };
}


/* função duplicada removida: gerarPainelExecucaoMensal */


function renderTabelaContratual() {
  renderTabelaContratualMensal();
}


/* função duplicada removida: renderTabelaContratualMensal */


function mostrarServico(codigo, botao) {
  document.querySelectorAll("#tela-contrato .servico-btn")
    .forEach(btn => btn.classList.remove("active"));

  if (botao) botao.classList.add("active");

  const geral = document.getElementById("servico-geral");
  const detalhe = document.getElementById("servico-detalhe");

  if (codigo === "geral") {
    if (geral) geral.classList.add("ativa");
    if (detalhe) detalhe.classList.remove("ativa");
    renderTabelaContratualMensal();
    return;
  }

  if (geral) geral.classList.remove("ativa");
  if (detalhe) detalhe.classList.add("ativa");

  renderDetalheServicoMensal(codigo);
}


/* função duplicada removida: renderDetalheServicoMensal */


/* =====================================================
   BASE IMPORTADA
===================================================== */
function renderTabelaDados() {
  const tabela = document.getElementById("tabelaDados");

  if (!tabela) return;

  const busca = normalizar(document.getElementById("busca")?.value || "");
  const filtroPrograma = document.getElementById("filtroPrograma")?.value || "Todos";
  const filtroStatus = document.getElementById("filtroStatus")?.value || "Todos";
  const filtroData = document.getElementById("filtroDataBase")?.value || "";

  const filtrados =
    operacoes.filter(item => {
      const texto = normalizar(Object.values(item).join(" "));
      const passouData = !filtroData || item.data_normalizada === filtroData;

      return (
        texto.includes(busca) &&
        (filtroPrograma === "Todos" || item.servico === filtroPrograma) &&
        (filtroStatus === "Todos" || item.status === filtroStatus) &&
        passouData
      );
    });

  tabela.innerHTML =
    filtrados.map(item => `
      <tr>
        <td>${item.servico}</td>
        <td>${item.origem}</td>
        <td>${formatarDataBRSimples(item.data_normalizada)}</td>
        <td>${item.turno}</td>
        <td>${item.ra}</td>
        <td>${formatarNumero(item.peso)}</td>
        <td>${formatarNumero(item.viagens)}</td>
        <td>${formatarNumero(item.km)}</td>
        <td>${formatarNumero(item.equipe)}</td>
      </tr>
    `).join("") ||
    `<tr><td colspan="9">Nenhum dado encontrado.</td></tr>`;
}

function limparFiltroBase() {
  const busca = document.getElementById("busca");
  const data = document.getElementById("filtroDataBase");
  const programa = document.getElementById("filtroPrograma");
  const status = document.getElementById("filtroStatus");

  if (busca) busca.value = "";
  if (data) data.value = "";
  if (programa) programa.value = "Todos";
  if (status) status.value = "Todos";

  renderTabelaDados();
}

/* =====================================================
   FILTROS
===================================================== */

/* função duplicada removida: carregarFiltrosPeriodoDisponiveis */


function carregarFiltrosExecucaoMensal() {
  const meses = new Set();
  const anos = new Set();

  operacoesOriginal.forEach(item => {
    if (!item.data_normalizada) return;
    anos.add(item.data_normalizada.substring(0, 4));
    meses.add(item.data_normalizada.substring(5, 7));
  });

  preencherSelectMes("filtroExecucaoMes", meses, "Todos os meses", filtroExecucaoMesAtual);
  preencherSelectAno("filtroExecucaoAno", anos, "Todos os anos", filtroExecucaoAnoAtual);
}

function preencherSelectMes(id, meses, textoInicial = "Selecionar", valorAtual = null) {
  const select = document.getElementById(id);

  if (!select) return;

  const valor = valorAtual !== null ? valorAtual : select.value;

  select.innerHTML = `<option value="">${textoInicial}</option>`;

  [...meses].sort().forEach(mes => {
    if (mes) {
      select.innerHTML += `<option value="${mes}">${MESES_BR[mes] || mes}</option>`;
    }
  });

  if ([...meses].includes(valor)) select.value = valor;
}

function preencherSelectAno(id, anos, textoInicial = "Selecionar", valorAtual = null) {
  const select = document.getElementById(id);

  if (!select) return;

  const valor = valorAtual !== null ? valorAtual : select.value;

  select.innerHTML = `<option value="">${textoInicial}</option>`;

  [...anos].sort().forEach(ano => {
    if (ano) {
      select.innerHTML += `<option value="${ano}">${ano}</option>`;
    }
  });

  if ([...anos].includes(valor)) select.value = valor;
}

function renderFiltros() {
  const filtroPrograma = document.getElementById("filtroPrograma");
  const filtroStatus = document.getElementById("filtroStatus");

  if (!filtroPrograma || !filtroStatus) return;

  const programaSelecionado = filtroPrograma.value || "Todos";
  const statusSelecionado = filtroStatus.value || "Todos";

  const programas = [
    "Todos",
    ...new Set(operacoesOriginal.map(item => item.servico).filter(Boolean))
  ];

  filtroPrograma.innerHTML =
    programas.map(item =>
      `<option ${item === programaSelecionado ? "selected" : ""}>${item}</option>`
    ).join("");

  filtroStatus.innerHTML = `
    <option ${statusSelecionado === "Todos" ? "selected" : ""}>Todos</option>
    <option ${statusSelecionado === "Com dados" ? "selected" : ""}>Com dados</option>
    <option ${statusSelecionado === "Sem dados" ? "selected" : ""}>Sem dados</option>
  `;
}

/* =====================================================
   RESUMO / RANKING / ALERTAS
===================================================== */

/* função duplicada removida: renderResumo */


function renderResumoAutomaticoDiretoria() {
  const area = document.getElementById("resumoAutomaticoDiretoria");

  if (!area) return;

  if (!painelExecutivo.length) {
    area.innerHTML = "Nenhuma base carregada.";
    return;
  }

  const totalServicos = painelExecutivo.length;
  const servicosComDados = painelExecutivo.filter(item => item.status === "Com dados").length;

  const media =
    painelExecutivo.length
      ? painelExecutivo.reduce((s, item) => s + numero(item.porcentagem_execucao), 0) / painelExecutivo.length
      : 0;

  const maior =
    [...painelExecutivo]
      .sort((a, b) => numero(b.porcentagem_execucao) - numero(a.porcentagem_execucao))[0];

  const menor =
    [...painelExecutivo]
      .sort((a, b) => numero(a.porcentagem_execucao) - numero(b.porcentagem_execucao))[0];

  area.innerHTML = `
    <p>Foram analisados <strong>${totalServicos}</strong> serviços, sendo <strong>${servicosComDados}</strong> com dados registrados.</p>
    <p>A média geral de execução foi de <strong>${formatarNumero(media)}%</strong>.</p>
    <p>Melhor desempenho: <strong>${maior?.servico || "-"}</strong>, com <strong>${formatarNumero(maior?.porcentagem_execucao || 0)}%</strong>.</p>
    <p>Menor execução: <strong>${menor?.servico || "-"}</strong>, com <strong>${formatarNumero(menor?.porcentagem_execucao || 0)}%</strong>.</p>
  `;
}


/* função duplicada removida: renderRankingOperacional */


function renderAlertas() {
  renderAlertasPeriodo("alertasExecutivos", painelExecutivo);
}

function renderRankingPeriodo(idArea, painel) {
  const area = document.getElementById(idArea);

  if (!area) return;

  const ranking =
    [...painel]
      .filter(item => numero(item.porcentagem_execucao) > 0)
      .sort((a, b) => numero(b.porcentagem_execucao) - numero(a.porcentagem_execucao))
      .slice(0, 3);

  if (!ranking.length) {
    area.innerHTML = "Nenhum dado disponível.";
    return;
  }

  area.innerHTML =
    ranking.map((item, index) => {
      const medalha = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";

      return `
        <div class="ranking-item">
          <div class="ranking-left">
            <div class="ranking-medalha">${medalha}</div>
            <div>
              <strong>${item.servico}</strong>
              <small>${item.nome_servico || "Serviço operacional"}</small>
            </div>
          </div>
          <div class="ranking-right">
            <strong>${formatarNumero(item.porcentagem_execucao)}%</strong>
            <span>${formatarNumero(item.acumulado_mes)}</span>
          </div>
        </div>
      `;
    }).join("");
}

function renderAlertasPeriodo(idArea, painel) {
  const area = document.getElementById(idArea);

  if (!area) return;

  const semDados = painel.filter(item => item.status === "Sem dados");

  if (!semDados.length) {
    area.innerHTML = `<p><span class="badge ok">Normal</span> Sem alertas críticos.</p>`;
    return;
  }

  area.innerHTML =
    `<p><span class="badge critico">Atenção</span> ${semDados.length} serviço(s) sem dados.</p>`;
}

/* =====================================================
   GRÁFICOS
===================================================== */

/* função duplicada removida: renderGraficos */


function renderGraficoServicoDetalhe(codigo, dados) {
  const canvas = document.getElementById("graficoServicoDetalhe");

  if (!canvas) return;

  if (graficoServicoDetalhe) graficoServicoDetalhe.destroy();

  graficoServicoDetalhe = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Previsto", "Executado", "% Execução", "Peso", "Viagens", "KM", "Equipes"],
      datasets: [{
        label: `Indicadores ${codigo}`,
        data: [
          dados.previsto,
          dados.executado,
          dados.percentual,
          dados.totalPeso,
          dados.totalViagens,
          dados.totalKm,
          dados.totalEquipes
        ],
        borderRadius: 10,
        backgroundColor: "#A7F3D0"
      }]
    },
    options: opcoesGrafico()
  });
}

function opcoesGrafico() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
}

/* =====================================================
   COMPARATIVO MENSAL
===================================================== */

/* função duplicada removida: renderComparativoMensal */



/* função duplicada removida: renderAnaliseComparativoMensal */



/* função duplicada removida: renderGraficosMensais */



/* função duplicada removida: criarGraficoMensal */


function limparGraficosMensais() {
  [
    graficoPesoMensal,
    graficoKmMensal,
    graficoViagensMensal,
    graficoEquipeMensal,
    graficoExecucaoMensal,
    graficoPizzaMensal
  ].forEach(g => {
    if (g) g.destroy();
  });

  graficoPesoMensal = null;
  graficoKmMensal = null;
  graficoViagensMensal = null;
  graficoEquipeMensal = null;
  graficoExecucaoMensal = null;
  graficoPizzaMensal = null;
}


/* função duplicada removida: renderRankingMensal */


/* =====================================================
   HISTÓRICO
===================================================== */
async function carregarHistorico() {
  const tabela = document.getElementById("tabelaHistorico");

  if (!tabela) return;

  let linhas = "";

  /*
    Histórico local leve.
  */
  try {
    const historicoLocal =
      JSON.parse(localStorage.getItem(STORAGE_HISTORICO_RESUMO)) || [];

    historicoLocal.forEach(item => {
      linhas += `
        <tr>
          <td>${new Date(item.criado_em).toLocaleString("pt-BR")}</td>
          <td>${item.usuario || "-"}</td>
          <td>${item.perfil || "-"}</td>
          <td>${item.nome_arquivo || "-"}</td>
          <td>${item.total_abas || 0}</td>
          <td><span class="badge ok">RESUMO LOCAL</span></td>
          <td>-</td>
        </tr>
      `;
    });
  } catch {}

  /*
    Histórico Supabase.
  */
  if (banco) {
    try {
      const { data, error } =
        await banco
          .from("importacoes")
          .select("*")
          .order("criado_em", { ascending: false });

      if (!error && data && data.length) {
        data.forEach(item => {
          linhas += `
            <tr>
              <td>${new Date(item.criado_em).toLocaleString("pt-BR")}</td>
              <td>${item.usuario || "-"}</td>
              <td>${item.perfil || "-"}</td>
              <td>${item.nome_arquivo || "-"}</td>
              <td>${item.total_abas || 0}</td>
              <td><span class="badge ${item.ativo ? "ok" : "info"}">${item.ativo ? "ATIVA BANCO" : "BANCO"}</span></td>
              <td><button class="btn-mini" onclick="restaurarImportacaoSupabase(${item.id})">Restaurar</button></td>
            </tr>
          `;
        });
      }
    } catch (erro) {
      console.warn("Erro ao carregar histórico Supabase:", erro);
    }
  }

  tabela.innerHTML =
    linhas ||
    `<tr><td colspan="7">Nenhuma importação guardada para consulta.</td></tr>`;
}

/* =====================================================
   LIMPAR
===================================================== */
async function limparBanco() {
  if (ehDiretoria()) {
    alert("Perfil Diretoria não possui permissão para limpar dados.");
    return;
  }

  if (!confirm("Deseja limpar somente a base ativa? O histórico será preservado.")) return;

  localStorage.removeItem(STORAGE_RESUMO_ATIVO);

  if (banco) {
    try {
      await banco
        .from("importacoes")
        .update({ ativo: false })
        .eq("ativo", true);
    } catch (erro) {
      console.warn("Não foi possível desativar base no Supabase:", erro);
    }
  }

  limparMemoria();
  atualizarDashboard();
  carregarHistorico();

  preencherTexto("nomeArquivo", "Nenhuma base ativa. Histórico preservado.");
}

/* =====================================================
   TELAS
===================================================== */

/* função duplicada removida: mostrarTela */


/* =====================================================
   CARDS
===================================================== */
function criarCard(titulo, valor, subtitulo, ocultarZero = true) {
  const valorNumerico =
    numero(
      String(valor)
        .replace("t/viagem", "")
        .replace("t", "")
        .replace("%", "")
    );

  if (
    ocultarZero &&
    (
      valorNumerico === 0 ||
      valorNumerico === null ||
      valorNumerico === undefined
    )
  ) {
    return "";
  }

  return `
    <div class="card">
      <span>${titulo}</span>
      <strong>${valor}</strong>
      <small>${subtitulo}</small>
    </div>
  `;
}

/* =====================================================
   UTILITÁRIOS
===================================================== */
function extrairCodigo(texto) {
  const match =
    String(texto || "")
      .toUpperCase()
      .match(/P\d+(\.\d+)?/);

  return match ? match[0] : "";
}

function normalizarObjeto(obj) {
  const novo = {};

  Object.keys(obj || {}).forEach(chave => {
    const novaChave =
      normalizar(chave)
        .replace(/ª/g, "a")
        .replace(/º/g, "o")
        .replace(/%/g, "porcentagem")
        .replace(/\$/g, "valor")
        .replace(/\./g, "")
        .replace(/\(/g, "")
        .replace(/\)/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^\w]/g, "");

    novo[novaChave] = obj[chave];
  });

  return novo;
}

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatarLinhaEspelho(linha) {
  const novaLinha = {};

  Object.keys(linha).forEach(coluna => {
    const valor = linha[coluna];
    const nome = normalizar(coluna);

    /*
      Não converter dias acumulados nem total de dias como data.
    */
    if (
      nome.includes("dias acumulado") ||
      nome.includes("dias acumulados") ||
      nome.includes("total de dias") ||
      nome.includes("total dias")
    ) {
      novaLinha[coluna] = extrairDiaCorreto(valor);
      return;
    }

    if (ehCampoDataHora(coluna)) {
      novaLinha[coluna] = formatarDataHoraBR(valor);
    } else if (ehCampoHora(coluna)) {
      novaLinha[coluna] = formatarHoraBR(valor);
    } else {
      novaLinha[coluna] = valor;
    }
  });

  return novaLinha;
}

function ehCampoDataHora(coluna) {
  const nome = normalizar(coluna);

  return (
    nome.includes("data") ||
    nome.includes("inicio") ||
    nome.includes("fim") ||
    nome.includes("termino") ||
    nome === "dia"
  );
}

function ehCampoHora(coluna) {
  const nome = normalizar(coluna);
  return nome.includes("hora") || nome.includes("tempo");
}

function formatarDataHoraBR(valor) {
  if (!valor) return "";

  if (typeof valor === "number") {
    const data = XLSX.SSF.parse_date_code(valor);

    if (!data) return valor;

    const dia = String(data.d).padStart(2, "0");
    const mes = String(data.m).padStart(2, "0");
    const ano = data.y;
    const hora = String(data.H || 0).padStart(2, "0");
    const minuto = String(data.M || 0).padStart(2, "0");

    if (hora === "00" && minuto === "00") {
      return `${dia}/${mes}/${ano}`;
    }

    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(String(valor))) return valor;

  const data = new Date(valor);

  if (isNaN(data)) return valor;

  return data.toLocaleString("pt-BR");
}

function formatarHoraBR(valor) {
  if (!valor) return "";

  if (typeof valor === "number") {
    const totalMinutos = Math.round(valor * 24 * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;

    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
  }

  return valor;
}

function normalizarData(valor) {
  if (!valor) return "";

  if (typeof valor === "number") {
    const data = XLSX.SSF.parse_date_code(valor);

    if (!data) return "";

    return `${data.y}-${String(data.m).padStart(2, "0")}-${String(data.d).padStart(2, "0")}`;
  }

  if (valor instanceof Date && !isNaN(valor)) {
    return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, "0")}-${String(valor.getDate()).padStart(2, "0")}`;
  }

  const texto = String(valor).trim();

  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);

  if (br) {
    const dia = br[1].padStart(2, "0");
    const mes = br[2].padStart(2, "0");
    let ano = br[3];

    if (ano.length === 2) ano = "20" + ano;

    return `${ano}-${mes}-${dia}`;
  }

  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (iso) {
    return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  }

  const data = new Date(texto);

  if (!isNaN(data)) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
  }

  return "";
}

function extrairDiaCorreto(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;

  if (typeof valor === "number") {
    if (valor >= 1 && valor <= 31) return valor;

    const data =
      XLSX?.SSF?.parse_date_code
        ? XLSX.SSF.parse_date_code(valor)
        : null;

    if (data && data.d >= 1 && data.d <= 31) return data.d;

    return numero(valor);
  }

  const texto = String(valor).trim();

  const dataBR = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);

  if (dataBR) return Number(dataBR[1]);

  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (iso && iso[1] === "1900") return Number(iso[3]);

  return numero(valor);
}

function contarDiasDistintos(dados) {
  return new Set(
    dados
      .map(item => item.data_normalizada)
      .filter(Boolean)
  ).size;
}


/* função duplicada removida: calcularTotalDiasMes */


function formatarDataBRSimples(dataIso) {
  if (!dataIso) return "-";

  const partes = String(dataIso).split("-");

  if (partes.length !== 3) return dataIso;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarMesBrasil(mesAno) {
  if (!mesAno) return "-";

  const partes = String(mesAno).split("-");

  if (partes.length < 2) return mesAno;

  const ano = partes[0];
  const mes = partes[1];

  return `${MESES_BR[mes] || mes}/${ano}`;
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;

  if (typeof valor === "number") return valor;

  let texto =
    String(valor)
      .trim()
      .replace(/[^\d,.-]/g, "");

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }

  const convertido = Number(texto);

  return isNaN(convertido) ? 0 : convertido;
}


/* função duplicada removida: calcularPercentual */


function formatarNumero(valor) {
  return numero(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatarMoeda(valor) {
  return numero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function preencherTexto(id, texto) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.innerText = texto;
  }
}

function preencherHtml(id, html) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.innerHTML = html;
  }
}

function mostrarLoading(ativo) {
  const loading = document.getElementById("loadingOverlay");

  if (!loading) return;

  loading.classList.toggle("ativo", ativo);
}

function clonar(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}



/*
========================================================
PATCH • KPI + FILTRO DIA PAINEL EXECUTIVO + COMPARATIVO POR SERVIÇO
========================================================
*/

let graficoKpiPesoServico = null;
let graficoKpiViagensServico = null;
let graficoComparativoServicoMensal = null;


/* função duplicada removida: atualizarDashboard */



/* função duplicada removida: carregarFiltrosPeriodoDisponiveis */


function preencherSelectDia(id, dias, textoInicial = "Todos os dias") {
  const select = document.getElementById(id);
  if (!select) return;
  const valorAtual = select.value;
  select.innerHTML = `<option value="">${textoInicial}</option>`;

  [...dias]
    .sort((a, b) => Number(a) - Number(b))
    .forEach(dia => {
      if (dia) select.innerHTML += `<option value="${dia}">${dia}</option>`;
    });

  if ([...dias].includes(valorAtual)) select.value = valorAtual;
}


/* função duplicada removida: aplicarFiltroPeriodoExecutivo */



/* função duplicada removida: aplicarFiltroMensal */



/* função duplicada removida: limparFiltroPeriodo */


function recalcularPainelPorFiltroPeriodo(dadosFiltro, ano, mes, dia) {
  painelExecutivo = painelExecutivoOriginal.map(item => {
    const dadosServico = dadosFiltro.filter(op => op.servico === item.servico);
    const acumulado = calcularAcumuladoPorServico(item.servico, dadosServico, item.previsto_mes);
    const valorUnitario = VALORES_FIXOS[item.servico] || 0;
    const valorFinal = SERVICOS_FIXOS.includes(item.servico) ? valorUnitario : valorUnitario * acumulado;

    return {
      ...item,
      acumulado_mes: acumulado,
      porcentagem_execucao: calcularPercentual(acumulado, item.previsto_mes),
      dias_acumulados: dia ? (dadosServico.length ? 1 : 0) : (contarDiasDistintos(dadosServico) || item.dias_acumulados),
      total_dias_mes: ano && mes ? calcularTotalDiasMes(ano, mes) : item.total_dias_mes,
      valor: valorFinal,
      status: acumulado > 0 ? "Com dados" : "Sem dados"
    };
  });
}


/* função duplicada removida: renderPaginaKpi */



/* função duplicada removida: renderTabelaKpisOperacionais */



/* função duplicada removida: renderTabelaKpisPagamento */



/* função duplicada removida: renderGraficosKpi */


function agruparOperacoesPorServico() {
  const mapa = {};
  (operacoesOriginal || []).forEach(item => {
    const servico = item.servico || "Sem serviço";
    if (!mapa[servico]) mapa[servico] = { servico, peso: 0, viagens: 0, km: 0, equipe: 0, registros: 0 };
    mapa[servico].peso += numero(item.peso);
    mapa[servico].viagens += numero(item.viagens);
    mapa[servico].km += numero(item.km);
    mapa[servico].equipe += numero(item.equipe);
    mapa[servico].registros += 1;
  });
  return Object.values(mapa).sort((a, b) => a.servico.localeCompare(b.servico));
}


/* função duplicada removida: carregarFiltrosComparativoServico */



/* função duplicada removida: renderComparativoMensalPorServico */




/*
========================================================
PATCH • PÁGINA KPI POR SERVIÇO
========================================================
Transforma a página KPI em análise individual por serviço:
- filtro por serviço, mês e ano;
- cards do serviço;
- gráfico mensal;
- gráfico de indicadores;
- resumo automático;
- tabela KPI mensal por serviço.
========================================================
*/

let graficoKpiServicoMensal = null;
let graficoKpiServicoIndicadores = null;

/* =====================================================
   ATUALIZAR DASHBOARD COM KPI POR SERVIÇO
===================================================== */

/* função duplicada removida: atualizarDashboard */


/* =====================================================
   CARREGA FILTROS DA PÁGINA KPI
===================================================== */
function carregarFiltrosKpiServico() {
  const selectServico = document.getElementById("filtroKpiServico");
  const selectMes = document.getElementById("filtroKpiMes");
  const selectAno = document.getElementById("filtroKpiAno");

  if (!selectServico || !selectMes || !selectAno) return;

  const servicoAtual = selectServico.value;
  const mesAtual = selectMes.value;
  const anoAtual = selectAno.value;

  const servicos = new Set();
  const meses = new Set();
  const anos = new Set();

  (operacoesOriginal || []).forEach(item => {
    if (item.servico) servicos.add(item.servico);

    if (item.data_normalizada) {
      const partes = item.data_normalizada.split("-");
      if (partes.length === 3) {
        anos.add(partes[0]);
        meses.add(partes[1]);
      }
    }
  });

  selectServico.innerHTML = `<option value="">Todos os serviços</option>`;
  [...servicos].sort().forEach(servico => {
    selectServico.innerHTML += `<option value="${servico}">${servico}</option>`;
  });

  selectMes.innerHTML = `<option value="">Todos os meses</option>`;
  [...meses].sort().forEach(mes => {
    selectMes.innerHTML += `<option value="${mes}">${MESES_BR[mes] || mes}</option>`;
  });

  selectAno.innerHTML = `<option value="">Todos os anos</option>`;
  [...anos].sort().forEach(ano => {
    selectAno.innerHTML += `<option value="${ano}">${ano}</option>`;
  });

  if ([...servicos].includes(servicoAtual)) selectServico.value = servicoAtual;
  if ([...meses].includes(mesAtual)) selectMes.value = mesAtual;
  if ([...anos].includes(anoAtual)) selectAno.value = anoAtual;
}

/* =====================================================
   RENDER KPI POR SERVIÇO
===================================================== */

/* função duplicada removida: renderPaginaKpiPorServico */


/* Compatibilidade com função antiga */

/* função duplicada removida: renderPaginaKpi */


/* =====================================================
   PAINEL CONTRATUAL DO SERVIÇO PARA KPI
===================================================== */
function obterPainelServicoKpi(servicoFiltro, dados) {
  if (!servicoFiltro) {
    const previsto = painelExecutivoOriginal.reduce((s, i) => s + numero(i.previsto_mes), 0);
    const executado = painelExecutivoOriginal.reduce((s, i) => s + numero(i.acumulado_mes), 0);
    const percentual = calcularPercentual(executado, previsto);
    const valor = painelExecutivoOriginal.reduce((s, i) => s + numero(i.valor), 0);

    return { previsto, executado, percentual, valor };
  }

  const painel = painelExecutivoOriginal.find(item => item.servico === servicoFiltro);

  if (!painel) {
    return { previsto: 0, executado: 0, percentual: 0, valor: 0 };
  }

  const executado = calcularAcumuladoPorServico(servicoFiltro, dados, painel.previsto_mes);
  const percentual = calcularPercentual(executado, painel.previsto_mes);
  const valorUnitario = VALORES_FIXOS[servicoFiltro] || 0;
  const valor = SERVICOS_FIXOS.includes(servicoFiltro) ? valorUnitario : valorUnitario * executado;

  return {
    previsto: painel.previsto_mes,
    executado,
    percentual,
    valor
  };
}

/* =====================================================
   RESUMO AUTOMÁTICO KPI
===================================================== */
function renderResumoKpiServico(servico, dados, painel) {
  const area = document.getElementById("resumoKpiServico");
  if (!area) return;

  if (!dados.length) {
    area.innerHTML = `Nenhum lançamento encontrado para <strong>${servico}</strong> no período selecionado.`;
    return;
  }

  const peso = dados.reduce((s, i) => s + numero(i.peso), 0);
  const viagens = dados.reduce((s, i) => s + numero(i.viagens), 0);
  const km = dados.reduce((s, i) => s + numero(i.km), 0);
  const equipes = dados.reduce((s, i) => s + numero(i.equipe), 0);
  const dias = contarDiasDistintos(dados);

  const tonViagem = viagens ? peso / viagens : 0;
  const kmViagem = viagens ? km / viagens : 0;

  area.innerHTML = `
    <p>
      O serviço <strong>${servico}</strong> possui <strong>${formatarNumero(dias)}</strong>
      dia(s) com lançamento no período selecionado.
    </p>
    <p>
      Foram registrados <strong>${formatarNumero(peso)}</strong> toneladas,
      <strong>${formatarNumero(viagens)}</strong> viagens,
      <strong>${formatarNumero(km)}</strong> KM e
      <strong>${formatarNumero(equipes)}</strong> equipes.
    </p>
    <p>
      A produtividade média foi de <strong>${formatarNumero(tonViagem)} t/viagem</strong>
      e a distância média foi de <strong>${formatarNumero(kmViagem)} km/viagem</strong>.
    </p>
    <p>
      A execução contratual calculada está em
      <strong>${formatarNumero(painel.percentual)}%</strong>
      sobre o previsto selecionado.
    </p>
  `;
}

/* =====================================================
   TABELA KPI MENSAL DO SERVIÇO
===================================================== */

/* função duplicada removida: renderTabelaKpiServicoMensal */


/* =====================================================
   TABELA DE KPI DE PAGAMENTO POR SERVIÇO
===================================================== */
function renderTabelaKpisPagamentoPorServico(servicoFiltro) {
  const tabela = document.getElementById("tabelaKpisPagamento");
  if (!tabela) return;

  const linhas = [
    ["P1", "Peso coletado", "Toneladas coletadas", "Peso coletado = R$"],
    ["P2.1", "Viagens realizadas", "Viagens de coleta seletiva", "Viagens realizadas = R$"],
    ["P2.2", "Viagens realizadas", "Viagens de rejeito seletivo das IRR", "Viagens realizadas = R$"],
    ["P3", "Quantidade de equipes dia", "Equipe em operação", "Quantidade de equipes dia = R$"],
    ["P4", "Peso coletado", "Toneladas coletadas", "Peso coletado = R$"],
    ["P5", "Quilometragem executada", "KM executado", "KM executado / KM previsto"],
    ["P6", "Quilometragem executada", "KM executado", "KM executado / KM previsto"],
    ["P7", "Equipes em operação", "Equipe em operação", "Equipes previstas x equipes em operação"],
    ["P8", "Equipes em operação", "Equipe em operação", "Equipes previstas x equipes em operação"],
    ["P9", "Equipes em operação", "Equipe em operação", "Equipes previstas x equipes em operação"],
    ["P10", "Equipes em operação", "Equipe em operação", "Equipes previstas x equipes em operação"],
    ["P11", "Equipes em operação", "Pós-eventos e coleta de gordura", "Equipes previstas x equipes em operação"],
    ["P12", "Peso coletado por distrito x KM", "Peso e distância por distrito", "Peso coletado x KM percorrido"]
  ];

  const filtradas = servicoFiltro ? linhas.filter(l => l[0] === servicoFiltro) : linhas;

  tabela.innerHTML = filtradas.map(l => `
    <tr>
      <td>${l[0]}</td>
      <td>${l[1]}</td>
      <td>${l[2]}</td>
      <td>${l[3]}</td>
    </tr>
  `).join("");
}

/* Compatibilidade com função antiga */

/* função duplicada removida: renderTabelaKpisPagamento */


/* =====================================================
   GRÁFICOS KPI POR SERVIÇO
===================================================== */
function renderGraficosKpiServico(dados, servicoFiltro) {
  const canvasMensal = document.getElementById("graficoKpiServicoMensal");
  const canvasIndicadores = document.getElementById("graficoKpiServicoIndicadores");

  if (graficoKpiServicoMensal) graficoKpiServicoMensal.destroy();
  if (graficoKpiServicoIndicadores) graficoKpiServicoIndicadores.destroy();

  const mensal = agruparKpiServicoMensal(dados);

  if (canvasMensal) {
    graficoKpiServicoMensal = new Chart(canvasMensal, {
      type: "bar",
      data: {
        labels: mensal.map(i => i.mesBrasil),
        datasets: [
          {
            label: "Peso",
            data: mensal.map(i => i.peso),
            borderRadius: 10,
            backgroundColor: "#A7F3D0"
          },
          {
            label: "KM",
            data: mensal.map(i => i.km),
            borderRadius: 10,
            backgroundColor: "#BFDBFE"
          },
          {
            label: "Viagens",
            data: mensal.map(i => i.viagens),
            borderRadius: 10,
            backgroundColor: "#FDE68A"
          },
          {
            label: "Equipes",
            data: mensal.map(i => i.equipe),
            borderRadius: 10,
            backgroundColor: "#86EFAC"
          }
        ]
      },
      options: opcoesGrafico()
    });
  }

  const peso = dados.reduce((s, i) => s + numero(i.peso), 0);
  const viagens = dados.reduce((s, i) => s + numero(i.viagens), 0);
  const km = dados.reduce((s, i) => s + numero(i.km), 0);
  const equipes = dados.reduce((s, i) => s + numero(i.equipe), 0);

  if (canvasIndicadores) {
    graficoKpiServicoIndicadores = new Chart(canvasIndicadores, {
      type: "doughnut",
      data: {
        labels: ["Peso", "Viagens", "KM", "Equipes"],
        datasets: [{
          data: [peso, viagens, km, equipes]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

/* Compatibilidade com função antiga */

/* função duplicada removida: renderGraficosKpi */


function agruparKpiServicoMensal(dados) {
  const mapa = {};

  dados.forEach(item => {
    if (!item.data_normalizada) return;

    const mesAno = item.data_normalizada.substring(0, 7);

    if (!mapa[mesAno]) {
      mapa[mesAno] = {
        mesAno,
        mesBrasil: formatarMesBrasil(mesAno),
        peso: 0,
        viagens: 0,
        km: 0,
        equipe: 0
      };
    }

    mapa[mesAno].peso += numero(item.peso);
    mapa[mesAno].viagens += numero(item.viagens);
    mapa[mesAno].km += numero(item.km);
    mapa[mesAno].equipe += numero(item.equipe);
  });

  return Object.values(mapa).sort((a, b) => a.mesAno.localeCompare(b.mesAno));
}

/* Compatibilidade: tabela antiga de KPI operacional não é mais necessária */

/* função duplicada removida: renderTabelaKpisOperacionais */




/*
========================================================
PATCH FINAL • KPI POR SERVIÇO COMPLETO COM FILTROS
========================================================
Filtros:
- Serviço
- Ano
- Mês
- Dia

Inclui:
- Cards contratuais e operacionais
- Gráfico diário
- Gráfico previsto x executado
- Gráfico mensal
- Gráfico composição
- Tabela diária
- Tabela mensal
- Resumo automático
========================================================
*/

let graficoKpiServicoDiario = null;
let graficoKpiPrevistoExecutado = null;
let graficoKpiServicoMensalFinal = null;
let graficoKpiServicoIndicadoresFinal = null;


/* função duplicada removida: atualizarDashboard */


/* =====================================================
   FILTROS KPI
===================================================== */

/* função duplicada removida: carregarFiltrosKpiServicoCompleto */



/* função duplicada removida: limparFiltroKpiServico */


/* =====================================================
   FILTRA DADOS KPI
===================================================== */

/* função duplicada removida: obterDadosFiltradosKpiServico */


/* =====================================================
   RENDER PRINCIPAL KPI
===================================================== */

/* função duplicada removida: renderPaginaKpiPorServicoCompleto */


/* Compatibilidade */

/* função duplicada removida: renderPaginaKpiPorServico */



/* função duplicada removida: renderPaginaKpi */


/* =====================================================
   PAINEL CONTRATUAL DO KPI
===================================================== */
function obterPainelKpiServicoCompleto(servico, dados) {
  if (!servico) {
    const previsto = painelExecutivoOriginal.reduce((s, i) => s + numero(i.previsto_mes), 0);
    const executado = painelExecutivoOriginal.reduce((s, i) => s + numero(i.acumulado_mes), 0);
    const percentual = calcularPercentual(executado, previsto);
    const valor = painelExecutivoOriginal.reduce((s, i) => s + numero(i.valor), 0);
    return { previsto, executado, percentual, valor };
  }

  const painel = painelExecutivoOriginal.find(item => item.servico === servico);
  if (!painel) return { previsto: 0, executado: 0, percentual: 0, valor: 0 };

  const executado = calcularAcumuladoPorServico(servico, dados, painel.previsto_mes);
  const percentual = calcularPercentual(executado, painel.previsto_mes);
  const valorUnitario = VALORES_FIXOS[servico] || 0;
  const valor = SERVICOS_FIXOS.includes(servico) ? valorUnitario : valorUnitario * executado;

  return {
    previsto: painel.previsto_mes,
    executado,
    percentual,
    valor
  };
}

/* =====================================================
   RESUMO
===================================================== */
function renderResumoKpiServicoCompleto(filtro, painel) {
  const area = document.getElementById("resumoKpiServico");
  if (!area) return;

  const dados = filtro.dados;
  const servico = filtro.servico || "Todos os serviços";

  if (!dados.length) {
    area.innerHTML = `Nenhum lançamento encontrado para <strong>${servico}</strong> no período selecionado.`;
    return;
  }

  const peso = dados.reduce((s, i) => s + numero(i.peso), 0);
  const viagens = dados.reduce((s, i) => s + numero(i.viagens), 0);
  const km = dados.reduce((s, i) => s + numero(i.km), 0);
  const equipes = dados.reduce((s, i) => s + numero(i.equipe), 0);
  const dias = contarDiasDistintos(dados);

  const tonViagem = viagens ? peso / viagens : 0;
  const kmViagem = viagens ? km / viagens : 0;

  area.innerHTML = `
    <p>
      O KPI de <strong>${servico}</strong> analisou <strong>${formatarNumero(dados.length)}</strong>
      lançamento(s), distribuídos em <strong>${formatarNumero(dias)}</strong> dia(s) operados.
    </p>
    <p>
      Foram registrados <strong>${formatarNumero(peso)}</strong> toneladas,
      <strong>${formatarNumero(viagens)}</strong> viagens,
      <strong>${formatarNumero(km)}</strong> KM e
      <strong>${formatarNumero(equipes)}</strong> equipes.
    </p>
    <p>
      A produtividade média foi de <strong>${formatarNumero(tonViagem)} t/viagem</strong>
      e <strong>${formatarNumero(kmViagem)} km/viagem</strong>.
    </p>
    <p>
      A execução contratual está em <strong>${formatarNumero(painel.percentual)}%</strong>,
      com executado de <strong>${formatarNumero(painel.executado)}</strong>
      frente ao previsto de <strong>${formatarNumero(painel.previsto)}</strong>.
    </p>
  `;
}

/* =====================================================
   TABELA DIÁRIA
===================================================== */

/* função duplicada removida: renderTabelaKpiServicoDiario */


function obterExecutadoDoServico(servico, dados) {
  if (["P1", "P4", "P12"].includes(servico)) {
    return dados.reduce((s, i) => s + numero(i.peso), 0);
  }

  if (["P2.1", "P2.2"].includes(servico)) {
    return dados.reduce((s, i) => s + numero(i.viagens), 0);
  }

  if (["P5", "P6"].includes(servico)) {
    return dados.reduce((s, i) => s + numero(i.km), 0);
  }

  if (["P3", "P7", "P8", "P9", "P10", "P11"].includes(servico)) {
    return dados.reduce((s, i) => s + numero(i.equipe), 0);
  }

  return dados.reduce((s, i) => s + numero(i.peso || i.km || i.viagens || i.equipe), 0);
}

/* =====================================================
   TABELA MENSAL
===================================================== */

/* função duplicada removida: renderTabelaKpiServicoMensalCompleto */


/* =====================================================
   TABELA DE PAGAMENTO
===================================================== */
function renderTabelaKpisPagamentoPorServicoCompleto(servicoFiltro) {
  const tabela = document.getElementById("tabelaKpisPagamento");
  if (!tabela) return;

  const linhas = [
    ["P1", "Peso coletado", "Toneladas coletadas", "Peso coletado = R$"],
    ["P2.1", "Viagens realizadas", "Viagens de coleta seletiva", "Viagens realizadas = R$"],
    ["P2.2", "Viagens realizadas", "Viagens de rejeito seletivo das IRR", "Viagens realizadas = R$"],
    ["P3", "Quantidade de equipes dia", "Equipe em operação", "Quantidade de equipes dia = R$"],
    ["P4", "Peso coletado", "Toneladas coletadas", "Peso coletado = R$"],
    ["P5", "Quilometragem executada", "KM executado", "KM executado / KM previsto"],
    ["P6", "Quilometragem executada", "KM executado", "KM executado / KM previsto"],
    ["P7", "Equipes em operação", "Equipe em operação", "Equipes previstas x equipes em operação"],
    ["P8", "Equipes em operação", "Equipe em operação", "Equipes previstas x equipes em operação"],
    ["P9", "Equipes em operação", "Equipe em operação", "Equipes previstas x equipes em operação"],
    ["P10", "Equipes em operação", "Equipe em operação", "Equipes previstas x equipes em operação"],
    ["P11", "Equipes em operação", "Pós-eventos e coleta de gordura", "Equipes previstas x equipes em operação"],
    ["P12", "Peso coletado por distrito x KM", "Peso e distância por distrito", "Peso coletado x KM percorrido"]
  ];

  const filtradas = servicoFiltro ? linhas.filter(l => l[0] === servicoFiltro) : linhas;

  tabela.innerHTML = filtradas.map(l => `
    <tr>
      <td>${l[0]}</td>
      <td>${l[1]}</td>
      <td>${l[2]}</td>
      <td>${l[3]}</td>
    </tr>
  `).join("");
}

function renderTabelaKpisPagamento() {
  renderTabelaKpisPagamentoPorServicoCompleto(document.getElementById("filtroKpiServico")?.value || "");
}

/* =====================================================
   GRÁFICOS
===================================================== */


/* função duplicada removida: ccoLabelDiaMobileFinal */



/* função duplicada removida: renderGraficosKpiServicoCompleto */


function agruparKpiPorDia(dados) {
  const mapa = {};

  dados.forEach(item => {
    if (!item.data_normalizada) return;

    const chave = item.data_normalizada;

    if (!mapa[chave]) {
      mapa[chave] = {
        data: item.data_normalizada,
        servico: item.servico,
        peso: 0,
        viagens: 0,
        km: 0,
        equipe: 0
      };
    }

    mapa[chave].peso += numero(item.peso);
    mapa[chave].viagens += numero(item.viagens);
    mapa[chave].km += numero(item.km);
    mapa[chave].equipe += numero(item.equipe);
  });

  return Object.values(mapa).sort((a, b) => a.data.localeCompare(b.data));
}

function agruparKpiPorMes(dados) {
  const mapa = {};

  dados.forEach(item => {
    if (!item.data_normalizada) return;

    const mesAno = item.data_normalizada.substring(0, 7);

    if (!mapa[mesAno]) {
      mapa[mesAno] = {
        mesAno,
        mesBrasil: formatarMesBrasil(mesAno),
        peso: 0,
        viagens: 0,
        km: 0,
        equipe: 0
      };
    }

    mapa[mesAno].peso += numero(item.peso);
    mapa[mesAno].viagens += numero(item.viagens);
    mapa[mesAno].km += numero(item.km);
    mapa[mesAno].equipe += numero(item.equipe);
  });

  return Object.values(mapa).sort((a, b) => a.mesAno.localeCompare(b.mesAno));
}

/* Compatibilidades antigas */
function renderTabelaKpisOperacionais() { return; }
function renderGraficosKpi() { renderPaginaKpiPorServicoCompleto(); }



/*
========================================================
PATCH FINAL • FILTROS FUNCIONANDO NO GITHUB PAGES
========================================================

Problema comum no GitHub Pages:
- O HTML carrega, mas filtros não respondem por cache ou função duplicada.
- Alguns selects são preenchidos depois, mas perdem o onchange.
- O app.js tinha muitas funções com nomes repetidos.

Correção:
1. Registra eventos via addEventListener.
2. Reaplica eventos sempre que o dashboard atualiza.
3. Garante que filtros KPI, Painel Executivo e Comparativo funcionem.
4. Preserva valores selecionados após recarregar selects.
========================================================
*/

/* =====================================================
   REGISTRAR EVENTOS DOS FILTROS
===================================================== */

/* função duplicada removida: registrarEventosFiltrosGithubPages */


/* =====================================================
   ATUALIZAR DASHBOARD ESTÁVEL
===================================================== */

/* função duplicada removida: atualizarDashboard */


/* =====================================================
   PAINEL EXECUTIVO • FILTRO POR DIA/MÊS/ANO
===================================================== */

/* função duplicada removida: aplicarFiltroPeriodoExecutivo */


function aplicarFiltroMensal() {
  aplicarFiltroPeriodoExecutivo();
}


/* função duplicada removida: recalcularPainelPorFiltroPeriodoGithub */


/* =====================================================
   LIMPAR FILTROS
===================================================== */
function limparFiltroPeriodo() {
  ["filtroDia", "filtroMes", "filtroAno"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  painelExecutivo = clonar(painelExecutivoOriginal || []);
  operacoes = clonar(operacoesOriginal || []);

  atualizarDashboard();
}

function limparFiltroKpiServico() {
  ["filtroKpiServico", "filtroKpiAno", "filtroKpiMes", "filtroKpiDia"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  renderPaginaKpiPorServicoCompleto();
}

/* =====================================================
   PREENCHER FILTROS DO PAINEL EXECUTIVO SEM PERDER SELEÇÃO
===================================================== */
function carregarFiltrosPeriodoDisponiveis() {
  const dias = new Set();
  const meses = new Set();
  const anos = new Set();

  (operacoesOriginal || []).forEach(item => {
    if (!item.data_normalizada) return;

    const partes = item.data_normalizada.split("-");
    if (partes.length !== 3) return;

    anos.add(partes[0]);
    meses.add(partes[1]);
    dias.add(partes[2]);
  });

  preencherSelectDiaGithub("filtroDia", dias, "Todos os dias");
  preencherSelectMes("filtroMes", meses, "Selecionar");
  preencherSelectAno("filtroAno", anos, "Selecionar");
}

function preencherSelectDiaGithub(id, dias, textoInicial = "Todos os dias") {
  const select = document.getElementById(id);
  if (!select) return;

  const valorAtual = select.value;

  select.innerHTML = `<option value="">${textoInicial}</option>`;

  [...dias]
    .sort((a, b) => Number(a) - Number(b))
    .forEach(dia => {
      if (dia) select.innerHTML += `<option value="${dia}">${dia}</option>`;
    });

  if ([...dias].includes(valorAtual)) {
    select.value = valorAtual;
  }
}

/* =====================================================
   FILTROS KPI SEM PERDER SELEÇÃO
===================================================== */

/* função duplicada removida: carregarFiltrosKpiServicoCompleto */


/* =====================================================
   KPI POR SERVIÇO COM FILTRO
===================================================== */
function obterDadosFiltradosKpiServico() {
  const servico = document.getElementById("filtroKpiServico")?.value || "";
  const ano = document.getElementById("filtroKpiAno")?.value || "";
  const mes = document.getElementById("filtroKpiMes")?.value || "";
  const dia = document.getElementById("filtroKpiDia")?.value || "";

  let dados = clonar(operacoesOriginal || []);

  if (servico) dados = dados.filter(item => item.servico === servico);
  if (ano) dados = dados.filter(item => item.data_normalizada && item.data_normalizada.substring(0, 4) === ano);
  if (mes) dados = dados.filter(item => item.data_normalizada && item.data_normalizada.substring(5, 7) === mes);
  if (dia) dados = dados.filter(item => item.data_normalizada && item.data_normalizada.substring(8, 10) === dia);

  return { dados, servico, ano, mes, dia };
}


/* função duplicada removida: renderPaginaKpiPorServicoCompleto */



/* função duplicada removida: renderPaginaKpiPorServico */


/* função duplicada removida: renderPaginaKpi */


function obterPainelKpiServicoGithub(servico, dados) {
  if (!servico) {
    const previsto = (painelExecutivoOriginal || []).reduce((s, i) => s + numero(i.previsto_mes), 0);
    const executado = (painelExecutivoOriginal || []).reduce((s, i) => s + numero(i.acumulado_mes), 0);
    const percentual = calcularPercentual(executado, previsto);
    const valor = (painelExecutivoOriginal || []).reduce((s, i) => s + numero(i.valor), 0);
    return { previsto, executado, percentual, valor };
  }

  const painel = (painelExecutivoOriginal || []).find(item => item.servico === servico);
  if (!painel) return { previsto: 0, executado: 0, percentual: 0, valor: 0 };

  const executado = calcularAcumuladoPorServico(servico, dados, painel.previsto_mes);
  const percentual = calcularPercentual(executado, painel.previsto_mes);
  const valorUnitario = VALORES_FIXOS[servico] || 0;
  const valor = SERVICOS_FIXOS.includes(servico) ? valorUnitario : valorUnitario * executado;

  return { previsto: painel.previsto_mes, executado, percentual, valor };
}

/* =====================================================
   INICIALIZAÇÃO EXTRA PARA GITHUB PAGES
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    registrarEventosFiltrosGithubPages();
    carregarFiltrosPeriodoDisponiveis();
    carregarFiltrosKpiServicoCompleto();
    renderPaginaKpiPorServicoCompleto();
  }, 1000);
});



/*
========================================================
PATCH FINAL • AJUSTES SOLICITADOS
========================================================
Páginas alteradas:

1. PAINEL GERAL
- Remove cards e resumo automático executivo no HTML.
- Troca gráfico de acumulado por gráfico financeiro baseado na coluna Valor.
- Adiciona gráfico de barras para representar dinheiro.

2. EXECUÇÃO P1 A P12
- Remove tabela "Dados importados" dos detalhes do serviço.
- Adiciona comparação de dois ou mais meses.
- Coloca gráficos antes dos cards no detalhe do serviço.
- Status mostra "Atingido", "Não atingido" ou "Sem dados".

3. KPI
- Remove tabela diária do KPI.
- Adiciona mais gráficos de comparação.
========================================================
*/

let graficoValorServicoBarrasFinal = null;
let graficoExecucaoCompararMesesFinal = null;
let graficoExecucaoCompararPercentualFinal = null;
let graficoDetalheServicoMesesFinal = null;
let graficoDetalheServicoIndicadoresFinal = null;
let graficoKpiComparativoMensalFinal = null;
let graficoKpiPercentualMensalFinal = null;
let graficoKpiProdutividadeMensalFinal = null;

/* =====================================================
   ATUALIZAR DASHBOARD
===================================================== */

/* função duplicada removida: atualizarDashboard */


/* =====================================================
   PAINEL GERAL • GRÁFICOS FINANCEIROS
===================================================== */

/* função duplicada removida: renderGraficos */


/* =====================================================
   EXECUÇÃO P1 A P12 • STATUS AJUSTADO
===================================================== */
function obterStatusExecucao(percentual, executado = 0) {
  if (!executado || numero(executado) <= 0) return "Sem dados";
  return numero(percentual) >= 100 ? "Atingido" : "Não atingido";
}

function renderTabelaContratualMensal() {
  const tabela = document.getElementById("tabelaContratual");
  if (!tabela) return;

  if (!painelExecutivoOriginal.length) {
    tabela.innerHTML = `<tr><td colspan="6">Nenhum dado contratual importado.</td></tr>`;
    preencherHtml("avisoPeriodoExecucao", "");
    return;
  }

  const { painel, periodo } = gerarPainelExecucaoMensal();

  tabela.innerHTML = painel.map(item => {
    const status = obterStatusExecucao(item.porcentagem_execucao, item.acumulado_mes);

    return `
      <tr>
        <td>${item.servico} - ${item.nome_servico}</td>
        <td>${item.medicao}</td>
        <td>${formatarNumero(item.previsto_mes)}</td>
        <td>${formatarNumero(item.acumulado_mes)}</td>
        <td>${formatarNumero(item.porcentagem_execucao)}%</td>
        <td><span class="badge ${status === "Atingido" ? "ok" : status === "Não atingido" ? "critico" : "info"}">${status}</span></td>
      </tr>
    `;
  }).join("");

  preencherHtml("avisoPeriodoExecucao", `
    <strong>Período da execução P1 a P12:</strong>
    ${periodo.descricao}. Os lançamentos diários são acumulados no período selecionado até atingir o previsto mensal.
  `);
}

/* =====================================================
   EXECUÇÃO P1 A P12 • COMPARAR MESES
===================================================== */

/* função duplicada removida: carregarFiltroMesesComparativoExecucao */



/* função duplicada removida: limparComparativoMesesExecucao */



/* função duplicada removida: renderComparativoMesesExecucao */


/* =====================================================
   EXECUÇÃO P1 A P12 • DETALHE SEM DADOS IMPORTADOS
   Gráficos antes dos cards.
===================================================== */

/* função duplicada removida: renderDetalheServicoMensal */


function renderGraficosDetalheExecucaoServico(codigo, dadosPeriodo) {
  const ctxMeses = document.getElementById("graficoDetalheServicoMeses");
  const ctxIndicadores = document.getElementById("graficoDetalheServicoIndicadores");

  if (graficoDetalheServicoMesesFinal) graficoDetalheServicoMesesFinal.destroy();
  if (graficoDetalheServicoIndicadoresFinal) graficoDetalheServicoIndicadoresFinal.destroy();

  const mensal = {};
  const dadosServicoTodos = (operacoesOriginal || []).filter(item => item.servico === codigo);

  dadosServicoTodos.forEach(item => {
    if (!item.data_normalizada) return;
    const mesAno = item.data_normalizada.substring(0, 7);
    if (!mensal[mesAno]) mensal[mesAno] = { mesAno, mesBrasil: formatarMesBrasil(mesAno), executado: 0 };
    mensal[mesAno].executado += obterExecutadoDoServicoExecucao(codigo, [item]);
  });

  const dadosMensais = Object.values(mensal).sort((a, b) => a.mesAno.localeCompare(b.mesAno));

  if (ctxMeses) {
    graficoDetalheServicoMesesFinal = new Chart(ctxMeses, {
      type: "bar",
      data: {
        labels: dadosMensais.map(i => i.mesBrasil),
        datasets: [{
          label: "Executado",
          data: dadosMensais.map(i => i.executado),
          borderRadius: 10,
          backgroundColor: "#A7F3D0"
        }]
      },
      options: opcoesGrafico()
    });
  }

  const dadosServico = dadosPeriodo.filter(item => item.servico === codigo);
  const totalPeso = dadosServico.reduce((s, item) => s + numero(item.peso), 0);
  const totalKm = dadosServico.reduce((s, item) => s + numero(item.km), 0);
  const totalViagens = dadosServico.reduce((s, item) => s + numero(item.viagens), 0);
  const totalEquipes = dadosServico.reduce((s, item) => s + numero(item.equipe), 0);

  renderGraficoVelocidadeMediaMensalKPI(dados);

  if (ctxIndicadores) {
    graficoDetalheServicoIndicadoresFinal = new Chart(ctxIndicadores, {
      type: "bar",
      data: {
        labels: ["Peso", "Viagens", "KM", "Equipes"],
        datasets: [{
          label: "Indicadores",
          data: [totalPeso, totalViagens, totalKm, totalEquipes],
          borderRadius: 10,
          backgroundColor: "#BFDBFE"
        }]
      },
      options: opcoesGrafico()
    });
  }
}

function obterExecutadoDoServicoExecucao(servico, dados) {
  if (["P1", "P4", "P12"].includes(servico)) {
    return dados.reduce((s, i) => s + numero(i.peso), 0);
  }

  if (["P2.1", "P2.2"].includes(servico)) {
    return dados.reduce((s, i) => s + numero(i.viagens), 0);
  }

  if (["P5", "P6"].includes(servico)) {
    return dados.reduce((s, i) => s + numero(i.km), 0);
  }

  if (["P3", "P7", "P8", "P9", "P10", "P11"].includes(servico)) {
    return dados.reduce((s, i) => s + numero(i.equipe), 0);
  }

  return dados.reduce((s, i) => s + numero(i.peso || i.viagens || i.km || i.equipe), 0);
}

/* =====================================================
   KPI • STATUS E GRÁFICOS DE COMPARAÇÃO
===================================================== */

/* função duplicada removida: renderPaginaKpiPorServicoCompleto */



/* função duplicada removida: renderPaginaKpiPorServico */



/* função duplicada removida: renderPaginaKpi */


/*
  Remove visualmente qualquer tabela diária remanescente,
  caso o navegador esteja usando cache antigo do HTML.
*/

/* função duplicada removida: renderTabelaKpiServicoDiario */




/* função duplicada removida: ccoLabelDiaMobileFinal */



/* função duplicada removida: renderGraficosKpiServicoCompleto */


function destruirGraficoSeExistir(nomeVariavel) {
  try {
    if (window[nomeVariavel] && typeof window[nomeVariavel].destroy === "function") {
      window[nomeVariavel].destroy();
      window[nomeVariavel] = null;
    }
  } catch {}
}

function agruparKpiMensalFinal(dados) {
  const mapa = {};

  dados.forEach(item => {
    if (!item.data_normalizada) return;
    const mesAno = item.data_normalizada.substring(0, 7);

    if (!mapa[mesAno]) {
      mapa[mesAno] = {
        mesAno,
        mesBrasil: formatarMesBrasil(mesAno),
        peso: 0,
        viagens: 0,
        km: 0,
        equipe: 0
      };
    }

    mapa[mesAno].peso += numero(item.peso);
    mapa[mesAno].viagens += numero(item.viagens);
    mapa[mesAno].km += numero(item.km);
    mapa[mesAno].equipe += numero(item.equipe);
  });

  return Object.values(mapa).sort((a, b) => a.mesAno.localeCompare(b.mesAno));
}

/* =====================================================
   GITHUB PAGES • EVENTOS
===================================================== */
function registrarEventosFiltrosGithubPages() {
  const eventos = [
    ["filtroDia", aplicarFiltroPeriodoExecutivo],
    ["filtroMes", aplicarFiltroPeriodoExecutivo],
    ["filtroAno", aplicarFiltroPeriodoExecutivo],
    ["filtroKpiServico", renderPaginaKpiPorServicoCompleto],
    ["filtroKpiAno", renderPaginaKpiPorServicoCompleto],
    ["filtroKpiMes", renderPaginaKpiPorServicoCompleto],
    ["filtroKpiDia", renderPaginaKpiPorServicoCompleto],
    ["filtroComparativoServico", renderComparativoMensalPorServico],
    ["filtroComparativoAno", renderComparativoMensalPorServico],
    ["filtroExecucaoMes", aplicarFiltroExecucaoMensal],
    ["filtroExecucaoAno", aplicarFiltroExecucaoMensal],
    ["filtroExecucaoMesesComparar", renderComparativoMesesExecucao],
    ["filtroExecucaoAnoComparar", renderComparativoMesesExecucao]
  ];

  eventos.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (!el || !fn) return;
    if (el.dataset.eventoRegistrado === "sim") return;

    el.addEventListener("change", () => {
      try {
        fn();
      } catch (erro) {
        console.error(`Erro no filtro ${id}:`, erro);
      }
    });

    el.dataset.eventoRegistrado = "sim";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    registrarEventosFiltrosGithubPages();
    carregarFiltroMesesComparativoExecucao();
    renderComparativoMesesExecucao();
  }, 1000);
});



/*
========================================================
PATCH FINAL • COMPARATIVO MENSAL REORGANIZADO
========================================================
Solicitações aplicadas:
1. Remover coluna Equipes do Comparativo Mensal por Serviço.
2. Mover Comparativo por Serviço para o topo.
3. Remover cards da página Comparativo Mensal.
4. Manter gráficos e tabelas existentes.
5. Colocar Análise Automática Mensal no final.
6. Ajustado para GitHub Pages com cache busting no index.html.
========================================================
*/

/* =====================================================
   FILTROS DO COMPARATIVO POR SERVIÇO
===================================================== */

/* função duplicada removida: carregarFiltrosComparativoServico */


/* =====================================================
   COMPARATIVO MENSAL POR SERVIÇO SEM EQUIPES
===================================================== */

/* função duplicada removida: renderComparativoMensalPorServico */


/* =====================================================
   ATUALIZAR DASHBOARD GARANTINDO NOVA ORDEM/FILTROS
===================================================== */

/* função duplicada removida: atualizarDashboard */




/*
========================================================
PATCH • KPI RESUMO NO FINAL + SEM TABELA MENSAL
       + COMPARAR MESES P1 A P12 CORRIGIDO
========================================================
1. KPI:
   - Mantém resumo automático no final da página.
   - Desativa renderização da tabela mensal do KPI.
   - Tabela diária também fica desativada.

2. Execução P1 a P12:
   - Corrige o filtro "Comparar meses".
   - Permite escolher dois ou mais meses.
   - Mantém seleção sem perder quando o dashboard atualiza.
   - Gera gráfico executado total e % médio de execução.
========================================================
*/

let graficoExecucaoCompararMesesCorrigido = null;
let graficoExecucaoCompararPercentualCorrigido = null;

/* =====================================================
   KPI • NÃO RENDERIZAR TABELAS DO KPI
===================================================== */
function renderTabelaKpiServicoMensalCompleto() {
  const tabela = document.getElementById("tabelaKpiServicoMensal");
  if (tabela) {
    const secao = tabela.closest(".section");
    if (secao) secao.remove();
  }
}

function renderTabelaKpiServicoMensal() {
  renderTabelaKpiServicoMensalCompleto();
}

function renderTabelaKpiServicoDiario() {
  const tabela = document.getElementById("tabelaKpiServicoDiario");
  if (tabela) {
    const secao = tabela.closest(".section");
    if (secao) secao.remove();
  }
}

/* =====================================================
   KPI • RENDER PRINCIPAL SEM TABELA MENSAL
===================================================== */

/* função duplicada removida: renderPaginaKpiPorServicoCompleto */



/* função duplicada removida: renderPaginaKpiPorServico */



/* função duplicada removida: renderPaginaKpi */


/* =====================================================
   EXECUÇÃO P1 A P12 • CARREGAR MESES PARA COMPARAÇÃO
===================================================== */

/* função duplicada removida: carregarFiltroMesesComparativoExecucao */


/* =====================================================
   EXECUÇÃO P1 A P12 • LIMPAR COMPARAÇÃO
===================================================== */

/* função duplicada removida: limparComparativoMesesExecucao */


/* =====================================================
   EXECUÇÃO P1 A P12 • COMPARAR MESES CORRIGIDO
===================================================== */

/* função duplicada removida: renderComparativoMesesExecucao */


/* =====================================================
   EVENTOS DO COMPARATIVO DE MESES
===================================================== */
function registrarEventosComparativoMesesExecucao() {
  const selectMeses = document.getElementById("filtroExecucaoMesesComparar");
  const selectAno = document.getElementById("filtroExecucaoAnoComparar");

  if (selectMeses && selectMeses.dataset.eventoComparativo !== "sim") {
    selectMeses.addEventListener("change", renderComparativoMesesExecucao);
    selectMeses.dataset.eventoComparativo = "sim";
  }

  if (selectAno && selectAno.dataset.eventoComparativo !== "sim") {
    selectAno.addEventListener("change", () => {
      carregarFiltroMesesComparativoExecucao();
      renderComparativoMesesExecucao();
    });
    selectAno.dataset.eventoComparativo = "sim";
  }
}

/* =====================================================
   ATUALIZAR DASHBOARD COM COMPARATIVO CORRIGIDO
===================================================== */

/* função duplicada removida: atualizarDashboard */


document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    carregarFiltroMesesComparativoExecucao();
    registrarEventosComparativoMesesExecucao();
    renderComparativoMesesExecucao();
  }, 1200);
});



/*
========================================================
PATCH CORREÇÃO FINAL • KPI / EXECUÇÃO / PAINEL GERAL
========================================================
Correções:
1. Resumo do KPI aparece somente dentro da tela KPI.
2. Painel Geral fica sem gráfico de rosca de valor.
3. Painel Geral ganha ranking por medição com filtro.
4. Execução P1 a P12 compara Mês 1 x Mês 2.
5. Gráficos do KPI são corrigidos:
   - Previsto x Executado por mês
   - % Execução por mês
   - Ton/viagem e KM/viagem por mês
========================================================
*/

let graficoRankingMedicaoFinal = null;
let graficoExecucaoMesAmesB = null;
let graficoExecucaoPercentualMesAmesB = null;
let graficoKpiComparativoMensalCorrigido = null;
let graficoKpiPercentualMensalCorrigido = null;
let graficoKpiProdutividadeMensalCorrigido = null;

/* =====================================================
   UTIL: tela ativa
===================================================== */
function telaEstaAtiva(id) {
  const tela = document.getElementById(id);
  return !!(tela && tela.classList.contains("ativa"));
}

/* =====================================================
   GARANTIR RESUMO KPI APENAS NA PÁGINA KPI
===================================================== */
function corrigirResumoKpiSomenteNaPagina() {
  const resumos = Array.from(document.querySelectorAll("#resumoKpiServico"));

  resumos.forEach((el, index) => {
    const telaKpi = el.closest("#tela-kpi");

    if (!telaKpi) {
      const secao = el.closest(".section");
      if (secao) secao.remove();
      else el.remove();
      return;
    }

    if (index > 0) {
      const secao = el.closest(".section");
      if (secao) secao.remove();
      else el.remove();
    }
  });
}

/* =====================================================
   PAINEL GERAL: gráfico financeiro sem rosca
===================================================== */
function renderGraficos() {
  const ctxExecucao = document.getElementById("graficoExecucao");
  const ctxValorBarras = document.getElementById("graficoValorServicoBarras");

  if (graficoExecucao) graficoExecucao.destroy();
  if (graficoPizza) {
    try { graficoPizza.destroy(); } catch {}
    graficoPizza = null;
  }
  if (typeof graficoValorServicoBarrasFinal !== "undefined" && graficoValorServicoBarrasFinal) {
    graficoValorServicoBarrasFinal.destroy();
  }

  const labels = (painelExecutivo || []).map(item => item.servico);

  if (ctxExecucao) {
    graficoExecucao = new Chart(ctxExecucao, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "% Execução",
          data: (painelExecutivo || []).map(item => numero(item.porcentagem_execucao)),
          borderRadius: 10,
          backgroundColor: "#A7F3D0"
        }]
      },
      options: opcoesGrafico()
    });
  }

  // Somente gráfico de barras para dinheiro.
  if (ctxValorBarras) {
    graficoValorServicoBarrasFinal = new Chart(ctxValorBarras, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Valor R$",
          data: (painelExecutivo || []).map(item => numero(item.valor)),
          borderRadius: 10,
          backgroundColor: "#BFDBFE"
        }]
      },
      options: {
        ...opcoesGrafico(),
        indexAxis: "y",
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              label: function(context) {
                return formatarMoeda(context.raw);
              }
            }
          }
        }
      }
    });
  }

  renderRankingPorMedicao();
}

/* =====================================================
   PAINEL GERAL: ranking entre serviços por medição
===================================================== */
function carregarFiltroRankingMedicao() {
  const select = document.getElementById("filtroRankingMedicao");
  if (!select) return;

  const atual = select.value;
  const medicoes = new Set();

  (painelExecutivoOriginal || painelExecutivo || []).forEach(item => {
    if (item.medicao) medicoes.add(String(item.medicao));
  });

  select.innerHTML = `<option value="">Todas as medições</option>`;
  [...medicoes].sort().forEach(m => {
    select.innerHTML += `<option value="${m}">${m}</option>`;
  });

  if ([...medicoes].includes(atual)) select.value = atual;
}


/* função duplicada removida: renderRankingPorMedicao */


/* =====================================================
   EXECUÇÃO P1 A P12: carregar opções Mês 1 e Mês 2
===================================================== */

/* função duplicada removida: carregarFiltroMesesComparativoExecucao */



/* função duplicada removida: limparComparativoMesesExecucao */


function calcularPainelMesExecucao(mesAno) {
  const dadosMes = (operacoesOriginal || []).filter(item =>
    item.data_normalizada &&
    item.data_normalizada.substring(0, 7) === mesAno
  );

  const painelMes = (painelExecutivoOriginal || []).map(item => {
    const dadosServico = dadosMes.filter(op => op.servico === item.servico);
    const acumulado = calcularAcumuladoPorServico(item.servico, dadosServico, item.previsto_mes);
    const percentual = calcularPercentual(acumulado, item.previsto_mes);

    return {
      servico: item.servico,
      previsto: numero(item.previsto_mes),
      executado: acumulado,
      percentual
    };
  });

  return {
    mesAno,
    mesBrasil: formatarMesBrasil(mesAno),
    previstoTotal: painelMes.reduce((s, i) => s + numero(i.previsto), 0),
    executadoTotal: painelMes.reduce((s, i) => s + numero(i.executado), 0),
    percentualMedio: painelMes.length ? painelMes.reduce((s, i) => s + numero(i.percentual), 0) / painelMes.length : 0
  };
}


/* função duplicada removida: renderComparativoMesesExecucao */


/* =====================================================
   KPI: dados mensais corretos por serviço
===================================================== */
function obterExecutadoKpiPorServico(servico, item) {
  if (!servico) {
    return numero(item.peso) + numero(item.km) + numero(item.viagens) + numero(item.equipe);
  }

  if (["P1", "P4", "P12"].includes(servico)) return numero(item.peso);
  if (["P2.1", "P2.2"].includes(servico)) return numero(item.viagens);
  if (["P5", "P6"].includes(servico)) return numero(item.km);
  if (["P3", "P7", "P8", "P9", "P10", "P11"].includes(servico)) return numero(item.equipe);

  return numero(item.peso || item.km || item.viagens || item.equipe);
}

function agruparKpiMensalCorrigido(dados, servico) {
  const mapa = {};

  dados.forEach(item => {
    if (!item.data_normalizada) return;

    const mesAno = item.data_normalizada.substring(0, 7);

    if (!mapa[mesAno]) {
      mapa[mesAno] = {
        mesAno,
        mesBrasil: formatarMesBrasil(mesAno),
        peso: 0,
        viagens: 0,
        km: 0,
        equipe: 0,
        executado: 0
      };
    }

    mapa[mesAno].peso += numero(item.peso);
    mapa[mesAno].viagens += numero(item.viagens);
    mapa[mesAno].km += numero(item.km);
    mapa[mesAno].equipe += numero(item.equipe);
    mapa[mesAno].executado += obterExecutadoKpiPorServico(servico, item);
  });

  return Object.values(mapa).sort((a, b) => a.mesAno.localeCompare(b.mesAno));
}

function obterPrevistoKpi(servico) {
  if (!servico) {
    return (painelExecutivoOriginal || []).reduce((s, i) => s + numero(i.previsto_mes), 0);
  }

  const item = (painelExecutivoOriginal || []).find(i => i.servico === servico);
  return item ? numero(item.previsto_mes) : 0;
}



/* função duplicada removida: ccoLabelDiaMobileFinal */



/* função duplicada removida: renderGraficosKpiServicoCompleto */


/* =====================================================
   KPI render mantendo resumo só no fim
===================================================== */
function renderPaginaKpiPorServicoCompleto() {
  corrigirResumoKpiSomenteNaPagina();

  const filtro = obterDadosFiltradosKpiServico();
  const dados = filtro.dados;
  const servicoLabel = filtro.servico || "Todos";

  const peso = dados.reduce((s, i) => s + numero(i.peso), 0);
  const viagens = dados.reduce((s, i) => s + numero(i.viagens), 0);
  const km = dados.reduce((s, i) => s + numero(i.km), 0);
  const equipes = dados.reduce((s, i) => s + numero(i.equipe), 0);
  const dias = contarDiasDistintos(dados);
  const registros = dados.length;

  const painel = typeof obterPainelKpiServicoGithub === "function"
    ? obterPainelKpiServicoGithub(filtro.servico, dados)
    : obterPainelKpiServicoCompleto(filtro.servico, dados);

  const mediaDia = dias ? painel.executado / dias : 0;
  const status = typeof obterStatusExecucao === "function"
    ? obterStatusExecucao(painel.percentual, painel.executado)
    : (painel.percentual >= 100 ? "Atingido" : painel.executado > 0 ? "Não atingido" : "Sem dados");

  preencherTexto("kpiServicoSelecionado", servicoLabel);
  preencherTexto("kpiPrevistoServico", formatarNumero(painel.previsto));
  preencherTexto("kpiExecutadoServico", formatarNumero(painel.executado));
  preencherTexto("kpiPercentualServico", `${formatarNumero(painel.percentual)}%`);
  preencherTexto("kpiValorServico", formatarMoeda(painel.valor));
  preencherTexto("kpiDiasOperados", formatarNumero(dias));
  preencherTexto("kpiMediaDia", formatarNumero(mediaDia));
  preencherTexto("kpiRegistros", formatarNumero(registros));
  preencherTexto("kpiPesoTotal", formatarNumero(peso));
  preencherTexto("kpiViagensTotal", formatarNumero(viagens));
  preencherTexto("kpiKmTotal", formatarNumero(km));
  preencherTexto("kpiEquipesTotal", formatarNumero(equipes));
  preencherTexto("kpiTonViagem", viagens ? formatarNumero(peso / viagens) : "0");
  preencherTexto("kpiTonKm", km ? formatarNumero(peso / km) : "0");
  preencherTexto("kpiKmViagem", viagens ? formatarNumero(km / viagens) : "0");
  preencherTexto("kpiStatusServico", status);

  if (typeof renderTabelaKpisPagamentoPorServicoCompleto === "function") {
    renderTabelaKpisPagamentoPorServicoCompleto(filtro.servico);
  }

  renderGraficosKpiServicoCompleto(dados, filtro, painel);

  if (typeof renderResumoKpiServicoCompleto === "function") {
    renderResumoKpiServicoCompleto(filtro, painel);
  }

  const tabelaMensal = document.getElementById("tabelaKpiServicoMensal");
  if (tabelaMensal) {
    const secao = tabelaMensal.closest(".section");
    if (secao) secao.remove();
  }

  const tabelaDiaria = document.getElementById("tabelaKpiServicoDiario");
  if (tabelaDiaria) {
    const secao = tabelaDiaria.closest(".section");
    if (secao) secao.remove();
  }
}

function renderPaginaKpiPorServico() { renderPaginaKpiPorServicoCompleto(); }
function renderPaginaKpi() { renderPaginaKpiPorServicoCompleto(); }

/* =====================================================
   Atualizar dashboard final
===================================================== */

/* função duplicada removida: atualizarDashboard */


document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    corrigirResumoKpiSomenteNaPagina();
    carregarFiltroMesesComparativoExecucao();
    renderComparativoMesesExecucao();
    renderRankingPorMedicao();
  }, 1200);
});



/*
========================================================
PATCH • RANKING VISUAL POR MEDIÇÃO + PREVISTO POR DIAS
========================================================
*/

let graficoRankingMedicaoVisual = null;

function obterPrevistoPorDiasMes(servico, ano, mes, totalDiasMes, previstoOriginal) {
  return window.CCO_REGRAS.calcularPrevisto(servico,ano,mes,numero(previstoOriginal),numero(totalDiasMes));
}


/* função duplicada removida: gerarPainelExecutivo */



/* função duplicada removida: recalcularPainelPorFiltro */


function recalcularPainelPorFiltroPeriodoGithub(dadosFiltro, ano, mes, dia) {
  painelExecutivo = (painelExecutivoOriginal || []).map(item => {
    const dadosServico = dadosFiltro.filter(op => op.servico === item.servico);
    const totalDiasMes = ano && mes ? calcularTotalDiasMes(ano, mes) : item.total_dias_mes;
    const previsto = obterPrevistoPorDiasMes(item.servico, ano, mes, item.total_dias_mes, item.previsto_mes);
    const acumulado = calcularAcumuladoPorServico(item.servico, dadosServico, previsto);
    const valorUnitario = VALORES_FIXOS[item.servico] || 0;
    const valorFinal = SERVICOS_FIXOS.includes(item.servico) ? valorUnitario : valorUnitario * acumulado;

    return {
      ...item,
      previsto_mes: previsto,
      acumulado_mes: acumulado,
      porcentagem_execucao: calcularPercentual(acumulado, previsto),
      dias_acumulados: dia ? (dadosServico.length ? 1 : 0) : (contarDiasDistintos(dadosServico) || 0),
      total_dias_mes: totalDiasMes || item.total_dias_mes,
      valor: valorFinal,
      status: acumulado > 0 ? "Com dados" : "Sem dados"
    };
  });
}


/* função duplicada removida: gerarPainelExecucaoMensal */



/* função duplicada removida: renderRankingPorMedicao */



/* função duplicada removida: atualizarDashboard */


document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    carregarFiltroRankingMedicao();
    renderRankingPorMedicao();
  }, 1200);
});



/*
========================================================
PATCH • LAYOUT FINAL EXECUÇÃO / KPI / RANKING
========================================================
- Execução P1 a P12: comparativo no final, com filtro por serviço.
- Comparativo usa Peso, KM, Viagens, Ton/viagem e KM/viagem.
- Serviços por equipe são removidos do filtro.
- Painel Geral: ranking por medição apenas em cards modernos, ao lado do gráfico Execução por Serviço.
- KPI: cards ficam no final da página.
========================================================
*/

let graficoExecucaoCompararMesesFinalLayout = null;
let graficoExecucaoProdutividadeFinalLayout = null;

const SERVICOS_COMPARATIVO_PESO_KM_VIAGENS = ["P1", "P2.1", "P2.2", "P4", "P5", "P6", "P12"];

function carregarFiltroMesesComparativoExecucao() {
  const selectServico = document.getElementById("filtroExecucaoServicoComparar");
  const mesA = document.getElementById("filtroExecucaoMesCompararA");
  const mesB = document.getElementById("filtroExecucaoMesCompararB");

  if (!mesA || !mesB) return;

  const atualServico = selectServico?.value || "";
  const atualA = mesA.value;
  const atualB = mesB.value;

  const servicos = [...new Set((operacoesOriginal || [])
    .map(item => item.servico)
    .filter(s => SERVICOS_COMPARATIVO_PESO_KM_VIAGENS.includes(s))
  )].sort();

  if (selectServico) {
    selectServico.innerHTML = `<option value="">Selecionar serviço</option>`;
    servicos.forEach(s => {
      selectServico.innerHTML += `<option value="${s}">${s}</option>`;
    });
    if (servicos.includes(atualServico)) selectServico.value = atualServico;
    if (!selectServico.value && servicos.length) selectServico.value = servicos[0];
  }

  const servicoSelecionado = selectServico?.value || servicos[0] || "";

  const meses = [...new Set((operacoesOriginal || [])
    .filter(item => !servicoSelecionado || item.servico === servicoSelecionado)
    .map(item => item.data_normalizada ? item.data_normalizada.substring(0, 7) : "")
    .filter(Boolean)
  )].sort();

  const montarMes = (select, atual, texto) => {
    select.innerHTML = `<option value="">${texto}</option>`;
    meses.forEach(mesAno => {
      select.innerHTML += `<option value="${mesAno}">${formatarMesBrasil(mesAno)}</option>`;
    });
    if (meses.includes(atual)) select.value = atual;
  };

  montarMes(mesA, atualA, "Selecionar mês 1");
  montarMes(mesB, atualB, "Selecionar mês 2");

  if (!mesA.value && meses.length >= 2) mesA.value = meses[meses.length - 2];
  if (!mesB.value && meses.length >= 1) mesB.value = meses[meses.length - 1];
}

function limparComparativoMesesExecucao() {
  const selectServico = document.getElementById("filtroExecucaoServicoComparar");
  const mesA = document.getElementById("filtroExecucaoMesCompararA");
  const mesB = document.getElementById("filtroExecucaoMesCompararB");

  if (selectServico) selectServico.value = "";
  if (mesA) mesA.value = "";
  if (mesB) mesB.value = "";

  carregarFiltroMesesComparativoExecucao();
  renderComparativoMesesExecucao();
}

function calcularMetricasComparativoServicoMes(servico, mesAno) {
  const dados = (operacoesOriginal || []).filter(item =>
    item.servico === servico &&
    item.data_normalizada &&
    item.data_normalizada.substring(0, 7) === mesAno
  );

  const peso = dados.reduce((s, i) => s + numero(i.peso), 0);
  const km = dados.reduce((s, i) => s + numero(i.km), 0);
  const viagens = dados.reduce((s, i) => s + numero(i.viagens), 0);

  return {
    servico,
    mesAno,
    mesBrasil: formatarMesBrasil(mesAno),
    peso,
    km,
    viagens,
    tonViagem: viagens ? peso / viagens : 0,
    kmViagem: viagens ? km / viagens : 0
  };
}

function renderComparativoMesesExecucao() {
  const ctxMetricas = document.getElementById("graficoExecucaoCompararMeses");
  const ctxProdutividade = document.getElementById("graficoExecucaoCompararPercentual");

  if (!ctxMetricas && !ctxProdutividade) return;

  carregarFiltroMesesComparativoExecucao();

  const servico = document.getElementById("filtroExecucaoServicoComparar")?.value || "";
  const mesA = document.getElementById("filtroExecucaoMesCompararA")?.value || "";
  const mesB = document.getElementById("filtroExecucaoMesCompararB")?.value || "";

  if (!servico || !mesA || !mesB) return;

  const dados = [
    calcularMetricasComparativoServicoMes(servico, mesA),
    calcularMetricasComparativoServicoMes(servico, mesB)
  ];

  if (graficoExecucaoCompararMesesFinalLayout) graficoExecucaoCompararMesesFinalLayout.destroy();
  if (graficoExecucaoProdutividadeFinalLayout) graficoExecucaoProdutividadeFinalLayout.destroy();

  if (ctxMetricas) {
    graficoExecucaoCompararMesesFinalLayout = new Chart(ctxMetricas, {
      type: "bar",
      data: {
        labels: dados.map(i => i.mesBrasil),
        datasets: [
          {
            label: "Peso",
            data: dados.map(i => i.peso),
            borderRadius: 10,
            backgroundColor: "#A7F3D0"
          },
          {
            label: "KM",
            data: dados.map(i => i.km),
            borderRadius: 10,
            backgroundColor: "#BFDBFE"
          },
          {
            label: "Viagens",
            data: dados.map(i => i.viagens),
            borderRadius: 10,
            backgroundColor: "#FDE68A"
          }
        ]
      },
      options: opcoesGrafico()
    });
  }

  if (ctxProdutividade) {
    graficoExecucaoProdutividadeFinalLayout = new Chart(ctxProdutividade, {
      type: "bar",
      data: {
        labels: dados.map(i => i.mesBrasil),
        datasets: [
          {
            label: "Ton/viagem",
            data: dados.map(i => i.tonViagem),
            borderRadius: 10,
            backgroundColor: "#A7F3D0"
          },
          {
            label: "KM/viagem",
            data: dados.map(i => i.kmViagem),
            borderRadius: 10,
            backgroundColor: "#BFDBFE"
          }
        ]
      },
      options: opcoesGrafico()
    });
  }
}

/* Ranking por medição: somente cards, sem gráfico e sem tabela */

/* função duplicada removida: renderRankingPorMedicao */


/* KPI: mover visualmente cards para o final */

/* função duplicada removida: moverCardsKpiParaFinal */



/* função duplicada removida: atualizarDashboard */


document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    carregarFiltroMesesComparativoExecucao();
    renderComparativoMesesExecucao();
    renderRankingPorMedicao();
    moverCardsKpiParaFinal();
  }, 1200);
});



/*
========================================================
PATCH • CARDS DO KPI SOMENTE NA PÁGINA KPI
========================================================
Correção:
- Remove cards do KPI que foram parar fora da tela KPI.
- Mantém os cards do Painel Geral e de outras páginas.
- Move os cards do KPI para o final da seção #tela-kpi.
- Impede que apareçam em todas as páginas.
========================================================
*/

const IDS_CARDS_KPI = new Set([
  "kpiServicoSelecionado",
  "kpiPrevistoServico",
  "kpiExecutadoServico",
  "kpiPercentualServico",
  "kpiValorServico",
  "kpiDiasOperados",
  "kpiMediaDia",
  "kpiRegistros",
  "kpiPesoTotal",
  "kpiViagensTotal",
  "kpiKmTotal",
  "kpiEquipesTotal",
  "kpiTonViagem",
  "kpiTonKm",
  "kpiKmViagem",
  "kpiStatusServico"
]);

function sectionEhCardsKpi(section) {
  if (!section || !section.matches || !section.matches("section.cards")) return false;

  return Array.from(section.querySelectorAll("[id]"))
    .some(el => IDS_CARDS_KPI.has(el.id));
}

function corrigirCardsKpiSomenteNaPagina() {
  const telaKpi = document.getElementById("tela-kpi");
  if (!telaKpi) return;

  const todasSectionsCards = Array.from(document.querySelectorAll("section.cards"));
  const cardsKpi = [];

  todasSectionsCards.forEach(section => {
    if (!sectionEhCardsKpi(section)) return;

    if (!section.closest("#tela-kpi")) {
      // Se o card KPI está fora da página KPI, remove.
      section.remove();
      return;
    }

    cardsKpi.push(section);
  });

  // Reordena os cards KPI para o final da página KPI, antes do resumo automático.
  const resumo = document.getElementById("secaoResumoKpiFinal");
  const cardsDentro = Array.from(telaKpi.querySelectorAll("section.cards"))
    .filter(sectionEhCardsKpi);

  cardsDentro.forEach(section => {
    if (resumo && resumo.parentNode === telaKpi) {
      telaKpi.insertBefore(section, resumo);
    } else {
      telaKpi.appendChild(section);
    }
  });
}

/*
  Corrige também se alguma função antiga tentar mover todos os cards.
*/
function moverCardsKpiParaFinal() {
  corrigirCardsKpiSomenteNaPagina();
}

/*
  Esconde por CSS qualquer card KPI que esteja fora da tela KPI, como proteção extra.
*/
function aplicarProtecaoVisualCardsKpi() {
  document.querySelectorAll("section.cards").forEach(section => {
    if (!sectionEhCardsKpi(section)) return;

    if (!section.closest("#tela-kpi")) {
      section.style.display = "none";
    } else {
      section.style.display = "";
    }
  });
}

/*
  Atualização final protegida.
*/

/* função duplicada removida: atualizarDashboard */


document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    corrigirCardsKpiSomenteNaPagina();
    aplicarProtecaoVisualCardsKpi();
  }, 300);

  setTimeout(() => {
    corrigirCardsKpiSomenteNaPagina();
    aplicarProtecaoVisualCardsKpi();
  }, 1500);
});


/* REGRA ESPECIAL P12
Acumulado mês = Soma(Peso) x Soma(Executado)
Ajustar o nome da coluna executado se necessário.
*/
function calcularAcumuladoP12Especial(dadosServico){
  const somaPeso = dadosServico.reduce((t,i)=>t + numero(i.peso),0);
  const somaExecutado = dadosServico.reduce((t,i)=>t + numero(i.executado || i.qtd_executada || i.quantidade_executada || 0),0);
  return somaPeso * somaExecutado;
}



/*
========================================================
PATCH • UM GRÁFICO COM FILTRO COMPARANDO DOIS MESES
Página: Execução P1 a P12
Compara: Peso, KM e Viagens
========================================================
*/

let graficoFiltroDoisMesesInstancia = null;


/* função duplicada removida: carregarFiltrosGraficoDoisMeses */



/* função duplicada removida: somarPesoKmViagensPorMes */



/* função duplicada removida: renderGraficoFiltroDoisMeses */



/* função duplicada removida: limparGraficoFiltroDoisMeses */


const atualizarDashboardOriginalGraficoDoisMeses = atualizarDashboard;

atualizarDashboard = function() {
  atualizarDashboardOriginalGraficoDoisMeses();

  carregarFiltrosGraficoDoisMeses();
  renderGraficoFiltroDoisMeses();
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    carregarFiltrosGraficoDoisMeses();
    renderGraficoFiltroDoisMeses();
  }, 900);
});



/*
========================================================
PATCH • GRÁFICO COM FILTRO DE SERVIÇO + DOIS MESES
Página: Execução P1 a P12

Filtros:
- Serviço
- Mês 1
- Mês 2

Comparação:
- Peso
- KM
- Viagens
========================================================
*/

let graficoFiltroServicoDoisMesesInstancia = null;

function carregarServicosGraficoDoisMeses() {
  const selectServico = document.getElementById("compararServico");
  if (!selectServico) return;

  const atual = selectServico.value;

  const servicos = [...new Set(
    (operacoesOriginal || [])
      .map(item => item.servico)
      .filter(Boolean)
  )].sort((a, b) => {
    const ordem = ["P1", "P2.1", "P2.2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11", "P12"];
    return ordem.indexOf(a) - ordem.indexOf(b);
  });

  selectServico.innerHTML = `<option value="">Todos os serviços</option>`;

  servicos.forEach(servico => {
    selectServico.innerHTML += `<option value="${servico}">${servico}</option>`;
  });

  if (servicos.includes(atual)) {
    selectServico.value = atual;
  }
}

function carregarFiltrosGraficoDoisMeses() {
  carregarServicosGraficoDoisMeses();

  const selectServico = document.getElementById("compararServico");
  const selectA = document.getElementById("compararMesA");
  const selectB = document.getElementById("compararMesB");

  if (!selectA || !selectB) return;

  const servico = selectServico?.value || "";
  const valorA = selectA.value;
  const valorB = selectB.value;

  const meses = [...new Set(
    (operacoesOriginal || [])
      .filter(item => !servico || item.servico === servico)
      .map(item => item.data_normalizada ? item.data_normalizada.substring(0, 7) : "")
      .filter(Boolean)
  )].sort();

  function preencher(select, valorAtual, textoInicial) {
    select.innerHTML = `<option value="">${textoInicial}</option>`;

    meses.forEach(mesAno => {
      select.innerHTML += `<option value="${mesAno}">${formatarMesBrasil(mesAno)}</option>`;
    });

    if (meses.includes(valorAtual)) {
      select.value = valorAtual;
    }
  }

  preencher(selectA, valorA, "Selecionar mês 1");
  preencher(selectB, valorB, "Selecionar mês 2");

  if (!selectA.value && meses.length >= 2) {
    selectA.value = meses[meses.length - 2];
  }

  if (!selectB.value && meses.length >= 1) {
    selectB.value = meses[meses.length - 1];
  }
}

function atualizarMesesDoServicoComparativo() {
  const selectA = document.getElementById("compararMesA");
  const selectB = document.getElementById("compararMesB");

  if (selectA) selectA.value = "";
  if (selectB) selectB.value = "";

  carregarFiltrosGraficoDoisMeses();
  renderGraficoFiltroDoisMeses();
}

function somarPesoKmViagensPorMes(mesAno) {
  const servico = document.getElementById("compararServico")?.value || "";

  const dadosMes = (operacoesOriginal || []).filter(item =>
    item.data_normalizada &&
    item.data_normalizada.substring(0, 7) === mesAno &&
    (!servico || item.servico === servico)
  );

  return {
    mes: formatarMesBrasil(mesAno),
    peso: dadosMes.reduce((soma, item) => soma + numero(item.peso), 0),
    km: dadosMes.reduce((soma, item) => soma + numero(item.km), 0),
    viagens: dadosMes.reduce((soma, item) => soma + numero(item.viagens), 0)
  };
}

function renderGraficoFiltroDoisMeses() {
  const canvas = document.getElementById("graficoFiltroDoisMeses");

  if (!canvas) return;

  carregarFiltrosGraficoDoisMeses();

  const mesA = document.getElementById("compararMesA")?.value || "";
  const mesB = document.getElementById("compararMesB")?.value || "";
  const servico = document.getElementById("compararServico")?.value || "";

  if (!mesA || !mesB) return;

  const dados = [
    somarPesoKmViagensPorMes(mesA),
    somarPesoKmViagensPorMes(mesB)
  ];

  if (graficoFiltroServicoDoisMesesInstancia) {
    graficoFiltroServicoDoisMesesInstancia.destroy();
  }

  graficoFiltroServicoDoisMesesInstancia = new Chart(canvas, {
    type: "bar",
    data: {
      labels: dados.map(item => item.mes),
      datasets: [
        {
          label: servico ? `Peso - ${servico}` : "Peso",
          data: dados.map(item => item.peso),
          borderRadius: 10,
          backgroundColor: "#A7F3D0"
        },
        {
          label: servico ? `KM - ${servico}` : "KM",
          data: dados.map(item => item.km),
          borderRadius: 10,
          backgroundColor: "rgba(21,101,192,.60)"
        },
        {
          label: servico ? `Viagens - ${servico}` : "Viagens",
          data: dados.map(item => item.viagens),
          borderRadius: 10,
          backgroundColor: "rgba(245,124,0,.60)"
        }
      ]
    },
    options: opcoesGrafico()
  });
}

function limparGraficoFiltroDoisMeses() {
  const servico = document.getElementById("compararServico");
  const selectA = document.getElementById("compararMesA");
  const selectB = document.getElementById("compararMesB");

  if (servico) servico.value = "";
  if (selectA) selectA.value = "";
  if (selectB) selectB.value = "";

  carregarFiltrosGraficoDoisMeses();
  renderGraficoFiltroDoisMeses();
}

const atualizarDashboardOriginalGraficoServicoDoisMeses = atualizarDashboard;

atualizarDashboard = function() {
  atualizarDashboardOriginalGraficoServicoDoisMeses();

  carregarFiltrosGraficoDoisMeses();
  renderGraficoFiltroDoisMeses();
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    carregarFiltrosGraficoDoisMeses();
    renderGraficoFiltroDoisMeses();
  }, 900);
});



/*
========================================================
PATCH • GRÁFICO COMPARATIVO SOMENTE NA EXECUÇÃO P1 A P12
========================================================
Garante que o bloco #graficoFiltroDoisMesesBox só apareça quando
a página #tela-contrato estiver ativa.
========================================================
*/

function protegerGraficoComparativoSomenteExecucao() {
  const box = document.getElementById("graficoFiltroDoisMesesBox");
  const telaContrato = document.getElementById("tela-contrato");

  if (!box || !telaContrato) return;

  // Se por algum motivo o bloco ficou fora da tela contrato, move para dentro.
  if (!box.closest("#tela-contrato")) {
    telaContrato.appendChild(box);
  }

  const ativa = telaContrato.classList.contains("ativa");
  box.style.display = ativa ? "" : "none";
}

const mostrarTelaOriginalGraficoComparativo = typeof mostrarTela === "function" ? mostrarTela : null;

if (mostrarTelaOriginalGraficoComparativo) {
  mostrarTela = function(nome, botao) {
    mostrarTelaOriginalGraficoComparativo(nome, botao);

    setTimeout(() => {
      protegerGraficoComparativoSomenteExecucao();
      if (nome === "contrato" && typeof renderGraficoFiltroDoisMeses === "function") {
        carregarFiltrosGraficoDoisMeses();
        renderGraficoFiltroDoisMeses();
      }
    }, 80);
  };
}

const atualizarDashboardOriginalSomenteExecucao = atualizarDashboard;

atualizarDashboard = function() {
  atualizarDashboardOriginalSomenteExecucao();

  protegerGraficoComparativoSomenteExecucao();

  const telaContrato = document.getElementById("tela-contrato");
  if (telaContrato && telaContrato.classList.contains("ativa")) {
    if (typeof carregarFiltrosGraficoDoisMeses === "function") carregarFiltrosGraficoDoisMeses();
    if (typeof renderGraficoFiltroDoisMeses === "function") renderGraficoFiltroDoisMeses();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(protegerGraficoComparativoSomenteExecucao, 300);
  setTimeout(protegerGraficoComparativoSomenteExecucao, 1200);
});



/*
========================================================
PATCH • CORREÇÃO SERVIÇOS QUE NÃO APARECIAM NO FILTRO
========================================================
Diagnóstico feito na TabelaPadrão:
1. P5 e P6 usam a coluna "Data Análise".
   O sistema não estava lendo data_analise como data da operação.
2. P2.1 e P2.2 possuem linhas com Serviço_P = "P2".
   O sistema priorizava Serviço_P e salvava esses lançamentos como P2,
   por isso eles não batiam com P2.1 e P2.2 no Painel Executivo.
Correção:
- Para identificar o serviço operacional, prioriza o código da aba.
- Inclui data_analise nas possibilidades de data.
- Garante todos os serviços P1 a P12 aparecendo ao filtrar por dia/mês.
========================================================
*/

const ORDEM_OFICIAL_SERVICOS_FILTRO = [
  "P1", "P2.1", "P2.2", "P3", "P4", "P5", "P6",
  "P7", "P8", "P9", "P10", "P11", "P12"
];

function ordenarPainelServicosFiltro(lista) {
  return [...(lista || [])].sort((a, b) => {
    const ia = ORDEM_OFICIAL_SERVICOS_FILTRO.indexOf(a.servico);
    const ib = ORDEM_OFICIAL_SERVICOS_FILTRO.indexOf(b.servico);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

function basePainelCompletaFiltro() {
  return ordenarPainelServicosFiltro(
    painelExecutivoOriginal && painelExecutivoOriginal.length
      ? painelExecutivoOriginal
      : painelExecutivo
  );
}

/*
  Substitui gerarOperacoes para corrigir P2.1/P2.2 e Data Análise.
*/

/* função duplicada removida: gerarOperacoes */


/*
  Garante todos os serviços no Painel Geral ao filtrar dia/mês/ano.
*/

/* função duplicada removida: aplicarFiltroPeriodoExecutivo */


/*
  Recalcula filtro mensal preservando todos os serviços oficiais.
*/

/* função duplicada removida: recalcularPainelPorFiltro */


function renderTabelaExecutiva() {
  const tabela = document.getElementById("tabelaPainelExecutivo");
  if (!tabela) return;

  const dados = ordenarPainelServicosFiltro(painelExecutivo || []);

  if (!dados.length) {
    tabela.innerHTML = `<tr><td colspan="9">Nenhuma base carregada.</td></tr>`;
    return;
  }

  tabela.innerHTML = dados.map(item => linhaTabelaOficial(item)).join("");
}


/* função duplicada removida: gerarPainelExecucaoMensal */




/*
========================================================
PATCH • SALVAR TODAS AS ABAS AO SAIR E ENTRAR
========================================================
Problema:
- O localStorage só guardava um resumo leve.
- Ao sair e entrar novamente, o sistema podia carregar apenas uma aba/resumo.

Correção:
- Cria uma base local IndexedDB chamada CCO_DB_COMPLETO.
- Salva sheetsOriginais, todasAsAbas, painelExecutivo e operacoes.
- Ao abrir o sistema novamente, restaura todas as abas da última importação.
- Mantém Supabase se estiver configurado, mas agora o navegador também guarda
  a base completa localmente.
========================================================
*/

const CCO_INDEXED_DB = "CCO_DB_COMPLETO_V1";
const CCO_INDEXED_STORE = "base_ativa";
const CCO_INDEXED_KEY = "ultima_base";

function abrirBancoIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CCO_INDEXED_DB, 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(CCO_INDEXED_STORE)) {
        db.createObjectStore(CCO_INDEXED_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function salvarBaseCompletaIndexedDB(nomeArquivo = "Base ativa") {
  try {
    const db = await abrirBancoIndexedDB();

    const payload = {
      id: CCO_INDEXED_KEY,
      nomeArquivo,
      salvoEm: new Date().toISOString(),
      painelExecutivo: painelExecutivo || [],
      painelExecutivoOriginal: painelExecutivoOriginal || [],
      operacoes: operacoes || [],
      operacoesOriginal: operacoesOriginal || [],
      sheetsOriginais: sheetsOriginais || {},
      todasAsAbas: todasAsAbas || []
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction(CCO_INDEXED_STORE, "readwrite");
      const store = tx.objectStore(CCO_INDEXED_STORE);
      store.put(payload);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });

    console.log("Base completa salva no IndexedDB:", payload.todasAsAbas.length, "abas");
    return true;
  } catch (erro) {
    console.error("Erro ao salvar IndexedDB:", erro);
    return false;
  }
}

async function carregarBaseCompletaIndexedDB() {
  try {
    const db = await abrirBancoIndexedDB();

    const payload = await new Promise((resolve, reject) => {
      const tx = db.transaction(CCO_INDEXED_STORE, "readonly");
      const store = tx.objectStore(CCO_INDEXED_STORE);
      const request = store.get(CCO_INDEXED_KEY);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (!payload) return false;

    painelExecutivo = payload.painelExecutivo || [];
    painelExecutivoOriginal = payload.painelExecutivoOriginal || clonar(painelExecutivo);

    operacoes = payload.operacoes || [];
    operacoesOriginal = payload.operacoesOriginal || clonar(operacoes);

    sheetsOriginais = payload.sheetsOriginais || {};
    todasAsAbas = payload.todasAsAbas || [];

    atualizarDashboard();
    aplicarRestricoesPerfil();

    preencherTexto(
      "nomeArquivo",
      `${todasAsAbas.length || 0} aba(s) restaurada(s) da base local completa`
    );

    console.log("Base completa restaurada do IndexedDB:", todasAsAbas.length, "abas");
    return true;
  } catch (erro) {
    console.error("Erro ao carregar IndexedDB:", erro);
    return false;
  }
}

async function limparBaseCompletaIndexedDB() {
  try {
    const db = await abrirBancoIndexedDB();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(CCO_INDEXED_STORE, "readwrite");
      const store = tx.objectStore(CCO_INDEXED_STORE);
      store.delete(CCO_INDEXED_KEY);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });

    return true;
  } catch (erro) {
    console.warn("Não foi possível limpar IndexedDB:", erro);
    return false;
  }
}

/*
  Envolve a importação original:
  depois de importar, salva a base completa localmente.
*/
const importarPlanilhasOriginalIndexedDB = importarPlanilhas;

importarPlanilhas = async function(evento) {
  await importarPlanilhasOriginalIndexedDB(evento);

  const nomeArquivo = Array.from(evento?.target?.files || [])
    .map(a => a.name)
    .join(", ") || "Base importada";

  if ((todasAsAbas || []).length) {
    await salvarBaseCompletaIndexedDB(nomeArquivo);
  }
};

/*
  Ao abrir o sistema, força restauração da base completa se o sistema carregou
  apenas resumo ou somente uma aba.
*/
document.addEventListener("DOMContentLoaded", () => {
  if (["painel","kpi","execucao","dados","historico"].includes(String(window.CCO_PAGE || "").toLowerCase())) return;
  setTimeout(async () => {
    const poucasAbas = !todasAsAbas || todasAsAbas.length <= 1;
    const semOperacoesCompletas = !operacoesOriginal || operacoesOriginal.length <= 1;

    if (poucasAbas || semOperacoesCompletas) {
      const carregou = await carregarBaseCompletaIndexedDB();

      if (carregou) {
        atualizarDashboard();
        aplicarRestricoesPerfil();
      }
    }
  }, 1500);
});

/*
  Atualiza a função de limpeza para apagar também a base IndexedDB.
*/
if (typeof limparBanco === "function") {
  const limparBancoOriginalIndexedDB = limparBanco;

  limparBanco = async function() {
    await limparBancoOriginalIndexedDB();
    await limparBaseCompletaIndexedDB();
  };
}



/*
========================================================
PATCH • CORREÇÃO DA VARIAÇÃO DO COMPARATIVO MENSAL
========================================================
Problema:
- A variação mensal começava comparando o primeiro mês com zero.
- Isso gerava percentual incorreto no primeiro mês.

Correção:
- O primeiro mês vira "Base".
- A variação só é calculada a partir do segundo mês.
- O cálculo compara o mês atual com o mês anterior real.
========================================================
*/

function calcularComparativoMensalCorrigido() {
  const mapa = {};

  (operacoesOriginal || []).forEach(item => {
    if (!item.data_normalizada) return;

    const mesAno = item.data_normalizada.substring(0, 7);

    if (!mapa[mesAno]) {
      mapa[mesAno] = {
        mesAno,
        mesBrasil: formatarMesBrasil(mesAno),
        peso: 0,
        km: 0,
        viagens: 0,
        equipe: 0,
        registros: 0,
        produtividade: 0,
        variacao: null,
        variacaoTexto: "Base"
      };
    }

    mapa[mesAno].peso += numero(item.peso);
    mapa[mesAno].km += numero(item.km);
    mapa[mesAno].viagens += numero(item.viagens);
    mapa[mesAno].equipe += numero(item.equipe);
    mapa[mesAno].registros += 1;
  });

  const lista = Object.values(mapa)
    .sort((a, b) => a.mesAno.localeCompare(b.mesAno));

  lista.forEach((item, index) => {
    item.produtividade = item.viagens ? item.peso / item.viagens : 0;

    if (index === 0) {
      item.variacao = null;
      item.variacaoTexto = "Base";
      return;
    }

    const anterior = lista[index - 1];

    /*
      Usa peso como base principal da variação mensal.
      Se o mês anterior não tiver peso, evita divisão por zero.
    */
    if (!numero(anterior.peso)) {
      item.variacao = null;
      item.variacaoTexto = "Sem base";
      return;
    }

    item.variacao = ((numero(item.peso) - numero(anterior.peso)) / numero(anterior.peso)) * 100;
    item.variacaoTexto = `${item.variacao >= 0 ? "+" : ""}${formatarNumero(item.variacao)}%`;
  });

  return lista;
}


/* função duplicada removida: renderComparativoMensal */




/*
========================================================
PATCH • PAINEL GERAL LIMPO
========================================================
*/

function renderResumo() {
  const resumo = document.getElementById("resumoExecutivo");
  if (!resumo) return;
}

function renderRankingOperacional() {
  const ranking = document.getElementById("rankingOperacional");
  if (!ranking) return;
}

function renderRankingPorMedicao() {
  const cards = document.getElementById("cardsRankingMedicao");
  const select = document.getElementById("filtroRankingMedicao");
  if (!cards) return;

  if (typeof carregarFiltroRankingMedicao === "function") carregarFiltroRankingMedicao();

  const medicaoFiltro = select?.value || "";
  let dados = [...(painelExecutivo || painelExecutivoOriginal || [])];

  if (medicaoFiltro) dados = dados.filter(item => String(item.medicao) === medicaoFiltro);

  dados = dados
    .filter(item => numero(item.valor) > 0)
    .sort((a, b) => numero(b.valor) - numero(a.valor))
    .slice(0, 6);

  const maiorValor = dados.length ? Math.max(...dados.map(i => numero(i.valor))) : 1;

  cards.innerHTML = dados.map((item, index) => {
    const largura = Math.max(5, (numero(item.valor) / maiorValor) * 100);
    const posicao = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}º`;
    const quantidadeMoedas = Math.max(3, Math.round(3 + (largura / 100) * 9));
    const moedas = Array.from({ length: quantidadeMoedas }, (_, moeda) => `<i style="--coin-index:${moeda}" aria-hidden="true"><b>R$</b></i>`).join("");

    return `
      <article class="coin-ranking-item" style="--coin-ratio:${largura / 100}">
        <div class="coin-ranking-value"><span>${posicao} ${item.servico}</span><strong>${formatarMoeda(item.valor)}</strong><small>${item.medicao || "Sem medição"} • ${formatarNumero(item.porcentagem_execucao)}%</small></div>
        <div class="coin-stack" role="img" aria-label="Pilha de ${quantidadeMoedas} moedas representando ${formatarMoeda(item.valor)}">${moedas}</div>
        <div class="coin-pedestal"><b>${index + 1}</b><span>posição</span></div>
      </article>
    `;
  }).join("") || "Nenhum dado disponível.";
}

const atualizarDashboardOriginalPainelLimpo = atualizarDashboard;
atualizarDashboard = function() {
  atualizarDashboardOriginalPainelLimpo();
  renderRankingPorMedicao();
};



/*
========================================================
PATCH • SUPABASE TODAS AS ABAS NO CELULAR
========================================================
- Carrega biblioteca Supabase no index.html.
- Salva abas grandes em partes.
- Carrega e junta partes da mesma aba.
- Evita base ativa incompleta.
========================================================
*/

const TAMANHO_LOTE_ABA_SUPABASE = 500;

function dividirArrayEmLotes(lista, tamanho = TAMANHO_LOTE_ABA_SUPABASE) {
  const lotes = [];

  for (let i = 0; i < lista.length; i += tamanho) {
    lotes.push(lista.slice(i, i + tamanho));
  }

  return lotes;
}

function garantirClienteSupabase() {
  try {
    if (window.supabaseClient) banco = window.supabaseClient;
    return Boolean(window.supabaseClient);
  } catch (erro) {
    console.error("Erro ao iniciar Supabase:", erro);
    return false;
  }
}

async function salvarBaseCompletaSupabase(nomeArquivo) {
  if (!garantirClienteSupabase()) {
    console.error("Supabase não carregado. Verifique o script @supabase/supabase-js no index.html.");
    return false;
  }

  let importacao = null;

  try {
    const usuario = obterUsuarioLogado();

    const { error: erroUpdate } =
      await banco
        .from("importacoes")
        .update({ ativo: false })
        .eq("ativo", true);

    if (erroUpdate) {
      console.error("Erro ao desativar base anterior:", erroUpdate);
      return false;
    }

    const { data, error: erroImportacao } =
      await banco
        .from("importacoes")
        .insert({
          nome_arquivo: nomeArquivo,
          usuario: usuario.usuario || "Não identificado",
          perfil: usuario.perfil || "Sem perfil",
          total_abas: todasAsAbas.length,
          ativo: true
        })
        .select()
        .single();

    if (erroImportacao) {
      console.error("Erro ao criar importação:", erroImportacao);
      return false;
    }

    importacao = data;

    for (const nomeAba of Object.keys(sheetsOriginais)) {
      const aba = sheetsOriginais[nomeAba];
      const linhas = aba.dadosOriginais || [];
      const lotes = dividirEmLotesSupabase(linhas, 50);

      if (!lotes.length) lotes.push([]);

      for (let indice = 0; indice < lotes.length; indice++) {
        const { error: erroInsert } =
          await banco
            .from("planilhas_importadas")
            .insert({
              nome_arquivo: nomeArquivo,
              aba: aba.nomeOriginal,
              codigo_servico: aba.codigoServico || "GERAL",
              dados: sanitizarParaSupabase(lotes[indice]),
              importacao_id: importacao.id
            });

        if (erroInsert) {
          console.error(`Erro ao salvar aba ${aba.nomeOriginal}, parte ${indice + 1}:`, erroInsert);

          await banco
            .from("importacoes")
            .delete()
            .eq("id", importacao.id);

          return false;
        }
      }
    }

    return true;

  } catch (erro) {
    console.error("Erro geral ao salvar Supabase:", erro);

    if (importacao?.id && banco) {
      try {
        await banco.from("importacoes").delete().eq("id", importacao.id);
      } catch {}
    }

    return false;
  }
}

async function carregarBaseSupabase() {
  if (!garantirClienteSupabase()) {
    console.error("Supabase não carregado no navegador.");
    return false;
  }

  try {
    const { data, error } =
      await banco
        .from("planilhas_importadas")
        .select(`
          *,
          importacoes!inner(
            id,
            ativo,
            nome_arquivo,
            usuario,
            perfil,
            total_abas,
            criado_em
          )
        `)
        .eq("importacoes.ativo", true)
        .order("id", { ascending: false });

    if (error || !data || !data.length) {
      if (error) console.error("Erro ao carregar Supabase:", error);
      return false;
    }

    limparMemoria();

    const mapaAbas = {};

    data.forEach(item => {
      const nome = normalizar(item.aba);

      if (!mapaAbas[nome]) {
        mapaAbas[nome] = {
          nomeOriginal: item.aba,
          codigoServico: item.codigo_servico,
          dadosOriginais: []
        };
      }

      if (Array.isArray(item.dados)) {
        mapaAbas[nome].dadosOriginais.push(...item.dados);
      }
    });

    Object.keys(mapaAbas).forEach(nome => {
      const aba = mapaAbas[nome];

      sheetsOriginais[nome] = {
        nomeOriginal: aba.nomeOriginal,
        codigoServico: aba.codigoServico,
        dadosOriginais: aba.dadosOriginais,
        dadosNormalizados: aba.dadosOriginais.map(linha => normalizarObjeto(linha))
      };

      todasAsAbas.push({
        arquivo: data[0]?.nome_arquivo || "Base Supabase",
        aba: aba.nomeOriginal,
        linhas: aba.dadosOriginais.length
      });
    });

    if (!sheetsOriginais["painel executivo"]) {
      console.error("Painel Executivo não encontrado no Supabase.");
      return false;
    }

    gerarOperacoes();
    gerarPainelExecutivo();

    painelExecutivoOriginal = clonar(painelExecutivo);
    operacoesOriginal = clonar(operacoes);

    const nomeArquivo = data[0]?.nome_arquivo || "Base Supabase";
    const resumo = montarResumoLeve(nomeArquivo);
    salvarResumoLocal(resumo);

    atualizarDashboard();
    aplicarRestricoesPerfil();

    preencherTexto(
      "nomeArquivo",
      `${todasAsAbas.length} aba(s) carregada(s) do Supabase | ${operacoes.length} registros operacionais`
    );

    console.log("Abas carregadas do Supabase:", todasAsAbas);
    return true;

  } catch (erro) {
    console.error("Erro geral ao carregar Supabase:", erro);
    return false;
  }
}




/*
========================================================
PATCH • NÃO CARREGAR RESUMO PARCIAL ANTES DA BASE TODA
========================================================
- O sistema não carrega mais o resumo local parcial.
- Evita aparecer somente uma aba ao abrir no celular.
- Deve carregar a base completa do Supabase ou aguardar nova importação.
========================================================
*/


/* função duplicada removida: carregarResumoLocal */


async function iniciarSistemaSomenteBaseCompleta() {
  atualizarData();

  const input = document.getElementById("arquivoExcel");
  if (input && input.dataset.eventoImportacao !== "sim") {
    input.addEventListener("change", importarPlanilhas);
    input.dataset.eventoImportacao = "sim";
  }

  aplicarRestricoesPerfil();
  mostrarLoading(true);

  preencherTexto("nomeArquivo", "🔄 Carregando dados da base...");
  const carregouBanco = await carregarBaseSupabase();

  mostrarLoading(false);

  if (!carregouBanco) {
    limparMemoria();
    atualizarDashboard();
    aplicarRestricoesPerfil();

    preencherTexto(
      "nomeArquivo",
      "🔄 Carregando dados da base..."
    );
  }

  carregarHistorico();
}

/*
  Reforço após abrir a página:
  se tiver só uma aba/resumo, tenta recarregar a base completa.
*/
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(async () => {
    const pareceParcial =
      (!todasAsAbas || todasAsAbas.length <= 1) &&
      (!operacoesOriginal || operacoesOriginal.length <= 1);

    if (pareceParcial) {
      await iniciarSistemaSomenteBaseCompleta();
    }
  }, 1200);
});



/*
========================================================
PATCH FINAL • DIAS_OPERACAO NA ÚLTIMA ABA
========================================================
Regra:
- Total Dias Mês vem da última aba da planilha ou da aba Dias_Operacao/Plan1.
- Coluna de dias: Dias_Operação / Dias Operação / Dias_Operacao.
- Coluna de mês: mês / mes.
- Aceita data em padrão brasileiro:
  01/03/2026, 03/2026 ou Março/2026.
- Não usa calendário e não conta Data_Operação.
========================================================
*/

function normalizarNomeMesBR(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function numeroMesPorNomeBR(nome) {
  const mapa = {
    janeiro: "01",
    fevereiro: "02",
    marco: "03",
    março: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12"
  };

  return mapa[normalizarNomeMesBR(nome)] || "";
}

/*
  Encontra a aba oficial dos dias de operação.
  Prioridade:
  1. dias_operacao
  2. dias_operação
  3. plan1
  4. última aba importada da planilha
*/

/* função duplicada removida: obterAbaDiasOperacao */


function obterCampoDiasOperacao(item) {
  return numero(
    item.dias_operacao ||
    item.dias_operação ||
    item["Dias_Operação"] ||
    item["Dias Operação"] ||
    item["Dias_Operacao"] ||
    item["Dias Operacao"] ||
    item.total_dias_mes ||
    item.total_dias ||
    0
  );
}

function obterCampoMesDiasOperacao(item) {
  return (
    item.mes ||
    item.mês ||
    item["mês"] ||
    item["Mês"] ||
    item["mes"] ||
    item["Mes"] ||
    item.data ||
    item["Data"] ||
    ""
  );
}

/*
  Compara o valor da coluna mês com ano/mês selecionados.
  Aceita:
  - 01/03/2026
  - 03/2026
  - 2026-03-01
  - Março/2026
  - mar/2026
*/
function mesLinhaCorresponde(valorMes, ano, mes) {
  const alvoAno = String(ano);
  const alvoMes = String(mes).padStart(2, "0");
  const bruto = String(valorMes || "").trim();

  if (!bruto) return false;

  /*
    Data Excel pode chegar como número serial.
  */
  if (/^\d+(\.\d+)?$/.test(bruto)) {
    const serial = Number(bruto);
    if (serial > 20000 && serial < 80000) {
      const data = XLSX.SSF.parse_date_code(serial);
      if (data) {
        return String(data.y) === alvoAno && String(data.m).padStart(2, "0") === alvoMes;
      }
    }
  }

  /*
    Formato ISO: 2026-03-01
  */
  if (/^\d{4}-\d{2}/.test(bruto)) {
    return bruto.substring(0, 4) === alvoAno && bruto.substring(5, 7) === alvoMes;
  }

  /*
    Formato brasileiro: DD/MM/AAAA ou MM/AAAA.
  */
  if (bruto.includes("/")) {
    const partes = bruto.split("/").map(p => p.trim());

    if (partes.length === 2) {
      /*
        MM/AAAA ou Março/2026.
      */
      const mesParte = /^\d+$/.test(partes[0])
        ? partes[0].padStart(2, "0")
        : numeroMesPorNomeBR(partes[0]);

      return mesParte === alvoMes && partes[1] === alvoAno;
    }

    if (partes.length === 3) {
      return partes[1].padStart(2, "0") === alvoMes && partes[2] === alvoAno;
    }
  }

  /*
    Formato: Março 2026 ou Março-2026.
  */
  const limpo = bruto.replace("-", " ").replace("_", " ");
  const pedacos = limpo.split(/\s+/);

  if (pedacos.length >= 2) {
    const mesNome = numeroMesPorNomeBR(pedacos[0]);
    const anoTexto = pedacos.find(p => /^\d{4}$/.test(p));

    if (mesNome && anoTexto) {
      return mesNome === alvoMes && anoTexto === alvoAno;
    }
  }

  return false;
}

/*
  Busca Total Dias Mês na aba Dias_Operacao/Plan1/última aba.
*/
function obterDiasOperacaoMes(ano, mes) {
  const abaDias = obterAbaDiasOperacao();

  if (!abaDias || !Array.isArray(abaDias.dadosNormalizados)) {
    return 0;
  }

  const linha = abaDias.dadosNormalizados.find(item => {
    const valorMes = obterCampoMesDiasOperacao(item);
    return mesLinhaCorresponde(valorMes, ano, mes);
  });

  if (!linha) {
    console.warn(`Dias_Operação não encontrado para ${String(mes).padStart(2, "0")}/${ano}.`);
    return 0;
  }

  return obterCampoDiasOperacao(linha);
}

function obterPrevistoPorDiasOperacao(servico, ano, mes, totalDiasMes, previstoOriginal) {
  return window.CCO_REGRAS.calcularPrevisto(servico,ano,mes,numero(previstoOriginal),numero(totalDiasMes));
}

function contarDiasAcumuladosServico(dadosServico) {
  const dias = new Set();

  (dadosServico || []).forEach(item => {
    if (item.data_normalizada) {
      dias.add(item.data_normalizada.substring(0, 10));
    }
  });

  return dias.size;
}

function obterAnoMesReferencia(dados) {
  const primeiro = (dados || []).find(item => item.data_normalizada);

  if (!primeiro) {
    const hoje = new Date();
    return {
      ano: String(hoje.getFullYear()),
      mes: String(hoje.getMonth() + 1).padStart(2, "0")
    };
  }

  return {
    ano: primeiro.data_normalizada.substring(0, 4),
    mes: primeiro.data_normalizada.substring(5, 7)
  };
}

/*
  Painel Executivo inicial usando Dias_Operação da última aba.
*/

/* função duplicada removida: gerarPainelExecutivo */


/*
  Filtro do Painel Geral com Dias_Operação por mês selecionado.
*/
function aplicarFiltroPeriodoExecutivo() {
  const dia = document.getElementById("filtroDia")?.value || "";
  const mes = document.getElementById("filtroMes")?.value || "";
  const ano = document.getElementById("filtroAno")?.value || "";

  operacoes = (operacoesOriginal || []).filter(item => {
    if (!item.data_normalizada) return false;

    const partes = item.data_normalizada.split("-");
    if (partes.length !== 3) return false;

    return (
      (!ano || partes[0] === ano) &&
      (!mes || partes[1] === mes) &&
      (!dia || partes[2] === dia)
    );
  });

  const ref = ano && mes ? { ano, mes } : obterAnoMesReferencia(operacoes.length ? operacoes : operacoesOriginal);
  const totalDiasMes = obterDiasOperacaoMes(ref.ano, ref.mes);

  painelExecutivo = (painelExecutivoOriginal || []).map(item => {
    const dadosServico = operacoes.filter(op => op.servico === item.servico);

    const previsto =
      obterPrevistoPorDiasOperacao(item.servico, ref.ano, ref.mes, item.total_dias_mes, item.previsto_mes);

    const acumulado =
      dadosServico.length
        ? calcularAcumuladoPorServico(item.servico, dadosServico, previsto)
        : 0;

    const valorUnitario = VALORES_FIXOS[item.servico] || 0;

    const valorFinal =
      SERVICOS_FIXOS.includes(item.servico)
        ? valorUnitario
        : valorUnitario * acumulado;

    return {
      ...item,
      previsto_mes: previsto,
      acumulado_mes: acumulado,
      porcentagem_execucao: calcularPercentual(acumulado, previsto),
      dias_acumulados: contarDiasAcumuladosServico(dadosServico),
      total_dias_mes: totalDiasMes,
      valor: valorFinal,
      status: acumulado > 0 ? "Com dados" : "Sem dados"
    };
  });

  renderCards();
  renderTabelaExecutiva();
  renderTabelaContratualMensal();
  renderResumo();
  renderResumoAutomaticoDiretoria();
  renderRankingOperacional();
  renderAlertas();
  renderGraficos();

  if (typeof renderRankingPorMedicao === "function") renderRankingPorMedicao();
  if (typeof renderComparativoMensal === "function") renderComparativoMensal();
  if (typeof renderGraficoFiltroDoisMeses === "function") renderGraficoFiltroDoisMeses();

  aplicarRestricoesPerfil();
}

/*
  Recalcula filtros mensais mantendo Dias_Operação oficial.
*/

/* função duplicada removida: recalcularPainelPorFiltro */


/*
  Execução P1 a P12 usando Dias_Operação da aba oficial.
*/

/* função duplicada removida: gerarPainelExecucaoMensal */




/*
========================================================
PATCH • P12 / TRANSBORDO
========================================================
Regra solicitada:
Acumulado no Mês do Transbordo (P12) =
Soma da coluna Peso_T x Soma da coluna Executado

Observação:
- Para P12, não usa apenas Peso.
- Para P12, não limita ao previsto.
- Valor contratual do P12 continua:
  Valor = Valor unitário P12 x Acumulado calculado.
========================================================
*/

function obterPesoTransbordo(item) {
  return numero(
    item.peso_t ||
    item.pesot ||
    item["Peso_T"] ||
    item["Peso T"] ||
    item["Peso(T)"] ||
    item.peso ||
    item.peso_total ||
    item.tonelada ||
    item.toneladas ||
    0
  );
}

function obterExecutadoTransbordo(item) {
  return numero(
    item.executado ||
    item["Executado"] ||
    item.qtd_executada ||
    item.quantidade_executada ||
    item.execucao ||
    item.execução ||
    0
  );
}

/*
  Reforça a leitura das operações para preservar Peso_T e Executado.
*/

/* função duplicada removida: gerarOperacoes */


/*
  Cálculo oficial com P12/Transbordo corrigido.
*/

/* função duplicada removida: calcularAcumuladoPorServico */




/*
========================================================
PATCH FINAL • LIMITAR SOMENTE SERVIÇOS POR EQUIPE
========================================================
Regra:
- Só limita ao previsto os serviços medidos por equipe:
  P3, P7, P8, P9, P10 e P11.

- Não limita ao previsto:
  P1, P2.1, P2.2, P4, P5, P6 e P12.

- P12 / Transbordo:
  Acumulado no Mês = Soma(Peso_T) x Soma(Executado)
  e NÃO limita ao previsto.
========================================================
*/

const SERVICOS_LIMITAR_APENAS_EQUIPE_FINAL = ["P3", "P7", "P8", "P9", "P10", "P11"];

function limitarApenasSeEquipe(servico, realizado, previstoMes) {
  if (SERVICOS_LIMITAR_APENAS_EQUIPE_FINAL.includes(servico)) {
    return limitarPeloPrevisto(realizado, previstoMes);
  }

  return numero(realizado);
}


/* função duplicada removida: calcularAcumuladoPorServico */


/*
  Corrige qualquer cálculo direto que use limitarPeloPrevisto fora do cálculo principal.
  A regra oficial é centralizada em calcularAcumuladoPorServico().
*/
function calcularStatusExecucao(acumulado, previsto) {
  const a = numero(acumulado);
  const p = numero(previsto);

  if (!a) return "Sem dados";
  if (p && a >= p) return "Atingido";
  return "Não atingido";
}



/*
========================================================
PATCH FINAL APLICADO • REGRAS CONTRATUAIS OFICIAIS
========================================================

Regras:
P1   = Soma Peso x 296,00
P2.1 = Soma Viagens x 1.027,42
P2.2 = Soma Viagens x 1.027,42
P3   = 12 equipes x 41.992,93 | acumulado limitado ao previsto
P4   = Soma Peso x 68,80
P5   = Soma KM x 160,94
P6   = Soma KM x 76,24
P7   = 2 equipes x 49.811,72 | acumulado limitado ao previsto
P8   = 2 equipes x 81.001,04 | acumulado limitado ao previsto
P9   = 11 equipes x 122.039,23 | acumulado limitado ao previsto
P10  = 3 equipes x 346.660,01 | acumulado limitado ao previsto
P11  = 1 equipe x 272.459,08 | acumulado limitado ao previsto
P12  = Soma Executado x 0,83 | não limitado

========================================================
*/

const EQUIPES_FIXAS_CONTRATUAIS = window.CCO_EQUIPES_FIXAS;

function ehServicoEquipeContratual(servico) {
  return Object.prototype.hasOwnProperty.call(EQUIPES_FIXAS_CONTRATUAIS, servico);
}


/* função duplicada removida: calcularValorFinalServico */



/* função duplicada removida: calcularAcumuladoPorServico */



/* função duplicada removida: gerarPainelExecutivo */



/* função duplicada removida: recalcularPainelPorFiltro */



/* função duplicada removida: gerarPainelExecucaoMensal */




/*
========================================================
PATCH FINAL • DIAS_OPERAÇÃO + % EXECUÇÃO LIVRE
========================================================
Regras:
- Total dias mês vem da aba Dias_Operação, Plan1 ou última aba.
- Busca o mês correspondente na coluna mês/mes.
- Aceita datas brasileiras: 01/04/2026, 04/2026, Abril/2026.
- % execução NÃO é limitado a 100%.
========================================================
*/


/* função duplicada removida: calcularPercentual */


function obterAbaDiasOperacao() {
  if (sheetsOriginais["dias_operacao"]) return sheetsOriginais["dias_operacao"];
  if (sheetsOriginais["dias_operação"]) return sheetsOriginais["dias_operação"];
  if (sheetsOriginais["dias operação"]) return sheetsOriginais["dias operação"];
  if (sheetsOriginais["plan1"]) return sheetsOriginais["plan1"];

  const chaves = Object.keys(sheetsOriginais || {});
  if (!chaves.length) return null;

  return sheetsOriginais[chaves[chaves.length - 1]];
}

function obterValorMesDaLinhaDias(item) {
  return (
    item.mes ||
    item.mês ||
    item["mes"] ||
    item["mês"] ||
    item["Mes"] ||
    item["Mês"] ||
    item.data ||
    item["Data"] ||
    ""
  );
}

function obterValorDiasOperacaoLinha(item) {
  return numero(
    item.dias_operacao ||
    item.dias_operação ||
    item["Dias_Operação"] ||
    item["Dias Operação"] ||
    item["Dias_Operacao"] ||
    item["Dias Operacao"] ||
    item.total_dias_mes ||
    item.total_dias ||
    0
  );
}

function mesTextoParaNumeroBR(texto) {
  const t = String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const mapa = {
    janeiro: "01",
    fevereiro: "02",
    marco: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12"
  };

  return mapa[t] || "";
}

function linhaMesCorrespondeDiasOperacao(valorMes, ano, mes) {
  const alvoAno = String(ano || "");
  const alvoMes = String(mes || "").padStart(2, "0");
  const valor = String(valorMes || "").trim();

  if (!valor || !alvoAno || !alvoMes) return false;

  // Serial de data Excel
  if (/^\d+(\.\d+)?$/.test(valor)) {
    const serial = Number(valor);
    if (serial > 20000 && serial < 80000 && window.XLSX?.SSF?.parse_date_code) {
      const data = XLSX.SSF.parse_date_code(serial);
      if (data) {
        return String(data.y) === alvoAno && String(data.m).padStart(2, "0") === alvoMes;
      }
    }
  }

  // ISO: 2026-04-01
  if (/^\d{4}-\d{2}/.test(valor)) {
    return valor.substring(0, 4) === alvoAno && valor.substring(5, 7) === alvoMes;
  }

  // BR: 01/04/2026, 04/2026, Abril/2026
  if (valor.includes("/")) {
    const partes = valor.split("/").map(p => p.trim());

    if (partes.length === 3) {
      return partes[1].padStart(2, "0") === alvoMes && partes[2] === alvoAno;
    }

    if (partes.length === 2) {
      const mesParte = /^\d+$/.test(partes[0])
        ? partes[0].padStart(2, "0")
        : mesTextoParaNumeroBR(partes[0]);

      return mesParte === alvoMes && partes[1] === alvoAno;
    }
  }

  // Abril 2026 / Abril-2026
  const limpo = valor.replace("-", " ").replace("_", " ");
  const pedacos = limpo.split(/\s+/);

  if (pedacos.length >= 2) {
    const mesNome = mesTextoParaNumeroBR(pedacos[0]);
    const anoTexto = pedacos.find(p => /^\d{4}$/.test(p));

    if (mesNome && anoTexto) {
      return mesNome === alvoMes && anoTexto === alvoAno;
    }
  }

  return false;
}

function obterTotalDiasMesDiasOperacao(ano, mes, fallback = 0) {
  if (!(Number(ano) >= 1900 && Number(mes) >= 1 && Number(mes) <= 12)) return numero(fallback);
  const oficial=window.CCOPainelService?.obterDiasOperacao?.(ano,mes,window.__CCO_IMPORTACAO_ATIVA__?.importacao_id);
  return numero(oficial||fallback);
}


function obterAnoMesReferenciaPainel(dados) {
  const item = (dados || []).find(x => x.data_normalizada);

  if (item) {
    return {
      ano: item.data_normalizada.substring(0, 4),
      mes: item.data_normalizada.substring(5, 7)
    };
  }

  const hoje = new Date();

  return {
    ano: String(hoje.getFullYear()),
    mes: String(hoje.getMonth() + 1).padStart(2, "0")
  };
}

/*
  Painel Executivo usando Dias_Operação como fonte oficial do Total dias mês.
*/

/* função duplicada removida: gerarPainelExecutivo */


/*
  Filtro do Painel Geral usando Dias_Operação do mês filtrado.
*/

/* função duplicada removida: recalcularPainelPorFiltro */


/*
  Execução P1 a P12 usando Dias_Operação do mês selecionado.
*/

/* função duplicada removida: gerarPainelExecucaoMensal */




/*
========================================================
PATCH DEFINITIVO • TOTAL DIAS MÊS PELA ABA DIAS_OPERAÇÃO
========================================================
Correção:
- Localiza a aba mesmo com acento, espaço, hífen ou nome diferente:
  Dias_Operação, Dias Operação, Dias_Operacao, Plan1 ou última aba.
- Lê coluna Dias_Operação mesmo após normalização.
- Lê mês em formatos:
  01/04/2026, 04/2026, Abril/2026, 2026-04-01 ou serial Excel.
- Aplica Total dias mês no Painel Geral e Execução P1 a P12.
========================================================
*/

function normalizarTextoSemAcentoFinal(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function obterAbaDiasOperacaoFinal() {
  const chaves = Object.keys(sheetsOriginais || {});
  if (!chaves.length) return null;

  // Procura por nome normalizado contendo dias + operacao
  let chave = chaves.find(k => {
    const n = normalizarTextoSemAcentoFinal(k);
    return n.includes("dias") && n.includes("operacao");
  });

  if (chave) return sheetsOriginais[chave];

  // Procura pelo nome original
  chave = chaves.find(k => {
    const aba = sheetsOriginais[k];
    const n = normalizarTextoSemAcentoFinal(aba?.nomeOriginal || "");
    return n.includes("dias") && n.includes("operacao");
  });

  if (chave) return sheetsOriginais[chave];

  // Fallback Plan1
  chave = chaves.find(k => normalizarTextoSemAcentoFinal(k) === "plan1");
  if (chave) return sheetsOriginais[chave];

  // Fallback: última aba importada
  return sheetsOriginais[chaves[chaves.length - 1]];
}

function pegarCampoFinal(item, nomes) {
  for (const nome of nomes) {
    if (item && Object.prototype.hasOwnProperty.call(item, nome)) {
      return item[nome];
    }
  }

  const mapa = {};
  Object.keys(item || {}).forEach(k => {
    mapa[normalizarTextoSemAcentoFinal(k)] = item[k];
  });

  for (const nome of nomes) {
    const n = normalizarTextoSemAcentoFinal(nome);
    if (Object.prototype.hasOwnProperty.call(mapa, n)) {
      return mapa[n];
    }
  }

  return "";
}

function obterMesLinhaDiasFinal(item) {
  return pegarCampoFinal(item, [
    "mes",
    "mês",
    "Mes",
    "Mês",
    "data",
    "Data",
    "referencia",
    "referência",
    "competencia",
    "competência"
  ]);
}

function obterDiasLinhaDiasFinal(item) {
  return numero(pegarCampoFinal(item, [
    "dias_operacao",
    "dias_operação",
    "Dias_Operação",
    "Dias Operação",
    "Dias_Operacao",
    "Dias Operacao",
    "dias",
    "Dias",
    "total_dias_mes",
    "total_dias"
  ]));
}

function mesNomeParaNumeroFinal(texto) {
  const t = String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const mapa = {
    janeiro: "01",
    fevereiro: "02",
    marco: "03",
    mar: "03",
    abril: "04",
    abr: "04",
    maio: "05",
    mai: "05",
    junho: "06",
    jun: "06",
    julho: "07",
    jul: "07",
    agosto: "08",
    ago: "08",
    setembro: "09",
    set: "09",
    outubro: "10",
    out: "10",
    novembro: "11",
    nov: "11",
    dezembro: "12",
    dez: "12"
  };

  return mapa[t] || "";
}

function valorMesCorrespondeFinal(valorMes, ano, mes) {
  const alvoAno = String(ano || "");
  const alvoMes = String(mes || "").padStart(2, "0");
  const bruto = String(valorMes || "").trim();

  if (!bruto || !alvoAno || !alvoMes) return false;

  // Serial Excel
  if (/^\d+(\.\d+)?$/.test(bruto)) {
    const serial = Number(bruto);
    if (serial > 20000 && serial < 80000 && window.XLSX?.SSF?.parse_date_code) {
      const data = XLSX.SSF.parse_date_code(serial);
      if (data) {
        return String(data.y) === alvoAno && String(data.m).padStart(2, "0") === alvoMes;
      }
    }
  }

  // ISO yyyy-mm-dd
  if (/^\d{4}-\d{1,2}/.test(bruto)) {
    const partes = bruto.split("-");
    return partes[0] === alvoAno && String(partes[1]).padStart(2, "0") === alvoMes;
  }

  // BR dd/mm/yyyy ou mm/yyyy ou abril/2026
  if (bruto.includes("/")) {
    const partes = bruto.split("/").map(p => p.trim());

    if (partes.length === 3) {
      return partes[1].padStart(2, "0") === alvoMes && partes[2] === alvoAno;
    }

    if (partes.length === 2) {
      const mesParte = /^\d+$/.test(partes[0])
        ? partes[0].padStart(2, "0")
        : mesNomeParaNumeroFinal(partes[0]);

      return mesParte === alvoMes && partes[1] === alvoAno;
    }
  }

  // Abril 2026 / Abril-2026
  const limpo = bruto.replace(/[-_]/g, " ");
  const pedacos = limpo.split(/\s+/).filter(Boolean);

  if (pedacos.length >= 2) {
    const mesTxt = mesNomeParaNumeroFinal(pedacos[0]);
    const anoTxt = pedacos.find(p => /^\d{4}$/.test(p));
    return mesTxt === alvoMes && anoTxt === alvoAno;
  }

  return false;
}

function obterTotalDiasMesOficial(ano, mes, fallback = 0) {
  if (!(Number(ano) >= 1900 && Number(mes) >= 1 && Number(mes) <= 12)) return numero(fallback);
  const oficial=window.CCOPainelService?.obterDiasOperacao?.(ano,mes,window.__CCO_IMPORTACAO_ATIVA__?.importacao_id);
  return numero(oficial||fallback);
}

function obterReferenciaAnoMesFinal(dados) {
  const item = (dados || []).find(x => x.data_normalizada);
  if (item) {
    return {
      ano: item.data_normalizada.substring(0, 4),
      mes: item.data_normalizada.substring(5, 7)
    };
  }

  const hoje = new Date();
  return {
    ano: String(hoje.getFullYear()),
    mes: String(hoje.getMonth() + 1).padStart(2, "0")
  };
}

/*
  % execução livre, sem travar em 100%.
*/

/* função duplicada removida: calcularPercentual */


/*
  Painel Executivo corrigido.
*/

/* função duplicada removida: gerarPainelExecutivo */



/* função duplicada removida: recalcularPainelPorFiltro */



/* função duplicada removida: gerarPainelExecucaoMensal */




/*
========================================================
PATCH DEFINITIVO • VALOR POR EQUIPE FIXA CONTRATUAL
========================================================
Correção do problema:
Antes P3/P7/P8/P9/P10 eram tratados como SERVICOS_FIXOS,
então o painel mostrava somente o valor unitário.

Agora:
P3  = 12 x 41.992,93
P7  = 2  x 49.811,72
P8  = 2  x 81.001,04
P9  = 11 x 122.039,23
P10 = 3  x 346.660,01 = 1.039.980,03
P11 = 1  x 272.459,08

P12 = soma Executado x 0,83
========================================================
*/

const EQUIPES_FIXAS_VALOR_CONTRATUAL_FINAL = window.CCO_EQUIPES_FIXAS;

function ehServicoEquipeFixaFinal(servico) {
  return Object.prototype.hasOwnProperty.call(EQUIPES_FIXAS_VALOR_CONTRATUAL_FINAL, servico);
}

function calcularValorFinalServico(servico, acumulado) {
  const valorUnitario = VALORES_FIXOS[servico] || 0;

  if (String(window.CCO_PAGE || "").toLowerCase() === "painel" && ehServicoEquipeFixaFinal(servico)) {
    return EQUIPES_FIXAS_VALOR_CONTRATUAL_FINAL[servico] * valorUnitario;
  }

  return numero(acumulado) * valorUnitario;
}

function calcularAcumuladoPorServico(servico, dados, previstoMes = 0) {
  let realizado = 0;

  if (servico === "P12") {
    return dados.reduce(
      (soma, item) => soma + numero(item.executado || 0),
      0
    );
  }

  if (["P1", "P4"].includes(servico)) {
    return dados.reduce(
      (soma, item) => soma + numero(item.peso_t || item.pesot || item.peso || 0),
      0
    );
  }

  if (["P2.1", "P2.2"].includes(servico)) {
    return dados.reduce((soma, item) => soma + numero(item.viagens), 0);
  }

  if (["P5", "P6"].includes(servico)) {
    return dados.reduce((soma, item) => soma + numero(item.km), 0);
  }

  if (ehServicoEquipeFixaFinal(servico)) {
    realizado = dados.reduce((soma, item) => soma + numero(item.equipe), 0);
    return limitarPeloPrevisto(realizado, previstoMes);
  }

  return dados.reduce(
    (soma, item) => soma + numero(item.peso || item.km || item.viagens || item.equipe || 0),
    0
  );
}

function calcularValorPainelFinal(servico, acumulado) {
  return calcularValorFinalServico(servico, acumulado);
}

/*
  Reescreve Painel Executivo para garantir que o valor não use lógica antiga.
*/

/* função duplicada removida: gerarPainelExecutivo */


/*
  Filtro mensal do Painel Geral com valor corrigido.
*/

/* função duplicada removida: recalcularPainelPorFiltro */


/*
  Execução P1 a P12 com valor corrigido.
*/

/* função duplicada removida: gerarPainelExecucaoMensal */


/*
  Diagnóstico rápido:
  No F12 digite: testarValorP10()
*/
function testarValorP10() {
  const valor = calcularValorFinalServico("P10", 3);
  console.log("P10 esperado: 1.039.980,03 | calculado:", formatarMoeda(valor), valor);
  return valor;
}



/*
========================================================
PATCH DEFINITIVO • TOTAL DIAS MÊS DA ABA DIAS_OPERAÇÃO
========================================================
Regra confirmada pela planilha:
- A aba correta é: Dias_Operação
- Colunas:
  Mês
  Dias_Operação

Exemplo:
Mês = 01/04/2026
Dias_Operação = 25

O sistema agora:
1. Procura a aba Dias_Operação.
2. Lê a coluna Mês.
3. Compara mês/ano com o filtro selecionado.
4. Retorna a coluna Dias_Operação.
========================================================
*/

function normalizarChaveDiasOperacao(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function encontrarAbaDiasOperacao() {
  const chaves = Object.keys(sheetsOriginais || {});

  if (!chaves.length) return null;

  // Busca exata: Dias_Operação normaliza para dias_operacao
  let chave = chaves.find(k => normalizarChaveDiasOperacao(k) === "dias_operacao");

  if (chave) return sheetsOriginais[chave];

  // Busca pelo nome original da aba
  chave = chaves.find(k => {
    const aba = sheetsOriginais[k];
    return normalizarChaveDiasOperacao(aba?.nomeOriginal || "") === "dias_operacao";
  });

  if (chave) return sheetsOriginais[chave];

  // Fallback: qualquer aba que contenha dias e operacao
  chave = chaves.find(k => {
    const aba = sheetsOriginais[k];
    const nome = normalizarChaveDiasOperacao(`${k} ${aba?.nomeOriginal || ""}`);
    return nome.includes("dias") && nome.includes("operacao");
  });

  if (chave) return sheetsOriginais[chave];

  return null;
}

function pegarCampoNormalizado(item, nomesPossiveis) {
  if (!item) return "";

  for (const nome of nomesPossiveis) {
    if (Object.prototype.hasOwnProperty.call(item, nome)) {
      return item[nome];
    }
  }

  const mapa = {};
  Object.keys(item).forEach(k => {
    mapa[normalizarChaveDiasOperacao(k)] = item[k];
  });

  for (const nome of nomesPossiveis) {
    const chave = normalizarChaveDiasOperacao(nome);
    if (Object.prototype.hasOwnProperty.call(mapa, chave)) {
      return mapa[chave];
    }
  }

  return "";
}

function converterValorMesParaAnoMes(valor) {
  if (valor instanceof Date && !isNaN(valor)) {
    return {
      ano: String(valor.getFullYear()),
      mes: String(valor.getMonth() + 1).padStart(2, "0")
    };
  }

  const bruto = String(valor || "").trim();

  if (!bruto) return null;

  // Serial Excel, exemplo 45748
  if (/^\d+(\.\d+)?$/.test(bruto)) {
    const serial = Number(bruto);

    if (serial > 20000 && serial < 90000 && window.XLSX?.SSF?.parse_date_code) {
      const data = XLSX.SSF.parse_date_code(serial);
      if (data) {
        return {
          ano: String(data.y),
          mes: String(data.m).padStart(2, "0")
        };
      }
    }
  }

  // ISO: 2026-04-01
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(bruto)) {
    const partes = bruto.split("-");
    return {
      ano: partes[0],
      mes: String(partes[1]).padStart(2, "0")
    };
  }

  // BR: 01/04/2026 ou 04/2026
  if (bruto.includes("/")) {
    const partes = bruto.split("/").map(p => p.trim());

    if (partes.length === 3) {
      return {
        ano: partes[2],
        mes: partes[1].padStart(2, "0")
      };
    }

    if (partes.length === 2) {
      return {
        ano: partes[1],
        mes: partes[0].padStart(2, "0")
      };
    }
  }

  return null;
}

function obterTotalDiasMesTabelaOficial(ano, mes, fallback = 0) {
  if (!(Number(ano) >= 1900 && Number(mes) >= 1 && Number(mes) <= 12)) return numero(fallback);
  const oficial=window.CCOPainelService?.obterDiasOperacao?.(ano,mes,window.__CCO_IMPORTACAO_ATIVA__?.importacao_id);
  return numero(oficial||fallback);
}

function obterAnoMesReferenciaParaDiasOperacao(dados) {
  const item = (dados || []).find(x => x.data_normalizada);

  if (item) {
    return {
      ano: item.data_normalizada.substring(0, 4),
      mes: item.data_normalizada.substring(5, 7)
    };
  }

  const hoje = new Date();

  return {
    ano: String(hoje.getFullYear()),
    mes: String(hoje.getMonth() + 1).padStart(2, "0")
  };
}

/*
  Percentual livre, sem limite de 100%.
*/
function calcularPercentual(acumulado, previsto) {
  const a = numero(acumulado);
  const p = numero(previsto);

  if (!p) return 0;

  return (a / p) * 100;
}

/*
  Painel Executivo com Total dias mês da aba Dias_Operação.
*/
function gerarPainelExecutivo() {
  const painel = sheetsOriginais["painel executivo"];

  if (!painel) {
    painelExecutivo = [];
    return;
  }

  const ref = obterAnoMesReferenciaParaDiasOperacao(operacoes);

  painelExecutivo =
    painel.dadosNormalizados.map(item => {
      const servico =
        String(item.servico || item.programa || item.codigo || "").toUpperCase();

      const previsto =
        numero(
          item.previsto_mes ||
          item.previsto_no_mes ||
          item.previsto ||
          item.meta_mes ||
          item.meta ||
          item.programado ||
          item.total_previsto ||
          0
        );

      const acumuladoPlanilha =
        numero(
          item.acumulado_mes ||
          item.acumulado_no_mes ||
          item.acumulado ||
          item.executado ||
          0
        );

      const dadosServico =
        operacoes.filter(op => op.servico === servico);

      let acumuladoFinal =
        dadosServico.length
          ? calcularAcumuladoPorServico(servico, dadosServico, previsto)
          : acumuladoPlanilha;

      if (typeof ehServicoEquipeFixaFinal === "function" && ehServicoEquipeFixaFinal(servico)) {
        acumuladoFinal = limitarPeloPrevisto(acumuladoFinal, previsto);
      }

      const diasAcumulados =
        extrairDiaCorreto(
          item.dias_acumulado ||
          item.dias_acumulados ||
          item.dia_acumulado ||
          item.dias ||
          0
        );

      const fallbackDias =
        extrairDiaCorreto(
          item.total_de_dias_no_mes ||
          item.total_dias_mes ||
          item.total_de_dias_mes ||
          item.total_dias_no_mes ||
          item.dias_no_mes ||
          item.dias_mes ||
          item.total_dias ||
          0
        );

      const totalDiasMes =
        obterTotalDiasMesTabelaOficial(ref.ano, ref.mes, fallbackDias);

      const valorFinal =
        typeof calcularValorFinalServico === "function"
          ? calcularValorFinalServico(servico, acumuladoFinal)
          : (VALORES_FIXOS[servico] || 0) * acumuladoFinal;

      return {
        servico,
        nome_servico: item.nome_servico || item.nome_do_servico || item.descricao || "",
        acumulado_mes: acumuladoFinal,
        medicao: item.medicao || "",
        previsto_mes: previsto,
        porcentagem_execucao: calcularPercentual(acumuladoFinal, previsto),
        dias_acumulados: diasAcumulados,
        total_dias_mes: totalDiasMes,
        valor: valorFinal,
        status: acumuladoFinal > 0 ? "Com dados" : "Sem dados"
      };
    });
}

/*
  Filtro Painel Geral.
*/
function recalcularPainelPorFiltro(dadosFiltro, ano, mes) {
  const totalDiasMes = obterTotalDiasMesTabelaOficial(ano, mes, 0);

  painelExecutivo =
    painelExecutivoOriginal.map(item => {
      const dadosServico =
        dadosFiltro.filter(op => op.servico === item.servico);

      let acumulado =
        dadosServico.length
          ? calcularAcumuladoPorServico(item.servico, dadosServico, item.previsto_mes)
          : 0;

      if (typeof ehServicoEquipeFixaFinal === "function" && ehServicoEquipeFixaFinal(item.servico)) {
        acumulado = limitarPeloPrevisto(acumulado, item.previsto_mes);
      }

      const valorFinal =
        typeof calcularValorFinalServico === "function"
          ? calcularValorFinalServico(item.servico, acumulado)
          : (VALORES_FIXOS[item.servico] || 0) * acumulado;

      return {
        ...item,
        acumulado_mes: acumulado,
        porcentagem_execucao: calcularPercentual(acumulado, item.previsto_mes),
        dias_acumulados: contarDiasDistintos(dadosServico) || item.dias_acumulados,
        total_dias_mes: totalDiasMes || item.total_dias_mes,
        valor: valorFinal,
        status: acumulado > 0 ? "Com dados" : "Sem dados"
      };
    });
}

/*
  Execução P1 a P12.
*/
function gerarPainelExecucaoMensal() {
  const periodo = obterDadosExecucaoMensal();

  const ref =
    periodo.ano && periodo.mes
      ? { ano: periodo.ano, mes: periodo.mes }
      : obterAnoMesReferenciaParaDiasOperacao(periodo.dados);

  const totalDiasMes =
    obterTotalDiasMesTabelaOficial(ref.ano, ref.mes, 0);

  const painel =
    painelExecutivoOriginal.map(item => {
      const dadosServico =
        periodo.dados.filter(op => op.servico === item.servico);

      let acumulado =
        dadosServico.length
          ? calcularAcumuladoPorServico(item.servico, dadosServico, item.previsto_mes)
          : 0;

      if (typeof ehServicoEquipeFixaFinal === "function" && ehServicoEquipeFixaFinal(item.servico)) {
        acumulado = limitarPeloPrevisto(acumulado, item.previsto_mes);
      }

      const valorFinal =
        typeof calcularValorFinalServico === "function"
          ? calcularValorFinalServico(item.servico, acumulado)
          : (VALORES_FIXOS[item.servico] || 0) * acumulado;

      return {
        ...item,
        acumulado_mes: acumulado,
        porcentagem_execucao: calcularPercentual(acumulado, item.previsto_mes),
        dias_acumulados: contarDiasDistintos(dadosServico) || item.dias_acumulados,
        total_dias_mes: totalDiasMes || item.total_dias_mes,
        valor: valorFinal,
        status: acumulado > 0 ? "Com dados" : "Sem dados"
      };
    });

  return {
    painel,
    periodo
  };
}

/*
  Teste rápido no F12:
  testarDiasOperacao("2026", "04")
*/
function testarDiasOperacao(ano = "2026", mes = "04") {
  const dias = obterTotalDiasMesTabelaOficial(ano, mes, 0);
  console.log(`Dias_Operação ${mes}/${ano}:`, dias);
  return dias;
}



/*
========================================================
PATCH • ABRIR SISTEMA NO PRIMEIRO MÊS DA BASE
========================================================
- Ao carregar/importar a planilha, o Painel Geral não soma todos os meses.
- O sistema identifica a menor data operacional importada.
- Aplica automaticamente o primeiro mês/ano encontrado.
- Exemplo: primeira data 01/11/2025 => abre em Novembro/2025.
========================================================
*/

function obterPrimeiroPeriodoDaBase() {
  const origem = (operacoesOriginal && operacoesOriginal.length) ? operacoesOriginal : operacoes;

  const datas = (origem || [])
    .map(item => item.data_normalizada)
    .filter(Boolean)
    .sort();

  if (!datas.length) return null;

  return {
    ano: datas[0].substring(0, 4),
    mes: datas[0].substring(5, 7)
  };
}


/* função duplicada removida: aplicarPeriodoInicialPrimeiroMes */


const atualizarDashboardOriginalPrimeiroMes = atualizarDashboard;

atualizarDashboard = function() {
  atualizarDashboardOriginalPrimeiroMes();

  const filtroAno = document.getElementById("filtroAno")?.value || "";
  const filtroMes = document.getElementById("filtroMes")?.value || "";

  if (!filtroAno && !filtroMes && (operacoesOriginal || []).length) {
    aplicarPeriodoInicialPrimeiroMes();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const filtroAno = document.getElementById("filtroAno")?.value || "";
    const filtroMes = document.getElementById("filtroMes")?.value || "";

    if (!filtroAno && !filtroMes && (operacoesOriginal || []).length) {
      aplicarPeriodoInicialPrimeiroMes();
    }
  }, 1500);
});



/*
========================================================
PATCH DEFINITIVO • CELULAR, TODAS AS ABAS E SEM DUPLICAR
========================================================

Correções:
1. Supabase carregado também no GitHub Pages/celular.
2. Base completa salva em lotes de 300 linhas por aba.
3. Ao abrir no celular, o sistema junta novamente todas as partes.
4. Importação nova substitui a base ativa anterior.
5. Evita duplicação de registros operacionais.
6. Não usa resumo local parcial quando existir Supabase.
7. O input de importação recebe evento apenas uma vez.
========================================================
*/

const TAMANHO_LOTE_SUPABASE_CELULAR = 300;

function garantirSupabaseClienteFinal() {
  try {
    if (window.supabaseClient) banco = window.supabaseClient;
    return Boolean(window.supabaseClient);
  } catch (erro) {
    console.error("Erro ao iniciar Supabase:", erro);
    return false;
  }
}

function dividirEmLotesSupabase(lista, tamanho = TAMANHO_LOTE_SUPABASE_CELULAR) {
  const lotes = [];
  const dados = Array.isArray(lista) ? lista : [];

  for (let i = 0; i < dados.length; i += tamanho) {
    lotes.push(dados.slice(i, i + tamanho));
  }

  return lotes.length ? lotes : [[]];
}

function assinaturaOperacao(item) {
  return [
    item.servico || "",
    item.origem || "",
    item.data_normalizada || "",
    item.turno || "",
    item.ra || "",
    item.setor || "",
    numero(item.peso),
    numero(item.viagens),
    numero(item.km),
    numero(item.equipe),
    numero(item.executado)
  ].join("|");
}

function removerDuplicidadeOperacoes() {
  const vistos = new Set();

  operacoes = (operacoes || []).filter(item => {
    const chave = assinaturaOperacao(item);

    if (vistos.has(chave)) {
      return false;
    }

    vistos.add(chave);
    return true;
  });

  operacoesOriginal = clonar(operacoes);
}

/*
  Impede eventos duplicados no input de importação.
*/
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("arquivoExcel");

  if (input && input.dataset.listenerFinal !== "sim") {
    input.removeEventListener("change", importarPlanilhas);
    input.addEventListener("change", importarPlanilhas);
    input.dataset.listenerFinal = "sim";
  }
});

/*
  Salvar base completa em lotes.
  Antes de criar uma nova importação ativa, desativa todas as anteriores.
  Assim não duplica visualmente.
*/
async function salvarBaseCompletaSupabase(nomeArquivo) {
  if (!garantirSupabaseClienteFinal()) {
    console.warn("Supabase indisponível. A base ficará apenas local neste navegador.");
    return false;
  }

  let importacao = null;

  try {
    const usuario = obterUsuarioLogado();

    // Desativa qualquer base ativa anterior
    const { error: erroDesativar } =
      await banco
        .from("importacoes")
        .update({ ativo: false })
        .eq("ativo", true);

    if (erroDesativar) {
      console.error("Erro ao desativar importações anteriores:", erroDesativar);
      return false;
    }

    const { data, error: erroImportacao } =
      await banco
        .from("importacoes")
        .insert({
          nome_arquivo: nomeArquivo,
          usuario: usuario.usuario || "Não identificado",
          perfil: usuario.perfil || "Sem perfil",
          total_abas: todasAsAbas.length,
          ativo: true
        })
        .select()
        .single();

    if (erroImportacao) {
      console.error("Erro ao criar importação:", erroImportacao);
      return false;
    }

    importacao = data;

    for (const nomeAba of Object.keys(sheetsOriginais || {})) {
      const aba = sheetsOriginais[nomeAba];
      const linhas = aba.dadosOriginais || [];
      const lotes = dividirEmLotesSupabase(linhas, 50);

      for (let parte = 0; parte < lotes.length; parte++) {
        const { error: erroInsert } =
          await banco
            .from("planilhas_importadas")
            .insert({
              nome_arquivo: nomeArquivo,
              aba: aba.nomeOriginal,
              codigo_servico: aba.codigoServico || "GERAL",
              dados: sanitizarParaSupabase(lotes[parte]),
              importacao_id: importacao.id
            });

        if (erroInsert) {
          console.error(`Erro ao salvar aba ${aba.nomeOriginal}, parte ${parte + 1}:`, erroInsert);

          // Evita deixar base ativa incompleta
          await banco.from("importacoes").delete().eq("id", importacao.id);
          return false;
        }
      }
    }

    return true;

  } catch (erro) {
    console.error("Erro geral ao salvar base completa no Supabase:", erro);

    if (importacao?.id && banco) {
      try {
        await banco.from("importacoes").delete().eq("id", importacao.id);
      } catch {}
    }

    return false;
  }
}

/*
  Carrega base ativa juntando todas as partes da mesma aba.
*/
async function carregarBaseSupabase() {
  if (!garantirSupabaseClienteFinal()) {
    console.warn("Supabase não carregado.");
    return false;
  }

  try {
    preencherTexto("nomeArquivo", "🔄 Carregando dados da base...");

    const { data, error } =
      await banco
        .from("planilhas_importadas")
        .select(`
          *,
          importacoes!inner(
            id,
            ativo,
            nome_arquivo,
            usuario,
            perfil,
            total_abas,
            criado_em
          )
        `)
        .eq("importacoes.ativo", true)
        .order("id", { ascending: false });

    if (error || !data || !data.length) {
      if (error) console.error("Erro ao carregar Supabase:", error);
      return false;
    }

    limparMemoria();

    const mapaAbas = {};

    data.forEach(item => {
      const nomeNormalizado = normalizar(item.aba);

      if (!mapaAbas[nomeNormalizado]) {
        mapaAbas[nomeNormalizado] = {
          arquivo: item.nome_arquivo,
          nomeOriginal: item.aba,
          codigoServico: item.codigo_servico,
          dadosOriginais: []
        };
      }

      if (Array.isArray(item.dados)) {
        mapaAbas[nomeNormalizado].dadosOriginais.push(...item.dados);
      }
    });

    Object.keys(mapaAbas).forEach(nome => {
      const aba = mapaAbas[nome];

      sheetsOriginais[nome] = {
        nomeOriginal: aba.nomeOriginal,
        codigoServico: aba.codigoServico,
        dadosOriginais: aba.dadosOriginais,
        dadosNormalizados: aba.dadosOriginais.map(linha => normalizarObjeto(linha))
      };

      todasAsAbas.push({
        arquivo: aba.arquivo,
        aba: aba.nomeOriginal,
        linhas: aba.dadosOriginais.length
      });
    });

    if (!sheetsOriginais["painel executivo"]) {
      console.error("Aba Painel Executivo não encontrada na base do Supabase.", Object.keys(sheetsOriginais));
      return false;
    }

    gerarOperacoes();
    removerDuplicidadeOperacoes();
    gerarPainelExecutivo();

    painelExecutivoOriginal = clonar(painelExecutivo);
    operacoesOriginal = clonar(operacoes);

    const nomeArquivo = data[0]?.nome_arquivo || "Base Supabase";
    const resumo = montarResumoLeve(nomeArquivo);

    // Mantém apenas resumo leve para abrir rápido, mas a fonte oficial é Supabase.
    salvarResumoLocal(resumo);

    atualizarDashboard();
    aplicarRestricoesPerfil();

    if (typeof aplicarPeriodoInicialPrimeiroMes === "function") {
      aplicarPeriodoInicialPrimeiroMes();
    }

    preencherTexto(
      "nomeArquivo",
      `${todasAsAbas.length} aba(s) carregada(s) do Supabase | ${operacoes.length} registros operacionais`
    );

    console.log("Abas carregadas:", todasAsAbas);
    return true;

  } catch (erro) {
    console.error("Erro geral ao carregar base do Supabase:", erro);
    return false;
  }
}

/*
  Não mostrar resumo parcial como se fosse a base completa.
*/

/* função duplicada removida: carregarResumoLocal */


/*
  Reforço depois da importação:
  se importar a mesma planilha de novo, a tela não duplica registros.
*/
const importarPlanilhasOriginalCelular = importarPlanilhas;

importarPlanilhas = async function(evento) {
  await importarPlanilhasOriginalCelular(evento);

  if ((operacoes || []).length) {
    removerDuplicidadeOperacoes();
    gerarPainelExecutivo();
    painelExecutivoOriginal = clonar(painelExecutivo);
    operacoesOriginal = clonar(operacoes);
    atualizarDashboard();

    if (typeof aplicarPeriodoInicialPrimeiroMes === "function") {
      aplicarPeriodoInicialPrimeiroMes();
    }
  }
};

/*
  Diagnóstico no F12:
*/



/*
========================================================
PATCH • CELULAR + BANCO + ÚLTIMO MÊS DA BASE
========================================================
- Celular e computador carregam do Supabase/banco.
- Ao abrir, usa o último período salvo pelo usuário.
- Se não existir período salvo, usa o último mês encontrado na base.
- Aplica o mesmo mês no Painel Geral, KPI, Execução e Comparativo.
========================================================
*/

const STORAGE_PERIODO_ATIVO_CCO = "cco_periodo_ativo_v1";

function periodoMesSeguroCCO(mes) {
  return String(mes || "").padStart(2, "0");
}

function obterUltimoPeriodoDaBaseCCO() {
  const origem = (operacoesOriginal && operacoesOriginal.length) ? operacoesOriginal : operacoes;

  const datas = (origem || [])
    .map(item => item.data_normalizada)
    .filter(Boolean)
    .sort();

  if (!datas.length) return null;

  const ultima = datas[datas.length - 1];

  return {
    ano: ultima.substring(0, 4),
    mes: ultima.substring(5, 7)
  };
}

function salvarPeriodoAtivoCCO(ano, mes) {
  if (!ano || !mes) return;

  localStorage.setItem(
    STORAGE_PERIODO_ATIVO_CCO,
    JSON.stringify({
      ano: String(ano),
      mes: periodoMesSeguroCCO(mes)
    })
  );
}

function obterPeriodoSalvoValidoCCO() {
  try {
    const bruto = localStorage.getItem(STORAGE_PERIODO_ATIVO_CCO);
    if (!bruto) return null;

    const periodo = JSON.parse(bruto);
    if (!periodo?.ano || !periodo?.mes) return null;

    const ano = String(periodo.ano);
    const mes = periodoMesSeguroCCO(periodo.mes);

    const existe = (operacoesOriginal || []).some(item =>
      item.data_normalizada &&
      item.data_normalizada.substring(0, 4) === ano &&
      item.data_normalizada.substring(5, 7) === mes
    );

    return existe ? { ano, mes } : null;

  } catch {
    return null;
  }
}

function obterPeriodoInicialCCO() {
  return obterPeriodoSalvoValidoCCO() || obterUltimoPeriodoDaBaseCCO();
}

function aplicarPeriodoGlobalCCO(ano, mes, salvar = true) {
  if (!ano || !mes) return false;

  const anoSeguro = String(ano);
  const mesSeguro = periodoMesSeguroCCO(mes);

  const campos = [
    ["filtroAno", anoSeguro],
    ["filtroMes", mesSeguro],
    ["filtroDia", ""],
    ["filtroExecucaoAno", anoSeguro],
    ["filtroExecucaoMes", mesSeguro],
    ["filtroKpiAno", anoSeguro],
    ["filtroKpiMes", mesSeguro],
    ["filtroComparativoAno", anoSeguro],
    ["filtroComparativoMes", mesSeguro]
  ];

  campos.forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el) el.value = valor;
  });

  operacoes = (operacoesOriginal || []).filter(item =>
    item.data_normalizada &&
    item.data_normalizada.substring(0, 4) === anoSeguro &&
    item.data_normalizada.substring(5, 7) === mesSeguro
  );

  if (typeof recalcularPainelPorFiltro === "function") {
    recalcularPainelPorFiltro(operacoes, anoSeguro, mesSeguro);
  }

  filtroExecucaoAnoAtual = anoSeguro;
  filtroExecucaoMesAtual = mesSeguro;

  if (salvar) salvarPeriodoAtivoCCO(anoSeguro, mesSeguro);

  renderCards();
  renderTabelaExecutiva();
  renderTabelaContratualMensal();
  renderResumo();
  renderResumoAutomaticoDiretoria();
  renderRankingOperacional();
  renderAlertas();
  renderTabelaDados();
  carregarFiltrosPeriodoDisponiveis();
  carregarFiltrosExecucaoMensal();
  renderGraficos();
  renderComparativoMensal();

  if (typeof renderRankingPorMedicao === "function") renderRankingPorMedicao();
  if (typeof renderKpiServico === "function") renderKpiServico();
  if (typeof renderKpi === "function") renderKpi();

  // Reaplica depois dos selects serem redesenhados.
  campos.forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el) el.value = valor;
  });

  preencherTexto(
    "nomeArquivo",
    `Base carregada em ${MESES_BR[mesSeguro] || mesSeguro}/${anoSeguro}`
  );

  aplicarRestricoesPerfil();
  return true;
}

function aplicarPeriodoInicialAoAbrirCCO() {
  const periodo = obterPeriodoInicialCCO();
  if (!periodo) return false;
  return aplicarPeriodoGlobalCCO(periodo.ano, periodo.mes, true);
}

// Substitui a regra antiga do primeiro mês.
function aplicarPeriodoInicialPrimeiroMes() {
  return aplicarPeriodoInicialAoAbrirCCO();
}

if (typeof aplicarFiltroPeriodoExecutivo === "function") {
  const original = aplicarFiltroPeriodoExecutivo;
  aplicarFiltroPeriodoExecutivo = function() {
    const ano = document.getElementById("filtroAno")?.value || "";
    const mes = document.getElementById("filtroMes")?.value || "";

    if (ano && mes) salvarPeriodoAtivoCCO(ano, mes);

    original();
  };
}

if (typeof aplicarFiltroMensal === "function") {
  const originalMensal = aplicarFiltroMensal;
  aplicarFiltroMensal = function() {
    const ano = document.getElementById("filtroAno")?.value || "";
    const mes = document.getElementById("filtroMes")?.value || "";

    if (ano && mes) salvarPeriodoAtivoCCO(ano, mes);

    originalMensal();
  };
}

if (typeof aplicarFiltroExecucaoMensal === "function") {
  const originalExecucao = aplicarFiltroExecucaoMensal;
  aplicarFiltroExecucaoMensal = function() {
    const ano = document.getElementById("filtroExecucaoAno")?.value || "";
    const mes = document.getElementById("filtroExecucaoMes")?.value || "";

    if (ano && mes) {
      aplicarPeriodoGlobalCCO(ano, mes, true);
      return;
    }

    originalExecucao();
  };
}

if (typeof carregarBaseSupabase === "function") {
  const carregarBaseSupabaseOriginalUltimoMes = carregarBaseSupabase;
  carregarBaseSupabase = async function() {
    const ok = await carregarBaseSupabaseOriginalUltimoMes();

    if (ok) {
      setTimeout(() => aplicarPeriodoInicialAoAbrirCCO(), 350);
    }

    return ok;
  };
}

if (typeof importarPlanilhas === "function") {
  const importarPlanilhasOriginalUltimoMes = importarPlanilhas;
  importarPlanilhas = async function(evento) {
    await importarPlanilhasOriginalUltimoMes(evento);

    const ultimo = obterUltimoPeriodoDaBaseCCO();
    if (ultimo) aplicarPeriodoGlobalCCO(ultimo.ano, ultimo.mes, true);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if ((operacoesOriginal || []).length) {
      aplicarPeriodoInicialAoAbrirCCO();
    }
  }, 1800);
});




/*
========================================================
PATCH • EXECUÇÃO P1 A P12 COM VELOCIDADE MÉDIA
========================================================
Solicitação aplicada:
- Nas abas P1 a P12, ler a coluna "Velocidade Média".
- Na página Execução P1 a P12, substituir indicadores operacionais
  por Velocidade Média.
- Média calculada pelo período filtrado:
  média = soma(Velocidade Média) / quantidade de registros válidos.
- Gráfico: Velocidade Média por dia.
========================================================
*/

function ccoNormalizarChaveVM(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function ccoPegarCampoVM(item, nomes) {
  if (!item) return "";

  for (const nome of nomes) {
    if (Object.prototype.hasOwnProperty.call(item, nome)) return item[nome];
  }

  const mapa = {};
  Object.keys(item).forEach(k => {
    mapa[ccoNormalizarChaveVM(k)] = item[k];
  });

  for (const nome of nomes) {
    const nk = ccoNormalizarChaveVM(nome);
    if (Object.prototype.hasOwnProperty.call(mapa, nk)) return mapa[nk];
  }

  return "";
}

function ccoNumeroCampoVM(item, nomes) {
  return numero(ccoPegarCampoVM(item, nomes));
}

function ccoVelocidadeMediaLinha(item) {
  return ccoNumeroCampoVM(item, [
    "Velocidade Média",
    "Velocidade Media",
    "velocidade_media",
    "velocidade_média",
    "Vel.Média Total",
    "Vel.Media Total",
    "vel_media_total",
    "VM km/h",
    "VM_KM_H",
    "VM_KMH",
    "vm_km_h",
    "vm_kmh",
    "VM"
  ]);
}

function ccoDataOperacaoLinhaVM(item) {
  return ccoPegarCampoVM(item, [
    "Data Análise",
    "Data Analise",
    "data_analise",
    "data_análise",
    "Data Operação",
    "Data_Operação",
    "data_operacao",
    "data_operação",
    "Início Operação",
    "Inicio Operacao",
    "inicio_operacao",
    "inicio_da_operacao",
    "Data",
    "data",
    "Dia",
    "dia",
    "DT",
    "dt"
  ]);
}

function ccoKmLinhaVM(item) {
  return ccoNumeroCampoVM(item, [
    "Km Executado",
    "KM Executado",
    "km_executado",
    "Km_Total",
    "KM Total",
    "KM_Total",
    "km_total",
    "kmtotal",
    "km",
    "Quilometragem",
    "quilometragem"
  ]);
}

function ccoPesoLinhaVM(item) {
  return ccoNumeroCampoVM(item, [
    "Peso_T",
    "Peso T",
    "peso_t",
    "pesot",
    "Peso Total",
    "peso_total",
    "Peso",
    "peso",
    "Tonelada",
    "tonelada",
    "Toneladas",
    "toneladas"
  ]);
}

function ccoMediaVelocidade(dados) {
  const validos = (dados || [])
    .map(item => numero(item.velocidade_media))
    .filter(v => v > 0);

  if (!validos.length) return 0;

  return validos.reduce((s, v) => s + v, 0) / validos.length;
}

function ccoVelocidadePorDia(dados) {
  const mapa = {};

  (dados || []).forEach(item => {
    if (!item.data_normalizada) return;

    const vm = numero(item.velocidade_media);
    if (!vm) return;

    if (!mapa[item.data_normalizada]) {
      mapa[item.data_normalizada] = {
        data: item.data_normalizada,
        soma: 0,
        qtd: 0
      };
    }

    mapa[item.data_normalizada].soma += vm;
    mapa[item.data_normalizada].qtd += 1;
  });

  return Object.values(mapa)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(item => ({
      data: item.data,
      media: item.qtd ? item.soma / item.qtd : 0
    }));
}

/*
  Releitura das abas P1 a P12 incluindo Velocidade Média.
*/

/* função duplicada removida: gerarOperacoes */


/*
  Substitui o detalhe do serviço na página Execução P1 a P12.
*/

/* função duplicada removida: renderDetalheServicoMensal */


/*
  Novo gráfico do detalhe: Velocidade Média por Dia.
*/

/* função duplicada removida: renderGraficoServicoDetalheVelocidadeMedia */


/*
  Reprocessa base já carregada para preencher velocidade_media
  quando vier do Supabase ou do resumo.
*/
function ccoReprocessarVelocidadeMediaExecucao() {
  if (!sheetsOriginais || !Object.keys(sheetsOriginais).length) return;

  gerarOperacoes();
  operacoesOriginal = clonar(operacoes);

  gerarPainelExecutivo();
  painelExecutivoOriginal = clonar(painelExecutivo);

  atualizarDashboard();

  const detalhe = document.getElementById("servico-detalhe");
  if (detalhe && detalhe.classList.contains("ativa")) {
    const codigo = obterServicoAtivo();
    if (codigo) renderDetalheServicoMensal(codigo);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    ccoReprocessarVelocidadeMediaExecucao();
  }, 1800);
});




/*
========================================================
PATCH • EXECUÇÃO P1 A P12: EXECUÇÃO POR TURNO
========================================================
Solicitação:
- Colocar gráfico de Execução por Turno na página Execução P1 a P12.
- Tirar a tabela "Dados importados" do detalhe do serviço.
========================================================
*/

let graficoExecucaoPorTurnoServico = null;

function ccoValorExecutadoServicoTurno(servico, item) {
  if (servico === "P12") return numero(item.executado);
  if (["P1", "P4"].includes(servico)) return numero(item.peso);
  if (["P2.1", "P2.2"].includes(servico)) return numero(item.viagens);
  if (["P5", "P6"].includes(servico)) return numero(item.km);
  if (["P3", "P7", "P8", "P9", "P10", "P11"].includes(servico)) return numero(item.equipe);
  return numero(item.peso || item.km || item.viagens || item.equipe || item.executado || 0);
}

function ccoAgruparExecucaoPorTurno(servico, dados) {
  const mapa = {};

  (dados || []).forEach(item => {
    const turno = String(item.turno || "Sem turno").trim() || "Sem turno";

    if (!mapa[turno]) {
      mapa[turno] = {
        turno,
        executado: 0,
        registros: 0
      };
    }

    mapa[turno].executado += ccoValorExecutadoServicoTurno(servico, item);
    mapa[turno].registros += 1;
  });

  return Object.values(mapa)
    .sort((a, b) => b.executado - a.executado);
}

function ccoMediaVelocidadeExecucaoFinal(dados) {
  const valores = (dados || [])
    .map(i => numero(i.velocidade_media))
    .filter(v => v > 0);

  if (!valores.length) return 0;

  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

function ccoVelocidadePorDiaExecucaoFinal(dados) {
  const mapa = {};

  (dados || []).forEach(item => {
    if (!item.data_normalizada) return;

    const vm = numero(item.velocidade_media);
    if (!vm) return;

    if (!mapa[item.data_normalizada]) {
      mapa[item.data_normalizada] = {
        data: item.data_normalizada,
        soma: 0,
        qtd: 0
      };
    }

    mapa[item.data_normalizada].soma += vm;
    mapa[item.data_normalizada].qtd += 1;
  });

  return Object.values(mapa)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(i => ({
      data: i.data,
      media: i.qtd ? i.soma / i.qtd : 0
    }));
}


/* função duplicada removida: renderGraficoServicoDetalheVelocidadeMedia */



/* função duplicada removida: renderGraficoExecucaoPorTurnoServico */


/*
  Detalhe do serviço sem tabela de Dados Importados.
*/

/* função duplicada removida: renderDetalheServicoMensal */





/*
========================================================
PATCH • EXECUÇÃO P1 A P12: VIAGENS POR TURNO
========================================================
- Adiciona gráfico "Viagens por Turno" no detalhe do serviço.
- Mantém "Velocidade Média por Dia".
- Mantém "Execução por Turno".
- Não volta a tabela "Dados importados".
========================================================
*/

let graficoViagensPorTurnoServico = null;

function ccoAgruparViagensPorTurno(dados) {
  const mapa = {};

  (dados || []).forEach(item => {
    const turno = String(item.turno || "Sem turno").trim() || "Sem turno";

    if (!mapa[turno]) {
      mapa[turno] = {
        turno,
        viagens: 0,
        registros: 0
      };
    }

    mapa[turno].viagens += numero(item.viagens);
    mapa[turno].registros += 1;
  });

  return Object.values(mapa)
    .sort((a, b) => b.viagens - a.viagens);
}


/* função duplicada removida: renderGraficoViagensPorTurnoServico */


/*
  Reescreve o detalhe do serviço para incluir Viagens por Turno.
*/

/* função duplicada removida: renderDetalheServicoMensal */





/*
========================================================
PATCH • EXECUÇÃO P1 A P12
HORAS PRODUTIVAS + DISTÂNCIA MÉDIA
========================================================
Incluído:
- Gráfico pizza/rosca: Horas Produtivas por Turno.
- Gráfico barra: Distância Média por Turno.
- Card: Distância Média.
- Sem tabela "Dados importados".
========================================================
*/

let graficoHorasProdutivasServico = null;
let graficoDistanciaMediaServico = null;

function ccoConverterTempoParaHoras(valor) {
  if (typeof valor === "number") {
    return valor > 0 && valor < 1 ? valor * 24 : valor;
  }

  const texto = String(valor || "").trim();

  if (!texto) return 0;

  if (/^\d{1,3}:\d{2}(:\d{2})?$/.test(texto)) {
    const partes = texto.split(":").map(Number);
    return (partes[0] || 0) + ((partes[1] || 0) / 60) + ((partes[2] || 0) / 3600);
  }

  return numero(texto);
}

function ccoPegarCampoGenericoExec(item, nomes) {
  if (!item) return "";

  for (const nome of nomes) {
    if (Object.prototype.hasOwnProperty.call(item, nome)) return item[nome];
  }

  const mapa = {};
  Object.keys(item).forEach(k => {
    const nk = String(k || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    mapa[nk] = item[k];
  });

  for (const nome of nomes) {
    const nk = String(nome || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (Object.prototype.hasOwnProperty.call(mapa, nk)) return mapa[nk];
  }

  return "";
}


/* função duplicada removida: ccoTempoProdutivoLinha */



/* função duplicada removida: ccoKmTotalLinha */


function ccoAgruparHorasProdutivasPorTurno(dados) {
  const mapa = {};

  (dados || []).forEach(item => {
    const turno = String(item.turno || "Sem turno").trim() || "Sem turno";
    const horas = ccoTempoProdutivoLinha(item);

    if (!mapa[turno]) {
      mapa[turno] = {
        turno,
        horas: 0,
        registros: 0
      };
    }

    mapa[turno].horas += horas;
    mapa[turno].registros += 1;
  });

  return Object.values(mapa)
    .filter(item => item.horas > 0)
    .sort((a, b) => b.horas - a.horas);
}

function ccoAgruparDistanciaMediaPorTurno(dados) {
  const mapa = {};

  (dados || []).forEach(item => {
    const turno = String(item.turno || "Sem turno").trim() || "Sem turno";

    if (!mapa[turno]) {
      mapa[turno] = {
        turno,
        km: 0,
        viagens: 0,
        distanciaMedia: 0
      };
    }

    mapa[turno].km += ccoKmTotalLinha(item);
    mapa[turno].viagens += numero(item.viagens);
  });

  return Object.values(mapa)
    .map(item => ({
      ...item,
      distanciaMedia: item.viagens > 0 ? item.km / item.viagens : 0
    }))
    .sort((a, b) => b.distanciaMedia - a.distanciaMedia);
}

function ccoDistanciaMediaGeral(dados) {
  const totalKm = (dados || []).reduce((s, item) => s + ccoKmTotalLinha(item), 0);
  const totalViagens = (dados || []).reduce((s, item) => s + numero(item.viagens), 0);

  return totalViagens > 0 ? totalKm / totalViagens : 0;
}


/* função duplicada removida: renderGraficoHorasProdutivasServico */



/* função duplicada removida: renderGraficoDistanciaMediaServico */


/*
  Detalhe do serviço com todos os gráficos solicitados.
*/

/* função duplicada removida: renderDetalheServicoMensal */





/*
========================================================
PATCH • EXECUÇÃO P1 A P12: GRÁFICOS LADO A LADO
========================================================
- Organiza os gráficos do detalhe do serviço em grade 2 colunas.
- No celular, os gráficos ficam um abaixo do outro.
- Mantém cards abaixo dos gráficos.
========================================================
*/

function ccoSecaoGraficoExecucao(tituloPequeno, titulo, canvasId) {
  return `
    <section class="section">
      <div class="section-title">
        <span>${tituloPequeno}</span>
        <h2>${titulo}</h2>
      </div>
      <div class="chart-card"><canvas id="${canvasId}"></canvas></div>
    </section>
  `;
}


/* função duplicada removida: renderDetalheServicoMensal */





/*
========================================================
PATCH • OCULTAR GRÁFICOS SEM DADOS + TEMPO MÉDIO/VIAGEM
========================================================
Regras:
- Se um gráfico não tiver informação válida, o card do gráfico é escondido.
- Novo gráfico: Tempo Médio por Viagem.
- Fórmula: soma(Tempo Total de RD) / soma(Viagens).
- Também adiciona card de Tempo Médio por Viagem.
========================================================
*/

let graficoTempoMedioViagemServico = null;

function ccoCardGrafico(canvasId) {
  const canvas = document.getElementById(canvasId);
  return canvas ? canvas.closest(".section, .chart-card") : null;
}


/* função duplicada removida: ccoOcultarGraficoSeVazio */


function ccoTempoTotalRDLinha(item) {
  const valor = ccoPegarCampoGenericoExec(item, [
    "Tempo Total de RD",
    "Tempo_Total_de_RD",
    "tempo_total_de_rd",
    "Tempo Total RD",
    "Tempo_Total_RD",
    "tempo_total_rd",
    "Tempo RD",
    "tempo_rd",
    "Total RD",
    "total_rd"
  ]);

  return ccoConverterTempoParaHoras(valor);
}


/* função duplicada removida: ccoAgruparTempoMedioViagemPorTurno */



/* função duplicada removida: ccoTempoMedioViagemGeral */


function ccoTemValores(lista, campo) {
  return (lista || []).some(item => numero(item[campo]) > 0);
}


/* função duplicada removida: renderGraficoTempoMedioViagemServico */


/*
  Gráfico execução operacional por turno em coluna empilhada.
*/

/* função duplicada removida: renderGraficoExecucaoPorTurnoServico */


/*
  Viagens por turno: esconde se não houver viagens.
*/

/* função duplicada removida: renderGraficoViagensPorTurnoServico */


/*
  Horas produtivas: esconde se não houver Tempo Produtivo válido.
*/

/* função duplicada removida: renderGraficoHorasProdutivasServico */


/*
  Distância média: esconde se não houver km e viagens.
*/

/* função duplicada removida: renderGraficoDistanciaMediaServico */


/*
  Velocidade média: esconde se não houver VM.
*/

/* função duplicada removida: renderGraficoServicoDetalheVelocidadeMedia */


/*
  Inclui a seção do gráfico novo no layout.
*/

/* função duplicada removida: renderDetalheServicoMensal */





/*
========================================================
PATCH FINAL • LEGENDAS + TEMPO MÉDIO CORRIGIDO
========================================================
- Legendas visuais em todos os gráficos.
- Tempo médio por viagem corrigido:
  (coluna Tempo de RD x 24) / coluna Viagens
- Gráfico sem dados é removido da página.
- Página ajustada para não deixar espaços vazios.
========================================================
*/

function ccoCorGraficoExecucao(indice) {
  const cores = [
    "rgba(12, 107, 63, .78)",
    "rgba(21, 101, 192, .72)",
    "rgba(245, 124, 0, .72)",
    "rgba(198, 40, 40, .68)",
    "rgba(123, 31, 162, .68)",
    "rgba(0, 137, 123, .68)"
  ];
  return cores[indice % cores.length];
}

function ccoBordaGraficoExecucao(indice) {
  const cores = [
    "rgba(12, 107, 63, 1)",
    "rgba(21, 101, 192, 1)",
    "rgba(245, 124, 0, 1)",
    "rgba(198, 40, 40, 1)",
    "rgba(123, 31, 162, 1)",
    "rgba(0, 137, 123, 1)"
  ];
  return cores[indice % cores.length];
}


/* função duplicada removida: ccoOpcoesGraficoExecucaoVisual */



/* função duplicada removida: ccoPegarCampoTempoRD */


/*
  Regra solicitada:
  Tempo médio por viagem = (Tempo de RD x 24) / Viagens

  Observação:
  Se Tempo de RD vier como número decimal de Excel, multiplica por 24.
  Se vier como HH:MM:SS, converte para horas.
*/

/* função duplicada removida: ccoTempoRDHorasCorrigido */



/* função duplicada removida: ccoAgruparTempoMedioViagemPorTurno */



/* função duplicada removida: ccoTempoMedioViagemGeral */



/* função duplicada removida: ccoOcultarGraficoSeVazio */


function ccoTemDadosNumericos(lista, campos) {
  return (lista || []).some(item =>
    campos.some(campo => numero(item[campo]) > 0)
  );
}


/* função duplicada removida: renderGraficoTempoMedioViagemServico */


/*
  Execução por Turno em coluna empilhada, com legenda visual.
*/

/* função duplicada removida: renderGraficoExecucaoPorTurnoServico */


function renderGraficoViagensPorTurnoServico(codigo, dadosServico) {
  const canvas = document.getElementById("graficoViagensPorTurnoServico");
  if (!canvas) return;

  try {
    if (graficoViagensPorTurnoServico) {
      graficoViagensPorTurnoServico.destroy();
      graficoViagensPorTurnoServico = null;
    }
  } catch {}

  const dados = ccoAgruparViagensPorTurno(dadosServico);
  const temDados = dados.some(i => numero(i.viagens) > 0);

  ccoOcultarGraficoSeVazio("graficoViagensPorTurnoServico", temDados);
  if (!temDados) return;

  graficoViagensPorTurnoServico = new Chart(canvas, {
    type: "bar",
    data: {
      labels: dados.map(i => i.turno),
      datasets: [{
        label: "Viagens por turno",
        data: dados.map(i => Number(i.viagens.toFixed(2))),
        backgroundColor: dados.map((_, i) => ccoCorGraficoExecucao(i)),
        borderColor: dados.map((_, i) => ccoBordaGraficoExecucao(i)),
        borderWidth: 1,
        borderRadius: 10
      }]
    },
    options: ccoOpcoesGraficoExecucaoVisual(" viagens")
  });
}


/* função duplicada removida: renderGraficoHorasProdutivasServico */


function renderGraficoDistanciaMediaServico(codigo, dadosServico) {
  const canvas = document.getElementById("graficoDistanciaMediaServico");
  if (!canvas) return;

  try {
    if (graficoDistanciaMediaServico) {
      graficoDistanciaMediaServico.destroy();
      graficoDistanciaMediaServico = null;
    }
  } catch {}

  const dados = ccoAgruparDistanciaMediaPorTurno(dadosServico);
  const temDados = dados.some(i => numero(i.distanciaMedia) > 0);

  ccoOcultarGraficoSeVazio("graficoDistanciaMediaServico", temDados);
  if (!temDados) return;

  graficoDistanciaMediaServico = new Chart(canvas, {
    type: "bar",
    data: {
      labels: dados.map(i => i.turno),
      datasets: [{
        label: "Distância média",
        data: dados.map(i => Number(i.distanciaMedia.toFixed(2))),
        backgroundColor: dados.map((_, i) => ccoCorGraficoExecucao(i)),
        borderColor: dados.map((_, i) => ccoBordaGraficoExecucao(i)),
        borderWidth: 1,
        borderRadius: 10
      }]
    },
    options: ccoOpcoesGraficoExecucaoVisual(" km/viagem")
  });
}

function renderGraficoServicoDetalheVelocidadeMedia(codigo, dadosServico) {
  const canvas = document.getElementById("graficoServicoDetalhe");
  if (!canvas) return;

  try {
    if (graficoServicoDetalhe) {
      graficoServicoDetalhe.destroy();
      graficoServicoDetalhe = null;
    }
  } catch {}

  const vmPorDia =
    typeof ccoVelocidadePorDiaExecucaoFinal === "function"
      ? ccoVelocidadePorDiaExecucaoFinal(dadosServico)
      : (typeof ccoVelocidadePorDia === "function" ? ccoVelocidadePorDia(dadosServico) : []);

  const temDados = vmPorDia.some(i => numero(i.media) > 0);

  ccoOcultarGraficoSeVazio("graficoServicoDetalhe", temDados);
  if (!temDados) return;

  graficoServicoDetalhe = new Chart(canvas, {
    type: "line",
    data: {
      labels: vmPorDia.map(i => formatarDataBRSimples(i.data)),
      datasets: [{
        label: "Velocidade média",
        data: vmPorDia.map(i => Number(i.media.toFixed(2))),
        borderColor: ccoBordaGraficoExecucao(0),
        backgroundColor: "rgba(12, 107, 63, .15)",
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: ccoBordaGraficoExecucao(0)
      }]
    },
    options: ccoOpcoesGraficoExecucaoVisual(" km/h")
  });
}

/*
  Render do detalhe com ajuste de cards e remoção automática de gráficos vazios.
*/

/* função duplicada removida: renderDetalheServicoMensal */





/*
========================================================
PATCH FINAL • VALORES NOS GRÁFICOS + TEMPO CORRIGIDO
========================================================
Correções:
1. Os campos de tempo agora são salvos dentro de operacoes:
   - tempo_rd_excel
   - tempo_rd_horas
   - tempo_produtivo_h
2. Tempo Médio por Viagem:
   (coluna Tempo de RD x 24) / Viagens
3. Valores desenhados diretamente nos gráficos.
4. Gráficos sem dados são escondidos totalmente.
========================================================
*/

function ccoNormFinal(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function ccoCampoFinal(item, nomes) {
  if (!item) return "";

  for (const nome of nomes) {
    if (Object.prototype.hasOwnProperty.call(item, nome)) return item[nome];
  }

  const mapa = {};
  Object.keys(item).forEach(k => mapa[ccoNormFinal(k)] = item[k]);

  for (const nome of nomes) {
    const nk = ccoNormFinal(nome);
    if (Object.prototype.hasOwnProperty.call(mapa, nk)) return mapa[nk];
  }

  return "";
}

function ccoNumFinal(item, nomes) {
  return numero(ccoCampoFinal(item, nomes));
}

/*
  Tempo de RD:
  Se vier como número Excel, deve ser multiplicado por 24.
  Se vier HH:MM:SS, converte para horas.
*/
function ccoTempoRDHorasDeValorFinal(valor) {
  if (typeof valor === "number") {
    return valor * 24;
  }

  const texto = String(valor || "").trim();

  if (!texto) return 0;

  if (/^\d{1,3}:\d{2}(:\d{2})?$/.test(texto)) {
    const p = texto.split(":").map(Number);
    return (p[0] || 0) + ((p[1] || 0) / 60) + ((p[2] || 0) / 3600);
  }

  const n = numero(texto);
  return n ? n * 24 : 0;
}

function ccoTempoProdutivoHorasDeValorFinal(valor) {
  if (typeof valor === "number") {
    return valor > 0 && valor < 1 ? valor * 24 : valor;
  }

  const texto = String(valor || "").trim();

  if (!texto) return 0;

  if (/^\d{1,3}:\d{2}(:\d{2})?$/.test(texto)) {
    const p = texto.split(":").map(Number);
    return (p[0] || 0) + ((p[1] || 0) / 60) + ((p[2] || 0) / 3600);
  }

  return numero(texto);
}

function ccoValorTempoRDOriginal(item) {
  return ccoCampoFinal(item, [
    "Tempo de RD",
    "Tempo RD",
    "Tempo de R.D",
    "Tempo R.D",
    "Tempo_Total_de_RD",
    "Tempo Total de RD",
    "Tempo Total RD",
    "Tempo_Total_RD",
    "tempo_de_rd",
    "tempo_rd",
    "tempo_total_rd",
    "Total RD"
  ]);
}

function ccoValorTempoProdutivoOriginal(item) {
  return ccoCampoFinal(item, [
    "Tempo Produtivo",
    "Tempo_Produtivo",
    "tempo_produtivo",
    "Tempo Produtivo RD",
    "Tempo_Produtivo_RD",
    "tempo_produtivo_rd",
    "Horas Produtivas"
  ]);
}

/*
  Regera operações guardando os campos necessários para gráficos de tempo.
*/
function gerarOperacoes() {
  operacoes = [];

  Object.keys(sheetsOriginais || {}).forEach(nome => {
    if (nome === "painel executivo") return;

    const sheet = sheetsOriginais[nome];

    const codigoAba =
      sheet.codigoServico ||
      extrairCodigo(sheet.nomeOriginal) ||
      extrairCodigo(nome);

    if (!codigoAba) return;

    (sheet.dadosNormalizados || []).forEach(item => {
      const dataEncontrada =
        ccoCampoFinal(item, [
          "Data Análise",
          "Data Analise",
          "Data Operação",
          "Data_Operação",
          "data_operacao",
          "Início Operação",
          "inicio_operacao",
          "inicio_da_operacao",
          "Fim Operação",
          "fim_operacao",
          "Data",
          "data",
          "Dia",
          "dia",
          "dt"
        ]);

      const tempoRDValor = ccoValorTempoRDOriginal(item);
      const tempoProdutivoValor = ccoValorTempoProdutivoOriginal(item);

      operacoes.push({
        servico: codigoAba,
        servico_p: codigoAba,
        rd: String(ccoCampoFinal(item, ["RD", "Rd", "rd", "R.D.", "Registro Diário", "Registro Diario"]) || "").trim(),
        origem: sheet.nomeOriginal,
        data: dataEncontrada,
        data_normalizada: normalizarData(dataEncontrada),
        turno: ccoCampoFinal(item, ["Turno", "turno", "Periodo", "Período", "periodo"]) || "",
        ra: item.ra || item.regiao_administrativa || item.regiao || "Por demanda",
        setor: item.setor || item.local || "",
        peso: ccoNumFinal(item, ["Peso_T", "Peso T", "Peso", "peso_t", "pesot", "peso_total", "tonelada", "toneladas"]),
        viagens: ccoNumFinal(item, ["Viagens", "viagens", "Qtd Viagem", "qtd_viagem", "Qtd Viagens", "qtd_viagens", "Quantidade de Viagens", "viagem"]),
        km: ccoNumFinal(item, ["Km Total", "KM Total", "KM_Total", "km_total", "kmtotal", "Km Executado", "KM Executado", "km_executado", "km", "quilometragem"]),
        equipe: ccoNumFinal(item, ["Equipe", "equipe", "Qdt_Equipe", "qdt_equipe", "Qtd Equipe", "qtd_equipe", "Equipes", "equipes"]),
        executado: ccoNumFinal(item, ["Executado", "executado"]),
        velocidade_media: ccoNumFinal(item, ["Velocidade Média", "Velocidade Media", "velocidade_media", "VM km/h", "VM_KM_H", "VM_KMH", "VM"]),
        tempo_rd_excel: typeof tempoRDValor === "number" ? tempoRDValor : numero(tempoRDValor),
        tempo_rd_horas: ccoTempoRDHorasDeValorFinal(tempoRDValor),
        tempo_produtivo_h: ccoTempoProdutivoHorasDeValorFinal(tempoProdutivoValor),
        status: "Com dados"
      });
    });
  });
}

function ccoTempoRDHorasCorrigido(item) {
  return numero(item.tempo_rd_horas || 0);
}

function ccoTempoProdutivoLinha(item) {
  return numero(item.tempo_produtivo_h || 0);
}

function ccoKmTotalLinha(item) {
  const servico = String(item?.servico || item?.servico_p || "").trim().toUpperCase();
  if (servico === "P1") return window.obterKmTotalP1CCO ? window.obterKmTotalP1CCO(item) : numero(item?.km_total || 0);
  return numero(item?.km_total ?? item?.km ?? 0);
}

function atualizarCardKmExecutadoCCO(valor) {
  const elemento = document.getElementById("valorKmExecutado");
  if (!elemento) {
    console.error("[P1 KM TOTAL] elemento do card não encontrado");
    return;
  }
  const numeroKm = Number(valor);
  const valorSeguro = Number.isFinite(numeroKm) ? numeroKm : 0;
  elemento.textContent = valorSeguro.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const card = document.getElementById("cardKmExecutado");
  if (card) {
    card.hidden = false;
    card.style.removeProperty("display");
    card.setAttribute("aria-hidden", "false");
  }
}
window.atualizarCardKmExecutadoCCO = atualizarCardKmExecutadoCCO;

function ccoPegarCampoTempoRD(item) {
  return item.tempo_rd_excel || item.tempo_rd_horas || 0;
}

function ccoOcultarGraficoSeVazio(canvasId, temDados) {
  const canvas = document.getElementById(canvasId);
  const card = canvas ? canvas.closest(".section, .chart-card") : null;
  if (!card) return;

  if (temDados) {
    card.style.display = "";
    card.classList.remove("grafico-sem-dados");
  } else {
    card.style.display = "none";
    card.classList.add("grafico-sem-dados");
  }
}

/*
  Plugin simples para escrever valores nos gráficos.
*/
/*
  Plugin antigo removido: ele desenhava valores completos em preto sobre os gráficos.
  Mantido como no-op para não quebrar referências antigas.
*/
const ccoPluginValoresGraficos = {
  id: "ccoPluginValoresGraficos",
  afterDatasetsDraw() {
    return;
  }
};

// Não registrar este plugin. Ele era a origem do texto/valor preto duplicado.
function ccoOpcoesGraficoExecucaoVisual(sufixo = "") {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 10,
          boxHeight: 10,
          padding: 14,
          font: { size: 12, weight: "700" }
        }
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, .94)",
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label(context) {
            const label = context.dataset.label || "";
            const valor = context.parsed?.y ?? context.parsed ?? 0;
            return `${label}: ${formatarNumero(valor)}${sufixo}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(15, 23, 42, .06)" },
        ticks: { font: { size: 11, weight: "700" } }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(15, 23, 42, .08)" },
        ticks: { font: { size: 11, weight: "700" } }
      }
    }
  };
}

function ccoAgruparTempoMedioViagemPorTurno(dados) {
  const mapa = {};

  (dados || []).forEach(item => {
    const turno = String(item.turno || "Sem turno").trim() || "Sem turno";

    if (!mapa[turno]) {
      mapa[turno] = { turno, tempoRDHoras: 0, viagens: 0, tempoMedio: 0 };
    }

    mapa[turno].tempoRDHoras += ccoTempoRDHorasCorrigido(item);
    mapa[turno].viagens += numero(item.viagens);
  });

  return Object.values(mapa)
    .map(item => ({
      ...item,
      tempoMedio: item.viagens > 0 ? item.tempoRDHoras / item.viagens : 0
    }))
    .filter(item => item.tempoMedio > 0)
    .sort((a, b) => b.tempoMedio - a.tempoMedio);
}

function ccoTempoMedioViagemGeral(dados) {
  const totalTempo = (dados || []).reduce((s, item) => s + ccoTempoRDHorasCorrigido(item), 0);
  const totalViagens = (dados || []).reduce((s, item) => s + numero(item.viagens), 0);
  return totalViagens > 0 ? totalTempo / totalViagens : 0;
}

function renderGraficoTempoMedioViagemServico(codigo, dadosServico) {
  const canvas = document.getElementById("graficoTempoMedioViagemServico");
  if (!canvas) return;

  try {
    if (graficoTempoMedioViagemServico) {
      graficoTempoMedioViagemServico.destroy();
      graficoTempoMedioViagemServico = null;
    }
  } catch {}

  const dados = ccoAgruparTempoMedioViagemPorTurno(dadosServico);
  const temDados = dados.length > 0;

  ccoOcultarGraficoSeVazio("graficoTempoMedioViagemServico", temDados);
  if (!temDados) return;

  graficoTempoMedioViagemServico = new Chart(canvas, {
    type: "bar",
    data: {
      labels: dados.map(i => i.turno),
      datasets: [{
        label: "Tempo médio por viagem",
        data: dados.map(i => Number(i.tempoMedio.toFixed(2))),
        backgroundColor: dados.map((_, i) => ccoCorGraficoExecucao(i)),
        borderColor: dados.map((_, i) => ccoBordaGraficoExecucao(i)),
        borderWidth: 1,
        borderRadius: 10,
        _ccoSuffix: " h"
      }]
    },
    options: ccoOpcoesGraficoExecucaoVisual(" h/viagem"),
    plugins: [ccoPluginValoresGraficos]
  });
}

function renderGraficoHorasProdutivasServico(codigo, dadosServico) {
  const canvas = document.getElementById("graficoHorasProdutivasServico");
  if (!canvas) return;

  try {
    if (graficoHorasProdutivasServico) {
      graficoHorasProdutivasServico.destroy();
      graficoHorasProdutivasServico = null;
    }
  } catch {}

  const dados = ccoAgruparHorasProdutivasPorTurno(dadosServico);
  const temDados = dados.some(i => numero(i.horas) > 0);

  ccoOcultarGraficoSeVazio("graficoHorasProdutivasServico", temDados);
  if (!temDados) return;

  graficoHorasProdutivasServico = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: dados.map(i => i.turno),
      datasets: [{
        label: "Horas produtivas",
        data: dados.map(i => Number(i.horas.toFixed(2))),
        backgroundColor: dados.map((_, i) => ccoCorGraficoExecucao(i)),
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: 8,
        _ccoSuffix: " h"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "58%",
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 14,
            font: { size: 12, weight: "700" }
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${formatarNumero(context.parsed || 0)} h`;
            }
          }
        }
      }
    },
    plugins: [ccoPluginValoresGraficos]
  });
}

/*
  Reprocessa base após carregar/importar para preencher campos de tempo.
*/
function ccoReprocessarCamposTempoGraficos() {
  if (!sheetsOriginais || !Object.keys(sheetsOriginais).length) return;

  gerarOperacoes();
  operacoesOriginal = clonar(operacoes);

  gerarPainelExecutivo();
  painelExecutivoOriginal = clonar(painelExecutivo);

  atualizarDashboard();

  const detalhe = document.getElementById("servico-detalhe");
  if (detalhe && detalhe.classList.contains("ativa")) {
    const codigo = obterServicoAtivo();
    if (codigo) renderDetalheServicoMensal(codigo);
  }
}

if (typeof carregarBaseSupabase === "function") {
  const carregarBaseSupabaseOriginalTempoFinal = carregarBaseSupabase;
  carregarBaseSupabase = async function() {
    const ok = await carregarBaseSupabaseOriginalTempoFinal();
    if (ok) setTimeout(ccoReprocessarCamposTempoGraficos, 300);
    return ok;
  };
}

if (typeof importarPlanilhas === "function") {
  const importarPlanilhasOriginalTempoFinal = importarPlanilhas;
  importarPlanilhas = async function(evento) {
    await importarPlanilhasOriginalTempoFinal(evento);
    setTimeout(ccoReprocessarCamposTempoGraficos, 300);
  };
}




/*
========================================================
PATCH FINAL • LEGENDA + LINHAS GRANDES + REMOVER KPI
========================================================
1. Arruma legenda do gráfico Execução Operacional por Turno.
2. Remove gráfico KPI "Previsto x Executado".
3. Gráficos de linha ficam em largura total para melhor visualização.
========================================================
*/

function ccoAplicarLayoutGraficosLinhaGrandes() {
  [
    "graficoServicoDetalhe",
    "graficoKpiServicoDiario",
    "graficoKpiPercentualMensal",
    "graficoKpiProdutividadeMensal"
  ].forEach(id => {
    const canvas = document.getElementById(id);
    const secao = canvas?.closest(".section, .chart-card");
    if (secao) secao.classList.add("grafico-linha-full");
  });

  const kpiPrevisto = document.getElementById("graficoKpiPrevistoExecutado");
  const cardPrevisto = kpiPrevisto?.closest(".section, .chart-card");
  if (cardPrevisto) {
    cardPrevisto.classList.add("kpi-previsto-executado-removido");
    cardPrevisto.style.display = "none";
  }

  try {
    if (typeof graficoKpiPrevistoExecutado !== "undefined" && graficoKpiPrevistoExecutado) {
      graficoKpiPrevistoExecutado.destroy();
      graficoKpiPrevistoExecutado = null;
    }
  } catch {}

  try {
    if (typeof CCO_KPI_GRAFICOS !== "undefined" && CCO_KPI_GRAFICOS.previsto) {
      CCO_KPI_GRAFICOS.previsto.destroy();
      CCO_KPI_GRAFICOS.previsto = null;
    }
  } catch {}

  setTimeout(() => {
    try {
      if (window.Chart) {
        Object.values(Chart.instances || {}).forEach(chart => {
          try { chart.resize(); } catch {}
        });
      }
    } catch {}
  }, 250);
}

function ccoOpcoesLegendaExecutivaFinal(sufixo = "") {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        align: "center",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 10,
          boxHeight: 10,
          padding: 18,
          color: "#FFFFFF",
          font: {
            size: 12,
            weight: "800"
          }
        }
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, .94)",
        titleFont: {
          size: 13,
          weight: "800"
        },
        bodyFont: {
          size: 12,
          weight: "700"
        },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label(context) {
            const label = context.dataset.label || "";
            const valor = context.parsed?.y ?? context.parsed ?? 0;
            return `${label}: ${formatarNumero(valor)}${sufixo}`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          color: "#475569",
          font: {
            size: 12,
            weight: "800"
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: "rgba(15, 23, 42, .08)"
        },
        ticks: {
          color: "#475569",
          font: {
            size: 11,
            weight: "700"
          }
        }
      }
    }
  };
}

/*
  Legenda corrigida no gráfico Execução Operacional por Turno.
  Mantém coluna empilhada, mas com legenda inferior e sem rótulos poluindo.
*/

/* função duplicada removida: renderGraficoExecucaoPorTurnoServico */


/*
  Remove o gráfico KPI Previsto x Executado mesmo se alguma função tentar renderizar.
*/
function ccoRemoverKpiPrevistoExecutadoFinal() {
  const canvas = document.getElementById("graficoKpiPrevistoExecutado");
  const card = canvas?.closest(".section, .chart-card");

  if (card) {
    card.classList.add("kpi-previsto-executado-removido");
    card.style.display = "none";
  }

  try {
    if (typeof graficoKpiPrevistoExecutado !== "undefined" && graficoKpiPrevistoExecutado) {
      graficoKpiPrevistoExecutado.destroy();
      graficoKpiPrevistoExecutado = null;
    }
  } catch {}
}

if (typeof renderKpiServico === "function") {
  const renderKpiServicoOriginalSemPrevisto = renderKpiServico;
  renderKpiServico = function() {
    renderKpiServicoOriginalSemPrevisto();
    ccoRemoverKpiPrevistoExecutadoFinal();
    ccoAplicarLayoutGraficosLinhaGrandes();
  };
}

if (typeof renderKpi === "function") {
  const renderKpiOriginalSemPrevisto = renderKpi;
  renderKpi = function() {
    renderKpiOriginalSemPrevisto();
    ccoRemoverKpiPrevistoExecutadoFinal();
    ccoAplicarLayoutGraficosLinhaGrandes();
  };
}

if (typeof renderDetalheServicoMensal === "function") {
  const renderDetalheServicoMensalOriginalLinhaGrande = renderDetalheServicoMensal;
  renderDetalheServicoMensal = function(codigo) {
    renderDetalheServicoMensalOriginalLinhaGrande(codigo);
    ccoAplicarLayoutGraficosLinhaGrandes();
  };
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    ccoRemoverKpiPrevistoExecutadoFinal();
    ccoAplicarLayoutGraficosLinhaGrandes();
  }, 1200);

  setTimeout(() => {
    ccoRemoverKpiPrevistoExecutadoFinal();
    ccoAplicarLayoutGraficosLinhaGrandes();
  }, 2500);
});




/*
========================================================
PATCH FINAL • PESO_T/VIAGEM + FILTROS EM ORDEM + VALOR NA BARRA
========================================================
Aplicado:
1. Comparativo Mensal:
   - Remove Tonelada/KM.
   - Adiciona Peso_t por Viagem = Peso_t / Viagens.
   - Mantém Peso por Hora.
   - Comparativo Mensal por Serviço no topo.
   - Remove gráficos estáticos antigos.
2. Filtros:
   - Ordena serviços em P1, P2.1, P2.2, P3...P12.
3. Valor contratado por Serviço:
   - Mostra o valor em R$ na frente da barra horizontal.
   - DataLabels só nesse gráfico.
========================================================
*/

const ORDEM_SERVICOS_CCO_FINAL = [
  "P1", "P2.1", "P2.2", "P3", "P4", "P5", "P6",
  "P7", "P8", "P9", "P10", "P11", "P12"
];

function ccoIndiceServicoFinal(servico) {
  const i = ORDEM_SERVICOS_CCO_FINAL.indexOf(servico);
  return i === -1 ? 999 : i;
}

function ccoOrdenarServicosFinal(lista) {
  return [...lista].sort((a, b) => ccoIndiceServicoFinal(a) - ccoIndiceServicoFinal(b));
}

function ccoNumeroFinal(valor) {
  return typeof numero === "function" ? numero(valor) : Number(String(valor || "0").replace(/\./g, "").replace(",", ".")) || 0;
}

function ccoNormalizarChaveFinal(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function ccoPegarCampoFinal(item, nomes) {
  if (!item) return "";

  for (const nome of nomes) {
    if (Object.prototype.hasOwnProperty.call(item, nome)) return item[nome];
  }

  const mapa = {};
  Object.keys(item).forEach(k => {
    mapa[ccoNormalizarChaveFinal(k)] = item[k];
  });

  for (const nome of nomes) {
    const nk = ccoNormalizarChaveFinal(nome);
    if (Object.prototype.hasOwnProperty.call(mapa, nk)) return mapa[nk];
  }

  return "";
}

function ccoConverterTempoHorasFinal(valor) {
  if (typeof valor === "number") {
    return valor > 0 && valor < 1 ? valor * 24 : valor;
  }

  const texto = String(valor || "").trim();
  if (!texto) return 0;

  if (/^\d{1,3}:\d{2}(:\d{2})?$/.test(texto)) {
    const p = texto.split(":").map(Number);
    return (p[0] || 0) + ((p[1] || 0) / 60) + ((p[2] || 0) / 3600);
  }

  return ccoNumeroFinal(texto);
}

function ccoTempoProdutivoFinal(item) {
  const valor = ccoPegarCampoFinal(item, [
    "Tempo Produtivo",
    "Tempo_Produtivo",
    "tempo_produtivo",
    "Tempo Produtivo RD",
    "Tempo_Produtivo_RD",
    "tempo_produtivo_rd",
    "Tempo de RD",
    "Tempo_de_RD",
    "tempo_de_rd",
    "Tempo Total de RD",
    "Tempo_Total_de_RD",
    "tempo_total_de_rd",
    "Tempo Total RD",
    "Tempo_Total_RD",
    "tempo_total_rd",
    "Horas",
    "horas"
  ]);

  return ccoConverterTempoHorasFinal(valor);
}

/* =====================================================
   FILTROS EM ORDEM P1 A P12
===================================================== */
function ccoOrdenarTodosSelectsServicoFinal() {
  document.querySelectorAll("select").forEach(select => {
    const options = Array.from(select.options || []);
    const temP = options.some(opt => ORDEM_SERVICOS_CCO_FINAL.includes(opt.value));

    if (!temP) return;

    const valorAtual = select.value;
    const iniciais = options.filter(opt => !ORDEM_SERVICOS_CCO_FINAL.includes(opt.value));
    const servicos = options.filter(opt => ORDEM_SERVICOS_CCO_FINAL.includes(opt.value));

    servicos.sort((a, b) => ccoIndiceServicoFinal(a.value) - ccoIndiceServicoFinal(b.value));

    select.innerHTML = "";
    [...iniciais, ...servicos].forEach(opt => select.appendChild(opt));

    if (options.some(opt => opt.value === valorAtual)) {
      select.value = valorAtual;
    }
  });
}

if (typeof renderFiltros === "function") {
  const renderFiltrosOriginalOrdemP = renderFiltros;
  renderFiltros = function() {
    renderFiltrosOriginalOrdemP();
    ccoOrdenarTodosSelectsServicoFinal();
  };
}

if (typeof carregarFiltrosPeriodoDisponiveis === "function") {
  const carregarFiltrosPeriodoOriginalOrdemP = carregarFiltrosPeriodoDisponiveis;
  carregarFiltrosPeriodoDisponiveis = function() {
    carregarFiltrosPeriodoOriginalOrdemP();
    ccoOrdenarTodosSelectsServicoFinal();
  };
}

if (typeof carregarFiltrosExecucaoMensal === "function") {
  const carregarFiltrosExecucaoOriginalOrdemP = carregarFiltrosExecucaoMensal;
  carregarFiltrosExecucaoMensal = function() {
    carregarFiltrosExecucaoOriginalOrdemP();
    ccoOrdenarTodosSelectsServicoFinal();
  };
}

/* =====================================================
   VALOR CONTRATADO POR SERVIÇO • VALOR NA FRENTE DA BARRA
===================================================== */
function ccoFormatarMoedaBarraFinal(valor) {
  return ccoNumeroFinal(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


/* função duplicada removida: ccoAplicarValorNaFrenteBarraFinal */


if (typeof renderGraficos === "function") {
  const renderGraficosOriginalValorBarra = renderGraficos;
  renderGraficos = function() {
    renderGraficosOriginalValorBarra();
    setTimeout(ccoAplicarValorNaFrenteBarraFinal, 150);
  };
}

/* =====================================================
   EXECUÇÃO P1 A P12 • TURNO EM COLUNA AGRUPADA
===================================================== */
function renderGraficoExecucaoPorTurnoServico(codigo, dadosServico) {
  const canvas = document.getElementById("graficoExecucaoPorTurnoServico");
  if (!canvas) return;

  try {
    if (typeof graficoExecucaoPorTurnoServico !== "undefined" && graficoExecucaoPorTurnoServico) {
      graficoExecucaoPorTurnoServico.destroy();
      graficoExecucaoPorTurnoServico = null;
    }
  } catch {}

  const mapa = {};

  (dadosServico || []).forEach(item => {
    const turno = String(item.turno || "Sem turno").trim() || "Sem turno";

    if (!mapa[turno]) {
      mapa[turno] = { turno, peso: 0, km: 0, viagens: 0, equipes: 0 };
    }

    mapa[turno].peso += ccoNumeroFinal(item.peso);
    mapa[turno].km += ccoNumeroFinal(item.km);
    mapa[turno].viagens += ccoNumeroFinal(item.viagens);
    mapa[turno].equipes += ccoNumeroFinal(item.equipe);
  });

  const dados = Object.values(mapa);
  const temDados = dados.some(i => i.peso > 0 || i.km > 0 || i.viagens > 0 || i.equipes > 0);

  if (typeof ccoOcultarGraficoSeVazio === "function") {
    ccoOcultarGraficoSeVazio("graficoExecucaoPorTurnoServico", temDados);
  } else {
    const secao = canvas.closest(".section");
    if (secao) secao.style.display = temDados ? "" : "none";
  }

  if (!temDados) return;

  graficoExecucaoPorTurnoServico = new Chart(canvas, {
    type: "bar",
    data: {
      labels: dados.map(i => i.turno),
      datasets: [
        { label: "Peso (t)", data: dados.map(i => Number(i.peso.toFixed(2))), borderWidth: 1, borderRadius: 8 },
        { label: "KM executado", data: dados.map(i => Number(i.km.toFixed(2))), borderWidth: 1, borderRadius: 8 },
        { label: "Viagens", data: dados.map(i => Number(i.viagens.toFixed(2))), borderWidth: 1, borderRadius: 8 },
        { label: "Equipes", data: dados.map(i => Number(i.equipes.toFixed(2))), borderWidth: 1, borderRadius: 8 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 16,
            font: { size: 12, weight: "800" }
          }
        },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatarNumero(context.parsed.y || 0)}`;
            }
          }
        }
      },
      scales: {
        x: { stacked: false, grid: { display: false } },
        y: { stacked: false, beginAtZero: true, grid: { color: "rgba(15, 23, 42, .08)" } }
      }
    }
  });
}

/* =====================================================
   COMPARATIVO MENSAL • PESO_T/VIAGEM + PESO/HORA
===================================================== */
let graficoCompTopServico = null;
let graficoCompPesoViagem = null;
let graficoCompPesoHora = null;
let graficoCompVariacao = null;
let graficoCompParticipacao = null;

function ccoOcultarComparativoEstaticoFinal() {
  const tela = document.getElementById("tela-comparativo");
  if (!tela) return;

  const idsEstaticos = [
    "graficoComparativoMensal",
    "graficoComparativoPeso",
    "graficoComparativoKm",
    "graficoComparativoViagens",
    "graficoComparativoEquipes",
    "graficoVariacaoMensal",
    "graficoParticipacaoMeses",
    "graficoPesoMensal",
    "graficoKmMensal",
    "graficoViagensMensal",
    "graficoEquipeMensal",
    "graficoExecucaoMensal",
    "graficoPizzaMensal"
  ];

  idsEstaticos.forEach(id => {
    const canvas = document.getElementById(id);
    const secao = canvas?.closest(".section, .chart-card");

    if (secao && !secao.closest("#comparativoDinamicoGraficos")) {
      secao.classList.add("comparativo-estatico-oculto");
      secao.style.display = "none";
    }

    try {
      const chart = canvas ? Chart.getChart(canvas) : null;
      if (chart) chart.destroy();
    } catch {}
  });

  tela.querySelectorAll(".section, .chart-card").forEach(secao => {
    if (secao.closest("#comparativoDinamicoGraficos")) return;

    const texto = (secao.innerText || "").toLowerCase();
    const temCanvas = !!secao.querySelector("canvas");

    const antigo =
      texto.includes("peso por mês") ||
      texto.includes("peso por mes") ||
      texto.includes("km por mês") ||
      texto.includes("km por mes") ||
      texto.includes("viagens por mês") ||
      texto.includes("viagens por mes") ||
      texto.includes("equipes por mês") ||
      texto.includes("equipes por mes") ||
      texto.includes("tonelada por km") ||
      texto.includes("tonelada/km") ||
      texto.includes("variação mensal") ||
      texto.includes("variacao mensal") ||
      texto.includes("participação dos meses") ||
      texto.includes("participacao dos meses");

    if (temCanvas && antigo) {
      secao.classList.add("comparativo-estatico-oculto");
      secao.style.display = "none";
    }
  });
}

function ccoSecaoComparativoFinal(tag, titulo, canvasId, classe = "") {
  return `
    <section class="section ${classe}">
      <div class="section-title">
        <span>${tag}</span>
        <h2>${titulo}</h2>
      </div>
      <div class="chart-card">
        <canvas id="${canvasId}"></canvas>
      </div>
    </section>
  `;
}

function ccoGarantirAreaComparativoFinal() {
  const tela = document.getElementById("tela-comparativo");
  if (!tela) return null;

  let area = document.getElementById("comparativoDinamicoGraficos");

  if (!area) {
    area = document.createElement("div");
    area.id = "comparativoDinamicoGraficos";
    area.className = "comparativo-dinamico-grid";

    const filtro = tela.querySelector(".filter-panel");
    const header = tela.querySelector(".page-header");

    if (filtro) filtro.insertAdjacentElement("afterend", area);
    else if (header) header.insertAdjacentElement("afterend", area);
    else tela.prepend(area);
  }

  area.innerHTML = `
    ${ccoSecaoComparativoFinal("Comparativo", "Comparativo mensal por serviço", "graficoCompTopServico", "comparativo-top-full")}
    ${ccoSecaoComparativoFinal("Peso_t/Viagem", "Peso_t por Viagem", "graficoCompPesoViagem")}
    ${ccoSecaoComparativoFinal("Peso por Hora", "Peso por Hora", "graficoCompPesoHora")}
    ${ccoSecaoComparativoFinal("Variação", "Variação mensal (%)", "graficoCompVariacao", "comparativo-linha-full")}
    ${ccoSecaoComparativoFinal("Participação", "Participação dos Meses", "graficoCompParticipacao")}
  `;

  return area;
}

function ccoFiltrosComparativoFinal() {
  return {
    servico:
      document.getElementById("filtroComparativoServico")?.value ||
      document.getElementById("comparativoServico")?.value ||
      document.getElementById("filtroServicoComparativo")?.value ||
      "",
    ano:
      document.getElementById("filtroComparativoAno")?.value ||
      document.getElementById("comparativoAno")?.value ||
      document.getElementById("filtroAnoComparativo")?.value ||
      "",
    mes:
      document.getElementById("filtroComparativoMes")?.value ||
      document.getElementById("comparativoMes")?.value ||
      document.getElementById("filtroMesComparativo")?.value ||
      ""
  };
}

function ccoDadosComparativoFinal() {
  const filtros = ccoFiltrosComparativoFinal();

  let dados = clonar(operacoesOriginal || []);

  if (filtros.servico) dados = dados.filter(i => i.servico === filtros.servico);
  if (filtros.ano) dados = dados.filter(i => i.data_normalizada && i.data_normalizada.substring(0, 4) === filtros.ano);
  if (filtros.mes) dados = dados.filter(i => i.data_normalizada && i.data_normalizada.substring(5, 7) === filtros.mes);

  const mapa = {};

  dados.forEach(item => {
    if (!item.data_normalizada) return;

    const chave = item.data_normalizada.substring(0, 7);

    if (!mapa[chave]) {
      mapa[chave] = {
        mes: chave,
        mesBrasil: formatarMesBrasil(chave),
        peso: 0,
        viagens: 0,
        horas: 0,
        pesoViagem: 0,
        pesoHora: 0,
        totalBase: 0
      };
    }

    mapa[chave].peso += ccoNumeroFinal(item.peso);
    mapa[chave].viagens += ccoNumeroFinal(item.viagens);
    mapa[chave].horas += ccoTempoProdutivoFinal(item);
  });

  const lista = Object.values(mapa).sort((a, b) => a.mes.localeCompare(b.mes));

  lista.forEach(item => {
    item.pesoViagem = item.viagens > 0 ? item.peso / item.viagens : 0;
    item.pesoHora = item.horas > 0 ? item.peso / item.horas : 0;
    item.totalBase = item.pesoViagem || item.pesoHora || item.peso || 0;
  });

  return lista.map((item, index) => {
    const anterior = lista[index - 1];
    const baseAnterior = anterior ? anterior.totalBase : 0;

    return {
      ...item,
      variacao: anterior && baseAnterior ? ((item.totalBase - baseAnterior) / baseAnterior) * 100 : 0
    };
  });
}

function ccoDadosComparativoPorServicoFinal() {
  const filtros = ccoFiltrosComparativoFinal();

  let dados = clonar(operacoesOriginal || []);

  if (filtros.ano) dados = dados.filter(i => i.data_normalizada && i.data_normalizada.substring(0, 4) === filtros.ano);
  if (filtros.mes) dados = dados.filter(i => i.data_normalizada && i.data_normalizada.substring(5, 7) === filtros.mes);
  if (filtros.servico) dados = dados.filter(i => i.servico === filtros.servico);

  const mapa = {};

  dados.forEach(item => {
    const servico = item.servico || "Sem serviço";

    if (!mapa[servico]) {
      mapa[servico] = { servico, peso: 0, viagens: 0, horas: 0, indicador: 0 };
    }

    mapa[servico].peso += ccoNumeroFinal(item.peso);
    mapa[servico].viagens += ccoNumeroFinal(item.viagens);
    mapa[servico].horas += ccoTempoProdutivoFinal(item);
  });

  return Object.values(mapa)
    .map(item => ({
      ...item,
      indicador: item.viagens > 0 ? item.peso / item.viagens : (item.horas > 0 ? item.peso / item.horas : item.peso)
    }))
    .filter(item => item.indicador > 0)
    .sort((a, b) => ccoIndiceServicoFinal(a.servico) - ccoIndiceServicoFinal(b.servico));
}

function ccoOpcoesComparativoFinal(sufixo = "") {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "rectRounded",
          padding: 14,
          font: { size: 12, weight: "800" }
        }
      },
      datalabels: { display: false },
      tooltip: {
        callbacks: {
          label(context) {
            const label = context.dataset.label || "";
            const valor = context.parsed?.y ?? context.parsed ?? 0;
            return `${label}: ${formatarNumero(valor)}${sufixo}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { color: "rgba(15, 23, 42, .06)" } },
      y: { beginAtZero: true, grid: { color: "rgba(15, 23, 42, .08)" } }
    }
  };
}

function ccoOpcoesRoscaComparativoFinal() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 12,
          font: { size: 11, weight: "800" }
        }
      },
      datalabels: { display: false },
      tooltip: {
        callbacks: {
          label(context) {
            return `${context.label}: ${formatarNumero(context.parsed || 0)}`;
          }
        }
      }
    }
  };
}

function ccoDestroyComparativoFinal() {
  ["graficoCompTopServico", "graficoCompPesoViagem", "graficoCompPesoHora", "graficoCompVariacao", "graficoCompParticipacao"].forEach(nome => {
    try {
      if (window[nome]) {
        window[nome].destroy();
        window[nome] = null;
      }
    } catch {}
  });
}

function ccoCriarBarraComparativoFinal(canvasId, nomeGlobal, label, data, campo, sufixo = "") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const secao = canvas.closest(".section");
  const temDados = data.some(i => ccoNumeroFinal(i[campo]) > 0);

  if (secao) secao.style.display = temDados ? "" : "none";
  if (!temDados) return;

  window[nomeGlobal] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map(i => i.mesBrasil || i.servico),
      datasets: [{
        label,
        data: data.map(i => Number(ccoNumeroFinal(i[campo]).toFixed(2))),
        borderWidth: 1,
        borderRadius: 10
      }]
    },
    options: ccoOpcoesComparativoFinal(sufixo)
  });
}


/* função duplicada removida: renderComparativoDinamicoFinal */


if (typeof renderComparativoMensal === "function") {
  const renderComparativoMensalOriginalFinal = renderComparativoMensal;

  renderComparativoMensal = function() {
    renderComparativoMensalOriginalFinal();
    setTimeout(() => renderComparativoDinamicoFinal(), 80);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    ccoOrdenarTodosSelectsServicoFinal();
    ccoAplicarValorNaFrenteBarraFinal();
    renderComparativoDinamicoFinal();

    [
      "filtroComparativoServico",
      "comparativoServico",
      "filtroServicoComparativo",
      "filtroComparativoAno",
      "comparativoAno",
      "filtroAnoComparativo",
      "filtroComparativoMes",
      "comparativoMes",
      "filtroMesComparativo"
    ].forEach(id => {
      const el = document.getElementById(id);

      if (el && el.dataset.comparativoPesoViagemFinal !== "sim") {
        el.addEventListener("change", () => {
          setTimeout(() => {
            ccoOrdenarTodosSelectsServicoFinal();
            renderComparativoDinamicoFinal();
          }, 50);
        });
        el.dataset.comparativoPesoViagemFinal = "sim";
      }
    });
  }, 1200);

  setTimeout(() => {
    ccoOrdenarTodosSelectsServicoFinal();
    ccoAplicarValorNaFrenteBarraFinal();
  }, 2500);
});



/*
========================================================
PATCH FINAL V2 • LEGENDA CORRIGIDA E VALOR NA BARRA
========================================================
*/
var CCO_ORDEM_SERVICOS_LEG_V2=["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];
function ccoNumLegV2(v){return typeof numero==='function'?numero(v):(Number(String(v||'0').replace(/\./g,'').replace(',','.'))||0)}
function ccoIdxLegV2(s){let i=CCO_ORDEM_SERVICOS_LEG_V2.indexOf(s);return i<0?999:i}
function ccoOrdenarSelectsLegV2(){document.querySelectorAll('select').forEach(sel=>{let ops=Array.from(sel.options||[]);if(!ops.some(o=>CCO_ORDEM_SERVICOS_LEG_V2.includes(o.value)))return;let atual=sel.value;let outros=ops.filter(o=>!CCO_ORDEM_SERVICOS_LEG_V2.includes(o.value));let serv=ops.filter(o=>CCO_ORDEM_SERVICOS_LEG_V2.includes(o.value)).sort((a,b)=>ccoIdxLegV2(a.value)-ccoIdxLegV2(b.value));sel.innerHTML='';[...outros,...serv].forEach(o=>sel.appendChild(o));if(ops.some(o=>o.value===atual))sel.value=atual;});}
function ccoLegendaV2(pos='top'){return{display:true,position:pos,align:'center',labels:{usePointStyle:true,pointStyle:'circle',boxWidth:10,boxHeight:10,padding:18,color:'#334155',font:{size:12,weight:'800'}}}}
function ccoMoedaLegV2(v){return ccoNumLegV2(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2})}

/* função duplicada removida: ccoDesligarRotulosLegV2 */

function ccoLimparLegendasGraficosV2(){try{if(!window.Chart)return;Object.values(Chart.instances||{}).forEach(ch=>{let id=ch.canvas?.id||'';ch.options.plugins=ch.options.plugins||{};if(id!=='graficoValorServicoBarras'){ch.options.plugins.legend=ccoLegendaV2('top');ch.options.plugins.datalabels={display:false};}ch.update();});}catch(e){}}

/* função duplicada removida: ccoValorNaBarraV2 */

ccoDesligarRotulosLegV2();
if(typeof renderGraficos==='function'){const _rg_leg_v2=renderGraficos;renderGraficos=function(){_rg_leg_v2();setTimeout(()=>{ccoLimparLegendasGraficosV2();ccoValorNaBarraV2();ccoOrdenarSelectsLegV2();},180)}}
if(typeof renderFiltros==='function'){const _rf_leg_v2=renderFiltros;renderFiltros=function(){_rf_leg_v2();ccoOrdenarSelectsLegV2();}}
if(typeof carregarFiltrosPeriodoDisponiveis==='function'){const _cfp_leg_v2=carregarFiltrosPeriodoDisponiveis;carregarFiltrosPeriodoDisponiveis=function(){_cfp_leg_v2();ccoOrdenarSelectsLegV2();}}
if(typeof carregarFiltrosExecucaoMensal==='function'){const _cfe_leg_v2=carregarFiltrosExecucaoMensal;carregarFiltrosExecucaoMensal=function(){_cfe_leg_v2();ccoOrdenarSelectsLegV2();}}

function ccoNormKeyLegV2(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
function ccoCampoLegV2(item,nomes){if(!item)return'';for(const n of nomes){if(Object.prototype.hasOwnProperty.call(item,n))return item[n]}let m={};Object.keys(item).forEach(k=>m[ccoNormKeyLegV2(k)]=item[k]);for(const n of nomes){let nk=ccoNormKeyLegV2(n);if(Object.prototype.hasOwnProperty.call(m,nk))return m[nk]}return''}
function ccoHorasLegV2(v){if(typeof v==='number')return v>0&&v<1?v*24:v;let t=String(v||'').trim();if(!t)return 0;if(/^\d{1,3}:\d{2}(:\d{2})?$/.test(t)){let p=t.split(':').map(Number);return(p[0]||0)+(p[1]||0)/60+(p[2]||0)/3600}return ccoNumLegV2(t)}
function ccoTempoLegV2(item){return ccoHorasLegV2(ccoCampoLegV2(item,['Tempo Produtivo','Tempo_Produtivo','tempo_produtivo','Tempo de RD','Tempo_de_RD','tempo_de_rd','Tempo Total de RD','Tempo_Total_de_RD','tempo_total_de_rd','Tempo Total RD','Tempo_Total_RD','tempo_total_rd']))}
function ccoOcultarEstaticosCompV2(){let tela=document.getElementById('tela-comparativo');if(!tela)return;['graficoComparativoMensal','graficoComparativoPeso','graficoComparativoKm','graficoComparativoViagens','graficoComparativoEquipes','graficoVariacaoMensal','graficoParticipacaoMeses','graficoPesoMensal','graficoKmMensal','graficoViagensMensal','graficoEquipeMensal','graficoExecucaoMensal','graficoPizzaMensal'].forEach(id=>{let c=document.getElementById(id),s=c?.closest('.section,.chart-card');if(s&&!s.closest('#comparativoDinamicoGraficos')){s.classList.add('comparativo-estatico-oculto');s.style.display='none'}try{let ch=c?Chart.getChart(c):null;if(ch)ch.destroy()}catch(e){}})}
function ccoSecCompV2(tag,titulo,id,cls=''){return `<section class="section ${cls}"><div class="section-title"><span>${tag}</span><h2>${titulo}</h2></div><div class="chart-card"><canvas id="${id}"></canvas></div></section>`}
function ccoAreaCompV2(){let tela=document.getElementById('tela-comparativo');if(!tela)return null;let area=document.getElementById('comparativoDinamicoGraficos');if(!area){area=document.createElement('div');area.id='comparativoDinamicoGraficos';area.className='comparativo-dinamico-grid';let filtro=tela.querySelector('.filter-panel'),header=tela.querySelector('.page-header');if(filtro)filtro.insertAdjacentElement('afterend',area);else if(header)header.insertAdjacentElement('afterend',area);else tela.prepend(area)}area.innerHTML=ccoSecCompV2('Comparativo','Comparativo mensal por serviço','graficoCompTopServico','comparativo-top-full')+ccoSecCompV2('Peso_t/Viagem','Peso_t por Viagem','graficoCompPesoViagem')+ccoSecCompV2('Peso por Hora','Peso por Hora','graficoCompPesoHora')+ccoSecCompV2('Variação','Variação mensal (%)','graficoCompVariacao','comparativo-linha-full')+ccoSecCompV2('Participação','Participação dos Meses','graficoCompParticipacao');return area}
function ccoFiltrosCompV2(){return{servico:document.getElementById('filtroComparativoServico')?.value||document.getElementById('comparativoServico')?.value||document.getElementById('filtroServicoComparativo')?.value||'',ano:document.getElementById('filtroComparativoAno')?.value||document.getElementById('comparativoAno')?.value||document.getElementById('filtroAnoComparativo')?.value||'',mes:document.getElementById('filtroComparativoMes')?.value||document.getElementById('comparativoMes')?.value||document.getElementById('filtroMesComparativo')?.value||''}}
function ccoDadosMesCompV2(){let f=ccoFiltrosCompV2(),dados=clonar(operacoesOriginal||[]);if(f.servico)dados=dados.filter(i=>i.servico===f.servico);if(f.ano)dados=dados.filter(i=>i.data_normalizada&&i.data_normalizada.substring(0,4)===f.ano);if(f.mes)dados=dados.filter(i=>i.data_normalizada&&i.data_normalizada.substring(5,7)===f.mes);let mapa={};dados.forEach(i=>{if(!i.data_normalizada)return;let k=i.data_normalizada.substring(0,7);if(!mapa[k])mapa[k]={mes:k,mesBrasil:formatarMesBrasil(k),peso:0,viagens:0,horas:0,pesoViagem:0,pesoHora:0,totalBase:0};mapa[k].peso+=ccoNumLegV2(i.peso);mapa[k].viagens+=ccoNumLegV2(i.viagens);mapa[k].horas+=ccoTempoLegV2(i)});let lista=Object.values(mapa).sort((a,b)=>a.mes.localeCompare(b.mes));lista.forEach(i=>{i.pesoViagem=i.viagens>0?i.peso/i.viagens:0;i.pesoHora=i.horas>0?i.peso/i.horas:0;i.totalBase=i.pesoViagem||i.pesoHora||i.peso||0});return lista.map((i,idx)=>{let ant=lista[idx-1],ba=ant?ant.totalBase:0;return{...i,variacao:ant&&ba?((i.totalBase-ba)/ba)*100:0}})}
function ccoDadosServCompV2(){let f=ccoFiltrosCompV2(),dados=clonar(operacoesOriginal||[]);if(f.ano)dados=dados.filter(i=>i.data_normalizada&&i.data_normalizada.substring(0,4)===f.ano);if(f.mes)dados=dados.filter(i=>i.data_normalizada&&i.data_normalizada.substring(5,7)===f.mes);if(f.servico)dados=dados.filter(i=>i.servico===f.servico);let mapa={};dados.forEach(i=>{let s=i.servico||'Sem serviço';if(!mapa[s])mapa[s]={servico:s,peso:0,viagens:0,horas:0,indicador:0};mapa[s].peso+=ccoNumLegV2(i.peso);mapa[s].viagens+=ccoNumLegV2(i.viagens);mapa[s].horas+=ccoTempoLegV2(i)});return Object.values(mapa).map(i=>({...i,indicador:i.viagens>0?i.peso/i.viagens:(i.horas>0?i.peso/i.horas:i.peso)})).filter(i=>i.indicador>0).sort((a,b)=>ccoIdxLegV2(a.servico)-ccoIdxLegV2(b.servico))}
function ccoOpCompV2(suf=''){return{responsive:true,maintainAspectRatio:false,layout:{padding:{top:10}},plugins:{legend:ccoLegendaV2('top'),datalabels:{display:false},tooltip:{callbacks:{label(ctx){let label=ctx.dataset.label||'',valor=ctx.parsed?.y??ctx.parsed??0;return `${label}: ${formatarNumero(valor)}${suf}`}}}},scales:{x:{grid:{color:'rgba(15,23,42,.06)'}},y:{beginAtZero:true,grid:{color:'rgba(15,23,42,.08)'}}}}}
function ccoOpRoscaCompV2(){return{responsive:true,maintainAspectRatio:false,plugins:{legend:ccoLegendaV2('top'),datalabels:{display:false},tooltip:{callbacks:{label(ctx){return `${ctx.label}: ${formatarNumero(ctx.parsed||0)}`}}}}}}
function ccoDestroyCompV2(){['graficoCompTopServicoV2','graficoCompPesoViagemV2','graficoCompPesoHoraV2','graficoCompVariacaoV2','graficoCompParticipacaoV2'].forEach(n=>{try{if(window[n]){window[n].destroy();window[n]=null}}catch(e){}})}
function ccoBarCompV2(id,nome,label,data,campo,suf=''){let c=document.getElementById(id);if(!c)return;let sec=c.closest('.section'),tem=data.some(i=>ccoNumLegV2(i[campo])>0);if(sec)sec.style.display=tem?'':'none';if(!tem)return;window[nome]=new Chart(c,{type:'bar',data:{labels:data.map(i=>i.mesBrasil||i.servico),datasets:[{label,data:data.map(i=>Number(ccoNumLegV2(i[campo]).toFixed(2))),borderWidth:1,borderRadius:10}]},options:ccoOpCompV2(suf)})}
function renderComparativoDinamicoV2(){ccoOcultarEstaticosCompV2();ccoAreaCompV2();ccoDestroyCompV2();let mes=ccoDadosMesCompV2(),serv=ccoDadosServCompV2(),area=document.getElementById('comparativoDinamicoGraficos');if(!mes.length&&!serv.length){if(area)area.innerHTML='<section class="section"><div class="section-title"><span>Comparativo Mensal</span><h2>Nenhum dado encontrado para os filtros selecionados</h2></div></section>';return}ccoBarCompV2('graficoCompTopServico','graficoCompTopServicoV2','Comparativo por serviço',serv,'indicador');ccoBarCompV2('graficoCompPesoViagem','graficoCompPesoViagemV2','Peso_t/Viagem',mes,'pesoViagem',' t/viagem');ccoBarCompV2('graficoCompPesoHora','graficoCompPesoHoraV2','Peso por hora',mes,'pesoHora',' t/h');let cv=document.getElementById('graficoCompVariacao');if(cv){let sec=cv.closest('.section'),tem=mes.some(i=>ccoNumLegV2(i.variacao)!==0);if(sec)sec.style.display=tem?'':'none';if(tem)window.graficoCompVariacaoV2=new Chart(cv,{type:'line',data:{labels:mes.map(i=>i.mesBrasil),datasets:[{label:'Variação mensal (%)',data:mes.map(i=>Number(ccoNumLegV2(i.variacao).toFixed(2))),borderWidth:3,tension:.35,fill:false,pointRadius:4}]},options:{...ccoOpCompV2('%'),scales:{x:ccoOpCompV2('%').scales.x,y:{beginAtZero:false,grid:{color:'rgba(15,23,42,.08)'}}}}})}let cp=document.getElementById('graficoCompParticipacao');if(cp){let part=mes.filter(i=>ccoNumLegV2(i.totalBase)>0),sec=cp.closest('.section');if(sec)sec.style.display=part.length?'':'none';if(part.length)window.graficoCompParticipacaoV2=new Chart(cp,{type:'doughnut',data:{labels:part.map(i=>i.mesBrasil),datasets:[{label:'Participação dos meses',data:part.map(i=>Number(ccoNumLegV2(i.totalBase).toFixed(2))),borderWidth:2,hoverOffset:8}]},options:ccoOpRoscaCompV2()})}ccoOcultarEstaticosCompV2();ccoOrdenarSelectsLegV2();ccoLimparLegendasGraficosV2();}
if(typeof renderComparativoMensal==='function'){const _rcm_v2=renderComparativoMensal;renderComparativoMensal=function(){_rcm_v2();setTimeout(()=>renderComparativoDinamicoV2(),80)}}
document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{ccoOrdenarSelectsLegV2();ccoLimparLegendasGraficosV2();ccoValorNaBarraV2();renderComparativoDinamicoV2();},1200);setTimeout(()=>{ccoOrdenarSelectsLegV2();ccoLimparLegendasGraficosV2();ccoValorNaBarraV2();},2600);['filtroComparativoServico','comparativoServico','filtroServicoComparativo','filtroComparativoAno','comparativoAno','filtroAnoComparativo','filtroComparativoMes','comparativoMes','filtroMesComparativo'].forEach(id=>{let el=document.getElementById(id);if(el&&el.dataset.comparativoLegendaV2!=='sim'){el.addEventListener('change',()=>setTimeout(()=>renderComparativoDinamicoV2(),60));el.dataset.comparativoLegendaV2='sim';}})});


/* =====================================================
   LIMPEZA TOTAL LOCAL
   Remove resumo local, histórico local, caches CCO e IndexedDB.
   Não apaga Supabase. Para apagar Supabase, use o SQL no painel do banco.
===================================================== */
async function limpezaTotal() {
  const usuario = obterUsuarioLogado ? obterUsuarioLogado() : {};

  const ehAdmin =
    String(usuario.usuario || "").toLowerCase() === "admin" ||
    String(usuario.perfil || "").toLowerCase().includes("administrador");

  if (!ehAdmin) {
    alert("Apenas Administrador pode executar a Limpeza Total.");
    return;
  }

  const confirmar = confirm(
    "ATENÇÃO!\\n\\n" +
    "A Limpeza Total remove dados salvos neste navegador:\\n" +
    "- Resumo local\\n" +
    "- Histórico local\\n" +
    "- Cache CCO\\n" +
    "- IndexedDB local\\n\\n" +
    "Ela NÃO apaga o Supabase.\\n\\n" +
    "Deseja continuar?"
  );

  if (!confirmar) return;

  try {
    const chavesParaRemover = [];

    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);

      if (
        chave === "cco_resumo_ativo_v20" ||
        chave === "cco_historico_resumo_v20" ||
        chave === "usuarioLembrado" ||
        chave.startsWith("cco_")
      ) {
        chavesParaRemover.push(chave);
      }
    }

    chavesParaRemover.forEach(chave => localStorage.removeItem(chave));

    if (window.indexedDB) {
      const bancosLocais = [
        "cco",
        "cco_kpi",
        "cco_dashboard",
        "cco_local",
        "cco_db",
        "cco_database",
        "cco_permanente"
      ];

      bancosLocais.forEach(nome => {
        try {
          indexedDB.deleteDatabase(nome);
        } catch (erro) {
          console.warn("Não foi possível remover IndexedDB:", nome, erro);
        }
      });
    }

    alert("Limpeza local concluída. O sistema será reiniciado.");
    window.location.href = "login.html";

  } catch (erro) {
    console.error("Erro na Limpeza Total:", erro);
    alert("Erro ao limpar os dados locais. Veja o console para detalhes.");
  }
}


/* =====================================================
   PATCH ESTABILIDADE CHART.JS + SUPABASE
   Corrige:
   - Canvas is already in use
   - Maximum call stack size exceeded em datalabels
   - Texto quando banco está vazio
===================================================== */
(function instalarPatchChartSeguroCCO() {
  function instalar() {
    try {
      if (!window.Chart || window.Chart.__ccoChartSeguro) return;

      const ChartOriginal = window.Chart;

      const ChartSeguro = new Proxy(ChartOriginal, {
        construct(target, args) {
          try {
            const item = args[0];
            let canvas = null;

            if (typeof item === "string") {
              canvas = document.getElementById(item);
            } else if (item && item.canvas) {
              canvas = item.canvas;
            } else {
              canvas = item;
            }

            if (canvas && target.getChart) {
              const graficoExistente = target.getChart(canvas);
              if (graficoExistente) {
                graficoExistente.destroy();
              }
            }
          } catch (erro) {
            console.warn("Aviso ao destruir gráfico existente:", erro);
          }

          return Reflect.construct(target, args);
        }
      });

      ChartSeguro.__ccoChartSeguro = true;
      window.Chart = ChartSeguro;

      if (window.Chart.defaults && window.Chart.defaults.plugins) {
        window.Chart.defaults.plugins.datalabels = {
          display: false
        };
      }
    } catch (erro) {
      console.warn("Não foi possível instalar patch Chart.js:", erro);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", instalar, { once: true });
  } else {
    instalar();
  }
})();

/* Desliga funções antigas que forçavam rótulo na barra e causavam loop no Chart.js */
function ccoAplicarValorNaFrenteBarraFinal() {
  return;
}

function ccoValorNaBarraV2() {
  return;
}

function ccoDesligarRotulosLegV2() {
  try {
    if (window.Chart && window.Chart.defaults && window.Chart.defaults.plugins) {
      window.Chart.defaults.plugins.datalabels = { display: false };
    }
  } catch (erro) {}
}

/* Mensagem correta quando não há base carregada */
async function ccoAjustarMensagemBancoVazio() {
  try {
    const campo = document.getElementById("nomeArquivo");
    if (!campo) return;

    const textoAtual = String(campo.textContent || "").trim();

    if (
      textoAtual.includes("Carregando dados da base") ||
      textoAtual === "" ||
      textoAtual === "0"
    ) {
      campo.textContent = "🟢 Sistema pronto para importar planilha";
    }
  } catch (erro) {}
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(ccoAjustarMensagemBancoVazio, 1200);
  setTimeout(ccoAjustarMensagemBancoVazio, 3000);
});

/* Diagnóstico simples para CORS/local */


/* =====================================================
   PATCH ÚLTIMO MÊS PRIMEIRO
   Garante que o sistema abra no mês/ano mais recente disponível.
===================================================== */

function ccoObterUltimoPeriodoDisponivel(dados = null) {
  const baseDados = Array.isArray(dados) && dados.length
    ? dados
    : (Array.isArray(window.operacoesOriginal) && window.operacoesOriginal.length
        ? window.operacoesOriginal
        : (Array.isArray(operacoesOriginal) ? operacoesOriginal : []));

  let ultimo = null;

  baseDados.forEach(item => {
    const data =
      item.data_normalizada ||
      item.data_operacao ||
      item.data ||
      item.dia ||
      "";

    let ano = Number(item.ano || "");
    let mes = Number(item.mes || "");

    if ((!ano || !mes) && typeof data === "string") {
      const matchIso = data.match(/^(\d{4})-(\d{2})/);
      const matchBr = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

      if (matchIso) {
        ano = Number(matchIso[1]);
        mes = Number(matchIso[2]);
      } else if (matchBr) {
        ano = Number(matchBr[3]);
        mes = Number(matchBr[2]);
      }
    }

    if (!ano || !mes) return;

    const chave = ano * 100 + mes;

    if (!ultimo || chave > ultimo.chave) {
      ultimo = {
        ano: String(ano),
        mes: String(mes).padStart(2, "0"),
        chave
      };
    }
  });

  return ultimo;
}

function ccoAplicarUltimoMesPrimeiro() {
  try {
    const ultimo = ccoObterUltimoPeriodoDisponivel();

    if (!ultimo) {
      const campo = document.getElementById("nomeArquivo");
      if (campo) campo.textContent = "🟢 Sistema pronto para importar planilha";
      return;
    }

    const filtroMes = document.getElementById("filtroMes");
    const filtroAno = document.getElementById("filtroAno");
    const filtroExecucaoMes = document.getElementById("filtroExecucaoMes");
    const filtroExecucaoAno = document.getElementById("filtroExecucaoAno");

    if (filtroMes) filtroMes.value = ultimo.mes;
    if (filtroAno) filtroAno.value = ultimo.ano;
    if (filtroExecucaoMes) filtroExecucaoMes.value = ultimo.mes;
    if (filtroExecucaoAno) filtroExecucaoAno.value = ultimo.ano;

    if (typeof filtroExecucaoMesAtual !== "undefined") filtroExecucaoMesAtual = ultimo.mes;
    if (typeof filtroExecucaoAnoAtual !== "undefined") filtroExecucaoAnoAtual = ultimo.ano;

    if (typeof aplicarFiltroMensal === "function") {
      aplicarFiltroMensal();
    } else if (typeof aplicarFiltroPeriodoExecutivo === "function") {
      aplicarFiltroPeriodoExecutivo();
    } else if (typeof atualizarDashboard === "function") {
      atualizarDashboard();
    }

    const campo = document.getElementById("nomeArquivo");
    if (campo && campo.textContent.includes("Carregando")) {
      campo.textContent = `📌 Último mês carregado primeiro: ${ultimo.mes}/${ultimo.ano}`;
    }
  } catch (erro) {
    console.warn("Não foi possível aplicar último mês primeiro:", erro);
  }
}

/* Reaplica após carregamento do Supabase/local e criação dos filtros */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(ccoAplicarUltimoMesPrimeiro, 1800);
  setTimeout(ccoAplicarUltimoMesPrimeiro, 3500);
  setTimeout(ccoAplicarUltimoMesPrimeiro, 6000);
});


/* =====================================================
   PATCH COMPARATIVO MENSAL POR SERVIÇO
   - Coloca o comparativo por serviço como principal
   - Corrige gráfico com filtro
   - Oculta gráfico comparativo mensal geral sem filtro
===================================================== */

let graficoComparativoServicoCorrigido = null;

function ccoMesNomeCurto(mes) {
  const nomes = {
    "01":"Jan", "02":"Fev", "03":"Mar", "04":"Abr",
    "05":"Mai", "06":"Jun", "07":"Jul", "08":"Ago",
    "09":"Set", "10":"Out", "11":"Nov", "12":"Dez"
  };
  return nomes[String(mes).padStart(2, "0")] || mes;
}

function ccoValorOperacionalPorServicoComparativo(servico, lista) {
  servico = String(servico || "").toUpperCase();

  if (servico === "P12") {
    const somaExecutado = lista.reduce((s, i) => s + numero(i.executado || i.peso || 0), 0);
    return somaExecutado;
  }

  if (["P1", "P4"].includes(servico)) {
    return lista.reduce((s, i) => s + numero(i.peso || i.peso_t || 0), 0);
  }

  if (["P2.1", "P2.2"].includes(servico)) {
    return lista.reduce((s, i) => s + numero(i.viagens || 0), 0);
  }

  if (["P5", "P6"].includes(servico)) {
    return lista.reduce((s, i) => s + numero(i.km || i.km_total || 0), 0);
  }

  return lista.reduce((s, i) => s + numero(i.equipe || 0), 0);
}

function ccoUnidadeServicoComparativo(servico) {
  servico = String(servico || "").toUpperCase();

  if (["P1", "P4"].includes(servico)) return "Peso";
  if (["P2.1", "P2.2"].includes(servico)) return "Viagens";
  if (["P5", "P6"].includes(servico)) return "KM";
  if (servico === "P12") return "Executado";
  return "Equipe";
}

function ccoServicoSelecionadoComparativo() {
  const ids = [
    "filtroComparativoServico",
    "filtroServicoComparativo",
    "comparativoServicoFiltro",
    "servicoComparativo",
    "filtroServicoMensal"
  ];

  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && el.value) return el.value;
  }

  const select = document.querySelector("#tela-comparativo select[id*='Servico'], #tela-comparativo select[id*='servico']");
  if (select && select.value) return select.value;

  const servicos = [...new Set((operacoesOriginal || []).map(i => i.servico).filter(Boolean))].sort();
  return servicos[0] || "P1";
}

function ccoAnoSelecionadoComparativo() {
  const ids = [
    "filtroComparativoAno",
    "filtroAnoComparativo",
    "comparativoAnoFiltro",
    "anoComparativo",
    "filtroAnoMensal"
  ];

  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && el.value) return el.value;
  }

  const anos = [...new Set((operacoesOriginal || [])
    .map(i => String(i.ano || (i.data_normalizada || "").substring(0,4) || ""))
    .filter(Boolean))].sort();

  return anos[anos.length - 1] || "";
}

function ccoPopularFiltrosComparativoServico() {
  const servicos = [...new Set((operacoesOriginal || []).map(i => i.servico).filter(Boolean))].sort();
  const anos = [...new Set((operacoesOriginal || [])
    .map(i => String(i.ano || (i.data_normalizada || "").substring(0,4) || ""))
    .filter(Boolean))].sort();

  const selectsServico = document.querySelectorAll("#tela-comparativo select[id*='Servico'], #tela-comparativo select[id*='servico']");
  selectsServico.forEach(select => {
    const atual = select.value;
    if (!select.dataset.ccoPreenchidoServico) {
      select.innerHTML = servicos.map(s => `<option value="${s}">${s}</option>`).join("");
      select.dataset.ccoPreenchidoServico = "1";
    }
    if (servicos.includes(atual)) select.value = atual;
    select.onchange = renderComparativoMensalPorServicoCorrigido;
  });

  const selectsAno = document.querySelectorAll("#tela-comparativo select[id*='Ano'], #tela-comparativo select[id*='ano']");
  selectsAno.forEach(select => {
    const atual = select.value;
    if (!select.dataset.ccoPreenchidoAno) {
      select.innerHTML = `<option value="">Todos os anos</option>` + anos.map(a => `<option value="${a}">${a}</option>`).join("");
      select.dataset.ccoPreenchidoAno = "1";
    }
    if (anos.includes(atual)) select.value = atual;
    select.onchange = renderComparativoMensalPorServicoCorrigido;
  });
}

function ccoObterCanvasComparativoServico() {
  const ids = [
    "graficoComparativoServico",
    "graficoComparativoMensalServico",
    "graficoComparativoPorServico",
    "graficoServicoComparativo",
    "graficoComparativoMensalPorServico"
  ];

  for (const id of ids) {
    const canvas = document.getElementById(id);
    if (canvas) return canvas;
  }

  const tela = document.getElementById("tela-comparativo");
  if (!tela) return null;

  const canvas = document.createElement("canvas");
  canvas.id = "graficoComparativoServico";
  canvas.height = 130;

  const box = document.createElement("section");
  box.className = "section chart-card comparativo-servico-topo";
  box.innerHTML = `
    <div class="section-title">
      <span>Comparativo filtrado</span>
      <h2>Comparativo mensal por serviço</h2>
    </div>
  `;
  box.appendChild(canvas);

  tela.prepend(box);
  return canvas;
}

function ccoOcultarComparativoMensalGeral() {
  const tela = document.getElementById("tela-comparativo");
  if (!tela) return;

  const canvases = tela.querySelectorAll("canvas");

  canvases.forEach(canvas => {
    const id = String(canvas.id || "").toLowerCase();

    const ehServico =
      id.includes("servico") ||
      id.includes("porservico");

    const ehGeral =
      id.includes("graficocomparativomensal") ||
      id.includes("graficoexecucaomensal") ||
      id.includes("graficopizzamensal") ||
      id.includes("graficopesomensal") ||
      id.includes("graficokmmensal") ||
      id.includes("graficoviagensmensal") ||
      id.includes("graficoequipemensal");

    if (ehGeral && !ehServico) {
      const card = canvas.closest(".section, .chart-card, .grafico-card, .card");
      if (card) card.style.display = "none";
      else canvas.style.display = "none";
    }
  });
}

function ccoMoverComparativoServicoParaTopo() {
  const tela = document.getElementById("tela-comparativo");
  if (!tela) return;

  let alvo = null;
  const candidatos = tela.querySelectorAll(".section, .chart-card, .filter-panel");

  candidatos.forEach(el => {
    const texto = (el.textContent || "").toLowerCase();
    const temCanvasServico = !!el.querySelector("canvas[id*='Servico'], canvas[id*='servico']");
    if (!alvo && (texto.includes("comparativo mensal por serviço") || temCanvasServico)) {
      alvo = el;
    }
  });

  if (alvo) {
    alvo.classList.add("comparativo-servico-topo");
    tela.prepend(alvo);
  }
}

function renderComparativoMensalPorServicoCorrigido() {
  try {
    ccoPopularFiltrosComparativoServico();

    const canvas = ccoObterCanvasComparativoServico();
    if (!canvas || !window.Chart) return;

    const servico = ccoServicoSelecionadoComparativo();
    const anoFiltro = ccoAnoSelecionadoComparativo();

    const dados = (operacoesOriginal || []).filter(item => {
      const ano = String(item.ano || (item.data_normalizada || "").substring(0,4) || "");
      return item.servico === servico && (!anoFiltro || ano === anoFiltro);
    });

    const mapa = {};

    dados.forEach(item => {
      const data = item.data_normalizada || item.data_operacao || "";
      const ano = String(item.ano || data.substring(0,4) || "");
      const mes = String(item.mes || data.substring(5,7) || "").padStart(2, "0");

      if (!ano || !mes || mes === "00") return;

      const chave = `${ano}-${mes}`;
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(item);
    });

    const labels = Object.keys(mapa).sort();
    const valores = labels.map(chave => ccoValorOperacionalPorServicoComparativo(servico, mapa[chave]));

    if (graficoComparativoServicoCorrigido) {
      graficoComparativoServicoCorrigido.destroy();
      graficoComparativoServicoCorrigido = null;
    }

    const existente = Chart.getChart ? Chart.getChart(canvas) : null;
    if (existente) existente.destroy();

    const unidade = ccoUnidadeServicoComparativo(servico);

    graficoComparativoServicoCorrigido = new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels.map(chave => {
          const [ano, mes] = chave.split("-");
          return `${ccoMesNomeCurto(mes)}/${ano}`;
        }),
        datasets: [{
          label: `${servico} - ${unidade}`,
          data: valores,
          borderWidth: 1,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          datalabels: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${unidade}: ${formatarNumero ? formatarNumero(ctx.raw) : ctx.raw}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true },
          x: { grid: { display: false } }
        }
      }
    });

    const aviso = document.getElementById("avisoComparativoServico") || document.getElementById("resumoComparativoServico");
    if (aviso) {
      aviso.innerHTML = `<strong>Filtro aplicado:</strong> ${servico}${anoFiltro ? " • Ano " + anoFiltro : ""}.`;
    }

    ccoOcultarComparativoMensalGeral();
    ccoMoverComparativoServicoParaTopo();

  } catch (erro) {
    console.error("Erro no comparativo mensal por serviço corrigido:", erro);
  }
}

/* Sobrescreve chamadas antigas sem quebrar botões existentes */
if (typeof window !== "undefined") {
  window.renderComparativoMensalPorServico = renderComparativoMensalPorServicoCorrigido;
  window.renderGraficoComparativoMensalPorServico = renderComparativoMensalPorServicoCorrigido;
  window.aplicarFiltroComparativoMensal = renderComparativoMensalPorServicoCorrigido;
  window.aplicarFiltroComparativoServico = renderComparativoMensalPorServicoCorrigido;
}

/* Após o dashboard carregar */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    ccoOcultarComparativoMensalGeral();
    ccoMoverComparativoServicoParaTopo();
    renderComparativoMensalPorServicoCorrigido();
  }, 2200);

  setTimeout(() => {
    ccoOcultarComparativoMensalGeral();
    ccoMoverComparativoServicoParaTopo();
    renderComparativoMensalPorServicoCorrigido();
  }, 5000);
});


/* =====================================================
   PATCH FINAL SUPABASE OFICIAL - GITHUB PAGES
   Objetivo:
   - Não depender de resumo local nem IndexedDB.
   - Carregar automaticamente dados das tabelas operacoes/painel_executivo.
   - Se necessário, reconstruir pela planilhas_importadas.
   - Corrigir mensagem de erro para mostrar detalhe real.
===================================================== */

function ccoLogErroSupabaseFinal(rotulo, erro) {
  try {
    console.error(rotulo, {
      message: erro?.message || "",
      details: erro?.details || "",
      hint: erro?.hint || "",
      code: erro?.code || "",
      raw: erro
    });
  } catch {
    console.error(rotulo, erro);
  }
}

function ccoMesNomeCompletoFinal(mes) {
  return MESES_BR[String(mes).padStart(2, "0")] || mes || "-";
}

function ccoStatusSistema(texto) {
  try {
    preencherTexto("nomeArquivo", texto);
  } catch {
    const el = document.getElementById("nomeArquivo");
    if (el) el.textContent = texto;
  }
}

function ccoLinhaBancoParaOperacao(item) {
  return {
    servico: item.servico || "",
    origem: "Banco Supabase",
    data: item.data_operacao || "",
    data_normalizada: item.data_operacao || "",
    turno: item.turno || "",
    ra: item.ra || "Por demanda",
    setor: "",
    peso: numero(item.peso_t),
    viagens: numero(item.viagens),
    km: numero(item.km_total),
    equipe: numero(item.equipe),
    executado: numero(item.executado),
    status: "Com dados"
  };
}

function ccoLinhaPainelBanco(item) {
  return {
    servico: item.servico || "",
    nome_servico: item.nome_servico || "",
    acumulado_mes: numero(item.acumulado),
    medicao: item.medicao || "",
    previsto_mes: numero(item.previsto),
    porcentagem_execucao: numero(item.percentual),
    dias_acumulados: numero(item.dias_acumulados),
    total_dias_mes: numero(item.total_dias_mes),
    valor: numero(item.valor),
    status: numero(item.acumulado) > 0 ? "Com dados" : "Sem dados"
  };
}

function ccoCalcularPainelBasicoDoBanco(importacao, operacoesBanco) {
  const servicos = [...new Set((operacoesBanco || []).map(i => i.servico).filter(Boolean))].sort();

  return servicos.map(servico => {
    const lista = (operacoesBanco || []).filter(i => i.servico === servico);
    const ops = lista.map(ccoLinhaBancoParaOperacao);
    const acumulado = calcularAcumuladoPorServico(servico, ops, 0);
    const valorUnitario = VALORES_FIXOS[servico] || 0;

    return {
      servico,
      nome_servico: "Serviço operacional",
      acumulado_mes: acumulado,
      medicao: "",
      previsto_mes: 0,
      porcentagem_execucao: 0,
      dias_acumulados: contarDiasDistintos ? contarDiasDistintos(ops) : 0,
      total_dias_mes: calcularTotalDiasMes ? calcularTotalDiasMes(importacao.ano, String(importacao.mes).padStart(2, "0")) : 0,
      valor: valorUnitario * acumulado,
      status: acumulado > 0 ? "Com dados" : "Sem dados"
    };
  });
}

async function ccoCarregarPorPlanilhasImportadasFallback(importacao) {
  try {
    const { data, error } = await banco
      .from("planilhas_importadas")
      .select("*")
      .eq("importacao_id", importacao.id)
      .order("id", { ascending: true });

    if (error || !data || !data.length) {
      if (error) ccoLogErroSupabaseFinal("Fallback planilhas_importadas falhou:", error);
      return false;
    }

    limparMemoria();

    const mapaAbas = {};

    data.forEach(item => {
      const nomeNormalizado = normalizar(item.aba);

      if (!mapaAbas[nomeNormalizado]) {
        mapaAbas[nomeNormalizado] = {
          arquivo: item.nome_arquivo,
          nomeOriginal: item.aba,
          codigoServico: item.codigo_servico,
          dadosOriginais: []
        };
      }

      if (Array.isArray(item.dados)) {
        mapaAbas[nomeNormalizado].dadosOriginais.push(...item.dados);
      }
    });

    Object.keys(mapaAbas).forEach(nome => {
      const aba = mapaAbas[nome];

      sheetsOriginais[nome] = {
        nomeOriginal: aba.nomeOriginal,
        codigoServico: aba.codigoServico,
        dadosOriginais: aba.dadosOriginais,
        dadosNormalizados: aba.dadosOriginais.map(linha => normalizarObjeto(linha))
      };

      todasAsAbas.push({
        arquivo: aba.arquivo,
        aba: aba.nomeOriginal,
        linhas: aba.dadosOriginais.length
      });
    });

    if (!sheetsOriginais["painel executivo"]) {
      console.warn("Fallback carregou planilhas, mas não achou Painel Executivo.", Object.keys(sheetsOriginais));
      return false;
    }

    gerarOperacoes();
    if (typeof removerDuplicidadeOperacoes === "function") removerDuplicidadeOperacoes();
    gerarPainelExecutivo();

    painelExecutivoOriginal = clonar(painelExecutivo);
    operacoesOriginal = clonar(operacoes);

    atualizarDashboard();
    aplicarRestricoesPerfil();

    ccoStatusSistema(
      `Banco carregado via planilhas_importadas: ${todasAsAbas.length} aba(s) | ${operacoes.length} registros`
    );

    return true;
  } catch (erro) {
    ccoLogErroSupabaseFinal("Erro geral fallback planilhas_importadas:", erro);
    return false;
  }
}

async function carregarBaseSupabase() {
  if (!garantirSupabaseClienteFinal || !garantirSupabaseClienteFinal()) {
    ccoStatusSistema("Supabase não carregado. Verifique conexão e biblioteca.");
    return false;
  }

  try {
    ccoStatusSistema("🔄 Carregando dados oficiais do Supabase...");

    const { data: ultimas, error: erroUltima } = await banco
      .from("importacoes")
      .select("*")
      .order("ano", { ascending: false, nullsFirst: false })
      .order("mes", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(1);

    if (erroUltima) {
      ccoLogErroSupabaseFinal("Erro ao buscar última importação:", erroUltima);
      ccoStatusSistema("Erro ao buscar última importação no Supabase.");
      return false;
    }

    if (!ultimas || !ultimas.length) {
      ccoStatusSistema("🟢 Nenhuma base no Supabase. Importe a planilha para iniciar.");
      return false;
    }

    const importacao = ultimas[0];

    const painelReq = await banco
      .from("painel_executivo")
      .select("*")
      .eq("importacao_id", importacao.id)
      .order("servico", { ascending: true });

    const operacoesReq = await banco
      .from("operacoes")
      .select("*")
      .order("ano", { ascending: false, nullsFirst: false })
      .order("mes", { ascending: false, nullsFirst: false })
      .order("data_operacao", { ascending: false });

    if (painelReq.error || operacoesReq.error) {
      if (painelReq.error) ccoLogErroSupabaseFinal("Erro painel_executivo:", painelReq.error);
      if (operacoesReq.error) ccoLogErroSupabaseFinal("Erro operacoes:", operacoesReq.error);

      // Compatibilidade: tenta reconstruir pela tabela antiga planilhas_importadas
      return await ccoCarregarPorPlanilhasImportadasFallback(importacao);
    }

    const painelBanco = painelReq.data || [];
    const operacoesBanco = operacoesReq.data || [];

    if (!operacoesBanco.length && !painelBanco.length) {
      const fallbackOk = await ccoCarregarPorPlanilhasImportadasFallback(importacao);
      if (fallbackOk) return true;

      ccoStatusSistema("Supabase conectado, mas não há registros em operacoes/painel.");
      return false;
    }

    limparMemoria();

    operacoes = operacoesBanco.map(ccoLinhaBancoParaOperacao);
    operacoesOriginal = clonar(operacoes);

    painelExecutivo = painelBanco.length
      ? painelBanco.map(ccoLinhaPainelBanco)
      : ccoCalcularPainelBasicoDoBanco(importacao, operacoesBanco);

    painelExecutivoOriginal = clonar(painelExecutivo);

    todasAsAbas = [{
      arquivo: importacao.nome_arquivo || "Banco Supabase",
      aba: "Dados oficiais",
      linhas: operacoes.length
    }];

    sheetsOriginais = {};

    atualizarDashboard();
    aplicarRestricoesPerfil();

    // Aplica último mês nos filtros sem depender do resumo local.
    setTimeout(() => {
      if (typeof ccoAplicarUltimoMesPrimeiro === "function") {
        ccoAplicarUltimoMesPrimeiro();
      }
    }, 200);

    const mesNome = ccoMesNomeCompletoFinal(importacao.mes);
    ccoStatusSistema(
      `Banco carregado: último mês ${mesNome}/${importacao.ano || "-"} primeiro | ${operacoes.length} registros em todos os meses`
    );

    console.log("✅ Supabase carregado automaticamente:", {
      importacao,
      painel: painelExecutivo.length,
      operacoes: operacoes.length
    });

    return true;

  } catch (erro) {
    ccoLogErroSupabaseFinal("Erro geral ao carregar Supabase:", erro);
    ccoStatusSistema("Erro geral ao carregar Supabase. Veja o Console.");
    return false;
  }
}

function carregarResumoLocal() {
  ccoStatusSistema("Resumo local ignorado. A fonte oficial é o Supabase.");
  console.warn("Resumo local ignorado. A fonte oficial deve vir do Supabase.");
  atualizarDashboard();
  aplicarRestricoesPerfil();
  return false;
}

/* =====================================================
   PATCH FINAL SALVAR SUPABASE EM TABELAS OFICIAIS
   Grava planilhas_importadas + operacoes + painel_executivo.
===================================================== */
async function salvarBaseCompletaSupabase(nomeArquivo) {
  if (!garantirSupabaseClienteFinal || !garantirSupabaseClienteFinal()) {
    console.warn("Supabase indisponível.");
    return false;
  }

  let importacao = null;

  try {
    const usuario = obterUsuarioLogado();
    const periodo = typeof obterPeriodoImportado === "function"
      ? obterPeriodoImportado()
      : { ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 };

    const { data: importacoesMesmoPeriodo, error: erroBuscaPeriodo } = await banco
      .from("importacoes")
      .select("id")
      .eq("ano", periodo.ano)
      .eq("mes", periodo.mes);

    if (erroBuscaPeriodo) {
      ccoLogErroSupabaseFinal("Erro ao buscar importações do período:", erroBuscaPeriodo);
      return false;
    }

    const ids = (importacoesMesmoPeriodo || []).map(i => i.id);

    if (ids.length) {
      await banco.from("operacoes").delete().in("importacao_id", ids);
      await banco.from("painel_executivo").delete().in("importacao_id", ids);
      await banco.from("planilhas_importadas").delete().in("importacao_id", ids);
      await banco.from("importacoes").delete().in("id", ids);
    }

    await banco.from("importacoes").update({ ativo: false }).eq("ativo", true);

    const { data, error: erroImportacao } = await banco
      .from("importacoes")
      .insert({
        nome_arquivo: nomeArquivo,
        usuario: usuario.usuario || "Não identificado",
        perfil: usuario.perfil || "Sem perfil",
        total_abas: todasAsAbas.length,
        mes: periodo.mes,
        ano: periodo.ano,
        tipo_importacao: "substituir_periodo_power_query",
        ativo: true
      })
      .select()
      .single();

    if (erroImportacao) {
      ccoLogErroSupabaseFinal("Erro ao criar importação:", erroImportacao);
      return false;
    }

    importacao = data;

    for (const nomeAba of Object.keys(sheetsOriginais || {})) {
      const aba = sheetsOriginais[nomeAba];
      const dadosAba = aba.dadosOriginais || [];

      // Divide dados grandes em lotes para evitar payload grande
      const lotes = typeof dividirEmLotesSupabase === "function"
        ? dividirEmLotesSupabase(dadosAba, 50)
        : [dadosAba];

      for (const lote of lotes) {
        const { error: erroAba } = await banco
          .from("planilhas_importadas")
          .insert({
            nome_arquivo: nomeArquivo,
            aba: aba.nomeOriginal,
            codigo_servico: aba.codigoServico || "GERAL",
            dados: sanitizarParaSupabase(lote),
            importacao_id: importacao.id
          });

        if (erroAba) {
          ccoLogErroSupabaseFinal(`Erro ao salvar aba ${aba.nomeOriginal}:`, erroAba);
          return false;
        }
      }
    }

    const linhasOperacoes = typeof montarLinhasOperacoesSupabase === "function"
      ? montarLinhasOperacoesSupabase(importacao.id)
      : [];

    const linhasPainel = typeof montarLinhasPainelSupabase === "function"
      ? montarLinhasPainelSupabase(importacao.id, periodo)
      : [];

    const salvouOperacoes = typeof inserirEmLotes === "function"
      ? await inserirEmLotes("operacoes", linhasOperacoes, 500)
      : true;

    if (!salvouOperacoes) return false;

    const salvouPainel = typeof inserirEmLotes === "function"
      ? await inserirEmLotes("painel_executivo", linhasPainel, 500)
      : true;

    if (!salvouPainel) return false;

    return true;

  } catch (erro) {
    ccoLogErroSupabaseFinal("Erro geral ao salvar Supabase:", erro);

    if (importacao?.id) {
      try {
        await banco.from("importacoes").delete().eq("id", importacao.id);
      } catch {}
    }

    return false;
  }
}

/* Pequena correção visual da mensagem inicial */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const el = document.getElementById("nomeArquivo");
    if (el && String(el.textContent || "").includes("Carregando dados da base")) {
      el.textContent = "🔄 Conectando ao Supabase...";
    }
  }, 800);
});

/* =====================================================
   AJUSTE FINAL • COMPARAÇÃO MENSAL COM FILTRO
   - Mantém um único gráfico na página Comparativo Mensal.
   - Filtro por Serviço e Ano.
   - Remove/ignora gráficos mensais antigos que ficavam em cima/baixo.
===================================================== */

let graficoComparativoMensalFiltroFinal = null;

function ccoComparativoNumeroSeguro(valor) {
  if (typeof numero === "function") return numero(valor);
  const n = Number(String(valor ?? 0).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function ccoComparativoFormatarNumero(valor) {
  if (typeof formatarNumero === "function") return formatarNumero(valor);
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function ccoComparativoMesBrasil(chave) {
  if (typeof formatarMesBrasil === "function") return formatarMesBrasil(chave);
  const [ano, mes] = String(chave).split("-");
  const nomes = {"01":"Jan","02":"Fev","03":"Mar","04":"Abr","05":"Mai","06":"Jun","07":"Jul","08":"Ago","09":"Set","10":"Out","11":"Nov","12":"Dez"};
  return `${nomes[mes] || mes}/${ano}`;
}

function ccoComparativoUnidadeServico(servico) {
  servico = String(servico || "").toUpperCase();
  if (["P1", "P4"].includes(servico)) return { campo: "peso", titulo: "Peso (t)" };
  if (["P2.1", "P2.2"].includes(servico)) return { campo: "viagens", titulo: "Viagens" };
  if (["P5", "P6"].includes(servico)) return { campo: "km", titulo: "KM" };
  if (servico === "P12") return { campo: "executado", titulo: "Executado" };
  return { campo: "equipe", titulo: "Equipes" };
}


/* função duplicada removida: carregarFiltrosComparativoServico */



/* função duplicada removida: renderComparativoMensalPorServico */


function ccoRemoverGraficosComparativoAntigos() {
  const tela = document.getElementById("tela-comparativo");
  if (!tela) return;

  [
    "graficoComparativoServico",
    "graficoPesoMensal",
    "graficoKmMensal",
    "graficoViagensMensal",
    "graficoEquipeMensal",
    "graficoExecucaoMensal",
    "graficoPizzaMensal"
  ].forEach(id => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const chart = window.Chart?.getChart ? Chart.getChart(canvas) : null;
    if (chart) chart.destroy();
    const card = canvas.closest(".section, .chart-card");
    if (card && id !== "graficoComparativoServicoMensal") card.style.display = "none";
  });
}

const atualizarDashboardOriginalComparativoFiltro = atualizarDashboard;
atualizarDashboard = function() {
  atualizarDashboardOriginalComparativoFiltro();
  carregarFiltrosComparativoServico();
  ccoRemoverGraficosComparativoAntigos();
  renderComparativoMensalPorServico();
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    carregarFiltrosComparativoServico();
    ccoRemoverGraficosComparativoAntigos();
    renderComparativoMensalPorServico();
  }, 1200);

  setTimeout(() => {
    carregarFiltrosComparativoServico();
    ccoRemoverGraficosComparativoAntigos();
    renderComparativoMensalPorServico();
  }, 3000);
});


/*
========================================================
PATCH FINAL SOLICITADO PELO USUÁRIO • 2026-06-02
1) Execução P1 a P12: oculta completamente cards/estruturas de gráficos sem dados.
2) Comparativo Mensal: corrige gráfico de comparação mensal com filtros Serviço/Ano.
3) KPI: corrige gráfico "Execução diária do serviço".
4) Variação mensal: eixo Y não inicia obrigatoriamente em zero.
========================================================
*/

let ccoGraficoExecDetalheEvolucaoFinal = null;
let ccoGraficoExecDetalhePesoFinal = null;
let ccoGraficoExecDetalheViagensFinal = null;
let ccoGraficoExecDetalheKmFinal = null;
let ccoGraficoExecDetalheEquipeFinal = null;
let ccoGraficoExecDetalheHorasFinal = null;
let ccoGraficoExecDetalheDistanciaFinal = null;
let ccoGraficoExecDetalheTempoFinal = null;

function ccoFinalNumero(valor) {
  if (typeof numero === "function") return numero(valor);
  const n = Number(String(valor ?? 0).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function ccoFinalFormatarNumero(valor) {
  if (typeof formatarNumero === "function") return formatarNumero(valor);
  return ccoFinalNumero(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function ccoFinalMesBrasil(mesAno) {
  if (typeof formatarMesBrasil === "function") return formatarMesBrasil(mesAno);
  const [ano, mes] = String(mesAno).split("-");
  const meses = { "01":"Jan", "02":"Fev", "03":"Mar", "04":"Abr", "05":"Mai", "06":"Jun", "07":"Jul", "08":"Ago", "09":"Set", "10":"Out", "11":"Nov", "12":"Dez" };
  return `${meses[mes] || mes}/${ano}`;
}

function ccoFinalDestruirGraficoCanvas(canvasId) {
  try {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart || !Chart.getChart) return;
    const chart = Chart.getChart(canvas);
    if (chart) chart.destroy();
  } catch {}
}

function ccoFinalTemValor(lista, campo) {
  return (lista || []).some(item => ccoFinalNumero(item[campo]) > 0);
}

function ccoFinalSecaoGrafico(tag, titulo, canvasId) {
  return `
    <section class="section chart-card" id="secao-${canvasId}">
      <div class="section-title">
        <span>${tag}</span>
        <h2>${titulo}</h2>
      </div>
      <canvas id="${canvasId}"></canvas>
    </section>
  `;
}

function ccoFinalMostrarSecaoCanvas(canvasId, mostrar) {
  const canvas = document.getElementById(canvasId);
  const secao = canvas?.closest(".section, .chart-card");
  if (!secao) return;
  secao.style.display = mostrar ? "" : "none";
}

function ccoFinalOpcoesGrafico(beginZero = true) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      datalabels: { display: false }
    },
    scales: {
      x: { grid: { color: "rgba(15,23,42,.06)" } },
      y: { beginAtZero: beginZero, grid: { color: "rgba(15,23,42,.08)" } }
    }
  };
}

function ccoFinalAgruparPorMesServico(dados, codigo) {
  const mapa = {};
  (dados || []).forEach(item => {
    if (!item.data_normalizada) return;
    const mesAno = item.data_normalizada.substring(0, 7);
    if (!mapa[mesAno]) {
      mapa[mesAno] = {
        mesAno,
        mesBrasil: ccoFinalMesBrasil(mesAno),
        executado: 0,
        peso: 0,
        viagens: 0,
        km: 0,
        equipe: 0,
        horas: 0,
        distanciaMedia: 0,
        tempoMedio: 0
      };
    }

    mapa[mesAno].executado += typeof obterExecutadoKpiPorServico === "function"
      ? obterExecutadoKpiPorServico(codigo, item)
      : (ccoFinalNumero(item.peso) + ccoFinalNumero(item.viagens) + ccoFinalNumero(item.km) + ccoFinalNumero(item.equipe));

    mapa[mesAno].peso += ccoFinalNumero(item.peso);
    mapa[mesAno].viagens += ccoFinalNumero(item.viagens);
    mapa[mesAno].km += typeof ccoKmTotalLinha === "function" ? ccoKmTotalLinha(item) : ccoFinalNumero(item.km);
    mapa[mesAno].equipe += ccoFinalNumero(item.equipe);
    mapa[mesAno].horas += typeof ccoTempoProdutivoLinha === "function" ? ccoTempoProdutivoLinha(item) : ccoFinalNumero(item.tempo_produtivo_h);
  });

  return Object.values(mapa).sort((a, b) => a.mesAno.localeCompare(b.mesAno)).map(item => ({
    ...item,
    distanciaMedia: item.viagens > 0 ? item.km / item.viagens : 0,
    tempoMedio: item.viagens > 0 ? ((item.horas || 0) / item.viagens) : 0
  }));
}

function ccoFinalAgruparPorTurno(dados) {
  const mapa = {};
  (dados || []).forEach(item => {
    const turno = String(item.turno || "Sem turno").trim() || "Sem turno";
    if (!mapa[turno]) {
      mapa[turno] = { turno, peso: 0, viagens: 0, km: 0, equipe: 0, horas: 0, tempoRD: 0 };
    }
    mapa[turno].peso += ccoFinalNumero(item.peso);
    mapa[turno].viagens += ccoFinalNumero(item.viagens);
    mapa[turno].km += typeof ccoKmTotalLinha === "function" ? ccoKmTotalLinha(item) : ccoFinalNumero(item.km);
    mapa[turno].equipe += ccoFinalNumero(item.equipe);
    mapa[turno].horas += typeof ccoTempoProdutivoLinha === "function" ? ccoTempoProdutivoLinha(item) : ccoFinalNumero(item.tempo_produtivo_h);
    mapa[turno].tempoRD += typeof ccoTempoRDHorasCorrigido === "function" ? ccoTempoRDHorasCorrigido(item) : ccoFinalNumero(item.tempo_rd_horas);
  });
  return Object.values(mapa).sort((a,b) => a.turno.localeCompare(b.turno));
}

function ccoFinalCriarBarra(canvasId, label, labels, valores, beginZero = true) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const temDados = (valores || []).some(v => ccoFinalNumero(v) > 0);
  ccoFinalMostrarSecaoCanvas(canvasId, temDados);
  ccoFinalDestruirGraficoCanvas(canvasId);
  if (!temDados) return null;

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data: valores.map(v => Number(ccoFinalNumero(v).toFixed(2))),
        borderRadius: 10,
        borderWidth: 1
      }]
    },
    options: ccoFinalOpcoesGrafico(beginZero)
  });
}

function ccoFinalCriarLinha(canvasId, label, labels, valores, beginZero = true) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const temDados = (valores || []).some(v => ccoFinalNumero(v) !== 0);
  ccoFinalMostrarSecaoCanvas(canvasId, temDados);
  ccoFinalDestruirGraficoCanvas(canvasId);
  if (!temDados) return null;

  return new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data: valores.map(v => Number(ccoFinalNumero(v).toFixed(2))),
        borderWidth: 3,
        tension: .35,
        fill: false,
        pointRadius: 4
      }]
    },
    options: ccoFinalOpcoesGrafico(beginZero)
  });
}

/* Execução P1 a P12: recria a área do serviço apenas com gráficos que têm dados. */
function renderDetalheServicoMensal(codigo) {
  const detalhe = document.getElementById("detalheServico");
  if (!detalhe) return;
  const cardKmPermanente = document.getElementById("cardKmExecutado");
  const reservatorioCards = document.getElementById("cardsPermanentesExecucao");
  if (cardKmPermanente && reservatorioCards && cardKmPermanente.parentElement !== reservatorioCards) reservatorioCards.appendChild(cardKmPermanente);

  const { painel, periodo } = gerarPainelExecucaoMensal();
  const dadosPainel = painel.find(item => item.servico === codigo);
  const dadosServico = (periodo.dados || []).filter(item => item.servico === codigo);

  if (!dadosPainel) {
    detalhe.innerHTML = `<div class="not-found">Serviço não encontrado.</div>`;
    return;
  }

  [
    "graficoExecDetalheEvolucao",
    "graficoExecDetalhePeso",
    "graficoExecDetalheViagens",
    "graficoExecDetalheKm",
    "graficoExecDetalheEquipe",
    "graficoExecDetalheHoras",
    "graficoExecDetalheDistancia",
    "graficoExecDetalheTempo"
  ].forEach(ccoFinalDestruirGraficoCanvas);

  const previsto = ccoFinalNumero(dadosPainel.previsto_mes);
  const executado = ccoFinalNumero(dadosPainel.acumulado_mes);
  const percentual = ccoFinalNumero(dadosPainel.porcentagem_execucao);
  const status = typeof obterStatusExecucao === "function"
    ? obterStatusExecucao(percentual, executado)
    : (executado > 0 ? (percentual >= 100 ? "Atingido" : "Não atingido") : "Sem dados");

  const totalPeso = dadosServico.reduce((s, i) => s + ccoFinalNumero(i.peso), 0);
  const totalViagens = dadosServico.reduce((s, i) => s + ccoFinalNumero(i.viagens), 0);
  const importacaoAtivaId = window.__CCO_IMPORTACAO_ATIVA__?.importacao_id || window.__CCO_IMPORTACAO_ATIVA__?.id || periodo?.importacao_id;
  const rawP1Atual = window.__CCO_P1_KM_RAW__;
  const totalKmOperacoes = dadosServico.reduce((s, i) => s + (typeof ccoKmTotalLinha === "function" ? ccoKmTotalLinha(i) : ccoFinalNumero(i.km_total)), 0);
  const totalKm = codigo === "P1" && rawP1Atual && String(rawP1Atual.importacaoId) === String(importacaoAtivaId)
    ? ccoFinalNumero(rawP1Atual.somaKmTotal)
    : totalKmOperacoes;
  if (codigo === "P1") {
    const auditoriaKm = window.auditarCamposKmP1CCO?.(dadosServico) || { camposEncontrados: [], camposIgnorados: [] };
    console.log("[P1 KM TOTAL]", {
      periodo: periodo?.periodo || window.__CCO_PERIODO_ATUAL__ || "",
      registros: dadosServico.length,
      somaKmTotal: totalKm,
      amostra: dadosServico.slice(0, 5).map(item => ({
        km_total: item?.km_total,
        dadosKmTotal: item?.dados?.Km_Total,
        originalKmTotal: item?.dados_originais?.Km_Total
      })),
      ...auditoriaKm
    });
  }
  const totalEquipes = dadosServico.reduce((s, i) => s + ccoFinalNumero(i.equipe), 0);
  const totalHoras = dadosServico.reduce((s, i) => s + (typeof ccoTempoProdutivoLinha === "function" ? ccoTempoProdutivoLinha(i) : ccoFinalNumero(i.tempo_produtivo_h)), 0);
  const totalTempoRD = dadosServico.reduce((s, i) => s + (typeof ccoTempoRDHorasCorrigido === "function" ? ccoTempoRDHorasCorrigido(i) : ccoFinalNumero(i.tempo_rd_horas)), 0);
  const diasComDados = typeof contarDiasDistintos === "function" ? contarDiasDistintos(dadosServico) : 0;
  const produtividade = totalViagens > 0 ? totalPeso / totalViagens : 0;
  const distanciaMedia = totalViagens > 0 ? totalKm / totalViagens : 0;
  const tempoMedio = totalViagens > 0 ? totalTempoRD / totalViagens : 0;

  const mensal = ccoFinalAgruparPorMesServico(dadosServico, codigo);
  const turno = ccoFinalAgruparPorTurno(dadosServico);
  const turnoDiurno = turno.find(item => /diurno|dia/i.test(item.turno)) || { peso: 0, viagens: 0, km: 0, equipe: 0, horas: 0, tempoRD: 0 };
  const turnoNoturno = turno.find(item => /noturno|noite/i.test(item.turno)) || { peso: 0, viagens: 0, km: 0, equipe: 0, horas: 0, tempoRD: 0 };
  const temDadosTurno = [turnoDiurno, turnoNoturno].some(item => item.peso > 0 || item.viagens > 0 || item.km > 0 || item.equipe > 0 || item.horas > 0);
  const formatarTurno = (valor, casas = 1) => Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: casas });
  const cardTurno = (item, tipo) => {
    const distancia = item.viagens > 0 ? item.km / item.viagens : 0;
    const tempo = item.viagens > 0 ? item.tempoRD / item.viagens : 0;
    const icone = tipo === "diurno"
      ? `<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="astro-core" cx="60" cy="60" r="25"/><g class="sun-rays"><path d="M60 5v18M60 97v18M5 60h18M97 60h18M21 21l13 13M86 86l13 13M99 21 86 34M34 86 21 99"/></g></svg>`
      : `<svg viewBox="0 0 120 120" aria-hidden="true"><path class="moon-core" d="M82 91A43 43 0 0 1 58 10a45 45 0 1 0 24 81Z"/><circle class="moon-star" cx="88" cy="27" r="4"/><path class="moon-star" d="m99 42 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/></svg>`;
    return `<article class="exec-turn-card ${tipo}"><div class="exec-turn-astro">${icone}<strong>${tipo === "diurno" ? "DIURNO" : "NOTURNO"}</strong></div><div class="exec-turn-metrics"><div><span>Peso</span><b>${formatarTurno(item.peso)} <small>t</small></b></div><div><span>KM executado</span><b>${formatarTurno(item.km)} <small>km</small></b></div><div><span>Viagens</span><b>${formatarTurno(item.viagens, 0)}</b></div><div><span>Equipes</span><b>${formatarTurno(item.equipe, 0)}</b></div><div><span>Horas produtivas</span><b>${formatarTurno(item.horas)} <small>h</small></b></div><div><span>KM/viagem</span><b>${formatarTurno(distancia)} <small>km</small></b></div><div><span>Tempo/viagem</span><b>${formatarTurno(tempo)} <small>h</small></b></div></div></article>`;
  };

  const secoes = [];
  if (mensal.some(i => i.executado > 0)) secoes.push(ccoFinalSecaoGrafico("Comparativo mensal", `Evolução do serviço ${codigo}`, "graficoExecDetalheEvolucao"));
  if (temDadosTurno) secoes.push(`<section class="section exec-turn-section"><div class="section-title"><span>Operação por turno</span><h2>Diurno e Noturno</h2><p>Indicadores consolidados dentro de cada período operacional</p></div><div class="exec-turn-visuals">${cardTurno(turnoDiurno, "diurno")}${cardTurno(turnoNoturno, "noturno")}</div></section>`);

  detalhe.innerHTML = `
    <section class="section">
      <div class="section-title">
        <span>Execução mensal</span>
        <h2>${codigo} - ${dadosPainel.nome_servico || "Serviço operacional"}</h2>
      </div>
      <div class="resumo-ia">
        <p>Período analisado: <strong>${periodo.descricao}</strong>.</p>
        <p>Os gráficos sem informação foram ocultados automaticamente.</p>
      </div>
    </section>

    ${secoes.length ? `<div class="execucao-graficos-grid">${secoes.join("")}</div>` : `
      <section class="section">
        <div class="section-title">
          <span>Sem gráficos disponíveis</span>
          <h2>Este serviço não possui indicadores gráficos no período selecionado</h2>
        </div>
      </section>
    `}

    <section class="cards">
      ${criarCard("Previsto Mensal", ccoFinalFormatarNumero(previsto), "meta do mês", false)}
      ${criarCard("Acumulado no Período", ccoFinalFormatarNumero(executado), "acumulado do filtro", false)}
      ${criarCard("% Execução", `${ccoFinalFormatarNumero(percentual)}%`, "índice mensal", false)}
      ${criarCard("Status", status, "situação do serviço", false)}
      ${diasComDados > 0 ? criarCard("Dias com Dados", ccoFinalFormatarNumero(diasComDados), "dias lançados", false) : ""}
      ${totalPeso > 0 ? criarCard("Peso", `${ccoFinalFormatarNumero(totalPeso)} t`, "toneladas lançadas") : ""}
      ${totalViagens > 0 ? criarCard("Viagens", ccoFinalFormatarNumero(totalViagens), "operações") : ""}
      ${codigo !== "P1" && totalKm > 0 ? criarCard("KM Executado", ccoFinalFormatarNumero(totalKm), "quilometragem") : ""}
      ${totalEquipes > 0 ? criarCard("Equipes", ccoFinalFormatarNumero(totalEquipes), "equipes lançadas") : ""}
      ${totalHoras > 0 ? criarCard("Horas Produtivas", `${ccoFinalFormatarNumero(totalHoras)} h`, "tempo produtivo") : ""}
      ${produtividade > 0 ? criarCard("Produtividade", `${ccoFinalFormatarNumero(produtividade)} t/viagem`, "média operacional") : ""}
      ${distanciaMedia > 0 ? criarCard("Distância Média", `${ccoFinalFormatarNumero(distanciaMedia)} km/viagem`, "KM/viagem") : ""}
      ${tempoMedio > 0 ? criarCard("Tempo Médio/Viagem", `${ccoFinalFormatarNumero(tempoMedio)} h/viagem`, "Tempo RD/viagem") : ""}
    </section>
  `;

  if (codigo === "P1" && cardKmPermanente) {
    const gradeCards = detalhe.querySelector(":scope > .cards");
    if (gradeCards) gradeCards.insertBefore(cardKmPermanente, gradeCards.children[7] || null);
    atualizarCardKmExecutadoCCO(totalKm);
  }

  const labelsMes = mensal.map(i => i.mesBrasil);
  ccoGraficoExecDetalheEvolucaoFinal = ccoFinalCriarBarra("graficoExecDetalheEvolucao", "Executado", labelsMes, mensal.map(i => i.executado));
}

/* Comparativo Mensal: serviço + ano, funcionando mesmo após filtros e recarregamentos. */
function ccoComparativoUnidadeServicoFinal(servico) {
  servico = String(servico || "").toUpperCase();
  if (["P1", "P4"].includes(servico)) return { campo: "peso", titulo: "Peso (t)" };
  if (["P2.1", "P2.2"].includes(servico)) return { campo: "viagens", titulo: "Viagens" };
  if (["P5", "P6"].includes(servico)) return { campo: "km", titulo: "KM" };
  if (servico === "P12") return { campo: "executado", titulo: "Executado" };
  return { campo: "equipe", titulo: "Equipes" };
}


/* função duplicada removida: carregarFiltrosComparativoServico */



/* função duplicada removida: renderComparativoMensalPorServico */


/* KPI: corrige o gráfico de execução diária e preserva os demais gráficos. */


/* função duplicada removida: ccoLabelDiaMobileFinal */



/* função duplicada removida: renderGraficosKpiServicoCompleto */


/* Variação mensal: eixo Y ajustado para não começar obrigatoriamente em zero. */
function ccoFinalOpcoesVariacao(valores) {
  const nums = (valores || []).map(ccoFinalNumero).filter(v => Number.isFinite(v));
  const min = nums.length ? Math.min(...nums) : 0;
  const max = nums.length ? Math.max(...nums) : 0;
  const margem = Math.max(5, Math.abs(max - min) * 0.15);

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      datalabels: { display: false },
      tooltip: {
        callbacks: {
          label(context) {
            return `${context.dataset.label || "Variação"}: ${ccoFinalFormatarNumero(context.parsed.y)}%`;
          }
        }
      }
    },
    scales: {
      x: { grid: { color: "rgba(15,23,42,.06)" } },
      y: {
        beginAtZero: false,
        suggestedMin: min - margem,
        suggestedMax: max + margem,
        grid: { color: "rgba(15,23,42,.08)" },
        ticks: { callback: value => `${value}%` }
      }
    }
  };
}

if (typeof renderComparativoDinamicoFinal === "function") {
  const ccoRenderComparativoDinamicoFinalOriginal = renderComparativoDinamicoFinal;
  renderComparativoDinamicoFinal = function() {
    ccoRenderComparativoDinamicoFinalOriginal();

    setTimeout(() => {
      try {
        const canvas = document.getElementById("graficoCompVariacao");
        if (!canvas || !window.Chart) return;
        const dadosMes = typeof ccoDadosComparativoFinal === "function" ? ccoDadosComparativoFinal() : [];
        const variacoes = dadosMes.map(i => ccoFinalNumero(i.variacao));
        const secao = canvas.closest(".section, .chart-card");
        const temDados = variacoes.some(v => v !== 0);

        if (secao) secao.style.display = temDados ? "" : "none";
        ccoFinalDestruirGraficoCanvas("graficoCompVariacao");

        if (temDados) {
          window.graficoCompVariacao = new Chart(canvas, {
            type: "line",
            data: {
              labels: dadosMes.map(i => i.mesBrasil),
              datasets: [{
                label: "Variação mensal (%)",
                data: variacoes.map(v => Number(v.toFixed(2))),
                borderWidth: 3,
                tension: .35,
                fill: false,
                pointRadius: 4
              }]
            },
            options: ccoFinalOpcoesVariacao(variacoes)
          });
        }
      } catch (erro) {
        console.warn("Correção do gráfico de variação não aplicada:", erro);
      }
    }, 60);
  };
}

/* Garante eventos dos filtros e renderização inicial. */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    ["filtroComparativoServico", "filtroComparativoAno"].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.dataset.ccoComparativoFinalEvento !== "sim") {
        el.addEventListener("change", renderComparativoMensalPorServico);
        el.dataset.ccoComparativoFinalEvento = "sim";
      }
    });

    ["filtroKpiServico", "filtroKpiAno", "filtroKpiMes", "filtroKpiDia"].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.dataset.ccoKpiFinalEvento !== "sim") {
        el.addEventListener("change", () => {
          if (typeof renderPaginaKpiPorServicoCompleto === "function") renderPaginaKpiPorServicoCompleto();
        });
        el.dataset.ccoKpiFinalEvento = "sim";
      }
    });

    carregarFiltrosComparativoServico();
    renderComparativoMensalPorServico();

    if (typeof renderPaginaKpiPorServicoCompleto === "function") {
      renderPaginaKpiPorServicoCompleto();
    }

    if (typeof renderComparativoDinamicoFinal === "function") {
      renderComparativoDinamicoFinal();
    }
  }, 1500);
});



/*
========================================================
PATCH KPI_MENSAL SUPABASE • PERFORMANCE E GRÁFICOS
========================================================
Usa a tabela public.kpi_mensal para os gráficos mensais,
mantendo public.operacoes para detalhes e execução diária.
========================================================
*/

let kpiMensal = [];
let ccoGraficoComparativoServicoKpiMensal = null;

const CCO_CORES_GRAFICOS = {
  peso: "#b1e1ca",
  viagens: "#a1c0e3",
  km: "#d2b9a0",
  horas: "#7B1FA2",
  distancia: "#00897B",
  tempo: "#C62828",
  previsto: "#455A64",
  executado: "#18A058",
  valor: "#0F766E",
  percentual: "#6D28D9"
};

function ccoNumeroSeguro(valor) {
  if (typeof numero === "function") return numero(valor);
  const n = Number(String(valor ?? "0").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function ccoMesAnoLinhaKpi(item) {
  const ano = Number(item?.ano || 0);
  const mes = String(item?.mes || "").padStart(2, "0");
  return ano && mes !== "00" ? `${ano}-${mes}` : "";
}

function ccoLabelMesAnoKpi(item) {
  const chave = ccoMesAnoLinhaKpi(item);
  return typeof formatarMesBrasil === "function" ? formatarMesBrasil(chave) : chave;
}

function ccoOrdenarServicos(a, b) {
  const ordem = ["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];
  const ia = ordem.indexOf(a);
  const ib = ordem.indexOf(b);
  return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
}

function ccoTemValorGrafico(valores) {
  return (valores || []).some(v => Math.abs(ccoNumeroSeguro(v)) > 0);
}

function ccoMostrarCardDoCanvas(idCanvas, mostrar) {
  const canvas = document.getElementById(idCanvas);
  const card = canvas?.closest(".section, .chart-card, .grafico-card");
  if (card) card.style.display = mostrar ? "" : "none";
}


/* função duplicada removida: ccoDestruirChartCanvas */


function ccoOpcoesGraficoExecutivo({ yComecaZero = true, sufixo = "" } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: { display: true, position: "top" },
      datalabels: {
        anchor: "end",
        align: "top",
        offset: 2,
        clamp: true,
        color: "#0f172a",
        font: { weight: "800", size: 11 },
        formatter(value) {
          const n = ccoNumeroSeguro(value);
          return n ? (typeof formatarNumero === "function" ? formatarNumero(n) : n.toLocaleString("pt-BR")) + sufixo : "";
        }
      },
      tooltip: {
        callbacks: {
          label(context) {
            const valor = context.parsed?.y ?? context.parsed ?? 0;
            const texto = typeof formatarNumero === "function" ? formatarNumero(valor) : Number(valor).toLocaleString("pt-BR");
            return `${context.dataset.label || "Valor"}: ${texto}${sufixo}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#475569", maxRotation: 0, autoSkip: false }
      },
      y: {
        beginAtZero: yComecaZero,
        grid: { color: "rgba(15,23,42,.08)" },
        ticks: { color: "#475569" }
      }
    }
  };
}

function ccoOpcoesVariacaoKpiMensal(valores) {
  const nums = (valores || []).map(ccoNumeroSeguro).filter(Number.isFinite);
  const min = nums.length ? Math.min(...nums) : 0;
  const max = nums.length ? Math.max(...nums) : 0;
  const margem = Math.max(5, Math.abs(max - min) * 0.15);

  const opcoes = ccoOpcoesGraficoExecutivo({ yComecaZero: false, sufixo: "%" });
  opcoes.scales.y.suggestedMin = min - margem;
  opcoes.scales.y.suggestedMax = max + margem;
  return opcoes;
}

async function carregarKpiMensalSupabase() {
  if (!banco) return false;

  try {
    const { data, error } = await banco
      .from("kpi_mensal")
      .select("*")
      .order("ano", { ascending: true })
      .order("mes", { ascending: true })
      .order("servico", { ascending: true });

    if (error) {
      console.warn("Tabela kpi_mensal ainda não carregou:", error);
      kpiMensal = [];
      return false;
    }

    kpiMensal = (data || []).map(item => ({
      id: item.id,
      ano: Number(item.ano || 0),
      mes: Number(item.mes || 0),
      servico: String(item.servico || "").toUpperCase(),
      peso_t: ccoNumeroSeguro(item.peso_t),
      viagens: ccoNumeroSeguro(item.viagens),
      km_total: ccoNumeroSeguro(item.km_total),
      tempo_produtivo: ccoNumeroSeguro(item.tempo_produtivo),
      equipes: ccoNumeroSeguro(item.equipes),
      previsto: ccoNumeroSeguro(item.previsto),
      executado: ccoNumeroSeguro(item.executado),
      valor: ccoNumeroSeguro(item.valor)
    }));

    return true;
  } catch (erro) {
    console.warn("Erro ao carregar kpi_mensal:", erro);
    kpiMensal = [];
    return false;
  }
}

function montarKpiMensalDaMemoria() {
  const mapa = {};

  (operacoesOriginal || operacoes || []).forEach(item => {
    const data = item.data_normalizada || item.data || "";
    if (!data || data.length < 7) return;

    const ano = Number(data.substring(0, 4));
    const mes = Number(data.substring(5, 7));
    const servico = String(item.servico || "").toUpperCase();
    if (!ano || !mes || !servico) return;

    const chave = `${ano}|${mes}|${servico}`;

    if (!mapa[chave]) {
      const painel = (painelExecutivoOriginal || painelExecutivo || []).find(p => p.servico === servico) || {};
      mapa[chave] = {
        ano,
        mes,
        servico,
        peso_t: 0,
        viagens: 0,
        km_total: 0,
        tempo_produtivo: 0,
        equipes: 0,
        previsto: ccoNumeroSeguro(painel.previsto_mes),
        executado: 0,
        valor: 0
      };
    }

    mapa[chave].peso_t += ccoNumeroSeguro(item.peso);
    mapa[chave].viagens += ccoNumeroSeguro(item.viagens);
    mapa[chave].km_total += typeof ccoKmTotalLinha === "function" ? ccoKmTotalLinha(item) : ccoNumeroSeguro(item.km);
    mapa[chave].tempo_produtivo += ccoNumeroSeguro(item.tempo_produtivo || item.tempo_produtivo_h || item.horas || item.tempo);
    mapa[chave].equipes += ccoNumeroSeguro(item.equipe);
  });

  Object.values(mapa).forEach(item => {
    const dadosServicoMes = (operacoesOriginal || operacoes || []).filter(op => {
      const data = op.data_normalizada || "";
      return op.servico === item.servico &&
        Number(data.substring(0, 4)) === item.ano &&
        Number(data.substring(5, 7)) === item.mes;
    });

    item.executado = typeof calcularAcumuladoPorServico === "function"
      ? calcularAcumuladoPorServico(item.servico, dadosServicoMes, item.previsto)
      : item.peso_t;

    const valorUnitario = VALORES_FIXOS[item.servico] || 0;
    item.valor = valorUnitario * item.executado;
  });

  return Object.values(mapa).sort((a, b) =>
    String(a.ano).localeCompare(String(b.ano)) ||
    Number(a.mes) - Number(b.mes) ||
    ccoOrdenarServicos(a.servico, b.servico)
  );
}

async function salvarKpiMensalSupabase() {
  if (!banco) return false;

  const linhas = montarKpiMensalDaMemoria();
  if (!linhas.length) return false;

  try {
    const periodos = [...new Set(linhas.map(i => `${i.ano}|${i.mes}`))];

    for (const periodo of periodos) {
      const [ano, mes] = periodo.split("|").map(Number);
      await banco.from("kpi_mensal").delete().eq("ano", ano).eq("mes", mes);
    }

    const tamanho = 500;
    for (let i = 0; i < linhas.length; i += tamanho) {
      const lote = linhas.slice(i, i + tamanho);
      const { error } = await banco.from("kpi_mensal").insert(lote);
      if (error) {
        console.error("Erro ao inserir kpi_mensal:", error);
        return false;
      }
    }

    kpiMensal = linhas;
    return true;
  } catch (erro) {
    console.error("Erro geral ao salvar kpi_mensal:", erro);
    return false;
  }
}

function obterKpiMensalDisponivel() {
  return (kpiMensal && kpiMensal.length) ? kpiMensal : montarKpiMensalDaMemoria();
}

/* Integra com o fluxo já existente de Supabase. */
if (typeof carregarBaseSupabase === "function") {
  const ccoCarregarBaseSupabaseOriginalKpiMensal = carregarBaseSupabase;
  carregarBaseSupabase = async function() {
    const carregou = await ccoCarregarBaseSupabaseOriginalKpiMensal();
    await carregarKpiMensalSupabase();
    return carregou;
  };
}

if (typeof salvarBaseCompletaSupabase === "function") {
  const ccoSalvarBaseCompletaSupabaseOriginalKpiMensal = salvarBaseCompletaSupabase;
  salvarBaseCompletaSupabase = async function(nomeArquivo) {
    const salvou = await ccoSalvarBaseCompletaSupabaseOriginalKpiMensal(nomeArquivo);
    await salvarKpiMensalSupabase();
    return salvou;
  };
}

/* Filtros do comparativo usando kpi_mensal. */

/* função duplicada removida: carregarFiltrosComparativoServico */


function ccoCampoPrincipalKpiServico(servico) {
  servico = String(servico || "").toUpperCase();
  if (["P1", "P4"].includes(servico)) return { campo: "peso_t", titulo: "Peso (t)", cor: CCO_CORES_GRAFICOS.peso };
  if (["P2.1", "P2.2"].includes(servico)) return { campo: "viagens", titulo: "Viagens", cor: CCO_CORES_GRAFICOS.viagens };
  if (["P5", "P6"].includes(servico)) return { campo: "km_total", titulo: "KM", cor: CCO_CORES_GRAFICOS.km };
  if (["P3", "P7", "P8", "P9", "P10", "P11"].includes(servico)) return { campo: "equipes", titulo: "Equipes", cor: CCO_CORES_GRAFICOS.horas };
  return { campo: "executado", titulo: "Executado", cor: CCO_CORES_GRAFICOS.executado };
}

async function renderComparativoMensalPorServico() {
  if (!kpiMensal.length) await carregarKpiMensalSupabase();

  const canvas = document.getElementById("graficoComparativoServicoMensal");
  const tabela = document.getElementById("tabelaComparativoServicoMensal");
  const aviso = document.getElementById("avisoComparativoServico");
  if (!canvas && !tabela) return;

  carregarFiltrosComparativoServico();

  const servico = document.getElementById("filtroComparativoServico")?.value || "";
  const anoFiltro = document.getElementById("filtroComparativoAno")?.value || "";
  const unidade = ccoCampoPrincipalKpiServico(servico);
  const base = obterKpiMensalDisponivel();

  const dados = base
    .filter(item => (!servico || item.servico === servico) && (!anoFiltro || String(item.ano) === String(anoFiltro)))
    .sort((a, b) => ccoMesAnoLinhaKpi(a).localeCompare(ccoMesAnoLinhaKpi(b)));

  if (tabela) {
    tabela.innerHTML = dados.length
      ? dados.map(item => `
        <tr>
          <td>${item.servico || "-"}</td>
          <td>${ccoLabelMesAnoKpi(item)}</td>
          <td>${unidade.titulo}</td>
          <td>${typeof formatarNumero === "function" ? formatarNumero(item[unidade.campo]) : item[unidade.campo]}</td>
          <td>${typeof formatarNumero === "function" ? formatarNumero(item.executado) : item.executado}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="5">Nenhum dado encontrado para o filtro selecionado.</td></tr>`;
  }

  if (aviso) {
    aviso.innerHTML = dados.length
      ? `<strong>Fonte:</strong> tabela <strong>kpi_mensal</strong> • ${servico || "Todos os serviços"}${anoFiltro ? " • Ano " + anoFiltro : " • Todos os anos"} • Indicador: <strong>${unidade.titulo}</strong>.`
      : `Nenhum dado encontrado em <strong>kpi_mensal</strong> para o filtro selecionado.`;
  }

  if (canvas) {
    ccoDestruirChartCanvas("graficoComparativoServicoMensal");
    ccoMostrarCardDoCanvas("graficoComparativoServicoMensal", dados.length > 0);

    if (dados.length) {
      ccoGraficoComparativoServicoKpiMensal = new Chart(canvas, {
        type: "bar",
        data: {
          labels: dados.map(ccoLabelMesAnoKpi),
          datasets: [{
            label: `${servico || "Serviços"} - ${unidade.titulo}`,
            data: dados.map(i => Number(ccoNumeroSeguro(i[unidade.campo]).toFixed(2))),
            backgroundColor: unidade.cor,
            borderColor: unidade.cor,
            borderRadius: 12,
            borderWidth: 1
          }]
        },
        options: ccoOpcoesGraficoExecutivo()
      });
    }
  }
}

/* Comparativo mensal geral usando kpi_mensal. */

/* função duplicada removida: renderComparativoMensal */


/* Corrige escala da variação mensal geral. */

/* função duplicada removida: renderGraficosMensais */


function criarGraficoMensal(id, tipo, labels, label, valores, cor) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;

  ccoDestruirChartCanvas(id);
  ccoMostrarCardDoCanvas(id, ccoTemValorGrafico(valores));
  if (!ccoTemValorGrafico(valores)) return null;

  return new Chart(canvas, {
    type: tipo,
    data: {
      labels,
      datasets: [{
        label,
        data: valores,
        borderRadius: tipo === "bar" ? 12 : 0,
        tension: tipo === "line" ? 0.35 : 0,
        borderWidth: tipo === "line" ? 3 : 1,
        borderColor: cor,
        backgroundColor: tipo === "line" ? `${cor}22` : `${cor}bb`,
        fill: tipo === "line"
      }]
    },
    options: ccoOpcoesGraficoExecutivo()
  });
}

/* Filtros KPI com kpi_mensal para anos/meses/serviços e operacoes para dias. */
function carregarFiltrosKpiServicoCompleto() {
  const selectServico = document.getElementById("filtroKpiServico");
  const selectAno = document.getElementById("filtroKpiAno");
  const selectMes = document.getElementById("filtroKpiMes");
  const selectDia = document.getElementById("filtroKpiDia");
  if (!selectServico || !selectAno || !selectMes || !selectDia) return;

  const atual = {
    servico: selectServico.value,
    ano: selectAno.value,
    mes: selectMes.value,
    dia: selectDia.value
  };

  const base = obterKpiMensalDisponivel();
  const catalogo = window.__CCO_CATALOGO_PERIODOS__ || [];
  const servicos = [...new Set(base.map(i => i.servico).filter(Boolean))].sort(ccoOrdenarServicos);
  const anos = catalogo.length
    ? [...new Set(catalogo.map(i => String(i.ano)).filter(a => a && a !== "0"))].sort()
    : [...new Set(base.map(i => String(i.ano)).filter(a => a && a !== "0"))].sort();
  const anoSelecionado = anos.includes(atual.ano) ? atual.ano : anos.at(-1);
  const meses = catalogo.length
    ? [...new Set(catalogo
      .filter(i => String(i.ano) === String(anoSelecionado))
      .map(i => String(i.mes).padStart(2, "0"))
      .filter(m => m && m !== "00"))].sort()
    : [...new Set(base.map(i => String(i.mes).padStart(2, "0")).filter(m => m && m !== "00"))].sort();

  const dias = [...new Set((operacoesOriginal || []).map(i => String(i.data_normalizada || "").substring(8, 10)).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));

  selectServico.innerHTML = `<option value="">Todos os serviços</option>` + servicos.map(s => `<option value="${s}">${s}</option>`).join("");
  selectAno.innerHTML = `<option value="">Todos os anos</option>` + anos.map(a => `<option value="${a}">${a}</option>`).join("");
  selectMes.innerHTML = `<option value="">Todos os meses</option>` + meses.map(m => `<option value="${m}">${MESES_BR[m] || m}</option>`).join("");
  selectDia.innerHTML = `<option value="">Todos os dias</option>` + dias.map(d => `<option value="${d}">${d}</option>`).join("");

  if (servicos.includes(atual.servico)) selectServico.value = atual.servico;
  if (anos.includes(anoSelecionado)) selectAno.value = anoSelecionado;
  if (meses.includes(atual.mes)) selectMes.value = atual.mes;
  if (dias.includes(atual.dia)) selectDia.value = atual.dia;
}

function ccoKpiMensalFiltrado(filtro) {
  const base = obterKpiMensalDisponivel();
  return base
    .filter(item =>
      (!filtro.servico || item.servico === filtro.servico) &&
      (!filtro.ano || String(item.ano) === String(filtro.ano)) &&
      (!filtro.mes || String(item.mes).padStart(2, "0") === String(filtro.mes).padStart(2, "0"))
    )
    .sort((a, b) => ccoMesAnoLinhaKpi(a).localeCompare(ccoMesAnoLinhaKpi(b)) || ccoOrdenarServicos(a.servico, b.servico));
}


function ccoLabelDiaMobileFinal(data) {
  try {
    const txt = String(data || "");
    if ((window.innerWidth || 1200) <= 768) {
      if (/^\d{4}-\d{2}-\d{2}/.test(txt)) return txt.substring(8, 10);
      if (/^\d{2}\/\d{2}\/\d{4}/.test(txt)) return txt.substring(0, 2);
    }
    return typeof formatarDataBRSimples === "function" ? formatarDataBRSimples(txt) : txt;
  } catch(e) {
    return String(data || "");
  }
}

function renderGraficosKpiServicoCompleto(dados, filtro, painel) {
  const filtroSeguro = filtro || {};
  const mensal = ccoKpiMensalFiltrado(filtroSeguro);
  const servico = filtroSeguro.servico || "";

  const ids = [
    "graficoKpiServicoDiario",
    "graficoKpiPrevistoExecutado",
    "graficoKpiServicoMensal",
    "graficoKpiServicoIndicadores",
    "graficoKpiComparativoMensal",
    "graficoKpiPercentualMensal",
    "graficoKpiProdutividadeMensal"
  ];
  ids.forEach(ccoDestruirChartCanvas);

  const mapaDiario = {};
  (dados || []).forEach(item => {
    if (!item.data_normalizada) return;
    const data = item.data_normalizada.substring(0, 10);
    const codigo = servico || item.servico || "";
    if (!mapaDiario[data]) mapaDiario[data] = { data, executado: 0 };

    const valor = typeof obterExecutadoKpiPorServico === "function"
      ? obterExecutadoKpiPorServico(codigo, item)
      : ccoNumeroSeguro(item.peso || item.viagens || item.km || item.equipe);

    mapaDiario[data].executado += valor;
  });

  const diario = Object.values(mapaDiario).sort((a, b) => a.data.localeCompare(b.data));
  const valoresDiarios = diario.map(i => Number(ccoNumeroSeguro(i.executado).toFixed(2)));

  const canvasDiario = document.getElementById("graficoKpiServicoDiario");
  if (canvasDiario) {
    ccoMostrarCardDoCanvas("graficoKpiServicoDiario", ccoTemValorGrafico(valoresDiarios));
    if (ccoTemValorGrafico(valoresDiarios)) {
      graficoKpiServicoDiario = new Chart(canvasDiario, {
        type: "line",
        data: {
          labels: diario.map(i => typeof formatarDataBRSimples === "function" ? formatarDataBRSimples(i.data) : i.data),
          datasets: [{
            label: "Execução diária",
            data: valoresDiarios,
            borderColor: CCO_CORES_GRAFICOS.executado,
            backgroundColor: `${CCO_CORES_GRAFICOS.executado}22`,
            borderWidth: 3,
            tension: .35,
            fill: true,
            pointRadius: 4
          }]
        },
        options: ccoOpcoesGraficoExecutivo()
      });
    }
  }

  const ctxPrevisto = document.getElementById("graficoKpiPrevistoExecutado");
  const previstoTotal = mensal.length ? mensal.reduce((s, i) => s + ccoNumeroSeguro(i.previsto), 0) : ccoNumeroSeguro(painel?.previsto);
  const executadoTotal = mensal.length ? mensal.reduce((s, i) => s + ccoNumeroSeguro(i.executado), 0) : ccoNumeroSeguro(painel?.executado);

  if (ctxPrevisto) {
    ccoMostrarCardDoCanvas("graficoKpiPrevistoExecutado", previstoTotal > 0 || executadoTotal > 0);
    if (previstoTotal > 0 || executadoTotal > 0) {
      graficoKpiPrevistoExecutado = new Chart(ctxPrevisto, {
        type: "bar",
        data: {
          labels: ["Previsto", "Executado"],
          datasets: [{
            label: "Previsto x Executado",
            data: [previstoTotal, executadoTotal],
            backgroundColor: [CCO_CORES_GRAFICOS.previsto, CCO_CORES_GRAFICOS.executado],
            borderRadius: 12
          }]
        },
        options: ccoOpcoesGraficoExecutivo()
      });
    }
  }

  const labelsMensais = mensal.map(ccoLabelMesAnoKpi);

  const ctxMensal = document.getElementById("graficoKpiServicoMensal");
  if (ctxMensal) {
    const valores = mensal.map(i => ccoNumeroSeguro(i.executado));
    ccoMostrarCardDoCanvas("graficoKpiServicoMensal", ccoTemValorGrafico(valores));
    if (ccoTemValorGrafico(valores)) {
      graficoKpiServicoMensalFinal = new Chart(ctxMensal, {
        type: "bar",
        data: {
          labels: labelsMensais,
          datasets: [{
            label: "Executado mensal",
            data: valores,
            backgroundColor: CCO_CORES_GRAFICOS.executado,
            borderRadius: 12
          }]
        },
        options: ccoOpcoesGraficoExecutivo()
      });
    }
  }

  const totaisIndicadores = [
    mensal.reduce((s, i) => s + ccoNumeroSeguro(i.peso_t), 0),
    mensal.reduce((s, i) => s + ccoNumeroSeguro(i.viagens), 0),
    mensal.reduce((s, i) => s + ccoNumeroSeguro(i.km_total), 0),
    mensal.reduce((s, i) => s + ccoNumeroSeguro(i.equipes), 0)
  ];

  const ctxIndicadores = document.getElementById("graficoKpiServicoIndicadores");
  renderGraficoVelocidadeMediaMensalKPI(dados);

  if (ctxIndicadores) {
    ccoMostrarCardDoCanvas("graficoKpiServicoIndicadores", ccoTemValorGrafico(totaisIndicadores));
    if (ccoTemValorGrafico(totaisIndicadores)) {
      graficoKpiServicoIndicadoresFinal = new Chart(ctxIndicadores, {
        type: "doughnut",
        data: {
          labels: ["Peso", "Viagens", "KM", "Equipes"],
          datasets: [{
            data: totaisIndicadores,
            backgroundColor: [
              CCO_CORES_GRAFICOS.peso,
              CCO_CORES_GRAFICOS.viagens,
              CCO_CORES_GRAFICOS.km,
              CCO_CORES_GRAFICOS.horas
            ]
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { datalabels: { display: false } } }
      });
    }
  }

  const ctxComparativoMensal = document.getElementById("graficoKpiComparativoMensal");
  if (ctxComparativoMensal) {
    const previsto = mensal.map(i => ccoNumeroSeguro(i.previsto));
    const executado = mensal.map(i => ccoNumeroSeguro(i.executado));
    ccoMostrarCardDoCanvas("graficoKpiComparativoMensal", ccoTemValorGrafico(previsto) || ccoTemValorGrafico(executado));
    if (ccoTemValorGrafico(previsto) || ccoTemValorGrafico(executado)) {
      graficoKpiComparativoMensalFinal = new Chart(ctxComparativoMensal, {
        type: "bar",
        data: {
          labels: labelsMensais,
          datasets: [
            { label: "Previsto", data: previsto, backgroundColor: CCO_CORES_GRAFICOS.previsto, borderRadius: 12 },
            { label: "Executado", data: executado, backgroundColor: CCO_CORES_GRAFICOS.executado, borderRadius: 12 }
          ]
        },
        options: ccoOpcoesGraficoExecutivo()
      });
    }
  }

  const ctxPercentualMensal = document.getElementById("graficoKpiPercentualMensal");
  if (ctxPercentualMensal) {
    const percentuais = mensal.map(i => i.previsto > 0 ? (i.executado / i.previsto) * 100 : 0);
    ccoMostrarCardDoCanvas("graficoKpiPercentualMensal", ccoTemValorGrafico(percentuais));
    if (ccoTemValorGrafico(percentuais)) {
      graficoKpiPercentualMensalFinal = new Chart(ctxPercentualMensal, {
        type: "line",
        data: {
          labels: labelsMensais,
          datasets: [{
            label: "% execução mensal",
            data: percentuais.map(v => Number(v.toFixed(2))),
            borderColor: CCO_CORES_GRAFICOS.percentual,
            backgroundColor: `${CCO_CORES_GRAFICOS.percentual}22`,
            borderWidth: 3,
            tension: .35,
            fill: true,
            pointRadius: 4
          }]
        },
        options: ccoOpcoesVariacaoKpiMensal(percentuais)
      });
    }
  }

  const ctxProdutividade = document.getElementById("graficoKpiProdutividadeMensal");
  if (ctxProdutividade) {
    const tonViagem = mensal.map(i => i.viagens ? i.peso_t / i.viagens : 0);
    const kmViagem = mensal.map(i => i.viagens ? i.km_total / i.viagens : 0);
    ccoMostrarCardDoCanvas("graficoKpiProdutividadeMensal", ccoTemValorGrafico(tonViagem) || ccoTemValorGrafico(kmViagem));
    if (ccoTemValorGrafico(tonViagem) || ccoTemValorGrafico(kmViagem)) {
      graficoKpiProdutividadeMensalFinal = new Chart(ctxProdutividade, {
        type: "line",
        data: {
          labels: labelsMensais,
          datasets: [
            {
              label: "Ton/viagem",
              data: tonViagem.map(v => Number(v.toFixed(2))),
              borderColor: CCO_CORES_GRAFICOS.peso,
              backgroundColor: `${CCO_CORES_GRAFICOS.peso}22`,
              borderWidth: 3,
              tension: .35,
              fill: false
            },
            {
              label: "KM/viagem",
              data: kmViagem.map(v => Number(v.toFixed(2))),
              borderColor: CCO_CORES_GRAFICOS.km,
              backgroundColor: `${CCO_CORES_GRAFICOS.km}22`,
              borderWidth: 3,
              tension: .35,
              fill: false
            }
          ]
        },
        options: ccoOpcoesGraficoExecutivo({ yComecaZero: false })
      });
    }
  }
}

/* Recarrega kpi_mensal depois que a página terminou de montar. */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(async () => {
    await carregarKpiMensalSupabase();
    carregarFiltrosComparativoServico();
    carregarFiltrosKpiServicoCompleto();
    renderComparativoMensal();
    renderComparativoMensalPorServico();
    if (typeof renderPaginaKpiPorServicoCompleto === "function") renderPaginaKpiPorServicoCompleto();
  }, 2200);
});


/*
========================================================
PATCH FINAL • GRÁFICOS DINÂMICOS + ESPAÇAMENTO GLOBAL
========================================================
Objetivo:
1. Execução P1 a P12 atualiza todos os gráficos junto com filtro de mês/ano.
2. Gráficos sem dados somem antes de ocupar espaço.
3. Todos os gráficos ganham altura, padding interno e resize automático.
4. Evita corte de rótulos, legendas e valores.
========================================================
*/

function ccoChartDoCanvas(id) {
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart) return null;
  try { return Chart.getChart(canvas) || null; } catch { return null; }
}

function ccoDestruirChartCanvas(id) {
  const chart = ccoChartDoCanvas(id);
  if (chart) {
    try { chart.destroy(); } catch {}
  }
}

function ccoAtualizarTodosGraficosVisiveis() {
  setTimeout(() => {
    try {
      if (!window.Chart) return;
      Object.values(Chart.instances || {}).forEach(chart => {
        try {
          chart.resize();
          chart.update("none");
        } catch {}
      });
    } catch {}
  }, 180);
}

function ccoAplicarClasseGraficoSistema() {
  document.querySelectorAll("canvas").forEach(canvas => {
    const card = canvas.closest(".chart-card, .section");
    if (card) card.classList.add("cco-grafico-card-ajustado");
  });
  ccoAtualizarTodosGraficosVisiveis();
}

function ccoRecarregarExecucaoFiltroAtual() {
  const mes = document.getElementById("filtroExecucaoMes")?.value || "";
  const ano = document.getElementById("filtroExecucaoAno")?.value || "";

  filtroExecucaoMesAtual = mes;
  filtroExecucaoAnoAtual = ano;

  if (typeof renderTabelaContratualMensal === "function") {
    renderTabelaContratualMensal();
  }

  const detalhe = document.getElementById("servico-detalhe");
  const codigo = typeof obterServicoAtivo === "function" ? obterServicoAtivo() : "";

  if (detalhe && detalhe.classList.contains("ativa") && codigo && typeof renderDetalheServicoMensal === "function") {
    [
      "graficoServicoDetalhe",
      "graficoExecucaoPorTurnoServico",
      "graficoViagensPorTurnoServico",
      "graficoHorasProdutivasServico",
      "graficoDistanciaMediaServico",
      "graficoTempoMedioViagemServico"
    ].forEach(ccoDestruirChartCanvas);

    renderDetalheServicoMensal(codigo);
  }

  ccoAplicarClasseGraficoSistema();
}

if (typeof aplicarFiltroExecucaoMensal === "function") {
  const aplicarFiltroExecucaoMensalOriginalDinamico = aplicarFiltroExecucaoMensal;
  aplicarFiltroExecucaoMensal = function() {
    aplicarFiltroExecucaoMensalOriginalDinamico();
    ccoRecarregarExecucaoFiltroAtual();
  };
}

if (typeof limparFiltroExecucaoMensal === "function") {
  const limparFiltroExecucaoMensalOriginalDinamico = limparFiltroExecucaoMensal;
  limparFiltroExecucaoMensal = function() {
    limparFiltroExecucaoMensalOriginalDinamico();
    ccoRecarregarExecucaoFiltroAtual();
  };
}

if (typeof mostrarServico === "function") {
  const mostrarServicoOriginalDinamico = mostrarServico;
  mostrarServico = function(codigo, botao) {
    mostrarServicoOriginalDinamico(codigo, botao);
    ccoAplicarClasseGraficoSistema();
  };
}

function ccoAtivarListenersExecucaoDinamica() {
  ["filtroExecucaoMes", "filtroExecucaoAno"].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.ccoListenerDinamico === "1") return;
    el.dataset.ccoListenerDinamico = "1";
    el.addEventListener("change", ccoRecarregarExecucaoFiltroAtual);
    el.addEventListener("input", ccoRecarregarExecucaoFiltroAtual);
  });

  document.querySelectorAll("#tela-contrato .servico-btn").forEach(btn => {
    if (btn.dataset.ccoListenerServico === "1") return;
    btn.dataset.ccoListenerServico = "1";
    btn.addEventListener("click", () => setTimeout(ccoRecarregarExecucaoFiltroAtual, 80));
  });
}

/* Opções executivas globais para gráficos com espaço extra. */
function ccoMesclarOpcoesGraficoEspaco(options = {}) {
  const novo = {
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 120,
    layout: {
      ...(options.layout || {}),
      padding: {
        top: 30,
        right: 28,
        bottom: 24,
        left: 18,
        ...((options.layout || {}).padding || {})
      }
    },
    plugins: {
      ...(options.plugins || {}),
      legend: {
        display: true,
        position: "top",
        align: "center",
        ...((options.plugins || {}).legend || {}),
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 10,
          boxHeight: 10,
          padding: 16,
          color: "#FFFFFF",
          font: { size: 12, weight: "800" },
          ...(((options.plugins || {}).legend || {}).labels || {})
        }
      }
    },
    scales: {
      ...(options.scales || {})
    }
  };

  if (novo.scales.x) {
    novo.scales.x = {
      ...novo.scales.x,
      offset: true,
      ticks: {
        maxRotation: 0,
        minRotation: 0,
        autoSkip: false,
        padding: 8,
        ...((novo.scales.x || {}).ticks || {})
      }
    };
  }

  if (novo.scales.y) {
    novo.scales.y = {
      ...novo.scales.y,
      grace: "18%",
      ticks: {
        padding: 8,
        ...((novo.scales.y || {}).ticks || {})
      }
    };
  }

  return novo;
}

if (typeof ccoOpcoesGraficoExecucaoVisual === "function") {
  const ccoOpcoesGraficoExecucaoVisualOriginalEspaco = ccoOpcoesGraficoExecucaoVisual;
  ccoOpcoesGraficoExecucaoVisual = function(sufixo = "") {
    return ccoMesclarOpcoesGraficoEspaco(ccoOpcoesGraficoExecucaoVisualOriginalEspaco(sufixo));
  };
}

if (typeof ccoOpcoesGraficoExecutivo === "function") {
  const ccoOpcoesGraficoExecutivoOriginalEspaco = ccoOpcoesGraficoExecutivo;
  ccoOpcoesGraficoExecutivo = function(...args) {
    return ccoMesclarOpcoesGraficoEspaco(ccoOpcoesGraficoExecutivoOriginalEspaco(...args));
  };
}

if (typeof ccoOpcoesComparativoFinal === "function") {
  const ccoOpcoesComparativoFinalOriginalEspaco = ccoOpcoesComparativoFinal;
  ccoOpcoesComparativoFinal = function(sufixo = "") {
    return ccoMesclarOpcoesGraficoEspaco(ccoOpcoesComparativoFinalOriginalEspaco(sufixo));
  };
}

/* Reforço: após qualquer render principal, aplica layout e listeners. */
if (typeof atualizarDashboard === "function") {
  const atualizarDashboardOriginalEspaco = atualizarDashboard;
  atualizarDashboard = function() {
    atualizarDashboardOriginalEspaco();
    setTimeout(() => {
      ccoAtivarListenersExecucaoDinamica();
      ccoAplicarClasseGraficoSistema();
    }, 200);
  };
}

if (typeof renderDetalheServicoMensal === "function") {
  const renderDetalheServicoMensalOriginalEspaco = renderDetalheServicoMensal;
  renderDetalheServicoMensal = function(codigo) {
    renderDetalheServicoMensalOriginalEspaco(codigo);
    ccoAplicarClasseGraficoSistema();
  };
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    ccoAtivarListenersExecucaoDinamica();
    ccoAplicarClasseGraficoSistema();
  }, 800);

  setTimeout(() => {
    ccoAtivarListenersExecucaoDinamica();
    ccoAplicarClasseGraficoSistema();
  }, 2400);
});


/* =====================================================
   PATCH FINAL ANTI-RECURSÃO CHART.JS
   Motivo: o plugin chartjs-plugin-datalabels causava o erro:
   "Recursion detected: _scriptable->_scriptable" durante a importação.
   Esta camada desativa o plugin, destrói canvas reutilizado e impede
   que erro de gráfico interrompa a importação da planilha.
===================================================== */
(function ccoPatchFinalSemRecursaoChartJS() {
  function instalarPatch() {
    try {
      if (!window.Chart || window.Chart.__ccoPatchFinalSemRecursao) return;

      // Desativa o plugin de rótulos, mesmo se o navegador ainda estiver com cache antigo.
      try {
        if (window.ChartDataLabels) {
          try { window.Chart.unregister(window.ChartDataLabels); } catch (e) {}
        }
        window.ChartDataLabels = null;
      } catch (e) {}

      const ChartBase = window.Chart;
      const registrarOriginal = ChartBase.register ? ChartBase.register.bind(ChartBase) : null;

      if (registrarOriginal) {
        ChartBase.register = function(...plugins) {
          const pluginsSeguros = plugins.filter(plugin => {
            if (!plugin) return false;
            if (plugin.id === "datalabels") return false;
            return true;
          });
          if (!pluginsSeguros.length) return;
          return registrarOriginal(...pluginsSeguros);
        };
      }

      const ChartSeguro = new Proxy(ChartBase, {
        construct(target, args) {
          const item = args[0];
          const config = args[1] || {};

          // Remove datalabels de qualquer config antiga.
          try {
            if (config.options && config.options.plugins && config.options.plugins.datalabels) {
              delete config.options.plugins.datalabels;
            }
          } catch (e) {}

          // Garante espaço melhor nos gráficos.
          try {
            config.options = config.options || {};
            config.options.responsive = true;
            config.options.maintainAspectRatio = false;
            config.options.layout = config.options.layout || {};
            config.options.layout.padding = {
              top: 24,
              right: 28,
              bottom: 18,
              left: 18,
              ...(config.options.layout.padding || {})
            };
            config.options.plugins = config.options.plugins || {};
            config.options.plugins.legend = config.options.plugins.legend || {
              display: true,
              position: "top",
              labels: {
                usePointStyle: true,
                padding: 18,
                font: { size: 12, weight: "700" }
              }
            };
          } catch (e) {}

          // Destrói gráfico existente no mesmo canvas.
          try {
            let canvas = null;
            if (typeof item === "string") canvas = document.getElementById(item);
            else if (item && item.canvas) canvas = item.canvas;
            else canvas = item;

            if (canvas && target.getChart) {
              const existente = target.getChart(canvas);
              if (existente) existente.destroy();
            }
          } catch (e) {}

          return Reflect.construct(target, args);
        }
      });

      Object.getOwnPropertyNames(ChartBase).forEach(nome => {
        try {
          if (!(nome in ChartSeguro)) {
            Object.defineProperty(ChartSeguro, nome, Object.getOwnPropertyDescriptor(ChartBase, nome));
          }
        } catch (e) {}
      });

      ChartSeguro.__ccoPatchFinalSemRecursao = true;
      window.Chart = ChartSeguro;

      if (window.Chart.defaults && window.Chart.defaults.plugins) {
        delete window.Chart.defaults.plugins.datalabels;
      }

      // Anula funções antigas que tentavam religar datalabels.
      window.ccoAplicarValorNaFrenteBarraFinal = function() { return; };
      window.ccoValorNaBarraV2 = function() { return; };
      window.ccoDesligarRotulosLegV2 = function() { return; };
    } catch (erro) {
      console.warn("Patch final Chart.js não aplicado:", erro);
    }
  }

  instalarPatch();
  document.addEventListener("DOMContentLoaded", instalarPatch, { once: true });
})();


/* =====================================================
   PATCH FINAL 20260602 • COMPARATIVO + PERFORMANCE + CORES
   - Corrige Comparação mensal por serviço usando kpi_mensal/operacoes.
   - Reduz demora do Painel Geral com renderização sob demanda e debounce.
   - Ajusta legendas, espaço, cores verde/azul para turnos e previsto/executado.
===================================================== */
(function ccoPatchComparativoPerformanceCores(){
  const CORES = {
    verde: '#6fb896',
    azul: '#091420',
    azulClaro: 'rgba(36, 186, 232, 0.72)',
    verdeClaro: 'rgba(98, 234, 171, 0.72)',
    cinza: '#64748B',
    previsto: '#3d546e',
    executado: '#0d1a14',
    km: '#0C6B3F',
    viagens: '#1565C0'
  };

  function n(v){
    if (typeof ccoNumeroSeguro === 'function') return ccoNumeroSeguro(v);
    if (typeof numero === 'function') return numero(v);
    const x = Number(String(v ?? '0').replace(/\./g,'').replace(',','.'));
    return Number.isFinite(x) ? x : 0;
  }
  function fmt(v){ return typeof formatarNumero === 'function' ? formatarNumero(v) : Number(v||0).toLocaleString('pt-BR'); }
  function mesNome(m){ return (typeof MESES_BR !== 'undefined' && MESES_BR[String(m).padStart(2,'0')]) || String(m).padStart(2,'0'); }
  function labelMesAno(i){ return `${mesNome(i.mes)}/${i.ano}`; }
  function ordServ(a,b){
    const ordem = ['P1','P2.1','P2.2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12'];
    return (ordem.indexOf(a)<0?999:ordem.indexOf(a)) - (ordem.indexOf(b)<0?999:ordem.indexOf(b));
  }
  function has(vals){ return (vals||[]).some(v => Math.abs(n(v)) > 0); }
  function destroy(id){
    try{ const c=document.getElementById(id); if(c && window.Chart){ const ch=Chart.getChart(c); if(ch) ch.destroy(); } }catch(e){}
  }
  function card(canvas){ return canvas?.closest('.section, .chart-card, .grafico-card'); }
  function showCanvas(id, ok){ const c=document.getElementById(id); const ca=card(c); if(ca) ca.style.display = ok ? '' : 'none'; }

  function obterBaseKpi(){
    try{
      if (Array.isArray(window.kpiMensal) && window.kpiMensal.length) return window.kpiMensal;
    }catch(e){}
    try{
      if (typeof obterKpiMensalDisponivel === 'function') {
        const b = obterKpiMensalDisponivel();
        if (Array.isArray(b) && b.length) return b;
      }
    }catch(e){}
    try{
      if (typeof montarKpiMensalDaMemoria === 'function') return montarKpiMensalDaMemoria() || [];
    }catch(e){}
    return [];
  }

  async function recarregarKpiMensalDireto(){
    if (!window.banco) return obterBaseKpi();
    try{
      const { data, error } = await banco.from('kpi_mensal').select('*').order('ano',{ascending:true}).order('mes',{ascending:true}).order('servico',{ascending:true});
      if (!error && Array.isArray(data) && data.length) {
        window.kpiMensal = data.map(i => ({
          ano:n(i.ano), mes:n(i.mes), servico:String(i.servico||'').toUpperCase(),
          peso_t:n(i.peso_t), viagens:n(i.viagens), km_total:n(i.km_total), tempo_produtivo:n(i.tempo_produtivo), equipes:n(i.equipes),
          previsto:n(i.previsto), executado:n(i.executado), valor:n(i.valor)
        }));
      }
    }catch(e){ console.warn('kpi_mensal direto:', e); }
    return obterBaseKpi();
  }

  function campoServico(servico){
    servico = String(servico||'').toUpperCase();
    if (['P1','P4'].includes(servico)) return {campo:'peso_t', titulo:'Peso (t)', cor:CORES.verde};
    if (['P2.1','P2.2'].includes(servico)) return {campo:'viagens', titulo:'Viagens', cor:CORES.azul};
    if (['P5','P6'].includes(servico)) return {campo:'km_total', titulo:'KM executado', cor:CORES.verde};
    if (['P3','P7','P8','P9','P10','P11'].includes(servico)) return {campo:'equipes', titulo:'Equipes', cor:CORES.verde};
    return {campo:'executado', titulo:'Executado', cor:CORES.verde};
  }

  window.carregarFiltrosComparativoServico = function(){
    const s = document.getElementById('filtroComparativoServico');
    const a = document.getElementById('filtroComparativoAno');
    if(!s || !a) return;
    const atualS=s.value, atualA=a.value;
    const base = obterBaseKpi();
    const servicos = [...new Set(base.map(i=>String(i.servico||'').toUpperCase()).filter(Boolean))].sort(ordServ);
    const anos = [...new Set(base.map(i=>String(i.ano||'')).filter(v=>v && v !== '0'))].sort();
    s.innerHTML = servicos.length ? servicos.map(x=>`<option value="${x}">${x}</option>`).join('') : '<option value="">Sem dados</option>';
    a.innerHTML = '<option value="">Todos os anos</option>' + anos.map(x=>`<option value="${x}">${x}</option>`).join('');
    s.value = servicos.includes(atualS) ? atualS : (servicos[0] || '');
    if(anos.includes(atualA)) a.value = atualA;
  };

  window.renderComparativoMensalPorServico = async function(){
    await recarregarKpiMensalDireto();
    carregarFiltrosComparativoServico();
    const canvas = document.getElementById('graficoComparativoServicoMensal');
    const tabela = document.getElementById('tabelaComparativoServicoMensal');
    const aviso = document.getElementById('avisoComparativoServico');
    const servico = document.getElementById('filtroComparativoServico')?.value || '';
    const ano = document.getElementById('filtroComparativoAno')?.value || '';
    const base = obterBaseKpi();
    const meta = campoServico(servico);
    const dados = base.filter(i => (!servico || i.servico === servico) && (!ano || String(i.ano) === String(ano)))
      .sort((x,y) => `${x.ano}-${String(x.mes).padStart(2,'0')}`.localeCompare(`${y.ano}-${String(y.mes).padStart(2,'0')}`));

    if(aviso){
      aviso.innerHTML = dados.length
        ? `<strong>Filtro ativo:</strong> ${servico || 'Todos os serviços'}${ano ? ' • ' + ano : ''} • Indicador: <strong>${meta.titulo}</strong>.`
        : `Sem dados para o filtro selecionado. Importe a planilha novamente para preencher <strong>kpi_mensal</strong>.`;
    }
    if(tabela){
      tabela.innerHTML = dados.length ? dados.map(i=>`<tr><td>${i.servico}</td><td>${labelMesAno(i)}</td><td>${meta.titulo}</td><td>${fmt(i[meta.campo])}</td><td>${fmt(i.executado)}</td></tr>`).join('')
        : `<tr><td colspan="5">Nenhum dado encontrado.</td></tr>`;
    }
    if(!canvas) return;
    destroy('graficoComparativoServicoMensal');
    const valores = dados.map(i => n(i[meta.campo]));
    showCanvas('graficoComparativoServicoMensal', has(valores));
    if(!has(valores)) return;
    new Chart(canvas, {
      type:'bar',
      data:{ labels:dados.map(labelMesAno), datasets:[{ label:meta.titulo, data:valores, backgroundColor:meta.cor, borderColor:meta.cor, borderRadius:12, maxBarThickness:80 }]},
      options: ccoOptionsFinais({ yComecaZero:true, legend:false, sufixo:'' })
    });
  };

  function ccoOptionsFinais({yComecaZero=true, legend=true, sufixo=''}={}){
    return {
      responsive:true, maintainAspectRatio:false, resizeDelay:120, animation:{duration:120},
      layout:{padding:{top:28,right:30,bottom:22,left:18}},
      plugins:{
        legend:{display:legend, position:'bottom', labels:{usePointStyle:true, pointStyle:'rectRounded', padding:18, color:'#334155', font:{size:12, weight:'800'}}},
        datalabels:{display:false},
        tooltip:{callbacks:{label(ctx){ const v = ctx.parsed?.y ?? ctx.parsed ?? 0; return `${ctx.dataset.label||'Valor'}: ${fmt(v)}${sufixo}`; }}}
      },
      scales:{
        x:{offset:true, grid:{display:false}, ticks:{color:'#475569', maxRotation:0, minRotation:0, autoSkip:false, padding:10}},
        y:{beginAtZero:yComecaZero, grace:'18%', grid:{color:'rgba(15,23,42,.08)'}, ticks:{color:'#475569', padding:8}}
      }
    };
  }
  window.ccoOptionsFinais = ccoOptionsFinais;

  // Cores e legendas finais em qualquer gráfico criado por código antigo.
  function ajustarConfig(config){
    try{
      config.options = config.options || {};
      config.options.responsive = true;
      config.options.maintainAspectRatio = false;
      config.options.animation = config.options.animation || {duration:120};
      config.options.layout = config.options.layout || {};
      config.options.layout.padding = {top:32,right:34,bottom:24,left:18, ...(config.options.layout.padding||{})};
      config.options.plugins = config.options.plugins || {};
      config.options.plugins.datalabels = {display:false};
      const datasets = config.data?.datasets || [];
      const labels = (config.data?.labels || []).map(x=>String(x));
      const unicaSerie = datasets.length <= 1;
      config.options.plugins.legend = {
        display: !unicaSerie,
        position:'bottom',
        labels:{usePointStyle:true, pointStyle:'rectRounded', padding:18, color:'#334155', font:{size:12, weight:'800'}}
      };
      datasets.forEach(ds=>{
        const l = String(ds.label||'').toLowerCase();
        if(l.includes('previsto')) { ds.backgroundColor = CORES.previsto; ds.borderColor = CORES.previsto; }
        if(l.includes('executado') || l.includes('execução')) { ds.backgroundColor = CORES.executado; ds.borderColor = CORES.executado; }
        if(l.includes('viagem')) { ds.backgroundColor = CORES.azul; ds.borderColor = CORES.azul; }
        if(l.includes('km')) { ds.backgroundColor = CORES.verde; ds.borderColor = CORES.verde; }
        if(config.type === 'bar') ds.maxBarThickness = ds.maxBarThickness || 95;
      });
      // Uma série com labels de turno: colore barras por turno.
      if(config.type === 'bar' && datasets.length === 1 && labels.length){
        const ehTurno = labels.some(x=>/diurno|noturno|sem turno/i.test(x));
        if(ehTurno){
          datasets[0].backgroundColor = labels.map(x => /noturno/i.test(x) ? CORES.azul : CORES.verde);
          datasets[0].borderColor = labels.map(x => /noturno/i.test(x) ? CORES.azul : CORES.verde);
        }
      }
      if(config.options.scales){
        config.options.scales.x = {...(config.options.scales.x||{}), offset:true, ticks:{maxRotation:0,minRotation:0,autoSkip:false,padding:10,...((config.options.scales.x||{}).ticks||{})}};
        config.options.scales.y = {...(config.options.scales.y||{}), grace:'18%', ticks:{padding:8,...((config.options.scales.y||{}).ticks||{})}};
      }
    }catch(e){}
    return config;
  }
  window.ccoAjustarConfigGraficoFinal = ajustarConfig;

  // Reforça o proxy Chart já existente com ajuste final.
  function instalarProxyFinal(){
    try{
      if(!window.Chart || window.Chart.__ccoProxyCoresFinal) return;
      const Base = window.Chart;
      const ProxyChart = new Proxy(Base, {
        construct(target,args){
          try{ if(args[1]) args[1] = ajustarConfig(args[1]); }catch(e){}
          return Reflect.construct(target,args);
        }
      });
      Object.getOwnPropertyNames(Base).forEach(k=>{try{ if(!(k in ProxyChart)) Object.defineProperty(ProxyChart,k,Object.getOwnPropertyDescriptor(Base,k)); }catch(e){}});
      ProxyChart.__ccoProxyCoresFinal = true;
      window.Chart = ProxyChart;
    }catch(e){ console.warn('proxy cores final:',e); }
  }
  instalarProxyFinal();
  document.addEventListener('DOMContentLoaded', instalarProxyFinal, {once:true});

  // Painel Geral mais rápido: só renderiza gráficos quando a tela está aberta e com debounce.
  if(typeof renderGraficos === 'function' && !window.__ccoRenderGraficosDebounceFinal){
    const original = renderGraficos;
    let timer = null;
    window.renderGraficos = function(){
      const tela = document.getElementById('tela-executivo');
      if(tela && !tela.classList.contains('ativa')) return;
      clearTimeout(timer);
      timer = setTimeout(()=>{ try{ original(); ccoAjustarGraficosVisiveis(); }catch(e){ console.warn('renderGraficos otimizado:', e); } }, 180);
    };
    window.__ccoRenderGraficosDebounceFinal = true;
  }

  // Execução P1-P12: força atualização limpa e resize depois do filtro.
  function atualizarExecucaoFinal(){
    try{
      if(typeof obterServicoAtivo !== 'function' || typeof renderDetalheServicoMensal !== 'function') return;
      const codigo = obterServicoAtivo();
      if(!codigo) return;
      ['graficoServicoDetalhe','graficoExecucaoPorTurnoServico','graficoViagensPorTurnoServico','graficoHorasProdutivasServico','graficoDistanciaMediaServico','graficoTempoMedioViagemServico'].forEach(destroy);
      renderDetalheServicoMensal(codigo);
      setTimeout(ccoAjustarGraficosVisiveis,120);
    }catch(e){ console.warn('execução final:', e); }
  }
  ['filtroExecucaoMes','filtroExecucaoAno'].forEach(id=>{
    document.addEventListener('change', ev=>{ if(ev.target && ev.target.id===id) atualizarExecucaoFinal(); }, true);
  });

  function ccoAjustarGraficosVisiveis(){
    try{
      document.querySelectorAll('canvas').forEach(c=>{
        const ca = card(c);
        if(ca){ ca.classList.add('cco-card-grafico-final'); ca.style.overflow='visible'; }
      });
      if(window.Chart){
        Object.values(Chart.instances||{}).forEach(ch=>{try{ ch.options = ajustarConfig(ch.options ? {type:ch.config.type,data:ch.data,options:ch.options} : ch.config).options; ch.resize(); ch.update('none'); }catch(e){}});
      }
    }catch(e){}
  }
  window.ccoAjustarGraficosVisiveis = ccoAjustarGraficosVisiveis;

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(async()=>{
      await recarregarKpiMensalDireto();
      carregarFiltrosComparativoServico();
      renderComparativoMensalPorServico();
      ccoAjustarGraficosVisiveis();
    },1800);
    setTimeout(ccoAjustarGraficosVisiveis,3500);
  });
})();


/* =====================================================
   PATCH GITHUB PAGES FINAL • SEM RECURSÃO CHART.JS
   - Remove callbacks/formatters que causavam "callback->callback".
   - Impede erro de gráfico de bloquear gravação no Supabase.
   - Serviço padrão P1 em filtros por serviço.
   - Redimensiona gráficos sem reescrever opções resolvidas do Chart.js.
===================================================== */
(function ccoPatchGitPagesFinal(){
  function ccoSemFuncaoProfundo(obj, profundidade = 0) {
    if (!obj || profundidade > 8) return obj;
    if (Array.isArray(obj)) {
      return obj.map(x => ccoSemFuncaoProfundo(x, profundidade + 1));
    }
    if (typeof obj === "function") return undefined;
    if (typeof obj !== "object") return obj;

    const saida = {};
    Object.keys(obj).forEach(chave => {
      const valor = obj[chave];

      // Estes campos foram a origem da recursão do Chart.js.
      if (["callback", "callbacks", "formatter"].includes(chave)) return;

      // Nunca levar objetos internos resolvidos do Chart.js de volta para config.
      if (["_cacheable", "_proxy", "_context", "_resolver"].includes(chave)) return;

      if (typeof valor === "function") return;

      const limpo = ccoSemFuncaoProfundo(valor, profundidade + 1);
      if (limpo !== undefined) saida[chave] = limpo;
    });

    return saida;
  }

  function ccoSanitizarConfigGrafico(config) {
    config = config || {};
    config.options = ccoSemFuncaoProfundo(config.options || {}) || {};

    config.options.responsive = true;
    config.options.maintainAspectRatio = false;
    config.options.resizeDelay = 180;
    config.options.animation = config.options.animation || { duration: 120 };

    config.options.layout = config.options.layout || {};
    config.options.layout.padding = {
      top: 30,
      right: 34,
      bottom: 24,
      left: 18,
      ...(config.options.layout.padding || {})
    };

    config.options.plugins = config.options.plugins || {};
    delete config.options.plugins.datalabels;

    config.options.plugins.legend = {
      display: (config.data?.datasets || []).length > 1,
      position: "bottom",
      labels: {
        usePointStyle: true,
        pointStyle: "rectRounded",
        padding: 18,
        color: "#FFFFFF",
        font: { size: 12, weight: "700" }
      },
      ...(config.options.plugins.legend || {})
    };

    config.options.plugins.tooltip = {
      enabled: true
    };

    if (config.options.scales) {
      config.options.scales = ccoSemFuncaoProfundo(config.options.scales) || {};
      if (config.options.scales.x) {
        config.options.scales.x.offset = true;
        config.options.scales.x.ticks = {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
          padding: 10,
          ...(config.options.scales.x.ticks || {})
        };
      }
      if (config.options.scales.y) {
        config.options.scales.y.grace = config.options.scales.y.grace || "18%";
        config.options.scales.y.ticks = {
          padding: 8,
          ...(config.options.scales.y.ticks || {})
        };
      }
    }

    const CORES = {
      previsto: "#1565C0",
      executado: "#0C6B3F",
      viagem: "#1565C0",
      km: "#0C6B3F",
      valor: "#c4c3c0"
    };

    try {
      const labels = (config.data?.labels || []).map(x => String(x));
      const datasets = config.data?.datasets || [];
      datasets.forEach(ds => {
        const l = String(ds.label || "").toLowerCase();
        if (l.includes("previsto")) {
          ds.backgroundColor = CORES.previsto;
          ds.borderColor = CORES.previsto;
        } else if (l.includes("executado") || l.includes("execução")) {
          ds.backgroundColor = CORES.executado;
          ds.borderColor = CORES.executado;
        } else if (l.includes("valor") || l.includes("contrat")) {
          ds.backgroundColor = CORES.valor;
          ds.borderColor = "#FACC15";
        } else if (l.includes("viagem")) {
          ds.backgroundColor = CORES.viagem;
          ds.borderColor = CORES.viagem;
        } else if (l.includes("km")) {
          ds.backgroundColor = CORES.km;
          ds.borderColor = CORES.km;
        }

        if (config.type === "bar") {
          ds.borderRadius = ds.borderRadius || 10;
          ds.maxBarThickness = ds.maxBarThickness || 90;
        }
      });

      if (config.type === "bar" && datasets.length === 1 && labels.some(x => /diurno|noturno|sem turno/i.test(x))) {
        datasets[0].backgroundColor = labels.map(x => /noturno/i.test(x) ? CORES.viagem : CORES.executado);
        datasets[0].borderColor = labels.map(x => /noturno/i.test(x) ? CORES.viagem : CORES.executado);
      }
    } catch (e) {}

    return config;
  }

  function ccoInstalarChartSeguro() {
    if (!window.Chart || window.Chart.__ccoGitPagesFinalSeguro) return;

    const BaseChart = window.Chart;

    const ChartSeguro = new Proxy(BaseChart, {
      construct(target, args) {
        try {
          const item = args[0];
          let canvas = null;

          if (typeof item === "string") canvas = document.getElementById(item);
          else if (item && item.canvas) canvas = item.canvas;
          else canvas = item;

          if (canvas && target.getChart) {
            const existente = target.getChart(canvas);
            if (existente) existente.destroy();
          }

          args[1] = ccoSanitizarConfigGrafico(args[1] || {});
          return Reflect.construct(target, args);
        } catch (erro) {
          console.warn("Gráfico ignorado para não bloquear Supabase:", erro);

          return {
            destroy() {},
            update() {},
            resize() {},
            render() {},
            stop() {},
            clear() {},
            config: args[1] || {},
            data: (args[1] || {}).data || {},
            options: ((args[1] || {}).options || {})
          };
        }
      }
    });

    Object.getOwnPropertyNames(BaseChart).forEach(nome => {
      try {
        if (!(nome in ChartSeguro)) {
          Object.defineProperty(ChartSeguro, nome, Object.getOwnPropertyDescriptor(BaseChart, nome));
        }
      } catch (e) {}
    });

    ChartSeguro.__ccoGitPagesFinalSeguro = true;
    window.Chart = ChartSeguro;
  }

  // Substitui função antiga que alterava opções já resolvidas do Chart.js.
  window.ccoAjustarGraficosVisiveis = function() {
    try {
      document.querySelectorAll("canvas").forEach(c => {
        const card = c.closest(".section, .chart-card, .grafico-card");
        if (card) {
          card.classList.add("cco-card-grafico-final");
          card.style.overflow = "visible";
        }
        const grafico = window.Chart?.getChart ? Chart.getChart(c) : null;
        if (grafico) {
          try { grafico.resize(); } catch (e) {}
        }
      });
    } catch (e) {}
  };

  window.aplicarServicoPadraoP1 = function() {
    [
      "filtroKpiServico",
      "filtroComparativoServico",
      "filtroExecucaoServico",
      "filtroServico",
      "filtroServicoPainel"
    ].forEach(id => {
      const campo = document.getElementById(id);
      if (!campo) return;

      const temP1 = Array.from(campo.options || []).some(op => op.value === "P1");
      if (temP1 && !campo.value) campo.value = "P1";
    });
  };

  ccoInstalarChartSeguro();
  document.addEventListener("DOMContentLoaded", () => {
    ccoInstalarChartSeguro();
    setTimeout(() => {
      window.aplicarServicoPadraoP1?.();
      window.ccoAjustarGraficosVisiveis?.();
    }, 800);
  });
})();



/* =====================================================
   PATCH FINAL 20260602 • GITHUB PAGES
   - P1 como padrão em todos os filtros de serviço
   - Maio/mês filtrado não soma todos os meses por perda de valor
   - Datas do gráfico diário inclinadas e com autoSkip
===================================================== */
(function(){
  "use strict";

  const SERVICO_PADRAO_CCO = "P1";
  let ccoAplicandoPeriodo = false;

  function ccoNormalizarServicoValor(valor) {
    const texto = String(valor || "").toUpperCase().trim();
    const m = texto.match(/P\d+(?:\.\d+)?/);
    return m ? m[0] : texto;
  }

  function ccoSetSelectServicoP1(select, disparar = false) {
    if (!select || select.tagName !== "SELECT") return false;

    const opcoes = Array.from(select.options || []);
    if (!opcoes.length) return false;

    const opcaoP1 =
      opcoes.find(op => ccoNormalizarServicoValor(op.value) === SERVICO_PADRAO_CCO) ||
      opcoes.find(op => ccoNormalizarServicoValor(op.textContent) === SERVICO_PADRAO_CCO);

    if (!opcaoP1) return false;

    const valorAtual = ccoNormalizarServicoValor(select.value);
    const valorTextoAtual = ccoNormalizarServicoValor(select.options[select.selectedIndex]?.textContent || "");

    if (!valorAtual || valorAtual === "TODOS" || valorAtual === "SELECIONAR" || valorAtual === "" || valorTextoAtual === "TODOS") {
      select.value = opcaoP1.value;
      if (disparar) {
        try { select.dispatchEvent(new Event("change", { bubbles: true })); } catch(e) {}
      }
      return true;
    }

    return false;
  }

  window.aplicarServicoPadraoP1 = function(disparar = false) {
    const idsPreferenciais = [
      "filtroKpiServico",
      "filtroComparativoServico",
      "filtroExecucaoServico",
      "filtroServico",
      "filtroServicoPainel",
      "filtroGraficoDoisMesesServico",
      "filtroServicoComparativoMeses"
    ];

    idsPreferenciais.forEach(id => {
      ccoSetSelectServicoP1(document.getElementById(id), disparar);
    });

    document.querySelectorAll("select").forEach(select => {
      const idNome = `${select.id || ""} ${select.name || ""} ${select.closest(".filter-group")?.textContent || ""}`.toLowerCase();
      if (idNome.includes("serviço") || idNome.includes("servico") || idNome.includes("kpi") || idNome.includes("comparativo")) {
        ccoSetSelectServicoP1(select, disparar);
      }
    });

    // Página Execução P1 a P12: se nenhum serviço estiver aberto, abre P1.
    try {
      const telaContrato = document.getElementById("tela-contrato");
      const detalheAtivo = document.getElementById("servico-detalhe")?.classList.contains("ativa");
      if (telaContrato && telaContrato.classList.contains("ativa") && !detalheAtivo && typeof window.mostrarServico === "function") {
        const botaoP1 = Array.from(document.querySelectorAll("#tela-contrato .servico-btn, #tela-contrato button"))
          .find(btn => /^P1\b/i.test((btn.innerText || "").trim()));
        window.mostrarServico("P1", botaoP1 || null);
      }
    } catch(e) {}
  };

  function ccoMesesDisponiveis() {
    const pares = [];
    try {
      (window.operacoesOriginal || operacoesOriginal || []).forEach(item => {
        const data = String(item.data_normalizada || "");
        if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
          pares.push({ ano: data.slice(0,4), mes: data.slice(5,7), dia: data.slice(8,10) });
        }
      });
    } catch(e) {}
    return pares;
  }

  function ccoAnoMaisRecenteParaMes(mes) {
    const anos = ccoMesesDisponiveis()
      .filter(p => !mes || p.mes === mes)
      .map(p => p.ano)
      .sort();
    return anos[anos.length - 1] || "";
  }

  function ccoValorSelect(id) {
    return document.getElementById(id)?.value || "";
  }

  function ccoRestaurarPeriodo(dia, mes, ano) {
    const campoDia = document.getElementById("filtroDia");
    const campoMes = document.getElementById("filtroMes");
    const campoAno = document.getElementById("filtroAno");
    if (campoDia) campoDia.value = dia || "";
    if (campoMes) campoMes.value = mes || "";
    if (campoAno) campoAno.value = ano || "";
  }

  const aplicarFiltroPeriodoOriginal = window.aplicarFiltroPeriodoExecutivo;
  window.aplicarFiltroPeriodoExecutivo = function() {
    if (ccoAplicandoPeriodo) return;
    ccoAplicandoPeriodo = true;

    let dia = ccoValorSelect("filtroDia");
    let mes = ccoValorSelect("filtroMes");
    let ano = ccoValorSelect("filtroAno");

    // Se o usuário escolheu mês (ex.: Maio) sem ano, evita somar todos os anos/meses.
    // Usa o ano mais recente disponível para aquele mês.
    if (mes && !ano) {
      ano = ccoAnoMaisRecenteParaMes(mes);
      const campoAno = document.getElementById("filtroAno");
      if (campoAno && ano) campoAno.value = ano;
    }

    try {
      if (Array.isArray(operacoesOriginal)) {
        operacoes = operacoesOriginal.filter(item => {
          const data = String(item.data_normalizada || "");
          if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
          return (!ano || data.slice(0,4) === ano) &&
                 (!mes || data.slice(5,7) === mes) &&
                 (!dia || data.slice(8,10) === dia);
        });
      }

      if (typeof window.recalcularPainelPorFiltroPeriodo === "function") {
        window.recalcularPainelPorFiltroPeriodo(operacoes, ano, mes, dia);
      } else if (typeof recalcularPainelPorFiltroPeriodo === "function") {
        recalcularPainelPorFiltroPeriodo(operacoes, ano, mes, dia);
      }

      // Renderiza sem perder o mês/ano selecionado.
      if (typeof window.atualizarDashboard === "function") {
        window.atualizarDashboard();
      } else if (typeof atualizarDashboard === "function") {
        atualizarDashboard();
      }
      ccoRestaurarPeriodo(dia, mes, ano);
      setTimeout(() => ccoRestaurarPeriodo(dia, mes, ano), 50);
    } catch (erro) {
      console.warn("Filtro mensal seguro falhou; usando filtro original.", erro);
      try { aplicarFiltroPeriodoOriginal?.(); } catch(e) {}
    } finally {
      ccoAplicandoPeriodo = false;
    }
  };

  // Limpar período deve retornar para o último mês/ano disponível, não para soma geral escondida.
  const limparFiltroPeriodoOriginal = window.limparFiltroPeriodo;
  window.limparFiltroPeriodo = function() {
    try {
      const pares = ccoMesesDisponiveis().sort((a,b) => `${a.ano}-${a.mes}`.localeCompare(`${b.ano}-${b.mes}`));
      const ultimo = pares[pares.length - 1] || {};
      const campoDia = document.getElementById("filtroDia");
      const campoMes = document.getElementById("filtroMes");
      const campoAno = document.getElementById("filtroAno");
      if (campoDia) campoDia.value = "";
      if (campoMes) campoMes.value = ultimo.mes || "";
      if (campoAno) campoAno.value = ultimo.ano || "";
      window.aplicarFiltroPeriodoExecutivo();
    } catch(e) {
      try { limparFiltroPeriodoOriginal?.(); } catch(_) {}
    }
  };

  function ccoEhLabelData(label) {
    const s = String(label || "");
    return /^\d{2}\/\d{2}(?:\/\d{2,4})?$/.test(s) ||
           /^\d{4}-\d{2}-\d{2}$/.test(s) ||
           /\b\d{2}\/\d{2}\b/.test(s);
  }

  function ccoGraficoTemDatas(config) {
    const labels = config?.data?.labels || [];
    if (!Array.isArray(labels) || !labels.length) return false;
    return labels.filter(ccoEhLabelData).length >= Math.max(3, Math.ceil(labels.length * 0.5));
  }

  const sanitizadorAnterior = window.ccoSanitizarConfigGrafico;
  window.ccoSanitizarConfigGrafico = function(config) {
    if (typeof sanitizadorAnterior === "function") {
      try { config = sanitizadorAnterior(config); } catch(e) {}
    }
    config = config || {};
    config.options = config.options || {};
    config.options.scales = config.options.scales || {};

    const temDatas = ccoGraficoTemDatas(config);
    if (temDatas) {
      config.options.layout = config.options.layout || {};
      config.options.layout.padding = Object.assign({ bottom: 26, top: 18, left: 8, right: 12 }, config.options.layout.padding || {});
      config.options.scales.x = config.options.scales.x || {};
      config.options.scales.x.ticks = Object.assign({}, config.options.scales.x.ticks || {}, {
        maxRotation: 55,
        minRotation: 45,
        autoSkip: true,
        maxTicksLimit: 12,
        padding: 8,
        callback: function(value) {
          const label = this.getLabelForValue ? this.getLabelForValue(value) : value;
          return String(label).replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2");
        }
      });
    }

    // Evita labels sobrepostos para gráficos com muitas categorias.
    const labels = config?.data?.labels || [];
    if (Array.isArray(labels) && labels.length > 8 && config.options.scales.x && !temDatas) {
      config.options.scales.x.ticks = Object.assign({}, config.options.scales.x.ticks || {}, {
        autoSkip: true,
        maxTicksLimit: 10,
        maxRotation: 30,
        minRotation: 0
      });
    }

    return config;
  };

  // Wrapper adicional: qualquer new Chart passa pelo sanitizador acima.
  function ccoReinstalarChartSeguroFinal() {
    if (!window.Chart || window.Chart.__ccoP1DatasFinal) return;
    const Base = window.Chart;
    const Seguro = new Proxy(Base, {
      construct(target, args) {
        try {
          const item = args[0];
          let canvas = null;
          if (typeof item === "string") canvas = document.getElementById(item);
          else if (item && item.canvas) canvas = item.canvas;
          else canvas = item;

          if (canvas && target.getChart) {
            const antigo = target.getChart(canvas);
            if (antigo) antigo.destroy();
          }

          args[1] = window.ccoSanitizarConfigGrafico ? window.ccoSanitizarConfigGrafico(args[1] || {}) : (args[1] || {});
          return Reflect.construct(target, args);
        } catch(erro) {
          console.warn("Gráfico bloqueado para não travar a página:", erro);
          return { destroy(){}, update(){}, resize(){}, render(){}, stop(){}, clear(){}, data:{}, options:{} };
        }
      }
    });
    Object.getOwnPropertyNames(Base).forEach(nome => {
      try { Object.defineProperty(Seguro, nome, Object.getOwnPropertyDescriptor(Base, nome)); } catch(e) {}
    });
    Seguro.__ccoP1DatasFinal = true;
    window.Chart = Seguro;
  }

  const mostrarTelaOriginal = window.mostrarTela;
  window.mostrarTela = function(nome, botao) {
    const r = mostrarTelaOriginal ? mostrarTelaOriginal(nome, botao) : undefined;
    setTimeout(() => {
      window.aplicarServicoPadraoP1?.(false);
      if (nome === "kpi") {
        const s = document.getElementById("filtroKpiServico");
        if (s && ccoNormalizarServicoValor(s.value) !== "P1") {
          ccoSetSelectServicoP1(s, true);
        }
      }
      if (nome === "comparativo") {
        const s = document.getElementById("filtroComparativoServico");
        if (s && ccoNormalizarServicoValor(s.value) !== "P1") {
          ccoSetSelectServicoP1(s, true);
        }
      }
      if (nome === "contrato" && typeof window.mostrarServico === "function") {
        const ativo = window.obterServicoAtivo ? window.obterServicoAtivo() : "";
        if (!ativo) {
          const botaoP1 = Array.from(document.querySelectorAll("#tela-contrato .servico-btn, #tela-contrato button"))
            .find(btn => /^P1\b/i.test((btn.innerText || "").trim()));
          window.mostrarServico("P1", botaoP1 || null);
        }
      }
    }, 120);
    return r;
  };

  ccoReinstalarChartSeguroFinal();

  document.addEventListener("DOMContentLoaded", function() {
    ccoReinstalarChartSeguroFinal();
    const aplicar = () => {
      window.aplicarServicoPadraoP1?.(false);
      // Se existir filtro KPI, força P1 na primeira carga.
      ccoSetSelectServicoP1(document.getElementById("filtroKpiServico"), false);
      ccoSetSelectServicoP1(document.getElementById("filtroComparativoServico"), false);
    };
    setTimeout(aplicar, 300);
    setTimeout(aplicar, 1000);
    setTimeout(aplicar, 2000);
  });

  // Observa filtros criados depois por renderização dinâmica.
  try {
    const obs = new MutationObserver(() => {
      clearTimeout(window.__ccoP1ObserverTimer);
      window.__ccoP1ObserverTimer = setTimeout(() => window.aplicarServicoPadraoP1?.(false), 80);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  } catch(e) {}
})();


/* =====================================================
   PATCH FINAL • DIAS_OPERAÇÃO COMO FONTE OFICIAL
   - O Total Dias Mês agora vem da aba Dias_Operação.
   - Usa o ano/mês importado e evita calcular pelo calendário.
   - Mantém fallback para calendário quando a aba não existir.
===================================================== */
(function(){
  const CCO_CACHE_DIAS_OPERACAO = { assinatura: '', mapa: null };

  function ccoNormTxt(v){
    return String(v ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
  }

  function ccoNum(v){
    try { return typeof numero === 'function' ? numero(v) : Number(v || 0); }
    catch(e){ return Number(v || 0) || 0; }
  }

  function ccoPeriodoAtualImportado(){
    try {
      if (typeof obterPeriodoImportado === 'function') return obterPeriodoImportado();
    } catch(e) {}
    const datas = (Array.isArray(operacoes) ? operacoes : [])
      .map(i => String(i.data_normalizada || i.data_operacao || i.data || ''))
      .filter(d => /^\d{4}-\d{2}/.test(d))
      .sort();
    const d = datas[datas.length - 1] || new Date().toISOString().slice(0,10);
    return { ano: Number(d.slice(0,4)), mes: Number(d.slice(5,7)) };
  }

  function ccoMesNumero(v){
    const n = ccoNum(v);
    if (n >= 1 && n <= 12) return n;
    const s = ccoNormTxt(v);
    const meses = {
      janeiro:1, jan:1, fevereiro:2, fev:2, marco:3, mar:3, abril:4, abr:4,
      maio:5, mai:5, junho:6, jun:6, julho:7, jul:7, agosto:8, ago:8,
      setembro:9, set:9, outubro:10, out:10, novembro:11, nov:11, dezembro:12, dez:12
    };
    return meses[s] || 0;
  }

  function ccoEncontrarAbaDiasOperacao(){
    if (!sheetsOriginais || typeof sheetsOriginais !== 'object') return null;
    const chaves = Object.keys(sheetsOriginais);
    let chave = chaves.find(k => {
      const n = ccoNormTxt(k);
      return n.includes('dias') && (n.includes('operacao') || n.includes('op'));
    });
    if (!chave) {
      chave = chaves.find(k => ccoNormTxt(k).includes('dias_operacao'));
    }
    return chave ? sheetsOriginais[chave] : null;
  }

  function ccoLerDiasOperacaoMapa(){
    const aba = ccoEncontrarAbaDiasOperacao();
    const dados = aba?.dadosNormalizados || aba?.dadosOriginais || [];
    const assinatura = `${aba?.nomeOriginal || ''}|${dados.length}|${(dados[0] && JSON.stringify(dados[0]).slice(0,200)) || ''}`;
    if (CCO_CACHE_DIAS_OPERACAO.assinatura === assinatura && CCO_CACHE_DIAS_OPERACAO.mapa) {
      return CCO_CACHE_DIAS_OPERACAO.mapa;
    }

    const mapa = { porAnoMes: {}, porMes: {}, existe: !!aba };
    const periodo = ccoPeriodoAtualImportado();

    (dados || []).forEach(linha => {
      const obj = {};
      Object.keys(linha || {}).forEach(k => obj[ccoNormTxt(k)] = linha[k]);
      const keys = Object.keys(obj);

      let ano = ccoNum(obj.ano || obj.ano_ref || obj.exercicio || obj.year);
      let mes = ccoMesNumero(obj.mes || obj.mes_ref || obj.mes_numero || obj.mes_referencia || obj.competencia);

      const dataCampo = obj.data || obj.competencia || obj.periodo || obj.mes_ano || obj.referencia;
      const dataTexto = String(dataCampo || '');
      const mIso = dataTexto.match(/(20\d{2})[-\/](\d{1,2})/);
      const mBr = dataTexto.match(/(\d{1,2})[-\/](20\d{2})/);
      if ((!ano || !mes) && mIso) { ano = ano || Number(mIso[1]); mes = mes || Number(mIso[2]); }
      if ((!ano || !mes) && mBr) { mes = mes || Number(mBr[1]); ano = ano || Number(mBr[2]); }

      let dias = 0;
      const chaveDias = keys.find(k =>
        (k.includes('dias') && (k.includes('operacao') || k.includes('operacional') || k.includes('mes'))) ||
        k === 'dias' || k === 'dia_operacao' || k === 'total_dias'
      );
      if (chaveDias) dias = ccoNum(obj[chaveDias]);

      // Formato horizontal: uma linha com colunas Janeiro/Fevereiro/.../Maio.
      if (!dias) {
        const meses = {janeiro:1,jan:1,fevereiro:2,fev:2,marco:3,mar:3,abril:4,abr:4,maio:5,mai:5,junho:6,jun:6,julho:7,jul:7,agosto:8,ago:8,setembro:9,set:9,outubro:10,out:10,novembro:11,nov:11,dezembro:12,dez:12};
        keys.forEach(k => {
          const mesCol = meses[k];
          const val = ccoNum(obj[k]);
          if (mesCol && val > 0 && val <= 31) {
            const anoCol = ano || periodo.ano || new Date().getFullYear();
            mapa.porAnoMes[`${anoCol}-${String(mesCol).padStart(2,'0')}`] = val;
            mapa.porMes[String(mesCol).padStart(2,'0')] = val;
          }
        });
        return;
      }

      // Se mês/ano não vierem na linha, usa o período real da importação.
      mes = mes || periodo.mes;
      ano = ano || periodo.ano;

      if (dias > 0 && dias <= 31 && mes >= 1 && mes <= 12) {
        const mm = String(mes).padStart(2,'0');
        mapa.porMes[mm] = dias;
        if (ano) mapa.porAnoMes[`${ano}-${mm}`] = dias;
      }
    });

    CCO_CACHE_DIAS_OPERACAO.assinatura = assinatura;
    CCO_CACHE_DIAS_OPERACAO.mapa = mapa;
    return mapa;
  }

  window.ccoObterTotalDiasOperacao = function(ano, mes){
    return window.CCO_REGRAS.obterDiasOperacao(ano,mes);
  };

  if (typeof calcularTotalDiasMes === 'function') {
    const ccoCalcularTotalDiasMesOriginal = calcularTotalDiasMes;
    calcularTotalDiasMes = function(ano, mes){
      const diasAba = window.ccoObterTotalDiasOperacao(ano, mes);
      if (diasAba) return diasAba;
      return ccoCalcularTotalDiasMesOriginal(ano, mes);
    };
  }

  if (typeof gerarPainelExecutivo === 'function') {
    const ccoGerarPainelExecutivoOriginalDias = gerarPainelExecutivo;
    gerarPainelExecutivo = function(){
      const r = ccoGerarPainelExecutivoOriginalDias.apply(this, arguments);
      try {
        const periodo = ccoPeriodoAtualImportado();
        const diasAba = window.ccoObterTotalDiasOperacao(periodo.ano, periodo.mes);
        if (diasAba && Array.isArray(painelExecutivo)) {
          painelExecutivo = painelExecutivo.map(item => ({ ...item, total_dias_mes: diasAba }));
        }
      } catch(e) { console.warn('Não foi possível aplicar Dias_Operação no painel:', e); }
      return r;
    };
  }

  if (typeof montarLinhasPainelSupabase === 'function') {
    const ccoMontarLinhasPainelSupabaseOriginalDias = montarLinhasPainelSupabase;
    montarLinhasPainelSupabase = function(importacaoId, periodo){
      const linhas = ccoMontarLinhasPainelSupabaseOriginalDias(importacaoId, periodo) || [];
      const diasAba = window.ccoObterTotalDiasOperacao(periodo?.ano, periodo?.mes);
      return diasAba ? linhas.map(l => ({ ...l, total_dias_mes: diasAba })) : linhas;
    };
  }

  if (typeof gerarPainelExecucaoMensal === 'function') {
    const ccoGerarPainelExecucaoMensalOriginalDias = gerarPainelExecucaoMensal;
    gerarPainelExecucaoMensal = function(){
      const resultado = ccoGerarPainelExecucaoMensalOriginalDias.apply(this, arguments);
      try {
        const periodo = resultado?.periodo || {};
        const diasAba = window.ccoObterTotalDiasOperacao(periodo.ano, periodo.mes);
        if (diasAba && Array.isArray(resultado?.painel)) {
          resultado.painel = resultado.painel.map(item => ({ ...item, total_dias_mes: diasAba }));
        }
      } catch(e) {}
      return resultado;
    };
  }

  // Recalcula o painel visível após importação/carregamento para refletir a aba Dias_Operação.
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(() => {
      try {
        const periodo = ccoPeriodoAtualImportado();
        const diasAba = window.ccoObterTotalDiasOperacao(periodo.ano, periodo.mes);
        if (diasAba && Array.isArray(painelExecutivo)) {
          painelExecutivo = painelExecutivo.map(item => ({ ...item, total_dias_mes: diasAba }));
          painelExecutivoOriginal = (painelExecutivoOriginal || painelExecutivo).map(item => ({ ...item, total_dias_mes: diasAba }));
          if (typeof renderTabelaExecutiva === 'function') renderTabelaExecutiva();
          if (typeof renderTabelaContratualMensal === 'function') renderTabelaContratualMensal();
        }
      } catch(e) {}
    }, 1200);
  });
})();


/* =====================================================
   ESTRUTURA SEPARADA POR PÁGINA
   Evita carregar/processar gráficos de páginas que não estão abertas.
   Página atual: window.CCO_PAGE = painel | kpi | execucao | dados | historico
===================================================== */

function ccoPaginaAtual() {
  return window.CCO_PAGE || "painel";
}

/* Comparativo Mensal removido por solicitação. */
function renderComparativoMensal() { return; }
function renderAnaliseComparativoMensal() { return; }
function renderGraficosMensais() { return; }
function renderRankingMensal() { return; }
function renderComparativoMensalPorServico() { return; }
function carregarFiltrosComparativoServico() { return; }
function renderComparativoDinamicoFinal() { return; }

/* Dashboard final por página. */
function atualizarDashboard() {
  const pagina = ccoPaginaAtual();

  if (pagina === "painel") {
    if (typeof renderCards === "function") renderCards();
    if (typeof renderTabelaExecutiva === "function") renderTabelaExecutiva();
    if (typeof renderResumo === "function") renderResumo();
    if (typeof renderResumoAutomaticoDiretoria === "function") renderResumoAutomaticoDiretoria();
    if (typeof renderRankingOperacional === "function") renderRankingOperacional();
    if (typeof renderAlertas === "function") renderAlertas();
    if (typeof renderFiltros === "function") renderFiltros();
    if (typeof carregarFiltrosPeriodoDisponiveis === "function") carregarFiltrosPeriodoDisponiveis();
    if (typeof renderGraficos === "function") renderGraficos();
    if (typeof renderRankingPorMedicao === "function") renderRankingPorMedicao();
  }

  if (pagina === "kpi") {
    if (typeof carregarFiltrosKpiServicoCompleto === "function") carregarFiltrosKpiServicoCompleto();
    if (typeof renderPaginaKpiPorServicoCompleto === "function") {
      renderPaginaKpiPorServicoCompleto();
    } else if (typeof renderPaginaKpi === "function") {
      renderPaginaKpi();
    }
    if (typeof corrigirResumoKpiSomenteNaPagina === "function") corrigirResumoKpiSomenteNaPagina();
    if (typeof corrigirCardsKpiSomenteNaPagina === "function") corrigirCardsKpiSomenteNaPagina();
  }

  if (pagina === "execucao") {
    if (typeof renderTabelaContratualMensal === "function") renderTabelaContratualMensal();
    if (typeof carregarFiltrosExecucaoMensal === "function") carregarFiltrosExecucaoMensal();
    if (typeof carregarFiltroMesesComparativoExecucao === "function") carregarFiltroMesesComparativoExecucao();
    if (typeof renderComparativoMesesExecucao === "function") renderComparativoMesesExecucao();
  }

  if (pagina === "dados") {
    if (typeof renderFiltros === "function") renderFiltros();
    if (typeof renderTabelaDados === "function") renderTabelaDados();
  }

  if (pagina === "historico") {
    if (typeof carregarHistorico === "function") carregarHistorico();
  }

  if (typeof aplicarRestricoesPerfil === "function") aplicarRestricoesPerfil();
}

/* Navegação em páginas separadas. */
function mostrarTela(nome) {
  const mapa = {
    executivo: "index.html",
    painel: "index.html",
    kpi: "kpi.html",
    contrato: "execucao.html",
    execucao: "execucao.html",
    dados: "dados.html",
    historico: "historico.html"
  };

  if (nome === "comparativo") {
    window.location.href = "index.html";
    return;
  }

  window.location.href = mapa[nome] || "index.html";
}


/* =====================================================
   PATCH FINAL • DIAS_OPERAÇÃO POR MÊS/ANO
   Corrige casos como "abr/26", "mai/26", "nov/25"
   e impede fallback para dias corridos do mês.
===================================================== */
const CCO_DIAS_OPERACAO_OFICIAL_FIXO = window.CCO_REGRAS.DIAS_OPERACAO;

const CCO_MESES_ABREV = {
  jan: "01", janeiro: "01",
  fev: "02", fevereiro: "02",
  mar: "03", março: "03", marco: "03",
  abr: "04", abril: "04",
  mai: "05", maio: "05",
  jun: "06", junho: "06",
  jul: "07", julho: "07",
  ago: "08", agosto: "08",
  set: "09", setembro: "09",
  out: "10", outubro: "10",
  nov: "11", novembro: "11",
  dez: "12", dezembro: "12"
};

function ccoNormalizarTextoMesOperacao(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function ccoExtrairAnoMesDiasOperacao(valor) {
  if (valor === null || valor === undefined || valor === "") return null;

  // Excel serial date
  if (typeof valor === "number" && valor > 20000 && valor < 60000) {
    const data = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return {
      ano: data.getUTCFullYear(),
      mes: String(data.getUTCMonth() + 1).padStart(2, "0")
    };
  }

  const txt = ccoNormalizarTextoMesOperacao(valor);

  // Formato: abr/26, maio/26, nov/2025
  let m = txt.match(/^([a-zç]+)\s*\/\s*(\d{2,4})$/i);
  if (m) {
    const mes = CCO_MESES_ABREV[m[1]];
    let ano = Number(m[2]);
    if (ano < 100) ano += 2000;
    if (mes && ano) return { ano, mes };
  }

  // Formato: 04/2026 ou 4/26
  m = txt.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
  if (m) {
    const mes = String(Number(m[1])).padStart(2, "0");
    let ano = Number(m[2]);
    if (ano < 100) ano += 2000;
    if (Number(mes) >= 1 && Number(mes) <= 12 && ano) return { ano, mes };
  }

  // Formato: 01/04/2026 ou 2026-04-01
  m = txt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const mes = String(Number(m[2])).padStart(2, "0");
    let ano = Number(m[3]);
    if (ano < 100) ano += 2000;
    return { ano, mes };
  }

  m = txt.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return { ano: Number(m[1]), mes: m[2] };

  return null;
}

function ccoLinhaDiasOperacaoParaAnoMes(linha) {
  const obj = linha || {};

  const valorMes =
    obj.mes ||
    obj["mês"] ||
    obj.Mes ||
    obj["Mês"] ||
    obj.periodo ||
    obj.Periodo ||
    obj["Período"] ||
    "";

  return ccoExtrairAnoMesDiasOperacao(valorMes);
}

function ccoValorDiasOperacaoLinha(linha) {
  const obj = linha || {};

  return numero(
    obj.dias_operacao ??
    obj["dias_operacao"] ??
    obj["Dias_Operação"] ??
    obj["Dias Operação"] ??
    obj["dias operação"] ??
    obj["Dias_Operacao"] ??
    obj["Dias Operacao"] ??
    obj.dias ??
    obj.Dias ??
    obj.total_dias_mes ??
    obj["Total Dias Mês"] ??
    0
  );
}

function ccoLerDiasOperacaoMapaFinal() {
  const mapa = { porAnoMes: {}, porMes: {} };

  // 1) Valores fixos oficiais informados pela planilha
  Object.entries(CCO_DIAS_OPERACAO_OFICIAL_FIXO).forEach(([chave, dias]) => {
    const [ano, mes] = chave.split("-");
    mapa.porAnoMes[chave] = dias;
    mapa.porMes[mes] = dias;
  });

  // 2) Valores vindos da aba Dias_Operação, quando a planilha estiver carregada
  try {
    Object.values(sheetsOriginais || {}).forEach(aba => {
      const nome = ccoNormalizarTextoMesOperacao(aba?.nomeOriginal || "");
      const ehDias =
        nome.includes("dias_operacao") ||
        nome.includes("dias operacao") ||
        nome.includes("dias");

      if (!ehDias) return;

      const linhas = aba.dadosNormalizados || aba.dadosOriginais || [];

      linhas.forEach(linha => {
        const ref = ccoLinhaDiasOperacaoParaAnoMes(linha);
        const dias = ccoValorDiasOperacaoLinha(linha);

        if (!ref || !dias || dias <= 0 || dias > 31) return;

        const chave = `${ref.ano}-${ref.mes}`;
        mapa.porAnoMes[chave] = dias;
        mapa.porMes[ref.mes] = dias;
      });
    });
  } catch (e) {
    console.warn("Não foi possível ler Dias_Operação da planilha:", e);
  }

  return mapa;
}

window.ccoObterTotalDiasOperacao = function(ano, mes) {
  const mapa = ccoLerDiasOperacaoMapaFinal();
  const a = Number(ano || 0);
  const m = Number(mes || 0);
  const mm = String(m).padStart(2, "0");
  const chave = `${a}-${mm}`;

  if (a && m && mapa.porAnoMes[chave]) return mapa.porAnoMes[chave];
  if (m && mapa.porMes[mm]) return mapa.porMes[mm];

  return 0;
};

function calcularTotalDiasMes(ano, mes) {
  return window.CCO_REGRAS.obterDiasOperacao(ano,mes);
}

function ccoAplicarDiasOperacaoNoPainel(painel, ano, mes) {
  const dias = window.ccoObterTotalDiasOperacao(ano, mes);
  if (!dias || !Array.isArray(painel)) return painel;

  return painel.map(item => ({
    ...item,
    total_dias_mes: dias
  }));
}

/* Recalcula filtro do painel sempre usando Dias_Operação. */
if (typeof recalcularPainelPorFiltro === "function") {
  const ccoRecalcularPainelPorFiltroOriginalDiasFinal = recalcularPainelPorFiltro;
  recalcularPainelPorFiltro = function(dadosFiltro, ano, mes) {
    const r = ccoRecalcularPainelPorFiltroOriginalDiasFinal.apply(this, arguments);
    painelExecutivo = ccoAplicarDiasOperacaoNoPainel(painelExecutivo, ano, mes);
    return r;
  };
}

/* Corrige execução P1 a P12. */
if (typeof gerarPainelExecucaoMensal === "function") {
  const ccoGerarPainelExecucaoMensalOriginalDiasFinal = gerarPainelExecucaoMensal;
  gerarPainelExecucaoMensal = function() {
    const resultado = ccoGerarPainelExecucaoMensalOriginalDiasFinal.apply(this, arguments);

    try {
      const periodo = resultado?.periodo || {};
      const ano = periodo.ano || filtroExecucaoAnoAtual || "";
      const mes = periodo.mes || filtroExecucaoMesAtual || "";
      if (resultado && Array.isArray(resultado.painel)) {
        resultado.painel = ccoAplicarDiasOperacaoNoPainel(resultado.painel, ano, mes);
      }
    } catch (e) {
      console.warn("Não foi possível aplicar Dias_Operação na execução:", e);
    }

    return resultado;
  };
}

/* Salva no Supabase com o total correto. */
if (typeof montarLinhasPainelSupabase === "function") {
  const ccoMontarLinhasPainelSupabaseOriginalDiasFinal = montarLinhasPainelSupabase;
  montarLinhasPainelSupabase = function(importacaoId, periodo) {
    const linhas = ccoMontarLinhasPainelSupabaseOriginalDiasFinal.apply(this, arguments) || [];
    const dias = window.ccoObterTotalDiasOperacao(periodo?.ano, periodo?.mes);

    if (!dias) return linhas;

    return linhas.map(linha => ({
      ...linha,
      total_dias_mes: dias
    }));
  };
}

console.log("Patch Dias_Operação ativo. Abril/2026 =", window.ccoObterTotalDiasOperacao(2026, 4));


/* =====================================================
   SAP ANALYTICS CLOUD • PALETA CLARA + VALORES DESTACADOS
   Seguro: não altera a lógica dos gráficos, apenas aparência.
===================================================== */
window.CCO_SAP_CORES_CLARAS = [
  "#DFF7E8", // verde gelo
  "#BBF7D0", // verde claro
  "#86EFAC", // verde folha claro
  "#4ADE80", // verde médio claro
  "#22C55E", // verde principal
  "#16A34A", // verde institucional
  "#15803D", // verde escuro
  "#A7F3D0", // menta
  "#DCFCE7", // fundo verde
  "#ECFDF5"  // verde quase branco
];

window.CCO_SAP_BORDAS_CLARAS = [
  "#16A34A",
  "#22C55E",
  "#059669",
  "#15803D",
  "#0F7B4D",
  "#0B5D3B",
  "#047857",
  "#34D399",
  "#4ADE80",
  "#65A30D"
];

function ccoSapFormatarValorGrafico(valor) {
  const n = Number(valor || 0);
  if (!Number.isFinite(n) || n === 0) return "";

  if (Math.abs(n) >= 1000000) {
    return (n / 1000000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1
    }) + " mi";
  }

  if (Math.abs(n) >= 1000) {
    return n.toLocaleString("pt-BR", {
      maximumFractionDigits: 0
    });
  }

  return n.toLocaleString("pt-BR", {
    maximumFractionDigits: 1
  });
}

function ccoSapAplicarCoresConfig(config) {
  try {
    if (!config || !config.data || !Array.isArray(config.data.datasets)) return config;

    const tipo = config.type || "bar";

    config.data.datasets.forEach((dataset, index) => {
      const cor = window.CCO_SAP_CORES_CLARAS[index % window.CCO_SAP_CORES_CLARAS.length];
      const borda = window.CCO_SAP_BORDAS_CLARAS[index % window.CCO_SAP_BORDAS_CLARAS.length];

      // Se for gráfico de valor contratado, mantém amarelo claro.
      const label = String(dataset.label || "").toLowerCase();
      const ehValor = label.includes("valor") || label.includes("contratado") || label.includes("financeiro");

      if (ehValor) {
        dataset.backgroundColor = "#FDE68A";
        dataset.borderColor = "#FBBF24";
      } else if (tipo === "doughnut" || tipo === "pie") {
        const qtd = Array.isArray(config.data.labels) ? config.data.labels.length : 8;
        dataset.backgroundColor = Array.from({ length: qtd }, (_, i) =>
          window.CCO_SAP_CORES_CLARAS[i % window.CCO_SAP_CORES_CLARAS.length]
        );
        dataset.borderColor = "#ffffff";
      } else if (Array.isArray(dataset.backgroundColor)) {
        dataset.backgroundColor = dataset.backgroundColor.map((_, i) =>
          window.CCO_SAP_CORES_CLARAS[i % window.CCO_SAP_CORES_CLARAS.length]
        );
        dataset.borderColor = dataset.backgroundColor.map((_, i) =>
          window.CCO_SAP_BORDAS_CLARAS[i % window.CCO_SAP_BORDAS_CLARAS.length]
        );
      } else {
        dataset.backgroundColor = cor;
        dataset.borderColor = borda;
      }

      dataset.borderWidth = dataset.borderWidth || 2;
      dataset.borderRadius = dataset.borderRadius ?? 12;

      if (tipo === "line") {
        dataset.backgroundColor = "rgba(191,219,254,.35)";
        dataset.borderColor = borda;
        dataset.pointBackgroundColor = "#ffffff";
        dataset.pointBorderColor = borda;
        dataset.pointBorderWidth = 2;
        dataset.pointRadius = dataset.pointRadius || 4;
        dataset.tension = dataset.tension ?? 0.38;
        dataset.borderWidth = dataset.borderWidth || 3;
      }
    });

    config.options = config.options || {};
    config.options.plugins = config.options.plugins || {};
    config.options.plugins.legend = config.options.plugins.legend || {};
    config.options.plugins.legend.labels = Object.assign(
      {
        color: "#FFFFFF",
        font: {
          size: 12,
          weight: "bold"
        },
        usePointStyle: true,
        pointStyle: "circle"
      },
      config.options.plugins.legend.labels || {}
    );

    config.options.plugins.tooltip = Object.assign(
      {
        backgroundColor: "rgba(0,0,0,.88)",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "rgba(255,255,255,.7)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12
      },
      config.options.plugins.tooltip || {}
    );

  } catch (e) {
    console.warn("Não foi possível aplicar paleta SAP:", e);
  }

  return config;
}

(function ccoSapPatchChartConstructor() {
  if (!window.Chart || window.__ccoSapChartConstructorPatch) return;

  const ChartOriginal = window.Chart;

  function ChartComTemaSap(ctx, config) {
    return new ChartOriginal(ctx, ccoSapAplicarCoresConfig(config));
  }

  Object.keys(ChartOriginal).forEach(k => {
    try { ChartComTemaSap[k] = ChartOriginal[k]; } catch(e) {}
  });

  ChartComTemaSap.prototype = ChartOriginal.prototype;
  window.Chart = ChartComTemaSap;
  window.__ccoSapChartConstructorPatch = true;
})();

const ccoSapValoresBrancosPlugin = {
  id: "ccoSapValoresBrancosPlugin",

  afterDatasetsDraw(chart) {
    try {
      const tipo = chart.config.type;
      if (tipo === "doughnut" || tipo === "pie") return;

      const ctx = chart.ctx;
      ctx.save();

      ctx.font = "900 11px Segoe UI, Arial, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "rgba(0,0,0,.85)";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,.95)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || meta.hidden) return;

        const totalPontos = meta.data.length;
        if (totalPontos > 40) return; // evita poluição visual em gráficos com muitos dias

        meta.data.forEach((element, index) => {
          const valor = Array.isArray(dataset.data) ? dataset.data[index] : 0;
          const texto = ccoSapFormatarValorGrafico(valor);
          if (!texto) return;

          const pos = element.tooltipPosition ? element.tooltipPosition() : element.getCenterPoint();
          let x = pos.x;
          let y = pos.y;

          if (tipo === "bar") {
            if (chart.options && chart.options.indexAxis === "y") {
              x = pos.x + 28;
              y = pos.y;
            } else {
              y = pos.y - 12;
            }
          }

          if (tipo === "line") {
            y = pos.y - 14;
          }

          ctx.strokeText(texto, x, y);
          ctx.fillText(texto, x, y);
        });
      });

      ctx.restore();
    } catch (e) {
      console.warn("Erro ao desenhar valores SAP:", e);
    }
  }
};

if (window.Chart && !window.__ccoSapValoresPluginRegistrado) {
  try {
    Chart.register(ccoSapValoresBrancosPlugin);
    const defaultsSAP = Chart.defaults;
    if (defaultsSAP && typeof defaultsSAP === "object") {
      defaultsSAP.color = "#FFFFFF";
      if (defaultsSAP.font && typeof defaultsSAP.font === "object") {
        defaultsSAP.font.family = "Segoe UI, Arial, sans-serif";
        defaultsSAP.font.weight = "700";
      }
      defaultsSAP.plugins = defaultsSAP.plugins || {};
      defaultsSAP.plugins.legend = defaultsSAP.plugins.legend || {};
      defaultsSAP.plugins.legend.labels = defaultsSAP.plugins.legend.labels || {};
      defaultsSAP.plugins.legend.labels.color = "#FFFFFF";
      defaultsSAP.plugins.legend.labels.font = { size: 12, weight: "bold" };
      defaultsSAP.plugins.legend.labels.usePointStyle = true;
    }

    window.__ccoSapValoresPluginRegistrado = true;
  } catch (e) {
    console.warn("Plugin SAP de valores não registrado:", e);
  }
}


/* =====================================================
   PATCH FINAL • VERDE CLARO + REMOVE VALOR PRETO DUPLICADO
   - Mantém apenas valores brancos com sombra preta.
   - Remove datalabels antigos que geravam segunda legenda/valor preto.
===================================================== */
(function ccoPatchFinalVerdeSemDuplicidade(){
  function aplicar(){
    try{
      if(!window.Chart) return;
      Object.values(Chart.instances || {}).forEach(ch => {
        if(!ch || !ch.options) return;
        ch.options.plugins = ch.options.plugins || {};
        ch.options.plugins.datalabels = { display:false };
        ch.options.plugins.legend = ch.options.plugins.legend || {};
        ch.options.plugins.legend.labels = Object.assign({
          color:'#FFFFFF',
          usePointStyle:true,
          pointStyle:'circle',
          font:{size:12, weight:'900'},
          padding:16
        }, ch.options.plugins.legend.labels || {});
        if(ch.options.scales){
          Object.values(ch.options.scales).forEach(sc => {
            sc.grid = Object.assign({ color:'rgba(5, 95, 70, .10)' }, sc.grid || {});
            sc.ticks = Object.assign({ color:'#4B6358', font:{weight:'700'} }, sc.ticks || {});
          });
        }
        ch.update('none');
      });
    }catch(e){ console.warn('Patch verde sem duplicidade:', e); }
  }
  window.ccoPatchFinalVerdeSemDuplicidade = aplicar;
  setTimeout(aplicar, 400);
  setTimeout(aplicar, 1200);
  document.addEventListener('DOMContentLoaded', aplicar);
})();


/* =====================================================
   LIMPEZA FINAL • VERDE CLARO + SEM LEGENDA/VALOR PRETO
   Aplicado por último para vencer configurações antigas.
===================================================== */
(function ccoLimpezaFinalVerdeSemPreto(){
  if (window.__CCO_LIMPEZA_FINAL_VERDE_SEM_PRETO__) return;
  window.__CCO_LIMPEZA_FINAL_VERDE_SEM_PRETO__ = true;

  const CORES_VERDES = [
    '#0B5D3B', '#0F7B4D', '#16A34A', '#22C55E',
    '#4ADE80', '#86EFAC', '#BBF7D0', '#DCFCE7'
  ];

  function formatarValorCurto(valor){
    const n = Number(valor || 0);
    if (!Number.isFinite(n) || n === 0) return '';
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + ' mi';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + ' mil';
    return n.toLocaleString('pt-BR');
  }

  function limparConfigChart(config){
    if (!config) return config;
    config.options = config.options || {};
    config.options.plugins = config.options.plugins || {};

    // Desliga o chartjs-plugin-datalabels, que era a fonte dos valores pretos duplicados.
    config.options.plugins.datalabels = { display: false };

    // Remove plugins locais antigos que escreviam labels/valores no canvas.
    if (Array.isArray(config.plugins)) {
      config.plugins = config.plugins.filter(plugin => {
        const id = String(plugin && plugin.id || '').toLowerCase();
        return !['labels', 'valuelabels', 'drawvalues', 'customlabels', 'datalabels'].includes(id);
      });
    }

    config.options.plugins.legend = config.options.plugins.legend || {};
    config.options.plugins.legend.labels = Object.assign(
      {},
      config.options.plugins.legend.labels || {},
      {
        color: '#FFFFFF',
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8,
        boxHeight: 8,
        padding: 18,
        font: { size: 12, weight: '900' }
      }
    );

    config.options.plugins.tooltip = Object.assign(
      {},
      config.options.plugins.tooltip || {},
      {
        backgroundColor: 'rgba(6, 78, 59, .96)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: 'rgba(255,255,255,.35)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12
      }
    );

    if (config.options.animation && typeof config.options.animation.onComplete === 'function') {
      delete config.options.animation.onComplete;
    }

    if (config.data && Array.isArray(config.data.datasets)) {
      config.data.datasets.forEach((dataset, i) => {
        const label = String(dataset.label || '').toLowerCase();
        const tipo = String(config.type || dataset.type || '').toLowerCase();
        if (label.includes('valor') || label.includes('contratado') || label.includes('r$')) {
          dataset.backgroundColor = '#FDE68A';
          dataset.borderColor = '#F59E0B';
        } else if (tipo === 'pie' || tipo === 'doughnut') {
          const qtd = Array.isArray(config.data.labels) ? config.data.labels.length : CORES_VERDES.length;
          dataset.backgroundColor = Array.from({length:qtd}, (_, idx) => CORES_VERDES[idx % CORES_VERDES.length]);
          dataset.borderColor = '#FFFFFF';
        } else if (!Array.isArray(dataset.backgroundColor) || dataset.backgroundColor.length <= 1) {
          dataset.backgroundColor = CORES_VERDES[i % CORES_VERDES.length];
          dataset.borderColor = CORES_VERDES[i % CORES_VERDES.length];
        }
        dataset.borderRadius = dataset.borderRadius ?? 10;
      });
    }

    if (config.options.scales) {
      Object.values(config.options.scales).forEach(scale => {
        scale.grid = Object.assign({}, scale.grid || {}, { color: 'rgba(5, 95, 70, .10)', drawBorder: false });
        scale.ticks = Object.assign({}, scale.ticks || {}, { color: '#456052', font: { size: 11, weight: '700' } });
      });
    }

    return config;
  }

  const pluginValoresBrancos = {
    id: 'ccoValoresBrancosSemDuplicidade',
    afterDatasetsDraw(chart){
      try{
        const tipo = String(chart.config.type || '').toLowerCase();
        if (tipo === 'pie' || tipo === 'doughnut') return;
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = '900 11px Segoe UI, Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = 'rgba(0,0,0,.92)';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,.75)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta || meta.hidden || !Array.isArray(meta.data)) return;
          if (meta.data.length > 36) return;
          meta.data.forEach((element, index) => {
            const texto = formatarValorCurto(Array.isArray(dataset.data) ? dataset.data[index] : 0);
            if (!texto) return;
            const pos = element.tooltipPosition ? element.tooltipPosition() : element.getCenterPoint();
            let x = pos.x;
            let y = pos.y;
            if (tipo === 'bar') y = chart.options && chart.options.indexAxis === 'y' ? pos.y : pos.y - 12;
            if (tipo === 'line') y = pos.y - 14;
            ctx.strokeText(texto, x, y);
            ctx.fillText(texto, x, y);
          });
        });
        ctx.restore();
      } catch(e) {}
    }
  };

  function aplicarEmInstancias(){
    try{
      if (!window.Chart) return;
      if (Chart.defaults && Chart.defaults.plugins) {
        Chart.defaults.color = '#FFFFFF';
        Chart.defaults.plugins.datalabels = { display: false };
        Chart.defaults.plugins.legend = Chart.defaults.plugins.legend || {};
        Chart.defaults.plugins.legend.labels = Object.assign({}, Chart.defaults.plugins.legend.labels || {}, {
          color: '#FFFFFF',
          usePointStyle: true,
          font: { size: 12, weight: '900' }
        });
      }
      Object.values(Chart.instances || {}).forEach(chart => {
        if (!chart) return;
        limparConfigChart(chart.config || {});
        limparConfigChart({ data: chart.data, options: chart.options, type: chart.config && chart.config.type });
        chart.update('none');
      });
    }catch(e){}
  }

  function instalarWrapper(){
    if (!window.Chart || window.Chart.__CCO_WRAPPER_SEM_PRETO__) return;
    const ChartBase = window.Chart;
    function ChartLimpo(ctx, config){
      if (!ccoCanvasValidoFinal(ctx)) return ccoChartVazioFinal();
      return new ChartBase(ctx, limparConfigChart(config));
    }
    Object.setPrototypeOf(ChartLimpo, ChartBase);
    ChartLimpo.prototype = ChartBase.prototype;
    Object.getOwnPropertyNames(ChartBase).forEach(prop => {
      try { if (!(prop in ChartLimpo)) ChartLimpo[prop] = ChartBase[prop]; } catch(e) {}
    });
    ChartLimpo.__CCO_WRAPPER_SEM_PRETO__ = true;
    window.Chart = ChartLimpo;
    // Plugin duplicado desativado: manter apenas ccoSapValoresBrancosPlugin.
    // try { Chart.register(pluginValoresBrancos); } catch(e) {}
  }

  instalarWrapper();
  aplicarEmInstancias();
  document.addEventListener('DOMContentLoaded', () => setTimeout(aplicarEmInstancias, 250));
  setTimeout(aplicarEmInstancias, 800);
  setTimeout(aplicarEmInstancias, 1800);
  window.ccoLimpezaFinalVerdeSemPreto = aplicarEmInstancias;
})();

/* CORREÇÃO FINAL: bloco agressivo removido. Mantém apenas o plugin branco com sombra preta. */

/* =====================================================
   PATCH FINAL • 1 LABEL BRANCA COM SOMBRA PRETA
   - Mantém o plugin ccoSapValoresBrancosPlugin.
   - Desliga ChartDataLabels/datalabels para não duplicar.
   - Não remove os gráficos KPI/Execução.
===================================================== */
(function ccoLabelBrancaSombraUnicaFinal(){
  if (window.__CCO_LABEL_BRANCA_SOMBRA_UNICA_FINAL__) return;
  window.__CCO_LABEL_BRANCA_SOMBRA_UNICA_FINAL__ = true;

  function aplicar(){
    try{
      if (!window.Chart) return;

      // Mantém o plugin manual correto, branco com sombra preta.
      try {
        if (typeof ccoSapValoresBrancosPlugin !== 'undefined') {
          Chart.unregister(ccoSapValoresBrancosPlugin);
          Chart.register(ccoSapValoresBrancosPlugin);
        }
      } catch(e) {}

      // Remove/desliga apenas o plugin duplicador ChartDataLabels.
      try { if (window.ChartDataLabels) Chart.unregister(window.ChartDataLabels); } catch(e) {}
      Chart.defaults = Chart.defaults || {};
      Chart.defaults.plugins = Chart.defaults.plugins || {};
      Chart.defaults.plugins.datalabels = { display: false };

      // Se o plugin duplicado tiver entrado por algum motivo, remove.
      try {
        const itens = Chart.registry && Chart.registry.plugins && Chart.registry.plugins.items;
        if (itens && itens.ccoValoresBrancosSemDuplicidade) {
          Chart.unregister(itens.ccoValoresBrancosSemDuplicidade);
          delete itens.ccoValoresBrancosSemDuplicidade;
        }
      } catch(e) {}

      Object.values(Chart.instances || {}).forEach(ch => {
        if (!ch || !ch.options) return;
        ch.options.plugins = ch.options.plugins || {};
        ch.options.plugins.datalabels = { display: false };
        ch.options.plugins.legend = ch.options.plugins.legend || {};
        ch.options.plugins.legend.labels = Object.assign({}, ch.options.plugins.legend.labels || {}, {
          color: '#FFFFFF',
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '900' }
        });
        ch.update('none');
      });
    }catch(e){ console.warn('Patch label branca sombra única:', e); }
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(aplicar, 250));
  setTimeout(aplicar, 700);
  setTimeout(aplicar, 1500);
  window.ccoLabelBrancaSombraUnicaFinal = aplicar;
})();

var graficoKpiVelocidadeMediaMensal=null;

/* função duplicada removida: renderGraficoVelocidadeMediaMensalKPI */


/* =====================================================
   PATCH MOBILE FINAL • DATAS, ESTRUTURA E VELOCIDADE KPI
   Objetivo:
   1. Abreviar datas no eixo X no celular.
   2. Evitar sobreposição de meses/anos.
   3. Mostrar poucos ticks no mobile.
   4. Ocultar Velocidade Média quando o serviço não tiver dados.
   5. Manter labels brancos com sombra preta já configurados.
===================================================== */
(function ccoPatchMobileDatasGraficosFinal(){
  if (!window.Chart || window.__CCO_PATCH_MOBILE_DATAS_FINAL__) return;
  window.__CCO_PATCH_MOBILE_DATAS_FINAL__ = true;

  const ChartBase = window.Chart;

  function ccoEhMobile(){
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function ccoAbreviarMesLabel(label){
    let texto = String(label || '');

    const mapa = [
      ['Janeiro','Jan'], ['Fevereiro','Fev'], ['Março','Mar'], ['Marco','Mar'],
      ['Abril','Abr'], ['Maio','Mai'], ['Junho','Jun'], ['Julho','Jul'],
      ['Agosto','Ago'], ['Setembro','Set'], ['Outubro','Out'],
      ['Novembro','Nov'], ['Dezembro','Dez']
    ];

    mapa.forEach(([full, curto]) => {
      texto = texto.replace(new RegExp(full, 'gi'), curto);
    });

    // Formato dd/mm/yyyy -> dd/mm no mobile
    texto = texto.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, '$1/$2');

    // Formato Mês/2026 -> Mês/26
    texto = texto.replace(/\/(20)(\d{2})/g, '/$2');

    // Evita labels muito longos
    if (ccoEhMobile() && texto.length > 10) texto = texto.slice(0, 10);

    return texto;
  }

  window.ccoAbreviarMesLabel = ccoAbreviarMesLabel;

  function ccoAplicarConfigMobile(config){
    if (!config || !config.data) return config;

    config.options = config.options || {};
    config.options.responsive = true;
    config.options.maintainAspectRatio = false;
    config.options.layout = Object.assign(
      { padding: ccoEhMobile() ? { top: 18, right: 12, bottom: 34, left: 8 } : { top: 16, right: 16, bottom: 12, left: 8 } },
      config.options.layout || {}
    );

    config.options.plugins = config.options.plugins || {};
    config.options.plugins.legend = config.options.plugins.legend || {};
    config.options.plugins.legend.labels = Object.assign({}, config.options.plugins.legend.labels || {}, {
      color: '#FFFFFF',
      usePointStyle: true,
      pointStyle: 'circle',
      font: { size: ccoEhMobile() ? 11 : 12, weight: '800' }
    });

    config.options.scales = config.options.scales || {};
    const scaleX = config.options.scales.x = Object.assign({}, config.options.scales.x || {});
    scaleX.ticks = Object.assign({}, scaleX.ticks || {}, {
      autoSkip: true,
      maxTicksLimit: ccoEhMobile() ? 6 : 9,
      maxRotation: ccoEhMobile() ? 45 : 0,
      minRotation: ccoEhMobile() ? 35 : 0,
      padding: ccoEhMobile() ? 8 : 10,
      color: '#475569',
      font: { size: ccoEhMobile() ? 10 : 11, weight: '700' },
      callback: function(value){
        const original = this && typeof this.getLabelForValue === 'function'
          ? this.getLabelForValue(value)
          : value;
        return ccoAbreviarMesLabel(original);
      }
    });

    if (config.options.scales.y) {
      config.options.scales.y.ticks = Object.assign({}, config.options.scales.y.ticks || {}, {
        color: '#475569',
        font: { size: ccoEhMobile() ? 10 : 11, weight: '700' }
      });
    }

    return config;
  }

  function ChartMobileFinal(item, config){
    if (!ccoCanvasValidoFinal(item)) return ccoChartVazioFinal();
    return new ChartBase(item, ccoAplicarConfigMobile(config));
  }

  Object.setPrototypeOf(ChartMobileFinal, ChartBase);
  ChartMobileFinal.prototype = ChartBase.prototype;
  Object.getOwnPropertyNames(ChartBase).forEach(prop => {
    try { if (!(prop in ChartMobileFinal)) ChartMobileFinal[prop] = ChartBase[prop]; } catch(e) {}
  });

  window.Chart = ChartMobileFinal;
})();

/* Velocidade média mensal KPI • média da coluna Velocidade Média/VM e oculta se não houver dados */
var graficoKpiVelocidadeMediaMensal = null;
function renderGraficoVelocidadeMediaMensalKPI(dados){
  const canvas = document.getElementById('graficoKpiVelocidadeMediaMensal');
  if (!canvas) return;

  const secao = canvas.closest('.section') || canvas.closest('.chart-card');

  if (graficoKpiVelocidadeMediaMensal) {
    try { graficoKpiVelocidadeMediaMensal.destroy(); } catch(e) {}
    graficoKpiVelocidadeMediaMensal = null;
  }

  const mapa = {};

  (dados || []).forEach(item => {
    if (!item || !item.data_normalizada) return;

    const mes = String(item.data_normalizada).substring(0, 7);
    const vel = numero(
      item.velocidade_media ||
      item.velocidadeMedia ||
      item['Velocidade Média'] ||
      item['Velocidade Media'] ||
      item.vm ||
      item.VM ||
      item.velocidade ||
      0
    );

    if (!vel || vel <= 0) return;

    if (!mapa[mes]) {
      mapa[mes] = {
        mes,
        mesBrasil: typeof formatarMesBrasil === 'function' ? formatarMesBrasil(mes) : mes,
        soma: 0,
        qtd: 0
      };
    }

    mapa[mes].soma += vel;
    mapa[mes].qtd += 1;
  });

  const dadosMensais = Object.values(mapa)
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map(item => ({
      mes: item.mes,
      mesBrasil: item.mesBrasil,
      velocidadeMedia: item.qtd ? item.soma / item.qtd : 0
    }));

  const temDados = dadosMensais.some(item => item.velocidadeMedia > 0);

  if (secao) secao.style.display = temDados ? '' : 'none';
  if (!temDados) return;

  const velocidadeAtual = dadosMensais[dadosMensais.length - 1]?.velocidadeMedia || 0;
  const mostradorVelocidade = document.getElementById('kpiSpeedometerDrawing');
  const valorMostradorVelocidade = document.getElementById('kpiSpeedometerValue');
  if (mostradorVelocidade) mostradorVelocidade.style.setProperty('--needle-angle', `${-90 + Math.min(velocidadeAtual / 120, 1) * 180}deg`);
  if (valorMostradorVelocidade) valorMostradorVelocidade.textContent = velocidadeAtual.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  graficoKpiVelocidadeMediaMensal = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dadosMensais.map(item => item.mesBrasil),
      datasets: [{
        label: 'Velocidade Média',
        data: dadosMensais.map(item => Number(item.velocidadeMedia.toFixed(2))),
        borderColor: '#0F7B4D',
        backgroundColor: 'rgba(15, 123, 77, 0.18)',
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 18, right: 14, bottom: 24, left: 8 } },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#FFFFFF', usePointStyle: true, font: { size: 12, weight: '800' } }
        },
        datalabels: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            autoSkip: true,
            maxTicksLimit: window.matchMedia('(max-width: 768px)').matches ? 6 : 9,
            maxRotation: window.matchMedia('(max-width: 768px)').matches ? 45 : 0,
            minRotation: window.matchMedia('(max-width: 768px)').matches ? 35 : 0,
            callback: function(value){
              const label = this.getLabelForValue(value);
              return typeof ccoAbreviarMesLabel === 'function' ? ccoAbreviarMesLabel(label) : label;
            }
          }
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(15,23,42,.08)' },
          ticks: { color: '#475569', font: { size: 11, weight: '700' } }
        }
      }
    }
  });
}

/* =====================================================
   PATCH FINAL MOBILE • KPI EM COLUNAS E DATAS CURTAS
   - Execução diária vira coluna por DIA no celular
   - % execução mensal vira coluna para leitura mobile
   - Produtividade vira coluna agrupada
   - Labels de mês abreviados: Jan/26, Fev/26...
===================================================== */
(function ccoPatchKpiMobileColunasFinal(){
  if (window.__CCO_KPI_MOBILE_COLUNAS_FINAL__) return;
  window.__CCO_KPI_MOBILE_COLUNAS_FINAL__ = true;

  function isMobile(){
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function labelCurta(label){
    let txt = String(label || '');
    const repl = [
      ['Janeiro','Jan'], ['Fevereiro','Fev'], ['Março','Mar'], ['Marco','Mar'],
      ['Abril','Abr'], ['Maio','Mai'], ['Junho','Jun'], ['Julho','Jul'],
      ['Agosto','Ago'], ['Setembro','Set'], ['Outubro','Out'], ['Novembro','Nov'], ['Dezembro','Dez']
    ];
    repl.forEach(([a,b]) => { txt = txt.replace(new RegExp(a, 'gi'), b); });
    txt = txt.replace(/\/(20)(\d{2})/g, '/$2');
    txt = txt.replace(/^(\d{2})\/(\d{2})\/\d{4}$/g, '$1/$2');
    return txt;
  }

  function opcoesMobile(extra){
    const mobile = isMobile();
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: mobile ? { top: 18, right: 10, bottom: 30, left: 6 } : { top: 16, right: 16, bottom: 12, left: 8 } },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#FFFFFF',
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: mobile ? 11 : 12, weight: '800' },
            padding: mobile ? 12 : 18
          }
        },
        datalabels: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#475569',
            autoSkip: true,
            maxTicksLimit: mobile ? 8 : 12,
            maxRotation: mobile ? 0 : 0,
            minRotation: 0,
            font: { size: mobile ? 10 : 11, weight: '800' },
            callback: function(value){
              const original = this && typeof this.getLabelForValue === 'function' ? this.getLabelForValue(value) : value;
              return labelCurta(original);
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(15,23,42,.08)' },
          ticks: { color: '#475569', font: { size: mobile ? 10 : 11, weight: '700' } }
        }
      }
    }, extra || {});
  }

  function destruirCanvas(id){
    try {
      if (typeof ccoDestruirChartCanvas === 'function') return ccoDestruirChartCanvas(id);
      const el = document.getElementById(id);
      const ch = el && window.Chart && Chart.getChart ? Chart.getChart(el) : null;
      if (ch) ch.destroy();
    } catch(e) {}
  }

  function mostrarCanvas(id, mostrar){
    try {
      if (typeof ccoMostrarCardDoCanvas === 'function') return ccoMostrarCardDoCanvas(id, mostrar);
      const el = document.getElementById(id);
      const card = el && (el.closest('.section') || el.closest('.chart-card'));
      if (card) card.style.display = mostrar ? '' : 'none';
    } catch(e) {}
  }

  function temValores(arr){
    return (arr || []).some(v => Number(v) > 0);
  }

  function n(v){
    if (typeof ccoNumeroSeguro === 'function') return ccoNumeroSeguro(v);
    if (typeof numero === 'function') return numero(v);
    const x = Number(String(v || 0).replace(',', '.'));
    return Number.isFinite(x) ? x : 0;
  }

  const original = window.renderGraficosKpiServicoCompleto;

  window.renderGraficosKpiServicoCompleto = function(dados, filtro, painel){
    const filtroSeguro = filtro || {};
    const mensal = typeof ccoKpiMensalFiltrado === 'function' ? ccoKpiMensalFiltrado(filtroSeguro) : [];
    const servico = filtroSeguro.servico || '';

    // Se estrutura nova não existir, usa função original.
    if (!mensal.length && typeof original === 'function') {
      try { original(dados, filtro, painel); } catch(e) { console.warn('KPI original falhou:', e); }
    }

    [
      'graficoKpiServicoDiario',
      'graficoKpiPrevistoExecutado',
      'graficoKpiServicoMensal',
      'graficoKpiServicoIndicadores',
      'graficoKpiComparativoMensal',
      'graficoKpiProdutividadeMensal'
    ].forEach(destruirCanvas);

    const cor = (window.CCO_CORES_GRAFICOS || {});
    const executadoCor = cor.executado || '#0F7B4D';
    const previstoCor = cor.previsto || '#BBF7D0';
    const percentualCor = cor.percentual || '#16A34A';
    const pesoCor = cor.peso || '#0B5D3B';
    const kmCor = cor.km || '#22C55E';
    const viagensCor = cor.viagens || '#4ADE80';
    const horasCor = cor.horas || '#86EFAC';

    /* Execução diária em COLUNA por dia */
    const mapaDiario = {};
    (dados || []).forEach(item => {
      if (!item || !item.data_normalizada) return;
      const data = String(item.data_normalizada).substring(0, 10);
      const codigo = servico || item.servico || '';
      if (!mapaDiario[data]) mapaDiario[data] = { data, dia: data.substring(8, 10), executado: 0 };
      const valor = typeof obterExecutadoKpiPorServico === 'function'
        ? obterExecutadoKpiPorServico(codigo, item)
        : n(item.executado || item.peso || item.km || item.viagens || item.equipe || 0);
      mapaDiario[data].executado += n(valor);
    });

    const diario = Object.values(mapaDiario).sort((a,b) => a.data.localeCompare(b.data));
    const valoresDiarios = diario.map(i => Number(n(i.executado).toFixed(2)));
    const canvasDiario = document.getElementById('graficoKpiServicoDiario');
    mostrarCanvas('graficoKpiServicoDiario', temValores(valoresDiarios));
    if (canvasDiario && temValores(valoresDiarios)) {
      window.graficoKpiServicoDiario = new Chart(canvasDiario, {
        type: 'bar',
        data: {
          labels: diario.map(i => isMobile() ? i.dia : (typeof formatarDataBRSimples === 'function' ? formatarDataBRSimples(i.data) : i.data)),
          datasets: [{
            label: 'Executado diário',
            data: valoresDiarios,
            backgroundColor: executadoCor,
            borderColor: '#0B2C04',
            borderWidth: 1,
            borderRadius: 10,
            maxBarThickness: isMobile() ? 28 : 42,
            categoryPercentage: .78,
            barPercentage: .88
          }]
        },
        options: opcoesMobile({ plugins: { legend: { display: false }, datalabels: { display: false } } })
      });
    }

    const labelsMensais = mensal.map(i => typeof ccoLabelMesAnoKpi === 'function' ? ccoLabelMesAnoKpi(i) : `${String(i.mes).padStart(2,'0')}/${i.ano}`);
    const labelsMensaisCurtas = labelsMensais.map(labelCurta);

    /* Previsto x Executado */
    const ctxPrevisto = document.getElementById('graficoKpiPrevistoExecutado');
    const previstoTotal = mensal.length ? mensal.reduce((s,i) => s + n(i.previsto), 0) : n(painel && painel.previsto);
    const executadoTotal = mensal.length ? mensal.reduce((s,i) => s + n(i.executado), 0) : n(painel && painel.executado);
    mostrarCanvas('graficoKpiPrevistoExecutado', previstoTotal > 0 || executadoTotal > 0);
    if (ctxPrevisto && (previstoTotal > 0 || executadoTotal > 0)) {
      window.graficoKpiPrevistoExecutado = new Chart(ctxPrevisto, {
        type: 'bar',
        data: { labels: ['Previsto', 'Executado'], datasets: [{ label: 'Previsto x Executado', data: [previstoTotal, executadoTotal], backgroundColor: [previstoCor, executadoCor], borderRadius: 12 }] },
        options: opcoesMobile()
      });
    }

    /* Produção mensal em coluna com meses curtos */
    const ctxMensal = document.getElementById('graficoKpiServicoMensal');
    const valoresMensais = mensal.map(i => n(i.executado));
    mostrarCanvas('graficoKpiServicoMensal', temValores(valoresMensais));
    if (ctxMensal && temValores(valoresMensais)) {
      window.graficoKpiServicoMensalFinal = new Chart(ctxMensal, {
        type: 'bar',
        data: { labels: labelsMensaisCurtas, datasets: [{ label: 'Executado mensal', data: valoresMensais, backgroundColor: executadoCor, borderRadius: 12, maxBarThickness: isMobile() ? 36 : 54 }] },
        options: opcoesMobile({ plugins: { legend: { display: false }, datalabels: { display: false } } })
      });
    }

    /* Indicadores operacionais */
    const totaisIndicadores = [
      mensal.reduce((s,i) => s + n(i.peso_t), 0),
      mensal.reduce((s,i) => s + n(i.viagens), 0),
      mensal.reduce((s,i) => s + n(i.km_total), 0),
      mensal.reduce((s,i) => s + n(i.equipes), 0)
    ];
    const ctxIndicadores = document.getElementById('graficoKpiServicoIndicadores');
    if (typeof renderGraficoVelocidadeMediaMensalKPI === 'function') renderGraficoVelocidadeMediaMensalKPI(dados);
    [['kpiCompositionPeso', totaisIndicadores[0]], ['kpiCompositionViagens', totaisIndicadores[1]], ['kpiCompositionKm', totaisIndicadores[2]], ['kpiCompositionEquipes', totaisIndicadores[3]]].forEach(([id, valor]) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    });
    mostrarCanvas('graficoKpiServicoIndicadores', temValores(totaisIndicadores));
    if (ctxIndicadores && temValores(totaisIndicadores)) {
      window.graficoKpiServicoIndicadoresFinal = new Chart(ctxIndicadores, {
        type: 'doughnut',
        data: { labels: ['Peso', 'Viagens', 'KM', 'Equipes'], datasets: [{ data: totaisIndicadores, backgroundColor: [pesoCor, viagensCor, kmCor, horasCor] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#FFFFFF', usePointStyle: true, font: { weight: '800' } } }, datalabels: { display: false } } }
      });
    }

    /* Comparativo mensal */
    const ctxComp = document.getElementById('graficoKpiComparativoMensal');
    const previsto = mensal.map(i => n(i.previsto));
    const executado = mensal.map(i => n(i.executado));
    mostrarCanvas('graficoKpiComparativoMensal', temValores(previsto) || temValores(executado));
    if (ctxComp && (temValores(previsto) || temValores(executado))) {
      window.graficoKpiComparativoMensalFinal = new Chart(ctxComp, {
        type: 'bar',
        data: { labels: labelsMensaisCurtas, datasets: [
          { label: 'Previsto', data: previsto, backgroundColor: previstoCor, borderRadius: 12, maxBarThickness: isMobile() ? 28 : 44 },
          { label: 'Executado', data: executado, backgroundColor: executadoCor, borderRadius: 12, maxBarThickness: isMobile() ? 28 : 44 }
        ]},
        options: opcoesMobile()
      });
    }

    /* Produtividade em COLUNAS AGRUPADAS */
    const ctxProd = document.getElementById('graficoKpiProdutividadeMensal');
    const tonViagem = mensal.map(i => n(i.viagens) ? n(i.peso_t) / n(i.viagens) : 0);
    const kmViagem = mensal.map(i => n(i.viagens) ? n(i.km_total) / n(i.viagens) : 0);
    mostrarCanvas('graficoKpiProdutividadeMensal', temValores(tonViagem) || temValores(kmViagem));
    if (ctxProd && (temValores(tonViagem) || temValores(kmViagem))) {
      window.graficoKpiProdutividadeMensalFinal = new Chart(ctxProd, {
        type: 'bar',
        data: { labels: labelsMensaisCurtas, datasets: [
          { label: 'Ton/viagem', data: tonViagem.map(v => Number(v.toFixed(2))), backgroundColor: pesoCor, borderRadius: 10, maxBarThickness: isMobile() ? 26 : 40 },
          { label: 'KM/viagem', data: kmViagem.map(v => Number(v.toFixed(2))), backgroundColor: kmCor, borderRadius: 10, maxBarThickness: isMobile() ? 26 : 40 }
        ]},
        options: opcoesMobile({ scales: { y: { beginAtZero: true, grid: { color: 'rgba(15,23,42,.08)' }, ticks: { color: '#475569', font: { size: isMobile() ? 10 : 11, weight: '700' } } } } })
      });
    }
  };
})();



/* =====================================================
   PATCH FINAL FIX2 • Chart.js seguro + mobile legível
   - Evita erro ownerDocument quando canvas não existe
   - Protege options/plugins undefined
   - Mantém labels brancos com sombra preta via plugin SAP
   - Desliga datalabels duplicado
===================================================== */
(function ccoPatchFinalMobileBarrasFix2(){
  if (window.__CCO_PATCH_FINAL_MOBILE_BARRAS_FIX2__) return;
  window.__CCO_PATCH_FINAL_MOBILE_BARRAS_FIX2__ = true;

  function garantirConfig(config){
    config = config || {};
    config.data = config.data || { labels: [], datasets: [] };
    config.options = config.options || {};
    config.options.plugins = config.options.plugins || {};
    config.options.plugins.datalabels = { display: false };

    config.options.plugins.legend = config.options.plugins.legend || {};
    config.options.plugins.legend.labels = Object.assign(
      {},
      config.options.plugins.legend.labels || {},
      {
        color: "#FFFFFF",
        usePointStyle: true,
        pointStyle: "circle",
        font: { size: 12, weight: "900" }
      }
    );

    config.options.responsive = true;
    config.options.maintainAspectRatio = false;

    config.options.scales = config.options.scales || {};
    if (config.options.scales.x) {
      config.options.scales.x.ticks = Object.assign(
        {},
        config.options.scales.x.ticks || {},
        {
          autoSkip: true,
          maxTicksLimit: (window.innerWidth || 1200) <= 768 ? 7 : 10,
          maxRotation: (window.innerWidth || 1200) <= 768 ? 45 : 0,
          minRotation: (window.innerWidth || 1200) <= 768 ? 35 : 0,
          font: { size: (window.innerWidth || 1200) <= 768 ? 10 : 11, weight: "700" }
        }
      );
    }
    return config;
  }

  function instalarWrapperSeguro(){
    if (!window.Chart || window.Chart.__CCO_SAFE_FINAL_FIX2__) return;
    const ChartBase = window.Chart;

    function ChartSeguroFinal(item, config){
      if (!ccoCanvasValidoFinal(item)) {
        console.warn("Chart ignorado: canvas inexistente/removido.");
        return ccoChartVazioFinal();
      }
      return new ChartBase(item, garantirConfig(config));
    }

    Object.setPrototypeOf(ChartSeguroFinal, ChartBase);
    ChartSeguroFinal.prototype = ChartBase.prototype;
    Object.getOwnPropertyNames(ChartBase).forEach(prop => {
      try { if (!(prop in ChartSeguroFinal)) ChartSeguroFinal[prop] = ChartBase[prop]; } catch(e) {}
    });

    ChartSeguroFinal.__CCO_SAFE_FINAL_FIX2__ = true;
    window.Chart = ChartSeguroFinal;
  }

  function aplicarInstancias(){
    try {
      if (!window.Chart) return;

      Chart.defaults = Chart.defaults || {};
      Chart.defaults.plugins = Chart.defaults.plugins || {};
      Chart.defaults.plugins.datalabels = { display: false };
      Chart.defaults.plugins.legend = Chart.defaults.plugins.legend || {};
      Chart.defaults.plugins.legend.labels = Chart.defaults.plugins.legend.labels || {};
      Chart.defaults.plugins.legend.labels.color = "#FFFFFF";
      Chart.defaults.plugins.legend.labels.font = { size: 12, weight: "900" };

      try { if (window.ChartDataLabels) Chart.unregister(window.ChartDataLabels); } catch(e) {}
      try {
        if (typeof ccoSapValoresBrancosPlugin !== "undefined") {
          Chart.unregister(ccoSapValoresBrancosPlugin);
          Chart.register(ccoSapValoresBrancosPlugin);
        }
      } catch(e) {}

      Object.values(Chart.instances || {}).forEach(ch => {
        if (!ch || !ch.canvas || !ch.canvas.ownerDocument) return;
        ch.config = garantirConfig(ch.config || {});
        ch.options = garantirConfig({ data: ch.data, options: ch.options }).options;
        try { ch.update("none"); } catch(e) {}
      });
    } catch (e) {
      console.warn("Patch final mobile barras fix2:", e);
    }
  }

  instalarWrapperSeguro();
  document.addEventListener("DOMContentLoaded", () => setTimeout(aplicarInstancias, 300));
  setTimeout(aplicarInstancias, 900);
  setTimeout(aplicarInstancias, 1800);
})();
async function sair() {
  if (window.supabaseClient) {
    await window.supabaseClient.auth.signOut();
  }

  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("perfilUsuario");

  window.location.replace("login.html");
}

/* =====================================================
   PATCH FINAL • PAINEL GERAL P1 A P12 + SUPABASE SEM LIMITE
   Data: 2026-06-05
   Objetivo:
   - Corrigir index.html, que carrega utils.js depois do DOMContentLoaded.
   - Carregar todas as linhas da tabela operacoes em páginas de 1000.
   - Garantir ordem oficial P1, P2.1, P2.2, P3...P12 no Painel Geral.
   - Não alterar KPI nem Execução.
===================================================== */
(function ccoPatchPainelGeralP1P12Final(){
  const ORDEM = ["P1", "P2.1", "P2.2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11", "P12"];

  function getBancoFinal(){
    try {
      if (window.banco) return window.banco;
      if (window.supabaseClient) {
        window.banco = window.supabaseClient;
        return window.banco;
      }
    } catch(e) {}
    return null;
  }

  function indiceServicoFinal(servico){
    const i = ORDEM.indexOf(String(servico || ""));
    return i >= 0 ? i : 999;
  }

  function ordenarPainelFinal(lista){
    return [...(lista || [])].sort((a,b) => indiceServicoFinal(a.servico) - indiceServicoFinal(b.servico));
  }

  async function buscarTodasAsLinhasFinal(criarConsulta, tamanhoPagina = 1000){
    let todas = [];
    let inicio = 0;

    while (true) {
      const fim = inicio + tamanhoPagina - 1;
      const { data, error } = await criarConsulta().range(inicio, fim);

      if (error) throw error;

      const lote = data || [];
      todas = todas.concat(lote);

      if (lote.length < tamanhoPagina) break;
      inicio += tamanhoPagina;
    }

    return todas;
  }

  window.carregarBaseSupabase = async function carregarBaseSupabase(){
    const bancoFinal = getBancoFinal();
    if (!bancoFinal) return false;

    try {
      const { data: ultima, error: erroUltima } = await bancoFinal
        .from('importacoes')
        .select('*')
        .order('ano', { ascending: false, nullsFirst: false })
        .order('mes', { ascending: false, nullsFirst: false })
        .order('criado_em', { ascending: false })
        .limit(1);

      if (erroUltima || !ultima || !ultima.length) {
        if (erroUltima) console.error('Erro ao buscar último mês:', erroUltima);
        return false;
      }

      const importacao = ultima[0];

      const painelBanco = await buscarTodasAsLinhasFinal(() =>
        bancoFinal
          .from('painel_executivo')
          .select('*')
          .eq('importacao_id', importacao.id)
          .order('servico', { ascending: true })
      );

      const operacoesBanco = await buscarTodasAsLinhasFinal(() =>
        bancoFinal
          .from('operacoes')
          .select('*')
          .order('ano', { ascending: false, nullsFirst: false })
          .order('mes', { ascending: false, nullsFirst: false })
          .order('data_operacao', { ascending: false })
      );

      if (typeof limparMemoria === 'function') limparMemoria();

      painelExecutivo = ordenarPainelFinal((painelBanco || []).map(item => ({
        servico: item.servico || '',
        nome_servico: item.nome_servico || '',
        acumulado_mes: numero(item.acumulado),
        medicao: item.medicao || '',
        previsto_mes: numero(item.previsto),
        porcentagem_execucao: numero(item.percentual),
        dias_acumulados: numero(item.dias_acumulados),
        total_dias_mes: numero(item.total_dias_mes),
        valor: numero(item.valor),
        status: numero(item.acumulado) > 0 ? 'Com dados' : 'Sem dados'
      })));

      operacoes = (operacoesBanco || []).map(item => ({
        servico: item.servico || '',
        origem: 'Banco Supabase',
        data: item.data_operacao || '',
        data_normalizada: item.data_operacao || '',
        turno: item.turno || '',
        ra: item.ra || 'Por demanda',
        setor: '',
        peso: numero(item.peso_t),
        viagens: numero(item.viagens),
        km: numero(item.km_total),
        equipe: numero(item.equipe),
        executado: numero(item.executado),
        velocidade_media: numero(item.velocidade_media || item?.json_original?.velocidade_media),
        status: 'Com dados'
      }));

      painelExecutivoOriginal = clonar(painelExecutivo);
      operacoesOriginal = clonar(operacoes);

      todasAsAbas = [{
        arquivo: importacao.nome_arquivo || 'Banco Supabase',
        aba: 'Dados consolidados',
        linhas: operacoes.length
      }];

      sheetsOriginais = {};

      try {
        const resumo = montarResumoLeve(importacao.nome_arquivo || 'Banco Supabase');
        salvarResumoLocal(resumo);
      } catch(e) {}

      if (typeof atualizarDashboard === 'function') atualizarDashboard();
      if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil();

      const mesNome = (typeof MESES_BR !== 'undefined' ? MESES_BR[String(importacao.mes).padStart(2, '0')] : '') || importacao.mes || '-';
      if (typeof preencherTexto === 'function') {
        preencherTexto('nomeArquivo', `Banco carregado: último mês ${mesNome}/${importacao.ano || '-'} primeiro | ${operacoes.length} registros em todos os meses | Painel ${painelExecutivo.length} serviços`);
      }

      console.log('CCO Painel Geral carregado:', painelExecutivo.map(x => x.servico));
      console.log('CCO Total operações carregadas:', operacoes.length);

      return true;
    } catch (erro) {
      console.error('Erro geral ao carregar Supabase:', erro);
      return false;
    }
  };

  window.inicializarPainelGeralAposLogin = async function inicializarPainelGeralAposLogin(){
    window.CCO_PAGE = 'painel';

    try { if (typeof atualizarData === 'function') atualizarData(); } catch(e) {}
    try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e) {}
    try { if (typeof preencherTexto === 'function') preencherTexto('nomeArquivo', '🔄 Carregando dados da base...'); } catch(e) {}

    const carregouBanco = await window.carregarBaseSupabase();

    if (!carregouBanco && typeof carregarResumoLocal === 'function') {
      carregarResumoLocal();
    }

    try { if (typeof carregarHistorico === 'function') carregarHistorico(); } catch(e) {}

    setTimeout(() => {
      try {
        painelExecutivo = ordenarPainelFinal(painelExecutivo);
        painelExecutivoOriginal = ordenarPainelFinal(painelExecutivoOriginal);
        if (typeof atualizarDashboard === 'function') atualizarDashboard();
      } catch(e) {}
    }, 400);
  };

  if (typeof renderTabelaExecutiva === 'function') {
    const renderTabelaExecutivaBase = renderTabelaExecutiva;
    window.renderTabelaExecutiva = renderTabelaExecutiva = function(){
      painelExecutivo = ordenarPainelFinal(painelExecutivo);
      return renderTabelaExecutivaBase.apply(this, arguments);
    };
  }

  if (typeof renderGraficos === 'function') {
    window.renderGraficos = renderGraficos = function(){
      const ctxExecucao = document.getElementById('graficoExecucao');
      const ctxValorBarras = document.getElementById('graficoValorServicoBarras');
      const dadosPainel = ordenarPainelFinal(painelExecutivo || []);

      try { if (graficoExecucao) graficoExecucao.destroy(); } catch(e) {}
      try { if (typeof graficoValorServicoBarrasFinal !== 'undefined' && graficoValorServicoBarrasFinal) graficoValorServicoBarrasFinal.destroy(); } catch(e) {}

      const labels = dadosPainel.map(item => item.servico);

      if (ctxExecucao && window.Chart) {
        graficoExecucao = new Chart(ctxExecucao, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: '% Execução',
              data: dadosPainel.map(item => numero(item.porcentagem_execucao)),
              borderRadius: 10,
              backgroundColor: '#A7F3D0'
            }]
          },
          options: typeof opcoesGrafico === 'function' ? opcoesGrafico() : { responsive: true, maintainAspectRatio: false }
        });
      }

      if (ctxValorBarras && window.Chart) {
        graficoValorServicoBarrasFinal = new Chart(ctxValorBarras, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Valor R$',
              data: dadosPainel.map(item => numero(item.valor)),
              borderRadius: 10,
              backgroundColor: '#BFDBFE'
            }]
          },
          options: {
            ...(typeof opcoesGrafico === 'function' ? opcoesGrafico() : { responsive: true, maintainAspectRatio: false }),
            indexAxis: 'y',
            plugins: {
              legend: { display: true },
              tooltip: { callbacks: { label: ctx => formatarMoeda(ctx.raw) } }
            }
          }
        });
      }

      if (typeof renderRankingPorMedicao === 'function') renderRankingPorMedicao();
    };
  }
})();

/* =====================================================
   PATCH FINAL DE PERFORMANCE • PAINEL GERAL GITHUB PAGES
   - impede carregamento duplicado
   - Painel Geral busca somente o último mês no Supabase
   - se painel_executivo vier vazio, monta painel a partir de operacoes
===================================================== */
(function ccoPatchPerformancePainelFinal(){
  const ORDEM_SERVICOS_FINAL = ["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];
  const NOMES_SERVICOS_FINAL = {
    "P1":"Coleta Orgânica",
    "P2.1":"Coleta Seletiva",
    "P2.2":"Rejeito Seletivo das IRR",
    "P3":"Remoção Manual",
    "P4":"Remoção Mecanizada",
    "P5":"Varrição Manual",
    "P6":"Varrição Mecanizada",
    "P7":"Lavagem de Vias e Logradouros",
    "P8":"Limpeza de Equipamentos e Bens",
    "P9":"Catação em Área Verde",
    "P10":"Pintura Mecanizada",
    "P11":"Limpeza Pós-Eventos e Coleta de Gordura",
    "P12":"Transbordo"
  };

  function n(v){
    try { return typeof numero === 'function' ? numero(v) : Number(String(v ?? 0).replace(/\./g,'').replace(',','.')) || 0; }
    catch(e){ return Number(v) || 0; }
  }

  function ordenarServicos(lista){
    return (lista || []).slice().sort((a,b) => {
      const ia = ORDEM_SERVICOS_FINAL.indexOf(String(a.servico || '').trim());
      const ib = ORDEM_SERVICOS_FINAL.indexOf(String(b.servico || '').trim());
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
  }

  function servicoDaLinha(linha){
    return String(linha.servico || linha.codigo_servico || linha.codigo || '').trim().toUpperCase();
  }

  function valorMedidoPorServico(servico, soma){
    const fixo = (typeof VALORES_FIXOS !== 'undefined' ? VALORES_FIXOS[servico] : 0) || 0;
    if (["P3","P7","P8","P9","P10","P11"].includes(servico)) return fixo;
    return fixo * n(soma);
  }

  function montarPainelFallbackPorOperacoes(ops, importacao){
    const mapa = {};
    (ops || []).forEach(item => {
      const servico = servicoDaLinha(item);
      if (!servico) return;
      if (!mapa[servico]) {
        mapa[servico] = { servico, peso:0, viagens:0, km:0, equipe:0, executado:0, dias:new Set() };
      }
      mapa[servico].peso += n(item.peso_t ?? item.peso);
      mapa[servico].viagens += n(item.viagens);
      mapa[servico].km += n(item.km_total ?? item.km);
      mapa[servico].equipe += n(item.equipe);
      mapa[servico].executado += n(item.executado);
      const data = item.data_operacao || item.data_normalizada || item.data || '';
      if (data) mapa[servico].dias.add(String(data).slice(0,10));
    });

    const linhas = Object.values(mapa).map(x => {
      let acumulado = x.executado || x.peso || x.km || x.viagens || x.equipe || 0;
      if (["P5","P6"].includes(x.servico)) acumulado = x.km || acumulado;
      if (["P1","P12","P2.1","P2.2"].includes(x.servico)) acumulado = x.peso || acumulado;
      if (["P3","P7","P8","P9","P10","P11"].includes(x.servico)) acumulado = x.equipe || x.executado || acumulado;

      return {
        servico: x.servico,
        nome_servico: NOMES_SERVICOS_FINAL[x.servico] || x.servico,
        acumulado_mes: acumulado,
        medicao: ["P5","P6"].includes(x.servico) ? 'KM' : (["P3","P7","P8","P9","P10","P11"].includes(x.servico) ? 'Equipe' : 'Tonelada/Executado'),
        previsto_mes: 0,
        porcentagem_execucao: 0,
        dias_acumulados: x.dias.size,
        total_dias_mes: x.dias.size,
        valor: valorMedidoPorServico(x.servico, acumulado),
        status: acumulado > 0 ? 'Com dados' : 'Sem dados'
      };
    });
    return ordenarServicos(linhas);
  }

  async function selecionarTodos(query, limite = 50000){
    // Supabase REST costuma limitar linhas; range aumenta o suficiente para abrir o painel sem puxar 164 mil registros.
    const { data, error } = await query.range(0, limite - 1);
    if (error) throw error;
    return data || [];
  }

  async function carregarBaseRapidaSupabaseFinal(){
    const bancoFinal = window.supabaseClient;
    if (!bancoFinal) return false;

    if (window.__CCO_CARREGANDO_BASE_PROMISE__) return window.__CCO_CARREGANDO_BASE_PROMISE__;

    window.__CCO_CARREGANDO_BASE_PROMISE__ = (async () => {
      try {
        if (typeof preencherTexto === 'function') preencherTexto('nomeArquivo', '🔄 Carregando último mês do Supabase...');

        const { data: ultima, error: erroUltima } = await bancoFinal
          .from('importacoes')
          .select('*')
          .order('ano', { ascending:false, nullsFirst:false })
          .order('mes', { ascending:false, nullsFirst:false })
          .order('criado_em', { ascending:false })
          .limit(1);

        if (erroUltima || !ultima || !ultima.length) {
          if (erroUltima) console.error('Erro ao buscar último mês:', erroUltima);
          return false;
        }

        const importacao = ultima[0];
        const ano = Number(importacao.ano);
        const mes = Number(importacao.mes);

        let painelBanco = [];
        try {
          painelBanco = await selecionarTodos(
            bancoFinal.from('painel_executivo').select('*').eq('importacao_id', importacao.id).order('servico', { ascending:true }),
            2000
          );
        } catch(e) { console.warn('Painel por importacao_id não carregou:', e); }

        if (!painelBanco.length && ano && mes) {
          try {
            painelBanco = await selecionarTodos(
              bancoFinal.from('painel_executivo').select('*').eq('ano', ano).eq('mes', mes).order('servico', { ascending:true }),
              2000
            );
          } catch(e) { console.warn('Painel por ano/mês não carregou:', e); }
        }

        let operacoesBanco = [];
        try {
          operacoesBanco = await selecionarTodos(
            bancoFinal.from('operacoes').select('*')
              .gte('data_operacao', `${ano}-${String(mes).padStart(2,'0')}-01`)
              .lt('data_operacao', new Date(Date.UTC(Number(ano), Number(mes), 1)).toISOString().slice(0,10))
              .order('data_operacao', { ascending:true }),
            50000
          );
        } catch(e) { console.error('Erro ao carregar operações do último mês:', e); return false; }

        if (typeof limparMemoria === 'function') limparMemoria();
        else {
          painelExecutivo = []; painelExecutivoOriginal = []; operacoes = []; operacoesOriginal = []; todasAsAbas = []; sheetsOriginais = {};
        }

        painelExecutivo = ordenarServicos((painelBanco || []).map(item => ({
          servico: item.servico || '',
          nome_servico: item.nome_servico || NOMES_SERVICOS_FINAL[item.servico] || '',
          acumulado_mes: n(item.acumulado),
          medicao: item.medicao || '',
          previsto_mes: n(item.previsto),
          porcentagem_execucao: n(item.percentual),
          dias_acumulados: n(item.dias_acumulados),
          total_dias_mes: n(item.total_dias_mes),
          valor: n(item.valor),
          status: n(item.acumulado) > 0 ? 'Com dados' : 'Sem dados'
        })));

        operacoes = (operacoesBanco || []).filter(item => ORDEM_SERVICOS_V4.includes(String(item.servico || '').trim().toUpperCase())).map(item => ({
          servico: String(item.servico || '').trim().toUpperCase(),
          origem: 'Banco Supabase',
          data: item.data_operacao || '',
          data_normalizada: item.data_operacao || '',
          turno: item.turno || '',
          ra: item.ra || 'Por demanda',
          setor: '',
          peso: n(item.peso_t),
          viagens: n(item.viagens),
          km: n(item.km_total),
          equipe: n(item.equipe),
          executado: n(item.executado),
          status: 'Com dados'
        }));

        if (!painelExecutivo.length && operacoesBanco.length) {
          painelExecutivo = montarPainelFallbackPorOperacoes(operacoesBanco, importacao);
          console.warn('painel_executivo vazio: painel montado pelo fallback das operações do mês.');
        }

        painelExecutivoOriginal = typeof clonar === 'function' ? clonar(painelExecutivo) : JSON.parse(JSON.stringify(painelExecutivo));
        operacoesOriginal = typeof clonar === 'function' ? clonar(operacoes) : JSON.parse(JSON.stringify(operacoes));

        todasAsAbas = [{
          arquivo: importacao.nome_arquivo || 'Banco Supabase',
          aba: `Último mês ${String(mes).padStart(2,'0')}/${ano}`,
          linhas: operacoes.length
        }];
        sheetsOriginais = {};

        try { if (typeof atualizarDashboard === 'function') atualizarDashboard(); } catch(e) { console.error('Erro ao atualizar dashboard:', e); }
        try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e) {}

        const mesNome = (typeof MESES_BR !== 'undefined' ? MESES_BR[String(mes).padStart(2, '0')] : '') || String(mes).padStart(2,'0');
        if (typeof preencherTexto === 'function') {
          preencherTexto('nomeArquivo', `Banco carregado: ${mesNome}/${ano} | ${operacoes.length} registros do mês | Painel ${painelExecutivo.length} serviços`);
        }
        console.log('CCO FAST OK:', { ano, mes, painel: painelExecutivo.length, operacoes: operacoes.length });
        return true;
      } catch(erro) {
        console.error('Erro geral no carregamento rápido:', erro);
        return false;
      } finally {
        setTimeout(() => { window.__CCO_CARREGANDO_BASE_PROMISE__ = null; }, 1000);
      }
    })();

    return window.__CCO_CARREGANDO_BASE_PROMISE__;
  }

  window.carregarBaseSupabase = carregarBaseSupabase = carregarBaseRapidaSupabaseFinal;
  window.inicializarPainelGeralAposLogin = async function inicializarPainelGeralAposLogin(){
    window.CCO_PAGE = 'painel';
    try { if (typeof atualizarData === 'function') atualizarData(); } catch(e) {}
    try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e) {}
    const ok = await carregarBaseRapidaSupabaseFinal();
    if (!ok && typeof carregarResumoLocal === 'function') carregarResumoLocal();
    return ok;
  };
})();

/* =====================================================
   PATCH V4 • SUPABASE PAGINAÇÃO COMPLETA DO MÊS
   Corrige corte de 1000 registros no Painel Geral.
   O Supabase/PostgREST pode limitar cada requisição a 1000 linhas.
   Esta versão busca em páginas de 1000 até acabar.
===================================================== */
(function ccoPatchSupabasePaginacaoCompletaV4(){
  const ORDEM_SERVICOS_V4 = ["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];
  const NOMES_SERVICOS_V4 = {
    "P1":"Coleta Orgânica",
    "P2.1":"Coleta Seletiva",
    "P2.2":"Rejeito Seletivo das IRR",
    "P3":"Remoção Manual",
    "P4":"Remoção Mecanizada",
    "P5":"Varrição Manual",
    "P6":"Varrição Mecanizada",
    "P7":"Lavagem de Vias e Logradouros",
    "P8":"Limpeza de Equipamentos e Bens",
    "P9":"Catação em Área Verde",
    "P10":"Pintura Mecanizada",
    "P11":"Limpeza Pós-Eventos e Coleta de Gordura",
    "P12":"Transbordo"
  };

  function numV4(v){
    try { return typeof numero === 'function' ? numero(v) : Number(String(v ?? 0).replace(/\./g,'').replace(',','.')) || 0; }
    catch(e){ return Number(v) || 0; }
  }

  function clonarV4(obj){
    try { return typeof clonar === 'function' ? clonar(obj) : JSON.parse(JSON.stringify(obj)); }
    catch(e){ return obj; }
  }

  function ordenarV4(lista){
    return (lista || []).slice().sort((a,b) => {
      const ia = ORDEM_SERVICOS_V4.indexOf(String(a.servico || '').trim());
      const ib = ORDEM_SERVICOS_V4.indexOf(String(b.servico || '').trim());
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
  }

  async function selecionarTudoPaginadoV4(criarQuery, tamanhoPagina = 1000, limiteSeguranca = 300000){
    const todas = [];
    let inicio = 0;

    while (inicio < limiteSeguranca) {
      const fim = inicio + tamanhoPagina - 1;
      const { data, error } = await criarQuery().range(inicio, fim);
      if (error) throw error;

      const lote = data || [];
      todas.push(...lote);

      console.log(`CCO Supabase pagina: ${inicio}-${fim} | recebidas ${lote.length} | total ${todas.length}`);

      if (lote.length < tamanhoPagina) break;
      inicio += tamanhoPagina;

      // Pequena pausa para não travar o navegador durante muitos lotes.
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return todas;
  }

  function servicoLinhaV4(linha){
    return String(linha.servico || linha.codigo_servico || linha.codigo || '').trim().toUpperCase();
  }

  function valorServicoV4(servico, acumulado){
    const fixo = (typeof VALORES_FIXOS !== 'undefined' ? VALORES_FIXOS[servico] : 0) || 0;
    if (["P3","P7","P8","P9","P10","P11"].includes(servico)) return fixo;
    return fixo * numV4(acumulado);
  }

  function montarPainelPorOperacoesV4(ops){
    const mapa = {};

    (ops || []).forEach(item => {
      const servico = servicoLinhaV4(item);
      if (!servico) return;

      if (!mapa[servico]) {
        mapa[servico] = { servico, peso:0, viagens:0, km:0, equipe:0, executado:0, dias:new Set() };
      }

      mapa[servico].peso += numV4(item.peso_t ?? item.peso);
      mapa[servico].viagens += numV4(item.viagens);
      mapa[servico].km += numV4(item.km_total ?? item.km);
      mapa[servico].equipe += numV4(item.equipe);
      mapa[servico].executado += numV4(item.executado);

      const data = item.data_operacao || item.data_normalizada || item.data || '';
      if (data) mapa[servico].dias.add(String(data).slice(0,10));
    });

    return ordenarV4(Object.values(mapa).map(x => {
      let acumulado = x.executado || x.peso || x.km || x.viagens || x.equipe || 0;
      if (["P5","P6"].includes(x.servico)) acumulado = x.km || acumulado;
      if (["P1","P2.1","P2.2","P12"].includes(x.servico)) acumulado = x.peso || acumulado;
      if (["P3","P7","P8","P9","P10","P11"].includes(x.servico)) acumulado = x.equipe || x.executado || acumulado;

      return {
        servico: x.servico,
        nome_servico: NOMES_SERVICOS_V4[x.servico] || x.servico,
        acumulado_mes: acumulado,
        medicao: ["P5","P6"].includes(x.servico) ? 'KM' : (["P3","P7","P8","P9","P10","P11"].includes(x.servico) ? 'Equipe' : 'Tonelada/Executado'),
        previsto_mes: 0,
        porcentagem_execucao: 0,
        dias_acumulados: x.dias.size,
        total_dias_mes: x.dias.size,
        valor: valorServicoV4(x.servico, acumulado),
        status: acumulado > 0 ? 'Com dados' : 'Sem dados'
      };
    }));
  }

  async function carregarBaseCompletaMesV4(){
    const bancoV4 = window.supabaseClient;
    if (!bancoV4) return false;

    if (window.__CCO_CARREGANDO_BASE_V4__) return window.__CCO_CARREGANDO_BASE_V4__;

    window.__CCO_CARREGANDO_BASE_V4__ = (async () => {
      try {
        if (typeof preencherTexto === 'function') preencherTexto('nomeArquivo', '🔄 Carregando mês completo do Supabase...');

        const { data: ultima, error: erroUltima } = await bancoV4
          .from('importacoes')
          .select('*')
          .order('ano', { ascending:false, nullsFirst:false })
          .order('mes', { ascending:false, nullsFirst:false })
          .order('criado_em', { ascending:false })
          .limit(1);

        if (erroUltima || !ultima || !ultima.length) {
          if (erroUltima) console.error('Erro ao buscar último mês:', erroUltima);
          return false;
        }

        const importacao = ultima[0];
        const ano = Number(importacao.ano);
        const mes = Number(importacao.mes);

        const painelBanco = await selecionarTudoPaginadoV4(() =>
          bancoV4
            .from('painel_executivo')
            .select('*')
            .eq('importacao_id', importacao.id)
            .order('servico', { ascending:true }),
          1000,
          10000
        );

        const operacoesBanco = await selecionarTudoPaginadoV4(() =>
          bancoV4
            .from('operacoes')
            .select('*')
            .eq('ano', ano)
            .eq('mes', mes)
            .order('data_operacao', { ascending:true }),
          1000,
          300000
        );

        if (typeof limparMemoria === 'function') limparMemoria();
        else {
          painelExecutivo = [];
          painelExecutivoOriginal = [];
          operacoes = [];
          operacoesOriginal = [];
          todasAsAbas = [];
          sheetsOriginais = {};
        }

        painelExecutivo = ordenarV4((painelBanco || []).filter(item => ORDEM_SERVICOS_V4.includes(String(item.servico || '').trim())).map(item => ({
          servico: item.servico || '',
          nome_servico: item.nome_servico || NOMES_SERVICOS_V4[item.servico] || '',
          acumulado_mes: numV4(item.acumulado),
          medicao: item.medicao || '',
          previsto_mes: numV4(item.previsto),
          porcentagem_execucao: numV4(item.percentual),
          dias_acumulados: numV4(item.dias_acumulados),
          total_dias_mes: numV4(item.total_dias_mes),
          valor: numV4(item.valor),
          status: numV4(item.acumulado) > 0 ? 'Com dados' : 'Sem dados'
        })));

        operacoes = (operacoesBanco || []).filter(item => ORDEM_SERVICOS_V4.includes(String(item.servico || '').trim().toUpperCase())).map(item => ({
          servico: String(item.servico || '').trim().toUpperCase(),
          origem: 'Banco Supabase',
          data: item.data_operacao || '',
          data_normalizada: item.data_operacao || '',
          turno: item.turno || '',
          ra: item.ra || 'Por demanda',
          setor: '',
          peso: numV4(item.peso_t),
          viagens: numV4(item.viagens),
          km: numV4(item.km_total),
          equipe: numV4(item.equipe),
          executado: numV4(item.executado),
          velocidade_media: numV4(item.velocidade_media || item?.json_original?.velocidade_media || item?.json_original?.['Velocidade Média']),
          status: 'Com dados'
        }));

        if (!painelExecutivo.length && operacoesBanco.length) {
          painelExecutivo = montarPainelPorOperacoesV4(operacoesBanco);
          console.warn('Painel executivo vazio: painel montado pelo fallback das operações completas do mês.');
        }

        painelExecutivoOriginal = clonarV4(painelExecutivo);
        operacoesOriginal = clonarV4(operacoes);
        window.dadosBaseAtiva = operacoesOriginal;
        window.painelExecutivoAtivo = painelExecutivoOriginal;

        todasAsAbas = [{
          arquivo: importacao.nome_arquivo || 'Banco Supabase',
          aba: `Mês completo ${String(mes).padStart(2,'0')}/${ano}`,
          linhas: operacoes.length
        }];
        sheetsOriginais = {};

        try { if (typeof atualizarDashboard === 'function') atualizarDashboard(); } catch(e) { console.error('Erro ao atualizar dashboard:', e); }
        try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e) {}

        const mesNome = (typeof MESES_BR !== 'undefined' ? MESES_BR[String(mes).padStart(2, '0')] : '') || String(mes).padStart(2,'0');
        if (typeof preencherTexto === 'function') {
          preencherTexto('nomeArquivo', `Banco carregado: ${mesNome}/${ano} | ${operacoes.length.toLocaleString('pt-BR')} registros completos do mês | Painel ${painelExecutivo.length} serviços oficiais`);
        }

        console.log('CCO V4 mês completo OK:', { ano, mes, painel: painelExecutivo.length, operacoes: operacoes.length });
        return true;
      } catch(erro) {
        console.error('Erro geral no carregamento completo V4:', erro);
        return false;
      } finally {
        setTimeout(() => { window.__CCO_CARREGANDO_BASE_V4__ = null; }, 1000);
      }
    })();

    return window.__CCO_CARREGANDO_BASE_V4__;
  }

  window.carregarBaseSupabase = carregarBaseSupabase = carregarBaseCompletaMesV4;
  window.inicializarPainelGeralAposLogin = async function inicializarPainelGeralAposLogin(){
    window.CCO_PAGE = 'painel';
    try { if (typeof atualizarData === 'function') atualizarData(); } catch(e) {}
    try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e) {}
    const ok = await carregarBaseCompletaMesV4();
    if (!ok && typeof carregarResumoLocal === 'function') carregarResumoLocal();
    return ok;
  };
})();


/* =====================================================
   PATCH V5 • BASE COMPLETA SEM CORTE + ESCOPO OFICIAL
   - Expõe window.dadosBaseAtiva para Dados, KPI e Execução.
   - Mantém os 13 serviços oficiais: P1, P2.1, P2.2 e P3 até P12.
   Observação: são 13 linhas porque o P2 é dividido em P2.1 e P2.2.
===================================================== */
(function ccoPatchBaseCompletaV5(){
  const SERVICOS_OFICIAIS_V5 = ["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];

  function serv(v){ return String(v || '').trim().toUpperCase(); }
  function publicarBaseV5(){
    try {
      if (Array.isArray(window.operacoesOriginal) && window.operacoesOriginal.length) {
        window.dadosBaseAtiva = window.operacoesOriginal.filter(x => SERVICOS_OFICIAIS_V5.includes(serv(x.servico || x.Servico)));
      } else if (Array.isArray(window.operacoes) && window.operacoes.length) {
        window.dadosBaseAtiva = window.operacoes.filter(x => SERVICOS_OFICIAIS_V5.includes(serv(x.servico || x.Servico)));
      }
      if (Array.isArray(window.painelExecutivoOriginal) && window.painelExecutivoOriginal.length) {
        window.painelExecutivoAtivo = window.painelExecutivoOriginal.filter(x => SERVICOS_OFICIAIS_V5.includes(serv(x.servico)));
      }
    } catch(e) {}
  }

  const carregarBaseAnteriorV5 = window.carregarBaseSupabase;
  if (typeof carregarBaseAnteriorV5 === 'function') {
    window.carregarBaseSupabase = carregarBaseSupabase = async function(){
      const ok = await carregarBaseAnteriorV5.apply(this, arguments);
      publicarBaseV5();
      return ok;
    };
  }

  const atualizarAnteriorV5 = window.atualizarDashboard;
  if (typeof atualizarAnteriorV5 === 'function') {
    window.atualizarDashboard = atualizarDashboard = function(){
      publicarBaseV5();
      return atualizarAnteriorV5.apply(this, arguments);
    };
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(publicarBaseV5, 300));
})();

/* =====================================================
   PATCH V6 • MAIO SEM SOMA INDEVIDA
   Correção principal:
   - Antes a tela carregava operacoes filtrando só por ano/mes.
   - Se existissem várias importações de Maio/2026 no banco, somava tudo junto.
   - Agora carrega SOMENTE as linhas da importação mais recente selecionada.
   - Também deduplica por id para evitar linha repetida no retorno.
===================================================== */
(function ccoPatchMaioSemDuplicidadeV6(){
  const ORDEM_V6 = ["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];
  const NOMES_V6 = {
    "P1":"Coleta Orgânica",
    "P2.1":"Coleta Seletiva",
    "P2.2":"Rejeito Seletivo das IRR",
    "P3":"Remoção Manual",
    "P4":"Remoção Mecanizada",
    "P5":"Varrição Manual",
    "P6":"Varrição Mecanizada",
    "P7":"Lavagem de Vias e Logradouros",
    "P8":"Limpeza de Equipamentos e Bens",
    "P9":"Catação em Área Verde",
    "P10":"Pintura Mecanizada",
    "P11":"Limpeza Pós-Eventos e Coleta de Gordura",
    "P12":"Transbordo"
  };

  function bancoV6(){
    try {
      if (window.supabaseClient) return window.supabaseClient;
      if (window.banco) return window.banco;
    } catch(e) {}
    return null;
  }

  function nV6(valor){
    try {
      if (typeof numero === 'function') return numero(valor);
      if (valor === null || valor === undefined || valor === '') return 0;
      if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
      return Number(String(valor).replace(/\./g, '').replace(',', '.')) || 0;
    } catch(e) {
      return Number(valor) || 0;
    }
  }

  function servV6(valor){
    return String(valor || '').trim().toUpperCase();
  }

  function ordenarV6(lista){
    return (lista || []).slice().sort((a,b) => {
      const ia = ORDEM_V6.indexOf(servV6(a.servico));
      const ib = ORDEM_V6.indexOf(servV6(b.servico));
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
  }

  async function selecionarTudoV6(criarQuery, tamanho = 1000, limiteSeguranca = 300000){
    const todas = [];
    let inicio = 0;

    while (inicio < limiteSeguranca) {
      const fim = inicio + tamanho - 1;
      const { data, error } = await criarQuery().range(inicio, fim);
      if (error) throw error;

      const lote = data || [];
      todas.push(...lote);

      if (lote.length < tamanho) break;
      inicio += tamanho;
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return todas;
  }

  function deduplicarV6(lista){
    const vistos = new Set();
    const saida = [];

    (lista || []).forEach((item, idx) => {
      const chave = item.id
        ? `id:${item.id}`
        : [
            item.importacao_id,
            item.servico,
            item.data_operacao,
            item.turno,
            item.ra,
            item.peso_t,
            item.viagens,
            item.km_total,
            item.equipe,
            item.executado,
            idx
          ].join('|');

      if (vistos.has(chave)) return;
      vistos.add(chave);
      saida.push(item);
    });

    return saida;
  }

  function valorServicoV6(servico, acumulado){
    const fixo = (typeof VALORES_FIXOS !== 'undefined' ? VALORES_FIXOS[servico] : 0) || 0;
    if (["P3","P7","P8","P9","P10","P11"].includes(servico)) return fixo;
    return fixo * nV6(acumulado);
  }

  function montarPainelFallbackV6(ops){
    const mapa = {};

    (ops || []).forEach(item => {
      const servico = servV6(item.servico);
      if (!ORDEM_V6.includes(servico)) return;

      if (!mapa[servico]) {
        mapa[servico] = { servico, peso:0, viagens:0, km:0, equipe:0, executado:0, dias:new Set() };
      }

      mapa[servico].peso += nV6(item.peso_t);
      mapa[servico].viagens += nV6(item.viagens);
      mapa[servico].km += nV6(item.km_total);
      mapa[servico].equipe += nV6(item.equipe);
      mapa[servico].executado += nV6(item.executado);
      if (item.data_operacao) mapa[servico].dias.add(String(item.data_operacao).slice(0,10));
    });

    return ordenarV6(Object.values(mapa).map(x => {
      let acumulado = x.executado || x.peso || x.km || x.viagens || x.equipe || 0;
      if (["P5","P6"].includes(x.servico)) acumulado = x.km || acumulado;
      if (["P1","P2.1","P2.2","P12"].includes(x.servico)) acumulado = x.peso || acumulado;
      if (["P3","P7","P8","P9","P10","P11"].includes(x.servico)) acumulado = x.equipe || x.executado || acumulado;

      return {
        servico: x.servico,
        nome_servico: NOMES_V6[x.servico] || x.servico,
        acumulado_mes: acumulado,
        medicao: ["P5","P6"].includes(x.servico) ? 'KM' : (["P3","P7","P8","P9","P10","P11"].includes(x.servico) ? 'Equipe' : 'Tonelada/Executado'),
        previsto_mes: 0,
        porcentagem_execucao: 0,
        dias_acumulados: x.dias.size,
        total_dias_mes: x.dias.size,
        valor: valorServicoV6(x.servico, acumulado),
        status: acumulado > 0 ? 'Com dados' : 'Sem dados'
      };
    }));
  }

  async function carregarBaseSupabaseV6(){
    const banco = bancoV6();
    if (!banco) return false;

    if (window.__CCO_CARREGANDO_BASE_V6__) return window.__CCO_CARREGANDO_BASE_V6__;

    window.__CCO_CARREGANDO_BASE_V6__ = (async () => {
      try {
        if (typeof preencherTexto === 'function') {
          preencherTexto('nomeArquivo', '🔄 Carregando importação ativa sem duplicidade...');
        }

        const { data: ultima, error: erroUltima } = await banco
          .from('importacoes')
          .select('*')
          .order('ano', { ascending:false, nullsFirst:false })
          .order('mes', { ascending:false, nullsFirst:false })
          .order('criado_em', { ascending:false })
          .limit(1);

        if (erroUltima || !ultima || !ultima.length) {
          if (erroUltima) console.error('Erro ao buscar última importação:', erroUltima);
          return false;
        }

        const importacao = ultima[0];
        const ano = Number(importacao.ano);
        const mes = Number(importacao.mes);
        const importacaoId = importacao.id;

        const painelBanco = await selecionarTudoV6(() =>
          banco
            .from('painel_executivo')
            .select('*')
            .eq('importacao_id', importacaoId)
            .order('servico', { ascending:true }),
          1000,
          10000
        );

        /*
          CORREÇÃO V6:
          O filtro por ano/mes sozinho soma importações antigas do mesmo mês.
          O filtro oficial precisa ser por importacao_id.
        */
        const operacoesBancoBrutas = await selecionarTudoV6(() =>
          banco
            .from('operacoes')
            .select('*')
            .eq('importacao_id', importacaoId)
            .order('data_operacao', { ascending:true }),
          1000,
          300000
        );

        const operacoesBanco = deduplicarV6(operacoesBancoBrutas)
          .filter(item => ORDEM_V6.includes(servV6(item.servico)));

        if (typeof limparMemoria === 'function') limparMemoria();
        else {
          painelExecutivo = [];
          painelExecutivoOriginal = [];
          operacoes = [];
          operacoesOriginal = [];
          todasAsAbas = [];
          sheetsOriginais = {};
        }

        painelExecutivo = ordenarV6((painelBanco || [])
          .filter(item => ORDEM_V6.includes(servV6(item.servico)))
          .map(item => ({
            servico: servV6(item.servico),
            nome_servico: item.nome_servico || NOMES_V6[servV6(item.servico)] || '',
            acumulado_mes: nV6(item.acumulado),
            medicao: item.medicao || '',
            previsto_mes: nV6(item.previsto),
            porcentagem_execucao: nV6(item.percentual),
            dias_acumulados: nV6(item.dias_acumulados),
            total_dias_mes: nV6(item.total_dias_mes),
            valor: nV6(item.valor),
            status: nV6(item.acumulado) > 0 ? 'Com dados' : 'Sem dados'
          })));

        operacoes = operacoesBanco.map(item => ({
          servico: servV6(item.servico),
          origem: 'Banco Supabase',
          importacao_id: item.importacao_id,
          data: item.data_operacao || '',
          data_normalizada: item.data_operacao || '',
          turno: item.turno || '',
          ra: item.ra || 'Por demanda',
          setor: '',
          peso: nV6(item.peso_t),
          viagens: nV6(item.viagens),
          km: nV6(item.km_total),
          equipe: nV6(item.equipe),
          executado: nV6(item.executado),
          velocidade_media: nV6(item.velocidade_media || item?.json_original?.velocidade_media || item?.json_original?.['Velocidade Média']),
          status: 'Com dados'
        }));

        if (!painelExecutivo.length && operacoesBanco.length) {
          painelExecutivo = montarPainelFallbackV6(operacoesBanco);
          console.warn('V6: painel_executivo vazio; painel calculado somente pelas operações da importação ativa.');
        }

        painelExecutivoOriginal = typeof clonar === 'function' ? clonar(painelExecutivo) : JSON.parse(JSON.stringify(painelExecutivo));
        operacoesOriginal = typeof clonar === 'function' ? clonar(operacoes) : JSON.parse(JSON.stringify(operacoes));
        window.dadosBaseAtiva = operacoesOriginal;
        window.painelExecutivoAtivo = painelExecutivoOriginal;
        window.__CCO_IMPORTACAO_ATIVA__ = importacao;

        todasAsAbas = [{
          arquivo: importacao.nome_arquivo || 'Banco Supabase',
          aba: `Importação ativa ${String(mes).padStart(2,'0')}/${ano}`,
          linhas: operacoes.length
        }];
        sheetsOriginais = {};

        try { if (typeof atualizarDashboard === 'function') atualizarDashboard(); } catch(e) { console.error('Erro ao atualizar dashboard V6:', e); }
        try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e) {}

        const mesNome = (typeof MESES_BR !== 'undefined' ? MESES_BR[String(mes).padStart(2, '0')] : '') || String(mes).padStart(2,'0');
        if (typeof preencherTexto === 'function') {
          preencherTexto(
            'nomeArquivo',
            `Banco carregado: ${mesNome}/${ano} | ${operacoes.length.toLocaleString('pt-BR')} registros da importação ativa | Painel ${painelExecutivo.length} serviços oficiais`
          );
        }

        console.log('CCO V6 sem duplicidade OK:', {
          importacao_id: importacaoId,
          ano,
          mes,
          registros_brutos: operacoesBancoBrutas.length,
          registros_usados: operacoes.length,
          painel: painelExecutivo.length
        });

        return true;
      } catch(erro) {
        console.error('Erro geral no carregamento V6:', erro);
        return false;
      } finally {
        setTimeout(() => { window.__CCO_CARREGANDO_BASE_V6__ = null; }, 1000);
      }
    })();

    return window.__CCO_CARREGANDO_BASE_V6__;
  }

  window.carregarBaseSupabase = carregarBaseSupabase = carregarBaseSupabaseV6;
  window.inicializarPainelGeralAposLogin = async function inicializarPainelGeralAposLogin(){
    window.CCO_PAGE = 'painel';
    try { if (typeof atualizarData === 'function') atualizarData(); } catch(e) {}
    try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e) {}
    const ok = await carregarBaseSupabaseV6();
    if (!ok && typeof carregarResumoLocal === 'function') carregarResumoLocal();
    return ok;
  };
})();

/* =====================================================
   PATCH V7 PERFORMANCE EXTREMA • CCO
   Objetivo:
   - Painel Geral abre rápido buscando apenas painel_executivo (13 serviços oficiais).
   - Operações completas só carregam sob demanda em KPI, Execução e Base Importada.
   - Mantém filtro por importacao_id para não somar meses/importações antigas.
===================================================== */
(function ccoPatchV7PerformanceExtrema(){
  const ORDEM_V7 = ["P1", "P2.1", "P2.2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11", "P12"];
  const NOMES_V7 = {
    "P1": "Coleta Orgânica",
    "P2.1": "Coleta Seletiva",
    "P2.2": "Rejeito Seletivo das IRR",
    "P3": "Remoção Manual",
    "P4": "Remoção Mecanizada",
    "P5": "Varrição Manual",
    "P6": "Varrição Mecanizada",
    "P7": "Lavagem de Vias e Logradouros",
    "P8": "Limpeza de Equipamentos e Bens",
    "P9": "Catação em Área Verde",
    "P10": "Pintura Mecanizada",
    "P11": "Limpeza Pós-Eventos e Coleta de Gordura",
    "P12": "Transbordo"
  };

  function bancoV7(){
    try {
      if (window.banco) return window.banco;
      if (window.supabaseClient) {
        window.banco = window.supabaseClient;
        return window.banco;
      }
    } catch(e) {}
    return null;
  }

  function nV7(valor){
    try {
      if (typeof numero === 'function') return numero(valor);
      if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
      return Number(String(valor ?? 0).replace(/\./g, '').replace(',', '.')) || 0;
    } catch(e) {
      return Number(valor) || 0;
    }
  }

  function servV7(valor){
    return String(valor || '').trim().toUpperCase();
  }

  function ordenarV7(lista){
    return (lista || []).slice().sort((a,b) => {
      const ia = ORDEM_V7.indexOf(servV7(a.servico));
      const ib = ORDEM_V7.indexOf(servV7(b.servico));
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
  }

  async function selecionarTudoV7(criarQuery, tamanho = 1000, limiteSeguranca = 300000){
    const todas = [];
    let inicio = 0;

    while (inicio < limiteSeguranca) {
      const fim = inicio + tamanho - 1;
      const { data, error } = await criarQuery().range(inicio, fim);
      if (error) throw error;

      const lote = data || [];
      todas.push(...lote);

      if (lote.length < tamanho) break;
      inicio += tamanho;
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return todas;
  }

  async function obterImportacaoAtivaV7(){
    const banco = bancoV7();
    if (!banco) return null;

    const { data, error } = await banco
      .from('importacoes')
      .select('*')
      .order('ano', { ascending:false, nullsFirst:false })
      .order('mes', { ascending:false, nullsFirst:false })
      .order('criado_em', { ascending:false })
      .limit(1);

    if (error || !data || !data.length) {
      if (error) console.error('V7: erro ao buscar importação ativa:', error);
      return null;
    }

    window.__CCO_IMPORTACAO_ATIVA__ = data[0];
    return data[0];
  }

  function publicarPainelV7(painelBanco, importacao){
    painelExecutivo = ordenarV7((painelBanco || [])
      .filter(item => ORDEM_V7.includes(servV7(item.servico)))
      .map(item => ({
        servico: servV7(item.servico),
        nome_servico: item.nome_servico || NOMES_V7[servV7(item.servico)] || '',
        acumulado_mes: nV7(item.acumulado),
        medicao: item.medicao || '',
        previsto_mes: nV7(item.previsto),
        porcentagem_execucao: nV7(item.percentual),
        dias_acumulados: nV7(item.dias_acumulados),
        total_dias_mes: nV7(item.total_dias_mes),
        valor: nV7(item.valor),
        status: nV7(item.acumulado) > 0 ? 'Com dados' : 'Sem dados'
      })));

    painelExecutivoOriginal = typeof clonar === 'function' ? clonar(painelExecutivo) : JSON.parse(JSON.stringify(painelExecutivo));
    window.painelExecutivoAtivo = painelExecutivoOriginal;

    todasAsAbas = [{
      arquivo: importacao?.nome_arquivo || 'Banco Supabase',
      aba: `Painel executivo ${String(importacao?.mes || '').padStart(2,'0')}/${importacao?.ano || ''}`,
      linhas: painelExecutivo.length
    }];
    sheetsOriginais = {};
  }

  async function carregarPainelExecutivoRapidoV7(){
    const banco = bancoV7();
    if (!banco) return false;

    try {
      if (typeof preencherTexto === 'function') preencherTexto('nomeArquivo', '⚡ Carregando Painel Geral rápido...');

      const importacao = await obterImportacaoAtivaV7();
      if (!importacao?.id) return false;

      const painelBanco = await selecionarTudoV7(() =>
        banco
          .from('painel_executivo')
          .select('*')
          .eq('importacao_id', importacao.id)
          .order('servico', { ascending:true }),
        1000,
        10000
      );

      if (typeof limparMemoria === 'function') limparMemoria();
      publicarPainelV7(painelBanco, importacao);

      // PONTO PRINCIPAL DA V7: o Painel Geral NÃO carrega operações.
      operacoes = [];
      operacoesOriginal = [];
      window.dadosBaseAtiva = [];

      try { if (typeof atualizarDashboard === 'function') atualizarDashboard(); } catch(e) { console.error('V7: erro ao atualizar dashboard rápido:', e); }
      try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e) {}

      const mesNome = (typeof MESES_BR !== 'undefined' ? MESES_BR[String(importacao.mes).padStart(2, '0')] : '') || String(importacao.mes).padStart(2,'0');
      if (typeof preencherTexto === 'function') {
        preencherTexto('nomeArquivo', `⚡ Banco carregado rápido: ${mesNome}/${importacao.ano} | Painel ${painelExecutivo.length} serviços oficiais`);
      }

      console.log('CCO V7 painel rápido OK:', {
        importacao_id: importacao.id,
        ano: importacao.ano,
        mes: importacao.mes,
        painel: painelExecutivo.length
      });

      return true;
    } catch(erro) {
      console.error('V7: erro ao carregar painel rápido:', erro);
      return false;
    }
  }

  function deduplicarV7(lista){
    const vistos = new Set();
    const saida = [];
    (lista || []).forEach((item, idx) => {
      const chave = item.id ? `id:${item.id}` : [
        item.importacao_id,
        item.servico,
        item.data_operacao,
        item.turno,
        item.ra,
        item.peso_t,
        item.viagens,
        item.km_total,
        item.equipe,
        item.executado,
        idx
      ].join('|');
      if (vistos.has(chave)) return;
      vistos.add(chave);
      saida.push(item);
    });
    return saida;
  }

  async function carregarOperacoesImportacaoAtivaV7(forcar = false){
    const banco = bancoV7();
    if (!banco) return false;

    if (!forcar && Array.isArray(operacoesOriginal) && operacoesOriginal.length) return true;
    if (window.__CCO_CARREGANDO_OPERACOES_V7__) return window.__CCO_CARREGANDO_OPERACOES_V7__;

    window.__CCO_CARREGANDO_OPERACOES_V7__ = (async () => {
      try {
        if (typeof preencherTexto === 'function') preencherTexto('nomeArquivo', '🔄 Carregando operações da importação ativa...');

        const importacao = window.__CCO_IMPORTACAO_ATIVA__ || await obterImportacaoAtivaV7();
        if (!importacao?.id) return false;

        // Garante painel carregado caso a página atual entre direto por KPI/Execução/Dados.
        if (!Array.isArray(painelExecutivo) || !painelExecutivo.length) {
          const painelBanco = await selecionarTudoV7(() =>
            banco
              .from('painel_executivo')
              .select('*')
              .eq('importacao_id', importacao.id)
              .order('servico', { ascending:true }),
            1000,
            10000
          );
          publicarPainelV7(painelBanco, importacao);
        }

        const brutas = await selecionarTudoV7(() =>
          banco
            .from('operacoes')
            .select('id,importacao_id,servico,data_operacao,turno,ra,peso_t,viagens,km_total,equipe,executado,velocidade_media,json_original')
            .eq('importacao_id', importacao.id)
            .order('data_operacao', { ascending:true }),
          1000,
          300000
        );

        const validas = deduplicarV7(brutas).filter(item => ORDEM_V7.includes(servV7(item.servico)));

        operacoes = validas.map(item => ({
          servico: servV7(item.servico),
          origem: 'Banco Supabase',
          importacao_id: item.importacao_id,
          data: item.data_operacao || '',
          data_normalizada: item.data_operacao || '',
          turno: item.turno || '',
          ra: item.ra || 'Por demanda',
          setor: '',
          peso: nV7(item.peso_t),
          viagens: nV7(item.viagens),
          km: nV7(item.km_total),
          equipe: nV7(item.equipe),
          executado: nV7(item.executado),
          velocidade_media: nV7(item.velocidade_media || item?.json_original?.velocidade_media || item?.json_original?.['Velocidade Média']),
          status: 'Com dados'
        }));

        operacoesOriginal = typeof clonar === 'function' ? clonar(operacoes) : JSON.parse(JSON.stringify(operacoes));
        window.dadosBaseAtiva = operacoesOriginal;

        todasAsAbas = [{
          arquivo: importacao.nome_arquivo || 'Banco Supabase',
          aba: `Importação ativa ${String(importacao.mes).padStart(2,'0')}/${importacao.ano}`,
          linhas: operacoes.length
        }];

        const mesNome = (typeof MESES_BR !== 'undefined' ? MESES_BR[String(importacao.mes).padStart(2, '0')] : '') || String(importacao.mes).padStart(2,'0');
        if (typeof preencherTexto === 'function') {
          preencherTexto('nomeArquivo', `Banco carregado: ${mesNome}/${importacao.ano} | ${operacoes.length.toLocaleString('pt-BR')} registros da importação ativa | Painel ${painelExecutivo.length} serviços oficiais`);
        }

        console.log('CCO V7 operações sob demanda OK:', {
          importacao_id: importacao.id,
          registros_brutos: brutas.length,
          registros_usados: operacoes.length
        });

        return true;
      } catch(erro) {
        console.error('V7: erro ao carregar operações sob demanda:', erro);
        return false;
      } finally {
        setTimeout(() => { window.__CCO_CARREGANDO_OPERACOES_V7__ = null; }, 1000);
      }
    })();

    return window.__CCO_CARREGANDO_OPERACOES_V7__;
  }

  window.carregarPainelExecutivoRapidoV7 = carregarPainelExecutivoRapidoV7;
  window.carregarOperacoesImportacaoAtiva = carregarOperacoesImportacaoAtivaV7;
  window.carregarOperacoesImportacaoAtivaV7 = carregarOperacoesImportacaoAtivaV7;

  window.carregarBaseSupabase = carregarBaseSupabase = async function carregarBaseSupabaseV7(){
    const pagina = String(window.CCO_PAGE || '').toLowerCase();
    if (pagina === 'painel' || pagina === 'index') {
      return carregarPainelExecutivoRapidoV7();
    }
    await carregarPainelExecutivoRapidoV7();
    return carregarOperacoesImportacaoAtivaV7(false);
  };

  window.inicializarPainelGeralAposLogin = async function inicializarPainelGeralAposLogin(){
    window.CCO_PAGE = 'painel';
    try { if (typeof atualizarData === 'function') atualizarData(); } catch(e) {}
    try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e) {}
    const ok = await carregarPainelExecutivoRapidoV7();
    if (!ok && typeof carregarResumoLocal === 'function') carregarResumoLocal();
    return ok;
  };
})();


/* =====================================================
   V12 ESTÁVEL • FILTRO DE MÊS REAL + SEM LOOP
   - Base: V7, preservando design e Execução.
   - O Painel Geral NÃO usa painel_executivo acumulado histórico como fonte do realizado.
   - Mês/Ano são gerados pelo intervalo real de data_operacao da importação ativa.
   - Painel e Execução carregam somente o período selecionado.
   - Sem dispatchEvent automático e com trava contra renderização duplicada.
===================================================== */
(function ccoV12FiltroMesRealSemLoop(){
  const ORDEM = ["P1","P2.1","P2.2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];
  const EQUIPES_FIXAS = window.CCO_EQUIPES_FIXAS;
  const NOMES = {
    P1:"Coleta Orgânica", "P2.1":"Coleta Seletiva", "P2.2":"Rejeito Seletivo das IRR",
    P3:"Remoção Manual", P4:"Remoção Mecanizada", P5:"Varrição Manual", P6:"Varrição Mecanizada",
    P7:"Lavagem de Vias e Logradouros", P8:"Limpeza de Equipamentos e Bens", P9:"Catação em Área Verde",
    P10:"Pintura Mecanizada", P11:"Limpeza Pós-Eventos e Coleta de Gordura", P12:"Transbordo"
  };
  const MESES = {"01":"Janeiro","02":"Fevereiro","03":"Março","04":"Abril","05":"Maio","06":"Junho","07":"Julho","08":"Agosto","09":"Setembro","10":"Outubro","11":"Novembro","12":"Dezembro"};
  function totalDiasOficialV122(ano, mes){
    return Number(ano)>=1900&&Number(mes)>=1&&Number(mes)<=12?window.CCO_REGRAS.obterDiasOperacao(ano,mes):0;
  }

  function previstoOficialV122(servico, ano, mes, meta){
    return window.CCO_REGRAS.calcularPrevisto(servico,ano,mes,n(meta?.previsto),n(meta?.total_dias_mes));
  }

  function db(){ return window.supabaseClient || null; }
  function n(v){ if (typeof numero === 'function') return numero(v); const x = Number(String(v ?? 0).replace(/\./g,'').replace(',','.')); return Number.isFinite(x) ? x : 0; }
  function serv(v){ return String(v || '').trim().toUpperCase(); }
  function clone(o){ try { return typeof clonar === 'function' ? clonar(o) : JSON.parse(JSON.stringify(o)); } catch(e){ return o; } }
  function mesNome(m){ return (typeof MESES_BR !== 'undefined' && MESES_BR[String(m).padStart(2,'0')]) || MESES[String(m).padStart(2,'0')] || String(m); }
  function pad(v){ return String(v).padStart(2,'0'); }
  function periodoKey(ano, mes){ return `${ano}-${pad(mes)}`; }
  function primeiroDia(ano, mes){ return `${ano}-${pad(mes)}-01`; }
  function proximoMes(ano, mes){ const d = new Date(Number(ano), Number(mes), 1); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-01`; }
  function dataISO(v){ return String(v || '').slice(0,10); }
  function addOption(sel, value, text){ const op = document.createElement('option'); op.value = String(value); op.textContent = String(text); sel.appendChild(op); }
  function limpar(sel){ if (sel) sel.innerHTML = ''; }
  function status(txt){ try { if (typeof preencherTexto === 'function') preencherTexto('nomeArquivo', txt); } catch(e){} }

  let catalogoPeriodosPromiseV12 = null;
  async function carregarCatalogoPeriodosV12(forcar = false){
    if (!forcar && catalogoPeriodosPromiseV12) return catalogoPeriodosPromiseV12;
    catalogoPeriodosPromiseV12 = (async () => {
      const supabase = window.supabaseClient;
      if (!supabase) { console.error('Cliente Supabase não disponível.'); return []; }
      const mapa = new Map(), tamanhoPagina = 1000;
      try {
        for (let inicio = 0; ; inicio += tamanhoPagina) {
          const { data, error } = await supabase.from('operacoes')
            .select('data_operacao,importacao_id')
            .not('data_operacao', 'is', null)
            .order('data_operacao', { ascending:false })
            .range(inicio, inicio + tamanhoPagina - 1);
          if (error) {
            console.error('Erro ao carregar catálogo', { message:error?.message, code:error?.code, details:error?.details, hint:error?.hint });
            return [];
          }
          const registros = Array.isArray(data) ? data : [];
          registros.forEach(registro => {
            const match = String(registro.data_operacao || '').slice(0,10).match(/^(\d{4})-(\d{2})-\d{2}$/);
            if (!match) return;
            const ano = Number(match[1]), mes = Number(match[2]), periodo = periodoKey(ano, mes);
            if (!mapa.has(periodo)) mapa.set(periodo, { ano, mes, periodo, importacao_id:registro.importacao_id || null });
          });
          if (registros.length < tamanhoPagina) break;
        }
        const catalogo = [...mapa.values()].sort((a,b) => b.ano-a.ano || b.mes-a.mes);
        window.__CCO_CATALOGO_PERIODOS__ = catalogo;
        window.__CCO_IMPORTACOES_POR_PERIODO__ = Object.fromEntries(catalogo.map(item => [item.periodo, item]));
        window.__CCO_PERIODOS_REAIS_V12__ = catalogo;
        console.log('✅ Catálogo real carregado por data_operacao:', catalogo);
        return catalogo;
      } catch(error) {
        console.error('Falha inesperada ao carregar catálogo de períodos:', { message:error?.message, code:error?.code, details:error?.details, hint:error?.hint });
        return [];
      }
    })();
    const resultado = await catalogoPeriodosPromiseV12;
    if (!resultado.length) catalogoPeriodosPromiseV12 = null;
    return resultado;
  }

  async function obterImportacaoPrincipal(ano, mes){
    const periodos = await carregarCatalogoPeriodosV12();
    return periodos.find(item => item.periodo === periodoKey(ano, mes)) || periodos[0] || null;
  }

  async function garantirPeriodos(){ return carregarCatalogoPeriodosV12(); }

  function popularSelectsPainel(periodoPreferido){
    const periodos = window.__CCO_PERIODOS_REAIS_V12__ || [];
    const selAno = document.getElementById('filtroAno');
    const selMes = document.getElementById('filtroMes');
    const selDia = document.getElementById('filtroDia');
    if (!selAno || !selMes || !periodos.length) return periodos[0]?.periodo || '';

    const atual = periodos.find(p => p.periodo === periodoPreferido)?.periodo || window.__CCO_PERIODO_ATUAL__ || periodos[0].periodo;
    const anoAtual = atual.slice(0,4);
    const mesAtual = atual.slice(5,7);

    limpar(selAno);
    [...new Set(periodos.map(p => String(p.ano)))].forEach(ano => addOption(selAno, ano, ano));
    selAno.value = anoAtual;

    limpar(selMes);
    periodos.filter(p => String(p.ano) === anoAtual).forEach(p => addOption(selMes, pad(p.mes), mesNome(p.mes)));
    selMes.value = mesAtual;

    if (selDia && !selDia.options.length) { limpar(selDia); addOption(selDia, '', 'Todos os dias'); }
    window.__CCO_PERIODO_ATUAL__ = atual;
    return atual;
  }

  function popularSelectsExecucao(periodoPreferido){
    const periodos = window.__CCO_PERIODOS_REAIS_V12__ || [];
    const selAno = document.getElementById('filtroExecucaoAno');
    const selMes = document.getElementById('filtroExecucaoMes');
    if (!selAno || !selMes || !periodos.length) return periodos[0]?.periodo || '';
    const atual = periodos.find(p => p.periodo === periodoPreferido)?.periodo || window.__CCO_PERIODO_ATUAL__ || periodos[0].periodo;
    const anoAtual = atual.slice(0,4);
    const mesAtual = atual.slice(5,7);
    limpar(selAno);
    [...new Set(periodos.map(p => String(p.ano)))].forEach(ano => addOption(selAno, ano, ano));
    selAno.value = anoAtual;
    limpar(selMes);
    periodos.filter(p => String(p.ano) === anoAtual).forEach(p => addOption(selMes, pad(p.mes), mesNome(p.mes)));
    selMes.value = mesAtual;
    filtroExecucaoAnoAtual = anoAtual;
    filtroExecucaoMesAtual = mesAtual;
    window.__CCO_PERIODO_ATUAL__ = atual;
    return atual;
  }

  async function buscarMetas(ano, mes){
    const s = db(); if (!s) return {};
    const { data, error } = await s.from('painel_executivo')
      .select('servico,nome_servico,previsto,medicao,total_dias_mes,dias_acumulados')
      .eq('ano', Number(ano)).eq('mes', Number(mes))
      .order('servico', { ascending:true });
    if (error) { console.warn('V12 metas painel_executivo:', error); return {}; }
    const mapa = {};
    (data || []).forEach(x => { const s = serv(x.servico); if (ORDEM.includes(s)) mapa[s] = x; });
    return mapa;
  }

  function intervalosDoPeriodo(ano, mes, dia){
    if (dia) return [{ inicio: `${dia}T00:00:00`, fim: `${dia}T23:59:59`, dia:true }];
    const ini = new Date(Number(ano), Number(mes)-1, 1);
    const end = new Date(Number(ano), Number(mes), 1);
    const partes = [];
    for (let d = new Date(ini); d < end; d.setDate(d.getDate()+1)) {
      const a = d.getFullYear(), m = pad(d.getMonth()+1), di = pad(d.getDate());
      const diaISO = `${a}-${m}-${di}`;
      partes.push({ inicio: `${diaISO}T00:00:00`, fim: `${diaISO}T23:59:59`, dia:true });
    }
    return partes;
  }

  async function buscarOperacoesPeriodo(imp, ano, mes, dia){
    const s = db(); if (!s) return [];
    const campos = 'id,importacao_id,servico,data_operacao,turno,ra,peso_t,viagens,km_total,equipe,executado';
    const inicioPeriodo = dia || primeiroDia(ano, mes);
    const fimExclusivo = dia ? new Date(`${dia}T00:00:00Z`) : new Date(Date.UTC(Number(ano), Number(mes), 1));
    if (dia) fimExclusivo.setUTCDate(fimExclusivo.getUTCDate() + 1);
    const fimISO = fimExclusivo.toISOString().slice(0,10), saida = [], tamanhoPagina = 1000;
    for (let inicio = 0; ; inicio += tamanhoPagina) {
      const { data, error } = await s.from('operacoes').select(campos)
        .gte('data_operacao', inicioPeriodo).lt('data_operacao', fimISO)
        .order('data_operacao', { ascending:true }).range(inicio, inicio + tamanhoPagina - 1);
      if (error) throw error;
      const lote = Array.isArray(data) ? data : [];
      saida.push(...lote);
      if (lote.length < tamanhoPagina) break;
    }
    const vistos = new Set();
    return saida.filter(x => {
      const k = x.id || [x.importacao_id,x.servico,x.data_operacao,x.turno,x.ra,x.peso_t,x.viagens,x.km_total,x.equipe,x.executado].join('|');
      if (vistos.has(k)) return false;
      vistos.add(k); return true;
    });
  }

  function opsParaGlobais(ops){
    return (ops || []).map(x => ({
      servico: serv(x.servico), origem:'Banco Supabase', importacao_id:x.importacao_id,
      data:x.data_operacao || '', data_normalizada:x.data_operacao || '', turno:x.turno || '', ra:x.ra || 'Por demanda', setor:'',
      peso:n(x.peso_t), viagens:n(x.viagens), km:n(x.km_total), equipe:n(x.equipe), executado:n(x.executado), status:'Com dados'
    })).filter(x => ORDEM.includes(x.servico));
  }

  function painelPorOps(ops, metas, ano, mes){
    const metricas = window.CCOMetricas;
    const operacoesNormalizadas = opsParaGlobais(ops);
    return ORDEM.map(s => {
      const meta = metas[s] || {};
      const previsto = previstoOficialV122(s, ano, mes, meta);
      const vf = (typeof VALORES_FIXOS !== 'undefined' ? VALORES_FIXOS[s] : 0) || 0;
      const registros = operacoesNormalizadas.filter(x => x.servico === s);
      const diasOperacao = totalDiasOficialV122(ano, mes) || n(meta.total_dias_mes);
      const c = metricas.consolidarServico({servico:s,registros,previstoMensal:previsto,diasOperacaoMes:diasOperacao,valorUnitario:vf,nome:meta.nome_servico||NOMES[s]||s});
      return {
        servico:s,
        nome_servico: meta.nome_servico || NOMES[s] || s,
        acumulado_mes: c.acumuladoReal,
        medicao: Object.prototype.hasOwnProperty.call(EQUIPES_FIXAS, s) ? 'Equipe' : (s === 'P5' || s === 'P6' ? 'KM' : (s === 'P2.1' || s === 'P2.2' ? 'Viagens realizadas' : 'Tonelada/Executado')),
        previsto_mes: previsto,
        previsto_acumulado: c.previstoAcumulado,
        porcentagem_execucao: c.percentualCumprimento,
        dias_acumulados: c.diasExecutados,
        total_dias_mes: c.diasOperacaoMes,
        quantidade_equipes: c.quantidadeEquipes,
        produtividade: c.produtividade,
        valor: c.valorAcumulado,
        status: c.status === 'com_dados' ? 'Com dados' : 'Sem dados',
        avisos_consistencia: c.avisos
      };
    });
  }

  function publicar(painel, ops, imp){
    painelExecutivo = painel || [];
    painelExecutivoOriginal = clone(painelExecutivo);
    operacoes = opsParaGlobais(ops || []);
    operacoesOriginal = clone(operacoes);
    window.painelExecutivoAtivo = painelExecutivoOriginal;
    window.dadosBaseAtiva = operacoesOriginal;
    window.__CCO_IMPORTACAO_ATIVA__ = imp || window.__CCO_IMPORTACAO_ATIVA__;
    todasAsAbas = [{ arquivo:'Banco Supabase', aba:'Período filtrado V12', linhas: operacoesOriginal.length }];
  }

  async function popularDiasDoPeriodo(imp, ano, mes){
    const selDia = document.getElementById('filtroDia');
    if (!selDia) return;
    const anterior = selDia.value || '';
    limpar(selDia); addOption(selDia, '', 'Todos os dias');
    const ops = await buscarOperacoesPeriodo(imp, ano, mes, '');
    const dias = [...new Set(ops.map(x => dataISO(x.data_operacao)).filter(Boolean))].sort();
    dias.forEach(d => { const [a,m,di] = d.split('-'); addOption(selDia, d, `${di}/${m}/${a}`); });
    selDia.value = dias.includes(anterior) ? anterior : '';
  }

  async function carregarPeriodoV12(periodo, contexto){
    const ano = periodo.slice(0,4);
    const mes = periodo.slice(5,7);
    const imp = await obterImportacaoPrincipal(ano, mes);
    if (!imp) return false;
    const dia = contexto === 'painel' ? (document.getElementById('filtroDia')?.value || '') : '';
    const chave = `${contexto}|${periodo}|${dia}`;
    if (window.__CCO_V12_CARREGANDO_CHAVE__ === chave && window.__CCO_V12_PROMESSA__) return window.__CCO_V12_PROMESSA__;
    window.__CCO_V12_CARREGANDO_CHAVE__ = chave;
    window.__CCO_V12_PROMESSA__ = (async () => {
      try {
        status(`🔄 Carregando ${dia ? dia.split('-').reverse().join('/') : mesNome(mes)+'/'+ano}...`);
        window.__CCO_PERIODO_ATUAL__ = periodo;
        const [metas, ops] = await Promise.all([buscarMetas(ano, mes), buscarOperacoesPeriodo(imp, ano, mes, dia)]);
        const painel = painelPorOps(ops, metas, ano, mes);
        publicar(painel, ops, imp);
        if (contexto === 'painel') popularDiasDoPeriodo(imp, ano, mes).catch(()=>{});
        try { if (typeof aplicarRestricoesPerfil === 'function') aplicarRestricoesPerfil(); } catch(e){}
        try { if (typeof atualizarDashboard === 'function') atualizarDashboard(); } catch(e){ console.warn('V12 atualizarDashboard:', e); }
        status(`Banco carregado: ${dia ? dia.split('-').reverse().join('/') : mesNome(mes)+'/'+ano} | ${ops.length.toLocaleString('pt-BR')} registros filtrados`);
        return true;
      } catch(e) {
        console.error('V12 erro ao carregar período:', e);
        status('Erro ao carregar o período selecionado. Veja o console.');
        return false;
      } finally {
        setTimeout(() => { if (window.__CCO_V12_CARREGANDO_CHAVE__ === chave) { window.__CCO_V12_CARREGANDO_CHAVE__ = ''; window.__CCO_V12_PROMESSA__ = null; } }, 250);
      }
    })();
    return window.__CCO_V12_PROMESSA__;
  }

  async function inicializarPainelV12(){
    window.CCO_PAGE = 'painel';
    if (window.__CCO_V12_INIT_PAINEL__) return window.__CCO_V12_INIT_PAINEL__;
    window.__CCO_V12_INIT_PAINEL__ = (async () => {
      try { if (typeof atualizarData === 'function') atualizarData(); } catch(e){}
      const periodos = await garantirPeriodos();
      if (!periodos.length) return false;
      const periodo = popularSelectsPainel(window.__CCO_PERIODO_ATUAL__ || periodos[0].periodo);
      return carregarPeriodoV12(periodo, 'painel');
    })();
    const ok = await window.__CCO_V12_INIT_PAINEL__;
    setTimeout(() => { window.__CCO_V12_INIT_PAINEL__ = null; }, 500);
    return ok;
  }

  async function inicializarExecucaoV12(){
    window.CCO_PAGE = 'execucao';
    const periodos = await garantirPeriodos();
    if (!periodos.length) return false;
    const periodo = popularSelectsExecucao(window.__CCO_PERIODO_ATUAL__ || periodos[0].periodo);
    const ok = await carregarPeriodoV12(periodo, 'execucao');
    try { if (typeof carregarFiltroMesesComparativoExecucao === 'function') carregarFiltroMesesComparativoExecucao(); } catch(e){}
    try { if (typeof renderTabelaContratualMensal === 'function') renderTabelaContratualMensal(); } catch(e){ console.warn('V12 tabela execução:', e); }
    try { if (typeof renderComparativoMesesExecucao === 'function') renderComparativoMesesExecucao(); } catch(e){}
    return ok;
  }

  async function aplicarPainelV12(){
    const ano = document.getElementById('filtroAno')?.value || '';
    const mes = document.getElementById('filtroMes')?.value || '';
    const periodos = await garantirPeriodos();
    if (!ano || !mes) {
      const p = popularSelectsPainel(periodos[0]?.periodo);
      return carregarPeriodoV12(p, 'painel');
    }
    const p = periodoKey(ano, mes);
    window.__CCO_PERIODO_ATUAL__ = p;
    popularSelectsPainel(p);
    return carregarPeriodoV12(p, 'painel');
  }

  async function aplicarExecucaoV12(){
    const ano = document.getElementById('filtroExecucaoAno')?.value || '';
    const mes = document.getElementById('filtroExecucaoMes')?.value || '';
    const periodos = await garantirPeriodos();
    if (!ano || !mes) {
      const p = popularSelectsExecucao(periodos[0]?.periodo);
      await carregarPeriodoV12(p, 'execucao');
    } else {
      const p = periodoKey(ano, mes);
      window.__CCO_PERIODO_ATUAL__ = p;
      popularSelectsExecucao(p);
      await carregarPeriodoV12(p, 'execucao');
    }
    filtroExecucaoMesAtual = document.getElementById('filtroExecucaoMes')?.value || '';
    filtroExecucaoAnoAtual = document.getElementById('filtroExecucaoAno')?.value || '';
    try { if (typeof renderTabelaContratualMensal === 'function') renderTabelaContratualMensal(); } catch(e){ console.warn('V12 render execução:', e); }
    try { const codigo = typeof obterServicoAtivo === 'function' ? obterServicoAtivo() : ''; if (codigo && codigo !== 'geral' && typeof renderDetalheServicoMensal === 'function') renderDetalheServicoMensal(codigo); } catch(e){}
    try { if (typeof renderComparativoMesesExecucao === 'function') renderComparativoMesesExecucao(); } catch(e){}
    return true;
  }

  window.ccoV12InicializarPainel = inicializarPainelV12;
  window.ccoV12InicializarExecucao = inicializarExecucaoV12;
  window.carregarBaseSupabase = carregarBaseSupabase = async function(){
    const pagina = String(window.CCO_PAGE || '').toLowerCase();
    if (pagina === 'execucao') return inicializarExecucaoV12();
    if (pagina === 'painel' || pagina === 'index') return inicializarPainelV12();
    // KPI/Dados: carrega o último mês real, não a importação histórica inteira.
    const periodos = await garantirPeriodos();
    const p = window.__CCO_PERIODO_ATUAL__ || periodos[0]?.periodo;
    return carregarPeriodoV12(p, pagina || 'dados');
  };
  window.inicializarPainelGeralAposLogin = inicializarPainelV12;
  window.carregarFiltrosPeriodoDisponiveis = function(){ garantirPeriodos().then(ps => popularSelectsPainel(window.__CCO_PERIODO_ATUAL__ || ps[0]?.periodo)); };
  window.aplicarFiltroPeriodoExecutivo = aplicarFiltroPeriodoExecutivo = aplicarPainelV12;
  window.limparFiltroPeriodo = limparFiltroPeriodo = async function(){
    const periodos = await garantirPeriodos();
    const p = periodos[0]?.periodo || '';
    const dia = document.getElementById('filtroDia'); if (dia) dia.value = '';
    popularSelectsPainel(p);
    return carregarPeriodoV12(p, 'painel');
  };
  window.carregarCatalogoPeriodos = carregarCatalogoPeriodosV12;
  window.carregarFiltrosExecucaoMensal = async function(){ try { const ps=await garantirPeriodos(); return popularSelectsExecucao(window.__CCO_PERIODO_ATUAL__ || ps[0]?.periodo); } catch(error) { console.error('Erro ao carregar catálogo', { message:error?.message, code:error?.code, details:error?.details, hint:error?.hint }); return ''; } };
  window.aplicarFiltroExecucaoMensal = aplicarFiltroExecucaoMensal = aplicarExecucaoV12;
  window.limparFiltroExecucaoMensal = limparFiltroExecucaoMensal = async function(){
    const periodos = await garantirPeriodos();
    const p = periodos[0]?.periodo || '';
    popularSelectsExecucao(p);
    return aplicarExecucaoV12();
  };

  console.log('✅ CCO V12 carregado: filtros mensais reais, sem loop e com regra de equipes.');
})();

/* =====================================================
   PATCH V12.1 • TOTAL DIAS MÊS OFICIAL FIXO
   Fonte confirmada pelo usuário:
   nov/25=18, dez/25=26, jan/26=26, fev/26=24,
   mar/26=26, abr/26=26, mai/26=24
   Este patch fica no final para sobrescrever qualquer fallback antigo.
===================================================== */
(function ccoPatchTotalDiasMesOficialV121(){
  const DIAS_OFICIAIS_POR_PERIODO = window.CCO_REGRAS.DIAS_OPERACAO;

  function chavePeriodo(ano, mes){
    const a = Number(ano || 0);
    const m = Number(mes || 0);
    if (!a || !m) return "";
    return `${a}-${String(m).padStart(2, "0")}`;
  }

  window.ccoDiasOficiaisPorPeriodo = DIAS_OFICIAIS_POR_PERIODO;

  window.ccoObterTotalDiasOperacao = function(ano, mes){
    return Number(ano)>=1900&&Number(mes)>=1&&Number(mes)<=12?window.CCO_REGRAS.obterDiasOperacao(ano,mes):0;
  };

  calcularTotalDiasMes = function(ano, mes){
    return Number(ano)>=1900&&Number(mes)>=1&&Number(mes)<=12?window.CCO_REGRAS.obterDiasOperacao(ano,mes):0;
  };

  function aplicarDiasOficialPainelAtual(){
    try {
      const ano = document.getElementById("filtroAno")?.value || window.CCO_ANO_ATUAL || "";
      const mes = document.getElementById("filtroMes")?.value || window.CCO_MES_ATUAL || "";
      const dias = calcularTotalDiasMes(ano, mes);
      if (!dias || !Array.isArray(painelExecutivo)) return;
      painelExecutivo = painelExecutivo.map(item => ({ ...item, total_dias_mes: dias }));
      if (typeof renderTabelaExecutiva === "function") renderTabelaExecutiva();
      if (typeof renderCards === "function") renderCards();
    } catch (e) {}
  }

  const recalcularPainelAnterior = typeof recalcularPainelPorFiltro === "function" ? recalcularPainelPorFiltro : null;
  if (recalcularPainelAnterior) {
    recalcularPainelPorFiltro = function(dadosFiltro, ano, mes, dia){
      const retorno = recalcularPainelAnterior.apply(this, arguments);
      const dias = calcularTotalDiasMes(ano, mes);
      if (dias && Array.isArray(painelExecutivo)) {
        painelExecutivo = painelExecutivo.map(item => ({ ...item, total_dias_mes: dias }));
      }
      return retorno;
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(aplicarDiasOficialPainelAtual, 300);
  }, { once: true });

  console.log("Patch Total Dias Mês oficial ativo:", DIAS_OFICIAIS_POR_PERIODO);
})();


/* =====================================================
   PATCH V12.2 • PREVISTO OFICIAL PELO TOTAL DIAS MÊS
   Regra: Total Dias Mês define o previsto dos serviços variáveis.
   Serviços de equipe permanecem fixos: P3=12, P7=2, P8=2, P9=11, P10=3, P11=1.
===================================================== */
(function ccoPatchPrevistoOficialPorDiasV122(){
  const EQUIPES = window.CCO_EQUIPES_FIXAS;

  window.ccoEquipesFixasOficiais = EQUIPES;

  function num(v){
    try { if (typeof numero === 'function') return numero(v); } catch(e) {}
    const x = Number(String(v ?? 0).replace(/\./g,'').replace(',','.'));
    return Number.isFinite(x) ? x : 0;
  }
  function diasPeriodo(ano, mes, fallback){
    return Number(ano)>=1900&&Number(mes)>=1&&Number(mes)<=12?window.CCO_REGRAS.obterDiasOperacao(ano,mes):num(fallback);
  }
  window.ccoCalcularPrevistoOficial = function(servico, ano, mes, previstoOriginal, totalDiasOriginal){
    const s = String(servico || '').trim().toUpperCase();
    return window.CCO_REGRAS.calcularPrevisto(s,ano,mes,num(previstoOriginal),num(totalDiasOriginal));
  };

  const recalcularAnterior = typeof recalcularPainelPorFiltro === 'function' ? recalcularPainelPorFiltro : null;
  if (recalcularAnterior) {
    recalcularPainelPorFiltro = function(dadosFiltro, ano, mes, dia){
      const retorno = recalcularAnterior.apply(this, arguments);
      try {
        const dias = diasPeriodo(ano, mes, 0);
        if (Array.isArray(painelExecutivo)) {
          painelExecutivo = painelExecutivo.map(item => {
            const previsto = window.ccoCalcularPrevistoOficial(item.servico, ano, mes, item.previsto_mes, dias);
            const acumulado = num(item.acumulado_mes);
            const previstoAcumulado = window.CCOMetricas.calcularPrevistoAcumulado({previstoMensal:previsto,diasExecutados:num(item.dias_acumulados),diasOperacaoMes:dias||item.total_dias_mes});
            const valorUnitario = (typeof VALORES_FIXOS !== 'undefined' ? VALORES_FIXOS[item.servico] : 0) || 0;
            return {
              ...item,
              previsto_mes: previsto,
              acumulado_mes: acumulado,
              previsto_acumulado: previstoAcumulado,
              porcentagem_execucao: window.CCOMetricas.calcularPercentualCumprimento({acumuladoReal:acumulado,previstoAcumulado}),
              total_dias_mes: dias || item.total_dias_mes,
              valor: acumulado * valorUnitario
            };
          });
        }
      } catch(e) { console.warn('Patch previsto oficial V12.2:', e); }
      return retorno;
    };
  }
  console.log('Patch V12.2 usando regras de negócio centralizadas.');
})();

/* =====================================================
   PATCH 2026-07-17 • FILTROS 2025 + KPI DIÁRIO + IMPORTAÇÃO
   - pagina toda a tabela operacoes (remove limite de 1000 linhas)
   - salva/substitui todos os meses existentes na planilha
   - recarrega a base e os filtros logo após importar
===================================================== */
async function ccoBuscarTodosRegistros(tabela, colunas = "*", ordenacoes = []) {
  const pagina = 1000;
  let inicio = 0;
  let resultado = [];

  while (true) {
    let consulta = banco.from(tabela).select(colunas).range(inicio, inicio + pagina - 1);
    ordenacoes.forEach(ordem => {
      consulta = consulta.order(ordem.coluna, {
        ascending: ordem.ascending !== false,
        nullsFirst: ordem.nullsFirst === true
      });
    });

    const { data, error } = await consulta;
    if (error) throw error;

    const lote = data || [];
    resultado = resultado.concat(lote);
    if (lote.length < pagina) break;
    inicio += pagina;
  }

  return resultado;
}

function ccoPeriodosDaImportacao() {
  const mapa = new Map();
  (operacoes || []).forEach(item => {
    const data = String(item.data_normalizada || "").substring(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return;
    const ano = Number(data.substring(0, 4));
    const mes = Number(data.substring(5, 7));
    const chave = `${ano}-${String(mes).padStart(2, "0")}`;
    if (!mapa.has(chave)) mapa.set(chave, { ano, mes, chave, operacoes: [] });
    mapa.get(chave).operacoes.push(item);
  });
  return [...mapa.values()].sort((a, b) => a.chave.localeCompare(b.chave));
}

async function ccoExcluirImportacoesDoPeriodo(ano, mes) {
  const { data, error } = await banco.from("importacoes").select("id").eq("ano", ano).eq("mes", mes);
  if (error) throw error;
  const ids = (data || []).map(i => i.id).filter(Boolean);
  if (!ids.length) return;

  await banco.from("operacoes").delete().in("importacao_id", ids);
  await banco.from("painel_executivo").delete().in("importacao_id", ids);
  await banco.from("planilhas_importadas").delete().in("importacao_id", ids);
  await banco.from("importacoes").delete().in("id", ids);
}

function sanitizarParaSupabase(valor) {
  return JSON.parse(JSON.stringify(valor, (chave, item) => {
    if (typeof item === "number" && !Number.isFinite(item)) return null;
    if (item === undefined) return null;
    if (item instanceof Date) return item.toISOString();
    return item;
  }));
}
window.sanitizarParaSupabase = sanitizarParaSupabase;

function ccoTamanhoPayloadBytes(payload) {
  const json = JSON.stringify(payload);
  try { return new Blob([json]).size; }
  catch (_) { return new TextEncoder().encode(json).length; }
}

async function ccoArquivarPlanilhasPorPeriodo(nomeArquivo, importacao, periodo) {
  for (const nomeAba of Object.keys(sheetsOriginais || {})) {
    const aba = sheetsOriginais[nomeAba] || {};
    const dadosAba = aba.dadosOriginais || [];
    const lotes = dividirEmLotesSupabase(dadosAba, 50);

    for (let indiceLote = 0; indiceLote < lotes.length; indiceLote++) {
      const lote = lotes[indiceLote];
      const payload = {
        nome_arquivo: nomeArquivo,
        aba: aba.nomeOriginal || nomeAba,
        codigo_servico: aba.codigoServico || "GERAL",
        dados: sanitizarParaSupabase(lote),
        importacao_id: importacao.id
      };

      const { error } = await banco.from("planilhas_importadas").insert(payload);
      if (error) {
        console.error("ERRO PLANILHAS_IMPORTADAS", {
          periodo: `${periodo.ano}-${String(periodo.mes).padStart(2, "0")}`,
          aba: aba.nomeOriginal || nomeAba,
          lote: indiceLote,
          quantidade: lote.length,
          tamanhoBytes: ccoTamanhoPayloadBytes(payload),
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          error
        });
        const falha = new Error(`Falha no arquivamento da planilha: ${aba.nomeOriginal || nomeAba}, lote ${indiceLote}. ${error.message || "Erro do Supabase"}`);
        falha.causaSupabase = error;
        falha.falhaArquivamento = true;
        throw falha;
      }
    }
  }
}

async function ccoExcluirSomenteImportacaoIncompleta(importacaoId) {
  if (!importacaoId) return;
  const tabelasFilhas = ["planilhas_importadas", "painel_executivo", "operacoes"];
  for (const tabela of tabelasFilhas) {
    const { error } = await banco.from(tabela).delete().eq("importacao_id", importacaoId);
    if (error) console.error(`Erro no rollback de ${tabela}:`, error);
  }
  const { error } = await banco.from("importacoes").delete().eq("id", importacaoId).eq("ativo", false);
  if (error) console.error("Erro ao excluir importação incompleta:", error);
}

salvarBaseCompletaSupabase = async function(nomeArquivo) {
  if (!banco) return false;
  const usuario = obterUsuarioLogado();
  const periodos = ccoPeriodosDaImportacao();
  if (!periodos.length) {
    console.error("Erro ao atualizar períodos no Supabase: nenhum mês válido encontrado.");
    return false;
  }

  for (const periodo of periodos) {
    let novaImportacao = null;
    let idsAnterioresAtivos = [];
    try {
      const { data: anterioresAtivos, error: erroAnteriores } = await banco.from("importacoes")
        .select("id").eq("ano", periodo.ano).eq("mes", periodo.mes).eq("ativo", true);
      if (erroAnteriores) throw erroAnteriores;
      idsAnterioresAtivos = (anterioresAtivos || []).map(item => item.id).filter(Boolean);

      /* A versão anterior continua ativa até a nova estar 100% gravada. */
      const { data: importacao, error: erroImportacao } = await banco
        .from("importacoes")
        .insert({
          nome_arquivo: nomeArquivo,
          usuario: usuario.usuario || "Não identificado",
          perfil: usuario.perfil || "Sem perfil",
          total_abas: todasAsAbas.length,
          mes: periodo.mes,
          ano: periodo.ano,
          tipo_importacao: "substituir_periodos_com_rollback",
          ativo: false
        }).select().single();
      if (erroImportacao || !importacao) throw erroImportacao || new Error("Falha ao criar importação.");
      novaImportacao = importacao;

      const linhas = periodo.operacoes.map(item => ({
        importacao_id: importacao.id, servico: item.servico || "",
        data_operacao: item.data_normalizada || null, mes: periodo.mes, ano: periodo.ano,
        turno: item.turno || "", ra: item.ra || "", peso_t: numero(item.peso),
        viagens: numero(item.viagens), km_total: numero(item.km), equipe: numero(item.equipe),
        executado: numero(item.executado), json_original: sanitizarParaSupabase(item)
      }));
      if (!(await inserirEmLotes("operacoes", linhas, 500))) throw new Error(`Falha ao salvar operações de ${periodo.chave}.`);

      const linhasPainel = montarLinhasPainelSupabase(importacao.id, periodo);
      if (!(await inserirEmLotes("painel_executivo", linhasPainel, 500))) throw new Error(`Falha ao salvar painel executivo de ${periodo.chave}.`);

      await ccoArquivarPlanilhasPorPeriodo(nomeArquivo, importacao, periodo);

      const { error: erroDesativar } = await banco.from("importacoes")
        .update({ ativo: false }).eq("ano", periodo.ano).eq("mes", periodo.mes)
        .eq("ativo", true).neq("id", importacao.id);
      if (erroDesativar) throw erroDesativar;

      const { error: erroAtivar } = await banco.from("importacoes")
        .update({ ativo: true }).eq("id", importacao.id).eq("ativo", false);
      if (erroAtivar) throw erroAtivar;
    } catch (erro) {
      console.error("Erro ao atualizar período no Supabase", {
        periodo: periodo.chave, importacao_id: novaImportacao?.id, message: erro?.message,
        details: erro?.details || erro?.causaSupabase?.details, hint: erro?.hint || erro?.causaSupabase?.hint,
        code: erro?.code || erro?.causaSupabase?.code, error: erro
      });
      await ccoExcluirSomenteImportacaoIncompleta(novaImportacao?.id);
      if (idsAnterioresAtivos.length) {
        const { error: erroRestaurar } = await banco.from("importacoes")
          .update({ ativo: true }).in("id", idsAnterioresAtivos);
        if (erroRestaurar) console.error("Erro ao reativar versão anterior após rollback:", erroRestaurar);
      }
      if (erro?.falhaArquivamento) {
        window.__CCO_ERRO_IMPORTACAO_MENSAGEM__ = `Falha no arquivamento da planilha de ${periodo.chave}. A versão anterior foi preservada. Consulte o Console para ver code, message, details e hint do Supabase.`;
      }
      return false;
    }
  }

  await salvarKpiMensalSupabase();
  delete window.__CCO_IMPORTACAO_ATIVA__;
  delete window.__CCO_PERIODOS_REAIS_V12__;
  delete window.__CCO_IMPORTACOES_POR_PERIODO__;
  return true;
};

carregarBaseSupabase = async function() {
  if (!banco) return false;

  try {
    const { data: ultima, error: erroUltima } = await banco
      .from("importacoes")
      .select("*")
      .order("ano", { ascending: false, nullsFirst: false })
      .order("mes", { ascending: false, nullsFirst: false })
      .order("criado_em", { ascending: false })
      .limit(1);

    if (erroUltima || !ultima?.length) return false;
    const importacao = ultima[0];

    const { data: painelBanco, error: erroPainel } = await banco
      .from("painel_executivo")
      .select("*")
      .eq("importacao_id", importacao.id)
      .order("servico", { ascending: true });
    if (erroPainel) throw erroPainel;

    const operacoesBanco = await ccoBuscarTodosRegistros("operacoes", "*", [
      { coluna: "ano", ascending: true },
      { coluna: "mes", ascending: true },
      { coluna: "data_operacao", ascending: true }
    ]);

    limparMemoria();

    painelExecutivo = (painelBanco || []).map(item => ({
      servico: item.servico || "",
      nome_servico: item.nome_servico || "",
      acumulado_mes: numero(item.acumulado),
      medicao: item.medicao || "",
      previsto_mes: numero(item.previsto),
      porcentagem_execucao: numero(item.percentual),
      dias_acumulados: numero(item.dias_acumulados),
      total_dias_mes: numero(item.total_dias_mes),
      valor: numero(item.valor),
      status: numero(item.acumulado) > 0 ? "Com dados" : "Sem dados"
    }));

    operacoes = operacoesBanco.map(item => ({
      servico: item.servico || "",
      origem: "Banco Supabase",
      data: item.data_operacao || "",
      data_normalizada: String(item.data_operacao || "").substring(0, 10),
      turno: item.turno || "",
      ra: item.ra || "Por demanda",
      setor: "",
      peso: numero(item.peso_t),
      viagens: numero(item.viagens),
      km: numero(item.km_total),
      equipe: numero(item.equipe),
      executado: numero(item.executado),
      status: "Com dados"
    }));

    painelExecutivoOriginal = clonar(painelExecutivo);
    operacoesOriginal = clonar(operacoes);
    await carregarKpiMensalSupabase();

    todasAsAbas = [{ arquivo: importacao.nome_arquivo || "Banco Supabase", aba: "Dados consolidados", linhas: operacoes.length }];
    sheetsOriginais = {};

    carregarFiltrosExecucaoMensal();
    carregarFiltrosKpiServicoCompleto();
    atualizarDashboard();
    aplicarRestricoesPerfil();

    const mesNome = MESES_BR[String(importacao.mes).padStart(2, "0")] || importacao.mes || "-";
    preencherTexto("nomeArquivo", `Banco carregado: ${mesNome}/${importacao.ano || "-"} | ${operacoes.length} registros de todos os períodos`);
    return true;
  } catch (erro) {
    console.error("Erro ao carregar base completa paginada:", erro);
    return false;
  }
};

/* Recarrega do banco depois da importação para refletir imediatamente os dados substituídos. */
const ccoImportarPlanilhasOriginalAtualizacao = importarPlanilhas;
importarPlanilhas = async function(evento) {
  await ccoImportarPlanilhasOriginalAtualizacao(evento);
  try {
    await carregarBaseSupabase();
    carregarFiltrosExecucaoMensal();
    carregarFiltrosKpiServicoCompleto();
    if (typeof renderPaginaKpiPorServicoCompleto === "function") renderPaginaKpiPorServicoCompleto();
  } catch (erro) {
    console.warn("Importação concluída, mas a atualização automática da tela falhou:", erro);
  }
};


/* =====================================================
   KPI PERFORMANCE V1 • 2026-07-17
   - Filtra sem clonar milhares de registros.
   - Um único evento por filtro.
   - Renderização agrupada em requestAnimationFrame.
===================================================== */
(function ccoKpiPerformanceV1(){
  function dataLinha(item){
    return String(item?.data_normalizada || item?.data || "");
  }

  window.obterDadosFiltradosKpiServico = obterDadosFiltradosKpiServico = function(){
    const servico = document.getElementById("filtroKpiServico")?.value || "";
    const ano = document.getElementById("filtroKpiAno")?.value || "";
    const mes = document.getElementById("filtroKpiMes")?.value || "";
    const dia = document.getElementById("filtroKpiDia")?.value || "";
    const origem = operacoesOriginal || [];

    const dados = origem.filter(item => {
      if (servico && item.servico !== servico) return false;
      const data = dataLinha(item);
      if (ano && data.slice(0,4) !== ano) return false;
      if (mes && data.slice(5,7) !== mes) return false;
      if (dia && data.slice(8,10) !== dia) return false;
      return true;
    });

    return { dados, servico, ano, mes, dia };
  };

  let frame = 0;
  window.ccoAgendarRenderKpi = function(){
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (typeof renderPaginaKpiPorServicoCompleto === "function") {
        renderPaginaKpiPorServicoCompleto();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (String(window.CCO_PAGE || "").toLowerCase() !== "kpi") return;
    ["filtroKpiServico","filtroKpiAno","filtroKpiMes","filtroKpiDia"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.onchange = null;
      if (el.dataset.ccoKpiFinalEvento !== "sim") {
        el.addEventListener("change", window.ccoAgendarRenderKpi);
        el.dataset.ccoKpiFinalEvento = "sim";
      }
    });
  }, { once:true });
})();

/* =====================================================
   PATCH FINAL • EXIBIR TODOS OS SERVIÇOS NO GRÁFICO
   - Mantém sempre os 13 serviços oficiais no eixo X.
   - Não permite que o Chart.js oculte rótulos automaticamente.
   - Serviços sem movimento aparecem com valor zero, sem sumir do gráfico.
===================================================== */
(function ccoPatchGraficoTodosServicosFinal(){
  const ORDEM_SERVICOS_GRAFICO = [
    "P1","P2.1","P2.2","P3","P4","P5","P6",
    "P7","P8","P9","P10","P11","P12"
  ];

  function normalizarServico(valor){
    const texto = String(valor || "").trim().toUpperCase().replace(/\s+/g, "");
    const aliases = {
      "P2,1":"P2.1", "P2-1":"P2.1", "P21":"P2.1",
      "P2,2":"P2.2", "P2-2":"P2.2", "P22":"P2.2"
    };
    return aliases[texto] || texto;
  }

  function valorNumerico(valor){
    try {
      if (typeof numero === "function") return numero(valor);
      const convertido = Number(String(valor ?? 0).replace(/\./g, "").replace(",", "."));
      return Number.isFinite(convertido) ? convertido : 0;
    } catch (erro) {
      return 0;
    }
  }

  function painelCompleto(){
    const fonte = Array.isArray(window.painelExecutivoAtivo) && window.painelExecutivoAtivo.length
      ? window.painelExecutivoAtivo
      : (Array.isArray(window.painelExecutivo) ? window.painelExecutivo : []);

    const porServico = new Map();
    fonte.forEach(item => {
      const servico = normalizarServico(item?.servico);
      if (ORDEM_SERVICOS_GRAFICO.includes(servico)) porServico.set(servico, item);
    });

    return ORDEM_SERVICOS_GRAFICO.map(servico => {
      const item = porServico.get(servico) || {};
      return {
        ...item,
        servico,
        porcentagem_execucao: valorNumerico(item.porcentagem_execucao ?? item.percentual_execucao),
        valor: valorNumerico(item.valor ?? item.valor_total)
      };
    });
  }

  const ccoColunasMoedasFinanceiras = {
    id: "ccoColunasMoedasFinanceiras",
    afterDatasetDraw(chart, argumentos) {
      if (chart.canvas.id !== "graficoValorServicoBarras") return;
      const meta = chart.getDatasetMeta(argumentos.index);
      const ctx = chart.ctx;
      meta.data.forEach((barra, indice) => {
        const valor = valorNumerico(chart.data.datasets[argumentos.index]?.data?.[indice]);
        if (valor <= 0) return;
        const p = barra.getProps(["x", "y", "base", "width"], true);
        if (![p.x, p.y, p.base, p.width].every(Number.isFinite)) return;
        const altura = Math.max(0, p.base - p.y);
        const largura = Math.max(12, Math.min(p.width * .82, 38));
        const espessura = Math.max(5, Math.min(9, largura * .24));
        const quantidade = Math.max(1, Math.min(28, Math.ceil(altura / 7)));
        const passo = quantidade > 1 ? Math.max(4, (altura - espessura) / (quantidade - 1)) : 0;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let moeda = 0; moeda < quantidade; moeda += 1) {
          const y = p.base - espessura / 2 - moeda * passo;
          const deslocamento = moeda % 2 ? .7 : 0;
          const gradiente = ctx.createLinearGradient(p.x - largura / 2, y, p.x + largura / 2, y);
          gradiente.addColorStop(0, "#92400e");
          gradiente.addColorStop(.18, "#eab308");
          gradiente.addColorStop(.52, "#fef08a");
          gradiente.addColorStop(.82, "#ca8a04");
          gradiente.addColorStop(1, "#713f12");
          ctx.beginPath();
          ctx.ellipse(p.x + deslocamento, y, largura / 2, espessura / 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = gradiente;
          ctx.fill();
          ctx.strokeStyle = "rgba(254,240,138,.88)";
          ctx.lineWidth = 1;
          ctx.stroke();
          if (moeda === quantidade - 1 && largura >= 22) {
            ctx.fillStyle = "#713f12";
            ctx.font = `900 ${Math.max(5, Math.min(8, largura * .2))}px Inter, sans-serif`;
            ctx.fillText("R$", p.x + deslocamento, y);
          }
        }
        ctx.restore();
      });
    }
  };

  window.__CCO_GRAFICO_TODOS_SERVICOS_ATIVO__ = true;
  window.renderGraficos = renderGraficos = function renderGraficosTodosServicos(){
    const dados = painelCompleto();
    const labels = ORDEM_SERVICOS_GRAFICO.slice();
    const ctxExecucao = document.getElementById("graficoExecucao");
    const ctxValor = document.getElementById("graficoValorServicoBarras");

    try {
      if (typeof graficoExecucao !== "undefined" && graficoExecucao) graficoExecucao.destroy();
    } catch (erro) {}
    try {
      if (typeof graficoValorServicoBarrasFinal !== "undefined" && graficoValorServicoBarrasFinal) {
        graficoValorServicoBarrasFinal.destroy();
      }
    } catch (erro) {}

    if (ctxExecucao && window.Chart) {
      graficoExecucao = new Chart(ctxExecucao, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "% Execução",
            data: dados.map(item => Number(valorNumerico(item.porcentagem_execucao).toFixed(2))),
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "#102a1d",
            backgroundColor: "rgba(34, 197, 94, 0.78)",
            minBarLength: 0,
            barPercentage: 0.62,
            categoryPercentage: 0.8
          }]
        },
        options: {
          ...(typeof opcoesGrafico === "function"
            ? opcoesGrafico()
            : { responsive: true, maintainAspectRatio: false }),
          indexAxis: "x",
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? 0 : 900,
            easing: "easeOutQuart",
            delay: contexto => contexto.type === "data" ? contexto.dataIndex * 45 : 0
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: contexto => Number(contexto.tick?.value) === 100 ? "rgba(34, 211, 238, 0.82)" : "rgba(167, 243, 208, 0.08)",
                lineWidth: contexto => Number(contexto.tick?.value) === 100 ? 2 : 1
              },
              ticks: {
                color: "#d1fae5",
                callback: valor => Number(valor) === 100 ? "Meta 100%" : `${valor}%`,
                font: { size: 12, weight: "600" }
              }
            },
            x: {
              grid: { display: false },
              ticks: { color: "#d1fae5", autoSkip: false, maxRotation: 0, minRotation: 0, font: { size: 11, weight: "700" } }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#04100d",
              borderColor: "#22c55e",
              borderWidth: 1,
              titleColor: "#f0fdf4",
              bodyColor: "#d1fae5",
              callbacks: {
                label: contexto => `${labels[contexto.dataIndex]}: ${valorNumerico(contexto.raw).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
              }
            }
          }
        }
      });
    }

    if (ctxValor && window.Chart) {
      graficoValorServicoBarrasFinal = new Chart(ctxValor, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Valor R$",
            data: dados.map(item => valorNumerico(item.valor)),
            borderRadius: 0,
            borderWidth: 0,
            borderColor: "transparent",
            backgroundColor: "transparent"
          }]
        },
        plugins: [ccoColunasMoedasFinanceiras],
        options: {
          ...(typeof opcoesGrafico === "function"
            ? opcoesGrafico()
            : { responsive: true, maintainAspectRatio: false }),
          indexAxis: "x",
          scales: {
            y: { beginAtZero: true },
            x: { ticks: { autoSkip: false, maxRotation: 0, minRotation: 0 } }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: contexto => typeof formatarMoeda === "function"
                  ? formatarMoeda(contexto.raw)
                  : Number(contexto.raw || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              }
            }
          }
        }
      });
    }

    try {
      if (typeof renderRankingPorMedicao === "function") renderRankingPorMedicao();
    } catch (erro) {
      console.warn("Não foi possível atualizar o ranking por medição:", erro);
    }
  };
})();
