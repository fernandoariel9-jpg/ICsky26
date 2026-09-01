-- ============================================================
-- RIC44 - REGISTRO DE OBSOLESCENCIA DE EQUIPOS
-- ============================================================

CREATE TABLE IF NOT EXISTS ric44 (
    id BIGSERIAL PRIMARY KEY,

    -- Relación con el equipo y, si corresponde, con la tarea RIC01
    equipo_id BIGINT,
    ric01_id BIGINT,

    -- Identificación del equipo
    numero_serie TEXT NOT NULL,
    descripcion TEXT,
    marca_modelo TEXT,
    area TEXT,
    servicio TEXT,
    sub_servicio TEXT,
    encargado TEXT,
    tecnico TEXT,

    -- Evaluación de obsolescencia
    criterio TEXT NOT NULL,
    ampliar_seleccion TEXT,
    disposicion_final TEXT,

    -- Imagen del equipo en base64/data URL
    imagen TEXT,

    -- Observaciones
    observaciones TEXT,

    -- Estadísticas calculadas al momento del registro
    correctivos INTEGER NOT NULL DEFAULT 0,
    preventivos INTEGER NOT NULL DEFAULT 0,
    dias_fuera_servicio INTEGER NOT NULL DEFAULT 0,
    equipos_similares INTEGER NOT NULL DEFAULT 0,

    -- Auditoría
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ric44_numero_serie
    ON ric44 (numero_serie);

CREATE INDEX IF NOT EXISTS idx_ric44_equipo_id
    ON ric44 (equipo_id);

CREATE INDEX IF NOT EXISTS idx_ric44_fecha_registro
    ON ric44 (fecha_registro DESC);

CREATE INDEX IF NOT EXISTS idx_ric44_ubicacion
    ON ric44 (area, servicio, sub_servicio);

-- ============================================================
-- Criterios válidos de RIC44
-- ============================================================

ALTER TABLE ric44
DROP CONSTRAINT IF EXISTS ric44_criterio_check;

ALTER TABLE ric44
ADD CONSTRAINT ric44_criterio_check
CHECK (
    criterio IN (
        'Criterio de fábrica',
        'Falta de repuestos originales, soporte tecnico o no existen repuestos alternativos',
        'Mayor a 10 años de uso - Análisis de riesgo (RIESGO ALTO)',
        'Mayor a 10 años de uso - Análisis de tecnologías superiores que justifiquen el recambio',
        'Mayor a 10 años de uso - Análisis y sugerencia del usuario del equipamiento',
        'Mayor a 10 años de uso - Verificación funcional y seguridad eléctrica NO SUPERADA',
        'Mayor a 20 años de uso'
    )
);
