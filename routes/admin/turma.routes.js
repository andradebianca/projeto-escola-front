const express = require("express");
const router = express.Router();
const {sql, getPool} = require("../../db");
const {verificarToken} = require("../../middlewares/auth.middleware");
const {apenasAdmin} = require("../../middlewares/admin.middleware");
const {registrarAuditoria} = require("../../helpers/auditoria");

router.get(
	["/turma", "/admin/turma"],

	verificarToken,

	apenasAdmin,

	async (req, res) => {
		try {
			const pool = await getPool();

			const result = await pool.request().query(`

          SELECT
            id_turma,
            ano_letivo,
            cod_turma,
            turno,

            desativado,
            desativado_em

          FROM turma

          WHERE desativado = 0

          ORDER BY
            ano_letivo DESC,
            cod_turma
        `);

			res.json({
				sucesso: true,
				turmas: result.recordset,
			});
		} catch (err) {
			res.status(500).json({
				erro: err.message,
			});
		}
	},
);

router.get(
	"/admin/turma/:id",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		try {
			const {id} = req.params;
			const pool = await getPool();
			const result = await pool
				.request()
				.input("id_turma", sql.Int, id)
				.query(
					`SELECT * FROM turma WHERE id_turma = @id_turma`,
				);
			if (result.recordset.length === 0)
				return res
					.status(404)
					.json({erro: "Turma não encontrada"});
			res.json({sucesso: true, turma: result.recordset[0]});
		} catch (err) {
			res.status(500).json({erro: err.message});
		}
	},
);

router.post("/admin/turma", verificarToken, apenasAdmin, async (req, res) => {
	try {
		const {ano_letivo, cod_turma, turno} = req.body;
		const pool = await getPool();
		const result = await pool
			.request()
			.input("ano_letivo", sql.Int, ano_letivo)
			.input("cod_turma", sql.VarChar, cod_turma)
			.input("turno", sql.VarChar, turno)
			.query(
				`INSERT INTO turma (ano_letivo, cod_turma, turno) OUTPUT INSERTED.id_turma VALUES (@ano_letivo, @cod_turma, @turno)`,
			);

		await registrarAuditoria({
			usuarioId: req.usuario.id_usuario,
			acao: "CREATE",
			tabela: "turma",
			idRegistro: result.recordset[0].id_turma,
			descricao: `Criou a Turma ${cod_turma} (${turno})`,
		});
		res.status(201).json({sucesso: true});
	} catch (err) {
		res.status(500).json({erro: err.message});
	}
});

router.put(
	"/admin/turma/:id",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		try {
			const {id} = req.params;
			const {ano_letivo, cod_turma, turno} = req.body;
			const pool = await getPool();

			const anterior = await pool
				.request()
				.input("id_turma", sql.Int, id)
				.query(
					`SELECT * FROM turma WHERE id_turma = @id_turma`,
				);
			if (anterior.recordset.length === 0)
				return res
					.status(404)
					.json({erro: "Turma não encontrada"});

			await pool
				.request()
				.input("id_turma", sql.Int, id)
				.input("ano_letivo", sql.Int, ano_letivo)
				.input("cod_turma", sql.VarChar, cod_turma)
				.input("turno", sql.VarChar, turno)
				.query(
					`UPDATE turma SET ano_letivo = @ano_letivo, cod_turma = @cod_turma, turno = @turno WHERE id_turma = @id_turma`,
				);

			await registrarAuditoria({
				usuarioId: req.usuario.id_usuario,
				acao: "UPDATE",
				tabela: "turma",
				idRegistro: id,
				descricao: `Editou as propriedades da Turma ${cod_turma}`,
				dadosAnteriores: JSON.stringify(anterior.recordset[0]),
				dadosNovos: JSON.stringify(req.body),
			});
			res.json({sucesso: true});
		} catch (err) {
			res.status(500).json({erro: err.message});
		}
	},
);

