import {
  requisicaoApi,
  showToast,
} from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const usuario = JSON.parse(localStorage.getItem("usuario"));

const alunosList = document.getElementById("alunos-list");
const inputPesquisa = document.getElementById("input-pesquisa");
const btnNovoAluno = document.getElementById("btn-novo-aluno");

const modalOverlay = document.getElementById("modal-overlay");
const closeModal = document.getElementById("close-modal");
const modalTitle = document.getElementById("modal-title");
const btnSalvarAluno = document.getElementById("btn-salvar-aluno");
const btnExcluirAluno = document.getElementById("btn-excluir-aluno");

const detailsOverlay = document.getElementById("details-overlay");
const closeDetailsModal = document.getElementById("close-details-modal");
const detailsGrid = document.getElementById("details-grid");

const inputEmail = document.getElementById("input-email");
const inputUserName = document.getElementById("input-user-name");
const inputSenha = document.getElementById("input-senha");
const inputCpf = document.getElementById("input-cpf");
const inputNomeCompleto = document.getElementById("input-nome-completo");
const inputDataNascimento = document.getElementById("input-data-nascimento");
const inputMatricula = document.getElementById("input-matricula");
const inputFkTurma = document.getElementById("input-fk-turma");
const inputFkEndereco = document.getElementById("input-fk-endereco");
const fieldSenha = document.getElementById("field-senha");
const fieldCpf = document.getElementById("field-cpf");

let alunosCache = [];
let turmasCache = [];
let enderecosCache = [];
let alunoEditando = null;
let modoEdicao = false;

function usuarioEhAdmin() {
  return Number(usuario?.nivel_acesso) === 1;
}

function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function construirLabelTurma(turma) {
  const codigo = turma.cod_turma ?? "Sem codigo";
  const ano = turma.ano_letivo ?? "-";
  return `${codigo} - ${ano}`;
}

function construirLabelEndereco(endereco) {
  return `${endereco.nome_rua}, ${endereco.numero} - ${endereco.nome_cidade}/${endereco.nome_estado}`;
}

function preencherSelectTurmas() {
  inputFkTurma.innerHTML = '<option value="">Selecione...</option>';

  turmasCache.forEach((turma) => {
    inputFkTurma.innerHTML += `
      <option value="${turma.id_turma}">${construirLabelTurma(turma)}</option>
    `;
  });
}

function preencherSelectEnderecos() {
  inputFkEndereco.innerHTML = '<option value="">Selecione...</option>';

  enderecosCache.forEach((endereco) => {
    inputFkEndereco.innerHTML += `
      <option value="${endereco.id_endereco}">${construirLabelEndereco(endereco)}</option>
    `;
  });
}

async function carregarBasesFormulario() {
  try {
    const [resTurmas, resEnderecos] = await Promise.all([
      requisicaoApi(`${urlBase}api/turma`),
      requisicaoApi(`${urlBase}api/admin/endereco`),
    ]);

    const [dadosTurmas, dadosEnderecos] = await Promise.all([
      resTurmas.json(),
      resEnderecos.json(),
    ]);

    if (!dadosTurmas?.sucesso || !dadosEnderecos?.sucesso) {
      showToast("Nao foi possivel carregar turmas e enderecos.", "error");
      return;
    }

    turmasCache = dadosTurmas.turmas ?? [];
    enderecosCache = dadosEnderecos.enderecos ?? [];

    preencherSelectTurmas();
    preencherSelectEnderecos();
  } catch (error) {
    console.error("Erro ao carregar bases do formulario de aluno:", error);
    showToast("Erro interno ao carregar dados auxiliares.", "error");
  }
}

async function buscarAlunos() {
  try {
    alunosList.innerHTML = "<p>Carregando alunos...</p>";

    const response = await requisicaoApi(`${urlBase}api/admin/aluno`);
    const data = await response.json();

    if (!data?.sucesso) {
      alunosList.innerHTML = "<p>Erro ao carregar alunos.</p>";
      showToast(data?.erro ?? "Erro ao listar alunos.", "error");
      return;
    }

    alunosCache = data.alunos ?? [];
    renderizarAlunos(alunosCache);
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    alunosList.innerHTML = "<p>Erro interno ao carregar alunos.</p>";
    showToast("Erro interno ao carregar alunos.", "error");
  }
}

