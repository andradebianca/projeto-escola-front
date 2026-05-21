import {
  redirecionar,
  requisicaoApi,
  showToast,
} from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const cardsResumo = document.getElementById("cards-resumo");
const atalhoAlunos = document.getElementById("atalho-alunos");
const atalhoProfessores = document.getElementById("atalho-professores");
const atalhoTurmas = document.getElementById("atalho-turmas");
const atalhoDisciplinas = document.getElementById("atalho-disciplinas");

function montarCard(titulo, valor, descricao) {
  return `
    <article class="summary-card">
      <h3>${titulo}</h3>
      <strong>${valor}</strong>
      <p>${descricao}</p>
    </article>
  `;
}

async function buscarResumo() {
  try {
    cardsResumo.innerHTML = "<p>Carregando resumo...</p>";

    const [resAlunos, resProfessores, resTurmas, resDisciplinas, resEnderecos] =
      await Promise.all([
        requisicaoApi(`${urlBase}api/admin/aluno`),
        requisicaoApi(`${urlBase}api/admin/professor`),
        requisicaoApi(`${urlBase}api/admin/turma`),
        requisicaoApi(`${urlBase}api/admin/disciplina`),
        requisicaoApi(`${urlBase}api/admin/endereco`),
      ]);

    const [dadosAlunos, dadosProfessores, dadosTurmas, dadosDisciplinas, dadosEnderecos] =
      await Promise.all([
        resAlunos.json(),
        resProfessores.json(),
        resTurmas.json(),
        resDisciplinas.json(),
        resEnderecos.json(),
      ]);

    if (
      !dadosAlunos?.sucesso ||
      !dadosProfessores?.sucesso ||
      !dadosTurmas?.sucesso ||
      !dadosDisciplinas?.sucesso ||
      !dadosEnderecos?.sucesso
    ) {
      cardsResumo.innerHTML =
        "<p>Nao foi possivel carregar o resumo administrativo.</p>";
      showToast("Erro ao carregar resumo do painel.", "error");
      return;
    }

    cardsResumo.innerHTML = `
      ${montarCard("Alunos", dadosAlunos.alunos?.length ?? 0, "Cadastros ativos")}
      ${montarCard("Professores", dadosProfessores.professores?.length ?? 0, "Cadastros ativos")}
      ${montarCard("Turmas", dadosTurmas.turmas?.length ?? 0, "Turmas cadastradas")}
      ${montarCard("Disciplinas", dadosDisciplinas.disciplinas?.length ?? 0, "Disciplinas ativas")}
      ${montarCard("Enderecos", dadosEnderecos.enderecos?.length ?? 0, "Base de localizacao")}
    `;
  } catch (error) {
    console.error("Erro ao buscar resumo administrativo:", error);
    cardsResumo.innerHTML = "<p>Erro interno ao carregar o painel.</p>";
    showToast("Erro interno ao carregar resumo.", "error");
  }
}

atalhoAlunos?.addEventListener("click", () => redirecionar("admin/alunos.html"));
atalhoProfessores?.addEventListener("click", () => redirecionar("admin/professores.html"));
atalhoTurmas?.addEventListener("click", () => redirecionar("admin/turmas.html"));
atalhoDisciplinas?.addEventListener("click", () => redirecionar("admin/disciplinas.html"));

buscarResumo();