router.delete(
	"/admin/turma/:id",

	verificarToken,

	apenasAdmin,

	async (req, res) => {
		const {id} = req.params;

		const pool = await getPool();

		const transaction = new sql.Transaction(pool);

		try {
			await transaction.begin();

			// =========================
			// VERIFICA TURMA
			// =========================
			const anterior = await new sql.Request(transaction).input(
				"id_turma",
				sql.Int,
				id,
			).query(`

            SELECT
              id_turma,
              cod_turma,
              turno,
              ano_letivo,
              desativado

            FROM turma

            WHERE id_turma =
              @id_turma
          `);

			if (anterior.recordset.length === 0) {
				throw new Error("Turma não encontrada");
			}

			const turma = anterior.recordset[0];

			if (turma.desativado) {
				throw new Error("Turma já desativada");
			}

			// =========================
			// DESATIVA
			// =========================
			await new sql.Request(transaction).input(
				"id_turma",
				sql.Int,
				id,
			).query(`

          UPDATE turma

          SET
            desativado = 1,
            desativado_em = GETDATE()

          WHERE id_turma =
            @id_turma
        `);

			await transaction.commit();

			// =========================
			// AUDITORIA
			// =========================
			await registrarAuditoria({
				usuarioId: req.usuario.id_usuario,

				acao: "DELETE",

				tabela: "turma",

				idRegistro: id,

				descricao: `Desativou a turma ${turma.cod_turma}`,

				dadosAnteriores: JSON.stringify(turma),

				dadosNovos: JSON.stringify({
					desativado: 1,
					desativado_em: new Date(),
				}),
			});

			res.json({
				sucesso: true,

				mensagem: "Turma desativada com sucesso",
			});
		} catch (err) {
			if (transaction._begun) {
				await transaction.rollback();
			}

			res.status(500).json({
				sucesso: false,
				erro: err.message,
			});
		}
	},
);

// === VINCULOS ===
router.get(
	"/admin/turma/:id/disciplina",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		try {
			const pool = await getPool();
			const result = await pool
				.request()
				.input("id_turma", sql.Int, req.params.id)
				.query(
					`SELECT td.id_turma_disciplina, d.id_disciplina, d.nome, d.carga_horaria, p.nome_completo AS professor FROM turma_disciplina td INNER JOIN disciplina d ON d.id_disciplina = td.fk_disciplina INNER JOIN professor p ON p.id_professor = d.fk_professor WHERE td.fk_turma = @id_turma ORDER BY d.nome`,
				);
			res.json({sucesso: true, disciplinas: result.recordset});
		} catch (err) {
			res.status(500).json({erro: err.message});
		}
	},
);

router.post(
	"/admin/turma/disciplina",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		try {
			const pool = await getPool();
			await pool
				.request()
				.input("fk_turma", sql.Int, req.body.fk_turma)
				.input("fk_disciplina", sql.Int, req.body.fk_disciplina)
				.query(
					`INSERT INTO turma_disciplina (fk_turma, fk_disciplina) VALUES (@fk_turma, @fk_disciplina)`,
				);

			await registrarAuditoria({
				usuarioId: req.usuario.id_usuario,
				acao: "CREATE",
				tabela: "turma_disciplina",
				descricao: `Montou diário vinculando disciplina à turma`,
			});
			res.status(201).json({sucesso: true});
		} catch (err) {
			res.status(500).json({erro: err.message});
		}
	},
);

router.delete(
	"/admin/turma/disciplina/:id",
	verificarToken,
	apenasAdmin,
	async (req, res) => {
		try {
			const {id} = req.params;
			const pool = await getPool();
			await pool
				.request()
				.input("id_turma_disciplina", sql.Int, id)
				.query(
					`DELETE FROM notas WHERE fk_turma_disciplina = @id_turma_disciplina`,
				);
			await pool
				.request()
				.input("id_turma_disciplina", sql.Int, id)
				.query(
					`DELETE FROM turma_disciplina WHERE id_turma_disciplina = @id_turma_disciplina`,
				);

			await registrarAuditoria({
				usuarioId: req.usuario.id_usuario,
				acao: "DELETE",
				tabela: "turma_disciplina",
				idRegistro: id,
				descricao: `Desvinculou disciplina da turma e apagou notas relativas`,
			});
			res.json({sucesso: true});
		} catch (err) {
			res.status(500).json({erro: err.message});
		}
	},
);

module.exports = router;
