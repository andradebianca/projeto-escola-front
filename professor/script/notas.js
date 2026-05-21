import { urlBase } from "./../../script/variaveis-globais.js";
import { showToast } from "./../../script/funcs-global.js";

/* STORAGE */

const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ELEMENTOS */

const turmasList = document.getElementById("turmas-list");

const selectAno = document.getElementById("select-ano");

const modalOverlay = document.getElementById("modal-overlay");

const closeModal = document.getElementById("close-modal");

const btnSalvarNota = document.getElementById("btn-salvar-nota");

const btnExcluirNota = document.getElementById("btn-excluir-nota");

const modalTitle = document.getElementById("modal-title");

const inputPesquisa = document.getElementById("input-pesquisa");

/* INPUTS */

const inputNota = document.getElementById("input-nota");

const inputDescricao = document.getElementById("input-descricao");

const inputPeriodo = document.getElementById("input-periodo");

const inputData = document.getElementById("input-data");

/* CACHE */

const cacheTurmas = {};

/* STATE */

let notaEditando = null;

let modoEdicao = false;

let anoSelecionado = null;

let accordionAberto = null;

let scrollPosicao = 0;

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

    renderizarTurmas(data.turmas);

    /* REABRIR */

    if (accordionAberto) {
      const idTurma = accordionAberto.turma;

      const idDisciplina = accordionAberto.disciplina;

      const body = document.getElementById(`body-${idTurma}-${idDisciplina}`);

      if (body) {
        /* ABRE */

        body.classList.add("active");

        const cacheKey = `${idTurma}-${idDisciplina}`;

        const header = document.querySelector(
          `.turma-header[data-turma="${idTurma}"][data-disciplina="${idDisciplina}"]`,
        );

        const fkTurmaDisciplina = header?.dataset.turmaDisciplina;

        /* RENDER CACHE */

        if (cacheTurmas[cacheKey]) {
          renderizarAlunos(cacheTurmas[cacheKey], body, fkTurmaDisciplina);
        } else {
          await buscarAlunos(idTurma, idDisciplina, fkTurmaDisciplina, body);
        }
      }

      setTimeout(() => {
        window.scrollTo({
          top: scrollPosicao,

          behavior: "smooth",
        });
      }, 150);
    }
  } catch (error) {
    console.error(error);

    turmasList.innerHTML = `
    
      <p>
        Erro ao carregar turmas.
      </p>
    
    `;
  }
}

/* RENDER */

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

      const abriu = !body.classList.contains("active");

      body.classList.toggle("active");

      if (abriu) {
        accordionAberto = {
          turma: idTurma,

          disciplina: idDisciplina,
        };
      } else {
        accordionAberto = null;
      }

      const cacheKey = `${idTurma}-${idDisciplina}`;

      if (cacheTurmas[cacheKey]) {
        renderizarAlunos(cacheTurmas[cacheKey], body, fkTurmaDisciplina);

        return;
      }

      await buscarAlunos(idTurma, idDisciplina, fkTurmaDisciplina, body);
    });
  });
}

/* API ALUNOS */

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
  /* ADD */

  const btnsAdd = document.querySelectorAll(".add-nota");

  btnsAdd.forEach((btn) => {
    btn.addEventListener("click", () => {
      modoEdicao = false;

      btnExcluirNota.classList.remove("active");

      modalTitle.innerText = "Nova Nota";

      btnSalvarNota.innerText = "Salvar Nota";

      notaEditando = {
        aluno: Number(btn.dataset.aluno),

        fkTurmaDisciplina: Number(btn.dataset.turmaDisciplina),
      };

      abrirModal();
    });
  });

  /* EDIT */

  const notas = document.querySelectorAll(
    ".nota-pill:not(.add-nota):not(.locked)",
  );

  notas.forEach((nota) => {
    nota.addEventListener("click", async () => {
      try {
        modoEdicao = true;

        modalTitle.innerText = "Editar Nota";

        btnExcluirNota.classList.add("active");

        btnSalvarNota.innerText = "Salvar Alterações";

        const response = await fetch(`${urlBase}api/nota/${nota.dataset.id}`);

        const data = await response.json();

        if (!data.sucesso) {
          showToast("Erro ao buscar nota.", "error");

          return;
        }

        const notaData = data.nota;

        notaEditando = {
          id: notaData.id_nota,
        };

        inputNota.value = notaData.valor_nota;

        inputDescricao.value = notaData.descricao;

        inputPeriodo.value = notaData.periodo_nota;

        inputData.value = notaData.data_aplicacao?.split("T")[0];

        abrirModal();
      } catch (error) {
        console.error(error);

        showToast("Erro ao carregar nota.", "error");
      }
    });
  });
}

