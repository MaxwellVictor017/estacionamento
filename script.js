// ============================================================================
// 1. Configurações e Estado do Sistema
// ============================================================================
const CAPACIDADE_MAXIMA = 50;
const CHAVE_STORAGE = "controle_estacionamento_veiculos_v1";
const INTERVALO_PERMANENCIA_MS = 10000;
const INTERVALO_RELOGIO_MS = 1000;

const REGEX_PLACA_ANTIGA = /^[A-Z]{3}-?[0-9]{4}$/;
const REGEX_PLACA_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

const estado = {
  veiculos: [],
  termoBusca: "",
};

// ============================================================================
// 2. Referências de Elementos do DOM
// ============================================================================
const formEntrada = document.querySelector("#form-entrada");
const inputPlaca = document.querySelector("#placa");
const btnEntrar = document.querySelector("#entrar");
const elVagas = document.querySelector("#vagas");
const elLista = document.querySelector("#lista");
const elMensagem = document.querySelector("#mensagem");

const elRelogio = document.querySelector("#relogio");
const elTotalOcupadas = document.querySelector("#total-ocupadas");
const elPercentualOcupacao = document.querySelector("#percentual-ocupacao");
const elBarraOcupacao = document.querySelector("#barra-ocupacao");
const elBarraPreenchimento = document.querySelector("#barra-preenchimento");

const inputBusca = document.querySelector("#busca");
const elContadorLista = document.querySelector("#contador-lista");
const btnLimparPatio = document.querySelector("#limpar-patio");

const elToastContainer = document.querySelector("#toast-container");
const modalConfirmacao = document.querySelector("#modal-confirmacao");
const btnCancelarLimpeza = document.querySelector("#cancelar-limpeza");
const btnConfirmarLimpeza = document.querySelector("#confirmar-limpeza");

// ============================================================================
// 3. Persistência (localStorage)
// ============================================================================
function carregarVeiculosSalvos() {
  try {
    const dadosBrutos = localStorage.getItem(CHAVE_STORAGE);
    if (!dadosBrutos) {
      return [];
    }

    const lista = JSON.parse(dadosBrutos);
    if (!Array.isArray(lista)) {
      return [];
    }

    return lista
      .filter((item) => item && typeof item.placa === "string" && item.placa.trim() !== "")
      .map((item) => ({
        placa: normalizarPlacaSemHifen(item.placa),
        entrada: typeof item.entrada === "string" ? item.entrada : formatarHorario(new Date()),
        timestamp: typeof item.timestamp === "number" ? item.timestamp : estimarTimestampPorHorario(item.entrada),
      }))
      .filter((item) => ehPlacaBrasileiraValida(item.placa))
      .slice(0, CAPACIDADE_MAXIMA);
  } catch {
    return [];
  }
}

function salvarVeiculos() {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado.veiculos));
  } catch {
    // Segue em memória caso o armazenamento local esteja indisponível
  }
}

// ============================================================================
// 4. Utilitários de Formatação e Cálculo
// ============================================================================
function normalizarPlaca(valor) {
  return String(valor || "").trim().toUpperCase();
}

function normalizarPlacaSemHifen(valor) {
  return normalizarPlaca(valor).replace("-", "");
}

function ehPlacaBrasileiraValida(placaTexto) {
  return REGEX_PLACA_ANTIGA.test(placaTexto) || REGEX_PLACA_MERCOSUL.test(placaTexto);
}

