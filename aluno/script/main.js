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

/* STORAGE - Puxa o perfil com os dados do aluno e anos disponíveis */
const perfil = JSON.parse(localStorage.getItem("perfil"));

/* LOGOUT */
if (btnSair) {
  btnSair.addEventListener("click", logout);
}

/* STORAGE / CACHE CONTROL */
let anoSelecionado = null;

/* INIT */
async function init() {
  // 1. Alimenta o Select IMEDIATAMENTE usando os dados salvos no LocalStorage do perfil
  if (perfil && perfil.dados && perfil.dados.opcoesAnos) {
    preencherSelectAnos(perfil.dados.opcoesAnos);
  }

  // 2. Busca as disciplinas na API (já vai com o maior ano cravado pelo preencherSelectAnos)
  await buscarDisciplinas();
}

/* API */
async function buscarDisciplinas() {
  try {
    cardsDisciplinas.innerHTML = "<p>Carregando disciplinas...</p>";

    // Se já houver um anoSelecionado (definido pelo select), manda na URL.
    const url =
      `${urlBase}api/aluno/${perfil.dados.id_aluno}/disciplinas` +
      (anoSelecionado ? `?ano=${anoSelecionado}` : "");

    const response = await requisicaoApi(url);
    const data = await response.json();

    if (!data.sucesso) {
      cardsDisciplinas.innerHTML = "<p>Erro ao carregar disciplinas.</p>";
      return;
    }

    /* DISCIPLINAS */
    renderizarDisciplinas(data.disciplinas);
  } catch (error) {
    console.error(error);
    cardsDisciplinas.innerHTML = "<p>Erro interno ao carregar disciplinas.</p>";
  }
}

/* SELECT ANOS */
function preencherSelectAnos(anos) {
  if (!selectAno || !anos || !anos.length) return;
  selectAno.innerHTML = "";

  // Ordena do maior para o menor ano letivo (ex: 2026, 2025...)
  const anosOrdenados = [...anos].sort((a, b) => b - a);

  // REGRA: Se for a primeira carga (anoSelecionado vazio), crava o maior ano disponível do array
  if (!anoSelecionado) {
    anoSelecionado = anosOrdenados[0];
  }

  anosOrdenados.forEach((ano) => {
    selectAno.innerHTML += `
      <option value="${ano}" ${Number(ano) === Number(anoSelecionado) ? "selected" : ""}>
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
    cardsDisciplinas.innerHTML =
      "<p>Nenhuma disciplina encontrada para o ano selecionado.</p>";
    return;
  }

  disciplinas.forEach((disciplina) => {
    const status = obterStatus(disciplina.notes, disciplina.media);
    const mediaFormatada = disciplina.media
      ? Number(disciplina.media).toFixed(2)
      : "0.00";

    cardsDisciplinas.innerHTML += `
      <div class="subject-card default-card">
        <h3>${disciplina.disciplina}</h3>
        <p class="professor">Professor: ${disciplina.professor}</p>
        <p class="quantidade-notas">Quantidade de notas: ${disciplina.notes?.length ?? 0}/3</p>
        <div class="info-row">
          <div class="media">
            Média: <strong>${mediaFormatada}</strong>
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
