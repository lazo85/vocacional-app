/* ────────────────────────────────────────────────────────────────
   Orientación Vocacional — Single-page app controller
──────────────────────────────────────────────────────────────── */

// ── State ─────────────────────────────────────────────────────
const state = {
  areas: {},
  selectedArea: null,
  selectedCarrera: null,
  estudianteId: null,
  ratings: { comprension: 0, interes: 0, habilidades: 0, disfrute: 0 }
};

// ── DOM refs ──────────────────────────────────────────────────
const screens = {
  form:       document.getElementById('screen-form'),
  programa:   document.getElementById('screen-programa'),
  evaluacion: document.getElementById('screen-evaluacion')
};
const progressBar = document.getElementById('progressBar');

// ── Utilities ─────────────────────────────────────────────────
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.style.opacity = '1';
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.classList.add('hidden'), 350);
  }, duration);
}

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[name].classList.remove('hidden');
  screens[name].classList.add('screen');  // re-trigger animation
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const pct = { form: 33, programa: 66, evaluacion: 100 };
  progressBar.style.width = pct[name] + '%';
}

// ── Load career areas ─────────────────────────────────────────
async function loadAreas() {
  const res = await fetch('/api/carreras');
  state.areas = await res.json();
  renderAreaGrid();
}

function renderAreaGrid() {
  const grid = document.getElementById('areaGrid');
  grid.innerHTML = '';
  Object.entries(state.areas).forEach(([key, area]) => {
    const card = document.createElement('div');
    card.className = 'area-card';
    card.dataset.key = key;
    card.innerHTML = `
      <div class="area-icon">${area.icono}</div>
      <div class="area-name">${area.label}</div>
      <div class="area-desc">${area.descripcion}</div>
    `;
    card.addEventListener('click', () => selectArea(key));
    grid.appendChild(card);
  });
}

function selectArea(key) {
  state.selectedArea = key;
  state.selectedCarrera = null;

  // Update area cards
  document.querySelectorAll('.area-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.key === key);
  });

  // Show career pills
  const area = state.areas[key];
  const section = document.getElementById('carrerasSection');
  const label   = document.getElementById('carrerasLabel');
  const pills   = document.getElementById('carreraPills');

  label.textContent = `Carreras ${area.label.toLowerCase()}:`;
  pills.innerHTML   = '';

  area.carreras.forEach(c => {
    const pill = document.createElement('div');
    pill.className = 'carrera-pill';
    pill.dataset.slug = c.slug;
    pill.innerHTML = `<span>${c.icono}</span><span>${c.label}</span>`;
    pill.addEventListener('click', () => selectCarrera(c.slug));
    pills.appendChild(pill);
  });

  section.classList.remove('hidden');
  updateSubmitBtn();
}

function selectCarrera(slug) {
  state.selectedCarrera = slug;
  document.querySelectorAll('.carrera-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.slug === slug);
  });
  updateSubmitBtn();
}

// ── Form validation ───────────────────────────────────────────
function validateField(id, check) {
  const fg = document.getElementById('fg-' + id);
  const valid = check();
  if (fg) fg.classList.toggle('error', !valid);
  return valid;
}

function updateSubmitBtn() {
  const nombre    = document.getElementById('nombre').value.trim();
  const apellido  = document.getElementById('apellido').value.trim();
  const edad      = document.getElementById('edad').value;
  const colegio   = document.getElementById('colegio').value.trim();
  const ready     = nombre && apellido && edad && colegio && state.selectedArea && state.selectedCarrera;
  document.getElementById('btnEmpezar').disabled = !ready;
}

['nombre','apellido','colegio'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateSubmitBtn);
});
document.getElementById('edad').addEventListener('change', updateSubmitBtn);

// ── Submit form ───────────────────────────────────────────────
document.getElementById('btnEmpezar').addEventListener('click', async () => {
  const nombre   = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const edad     = document.getElementById('edad').value;
  const colegio  = document.getElementById('colegio').value.trim();

  let valid = true;
  valid = validateField('nombre',   () => !!nombre)   && valid;
  valid = validateField('apellido', () => !!apellido) && valid;
  valid = validateField('edad',     () => !!edad)     && valid;
  valid = validateField('colegio',  () => !!colegio)  && valid;

  if (!state.selectedArea || !state.selectedCarrera) {
    document.getElementById('fg-area').querySelector('.error-msg').style.display = 'block';
    valid = false;
  } else {
    document.getElementById('fg-area').querySelector('.error-msg').style.display = 'none';
  }

  if (!valid) return;

  const btn = document.getElementById('btnEmpezar');
  btn.innerHTML = '<div class="spinner"></div>';
  btn.disabled = true;

  try {
    const res = await fetch('/api/estudiantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre, apellido, edad: parseInt(edad, 10), colegio,
        area_interes: state.selectedArea,
        carrera_elegida: state.selectedCarrera
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast('Error: ' + data.error);
      btn.innerHTML = '¡Empezar mi programa! →';
      btn.disabled = false;
      return;
    }

    state.estudianteId = data.estudiante_id;
    sessionStorage.setItem('estudianteId', data.estudiante_id);
    renderPrograma(data.programa);
    showScreen('programa');
  } catch {
    showToast('Error de conexión. Intenta de nuevo.');
    btn.innerHTML = '¡Empezar mi programa! →';
    btn.disabled = false;
  }
});

