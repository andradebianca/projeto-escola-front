// admin/script/vinculos-professor-especializacao.js
import { requisicaoApi, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const selectProfessor = document.getElementById("filtro-professor");
const selectEspecializacao = document.getElementById("filtro-especializacao");
const btnVincular = document.getElementById("btn-vincular");
const btnRecarregar = document.getElementById("btn-recarregar");
const recordsList = document.getElementById("records-list");

async function carregarDropdownsBases() {
  try {
    const [resProfs, resEsp] = await Promise.all([
      requisicaoApi(`${urlBase}api/admin/professor`),
      requisicaoApi(`${urlBase}api/admin/especializacao`),
    ]);
    const [dP, dE] = await Promise.all([resProfs.json(), resEsp.json()]);

    if (dP.sucesso) {
      selectProfessor.innerHTML =
        '<option value="">Selecione o professor...</option>';
      dP.professores.forEach(
        (p) =>
          (selectProfessor.innerHTML += `<option value="${p.id_professor}">${p.nome_completo}</option>`),
      );
    }
    if (dE.sucesso) {
      selectEspecializacao.innerHTML =
        '<option value="">Selecione a especialização...</option>';
      dE.especializacoes.forEach(
        (e) =>
          (selectEspecializacao.innerHTML += `<option value="${e.id_especializacao}">${e.nome}</option>`),
      );
    }
  } catch (e) {
    console.error(e);
  }
}

async function buscarVinculosDoProfessor() {
  if (!selectProfessor.value) {
    recordsList.innerHTML = "<p>Selecione um professor para analisar.</p>";
    return;
  }
  recordsList.innerHTML = "<p>Buscando titulações do docente...</p>";

  try {
    const res = await requisicaoApi(
      `${urlBase}api/admin/professor/${selectProfessor.value}/especializacao`,
    );
    const d = await res.json();
    const vinculos = d.especializacoes || [];

    recordsList.innerHTML = "";
    if (!vinculos.length) {
      recordsList.innerHTML =
        "<p>Nenhuma especialização vinculada para este professor.</p>";
      return;
    }

    vinculos.forEach((v) => {
      recordsList.innerHTML += `
        <article class="record-row">
          <div class="record-main"><h3>${v.nome}</h3><p>${v.descricao || "Sem descrição."}</p></div>
          <div class="status-pill">${v.carga_horaria}h</div>
          <div class="record-actions"><button class="action-btn remove" data-id="${v.id_especializacao}">Remover</button></div>
        </article>
      `;
    });
  } catch (e) {
    recordsList.innerHTML = "<p>Erro na requisição das titulações.</p>";
  }
}

btnVincular.addEventListener("click", async () => {
  const fk_professor = Number(selectProfessor.value);
  const fk_especializacao = Number(selectEspecializacao.value);

  if (!fk_professor || !fk_especializacao) {
    showToast(
      "Gatilho inválido. Selecione professor e especialização.",
      "warning",
    );
    return;
  }

  try {
    const res = await requisicaoApi(
      `${urlBase}api/admin/professor/especializacao`,
      {
        method: "POST",
        body: { fk_professor, fk_especializacao },
      },
    );
    const d = await res.json();
    if (d.sucesso) {
      showToast("Titulação vinculada com sucesso!");
      await buscarVinculosDoProfessor();
    } else {
      showToast(d.erro || "Falha ao vincular.", "error");
    }
  } catch (e) {
    showToast("Erro operacional.", "error");
  }
});

recordsList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".action-btn.remove");
  if (!btn) return;
  if (!confirm("Deseja realmente remover esta especialização do professor?"))
    return;

  try {
    // Como a sua tabela associativa de Prof x Especializacao no banco geralmente exige o ID do vinculo ou ID da esp,
    // usamos o id_especializacao que recebemos do array para dar DELETE no endpoint:
    const res = await requisicaoApi(
      `${urlBase}api/admin/professor/${selectProfessor.value}/especializacao/${btn.dataset.id}`,
      { method: "DELETE" },
    );
    const d = await res.json();
    if (d.sucesso) {
      showToast("Vínculo desfeito!");
      await buscarVinculosDoProfessor();
    } else {
      showToast(d.erro || "Falha ao remover vínculo.", "error");
    }
  } catch (e) {
    showToast("Erro operacional.", "error");
  }
});

selectProfessor.addEventListener("change", buscarVinculosDoProfessor);
btnRecarregar.addEventListener("click", buscarVinculosDoProfessor);
document.addEventListener("DOMContentLoaded", carregarDropdownsBases);
