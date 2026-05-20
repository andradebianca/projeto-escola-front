import { urlBase } from "./../../script/variaveis-globais.js";

/* STORAGE */

const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ELEMENTOS */

const turmasList = document.getElementById("turmas-list");

const selectAno = document.getElementById("select-ano");

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

let anoSelecionado = null;

/* INIT */

async function init() {
  preencherSelectAnos();

  await buscarTurmas();
}

/* SELECT */

function preencherSelectAnos() {
  const anos = perfil.dados.opcoesAnos ?? [];

  const anosOrdenados = [...anos].sort((a, b) => b - a);

  anoSelecionado = anosOrdenados[0];

  selectAno.innerHTML = "";

  anosOrdenados.forEach((ano) => {
    selectAno.innerHTML += `

        <option
          value="${ano}"
          ${ano === anoSelecionado ? "selected" : ""}
        >

          ${ano}

        </option>

      `;
  });
}

/* API */

async function buscarTurmas() {
  try {
    turmasList.innerHTML = `
    
      <p>
        Carregando turmas...
      </p>
    
    `;

    const response = await fetch(
      `${urlBase}api/professor/${perfil.dados.id_professor}/turmas?ano=${anoSelecionado}`,
    );

    const data = await response.json();

    console.log(data);

    renderizarTurmas(data.turmas);
  } catch (error) {
    console.error(error);

    turmasList.innerHTML = `
    
      <p>
        Erro ao carregar turmas.
      </p>
    
    `;
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
                data-turma-disciplina="${disciplina.id_turma_disciplina}"
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

/* STATUS */

function obterStatus(aluno) {
  if (aluno.notas.length < 3) {
    return {
      texto: "Cursando",
      classe: "status-cursando",
    };
  }

  if (Number(aluno.media) >= 7) {
    return {
      texto: "Aprovado",
      classe: "status-aprovado",
    };
  }

  return {
    texto: "Reprovado",
    classe: "status-reprovado",
  };
}

/* DATA */

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

/* REGRA */

function podeEditarNota(dataCriacao) {
  const hoje = new Date();

  const criacao = new Date(dataCriacao);

  const diferenca = hoje - criacao;

  const dias = diferenca / (1000 * 60 * 60 * 24);

  return dias <= 2;
}

/* RENDER ALUNOS */

function renderizarAlunos(alunos, body, fkTurmaDisciplina) {
  const container = body.querySelector(".alunos-list");

  container.innerHTML = "";

  alunos.forEach((aluno) => {
    const status = obterStatus(aluno);

    const notas = aluno.notas
      .map((nota) => {
        const editavel = podeEditarNota(nota.data_criacao);

        const dataLimite = new Date(nota.data_criacao);

        dataLimite.setDate(dataLimite.getDate() + 2);

        return `

                <button
                  class="
                    nota-pill
                    ${!editavel ? "locked" : ""}
                  "

                  title="${
                    !editavel
                      ? `
Essa nota não pode mais ser editada.
Prazo encerrado em:
${formatarData(dataLimite)}
`
                      : "Editar nota"
                  }"

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

          <div class="aluno-header">

            <div class="aluno-info">

              <h4>
                ${aluno.nome_completo}
              </h4>

              <p>
                Matrícula:
                ${aluno.matricula}
              </p>

            </div>

            <div class="aluno-right">

              <div class="status-pill ${status.classe}">

                ${status.texto}

              </div>

              <div class="media-pill">

                ${Number(aluno.media).toFixed(2)}

              </div>

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
    const valorNota = Number(inputNota.value);

    if (
      !inputNota.value ||
      !inputDescricao.value ||
      !inputPeriodo.value ||
      !inputData.value
    ) {
      alert("Preencha todos os campos obrigatórios.");

      return;
    }

    if (valorNota > 10) {
      alert("A nota máxima permitida é 10.");

      return;
    }

    /* MIN */

    if (valorNota < 0) {
      alert("A nota mínima é 0.");

      return;
    }

    const response = await fetch(`${urlBase}api/nota`, {
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

    const data = await response.json();

    if (!data.sucesso) {
      alert(data.mensagem ?? "Erro ao salvar nota.");

      return;
    }

    alert("Nota cadastrada!");

    fecharModal();

    /* LIMPA CACHE */

    Object.keys(cacheTurmas).forEach((key) => {
      delete cacheTurmas[key];
    });

    /* RELOAD */

    await buscarTurmas();
  } catch (error) {
    console.error(error);

    alert("Erro interno.");
  }
});

/* SELECT */

selectAno.addEventListener("change", async (event) => {
  anoSelecionado = event.target.value;

  Object.keys(cacheTurmas).forEach((key) => {
    delete cacheTurmas[key];
  });

  await buscarTurmas();
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
