"use strict";
//202200030 202200030@estudantes.ips.pt
//202200009 202200009@estudantes.ips.pt

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());
app.use(cors());

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Fp_15848154", 
  database: "estsbike_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function handleError(res, error) {
  console.error(error);
  res.status(500).json({ message: "Erro interno no servidor" });
}

//eventTypes aqui
app.get("/eventTypes", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM eventTypes");
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

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

app.post("/eventTypes", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ message: "Descrição é obrigatória" });
    }
    const [result] = await pool.query("INSERT INTO eventTypes (description) VALUES (?)", [description]);
    res.status(201).json({ id: result.insertId, description });
  } catch (error) {
    handleError(res, error);
  }
});

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

app.delete("/eventTypes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [eventRows] = await pool.query("SELECT * FROM events WHERE typeId = ?", [id]);
    if (eventRows.length > 0) {
      return res.status(400).json({
        message: "Não pode apagar o tipo pois existem eventos associados"
      });
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

//events aqui
app.get("/events", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM events");
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

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

app.post("/events", async (req, res) => {
  try {
    const { typeId, description, date } = req.body;
    if (!typeId || !description || !date) {
      return res
        .status(400)
        .json({ message: "typeId, description e date são obrigatórios" });
    }
    const [check] = await pool.query("SELECT * FROM eventTypes WHERE id = ?", [typeId]);
    if (check.length === 0) {
      return res.status(400).json({ message: "Tipo de evento inválido" });
    }
    const [result] = await pool.query(
      "INSERT INTO events (typeId, description, date) VALUES (?, ?, ?)",
      [typeId, description, date]
    );
    res.status(201).json({ id: result.insertId, typeId, description, date });
  } catch (error) {
    handleError(res, error);
  }
});

app.put("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { typeId, description, date } = req.body;
    if (!typeId || !description || !date) {
      return res
        .status(400)
        .json({ message: "typeId, description e date são obrigatórios" });
    }
    const [check] = await pool.query("SELECT * FROM eventTypes WHERE id = ?", [typeId]);
    if (check.length === 0) {
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

app.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM memberEvents WHERE eventId = ?", [id]);
    if (rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Não pode apagar o evento, pois há membros inscritos" });
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

//members aqui 
app.get("/members", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM members");
    const members = [];
    for (const row of rows) {
      const [pref] = await pool.query(
        "SELECT eventTypeId FROM memberEventTypes WHERE memberId = ?",
        [row.id]
      );
      const [evts] = await pool.query(
        "SELECT eventId FROM memberEvents WHERE memberId = ?",
        [row.id]
      );
      const preferredEventTypeIds = pref.map((p) => p.eventTypeId);
      const eventIds = evts.map((e) => e.eventId);
      members.push({
        id: row.id,
        name: row.name,
        preferredEventTypeIds,
        eventIds
      });
    }
    res.json(members);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM members WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Membro não encontrado" });
    }
    const member = rows[0];
    const [pref] = await pool.query(
      "SELECT eventTypeId FROM memberEventTypes WHERE memberId = ?",
      [id]
    );
    const [evts] = await pool.query(
      "SELECT eventId FROM memberEvents WHERE memberId = ?",
      [id]
    );
    const preferredEventTypeIds = pref.map((p) => p.eventTypeId);
    const eventIds = evts.map((e) => e.eventId);
    res.json({
      id: member.id,
      name: member.name,
      preferredEventTypeIds,
      eventIds
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/members", async (req, res) => {
  try {
    const { name, preferredEventTypeIds, eventIds } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Nome é obrigatório" });
    }
    const [result] = await pool.query("INSERT INTO members (name) VALUES (?)", [name]);
    const newId = result.insertId;
    if (preferredEventTypeIds && Array.isArray(preferredEventTypeIds)) {
      for (const typeId of preferredEventTypeIds) {
        await pool.query(
          "INSERT INTO memberEventTypes (memberId, eventTypeId) VALUES (?, ?)",
          [newId, typeId]
        );
      }
    }
    if (eventIds && Array.isArray(eventIds)) {
      for (const eventId of eventIds) {
        await pool.query(
          "INSERT INTO memberEvents (memberId, eventId) VALUES (?, ?)",
          [newId, eventId]
        );
      }
    }
    res.status(201).json({
      id: newId,
      name,
      preferredEventTypeIds,
      eventIds
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.put("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, preferredEventTypeIds, eventIds } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Nome é obrigatório" });
    }
    const [upd] = await pool.query("UPDATE members SET name = ? WHERE id = ?", [name, id]);
    if (upd.affectedRows === 0) {
      return res.status(404).json({ message: "Membro não encontrado" });
    }
    await pool.query("DELETE FROM memberEventTypes WHERE memberId = ?", [id]);
    if (preferredEventTypeIds && Array.isArray(preferredEventTypeIds)) {
      for (const typeId of preferredEventTypeIds) {
        await pool.query(
          "INSERT INTO memberEventTypes (memberId, eventTypeId) VALUES (?, ?)",
          [id, typeId]
        );
      }
    }
    await pool.query("DELETE FROM memberEvents WHERE memberId = ?", [id]);
    if (eventIds && Array.isArray(eventIds)) {
      for (const eventId of eventIds) {
        await pool.query(
          "INSERT INTO memberEvents (memberId, eventId) VALUES (?, ?)",
          [id, eventId]
        );
      }
    }
    res.json({
      id: Number(id),
      name,
      preferredEventTypeIds,
      eventIds
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM memberEventTypes WHERE memberId = ?", [id]);
    await pool.query("DELETE FROM memberEvents WHERE memberId = ?", [id]);
    const [del] = await pool.query("DELETE FROM members WHERE id = ?", [id]);
    if (del.affectedRows === 0) {
      return res.status(404).json({ message: "Membro não encontrado" });
    }
    res.json({ message: "Membro apagado com sucesso" });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/members/:id/eventTypes", async (req, res) => {
  try {
    const { id } = req.params;
    const { eventTypeId } = req.body;
    if (!eventTypeId) {
      return res.status(400).json({ message: "eventTypeId é obrigatório" });
    }
    await pool.query(
      "INSERT INTO memberEventTypes (memberId, eventTypeId) VALUES (?, ?)",
      [id, eventTypeId]
    );
    res.json({ message: "Preferência adicionada" });
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/members/:id/eventTypes/:eventTypeId", async (req, res) => {
  try {
    const { id, eventTypeId } = req.params;
    await pool.query(
      "DELETE FROM memberEventTypes WHERE memberId = ? AND eventTypeId = ?",
      [id, eventTypeId]
    );
    res.json({ message: "Preferência removida" });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/members/:id/events", async (req, res) => {
  try {
    const { id } = req.params;
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: "eventId é obrigatório" });
    }
    const [checkEvt] = await pool.query("SELECT * FROM events WHERE id = ?", [eventId]);
    if (checkEvt.length === 0) {
      return res.status(400).json({ message: "Evento não encontrado" });
    }
    await pool.query("INSERT INTO memberEvents (memberId, eventId) VALUES (?, ?)", [id, eventId]);
    res.json({ message: "Inscrição adicionada" });
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/members/:id/events/:eventId", async (req, res) => {
  try {
    const { id, eventId } = req.params;
    await pool.query(
      "DELETE FROM memberEvents WHERE memberId = ? AND eventId = ?",
      [id, eventId]
    );
    res.json({ message: "Inscrição removida" });
  } catch (error) {
    handleError(res, error);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Servidor a rodar na porta 3000");
});
