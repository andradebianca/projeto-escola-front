import { urlBase } from "./../../script/variaveis-globais.js";

const perfil = JSON.parse(localStorage.getItem("perfil"));

/* LOGIN */

const disciplinasGrid = document.getElementById("disciplinas-grid");

const selectAno = document.getElementById("select-ano");

/* ANO */

let anoSelecionado = 2025;

/* INIT */

async function init() {
  preencherSelect();

  await buscarDisciplinas();
}

/* SELECT */

function preencherSelect() {
  const anos = perfil.dados.opcoesAnos;

  const ordenados = [...anos].sort((a, b) => b - a);

  anoSelecionado = ordenados[0];

  selectAno.innerHTML = "";

  ordenados.forEach((ano) => {
    selectAno.innerHTML += `

        <option
          value="${ano}"
        >
          ${ano}
        </option>

      `;
  });
}

/* API */

async function buscarDisciplinas() {
  try {
    disciplinasGrid.innerHTML = "<p>Carregando disciplinas...</p>";

    const response = await fetch(
      `${urlBase}api/professor/${perfil.dados.id_professor}/disciplinas?ano=${anoSelecionado}`,
    );

    const data = await response.json();

    console.log(data);

    if (!data.sucesso) {
      disciplinasGrid.innerHTML = "<p>Erro ao carregar.</p>";

      return;
    }

    renderizarDisciplinas(data.disciplinas);
  } catch (error) {
    console.error(error);

    disciplinasGrid.innerHTML = "<p>Erro interno.</p>";
  }
}

/* RENDER */

function renderizarDisciplinas(disciplinas) {
  disciplinasGrid.innerHTML = "";

  disciplinas.forEach((disciplina) => {
    const turmas = disciplina.turmas
      .map(
        (turma) => `
          
          <div class="turma-pill">

            ${turma.cod_turma}

          </div>

        `,
      )
      .join("");

    disciplinasGrid.innerHTML += `

        <div class="disciplina-card">

          <h3>
            ${disciplina.disciplina}
          </h3>

          <p class="disciplina-desc">

            ${disciplina.descricao}

          </p>

          <div class="disciplina-info">

            <div class="info-pill">

              ${disciplina.carga_horaria}h

            </div>

            <div class="info-pill">

              ${disciplina.turmas.length}
              turma(s)

            </div>

          </div>

          <div class="turmas-list">

            ${turmas}

          </div>

        </div>

      `;
  });
}

/* EVENT */

selectAno.addEventListener("change", async (event) => {
  anoSelecionado = event.target.value;

  await buscarDisciplinas();
});

/* START */

init();
