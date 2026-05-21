const jwt = require("jsonwebtoken");

function gerarToken(usuario) {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,

      nivel_acesso: usuario.nivel_acesso,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "1d",
    },
  );
}

module.exports = {
  gerarToken,
};
