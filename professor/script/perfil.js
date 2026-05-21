// professor/perfil.js
import {
  verificarLogin,
  showToast,
  requisicaoApi,
} from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

/* LOGIN LOCK */
verificarLogin();

/* STORAGE */
const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ELEMENTOS DOM */
const infoNome = document.getElementById("info-nome");
const infoNascimento = document.getElementById("info-nascimento");
const infoTelefone = document.getElementById("info-telefone");
const infoRua = document.getElementById("info-rua");
const infoNumero = document.getElementById("info-numero");
const infoBairro = document.getElementById("info-bairro");
const infoCep = document.getElementById("info-cep");
const infoCidade = document.getElementById("info-cidade");
const infoUf = document.getElementById("info-uf");
const freakingGrid = document.getElementById("especializacoes-grid");

/* INIT */
async function init() {
  await buscarPerfil();
}

/* API REQUEST (TOKEN SEGURO) */
async function buscarPerfil() {
  try {
    // REFACTOR: Substituição do fetch comum pelo interceptor de sessão e JWT
    const response = await requisicaoApi(
      `${urlBase}api/professor/${perfil.dados.id_professor}/perfil`,
    );
    const data = await response.json();

    if (!data.sucesso) {
      showToast("Erro ao carregar dados do perfil.", "error");
      return;
    }

    preencherDados(data.professor);
  } catch (error) {
    console.error("Erro na busca de perfil do professor:", error);
    showToast("Erro interno de conexão.", "error");
  }
}

function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

/* ATRIBUIÇÃO AO LAYOUT GRID */
function preencherDados(professor) {
  if (!professor || !infoNome) return;

  infoNome.innerText = professor.nome_completo ?? "-";
  infoNascimento.innerText = formatarData(professor.data_nacimento);
  infoTelefone.innerText = professor.telefones?.join(" • ") ?? "-";

  // Encadeamento defensivo contra falhas no objeto de endereço
  infoRua.innerText = professor.endereco?.rua ?? "-";
  infoNumero.innerText = professor.endereco?.numero ?? "-";
  infoBairro.innerText = professor.endereco?.bairro ?? "-";
  infoCep.innerText = professor.endereco?.cep ?? "-";
  infoCidade.innerText = professor.endereco?.cidade ?? "-";
  infoUf.innerText = professor.endereco?.uf ?? "-";

  renderizarEspecializacoes(professor.especializacoes ?? []);
}

/* CARDS DE PÓS / MBA / MESTRADO */
function renderizarEspecializacoes(especializacoes) {
  if (!freakingGrid) return;
  freakingGrid.innerHTML = "";

  if (!especializacoes.length) {
    freakingGrid.innerHTML =
      "<p class='loading-details'>Nenhuma especialização cadastrada.</p>";
    return;
  }

  especializacoes.forEach((especializacao) => {
    freakingGrid.innerHTML += `
      <div class="especializacao-card">
        <h4>${especializacao.nome}</h4>
        <p>${especializacao.descricao ?? "Sem descrição detalhada."}</p>
        <div class="especializacao-footer">
          <div class="carga-pill">${especializacao.carga_horaria}h</div>
        </div>
      </div>
    `;
  });
}

/* START */
init();
