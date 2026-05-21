import {
  requisicaoApi,
  showToast,
} from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const usuario = JSON.parse(localStorage.getItem("usuario"));

const professoresList = document.getElementById("professores-list");
const inputPesquisa = document.getElementById("input-pesquisa");
const btnNovoProfessor = document.getElementById("btn-novo-professor");

const modalOverlay = document.getElementById("modal-overlay");
const closeModal = document.getElementById("close-modal");
const modalTitle = document.getElementById("modal-title");
const btnSalvarProfessor = document.getElementById("btn-salvar-professor");
const btnExcluirProfessor = document.getElementById("btn-excluir-professor");

const detailsOverlay = document.getElementById("details-overlay");
const closeDetailsModal = document.getElementById("close-details-modal");
const detailsGrid = document.getElementById("details-grid");
const detailsEspecializacoes = document.getElementById("details-especializacoes");

const inputEmail = document.getElementById("input-email");
const inputUserName = document.getElementById("input-user-name");
const inputSenha = document.getElementById("input-senha");
const inputCpf = document.getElementById("input-cpf");
const inputNomeCompleto = document.getElementById("input-nome-completo");
const inputDataNascimento = document.getElementById("input-data-nascimento");
const inputFkEndereco = document.getElementById("input-fk-endereco");
const fieldSenha = document.getElementById("field-senha");
const fieldCpf = document.getElementById("field-cpf");

let professoresCache = [];
let enderecosCache = [];
let professorEditando = null;
let modoEdicao = false;

function usuarioEhAdmin() {
  return Number(usuario?.nivel_acesso) === 1;
}

function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function construirLabelEndereco(endereco) {
  return `${endereco.nome_rua}, ${endereco.numero} - ${endereco.nome_cidade}/${endereco.nome_estado}`;
}

function preencherSelectEnderecos() {
  inputFkEndereco.innerHTML = '<option value="">Selecione...</option>';

  enderecosCache.forEach((endereco) => {
    inputFkEndereco.innerHTML += `
      <option value="${endereco.id_endereco}">${construirLabelEndereco(endereco)}</option>
    `;
  });
}

async function carregarEnderecos() {
  try {
    const response = await requisicaoApi(`${urlBase}api/admin/endereco`);
    const data = await response.json();

    if (!data?.sucesso) {
      showToast("Nao foi possivel carregar enderecos.", "error");
      return;
    }

    enderecosCache = data.enderecos ?? [];
    preencherSelectEnderecos();
  } catch (error) {
    console.error("Erro ao carregar enderecos:", error);
    showToast("Erro interno ao carregar enderecos.", "error");
  }
}

async function buscarProfessores() {
  try {
    professoresList.innerHTML = "<p>Carregando professores...</p>";

    const response = await requisicaoApi(`${urlBase}api/admin/professor`);
    const data = await response.json();

    if (!data?.sucesso) {
      professoresList.innerHTML = "<p>Erro ao carregar professores.</p>";
      showToast(data?.erro ?? "Erro ao listar professores.", "error");
      return;
    }

    professoresCache = data.professores ?? [];
    renderizarProfessores(professoresCache);
  } catch (error) {
    console.error("Erro ao buscar professores:", error);
    professoresList.innerHTML = "<p>Erro interno ao carregar professores.</p>";
    showToast("Erro interno ao carregar professores.", "error");
  }
}

function renderizarProfessores(professores) {
  professoresList.innerHTML = "";

  if (!professores?.length) {
    professoresList.innerHTML = "<p>Nenhum professor cadastrado.</p>";
    return;
  }

  professores.forEach((professor) => {
    professoresList.innerHTML += `
      <article class="record-row">
        <div class="record-main">
          <h3>${professor.nome_completo}</h3>
          <p>Data Nascimento: ${formatarData(professor.data_nacimento)}</p>
        </div>

        <div class="status-pill">${professor.email ?? "Sem email"}</div>

        <div class="record-actions">
          <button class="action-btn details" data-action="detalhes" data-id="${professor.id_professor}">Detalhes</button>
          <button class="action-btn edit" data-action="editar" data-id="${professor.id_professor}">Editar</button>
          <button class="action-btn remove" data-action="excluir" data-id="${professor.id_professor}">Excluir</button>
        </div>
      </article>
    `;
  });
}

function aplicarFiltro() {
  const termo = inputPesquisa.value.toLowerCase().trim();

  if (!termo) {
    renderizarProfessores(professoresCache);
    return;
  }

  const filtrados = professoresCache.filter((professor) => {
    const texto = `${professor.nome_completo ?? ""} ${professor.email ?? ""}`.toLowerCase();
    return texto.includes(termo);
  });

  renderizarProfessores(filtrados);
}

function atualizarCamposExclusivosCriacao() {
  if (modoEdicao) {
    fieldSenha.classList.add("is-hidden");
    fieldCpf.classList.add("is-hidden");

    inputSenha.value = "";
    inputCpf.value = "";
  } else {
    fieldSenha.classList.remove("is-hidden");
    fieldCpf.classList.remove("is-hidden");
  }
}

