import { urlBase } from "./../../script/variaveis-globais.js";
import {
  showToast,
  verificarLogin,
  requisicaoApi,
} from "./../../script/funcs-global.js";

/* SECURITY LOCK */
verificarLogin();

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
  if (!selectAno || !perfil?.dados?.opcoesAnos) return;
  const anos = perfil.dados.opcoesAnos ?? [];
  const anosOrdenados = [...anos].sort((a, b) => b - a);

  anoSelecionado = anosOrdenados[0];
  selectAno.innerHTML = "";

  anosOrdenados.forEach((ano) => {
    selectAno.innerHTML += `
        <option value="${ano}" ${ano === anoSelecionado ? "selected" : ""}>
          ${ano}
        </option>
      `;
  });
}

/* API: LISTAR TURMAS */
async function buscarTurmas() {
  try {
    turmasList.innerHTML = `<p>Carregando turmas...</p>`;

    // REFACTOR: Substituído por requisicaoApi com tratamento de Token e 401 automático
    const response = await requisicaoApi(
      `${urlBase}api/professor/${perfil.dados.id_professor}/turmas?ano=${anoSelecionado}`,
    );
    const data = await response.json();

    renderizarTurmas(data.turmas);

    /* REABRIR ACCORDION APÓS REFRESH MANTENDO O ESTADO */
    if (accordionAberto) {
      const idTurma = accordionAberto.turma;
      const idDisciplina = accordionAberto.disciplina;
      const body = document.getElementById(`body-${idTurma}-${idDisciplina}`);

      if (body) {
        body.classList.add("active");
        const cacheKey = `${idTurma}-${idDisciplina}`;
        const header = document.querySelector(
          `.turma-header[data-turma="${idTurma}"][data-disciplina="${idDisciplina}"]`,
        );
        const fkTurmaDisciplina = header?.dataset.turmaDisciplina;

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
    console.error("Erro ao buscar turmas:", error);
    turmasList.innerHTML = `<p>Erro ao carregar turmas.</p>`;
  }
}

/* RENDER TURMAS */
function renderizarTurmas(turmas) {
  if (!turmasList) return;
  turmasList.innerHTML = "";

  turmas.forEach((turma) => {
    (turma.disciplinas ?? []).forEach((disciplina) => {
      turmasList.innerHTML += `
            <div class="turma-card">
              <div
                class="turma-header"
                data-turma="${turma.id_turma}"
                data-disciplina="${disciplina.id_disciplina}"
                data-turma-disciplina="${disciplina.id_turma_disciplina}"
              >
                <div class="turma-info">
                  <h3>${turma.cod_turma}</h3>
                  <p>${disciplina.disciplina} • ${turma.turno}</p>
                </div>
                <div class="turma-right">
                  <div class="info-pill">${disciplina.quantidade_alunos} alunos</div>
                  <i class="fa-solid fa-chevron-down"></i>
                </div>
              </div>
              <div class="turma-body" id="body-${turma.id_turma}-${disciplina.id_disciplina}">
                <div class="alunos-list">
                  <p>Carregando...</p>
                </div>
              </div>
            </div>
          `;
    });
  });

  adicionarEventosAccordion();
}

/* ACCORDION TRIGGER */
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
        accordionAberto = { turma: idTurma, disciplina: idDisciplina };
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

/* API: LISTAR ALUNOS DA TURMA */
async function buscarAlunos(idTurma, idDisciplina, fkTurmaDisciplina, body) {
  try {
    // REFACTOR: Substituído por requisicaoApi segura
    const response = await requisicaoApi(
      `${urlBase}api/turma/${idTurma}/alunos?disciplinaId=${idDisciplina}`,
    );
    const data = await response.json();

    const cacheKey = `${idTurma}-${idDisciplina}`;
    cacheTurmas[cacheKey] = data.alunos;

    renderizarAlunos(data.alunos, body, fkTurmaDisciplina);
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
  }
}

/* AUXILIARES DE ESTADO */
function obterStatus(aluno) {
  if (!aluno.notas || aluno.notas.length < 3) {
    return { texto: "Cursando", classe: "status-cursando" };
  }
  if (Number(aluno.media) >= 7) {
    return { texto: "Aprovado", classe: "status-aprovado" };
  }
  return { texto: "Reprovado", classe: "status-reprovado" };
}

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function podeEditarNota(dataCriacao) {
  const hoje = new Date();
  const criacao = new Date(dataCriacao);
  const diferenca = hoje - criacao;
  const dias = diferenca / (1000 * 60 * 60 * 24);
  return dias <= 2;
}

/* RENDER LINHAS DE ALUNOS */
function renderizarAlunos(alunos, body, fkTurmaDisciplina) {
  const container = body.querySelector(".alunos-list");
  container.innerHTML = "";

  (alunos ?? []).forEach((aluno) => {
    const status = obterStatus(aluno);

    const notas = (aluno.notas ?? [])
      .map((nota) => {
        const editavel = podeEditarNota(nota.data_criacao);
        const dataLimite = new Date(nota.data_criacao);
        dataLimite.setDate(dataLimite.getDate() + 2);

        return `
                <button class="nota-pill ${!editavel ? "locked" : ""}" 
                  title="${!editavel ? `Essa nota não pode mais ser editada. Praso encerrado em: ${formatarData(dataLimite)}` : "Editar nota"}"
                  data-id="${nota.id_nota}"
                >
                  ${!editavel ? `<i class="fa-solid fa-lock"></i>` : ""}
                  ${nota.valor_nota}
                </button>
              `;
      })
      .join("");

    const podeCadastrar = (aluno.notas ?? []).length < 3;

    container.innerHTML += `
        <div class="aluno-card">
          <div class="aluno-header">
            <div class="aluno-info">
              <h4>${aluno.nome_completo}</h4>
              <p>Matrícula: ${aluno.matricula}</p>
            </div>
            <div class="aluno-right">
              <div class="status-pill ${status.classe}">${status.texto}</div>
              <div class="media-pill">${Number(aluno.media).toFixed(2)}</div>
            </div>
          </div>
          <div class="notas-list">
            ${notas}
            ${
              podeCadastrar
                ? `
                  <button class="nota-pill add-nota" data-aluno="${aluno.id_aluno}" data-turma-disciplina="${fkTurmaDisciplina}">
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

/* REGISTRO DE EVENTOS (ABRIR FORMULÁRIOS) */
function adicionarEventosNotas() {
  /* BOTÃO ADICIONAR NOTA (+) */
  const btnsAdd = document.querySelectorAll(".add-nota");
  btnsAdd.forEach((btn) => {
    btn.addEventListener("click", () => {
      modoEdicao = false;
      if (btnExcluirNota) btnExcluirNota.classList.remove("active");
      modalTitle.innerText = "Nova Nota";
      btnSalvarNota.innerText = "Salvar Nota";

      notaEditando = {
        aluno: Number(btn.dataset.aluno),
        fkTurmaDisciplina: Number(btn.dataset.turmaDisciplina),
      };
      preencherDataAtual();

      abrirModal();
    });
  });

  /* CLIQUE NA PÍLULA DA NOTA (EDITAR) */
  const notas = document.querySelectorAll(
    ".nota-pill:not(.add-nota):not(.locked)",
  );
  notas.forEach((nota) => {
    nota.addEventListener("click", async () => {
      try {
        modoEdicao = true;
        modalTitle.innerText = "Editar Nota";
        if (btnExcluirNota) btnExcluirNota.classList.add("active");
        btnSalvarNota.innerText = "Salvar Alterações";

        // REFACTOR: Substituído por requisicaoApi segura com token
        const response = await requisicaoApi(
          `${urlBase}api/nota/${nota.dataset.id}`,
        );
        const data = await response.json();

        if (!data.sucesso) {
          showToast("Erro ao buscar dados da nota.", "error");
          return;
        }

        const notaData = data.nota;
        notaEditando = { id: notaData.id_nota };

        inputNota.value = notaData.valor_nota;
        inputDescricao.value = notaData.descricao;
        inputPeriodo.value = notaData.periodo_nota;
        inputData.value = notaData.data_aplicacao?.split("T")[0];

        abrirModal();
      } catch (error) {
        console.error("Erro ao carregar nota individual:", error);
        showToast("Erro ao carregar nota.", "error");
      }
    });
  });
}

/* CONTROLE DE MODAL */
function abrirModal() {
  if (modalOverlay) modalOverlay.classList.add("active");
}

function fecharModal() {
  if (modalOverlay) modalOverlay.classList.remove("active");
  if (btnExcluirNota) btnExcluirNota.classList.remove("active");
  limparModal();
}

function limparModal() {
  if (inputNota) inputNota.value = "";
  if (inputDescricao) inputDescricao.value = "";
  if (inputPeriodo) inputPeriodo.value = 1;
  if (inputData) inputData.value = "";

  preencherDataAtual();
}

function preencherDataAtual() {
  if (inputData) {
    const hoje = new Date();
    // O fuso horário local pode mudar a data, o jeito mais seguro e limpo no Brasil é:
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0"); // Meses começam em 0
    const dia = String(hoje.getDate()).padStart(2, "0");

    inputData.value = `${ano}-${mes}-${dia}`;
  }
}

/* API: SALVAR / EDITAR NOTA */
btnSalvarNota.addEventListener("click", async () => {
  try {
    const valorNota = Number(inputNota.value);

    /* COMPOSIÇÃO DOS OBRIGATÓRIOS */
    if (
      !inputNota.value ||
      !inputDescricao.value ||
      !inputPeriodo.value ||
      !inputData.value
    ) {
      showToast("Preencha todos os campos obrigatórios.", "warning");
      return;
    }

    if (valorNota > 10) {
      showToast("A nota máxima permitida é 10.", "warning");
      return;
    }

    if (valorNota < 0) {
      showToast("A nota mínima permitida é 0.", "warning");
      return;
    }

    let response;

    if (modoEdicao) {
      /* EDITAR REGISTRO */
      response = await requisicaoApi(`${urlBase}api/nota/${notaEditando.id}`, {
        method: "PUT",
        body: {
          valor_nota: valorNota,
          descricao: inputDescricao.value,
          periodo_nota: Number(inputPeriodo.value),
        },
      });
    } else {
      /* CRIAR NOVO REGISTRO */
      response = await requisicaoApi(`${urlBase}api/nota`, {
        method: "POST",
        body: {
          fk_turma_disciplina: notaEditando.fkTurmaDisciplina,
          fk_aluno: notaEditando.aluno,
          valor_nota: valorNota,
          descricao: inputDescricao.value,
          periodo_nota: Number(inputPeriodo.value),
          data_aplicacao: inputData.value,
        },
      });
    }

    const data = await response.json();

    /* CAPTURA INTELIGENTE DE ERROS DA API (PROPRIEDADE data.erro OU data.mensagem) */
    if (!data.sucesso) {
      // Se a API retornar {"erro": "..."}, exibe o erro. Senão, tenta data.mensagem ou o fallback padrão.
      const mensagemErro = data.erro || data.mensagem || "Erro ao salvar nota.";
      showToast(mensagemErro, "error");
      return;
    }

    showToast(
      modoEdicao ? "Nota alterada com sucesso!" : "Nota registrada no diário!",
    );
    fecharModal();

    /* COORDENAÇÃO DE ESTADO VISUAL */
    scrollPosicao = window.scrollY;

    /* LIMPEZA GERAL DE CACHE PARA FORÇAR RELOAD SINCRO */
    Object.keys(cacheTurmas).forEach((key) => {
      delete cacheTurmas[key];
    });
    await buscarTurmas();
  } catch (error) {
    console.error("Erro ao salvar nota no banco:", error);
    showToast("Erro interno de operação.", "error");
  }
});

/* API: EXCLUIR REGISTRO */
btnExcluirNota.addEventListener("click", async () => {
  try {
    const confirmar = confirm(
      "Deseja realmente excluir esta nota definitivamente?",
    );
    if (!confirmar) return;

    // REFACTOR: Usando wrapper com cabeçalho de autorização embutido
    const response = await requisicaoApi(
      `${urlBase}api/nota/${notaEditando.id}`,
      {
        method: "DELETE",
      },
    );

    const data = await response.json();

    if (!data.sucesso) {
      showToast(data.mensagem ?? "Erro ao remover nota.", "error");
      return;
    }

    showToast("Nota deletada com sucesso!");
    fecharModal();

    scrollPosicao = window.scrollY;
    Object.keys(cacheTurmas).forEach((key) => {
      delete cacheTurmas[key];
    });
    await buscarTurmas();
  } catch (error) {
    console.error("Erro ao tentar deletar nota:", error);
    showToast("Erro interno de comunicação.", "error");
  }
});

/* ALTERAÇÃO FILTRO DE ANO */
selectAno.addEventListener("change", async (event) => {
  anoSelecionado = event.target.value;
  Object.keys(cacheTurmas).forEach((key) => {
    delete cacheTurmas[key];
  });
  await buscarTurmas();
});

/* FECHAMENTO DE EVENTOS PASSIVOS */
closeModal.addEventListener("click", fecharModal);

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) fecharModal();
});

/* COMPORTAMENTO DE BARRA DE PESQUISA */
inputPesquisa.addEventListener("input", async () => {
  const valor = inputPesquisa.value.toLowerCase().trim();
  const headers = document.querySelectorAll(".turma-header");

  if (!valor) {
    const bodies = document.querySelectorAll(".turma-body");
    bodies.forEach((body) => {
      body.classList.remove("active");
    });
    accordionAberto = null;

    const alunos = document.querySelectorAll(".aluno-card");
    alunos.forEach((aluno) => {
      aluno.style.display = "";
    });
    return;
  }

  /* EXPANDE TODAS AS TURMAS ATIVAS PARA EXIBIR FILTROS */
  for (const header of headers) {
    const idTurma = header.dataset.turma;
    const idDisciplina = header.dataset.disciplina;
    const body = document.getElementById(`body-${idTurma}-${idDisciplina}`);

    if (!body.classList.contains("active")) {
      header.click();
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }

  /* EXECUTA O FILTRO EM LINHA */
  const alunos = document.querySelectorAll(".aluno-card");
  alunos.forEach((aluno) => {
    const texto = aluno.innerText.toLowerCase();
    aluno.style.display = texto.includes(valor) ? "" : "none";
  });
});

/* EXECUÇÃO INICIAL DO ESCOPO */
init();
