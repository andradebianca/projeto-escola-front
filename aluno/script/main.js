import { logout, verificarLogin } from "./../../script/funcs-global.js";

import { urlBase } from "./../../script/variaveis-globais.js";

/* LOGIN */

verificarLogin();

/* ELEMENTOS */

const nomeAluno = document.getElementById("nome-aluno");

const matriculaAluno = document.getElementById("matricula-aluno");

const cardsDisciplinas = document.getElementById("cards-disciplinas");

const selectAno = document.getElementById("select-ano");

const btnSair = document.getElementById("btn-sair");

/* STORAGE */

const perfil = JSON.parse(localStorage.getItem("perfil"));

const usuario = JSON.parse(localStorage.getItem("usuario"));

/* LOGOUT */

btnSair.addEventListener("click", logout);

/* ANO */

let anoSelecionado = 2025;

/* INIT */

async function init() {
  preencherAluno();

  await buscarDisciplinas();
}

/* ALUNO */

function preencherAluno() {
  nomeAluno.innerText = perfil.dados.nome_completo;

  matriculaAluno.innerText = perfil.dados.id_aluno;
}

/* API */

async function buscarDisciplinas() {
  try {
    cardsDisciplinas.innerHTML = "<p>Carregando disciplinas...</p>";

    const response = await fetch(
      `${urlBase}api/aluno/${perfil.dados.id_aluno}/disciplinas?ano=${anoSelecionado}`,
    );

    const data = await response.json();

    console.log(data);

    if (!data.sucesso) {
      cardsDisciplinas.innerHTML = "<p>Erro ao carregar disciplinas.</p>";

      return;
    }

    renderizarDisciplinas(data.disciplinas);
  } catch (error) {
    console.error(error);

    cardsDisciplinas.innerHTML = "<p>Erro interno.</p>";
  }
}

/* RENDER */

function renderizarDisciplinas(disciplinas) {
  cardsDisciplinas.innerHTML = "";

  if (!disciplinas.length) {
    cardsDisciplinas.innerHTML = "<p>Nenhuma disciplina encontrada.</p>";

    return;
  }

  disciplinas.forEach((disciplina) => {
    cardsDisciplinas.innerHTML += `

      <div class="subject-card default-card">

        <h3>
          ${disciplina.disciplina}
        </h3>

        <p>
          Professor:
          ${disciplina.professor}
        </p>

      </div>

    `;
  });
}

/* ALTERAÇÃO ANO */

selectAno.addEventListener("change", async (event) => {
  anoSelecionado = event.target.value;

  await buscarDisciplinas();
});

/* START */

init();
