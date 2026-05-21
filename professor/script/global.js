// professor/global.js
import { redirecionar, verificarLogin } from "./../../script/funcs-global.js";

/* STORAGE */
const perfil = JSON.parse(localStorage.getItem("perfil"));

/* ELEMENTOS */
const nomeProfessor = document.getElementById("nome-professor");
const menuDashboard = document.getElementById("menu-dashboard");
const menuPerfil = document.getElementById("menu-perfil");
const menuLancarNotas = document.getElementById("menu-lancar-notas");
const menuTurmas = document.getElementById("menu-turmas");

function init() {
  verificarLogin();
  preencherProfessor();
}

function preencherProfessor() {
  if (nomeProfessor && perfil?.dados) {
    nomeProfessor.innerText = perfil.dados.nome_completo ?? "Professor";
  }
}

/* EVENTOS DE NAVEGAÇÃO */
if (menuDashboard)
  menuDashboard.addEventListener("click", () => redirecionar("professor/"));
if (menuPerfil)
  menuPerfil.addEventListener("click", () =>
    redirecionar("professor/perfil.html"),
  );
if (menuLancarNotas)
  menuLancarNotas.addEventListener("click", () =>
    redirecionar("professor/notas.html"),
  );
if (menuTurmas)
  menuTurmas.addEventListener("click", () =>
    redirecionar("professor/turmas.html"),
  );

init();
