const express = require('express');
const path = require('path');
const { init } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/carreras',     require('./routes/carreras'));
app.use('/api/estudiantes',  require('./routes/estudiantes'));
app.use('/api/evaluaciones', require('./routes/evaluaciones'));

// SPA shell
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Initialize DB then start server
init().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  Orientación Vocacional corriendo en: http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