// ── Render semester program ───────────────────────────────────
function renderPrograma(programa) {
  document.getElementById('programaTitle').textContent = `Tu programa de ${programa.titulo}`;
  document.getElementById('programaSubtitle').textContent = `${programa.area.charAt(0).toUpperCase() + programa.area.slice(1)} · 16 semanas · 8 módulos`;
  document.getElementById('problemaTexto').textContent = programa.problema_central;

  const list = document.getElementById('moduloList');
  list.innerHTML = '';

  programa.modulos.forEach(mod => {
    const item = document.createElement('div');
    item.className = 'modulo-item';
    item.innerHTML = `
      <div class="modulo-header">
        <div class="modulo-num">${mod.numero}</div>
        <div class="modulo-header-text">
          <div class="modulo-semanas">Semanas ${mod.semanas}</div>
          <div class="modulo-titulo">${mod.titulo}</div>
        </div>
        <span class="modulo-chevron">▼</span>
      </div>
      <div class="modulo-body">
        <p class="modulo-desc">${mod.descripcion}</p>
        <div class="modulo-actividades-label">Actividades</div>
        <ul class="modulo-actividades">
          ${mod.actividades.map(a => `<li>${a}</li>`).join('')}
        </ul>
        <div class="reto-box">
          <div class="reto-label">🔥 Reto bisemanal</div>
          <p>${mod.reto_semanal}</p>
        </div>
      </div>
    `;
    item.querySelector('.modulo-header').addEventListener('click', () => {
      item.classList.toggle('open');
    });
    list.appendChild(item);
  });
}

// ── Go to evaluation ──────────────────────────────────────────
document.getElementById('btnEvaluar').addEventListener('click', () => {
  renderEvalCards();
  showScreen('evaluacion');
});

// ── Evaluation cards ──────────────────────────────────────────
const EVAL_DIMENSIONS = [
  {
    key: 'comprension',
    title: 'Comprensión del campo profesional',
    desc: '¿Cuánto entendiste de lo que hacen los profesionales en esta carrera?'
  },
  {
    key: 'interes',
    title: 'Interés sostenido',
    desc: '¿Mantuviste las ganas de hacer las actividades durante todo el programa?'
  },
  {
    key: 'habilidades',
    title: 'Habilidades demostradas',
    desc: '¿Sientes que desarrollaste habilidades nuevas relacionadas con esta carrera?'
  },
  {
    key: 'disfrute',
    title: 'Disfrute del proceso',
    desc: '¿Te divertiste y disfrutaste el proceso de aprendizaje?'
  }
];

const STAR_LABELS = ['', 'Muy poco', 'Algo', 'Regular', 'Bastante', '¡Muchísimo!'];

function renderEvalCards() {
  const container = document.getElementById('evalCards');
  container.innerHTML = '';
  state.ratings = { comprension: 0, interes: 0, habilidades: 0, disfrute: 0 };

  EVAL_DIMENSIONS.forEach(dim => {
    const card = document.createElement('div');
    card.className = 'eval-card';
    card.id = 'eval-' + dim.key;
    card.innerHTML = `
      <div class="eval-card-title">${dim.title}</div>
      <div class="eval-card-desc">${dim.desc}</div>
      <div class="stars" id="stars-${dim.key}">
        ${[1,2,3,4,5].map(n => `<span class="star" data-val="${n}">★</span>`).join('')}
      </div>
      <div class="star-label" id="label-${dim.key}">Toca para calificar</div>
    `;
    container.appendChild(card);

    // Attach star events
    const starsEl = card.querySelectorAll('.star');
    starsEl.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val, 10);
        state.ratings[dim.key] = val;
        starsEl.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val, 10) <= val));
        const labelEl = document.getElementById('label-' + dim.key);
        labelEl.textContent = STAR_LABELS[val];
        labelEl.classList.add('visible');
        card.classList.add('rated');
        checkEvalReady();
      });
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.val, 10);
        starsEl.forEach(s => s.style.color = parseInt(s.dataset.val, 10) <= val ? 'var(--warning)' : '');
      });
      star.addEventListener('mouseleave', () => {
        const cur = state.ratings[dim.key];
        starsEl.forEach(s => {
          s.style.color = '';
          s.classList.toggle('active', parseInt(s.dataset.val, 10) <= cur);
        });
      });
    });
  });
}

