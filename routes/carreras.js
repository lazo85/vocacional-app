const express = require('express');
const router = express.Router();
const programas = require('../data/programas');

const AREAS = {
  artísticas: {
    label: 'Artísticas',
    descripcion: 'Diseño, expresión visual, música y comunicación creativa',
    icono: '🎨',
    carreras: [
      { slug: 'diseño-gráfico',              label: 'Diseño Gráfico',               icono: '🎨' },
      { slug: 'arquitectura',                 label: 'Arquitectura',                  icono: '🏛️' },
      { slug: 'música',                       label: 'Música',                        icono: '🎵' },
      { slug: 'arte-y-fotografía',            label: 'Arte y Fotografía',             icono: '📷' },
      { slug: 'cine-y-producción-audiovisual',label: 'Cine y Producción Audiovisual', icono: '🎬' }
    ]
  },
  biológicas: {
    label: 'Biológicas',
    descripcion: 'Salud humana, animal y estudio de los seres vivos',
    icono: '🔬',
    carreras: [
      { slug: 'medicina',    label: 'Medicina',    icono: '🩺' },
      { slug: 'biología',    label: 'Biología',    icono: '🔬' },
      { slug: 'veterinaria', label: 'Veterinaria', icono: '🐾' },
      { slug: 'odontología', label: 'Odontología', icono: '🦷' },
      { slug: 'psicología',  label: 'Psicología',  icono: '🧠' }
    ]
  },
  matemáticas: {
    label: 'Matemáticas',
    descripcion: 'Ingeniería, análisis de datos y modelado cuantitativo',
    icono: '📐',
    carreras: [
      { slug: 'ingeniería-civil',          label: 'Ingeniería Civil',          icono: '🏗️' },
      { slug: 'ingeniería-de-sistemas',    label: 'Ingeniería de Sistemas',    icono: '💻' },
      { slug: 'estadística',               label: 'Estadística',               icono: '📊' },
      { slug: 'economía',                  label: 'Economía',                  icono: '📈' },
      { slug: 'física',                    label: 'Física',                    icono: '⚡' }
    ]
  },
  ciencias: {
    label: 'Ciencias',
    descripcion: 'Investigación del mundo natural, materiales y tecnología',
    icono: '🧪',
    carreras: [
      { slug: 'química',               label: 'Química',               icono: '🧪' },
      { slug: 'astronomía',            label: 'Astronomía',            icono: '🔭' },
      { slug: 'geología',              label: 'Geología',              icono: '🪨' },
      { slug: 'ciencias-ambientales',  label: 'Ciencias Ambientales',  icono: '🌿' },
      { slug: 'biotecnología',         label: 'Biotecnología',         icono: '🧬' }
    ]
  }
};

router.get('/', (req, res) => {
  res.json(AREAS);
});

module.exports = router;
