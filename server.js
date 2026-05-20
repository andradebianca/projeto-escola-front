const express = require("express");
const cors = require("cors");
const { sql, getPool } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Teste
app.get("/api/teste", (req, res) => {
  res.json({ mensagem: "API funcionando!", status: "ok" });
});

// Alunos
app.get("/api/alunos", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM alunos");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Cidade
app.get("/api/cidade", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM cidade");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Disciplina
app.get("/api/disciplina", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM disciplina");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Endereço
app.get("/api/endereco", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM endereco");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Especialização
app.get("/api/especializacao", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM especializacao");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Notas
app.get("/api/notas", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM notas");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Professor
app.get("/api/professor", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM professor");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Professor Especialização
app.get("/api/professor_especializacao", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query("SELECT * FROM professor_especializacao");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Rua
app.get("/api/rua", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM rua");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Telefone Aluno
app.get("/api/telefone_aluno", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM telefone_aluno");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Telefone Professor
app.get("/api/telefone_professor", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query("SELECT * FROM telefone_professor");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Turma
app.get("/api/turma", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM turma");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Turma Disciplina
app.get("/api/turma_disciplina", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM turma_disciplina");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// UF
app.get("/api/uf", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM uf");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Usuário
app.get("/api/usuario", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM usuario");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, senha } = req.body || {};

    // =========================
    // VALIDAÇÃO
    // =========================
    if (!email || !senha) {
      return res.status(400).json({
        erro: "Email e senha são obrigatórios",
      });
    }

    const pool = await getPool();

    // =========================
    // LOGIN
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

    // =========================
    // USUÁRIO NÃO ENCONTRADO
    // =========================
    if (usuarioResult.recordset.length === 0) {
      return res.status(401).json({
        erro: "Email ou senha inválidos",
      });
    }

    const usuario = usuarioResult.recordset[0];

    let perfil = null;

    // =========================
    // PROFESSOR
    // =========================
    if (usuario.nivel_acesso === 2) {
      // dados professor
      const professorResult = await pool
        .request()
        .input("id_usuario", sql.Int, usuario.id_usuario).query(`
          SELECT 
            id_professor,
            nome_completo,
            data_nacimento
          FROM professor
          WHERE fk_usuario = @id_usuario
        `);

      if (professorResult.recordset.length > 0) {
        const professor = professorResult.recordset[0];

        // anos disponíveis
        const anosResult = await pool
          .request()
          .input("id_professor", sql.Int, professor.id_professor).query(`
            SELECT DISTINCT
              t.ano_letivo

            FROM disciplina d

            INNER JOIN turma_disciplina td
              ON td.fk_disciplina = d.id_disciplina

            INNER JOIN turma t
              ON t.id_turma = td.fk_turma

            WHERE d.fk_professor = @id_professor

            ORDER BY t.ano_letivo
          `);

        perfil = {
          tipo: "professor",

          dados: {
            ...professor,

            opcoesAnos: anosResult.recordset.map((x) => x.ano_letivo),
          },
        };
      }
    }

    // =========================
    // ALUNO
    // =========================
    if (usuario.nivel_acesso === 3) {
      const alunoResult = await pool
        .request()
        .input("id_usuario", sql.Int, usuario.id_usuario).query(`
          SELECT 
            id_aluno,
            nome_completo,
            matricula,
            data_nacimento
          FROM alunos
          WHERE fk_usuario = @id_usuario
        `);

      if (alunoResult.recordset.length > 0) {
        const aluno = alunoResult.recordset[0];

        // anos disponíveis
        const anosResult = await pool
          .request()
          .input("id_aluno", sql.Int, aluno.id_aluno).query(`
            SELECT DISTINCT
              t.ano_letivo

            FROM alunos a

            INNER JOIN turma t
              ON t.id_turma = a.fk_turma

            WHERE a.id_aluno = @id_aluno

            ORDER BY t.ano_letivo
          `);

        perfil = {
          tipo: "aluno",

          dados: {
            ...aluno,

            opcoesAnos: anosResult.recordset.map((x) => x.ano_letivo),
          },
        };
      }
    }

    // =========================
    // RESPOSTA FINAL
    // =========================
    res.json({
      sucesso: true,

      usuario: {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        user_name: usuario.user_name,
        nivel_acesso: usuario.nivel_acesso,
      },

      perfil,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

// Get Turmas pelo Usuário
app.get("/api/aluno/:id/disciplinas", async (req, res) => {
  try {
    const { id } = req.params;
    const { ano } = req.query;

    if (!ano) {
      return res.status(400).json({
        erro: "Ano letivo é obrigatório",
      });
    }

    const pool = await getPool();

    // =========================
    // BUSCAR ANOS DO ALUNO
    // =========================
    const anosResult = await pool.request().input("id_aluno", sql.Int, id)
      .query(`
        SELECT DISTINCT
          t.ano_letivo
        FROM alunos a
        INNER JOIN turma t
          ON t.id_turma = a.fk_turma
        WHERE a.id_aluno = @id_aluno
        ORDER BY t.ano_letivo
      `);

    // =========================
    // BUSCAR ALUNO + TURMA
    // =========================
    const alunoResult = await pool
      .request()
      .input("id_aluno", sql.Int, id)
      .input("ano", sql.Int, ano).query(`
        SELECT 
          a.id_aluno,
          a.nome_completo,
          a.matricula,

          t.id_turma,
          t.cod_turma,
          t.turno,
          t.ano_letivo

        FROM alunos a

        INNER JOIN turma t
          ON t.id_turma = a.fk_turma

        WHERE a.id_aluno = @id_aluno
          AND t.ano_letivo = @ano
      `);

    if (alunoResult.recordset.length === 0) {
      return res.status(404).json({
        erro: "Aluno não encontrado",
      });
    }

    const aluno = alunoResult.recordset[0];

    // =========================
    // DISCIPLINAS + NOTAS
    // =========================
    const disciplinasResult = await pool
      .request()
      .input("id_aluno", sql.Int, id)
      .input("id_turma", sql.Int, aluno.id_turma).query(`
        SELECT
          td.id_turma_disciplina,

          d.id_disciplina,
          d.nome AS disciplina,

          p.id_professor,
          p.nome_completo AS professor,

          n.id_nota,
          n.valor_nota

        FROM turma_disciplina td

        INNER JOIN disciplina d
          ON d.id_disciplina = td.fk_disciplina

        INNER JOIN professor p
          ON p.id_professor = d.fk_professor

        LEFT JOIN notas n
          ON n.fk_turma_disciplina = td.id_turma_disciplina
          AND n.fk_aluno = @id_aluno

        WHERE td.fk_turma = @id_turma
      `);

    // =========================
    // AGRUPAR DISCIPLINAS
    // =========================
    const disciplinasMap = {};

    disciplinasResult.recordset.forEach((item) => {
      if (!disciplinasMap[item.id_disciplina]) {
        disciplinasMap[item.id_disciplina] = {
          id_disciplina: item.id_disciplina,
          disciplina: item.disciplina,
          professor: item.professor,
          notas: [],
          media: 0,
        };
      }

      if (item.valor_nota !== null) {
        disciplinasMap[item.id_disciplina].notas.push(item.valor_nota);
      }
    });

    // calcular média
    Object.values(disciplinasMap).forEach((disciplina) => {
      if (disciplina.notas.length > 0) {
        const soma = disciplina.notas.reduce((a, b) => a + b, 0);

        disciplina.media = Number((soma / disciplina.notas.length).toFixed(2));
      }
    });

    // =========================
    // RESPOSTA
    // =========================
    res.json({
      sucesso: true,

      aluno: {
        id_aluno: aluno.id_aluno,
        nome_completo: aluno.nome_completo,
        matricula: aluno.matricula,

        opcoesAnos: anosResult.recordset.map((x) => x.ano_letivo),
      },

      turma: {
        id_turma: aluno.id_turma,
        cod_turma: aluno.cod_turma,
        turno: aluno.turno,
        ano_letivo: aluno.ano_letivo,
      },

      disciplinas: Object.values(disciplinasMap),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

// Notas por aluno
app.get("/api/aluno/:id/notas", async (req, res) => {
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
      // cria disciplina
      if (!disciplinasMap[item.id_disciplina]) {
        disciplinasMap[item.id_disciplina] = {
          id_disciplina: item.id_disciplina,
          disciplina: item.disciplina,
          professor: item.professor,
          notas: [],
        };
      }

      // LIMITE DE 3 NOTAS
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
});

// Dados do aluno
app.get("/api/aluno/:id/perfil", async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getPool();

    // =========================
    // DADOS ALUNO
    // =========================
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

    // =========================
    // TELEFONES
    // =========================
    const telefoneResult = await pool.request().input("id_aluno", sql.Int, id)
      .query(`
        SELECT
          telefone
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
});

// Detalhes da nota
app.get("/api/nota/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getPool();

    const result = await pool.request().input("id_nota", sql.Int, id).query(`
        SELECT
          -- NOTA
          n.id_nota,
          n.valor_nota,
          n.descricao,
          n.data_aplicacao,
          n.periodo_nota,

          -- ALUNO
          a.id_aluno,
          a.nome_completo AS aluno,
          a.matricula,

          -- DISCIPLINA
          d.id_disciplina,
          d.nome AS disciplina,
          d.descricao AS descricao_disciplina,
          d.carga_horaria,

          -- PROFESSOR
          p.id_professor,
          p.nome_completo AS professor_nome,

          -- TURMA
          t.id_turma,
          t.cod_turma,
          t.turno,
          t.ano_letivo

        FROM notas n

        INNER JOIN alunos a
          ON a.id_aluno = n.fk_aluno

        INNER JOIN turma_disciplina td
          ON td.id_turma_disciplina = n.fk_turma_disciplina

        INNER JOIN turma t
          ON t.id_turma = td.fk_turma

        INNER JOIN disciplina d
          ON d.id_disciplina = td.fk_disciplina

        INNER JOIN professor p
          ON p.id_professor = d.fk_professor

        WHERE n.id_nota = @id_nota
      `);

    // =========================
    // NOTA NÃO ENCONTRADA
    // =========================
    if (result.recordset.length === 0) {
      return res.status(404).json({
        erro: "Nota não encontrada",
      });
    }

    const nota = result.recordset[0];

    // =========================
    // RESPOSTA
    // =========================
    res.json({
      sucesso: true,

      nota: {
        id_nota: nota.id_nota,
        valor_nota: nota.valor_nota,
        descricao: nota.descricao,
        data_aplicacao: nota.data_aplicacao,
        periodo_nota: nota.periodo_nota,

        aluno: {
          id_aluno: nota.id_aluno,
          nome_completo: nota.aluno,
          matricula: nota.matricula,
        },

        disciplina: {
          id_disciplina: nota.id_disciplina,
          nome: nota.disciplina,
          descricao: nota.descricao_disciplina,
          carga_horaria: nota.carga_horaria,
        },

        professor: {
          id_professor: nota.id_professor,
          nome_completo: `${nota.professor_nome}`,
        },

        turma: {
          id_turma: nota.id_turma,
          cod_turma: nota.cod_turma,
          turno: nota.turno,
          ano_letivo: nota.ano_letivo,
        },
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

app.get("/api/professor/:id/disciplinas", async (req, res) => {
  try {
    const { id } = req.params;
    const { ano } = req.query;

    if (!ano) {
      return res.status(400).json({
        erro: "Ano letivo é obrigatório",
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("id_professor", sql.Int, id)
      .input("ano", sql.Int, ano).query(`
        SELECT
          -- DISCIPLINA
          d.id_disciplina,
          d.nome AS disciplina,
          d.descricao,
          d.carga_horaria,

          -- TURMA
          t.id_turma,
          t.cod_turma,
          t.turno,
          t.ano_letivo

        FROM disciplina d

        INNER JOIN turma_disciplina td
          ON td.fk_disciplina = d.id_disciplina

        INNER JOIN turma t
          ON t.id_turma = td.fk_turma

        WHERE d.fk_professor = @id_professor
          AND t.ano_letivo = @ano

        ORDER BY d.nome, t.cod_turma
      `);

    const disciplinasMap = {};

    result.recordset.forEach((item) => {
      // cria disciplina
      if (!disciplinasMap[item.id_disciplina]) {
        disciplinasMap[item.id_disciplina] = {
          id_disciplina: item.id_disciplina,
          disciplina: item.disciplina,
          descricao: item.descricao,
          carga_horaria: item.carga_horaria,
          turmas: [],
        };
      }

      disciplinasMap[item.id_disciplina].turmas.push({
        id_turma: item.id_turma,
        cod_turma: item.cod_turma,
        turno: item.turno,
        ano_letivo: item.ano_letivo,
      });
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
});

app.get("/api/professor/:id/perfil", async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getPool();

    // =========================
    // DADOS PROFESSOR
    // =========================
    const professorResult = await pool
      .request()
      .input("id_professor", sql.Int, id).query(`
        SELECT
          p.id_professor,
          p.nome_completo,
          p.data_nacimento,

          e.numero,

          r.nome_rua,
          r.cep,
          r.bairro,

          c.nome_cidade,

          uf.nome_estado AS uf

        FROM professor p

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

    if (professorResult.recordset.length === 0) {
      return res.status(404).json({
        erro: "Professor não encontrado",
      });
    }

    // =========================
    // TELEFONES
    // =========================
    const telefoneResult = await pool
      .request()
      .input("id_professor", sql.Int, id).query(`
        SELECT
          telefone
        FROM telefone_professor
        WHERE fk_professor = @id_professor
      `);

    // =========================
    // ESPECIALIZAÇÕES
    // =========================
    const especializacaoResult = await pool
      .request()
      .input("id_professor", sql.Int, id).query(`
        SELECT
          e.id_especializacao,
          e.nome,
          e.descricao,
          e.carga_horaria

        FROM professor_especializacao pe

        INNER JOIN especializacao e
          ON e.id_especializacao = pe.fk_especializacao

        WHERE pe.fk_professor = @id_professor
      `);

    const professor = professorResult.recordset[0];

    res.json({
      sucesso: true,

      professor: {
        id_professor: professor.id_professor,
        nome_completo: professor.nome_completo,
        data_nacimento: professor.data_nacimento,

        endereco: {
          rua: professor.nome_rua,
          numero: professor.numero,
          bairro: professor.bairro,
          cep: professor.cep,
          cidade: professor.nome_cidade,
          uf: professor.uf,
        },

        telefones: telefoneResult.recordset.map((x) => x.telefone),

        especializacoes: especializacaoResult.recordset,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

app.get("/api/professor/:id/turmas", async (req, res) => {
  try {
    const { id } = req.params;
    const { ano } = req.query;

    // =========================
    // VALIDAÇÃO
    // =========================
    if (!ano) {
      return res.status(400).json({
        erro: "Ano letivo é obrigatório",
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("id_professor", sql.Int, id)
      .input("ano", sql.Int, ano).query(`
        SELECT
          -- TURMA
          t.id_turma,
          t.cod_turma,
          t.turno,
          t.ano_letivo,

          -- TURMA DISCIPLINA
          td.id_turma_disciplina,

          -- DISCIPLINA
          d.id_disciplina,
          d.nome AS disciplina,

          -- QUANTIDADE ALUNOS
          COUNT(a.id_aluno) AS quantidade_alunos

        FROM disciplina d

        INNER JOIN turma_disciplina td
          ON td.fk_disciplina = d.id_disciplina

        INNER JOIN turma t
          ON t.id_turma = td.fk_turma

        LEFT JOIN alunos a
          ON a.fk_turma = t.id_turma

        WHERE d.fk_professor = @id_professor
          AND t.ano_letivo = @ano

        GROUP BY
          t.id_turma,
          t.cod_turma,
          t.turno,
          t.ano_letivo,

          td.id_turma_disciplina,

          d.id_disciplina,
          d.nome

        ORDER BY
          t.ano_letivo,
          t.cod_turma,
          d.nome
      `);

    const turmasMap = {};

    result.recordset.forEach((item) => {
      // cria turma
      if (!turmasMap[item.id_turma]) {
        turmasMap[item.id_turma] = {
          id_turma: item.id_turma,
          cod_turma: item.cod_turma,
          turno: item.turno,
          ano_letivo: item.ano_letivo,
          disciplinas: [],
        };
      }

      // adiciona disciplina
      turmasMap[item.id_turma].disciplinas.push({
        id_turma_disciplina: item.id_turma_disciplina,

        id_disciplina: item.id_disciplina,

        disciplina: item.disciplina,

        quantidade_alunos: item.quantidade_alunos,
      });
    });

    res.json({
      sucesso: true,
      turmas: Object.values(turmasMap),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

app.get("/api/turma/:id/alunos", async (req, res) => {
  try {
    const { id } = req.params;
    const { disciplinaId } = req.query;

    const pool = await getPool();

    let filtroDisciplina = "";

    const request = pool.request().input("id_turma", sql.Int, id);

    if (disciplinaId) {
      filtroDisciplina = `
        AND td.fk_disciplina = @disciplinaId
      `;

      request.input("disciplinaId", sql.Int, disciplinaId);
    }

    const result = await request.query(`
      SELECT
        -- ALUNO
        a.id_aluno,
        a.nome_completo,
        a.matricula,

        -- NOTA
        n.id_nota,
        n.valor_nota,
        n.data_criacao,

        -- MÉDIA
        AVG(
          CAST(n.valor_nota AS FLOAT)
        ) OVER (
          PARTITION BY a.id_aluno
        ) AS media

      FROM alunos a

      LEFT JOIN notas n
        ON n.fk_aluno = a.id_aluno

      LEFT JOIN turma_disciplina td
        ON td.id_turma_disciplina =
          n.fk_turma_disciplina

      WHERE a.fk_turma = @id_turma
      ${filtroDisciplina}

      ORDER BY
        a.nome_completo,
        n.data_criacao
    `);

    const alunosMap = {};

    result.recordset.forEach((item) => {
      if (!alunosMap[item.id_aluno]) {
        alunosMap[item.id_aluno] = {
          id_aluno: item.id_aluno,
          nome_completo: item.nome_completo,
          matricula: item.matricula,

          media: item.media !== null ? Number(item.media.toFixed(2)) : null,

          notas: [],
        };
      }

      if (item.id_nota) {
        alunosMap[item.id_aluno].notas.push({
          id_nota: item.id_nota,
          valor_nota: item.valor_nota,
          data_criacao: item.data_criacao,
        });
      }
    });

    res.json({
      sucesso: true,
      alunos: Object.values(alunosMap),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

app.post("/api/nota", async (req, res) => {
  try {
    const {
      fk_turma_disciplina,
      fk_aluno,
      valor_nota,
      descricao,
      periodo_nota,
    } = req.body || {};

    // =========================
    // VALIDAÇÃO
    // =========================
    if (
      !fk_turma_disciplina ||
      !fk_aluno ||
      valor_nota === undefined ||
      !descricao ||
      !periodo_nota
    ) {
      return res.status(400).json({
        erro: "Todos os campos são obrigatórios",
      });
    }

    const pool = await getPool();

    // =========================
    // LIMITE DE 3 NOTAS
    // =========================
    const quantidadeResult = await pool
      .request()
      .input("fk_turma_disciplina", sql.Int, fk_turma_disciplina)
      .input("fk_aluno", sql.Int, fk_aluno).query(`
        SELECT COUNT(*) AS total
        FROM notas
        WHERE fk_turma_disciplina = @fk_turma_disciplina
          AND fk_aluno = @fk_aluno
      `);

    const total = quantidadeResult.recordset[0].total;

    if (total >= 3) {
      return res.status(400).json({
        erro: "Aluno já possui 3 notas nesta disciplina",
      });
    }

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
      .input("data_aplicacao", sql.Date, new Date()).query(`
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

app.get("/api/professor/:id/turmas", async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getPool();

    const result = await pool.request().input("id_professor", sql.Int, id)
      .query(`
        SELECT
          -- TURMA
          t.id_turma,
          t.cod_turma,
          t.turno,
          t.ano_letivo,

          -- DISCIPLINA
          d.id_disciplina,
          d.nome AS disciplina,

          -- QUANTIDADE ALUNOS
          COUNT(a.id_aluno) AS quantidade_alunos

        FROM disciplina d

        INNER JOIN turma_disciplina td
          ON td.fk_disciplina = d.id_disciplina

        INNER JOIN turma t
          ON t.id_turma = td.fk_turma

        LEFT JOIN alunos a
          ON a.fk_turma = t.id_turma

        WHERE d.fk_professor = @id_professor

        GROUP BY
          t.id_turma,
          t.cod_turma,
          t.turno,
          t.ano_letivo,
          d.id_disciplina,
          d.nome

        ORDER BY t.ano_letivo, t.cod_turma
      `);

    const turmasMap = {};

    result.recordset.forEach((item) => {
      // cria turma
      if (!turmasMap[item.id_turma]) {
        turmasMap[item.id_turma] = {
          id_turma: item.id_turma,
          cod_turma: item.cod_turma,
          turno: item.turno,
          ano_letivo: item.ano_letivo,
          disciplinas: [],
        };
      }

      turmasMap[item.id_turma].disciplinas.push({
        id_disciplina: item.id_disciplina,
        disciplina: item.disciplina,
        quantidade_alunos: item.quantidade_alunos,
      });
    });

    res.json({
      sucesso: true,
      turmas: Object.values(turmasMap),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

app.get("/api/turma/:id/alunos", async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getPool();

    const result = await pool.request().input("id_turma", sql.Int, id).query(`
        SELECT
          a.id_aluno,
          a.nome_completo,
          a.matricula,

          COUNT(n.id_nota) AS quantidade_notas,

          AVG(
            CAST(n.valor_nota AS FLOAT)
          ) AS media

        FROM alunos a

        LEFT JOIN notas n
          ON n.fk_aluno = a.id_aluno

        WHERE a.fk_turma = @id_turma

        GROUP BY
          a.id_aluno,
          a.nome_completo,
          a.matricula

        ORDER BY a.nome_completo
      `);

    res.json({
      sucesso: true,

      alunos: result.recordset.map((aluno) => ({
        ...aluno,

        media: aluno.media !== null ? Number(aluno.media.toFixed(2)) : null,
      })),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

// ========================================
// CRIAR NOTA
// ========================================
app.post("/api/nota", async (req, res) => {
  try {
    const {
      fk_turma_disciplina,
      fk_aluno,
      valor_nota,
      descricao,
      periodo_nota,
      data_aplicacao,
    } = req.body || {};

    // =========================
    // VALIDAÇÃO
    // =========================
    if (
      !fk_turma_disciplina ||
      !fk_aluno ||
      valor_nota === undefined ||
      !descricao ||
      !periodo_nota ||
      !data_aplicacao
    ) {
      return res.status(400).json({
        erro: "Todos os campos são obrigatórios",
      });
    }

    const pool = await getPool();

    // =========================
    // LIMITE DE 3 NOTAS
    // =========================
    const quantidadeResult = await pool
      .request()
      .input("fk_turma_disciplina", sql.Int, fk_turma_disciplina)
      .input("fk_aluno", sql.Int, fk_aluno).query(`
        SELECT COUNT(*) AS total
        FROM notas
        WHERE fk_turma_disciplina = @fk_turma_disciplina
          AND fk_aluno = @fk_aluno
      `);

    const total = quantidadeResult.recordset[0].total;

    if (total >= 3) {
      return res.status(400).json({
        erro: "Aluno já possui 3 notas nesta disciplina",
      });
    }

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

      // data da prova
      .input("data_aplicacao", sql.Date, data_aplicacao)

      // data do lançamento
      .input("data_criacao", sql.DateTime, new Date()).query(`
        INSERT INTO notas (
          fk_turma_disciplina,
          fk_aluno,
          data_aplicacao,
          valor_nota,
          descricao,
          periodo_nota,
          data_criacao
        )
        VALUES (
          @fk_turma_disciplina,
          @fk_aluno,
          @data_aplicacao,
          @valor_nota,
          @descricao,
          @periodo_nota,
          @data_criacao
        )
      `);

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
app.put("/api/nota/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { valor_nota, descricao, periodo_nota } = req.body || {};

    // =========================
    // VALIDAÇÃO
    // =========================
    if (valor_nota === undefined || !descricao || !periodo_nota) {
      return res.status(400).json({
        erro: "Todos os campos são obrigatórios",
      });
    }

    const pool = await getPool();

    // =========================
    // BUSCAR NOTA
    // =========================
    const notaResult = await pool.request().input("id_nota", sql.Int, id)
      .query(`
        SELECT
          id_nota,
          data_aplicacao
        FROM notas
        WHERE id_nota = @id_nota
      `);

    if (notaResult.recordset.length === 0) {
      return res.status(404).json({
        erro: "Nota não encontrada",
      });
    }

    const nota = notaResult.recordset[0];

    // =========================
    // VALIDAR PRAZO
    // =========================
    const hoje = new Date();

    const dataAplicacao = new Date(nota.data_aplicacao);

    const diferencaMs = hoje - dataAplicacao;

    const diferencaDias = diferencaMs / (1000 * 60 * 60 * 24);

    if (diferencaDias > 2) {
      return res.status(403).json({
        erro: "Só é possível editar notas até 2 dias após a aplicação",
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
        WHERE id_nota = @id_nota
      `);

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
app.delete("/api/nota/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getPool();

    // =========================
    // BUSCAR NOTA
    // =========================
    const notaResult = await pool.request().input("id_nota", sql.Int, id)
      .query(`
        SELECT
          id_nota,
          data_criacao
        FROM notas
        WHERE id_nota = @id_nota
      `);

    if (notaResult.recordset.length === 0) {
      return res.status(404).json({
        erro: "Nota não encontrada",
      });
    }

    const nota = notaResult.recordset[0];

    // =========================
    // VALIDAR PRAZO
    // =========================
    const hoje = new Date();

    const dataCriacao = new Date(nota.data_criacao);

    const diferencaMs = hoje - dataCriacao;

    const diferencaDias = diferencaMs / (1000 * 60 * 60 * 24);

    if (diferencaDias > 2) {
      return res.status(403).json({
        erro: "Só é possível excluir notas até 2 dias após o lançamento",
      });
    }

    // =========================
    // DELETE
    // =========================
    await pool.request().input("id_nota", sql.Int, id).query(`
        DELETE FROM notas
        WHERE id_nota = @id_nota
      `);

    res.json({
      sucesso: true,
      mensagem: "Nota removida com sucesso",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: err.message,
    });
  }
});

app.listen(3000, () => {
  console.log("API rodando em http://localhost:3000");
});
