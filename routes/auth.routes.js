const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const {sql, getPool} = require("../db");

router.post("/login", async (req, res) => {
	try {
		const {email, senha} = req.body || {};

		if (!email || !senha) {
			return res.status(400).json({
				erro: "Email e senha obrigatórios",
			});
		}

		const pool = await getPool();

		// =========================
		// LOGIN USUÁRIO
		// =========================
		const usuarioResult = await pool
			.request()
			.input("email", sql.VarChar, email)
			.input("senha", sql.VarChar, senha).query(`
        SELECT
          id_usuario,
          email,
          user_name,
          nivel_acesso

        FROM usuario

        WHERE email = @email
          AND senha = @senha
      `);

		// USUÁRIO NÃO ENCONTRADO
		if (usuarioResult.recordset.length === 0) {
			return res.status(401).json({
				erro: "Email ou senha inválidos",
			});
		}

		const usuario = usuarioResult.recordset[0];

		let perfil = null;

		// ========================================
		// PROFESSOR
		// ========================================
		if (usuario.nivel_acesso === 2) {
			const professorResult = await pool
				.request()

				.input("id_usuario", sql.Int, usuario.id_usuario)
				.query(`
          SELECT
            p.id_professor,
            p.nome_completo,
            p.data_nacimento,
            p.desativado,

            (
              SELECT DISTINCT
                t.ano_letivo

              FROM disciplina d

              INNER JOIN turma_disciplina td
                ON td.fk_disciplina =
                  d.id_disciplina

              INNER JOIN turma t
                ON t.id_turma =
                  td.fk_turma

              WHERE d.fk_professor =
                p.id_professor

                AND t.desativado = 0

              FOR JSON PATH
            ) AS opcoesAnos

          FROM professor p

          WHERE p.fk_usuario =
            @id_usuario
        `);

			// NÃO ENCONTROU PROFESSOR
			if (professorResult.recordset.length === 0) {
				return res.status(401).json({
					erro: "Professor não encontrado",
				});
			}

			const professor = professorResult.recordset[0];

			// PROFESSOR DESATIVADO
			if (professor.desativado) {
				return res.status(403).json({
					erro: "Professor desativado. Entre em contato com a administração.",
				});
			}

			perfil = {
				tipo: "professor",

				dados: {
					id_professor: professor.id_professor,

					nome_completo: professor.nome_completo,

					data_nacimento: professor.data_nacimento,

					opcoesAnos: professor.opcoesAnos
						? JSON.parse(professor.opcoesAnos).map(
								(x) => x.ano_letivo,
							)
						: [],
				},
			};
		}

		// ========================================
		// ALUNO
		// ========================================
		if (usuario.nivel_acesso === 3) {
			const alunoResult = await pool
				.request()

				.input("id_usuario", sql.Int, usuario.id_usuario)
				.query(`
          SELECT
            a.id_aluno,
            a.nome_completo,
            a.matricula,
            a.data_nacimento,

            a.desativado,

            (
              SELECT DISTINCT
                t.ano_letivo

              FROM turma t

              WHERE t.id_turma =
                a.fk_turma

                AND t.desativado = 0

              FOR JSON PATH
            ) AS opcoesAnos

          FROM alunos a

          WHERE a.fk_usuario =
            @id_usuario
        `);

			// NÃO ENCONTROU ALUNO
			if (alunoResult.recordset.length === 0) {
				return res.status(401).json({
					erro: "Aluno não encontrado",
				});
			}

			const aluno = alunoResult.recordset[0];

			// ALUNO DESATIVADO
			if (aluno.desativado) {
				return res.status(403).json({
					erro: "Aluno desativado. Entre em contato com a administração.",
				});
			}

			perfil = {
				tipo: "aluno",

				dados: {
					id_aluno: aluno.id_aluno,

					nome_completo: aluno.nome_completo,

					matricula: aluno.matricula,

					data_nacimento: aluno.data_nacimento,

					opcoesAnos: aluno.opcoesAnos
						? JSON.parse(aluno.opcoesAnos).map(
								(x) => x.ano_letivo,
							)
						: [],
				},
			};
		}

		// ========================================
		// TOKEN
		// ========================================
		const token = jwt.sign(
			{
				id_usuario: usuario.id_usuario,

				nivel_acesso: usuario.nivel_acesso,
			},

			process.env.JWT_SECRET,

			{
				expiresIn: "1d",
			},
		);

		// ========================================
		// RESPONSE
		// ========================================
		res.json({
			sucesso: true,

			token,

			usuario,

			perfil,
		});
	} catch (err) {
		console.error(err);

		res.status(500).json({
			erro: err.message,
		});
	}
});

module.exports = router;
