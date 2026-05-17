const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db'); 

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/teste', (req, res) => {
  res.json({ mensagem: 'API funcionando!', status: 'ok' });
});

// Rota de alunos — agora com dados reais!
app.get('/api/alunos', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM alunos');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.listen(3000, () => {
  console.log('API rodando em http://localhost:3000');
});