function limparFormulario() {
  inputEmail.value = "";
  inputUserName.value = "";
  inputSenha.value = "";
  inputCpf.value = "";
  inputNomeCompleto.value = "";
  inputDataNascimento.value = "";
  inputFkEndereco.value = "";
}

function abrirModal() {
  modalOverlay.classList.add("active");
}

function fecharModal() {
  modalOverlay.classList.remove("active");
  btnExcluirProfessor.classList.remove("active");
  limparFormulario();
}

function abrirModalCadastro() {
  modoEdicao = false;
  professorEditando = null;

  modalTitle.innerText = "Novo Professor";
  btnSalvarProfessor.innerText = "Salvar Professor";
  btnExcluirProfessor.classList.remove("active");

  limparFormulario();
  atualizarCamposExclusivosCriacao();
  abrirModal();
}

async function abrirModalEdicao(idProfessor) {
  try {
    modoEdicao = true;

    const response = await requisicaoApi(
      `${urlBase}api/admin/professor/${idProfessor}`,
    );
    const data = await response.json();

    if (!data?.sucesso) {
      showToast(data?.erro ?? "Erro ao carregar professor.", "error");
      return;
    }

    const professor = data.professor;
    professorEditando = { id: professor.id_professor };

    modalTitle.innerText = "Editar Professor";
    btnSalvarProfessor.innerText = "Salvar Alteracoes";
    btnExcluirProfessor.classList.add("active");

    inputEmail.value = professor.email ?? "";
    inputUserName.value = professor.user_name ?? "";
    inputNomeCompleto.value = professor.nome_completo ?? "";
    inputDataNascimento.value = professor.data_nacimento?.split("T")[0] ?? "";
    inputFkEndereco.value = professor.id_endereco ?? "";

    atualizarCamposExclusivosCriacao();
    abrirModal();
  } catch (error) {
    console.error("Erro ao abrir modal de edicao de professor:", error);
    showToast("Erro interno ao carregar professor.", "error");
  }
}

function montarPayload() {
  return {
    email: inputEmail.value.trim(),
    user_name: inputUserName.value.trim(),
    senha: inputSenha.value.trim(),
    cpf: inputCpf.value.trim(),
    nome_completo: inputNomeCompleto.value.trim(),
    data_nacimento: inputDataNascimento.value,
    fk_endereco: Number(inputFkEndereco.value),
  };
}

function validarPayload(payload) {
  if (
    !payload.email ||
    !payload.user_name ||
    !payload.nome_completo ||
    !payload.data_nacimento ||
    !payload.fk_endereco
  ) {
    showToast("Preencha todos os campos obrigatorios.", "warning");
    return false;
  }

  if (!modoEdicao && (!payload.senha || !payload.cpf)) {
    showToast("Senha e CPF sao obrigatorios no cadastro.", "warning");
    return false;
  }

  return true;
}

async function salvarProfessor() {
  try {
    const payload = montarPayload();

    if (!validarPayload(payload)) return;

    let response;

    if (modoEdicao && professorEditando?.id) {
      response = await requisicaoApi(
        `${urlBase}api/admin/professor/${professorEditando.id}`,
        {
          method: "PUT",
          body: {
            email: payload.email,
            user_name: payload.user_name,
            nome_completo: payload.nome_completo,
            data_nacimento: payload.data_nacimento,
            fk_endereco: payload.fk_endereco,
          },
        },
      );
    } else {
      response = await requisicaoApi(`${urlBase}api/admin/professor`, {
        method: "POST",
        body: payload,
      });
    }

    const data = await response.json();

    if (!data?.sucesso) {
      showToast(
        data?.erro ?? data?.mensagem ?? "Erro ao salvar professor.",
        "error",
      );
      return;
    }

    showToast(
      modoEdicao
        ? "Professor atualizado com sucesso!"
        : "Professor criado com sucesso!",
    );

    fecharModal();
    await buscarProfessores();
  } catch (error) {
    console.error("Erro ao salvar professor:", error);
    showToast("Erro interno ao salvar professor.", "error");
  }
}

async function excluirProfessor() {
  if (!professorEditando?.id) return;

  const confirmar = confirm("Deseja realmente excluir este professor?");
  if (!confirmar) return;

  try {
    const response = await requisicaoApi(
      `${urlBase}api/admin/professor/${professorEditando.id}`,
      {
        method: "DELETE",
      },
    );

    const data = await response.json();

    if (!data?.sucesso) {
      showToast(data?.erro ?? "Erro ao excluir professor.", "error");
      return;
    }

    showToast("Professor removido com sucesso!");
    fecharModal();
    await buscarProfessores();
  } catch (error) {
    console.error("Erro ao excluir professor:", error);
    showToast("Erro interno ao excluir professor.", "error");
  }
}

