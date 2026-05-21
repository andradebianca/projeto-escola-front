const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

const { apenasAdmin } = require("../middlewares/admin.middleware");

// ========================================
// LISTAR AUDITORIA
// ========================================
router.get(
  "/auditoria",

  verificarToken,

  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
          SELECT
            a.id_auditoria,

            a.acao,

            a.tabela_afetada,

            a.id_registro,

            a.descricao,

            a.dados_anteriores,

            a.dados_novos,

            a.data_acao,

            u.id_usuario,

            u.user_name,

            u.email

          FROM auditoria a

          INNER JOIN usuario u
            ON u.id_usuario =
              a.fk_usuario

          ORDER BY
            a.data_acao DESC
        `);

      res.json({
        sucesso: true,

        auditoria: result.recordset,
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
