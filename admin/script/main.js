import { requisicaoApi } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

async function carregarDashboardMetrics() {
  const container = document.getElementById("cards-resumo");
  if (!container) return;
  container.innerHTML = "<p>Carregando métricas...</p>";

  try {
    const [resAlunos, resProfs, resTurmas, resDiscip] = await Promise.all([
      requisicaoApi(`${urlBase}api/admin/aluno`),
      requisicaoApi(`${urlBase}api/admin/professor`),
      requisicaoApi(`${urlBase}api/admin/turma`),
      requisicaoApi(`${urlBase}api/admin/disciplina`),
    ]);

    const [a, p, t, d] = await Promise.all([
      resAlunos.json(),
      resProfs.json(),
      resTurmas.json(),
      resDiscip.json(),
    ]);

    container.innerHTML = `
      <article class="resume-card">

    <div class="resume-top">
      <div class="resume-info">
        <h3>Alunos</h3>
        <strong>${a.alunos?.length ?? 0}</strong>
        <p>Estudantes ativos</p>
      </div>

      <i class="fa-solid fa-user-graduate"></i>
    </div>

  </article>

  <article class="resume-card">

    <div class="resume-top">
      <div class="resume-info">
        <h3>Professores</h3>
        <strong>${p.professores?.length ?? 0}</strong>
        <p>Corpo docente</p>
      </div>

      <i class="fa-solid fa-user-tie"></i>
    </div>

  </article>

  <article class="resume-card">

    <div class="resume-top">
      <div class="resume-info">
        <h3>Turmas</h3>
        <strong>${t.turmas?.length ?? 0}</strong>
        <p>Turmas abertas</p>
      </div>

      <i class="fa-solid fa-users"></i>
    </div>

  </article>

  <article class="resume-card">

    <div class="resume-top">
      <div class="resume-info">
        <h3>Disciplinas</h3>
        <strong>${d.disciplinas?.length ?? 0}</strong>
        <p>Grade curricular</p>
      </div>

      <i class="fa-solid fa-book"></i>
    </div>

  </article>
    `;
  } catch (error) {
    container.innerHTML = "<p>Erro ao alimentar painel consolidado.</p>";
  }
}
document.addEventListener("DOMContentLoaded", carregarDashboardMetrics);
