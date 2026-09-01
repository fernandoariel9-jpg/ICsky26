// backend/controllers/ric44controller.js

const CRITERIOS_RIC44 = [
  "Criterio de fábrica",
  "Falta de repuestos originales, soporte tecnico o no existen repuestos alternativos",
  "Mayor a 10 años de uso - Análisis de riesgo (RIESGO ALTO)",
  "Mayor a 10 años de uso - Análisis de tecnologías superiores que justifiquen el recambio",
  "Mayor a 10 años de uso - Análisis y sugerencia del usuario del equipamiento",
  "Mayor a 10 años de uso - Verificación funcional y seguridad eléctrica NO SUPERADA",
  "Mayor a 20 años de uso"
];

const texto = (valor) => (valor == null ? "" : String(valor).trim());

async function obtenerEstadisticasEquipo(pool, req, res) {
  try {
    const numeroSerie = texto(req.params.numeroSerie);
    if (!numeroSerie) {
      return res.status(400).json({ ok: false, error: "Falta el número de serie." });
    }

    const { rows } = await pool.query(`
      WITH equipo AS (
        SELECT id, descripcion, servicio, sub_servicio, numero_serie
        FROM equipos
        WHERE numero_serie::text = $1
        LIMIT 1
      )
      SELECT
        e.id,
        e.numero_serie,
        e.descripcion,
        e.servicio,
        e.sub_servicio,
        (
          SELECT COUNT(*)::integer
          FROM ric01 r
          WHERE r.numero_serie::text = e.numero_serie::text
            AND LOWER(COALESCE(r.tipo_mantenimiento, '')) LIKE '%correct%'
        ) AS correctivos,
        (
          SELECT COUNT(*)::integer
          FROM ric01 r
          WHERE r.numero_serie::text = e.numero_serie::text
            AND LOWER(COALESCE(r.tipo_mantenimiento, '')) LIKE '%prevent%'
        ) AS preventivos,
        (
          SELECT COALESCE(SUM(
            CASE
              WHEN r.fecha IS NOT NULL
               AND r.fecha_fin IS NOT NULL
               AND r.fecha_fin >= r.fecha
              THEN CEIL(EXTRACT(EPOCH FROM (r.fecha_fin - r.fecha)) / 86400.0)
              ELSE 0
            END
          ), 0)::integer
          FROM ric01 r
          WHERE r.numero_serie::text = e.numero_serie::text
        ) AS dias_fuera_servicio,
        (
          SELECT COUNT(*)::integer
          FROM equipos e2
          WHERE LOWER(TRIM(COALESCE(e2.descripcion, ''))) = LOWER(TRIM(COALESCE(e.descripcion, '')))
            AND LOWER(TRIM(COALESCE(e2.servicio, ''))) = LOWER(TRIM(COALESCE(e.servicio, '')))
            AND LOWER(TRIM(COALESCE(e2.sub_servicio, ''))) = LOWER(TRIM(COALESCE(e.sub_servicio, '')))
            AND e2.id <> e.id
        ) AS equipos_similares
      FROM equipo e;
    `, [numeroSerie]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Equipo no encontrado." });
    }

    return res.json({ ok: true, estadisticas: rows[0] });
  } catch (error) {
    console.error("Error estadísticas RIC44:", error);
    return res.status(500).json({ ok: false, error: "Error al obtener estadísticas del equipo." });
  }
}

async function crearRic44(pool, req, res) {
  try {
    const {
      equipo_id,
      ric01_id,
      numero_serie,
      descripcion,
      marca_modelo,
      area,
      servicio,
      sub_servicio,
      encargado,
      tecnico,
      criterio,
      ampliar_seleccion,
      disposicion_final,
      imagen,
      observaciones,
      correctivos,
      preventivos,
      dias_fuera_servicio,
      equipos_similares
    } = req.body;

    if (!texto(numero_serie)) {
      return res.status(400).json({ ok: false, error: "El número de serie es obligatorio." });
    }

    if (!CRITERIOS_RIC44.includes(texto(criterio))) {
      return res.status(400).json({ ok: false, error: "El criterio de obsolescencia no es válido." });
    }

    const { rows } = await pool.query(`
      INSERT INTO ric44 (
        equipo_id,
        ric01_id,
        numero_serie,
        descripcion,
        marca_modelo,
        area,
        servicio,
        sub_servicio,
        encargado,
        tecnico,
        criterio,
        ampliar_seleccion,
        disposicion_final,
        imagen,
        observaciones,
        correctivos,
        preventivos,
        dias_fuera_servicio,
        equipos_similares
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      RETURNING *;
    `, [
      equipo_id || null,
      ric01_id || null,
      texto(numero_serie),
      texto(descripcion),
      texto(marca_modelo),
      texto(area),
      texto(servicio),
      texto(sub_servicio),
      texto(encargado),
      texto(tecnico),
      texto(criterio),
      texto(ampliar_seleccion),
      texto(disposicion_final),
      imagen || null,
      texto(observaciones),
      Number(correctivos) || 0,
      Number(preventivos) || 0,
      Number(dias_fuera_servicio) || 0,
      Number(equipos_similares) || 0
    ]);

    return res.status(201).json({ ok: true, ric44: rows[0], ric44_id: rows[0].id });
  } catch (error) {
    console.error("Error creando RIC44:", error);
    return res.status(500).json({ ok: false, error: "Error al guardar el RIC44." });
  }
}

async function obtenerRic44(pool, req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, error: "ID RIC44 inválido." });
    }

    const { rows } = await pool.query("SELECT * FROM ric44 WHERE id = $1", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "RIC44 no encontrado." });
    }

    return res.json({ ok: true, ric44: rows[0] });
  } catch (error) {
    console.error("Error obteniendo RIC44:", error);
    return res.status(500).json({ ok: false, error: "Error al obtener el RIC44." });
  }
}

async function listarRic44(pool, req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT *
      FROM ric44
      ORDER BY fecha_registro DESC, id DESC
    `);

    return res.json({ ok: true, total: rows.length, ric44: rows });
  } catch (error) {
    console.error("Error listando RIC44:", error);
    return res.status(500).json({ ok: false, error: "Error al listar los RIC44." });
  }
}

module.exports = {
  CRITERIOS_RIC44,
  crearRic44,
  obtenerRic44,
  listarRic44,
  obtenerEstadisticasEquipo
};