function checkEvalReady() {
  const allRated = Object.values(state.ratings).every(v => v > 0);
  document.getElementById('btnSubmitEval').disabled = !allRated;
}

// ── Submit evaluation ─────────────────────────────────────────
document.getElementById('btnSubmitEval').addEventListener('click', async () => {
  const btn = document.getElementById('btnSubmitEval');
  btn.innerHTML = '<div class="spinner"></div>';
  btn.disabled = true;

  const estudianteId = state.estudianteId || parseInt(sessionStorage.getItem('estudianteId'), 10);

  try {
    const res = await fetch('/api/evaluaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estudiante_id: estudianteId,
        ...state.ratings
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast('Error: ' + data.error);
      btn.innerHTML = 'Ver mi resultado →';
      btn.disabled = false;
      return;
    }

    renderResult(data);
  } catch {
    showToast('Error de conexión. Intenta de nuevo.');
    btn.innerHTML = 'Ver mi resultado →';
    btn.disabled = false;
  }
});

// ── Render result ─────────────────────────────────────────────
function renderResult(data) {
  document.getElementById('evalForm').classList.add('hidden');
  document.getElementById('evalResult').classList.remove('hidden');

  const isContinuar = data.decision_final === 'continuar';
  document.getElementById('resultEmoji').textContent  = isContinuar ? '🚀' : '🧭';
  document.getElementById('resultScore').textContent  = data.puntaje_total;
  document.getElementById('resultDecision').textContent = isContinuar ? '¡Este camino es para ti!' : '¡Tu aventura continúa!';
  document.getElementById('resultDecision').className = `result-decision ${data.decision_final}`;
  document.getElementById('resultMessage').textContent = data.mensaje;

  // Dimension bars
  const barsEl = document.getElementById('dimensionBars');
  barsEl.innerHTML = '';
  const labels = { comprension: 'Comprensión', interes: 'Interés', habilidades: 'Habilidades', disfrute: 'Disfrute' };
  Object.entries(data.desglose).forEach(([key, val]) => {
    const pct = (val / 5) * 100;
    barsEl.innerHTML += `
      <div class="dim-row">
        <div class="dim-label">${labels[key]}</div>
        <div class="dim-bar-outer">
          <div class="dim-bar-inner" style="width:0%" data-target="${pct}"></div>
        </div>
        <div class="dim-val">${val}/5</div>
      </div>
    `;
  });

  // Animate bars after a tick
  requestAnimationFrame(() => {
    setTimeout(() => {
      barsEl.querySelectorAll('.dim-bar-inner').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 200);
  });

  // Confetti for good score
  if (isContinuar) launchConfetti();
}

// ── Confetti ──────────────────────────────────────────────────
function launchConfetti() {
  const colors = ['#5C4EFF','#FF6B6B','#22c55e','#f59e0b','#06b6d4','#ec4899'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left     = Math.random() * 100 + 'vw';
      piece.style.top      = '-20px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.transform  = `rotate(${Math.random() * 360}deg)`;
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.animationDelay    = Math.random() * .5 + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4500);
    }, i * 30);
  }
}

// ── Restart ───────────────────────────────────────────────────
document.getElementById('btnReiniciar').addEventListener('click', () => {
  // Reset state
  state.selectedArea = null;
  state.selectedCarrera = null;
  state.estudianteId = null;
  state.ratings = { comprension: 0, interes: 0, habilidades: 0, disfrute: 0 };
  sessionStorage.removeItem('estudianteId');

  // Reset form
  ['nombre','apellido','colegio'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('edad').value = '';
  document.querySelectorAll('.area-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.carrera-pill').forEach(p => p.classList.remove('selected'));
  document.getElementById('carrerasSection').classList.add('hidden');
  document.getElementById('btnEmpezar').disabled = true;

  // Reset eval
  document.getElementById('evalForm').classList.remove('hidden');
  document.getElementById('evalResult').classList.add('hidden');

  showScreen('form');
});

// ── Init ──────────────────────────────────────────────────────
loadAreas();
