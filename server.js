const express = require("express");
const cors = require("cors");
const { sql, poolPromise } = require("./db");

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
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM alunos");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Cidade
app.get("/api/cidade", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM cidade");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Disciplina
app.get("/api/disciplina", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM disciplina");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Endereço
app.get("/api/endereco", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM endereco");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Especialização
app.get("/api/especializacao", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM especializacao");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Notas
app.get("/api/notas", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM notas");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Professor
app.get("/api/professor", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM professor");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Professor Especialização
app.get("/api/professor_especializacao", async (req, res) => {
  try {
    const pool = await poolPromise;
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
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM rua");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Telefone Aluno
app.get("/api/telefone_aluno", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM telefone_aluno");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Telefone Professor
app.get("/api/telefone_professor", async (req, res) => {
  try {
    const pool = await poolPromise;
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
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM turma");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Turma Disciplina
app.get("/api/turma_disciplina", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM turma_disciplina");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// UF
app.get("/api/uf", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM uf");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Usuário
app.get("/api/usuario", async (req, res) => {
  try {
    const pool = await poolPromise;
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

    const pool = await poolPromise;

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
        perfil = {
          tipo: "professor",
          dados: professorResult.recordset[0],
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
        perfil = {
          tipo: "aluno",
          dados: alunoResult.recordset[0],
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

    const pool = await poolPromise;

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

        disciplina.media = soma / disciplina.notas.length;
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

    const pool = await poolPromise;

    const result = await pool.request().input("id_aluno", sql.Int, id).query(`
        SELECT
          d.id_disciplina,
          d.nome AS disciplina,
          n.valor_nota

        FROM notas n

        INNER JOIN turma_disciplina td
          ON td.id_turma_disciplina = n.fk_turma_disciplina

        INNER JOIN disciplina d
          ON d.id_disciplina = td.fk_disciplina

        WHERE n.fk_aluno = @id_aluno

        ORDER BY d.nome
      `);

    const disciplinasMap = {};

    result.recordset.forEach((item) => {
      if (!disciplinasMap[item.id_disciplina]) {
        disciplinasMap[item.id_disciplina] = {
          disciplina: item.disciplina,
          notas: [],
        };
      }

      // LIMITE DE 3 NOTAS
      if (disciplinasMap[item.id_disciplina].notas.length < 3) {
        disciplinasMap[item.id_disciplina].notas.push(item.valor_nota);
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

    const pool = await poolPromise;

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

app.listen(3000, () => {
  console.log("API rodando em http://localhost:3000");
});
