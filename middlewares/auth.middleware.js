const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        erro: "Token não enviado",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        erro: "Token inválido",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      erro: "Token expirado ou inválido",
    });
  }
}

module.exports = {
  verificarToken,
};
