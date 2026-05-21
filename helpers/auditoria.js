const { sql, getPool } = require("../db");

async function registrarAuditoria({
  usuarioId,
  acao,
  tabela,
  idRegistro = null,
  descricao = null,
  dadosAnteriores = null,
  dadosNovos = null,
}) {
  try {
    const pool = await getPool();

    await pool
      .request()

      .input("fk_usuario", sql.Int, usuarioId)

      .input("acao", sql.VarChar(50), acao)

      .input("tabela_afetada", sql.VarChar(100), tabela)

      .input("id_registro", sql.Int, idRegistro)

      .input("descricao", sql.VarChar(sql.MAX), descricao)

      .input(
        "dados_anteriores",
        sql.VarChar(sql.MAX),

        dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
      )

      .input(
        "dados_novos",
        sql.VarChar(sql.MAX),

        dadosNovos ? JSON.stringify(dadosNovos) : null,
      ).query(`
        INSERT INTO auditoria (
          fk_usuario,
          acao,
          tabela_afetada,
          id_registro,
          descricao,
          dados_anteriores,
          dados_novos
        )
        VALUES (
          @fk_usuario,
          @acao,
          @tabela_afetada,
          @id_registro,
          @descricao,
          @dados_anteriores,
          @dados_novos
        )
      `);
  } catch (err) {
    console.error("Erro auditoria:", err);
  }
}

module.exports = {
  registrarAuditoria,
};
