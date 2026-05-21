function apenasAdmin(req, res, next) {
  if (req.usuario.nivel_acesso !== 1) {
    return res.status(403).json({
      erro: "Apenas administradores",
    });
  }

  next();
}

module.exports = {
  apenasAdmin,
};
