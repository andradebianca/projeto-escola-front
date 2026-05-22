// admin/script/relatorios.js
import { requisicaoApi } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const logsList = document.getElementById("logs-list");
const inputPesquisa = document.getElementById("input-pesquisa");

let logsCache = [];

async function carregarLogs() {
  try {
    const res = await requisicaoApi(`${urlBase}api/admin/auditoria`);
    const d = await res.json();
    logsCache = d.logs ?? [];
    renderizarLogs(logsCache);
  } catch (e) {
    logsList.innerHTML = "<p>Erro ao buscar logs.</p>";
  }
}

function interpretarDadoLog(dadoBruto) {
  if (!dadoBruto) return null;
  try {
    // Se for JSON (legado), tenta formatar
    if (dadoBruto.trim().startsWith("{")) {
      const obj = JSON.parse(dadoBruto);
      return Object.entries(obj)
        .map(([k, v]) => `<b>${k}</b>: ${v}`)
        .join(" • ");
    }
  } catch (e) {}
  return dadoBruto; // Retorna texto puro caso não seja JSON
}

function renderizarLogs(lista) {
  logsList.innerHTML = "";
  if (!lista.length) {
    logsList.innerHTML = "<p>Nenhum log encontrado.</p>";
    return;
  }

  lista.forEach((log) => {
    // Definir classe visual pela ação
    let classeBadge = "status-pill";

    const dataFormatada = new Date(log.data_auditoria).toLocaleString("pt-BR");
    const valorAntes = interpretarDadoLog(log.dados_anteriores);
    const valorDepois = interpretarDadoLog(log.dados_novos);

    let htmlAlteracao = "";
    if (valorAntes || valorDepois) {
      htmlAlteracao = `
        <div style="margin-top: 8px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px;">
          ${valorAntes ? `<div style="color: #ef4444; margin-bottom: 4px;"><b>Antes:</b> ${valorAntes}</div>` : ""}
          ${valorDepois ? `<div style="color: #10b981;"><b>Depois:</b> ${valorDepois}</div>` : ""}
        </div>
      `;
    }

    logsList.innerHTML += `
      <article class="record-row" style="align-items: flex-start;">
        <div style="width: 140px; font-size: 11px; color: #64748b; margin-top: 4px;">${dataFormatada}</div>
        <div class="record-main">
          <h3 style="font-size: 14px; margin-bottom: 4px;">${log.descricao}</h3>
          <p style="font-size: 11px; color: #94a3b8;">
            <b>Ação:</b> ${log.acao} | <b>Tabela:</b> ${log.tabela_afetada} | <b>Autor:</b> ${log.user_name}
          </p>
          ${htmlAlteracao}
        </div>
      </article>
    `;
  });
}

inputPesquisa.addEventListener("input", () => {
  const q = inputPesquisa.value.toLowerCase().trim();
  renderizarLogs(
    logsCache.filter((l) =>
      `${l.descricao} ${l.user_name} ${l.tabela_afetada}`
        .toLowerCase()
        .includes(q),
    ),
  );
});

document.addEventListener("DOMContentLoaded", carregarLogs);
