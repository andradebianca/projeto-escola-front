import { criarCrudPadrao } from "./resource-page.js";

criarCrudPadrao({
  nomeEntidade: "Turma",
  nomeEntidadePlural: "Turmas",
  idKey: "id_turma",
  endpoints: {
    listar: "api/admin/turma",
    detalhe: (id) => `api/admin/turma/${id}`,
    criar: "api/admin/turma",
    editar: (id) => `api/admin/turma/${id}`,
    excluir: (id) => `api/admin/turma/${id}`,
  },
  chavesResposta: {
    lista: "turmas",
    item: "turma",
  },
  camposBusca: ["cod_turma", "ano_letivo", "turno"],
  campos: [
    { key: "ano_letivo", inputId: "input-ano_letivo", required: true },
    { key: "cod_turma", inputId: "input-cod_turma", required: true },
    { key: "turno", inputId: "input-turno", required: true },
  ],
  montarPayloadCriacao: ({ valores }) => ({
    ano_letivo: Number(valores.ano_letivo),
    cod_turma: valores.cod_turma.trim(),
    turno: valores.turno,
  }),
  montarPayloadEdicao: ({ valores }) => ({
    ano_letivo: Number(valores.ano_letivo),
    cod_turma: valores.cod_turma.trim(),
    turno: valores.turno,
  }),
  validarValores: ({ valores, showToast }) => {
    const ano = Number(valores.ano_letivo);
    if (Number.isNaN(ano) || ano < 2000 || ano > 2100) {
      showToast("Informe um ano letivo valido.", "warning");
      return false;
    }
    return true;
  },
  montarCard: {
    titulo: ({ item }) => item.cod_turma,
    subtitulo: ({ item }) => `Ano ${item.ano_letivo} • ${item.turno}`,
    status: ({ item }) => `ID #${item.id_turma}`,
  },
  camposDetalhe: [
    {
      label: "Codigo",
      valor: ({ item }) => item.cod_turma,
    },
    {
      label: "Ano Letivo",
      valor: ({ item }) => item.ano_letivo,
    },
    {
      label: "Turno",
      valor: ({ item }) => item.turno,
      full: true,
    },
  ],
});
