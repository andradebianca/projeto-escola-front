import {
  logout,
  verificarLogin,
  redirecionar,
} from "./../../script/funcs-global.js";

verificarLogin();

const usuario = JSON.parse(localStorage.getItem("usuario"));
const perfil = JSON.parse(localStorage.getItem("perfil"));

// Configuração do motor de renderização da barra lateral enxuta
function renderizarSidebarEfetiva() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  const nome =
    perfil?.dados?.nome_completo ?? usuario?.user_name ?? "Administrador";
  const email = usuario?.email ?? "admin@escola.com";

  sidebar.innerHTML = `
    <div class="profile">

    <div class="avatar">
      <i class="fa-solid fa-user-shield"></i>
    </div>

    <h2>${nome}</h2>

    <span>${email}</span>

  </div>

  <nav class="menu">

    <!-- DASHBOARD -->
    <button class="menu-btn" id="menu-dashboard">

      <div class="menu-btn-left">
        <i class="fa-solid fa-table-columns"></i>
        <span>Dashboard</span>
      </div>

    </button>

    <!-- USUÁRIOS -->
    <div class="menu-group" id="grp-usuarios">

      <button class="menu-btn trigger-submenu">

        <div class="menu-btn-left">
          <i class="fa-solid fa-user-gear"></i>
          <span>Usuários</span>
        </div>

        <i class="fa-solid fa-chevron-down menu-arrow"></i>

      </button>

      <div class="submenu">

        <button class="submenu-btn" id="menu-alunos">

          <div class="submenu-btn-left">
            <i class="fa-solid fa-user-graduate"></i>
            <span>Alunos</span>
          </div>

        </button>

        <button class="submenu-btn" id="menu-professores">

          <div class="submenu-btn-left">
            <i class="fa-solid fa-user-tie"></i>
            <span>Professores</span>
          </div>

        </button>

      </div>

    </div>

    <!-- ACADÊMICO -->
    <div class="menu-group" id="grp-academico">

      <button class="menu-btn trigger-submenu">

        <div class="menu-btn-left">
          <i class="fa-solid fa-graduation-cap"></i>
          <span>Acadêmico</span>
        </div>

        <i class="fa-solid fa-chevron-down menu-arrow"></i>

      </button>

      <div class="submenu">

        <button class="submenu-btn" id="menu-turmas">

          <div class="submenu-btn-left">
            <i class="fa-solid fa-users-rectangle"></i>
            <span>Turmas</span>
          </div>

        </button>

        <button class="submenu-btn" id="menu-disciplinas">

          <div class="submenu-btn-left">
            <i class="fa-solid fa-book"></i>
            <span>Disciplinas</span>
          </div>

        </button>

        <button class="submenu-btn" id="menu-vinculos">

          <div class="submenu-btn-left">
            <i class="fa-solid fa-link"></i>
            <span>Vincular Turma x Disc.</span>
          </div>

        </button>

      </div>

    </div>

    <!-- PARÂMETROS -->
    <div class="menu-group" id="grp-parametros">

      <button class="menu-btn trigger-submenu">

        <div class="menu-btn-left">
          <i class="fa-solid fa-sliders"></i>
          <span>Parâmetros</span>
        </div>

        <i class="fa-solid fa-chevron-down menu-arrow"></i>

      </button>

      <div class="submenu">

        <button class="submenu-btn" id="menu-especializacoes">

          <div class="submenu-btn-left">
            <i class="fa-solid fa-award"></i>
            <span>Especializações</span>
          </div>

        </button>

        <button class="submenu-btn" id="menu-relatorios">

          <div class="submenu-btn-left">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>Logs do Sistema</span>
          </div>

        </button>

      </div>

    </div>

  </nav>
  `;

  ativarItemMenuCorrente();
  configurarCliquesNavegacao();
}

function ativarItemMenuCorrente() {
  const path = window.location.pathname;

  // Limpa estados ativos prévios
  document
    .querySelectorAll(".menu-btn, .submenu-btn")
    .forEach((el) => el.classList.remove("active"));

  if (path.includes("alunos.html")) {
    document.getElementById("menu-alunos")?.classList.add("active");
    document.getElementById("grp-usuarios")?.classList.add("open");
  } else if (path.includes("professores.html")) {
    document.getElementById("menu-professores")?.classList.add("active");
    document.getElementById("grp-usuarios")?.classList.add("open");
  } else if (path.includes("turmas.html")) {
    document.getElementById("menu-turmas")?.classList.add("active");
    document.getElementById("grp-academico")?.classList.add("open");
  } else if (path.includes("disciplinas.html")) {
    document.getElementById("menu-disciplinas")?.classList.add("active");
    document.getElementById("grp-academico")?.classList.add("open");
  } else if (path.includes("vinculos-turma-disciplina.html")) {
    document.getElementById("menu-vinculos")?.classList.add("active");
    document.getElementById("grp-academico")?.classList.add("open");
  } else if (path.includes("especializacoes.html")) {
    document.getElementById("menu-especializacoes")?.classList.add("active");
    document.getElementById("grp-parametros")?.classList.add("open");
  } else if (path.includes("relatorios.html")) {
    document.getElementById("menu-relatorios")?.classList.add("active");
    document.getElementById("grp-parametros")?.classList.add("open");
  } else {
    document.getElementById("menu-dashboard")?.classList.add("active");
  }
}

function configurarCliquesNavegacao() {
  const rotas = {
    "menu-dashboard": "admin/",
    "menu-alunos": "admin/alunos.html",
    "menu-professores": "admin/professores.html",
    "menu-turmas": "admin/turmas.html",
    "menu-disciplinas": "admin/disciplinas.html",
    "menu-vinculos": "admin/vinculos-turma-disciplina.html",
    "menu-especializacoes": "admin/especializacoes.html",
    "menu-relatorios": "admin/relatorios.html",
  };

  Object.entries(rotas).forEach(([id, target]) => {
    document
      .getElementById(id)
      ?.addEventListener("click", () => redirecionar(target));
  });

  // Gatilho do comportamento Sanfona (Acordeão)
  document.querySelectorAll(".trigger-submenu").forEach((btn) => {
    btn.addEventListener("click", () => {
      const currentGroup = btn.closest(".menu-group");
      currentGroup.classList.toggle("open");
    });
  });

  document.getElementById("btn-sair")?.addEventListener("click", logout);
}

// Inicialização imediata ao carregar a árvore DOM
if (Number(usuario?.nivel_acesso) === 1) {
  document.addEventListener("DOMContentLoaded", renderizarSidebarEfetiva);
} else {
  logout();
}
