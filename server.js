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

    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({
        erro: "Email e senha são obrigatórios",
      });
    }

    const pool = await poolPromise;

    // LOGIN
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

    // Usuário não encontrado
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
            cpf,
            data_nascimento
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
            cpf,
            data_nascimento
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

app.listen(3000, () => {
  console.log("API rodando em http://localhost:3000");
});
