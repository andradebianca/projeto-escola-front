// admin/script/vinculo-especializacao.js
import { requisicaoApi, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const selectProfessor = document.getElementById("select-professor");
const selectEspecializacao = document.getElementById("select-especializacao");
const painelVinculos = document.getElementById("painel-vinculos");
const avisoVazio = document.getElementById("aviso-vazio");
const nomeProfessorTitulo = document.getElementById("nome-professor-titulo");
const btnAdicionarVinculo = document.getElementById("btn-adicionar-vinculo");
const vinculosList = document.getElementById("vinculos-list");

let professorIdSelecionado = null;

async function init() {
  await Promise.all([carregarProfessores(), carregarEspecializacoes()]);
  configurarEventos();
}

// 1. Carrega todos os professores para o select principal
async function carregarProfessores() {
  try {
    const res = await requisicaoApi(`${urlBase}api/admin/professor`);
    const d = await res.json();
    if (d.sucesso) {
      selectProfessor.innerHTML =
        '<option value="">Escolha um docente...</option>';
      (d.professores ?? []).forEach((p) => {
        selectProfessor.innerHTML += `<option value="${p.id_professor}">${p.nome_completo}</option>`;
      });
    }
  } catch (e) {
    showToast("Erro ao carregar lista de professores.", "error");
  }
}

// 2. Carrega todas as especializações globais disponíveis para vínculo
async function carregarEspecializacoes() {
  try {
    const res = await requisicaoApi(`${urlBase}api/admin/especializacao`);
    const d = await res.json();
    if (d.sucesso) {
      selectEspecializacao.innerHTML =
        '<option value="">Selecione a titulação...</option>';
      (d.especializacoes ?? []).forEach((e) => {
        selectEspecializacao.innerHTML += `<option value="${e.id_especializacao}">${e.nome} (${e.carga_horaria}h)</option>`;
      });
    }
  } catch (e) {
    showToast("Erro ao carregar lista de especializações.", "error");
  }
}

// 3. Gerencia a mudança de estado da tela ao escolher um professor
function configurarEventos() {
  selectProfessor.addEventListener("change", async () => {
    const id = selectProfessor.value;
    if (!id) {
      professorIdSelecionado = null;
      painelVinculos.classList.add("is-hidden");
      avisoVazio.classList.remove("is-hidden");
      return;
    }

    professorIdSelecionado = Number(id);
    nomeProfessorTitulo.innerText =
      selectProfessor.options[selectProfessor.selectedIndex].text;
    avisoVazio.classList.add("is-hidden");
    painelVinculos.classList.remove("is-hidden");

    await carregarVinculosProfessor();
  });

  // Evento de clique para adicionar o vínculo
  btnAdicionarVinculo.addEventListener("click", adicionarVinculo);
}

// 4. Carrega os títulos atuais vinculados àquele professor específico
async function carregarVinculosProfessor() {
  try {
    vinculosList.innerHTML =
      "<p style='font-size: 13px; color: #64748b;'>Buscando vínculos...</p>";
    const res = await requisicaoApi(
      `${urlBase}api/admin/professor/${professorIdSelecionado}/especializacao`,
    );
    const d = await res.json();

    renderizarVinculos(d.especializacoes ?? []);
  } catch (e) {
    vinculosList.innerHTML =
      "<p>Falha ao sincronizar títulos do professor.</p>";
  }
}

function renderizarVinculos(lista) {
  vinculosList.innerHTML = "";
  if (!lista.length) {
    vinculosList.innerHTML =
      "<p style='font-size: 13px; color: #94a3b8; font-style: italic;'>Nenhuma especialização vinculada a este professor ainda.</p>";
    return;
  }

  lista.forEach((item) => {
    vinculosList.innerHTML += `
      <article class="record-row" style="padding: 14px 20px; border-radius: 12px;">
        <div class="record-main">
          <h3 style="font-size: 14px; font-weight: 700;">${item.nome}</h3>
          <p style="font-size: 12px; color: #64748b;">Carga Horária: ${item.carga_horaria}h</p>
        </div>
        <div class="record-actions">
          <button class="action-btn remove" data-id-vinculo="${item.id_vinculo}" style="height: 32px; padding: 0 12px; border-radius: 8px; font-size: 12px;">
            <i class="fa-solid fa-link-slash"></i> Remover
          </button>
        </div>
      </article>
    `;
  });

  // Mapeia cliques de exclusão via delegação de escopo local
  vinculosList.querySelectorAll(".action-btn.remove").forEach((btn) => {
    btn.addEventListener("click", deletarVinculo);
  });
}

// 5. Cadastra o vínculo no banco
async function adicionarVinculo() {
  const fk_especializacao = selectEspecializacao.value;
  if (!fk_especializacao) {
    showToast("Selecione uma especialização para vincular.", "warning");
    return;
  }

  const payload = {
    fk_professor: professorIdSelecionado,
    fk_especializacao: Number(fk_especializacao),
  };

  try {
    const res = await requisicaoApi(
      `${urlBase}api/admin/professor/especializacao`,
      {
        method: "POST",
        body: payload,
      },
    );
    const d = await res.json();

    if (d.sucesso) {
      showToast("Especialização vinculada com sucesso!");
      selectEspecializacao.value = "";
      await carregarVinculosProfessor();
    } else {
      showToast(d.erro || "Falha ao criar vínculo.", "error");
    }
  } catch (e) {
    showToast("Erro operacional na rede.", "error");
  }
}

// 6. Remove o vínculo do banco
async function deletarVinculo(e) {
  const btn = e.target.closest(".action-btn.remove");
  if (!btn) return;
  const idVinculo = btn.dataset.idVinculo;

  if (!confirm("Deseja realmente desvincular esta titulação do professor?"))
    return;

  try {
    const res = await requisicaoApi(
      `${urlBase}api/admin/professor/${professorIdSelecionado}/especializacao/${idVinculo}`,
      {
        method: "DELETE",
      },
    );
    const d = await res.json();

    if (d.sucesso) {
      showToast("Vínculo removido com sucesso!");
      await carregarVinculosProfessor();
    } else {
      showToast(d.erro || "Não foi possível remover o vínculo.", "error");
    }
  } catch (e) {
    showToast("Erro ao processar exclusão no servidor.", "error");
  }
}

document.addEventListener("DOMContentLoaded", init);