function formatarHorario(data) {
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function estimarTimestampPorHorario(horarioTexto) {
  if (typeof horarioTexto !== "string") {
    return Date.now();
  }
  const partes = horarioTexto.split(":").map(Number);
  if (partes.length === 3 && partes.every((n) => !Number.isNaN(n))) {
    const data = new Date();
    data.setHours(partes[0], partes[1], partes[2], 0);
    return data.getTime();
  }
  return Date.now();
}

function formatarTempoDecorrido(timestampEntrada) {
  const diferencaSegundos = Math.max(0, Math.floor((Date.now() - timestampEntrada) / 1000));

  if (diferencaSegundos < 60) {
    return "há menos de 1 min";
  }

  const totalMinutos = Math.floor(diferencaSegundos / 60);
  if (totalMinutos < 60) {
    return `há ${totalMinutos} min`;
  }

  const horas = Math.floor(totalMinutos / 60);
  const minutosRestantes = totalMinutos % 60;
  if (minutosRestantes === 0) {
    return `há ${horas}h`;
  }

  return `há ${horas}h ${minutosRestantes}min`;
}

function calcularMetricasOcupacao() {
  const ocupadas = estado.veiculos.length;
  const livres = CAPACIDADE_MAXIMA - ocupadas;
  const percentual = Math.round((ocupadas / CAPACIDADE_MAXIMA) * 100);

  let nivelCor = "normal";
  if (ocupadas >= CAPACIDADE_MAXIMA || percentual >= 90) {
    nivelCor = "vermelho";
  } else if (percentual >= 70) {
    nivelCor = "amarelo";
  }

  return {
    ocupadas,
    livres,
    percentual,
    nivelCor,
  };
}

function obterVeiculosFiltrados() {
  if (!estado.termoBusca) {
    return estado.veiculos;
  }
  return estado.veiculos.filter((veiculo) => veiculo.placa.includes(estado.termoBusca));
}

// ============================================================================
// 5. Validações das Regras de Negócio
// ============================================================================
function validarNovaEntrada(valorBruto) {
  const placaDigitada = normalizarPlaca(valorBruto);

  // 1. Verificar campo vazio
  if (!placaDigitada) {
    return {
      valido: false,
      codigo: "PLACA_VAZIA",
      placa: "",
      mensagem: "Informe a placa do veículo antes de registrar a entrada.",
    };
  }

  // 2. Verificar padrão brasileiro (Antigo ou Mercosul)
  if (!ehPlacaBrasileiraValida(placaDigitada)) {
    return {
      valido: false,
      codigo: "PLACA_INVALIDA",
      placa: placaDigitada,
      mensagem: "Placa inválida. Use o formato ABC-1234 ou ABC1D23.",
    };
  }

  // 3. Normalizar removendo o hífen antes de verificar duplicidade
  const placaNormalizada = placaDigitada.replace("-", "");

  // 4. Verificar duplicidade e limite de 50 vagas
  if (estado.veiculos.some((v) => v.placa === placaNormalizada)) {
    return {
      valido: false,
      codigo: "PLACA_DUPLICADA",
      placa: placaNormalizada,
      mensagem: `A placa ${placaNormalizada} já está registrada no estacionamento.`,
    };
  }

  if (estado.veiculos.length >= CAPACIDADE_MAXIMA) {
    return {
      valido: false,
      codigo: "LOTADO",
      placa: placaNormalizada,
      mensagem: `Estacionamento lotado (${CAPACIDADE_MAXIMA}/${CAPACIDADE_MAXIMA} vagas ocupadas).`,
    };
  }

  return { valido: true, codigo: "OK", placa: placaNormalizada, mensagem: "" };
}

// ============================================================================
// 6. Feedback Visual e Notificações (Inline + Toast)
// ============================================================================
function exibirMensagem(texto, tipo = "") {
  elMensagem.textContent = texto;
  elMensagem.className = tipo ? `mensagem ${tipo}` : "mensagem";
}

function exibirToast(texto, tipo = "sucesso") {
  if (!elToastContainer) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute("role", tipo === "erro" ? "alert" : "status");

  const spanTexto = document.createElement("span");
  spanTexto.textContent = texto;

  const btnFechar = document.createElement("button");
  btnFechar.type = "button";
  btnFechar.className = "toast-fechar";
  btnFechar.setAttribute("aria-label", "Fechar notificação");
  btnFechar.textContent = "×";

  const removerToast = () => {
    if (!toast.isConnected || toast.classList.contains("saindo")) {
      return;
    }
    toast.classList.add("saindo");
    window.setTimeout(() => {
      toast.remove();
    }, 150);
  };

  btnFechar.addEventListener("click", removerToast);
  toast.appendChild(spanTexto);
  toast.appendChild(btnFechar);
  elToastContainer.appendChild(toast);

  while (elToastContainer.children.length > 3) {
    elToastContainer.firstElementChild.remove();
  }

  window.setTimeout(removerToast, 3200);
}

function notificarFeedback(texto, tipo) {
  exibirMensagem(texto, tipo);
  exibirToast(texto, tipo);
}

function destacarErroInputPlaca() {
  inputPlaca.classList.add("input-invalido");
  inputPlaca.setAttribute("aria-invalid", "true");
}

function limparErroInputPlaca() {
  inputPlaca.classList.remove("input-invalido");
  inputPlaca.setAttribute("aria-invalid", "false");
}

// ============================================================================
// 7. Renderização Segura do DOM (createElement + textContent)
// ============================================================================
function atualizarRelogio() {
  if (elRelogio) {
    elRelogio.textContent = formatarHorario(new Date());
  }
}

function atualizarPainelOcupacao() {
  const { ocupadas, livres, percentual, nivelCor } = calcularMetricasOcupacao();

  elVagas.textContent = `${livres} / ${CAPACIDADE_MAXIMA}`;
  elVagas.classList.toggle("lotado", livres === 0);

  if (elTotalOcupadas) {
    elTotalOcupadas.textContent = String(ocupadas);
  }

  if (elPercentualOcupacao) {
    elPercentualOcupacao.textContent = `${percentual}%`;
  }

  if (elBarraOcupacao && elBarraPreenchimento) {
    elBarraOcupacao.setAttribute("aria-valuenow", String(ocupadas));
    elBarraPreenchimento.style.width = `${percentual}%`;
    elBarraPreenchimento.className = `barra-preenchimento nivel-${nivelCor}`;
  }

  if (btnLimparPatio) {
    btnLimparPatio.disabled = ocupadas === 0;
  }
}

function atualizarContadorLista(totalFiltrados) {
  if (!elContadorLista) {
    return;
  }

  const totalAtivos = estado.veiculos.length;
  if (estado.termoBusca && totalAtivos > 0) {
    elContadorLista.textContent = `${totalFiltrados} de ${totalAtivos}`;
    return;
  }

  elContadorLista.textContent = `${totalAtivos} de ${CAPACIDADE_MAXIMA}`;
}

function criarIconeVazio() {
  if (typeof document.createElementNS !== "function") {
    return null;
  }

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "32");
  svg.setAttribute("height", "32");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", "icone-vazio");
  svg.setAttribute("aria-hidden", "true");

  const pathCarro = document.createElementNS(ns, "path");
  pathCarro.setAttribute(
    "d",
    "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
  );

  const rodaEsq = document.createElementNS(ns, "circle");
  rodaEsq.setAttribute("cx", "7");
  rodaEsq.setAttribute("cy", "17");
  rodaEsq.setAttribute("r", "2");

  const eixo = document.createElementNS(ns, "path");
  eixo.setAttribute("d", "M9 17h6");

  const rodaDir = document.createElementNS(ns, "circle");
  rodaDir.setAttribute("cx", "17");
  rodaDir.setAttribute("cy", "17");
  rodaDir.setAttribute("r", "2");

  svg.appendChild(pathCarro);
  svg.appendChild(rodaEsq);
  svg.appendChild(eixo);
  svg.appendChild(rodaDir);

  return svg;
}

