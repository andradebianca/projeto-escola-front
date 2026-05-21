const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../../db");

const { verificarToken } = require("../../middlewares/auth.middleware");

const { apenasAdmin } = require("../../middlewares/admin.middleware");

const { registrarAuditoria } = require("../../helpers/auditoria");

router.get(
  ["/turma", "/admin/turma"],

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

      const result = await pool.request().input("id_turma", sql.Int, id).query(`
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
          erro: "Turma nao encontrada",
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
  ["/turma", "/admin/turma"],

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { ano_letivo, cod_turma, turno } = req.body || {};

      if (!ano_letivo || !cod_turma || !turno) {
        return res.status(400).json({
          erro: "Campos obrigatorios",
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

      const anterior = await pool.request().input("id_turma", sql.Int, id)
        .query(`
            SELECT *
            FROM turma
            WHERE id_turma =
              @id_turma
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Turma nao encontrada",
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

      const anterior = await pool.request().input("id_turma", sql.Int, id)
        .query(`
            SELECT *
            FROM turma
            WHERE id_turma =
              @id_turma
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Turma nao encontrada",
        });
      }

      await pool.request().input("fk_turma", sql.Int, id).query(`
          DELETE n
          FROM notas n
          INNER JOIN turma_disciplina td
            ON td.id_turma_disciplina = n.fk_turma_disciplina
          WHERE td.fk_turma =
            @fk_turma
        `);

      await pool.request().input("fk_turma", sql.Int, id).query(`
          DELETE ta
          FROM telefone_aluno ta
          INNER JOIN alunos a
            ON a.id_aluno = ta.fk_aluno
          WHERE a.fk_turma =
            @fk_turma
        `);

      await pool.request().input("fk_turma", sql.Int, id).query(`
          DELETE FROM turma_disciplina
          WHERE fk_turma =
            @fk_turma
        `);

      await pool.request().input("fk_turma", sql.Int, id).query(`
          DELETE FROM alunos
          WHERE fk_turma =
            @fk_turma
        `);

      await pool.request().input("id_turma", sql.Int, id).query(`
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

      const result = await pool.request().input("id_turma", sql.Int, id).query(`
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

      if (!fk_turma || !fk_disciplina) {
        return res.status(400).json({
          erro: "fk_turma e fk_disciplina sao obrigatorios",
        });
      }

      const pool = await getPool();

      const existente = await pool
        .request()
        .input("fk_turma", sql.Int, fk_turma)
        .input("fk_disciplina", sql.Int, fk_disciplina).query(`
          SELECT id_turma_disciplina
          FROM turma_disciplina
          WHERE fk_turma = @fk_turma
            AND fk_disciplina = @fk_disciplina
        `);

      if (existente.recordset.length > 0) {
        return res.status(409).json({
          erro: "Disciplina ja vinculada nesta turma",
        });
      }

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

        descricao: "Disciplina vinculada a turma",

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

router.get(
  "/admin/turma/disciplina/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()
        .input("id_turma_disciplina", sql.Int, id).query(`
          SELECT
            td.id_turma_disciplina,
            td.fk_turma,
            td.fk_disciplina,

            t.cod_turma,
            t.ano_letivo,
            t.turno,

            d.nome AS disciplina

          FROM turma_disciplina td
          INNER JOIN turma t
            ON t.id_turma = td.fk_turma
          INNER JOIN disciplina d
            ON d.id_disciplina = td.fk_disciplina
          WHERE td.id_turma_disciplina = @id_turma_disciplina
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Vinculo nao encontrado",
        });
      }

      res.json({
        sucesso: true,
        vinculo: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.delete(
  "/admin/turma/disciplina/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool
        .request()
        .input("id_turma_disciplina", sql.Int, id).query(`
          SELECT *
          FROM turma_disciplina
          WHERE id_turma_disciplina = @id_turma_disciplina
        `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Vinculo nao encontrado",
        });
      }

      await pool.request().input("id_turma_disciplina", sql.Int, id).query(`
          DELETE FROM notas
          WHERE fk_turma_disciplina = @id_turma_disciplina
        `);

      await pool.request().input("id_turma_disciplina", sql.Int, id).query(`
          DELETE FROM turma_disciplina
          WHERE id_turma_disciplina = @id_turma_disciplina
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "DELETE",
        tabela: "turma_disciplina",
        idRegistro: id,
        descricao: "Vinculo turma x disciplina removido",
        dadosAnteriores: anterior.recordset[0],
      });

      res.json({
        sucesso: true,
        mensagem: "Vinculo removido com sucesso",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

module.exports = router;
