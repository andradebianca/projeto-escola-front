import { criarCrudPadrao } from "./resource-page.js";

criarCrudPadrao({
  nomeEntidade: "Especializacao",
  nomeEntidadePlural: "Especializacoes",
  idKey: "id_especializacao",
  endpoints: {
    listar: "api/admin/especializacao",
    detalhe: (id) => `api/admin/especializacao/${id}`,
    criar: "api/admin/especializacao",
    editar: (id) => `api/admin/especializacao/${id}`,
    excluir: (id) => `api/admin/especializacao/${id}`,
  },
  chavesResposta: {
    lista: "especializacoes",
    item: "especializacao",
  },
  camposBusca: ["nome", "descricao"],
  campos: [
    { key: "nome", inputId: "input-nome", required: true },
    { key: "carga_horaria", inputId: "input-carga_horaria", required: true },
    { key: "descricao", inputId: "input-descricao", required: false },
  ],
  montarPayloadCriacao: ({ valores }) => ({
    nome: valores.nome.trim(),
    carga_horaria: Number(valores.carga_horaria),
    descricao: valores.descricao?.trim() || null,
  }),
  montarPayloadEdicao: ({ valores }) => ({
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
    subtitulo: ({ item }) => item.descricao || "Sem descricao cadastrada",
    status: ({ item }) => `${item.carga_horaria || 0}h`,
  },
  camposDetalhe: [
    {
      label: "Nome",
      valor: ({ item }) => item.nome,
      full: true,
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
