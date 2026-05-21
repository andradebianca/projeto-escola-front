const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../../db");

const { verificarToken } = require("../../middlewares/auth.middleware");

const { apenasAdmin } = require("../../middlewares/admin.middleware");

const { registrarAuditoria } = require("../../helpers/auditoria");

router.get(
  "/admin/aluno",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT
          a.id_aluno,
          a.nome_completo,
          a.data_nacimento,
          a.matricula,

          u.id_usuario,
          u.email,
          u.user_name,

          t.id_turma,
          t.cod_turma,
          t.ano_letivo,

          e.id_endereco

        FROM alunos a

        INNER JOIN usuario u
          ON u.id_usuario =
            a.fk_usuario

        LEFT JOIN turma t
          ON t.id_turma =
            a.fk_turma

        LEFT JOIN endereco e
          ON e.id_endereco =
            a.fk_endereco

        ORDER BY a.nome_completo
      `);

      res.json({
        sucesso: true,
        alunos: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.get(
  "/admin/aluno/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_aluno", sql.Int, id).query(`
          SELECT
            a.id_aluno,
            a.nome_completo,
            a.data_nacimento,
            a.matricula,

            u.id_usuario,
            u.email,
            u.user_name,

            t.id_turma,
            t.cod_turma,
            t.ano_letivo,

            e.id_endereco

          FROM alunos a

          INNER JOIN usuario u
            ON u.id_usuario =
              a.fk_usuario

          LEFT JOIN turma t
            ON t.id_turma =
              a.fk_turma

          LEFT JOIN endereco e
            ON e.id_endereco =
              a.fk_endereco

          WHERE a.id_aluno =
            @id_aluno
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Aluno não encontrado",
        });
      }

      res.json({
        sucesso: true,
        aluno: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.post(
  "/admin/aluno",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    const transaction = new sql.Transaction(await getPool());

    try {
      const {
        email,
        user_name,
        senha,

        nome_completo,
        cpf,
        data_nacimento,
        matricula,

        fk_turma,
        fk_endereco,
      } = req.body || {};

      await transaction.begin();

      // USUÁRIO
      const usuarioResult = await new sql.Request(transaction)

        .input("email", sql.VarChar(100), email)

        .input("user_name", sql.VarChar(100), user_name)

        .input("senha", sql.VarChar(30), senha).query(`
            INSERT INTO usuario (
              email,
              user_name,
              senha,
              nivel_acesso
            )

            OUTPUT INSERTED.*

            VALUES (
              @email,
              @user_name,
              @senha,
              3
            )
          `);

      const usuario = usuarioResult.recordset[0];

      // ALUNO
      const alunoResult = await new sql.Request(transaction)

        .input("fk_turma", sql.Int, fk_turma)

        .input("fk_endereco", sql.Int, fk_endereco)

        .input("fk_usuario", sql.Int, usuario.id_usuario)

        .input("nome_completo", sql.VarChar(150), nome_completo)

        .input("cpf", sql.VarChar(14), cpf)

        .input("data_nacimento", sql.Date, data_nacimento)

        .input("matricula", sql.Int, matricula).query(`
            INSERT INTO alunos (
              fk_turma,
              fk_endereco,
              fk_usuario,
              nome_completo,
              data_nacimento,
              cpf,
              matricula
            )

            OUTPUT INSERTED.*

            VALUES (
              @fk_turma,
              @fk_endereco,
              @fk_usuario,
              @nome_completo,
              @data_nacimento,
              @cpf,
              @matricula
            )
          `);

      await transaction.commit();

      const aluno = alunoResult.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "alunos",

        idRegistro: aluno.id_aluno,

        descricao: "Aluno criado",

        dadosNovos: aluno,
      });

      res.status(201).json({
        sucesso: true,
        aluno,
      });
    } catch (err) {
      await transaction.rollback();

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// UPDATE ALUNO
// ========================================
router.put(
  "/admin/aluno/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    const transaction = new sql.Transaction(await getPool());

    try {
      const { id } = req.params;

      const {
        email,
        user_name,

        nome_completo,
        data_nacimento,
        matricula,

        fk_turma,
        fk_endereco,
      } = req.body || {};

      await transaction.begin();

      // =========================
      // BUSCAR ALUNO
      // =========================
      const alunoResult = await new sql.Request(transaction).input(
        "id_aluno",
        sql.Int,
        id,
      ).query(`
            SELECT *
            FROM alunos
            WHERE id_aluno =
              @id_aluno
          `);

      if (alunoResult.recordset.length === 0) {
        await transaction.rollback();

        return res.status(404).json({
          erro: "Aluno não encontrado",
        });
      }

      const alunoAnterior = alunoResult.recordset[0];

      // =========================
      // UPDATE USUÁRIO
      // =========================
      await new sql.Request(transaction)

        .input("id_usuario", sql.Int, alunoAnterior.fk_usuario)

        .input("email", sql.VarChar(100), email)

        .input("user_name", sql.VarChar(100), user_name).query(`
          UPDATE usuario

          SET
            email =
              @email,

            user_name =
              @user_name

          WHERE id_usuario =
            @id_usuario
        `);

      // =========================
      // UPDATE ALUNO
      // =========================
      await new sql.Request(transaction)

        .input("id_aluno", sql.Int, id)

        .input("nome_completo", sql.VarChar(150), nome_completo)

        .input("data_nacimento", sql.Date, data_nacimento)

        .input("matricula", sql.Int, matricula)

        .input("fk_turma", sql.Int, fk_turma)

        .input("fk_endereco", sql.Int, fk_endereco).query(`
          UPDATE alunos

          SET
            nome_completo =
              @nome_completo,

            data_nacimento =
              @data_nacimento,

            matricula =
              @matricula,

            fk_turma =
              @fk_turma,

            fk_endereco =
              @fk_endereco

          WHERE id_aluno =
            @id_aluno
        `);

      await transaction.commit();

      // =========================
      // AUDITORIA
      // =========================
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "alunos",

        idRegistro: id,

        descricao: "Aluno atualizado",

        dadosAnteriores: alunoAnterior,

        dadosNovos: {
          email,
          user_name,
          nome_completo,
          data_nacimento,
          matricula,
          fk_turma,
          fk_endereco,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Aluno atualizado com sucesso",
      });
    } catch (err) {
      await transaction.rollback();

      console.error(err);

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// DELETE ALUNO
// ========================================
router.delete(
  "/admin/aluno/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    const transaction = new sql.Transaction(await getPool());

    try {
      const { id } = req.params;

      await transaction.begin();

      // =========================
      // BUSCAR ALUNO
      // =========================
      const alunoResult = await new sql.Request(transaction).input(
        "id_aluno",
        sql.Int,
        id,
      ).query(`
            SELECT *
            FROM alunos
            WHERE id_aluno =
              @id_aluno
          `);

      if (alunoResult.recordset.length === 0) {
        await transaction.rollback();

        return res.status(404).json({
          erro: "Aluno não encontrado",
        });
      }

      const aluno = alunoResult.recordset[0];

      // =========================
      // DELETE TELEFONES
      // =========================
      await new sql.Request(transaction).input("fk_aluno", sql.Int, id).query(`
          DELETE FROM telefone_aluno
          WHERE fk_aluno =
            @fk_aluno
        `);

      // =========================
      // DELETE NOTAS
      // =========================
      await new sql.Request(transaction).input("fk_aluno", sql.Int, id).query(`
          DELETE FROM notas
          WHERE fk_aluno =
            @fk_aluno
        `);

      // =========================
      // DELETE ALUNO
      // =========================
      await new sql.Request(transaction).input("id_aluno", sql.Int, id).query(`
          DELETE FROM alunos
          WHERE id_aluno =
            @id_aluno
        `);

      // =========================
      // DELETE USUÁRIO
      // =========================
      await new sql.Request(transaction).input(
        "id_usuario",
        sql.Int,
        aluno.fk_usuario,
      ).query(`
          DELETE FROM usuario
          WHERE id_usuario =
            @id_usuario
        `);

      await transaction.commit();

      // =========================
      // AUDITORIA
      // =========================
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "alunos",

        idRegistro: id,

        descricao: "Aluno removido",

        dadosAnteriores: aluno,
      });

      res.json({
        sucesso: true,
        mensagem: "Aluno removido com sucesso",
      });
    } catch (err) {
      await transaction.rollback();

      console.error(err);

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);
