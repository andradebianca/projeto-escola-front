// aluno/global.js
import { logout, redirecionar } from "./../../script/funcs-global.js";

/* STORAGE */
const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ELEMENTOS */
const dashboard = document.getElementById("dashboard");
const dadosPessoais = document.getElementById("dados-pessoais");
const boletim = document.getElementById("boletins");
const btnSair = document.getElementById("btn-sair");
const nomeAluno = document.getElementById("nome-aluno");
const matriculaAluno = document.getElementById("matricula-aluno");

/* SIDEBAR */
export function preencherSidebar() {
  if (!perfil) return;

  if (nomeAluno) {
    nomeAluno.innerText = perfil.dados?.nome_completo ?? "-";
  }

  if (matriculaAluno) {
    matriculaAluno.innerText = perfil.dados?.matricula ?? "-";
  }
}

/* EVENTOS */
if (dashboard) {
  dashboard.addEventListener("click", () => redirecionar("aluno/"));
}

if (dadosPessoais) {
  dadosPessoais.addEventListener("click", () =>
    redirecionar("aluno/perfil.html"),
  );
}

if (btnSair) {
  btnSair.addEventListener("click", logout);
}

// CORRIGIDO: Vinculado corretamente à variável 'boletim' declarada no topo
if (boletim) {
  boletim.addEventListener("click", () => redirecionar("aluno/notas.html"));
}

/* INIT */
preencherSidebar();
