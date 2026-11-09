// PART 3 - REST ENDPOINTS (full CRUD for costumes)
// PART 4 - search by query parameter (?era=Victorian or ?name=gown)

const express = require('express');
const db = require('../db');
const { validateCostume, validateId } = require('../validation');

const router = express.Router();

// GET /costumes            -> all costumes
// GET /costumes?era=Roman  -> costumes from that era (case-insensitive)
// GET /costumes?name=gown  -> costumes whose name contains "gown"
router.get('/', (req, res) => {
  const { era, name } = req.query;
  let sql = 'SELECT * FROM costumes WHERE 1=1';
  const params = [];

  if (era !== undefined) {
    sql += ' AND LOWER(era) = LOWER(?)';
    params.push(era);
  }
  if (name !== undefined) {
    sql += ' AND LOWER(name) LIKE LOWER(?)';
    params.push(`%${name}%`);
  }

  res.status(200).json(db.prepare(sql).all(...params));
});

// GET /costumes/:id
router.get('/:id', (req, res) => {
  const idError = validateId(req.params.id);
  if (idError) return res.status(400).json({ error: idError });

  const costume = db.prepare('SELECT * FROM costumes WHERE id = ?').get(req.params.id);
  if (!costume) return res.status(404).json({ error: 'Costume not found' });
  res.status(200).json(costume);
});

// POST /costumes
router.post('/', (req, res) => {
  const error = validateCostume(req.body);
  if (error) return res.status(400).json({ error });

  const { name, era, size = null } = req.body;
  const result = db
    .prepare('INSERT INTO costumes (name, era, size) VALUES (?, ?, ?)')
    .run(name.trim(), era.trim(), size);

  const created = db.prepare('SELECT * FROM costumes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /costumes/:id
router.put('/:id', (req, res) => {
  const idError = validateId(req.params.id);
  if (idError) return res.status(400).json({ error: idError });

  const error = validateCostume(req.body);
  if (error) return res.status(400).json({ error });

  const { name, era, size = null } = req.body;
  const result = db
    .prepare('UPDATE costumes SET name = ?, era = ?, size = ? WHERE id = ?')
    .run(name.trim(), era.trim(), size, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Costume not found' });
  res.status(200).json(db.prepare('SELECT * FROM costumes WHERE id = ?').get(req.params.id));
});

// DELETE /costumes/:id
router.delete('/:id', (req, res) => {
  const idError = validateId(req.params.id);
  if (idError) return res.status(400).json({ error: idError });

  const costume = db.prepare('SELECT * FROM costumes WHERE id = ?').get(req.params.id);
  if (!costume) return res.status(404).json({ error: 'Costume not found' });

  // A costume with hire records cannot be deleted, otherwise the history is lost
  const used = db.prepare('SELECT COUNT(*) AS n FROM hires WHERE costume_id = ?').get(req.params.id).n;
  if (used > 0) {
    return res.status(409).json({ error: 'Costume has hire records and cannot be deleted' });
  }

  db.prepare('DELETE FROM costumes WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
