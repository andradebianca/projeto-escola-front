import { criarCrudPadrao } from "./resource-page.js";

criarCrudPadrao({
  nomeEntidade: "Telefone",
  nomeEntidadePlural: "Telefones",
  idKey: "id_telefone",
  endpoints: {
    listar: "api/admin/telefone-professor",
    detalhe: (id) => `api/admin/telefone-professor/${id}`,
    criar: "api/admin/telefone-professor",
    editar: (id) => `api/admin/telefone-professor/${id}`,
    excluir: (id) => `api/admin/telefone-professor/${id}`,
  },
  chavesResposta: {
    lista: "telefones",
    item: "telefone",
  },
  camposBusca: ["nome_completo", "telefone"],
  campos: [
    {
      key: "fk_professor",
      inputId: "input-fk_professor",
      required: true,
      apenasCriacao: true,
    },
    { key: "telefone", inputId: "input-telefone", required: true },
  ],
  carregarAuxiliares: async ({ requisicaoApi, montarUrl }) => {
    const response = await requisicaoApi(montarUrl("api/admin/professor"));
    const data = await response.json();
    return {
      professores: data.professores || [],
    };
  },
  preencherAuxiliaresFormulario: ({ aux, modoEdicao, item }) => {
    const selectProfessor = document.getElementById("input-fk_professor");
    if (!selectProfessor) return;

    const valorAtual = selectProfessor.value;

    selectProfessor.innerHTML = '<option value="">Selecione...</option>';
    (aux.professores || []).forEach((professor) => {
      selectProfessor.innerHTML += `
        <option value="${professor.id_professor}">${professor.nome_completo}</option>
      `;
    });

    if (modoEdicao && item) {
      selectProfessor.value = item.id_professor || valorAtual || "";
    } else {
      selectProfessor.value = valorAtual || "";
    }
  },
  montarPayloadCriacao: ({ valores }) => ({
    fk_professor: Number(valores.fk_professor),
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
    subtitulo: () => "Professor vinculado",
    status: ({ item }) => item.telefone,
  },
  camposDetalhe: [
    {
      label: "Professor",
      valor: ({ item }) => item.nome_completo,
      full: true,
    },
    {
      label: "Telefone",
      valor: ({ item }) => item.telefone,
      full: true,
    },
  ],
});