function renderizarAlunos(alunos) {
  alunosList.innerHTML = "";

  if (!alunos?.length) {
    alunosList.innerHTML = "<p>Nenhum aluno cadastrado.</p>";
    return;
  }

  alunos.forEach((aluno) => {
    const turmaLabel = aluno.cod_turma
      ? `${aluno.cod_turma} (${aluno.ano_letivo ?? "-"})`
      : "Sem turma";

    alunosList.innerHTML += `
      <article class="record-row">
        <div class="record-main">
          <h3>${aluno.nome_completo}</h3>
          <p>Matricula: ${aluno.matricula ?? "-"} • Turma: ${turmaLabel}</p>
        </div>

        <div class="status-pill">${aluno.email ?? "Sem email"}</div>

        <div class="record-actions">
          <button class="action-btn details" data-action="detalhes" data-id="${aluno.id_aluno}">Detalhes</button>
          <button class="action-btn edit" data-action="editar" data-id="${aluno.id_aluno}">Editar</button>
          <button class="action-btn remove" data-action="excluir" data-id="${aluno.id_aluno}">Excluir</button>
        </div>
      </article>
    `;
  });
}

function aplicarFiltro() {
  const termo = inputPesquisa.value.toLowerCase().trim();

  if (!termo) {
    renderizarAlunos(alunosCache);
    return;
  }

  const filtrados = alunosCache.filter((aluno) => {
    const texto = `${aluno.nome_completo ?? ""} ${aluno.email ?? ""} ${aluno.matricula ?? ""}`.toLowerCase();
    return texto.includes(termo);
  });

  renderizarAlunos(filtrados);
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
  inputMatricula.value = "";
  inputFkTurma.value = "";
  inputFkEndereco.value = "";
}

function abrirModal() {
  modalOverlay.classList.add("active");
}

function fecharModal() {
  modalOverlay.classList.remove("active");
  btnExcluirAluno.classList.remove("active");
  limparFormulario();
}

function abrirModalCadastro() {
  modoEdicao = false;
  alunoEditando = null;

  modalTitle.innerText = "Novo Aluno";
  btnSalvarAluno.innerText = "Salvar Aluno";
  btnExcluirAluno.classList.remove("active");

  limparFormulario();
  atualizarCamposExclusivosCriacao();
  abrirModal();
}

async function abrirModalEdicao(idAluno) {
  try {
    modoEdicao = true;

    const response = await requisicaoApi(`${urlBase}api/admin/aluno/${idAluno}`);
    const data = await response.json();

    if (!data?.sucesso) {
      showToast(data?.erro ?? "Erro ao carregar aluno.", "error");
      return;
    }

    const aluno = data.aluno;
    alunoEditando = { id: aluno.id_aluno };

    modalTitle.innerText = "Editar Aluno";
    btnSalvarAluno.innerText = "Salvar Alteracoes";
    btnExcluirAluno.classList.add("active");

    inputEmail.value = aluno.email ?? "";
    inputUserName.value = aluno.user_name ?? "";
    inputNomeCompleto.value = aluno.nome_completo ?? "";
    inputDataNascimento.value = aluno.data_nacimento?.split("T")[0] ?? "";
    inputMatricula.value = aluno.matricula ?? "";
    inputFkTurma.value = aluno.id_turma ?? "";
    inputFkEndereco.value = aluno.id_endereco ?? "";

    atualizarCamposExclusivosCriacao();
    abrirModal();
  } catch (error) {
    console.error("Erro ao abrir modal de edicao de aluno:", error);
    showToast("Erro interno ao carregar aluno.", "error");
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
    matricula: Number(inputMatricula.value),
    fk_turma: Number(inputFkTurma.value),
    fk_endereco: Number(inputFkEndereco.value),
  };
}

function validarPayload(payload) {
  if (
    !payload.email ||
    !payload.user_name ||
    !payload.nome_completo ||
    !payload.data_nacimento ||
    !payload.matricula ||
    !payload.fk_turma ||
    !payload.fk_endereco
  ) {
    showToast("Preencha todos os campos obrigatorios.", "warning");
    return false;
  }

  if (!modoEdicao && (!payload.senha || !payload.cpf)) {
    showToast("Senha e CPF sao obrigatorios no cadastro.", "warning");
    return false;
  }

  if (payload.matricula <= 0) {
    showToast("Matricula deve ser maior que zero.", "warning");
    return false;
  }

  return true;
}

