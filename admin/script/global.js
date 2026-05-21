import {
  logout,
  redirecionar,
  showToast,
  verificarLogin,
} from "./../../script/funcs-global.js";

const usuario = JSON.parse(localStorage.getItem("usuario"));
const perfil = JSON.parse(localStorage.getItem("perfil"));

const nomeAdmin = document.getElementById("nome-admin");
const emailAdmin = document.getElementById("email-admin");
const btnSair = document.getElementById("btn-sair");

const menuMap = {
  "menu-dashboard": "admin/",
  "menu-alunos": "admin/alunos.html",
  "menu-professores": "admin/professores.html",
  "menu-turmas": "admin/turmas.html",
  "menu-disciplinas": "admin/disciplinas.html",
  "menu-especializacoes": "admin/especializacoes.html",
  "menu-enderecos": "admin/enderecos.html",
  "menu-telefones-aluno": "admin/telefones-aluno.html",
  "menu-telefones-professor": "admin/telefones-professor.html",
  "menu-vinculos-turma-disciplina": "admin/vinculos-turma-disciplina.html",
  "menu-vinculos-professor-especializacao": "admin/vinculos-professor-especializacao.html",
};

function usuarioEhAdmin() {
  return Number(usuario?.nivel_acesso) === 1;
}

export function validarPermissaoAdmin() {
  verificarLogin();

  if (!usuarioEhAdmin()) {
    showToast("Acesso permitido apenas para administradores.", "warning");

    setTimeout(() => {
      logout();
    }, 1200);

    return false;
  }

  return true;
}

function preencherSidebar() {
  if (!nomeAdmin || !emailAdmin) return;

  const nome =
    perfil?.dados?.nome_completo ?? usuario?.user_name ?? "Administrador";

  const email = usuario?.email ?? "admin@escola";

  nomeAdmin.innerText = nome;
  emailAdmin.innerText = email;
}

function vincularMenus() {
  Object.entries(menuMap).forEach(([id, destino]) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener("click", () => {
      redirecionar(destino);
    });
  });
}

if (btnSair) {
  btnSair.addEventListener("click", logout);
}

if (validarPermissaoAdmin()) {
  preencherSidebar();
  vincularMenus();
}
