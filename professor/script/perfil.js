import { verificarLogin, showToast } from "./../../script/funcs-global.js";

import { urlBase } from "./../../script/variaveis-globais.js";

/* LOGIN */

verificarLogin();

/* STORAGE */

const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ELEMENTOS */

const infoNome = document.getElementById("info-nome");

const infoNascimento = document.getElementById("info-nascimento");

const infoTelefone = document.getElementById("info-telefone");

const infoRua = document.getElementById("info-rua");

const infoNumero = document.getElementById("info-numero");

const infoBairro = document.getElementById("info-bairro");

const infoCep = document.getElementById("info-cep");

const infoCidade = document.getElementById("info-cidade");

const infoUf = document.getElementById("info-uf");

const especializacoesGrid = document.getElementById("especializacoes-grid");

/* INIT */

async function init() {
  await buscarPerfil();
}

/* API */

async function buscarPerfil() {
  try {
    const response = await fetch(
      `${urlBase}api/professor/${perfil.dados.id_professor}/perfil`,
    );

    const data = await response.json();

    console.log(data);

    if (!data.sucesso) {
      showToast("Erro ao carregar perfil.", "error");

      return;
    }

    preencherDados(data.professor);
  } catch (error) {
    console.error(error);

    showToast("Erro interno.", "error");
  }
}

/* DATA */

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

/* PREENCHER */

function preencherDados(professor) {
  infoNome.innerText = professor.nome_completo;

  infoNascimento.innerText = formatarData(professor.data_nacimento);

  infoTelefone.innerText = professor.telefones?.join(" • ") ?? "-";

  infoRua.innerText = professor.endereco?.rua ?? "-";

  infoNumero.innerText = professor.endereco?.numero ?? "-";

  infoBairro.innerText = professor.endereco?.bairro ?? "-";

  infoCep.innerText = professor.endereco?.cep ?? "-";

  infoCidade.innerText = professor.endereco?.cidade ?? "-";

  infoUf.innerText = professor.endereco?.uf ?? "-";

  renderizarEspecializacoes(professor.especializacoes);
}

/* ESPECIALIZAÇÕES */

function renderizarEspecializacoes(especializacoes) {
  especializacoesGrid.innerHTML = "";

  especializacoes.forEach((especializacao) => {
    especializacoesGrid.innerHTML += `

        <div class="especializacao-card">

          <h4>
            ${especializacao.nome}
          </h4>

          <p>
            ${especializacao.descricao}
          </p>

          <div class="especializacao-footer">

            <div class="carga-pill">

              ${especializacao.carga_horaria}h

            </div>

          </div>

        </div>

      `;
  });
}

/* START */

init();