async function salvarAluno() {
  try {
    const payload = montarPayload();

    if (!validarPayload(payload)) return;

    let response;

    if (modoEdicao && alunoEditando?.id) {
      response = await requisicaoApi(
        `${urlBase}api/admin/aluno/${alunoEditando.id}`,
        {
          method: "PUT",
          body: {
            email: payload.email,
            user_name: payload.user_name,
            nome_completo: payload.nome_completo,
            data_nacimento: payload.data_nacimento,
            matricula: payload.matricula,
            fk_turma: payload.fk_turma,
            fk_endereco: payload.fk_endereco,
          },
        },
      );
    } else {
      response = await requisicaoApi(`${urlBase}api/admin/aluno`, {
        method: "POST",
        body: payload,
      });
    }

    const data = await response.json();

    if (!data?.sucesso) {
      showToast(data?.erro ?? data?.mensagem ?? "Erro ao salvar aluno.", "error");
      return;
    }

    showToast(modoEdicao ? "Aluno atualizado com sucesso!" : "Aluno criado com sucesso!");

    fecharModal();
    await buscarAlunos();
  } catch (error) {
    console.error("Erro ao salvar aluno:", error);
    showToast("Erro interno ao salvar aluno.", "error");
  }
}

async function excluirAluno() {
  if (!alunoEditando?.id) return;

  const confirmar = confirm("Deseja realmente excluir este aluno?");
  if (!confirmar) return;

  try {
    const response = await requisicaoApi(
      `${urlBase}api/admin/aluno/${alunoEditando.id}`,
      {
        method: "DELETE",
      },
    );

    const data = await response.json();

    if (!data?.sucesso) {
      showToast(data?.erro ?? "Erro ao excluir aluno.", "error");
      return;
    }

    showToast("Aluno removido com sucesso!");
    fecharModal();
    await buscarAlunos();
  } catch (error) {
    console.error("Erro ao excluir aluno:", error);
    showToast("Erro interno ao excluir aluno.", "error");
  }
}

function fecharDetalhes() {
  detailsOverlay.classList.remove("active");
  detailsGrid.innerHTML = "";
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

async function abrirDetalhesAluno(idAluno) {
  try {
    detailsGrid.innerHTML = "<p>Carregando detalhes...</p>";
    detailsOverlay.classList.add("active");

    const response = await requisicaoApi(`${urlBase}api/admin/aluno/${idAluno}`);
    const data = await response.json();

    if (!data?.sucesso) {
      detailsGrid.innerHTML = "<p>Erro ao carregar detalhes do aluno.</p>";
      return;
    }

    const aluno = data.aluno;

    const turma = turmasCache.find((item) => item.id_turma === aluno.id_turma);
    const turmaLabel = turma ? construirLabelTurma(turma) : "Sem turma";

    const enderecoLabel = await buscarDescricaoEndereco(aluno.id_endereco);

    detailsGrid.innerHTML = `
      ${montarDetalhe("Nome", aluno.nome_completo, "full")}
      ${montarDetalhe("Matricula", aluno.matricula)}
      ${montarDetalhe("Data Nascimento", formatarData(aluno.data_nacimento))}
      ${montarDetalhe("Email", aluno.email, "full")}
      ${montarDetalhe("Usuario", aluno.user_name)}
      ${montarDetalhe("Turma", turmaLabel)}
      ${montarDetalhe("Endereco", enderecoLabel, "full")}
    `;
  } catch (error) {
    console.error("Erro ao abrir detalhes do aluno:", error);
    detailsGrid.innerHTML = "<p>Erro interno ao carregar detalhes.</p>";
  }
}

alunosList.addEventListener("click", async (event) => {
  const botao = event.target.closest(".action-btn");
  if (!botao) return;

  const idAluno = Number(botao.dataset.id);
  const acao = botao.dataset.action;

  if (!idAluno || !acao) return;

  if (acao === "detalhes") {
    await abrirDetalhesAluno(idAluno);
    return;
  }

  if (acao === "editar") {
    await abrirModalEdicao(idAluno);
    return;
  }

  if (acao === "excluir") {
    modoEdicao = true;
    alunoEditando = { id: idAluno };
    await excluirAluno();
  }
});

if (btnNovoAluno) {
  btnNovoAluno.addEventListener("click", abrirModalCadastro);
}

if (btnSalvarAluno) {
  btnSalvarAluno.addEventListener("click", salvarAluno);
}

if (btnExcluirAluno) {
  btnExcluirAluno.addEventListener("click", excluirAluno);
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

  await carregarBasesFormulario();
  await buscarAlunos();
}

init();
