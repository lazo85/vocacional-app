const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const programas = require('../data/programas');

// POST /api/evaluaciones — save evaluation and return result
router.post('/', (req, res) => {
  const { estudiante_id, comprension, interes, habilidades, disfrute } = req.body;

  // Validate all fields present
  if (!estudiante_id || comprension == null || interes == null || habilidades == null || disfrute == null) {
    return res.status(400).json({ error: 'Todos los campos de evaluación son obligatorios.' });
  }

  const campos = { comprension, interes, habilidades, disfrute };
  for (const [key, val] of Object.entries(campos)) {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1 || n > 5) {
      return res.status(400).json({ error: `El campo '${key}' debe ser un número entre 1 y 5.` });
    }
    campos[key] = n;
  }

  // Verify student exists
  const estudiante = db.prepare('SELECT * FROM estudiantes WHERE id = ?').get(parseInt(estudiante_id, 10));
  if (!estudiante) {
    return res.status(404).json({ error: 'Estudiante no encontrado.' });
  }

  // Check if evaluation already exists for this student
  const existing = db.prepare('SELECT id FROM evaluaciones WHERE estudiante_id = ?').get(parseInt(estudiante_id, 10));
  if (existing) {
    return res.status(409).json({ error: 'Ya existe una evaluación para este estudiante.' });
  }

  // Calculate score
  const suma = campos.comprension + campos.interes + campos.habilidades + campos.disfrute;
  const puntaje_total = (suma / 20) * 100;
  const decision_final = puntaje_total >= 65 ? 'continuar' : 'explorar';

  try {
    const stmt = db.prepare(`
      INSERT INTO evaluaciones (estudiante_id, comprension, interes, habilidades, disfrute, puntaje_total, decision_final)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      parseInt(estudiante_id, 10),
      campos.comprension, campos.interes, campos.habilidades, campos.disfrute,
      puntaje_total, decision_final
    );

    const programa = programas[estudiante.carrera_elegida];
    const carreraTitulo = programa ? programa.titulo : estudiante.carrera_elegida;

    const mensajes = {
      continuar: `¡Este camino es para ti, ${estudiante.nombre}! Tienes las bases para brillar en ${carreraTitulo}. ¡Sigue explorando y aprendiendo!`,
      explorar: `¡Tu aventura continúa, ${estudiante.nombre}! Aprendiste mucho sobre ${carreraTitulo}. Ahora estás mejor preparado para descubrir qué carrera es perfecta para ti.`
    };

    res.status(201).json({
      puntaje_total: Math.round(puntaje_total * 10) / 10,
      decision_final,
      mensaje: mensajes[decision_final],
      carrera: carreraTitulo,
      desglose: {
        comprension: campos.comprension,
        interes: campos.interes,
        habilidades: campos.habilidades,
        disfrute: campos.disfrute
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/evaluaciones/:estudiante_id — retrieve evaluation for a student
router.get('/:estudiante_id', (req, res) => {
  const id = parseInt(req.params.estudiante_id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

  const evaluacion = db.prepare('SELECT * FROM evaluaciones WHERE estudiante_id = ?').get(id);
  if (!evaluacion) return res.status(404).json({ error: 'Evaluación no encontrada.' });

  res.json(evaluacion);
});

module.exports = router;
