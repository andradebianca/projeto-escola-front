// funcs-global.js

const btnSair = document.getElementById("btn-sair");

/* ==========================================
   MECÂNICA DE REDIRECIONAMENTO E URLS
   ========================================== */
export function redirecionar(link) {
  const urlBase = capturarUrl();
  window.location.href = `${urlBase}/${link}`;
}

function capturarUrl() {
  const origin = window.location.origin;
  const pathSegments = window.location.pathname.split("/").filter(Boolean);

  if (pathSegments.length > 0 && pathSegments[0] === "projeto-escola-front")
    return `${origin}/${pathSegments[0]}`;

  return origin;
}

/* ==========================================
   CONTROLE DE SESSÃO (VERIFICAR LOGIN & LOGOUT)
   ========================================== */
export function verificarLogin(principal = false) {
  const token = localStorage.getItem("token");
  const usuario = localStorage.getItem("usuario");

  // Se não tem sessão ativa, expulsa para o login imediatamente
  if (!token || !usuario) {
    // Evita loop infinito se já estiver na página de login
    if (!window.location.pathname.includes("login/")) {
      logout();
    }
    return;
  }

  // Se o usuário está logado e acessou a raiz (principal: true), manda para o painel correto dele
  if (principal) {
    const perfil = JSON.parse(localStorage.getItem("perfil"));
    const tipo = perfil?.tipo;
    const dadosUsuario = JSON.parse(usuario);

    // Se for Administrador (Nível de acesso 1)
    if (dadosUsuario?.nivel_acesso === 1) {
      redirecionar("admin/");
      return;
    }

    if (tipo) {
      redirecionar(`${tipo}/`);
    }
  }
}

export function logout() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("perfil");
  localStorage.removeItem("token");
  localStorage.removeItem("logado");

  redirecionar("login/");
}

/* ==========================================
   WRAPPER DA API (INTERCEPTOR DE TOKEN & 401)
   ========================================== */
export async function requisicaoApi(endpoint, customOptions = {}) {
  const token = localStorage.getItem("token");

  // Configura os headers padrões injetando o JWT Bearer Token automaticamente se ele existir
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config = {
    method: "GET", // Método padrão se não for informado nenhum outro
    ...customOptions,
    headers: {
      ...headers,
      ...customOptions.headers, // Permite sobrescrever headers pontualmente se necessário
    },
  };

  // Se passarem um objeto no body, transforma automaticamente em String JSON
  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(endpoint, config);

  // INTERCEPTOR CRUCIAL: Se der 401 (Não autorizado/Token Expirou), limpa o sistema e desloga
  if (response.status === 401) {
    showToast("Sessão expirada. Faça login novamente.", "warning");
    // Aguarda um instante pequeno para o usuário conseguir ler o aviso na tela antes do chute
    setTimeout(() => {
      logout();
    }, 1500);
    throw new Error("Sessão expirada (401).");
  }

  return response;
}

/* ==========================================
   SISTEMA DE TOAST NOTIFICATIONS
   ========================================== */
export function showToast(mensagem, tipo = "success", duracao = 3500) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  let icone = "fa-circle-check";
  if (tipo === "error") icone = "fa-circle-xmark";
  if (tipo === "warning") icone = "fa-triangle-exclamation";

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo.trim().toLowerCase()}`;
  toast.innerHTML = `
    <i class="fa-solid ${icone}"></i>
    <span>${mensagem}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 200);
  }, duracao);
}

// Vincula o clique de saída global se o elemento existir na sidebar do DOM atual
if (btnSair) btnSair.addEventListener("click", logout);
