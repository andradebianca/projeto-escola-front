const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../../db");

const { verificarToken } = require("../../middlewares/auth.middleware");

const { apenasAdmin } = require("../../middlewares/admin.middleware");

const { registrarAuditoria } = require("../../helpers/auditoria");

router.get(
  "/admin/especializacao",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT
          id_especializacao,
          nome,
          descricao,
          carga_horaria

        FROM especializacao

        ORDER BY nome
      `);

      res.json({
        sucesso: true,
        especializacoes: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.get(
  "/admin/especializacao/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_especializacao", sql.Int, id).query(`
            SELECT
              id_especializacao,
              nome,
              descricao,
              carga_horaria

            FROM especializacao

            WHERE id_especializacao =
              @id_especializacao
          `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Especialização não encontrada",
        });
      }

      res.json({
        sucesso: true,
        especializacao: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.post(
  "/admin/especializacao",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { nome, descricao, carga_horaria } = req.body || {};

      if (!nome || !carga_horaria) {
        return res.status(400).json({
          erro: "Campos obrigatórios",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()

        .input("nome", sql.VarChar(100), nome)

        .input("descricao", sql.VarChar(500), descricao || null)

        .input("carga_horaria", sql.Int, carga_horaria).query(`
            INSERT INTO especializacao (
              nome,
              descricao,
              carga_horaria
            )

            OUTPUT INSERTED.*

            VALUES (
              @nome,
              @descricao,
              @carga_horaria
            )
          `);

      const especializacao = result.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "especializacao",

        idRegistro: especializacao.id_especializacao,

        descricao: "Especialização criada",

        dadosNovos: especializacao,
      });

      res.status(201).json({
        sucesso: true,
        especializacao,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.put(
  "/admin/especializacao/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { nome, descricao, carga_horaria } = req.body || {};

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_especializacao", sql.Int, id).query(`
            SELECT *
            FROM especializacao
            WHERE id_especializacao =
              @id_especializacao
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Especialização não encontrada",
        });
      }

      await pool
        .request()

        .input("id_especializacao", sql.Int, id)

        .input("nome", sql.VarChar(100), nome)

        .input("descricao", sql.VarChar(500), descricao || null)

        .input("carga_horaria", sql.Int, carga_horaria).query(`
          UPDATE especializacao

          SET
            nome =
              @nome,

            descricao =
              @descricao,

            carga_horaria =
              @carga_horaria

          WHERE id_especializacao =
            @id_especializacao
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "especializacao",

        idRegistro: id,

        descricao: "Especialização atualizada",

        dadosAnteriores: anterior.recordset[0],

        dadosNovos: {
          nome,
          descricao,
          carga_horaria,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Especialização atualizada",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.delete(
  "/admin/especializacao/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_especializacao", sql.Int, id).query(`
            SELECT *
            FROM especializacao
            WHERE id_especializacao =
              @id_especializacao
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Especialização não encontrada",
        });
      }

      // remove vínculos
      await pool
        .request()

        .input("fk_especializacao", sql.Int, id).query(`
          DELETE FROM professor_especializacao

          WHERE fk_especializacao =
            @fk_especializacao
        `);

      // remove especialização
      await pool
        .request()

        .input("id_especializacao", sql.Int, id).query(`
          DELETE FROM especializacao

          WHERE id_especializacao =
            @id_especializacao
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "especializacao",

        idRegistro: id,

        descricao: "Especialização removida",

        dadosAnteriores: anterior.recordset[0],
      });

      res.json({
        sucesso: true,
        mensagem: "Especialização removida",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);
