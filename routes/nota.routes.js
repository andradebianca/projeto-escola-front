const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

const { registrarAuditoria } = require("../helpers/auditoria");

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
            n.data_criacao,
            n.periodo_nota,

            a.id_aluno,
            a.nome_completo AS aluno,
            a.matricula,

            d.id_disciplina,
            d.nome AS disciplina,

            p.id_professor,
            p.nome_completo AS professor,

            t.id_turma,
            t.cod_turma,
            t.turno,
            t.ano_letivo

          FROM notas n

          INNER JOIN alunos a
            ON a.id_aluno =
              n.fk_aluno

          INNER JOIN turma_disciplina td
            ON td.id_turma_disciplina =
              n.fk_turma_disciplina

          INNER JOIN turma t
            ON t.id_turma =
              td.fk_turma

          INNER JOIN disciplina d
            ON d.id_disciplina =
              td.fk_disciplina

          INNER JOIN professor p
            ON p.id_professor =
              d.fk_professor

          WHERE n.id_nota =
            @id_nota
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Nota não encontrada",
        });
      }

      res.json({
        sucesso: true,
        nota: result.recordset[0],
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
// CADASTRAR NOTA
// ========================================
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

      // =========================
      // VALIDAÇÃO
      // =========================
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

      // =========================
      // LIMITE DE 3 NOTAS
      // =========================
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
          erro: "Aluno já possui 3 notas nesta disciplina",
        });
      }

      // =========================
      // VALIDAR PERÍODO REPETIDO
      // =========================
      const periodoResult = await pool
        .request()
        .input("fk_turma_disciplina", sql.Int, fk_turma_disciplina)
        .input("fk_aluno", sql.Int, fk_aluno)
        .input("periodo_nota", sql.Int, periodo_nota).query(`
            SELECT id_nota

            FROM notas

            WHERE fk_turma_disciplina =
              @fk_turma_disciplina

              AND fk_aluno =
                @fk_aluno

              AND periodo_nota =
                @periodo_nota
          `);

      if (periodoResult.recordset.length > 0) {
        return res.status(400).json({
          erro: "Já existe nota cadastrada neste período",
        });
      }

      // =========================
      // INSERT
      // =========================
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

      // =========================
      // AUDITORIA
      // =========================
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "notas",

        descricao: "Nota cadastrada",

        dadosNovos: {
          fk_turma_disciplina,
          fk_aluno,
          valor_nota,
          periodo_nota,
        },
      });

      res.status(201).json({
        sucesso: true,
        mensagem: "Nota cadastrada com sucesso",
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
// EDITAR NOTA
// ========================================
router.put(
  "/nota/:id",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { valor_nota, descricao, periodo_nota } = req.body || {};

      if (valor_nota === undefined || !descricao || !periodo_nota) {
        return res.status(400).json({
          erro: "Todos os campos são obrigatórios",
        });
      }

      const pool = await getPool();

      // =========================
      // BUSCAR NOTA
      // =========================
      const notaResult = await pool.request().input("id_nota", sql.Int, id)
        .query(`
          SELECT *
          FROM notas
          WHERE id_nota = @id_nota
        `);

      if (notaResult.recordset.length === 0) {
        return res.status(404).json({
          erro: "Nota não encontrada",
        });
      }

      const nota = notaResult.recordset[0];

      // =========================
      // LIMITE DE 2 DIAS
      // =========================
      const dataCriacao = new Date(nota.data_criacao);

      const agora = new Date();

      const diferencaDias = (agora - dataCriacao) / (1000 * 60 * 60 * 24);

      if (diferencaDias > 2) {
        return res.status(403).json({
          erro: "Não é possível editar após 2 dias",
        });
      }

      // =========================
      // VALIDAR PERÍODO REPETIDO
      // =========================
      const periodoExistente = await pool
        .request()

        .input("id_nota", sql.Int, id)

        .input("periodo_nota", sql.Int, periodo_nota).query(`
            SELECT n.id_nota

            FROM notas n

            WHERE n.periodo_nota =
              @periodo_nota

              AND n.id_nota !=
                @id_nota

              AND n.fk_aluno = (
                SELECT fk_aluno
                FROM notas
                WHERE id_nota =
                  @id_nota
              )

              AND n.fk_turma_disciplina = (
                SELECT fk_turma_disciplina
                FROM notas
                WHERE id_nota =
                  @id_nota
              )
          `);

      if (periodoExistente.recordset.length > 0) {
        return res.status(400).json({
          erro: "Já existe nota cadastrada neste período",
        });
      }

      // =========================
      // UPDATE
      // =========================
      await pool
        .request()
        .input("id_nota", sql.Int, id)
        .input("valor_nota", sql.Decimal(5, 2), valor_nota)
        .input("descricao", sql.VarChar, descricao)
        .input("periodo_nota", sql.Int, periodo_nota).query(`
          UPDATE notas

          SET
            valor_nota =
              @valor_nota,

            descricao =
              @descricao,

            periodo_nota =
              @periodo_nota

          WHERE id_nota =
            @id_nota
        `);

      // =========================
      // AUDITORIA
      // =========================
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "notas",

        idRegistro: id,

        descricao: "Nota atualizada",

        dadosAnteriores: nota,

        dadosNovos: {
          valor_nota,
          descricao,
          periodo_nota,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Nota atualizada com sucesso",
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
// EXCLUIR NOTA
// ========================================
router.delete(
  "/nota/:id",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      // =========================
      // BUSCAR NOTA
      // =========================
      const notaResult = await pool.request().input("id_nota", sql.Int, id)
        .query(`
          SELECT *
          FROM notas
          WHERE id_nota = @id_nota
        `);

      if (notaResult.recordset.length === 0) {
        return res.status(404).json({
          erro: "Nota não encontrada",
        });
      }

      const nota = notaResult.recordset[0];

      // =========================
      // LIMITE DE 2 DIAS
      // =========================
      const dataCriacao = new Date(nota.data_criacao);

      const agora = new Date();

      const diferencaDias = (agora - dataCriacao) / (1000 * 60 * 60 * 24);

      if (diferencaDias > 2) {
        return res.status(403).json({
          erro: "Não é possível excluir após 2 dias",
        });
      }

      // =========================
      // DELETE
      // =========================
      await pool.request().input("id_nota", sql.Int, id).query(`
          DELETE FROM notas
          WHERE id_nota = @id_nota
        `);

      // =========================
      // AUDITORIA
      // =========================
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "DELETE",
        tabela: "notas",
        idRegistro: id,
        descricao: `Removeu a nota ${nota.valor_nota} do aluno (ID: ${nota.fk_aluno})`,
      });

      res.json({
        sucesso: true,
        mensagem: "Nota removida com sucesso",
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
