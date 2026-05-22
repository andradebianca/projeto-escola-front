const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../../db");
const { verificarToken } = require("../../middlewares/auth.middleware");
const { apenasAdmin } = require("../../middlewares/admin.middleware");
const { registrarAuditoria } = require("../../helpers/auditoria");

router.get(
  "/admin/professor",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
      SELECT p.id_professor, p.nome_completo, p.data_nacimento, p.cpf, u.id_usuario, u.email, u.user_name
      FROM professor p INNER JOIN usuario u ON u.id_usuario = p.fk_usuario ORDER BY p.nome_completo
    `);
      res.json({ sucesso: true, professores: result.recordset });
    } catch (err) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },
);

router.get(
  "/admin/professor/:id",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getPool();
      const profResult = await pool.request().input("id_professor", sql.Int, id)
        .query(`
      SELECT p.id_professor, p.nome_completo, p.data_nacimento, p.cpf, u.email, u.user_name,
      e.id_endereco, e.numero, r.nome_rua AS rua, r.cep, r.bairro, c.nome_cidade AS cidade, uf.nome_estado AS uf
      FROM professor p INNER JOIN usuario u ON u.id_usuario = p.fk_usuario
      LEFT JOIN endereco e ON e.id_endereco = p.fk_endereco LEFT JOIN rua r ON r.id_rua = e.fk_rua
      LEFT JOIN cidade c ON c.id_cidade = e.fk_cidade LEFT JOIN uf ON uf.id_uf = e.fk_uf
      WHERE p.id_professor = @id_professor
    `);
      if (profResult.recordset.length === 0)
        return res
          .status(404)
          .json({ sucesso: false, erro: "Professor não encontrado" });
      const professor = profResult.recordset[0];
      const fonesResult = await pool
        .request()
        .input("fk_professor", sql.Int, id)
        .query(
          `SELECT telefone FROM telefone_professor WHERE fk_professor = @fk_professor`,
        );
      professor.telefones = fonesResult.recordset.map((row) => row.telefone);
      res.json({ sucesso: true, professor });
    } catch (err) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },
);

router.post(
  "/admin/professor",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
      const {
        email,
        user_name,
        senha,
        cpf,
        nome_completo,
        data_nacimento,
        endereco,
        telefones,
      } = req.body;
      await transaction.begin();

      let ufId, cidadeId, ruaId;
      const ufRes = await new sql.Request(transaction)
        .input("uf", sql.VarChar, endereco.uf)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM uf WHERE nome_estado = @uf) INSERT INTO uf (nome_estado) OUTPUT INSERTED.id_uf VALUES (@uf); ELSE SELECT id_uf FROM uf WHERE nome_estado = @uf;`,
        );
      ufId = ufRes.recordset[0].id_uf;

      const cidRes = await new sql.Request(transaction)
        .input("cidade", sql.VarChar, endereco.cidade)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM cidade WHERE nome_cidade = @cidade) INSERT INTO cidade (nome_cidade) OUTPUT INSERTED.id_cidade VALUES (@cidade); ELSE SELECT id_cidade FROM cidade WHERE nome_cidade = @cidade;`,
        );
      cidadeId = cidRes.recordset[0].id_cidade;

      const ruaRes = await new sql.Request(transaction)
        .input("rua", sql.VarChar, endereco.rua)
        .input("cep", sql.VarChar, endereco.cep)
        .input("bairro", sql.VarChar, endereco.bairro)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM rua WHERE nome_rua = @rua AND cep = @cep) INSERT INTO rua (nome_rua, cep, bairro) OUTPUT INSERTED.id_rua VALUES (@rua, @cep, @bairro); ELSE SELECT id_rua FROM rua WHERE nome_rua = @rua AND cep = @cep;`,
        );
      ruaId = ruaRes.recordset[0].id_rua;

      const endRes = await new sql.Request(transaction)
        .input("fk_uf", sql.Int, ufId)
        .input("fk_cidade", sql.Int, cidadeId)
        .input("fk_rua", sql.Int, ruaId)
        .input("numero", sql.VarChar, endereco.numero)
        .query(
          `INSERT INTO endereco (fk_uf, fk_cidade, fk_rua, numero) OUTPUT INSERTED.id_endereco VALUES (@fk_uf, @fk_cidade, @fk_rua, @numero);`,
        );
      const idEnd = endRes.recordset[0].id_endereco;

      const userRes = await new sql.Request(transaction)
        .input("email", sql.VarChar, email)
        .input("user_name", sql.VarChar, user_name)
        .input("senha", sql.VarChar, senha)
        .query(
          `IF EXISTS (SELECT 1 FROM usuario WHERE email = @email OR user_name = @user_name) THROW 51000, 'Email/usuário indisponível.', 1; INSERT INTO usuario (email, user_name, senha, nivel_acesso) OUTPUT INSERTED.id_usuario VALUES (@email, @user_name, @senha, 2);`,
        );
      const idUsr = userRes.recordset[0].id_usuario;

      const profRes = await new sql.Request(transaction)
        .input("fk_endereco", sql.Int, idEnd)
        .input("fk_usuario", sql.Int, idUsr)
        .input("nome", sql.VarChar, nome_completo)
        .input("nascimento", sql.Date, data_nacimento)
        .input("cpf", sql.VarChar, cpf)
        .query(
          `IF EXISTS (SELECT 1 FROM professor WHERE cpf = @cpf) THROW 51001, 'CPF já cadastrado.', 1; INSERT INTO professor (fk_endereco, fk_usuario, nome_completo, data_nacimento, cpf) OUTPUT INSERTED.id_professor VALUES (@fk_endereco, @fk_usuario, @nome, @nascimento, @cpf);`,
        );
      const idProf = profRes.recordset[0].id_professor;

      if (telefones && Array.isArray(telefones)) {
        for (const fone of telefones) {
          await new sql.Request(transaction)
            .input("fk_professor", sql.Int, idProf)
            .input("telefone", sql.VarChar, fone)
            .query(
              `INSERT INTO telefone_professor (fk_professor, telefone) VALUES (@fk_professor, @telefone);`,
            );
        }
      }
      await transaction.commit();

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "CREATE",
        tabela: "professor",
        idRegistro: idProf,
        descricao: `Cadastrou o docente ${nome_completo}`,
      });

      res.status(201).json({ sucesso: true });
    } catch (err) {
      if (transaction._begun) await transaction.rollback();
      res
        .status(err.number && err.number >= 50000 ? 400 : 500)
        .json({ sucesso: false, erro: err.message });
    }
  },
);

