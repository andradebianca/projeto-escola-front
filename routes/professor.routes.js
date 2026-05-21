const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

// ========================================
// TURMAS PROFESSOR
// ========================================
router.get(
  "/professor/:id/turmas",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;
      const { ano } = req.query;

      if (!ano) {
        return res.status(400).json({
          erro: "Ano obrigatório",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()
        .input("id_professor", sql.Int, id)
        .input("ano", sql.Int, ano).query(`
          SELECT
            t.id_turma,
            t.cod_turma,
            t.turno,
            t.ano_letivo,

            td.id_turma_disciplina,

            d.id_disciplina,
            d.nome AS disciplina,

            COUNT(a.id_aluno)
              AS quantidade_alunos

          FROM disciplina d

          INNER JOIN turma_disciplina td
            ON td.fk_disciplina =
              d.id_disciplina

          INNER JOIN turma t
            ON t.id_turma =
              td.fk_turma

          LEFT JOIN alunos a
            ON a.fk_turma =
              t.id_turma

          WHERE d.fk_professor =
            @id_professor

            AND t.ano_letivo =
              @ano

          GROUP BY
            t.id_turma,
            t.cod_turma,
            t.turno,
            t.ano_letivo,

            td.id_turma_disciplina,

            d.id_disciplina,
            d.nome

          ORDER BY
            t.cod_turma
        `);

      const turmasMap = {};

      result.recordset.forEach((item) => {
        if (!turmasMap[item.id_turma]) {
          turmasMap[item.id_turma] = {
            id_turma: item.id_turma,

            cod_turma: item.cod_turma,

            turno: item.turno,

            ano_letivo: item.ano_letivo,

            disciplinas: [],
          };
        }

        turmasMap[item.id_turma].disciplinas.push({
          id_turma_disciplina: item.id_turma_disciplina,

          id_disciplina: item.id_disciplina,

          disciplina: item.disciplina,

          quantidade_alunos: item.quantidade_alunos,
        });
      });

      res.json({
        sucesso: true,

        turmas: Object.values(turmasMap),
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
