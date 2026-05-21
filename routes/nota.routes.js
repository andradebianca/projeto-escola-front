const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

const { registrarAuditoria } = require("../helpers/auditoria");

router.post(
  "/nota",

  verificarToken,

  async (req, res) => {
    try {
      const {
        fk_turma_disciplina,
        fk_aluno,
        valor_nota,
        descricao,
        periodo_nota,
        data_aplicacao,
      } = req.body || {};

      if (
        !fk_turma_disciplina ||
        !fk_aluno ||
        valor_nota === undefined ||
        !descricao ||
        !periodo_nota ||
        !data_aplicacao
      ) {
        return res.status(400).json({
          erro: "Todos os campos são obrigatórios",
        });
      }

      const pool = await getPool();

      const quantidadeResult = await pool
        .request()
        .input("fk_turma_disciplina", sql.Int, fk_turma_disciplina)
        .input("fk_aluno", sql.Int, fk_aluno).query(`
            SELECT COUNT(*) AS total
            FROM notas
            WHERE fk_turma_disciplina =
              @fk_turma_disciplina
              AND fk_aluno =
                @fk_aluno
          `);

      const total = quantidadeResult.recordset[0].total;

      if (total >= 3) {
        return res.status(400).json({
          erro: "Aluno já possui 3 notas",
        });
      }

      await pool
        .request()
        .input("fk_turma_disciplina", sql.Int, fk_turma_disciplina)
        .input("fk_aluno", sql.Int, fk_aluno)
        .input("valor_nota", sql.Decimal(5, 2), valor_nota)
        .input("descricao", sql.VarChar, descricao)
        .input("periodo_nota", sql.Int, periodo_nota)
        .input("data_aplicacao", sql.Date, data_aplicacao).query(`
          INSERT INTO notas (
            fk_turma_disciplina,
            fk_aluno,
            data_aplicacao,
            valor_nota,
            descricao,
            periodo_nota
          )
          VALUES (
            @fk_turma_disciplina,
            @fk_aluno,
            @data_aplicacao,
            @valor_nota,
            @descricao,
            @periodo_nota
          )
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "notas",

        descricao: "Nova nota cadastrada",

        dadosNovos: {
          fk_turma_disciplina,
          fk_aluno,
          valor_nota,
        },
      });

      res.status(201).json({
        sucesso: true,
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
