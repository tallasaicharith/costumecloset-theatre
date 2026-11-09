// PART 3 - REST ENDPOINTS (hires, with the actor name and costume name)
// PART 5 - TWIST: POST /hires/:id/return

const express = require('express');
const db = require('../db');
const { validateHire, validateId } = require('../validation');

const router = express.Router();

// Takes one hire row and adds the actor's name and the costume's name,
// by looking each one up in its own table.
function addNames(hire) {
  const actor = db.prepare('SELECT name FROM actors WHERE id = ?').get(hire.actor_id);
  const costume = db.prepare('SELECT name FROM costumes WHERE id = ?').get(hire.costume_id);
  return {
    id: hire.id,
    actor_id: hire.actor_id,
    actor_name: actor ? actor.name : null,
    costume_id: hire.costume_id,
    costume_name: costume ? costume.name : null,
    hire_date: hire.hire_date,
    due_date: hire.due_date,
    return_date: hire.return_date,
  };
}

function today() {
  return new Date().toLocaleDateString('en-CA'); // local date as YYYY-MM-DD
}

// GET /hires              -> every hire, with actor name and costume name
// GET /hires?status=out   -> only costumes not yet returned
router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM hires';
  if (status === 'out') sql += ' WHERE return_date IS NULL';
  else if (status === 'returned') sql += ' WHERE return_date IS NOT NULL';
  else if (status !== undefined) {
    return res.status(400).json({ error: 'status must be "out" or "returned"' });
  }
  const hires = db.prepare(sql + ' ORDER BY id').all();
  res.status(200).json(hires.map(addNames));
});

// GET /hires/:id
router.get('/:id', (req, res) => {
  const idError = validateId(req.params.id);
  if (idError) return res.status(400).json({ error: idError });

  const hire = db.prepare('SELECT * FROM hires WHERE id = ?').get(req.params.id);
  if (!hire) return res.status(404).json({ error: 'Hire not found' });
  res.status(200).json(addNames(hire));
});

// POST /hires  { actor_id, costume_id, due_date }
router.post('/', (req, res) => {
  const error = validateHire(req.body);
  if (error) return res.status(400).json({ error });

  const { actor_id, costume_id, due_date } = req.body;

  if (!db.prepare('SELECT id FROM actors WHERE id = ?').get(actor_id)) {
    return res.status(404).json({ error: 'Actor not found' });
  }
  if (!db.prepare('SELECT id FROM costumes WHERE id = ?').get(costume_id)) {
    return res.status(404).json({ error: 'Costume not found' });
  }
  // A costume can only be with one actor at a time
  const stillOut = db
    .prepare('SELECT id FROM hires WHERE costume_id = ? AND return_date IS NULL')
    .get(costume_id);
  if (stillOut) {
    return res.status(409).json({ error: 'Costume is already hired out' });
  }
  const hireDate = today();
  if (due_date < hireDate) {
    return res.status(400).json({ error: 'due_date cannot be in the past' });
  }

  const result = db
    .prepare('INSERT INTO hires (actor_id, costume_id, hire_date, due_date) VALUES (?, ?, ?, ?)')
    .run(actor_id, costume_id, hireDate, due_date);

  const created = db.prepare('SELECT * FROM hires WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(addNames(created));
});

// TWIST - POST /hires/:id/return
// First time: sets return_date to today -> 200
// Second time: -> 409 "Already returned"
router.post('/:id/return', (req, res) => {
  const idError = validateId(req.params.id);
  if (idError) return res.status(400).json({ error: idError });

  const hire = db.prepare('SELECT * FROM hires WHERE id = ?').get(req.params.id);
  if (!hire) return res.status(404).json({ error: 'Hire not found' });

  if (hire.return_date !== null) {
    return res.status(409).json({ error: 'Already returned' });
  }

  const returnDate = today();
  db.prepare('UPDATE hires SET return_date = ? WHERE id = ?').run(returnDate, hire.id);

  const updated = db.prepare('SELECT * FROM hires WHERE id = ?').get(hire.id);
  res.status(200).json({
    message: 'Costume returned',
    late: returnDate > hire.due_date,
    hire: addNames(updated),
  });
});

module.exports = router;
