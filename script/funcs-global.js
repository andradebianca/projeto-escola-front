const btnSair = document.getElementById("btn-sair");

export function redirecionar(link) {
  const urlBase = capturarUrl();

  window.location.href = `${urlBase}/${link}`;
}

export function verificarLogin(principal) {
  console.log("forçando a subir alteração");

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

if (btnSair) btnSair.addEventListener("click", logout);
