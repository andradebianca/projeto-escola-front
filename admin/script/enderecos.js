import { criarCrudPadrao } from "./resource-page.js";

criarCrudPadrao({
  nomeEntidade: "Endereco",
  nomeEntidadePlural: "Enderecos",
  idKey: "id_endereco",
  endpoints: {
    listar: "api/admin/endereco",
    detalhe: (id) => `api/admin/endereco/${id}`,
    criar: "api/admin/endereco",
    editar: (id) => `api/admin/endereco/${id}`,
    excluir: (id) => `api/admin/endereco/${id}`,
  },
  chavesResposta: {
    lista: "enderecos",
    item: "endereco",
  },
  camposBusca: ["nome_rua", "nome_cidade", "nome_estado", "numero"],
  campos: [
    { key: "id_uf", inputId: "input-fk_uf", required: true },
    { key: "id_cidade", inputId: "input-fk_cidade", required: true },
    { key: "id_rua", inputId: "input-fk_rua", required: true },
    { key: "numero", inputId: "input-numero", required: true },
  ],
  carregarAuxiliares: async ({ requisicaoApi, montarUrl }) => {
    const [resUfs, resCidades, resRuas] = await Promise.all([
      requisicaoApi(montarUrl("api/admin/endereco/uf")),
      requisicaoApi(montarUrl("api/admin/endereco/cidade")),
      requisicaoApi(montarUrl("api/admin/endereco/rua")),
    ]);

    const [dadosUfs, dadosCidades, dadosRuas] = await Promise.all([
      resUfs.json(),
      resCidades.json(),
      resRuas.json(),
    ]);

    return {
      ufs: dadosUfs.ufs || [],
      cidades: dadosCidades.cidades || [],
      ruas: dadosRuas.ruas || [],
    };
  },
  preencherAuxiliaresFormulario: ({ aux }) => {
    const selectUf = document.getElementById("input-fk_uf");
    const selectCidade = document.getElementById("input-fk_cidade");
    const selectRua = document.getElementById("input-fk_rua");

    const ufAtual = selectUf?.value;
    const cidadeAtual = selectCidade?.value;
    const ruaAtual = selectRua?.value;

    if (selectUf) {
      selectUf.innerHTML = '<option value="">Selecione...</option>';
      (aux.ufs || []).forEach((uf) => {
        selectUf.innerHTML += `<option value="${uf.id_uf}">${uf.nome_estado}</option>`;
      });
      selectUf.value = ufAtual || "";
    }

    if (selectCidade) {
      selectCidade.innerHTML = '<option value="">Selecione...</option>';
      (aux.cidades || []).forEach((cidade) => {
        selectCidade.innerHTML += `<option value="${cidade.id_cidade}">${cidade.nome_cidade}</option>`;
      });
      selectCidade.value = cidadeAtual || "";
    }

    if (selectRua) {
      selectRua.innerHTML = '<option value="">Selecione...</option>';
      (aux.ruas || []).forEach((rua) => {
        selectRua.innerHTML += `<option value="${rua.id_rua}">${rua.nome_rua}</option>`;
      });
      selectRua.value = ruaAtual || "";
    }
  },
  montarPayloadCriacao: ({ valores }) => ({
    fk_uf: Number(valores.id_uf),
    fk_cidade: Number(valores.id_cidade),
    fk_rua: Number(valores.id_rua),
    numero: valores.numero.trim(),
  }),
  montarPayloadEdicao: ({ valores }) => ({
    fk_uf: Number(valores.id_uf),
    fk_cidade: Number(valores.id_cidade),
    fk_rua: Number(valores.id_rua),
    numero: valores.numero.trim(),
  }),
  montarCard: {
    titulo: ({ item }) => `${item.nome_rua}, ${item.numero}`,
    subtitulo: ({ item }) => `${item.nome_cidade}/${item.nome_estado}`,
    status: ({ item }) => item.cep || "Sem CEP",
  },
  camposDetalhe: [
    {
      label: "Rua",
      valor: ({ item }) => item.nome_rua,
      full: true,
    },
    {
      label: "Numero",
      valor: ({ item }) => item.numero,
    },
    {
      label: "Bairro",
      valor: ({ item }) => item.bairro,
    },
    {
      label: "Cidade",
      valor: ({ item }) => item.nome_cidade,
    },
    {
      label: "Estado",
      valor: ({ item }) => item.nome_estado,
    },
    {
      label: "CEP",
      valor: ({ item }) => item.cep,
    },
  ],
});
