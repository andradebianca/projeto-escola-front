import { requisicaoApi, showToast } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const espList = document.getElementById("esp-list");
const inputPesquisa = document.getElementById("input-pesquisa");
const btnNovaEsp = document.getElementById("btn-nova-esp");
const modalOverlay = document.getElementById("modal-overlay");
const closeModal = document.getElementById("close-modal");
const modalTitle = document.getElementById("modal-title");
const btnSalvarEsp = document.getElementById("btn-salvar-esp");
const btnExcluirEsp = document.getElementById("btn-excluir-esp");

const inputNome = document.getElementById("input-nome");
const inputCarga = document.getElementById("input-carga");
const inputDescricao = document.getElementById("input-descricao");

let espCache = [];
let espIdEditando = null;
let modoEdicao = false;

async function buscarEspecializacoes() {
  try {
    espList.innerHTML = "<p>Carregando...</p>";
    const res = await requisicaoApi(`${urlBase}api/admin/especializacao`);
    const d = await res.json();
    espCache = d.especializacoes ?? [];
    renderizarLista(espCache);
  } catch (e) {
    espList.innerHTML = "<p>Erro na carga de dados.</p>";
  }
}

function renderizarLista(lista) {
  espList.innerHTML = "";
  if (!lista.length) {
    espList.innerHTML = "<p>Nenhuma especialização cadastrada.</p>";
    return;
  }

  lista.forEach((item) => {
    espList.innerHTML += `
      <article class="record-row" style="gap: 20px;">
        <div class="record-main" style="min-width: 0;">
          <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">${item.nome}</h3>
          <p style="font-size: 13px; color: #64748b; margin: 0; white-space: normal; line-height: 1.4;">
            ${item.descricao || "Sem descrição disponível."}
          </p>
        </div>
        <div class="status-pill" style="flex-shrink: 0;">${item.carga_horaria}h</div>
        <div class="record-actions" style="flex-shrink: 0;">
          <button class="action-btn edit" data-id="${item.id_especializacao}">Editar</button>
        </div>
      </article>
    `;
  });
}

btnSalvarEsp.addEventListener("click", async () => {
  const payload = {
    nome: inputNome.value.trim(),
    carga_horaria: Number(inputCarga.value),
    descricao: inputDescricao.value.trim() || null,
  };

  if (!payload.nome || !inputCarga.value) {
    showToast("Preencha os campos obrigatórios.", "warning");
    return;
  }

  try {
    let res;
    if (modoEdicao) {
      res = await requisicaoApi(
        `${urlBase}api/admin/especializacao/${espIdEditando}`,
        { method: "PUT", body: payload },
      );
    } else {
      res = await requisicaoApi(`${urlBase}api/admin/especializacao`, {
        method: "POST",
        body: payload,
      });
    }

    const d = await res.json();
    if (!d.sucesso) {
      showToast(d.erro || "Erro operacional.", "error");
      return;
    }

    showToast("Especialização registrada!");
    fecharModal();
    await buscarEspecializacoes();
  } catch (e) {
    showToast("Erro de comunicação com o servidor.", "error");
  }
});

btnNovaEsp.addEventListener("click", () => {
  modoEdicao = false;
  espIdEditando = null;
  modalTitle.innerText = "Nova Especialização";
  btnSalvarEsp.innerText = "Salvar Registro";
  btnExcluirEsp.classList.remove("active");
  inputNome.value = "";
  inputCarga.value = "";
  inputDescricao.value = "";
  modalOverlay.classList.add("active");
});

function fecharModal() {
  modalOverlay.classList.remove("active");
}
closeModal.addEventListener("click", fecharModal);

espList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".action-btn.edit");
  if (!btn) return;
  modoEdicao = true;
  espIdEditando = btn.dataset.id;
  modalTitle.innerText = "Editar Especialização";
  btnSalvarEsp.innerText = "Salvar Alterações";
  btnExcluirEsp.classList.add("active");

  const res = await requisicaoApi(
    `${urlBase}api/admin/especializacao/${espIdEditando}`,
  );
  const d = await res.json();
  if (d.sucesso) {
    inputNome.value = d.especializacao.nome;
    inputCarga.value = d.especializacao.carga_horaria;
    inputDescricao.value = d.especializacao.descricao || "";
    modalOverlay.classList.add("active");
  }
});

btnExcluirEsp.addEventListener("click", async () => {
  if (!confirm("Deseja realmente remover esta especialização?")) return;
  const res = await requisicaoApi(
    `${urlBase}api/admin/especializacao/${espIdEditando}`,
    { method: "DELETE" },
  );
  const d = await res.json();
  if (d.sucesso) {
    showToast("Registro deletado.");
    fecharModal();
    await buscarEspecializacoes();
  } else {
    showToast(d.erro || "Não foi possível excluir.", "error");
  }
});

inputPesquisa.addEventListener("input", () => {
  const q = inputPesquisa.value.toLowerCase().trim();
  renderizarLista(espCache.filter((e) => e.nome.toLowerCase().includes(q)));
});

document.addEventListener("DOMContentLoaded", buscarEspecializacoes);
