const btnSair = document.getElementById("btn-sair");

export function redirecionar(link) {
  const urlBase = capturarUrl();

  window.location.href = `${urlBase}/${link}`;
}

function sair() {
  const logado = localStorage.getItem("logado");

  console.log("teste");

  if (logado) {
    localStorage.removeItem("user");
    localStorage.setItem("logado", false);
  }

  const urlBase = capturarUrl();

  window.location.href = `${urlBase}/login/`;
}

function capturarUrl() {
  return window.location.origin;
}

if (btnSair) btnSair.addEventListener("click", sair);