function fecharDetalhes() {
  detailsOverlay.classList.remove("active");
  detailsGrid.innerHTML = "";
  detailsEspecializacoes.innerHTML = "";
}

function montarDetalhe(label, valor, classe = "") {
  return `
    <div class="detail-item ${classe}">
      <span>${label}</span>
      <p>${valor ?? "-"}</p>
    </div>
  `;
}

async function buscarDescricaoEndereco(idEndereco) {
  if (!idEndereco) return "Nao informado";

  try {
    const response = await requisicaoApi(`${urlBase}api/admin/endereco/${idEndereco}`);
    const data = await response.json();

    if (!data?.sucesso) return `Endereco #${idEndereco}`;

    const endereco = data.endereco;

    return `${endereco.nome_rua}, ${endereco.numero} - ${endereco.nome_cidade}/${endereco.nome_estado}`;
  } catch (error) {
    console.error("Erro ao buscar endereco detalhado:", error);
    return `Endereco #${idEndereco}`;
  }
}

function renderizarEspecializacoes(especializacoes) {
  if (!detailsEspecializacoes) return;

  if (!especializacoes?.length) {
    detailsEspecializacoes.innerHTML =
      '<p class="especializacoes-vazio">Nenhuma especializacao vinculada.</p>';
    return;
  }

  detailsEspecializacoes.innerHTML = '<div class="especializacoes-list"></div>';
  const container = detailsEspecializacoes.querySelector(".especializacoes-list");

  especializacoes.forEach((especializacao) => {
    container.innerHTML += `
      <div class="especializacao-pill">
        ${especializacao.nome} (${especializacao.carga_horaria}h)
      </div>
    `;
  });
}

async function abrirDetalhesProfessor(idProfessor) {
  try {
    detailsGrid.innerHTML = "<p>Carregando detalhes...</p>";
    detailsEspecializacoes.innerHTML = "";
    detailsOverlay.classList.add("active");

    const [resProfessor, resEspecializacoes] = await Promise.all([
      requisicaoApi(`${urlBase}api/admin/professor/${idProfessor}`),
      requisicaoApi(`${urlBase}api/admin/professor/${idProfessor}/especializacao`),
    ]);

    const [dadosProfessor, dadosEspecializacoes] = await Promise.all([
      resProfessor.json(),
      resEspecializacoes.json(),
    ]);

    if (!dadosProfessor?.sucesso) {
      detailsGrid.innerHTML = "<p>Erro ao carregar detalhes do professor.</p>";
      return;
    }

    const professor = dadosProfessor.professor;
    const enderecoLabel = await buscarDescricaoEndereco(professor.id_endereco);

    detailsGrid.innerHTML = `
      ${montarDetalhe("Nome", professor.nome_completo, "full")}
      ${montarDetalhe("Data Nascimento", formatarData(professor.data_nacimento))}
      ${montarDetalhe("Email", professor.email, "full")}
      ${montarDetalhe("Usuario", professor.user_name)}
      ${montarDetalhe("Endereco", enderecoLabel, "full")}
    `;

    renderizarEspecializacoes(dadosEspecializacoes.especializacoes ?? []);
  } catch (error) {
    console.error("Erro ao abrir detalhes do professor:", error);
    detailsGrid.innerHTML = "<p>Erro interno ao carregar detalhes.</p>";
  }
}

professoresList.addEventListener("click", async (event) => {
  const botao = event.target.closest(".action-btn");
  if (!botao) return;

  const idProfessor = Number(botao.dataset.id);
  const acao = botao.dataset.action;

  if (!idProfessor || !acao) return;

  if (acao === "detalhes") {
    await abrirDetalhesProfessor(idProfessor);
    return;
  }

  if (acao === "editar") {
    await abrirModalEdicao(idProfessor);
    return;
  }

  if (acao === "excluir") {
    modoEdicao = true;
    professorEditando = { id: idProfessor };
    await excluirProfessor();
  }
});

if (btnNovoProfessor) {
  btnNovoProfessor.addEventListener("click", abrirModalCadastro);
}

if (btnSalvarProfessor) {
  btnSalvarProfessor.addEventListener("click", salvarProfessor);
}

if (btnExcluirProfessor) {
  btnExcluirProfessor.addEventListener("click", excluirProfessor);
}

if (closeModal) {
  closeModal.addEventListener("click", fecharModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) fecharModal();
  });
}

if (closeDetailsModal) {
  closeDetailsModal.addEventListener("click", fecharDetalhes);
}

if (detailsOverlay) {
  detailsOverlay.addEventListener("click", (event) => {
    if (event.target === detailsOverlay) fecharDetalhes();
  });
}

if (inputPesquisa) {
  inputPesquisa.addEventListener("input", aplicarFiltro);
}

async function init() {
  if (!usuarioEhAdmin()) return;

  await carregarEnderecos();
  await buscarProfessores();
}

init();
