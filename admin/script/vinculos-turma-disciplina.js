import { requisicaoApi, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const selectTurma = document.getElementById("filtro-turma");
const selectDisciplina = document.getElementById("filtro-disciplina");
const btnVincular = document.getElementById("btn-vincular");
const btnRecarregar = document.getElementById("btn-recarregar");
const recordsList = document.getElementById("records-list");
const detailsOverlay = document.getElementById("details-overlay");
const detailsGrid = document.getElementById("details-grid");
const closeDetailsModal = document.getElementById("close-details-modal");

let turmas = [];
let disciplinas = [];
let vinculos = [];

async function carregarBases() {
  try {
    const [resTurmas, resDisciplinas] = await Promise.all([
      requisicaoApi(`${urlBase}api/admin/turma`),
      requisicaoApi(`${urlBase}api/admin/disciplina`),
    ]);

    const [dadosTurmas, dadosDisciplinas] = await Promise.all([
      resTurmas.json(),
      resDisciplinas.json(),
    ]);

    if (!dadosTurmas?.sucesso || !dadosDisciplinas?.sucesso) {
      showToast("Erro ao carregar bases de vinculo.", "error");
      return;
    }

    turmas = dadosTurmas.turmas || [];
    disciplinas = dadosDisciplinas.disciplinas || [];

    preencherSelects();
  } catch (error) {
    console.error("Erro ao carregar bases de vinculo:", error);
    showToast("Erro interno ao carregar bases de vinculo.", "error");
  }
}

function preencherSelects() {
  const turmaAtual = selectTurma.value;
  const disciplinaAtual = selectDisciplina.value;

  selectTurma.innerHTML = '<option value="">Selecione a turma...</option>';
  turmas.forEach((turma) => {
    selectTurma.innerHTML += `
      <option value="${turma.id_turma}">${turma.cod_turma} • ${turma.ano_letivo}</option>
    `;
  });

  selectDisciplina.innerHTML = '<option value="">Selecione a disciplina...</option>';
  disciplinas.forEach((disciplina) => {
    selectDisciplina.innerHTML += `
      <option value="${disciplina.id_disciplina}">${disciplina.nome}</option>
    `;
  });

  selectTurma.value = turmaAtual || "";
  selectDisciplina.value = disciplinaAtual || "";
}

function turmaSelecionada() {
  return turmas.find((item) => Number(item.id_turma) === Number(selectTurma.value));
}

function renderizarVinculos() {
  recordsList.innerHTML = "";

  if (!selectTurma.value) {
    recordsList.innerHTML = "<p>Selecione uma turma para ver os vinculos.</p>";
    return;
  }

  if (!vinculos.length) {
    recordsList.innerHTML = "<p>Nenhuma disciplina vinculada para esta turma.</p>";
    return;
  }

  vinculos.forEach((vinculo) => {
    recordsList.innerHTML += `
      <article class="record-row">
        <div class="record-main">
          <h3>${vinculo.nome}</h3>
          <p>Professor: ${vinculo.professor || "-"}</p>
        </div>

        <div class="status-pill">${vinculo.carga_horaria || 0}h</div>

        <div class="record-actions">
          <button class="action-btn details" data-action="detalhes" data-id="${vinculo.id_turma_disciplina}">Detalhes</button>
          <button class="action-btn remove" data-action="remover" data-id="${vinculo.id_turma_disciplina}">Remover</button>
        </div>
      </article>
    `;
  });
}

async function buscarVinculosDaTurma() {
  if (!selectTurma.value) {
    vinculos = [];
    renderizarVinculos();
    return;
  }

  try {
    recordsList.innerHTML = "<p>Carregando vinculos...</p>";

    const response = await requisicaoApi(
      `${urlBase}api/admin/turma/${selectTurma.value}/disciplina`,
    );
    const data = await response.json();

    if (!data?.sucesso) {
      recordsList.innerHTML = "<p>Erro ao carregar vinculos.</p>";
      return;
    }

    vinculos = data.disciplinas || [];
    renderizarVinculos();
  } catch (error) {
    console.error("Erro ao buscar vinculos:", error);
    recordsList.innerHTML = "<p>Erro interno ao carregar vinculos.</p>";
  }
}

async function vincularDisciplina() {
  const fk_turma = Number(selectTurma.value);
  const fk_disciplina = Number(selectDisciplina.value);

  if (!fk_turma || !fk_disciplina) {
    showToast("Selecione turma e disciplina.", "warning");
    return;
  }

  try {
    const response = await requisicaoApi(`${urlBase}api/admin/turma/disciplina`, {
      method: "POST",
      body: { fk_turma, fk_disciplina },
    });

    const data = await response.json();

    if (!data?.sucesso) {
      showToast(data?.erro || "Erro ao vincular disciplina.", "error");
      return;
    }

    showToast("Disciplina vinculada com sucesso!");
    await buscarVinculosDaTurma();
  } catch (error) {
    console.error("Erro ao vincular disciplina:", error);
    showToast("Erro interno ao vincular disciplina.", "error");
  }
}

function abrirDetalhes(vinculo) {
  const turma = turmaSelecionada();

  detailsGrid.innerHTML = `
    <div class="detail-item full">
      <span>Disciplina</span>
      <p>${vinculo.nome}</p>
    </div>
    <div class="detail-item">
      <span>Professor</span>
      <p>${vinculo.professor || "-"}</p>
    </div>
    <div class="detail-item">
      <span>Carga Horaria</span>
      <p>${vinculo.carga_horaria || 0}h</p>
    </div>
    <div class="detail-item full">
      <span>Turma</span>
      <p>${turma ? `${turma.cod_turma} • ${turma.ano_letivo} • ${turma.turno}` : "-"}</p>
    </div>
  `;

  detailsOverlay.classList.add("active");
}

async function removerVinculo(idVinculo) {
  const confirmar = confirm("Deseja remover este vinculo? As notas relacionadas serao removidas.");
  if (!confirmar) return;

  try {
    const response = await requisicaoApi(
      `${urlBase}api/admin/turma/disciplina/${idVinculo}`,
      {
        method: "DELETE",
      },
    );

    const data = await response.json();

    if (!data?.sucesso) {
      showToast(data?.erro || "Erro ao remover vinculo.", "error");
      return;
    }

    showToast("Vinculo removido com sucesso!");
    await buscarVinculosDaTurma();
  } catch (error) {
    console.error("Erro ao remover vinculo:", error);
    showToast("Erro interno ao remover vinculo.", "error");
  }
}

recordsList.addEventListener("click", (event) => {
  const botao = event.target.closest(".action-btn");
  if (!botao) return;

  const idVinculo = Number(botao.dataset.id);
  const acao = botao.dataset.action;

  if (!idVinculo || !acao) return;

  const vinculo = vinculos.find(
    (item) => Number(item.id_turma_disciplina) === idVinculo,
  );

  if (!vinculo) return;

  if (acao === "detalhes") {
    abrirDetalhes(vinculo);
    return;
  }

  if (acao === "remover") {
    removerVinculo(idVinculo);
  }
});

selectTurma.addEventListener("change", buscarVinculosDaTurma);
btnVincular.addEventListener("click", vincularDisciplina);
btnRecarregar.addEventListener("click", buscarVinculosDaTurma);

closeDetailsModal.addEventListener("click", () => {
  detailsOverlay.classList.remove("active");
});

detailsOverlay.addEventListener("click", (event) => {
  if (event.target === detailsOverlay) {
    detailsOverlay.classList.remove("active");
  }
});

async function init() {
  await carregarBases();
  await buscarVinculosDaTurma();
}

init();
