const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

// ========================================
// ALUNOS DA TURMA
// ========================================
router.get(
  "/turma/:id/alunos",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { disciplinaId } = req.query;

      const pool = await getPool();

      let filtroDisciplina = "";

      const request = pool.request().input("id_turma", sql.Int, id);

      if (disciplinaId) {
        filtroDisciplina = `
          AND td.fk_disciplina =
            @disciplinaId
        `;

        request.input("disciplinaId", sql.Int, disciplinaId);
      }

      const result = await request.query(`
          SELECT
            a.id_aluno,
            a.nome_completo,
            a.matricula,

            n.id_nota,
            n.valor_nota,
            n.data_criacao,

            AVG(
              CAST(
                n.valor_nota
                AS FLOAT
              )
            ) OVER (
              PARTITION BY
                a.id_aluno
            ) AS media

          FROM alunos a

          LEFT JOIN notas n
            ON n.fk_aluno =
              a.id_aluno

          LEFT JOIN turma_disciplina td
            ON td.id_turma_disciplina =
              n.fk_turma_disciplina

          WHERE a.fk_turma =
            @id_turma

            ${filtroDisciplina}

          ORDER BY
            a.nome_completo
        `);

      const alunosMap = {};

      result.recordset.forEach((item) => {
        if (!alunosMap[item.id_aluno]) {
          alunosMap[item.id_aluno] = {
            id_aluno: item.id_aluno,

            nome_completo: item.nome_completo,

            matricula: item.matricula,

            media: item.media !== null ? Number(item.media.toFixed(2)) : null,

            notas: [],
          };
        }

        if (item.id_nota) {
          alunosMap[item.id_aluno].notas.push({
            id_nota: item.id_nota,

            valor_nota: item.valor_nota,

            data_criacao: item.data_criacao,
          });
        }
      });

      res.json({
        sucesso: true,

        alunos: Object.values(alunosMap),
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
