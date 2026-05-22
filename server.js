const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/auth.routes");

const admAlunoRoutes = require("./routes/admin/aluno.routes");
const admAuditoriaRoutes = require("./routes/admin/auditoria.routes");
const admDisciplinaRoutes = require("./routes/admin/disciplina.routes");
const admEspecializacaoRoutes = require("./routes/admin/especializacao.routes");
const admProfessorRoutes = require("./routes/admin/professor.routes");
const admTurmaRoutes = require("./routes/admin/turma.routes");

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

app.use("/api", admAlunoRoutes);
app.use("/api", admDisciplinaRoutes);
app.use("/api", admAuditoriaRoutes);
app.use("/api", admEspecializacaoRoutes);
app.use("/api", admProfessorRoutes);
app.use("/api", admTurmaRoutes);

app.use("/api", alunoRoutes);
app.use("/api", professorRoutes);
app.use("/api", notaRoutes);
app.use("/api", turmaRoutes);
app.use("/api", auditoriaRoutes);

app.listen(3000, () => {
  console.log("API rodando na porta 3000");
});
