import {
  logout,
  verificarLogin,
  redirecionar,
  showToast,
  requisicaoApi,
} from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

/* LOGIN */
verificarLogin();

/* STORAGE */
const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ELEMENTOS INFO */
const infoNome = document.getElementById("info-nome");
const infoMatricula = document.getElementById("info-matricula");
const infoNascimento = document.getElementById("info-nascimento");
const infoTelefone = document.getElementById("info-telefone");
const infoRua = document.getElementById("info-rua");
const infoNumero = document.getElementById("info-numero");
const infoBairro = document.getElementById("info-bairro");
const infoCep = document.getElementById("info-cep");
const infoCidade = document.getElementById("info-cidade");
const infoUf = document.getElementById("info-uf");

/* INIT */
async function init() {
  await buscarPerfil();
}

/* API REQUEST */
async function buscarPerfil() {
  try {
    // REFACTOR: Substituído fetch por requisicaoApi incluindo token automático
    const response = await requisicaoApi(
      `${urlBase}api/aluno/${perfil.dados.id_aluno}/perfil`,
    );
    const data = await response.json();

    if (!data.sucesso) {
      showToast("Erro ao carregar os dados do perfil.", "error");
      return;
    }

    preencherDados(data.aluno);
  } catch (error) {
    console.error(error);
    showToast("Erro interno ao carregar perfil.", "error");
  }
}

function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function preencherDados(aluno) {
  if (!infoNome) return; // Trava de segurança para o DOM

  infoNome.innerText = aluno.nome_completo ?? "-";
  infoMatricula.innerText = aluno.matricula ?? "-";
  infoNascimento.innerText = formatarData(aluno.data_nacimento);
  infoTelefone.innerText = aluno.telefones?.length
    ? aluno.telefones.join(" • ")
    : "-";
  infoRua.innerText = aluno.endereco?.rua ?? "-";
  infoNumero.innerText = aluno.endereco?.numero ?? "-";
  infoBairro.innerText = aluno.endereco?.bairro ?? "-";
  infoCep.innerText = aluno.endereco?.cep ?? "-";
  infoCidade.innerText = aluno.endereco?.cidade ?? "-";
  infoUf.innerText = aluno.endereco?.uf ?? "-";
}

/* START */
init();
