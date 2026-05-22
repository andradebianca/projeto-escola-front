const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../../db");
const { verificarToken } = require("../../middlewares/auth.middleware");
const { apenasAdmin } = require("../../middlewares/admin.middleware");
const { registrarAuditoria } = require("../../helpers/auditoria");

router.get("/admin/aluno", verificarToken, apenasAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        a.id_aluno, a.nome_completo, a.data_nacimento, a.matricula, a.cpf,
        u.id_usuario, u.email, u.user_name,
        t.id_turma, t.cod_turma, t.turno
      FROM alunos a
      INNER JOIN usuario u ON u.id_usuario = a.fk_usuario
      LEFT JOIN turma t ON t.id_turma = a.fk_turma
      ORDER BY a.nome_completo
    `);
    res.json({ sucesso: true, alunos: result.recordset });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

router.get(
  "/admin/aluno/:id",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getPool();
      const alunoResult = await pool.request().input("id_aluno", sql.Int, id)
        .query(`
      SELECT
        a.id_aluno, a.nome_completo, a.data_nacimento, a.matricula, a.cpf, a.fk_turma AS id_turma,
        u.email, u.user_name,
        e.id_endereco, e.numero,
        r.nome_rua AS rua, r.cep, r.bairro,
        c.nome_cidade AS cidade,
        uf.nome_estado AS uf
      FROM alunos a
      INNER JOIN usuario u ON u.id_usuario = a.fk_usuario
      LEFT JOIN endereco e ON e.id_endereco = a.fk_endereco
      LEFT JOIN rua r ON r.id_rua = e.fk_rua
      LEFT JOIN cidade c ON c.id_cidade = e.fk_cidade
      LEFT JOIN uf ON uf.id_uf = e.fk_uf
      WHERE a.id_aluno = @id_aluno
    `);

      if (alunoResult.recordset.length === 0)
        return res
          .status(404)
          .json({ sucesso: false, erro: "Aluno não encontrado" });

      const aluno = alunoResult.recordset[0];
      const fonesResult = await pool
        .request()
        .input("fk_aluno", sql.Int, id)
        .query(
          `SELECT telefone FROM telefone_aluno WHERE fk_aluno = @fk_aluno`,
        );
      aluno.telefones = fonesResult.recordset.map((row) => row.telefone);

      res.json({ sucesso: true, aluno });
    } catch (err) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },
);

router.post("/admin/aluno", verificarToken, apenasAdmin, async (req, res) => {
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
      matricula,
      fk_turma,
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
        `IF EXISTS (SELECT 1 FROM usuario WHERE email = @email OR user_name = @user_name) THROW 51000, 'Email ou usuário indisponível.', 1; INSERT INTO usuario (email, user_name, senha, nivel_acesso) OUTPUT INSERTED.id_usuario VALUES (@email, @user_name, @senha, 3);`,
      );
    const idUsr = userRes.recordset[0].id_usuario;

    const alunoRes = await new sql.Request(transaction)
      .input("fk_turma", sql.Int, fk_turma || null)
      .input("fk_endereco", sql.Int, idEnd)
      .input("fk_usuario", sql.Int, idUsr)
      .input("nome", sql.VarChar, nome_completo)
      .input("nascimento", sql.Date, data_nacimento)
      .input("cpf", sql.VarChar, cpf)
      .input("matricula", sql.Int, matricula)
      .query(
        `IF EXISTS (SELECT 1 FROM alunos WHERE cpf = @cpf OR matricula = @matricula) THROW 51001, 'CPF ou Matrícula já existe.', 1; INSERT INTO alunos (fk_turma, fk_endereco, fk_usuario, nome_completo, data_nacimento, cpf, matricula) OUTPUT INSERTED.id_aluno VALUES (@fk_turma, @fk_endereco, @fk_usuario, @nome, @nascimento, @cpf, @matricula);`,
      );
    const idAluno = alunoRes.recordset[0].id_aluno;

    if (telefones && Array.isArray(telefones)) {
      for (const fone of telefones) {
        await new sql.Request(transaction)
          .input("fk_aluno", sql.Int, idAluno)
          .input("telefone", sql.VarChar, fone)
          .query(
            `INSERT INTO telefone_aluno (fk_aluno, telefone) VALUES (@fk_aluno, @telefone);`,
          );
      }
    }

    await transaction.commit();

    // AUDITORIA LIMPA: Só a ação e a descrição. Nada de JSON!
    await registrarAuditoria({
      usuarioId: req.usuario.id_usuario,
      acao: "CREATE",
      tabela: "alunos",
      idRegistro: idAluno,
      descricao: `Cadastrou o aluno(a) ${nome_completo}`,
    });

    res
      .status(201)
      .json({ sucesso: true, mensagem: "Aluno matriculado com sucesso!" });
  } catch (err) {
    if (transaction._begun) await transaction.rollback();
    res
      .status(err.number && err.number >= 50000 ? 400 : 500)
      .json({ sucesso: false, erro: err.message });
  }
});

router.put(
  "/admin/aluno/:id",
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
        matricula,
        fk_turma,
        endereco,
        telefones,
      } = req.body;
      await transaction.begin();

      const atualResult = await new sql.Request(transaction)
        .input("id_aluno", sql.Int, id)
        .query(
          `SELECT fk_usuario, fk_endereco FROM alunos WHERE id_aluno = @id_aluno`,
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
        .input("id_aluno", sql.Int, id)
        .input("fk_turma", sql.Int, fk_turma || null)
        .input("nome_completo", sql.VarChar, nome_completo)
        .input("data_nacimento", sql.Date, data_nacimento)
        .input("matricula", sql.Int, matricula)
        .query(
          `UPDATE alunos SET fk_turma = @fk_turma, nome_completo = @nome_completo, data_nacimento = @data_nacimento, matricula = @matricula WHERE id_aluno = @id_aluno`,
        );

      await new sql.Request(transaction)
        .input("fk_aluno", sql.Int, id)
        .query(`DELETE FROM telefone_aluno WHERE fk_aluno = @fk_aluno`);
      if (telefones && Array.isArray(telefones)) {
        for (const fone of telefones) {
          await new sql.Request(transaction)
            .input("fk_aluno", sql.Int, id)
            .input("telefone", sql.VarChar, fone)
            .query(
              `INSERT INTO telefone_aluno (fk_aluno, telefone) VALUES (@fk_aluno, @telefone);`,
            );
        }
      }
      await transaction.commit();

      // AUDITORIA: Como no PUT houve atualização, enviamos o que foi alterado para o Front decifrar
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "UPDATE",
        tabela: "alunos",
        idRegistro: id,
        descricao: `Atualizou os dados do aluno ${nome_completo}`,
        dadosNovos: JSON.stringify({
          email,
          user_name,
          nome_completo,
          matricula,
        }),
      });

      res.json({ sucesso: true, mensagem: "Cadastro do aluno atualizado!" });
    } catch (err) {
      if (transaction._begun) await transaction.rollback();
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },
);

router.delete(
  "/admin/aluno/:id",
  verificarToken,
  apenasAdmin,
  async (req, res) => {
    const { id } = req.params;
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();
      const atual = await pool
        .request()
        .input("id_aluno", sql.Int, id)
        .query(
          `SELECT fk_usuario, fk_endereco FROM alunos WHERE id_aluno = @id_aluno`,
        );
      if (atual.recordset.length === 0) throw new Error("Aluno não encontrado");

      const aluno = atual.recordset[0];
      await new sql.Request(transaction)
        .input("fk_aluno", sql.Int, id)
        .query(`DELETE FROM telefone_aluno WHERE fk_aluno = @fk_aluno`);
      await new sql.Request(transaction)
        .input("fk_aluno", sql.Int, id)
        .query(`DELETE FROM notas WHERE fk_aluno = @fk_aluno`);
      await new sql.Request(transaction)
        .input("id_aluno", sql.Int, id)
        .query(`DELETE FROM alunos WHERE id_aluno = @id_aluno`);
      await new sql.Request(transaction)
        .input("id_usuario", sql.Int, aluno.fk_usuario)
        .query(`DELETE FROM usuario WHERE id_usuario = @id_usuario`);

      await transaction.commit();

      // AUDITORIA LIMPA: Excluiu, o dado evaporou, não precisa de JSON!
      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,
        acao: "DELETE",
        tabela: "alunos",
        idRegistro: id,
        descricao: "Removeu o registro e acessos de um aluno",
      });

      res.json({ sucesso: true, mensagem: "Aluno removido com sucesso" });
    } catch (err) {
      if (transaction._begun) await transaction.rollback();
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },
);

module.exports = router;
