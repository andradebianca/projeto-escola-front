const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

// ========================================
// DISCIPLINAS ALUNO
// ========================================
router.get(
  "/aluno/:id/disciplinas",

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

      const anosResult = await pool.request().input("id_aluno", sql.Int, id)
        .query(`
          SELECT DISTINCT
            t.ano_letivo
          FROM alunos a
          INNER JOIN turma t
            ON t.id_turma = a.fk_turma
          WHERE a.id_aluno = @id_aluno
          ORDER BY t.ano_letivo
        `);

      const alunoResult = await pool
        .request()
        .input("id_aluno", sql.Int, id)
        .input("ano", sql.Int, ano).query(`
          SELECT
            a.id_aluno,
            a.nome_completo,
            a.matricula,

            t.id_turma,
            t.cod_turma,
            t.turno,
            t.ano_letivo

          FROM alunos a

          INNER JOIN turma t
            ON t.id_turma = a.fk_turma

          WHERE a.id_aluno = @id_aluno
            AND t.ano_letivo = @ano
        `);

      if (alunoResult.recordset.length === 0) {
        return res.status(404).json({
          erro: "Aluno não encontrado",
        });
      }

      const aluno = alunoResult.recordset[0];

      const disciplinasResult = await pool
        .request()
        .input("id_aluno", sql.Int, id)
        .input("id_turma", sql.Int, aluno.id_turma).query(`
          SELECT
            td.id_turma_disciplina,

            d.id_disciplina,
            d.nome AS disciplina,

            p.id_professor,
            p.nome_completo AS professor,

            n.id_nota,
            n.valor_nota

          FROM turma_disciplina td

          INNER JOIN disciplina d
            ON d.id_disciplina = td.fk_disciplina

          INNER JOIN professor p
            ON p.id_professor = d.fk_professor

          LEFT JOIN notas n
            ON n.fk_turma_disciplina = td.id_turma_disciplina
            AND n.fk_aluno = @id_aluno

          WHERE td.fk_turma = @id_turma
        `);

      const disciplinasMap = {};

      disciplinasResult.recordset.forEach((item) => {
        if (!disciplinasMap[item.id_disciplina]) {
          disciplinasMap[item.id_disciplina] = {
            id_disciplina: item.id_disciplina,
            disciplina: item.disciplina,
            professor: item.professor,
            notas: [],
            media: 0,
          };
        }

        if (item.valor_nota !== null) {
          disciplinasMap[item.id_disciplina].notas.push(item.valor_nota);
        }
      });

      Object.values(disciplinasMap).forEach((disciplina) => {
        if (disciplina.notas.length > 0) {
          const soma = disciplina.notas.reduce((a, b) => a + b, 0);

          disciplina.media = Number(
            (soma / disciplina.notas.length).toFixed(2),
          );
        }
      });

      res.json({
        sucesso: true,

        aluno: {
          id_aluno: aluno.id_aluno,
          nome_completo: aluno.nome_completo,
          matricula: aluno.matricula,

          opcoesAnos: anosResult.recordset.map((x) => x.ano_letivo),
        },

        turma: {
          id_turma: aluno.id_turma,
          cod_turma: aluno.cod_turma,
          turno: aluno.turno,
          ano_letivo: aluno.ano_letivo,
        },

        disciplinas: Object.values(disciplinasMap),
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
// NOTAS ALUNO
// ========================================
router.get(
  "/aluno/:id/notas",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool.request().input("id_aluno", sql.Int, id).query(`
          SELECT
            d.id_disciplina,
            d.nome AS disciplina,

            p.nome_completo AS professor,

            n.id_nota,
            n.valor_nota

          FROM notas n

          INNER JOIN turma_disciplina td
            ON td.id_turma_disciplina = n.fk_turma_disciplina

          INNER JOIN disciplina d
            ON d.id_disciplina = td.fk_disciplina

          INNER JOIN professor p
            ON p.id_professor = d.fk_professor

          WHERE n.fk_aluno = @id_aluno

          ORDER BY d.nome, n.id_nota
        `);

      const disciplinasMap = {};

      result.recordset.forEach((item) => {
        if (!disciplinasMap[item.id_disciplina]) {
          disciplinasMap[item.id_disciplina] = {
            id_disciplina: item.id_disciplina,
            disciplina: item.disciplina,
            professor: item.professor,
            notas: [],
          };
        }

        if (disciplinasMap[item.id_disciplina].notas.length < 3) {
          disciplinasMap[item.id_disciplina].notas.push({
            id_nota: item.id_nota,
            valor_nota: item.valor_nota,
          });
        }
      });

      res.json({
        sucesso: true,
        disciplinas: Object.values(disciplinasMap),
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
// PERFIL ALUNO
// ========================================
router.get(
  "/aluno/:id/perfil",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const alunoResult = await pool.request().input("id_aluno", sql.Int, id)
        .query(`
          SELECT
            a.id_aluno,
            a.nome_completo,
            a.matricula,
            a.data_nacimento,

            e.numero,

            r.nome_rua,
            r.cep,
            r.bairro,

            c.nome_cidade,

            uf.nome_estado AS uf

          FROM alunos a

          LEFT JOIN endereco e
            ON e.id_endereco = a.fk_endereco

          LEFT JOIN rua r
            ON r.id_rua = e.fk_rua

          LEFT JOIN cidade c
            ON c.id_cidade = e.fk_cidade

          LEFT JOIN uf
            ON uf.id_uf = e.fk_uf

          WHERE a.id_aluno = @id_aluno
        `);

      if (alunoResult.recordset.length === 0) {
        return res.status(404).json({
          erro: "Aluno não encontrado",
        });
      }

      const telefoneResult = await pool.request().input("id_aluno", sql.Int, id)
        .query(`
          SELECT telefone
          FROM telefone_aluno
          WHERE fk_aluno = @id_aluno
        `);

      const aluno = alunoResult.recordset[0];

      res.json({
        sucesso: true,

        aluno: {
          id_aluno: aluno.id_aluno,
          nome_completo: aluno.nome_completo,
          matricula: aluno.matricula,
          data_nacimento: aluno.data_nacimento,

          endereco: {
            rua: aluno.nome_rua,
            numero: aluno.numero,
            bairro: aluno.bairro,
            cep: aluno.cep,
            cidade: aluno.nome_cidade,
            uf: aluno.uf,
          },

          telefones: telefoneResult.recordset.map((x) => x.telefone),
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
