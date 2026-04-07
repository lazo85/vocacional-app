const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const programas = require('../data/programas');

// POST /api/estudiantes — register student and return their semester program
router.post('/', (req, res) => {
  const { nombre, apellido, edad, colegio, area_interes, carrera_elegida } = req.body;

  if (!nombre || !apellido || !edad || !colegio || !area_interes || !carrera_elegida) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const edadNum = parseInt(edad, 10);
  if (isNaN(edadNum) || edadNum < 14 || edadNum > 15) {
    return res.status(400).json({ error: 'La edad debe ser 14 o 15 años.' });
  }

  const areasValidas = ['artísticas', 'biológicas', 'matemáticas', 'ciencias'];
  if (!areasValidas.includes(area_interes)) {
    return res.status(400).json({ error: 'Área de interés no válida.' });
  }

  const programa = programas[carrera_elegida];
  if (!programa) {
    return res.status(400).json({ error: `Carrera '${carrera_elegida}' no encontrada.` });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO estudiantes (nombre, apellido, edad, colegio, area_interes, carrera_elegida)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(nombre.trim(), apellido.trim(), edadNum, colegio.trim(), area_interes, carrera_elegida);

    res.status(201).json({
      estudiante_id: result.lastInsertRowid,
      programa
    });
  } catch (err) {
    if (err.message.includes('CHECK constraint')) {
      return res.status(400).json({ error: 'Datos inválidos. Verifica edad y área de interés.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/estudiantes/:id — retrieve a student record
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

  const estudiante = db.prepare('SELECT * FROM estudiantes WHERE id = ?').get(id);
  if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });

  res.json(estudiante);
});

module.exports = router;
