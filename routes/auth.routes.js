const express = require("express");
const router = express.Router();
const { getPool, sql } = require("../db");

router.post("/login", async (req, res) => {
  const { login, senha } = req.body;
  console.log("Tentativa de login recebida para:", login); // LOG NO SERVIDOR

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("login", sql.VarChar, login)
      .query(
        "SELECT * FROM usuario WHERE email = @login OR user_name = @login",
      );

    console.log(
      "Query executada. Usuários encontrados:",
      result.recordset.length,
    );

    if (result.recordset.length === 0) {
      return res
        .status(401)
        .json({ sucesso: false, erro: "Credenciais inválidas." });
    }

    const usuario = result.recordset[0];
    console.log(
      "Usuário encontrado. Senha no banco:",
      usuario.senha ? "EXISTE" : "NULA/VAZIA",
    );

    // Barreira primeiro acesso
    if (!usuario.senha || usuario.senha === "") {
      console.log("Fluxo: Primeiro Acesso detectado.");
      return res.json({
        sucesso: false,
        primeiroAcesso: true,
        mensagem: "Primeiro acesso.",
      });
    }

    // Comparação de senha
    if (senha !== usuario.senha) {
      console.log("Fluxo: Senha incorreta.");
      return res.status(401).json({ sucesso: false, erro: "Senha incorreta." });
    }

    console.log("Fluxo: Login aprovado. Enviando resposta...");
    // AQUI ESTÁ O PULO DO GATO: Certifique-se que o retorno é finalizado
    return res.json({
      sucesso: true,
      usuario: { id: usuario.id_usuario, email: usuario.email },
    });
  } catch (err) {
    console.error("Erro no catch do login:", err);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

router.post("/primeiro-acesso", async (req, res) => {
  const { email, novaSenha } = req.body;

  if (!email || !novaSenha) {
    return res.status(400).json({ sucesso: false, erro: "Dados incompletos." });
  }

  try {
    const pool = await getPool();

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
