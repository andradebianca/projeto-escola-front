import { redirecionar, showToast } from "./../../script/funcs-global.js";

import { urlBase } from "./../../script/variaveis-globais.js";

const btnEntrar = document.getElementById("btn-entrar");

const btnPrimeiroAcesso = document.getElementById("first-access");

const inputEmail = document.getElementById("email");

const inputSenha = document.getElementById("senha");

/* LOGIN */

async function logar() {
  try {
    const email = inputEmail.value.trim();

    const senha = inputSenha.value.trim();

    /* VALIDAÇÃO */

    if (!email || !senha) {
      showToast("Preencha email e senha.", "warning");

      return;
    }

    /* REQUEST */

    const response = await fetch(`${urlBase}api/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
        senha,
      }),
    });

    const data = await response.json();

    /* ERRO */

    if (!data.sucesso) {
      showToast("Email ou senha inválidos.", "error");

      return;
    }

    /* STORAGE */

    localStorage.setItem("logado", "true");

    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    localStorage.setItem("perfil", JSON.stringify(data.perfil));

    /* REDIRECT */

    const tipo = data.perfil?.tipo;

    switch (tipo) {
      case "aluno":
        redirecionar("aluno/");

        break;

      case "professor":
        redirecionar("professor/");

        break;

      default:
        /* ADM */

        if (data.usuario?.nivel_acesso === 1) {
          redirecionar("admin/");

          return;
        }

        redirecionar("");

        break;
    }
  } catch (error) {
    console.error(error);

    showToast("Erro ao realizar login.", "error");
  }
}

/* TOGGLE PASSWORD */

const togglePassword = document.getElementById("toggle-password");

if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const isPassword = inputSenha.type === "password";

    inputSenha.type = isPassword ? "text" : "password";

    togglePassword.classList.toggle("fa-eye");

    togglePassword.classList.toggle("fa-eye-slash");
  });
}

/* EVENT */

if (btnEntrar) {
  btnEntrar.addEventListener("click", logar);
}

if (btnPrimeiroAcesso)
  btnPrimeiroAcesso.addEventListener("click", () =>
    redirecionar("login/primeiro-acesso.html"),
  );
