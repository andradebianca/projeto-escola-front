import { criarCrudPadrao } from "./resource-page.js";

criarCrudPadrao({
  nomeEntidade: "Disciplina",
  nomeEntidadePlural: "Disciplinas",
  idKey: "id_disciplina",
  endpoints: {
    listar: "api/admin/disciplina",
    detalhe: (id) => `api/admin/disciplina/${id}`,
    criar: "api/admin/disciplina",
    editar: (id) => `api/admin/disciplina/${id}`,
    excluir: (id) => `api/admin/disciplina/${id}`,
  },
  chavesResposta: {
    lista: "disciplinas",
    item: "disciplina",
  },
  camposBusca: ["nome", "professor"],
  campos: [
    { key: "id_professor", inputId: "input-fk_professor", required: true },
    { key: "carga_horaria", inputId: "input-carga_horaria", required: true },
    { key: "nome", inputId: "input-nome", required: true },
    { key: "descricao", inputId: "input-descricao", required: false },
  ],
  carregarAuxiliares: async ({ requisicaoApi, montarUrl }) => {
    const response = await requisicaoApi(montarUrl("api/admin/professor"));
    const data = await response.json();
    return {
      professores: data.professores || [],
    };
  },
  preencherAuxiliaresFormulario: ({ aux }) => {
    const selectProfessor = document.getElementById("input-fk_professor");
    if (!selectProfessor) return;

    const valorAtual = selectProfessor.value;
    selectProfessor.innerHTML = '<option value="">Selecione...</option>';

    (aux.professores || []).forEach((professor) => {
      selectProfessor.innerHTML += `
        <option value="${professor.id_professor}">${professor.nome_completo}</option>
      `;
    });

    selectProfessor.value = valorAtual || "";
  },
  montarPayloadCriacao: ({ valores }) => ({
    fk_professor: Number(valores.id_professor),
    nome: valores.nome.trim(),
    carga_horaria: Number(valores.carga_horaria),
    descricao: valores.descricao?.trim() || null,
  }),
  montarPayloadEdicao: ({ valores }) => ({
    fk_professor: Number(valores.id_professor),
    nome: valores.nome.trim(),
    carga_horaria: Number(valores.carga_horaria),
    descricao: valores.descricao?.trim() || null,
  }),
  validarValores: ({ valores, showToast }) => {
    const carga = Number(valores.carga_horaria);
    if (Number.isNaN(carga) || carga <= 0) {
      showToast("Informe uma carga horaria valida.", "warning");
      return false;
    }
    return true;
  },
  montarCard: {
    titulo: ({ item }) => item.nome,
    subtitulo: ({ item }) => `Professor: ${item.professor || "-"}`,
    status: ({ item }) => `${item.carga_horaria || 0}h`,
  },
  camposDetalhe: [
    {
      label: "Nome",
      valor: ({ item }) => item.nome,
      full: true,
    },
    {
      label: "Professor",
      valor: ({ item }) => item.professor,
    },
    {
      label: "Carga Horaria",
      valor: ({ item }) => `${item.carga_horaria || 0}h`,
    },
    {
      label: "Descricao",
      valor: ({ item }) => item.descricao || "Sem descricao",
      full: true,
    },
  ],
});
