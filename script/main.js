const logado = localStorage.getItem("logado");
let user;

if (logado == null) {
	window.location.href = "./login/";
} else {
	user = JSON.parse(localStorage.getItem("user"));

	const pathSegments = window.location.pathname.split("/");

	let projectBase = "";
	if (pathSegments.length > 1 && pathSegments[1] !== "") {
		projectBase = `/${pathSegments[1]}`;
	}

	window.open(`${projectBase}/${user.tipo}/`, "_self");
}