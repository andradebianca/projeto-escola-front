const btnSair = document.getElementById("btn-sair");

export function redirecionar(link) {
  const urlBase = capturarUrl();

  window.location.href = `${urlBase}/${link}`;
}

export function verificarLogin(principal) {
  const usuario = localStorage.getItem("usuario");
  typeof principal == "boolean" ? principal : false;

  if (!usuario) {
    redirecionar("login/");
  } else if (principal) {
    const user = JSON.parse(localStorage.getItem("perfil"));

    redirecionar(`${user?.tipo ?? ""}/`);
  }
}

export function logout() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("perfil");
  localStorage.removeItem("token");
  localStorage.removeItem("logado");

  redirecionar("login/");
}

function capturarUrl() {
  const origin = window.location.origin;
  const pathSegments = window.location.pathname.split("/").filter(Boolean);

  if (pathSegments.length > 0 && pathSegments[0] === "projeto-escola-front")
    return `${origin}/${pathSegments[0]}`;

  return origin;
}

export function showToast(mensagem, tipo = "success", duracao = 3500) {
  // 1. Procura ou cria o container dos toasts na tela
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  // 2. Define o ícone com base no tipo
  let icone = "fa-circle-check";
  if (tipo === "error") icone = "fa-circle-xmark";
  if (tipo === "warning") icone = "fa-triangle-exclamation";

  // 3. Cria o elemento físico do toast
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    <i class="fa-solid ${icone}"></i>
    <span>${mensagem}</span>
  `;

  // 4. Injeta o toast no container
  container.appendChild(toast);

  // 5. Remove o toast suavemente após o tempo definido
  setTimeout(() => {
    toast.classList.add("hide");
    // Espera a animação do CSS acabar para deletar o elemento HTML
    setTimeout(() => {
      toast.remove();
      // Se o container ficou vazio, remove ele também
      if (container.children.length === 0) {
        container.remove();
      }
    }, 200);
  }, duracao);
}

if (btnSair) btnSair.addEventListener("click", logout);
