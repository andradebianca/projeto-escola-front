const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../../db");

const { verificarToken } = require("../../middlewares/auth.middleware");

const { apenasAdmin } = require("../../middlewares/admin.middleware");

const { registrarAuditoria } = require("../../helpers/auditoria");

// ========================================
// GET ALL
// ========================================
router.get(
  "/admin/telefone-aluno",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT
          ta.id_telefone,
          ta.telefone,

          a.id_aluno,
          a.nome_completo,
          a.matricula

        FROM telefone_aluno ta

        INNER JOIN alunos a
          ON a.id_aluno =
            ta.fk_aluno

        ORDER BY a.nome_completo
      `);

      res.json({
        sucesso: true,
        telefones: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// GET BY ID
// ========================================
router.get(
  "/admin/telefone-aluno/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_telefone", sql.Int, id).query(`
          SELECT
            ta.id_telefone,
            ta.telefone,

            a.id_aluno,
            a.nome_completo,
            a.matricula

          FROM telefone_aluno ta

          INNER JOIN alunos a
            ON a.id_aluno =
              ta.fk_aluno

          WHERE ta.id_telefone =
            @id_telefone
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Telefone não encontrado",
        });
      }

      res.json({
        sucesso: true,
        telefone: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// CREATE
// ========================================
router.post(
  "/admin/telefone-aluno",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { fk_aluno, telefone } = req.body || {};

      if (!fk_aluno || !telefone) {
        return res.status(400).json({
          erro: "Todos os campos são obrigatórios",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()

        .input("fk_aluno", sql.Int, fk_aluno)

        .input("telefone", sql.VarChar(15), telefone).query(`
          INSERT INTO telefone_aluno (
            fk_aluno,
            telefone
          )

          OUTPUT INSERTED.*

          VALUES (
            @fk_aluno,
            @telefone
          )
        `);

      const novoTelefone = result.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "telefone_aluno",

        idRegistro: novoTelefone.id_telefone,

        descricao: "Telefone aluno criado",

        dadosNovos: novoTelefone,
      });

      res.status(201).json({
        sucesso: true,
        telefone: novoTelefone,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// UPDATE
// ========================================
router.put(
  "/admin/telefone-aluno/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { telefone } = req.body || {};

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_telefone", sql.Int, id).query(`
            SELECT *
            FROM telefone_aluno
            WHERE id_telefone =
              @id_telefone
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Telefone não encontrado",
        });
      }

      await pool
        .request()

        .input("id_telefone", sql.Int, id)

        .input("telefone", sql.VarChar(15), telefone).query(`
          UPDATE telefone_aluno

          SET
            telefone =
              @telefone

          WHERE id_telefone =
            @id_telefone
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "telefone_aluno",

        idRegistro: id,

        descricao: "Telefone aluno atualizado",

        dadosAnteriores: anterior.recordset[0],

        dadosNovos: {
          telefone,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Telefone atualizado",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// DELETE
// ========================================
router.delete(
  "/admin/telefone-aluno/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_telefone", sql.Int, id).query(`
            SELECT *
            FROM telefone_aluno
            WHERE id_telefone =
              @id_telefone
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Telefone não encontrado",
        });
      }

      await pool
        .request()

        .input("id_telefone", sql.Int, id).query(`
          DELETE FROM telefone_aluno
          WHERE id_telefone =
            @id_telefone
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "telefone_aluno",

        idRegistro: id,

        descricao: "Telefone aluno removido",

        dadosAnteriores: anterior.recordset[0],
      });

      res.json({
        sucesso: true,
        mensagem: "Telefone removido",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

module.exports = router;
