# CostumeCloset Theatre – Costume Hire API

**BDF Group Assignment · PD-AIDE2C-G08 · Theme 8: Costume hire**

> "We hire out costumes before every show. We lose track of which costume is with which actor, and returns come back late. Please build us a system that fixes this."

This API keeps track of **which costume is with which actor**, stops a costume being hired twice at once, records **return dates**, and flags **late returns**.

Built with **Node.js**, **Express** and **SQLite** (`better-sqlite3`).

---

## How to run

You need Node.js 18 or newer.

```bash
npm install        # install Express and SQLite
npm run reset      # (optional) delete the database so it starts fresh with starter data
npm start          # starts on http://localhost:3000
```

The database file `costumecloset.db` is created automatically on first start, with 3 actors, 5 costumes and 3 hires.

### Run the Postman tests

1. `npm run reset` then `npm start`
2. In Postman: **Import** → `CostumeCloset.postman_collection.json`
3. Click the collection → **Run** → run all folders in order

Or from the terminal (server must be running):

```bash
npx newman run CostumeCloset.postman_collection.json
```

Expected result: **27 requests, 42 assertions, 0 failed**.

---

## Database (3 related tables)

| Table | Columns |
|---|---|
| `actors` | id, name, email (unique) |
| `costumes` | id, name, era, size |
| `hires` | id, **actor_id → actors.id**, **costume_id → costumes.id**, hire_date, due_date, return_date (NULL = still out) |

Foreign keys are switched on, so a hire must point to a real actor and costume.

---

## Endpoints

### Costumes (full CRUD + search)

| Method | Route | Success | Errors |
|---|---|---|---|
| GET | `/costumes` | 200 | |
| GET | `/costumes?era=Victorian` | 200 – search by era (case-insensitive) | |
| GET | `/costumes?name=gown` | 200 – search by part of name | |
| GET | `/costumes/:id` | 200 | 400 bad id, 404 not found |
| POST | `/costumes` | 201 | 400 validation |
| PUT | `/costumes/:id` | 200 | 400 validation, 404 not found |
| DELETE | `/costumes/:id` | 204 | 404 not found, 409 has hire records |

Body for POST / PUT:

```json
{ "name": "Ball Gown", "era": "Victorian", "size": "M" }
```

`name` and `era` are required non-empty text. `size` is optional: XS, S, M, L or XL.

### Actors

| Method | Route | Success | Errors |
|---|---|---|---|
| GET | `/actors` | 200 | |
| GET | `/actors/:id` | 200 | 400, 404 |
| POST | `/actors` | 201 | 400 validation, 409 email taken |
| GET | `/actors/:id/history` | 200 – **twist** | 400, 404 |

### Hires (with actor name and costume name)

| Method | Route | Success | Errors |
|---|---|---|---|
| GET | `/hires` | 200 – each hire **with actor_name and costume_name** | |
| GET | `/hires?status=out` | 200 – costumes not yet returned | 400 bad status |
| GET | `/hires/:id` | 200 | 400, 404 |
| POST | `/hires` | 201 | 400 validation, 404 actor/costume missing, 409 costume already out |
| POST | `/hires/:id/return` | 200 – **twist** | 404, **409 "Already returned"** |

Body for POST `/hires`:

```json
{ "actor_id": 3, "costume_id": 5, "due_date": "2026-12-01" }
```

### Error format

Every error comes back as JSON with a clear message:

```json
{ "error": "name is required and must be a non-empty string" }
```

---

## Our twist: Return flow

| Test | Request | Expected | Result |
|---|---|---|---|
| 1 | `POST /hires/1/return` | **200**, return date set | ✅ |
| 2 | `POST /hires/1/return` again | **409** `{ "error": "Already returned" }` | ✅ |
| 3 | `GET /actors/1/history` | **200**, hire 1 is listed | ✅ |

The return response also says `"late": true/false` by comparing the return date with the due date, and the history shows `was_late` for each hire, which answers the client's "returns come back late" problem.

---

## Project structure

```
src/
  server.js          Part 1 – Express setup, routes, 404 and error handler
  db.js              Part 2 – SQLite tables and starter data
  routes/
    costumes.js      Part 3 – costume CRUD  (+ Part 4 search)
    actors.js        Part 3 – actors        (+ Part 5 history)
    hires.js         Part 3 – hires         (+ Part 5 return)
  validation.js      Part 4 – input checks and messages
CostumeCloset.postman_collection.json   Part 6
README.md                               Part 6
```

## Team

| Member | Part(s) |
|---|---|
| _Name_ | 1 – Server and routes |
| _Name_ | 2 – Database |
| _Name_ | 3 – REST endpoints |
| _Name_ | 4 – Validation and search |
| _Name_ | 5 – Twist rule **and** 6 – Postman and README |
