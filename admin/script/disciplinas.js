// admin/script/disciplinas.js
import { requisicaoApi, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const disciplinasList = document.getElementById("disciplinas-list");
const inputPesquisa = document.getElementById("input-pesquisa");
const btnNovaDisciplina = document.getElementById("btn-nova-disciplina");
const modalOverlay = document.getElementById("modal-overlay");
const closeModal = document.getElementById("close-modal");
const modalTitle = document.getElementById("modal-title");
const btnSalvarDisciplina = document.getElementById("btn-salvar-disciplina");
const btnExcluirDisciplina = document.getElementById("btn-excluir-disciplina");

const inputNome = document.getElementById("input-nome");
const inputCargaHoraria = document.getElementById("input-carga-horaria");
const inputDescricao = document.getElementById("input-descricao");

let disciplinasCache = [];
let disciplinaIdEditando = null;
let modoEdicao = false;

async function buscarDisciplinas() {
  try {
    disciplinasList.innerHTML = "<p>Carregando disciplinas...</p>";
    const res = await requisicaoApi(`${urlBase}api/admin/disciplina`);
    const d = await res.json();
    disciplinasCache = d.disciplinas ?? [];
    renderizarDisciplinas(disciplinasCache);
  } catch (e) {
    disciplinasList.innerHTML = "<p>Erro ao ler registros.</p>";
  }
}

function renderizarDisciplinas(lista) {
  disciplinasList.innerHTML = "";
  if (!lista.length) {
    disciplinasList.innerHTML = "<p>Nenhuma disciplina cadastrada.</p>";
    return;
  }

  lista.forEach((disc) => {
    disciplinasList.innerHTML += `
      <article class="record-row">
        <div class="record-main">
          <h3>${disc.nome}</h3>
          <p>${disc.descricao || "Sem ementa detalhada."}</p>
        </div>
        <div class="status-pill">${disc.carga_horaria}h</div>
        <div class="record-actions">
          <button class="action-btn edit" data-id="${disc.id_disciplina}">Editar</button>
        </div>
      </article>
    `;
  });
}

btnSalvarDisciplina.addEventListener("click", async () => {
  const payload = {
    nome: inputNome.value.trim(),
    carga_horaria: Number(inputCargaHoraria.value),
    descricao: inputDescricao.value.trim() || null,
  };

  if (!payload.nome || !payload.carga_horaria) {
    showToast("Preencha todos os campos obrigatórios.", "warning");
    return;
  }

  try {
    let res;
    if (modoEdicao) {
      res = await requisicaoApi(
        `${urlBase}api/admin/disciplina/${disciplinaIdEditando}`,
        { method: "PUT", body: payload },
      );
    } else {
      res = await requisicaoApi(`${urlBase}api/admin/disciplina`, {
        method: "POST",
        body: payload,
      });
    }

    const d = await res.json();
    if (!d.sucesso) {
      showToast(d.erro || d.mensagem || "Erro na operação.", "error");
      return;
    }

    showToast("Disciplina salva com sucesso!");
    fecharModal();
    await buscarDisciplinas();
  } catch (e) {
    showToast("Erro operacional na rede.", "error");
  }
});

btnNovaDisciplina.addEventListener("click", () => {
  modoEdicao = false;
  disciplinaIdEditando = null;
  modalTitle.innerText = "Nova Disciplina";
  btnSalvarDisciplina.innerText = "Salvar Disciplina";
  btnExcluirDisciplina.classList.remove("active");
  inputNome.value = "";
  inputCargaHoraria.value = "";
  inputDescricao.value = "";
  modalOverlay.classList.add("active");
});

function fecharModal() {
  modalOverlay.classList.remove("active");
}
closeModal.addEventListener("click", fecharModal);

disciplinasList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".action-btn.edit");
  if (!btn) return;
  modoEdicao = true;
  disciplinaIdEditando = btn.dataset.id;
  modalTitle.innerText = "Editar Disciplina";
  btnSalvarDisciplina.innerText = "Salvar Alterações";
  btnExcluirDisciplina.classList.add("active");

  const res = await requisicaoApi(
    `${urlBase}api/admin/disciplina/${disciplinaIdEditando}`,
  );
  const d = await res.json();
  if (d.sucesso) {
    inputNome.value = d.disciplina.nome;
    inputCargaHoraria.value = d.disciplina.carga_horaria;
    inputDescricao.value = d.disciplina.descricao || "";
    modalOverlay.classList.add("active");
  }
});

btnExcluirDisciplina.addEventListener("click", async () => {
  if (!confirm("Deseja realmente deletar esta disciplina do sistema?")) return;
  const res = await requisicaoApi(
    `${urlBase}api/admin/disciplina/${disciplinaIdEditando}`,
    { method: "DELETE" },
  );
  const d = await res.json();
  if (d.sucesso) {
    showToast("Disciplina removida!");
    fecharModal();
    await buscarDisciplinas();
  } else {
    showToast(d.erro || "Não foi possível excluir.", "error");
  }
});

inputPesquisa.addEventListener("input", () => {
  const q = inputPesquisa.value.toLowerCase().trim();
  renderizarDisciplinas(
    disciplinasCache.filter((t) => t.nome.toLowerCase().includes(q)),
  );
});

document.addEventListener("DOMContentLoaded", buscarDisciplinas);
