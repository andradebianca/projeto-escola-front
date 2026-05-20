import { urlBase } from "./../../script/variaveis-globais.js";

/* STORAGE */

const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ELEMENTOS */

const turmasList = document.getElementById("turmas-list");

const modalOverlay = document.getElementById("modal-overlay");

const closeModal = document.getElementById("close-modal");

const btnSalvarNota = document.getElementById("btn-salvar-nota");

const modalTitle = document.getElementById("modal-title");

/* INPUTS */

const inputNota = document.getElementById("input-nota");

const inputDescricao = document.getElementById("input-descricao");

const inputPeriodo = document.getElementById("input-periodo");

const inputData = document.getElementById("input-data");

/* CACHE */

const cacheTurmas = {};

/* STATE */

let notaEditando = null;

/* INIT */

async function init() {
  await buscarTurmas();
}

/* API */

async function buscarTurmas() {
  try {
    const response = await fetch(
      `${urlBase}api/professor/${perfil.dados.id_professor}/turmas`,
    );

    const data = await response.json();

    console.log(data);

    renderizarTurmas(data.turmas);
  } catch (error) {
    console.error(error);
  }
}

/* RENDER TURMAS */

function renderizarTurmas(turmas) {
  turmasList.innerHTML = "";

  turmas.forEach((turma) => {
    turma.disciplinas.forEach((disciplina) => {
      turmasList.innerHTML += `

            <div class="turma-card">

              <div
                class="turma-header"
                data-turma="${turma.id_turma}"
                data-disciplina="${disciplina.id_disciplina}"
                data-turma-disciplina="${disciplina.fk_turma_disciplina}"
              >

                <div class="turma-info">

                  <h3>
                    ${turma.cod_turma}
                  </h3>

                  <p>

                    ${disciplina.disciplina}
                    •
                    ${turma.turno}

                  </p>

                </div>

                <div class="turma-right">

                  <div class="info-pill">

                    ${disciplina.quantidade_alunos}
                    alunos

                  </div>

                  <i class="fa-solid fa-chevron-down"></i>

                </div>

              </div>

              <div
                class="turma-body"
                id="body-${turma.id_turma}-${disciplina.id_disciplina}"
              >

                <div class="alunos-list">

                  <p>
                    Carregando...
                  </p>

                </div>

              </div>

            </div>

          `;
    });
  });

  adicionarEventosAccordion();
}

/* ACCORDION */

function adicionarEventosAccordion() {
  const headers = document.querySelectorAll(".turma-header");

  headers.forEach((header) => {
    header.addEventListener("click", async () => {
      const idTurma = header.dataset.turma;

      const idDisciplina = header.dataset.disciplina;

      const fkTurmaDisciplina = header.dataset.turmaDisciplina;

      const body = document.getElementById(`body-${idTurma}-${idDisciplina}`);

      body.classList.toggle("active");

      const cacheKey = `${idTurma}-${idDisciplina}`;

      if (cacheTurmas[cacheKey]) {
        renderizarAlunos(cacheTurmas[cacheKey], body, fkTurmaDisciplina);

        return;
      }

      await buscarAlunos(idTurma, idDisciplina, fkTurmaDisciplina, body);
    });
  });
}

/* BUSCAR ALUNOS */

async function buscarAlunos(idTurma, idDisciplina, fkTurmaDisciplina, body) {
  try {
    const response = await fetch(
      `${urlBase}api/turma/${idTurma}/alunos?disciplinaId=${idDisciplina}`,
    );

    const data = await response.json();

    const cacheKey = `${idTurma}-${idDisciplina}`;

    cacheTurmas[cacheKey] = data.alunos;

    renderizarAlunos(data.alunos, body, fkTurmaDisciplina);
  } catch (error) {
    console.error(error);
  }
}

/* RENDER ALUNOS */

function renderizarAlunos(alunos, body, fkTurmaDisciplina) {
  const container = body.querySelector(".alunos-list");

  container.innerHTML = "";

  alunos.forEach((aluno) => {
    const notas = aluno.notas
      .map((nota) => {
        const editavel = podeEditarNota(nota.data_criacao);

        return `

                <button
                  class="
                    nota-pill
                    ${!editavel ? "locked" : ""}
                  "
                  data-id="${nota.id_nota}"
                >

                  ${
                    !editavel
                      ? `
                        <i class="fa-solid fa-lock"></i>
                      `
                      : ""
                  }

                  ${nota.valor_nota}

                </button>

              `;
      })
      .join("");

    const podeCadastrar = aluno.notas.length < 3;

    container.innerHTML += `

        <div class="aluno-card">

          <div class="aluno-top">

            <div class="aluno-info">

              <h4>
                ${aluno.nome_completo}
              </h4>

              <p>
                Matrícula:
                ${aluno.matricula}
              </p>

            </div>

            <div class="media-pill">

              ${Number(aluno.media).toFixed(2)}

            </div>

          </div>

          <div class="notas-list">

            ${notas}

            ${
              podeCadastrar
                ? `
                  <button
                    class="nota-pill add-nota"
                    data-aluno="${aluno.id_aluno}"
                    data-turma-disciplina="${fkTurmaDisciplina}"
                  >

                    <i class="fa-solid fa-plus"></i>

                  </button>
                `
                : ""
            }

          </div>

        </div>

      `;
  });

  adicionarEventosNotas();
}

/* REGRA */

function podeEditarNota(dataCriacao) {
  const hoje = new Date();

  const criacao = new Date(dataCriacao);

  const diferenca = hoje - criacao;

  const dias = diferenca / (1000 * 60 * 60 * 24);

  return dias <= 2;
}

/* EVENTOS NOTAS */

function adicionarEventosNotas() {
  const btnsAdd = document.querySelectorAll(".add-nota");

  btnsAdd.forEach((btn) => {
    btn.addEventListener("click", () => {
      modalTitle.innerText = "Nova Nota";

      notaEditando = {
        aluno: btn.dataset.aluno,

        fkTurmaDisciplina: btn.dataset.turmaDisciplina,
      };

      abrirModal();
    });
  });
}

/* MODAL */

function abrirModal() {
  modalOverlay.classList.add("active");
}

function fecharModal() {
  modalOverlay.classList.remove("active");

  limparModal();
}

function limparModal() {
  inputNota.value = "";

  inputDescricao.value = "";

  inputPeriodo.value = 1;

  inputData.value = "";
}

/* SAVE */

btnSalvarNota.addEventListener("click", async () => {
  try {
    await fetch(`${urlBase}api/nota`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        fk_turma_disciplina: Number(notaEditando.fkTurmaDisciplina),

        fk_aluno: Number(notaEditando.aluno),

        valor_nota: Number(inputNota.value),

        descricao: inputDescricao.value,

        periodo_nota: Number(inputPeriodo.value),

        data_aplicacao: inputData.value,
      }),
    });

    alert("Nota cadastrada!");

    fecharModal();
  } catch (error) {
    console.error(error);

    alert("Erro ao salvar nota.");
  }
});

/* MODAL EVENTS */

closeModal.addEventListener("click", fecharModal);

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    fecharModal();
  }
});

/* START */

init();
