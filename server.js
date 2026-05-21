const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/auth.routes");

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

app.use("/api", professorRoutes);

app.use("/api", notaRoutes);

app.use("/api", turmaRoutes);

app.use("/api", auditoriaRoutes);

app.listen(3000, () => {
  console.log("✅ API rodando na porta 3000");
});
