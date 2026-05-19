import { redirecionar } from "./../../script/funcs-global.js";

const btnEntrar = document.getElementById("btn-entrar");

function logar(user, senha) {
  localStorage.setItem("logado", true);

  redirecionar("aluno/");
}

if (btnEntrar) btnEntrar.addEventListener("click", logar);