router.put(
  "/admin/professor/:id",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    const { id } = req.params;
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
      const {
        email,
        user_name,
        nome_completo,
        data_nacimento,
        endereco,
        telefones,
      } = req.body;
      await transaction.begin();

      const atualResult = await new sql.Request(transaction)
        .input("id_professor", sql.Int, id)
        .query(
          `SELECT fk_usuario, fk_endereco FROM professor WHERE id_professor = @id_professor`,
        );
      const current = atualResult.recordset[0];

      await new sql.Request(transaction)
        .input("id_usuario", sql.Int, current.fk_usuario)
        .input("email", sql.VarChar, email)
        .input("user_name", sql.VarChar, user_name)
        .query(
          `UPDATE usuario SET email = @email, user_name = @user_name WHERE id_usuario = @id_usuario`,
        );

      let ufId, cidadeId, ruaId;
      const ufRes = await new sql.Request(transaction)
        .input("uf", sql.VarChar, endereco.uf)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM uf WHERE nome_estado = @uf) INSERT INTO uf (nome_estado) OUTPUT INSERTED.id_uf VALUES (@uf); ELSE SELECT id_uf FROM uf WHERE nome_estado = @uf;`,
        );
      ufId = ufRes.recordset[0].id_uf;

      const cidRes = await new sql.Request(transaction)
        .input("cidade", sql.VarChar, endereco.cidade)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM cidade WHERE nome_cidade = @cidade) INSERT INTO cidade (nome_cidade) OUTPUT INSERTED.id_cidade VALUES (@cidade); ELSE SELECT id_cidade FROM cidade WHERE nome_cidade = @cidade;`,
        );
      cidadeId = cidRes.recordset[0].id_cidade;

      const ruaRes = await new sql.Request(transaction)
        .input("rua", sql.VarChar, endereco.rua)
        .input("cep", sql.VarChar, endereco.cep)
        .input("bairro", sql.VarChar, endereco.bairro)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM rua WHERE nome_rua = @rua AND cep = @cep) INSERT INTO rua (nome_rua, cep, bairro) OUTPUT INSERTED.id_rua VALUES (@rua, @cep, @bairro); ELSE SELECT id_rua FROM rua WHERE nome_rua = @rua AND cep = @cep;`,
        );
      ruaId = ruaRes.recordset[0].id_rua;

      await new sql.Request(transaction)
        .input("id_endereco", sql.Int, current.fk_endereco)
        .input("fk_uf", sql.Int, ufId)
        .input("fk_cidade", sql.Int, cidadeId)
        .input("fk_rua", sql.Int, ruaId)
        .input("numero", sql.VarChar, endereco.numero)
        .query(
          `UPDATE endereco SET fk_uf = @fk_uf, fk_cidade = @fk_cidade, fk_rua = @fk_rua, numero = @numero WHERE id_endereco = @id_endereco`,
        );
      await new sql.Request(transaction)
        .input("id_professor", sql.Int, id)
        .input("nome_completo", sql.VarChar, nome_completo)
        .input("data_nacimento", sql.Date, data_nacimento)
        .query(
          `UPDATE professor SET nome_completo = @nome_completo, data_nacimento = @data_nacimento WHERE id_professor = @id_professor`,
        );

      await new sql.Request(transaction)
        .input("fk_professor", sql.Int, id)
        .query(
          `DELETE FROM telefone_professor WHERE fk_professor = @fk_professor`,
        );
      if (telefones && Array.isArray(telefones)) {
        for (const fone of telefones) {
          await new sql.Request(transaction)
            .input("fk_professor", sql.Int, id)
            .input("telefone", sql.VarChar, fone)
            .query(
              `INSERT INTO telefone_professor (fk_professor, telefone) VALUES (@fk_professor, @telefone);`,
            );
        }
      }
      await transaction.commit();

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "UPDATE",
        tabela: "professor",
        idRegistro: id,
        descricao: `Atualizou os dados do professor ${nome_completo}`,
        dadosNovos: JSON.stringify({ email, user_name, nome_completo }),
      });

      res.json({ sucesso: true });
    } catch (err) {
      if (transaction._begun) await transaction.rollback();
      res.status(500).json({ sucesso: false, erro: err.message });
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
        .input("fk_professor", sql.Int, id)
        .query(
          `SELECT pe.id AS id_vinculo, e.id_especializacao, e.nome, e.carga_horaria FROM professor_especializacao pe INNER JOIN especializacao e ON e.id_especializacao = pe.fk_especializacao WHERE pe.fk_professor = @fk_professor`,
        );
      res.json({ sucesso: true, especializacoes: result.recordset });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  },
);

router.post(
  "/admin/professor/especializacao",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const { fk_professor, fk_especializacao } = req.body;
      const pool = await getPool();
      await pool
        .request()
        .input("fk_professor", sql.Int, fk_professor)
        .input("fk_especializacao", sql.Int, fk_especializacao)
        .query(
          `INSERT INTO professor_especializacao (fk_professor, fk_especializacao) VALUES (@fk_professor, @fk_especializacao)`,
        );

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "CREATE",
        tabela: "professor_especializacao",
        descricao: `Vinculou uma especialização ao professor (ID: ${fk_professor})`,
      });
      res.json({ sucesso: true });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  },
);

router.delete(
  "/admin/professor/:id/especializacao/:idVinculo",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const { id, idVinculo } = req.params;
      const pool = await getPool();
      await pool
        .request()
        .input("id", sql.Int, idVinculo)
        .input("fk_professor", sql.Int, id)
        .query(
          `DELETE FROM professor_especializacao WHERE id = @id AND fk_professor = @fk_professor`,
        );

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "DELETE",
        tabela: "professor_especializacao",
        idRegistro: idVinculo,
        descricao: `Desvinculou uma especialização do professor (ID: ${id})`,
      });
      res.json({ sucesso: true });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  },
);

module.exports = router;
