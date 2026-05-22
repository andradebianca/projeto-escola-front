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
const inputFkProfessor = document.getElementById("input-fk-professor"); // Captura do novo seletor

let disciplinasCache = [];
let disciplinaIdEditando = null;
let modoEdicao = false;

async function init() {
  await carregarProfessoresSelect();
  await buscarDisciplinas();
}

// Busca os professores cadastrados para alimentar o campo Select
async function carregarProfessoresSelect() {
  try {
    const res = await requisicaoApi(`${urlBase}api/admin/professor`);
    const d = await res.json();
    if (d.sucesso) {
      inputFkProfessor.innerHTML =
        '<option value="">Selecione um professor...</option>';
      (d.professores ?? []).forEach((p) => {
        inputFkProfessor.innerHTML += `<option value="${p.id_professor}">${p.nome_completo}</option>`;
      });
    }
  } catch (e) {
    console.error("Erro ao popular select de professores:", e);
    inputFkProfessor.innerHTML =
      '<option value="">Erro ao carregar docentes</option>';
  }
}

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
      <article class="record-row" style="gap: 20px;">
        <div class="record-main" style="min-width: 0;">
          <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">${disc.nome}</h3>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 6px; white-space: normal; line-height: 1.4;">
            ${disc.descricao || "Sem ementa detalhada."}
          </p>
          <p style="font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 6px; margin: 0;">
            <i class="fa-solid fa-user-tie"></i> Professor: <b style="color: #475569;">${disc.professor || "Não atribuído"}</b>
          </p>
        </div>
        <div class="status-pill" style="flex-shrink: 0;">${disc.carga_horaria}h</div>
        <div class="record-actions" style="flex-shrink: 0;">
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
    fk_professor: inputFkProfessor.value
      ? Number(inputFkProfessor.value)
      : null, // Mapeamento crucial pro back
  };

  if (!payload.nome || !payload.carga_horaria || !payload.fk_professor) {
    showToast(
      "Preencha todos os campos obrigatórios, incluindo o professor.",
      "warning",
    );
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

  // Limpa campos
  inputNome.value = "";
  inputCargaHoraria.value = "";
  inputDescricao.value = "";
  inputFkProfessor.value = "";

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
    inputFkProfessor.value = d.disciplina.fk_professor || ""; // Preenche o ID correto do professor na edição
    modalOverlay.classList.add("active");
  }
});

btnExcluirDisciplina.addEventListener("click", async () => {
  if (
    !confirm(
      "Deseja realmente deletar esta disciplina? Isso apagará os diários de classe e notas vinculadas!",
    )
  )
    return;
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

// Inicialização segura atrelada à função DOMContentLoaded
document.addEventListener("DOMContentLoaded", init);
