import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "./config";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import RegistroUsuario from "./RegistroUsuario";
import { FaWhatsapp, FaSearch } from "react-icons/fa";

const API_TAREAS = API_URL.Tareas;
const API_AREAS = API_URL.Areas;

export default function TareasPersonal({ personal, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [soluciones, setSoluciones] = useState({});
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [filtro, setFiltro] = useState("pendientes");
  const [areas, setAreas] = useState([]);
  const [modal, setModal] = useState(null);
  const [nuevaArea, setNuevaArea] = useState("");
  const [editando, setEditando] = useState(null);
  const [notificacionesActivas, setNotificacionesActivas] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [editUsuario, setEditUsuario] = useState({});
  const [mostrarRic02, setMostrarRic02] = useState(null);
  const [valorRic02, setValorRic02] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarObservacion, setMostrarObservacion] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [tareaObsId, setTareaObsId] = useState(null);
  const [tareaObservacionActual, setTareaObservacionActual] = useState("");

  /* ================= HELPERS ================= */

  const getFechaLocal = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16).replace("T", " ");
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString("es-AR", { hour12: false });
  };

  /* ================= FETCH ================= */

  const fetchTareas = async () => {
    if (!personal?.area) return;
    const res = await fetch(`${API_TAREAS}/${encodeURIComponent(personal.area)}`);
    setTareas(await res.json());
  };

  const fetchAreas = async () => {
    const res = await fetch(API_AREAS);
    setAreas(await res.json());
  };

  useEffect(() => {
    fetchTareas();
    fetchAreas();
  }, [personal]);

  /* ================= SOLUCIÓN ================= */

  const handleSolucionChange = (id, value) =>
    setSoluciones((p) => ({ ...p, [id]: value }));

  const handleCompletar = async (id) => {
    const fecha = getFechaLocal();
    const solucion = `[${fecha}] ${soluciones[id] || ""}`;

    await fetch(`${API_TAREAS}/${id}/solucion`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solucion, asignado: personal.nombre, fecha_comp: fecha }),
    });

    toast.success("✅ Solución guardada");
    fetchTareas();
  };

  /* ================= FILTROS ================= */

  const pendientes = tareas.filter((t) => !t.solucion && !t.fin);
  const enProceso = tareas.filter((t) => t.solucion && !t.fin);
  const finalizadas = tareas.filter((t) => t.fin);

  const tareasFiltradas = busqueda
    ? tareas.filter((t) =>
        Object.values(t).join(" ").toLowerCase().includes(busqueda)
      )
    : filtro === "pendientes"
    ? pendientes
    : filtro === "enProceso"
    ? enProceso
    : finalizadas;

  /* ================= RENDER ================= */

  if (mostrarRegistro) {
    return <RegistroUsuario onCancelar={() => setMostrarRegistro(false)} />;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">

      <ul className="space-y-3">
        {tareasFiltradas.map((t) => (
          <li key={t.id} className="p-3 rounded-xl shadow bg-white">

            <p className="font-semibold">
              🆔 #{t.id} — {t.tarea}
            </p>

            {t.solucion && (
              <div className="mt-2 bg-gray-100 rounded p-2">
                <p className="font-semibold text-sm">💡 Historial</p>
                <ul className="list-disc list-inside text-sm">
                  {t.solucion
                    .split("\n")
                    .filter(Boolean)
                    .map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                </ul>
              </div>
            )}

            {t.observacion && (
              <div className="mt-2 bg-blue-50 rounded p-2">
                <p className="font-semibold text-sm">📝 Observaciones</p>
                <ul className="list-disc list-inside text-sm">
                  {t.observacion
                    .split("\n")
                    .filter(Boolean)
                    .map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                </ul>
              </div>
            )}

            {!t.solucion && (
              <>
                <textarea
                  className="w-full border rounded mt-2"
                  placeholder="Escriba la solución..."
                  value={soluciones[t.id] || ""}
                  onChange={(e) => handleSolucionChange(t.id, e.target.value)}
                />

                <button
                  onClick={() => handleCompletar(t.id)}
                  className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
                >
                  ✅ Completar
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}
