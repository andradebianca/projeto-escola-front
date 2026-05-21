import {
  logout,
  verificarLogin,
  requisicaoApi,
} from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

/* LOGIN */
verificarLogin();

/* ELEMENTOS */
const cardsDisciplinas = document.getElementById("cards-disciplinas");
const selectAno = document.getElementById("select-ano");
const btnSair = document.getElementById("btn-sair");

/* STORAGE */
const perfil = JSON.parse(localStorage.getItem("perfil"));

/* LOGOUT */
if (btnSair) {
  btnSair.addEventListener("click", logout);
}

/* ANO */
let anoSelecionado = 2025;

/* INIT */
async function init() {
  await buscarDisciplinas();
}

/* API */
async function buscarDisciplinas() {
  try {
    cardsDisciplinas.innerHTML = "<p>Carregando disciplinas...</p>";

    // REFACTOR: Utilizando a função centralizada com injeção automática de JWT
    const response = await requisicaoApi(
      `${urlBase}api/aluno/${perfil.dados.id_aluno}/disciplinas?ano=${anoSelecionado}`,
    );
    const data = await response.json();

    if (!data.sucesso) {
      cardsDisciplinas.innerHTML = "<p>Erro ao carregar disciplinas.</p>";
      return;
    }

    /* SELECT */
    preencherSelectAnos(data.aluno.opcoesAnos);

    /* DISCIPLINAS */
    renderizarDisciplinas(data.disciplinas);
  } catch (error) {
    console.error(error);
    cardsDisciplinas.innerHTML = "<p>Erro interno ao carregar disciplinas.</p>";
  }
}

/* SELECT ANOS */
function preencherSelectAnos(anos) {
  if (!selectAno || !anos) return;
  selectAno.innerHTML = "";

  const anosOrdenados = [...anos].sort((a, b) => b - a);
  anoSelecionado = anosOrdenados[0];

  anosOrdenados.forEach((ano) => {
    selectAno.innerHTML += `
      <option value="${ano}" ${ano === anoSelecionado ? "selected" : ""}>
        ${ano}
      </option>
    `;
  });
}

/* STATUS */
function obterStatus(notes, media) {
  if (!notes || notes.length < 3) {
    return { texto: "Cursando", classe: "status-cursando" };
  }

  if (Number(media) >= 7) {
    return { texto: "Aprovado", classe: "status-aprovado" };
  }

  return { texto: "Reprovado", classe: "status-reprovado" };
}

/* RENDER */
function renderizarDisciplinas(disciplinas) {
  cardsDisciplinas.innerHTML = "";

  if (!disciplinas || !disciplinas.length) {
    cardsDisciplinas.innerHTML = "<p>Nenhuma disciplina encontrada.</p>";
    return;
  }

  disciplinas.forEach((disciplina) => {
    const status = obterStatus(disciplina.notes, disciplina.media);

    cardsDisciplinas.innerHTML += `
      <div class="subject-card default-card">
        <h3>${disciplina.disciplina}</h3>
        <p class="professor">Professor: ${disciplina.professor}</p>
        <p class="quantidade-notas">Quantidade de notas: ${disciplina.notes?.length ?? 0}/3</p>
        <div class="info-row">
          <div class="media">
            Média: <strong>${Number(disciplina.media).toFixed(2)}</strong>
          </div>
          <div class="status ${status.classe}">${status.texto}</div>
        </div>
      </div>
    `;
  });
}

/* ALTERAÇÃO ANO */
if (selectAno) {
  selectAno.addEventListener("change", async (event) => {
    anoSelecionado = event.target.value;
    await buscarDisciplinas();
  });
}

/* START */
init();
