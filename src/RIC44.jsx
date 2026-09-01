import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "./config";

const CRITERIOS = [
  "Criterio de fábrica",
  "Falta de repuestos originales, soporte tecnico o no existen repuestos alternativos",
  "Mayor a 10 años de uso - Análisis de riesgo (RIESGO ALTO)",
  "Mayor a 10 años de uso - Análisis de tecnologías superiores que justifiquen el recambio",
  "Mayor a 10 años de uso - Análisis y sugerencia del usuario del equipamiento",
  "Mayor a 10 años de uso - Verificación funcional y seguridad eléctrica NO SUPERADA",
  "Mayor a 20 años de uso"
];

export default function RIC44({ setVista, personal }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [equipo, setEquipo] = useState(null);
  const [criterio, setCriterio] = useState("");
  const [ampliarSeleccion, setAmpliarSeleccion] = useState("");
  const [disposicionFinal, setDisposicionFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [imagen, setImagen] = useState("");
  const [estadisticas, setEstadisticas] = useState({
    correctivos: 0,
    preventivos: 0,
    dias_fuera_servicio: 0,
    equipos_similares: 0
  });
  const inputFoto = useRef(null);

  useEffect(() => {
    cargarDatos();
  }, [personal]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const tareaGuardada = localStorage.getItem("tareaActiva");
      if (!tareaGuardada) throw new Error("No existe un equipo/mantenimiento activo.");

      const tarea = JSON.parse(tareaGuardada);
      let datosEquipo = null;

      if (tarea.numero_serie) {
        const res = await fetch(
          `${API_URL.BuscarEquipo}/${encodeURIComponent(tarea.numero_serie)}`
        );
        if (res.ok) datosEquipo = await res.json();
      }

      datosEquipo = datosEquipo || tarea;
      setEquipo(datosEquipo);
      setImagen(datosEquipo.imagen || "");

      await cargarEstadisticas(datosEquipo);
    } catch (err) {
      console.error("Error cargando RIC44:", err);
      setError(err.message || "No se pudieron cargar los datos del equipo.");
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async (datosEquipo) => {
    try {
      const [resTareas, resEquipos] = await Promise.all([
        fetch(API_URL.Tareas),
        fetch(API_URL.Equipos)
      ]);

      const tareasData = resTareas.ok ? await resTareas.json() : [];
      const equiposData = resEquipos.ok ? await resEquipos.json() : [];
      const tareas = Array.isArray(tareasData) ? tareasData : tareasData.tareas || [];
      const equipos = Array.isArray(equiposData) ? equiposData : equiposData.equipos || [];

      const serie = normalizar(datosEquipo.numero_serie);
      const descripcion = normalizar(datosEquipo.descripcion);
      const servicio = normalizar(datosEquipo.servicio);
      const subservicio = normalizar(datosEquipo.sub_servicio ?? datosEquipo.subservicio);

      const tareasEquipo = tareas.filter((t) => {
        return serie && normalizar(t.numero_serie) === serie;
      });

      const correctivos = tareasEquipo.filter((t) => {
        const tipo = normalizar(t.tipo_mantenimiento);
        return tipo.includes("correct");
      }).length;

      const preventivos = tareasEquipo.filter((t) => {
        const tipo = normalizar(t.tipo_mantenimiento);
        return tipo.includes("prevent");
      }).length;

      const diasFueraServicio = tareasEquipo.reduce((total, t) => {
        const inicio = parseFecha(t.fecha);
        const fin = parseFecha(t.fecha_fin || t.fin || t.fecha_comp);
        if (!inicio || !fin || fin < inicio) return total;
        return total + Math.ceil((fin - inicio) / 86400000);
      }, 0);

      const equiposSimilares = equipos.filter((e) => {
        return normalizar(e.descripcion) === descripcion &&
          normalizar(e.servicio) === servicio &&
          normalizar(e.sub_servicio ?? e.subservicio) === subservicio &&
          normalizar(e.numero_serie) !== serie;
      }).length;

      setEstadisticas({
        correctivos,
        preventivos,
        dias_fuera_servicio: diasFueraServicio,
        equipos_similares: equiposSimilares
      });
    } catch (err) {
      console.error("Error calculando estadísticas RIC44:", err);
    }
  };

  const seleccionarFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => setImagen(String(lector.result || ""));
    lector.readAsDataURL(archivo);
  };

  const guardar = async () => {
    if (!equipo?.numero_serie) return alert("No se encontró el número de serie del equipo.");
    if (!criterio) return alert("Seleccione el criterio de obsolescencia.");

    try {
      setGuardando(true);
      setError("");

      const payload = {
        equipo_id: equipo.id || "",
        ric01_id: equipo.mantenimiento_id || equipo.ric01_id || "",
        numero_serie: equipo.numero_serie || "",
        descripcion: equipo.descripcion || "",
        marca_modelo: equipo.marca_modelo || "",
        area: equipo.area || "",
        servicio: equipo.servicio || "",
        sub_servicio: equipo.sub_servicio || equipo.subservicio || "",
        encargado: equipo.encargado || "",
        tecnico: personal?.nombre || "",
        criterio,
        ampliar_seleccion: ampliarSeleccion,
        disposicion_final: disposicionFinal,
        imagen,
        observaciones,
        correctivos: estadisticas.correctivos,
        preventivos: estadisticas.preventivos,
        dias_fuera_servicio: estadisticas.dias_fuera_servicio,
        equipos_similares: estadisticas.equipos_similares
      };

      const respuesta = await fetch(API_URL.Ric44, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data.error || "Error guardando RIC44");

      alert("RIC44 guardado correctamente ✅");
      if (data.ric44_id || data.id) {
        localStorage.setItem("ric44Id", String(data.ric44_id || data.id));
      }
    } catch (err) {
      console.error("ERROR GUARDANDO RIC44:", err);
      setError(err.message || "No se pudo guardar el RIC44.");
      alert(err.message || "No se pudo guardar el RIC44.");
    } finally {
      setGuardando(false);
    }
  };

  const resumenCriticidad = useMemo(() => {
    const total = estadisticas.equipos_similares + 1;
    if (total <= 1) return "Equipo único en el servicio/subservicio";
    if (total === 2) return "Baja disponibilidad de reemplazo";
    return `${total} equipos del mismo tipo disponibles en el servicio/subservicio`;
  }, [estadisticas.equipos_similares]);

  if (cargando) {
    return <div className="p-6 text-center"><p className="text-lg">⏳ Cargando datos del equipo...</p></div>;
  }

  if (error && !equipo) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">⚠️ {error}</div>
        <button onClick={() => setVista("equipos")} className="w-full bg-gray-500 text-white rounded-xl p-3 mt-4">
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-xl mx-auto p-3">
          <div className="flex justify-between items-center gap-2">
            <p className="font-bold text-gray-800">RIC44 - Registro de obsolescencia</p>
            <span className="text-xs text-gray-500">Ingeniería Clínica</span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        <section className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Datos del equipo</h2>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <p><strong>Nº serie:</strong> {equipo?.numero_serie || "-"}</p>
            <p><strong>Descripción:</strong> {equipo?.descripcion || "-"}</p>
            <p><strong>Marca / Modelo:</strong> {equipo?.marca_modelo || "-"}</p>
            <p><strong>Área:</strong> {equipo?.area || "-"}</p>
            <p><strong>Servicio:</strong> {equipo?.servicio || "-"}</p>
            <p><strong>Subservicio:</strong> {equipo?.sub_servicio || equipo?.subservicio || "-"}</p>
            <p><strong>Técnico:</strong> {personal?.nombre || "-"}</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Criterio de obsolescencia</h2>
          <label className="block text-sm font-semibold mb-1">Seleccionar criterio</label>
          <select
            value={criterio}
            onChange={(e) => setCriterio(e.target.value)}
            className="w-full border rounded-xl p-3"
          >
            <option value="">Seleccione...</option>
            {CRITERIOS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <label className="block text-sm font-semibold mt-4 mb-1">Ampliar selección</label>
          <textarea
            value={ampliarSeleccion}
            onChange={(e) => setAmpliarSeleccion(e.target.value)}
            className="w-full border rounded-xl p-3 min-h-24"
            placeholder="Detalle o ampliación del criterio seleccionado"
          />
        </section>

        <section className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Disposición final</h2>
          <textarea
            value={disposicionFinal}
            onChange={(e) => setDisposicionFinal(e.target.value)}
            className="w-full border rounded-xl p-3 min-h-24"
            placeholder="Indique la disposición final del equipo"
          />
        </section>

        <section className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Imagen del equipo</h2>
          {imagen ? (
            <img src={imagen.startsWith("data:") ? imagen : `data:image/jpeg;base64,${imagen}`} alt="Equipo" className="w-full max-h-72 object-contain rounded-xl border bg-gray-50" />
          ) : (
            <p className="text-sm text-gray-500 mb-3">El equipo no tiene una imagen registrada.</p>
          )}

          <input ref={inputFoto} type="file" accept="image/*" capture="environment" onChange={seleccionarFoto} className="hidden" />
          <button
            onClick={() => inputFoto.current?.click()}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
          >
            📷 {imagen ? "Tomar / cambiar imagen" : "Tomar imagen del equipo"}
          </button>
        </section>

        <section className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Estadísticas del equipo</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="border rounded-xl p-3">
              <p className="text-2xl font-bold text-red-600">{estadisticas.correctivos}</p>
              <p className="text-xs text-gray-600">Correctivos</p>
            </div>
            <div className="border rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-600">{estadisticas.preventivos}</p>
              <p className="text-xs text-gray-600">Preventivos</p>
            </div>
            <div className="border rounded-xl p-3">
              <p className="text-2xl font-bold text-orange-600">{estadisticas.dias_fuera_servicio}</p>
              <p className="text-xs text-gray-600">Días fuera de servicio</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Equipos similares en el servicio</h2>
          <div className="text-center border rounded-2xl p-5 bg-gray-50">
            <p className="text-4xl font-bold text-purple-600">{estadisticas.equipos_similares}</p>
            <p className="font-semibold text-gray-700 mt-1">equipos similares adicionales</p>
            <p className="text-sm text-gray-500 mt-2">Misma descripción, servicio y subservicio.</p>
            <p className="text-sm font-semibold text-gray-700 mt-2">{resumenCriticidad}</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Observaciones</h2>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full border rounded-xl p-3 min-h-28"
            placeholder="Observaciones generales"
          />
        </section>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl">⚠️ {error}</div>}

        <button
          onClick={guardar}
          disabled={guardando}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl shadow"
        >
          {guardando ? "Guardando RIC44..." : "💾 Guardar RIC44"}
        </button>

        <button
          onClick={() => setVista("equipos")}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl"
        >
          ← Volver a equipos
        </button>
      </div>
    </div>
  );
}

function normalizar(valor) {
  return String(valor || "").trim().toLowerCase();
}

function parseFecha(valor) {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
