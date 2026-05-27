const express = require("express");
const router = express.Router();
const {sql, getPool} = require("../db");
const {verificarToken} = require("../middlewares/auth.middleware");

// Função para registrar auditoria
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
			.input(
				"tabela_afetada",
				sql.VarChar(100),
				tabela.toLowerCase().trim(),
			)
			.input("id_registro", sql.Int, idRegistro)
			.input("descricao", sql.VarChar(sql.MAX), descricao)
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
          fk_usuario, acao, tabela_afetada, id_registro, descricao, dados_anteriores, dados_novos
        ) VALUES (
          @fk_usuario, @acao, @tabela_afetada, @id_registro, @descricao, @dados_anteriores, @dados_novos
        )
      `);
	} catch (err) {
		console.error("Erro na gravação de Auditoria:", err.message);
	}
}

// Função para validar dados da nota
function validarNota(nota) {
	if (
		!nota.fk_turma_disciplina ||
		!nota.fk_aluno ||
		!nota.valor_nota ||
		!nota.descricao ||
		!nota.periodo_nota ||
		!nota.data_aplicacao
	) {
		throw new Error("Todos os campos são obrigatórios");
	}
}

// Função para verificar se o aluno já possui 3 notas nesta disciplina
async function verificarLimiteNotas(pool, fk_turma_disciplina, fk_aluno) {
	const quantidadeResult = await pool
		.request()
		.input("fk_turma_disciplina", sql.Int, fk_turma_disciplina)
		.input("fk_aluno", sql.Int, fk_aluno).query(`
      SELECT COUNT(*) AS total
      FROM notas
      WHERE fk_turma_disciplina = @fk_turma_disciplina AND fk_aluno = @fk_aluno
    `);
	const total = quantidadeResult.recordset[0].total;

	if (total >= 3) {
		throw new Error("Aluno já possui 3 notas nesta disciplina");
	}
}

// Função para verificar se já existe nota com o mesmo período
async function verificarPeriodoNota(
	pool,
	id_nota,
	fk_turma_disciplina,
	fk_aluno,
	periodo_nota,
) {
	const periodoExistente = await pool
		.request()
		.input("id_nota", sql.Int, id_nota)
		.input("periodo_nota", sql.Int, periodo_nota).query(`
      SELECT n.id_nota
      FROM notas n
      WHERE n.periodo_nota = @periodo_nota AND n.id_nota != @id_nota AND n.fk_aluno = (SELECT fk_aluno FROM notas WHERE id_nota = @id_nota) AND n.fk_turma_disciplina = (SELECT fk_turma_disciplina FROM notas WHERE id_nota = @id_nota)
    `);

	if (periodoExistente.recordset.length > 0) {
		throw new Error("Já existe nota cadastrada neste período");
	}
}

// Função para calcular a diferença em dias entre duas datas
function diferencaDias(data1, data2) {
	return Math.abs((data2 - data1) / (1000 * 60 * 60 * 24));
}

// ========================================
// DETALHE NOTA
// ========================================
router.get("/nota/:id", verificarToken, async (req, res) => {
	try {
		const {id} = req.params;
		const pool = await getPool();
		const result = await pool.request().input("id_nota", sql.Int, id)
			.query(`
        SELECT
          n.id_nota,
          n.valor_nota,
          n.descricao,
          n.data_aplicacao,
          n.data_criacao,
          n.periodo_nota,
          a.id_aluno,
          a.nome_completo AS aluno,
          a.matricula,
          d.id_disciplina,
          d.nome AS disciplina,
          p.id_professor,
          p.nome_completo AS professor,
          t.id_turma,
          t.cod_turma,
          t.turno,
          t.ano_letivo
        FROM notas n
        INNER JOIN alunos a ON a.id_aluno = n.fk_aluno
        INNER JOIN turma_disciplina td ON td.id_turma_disciplina = n.fk_turma_disciplina
        INNER JOIN turma t ON t.id_turma = td.fk_turma
        INNER JOIN disciplina d ON d.id_disciplina = td.fk_disciplina
        INNER JOIN professor p ON p.id_professor = d.fk_professor
        WHERE n.id_nota = @id_nota
      `);
		if (result.recordset.length === 0)
			return res.status(404).json({erro: "Nota não encontrada"});
		res.json({sucesso: true, nota: result.recordset[0]});
	} catch (err) {
		console.error(err);
		res.status(500).json({erro: err.message});
	}
});

// ========================================
// CADASTRAR NOTA
// ========================================

router.post("/nota", verificarToken, async (req, res) => {
	try {
		const {
			fk_turma_disciplina,
			fk_aluno,
			valor_nota,
			descricao,
			periodo_nota,
			data_aplicacao,
		} = req.body;

		const pool = await getPool();

		// =========================
		// VALIDAÇÃO
		// =========================
		validarNota({
			fk_turma_disciplina,
			fk_aluno,
			valor_nota,
			descricao,
			periodo_nota,
			data_aplicacao,
		});

		// =========================
		// LIMITE NOTAS
		// =========================
		await verificarLimiteNotas(pool, fk_turma_disciplina, fk_aluno);

		// =========================
		// PERÍODO REPETIDO
		// =========================
		await verificarPeriodoNota(
			pool,
			null,
			fk_turma_disciplina,
			fk_aluno,
			periodo_nota,
		);

		// =========================
		// INSERT
		// =========================
		await pool
			.request()

			.input("fk_turma_disciplina", sql.Int, fk_turma_disciplina)

			.input("fk_aluno", sql.Int, fk_aluno)

			.input("valor_nota", sql.Decimal(5, 2), valor_nota)

			.input("descricao", sql.VarChar, descricao)

			.input("periodo_nota", sql.Int, periodo_nota)

			.input("data_aplicacao", sql.Date, data_aplicacao).query(`
        INSERT INTO notas (
          fk_turma_disciplina,
          fk_aluno,
          data_aplicacao,
          valor_nota,
          descricao,
          periodo_nota
        )

        VALUES (
          @fk_turma_disciplina,
          @fk_aluno,
          @data_aplicacao,
          @valor_nota,
          @descricao,
          @periodo_nota
        )
      `);

		// =========================
		// AUDITORIA
		// =========================
		await registrarAuditoria({
			usuarioId: req.usuario.id_usuario,

			acao: "CREATE",

			tabela: "notas",

			descricao: "Nota cadastrada",

			dadosNovos: JSON.stringify({
				fk_turma_disciplina,
				fk_aluno,
				valor_nota,
				periodo_nota,
			}),
		});

		// =========================
		// RESPONSE
		// =========================
		res.status(201).json({
			sucesso: true,

			mensagem: "Nota cadastrada com sucesso",
		});
	} catch (err) {
		console.error(err);

		res.status(500).json({
			erro: err.message,
		});
	}
});

// ========================================
// EDITAR NOTA
// ========================================

router.put("/nota/:id", verificarToken, async (req, res) => {
	try {
		const {id} = req.params;

		const {valor_nota, descricao, periodo_nota} = req.body;

		// =========================
		// VALIDAÇÃO
		// =========================
		if (!valor_nota || !descricao || !periodo_nota) {
			return res.status(400).json({
				erro: "Todos os campos são obrigatórios",
			});
		}

		const pool = await getPool();

		// =========================
		// BUSCA NOTA
		// =========================
		const notaResult = await pool

			.request()

			.input("id_nota", sql.Int, id).query(`
          SELECT *

          FROM notas

          WHERE id_nota =
            @id_nota
        `);

		// NOTA NÃO ENCONTRADA
		if (notaResult.recordset.length === 0) {
			return res.status(404).json({
				erro: "Nota não encontrada",
			});
		}

		const nota = notaResult.recordset[0];

		// =========================
		// PERÍODO REPETIDO
		// =========================
		await verificarPeriodoNota(
			pool,
			id,
			nota.fk_turma_disciplina,
			nota.fk_aluno,
			periodo_nota,
		);

		// =========================
		// LIMITE 2 DIAS
		// =========================
		if (diferencaDias(new Date(nota.data_criacao), new Date()) > 2) {
			return res.status(403).json({
				erro: "Não é possível editar após 2 dias",
			});
		}

		// =========================
		// UPDATE
		// =========================
		await pool
			.request()

			.input("id_nota", sql.Int, id)

			.input("valor_nota", sql.Decimal(5, 2), valor_nota)

			.input("descricao", sql.VarChar, descricao)

			.input("periodo_nota", sql.Int, periodo_nota).query(`
        UPDATE notas

        SET
          valor_nota = @valor_nota,
          descricao = @descricao,
          periodo_nota = @periodo_nota

        WHERE id_nota =
          @id_nota
      `);

		// =========================
		// AUDITORIA
		// =========================
		await registrarAuditoria({
			usuarioId: req.usuario.id_usuario,

			acao: "UPDATE",

			tabela: "notas",

			idRegistro: id,

			descricao: "Nota atualizada",

			dadosAnteriores: JSON.stringify(nota),

			dadosNovos: JSON.stringify({
				valor_nota,
				descricao,
				periodo_nota,
			}),
		});

		// =========================
		// RESPONSE
		// =========================
		res.json({
			sucesso: true,

			mensagem: "Nota atualizada com sucesso",
		});
	} catch (err) {
		console.error(err);

		res.status(500).json({
			erro: err.message,
		});
	}
});

// ========================================
// EXCLUIR NOTA
// ========================================

router.delete("/nota/:id", verificarToken, async (req, res) => {
	try {
		const {id} = req.params;
		const pool = await getPool();
		const notaResult = await pool
			.request()
			.input("id_nota", sql.Int, id).query(`
      SELECT *
      FROM notas
      WHERE id_nota = @id_nota
    `);
		if (notaResult.recordset.length === 0)
			return res.status(404).json({erro: "Nota não encontrada"});
		const nota = notaResult.recordset[0];
		if (diferencaDias(new Date(nota.data_criacao), new Date()) > 2)
			return res
				.status(403)
				.json({erro: "Não é possível excluir após 2 dias"});
		await pool.request().input("id_nota", sql.Int, id).query(`
      DELETE FROM notas WHERE id_nota = @id_nota
    `);
		await registrarAuditoria({
			usuarioId: req.usuario.id_usuario,
			acao: "DELETE",
			tabela: "notas",
			idRegistro: id,
			descricao: `Removeu a nota ${nota.valor_nota} do aluno (ID: ${nota.fk_aluno})`,
		});
		res.json({sucesso: true, mensagem: "Nota removida com sucesso"});
	} catch (err) {
		console.error(err);
		res.status(500).json({erro: err.message});
	}
});

module.exports = router;
