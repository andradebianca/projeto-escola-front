const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");

router.post("/login", async (req, res) => {
  const { login, senha } = req.body;

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("login", sql.VarChar, login)
      .query(
        "SELECT * FROM usuario WHERE email = @login OR user_name = @login",
      );

    if (result.recordset.length === 0) {
      return res
        .status(401)
        .json({ sucesso: false, erro: "Credenciais inválidas." });
    }

    const usuario = result.recordset[0];

    if (!usuario.senha || usuario.senha === "") {
      return res.json({
        sucesso: false,
        primeiroAcesso: true,
        mensagem: "Conta sem senha definida.",
      });
    }

    if (senha !== usuario.senha) {
      return res.status(401).json({ sucesso: false, erro: "Senha incorreta." });
    }

    res.json({
      sucesso: true,
      usuario: { id: usuario.id_usuario, email: usuario.email },
    });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

router.post("/primeiro-acesso", async (req, res) => {
  const { email, novaSenha } = req.body;
  try {
    const pool = await getPool();
    await pool
      .request()
      .input("senha", sql.VarChar, novaSenha)
      .input("email", sql.VarChar, email)
      .query("UPDATE usuario SET senha = @senha WHERE email = @email");

    res.json({ sucesso: true, mensagem: "Senha definida com sucesso!" });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

router.post("/redefinir-senha", async (req, res) => {
  const { email, novaSenha } = req.body;
  try {
    const pool = await getPool();
    await pool
      .request()
      .input("senha", sql.VarChar, novaSenha)
      .input("email", sql.VarChar, email)
      .query("UPDATE usuario SET senha = @senha WHERE email = @email");

    res.json({ sucesso: true, mensagem: "Senha alterada com sucesso!" });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

module.exports = router;
