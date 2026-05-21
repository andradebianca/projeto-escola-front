const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

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
            a.data_nascimento,
            a.email,

            e.bairro,
            e.numero,
            e.cep,

            r.nome_rua,

            c.nome_cidade,

            uf.nome_estado AS uf

          FROM alunos a

          LEFT JOIN endereco e
            ON e.id_endereco =
              a.fk_endereco

          LEFT JOIN rua r
            ON r.id_rua =
              e.fk_rua

          LEFT JOIN cidade c
            ON c.id_cidade =
              r.fk_cidade

          LEFT JOIN uf
            ON uf.id_uf =
              c.fk_uf

          WHERE a.id_aluno =
            @id_aluno
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
            WHERE fk_aluno =
              @id_aluno
          `);

      const aluno = alunoResult.recordset[0];

      res.json({
        sucesso: true,

        aluno: {
          id_aluno: aluno.id_aluno,

          nome_completo: aluno.nome_completo,

          matricula: aluno.matricula,

          data_nascimento: aluno.data_nascimento,

          email: aluno.email,

          endereco: {
            bairro: aluno.bairro,

            numero: aluno.numero,

            cep: aluno.cep,

            rua: aluno.nome_rua,

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
