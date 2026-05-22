import { requisicaoApi } from "./../../script/funcs-global.js";
import { urlBase } from "./../../script/variaveis-globais.js";

const logsList = document.getElementById("logs-list");
const inputPesquisa = document.getElementById("input-pesquisa");

let logsCache = [];

async function carregarLogsAuditoria() {
  try {
    logsList.innerHTML =
      "<p style='font-size: 13px; color: #64748b;'>Carregando trilha de auditoria...</p>";
    const res = await requisicaoApi(`${urlBase}api/admin/auditoria`);
    const d = await res.json();

    logsCache = d.logs ?? [];
    renderizarLogs(logsCache);
  } catch (e) {
    logsList.innerHTML =
      "<p style='font-size: 13px; color: #ef4444;'>Erro ao ler logs do servidor.</p>";
  }
}

// MOTOR DE RETROCOMPATIBILIDADE: Decifra JSON legado ou Texto Novo
function interpretarDadoLog(dadoBruto) {
  if (!dadoBruto) return null;

  const texto = String(dadoBruto).trim();

  // Verifica se é o formato antigo de JSON salvo como string
  if (texto.startsWith("{") || texto.startsWith("[")) {
    try {
      const obj = JSON.parse(texto);
      return Object.entries(obj)
        .map(
          ([chave, valor]) =>
            `<b>${chave}</b>: ${typeof valor === "object" ? JSON.stringify(valor) : valor}`,
        )
        .join(" &bull; ");
    } catch (e) {
      // Se falhar o parse por string corrompida, deixa seguir como texto puro
    }
  }

  // Se for o formato novo de texto limpo, apenas retorna
  return texto;
}

function renderizarLogs(lista) {
  logsList.innerHTML = "";
  if (!lista.length) {
    logsList.innerHTML =
      "<p style='font-size: 13px; color: #94a3b8; font-style: italic;'>Nenhum registro de auditoria encontrado.</p>";
    return;
  }

  lista.forEach((log) => {
    // Cores dinâmicas para as Badges baseadas na Ação
    let classeBadge = "status-cursando"; // Amarelo para UPDATE
    if (log.acao === "CREATE") classeBadge = "status-aprovado"; // Verde
    if (log.acao === "DELETE") classeBadge = "status-reprovado"; // Vermelho

    const dataFormatada = new Date(log.data_acao).toLocaleString("pt-BR");

    // Passa os dados pelo interpretador inteligente
    const valorAntes = interpretarDadoLog(log.dados_anteriores);
    const valorDepois = interpretarDadoLog(log.dados_novos);

    // Monta a caixa de histórico apenas se houver metadados salvos
    let htmlAlteracao = "";
    if (valorAntes || valorDepois) {
      htmlAlteracao = `
        <div style="margin-top: 8px; padding: 10px 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 11px; line-height: 1.5; width: 100%;">
          ${valorAntes ? `<div style="color: #64748b; text-decoration: line-through; margin-bottom: 2px;"><span style="color: #ef4444; font-weight: bold; margin-right: 6px;">Antes:</span> ${valorAntes}</div>` : ""}
          ${valorDepois ? `<div><span style="color: #10b981; font-weight: bold; margin-right: 6px;">Depois:</span> ${valorDepois}</div>` : ""}
        </div>
      `;
    }

    logsList.innerHTML += `
      <article class="record-row" style="gap: 16px; align-items: flex-start; padding: 16px 20px;">
        <div style="font-size: 11px; color: #64748b; width: 130px; flex-shrink: 0; font-weight: 600; margin-top: 4px;">
          ${dataFormatada}
        </div>
        <div style="width: 80px; flex-shrink: 0; display: flex; margin-top: 2px;">
          <span class="status-pill ${classeBadge}" style="min-width: 76px; text-align: center; text-transform: uppercase; font-size: 9px; height: 22px;">
            ${log.acao}
          </span>
        </div>
        <div class="record-main" style="min-width: 0;">
          <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0; white-space: normal;">${log.descricao}</h3>
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            <i class="fa-solid fa-user"></i> Executor: <b style="color: #475569;">${log.user_name}</b> &bull; Tabela: <u style="color: #64748b;">${log.tabela_afetada}</u> (ID Ref: ${log.id_registro || "N/A"})
          </p>
          ${htmlAlteracao}
        </div>
      </article>
    `;
  });
}

// Filtro de pesquisa inteligente e em tempo real
inputPesquisa.addEventListener("input", () => {
  const q = inputPesquisa.value.toLowerCase().trim();
  const filtrados = logsCache.filter((l) =>
    `${l.descricao} ${l.user_name} ${l.acao} ${l.tabela_afetada}`
      .toLowerCase()
      .includes(q),
  );
  renderizarLogs(filtrados);
});

document.addEventListener("DOMContentLoaded", carregarLogsAuditoria);
