import {
  requisicaoApi,
  showToast,
} from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

function montarUrl(path) {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${urlBase}${normalized}`;
}

function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function valorSeguro(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  return valor;
}

export function criarCrudPadrao(config) {
  const listaEl = document.getElementById("records-list");
  const pesquisaEl = document.getElementById("input-pesquisa");
  const novoEl = document.getElementById("btn-novo");

  const modalOverlay = document.getElementById("modal-overlay");
  const closeModal = document.getElementById("close-modal");
  const modalTitle = document.getElementById("modal-title");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnExcluir = document.getElementById("btn-excluir");

  const detailsOverlay = document.getElementById("details-overlay");
  const closeDetailsModal = document.getElementById("close-details-modal");
  const detailsGrid = document.getElementById("details-grid");

  let registros = [];
  let aux = {};
  let modoEdicao = false;
  let itemEditando = null;

  const buscarPorId = (id) =>
    registros.find((item) => Number(item[config.idKey]) === Number(id));

  async function carregarAuxiliares() {
    if (!config.carregarAuxiliares) {
      aux = {};
      return;
    }

    try {
      aux = await config.carregarAuxiliares({
        requisicaoApi,
        montarUrl,
      });
    } catch (error) {
      console.error("Erro ao carregar dados auxiliares:", error);
      showToast("Erro ao carregar dados auxiliares.", "error");
      aux = {};
    }
  }

  function obterValorCampo(campo) {
    const el = document.getElementById(campo.inputId);
    if (!el) return "";
    return el.value;
  }

  function definirValorCampo(campo, valor) {
    const el = document.getElementById(campo.inputId);
    if (!el) return;

    if (campo.type === "date") {
      el.value = valor ? String(valor).split("T")[0] : "";
      return;
    }

    el.value = valor ?? "";
  }

  function limparFormulario() {
    config.campos.forEach((campo) => definirValorCampo(campo, ""));

    if (config.preencherAuxiliaresFormulario) {
      config.preencherAuxiliaresFormulario({
        aux,
        modoEdicao,
        item: itemEditando,
      });
    }
  }

  function coletarValores() {
    const valores = {};

    config.campos.forEach((campo) => {
      valores[campo.key] = obterValorCampo(campo);
    });

    return valores;
  }

  function validarValores(valores) {
    const camposObrigatorios = config.campos.filter((campo) => {
      if (!campo.required) return false;
      if (campo.apenasCriacao && modoEdicao) return false;
      if (campo.apenasEdicao && !modoEdicao) return false;
      return true;
    });

    const faltando = camposObrigatorios.some((campo) => {
      const valor = valores[campo.key];
      return valor === undefined || valor === null || String(valor).trim() === "";
    });

    if (faltando) {
      showToast("Preencha todos os campos obrigatorios.", "warning");
      return false;
    }

    if (config.validarValores) {
      return config.validarValores({ valores, modoEdicao, showToast });
    }

    return true;
  }

  function abrirModal() {
    modalOverlay?.classList.add("active");
  }

  function fecharModal() {
    modalOverlay?.classList.remove("active");
    btnExcluir?.classList.remove("active");
    limparFormulario();
  }

  function abrirDetalhes() {
    detailsOverlay?.classList.add("active");
  }

  function fecharDetalhes() {
    detailsOverlay?.classList.remove("active");
    if (detailsGrid) detailsGrid.innerHTML = "";
  }

  function atualizarVisibilidadeCampos() {
    config.campos.forEach((campo) => {
      const wrapper = document.getElementById(campo.wrapperId || `field-${campo.key}`);
      if (!wrapper) return;

      let mostrar = true;
      if (campo.apenasCriacao && modoEdicao) mostrar = false;
      if (campo.apenasEdicao && !modoEdicao) mostrar = false;

      wrapper.classList.toggle("is-hidden", !mostrar);
    });
  }

  function abrirCadastro() {
    modoEdicao = false;
    itemEditando = null;

    if (modalTitle) {
      modalTitle.innerText = `Novo ${config.nomeEntidade}`;
    }

    if (btnSalvar) {
      btnSalvar.innerText = `Salvar ${config.nomeEntidade}`;
    }

    btnExcluir?.classList.remove("active");

    atualizarVisibilidadeCampos();
    limparFormulario();
    abrirModal();
  }

  async function abrirEdicao(id) {
    try {
      modoEdicao = true;

      const response = await requisicaoApi(montarUrl(config.endpoints.detalhe(id)));
      const data = await response.json();

      if (!data?.sucesso) {
        showToast(data?.erro || `Erro ao carregar ${config.nomeEntidade}.`, "error");
        return;
      }

      itemEditando = data[config.chavesResposta.item];

      if (modalTitle) modalTitle.innerText = `Editar ${config.nomeEntidade}`;
      if (btnSalvar) btnSalvar.innerText = "Salvar Alteracoes";

      if (btnExcluir) btnExcluir.classList.add("active");

      config.campos.forEach((campo) => {
        definirValorCampo(campo, itemEditando[campo.key]);
      });

      atualizarVisibilidadeCampos();

      if (config.preencherAuxiliaresFormulario) {
        config.preencherAuxiliaresFormulario({
          aux,
          modoEdicao,
          item: itemEditando,
        });
      }

      abrirModal();
    } catch (error) {
      console.error("Erro ao abrir edicao:", error);
      showToast(`Erro interno ao carregar ${config.nomeEntidade}.`, "error");
    }
  }

  async function salvar() {
    try {
      const valores = coletarValores();
      if (!validarValores(valores)) return;

      let endpoint = config.endpoints.criar;
      let method = "POST";
      let body = config.montarPayloadCriacao
        ? config.montarPayloadCriacao({ valores, aux })
        : valores;

      if (modoEdicao && itemEditando) {
        endpoint = config.endpoints.editar(itemEditando[config.idKey]);
        method = "PUT";
        body = config.montarPayloadEdicao
          ? config.montarPayloadEdicao({ valores, item: itemEditando, aux })
          : valores;
      }

      const response = await requisicaoApi(montarUrl(endpoint), { method, body });
      const data = await response.json();

      if (!data?.sucesso) {
        showToast(data?.erro || data?.mensagem || "Erro ao salvar registro.", "error");
        return;
      }

      showToast(
        modoEdicao
          ? `${config.nomeEntidade} atualizada com sucesso!`
          : `${config.nomeEntidade} criada com sucesso!`,
      );

      fecharModal();
      await buscarRegistros();
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      showToast("Erro interno ao salvar registro.", "error");
    }
  }

  async function excluirPorId(id) {
    const alvo = id ? buscarPorId(id) : itemEditando;
    if (!alvo) return;

    const confirmar = confirm(`Deseja realmente excluir ${config.nomeEntidade.toLowerCase()}?`);
    if (!confirmar) return;

    try {
      const response = await requisicaoApi(
        montarUrl(config.endpoints.excluir(alvo[config.idKey])),
        { method: "DELETE" },
      );

      const data = await response.json();

      if (!data?.sucesso) {
        showToast(data?.erro || "Erro ao excluir registro.", "error");
        return;
      }

      showToast(`${config.nomeEntidade} removida com sucesso!`);

      fecharModal();
      await buscarRegistros();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      showToast("Erro interno ao excluir registro.", "error");
    }
  }

  function montarDetalhe(label, valor, full = false) {
    return `
      <div class="detail-item ${full ? "full" : ""}">
        <span>${label}</span>
        <p>${valorSeguro(valor)}</p>
      </div>
    `;
  }

  async function abrirDetalhe(id) {
    if (!detailsGrid) return;

    try {
      detailsGrid.innerHTML = "<p>Carregando detalhes...</p>";
      abrirDetalhes();

      const response = await requisicaoApi(montarUrl(config.endpoints.detalhe(id)));
      const data = await response.json();

      if (!data?.sucesso) {
        detailsGrid.innerHTML = "<p>Erro ao carregar detalhes.</p>";
        return;
      }

      const item = data[config.chavesResposta.item];

      const camposDetalhe = config.camposDetalhe || [];
      if (!camposDetalhe.length) {
        detailsGrid.innerHTML = Object.keys(item)
          .map((chave) => montarDetalhe(chave, item[chave]))
          .join("");
        return;
      }

      detailsGrid.innerHTML = camposDetalhe
        .map((campo) => {
          const valor = campo.valor({ item, aux, formatarData, valorSeguro });
          return montarDetalhe(campo.label, valor, campo.full);
        })
        .join("");
    } catch (error) {
      console.error("Erro ao abrir detalhes:", error);
      detailsGrid.innerHTML = "<p>Erro interno ao carregar detalhes.</p>";
    }
  }

  function renderizarLista(lista) {
    if (!listaEl) return;

    listaEl.innerHTML = "";

    if (!lista?.length) {
      listaEl.innerHTML = `<p>Nenhum ${config.nomeEntidadePlural.toLowerCase()} cadastrado.</p>`;
      return;
    }

    lista.forEach((item) => {
      const titulo = config.montarCard.titulo({ item, aux });
      const subtitulo = config.montarCard.subtitulo({ item, aux });
      const status = config.montarCard.status ? config.montarCard.status({ item, aux }) : "-";

      listaEl.innerHTML += `
        <article class="record-row">
          <div class="record-main">
            <h3>${valorSeguro(titulo)}</h3>
            <p>${valorSeguro(subtitulo)}</p>
          </div>

          <div class="status-pill">${valorSeguro(status)}</div>

          <div class="record-actions">
            <button class="action-btn details" data-action="detalhes" data-id="${item[config.idKey]}">Detalhes</button>
            <button class="action-btn edit" data-action="editar" data-id="${item[config.idKey]}">Editar</button>
            <button class="action-btn remove" data-action="excluir" data-id="${item[config.idKey]}">Excluir</button>
          </div>
        </article>
      `;
    });
  }

  function aplicarFiltro() {
    const termo = (pesquisaEl?.value || "").toLowerCase().trim();

    if (!termo) {
      renderizarLista(registros);
      return;
    }

    const campos = config.camposBusca || [];

    const filtrados = registros.filter((item) => {
      if (!campos.length) {
        return JSON.stringify(item).toLowerCase().includes(termo);
      }

      const texto = campos
        .map((campo) => String(item[campo] ?? ""))
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });

    renderizarLista(filtrados);
  }

  async function buscarRegistros() {
    try {
      if (listaEl) listaEl.innerHTML = `<p>Carregando ${config.nomeEntidadePlural.toLowerCase()}...</p>`;

      const response = await requisicaoApi(montarUrl(config.endpoints.listar));
      const data = await response.json();

      if (!data?.sucesso) {
        if (listaEl) listaEl.innerHTML = "<p>Erro ao carregar dados.</p>";
        showToast(data?.erro || "Erro ao carregar registros.", "error");
        return;
      }

      registros = data[config.chavesResposta.lista] || [];
      renderizarLista(registros);
    } catch (error) {
      console.error("Erro ao buscar registros:", error);
      if (listaEl) listaEl.innerHTML = "<p>Erro interno ao carregar dados.</p>";
      showToast("Erro interno ao carregar dados.", "error");
    }
  }

  listaEl?.addEventListener("click", async (event) => {
    const botao = event.target.closest(".action-btn");
    if (!botao) return;

    const acao = botao.dataset.action;
    const id = Number(botao.dataset.id);

    if (!id || !acao) return;

    if (acao === "detalhes") {
      await abrirDetalhe(id);
      return;
    }

    if (acao === "editar") {
      await abrirEdicao(id);
      return;
    }

    if (acao === "excluir") {
      await excluirPorId(id);
    }
  });

  novoEl?.addEventListener("click", abrirCadastro);
  btnSalvar?.addEventListener("click", salvar);
  btnExcluir?.addEventListener("click", () => excluirPorId());

  closeModal?.addEventListener("click", fecharModal);
  modalOverlay?.addEventListener("click", (event) => {
    if (event.target === modalOverlay) fecharModal();
  });

  closeDetailsModal?.addEventListener("click", fecharDetalhes);
  detailsOverlay?.addEventListener("click", (event) => {
    if (event.target === detailsOverlay) fecharDetalhes();
  });

  pesquisaEl?.addEventListener("input", aplicarFiltro);

  async function init() {
    await carregarAuxiliares();
    if (config.preencherAuxiliaresFormulario) {
      config.preencherAuxiliaresFormulario({
        aux,
        modoEdicao,
        item: itemEditando,
      });
    }
    await buscarRegistros();
  }

  init();
}
