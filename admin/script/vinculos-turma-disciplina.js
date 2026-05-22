// admin/script/vinculos-turma-disciplina.js
import { requisicaoApi, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const selectTurma = document.getElementById("filtro-turma");
const selectDisciplina = document.getElementById("filtro-disciplina");
const btnVincular = document.getElementById("btn-vincular");
const btnRecarregar = document.getElementById("btn-recarregar");
const recordsList = document.getElementById("records-list");

let vinculos = [];

async function carregarDropdownsBases() {
  try {
    const [resTurmas, resDisciplinas] = await Promise.all([
      requisicaoApi(`${urlBase}api/admin/turma`),
      requisicaoApi(`${urlBase}api/admin/disciplina`),
    ]);
    const [dT, dD] = await Promise.all([
      resTurmas.json(),
      resDisciplinas.json(),
    ]);

    if (dT.sucesso) {
      selectTurma.innerHTML = '<option value="">Selecione a turma...</option>';
      dT.turmas.forEach(
        (t) =>
          (selectTurma.innerHTML += `<option value="${t.id_turma}">${t.cod_turma} (${t.turno})</option>`),
      );
    }
    if (dD.sucesso) {
      selectDisciplina.innerHTML =
        '<option value="">Selecione a disciplina...</option>';
      dD.disciplinas.forEach(
        (d) =>
          (selectDisciplina.innerHTML += `<option value="${d.id_disciplina}">${d.nome}</option>`),
      );
    }
  } catch (e) {
    console.error(e);
  }
}

async function buscarVinculosDaTurma() {
  if (!selectTurma.value) {
    recordsList.innerHTML = "<p>Selecione uma turma para analisar.</p>";
    return;
  }
  recordsList.innerHTML = "<p>Buscando conexões de diário...</p>";

  try {
    const res = await requisicaoApi(
      `${urlBase}api/admin/turma/${selectTurma.value}/disciplina`,
    );
    const d = await res.json();
    vinculos = d.disciplinas || [];

    recordsList.innerHTML = "";
    if (!vinculos.length) {
      recordsList.innerHTML =
        "<p>Nenhuma disciplina vinculada para esta turma.</p>";
      return;
    }

    vinculos.forEach((v) => {
      recordsList.innerHTML += `
        <article class="record-row">
          <div class="record-main"><h3>${v.nome}</h3><p>Professor Alocado: ${v.professor || "Não atribuído"}</p></div>
          <div class="status-pill">${v.carga_horaria}h</div>
          <div class="record-actions"><button class="action-btn remove" data-id="${v.id_turma_disciplina}">Remover</button></div>
        </article>
      `;
    });
  } catch (e) {
    recordsList.innerHTML = "<p>Erro na requisição acadêmica.</p>";
  }
}

btnVincular.addEventListener("click", async () => {
  const fk_turma = Number(selectTurma.value);
  const fk_disciplina = Number(selectDisciplina.value);
  if (!fk_turma || !fk_disciplina) {
    showToast("Gatilho inválido. Selecione os dois campos.", "warning");
    return;
  }

  const res = await requisicaoApi(`${urlBase}api/admin/turma/disciplina`, {
    method: "POST",
    body: { fk_turma, fk_disciplina },
  });
  const d = await res.json();
  if (d.sucesso) {
    showToast("Matriz vinculada com sucesso!");
    await buscarVinculosDaTurma();
  } else {
    showToast(d.erro || "Falha ao vincular.", "error");
  }
});

recordsList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".action-btn.remove");
  if (!btn) return;
  if (!confirm("Deseja quebrar o vínculo desta disciplina com a turma?"))
    return;

  const res = await requisicaoApi(
    `${urlBase}api/admin/turma/disciplina/${btn.dataset.id}`,
    { method: "DELETE" },
  );
  const d = await res.json();
  if (d.sucesso) {
    showToast("Vínculo desfeito!");
    await buscarVinculosDaTurma();
  }
});

selectTurma.addEventListener("change", buscarVinculosDaTurma);
btnRecarregar.addEventListener("click", buscarVinculosDaTurma);
document.addEventListener("DOMContentLoaded", carregarDropdownsBases);
