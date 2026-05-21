const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../../db");

const { verificarToken } = require("../../middlewares/auth.middleware");

const { apenasAdmin } = require("../../middlewares/admin.middleware");

const { registrarAuditoria } = require("../../helpers/auditoria");

router.get(
  "/admin/disciplina",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT
          d.id_disciplina,
          d.nome,
          d.carga_horaria,
          d.descricao,

          p.id_professor,
          p.nome_completo AS professor

        FROM disciplina d

        INNER JOIN professor p
          ON p.id_professor =
            d.fk_professor

        ORDER BY d.nome
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

router.get(
  "/admin/disciplina/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_disciplina", sql.Int, id).query(`
          SELECT
            d.id_disciplina,
            d.nome,
            d.carga_horaria,
            d.descricao,

            p.id_professor,
            p.nome_completo AS professor

          FROM disciplina d

          INNER JOIN professor p
            ON p.id_professor =
              d.fk_professor

          WHERE d.id_disciplina =
            @id_disciplina
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Disciplina não encontrada",
        });
      }

      res.json({
        sucesso: true,
        disciplina: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.post(
  "/admin/disciplina",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { fk_professor, nome, carga_horaria, descricao } = req.body || {};

      if (!fk_professor || !nome || !carga_horaria) {
        return res.status(400).json({
          erro: "Campos obrigatórios não enviados",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()

        .input("fk_professor", sql.Int, fk_professor)

        .input("nome", sql.VarChar(150), nome)

        .input("carga_horaria", sql.Int, carga_horaria)

        .input("descricao", sql.VarChar(500), descricao || null).query(`
          INSERT INTO disciplina (
            fk_professor,
            nome,
            carga_horaria,
            descricao
          )

          OUTPUT INSERTED.*

          VALUES (
            @fk_professor,
            @nome,
            @carga_horaria,
            @descricao
          )
        `);

      const disciplina = result.recordset[0];

      // AUDITORIA
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "disciplina",

        idRegistro: disciplina.id_disciplina,

        descricao: "Disciplina criada",

        dadosNovos: disciplina,
      });

      res.status(201).json({
        sucesso: true,
        disciplina,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.put(
  "/admin/disciplina/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { fk_professor, nome, carga_horaria, descricao } = req.body || {};

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_disciplina", sql.Int, id).query(`
            SELECT *
            FROM disciplina
            WHERE id_disciplina =
              @id_disciplina
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Disciplina não encontrada",
        });
      }

      await pool
        .request()

        .input("id_disciplina", sql.Int, id)

        .input("fk_professor", sql.Int, fk_professor)

        .input("nome", sql.VarChar(150), nome)

        .input("carga_horaria", sql.Int, carga_horaria)

        .input("descricao", sql.VarChar(500), descricao || null).query(`
          UPDATE disciplina

          SET
            fk_professor =
              @fk_professor,

            nome =
              @nome,

            carga_horaria =
              @carga_horaria,

            descricao =
              @descricao

          WHERE id_disciplina =
            @id_disciplina
        `);

      // AUDITORIA
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "disciplina",

        idRegistro: id,

        descricao: "Disciplina atualizada",

        dadosAnteriores: anterior.recordset[0],

        dadosNovos: {
          fk_professor,
          nome,
          carga_horaria,
          descricao,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Disciplina atualizada",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.delete(
  "/admin/disciplina/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_disciplina", sql.Int, id).query(`
            SELECT *
            FROM disciplina
            WHERE id_disciplina =
              @id_disciplina
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Disciplina não encontrada",
        });
      }

      // remove vínculos turma_disciplina
      await pool
        .request()

        .input("fk_disciplina", sql.Int, id).query(`
          DELETE n
          FROM notas n
          INNER JOIN turma_disciplina td
            ON td.id_turma_disciplina = n.fk_turma_disciplina
          WHERE td.fk_disciplina =
            @fk_disciplina
        `);

      await pool
        .request()

        .input("fk_disciplina", sql.Int, id).query(`
          DELETE FROM turma_disciplina
          WHERE fk_disciplina =
            @fk_disciplina
        `);

      // remove disciplina
      await pool
        .request()

        .input("id_disciplina", sql.Int, id).query(`
          DELETE FROM disciplina
          WHERE id_disciplina =
            @id_disciplina
        `);

      // AUDITORIA
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "disciplina",

        idRegistro: id,

        descricao: "Disciplina removida",

        dadosAnteriores: anterior.recordset[0],
      });

      res.json({
        sucesso: true,
        mensagem: "Disciplina removida",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

module.exports = router;
