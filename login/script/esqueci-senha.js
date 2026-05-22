import {
  requisicaoApi,
  showToast,
} from "../../script/funcs-global.js";

import {
  urlBase,
} from "../../script/variaveis-globais.js";

const inputLogin =
  document.getElementById(
    "input-login"
  );

const inputSenha =
  document.getElementById(
    "input-senha"
  );

const btnRecuperar =
  document.getElementById(
    "btn-recuperar"
  );

btnRecuperar.addEventListener(
  "click",

  async () => {

    const login =
      inputLogin.value.trim();

    const novaSenha =
      inputSenha.value.trim();

    // =========================
    // VALIDAÇÃO
    // =========================
    if (
      !login ||
      !novaSenha
    ) {

      showToast(
        "Preencha todos os campos",
        "warning"
      );

      return;
    }

    try {

      const res =
        await requisicaoApi(

          `${urlBase}api/esqueci-senha`,

          {
            method: "POST",

            body: {
              login,
              novaSenha,
            },
          }
        );

      const d =
        await res.json();

      if (!d.sucesso) {

        showToast(
          d.erro ||
            "Erro ao redefinir senha",
          "error"
        );

        return;
      }

      showToast(
        "Senha atualizada com sucesso",
        "success"
      );

      setTimeout(() => {

        window.location.href =
          "../index.html";

      }, 1500);

    } catch (err) {

      console.error(err);

      showToast(
        "Erro interno",
        "error"
      );
    }
  }
);