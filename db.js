const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE,

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

async function getPool() {
  try {
    if (pool) {
      return pool;
    }

    pool = await new sql.ConnectionPool(config).connect();

    console.log("✅ Conectado ao SQL Server!");

    return pool;
  } catch (err) {
    console.error("❌ Erro na conexão:", err);

    pool = null;

    throw err;
  }
}

module.exports = {
  sql,
  getPool,
};
