// admin/script/alunos.js
import { requisicaoApi, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const alunosList = document.getElementById("alunos-list");
const inputPesquisa = document.getElementById("input-pesquisa");
const btnNovoAluno = document.getElementById("btn-novo-aluno");
const modalOverlay = document.getElementById("modal-overlay");
const closeModal = document.getElementById("close-modal");
const modalTitle = document.getElementById("modal-title");
const btnSalvarAluno = document.getElementById("btn-salvar-aluno");
const btnExcluirAluno = document.getElementById("btn-excluir-aluno");

/* CONFIGURAÇÕES DE INPUTS */
const inputEmail = document.getElementById("input-email");
const inputSenha = document.getElementById("input-senha");
const inputCpf = document.getElementById("input-cpf");
const inputNomeCompleto = document.getElementById("input-nome-completo");
const inputDataNascimento = document.getElementById("input-data-nascimento");
const inputMatricula = document.getElementById("input-matricula");
const inputFkTurma = document.getElementById("input-fk-turma");

/* INPUTS DE ENDEREÇO EMBUTIDOS */
const inputCep = document.getElementById("input-cep");
const inputRua = document.getElementById("input-rua");
const inputNumeroCasa = document.getElementById("input-numero-casa");
const inputBairro = document.getElementById("input-bairro");
const inputCidade = document.getElementById("input-cidade");
const inputUf = document.getElementById("input-uf");

/* CONTATOS TELEFÔNICOS COMPONENTIZED */
const inputTelefoneNovo = document.getElementById("input-telefone-novo");
const btnAddListaFone = document.getElementById("btn-add-lista-fone");
const listaFonesTags = document.getElementById("lista-fones-tags");

let alunosCache = [];
let fonesTemporarios = [];
let alunoIdEditando = null;
let modoEdicao = false;

async function init() {
  await carregarTurmasSelect();
  await buscarAlunos();
  configurarEventosFones();
}

async function carregarTurmasSelect() {
  try {
    const res = await requisicaoApi(`${urlBase}api/admin/turma`);
    const d = await res.json();
    if (d.sucesso) {
      inputFkTurma.innerHTML = '<option value="">Selecione...</option>';
      d.turmas.forEach((t) => {
        inputFkTurma.innerHTML += `<option value="${t.id_turma}">${t.cod_turma} (${t.turno})</option>`;
      });
    }
  } catch (e) {
    console.error(e);
  }
}

async function buscarAlunos() {
  try {
    alunosList.innerHTML = "<p>Carregando alunos...</p>";
    const res = await requisicaoApi(`${urlBase}api/admin/aluno`);
    const d = await res.json();
    alunosCache = d.alunos ?? [];
    renderizarAlunos(alunosCache);
  } catch (e) {
    alunosList.innerHTML = "<p>Erro ao sincronizar dados.</p>";
  }
}

function renderizarAlunos(lista) {
  alunosList.innerHTML = "";
  if (!lista.length) {
    alunosList.innerHTML = "<p>Nenhum aluno encontrado.</p>";
    return;
  }

  lista.forEach((aluno) => {
    alunosList.innerHTML += `
      <article class="record-row">
        <div class="record-main">
          <h3>${aluno.nome_completo}</h3>
          <p>Matrícula: ${aluno.matricula} • Turma: ${aluno.cod_turma || "Não alocado"}</p>
        </div>
        <div class="status-pill">${aluno.email}</div>
        <div class="record-actions">
          <button class="action-btn edit" data-action="editar" data-id="${aluno.id_aluno}">Editar</button>
        </div>
      </article>
    `;
  });
}

function configurarEventosFones() {
  btnAddListaFone?.addEventListener("click", () => {
    const fone = inputTelefoneNovo.value.trim();
    if (!fone) return;
    if (fonesTemporarios.includes(fone)) {
      showToast("Telefone já inserido.", "warning");
      return;
    }
    fonesTemporarios.push(fone);
    inputTelefoneNovo.value = "";
    atualizarTagsEspelho();
  });
}

function atualizarTagsEspelho() {
  listaFonesTags.innerHTML = "";
  fonesTemporarios.forEach((fone, idx) => {
    const tag = document.createElement("span");
    tag.className = "phone-tag";
    tag.innerHTML = `${fone} <i class="fa-solid fa-circle-xmark" data-index="${idx}"></i>`;
    tag.querySelector("i").addEventListener("click", (e) => {
      const targetIdx = Number(e.target.dataset.index);
      fonesTemporarios.splice(targetIdx, 1);
      atualizarTagsEspelho();
    });
    listaFonesTags.appendChild(tag);
  });
}

btnSalvarAluno.addEventListener(
  "click",

  async () => {

    const email =
      inputEmail.value.trim();

    const nome_completo =
      inputNomeCompleto.value.trim();

    const data_nacimento =
      inputDataNascimento.value;

    const matricula =
      inputMatricula.value;

    const fk_turma =
      inputFkTurma.value;

    const cep =
      inputCep.value.trim();

    const rua =
      inputRua.value.trim();

    const numero =
      inputNumeroCasa.value.trim();

    const bairro =
      inputBairro.value.trim();

    const cidade =
      inputCidade.value.trim();

    const uf =
      inputUf.value.trim();

    // =========================
    // VALIDAÇÃO
    // =========================
    if (
      !email ||
      !nome_completo ||
      !data_nacimento ||
      !matricula ||
      !fk_turma
    ) {

      showToast(
        "Preencha os campos obrigatórios",
        "warning"
      );

      return;
    }

    // CPF só no cadastro
    if (!modoEdicao) {

      const cpf =
        inputCpf.value.trim();

      if (!cpf) {

        showToast(
          "CPF obrigatório",
          "warning"
        );

        return;
      }
    }

    // endereço
    if (
      !cep ||
      !rua ||
      !numero ||
      !bairro ||
      !cidade ||
      !uf
    ) {

      showToast(
        "Preencha o endereço completo",
        "warning"
      );

      return;
    }

    // =========================
    // PAYLOAD
    // =========================
    const payload = {

      email,

      nome_completo,

      data_nacimento,

      matricula:
        Number(matricula),

      fk_turma:
        Number(fk_turma),

      endereco: {
        cep,
        rua,
        numero,
        bairro,
        cidade,
        uf:
          uf.toUpperCase(),
      },

      telefones:
        fonesTemporarios,
    };

    // cpf apenas criação
    if (!modoEdicao) {

      payload.cpf =
        inputCpf.value.trim();
    }

    try {

      let res;

      // =========================
      // UPDATE
      // =========================
      if (modoEdicao) {

        res =
          await requisicaoApi(

            `${urlBase}api/admin/aluno/${alunoIdEditando}`,

            {
              method: "PUT",
              body: payload,
            }
          );

      } else {

        // =========================
        // CREATE
        // =========================
        res =
          await requisicaoApi(

            `${urlBase}api/admin/aluno`,

            {
              method: "POST",
              body: payload,
            }
          );
      }

      const d =
        await res.json();

      if (!d.sucesso) {

        showToast(
          d.erro ||
            "Erro ao salvar",
          "error"
        );

        return;
      }

      showToast(
        "Aluno salvo com sucesso",
        "success"
      );

      fecharModal();

      await buscarAlunos();

    } catch (err) {

      showToast(
        "Erro interno",
        "error"
      );
    }
  }
);

btnNovoAluno.addEventListener("click", () => {
  modoEdicao = false;
  alunoIdEditando = null;
  modalTitle.innerText = "Novo Aluno";
  document.getElementById("field-cpf").classList.remove("is-hidden");
  limparFormulario();
  modalOverlay.classList.add("active");
});

function fecharModal() {
  modalOverlay.classList.remove("active");
  limparFormulario();
}
closeModal.addEventListener("click", fecharModal);

function limparFormulario() {

  inputEmail.value = "";

  inputCpf.value = "";

  inputNomeCompleto.value = "";

  inputDataNascimento.value = "";

  inputMatricula.value = "";

  inputFkTurma.value = "";

  inputCep.value = "";

  inputRua.value = "";

  inputNumeroCasa.value = "";

  inputBairro.value = "";

  inputCidade.value = "";

  inputUf.value = "";

  fonesTemporarios = [];

  atualizarTagsEspelho();
}

alunosList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".action-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "editar") {
    modoEdicao = true;
    alunoIdEditando = id;
    modalTitle.innerText = "Modificar Ficha do Aluno";
    document.getElementById("field-cpf").classList.add("is-hidden");

    try {
      const res = await requisicaoApi(`${urlBase}api/admin/aluno/${id}`);
      const d = await res.json();

      if (d.sucesso) {
        const a = d.aluno;

        // Dados de Ficha Base
        inputEmail.value = a.email ?? "";
        inputNomeCompleto.value = a.nome_completo ?? "";
        inputDataNascimento.value = a.data_nacimento
          ? a.data_nacimento.split("T")[0]
          : "";
        inputMatricula.value = a.matricula ?? "";
        inputFkTurma.value = a.id_turma || "";

        // CORREÇÃO PONTUAL: Mapeamento direto da raiz do objeto retornado pelo back-end
        inputCep.value = a.cep || "";
        inputRua.value = a.rua || "";
        inputNumeroCasa.value = a.numero || "";
        inputBairro.value = a.bairro || "";
        inputCidade.value = a.cidade || "";
        inputUf.value = a.uf || "";

        // Contatos Telefônicos Integrados
        fonesTemporarios = a.telefones ?? [];
        atualizarTagsEspelho();

        modalOverlay.classList.add("active");
      } else {
        showToast(
          d.erro || "Não foi possível carregar os dados do estudante.",
          "error",
        );
      }
    } catch (err) {
      console.error("Erro na busca do registro:", err);
      showToast("Erro interno de comunicação com o servidor.", "error");
    }
  }
});

inputPesquisa.addEventListener("input", () => {
  const q = inputPesquisa.value.toLowerCase().trim();
  const filtered = alunosCache.filter((a) =>
    `${a.nome_completo} ${a.matricula} ${a.email}`.toLowerCase().includes(q),
  );
  renderizarAlunos(filtered);
});

document.addEventListener("DOMContentLoaded", init);
