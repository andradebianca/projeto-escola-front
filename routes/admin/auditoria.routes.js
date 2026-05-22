const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../../db");
const { verificarToken } = require("../../middlewares/auth.middleware");
const { apenasAdmin } = require("../../middlewares/admin.middleware");
// GET ALL LOGS: Lista a trilha de auditoria pura e estável
router.get(
  "/admin/auditoria",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
      SELECT 
        a.id_auditoria,
        a.data_acao,
        a.acao,
        a.tabela_afetada,
        a.id_registro,
        a.descricao,
        a.dados_anteriores,
        a.dados_novos,
        u.email,
        u.user_name
      FROM auditoria a
      INNER JOIN usuario u ON u.id_usuario = a.fk_usuario
      ORDER BY a.data_acao DESC
    `);

      res.json({
        sucesso: true,
        logs: result.recordset,
      });
    } catch (err) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },
);

module.exports = router;
