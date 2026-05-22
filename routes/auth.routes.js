const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const { sql, getPool } = require("../db");

router.post("/login", async (req, res) => {
  try {
    const { login, senha } = req.body || {};

    // =========================
    // VALIDAÇÃO
    // =========================
    if (!login) {
      return res.status(400).json({
        erro: "Login obrigatório",
      });
    }

    const pool = await getPool();

    // =========================
    // BUSCA USUÁRIO
    // =========================
    const usuarioResult = await pool
      .request()

      .input("login", sql.VarChar, login).query(`
        SELECT
          id_usuario,
          email,
          user_name,
          senha,
          nivel_acesso

        FROM usuario

        WHERE
          email = @login
          OR user_name = @login
      `);

    // =========================
    // NÃO ENCONTRADO
    // =========================
    if (usuarioResult.recordset.length === 0) {
      return res.status(401).json({
        erro: "Usuário não encontrado",
      });
    }

    const usuario = usuarioResult.recordset[0];

    // =========================
    // PRIMEIRO ACESSO
    // =========================
    if (!usuario.senha) {
      return res.status(401).json({
        primeiro_acesso: true,

        erro: "É necessário cadastrar uma senha antes de acessar",
      });
    }

    // =========================
    // SENHA INVÁLIDA
    // =========================
    if (usuario.senha !== senha) {
      return res.status(401).json({
        erro: "Senha inválida",
      });
    }

    let perfil = null;

    // =========================
    // PROFESSOR
    // =========================
    if (usuario.nivel_acesso === 2) {
      const professorResult = await pool
        .request()

        .input("id_usuario", sql.Int, usuario.id_usuario).query(`
          SELECT
            p.id_professor,
            p.nome_completo,
            p.data_nascimento,

            (
              SELECT DISTINCT
                t.ano_letivo

              FROM disciplina d

              INNER JOIN turma_disciplina td
                ON td.fk_disciplina =
                  d.id_disciplina

              INNER JOIN turma t
                ON t.id_turma =
                  td.fk_turma

              WHERE d.fk_professor =
                p.id_professor

              FOR JSON PATH
            ) AS opcoesAnos

          FROM professor p

          WHERE p.fk_usuario =
            @id_usuario
        `);

      if (professorResult.recordset.length > 0) {
        const professor = professorResult.recordset[0];

        perfil = {
          tipo: "professor",

          dados: {
            ...professor,

            opcoesAnos: professor.opcoesAnos
              ? JSON.parse(professor.opcoesAnos).map((x) => x.ano_letivo)
              : [],
          },
        };
      }
    }

    // =========================
    // ALUNO
    // =========================
    if (usuario.nivel_acesso === 3) {
      const alunoResult = await pool
        .request()

        .input("id_usuario", sql.Int, usuario.id_usuario).query(`
          SELECT
            a.id_aluno,
            a.nome_completo,
            a.matricula,
            a.data_nascimento,

            (
              SELECT DISTINCT
                t.ano_letivo

              FROM turma t

              WHERE t.id_turma =
                a.fk_turma

              FOR JSON PATH
            ) AS opcoesAnos

          FROM alunos a

          WHERE a.fk_usuario =
            @id_usuario
        `);

      if (alunoResult.recordset.length > 0) {
        const aluno = alunoResult.recordset[0];

        perfil = {
          tipo: "aluno",

          dados: {
            ...aluno,

            opcoesAnos: aluno.opcoesAnos
              ? JSON.parse(aluno.opcoesAnos).map((x) => x.ano_letivo)
              : [],
          },
        };
      }
    }

    // =========================
    // TOKEN
    // =========================
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,

        nivel_acesso: usuario.nivel_acesso,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "1d",
      },
    );

    // remove senha
    delete usuario.senha;

    // =========================
    // RESPOSTA
    // =========================
    res.json({
      sucesso: true,

      token,

      usuario,

      perfil,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

router.post(
  "/primeiro-acesso",

  async (req, res) => {

    try {

      const {
        email,
        novaSenha,
      } = req.body || {};

      // =========================
      // VALIDAÇÃO
      // =========================
      if (
        !email ||
        !novaSenha
      ) {
        return res.status(400).json({
          erro:
            "Email e senha obrigatórios",
        });
      }

      const pool = await getPool();

      // =========================
      // BUSCA USUÁRIO
      // =========================
      const usuarioResult =
        await pool
          .request()

          .input(
            "email",
            sql.VarChar,
            email
          )

          .query(`
            SELECT
              id_usuario,
              senha

            FROM usuario

            WHERE email =
              @email
          `);

      if (
        usuarioResult.recordset.length === 0
      ) {
        return res.status(404).json({
          erro:
            "Usuário não encontrado",
        });
      }

      const usuario =
        usuarioResult.recordset[0];

      // =========================
      // JÁ POSSUI SENHA
      // =========================
      if (usuario.senha) {

        return res.status(400).json({
          erro:
            "Usuário já possui senha cadastrada",
        });
      }

      // =========================
      // UPDATE SENHA
      // =========================
      await pool
        .request()

        .input(
          "id_usuario",
          sql.Int,
          usuario.id_usuario
        )

        .input(
          "senha",
          sql.VarChar(30),
          novaSenha
        )

        .query(`
          UPDATE usuario

          SET
            senha = @senha

          WHERE id_usuario =
            @id_usuario
        `);

      res.json({
        sucesso: true,
        mensagem:
          "Senha cadastrada com sucesso",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        erro: err.message,
      });

    }
  }
);

module.exports = router;
