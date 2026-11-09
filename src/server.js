// PART 1 - SERVER AND ROUTES
// Sets up Express, connects the routers, and handles 404s and server errors.

const express = require('express');
const actorsRouter = require('./routes/actors');
const costumesRouter = require('./routes/costumes');
const hiresRouter = require('./routes/hires');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'CostumeCloset Theatre API',
    endpoints: ['/actors', '/costumes', '/hires'],
  });
});

app.use('/actors', actorsRouter);
app.use('/costumes', costumesRouter);
app.use('/hires', hiresRouter);

// Any route not matched above
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Error handler: bad JSON gets 400, anything unexpected gets 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`CostumeCloset API running on http://localhost:${PORT}`));
}

module.exports = app;
