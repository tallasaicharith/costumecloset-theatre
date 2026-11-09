// PART 3 - REST ENDPOINTS (actors)
// PART 5 - TWIST: GET /actors/:id/history

const express = require('express');
const db = require('../db');
const { validateActor, validateId } = require('../validation');

const router = express.Router();

// GET /actors
router.get('/', (req, res) => {
  res.status(200).json(db.prepare('SELECT * FROM actors').all());
});

// GET /actors/:id
router.get('/:id', (req, res) => {
  const idError = validateId(req.params.id);
  if (idError) return res.status(400).json({ error: idError });

  const actor = db.prepare('SELECT * FROM actors WHERE id = ?').get(req.params.id);
  if (!actor) return res.status(404).json({ error: 'Actor not found' });
  res.status(200).json(actor);
});

// POST /actors
router.post('/', (req, res) => {
  const error = validateActor(req.body);
  if (error) return res.status(400).json({ error });

  const { name, email = null } = req.body;
  try {
    const result = db.prepare('INSERT INTO actors (name, email) VALUES (?, ?)').run(name.trim(), email);
    res.status(201).json(db.prepare('SELECT * FROM actors WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'An actor with that email already exists' });
    }
    throw err;
  }
});

// TWIST - GET /actors/:id/history
// Lists only the hires this actor has RETURNED, newest return first.
router.get('/:id/history', (req, res) => {
  const idError = validateId(req.params.id);
  if (idError) return res.status(400).json({ error: idError });

  const actor = db.prepare('SELECT * FROM actors WHERE id = ?').get(req.params.id);
  if (!actor) return res.status(404).json({ error: 'Actor not found' });

  // 1. Get this actor's hires that have a return date
  const returned = db
    .prepare(
      `SELECT * FROM hires
        WHERE actor_id = ? AND return_date IS NOT NULL
        ORDER BY return_date DESC`
    )
    .all(req.params.id);

  // 2. For each one, look up the costume name and work out if it came back late
  const history = returned.map((hire) => {
    const costume = db.prepare('SELECT name, era FROM costumes WHERE id = ?').get(hire.costume_id);
    return {
      hire_id: hire.id,
      costume_name: costume ? costume.name : null,
      era: costume ? costume.era : null,
      hire_date: hire.hire_date,
      due_date: hire.due_date,
      return_date: hire.return_date,
      was_late: hire.return_date > hire.due_date,
    };
  });

  res.status(200).json({ actor_id: actor.id, actor_name: actor.name, returned_hires: history });
});

module.exports = router;
