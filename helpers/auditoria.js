// helpers/auditoria.js
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
    if (!usuarioId) return;

    const pool = await getPool();
    await pool
      .request()
      .input("fk_usuario", sql.Int, usuarioId)
      .input("acao", sql.VarChar(50), acao.toUpperCase().trim())
      .input("tabela_afetada", sql.VarChar(100), tabela.toLowerCase().trim())
      .input("id_registro", sql.Int, idRegistro)
      .input("descricao", sql.VarChar(sql.MAX), descricao)
      // NVarChar combinando perfeitamente com a tipagem do seu banco de dados
      .input(
        "dados_anteriores",
        sql.NVarChar(sql.MAX),
        dadosAnteriores ? String(dadosAnteriores) : null,
      )
      .input(
        "dados_novos",
        sql.NVarChar(sql.MAX),
        dadosNovos ? String(dadosNovos) : null,
      ).query(`
        INSERT INTO auditoria (
          fk_usuario, acao, tabela_afetada, id_registro, descricao, dados_anteriores, dados_novos, data_auditoria
        ) VALUES (
          @fk_usuario, @acao, @tabela_afetada, @id_registro, @descricao, @dados_anteriores, @dados_novos, GETDATE()
        )
      `);
  } catch (err) {
    console.error("Erro na gravação de Auditoria:", err.message);
  }
}

module.exports = { registrarAuditoria };
