import { verificarLogin } from "./../../../script/funcs-global.js";

import { urlBase } from "./../../../script/variaveis-globais.js";

/* LOGIN */

verificarLogin();

/* STORAGE */

const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ELEMENTOS */

const disciplinasList = document.getElementById("disciplinas-list");

/* CACHE */

const cacheNotas = {};

/* INIT */

async function init() {
  await buscarNotas();
}

/* API */

async function buscarNotas() {
  try {
    disciplinasList.innerHTML = "<p>Carregando boletim...</p>";

    const response = await fetch(
      `${urlBase}api/aluno/${perfil.dados.id_aluno}/notas`,
    );

    const data = await response.json();

    console.log(data);

    if (!data.sucesso) {
      disciplinasList.innerHTML = "<p>Erro ao carregar notas.</p>";

      return;
    }

    renderizarDisciplinas(data.disciplinas);
  } catch (error) {
    console.error(error);

    disciplinasList.innerHTML = "<p>Erro interno.</p>";
  }
}

/* MÉDIA */

function obterMedia(notas) {
  if (!notas?.length) {
    return "-";
  }

  const soma = notas.reduce((acc, nota) => acc + Number(nota.valor_nota), 0);

  return (soma / notas.length).toFixed(2);
}

/* STATUS */

function renderizarStatus(notas) {
  /* CURSANDO */

  if (!notas || notas.length < 3) {
    return `

      <div class="status status-cursando">

        Cursando

      </div>

    `;
  }

  const media = Number(obterMedia(notas));

  /* APROVADO */

  if (media >= 7) {
    return `

      <div class="status status-aprovado">

        Aprovado

      </div>

    `;
  }

  /* REPROVADO */

  return `

    <div class="status status-reprovado">

      Reprovado

    </div>

  `;
}

/* RENDER */

function renderizarDisciplinas(disciplinas) {
  disciplinasList.innerHTML = "";

  disciplinas.forEach((disciplina) => {
    const notasHtml = disciplina.notas
      .map(
        (nota) => `
          
          <button
            class="nota-pill"
            data-id="${nota.id_nota}"
          >

            <strong>
              ${nota.valor_nota}
            </strong>

            <span>
              Ver detalhes
            </span>

          </button>

        `,
      )
      .join("");

    disciplinasList.innerHTML += `

        <div class="disciplina-card">

          <div class="disciplina-top">

            <div class="disciplina-header">

              <div>

                <h3>
                  ${disciplina.disciplina}
                </h3>

                <p>
                  Professor:
                  ${disciplina.professor}
                </p>

              </div>

              <div class="disciplina-status">

                ${renderizarStatus(disciplina.notas)}

              </div>

            </div>

            <div class="disciplina-media">

              Média:
              
              <strong>
                ${obterMedia(disciplina.notas)}
              </strong>

            </div>

          </div>

          <div class="notas-list">

            ${notasHtml}

          </div>

          <div
            class="nota-details"
          ></div>

        </div>

      `;
  });

  adicionarEventosNotas();
}

/* EVENTOS */

function adicionarEventosNotas() {
  const botoesNotas = document.querySelectorAll(".nota-pill");

  botoesNotas.forEach((botao) => {
    botao.addEventListener("click", async () => {
      const idNota = botao.dataset.id;

      const card = botao.closest(".disciplina-card");

      const details = card.querySelector(".nota-details");

      /* FECHAR */

      if (
        details.classList.contains("active") &&
        details.dataset.id == idNota
      ) {
        details.classList.remove("active");

        details.innerHTML = "";

        botao.classList.remove("active");

        return;
      }

      /* REMOVE ACTIVE */

      const todosBotoes = card.querySelectorAll(".nota-pill");

      todosBotoes.forEach((btn) => {
        btn.classList.remove("active");
      });

      /* ADD ACTIVE */

      botao.classList.add("active");

      /* ABRIR */

      details.classList.add("active");

      details.dataset.id = idNota;

      await abrirDetalhesNota(idNota, details);
    });
  });
}

/* DETALHES */

async function abrirDetalhesNota(idNota, details) {
  /* CACHE */

  if (cacheNotas[idNota]) {
    renderizarDetalhes(cacheNotas[idNota], details);

    return;
  }

  details.innerHTML = `

    <p class="loading-details">
      Carregando detalhes...
    </p>

  `;

  try {
    const response = await fetch(`${urlBase}api/nota/${idNota}`);

    const data = await response.json();

    if (!data.sucesso) {
      details.innerHTML = "<p>Erro ao carregar detalhes.</p>";

      return;
    }

    cacheNotas[idNota] = data.nota;

    renderizarDetalhes(data.nota, details);
  } catch (error) {
    console.error(error);

    details.innerHTML = "<p>Erro interno.</p>";
  }
}

/* DATA */

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

/* HTML DETAILS */

function renderizarDetalhes(nota, details) {
  details.innerHTML = `

    <div class="details-grid">

      <div class="detail-item">

        <span>
          Nota
        </span>

        <p>
          ${nota.valor_nota}
        </p>

      </div>

      <div class="detail-item">

        <span>
          Data Aplicação
        </span>

        <p>
          ${formatarData(nota.data_aplicacao)}
        </p>

      </div>

      <div class="detail-item">

        <span>
          Período
        </span>

        <p>
          ${nota.periodo_nota}º Bimestre
        </p>

      </div>

      <div class="detail-item">

        <span>
          Turma
        </span>

        <p>
          ${nota.turma.cod_turma}
        </p>

      </div>

      <div class="detail-item full">

        <span>
          Descrição
        </span>

        <p>
          ${nota.descricao}
        </p>

      </div>

    </div>

  `;
}

/* START */

init();
