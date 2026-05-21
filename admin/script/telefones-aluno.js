import { criarCrudPadrao } from "./resource-page.js";

criarCrudPadrao({
  nomeEntidade: "Telefone",
  nomeEntidadePlural: "Telefones",
  idKey: "id_telefone",
  endpoints: {
    listar: "api/admin/telefone-aluno",
    detalhe: (id) => `api/admin/telefone-aluno/${id}`,
    criar: "api/admin/telefone-aluno",
    editar: (id) => `api/admin/telefone-aluno/${id}`,
    excluir: (id) => `api/admin/telefone-aluno/${id}`,
  },
  chavesResposta: {
    lista: "telefones",
    item: "telefone",
  },
  camposBusca: ["nome_completo", "matricula", "telefone"],
  campos: [
    { key: "fk_aluno", inputId: "input-fk_aluno", required: true, apenasCriacao: true },
    { key: "telefone", inputId: "input-telefone", required: true },
  ],
  carregarAuxiliares: async ({ requisicaoApi, montarUrl }) => {
    const response = await requisicaoApi(montarUrl("api/admin/aluno"));
    const data = await response.json();
    return {
      alunos: data.alunos || [],
    };
  },
  preencherAuxiliaresFormulario: ({ aux, modoEdicao, item }) => {
    const selectAluno = document.getElementById("input-fk_aluno");
    if (!selectAluno) return;

    const valorAtual = selectAluno.value;

    selectAluno.innerHTML = '<option value="">Selecione...</option>';
    (aux.alunos || []).forEach((aluno) => {
      selectAluno.innerHTML += `
        <option value="${aluno.id_aluno}">${aluno.nome_completo} • ${aluno.matricula}</option>
      `;
    });

    if (modoEdicao && item) {
      selectAluno.value = item.id_aluno || valorAtual || "";
    } else {
      selectAluno.value = valorAtual || "";
    }
  },
  montarPayloadCriacao: ({ valores }) => ({
    fk_aluno: Number(valores.fk_aluno),
    telefone: valores.telefone.trim(),
  }),
  montarPayloadEdicao: ({ valores }) => ({
    telefone: valores.telefone.trim(),
  }),
  validarValores: ({ valores, showToast }) => {
    if (valores.telefone.trim().length < 8) {
      showToast("Informe um telefone valido.", "warning");
      return false;
    }
    return true;
  },
  montarCard: {
    titulo: ({ item }) => item.nome_completo,
    subtitulo: ({ item }) => `Matricula: ${item.matricula || "-"}`,
    status: ({ item }) => item.telefone,
  },
  camposDetalhe: [
    {
      label: "Aluno",
      valor: ({ item }) => item.nome_completo,
      full: true,
    },
    {
      label: "Matricula",
      valor: ({ item }) => item.matricula,
    },
    {
      label: "Telefone",
      valor: ({ item }) => item.telefone,
    },
  ],
});
