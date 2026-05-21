const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../../db");

const { verificarToken } = require("../../middlewares/auth.middleware");

const { apenasAdmin } = require("../../middlewares/admin.middleware");

const { registrarAuditoria } = require("../../helpers/auditoria");

// ========================================
// GET ALL PROFESSORES
// ========================================
router.get(
  "/admin/professor",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT
          p.id_professor,
          p.nome_completo,
          p.data_nacimento,

          u.id_usuario,
          u.email,
          u.user_name,

          e.id_endereco

        FROM professor p

        INNER JOIN usuario u
          ON u.id_usuario =
            p.fk_usuario

        LEFT JOIN endereco e
          ON e.id_endereco =
            p.fk_endereco

        ORDER BY p.nome_completo
      `);

      res.json({
        sucesso: true,
        professores: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// GET PROFESSOR BY ID
// ========================================
router.get(
  "/admin/professor/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_professor", sql.Int, id).query(`
          SELECT
            p.id_professor,
            p.nome_completo,
            p.data_nacimento,

            u.id_usuario,
            u.email,
            u.user_name,

            e.id_endereco

          FROM professor p

          INNER JOIN usuario u
            ON u.id_usuario =
              p.fk_usuario

          LEFT JOIN endereco e
            ON e.id_endereco =
              p.fk_endereco

          WHERE p.id_professor =
            @id_professor
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Professor não encontrado",
        });
      }

      res.json({
        sucesso: true,
        professor: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// CREATE PROFESSOR
// ========================================
router.post(
  "/admin/professor",

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

        fk_endereco,
      } = req.body || {};

      await transaction.begin();

      // =========================
      // USUÁRIO
      // =========================
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
              2
            )
          `);

      const usuario = usuarioResult.recordset[0];

      // =========================
      // PROFESSOR
      // =========================
      const professorResult = await new sql.Request(transaction)

        .input("fk_endereco", sql.Int, fk_endereco)

        .input("fk_usuario", sql.Int, usuario.id_usuario)

        .input("nome_completo", sql.VarChar(150), nome_completo)

        .input("cpf", sql.VarChar(14), cpf)

        .input("data_nacimento", sql.Date, data_nacimento).query(`
            INSERT INTO professor (
              fk_endereco,
              fk_usuario,
              nome_completo,
              data_nacimento,
              cpf
            )

            OUTPUT INSERTED.*

            VALUES (
              @fk_endereco,
              @fk_usuario,
              @nome_completo,
              @data_nacimento,
              @cpf
            )
          `);

      await transaction.commit();

      const professor = professorResult.recordset[0];

      // =========================
      // AUDITORIA
      // =========================
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "professor",

        idRegistro: professor.id_professor,

        descricao: "Professor criado",

        dadosNovos: professor,
      });

      res.status(201).json({
        sucesso: true,
        professor,
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
// UPDATE PROFESSOR
// ========================================
router.put(
  "/admin/professor/:id",

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

        fk_endereco,
      } = req.body || {};

      await transaction.begin();

      // =========================
      // BUSCAR PROFESSOR
      // =========================
      const professorResult = await new sql.Request(transaction).input(
        "id_professor",
        sql.Int,
        id,
      ).query(`
            SELECT *
            FROM professor
            WHERE id_professor =
              @id_professor
          `);

      if (professorResult.recordset.length === 0) {
        await transaction.rollback();

        return res.status(404).json({
          erro: "Professor não encontrado",
        });
      }

      const professorAnterior = professorResult.recordset[0];

      // =========================
      // UPDATE USUÁRIO
      // =========================
      await new sql.Request(transaction)

        .input("id_usuario", sql.Int, professorAnterior.fk_usuario)

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
      // UPDATE PROFESSOR
      // =========================
      await new sql.Request(transaction)

        .input("id_professor", sql.Int, id)

        .input("nome_completo", sql.VarChar(150), nome_completo)

        .input("data_nacimento", sql.Date, data_nacimento)

        .input("fk_endereco", sql.Int, fk_endereco).query(`
          UPDATE professor

          SET
            nome_completo =
              @nome_completo,

            data_nacimento =
              @data_nacimento,

            fk_endereco =
              @fk_endereco

          WHERE id_professor =
            @id_professor
        `);

      await transaction.commit();

      // =========================
      // AUDITORIA
      // =========================
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "professor",

        idRegistro: id,

        descricao: "Professor atualizado",

        dadosAnteriores: professorAnterior,

        dadosNovos: {
          email,
          user_name,
          nome_completo,
          data_nacimento,
          fk_endereco,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Professor atualizado com sucesso",
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
// DELETE PROFESSOR
// ========================================
router.delete(
  "/admin/professor/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    const transaction = new sql.Transaction(await getPool());

    try {
      const { id } = req.params;

      await transaction.begin();

      // =========================
      // BUSCAR PROFESSOR
      // =========================
      const professorResult = await new sql.Request(transaction).input(
        "id_professor",
        sql.Int,
        id,
      ).query(`
            SELECT *
            FROM professor
            WHERE id_professor =
              @id_professor
          `);

      if (professorResult.recordset.length === 0) {
        await transaction.rollback();

        return res.status(404).json({
          erro: "Professor não encontrado",
        });
      }

      const professor = professorResult.recordset[0];

      // =========================
      // DELETE TELEFONES
      // =========================
      await new sql.Request(transaction).input("fk_professor", sql.Int, id)
        .query(`
          DELETE FROM telefone_professor
          WHERE fk_professor =
            @fk_professor
        `);

      // =========================
      // DELETE DISCIPLINAS
      // =========================
      await new sql.Request(transaction).input("fk_professor", sql.Int, id)
        .query(`
          DELETE FROM disciplina
          WHERE fk_professor =
            @fk_professor
        `);

      // =========================
      // DELETE PROFESSOR
      // =========================
      await new sql.Request(transaction).input("id_professor", sql.Int, id)
        .query(`
          DELETE FROM professor
          WHERE id_professor =
            @id_professor
        `);

      // =========================
      // DELETE USUÁRIO
      // =========================
      await new sql.Request(transaction).input(
        "id_usuario",
        sql.Int,
        professor.fk_usuario,
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

        tabela: "professor",

        idRegistro: id,

        descricao: "Professor removido",

        dadosAnteriores: professor,
      });

      res.json({
        sucesso: true,
        mensagem: "Professor removido com sucesso",
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

router.get(
  "/admin/professor/:id/especializacao",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_professor", sql.Int, id).query(`
            SELECT
              pe.id,

              e.id_especializacao,
              e.nome,
              e.descricao,
              e.carga_horaria

            FROM professor_especializacao pe

            INNER JOIN especializacao e
              ON e.id_especializacao =
                pe.fk_especializacao

            WHERE pe.fk_professor =
              @id_professor
          `);

      res.json({
        sucesso: true,
        especializacoes: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);
