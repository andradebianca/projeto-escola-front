const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../../db");
const { verificarToken } = require("../../middlewares/auth.middleware");
const { apenasAdmin } = require("../../middlewares/admin.middleware");
const { registrarAuditoria } = require("../../helpers/auditoria");

router.get(
  "/admin/especializacao",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .query(
          `SELECT id_especializacao, nome, descricao, carga_horaria FROM especializacao ORDER BY nome`,
        );
      res.json({ sucesso: true, especializacoes: result.recordset });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  },
);

router.get(
  "/admin/especializacao/:id",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getPool();
      const result = await pool
        .request()
        .input("id_especializacao", sql.Int, id)
        .query(
          `SELECT * FROM especializacao WHERE id_especializacao = @id_especializacao`,
        );
      if (result.recordset.length === 0)
        return res.status(404).json({ erro: "Especialização não encontrada" });
      res.json({ sucesso: true, especializacao: result.recordset[0] });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  },
);

router.post(
  "/admin/especializacao",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const { nome, descricao, carga_horaria } = req.body;
      const pool = await getPool();
      const result = await pool
        .request()
        .input("nome", sql.VarChar, nome)
        .input("descricao", sql.VarChar, descricao)
        .input("carga_horaria", sql.Int, carga_horaria)
        .query(
          `INSERT INTO especializacao (nome, descricao, carga_horaria) OUTPUT INSERTED.id_especializacao VALUES (@nome, @descricao, @carga_horaria)`,
        );

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "CREATE",
        tabela: "especializacao",
        idRegistro: result.recordset[0].id_especializacao,
        descricao: `Criou a titulação: ${nome}`,
      });
      res.status(201).json({ sucesso: true });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  },
);

router.put(
  "/admin/especializacao/:id",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, descricao, carga_horaria } = req.body;
      const pool = await getPool();

      const anterior = await pool
        .request()
        .input("id_especializacao", sql.Int, id)
        .query(
          `SELECT * FROM especializacao WHERE id_especializacao = @id_especializacao`,
        );
      if (anterior.recordset.length === 0)
        return res.status(404).json({ erro: "Especialização não encontrada" });

      await pool
        .request()
        .input("id_especializacao", sql.Int, id)
        .input("nome", sql.VarChar, nome)
        .input("descricao", sql.VarChar, descricao)
        .input("carga_horaria", sql.Int, carga_horaria)
        .query(
          `UPDATE especializacao SET nome = @nome, descricao = @descricao, carga_horaria = @carga_horaria WHERE id_especializacao = @id_especializacao`,
        );

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "UPDATE",
        tabela: "especializacao",
        idRegistro: id,
        descricao: `Editou detalhes da titulação ${nome}`,
        dadosAnteriores: JSON.stringify(anterior.recordset[0]),
        dadosNovos: JSON.stringify(req.body),
      });
      res.json({ sucesso: true });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  },
);

router.delete(
  "/admin/especializacao/:id",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getPool();

      const anterior = await pool
        .request()
        .input("id_especializacao", sql.Int, id)
        .query(
          `SELECT nome FROM especializacao WHERE id_especializacao = @id_especializacao`,
        );
      if (anterior.recordset.length === 0)
        return res.status(404).json({ erro: "Especialização não encontrada" });

      await pool
        .request()
        .input("fk_especializacao", sql.Int, id)
        .query(
          `DELETE FROM professor_especializacao WHERE fk_especializacao = @fk_especializacao`,
        );
      await pool
        .request()
        .input("id_especializacao", sql.Int, id)
        .query(
          `DELETE FROM especializacao WHERE id_especializacao = @id_especializacao`,
        );

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "DELETE",
        tabela: "especializacao",
        idRegistro: id,
        descricao: `Removeu a titulação: ${anterior.recordset[0].nome}`,
      });
      res.json({ sucesso: true });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  },
);

module.exports = router;
