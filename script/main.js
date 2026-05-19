import { redirecionar } from "./funcs-global.js";

const usuario = localStorage.getItem("usuario");

if (!usuario) {
  redirecionar("login/");
} else {
  const user = JSON.parse(localStorage.getItem("perfil"));

  console.log(user);

  redirecionar(`${user?.tipo ?? ""}/`);
}
