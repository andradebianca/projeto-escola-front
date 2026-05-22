// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");
// Se você usa bcrypt, importe aqui: const bcrypt = require("bcrypt");

// =================================================================
// 1. ROTA DE LOGIN (Atualizada)
// =================================================================
router.post("/login", async (req, res) => {
  const { login, senha } = req.body; // login pode ser email ou user_name

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

    // BARREIRA DO PRIMEIRO ACESSO: Se a senha for nula
    if (!usuario.senha) {
      return res.json({
        sucesso: false,
        primeiroAcesso: true,
        mensagem: "Conta sem senha. Defina sua senha no Primeiro Acesso.",
      });
    }
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// =================================================================
// 2. NOVA ROTA: PRIMEIRO ACESSO (Definir Senha)
// =================================================================
router.post("/primeiro-acesso", async (req, res) => {
  const { email, novaSenha } = req.body;

  if (!email || !novaSenha) {
    return res.status(400).json({ sucesso: false, erro: "Dados incompletos." });
  }

  try {
    const pool = await getPool();

    // Verifica se o usuário existe e se REALMENTE está sem senha
    const check = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT id_usuario, senha FROM usuario WHERE email = @email");

    if (check.recordset.length === 0) {
      return res
        .status(404)
        .json({ sucesso: false, erro: "E-mail não encontrado no sistema." });
    }

    if (check.recordset[0].senha) {
      return res.status(400).json({
        sucesso: false,
        erro: "Esta conta já possui uma senha registrada. Tente fazer o login.",
      });
    }

    await pool
      .request()
      .input("senha", sql.VarChar, novaSenha)
      .input("email", sql.VarChar, email)
      .query("UPDATE usuario SET senha = @senha WHERE email = @email");

    res.json({
      sucesso: true,
      mensagem: "Senha definida com sucesso! Você já pode fazer login.",
    });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

module.exports = router;
