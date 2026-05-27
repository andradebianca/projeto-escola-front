const express = require("express");

const router = express.Router();

const {sql, getPool} = require("../../db");
const {verificarToken} = require("../../middlewares/auth.middleware");
const {apenasAdmin} = require("../../middlewares/admin.middleware");
const {registrarAuditoria} = require("../../helpers/auditoria");
const {gerarUserName} = require("../../helpers/gerar-user");

// =========================================================================
// GET ALL PROFESSORES
// =========================================================================
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
          p.cpf,

          p.desativado,
          p.desativado_em,

          u.id_usuario,
          u.email,
          u.user_name

        FROM professor p

        INNER JOIN usuario u
          ON u.id_usuario = p.fk_usuario

        WHERE p.desativado = 0

        ORDER BY p.nome_completo
      `);

			res.json({
				sucesso: true,
				professores: result.recordset,
			});
		} catch (err) {
			res.status(500).json({
				sucesso: false,
				erro: err.message,
			});
		}
	},
);

// =========================================================================
// GET PROFESSOR BY ID
// =========================================================================
router.get(
	"/admin/professor/:id",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		try {
			const {id} = req.params;
			const pool = await getPool();

			const profResult = await pool
				.request()
				.input("id_professor", sql.Int, id).query(`
          SELECT
            p.id_professor,
            p.nome_completo,
            p.data_nacimento,
            p.cpf,
            p.desativado,
            p.desativado_em,

            u.id_usuario,
            u.email,
            u.user_name,

            e.id_endereco,
            e.numero,
            r.nome_rua AS rua,
            r.cep,
            r.bairro,
            c.nome_cidade AS cidade,
            uf.nome_estado AS uf

          FROM professor p

          INNER JOIN usuario u
            ON u.id_usuario = p.fk_usuario

          LEFT JOIN endereco e
            ON e.id_endereco = p.fk_endereco

          LEFT JOIN rua r
            ON r.id_rua = e.fk_rua

          LEFT JOIN cidade c
            ON c.id_cidade = e.fk_cidade

          LEFT JOIN uf
            ON uf.id_uf = e.fk_uf

          WHERE p.id_professor = @id_professor
      `);

			if (profResult.recordset.length === 0) {
				return res.status(404).json({
					sucesso: false,
					erro: "Professor não encontrado",
				});
			}

			const professor = profResult.recordset[0];

			const fonesResult = await pool
				.request()
				.input("fk_professor", sql.Int, id).query(`
          SELECT telefone
          FROM telefone_professor
          WHERE fk_professor = @fk_professor
        `);

			professor.telefones = fonesResult.recordset.map(
				(row) => row.telefone,
			);

			res.json({
				sucesso: true,
				professor,
			});
		} catch (err) {
			res.status(500).json({
				sucesso: false,
				erro: err.message,
			});
		}
	},
);

// =========================================================================
// POST: CADASTRAR PROFESSOR
// =========================================================================
router.post(
	"/admin/professor",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		const pool = await getPool();

		try {
			const {
				email,
				cpf,
				nome_completo,
				data_nacimento,
				endereco,
				telefones,
			} = req.body;

			if (
				!email ||
				!cpf ||
				!nome_completo ||
				!data_nacimento ||
				!endereco
			) {
				return res.status(400).json({
					sucesso: false,
					erro: "Todos os campos obrigatórios devem ser informados",
				});
			}

			const user_name_gerado = gerarUserName(nome_completo);

			// 1. RESOLVER DEPENDÊNCIAS DE ENDEREÇO FORA DA TRANSACTION PRINCIPAL
			// 1.1 Validar/Inserir UF
			let ufId;
			const ufCheck = await pool
				.request()
				.input("uf", sql.VarChar, endereco.uf)
				.query(`SELECT id_uf FROM uf WHERE nome_estado = @uf`);

			if (ufCheck.recordset.length > 0) {
				ufId = ufCheck.recordset[0].id_uf;
			} else {
				const ufIns = await pool
					.request()
					.input("uf", sql.VarChar, endereco.uf)
					.query(
						`INSERT INTO uf (nome_estado) OUTPUT INSERTED.id_uf VALUES (@uf)`,
					);
				ufId = ufIns.recordset[0].id_uf;
			}

			// 1.2 Validar/Inserir Cidade
			let cidadeId;
			const cidCheck = await pool
				.request()
				.input("cidade", sql.VarChar, endereco.cidade)
				.query(
					`SELECT id_cidade FROM cidade WHERE nome_cidade = @cidade`,
				);

			if (cidCheck.recordset.length > 0) {
				cidadeId = cidCheck.recordset[0].id_cidade;
			} else {
				const cidIns = await pool
					.request()
					.input("cidade", sql.VarChar, endereco.cidade)
					.query(
						`INSERT INTO cidade (nome_cidade) OUTPUT INSERTED.id_cidade VALUES (@cidade)`,
					);
				cidadeId = cidIns.recordset[0].id_cidade;
			}

			// 1.3 Validar/Inserir Rua
			let ruaId;
			const ruaCheck = await pool
				.request()
				.input("rua", sql.VarChar, endereco.rua)
				.input("cep", sql.VarChar, endereco.cep)
				.query(
					`SELECT id_rua FROM rua WHERE nome_rua = @rua AND cep = @cep`,
				);

			if (ruaCheck.recordset.length > 0) {
				ruaId = ruaCheck.recordset[0].id_rua;
			} else {
				const ruaIns = await pool
					.request()
					.input("rua", sql.VarChar, endereco.rua)
					.input("cep", sql.VarChar, endereco.cep)
					.input("bairro", sql.VarChar, endereco.bairro)
					.query(
						`INSERT INTO rua (nome_rua, cep, bairro) OUTPUT INSERTED.id_rua VALUES (@rua, @cep, @bairro)`,
					);
				ruaId = ruaIns.recordset[0].id_rua;
			}

			// 2. TRANSACTION PRINCIPAL
			const transaction = new sql.Transaction(pool);
			await transaction.begin();

			try {
				// 2.1 Criar endereço físico
				const endRes = await new sql.Request(transaction)
					.input("fk_uf", sql.Int, ufId)
					.input("fk_cidade", sql.Int, cidadeId)
					.input("fk_rua", sql.Int, ruaId)
					.input("numero", sql.VarChar, endereco.numero)
					.query(`
            INSERT INTO endereco (fk_uf, fk_cidade, fk_rua, numero)
            OUTPUT INSERTED.id_endereco
            VALUES (@fk_uf, @fk_cidade, @fk_rua, @numero);
          `);

				const idEnd = endRes.recordset[0].id_endereco;

				// 2.2 Criar usuário
				const userRes = await new sql.Request(transaction)
					.input("email", sql.VarChar, email)
					.input("user_name", sql.VarChar, user_name_gerado)
					.query(`
            IF EXISTS (
              SELECT 1
              FROM usuario
              WHERE email = @email OR user_name = @user_name
            )
              THROW 51000, 'Email/usuário indisponível.', 1;

            INSERT INTO usuario (email, user_name, nivel_acesso)
            OUTPUT INSERTED.id_usuario
            VALUES (@email, @user_name, 2);
          `);

				const idUsr = userRes.recordset[0].id_usuario;

				// 2.3 Criar professor
				const profRes = await new sql.Request(transaction)
					.input("fk_endereco", sql.Int, idEnd)
					.input("fk_usuario", sql.Int, idUsr)
					.input("nome", sql.VarChar, nome_completo)
					.input("nascimento", sql.Date, data_nacimento)
					.input("cpf", sql.VarChar, cpf).query(`
            IF EXISTS (
              SELECT 1
              FROM professor
              WHERE cpf = @cpf
            )
              THROW 51001, 'CPF já cadastrado.', 1;

            INSERT INTO professor (
              fk_endereco,
              fk_usuario,
              nome_completo,
              data_nacimento,
              cpf
            )
            OUTPUT INSERTED.id_professor
            VALUES (
              @fk_endereco,
              @fk_usuario,
              @nome,
              @nascimento,
              @cpf
            );
          `);

				const idProf = profRes.recordset[0].id_professor;

				// 2.4 Telefones
				if (telefones && Array.isArray(telefones)) {
					for (const fone of telefones) {
						await new sql.Request(transaction)
							.input(
								"fk_professor",
								sql.Int,
								idProf,
							)
							.input("telefone", sql.VarChar, fone)
							.query(`
                INSERT INTO telefone_professor (fk_professor, telefone)
                VALUES (@fk_professor, @telefone);
              `);
					}
				}

				await transaction.commit();

				try {
					await registrarAuditoria({
						usuarioId: req.usuario.id_usuario,
						acao: "CREATE",
						tabela: "professor",
						idRegistro: idProf,
						descricao: `Cadastrou o docente ${nome_completo}`,
						dadosNovos: JSON.stringify({
							email,
							cpf,
							nome_completo,
							data_nacimento,
							endereco,
							telefones,
						}),
					});
				} catch (auditErr) {
					console.error("Erro auditoria:", auditErr);
				}

				res.status(201).json({
					sucesso: true,
					mensagem: "Professor cadastrado com sucesso!",
				});
			} catch (innerErr) {
				await transaction.rollback();
				throw innerErr;
			}
		} catch (err) {
			res.status(
				err.number && err.number >= 50000 ? 400 : 500,
			).json({sucesso: false, erro: err.message});
		}
	},
);

// =========================================================================
// PUT: EDITAR PROFESSOR
// =========================================================================
router.put(
	"/admin/professor/:id",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		const {id} = req.params;
		const pool = await getPool();

		try {
			const {
				email,
				nome_completo,
				data_nacimento,
				endereco,
				telefones,
			} = req.body;

			if (
				!email ||
				!nome_completo ||
				!data_nacimento ||
				!endereco
			) {
				return res.status(400).json({
					sucesso: false,
					erro: "Todos os campos obrigatórios devem ser informados",
				});
			}

			// 1. RESOLVER LOCALIZAÇÃO ANTES DA TRANSACTION
			let ufId;
			const ufCheck = await pool
				.request()
				.input("uf", sql.VarChar, endereco.uf)
				.query(`SELECT id_uf FROM uf WHERE nome_estado = @uf`);

			ufId =
				ufCheck.recordset.length > 0
					? ufCheck.recordset[0].id_uf
					: (
							await pool
								.request()
								.input(
									"uf",
									sql.VarChar,
									endereco.uf,
								)
								.query(
									`INSERT INTO uf (nome_estado) OUTPUT INSERTED.id_uf VALUES (@uf)`,
								)
						).recordset[0].id_uf;

			let cidadeId;
			const cidCheck = await pool
				.request()
				.input("cidade", sql.VarChar, endereco.cidade)
				.query(
					`SELECT id_cidade FROM cidade WHERE nome_cidade = @cidade`,
				);

			cidadeId =
				cidCheck.recordset.length > 0
					? cidCheck.recordset[0].id_cidade
					: (
							await pool
								.request()
								.input(
									"cidade",
									sql.VarChar,
									endereco.cidade,
								)
								.query(
									`INSERT INTO cidade (nome_cidade) OUTPUT INSERTED.id_cidade VALUES (@cidade)`,
								)
						).recordset[0].id_cidade;

			let ruaId;
			const ruaCheck = await pool
				.request()
				.input("rua", sql.VarChar, endereco.rua)
				.input("cep", sql.VarChar, endereco.cep)
				.query(
					`SELECT id_rua FROM rua WHERE nome_rua = @rua AND cep = @cep`,
				);

			ruaId =
				ruaCheck.recordset.length > 0
					? ruaCheck.recordset[0].id_rua
					: (
							await pool
								.request()
								.input(
									"rua",
									sql.VarChar,
									endereco.rua,
								)
								.input(
									"cep",
									sql.VarChar,
									endereco.cep,
								)
								.input(
									"bairro",
									sql.VarChar,
									endereco.bairro,
								)
								.query(
									`INSERT INTO rua (nome_rua, cep, bairro) OUTPUT INSERTED.id_rua VALUES (@rua, @cep, @bairro)`,
								)
						).recordset[0].id_rua;

			// 2. TRANSACTION PRINCIPAL
			const transaction = new sql.Transaction(pool);
			await transaction.begin();

			try {
				const atualResult = await new sql.Request(
					transaction,
				).input("id_professor", sql.Int, id).query(`
            SELECT
              fk_usuario,
              fk_endereco,
              nome_completo,
              data_nacimento,
              cpf

            FROM professor

            WHERE id_professor = @id_professor
          `);

				if (atualResult.recordset.length === 0) {
					throw new Error(
						"Professor não encontrado no sistema.",
					);
				}

				const current = atualResult.recordset[0];

				// 2.1 Atualiza usuário
				await new sql.Request(transaction)
					.input("id_usuario", sql.Int, current.fk_usuario)
					.input("email", sql.VarChar, email).query(`
            UPDATE usuario
            SET email = @email
            WHERE id_usuario = @id_usuario
          `);

				// 2.2 Atualiza endereço
				await new sql.Request(transaction)
					.input(
						"id_endereco",
						sql.Int,
						current.fk_endereco,
					)
					.input("fk_uf", sql.Int, ufId)
					.input("fk_cidade", sql.Int, cidadeId)
					.input("fk_rua", sql.Int, ruaId)
					.input("numero", sql.VarChar, endereco.numero)
					.query(`
            UPDATE endereco
            SET fk_uf = @fk_uf, fk_cidade = @fk_cidade, fk_rua = @fk_rua, numero = @numero
            WHERE id_endereco = @id_endereco
          `);

				// 2.3 Atualiza professor
				await new sql.Request(transaction)
					.input("id_professor", sql.Int, id)
					.input(
						"nome_completo",
						sql.VarChar,
						nome_completo,
					)
					.input("data_nacimento", sql.Date, data_nacimento)
					.query(`
            UPDATE professor
            SET nome_completo = @nome_completo,
                data_nacimento = @data_nacimento
            WHERE id_professor = @id_professor
          `);

				// 2.4 Telefones
				await new sql.Request(transaction).input(
					"fk_professor",
					sql.Int,
					id,
				).query(`
            DELETE FROM telefone_professor
            WHERE fk_professor = @fk_professor
          `);

				if (telefones && Array.isArray(telefones)) {
					for (const fone of telefones) {
						await new sql.Request(transaction)
							.input("fk_professor", sql.Int, id)
							.input("telefone", sql.VarChar, fone)
							.query(`
                INSERT INTO telefone_professor (fk_professor, telefone)
                VALUES (@fk_professor, @telefone)
              `);
					}
				}

				await transaction.commit();

				await registrarAuditoria({
					usuarioId: req.usuario.id_usuario,
					acao: "UPDATE",
					tabela: "professor",
					idRegistro: id,
					descricao: `Atualizou os dados do professor ${nome_completo}`,
					dadosAnteriores: JSON.stringify(current),
					dadosNovos: JSON.stringify({
						email,
						nome_completo,
						data_nacimento,
						endereco,
						telefones,
					}),
				});

				res.json({
					sucesso: true,
					mensagem: "Cadastro alterado com sucesso.",
				});
			} catch (innerErr) {
				await transaction.rollback();
				throw innerErr;
			}
		} catch (err) {
			res.status(500).json({
				sucesso: false,
				erro: err.message,
			});
		}
	},
);

// =========================================================================
// OUTROS MÉTODOS
// =========================================================================
router.get(
	"/admin/professor/:id/especializacao",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		try {
			const {id} = req.params;
			const pool = await getPool();

			const result = await pool
				.request()
				.input("fk_professor", sql.Int, id).query(`
          SELECT
            pe.id AS id_vinculo,
            e.id_especializacao,
            e.nome,
            e.carga_horaria

          FROM professor_especializacao pe

          INNER JOIN especializacao e
            ON e.id_especializacao = pe.fk_especializacao

          WHERE pe.fk_professor = @fk_professor
        `);

			res.json({sucesso: true, especializacoes: result.recordset});
		} catch (err) {
			res.status(500).json({erro: err.message});
		}
	},
);

router.post(
	"/admin/professor/especializacao",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		try {
			const {fk_professor, fk_especializacao} = req.body;
			const pool = await getPool();

			await pool
				.request()
				.input("fk_professor", sql.Int, fk_professor)
				.input("fk_especializacao", sql.Int, fk_especializacao)
				.query(`
          INSERT INTO professor_especializacao (fk_professor, fk_especializacao)
          VALUES (@fk_professor, @fk_especializacao)
        `);

			res.json({sucesso: true});
		} catch (err) {
			res.status(500).json({erro: err.message});
		}
	},
);

router.delete(
	"/admin/professor/:id",

	verificarToken,

	apenasAdmin,

	async (req, res) => {
		const {id} = req.params;
		const pool = await getPool();

		const transaction = new sql.Transaction(pool);

		try {
			await transaction.begin();

			const atual = await new sql.Request(transaction).input(
				"id_professor",
				sql.Int,
				id,
			).query(`
          SELECT
            id_professor,
            nome_completo,
            cpf,
            desativado

          FROM professor

          WHERE id_professor = @id_professor
        `);

			if (atual.recordset.length === 0) {
				throw new Error("Professor não encontrado");
			}

			const professor = atual.recordset[0];

			if (professor.desativado) {
				throw new Error("Professor já desativado");
			}

			await new sql.Request(transaction).input(
				"id_professor",
				sql.Int,
				id,
			).query(`
          UPDATE professor
          SET
            desativado = 1,
            desativado_em = GETDATE()
          WHERE id_professor = @id_professor
        `);

			await transaction.commit();

			await registrarAuditoria({
				usuarioId: req.usuario.id_usuario,
				acao: "DELETE",
				tabela: "professor",
				idRegistro: id,
				descricao: `Desativou o professor ${professor.nome_completo}`,
				dadosAnteriores: JSON.stringify(professor),
				dadosNovos: JSON.stringify({
					desativado: 1,
					desativado_em: new Date(),
				}),
			});

			res.json({
				sucesso: true,
				mensagem: "Professor desativado com sucesso",
			});
		} catch (err) {
			if (transaction._begun) {
				await transaction.rollback();
			}

			res.status(
				err.message === "Professor não encontrado" ||
					err.message === "Professor já desativado"
					? 400
					: 500,
			).json({
				sucesso: false,
				erro: err.message,
			});
		}
	},
);

module.exports = router;
