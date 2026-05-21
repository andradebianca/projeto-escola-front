const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/auth.routes");

const alunoRoutes = require("./routes/admin/aluno.routes");
const disciplinaRoutes = require("./routes/admin/disciplina.routes");
const enderecoRoutes = require("./routes/admin/endereco.routes");
const especializacaoRoutes = require("./routes/admin/especializacao.routes");
const professorRoutes = require("./routes/admin/professor.routes");
const telefonesAlunoRoutes = require("./routes/admin/telefonesAluno.routes");
const telefonesProfessorRoutes = require("./routes/admin/telefonesProfessor.routes");
const turmaRoutes = require("./routes/admin/turma.routes");

const alunoRoutes = require("./routes/aluno.routes");

const professorRoutes = require("./routes/professor.routes");

const notaRoutes = require("./routes/nota.routes");

const turmaRoutes = require("./routes/turma.routes");

const auditoriaRoutes = require("./routes/auditoria.routes");

const app = express();

app.use(cors());
app.use(express.json());

// ROTAS
app.use("/api", authRoutes);

app.use("/api", alunoRoutes);

app.use("/api", disciplinaRoutes);

app.use("/api", enderecoRoutes);

app.use("/api", especializacaoRoutes);

app.use("/api", professorRoutes);

app.use("/api", telefonesAlunoRoutes);

app.use("/api", telefonesProfessorRoutes);

app.use("/api", turmaRoutes);

app.use("/api", alunoRoutes);

app.use("/api", professorRoutes);

app.use("/api", notaRoutes);

app.use("/api", turmaRoutes);

app.use("/api", auditoriaRoutes);

app.listen(3000, () => {
  console.log("✅ API rodando na porta 3000");
});
