const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

// ========================================
// DISCIPLINAS PROFESSOR
// ========================================
router.get(
  "/professor/:id/disciplinas",

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
            d.id_disciplina,
            d.nome AS disciplina,
            d.descricao,
            d.carga_horaria,

            t.id_turma,
            t.cod_turma,
            t.turno,
            t.ano_letivo

          FROM disciplina d

          INNER JOIN turma_disciplina td
            ON td.fk_disciplina = d.id_disciplina

          INNER JOIN turma t
            ON t.id_turma = td.fk_turma

          WHERE d.fk_professor = @id_professor
            AND t.ano_letivo = @ano

          ORDER BY d.nome, t.cod_turma
        `);

      const disciplinasMap = {};

      result.recordset.forEach((item) => {
        if (!disciplinasMap[item.id_disciplina]) {
          disciplinasMap[item.id_disciplina] = {
            id_disciplina: item.id_disciplina,
            disciplina: item.disciplina,
            descricao: item.descricao,
            carga_horaria: item.carga_horaria,
            turmas: [],
          };
        }

        disciplinasMap[item.id_disciplina].turmas.push({
          id_turma: item.id_turma,
          cod_turma: item.cod_turma,
          turno: item.turno,
          ano_letivo: item.ano_letivo,
        });
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
// PERFIL PROFESSOR
// ========================================
router.get(
  "/professor/:id/perfil",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const professorResult = await pool
        .request()
        .input("id_professor", sql.Int, id).query(`
          SELECT
            p.id_professor,
            p.nome_completo,
            p.data_nacimento,

            e.numero,

            r.nome_rua,
            r.cep,
            r.bairro,

            c.nome_cidade,

            uf.nome_estado AS uf

          FROM professor p

          LEFT JOIN endereco e
            ON e.id_endereco = p.fk_endereco

          LEFT JOIN rua r
            ON r.id_rua = e.fk_rua

          LEFT JOIN cidade c
            ON c.id_cidade = e.fk_cidade

          LEFT JOIN uf
            ON uf.id_uf = e.fk_uf

          WHERE p.id_professor = @id_professor
        `);

      if (professorResult.recordset.length === 0) {
        return res.status(404).json({
          erro: "Professor não encontrado",
        });
      }

      const telefoneResult = await pool
        .request()
        .input("id_professor", sql.Int, id).query(`
          SELECT telefone
          FROM telefone_professor
          WHERE fk_professor = @id_professor
        `);

      const especializacaoResult = await pool
        .request()
        .input("id_professor", sql.Int, id).query(`
          SELECT
            e.id_especializacao,
            e.nome,
            e.descricao,
            e.carga_horaria

          FROM professor_especializacao pe

          INNER JOIN especializacao e
            ON e.id_especializacao = pe.fk_especializacao

          WHERE pe.fk_professor = @id_professor
        `);

      const professor = professorResult.recordset[0];

      res.json({
        sucesso: true,

        professor: {
          id_professor: professor.id_professor,
          nome_completo: professor.nome_completo,
          data_nacimento: professor.data_nacimento,

          endereco: {
            rua: professor.nome_rua,
            numero: professor.numero,
            bairro: professor.bairro,
            cep: professor.cep,
            cidade: professor.nome_cidade,
            uf: professor.uf,
          },

          telefones: telefoneResult.recordset.map((x) => x.telefone),

          especializacoes: especializacaoResult.recordset,
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
