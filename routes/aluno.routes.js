const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../db");

const { verificarToken } = require("../middlewares/auth.middleware");

// ========================================
// DISCIPLINAS ALUNO
// ========================================
router.get(
  "/turma/:id/alunos",

  verificarToken,

  async (req, res) => {

    try {

      const { id } = req.params;

      const { disciplinaId } = req.query;

      const pool = await getPool();

      // =========================
      // REQUEST
      // =========================
      const request = pool
        .request()

        .input(
          "id_turma",
          sql.Int,
          id
        );

      // =========================
      // FILTRO DISCIPLINA
      // =========================
      let filtroDisciplina = "";

      if (disciplinaId) {

        filtroDisciplina = `
          AND EXISTS (

            SELECT 1

            FROM turma_disciplina td

            WHERE td.id_turma_disciplina =
              n.fk_turma_disciplina

            AND td.fk_disciplina =
              @disciplinaId
          )
        `;

        request.input(
          "disciplinaId",
          sql.Int,
          disciplinaId
        );
      }

      // =========================
      // QUERY
      // =========================
      const result =
        await request.query(`

          SELECT
            a.id_aluno,
            a.nome_completo,
            a.matricula,

            n.id_nota,
            n.valor_nota,
            n.data_criacao,

            AVG(
              CAST(
                n.valor_nota AS FLOAT
              )
            ) OVER (
              PARTITION BY a.id_aluno
            ) AS media

          FROM alunos a

          LEFT JOIN notas n
            ON n.fk_aluno =
              a.id_aluno

            ${filtroDisciplina}

          WHERE a.fk_turma =
            @id_turma

          ORDER BY
            a.nome_completo,
            n.data_criacao
        `);

      // =========================
      // MAP
      // =========================
      const alunosMap = {};

      result.recordset.forEach((item) => {

        // cria aluno
        if (!alunosMap[item.id_aluno]) {

          alunosMap[item.id_aluno] = {

            id_aluno:
              item.id_aluno,

            nome_completo:
              item.nome_completo,

            matricula:
              item.matricula,

            media:
              item.media !== null
                ? Number(
                    item.media.toFixed(2)
                  )
                : null,

            notas: [],
          };
        }

        // adiciona nota
        if (item.id_nota) {

          alunosMap[item.id_aluno]
            .notas
            .push({

              id_nota:
                item.id_nota,

              valor_nota:
                item.valor_nota,

              data_criacao:
                item.data_criacao,
            });
        }
      });

      // =========================
      // RESPONSE
      // =========================
      res.json({

        sucesso: true,

        alunos:
          Object.values(alunosMap),
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        erro: err.message,
      });
    }
  }
);

