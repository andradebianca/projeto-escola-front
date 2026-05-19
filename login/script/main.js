import { redirecionar } from "./../../script/funcs-global.js";

import { urlBase } from "./../../script/variaveis-globais.js";

const btnEntrar = document.getElementById("btn-entrar");

const inputEmail = document.getElementById("email");

const inputSenha = document.getElementById("senha");

/* LOGIN */

async function logar() {
  try {
    const email = inputEmail.value.trim();

    const senha = inputSenha.value.trim();

    /* VALIDAÇÃO */

    if (!email || !senha) {
      alert("Preencha email e senha.");

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

    /* ERRO LOGIN */

    if (!data.sucesso) {
      alert("Email ou senha inválidos.");

      return;
    }

    /* STORAGE */

    localStorage.setItem("logado", true);

    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    localStorage.setItem("perfil", JSON.stringify(data.perfil));

    /* REDIRECIONAMENTO */

    if (!data.perfil) {
      /*
        ADM
      */

      switch (data.usuario.nivel_acesso) {
        case 1:
          redirecionar("admin/");
          break;

        default:
          redirecionar("");
          break;
      }

      return;
    }

    /* ALUNO */

    if (data.perfil.tipo === "aluno") {
      redirecionar("aluno/");

      return;
    }

    /* PROFESSOR */

    if (data.perfil.tipo === "professor") {
      redirecionar("professor/");

      return;
    }

    /* FALLBACK */

    redirecionar("");
  } catch (error) {
    console.error(error);

    alert("Erro ao realizar login.");
  }
}

/* EVENT */

if (btnEntrar) {
  btnEntrar.addEventListener("click", logar);
}
