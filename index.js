"use strict";
//202200030 202200030@estudantes.ips.pt
//202200009 202200009@estudantes.ips.pt


const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());
app.use(cors());

// Configuração da pool de conexões – ajuste os valores conforme seu ambiente
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Fp_15848154",       // Preencha a senha se houver
  database: "estsbike_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função auxiliar para tratamento de erros
function handleError(res, error) {
  console.error(error);
  res.status(500).json({ message: "Erro interno no servidor" });
}

// ====================================================
// ROTAS PARA eventTypes
// ====================================================

// GET /eventTypes – Lista todos os tipos de eventos
app.get("/eventTypes", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM eventTypes");
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

// GET /eventTypes/:id – Obtém um tipo de evento específico
app.get("/eventTypes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM eventTypes WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Tipo de evento não encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// POST /eventTypes – Cria um novo tipo de evento
app.post("/eventTypes", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ message: "Descrição é obrigatória" });
    }
    const [result] = await pool.query(
      "INSERT INTO eventTypes (description) VALUES (?)",
      [description]
    );
    const newId = result.insertId;
    res.status(201).json({ id: newId, description });
  } catch (error) {
    handleError(res, error);
  }
});

// PUT /eventTypes/:id – Atualiza um tipo de evento existente
app.put("/eventTypes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ message: "Descrição é obrigatória" });
    }
    const [result] = await pool.query(
      "UPDATE eventTypes SET description = ? WHERE id = ?",
      [description, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tipo de evento não encontrado" });
    }
    res.json({ id: Number(id), description });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE /eventTypes/:id – Apaga um tipo de evento (se não houver eventos associados)
app.delete("/eventTypes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Verifica se há eventos associados a este tipo
    const [eventRows] = await pool.query("SELECT * FROM events WHERE typeId = ?", [id]);
    if (eventRows.length > 0) {
      return res.status(400).json({ message: "Não pode apagar o tipo pois existem eventos associados" });
    }
    const [result] = await pool.query("DELETE FROM eventTypes WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tipo de evento não encontrado" });
    }
    res.json({ message: "Tipo de evento apagado com sucesso" });
  } catch (error) {
    handleError(res, error);
  }
});

// ====================================================
// ROTAS PARA events
// ====================================================

// GET /events – Lista todos os eventos
app.get("/events", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM events");
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

// GET /events/:id – Obtém um evento específico
app.get("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Evento não encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    handleError(res, error);
  }
});

// POST /events – Cria um novo evento
app.post("/events", async (req, res) => {
  try {
    const { typeId, description, date } = req.body;
    if (!typeId || !description || !date) {
      return res.status(400).json({ message: "typeId, description e date são obrigatórios" });
    }
    // Verifica se o tipo de evento existe
    const [typeRows] = await pool.query("SELECT * FROM eventTypes WHERE id = ?", [typeId]);
    if (typeRows.length === 0) {
      return res.status(400).json({ message: "Tipo de evento inválido" });
    }
    const [result] = await pool.query(
      "INSERT INTO events (typeId, description, date) VALUES (?, ?, ?)",
      [typeId, description, date]
    );
    const newId = result.insertId;
    res.status(201).json({ id: newId, typeId, description, date });
  } catch (error) {
    handleError(res, error);
  }
});

// PUT /events/:id – Atualiza um evento existente
app.put("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { typeId, description, date } = req.body;
    if (!typeId || !description || !date) {
      return res.status(400).json({ message: "typeId, description e date são obrigatórios" });
    }
    // Verifica se o tipo de evento existe
    const [typeRows] = await pool.query("SELECT * FROM eventTypes WHERE id = ?", [typeId]);
    if (typeRows.length === 0) {
      return res.status(400).json({ message: "Tipo de evento inválido" });
    }
    const [result] = await pool.query(
      "UPDATE events SET typeId = ?, description = ?, date = ? WHERE id = ?",
      [typeId, description, date, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Evento não encontrado" });
    }
    res.json({ id: Number(id), typeId, description, date });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE /events/:id – Apaga um evento (se não houver membros inscritos)
app.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Verifica se há membros inscritos no evento
    const [memberRows] = await pool.query("SELECT * FROM memberEvents WHERE eventId = ?", [id]);
    if (memberRows.length > 0) {
      return res.status(400).json({ message: "Não pode apagar o evento, pois há membros inscritos" });
    }
    const [result] = await pool.query("DELETE FROM events WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Evento não encontrado" });
    }
    res.json({ message: "Evento apagado com sucesso" });
  } catch (error) {
    handleError(res, error);
  }
});

// ====================================================
// ROTAS PARA members
// ====================================================

// GET /members – Lista todos os membros
app.get("/members", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM members");
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

// GET /members/:id – Obtém um membro específico com suas preferências e inscrições
app.get("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [memberRows] = await pool.query("SELECT * FROM members WHERE id = ?", [id]);
    if (memberRows.length === 0) {
      return res.status(404).json({ message: "Membro não encontrado" });
    }
    const member = memberRows[0];
    // Obter os tipos de eventos preferidos do membro
    const [preferredRows] = await pool.query(`
      SELECT et.* FROM eventTypes et
      JOIN memberEventTypes met ON et.id = met.eventTypeId
      WHERE met.memberId = ?
    `, [id]);
    // Obter os eventos em que o membro está inscrito
    const [eventRows] = await pool.query(`
      SELECT e.* FROM events e
      JOIN memberEvents me ON e.id = me.eventId
      WHERE me.memberId = ?
    `, [id]);
    member.preferredEventTypes = preferredRows;
    member.registeredEvents = eventRows;
    res.json(member);
  } catch (error) {
    handleError(res, error);
  }
});

