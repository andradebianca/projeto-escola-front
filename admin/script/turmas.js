// admin/script/turmas.js
import {requisicaoApi, showToast} from "./../../script/funcs-global.js";
import {urlBase} from "./../../script/variaveis-globais.js";

const turmasList = document.getElementById("turmas-list");
const inputPesquisa = document.getElementById("input-pesquisa");
const btnNovaTurma = document.getElementById("btn-nova-turma");
const modalOverlay = document.getElementById("modal-overlay");
const closeModal = document.getElementById("close-modal");
const modalTitle = document.getElementById("modal-title");
const btnSalvarTurma = document.getElementById("btn-salvar-turma");

/* ELEMENTOS DO MODAL DE CONFIRMAÇÃO */
const confirmDeleteOverlay = document.getElementById("confirm-delete-overlay");
const deleteTargetName = document.getElementById("delete-target-name");
const btnCancelarExclusao = document.getElementById("btn-cancelar-exclusao");
const btnConfirmarExclusao = document.getElementById("btn-confirmar-exclusao");

const inputCodTurma = document.getElementById("input-cod-turma");
const inputAnoLetivo = document.getElementById("input-ano-letivo");
const inputTurno = document.getElementById("input-turno");

let turmasCache = [];
let turmaIdEditando = null;
let turmaIdExcluindo = null;
let modoEdicao = false;

function init() {
	buscarTurmas();
	configurarEventosExclusao();
}

async function buscarTurmas() {
	try {
		turmasList.innerHTML = "<p>Carregando turmas...</p>";
		const res = await requisicaoApi(`${urlBase}api/admin/turma`);
		const d = await res.json();
		turmasCache = d.turmas ?? [];
		renderizarTurmas(turmasCache);
	} catch (e) {
		turmasList.innerHTML = "<p>Erro ao ler registros.</p>";
	}
}

function renderizarTurmas(lista) {
	turmasList.innerHTML = "";
	if (!lista.length) {
		turmasList.innerHTML = "<p>Nenhuma turma cadastrada.</p>";
		return;
	}

	lista.forEach((t) => {
		turmasList.innerHTML += `
      <article class="record-row">
        <div class="record-main">
          <h3>${t.cod_turma}</h3>
          <p>Ano Letivo: ${t.ano_letivo} • Turno: ${t.turno}</p>
        </div>
        <div class="status-pill">ID #${t.id_turma}</div>
        <div class="record-actions" style="display: flex; gap: 8px;">
          <button class="action-btn edit" data-action="editar" data-id="${t.id_turma}">
            <i class="fa-solid fa-pen-to-square"></i> Editar
          </button>
          <button class="action-btn delete" data-action="excluir" data-id="${t.id_turma}" data-nome="${t.cod_turma}" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
            <i class="fa-solid fa-trash-can"></i> Excluir
          </button>
        </div>
      </article>
    `;
	});
}

btnSalvarTurma.addEventListener("click", async () => {
	const payload = {
		cod_turma: inputCodTurma.value.trim(),
		ano_letivo: Number(inputAnoLetivo.value),
		turno: inputTurno.value,
	};

	if (!payload.cod_turma || !payload.ano_letivo || !payload.turno) {
		showToast("Preencha todos os campos obrigatórios.", "warning");
		return;
	}

	try {
		let res;
		if (modoEdicao) {
			res = await requisicaoApi(
				`${urlBase}api/admin/turma/${turmaIdEditando}`,
				{
					method: "PUT",
					body: payload,
				},
			);
		} else {
			res = await requisicaoApi(`${urlBase}api/admin/turma`, {
				method: "POST",
				body: payload,
			});
		}

		const d = await res.json();
		if (!d.sucesso) {
			showToast(
				d.erro || d.mensagem || "Erro na operação.",
				"error",
			);
			return;
		}

		showToast("Turma salva com sucesso!", "success");
		fecharModal();
		await buscarTurmas();
	} catch (e) {
		showToast("Erro operacional na rede.", "error");
	}
});

btnNovaTurma.addEventListener("click", () => {
	modoEdicao = false;
	turmaIdEditando = null;
	modalTitle.innerText = "Nova Turma";
	btnSalvarTurma.innerText = "Salvar Turma";
	inputCodTurma.value = "";
	inputTurno.value = "";
	inputAnoLetivo.value = 2025;
	modalOverlay.classList.add("active");
});

function fecharModal() {
	modalOverlay.classList.remove("active");
}
closeModal.addEventListener("click", fecharModal);

/* DELEGAÇÃO DE EVENTOS PARA A PLATAFORMA DE TURMAS */
turmasList.addEventListener("click", async (e) => {
	const btn = e.target.closest(".action-btn");
	if (!btn) return;

	const id = btn.dataset.id;
	const action = btn.dataset.action;

	if (action === "editar") {
		modoEdicao = true;
		turmaIdEditando = id;
		modalTitle.innerText = "Editar Turma";
		btnSalvarTurma.innerText = "Salvar Alterações";

		const res = await requisicaoApi(
			`${urlBase}api/admin/turma/${turmaIdEditando}`,
		);
		const d = await res.json();
		if (d.sucesso) {
			inputCodTurma.value = d.turma.cod_turma;
			inputAnoLetivo.value = d.turma.ano_letivo;
			inputTurno.value = d.turma.turno;
			modalOverlay.classList.add("active");
		}
	} else if (action === "excluir") {
		turmaIdExcluindo = id;
		deleteTargetName.innerText = btn.dataset.nome;
		confirmDeleteOverlay.classList.add("active");
	}
});

function configurarEventosExclusao() {
	btnCancelarExclusao.addEventListener("click", () => {
		confirmDeleteOverlay.classList.remove("active");
		turmaIdExcluindo = null;
	});

	btnConfirmarExclusao.addEventListener("click", async () => {
		if (!turmaIdExcluindo) return;

		try {
			const res = await requisicaoApi(
				`${urlBase}api/admin/turma/${turmaIdExcluindo}`,
				{
					method: "DELETE",
				},
			);
			const d = await res.json();

			if (d.sucesso) {
				showToast("Turma removida com sucesso!", "success");
				confirmDeleteOverlay.classList.remove("active");
				turmaIdExcluindo = null;
				await buscarTurmas();
			} else {
				showToast(
					d.erro || "Erro ao tentar deletar a turma.",
					"error",
				);
			}
		} catch (err) {
			showToast("Erro de rede ao tentar excluir.", "error");
		}
	});
}

inputPesquisa.addEventListener("input", () => {
	const q = inputPesquisa.value.toLowerCase().trim();
	renderizarTurmas(
		turmasCache.filter((t) => t.cod_turma.toLowerCase().includes(q)),
	);
});

document.addEventListener("DOMContentLoaded", init);
