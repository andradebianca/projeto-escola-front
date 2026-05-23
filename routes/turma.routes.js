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
          erro: "Ano letivo é obrigatório",
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

            COUNT(a.id_aluno) AS quantidade_alunos

          FROM disciplina d

          INNER JOIN turma_disciplina td
            ON td.fk_disciplina = d.id_disciplina

          INNER JOIN turma t
            ON t.id_turma = td.fk_turma

          LEFT JOIN alunos a
            ON a.fk_turma = t.id_turma

          WHERE d.fk_professor = @id_professor
            AND t.ano_letivo = @ano

          GROUP BY
            t.id_turma,
            t.cod_turma,
            t.turno,
            t.ano_letivo,
            td.id_turma_disciplina,
            d.id_disciplina,
            d.nome

          ORDER BY
            t.ano_letivo,
            t.cod_turma,
            d.nome
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

      // =========================
      // FILTRO DISCIPLINA
      // =========================
      let filtroDisciplinaJoin = "";

      const request = pool
        .request()

        .input("id_turma", sql.Int, id);

      if (disciplinaId) {
        filtroDisciplinaJoin = `
          AND td.fk_disciplina =
            @disciplinaId
        `;

        request.input("disciplinaId", sql.Int, disciplinaId);
      }

      // =========================
      // QUERY
      // =========================
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
                n.valor_nota AS FLOAT
              )
            ) OVER (
              PARTITION BY a.id_aluno
            ) AS media

          FROM alunos a

          LEFT JOIN notas n
            ON n.fk_aluno =
              a.id_aluno

          LEFT JOIN turma_disciplina td
            ON td.id_turma_disciplina =
              n.fk_turma_disciplina

            ${filtroDisciplinaJoin}

          WHERE a.fk_turma =
            @id_turma

          ORDER BY
            a.nome_completo,
            n.data_criacao
        `);

      // =========================
      // MAPEAR ALUNOS
      // =========================
      const alunosMap = {};

      result.recordset.forEach((item) => {
        // cria aluno
        if (!alunosMap[item.id_aluno]) {
          alunosMap[item.id_aluno] = {
            id_aluno: item.id_aluno,

            nome_completo: item.nome_completo,

            matricula: item.matricula,

            media: item.media !== null ? Number(item.media.toFixed(2)) : null,

            notas: [],
          };
        }

        // adiciona nota
        if (item.id_nota) {
          alunosMap[item.id_aluno].notas.push({
            id_nota: item.id_nota,

            valor_nota: item.valor_nota,

            data_criacao: item.data_criacao,
          });
        }
      });

      // =========================
      // RESPOSTA
      // =========================
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