/* MODAL */

function abrirModal() {
  modalOverlay.classList.add("active");
}

function fecharModal() {
  modalOverlay.classList.remove("active");

  btnExcluirNota.classList.remove("active");

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

    /* REQUIRED */

    if (
      !inputNota.value ||
      !inputDescricao.value ||
      !inputPeriodo.value ||
      !inputData.value
    ) {
      showToast("Preencha todos os campos obrigatórios.", "warning");

      return;
    }

    /* MAX */

    if (valorNota > 10) {
      showToast("A nota máxima é 10.", "warning");

      return;
    }

    /* MIN */

    if (valorNota < 0) {
      showToast("A nota mínima é 0.", "warning");

      return;
    }

    let response;

    /* EDIT */

    if (modoEdicao) {
      response = await fetch(`${urlBase}api/nota/${notaEditando.id}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          valor_nota: valorNota,

          descricao: inputDescricao.value,

          periodo_nota: Number(inputPeriodo.value),
        }),
      });
    } else {
      /* CREATE */

      response = await fetch(`${urlBase}api/nota`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          fk_turma_disciplina: notaEditando.fkTurmaDisciplina,

          fk_aluno: notaEditando.aluno,

          valor_nota: valorNota,

          descricao: inputDescricao.value,

          periodo_nota: Number(inputPeriodo.value),

          data_aplicacao: inputData.value,
        }),
      });
    }

    const data = await response.json();

    if (!data.sucesso) {
      showToast(data.mensagem ?? "Erro ao salvar nota.", "error");

      return;
    }

    showToast(modoEdicao ? "Nota editada!" : "Nota cadastrada!");

    fecharModal();

    /* SAVE SCROLL */

    scrollPosicao = window.scrollY;

    /* CLEAR CACHE */

    Object.keys(cacheTurmas).forEach((key) => {
      delete cacheTurmas[key];
    });

    await buscarTurmas();
  } catch (error) {
    console.error(error);

    showToast("Erro interno.", "error");
  }
});

/* DELETE */

btnExcluirNota.addEventListener("click", async () => {
  try {
    const confirmar = confirm("Deseja realmente excluir esta nota?");

    if (!confirmar) {
      return;
    }

    const response = await fetch(`${urlBase}api/nota/${notaEditando.id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!data.sucesso) {
      showToast(data.mensagem ?? "Erro ao excluir nota.", "error");

      return;
    }

    showToast("Nota excluída!");

    fecharModal();

    /* SAVE SCROLL */

    scrollPosicao = window.scrollY;

    /* CLEAR CACHE */

    Object.keys(cacheTurmas).forEach((key) => {
      delete cacheTurmas[key];
    });

    await buscarTurmas();
  } catch (error) {
    console.error(error);

    showToast("Erro interno.", "error");
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

/* MODAL */

closeModal.addEventListener("click", fecharModal);

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    fecharModal();
  }
});

/* PESQUISA */

/* PESQUISA */

inputPesquisa.addEventListener("input", async () => {
  const valor = inputPesquisa.value.toLowerCase().trim();

  const headers = document.querySelectorAll(".turma-header");

  /* LIMPOU PESQUISA */

  if (!valor) {
    const bodies = document.querySelectorAll(".turma-body");

    bodies.forEach((body) => {
      body.classList.remove("active");
    });

    accordionAberto = null;

    /* MOSTRA TODOS */

    const alunos = document.querySelectorAll(".aluno-card");

    alunos.forEach((aluno) => {
      aluno.style.display = "";
    });

    return;
  }

  /* ABRE TODOS */

  for (const header of headers) {
    const idTurma = header.dataset.turma;

    const idDisciplina = header.dataset.disciplina;

    const body = document.getElementById(`body-${idTurma}-${idDisciplina}`);

    if (!body.classList.contains("active")) {
      header.click();

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /* FILTRA */

  const alunos = document.querySelectorAll(".aluno-card");

  alunos.forEach((aluno) => {
    const texto = aluno.innerText.toLowerCase();

    aluno.style.display = texto.includes(valor) ? "" : "none";
  });
});

/* START */

init();
