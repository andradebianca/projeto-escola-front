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
  "/admin/telefone-professor",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT
          tp.id_telefone,
          tp.telefone,

          p.id_professor,
          p.nome_completo

        FROM telefone_professor tp

        INNER JOIN professor p
          ON p.id_professor =
            tp.fk_professor

        ORDER BY p.nome_completo
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
// GET BY PROFESSOR
// ========================================
router.get(
  "/admin/telefone-professor/professor/:idProfessor",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { idProfessor } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()
        .input("id_professor", sql.Int, idProfessor).query(`
          SELECT
            tp.id_telefone,
            tp.telefone,

            p.id_professor,
            p.nome_completo

          FROM telefone_professor tp

          INNER JOIN professor p
            ON p.id_professor =
              tp.fk_professor

          WHERE tp.fk_professor =
            @id_professor

          ORDER BY tp.id_telefone
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
  "/admin/telefone-professor/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool.request().input("id_telefone", sql.Int, id)
        .query(`
          SELECT
            tp.id_telefone,
            tp.telefone,

            p.id_professor,
            p.nome_completo

          FROM telefone_professor tp

          INNER JOIN professor p
            ON p.id_professor =
              tp.fk_professor

          WHERE tp.id_telefone =
            @id_telefone
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Telefone nao encontrado",
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
  "/admin/telefone-professor",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { fk_professor, telefone } = req.body || {};

      if (!fk_professor || !telefone) {
        return res.status(400).json({
          erro: "Todos os campos sao obrigatorios",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()
        .input("fk_professor", sql.Int, fk_professor)
        .input("telefone", sql.VarChar(15), telefone).query(`
          INSERT INTO telefone_professor (
            fk_professor,
            telefone
          )

          OUTPUT INSERTED.*

          VALUES (
            @fk_professor,
            @telefone
          )
        `);

      const novoTelefone = result.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "telefone_professor",

        idRegistro: novoTelefone.id_telefone,

        descricao: "Telefone professor criado",

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
  "/admin/telefone-professor/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { telefone } = req.body || {};

      const pool = await getPool();

      const anterior = await pool.request().input("id_telefone", sql.Int, id)
        .query(`
            SELECT *
            FROM telefone_professor
            WHERE id_telefone =
              @id_telefone
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Telefone nao encontrado",
        });
      }

      await pool
        .request()
        .input("id_telefone", sql.Int, id)
        .input("telefone", sql.VarChar(15), telefone).query(`
          UPDATE telefone_professor

          SET
            telefone =
              @telefone

          WHERE id_telefone =
            @id_telefone
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "telefone_professor",

        idRegistro: id,

        descricao: "Telefone professor atualizado",

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
  "/admin/telefone-professor/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool.request().input("id_telefone", sql.Int, id)
        .query(`
            SELECT *
            FROM telefone_professor
            WHERE id_telefone =
              @id_telefone
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Telefone nao encontrado",
        });
      }

      await pool.request().input("id_telefone", sql.Int, id).query(`
          DELETE FROM telefone_professor
          WHERE id_telefone =
            @id_telefone
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "telefone_professor",

        idRegistro: id,

        descricao: "Telefone professor removido",

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
