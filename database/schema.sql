PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS estudiantes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT    NOT NULL,
    apellido         TEXT    NOT NULL,
    edad             INTEGER NOT NULL CHECK (edad BETWEEN 14 AND 15),
    colegio          TEXT    NOT NULL,
    area_interes     TEXT    NOT NULL
        CHECK (area_interes IN ('artísticas','biológicas','matemáticas','ciencias')),
    carrera_elegida  TEXT    NOT NULL,
    fecha_registro   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS evaluaciones (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id    INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    comprension      INTEGER NOT NULL CHECK (comprension  BETWEEN 1 AND 5),
    interes          INTEGER NOT NULL CHECK (interes      BETWEEN 1 AND 5),
    habilidades      INTEGER NOT NULL CHECK (habilidades  BETWEEN 1 AND 5),
    disfrute         INTEGER NOT NULL CHECK (disfrute     BETWEEN 1 AND 5),
    puntaje_total    REAL    NOT NULL,
    decision_final   TEXT    NOT NULL CHECK (decision_final IN ('continuar','explorar')),
    fecha_evaluacion TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_estudiante
    ON evaluaciones(estudiante_id);
