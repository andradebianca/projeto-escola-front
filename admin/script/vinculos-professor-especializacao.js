import { requisicaoApi, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const selectProfessor = document.getElementById("filtro-professor");
const selectEspecializacao = document.getElementById("filtro-especializacao");
const btnVincular = document.getElementById("btn-vincular");
const btnRecarregar = document.getElementById("btn-recarregar");
const recordsList = document.getElementById("records-list");
const detailsOverlay = document.getElementById("details-overlay");
const detailsGrid = document.getElementById("details-grid");
const closeDetailsModal = document.getElementById("close-details-modal");

let professores = [];
let especializacoes = [];
let vinculos = [];

async function carregarBases() {
  try {
    const [resProfessores, resEspecializacoes] = await Promise.all([
      requisicaoApi(`${urlBase}api/admin/professor`),
      requisicaoApi(`${urlBase}api/admin/especializacao`),
    ]);

    const [dadosProfessores, dadosEspecializacoes] = await Promise.all([
      resProfessores.json(),
      resEspecializacoes.json(),
    ]);

    if (!dadosProfessores?.sucesso || !dadosEspecializacoes?.sucesso) {
      showToast("Erro ao carregar bases de vinculo.", "error");
      return;
    }

    professores = dadosProfessores.professores || [];
    especializacoes = dadosEspecializacoes.especializacoes || [];

    preencherSelects();
  } catch (error) {
    console.error("Erro ao carregar bases:", error);
    showToast("Erro interno ao carregar dados de vinculo.", "error");
  }
}

function preencherSelects() {
  const professorAtual = selectProfessor.value;
  const especializacaoAtual = selectEspecializacao.value;

  selectProfessor.innerHTML = '<option value="">Selecione o professor...</option>';
  professores.forEach((professor) => {
    selectProfessor.innerHTML += `
      <option value="${professor.id_professor}">${professor.nome_completo}</option>
    `;
  });

  selectEspecializacao.innerHTML =
    '<option value="">Selecione a especializacao...</option>';
  especializacoes.forEach((especializacao) => {
    selectEspecializacao.innerHTML += `
      <option value="${especializacao.id_especializacao}">${especializacao.nome}</option>
    `;
  });

  selectProfessor.value = professorAtual || "";
  selectEspecializacao.value = especializacaoAtual || "";
}

function professorSelecionado() {
  return professores.find(
    (item) => Number(item.id_professor) === Number(selectProfessor.value),
  );
}

function renderizarVinculos() {
  recordsList.innerHTML = "";

  if (!selectProfessor.value) {
    recordsList.innerHTML = "<p>Selecione um professor para ver os vinculos.</p>";
    return;
  }

  if (!vinculos.length) {
    recordsList.innerHTML = "<p>Nenhuma especializacao vinculada para este professor.</p>";
    return;
  }

  vinculos.forEach((vinculo) => {
    recordsList.innerHTML += `
      <article class="record-row">
        <div class="record-main">
          <h3>${vinculo.nome}</h3>
          <p>${vinculo.descricao || "Sem descricao"}</p>
        </div>

        <div class="status-pill">${vinculo.carga_horaria || 0}h</div>

        <div class="record-actions">
          <button class="action-btn details" data-action="detalhes" data-id="${vinculo.id}">Detalhes</button>
          <button class="action-btn remove" data-action="remover" data-id="${vinculo.id}">Remover</button>
        </div>
      </article>
    `;
  });
}

async function buscarVinculos() {
  if (!selectProfessor.value) {
    vinculos = [];
    renderizarVinculos();
    return;
  }

  try {
    recordsList.innerHTML = "<p>Carregando vinculos...</p>";

    const response = await requisicaoApi(
      `${urlBase}api/admin/professor/${selectProfessor.value}/especializacao`,
    );
    const data = await response.json();

    if (!data?.sucesso) {
      recordsList.innerHTML = "<p>Erro ao carregar vinculos.</p>";
      return;
    }

    vinculos = data.especializacoes || [];
    renderizarVinculos();
  } catch (error) {
    console.error("Erro ao buscar vinculos:", error);
    recordsList.innerHTML = "<p>Erro interno ao carregar vinculos.</p>";
  }
}

async function vincularEspecializacao() {
  const idProfessor = Number(selectProfessor.value);
  const fk_especializacao = Number(selectEspecializacao.value);

  if (!idProfessor || !fk_especializacao) {
    showToast("Selecione professor e especializacao.", "warning");
    return;
  }

  try {
    const response = await requisicaoApi(
      `${urlBase}api/admin/professor/${idProfessor}/especializacao`,
      {
        method: "POST",
        body: { fk_especializacao },
      },
    );

    const data = await response.json();

    if (!data?.sucesso) {
      showToast(data?.erro || "Erro ao vincular especializacao.", "error");
      return;
    }

    showToast("Especializacao vinculada com sucesso!");
    await buscarVinculos();
  } catch (error) {
    console.error("Erro ao vincular especializacao:", error);
    showToast("Erro interno ao vincular especializacao.", "error");
  }
}

function abrirDetalhes(vinculo) {
  const professor = professorSelecionado();

  detailsGrid.innerHTML = `
    <div class="detail-item full">
      <span>Especializacao</span>
      <p>${vinculo.nome}</p>
    </div>
    <div class="detail-item">
      <span>Carga Horaria</span>
      <p>${vinculo.carga_horaria || 0}h</p>
    </div>
    <div class="detail-item">
      <span>Professor</span>
      <p>${professor?.nome_completo || "-"}</p>
    </div>
    <div class="detail-item full">
      <span>Descricao</span>
      <p>${vinculo.descricao || "Sem descricao"}</p>
    </div>
  `;

  detailsOverlay.classList.add("active");
}

async function removerVinculo(vinculo) {
  const idProfessor = Number(selectProfessor.value);
  if (!idProfessor) return;

  const confirmar = confirm("Deseja remover este vinculo de especializacao?");
  if (!confirmar) return;

  try {
    const response = await requisicaoApi(
      `${urlBase}api/admin/professor/${idProfessor}/especializacao/${vinculo.id}`,
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
    await buscarVinculos();
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

  const vinculo = vinculos.find((item) => Number(item.id) === idVinculo);
  if (!vinculo) return;

  if (acao === "detalhes") {
    abrirDetalhes(vinculo);
    return;
  }

  if (acao === "remover") {
    removerVinculo(vinculo);
  }
});

selectProfessor.addEventListener("change", buscarVinculos);
btnVincular.addEventListener("click", vincularEspecializacao);
btnRecarregar.addEventListener("click", buscarVinculos);

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
  await buscarVinculos();
}

init();
