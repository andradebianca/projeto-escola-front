// admin/script/professores.js
import { requisicaoApi, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

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
const detailsEspecializacoes = document.getElementById(
  "details-especializacoes",
);

/* CAPTURA DOS INPUTS */
const inputEmail = document.getElementById("input-email");
const inputUserName = document.getElementById("input-user-name");
const inputSenha = document.getElementById("input-senha");
const inputCpf = document.getElementById("input-cpf");
const inputNomeCompleto = document.getElementById("input-nome-completo");
const inputDataNascimento = document.getElementById("input-data-nascimento");

/* CAPTURA DE ENDEREÇO */
const inputCep = document.getElementById("input-cep");
const inputRua = document.getElementById("input-rua");
const inputNumeroCasa = document.getElementById("input-numero-casa");
const inputBairro = document.getElementById("input-bairro");
const inputCidade = document.getElementById("input-cidade");
const inputUf = document.getElementById("input-uf");

/* CAPTURA DE TELEFONES */
const inputTelefoneNovo = document.getElementById("input-telefone-novo");
const btnAddListaFone = document.getElementById("btn-add-lista-fone");
const listaFonesTags = document.getElementById("lista-fones-tags");

let professoresCache = [];
let fonesTemporarios = [];
let professorIdEditando = null;
let modoEdicao = false;

async function init() {
  await buscarProfessores();
  configurarEventosFones();
}

async function buscarProfessores() {
  try {
    professoresList.innerHTML = "<p>Carregando professores...</p>";
    const res = await requisicaoApi(`${urlBase}api/admin/professor`);
    const d = await res.json();
    professoresCache = d.professores ?? [];
    renderizarProfessores(professoresCache);
  } catch (e) {
    professoresList.innerHTML = "<p>Erro ao ler registros.</p>";
  }
}

function renderizarProfessores(lista) {
  professoresList.innerHTML = "";
  if (!lista.length) {
    professoresList.innerHTML = "<p>Nenhum professor cadastrado.</p>";
    return;
  }

  lista.forEach((p) => {
    professoresList.innerHTML += `
      <article class="record-row">
        <div class="record-main">
          <h3>${p.nome_completo}</h3>
          <p>Nascimento: ${new Date(p.data_nacimento).toLocaleDateString("pt-BR")}</p>
        </div>
        <div class="status-pill">${p.email ?? "Sem e-mail"}</div>
        <div class="record-actions">
          <button class="action-btn details" data-action="detalhes" data-id="${p.id_professor}">Ficha</button>
          <button class="action-btn edit" data-action="editar" data-id="${p.id_professor}">Editar</button>
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
      showToast("Número já adicionado.", "warning");
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
      fonesTemporarios.splice(Number(e.target.dataset.index), 1);
      atualizarTagsEspelho();
    });
    listaFonesTags.appendChild(tag);
  });
}

btnSalvarProfessor.addEventListener("click", async () => {
  const payload = {
    email: inputEmail.value.trim(),
    user_name: inputUserName.value.trim(),
    nome_completo: inputNomeCompleto.value.trim(),
    data_nacimento: inputDataNascimento.value,
    endereco: {
      cep: inputCep.value.trim(),
      rua: inputRua.value.trim(),
      numero: inputNumeroCasa.value.trim(),
      bairro: inputBairro.value.trim(),
      cidade: inputCidade.value.trim(),
      uf: inputUf.value.trim().toUpperCase(),
    },
    telefones: fonesTemporarios,
  };

  if (!modoEdicao) {
    payload.senha = inputSenha.value.trim();
    payload.cpf = inputCpf.value.trim();
  }

  try {
    let res;
    if (modoEdicao) {
      res = await requisicaoApi(
        `${urlBase}api/admin/professor/${professorIdEditando}`,
        { method: "PUT", body: payload },
      );
    } else {
      res = await requisicaoApi(`${urlBase}api/admin/professor`, {
        method: "POST",
        body: payload,
      });
    }

    const d = await res.json();
    if (!d.sucesso) {
      showToast(d.erro || d.mensagem || "Erro na persistência.", "error");
      return;
    }

    showToast("Docente salvo com sucesso!");
    fecharModal();
    await buscarProfessores();
  } catch (e) {
    showToast("Falha operacional de rede.", "error");
  }
});

btnNovoProfessor.addEventListener("click", () => {
  modoEdicao = false;
  professorIdEditando = null;
  modalTitle.innerText = "Novo Professor";
  document.getElementById("field-senha").classList.remove("is-hidden");
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
  inputUserName.value = "";
  inputSenha.value = "";
  inputCpf.value = "";
  inputNomeCompleto.value = "";
  inputDataNascimento.value = "";
  inputCep.value = "";
  inputRua.value = "";
  inputNumeroCasa.value = "";
  inputBairro.value = "";
  inputCidade.value = "";
  inputUf.value = "";
  fonesTemporarios = [];
  atualizarTagsEspelho();
}

professoresList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".action-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "editar") {
    modoEdicao = true;
    professorIdEditando = id;
    modalTitle.innerText = "Editar Professor";
    document.getElementById("field-senha").classList.add("is-hidden");
    document.getElementById("field-cpf").classList.add("is-hidden");

    const res = await requisicaoApi(`${urlBase}api/admin/professor/${id}`);
    const d = await res.json();
    if (d.sucesso) {
      const p = d.professor;
      inputEmail.value = p.email;
      inputUserName.value = p.user_name;
      inputNomeCompleto.value = p.nome_completo;
      inputDataNascimento.value = p.data_nacimento?.split("T")[0];

      inputCep.value = p.endereco?.cep || "";
      inputRua.value = p.endereco?.rua || "";
      inputNumeroCasa.value = p.endereco?.numero || "";
      inputBairro.value = p.endereco?.bairro || "";
      inputCidade.value = p.endereco?.cidade || "";
      inputUf.value = p.endereco?.uf || "";

      fonesTemporarios = p.telefones ?? [];
      atualizarTagsEspelho();
      modalOverlay.classList.add("active");
    }
  }

  if (action === "detalhes") {
    detailsGrid.innerHTML = "<p>Carregando...</p>";
    detailsEspecializacoes.innerHTML = "";
    detailsOverlay.classList.add("active");

    const [resP, resE] = await Promise.all([
      requisicaoApi(`${urlBase}api/admin/professor/${id}`),
      requisicaoApi(`${urlBase}api/admin/professor/${id}/especializacao`),
    ]);
    const [dP, dE] = await Promise.all([resP.json(), resE.json()]);

    if (dP.sucesso) {
      const p = dP.professor;
      detailsGrid.innerHTML = `
        <div class="detail-item full"><span>Nome</span><p>${p.nome_completo}</p></div>
        <div class="detail-item"><span>Email</span><p>${p.email}</p></div>
        <div class="detail-item"><span>Usuário</span><p>${p.user_name}</p></div>
        <div class="detail-item full"><span>Endereço</span><p>${p.endereco ? `${p.endereco.rua}, ${p.endereco.numero} - ${p.endereco.cidade}/${p.endereco.uf}` : "Não informado"}</p></div>
      `;

      detailsEspecializacoes.innerHTML = '<div class="pills-list"></div>';
      const container = detailsEspecializacoes.querySelector(".pills-list");
      (dE.especializacoes ?? []).forEach((esp) => {
        container.innerHTML += `<span class="pill">${esp.nome} (${esp.carga_horaria}h)</span>`;
      });
      if (!(dE.especializacoes ?? []).length)
        detailsEspecializacoes.innerHTML =
          "<p>Nenhuma especialização vinculada.</p>";
    }
  }
});

closeDetailsModal.addEventListener("click", () =>
  detailsOverlay.classList.remove("active"),
);
inputPesquisa.addEventListener("input", () => {
  const q = inputPesquisa.value.toLowerCase().trim();
  renderizarProfessores(
    professoresCache.filter((p) => p.nome_completo.toLowerCase().includes(q)),
  );
});

document.addEventListener("DOMContentLoaded", init);
