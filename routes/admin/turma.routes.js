const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../../db");

const { verificarToken } = require("../../middlewares/auth.middleware");

const { apenasAdmin } = require("../../middlewares/admin.middleware");

const { registrarAuditoria } = require("../../helpers/auditoria");

router.get(
  "/turma",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT
          id_turma,
          ano_letivo,
          cod_turma,
          turno

        FROM turma

        ORDER BY
          ano_letivo DESC,
          cod_turma
      `);

      res.json({
        sucesso: true,
        turmas: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.get(
  "/admin/turma/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_turma", sql.Int, id).query(`
            SELECT
              id_turma,
              ano_letivo,
              cod_turma,
              turno

            FROM turma

            WHERE id_turma =
              @id_turma
          `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Turma não encontrada",
        });
      }

      res.json({
        sucesso: true,
        turma: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.post(
  "/turma",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { ano_letivo, cod_turma, turno } = req.body || {};

      if (!ano_letivo || !cod_turma || !turno) {
        return res.status(400).json({
          erro: "Campos obrigatórios",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()

        .input("ano_letivo", sql.Int, ano_letivo)

        .input("cod_turma", sql.VarChar(100), cod_turma)

        .input("turno", sql.VarChar(15), turno).query(`
            INSERT INTO turma (
              ano_letivo,
              cod_turma,
              turno
            )

            OUTPUT INSERTED.*

            VALUES (
              @ano_letivo,
              @cod_turma,
              @turno
            )
          `);

      const turma = result.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "turma",

        idRegistro: turma.id_turma,

        descricao: "Turma criada",

        dadosNovos: turma,
      });

      res.status(201).json({
        sucesso: true,
        turma,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.put(
  "/admin/turma/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { ano_letivo, cod_turma, turno } = req.body || {};

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_turma", sql.Int, id).query(`
            SELECT *
            FROM turma
            WHERE id_turma =
              @id_turma
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Turma não encontrada",
        });
      }

      await pool
        .request()

        .input("id_turma", sql.Int, id)

        .input("ano_letivo", sql.Int, ano_letivo)

        .input("cod_turma", sql.VarChar(100), cod_turma)

        .input("turno", sql.VarChar(15), turno).query(`
          UPDATE turma

          SET
            ano_letivo =
              @ano_letivo,

            cod_turma =
              @cod_turma,

            turno =
              @turno

          WHERE id_turma =
            @id_turma
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "turma",

        idRegistro: id,

        descricao: "Turma atualizada",

        dadosAnteriores: anterior.recordset[0],

        dadosNovos: {
          ano_letivo,
          cod_turma,
          turno,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Turma atualizada",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.delete(
  "/admin/turma/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_turma", sql.Int, id).query(`
            SELECT *
            FROM turma
            WHERE id_turma =
              @id_turma
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Turma não encontrada",
        });
      }

      // remove vínculos turma_disciplina
      await pool
        .request()

        .input("fk_turma", sql.Int, id).query(`
          DELETE FROM turma_disciplina
          WHERE fk_turma =
            @fk_turma
        `);

      // remove alunos
      await pool
        .request()

        .input("fk_turma", sql.Int, id).query(`
          DELETE FROM alunos
          WHERE fk_turma =
            @fk_turma
        `);

      // remove turma
      await pool
        .request()

        .input("id_turma", sql.Int, id).query(`
          DELETE FROM turma
          WHERE id_turma =
            @id_turma
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "turma",

        idRegistro: id,

        descricao: "Turma removida",

        dadosAnteriores: anterior.recordset[0],
      });

      res.json({
        sucesso: true,
        mensagem: "Turma removida",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.get(
  "/admin/turma/:id/disciplina",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_turma", sql.Int, id).query(`
            SELECT
              td.id_turma_disciplina,

              d.id_disciplina,
              d.nome,
              d.carga_horaria,

              p.id_professor,
              p.nome_completo AS professor

            FROM turma_disciplina td

            INNER JOIN disciplina d
              ON d.id_disciplina =
                td.fk_disciplina

            INNER JOIN professor p
              ON p.id_professor =
                d.fk_professor

            WHERE td.fk_turma =
              @id_turma
          `);

      res.json({
        sucesso: true,
        disciplinas: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.post(
  "/admin/turma/disciplina",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { fk_turma, fk_disciplina } = req.body || {};

      const pool = await getPool();

      const result = await pool
        .request()

        .input("fk_turma", sql.Int, fk_turma)

        .input("fk_disciplina", sql.Int, fk_disciplina).query(`
            INSERT INTO turma_disciplina (
              fk_turma,
              fk_disciplina
            )

            OUTPUT INSERTED.*

            VALUES (
              @fk_turma,
              @fk_disciplina
            )
          `);

      const vinculo = result.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "turma_disciplina",

        idRegistro: vinculo.id_turma_disciplina,

        descricao: "Disciplina vinculada à turma",

        dadosNovos: vinculo,
      });

      res.status(201).json({
        sucesso: true,
        vinculo,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);
