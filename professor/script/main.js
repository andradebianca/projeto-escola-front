// professor/main.js
import { verificarLogin, requisicaoApi } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

/* LOGIN LOCK */
verificarLogin();

/* ELEMENTOS */
const disciplinasGrid = document.getElementById("disciplinas-grid");
const selectAno = document.getElementById("select-ano");

/* STORAGE */
const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ANO PADRÃO */
let anoSelecionado = 2025;

/* INIT */
async function init() {
  preencherSelect();
  await buscarDisciplinas();
}

/* SELECT DINÂMICO */
function preencherSelect() {
  if (!selectAno || !perfil?.dados?.opcoesAnos) return;

  const anos = perfil.dados.opcoesAnos;
  const ordenados = [...anos].sort((a, b) => b - a);

  anoSelecionado = ordenados[0] ?? 2025;
  selectAno.innerHTML = "";

  ordenados.forEach((ano) => {
    selectAno.innerHTML += `
      <option value="${ano}">${ano}</option>
    `;
  });
}

/* API (WRAPPER AUTENTICADO) */
async function buscarDisciplinas() {
  try {
    if (disciplinasGrid)
      disciplinasGrid.innerHTML = "<p>Carregando disciplinas...</p>";

    // REFACTOR: Centralizado com injeção automática de Bearer Token JWT
    const response = await requisicaoApi(
      `${urlBase}api/professor/${perfil.dados.id_professor}/disciplinas?ano=${anoSelecionado}`,
    );
    const data = await response.json();

    if (!data.sucesso) {
      if (disciplinasGrid)
        disciplinasGrid.innerHTML = "<p>Erro ao carregar disciplinas.</p>";
      return;
    }

    renderizarDisciplinas(data.disciplinas);
  } catch (error) {
    console.error("Erro ao buscar disciplinas:", error);
    if (disciplinasGrid)
      disciplinasGrid.innerHTML = "<p>Erro interno ao carregar dados.</p>";
  }
}

/* RENDER CARDS */
function renderizarDisciplinas(disciplinas) {
  if (!disciplinasGrid) return;
  disciplinasGrid.innerHTML = "";

  if (!disciplinas || !disciplinas.length) {
    disciplinasGrid.innerHTML =
      "<p>Nenhuma disciplina vinculada para este ano.</p>";
    return;
  }

  disciplinas.forEach((disciplina) => {
    const turmas = (disciplina.turmas ?? [])
      .map(
        (turma) => `
        <div class="turma-pill">${turma.cod_turma}</div>
      `,
      )
      .join("");

    disciplinasGrid.innerHTML += `
      <div class="disciplina-card">
        <h3>${disciplina.disciplina}</h3>
        <p class="disciplina-desc">${disciplina.descricao ?? "Sem descrição disponível."}</p>
        <div class="disciplina-info">
          <div class="info-pill">${disciplina.carga_horaria}h</div>
          <div class="info-pill">${disciplina.turmas?.length ?? 0} turma(s)</div>
        </div>
        <div class="turmas-list">${turmas}</div>
      </div>
    `;
  });
}

/* EVENTO DE ALTERAÇÃO DO ANO */
if (selectAno) {
  selectAno.addEventListener("change", async (event) => {
    anoSelecionado = event.target.value;
    await buscarDisciplinas();
  });
}

/* START */
init();
