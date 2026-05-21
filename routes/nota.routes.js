const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

// ========================================
// DETALHE NOTA
// ========================================
router.get(
  "/nota/:id",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool.request().input("id_nota", sql.Int, id).query(`
          SELECT
            n.id_nota,
            n.valor_nota,
            n.descricao,
            n.data_aplicacao,
            n.periodo_nota,

            a.id_aluno,
            a.nome_completo AS aluno,
            a.matricula,

            d.id_disciplina,
            d.nome AS disciplina,
            d.descricao AS descricao_disciplina,
            d.carga_horaria,

            p.id_professor,
            p.nome_completo AS professor_nome,

            t.id_turma,
            t.cod_turma,
            t.turno,
            t.ano_letivo

          FROM notas n

          INNER JOIN alunos a
            ON a.id_aluno = n.fk_aluno

          INNER JOIN turma_disciplina td
            ON td.id_turma_disciplina = n.fk_turma_disciplina

          INNER JOIN turma t
            ON t.id_turma = td.fk_turma

          INNER JOIN disciplina d
            ON d.id_disciplina = td.fk_disciplina

          INNER JOIN professor p
            ON p.id_professor = d.fk_professor

          WHERE n.id_nota = @id_nota
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Nota não encontrada",
        });
      }

      const nota = result.recordset[0];

      res.json({
        sucesso: true,

        nota: {
          id_nota: nota.id_nota,
          valor_nota: nota.valor_nota,
          descricao: nota.descricao,
          data_aplicacao: nota.data_aplicacao,
          periodo_nota: nota.periodo_nota,

          aluno: {
            id_aluno: nota.id_aluno,
            nome_completo: nota.aluno,
            matricula: nota.matricula,
          },

          disciplina: {
            id_disciplina: nota.id_disciplina,
            nome: nota.disciplina,
            descricao: nota.descricao_disciplina,
            carga_horaria: nota.carga_horaria,
          },

          professor: {
            id_professor: nota.id_professor,
            nome_completo: nota.professor_nome,
          },

          turma: {
            id_turma: nota.id_turma,
            cod_turma: nota.cod_turma,
            turno: nota.turno,
            ano_letivo: nota.ano_letivo,
          },
        },
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
