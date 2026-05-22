function gerarUserName(nomeCompleto) {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].toLowerCase();

  const primeiroNome = partes[0].toLowerCase();
  const ultimoNome = partes[partes.length - 1].toLowerCase();

  return `${primeiroNome}.${ultimoNome}`;
}

module.exports = { gerarUserName };