// POST /members – Cria um novo membro (opcionalmente com preferências e inscrições)
app.post("/members", async (req, res) => {
  try {
    const { name, preferredEventTypeIds, eventIds } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Nome é obrigatório" });
    }
    const [result] = await pool.query("INSERT INTO members (name) VALUES (?)", [name]);
    const newId = result.insertId;
    // Inserir preferências de tipos de evento, se fornecidos
    if (preferredEventTypeIds && Array.isArray(preferredEventTypeIds)) {
      for (const typeId of preferredEventTypeIds) {
        await pool.query("INSERT INTO memberEventTypes (memberId, eventTypeId) VALUES (?, ?)", [newId, typeId]);
      }
    }
    // Inserir inscrições em eventos, se fornecidos
    if (eventIds && Array.isArray(eventIds)) {
      for (const eventId of eventIds) {
        await pool.query("INSERT INTO memberEvents (memberId, eventId) VALUES (?, ?)", [newId, eventId]);
      }
    }
    res.status(201).json({ id: newId, name, preferredEventTypeIds, eventIds });
  } catch (error) {
    handleError(res, error);
  }
});

// PUT /members/:id – Atualiza os dados de um membro e suas relações
app.put("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, preferredEventTypeIds, eventIds } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Nome é obrigatório" });
    }
    const [result] = await pool.query("UPDATE members SET name = ? WHERE id = ?", [name, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Membro não encontrado" });
    }
    // Atualizar preferências: apaga as existentes e insere as novas
    await pool.query("DELETE FROM memberEventTypes WHERE memberId = ?", [id]);
    if (preferredEventTypeIds && Array.isArray(preferredEventTypeIds)) {
      for (const typeId of preferredEventTypeIds) {
        await pool.query("INSERT INTO memberEventTypes (memberId, eventTypeId) VALUES (?, ?)", [id, typeId]);
      }
    }
    // Atualizar inscrições: apaga as existentes e insere as novas
    await pool.query("DELETE FROM memberEvents WHERE memberId = ?", [id]);
    if (eventIds && Array.isArray(eventIds)) {
      for (const eventId of eventIds) {
        await pool.query("INSERT INTO memberEvents (memberId, eventId) VALUES (?, ?)", [id, eventId]);
      }
    }
    res.json({ id: Number(id), name, preferredEventTypeIds, eventIds });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE /members/:id – Apaga um membro (e remove suas relações)
app.delete("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Remover registros de junção primeiro
    await pool.query("DELETE FROM memberEventTypes WHERE memberId = ?", [id]);
    await pool.query("DELETE FROM memberEvents WHERE memberId = ?", [id]);
    const [result] = await pool.query("DELETE FROM members WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Membro não encontrado" });
    }
    res.json({ message: "Membro apagado com sucesso" });
  } catch (error) {
    handleError(res, error);
  }
});

// ====================================================
// ROTAS PARA atualizar relações específicas de membros
// (opcionais – para adicionar/remover preferências ou inscrições)
// ====================================================

// Adicionar preferência de tipo de evento para um membro
app.post("/members/:id/eventTypes", async (req, res) => {
  try {
    const { id } = req.params;
    const { eventTypeId } = req.body;
    if (!eventTypeId) {
      return res.status(400).json({ message: "eventTypeId é obrigatório" });
    }
    await pool.query("INSERT INTO memberEventTypes (memberId, eventTypeId) VALUES (?, ?)", [id, eventTypeId]);
    res.json({ message: "Preferência adicionada" });
  } catch (error) {
    handleError(res, error);
  }
});

// Remover uma preferência de tipo de evento de um membro
app.delete("/members/:id/eventTypes/:eventTypeId", async (req, res) => {
  try {
    const { id, eventTypeId } = req.params;
    await pool.query("DELETE FROM memberEventTypes WHERE memberId = ? AND eventTypeId = ?", [id, eventTypeId]);
    res.json({ message: "Preferência removida" });
  } catch (error) {
    handleError(res, error);
  }
});

// Adicionar inscrição em evento para um membro
app.post("/members/:id/events", async (req, res) => {
  try {
    const { id } = req.params;
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: "eventId é obrigatório" });
    }
    // Verifica se o evento existe
    const [eventRows] = await pool.query("SELECT * FROM events WHERE id = ?", [eventId]);
    if (eventRows.length === 0) {
      return res.status(400).json({ message: "Evento não encontrado" });
    }
    await pool.query("INSERT INTO memberEvents (memberId, eventId) VALUES (?, ?)", [id, eventId]);
    res.json({ message: "Inscrição adicionada" });
  } catch (error) {
    handleError(res, error);
  }
});

// Remover inscrição em evento para um membro
app.delete("/members/:id/events/:eventId", async (req, res) => {
  try {
    const { id, eventId } = req.params;
    await pool.query("DELETE FROM memberEvents WHERE memberId = ? AND eventId = ?", [id, eventId]);
    res.json({ message: "Inscrição removida" });
  } catch (error) {
    handleError(res, error);
  }
});

// ====================================================
// INICIAR O SERVIDOR
// ====================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
