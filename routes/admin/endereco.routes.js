const express = require("express");

const router = express.Router();

const { sql, getPool } = require("../../db");

const { verificarToken } = require("../../middlewares/auth.middleware");

const { apenasAdmin } = require("../../middlewares/admin.middleware");

const { registrarAuditoria } = require("../../helpers/auditoria");

// ========================================
// GET ALL
// ========================================
router.get(
  "/admin/endereco/uf",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
          SELECT *
          FROM uf
          ORDER BY nome_estado
        `);

      res.json({
        sucesso: true,
        ufs: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// GET BY ID
// ========================================
router.get(
  "/admin/endereco/uf/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_uf", sql.Int, id).query(`
          SELECT *
          FROM uf
          WHERE id_uf =
            @id_uf
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "UF não encontrada",
        });
      }

      res.json({
        sucesso: true,
        uf: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// CREATE
// ========================================
router.post(
  "/admin/endereco/uf",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { nome_estado } = req.body || {};

      if (!nome_estado) {
        return res.status(400).json({
          erro: "Nome obrigatório",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()

        .input("nome_estado", sql.VarChar(50), nome_estado).query(`
          INSERT INTO uf (
            nome_estado
          )

          OUTPUT INSERTED.*

          VALUES (
            @nome_estado
          )
        `);

      const uf = result.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "uf",

        idRegistro: uf.id_uf,

        descricao: "UF criada",

        dadosNovos: uf,
      });

      res.status(201).json({
        sucesso: true,
        uf,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// UPDATE
// ========================================
router.put(
  "/admin/endereco/uf/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { nome_estado } = req.body || {};

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_uf", sql.Int, id).query(`
            SELECT *
            FROM uf
            WHERE id_uf =
              @id_uf
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "UF não encontrada",
        });
      }

      await pool
        .request()

        .input("id_uf", sql.Int, id)

        .input("nome_estado", sql.VarChar(50), nome_estado).query(`
          UPDATE uf

          SET
            nome_estado =
              @nome_estado

          WHERE id_uf =
            @id_uf
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "uf",

        idRegistro: id,

        descricao: "UF atualizada",

        dadosAnteriores: anterior.recordset[0],

        dadosNovos: {
          nome_estado,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "UF atualizada",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// DELETE
// ========================================
router.delete(
  "/admin/endereco/uf/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_uf", sql.Int, id).query(`
            SELECT *
            FROM uf
            WHERE id_uf =
              @id_uf
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "UF não encontrada",
        });
      }

      await pool
        .request()

        .input("id_uf", sql.Int, id).query(`
          DELETE FROM uf
          WHERE id_uf =
            @id_uf
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "uf",

        idRegistro: id,

        descricao: "UF removida",

        dadosAnteriores: anterior.recordset[0],
      });

      res.json({
        sucesso: true,
        mensagem: "UF removida",
      });
    } catch (err) {
      if (err.number === 547) {
        return res.status(400).json({
          erro: "UF possui vínculos",
        });
      }

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.get(
  "/admin/endereco/cidade",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
          SELECT *
          FROM cidade
          ORDER BY nome_cidade
        `);

      res.json({
        sucesso: true,
        cidades: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// GET BY ID
// ========================================
router.get(
  "/admin/endereco/cidade/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_cidade", sql.Int, id).query(`
          SELECT *
          FROM cidade
          WHERE id_cidade =
            @id_cidade
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Cidade não encontrada",
        });
      }

      res.json({
        sucesso: true,
        cidade: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

router.post(
  "/admin/endereco/cidade",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { nome_cidade } = req.body || {};

      if (!nome_cidade) {
        return res.status(400).json({
          erro: "Nome obrigatório",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()

        .input("nome_cidade", sql.VarChar(50), nome_cidade).query(`
          INSERT INTO cidade (
            nome_cidade
          )

          OUTPUT INSERTED.*

          VALUES (
            @nome_cidade
          )
        `);

      const cidade = result.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "cidade",

        idRegistro: cidade.id_cidade,

        descricao: "Cidade criada",

        dadosNovos: cidade,
      });

      res.status(201).json({
        sucesso: true,
        cidade,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// UPDATE CIDADE
// ========================================
router.put(
  "/admin/endereco/cidade/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { nome_cidade } = req.body || {};

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_cidade", sql.Int, id).query(`
            SELECT *
            FROM cidade
            WHERE id_cidade =
              @id_cidade
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Cidade não encontrada",
        });
      }

      await pool
        .request()

        .input("id_cidade", sql.Int, id)

        .input("nome_cidade", sql.VarChar(50), nome_cidade).query(`
          UPDATE cidade

          SET
            nome_cidade =
              @nome_cidade

          WHERE id_cidade =
            @id_cidade
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "cidade",

        idRegistro: id,

        descricao: "Cidade atualizada",

        dadosAnteriores: anterior.recordset[0],

        dadosNovos: {
          nome_cidade,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Cidade atualizada",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// DELETE CIDADE
// ========================================
router.delete(
  "/admin/endereco/cidade/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_cidade", sql.Int, id).query(`
            SELECT *
            FROM cidade
            WHERE id_cidade =
              @id_cidade
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Cidade não encontrada",
        });
      }

      await pool
        .request()

        .input("id_cidade", sql.Int, id).query(`
          DELETE FROM cidade
          WHERE id_cidade =
            @id_cidade
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "cidade",

        idRegistro: id,

        descricao: "Cidade removida",

        dadosAnteriores: anterior.recordset[0],
      });

      res.json({
        sucesso: true,
        mensagem: "Cidade removida",
      });
    } catch (err) {
      if (err.number === 547) {
        return res.status(400).json({
          erro: "Cidade possui vínculos",
        });
      }

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// GET ALL
// ========================================
router.get(
  "/admin/endereco/rua",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
          SELECT *
          FROM rua
          ORDER BY nome_rua
        `);

      res.json({
        sucesso: true,
        ruas: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// GET BY ID
// ========================================
router.get(
  "/admin/endereco/rua/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_rua", sql.Int, id).query(`
          SELECT *
          FROM rua
          WHERE id_rua =
            @id_rua
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Rua não encontrada",
        });
      }

      res.json({
        sucesso: true,
        rua: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// CREATE RUA
// ========================================
router.post(
  "/admin/endereco/rua",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { nome_rua, cep, bairro } = req.body || {};

      if (!nome_rua || !cep || !bairro) {
        return res.status(400).json({
          erro: "Todos os campos são obrigatórios",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()

        .input("nome_rua", sql.VarChar(150), nome_rua)

        .input("cep", sql.VarChar(9), cep)

        .input("bairro", sql.VarChar(100), bairro).query(`
          INSERT INTO rua (
            nome_rua,
            cep,
            bairro
          )

          OUTPUT INSERTED.*

          VALUES (
            @nome_rua,
            @cep,
            @bairro
          )
        `);

      const rua = result.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "rua",

        idRegistro: rua.id_rua,

        descricao: "Rua criada",

        dadosNovos: rua,
      });

      res.status(201).json({
        sucesso: true,
        rua,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// UPDATE RUA
// ========================================
router.put(
  "/admin/endereco/rua/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { nome_rua, cep, bairro } = req.body || {};

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_rua", sql.Int, id).query(`
            SELECT *
            FROM rua
            WHERE id_rua =
              @id_rua
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Rua não encontrada",
        });
      }

      await pool
        .request()

        .input("id_rua", sql.Int, id)

        .input("nome_rua", sql.VarChar(150), nome_rua)

        .input("cep", sql.VarChar(9), cep)

        .input("bairro", sql.VarChar(100), bairro).query(`
          UPDATE rua

          SET
            nome_rua =
              @nome_rua,

            cep =
              @cep,

            bairro =
              @bairro

          WHERE id_rua =
            @id_rua
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "rua",

        idRegistro: id,

        descricao: "Rua atualizada",

        dadosAnteriores: anterior.recordset[0],

        dadosNovos: {
          nome_rua,
          cep,
          bairro,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Rua atualizada",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// DELETE RUA
// ========================================
router.delete(
  "/admin/endereco/rua/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_rua", sql.Int, id).query(`
            SELECT *
            FROM rua
            WHERE id_rua =
              @id_rua
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Rua não encontrada",
        });
      }

      await pool
        .request()

        .input("id_rua", sql.Int, id).query(`
          DELETE FROM rua
          WHERE id_rua =
            @id_rua
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "rua",

        idRegistro: id,

        descricao: "Rua removida",

        dadosAnteriores: anterior.recordset[0],
      });

      res.json({
        sucesso: true,
        mensagem: "Rua removida",
      });
    } catch (err) {
      if (err.number === 547) {
        return res.status(400).json({
          erro: "Rua possui vínculos",
        });
      }

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// GET ALL ENDEREÇOS
// ========================================
router.get(
  "/admin/endereco",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT
          e.id_endereco,
          e.numero,

          r.id_rua,
          r.nome_rua,
          r.cep,
          r.bairro,

          c.id_cidade,
          c.nome_cidade,

          uf.id_uf,
          uf.nome_estado

        FROM endereco e

        INNER JOIN rua r
          ON r.id_rua = e.fk_rua

        INNER JOIN cidade c
          ON c.id_cidade = e.fk_cidade

        INNER JOIN uf
          ON uf.id_uf = e.fk_uf

        ORDER BY
          uf.nome_estado,
          c.nome_cidade,
          r.nome_rua
      `);

      res.json({
        sucesso: true,
        enderecos: result.recordset,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// GET ENDEREÇO BY ID
// ========================================
router.get(
  "/admin/endereco/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const result = await pool
        .request()

        .input("id_endereco", sql.Int, id).query(`
          SELECT
            e.id_endereco,
            e.numero,

            r.id_rua,
            r.nome_rua,
            r.cep,
            r.bairro,

            c.id_cidade,
            c.nome_cidade,

            uf.id_uf,
            uf.nome_estado

          FROM endereco e

          INNER JOIN rua r
            ON r.id_rua = e.fk_rua

          INNER JOIN cidade c
            ON c.id_cidade = e.fk_cidade

          INNER JOIN uf
            ON uf.id_uf = e.fk_uf

          WHERE e.id_endereco =
            @id_endereco
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          erro: "Endereço não encontrado",
        });
      }

      res.json({
        sucesso: true,
        endereco: result.recordset[0],
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// CREATE ENDEREÇO
// ========================================
router.post(
  "/admin/endereco",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { fk_uf, fk_cidade, fk_rua, numero } = req.body || {};

      if (!fk_uf || !fk_cidade || !fk_rua || !numero) {
        return res.status(400).json({
          erro: "Todos os campos são obrigatórios",
        });
      }

      const pool = await getPool();

      const result = await pool
        .request()

        .input("fk_uf", sql.Int, fk_uf)

        .input("fk_cidade", sql.Int, fk_cidade)

        .input("fk_rua", sql.Int, fk_rua)

        .input("numero", sql.VarChar(10), numero).query(`
          INSERT INTO endereco (
            fk_uf,
            fk_cidade,
            fk_rua,
            numero
          )

          OUTPUT INSERTED.*

          VALUES (
            @fk_uf,
            @fk_cidade,
            @fk_rua,
            @numero
          )
        `);

      const endereco = result.recordset[0];

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "CREATE",

        tabela: "endereco",

        idRegistro: endereco.id_endereco,

        descricao: "Endereço criado",

        dadosNovos: endereco,
      });

      res.status(201).json({
        sucesso: true,
        endereco,
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// UPDATE ENDEREÇO
// ========================================
router.put(
  "/admin/endereco/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const { fk_uf, fk_cidade, fk_rua, numero } = req.body || {};

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_endereco", sql.Int, id).query(`
            SELECT *
            FROM endereco
            WHERE id_endereco =
              @id_endereco
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Endereço não encontrado",
        });
      }

      await pool
        .request()

        .input("id_endereco", sql.Int, id)

        .input("fk_uf", sql.Int, fk_uf)

        .input("fk_cidade", sql.Int, fk_cidade)

        .input("fk_rua", sql.Int, fk_rua)

        .input("numero", sql.VarChar(10), numero).query(`
          UPDATE endereco

          SET
            fk_uf =
              @fk_uf,

            fk_cidade =
              @fk_cidade,

            fk_rua =
              @fk_rua,

            numero =
              @numero

          WHERE id_endereco =
            @id_endereco
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "UPDATE",

        tabela: "endereco",

        idRegistro: id,

        descricao: "Endereço atualizado",

        dadosAnteriores: anterior.recordset[0],

        dadosNovos: {
          fk_uf,
          fk_cidade,
          fk_rua,
          numero,
        },
      });

      res.json({
        sucesso: true,
        mensagem: "Endereço atualizado",
      });
    } catch (err) {
      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

// ========================================
// DELETE ENDEREÇO
// ========================================
router.delete(
  "/admin/endereco/:id",

  verificarToken,
  apenasAdmin,

  async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await getPool();

      const anterior = await pool
        .request()

        .input("id_endereco", sql.Int, id).query(`
            SELECT *
            FROM endereco
            WHERE id_endereco =
              @id_endereco
          `);

      if (anterior.recordset.length === 0) {
        return res.status(404).json({
          erro: "Endereço não encontrado",
        });
      }

      await pool
        .request()

        .input("id_endereco", sql.Int, id).query(`
          DELETE FROM endereco
          WHERE id_endereco =
            @id_endereco
        `);

      await registrarAuditoria({
        usuarioId: req.usuario.id_usuario,

        acao: "DELETE",

        tabela: "endereco",

        idRegistro: id,

        descricao: "Endereço removido",

        dadosAnteriores: anterior.recordset[0],
      });

      res.json({
        sucesso: true,
        mensagem: "Endereço removido",
      });
    } catch (err) {
      if (err.number === 547) {
        return res.status(400).json({
          erro: "Endereço possui vínculos",
        });
      }

      res.status(500).json({
        erro: err.message,
      });
    }
  },
);

module.exports = router;
