import { redirecionar, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const btnEntrar = document.getElementById("btn-entrar");
const btnPrimeiroAcesso = document.getElementById("first-access");
const inputEmail = document.getElementById("email");
const inputSenha = document.getElementById("senha");

/* LOGIN REFACTOR WITH JWT TOKEN */
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

    /* TRATAMENTO DE ERRO COM BASE NA RESPOSTA */
    if (!data.sucesso) {
      if (data.primeiroAcesso) {
        showToast(data.mensagem, "warning");

        return;
      }
      showToast(data.mensagem || "Email ou senha inválidos.", "error");
      return;
    }

    /* NOVO STORAGE BASEADO EM JWT TOKEN */
    localStorage.setItem("logado", "true");
    localStorage.setItem("token", data.token); // Salvando o JWT Bearer Token
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    localStorage.setItem("perfil", JSON.stringify(data.perfil));

    /* REDIRECIONAMENTO INTELIGENTE */
    const tipo = data.perfil?.tipo;
    const nivelAcesso = data.usuario?.nivel_acesso;

    // Se o nível de acesso for 1, assume rota de Administrador imediatamente
    if (nivelAcesso === 1) {
      redirecionar("admin/");
      return;
    }

    switch (tipo) {
      case "aluno":
        redirecionar("aluno/");
        break;

      case "professor":
        redirecionar("professor/");
        break;

      default:
        redirecionar("");
        break;
    }
  } catch (error) {
    console.error("Erro na requisição de login:", error);
    showToast("Erro ao conectar com o servidor.", "error");
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

/* EVENTS */
if (btnEntrar) {
  btnEntrar.addEventListener("click", logar);
}

if (btnPrimeiroAcesso) {
  btnPrimeiroAcesso.addEventListener("click", () =>
    redirecionar("login/primeiro-acesso.html"),
  );
}