// ========================================
// NOTAS ALUNO
// ========================================
router.get(
  "/aluno/:id/notas",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool.request().input("id_aluno", sql.Int, id).query(`
          SELECT
            d.id_disciplina,
            d.nome AS disciplina,

            p.nome_completo AS professor,

            n.id_nota,
            n.valor_nota

          FROM notas n

          INNER JOIN turma_disciplina td
            ON td.id_turma_disciplina = n.fk_turma_disciplina

          INNER JOIN disciplina d
            ON d.id_disciplina = td.fk_disciplina

          INNER JOIN professor p
            ON p.id_professor = d.fk_professor

          WHERE n.fk_aluno = @id_aluno

          ORDER BY d.nome, n.id_nota
        `);

      const disciplinasMap = {};

      result.recordset.forEach((item) => {
        if (!disciplinasMap[item.id_disciplina]) {
          disciplinasMap[item.id_disciplina] = {
            id_disciplina: item.id_disciplina,
            disciplina: item.disciplina,
            professor: item.professor,
            notas: [],
          };
        }

        if (disciplinasMap[item.id_disciplina].notas.length < 3) {
          disciplinasMap[item.id_disciplina].notas.push({
            id_nota: item.id_nota,
            valor_nota: item.valor_nota,
          });
        }
      });

      res.json({
        sucesso: true,
        disciplinas: Object.values(disciplinasMap),
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// PERFIL ALUNO
// ========================================
router.get(
  "/aluno/:id/perfil",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const alunoResult = await pool.request().input("id_aluno", sql.Int, id)
        .query(`
          SELECT
            a.id_aluno,
            a.nome_completo,
            a.matricula,
            a.data_nacimento,

            e.numero,

            r.nome_rua,
            r.cep,
            r.bairro,

            c.nome_cidade,

            uf.nome_estado AS uf

          FROM alunos a

          LEFT JOIN endereco e
            ON e.id_endereco = a.fk_endereco

          LEFT JOIN rua r
            ON r.id_rua = e.fk_rua

          LEFT JOIN cidade c
            ON c.id_cidade = e.fk_cidade

          LEFT JOIN uf
            ON uf.id_uf = e.fk_uf

          WHERE a.id_aluno = @id_aluno
        `);

      if (alunoResult.recordset.length === 0) {
        return res.status(404).json({
          erro: "Aluno não encontrado",
        });
      }

      const telefoneResult = await pool.request().input("id_aluno", sql.Int, id)
        .query(`
          SELECT telefone
          FROM telefone_aluno
          WHERE fk_aluno = @id_aluno
        `);

      const aluno = alunoResult.recordset[0];

      res.json({
        sucesso: true,

        aluno: {
          id_aluno: aluno.id_aluno,
          nome_completo: aluno.nome_completo,
          matricula: aluno.matricula,
          data_nacimento: aluno.data_nacimento,

          endereco: {
            rua: aluno.nome_rua,
            numero: aluno.numero,
            bairro: aluno.bairro,
            cep: aluno.cep,
            cidade: aluno.nome_cidade,
            uf: aluno.uf,
          },

          telefones: telefoneResult.recordset.map((x) => x.telefone),
        },
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.get(
  "/:id/disciplinas",

  verificarToken,

  async (req, res) => {
    try {
      const { id } = req.params;
      const { ano } = req.query;

      const pool = await getPool();

      // =========================
      // REQUEST
      // =========================
      const request = pool
        .request()
        .input("id_aluno", sql.Int, id);

      let filtroAno = "";

      if (ano) {
        filtroAno = `
          AND t.ano_letivo = @ano
        `;

        request.input("ano", sql.Int, ano);
      }

      // =========================
      // QUERY
      // =========================
      const result = await request.query(`
        SELECT
          d.id_disciplina,
          d.nome AS disciplina,

          p.nome_completo AS professor,

          n.id_nota,
          n.valor_nota,

          AVG(
            CAST(n.valor_nota AS FLOAT)
          ) OVER (
            PARTITION BY d.id_disciplina
          ) AS media

        FROM alunos a

        INNER JOIN turma t
          ON t.id_turma =
            a.fk_turma

        INNER JOIN turma_disciplina td
          ON td.fk_turma =
            t.id_turma

        INNER JOIN disciplina d
          ON d.id_disciplina =
            td.fk_disciplina

        INNER JOIN professor p
          ON p.id_professor =
            d.fk_professor

        LEFT JOIN notas n
          ON n.fk_aluno =
            a.id_aluno

          AND n.fk_turma_disciplina =
            td.id_turma_disciplina

        WHERE a.id_aluno =
          @id_aluno

        ${filtroAno}

        ORDER BY
          d.nome,
          n.id_nota
      `);

      // =========================
      // MAP
      // =========================
      const disciplinasMap = {};

      result.recordset.forEach((item) => {

        // cria disciplina
        if (!disciplinasMap[item.id_disciplina]) {

          disciplinasMap[item.id_disciplina] = {

            id_disciplina:
              item.id_disciplina,

            disciplina:
              item.disciplina,

            professor:
              item.professor,

            media:
              item.media !== null
                ? Number(
                    item.media.toFixed(2)
                  )
                : null,

            notes: [],
          };
        }

        // adiciona nota
        if (item.id_nota) {

          disciplinasMap[item.id_disciplina]
            .notes
            .push({

              id_nota:
                item.id_nota,

              valor_nota:
                item.valor_nota,
            });
        }
      });

      // =========================
      // RESPONSE
      // =========================
      res.json({
        sucesso: true,

        disciplinas:
          Object.values(disciplinasMap),
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        erro: err.message,
      });
    }
  }
);

module.exports = router;