function criarItemVazio(mensagem) {
  const itemVazio = document.createElement("li");
  itemVazio.className = "vazio";

  const icone = criarIconeVazio();
  if (icone) {
    itemVazio.appendChild(icone);
  }

  const texto = document.createElement("span");
  texto.textContent = mensagem;
  itemVazio.appendChild(texto);

  return itemVazio;
}

function criarItemVeiculo(veiculo) {
  const li = document.createElement("li");
  li.dataset.placa = veiculo.placa;

  const spanPlaca = document.createElement("span");
  spanPlaca.className = "placa-texto";
  spanPlaca.textContent = veiculo.placa;

  const spanHorario = document.createElement("span");
  spanHorario.className = "horario-texto";
  spanHorario.textContent = veiculo.entrada;

  const spanPermanencia = document.createElement("span");
  spanPermanencia.className = "tempo-permanencia";
  spanPermanencia.dataset.timestamp = String(veiculo.timestamp);
  spanPermanencia.textContent = formatarTempoDecorrido(veiculo.timestamp);

  const btnSair = document.createElement("button");
  btnSair.type = "button";
  btnSair.className = "btn-sair";
  btnSair.textContent = "Saída";
  btnSair.setAttribute("aria-label", `Registrar saída do veículo ${veiculo.placa}`);
  btnSair.addEventListener("click", (evento) => {
    const usarAnimacao = Boolean(
      evento.isTrusted &&
        window.matchMedia &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    registrarSaida(veiculo.placa, li, usarAnimacao);
  });

  li.appendChild(spanPlaca);
  li.appendChild(spanHorario);
  li.appendChild(spanPermanencia);
  li.appendChild(btnSair);

  return li;
}

function renderizarLista() {
  const veiculosFiltrados = obterVeiculosFiltrados();
  atualizarContadorLista(veiculosFiltrados.length);

  const fragmento = document.createDocumentFragment();

  if (estado.veiculos.length === 0) {
    fragmento.appendChild(criarItemVazio("Nenhum veículo estacionado no momento"));
  } else if (veiculosFiltrados.length === 0) {
    fragmento.appendChild(
      criarItemVazio(`Nenhum veículo encontrado para "${estado.termoBusca}"`)
    );
  } else {
    veiculosFiltrados.forEach((veiculo) => {
      fragmento.appendChild(criarItemVeiculo(veiculo));
    });
  }

  elLista.replaceChildren(fragmento);
}

function atualizarTemposPermanenciaEmTela() {
  const elementosTempo = elLista.querySelectorAll(".tempo-permanencia");
  elementosTempo.forEach((span) => {
    const timestamp = Number(span.dataset.timestamp);
    if (!Number.isNaN(timestamp) && timestamp > 0) {
      span.textContent = formatarTempoDecorrido(timestamp);
    }
  });
}

function renderizar() {
  renderizarLista();
  atualizarPainelOcupacao();
}

// ============================================================================
// 8. Ações de Negócio (Entrada, Saída, Filtro e Limpeza)
// ============================================================================
function registrarEntrada() {
  const validacao = validarNovaEntrada(inputPlaca.value);

  if (!validacao.valido) {
    destacarErroInputPlaca();
    notificarFeedback(validacao.mensagem, "erro");

    if (validacao.codigo === "PLACA_INVALIDA" || validacao.codigo === "PLACA_DUPLICADA") {
      inputPlaca.focus();
      inputPlaca.select();
    } else {
      inputPlaca.focus();
    }
    return;
  }

  const placa = validacao.placa;
  limparErroInputPlaca();

  const agora = new Date();
  const horarioEntrada = formatarHorario(agora);

  estado.veiculos.push({
    placa,
    entrada: horarioEntrada,
    timestamp: agora.getTime(),
  });

  if (estado.termoBusca && !placa.includes(estado.termoBusca)) {
    estado.termoBusca = "";
    if (inputBusca) {
      inputBusca.value = "";
    }
  }

  salvarVeiculos();
  renderizar();

  inputPlaca.value = "";
  inputPlaca.focus();
  notificarFeedback(`Entrada registrada para ${placa} às ${horarioEntrada}.`, "sucesso");
}

function animarFantasmaSaida(elementoItem) {
  const retangulo = elementoItem.getBoundingClientRect();
  if (retangulo.width === 0 || retangulo.height === 0) {
    return;
  }

  const fantasma = elementoItem.cloneNode(true);
  fantasma.removeAttribute("data-placa");
  fantasma.setAttribute("aria-hidden", "true");
  fantasma.className = "item-fantasma-saida";
  fantasma.style.position = "fixed";
  fantasma.style.top = `${retangulo.top}px`;
  fantasma.style.left = `${retangulo.left}px`;
  fantasma.style.width = `${retangulo.width}px`;
  fantasma.style.height = `${retangulo.height}px`;
  fantasma.style.margin = "0";

  document.body.appendChild(fantasma);
  window.setTimeout(() => {
    fantasma.remove();
  }, 160);
}

function registrarSaida(placa, elementoItem = null, animarSaida = false) {
  const indice = estado.veiculos.findIndex((v) => v.placa === placa);
  if (indice < 0) {
    return;
  }

  if (animarSaida && elementoItem && elementoItem.isConnected) {
    animarFantasmaSaida(elementoItem);
  }

  estado.veiculos.splice(indice, 1);
  salvarVeiculos();
  renderizar();
  notificarFeedback(`Saída registrada para ${placa}. Vaga liberada.`, "sucesso");
}

function aplicarFiltroBusca() {
  if (!inputBusca) {
    return;
  }
  estado.termoBusca = normalizarPlaca(inputBusca.value).replace(/-/g, "");
  renderizarLista();
}

function abrirConfirmacaoLimpeza() {
  if (estado.veiculos.length === 0) {
    return;
  }

  if (modalConfirmacao && typeof modalConfirmacao.showModal === "function") {
    modalConfirmacao.showModal();
    btnCancelarLimpeza.focus();
    return;
  }

  if (window.confirm("Remover todos os veículos ativos e liberar as 50 vagas?")) {
    executarLimpezaPatio();
  }
}

function fecharConfirmacaoLimpeza() {
  if (modalConfirmacao && modalConfirmacao.open) {
    modalConfirmacao.close();
  }
}

function executarLimpezaPatio() {
  const quantidadeRemovida = estado.veiculos.length;
  estado.veiculos = [];
  estado.termoBusca = "";

  if (inputBusca) {
    inputBusca.value = "";
  }

  salvarVeiculos();
  fecharConfirmacaoLimpeza();
  renderizar();
  inputPlaca.focus();

  if (quantidadeRemovida > 0) {
    notificarFeedback(
      `Pátio limpo (${quantidadeRemovida} ${
        quantidadeRemovida === 1 ? "veículo removido" : "veículos removidos"
      }).`,
      "aviso"
    );
  }
}

// ============================================================================
// 9. Registro de Eventos e Inicialização
// ============================================================================
function configurarEventos() {
  btnEntrar.addEventListener("click", registrarEntrada);

  if (formEntrada) {
    formEntrada.addEventListener("submit", (evento) => {
      evento.preventDefault();
      registrarEntrada();
    });
  }

  inputPlaca.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      registrarEntrada();
    }
  });

  inputPlaca.addEventListener("input", () => {
    const inicioSelecao = inputPlaca.selectionStart;
    const fimSelecao = inputPlaca.selectionEnd;
    const valorMaiusculo = inputPlaca.value.toUpperCase();

    if (inputPlaca.value !== valorMaiusculo) {
      inputPlaca.value = valorMaiusculo;
      if (typeof inicioSelecao === "number" && typeof fimSelecao === "number") {
        inputPlaca.setSelectionRange(inicioSelecao, fimSelecao);
      }
    }

    if (inputPlaca.classList.contains("input-invalido")) {
      limparErroInputPlaca();
    }
  });

  if (inputBusca) {
    inputBusca.addEventListener("input", aplicarFiltroBusca);
  }

  if (btnLimparPatio) {
    btnLimparPatio.addEventListener("click", abrirConfirmacaoLimpeza);
  }

  if (btnCancelarLimpeza) {
    btnCancelarLimpeza.addEventListener("click", () => {
      fecharConfirmacaoLimpeza();
      btnLimparPatio.focus();
    });
  }

  if (btnConfirmarLimpeza) {
    btnConfirmarLimpeza.addEventListener("click", executarLimpezaPatio);
  }

  if (modalConfirmacao) {
    modalConfirmacao.addEventListener("click", (evento) => {
      if (evento.target === modalConfirmacao) {
        fecharConfirmacaoLimpeza();
      }
    });
  }
}

function inicializar() {
  estado.veiculos = carregarVeiculosSalvos();
  atualizarRelogio();
  configurarEventos();
  renderizar();
  inputPlaca.focus();

  window.setInterval(atualizarRelogio, INTERVALO_RELOGIO_MS);
  window.setInterval(atualizarTemposPermanenciaEmTela, INTERVALO_PERMANENCIA_MS);
}

inicializar();
