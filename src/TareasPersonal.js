import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "./config";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

  // Cargar tareas
  const fetchTareas = async () => {
    try {
      if (!personal?.area) return;
      const res = await fetch(`${API_TAREAS}/${encodeURIComponent(personal.area)}`);
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const data = await res.json();
      setTareas(data);
    } catch (err) {
      console.error("Error al cargar tareas:", err);
      toast.error("Error al cargar tareas ❌");
    }
  };

  // Cargar áreas
  const fetchAreas = async () => {
    try {
      const res = await fetch(API_AREAS);
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const data = await res.json();
      setAreas(data);
    } catch (err) {
      console.error("Error al cargar áreas:", err);
    }
  };

  useEffect(() => {
    fetchTareas();
    fetchAreas();
  }, [personal]);

  const handleSolucionChange = (id, value) => {
    setSoluciones((prev) => ({ ...prev, [id]: value }));
  };

  const handleCompletar = async (id) => {
    try {
      const solucion = soluciones[id] || "";
      const url = `${API_TAREAS}/${id}/solucion`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solucion, asignado: personal.nombre }),
      });

      if (!res.ok) throw new Error("Error HTTP " + res.status);

      setTareas((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, solucion, asignado: personal.nombre } : t
        )
      );

      toast.success("✅ Solución guardada");
    } catch (err) {
      console.error("Error al guardar solución", err);
      toast.error("❌ Error al guardar solución");
    }
  };

  const handleReasignar = async (id) => {
    try {
      if (!nuevaArea) {
        toast.warn("Seleccione una nueva área antes de confirmar");
        return;
      }

      const url = `${API_TAREAS}/${id}/reasignar`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nueva_area: nuevaArea,
          reasignado_por: personal.nombre,
        }),
      });

      if (!res.ok) throw new Error("Error HTTP " + res.status);

      toast.success(`🔄 Tarea #${id} reasignada a ${nuevaArea}`);
      setModal(null);
      setNuevaArea("");
      fetchTareas();
    } catch (err) {
      console.error("Error al reasignar tarea:", err);
      toast.error("❌ Error al reasignar tarea");
    }
  };

  // Filtrado
  const pendientes = tareas.filter((t) => !t.solucion && !t.fin);
  const enProceso = tareas.filter((t) => t.solucion && !t.fin);
  const finalizadas = tareas.filter((t) => t.fin);

  const tareasFiltradas =
    filtro === "pendientes"
      ? pendientes
      : filtro === "enProceso"
      ? enProceso
      : finalizadas;

  // 🧾 Exportar a PDF con formato institucional
  const handleExportarPDF = async () => {
    const nombreLista =
      filtro === "pendientes"
        ? "Pendientes"
        : filtro === "enProceso"
        ? "En proceso"
        : "Finalizadas";

    if (tareasFiltradas.length === 0) {
      toast.info("No hay tareas para exportar 📭");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const fecha = new Date().toLocaleString();

    // Encabezado institucional
    const img = new Image();
    img.src = "/logosmall.png";

    doc.addImage(img, "PNG", 10, 8, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("IC-SkyApp", 35, 16);
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Informe de tareas ${nombreLista}`, 35, 23);
    doc.line(10, 30, 287, 30); // línea separadora

    // Tabla de datos
    const dataExportar = tareasFiltradas.map((t) => [
      t.id,
      t.tarea,
      t.usuario,
      t.servicio || "",
      t.subservicio || "",
      t.area || "",
      t.reasignado_a || "",
      t.reasignado_por || "",
      t.solucion || "",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [
        [
          "ID",
          "Tarea",
          "Usuario",
          "Servicio",
          "Subservicio",
          "Área",
          "Reasignada a",
          "Reasignada por",
          "Solución",
        ],
      ],
      body: dataExportar,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
    });

    // Pie de página institucional
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`IC-SkyApp – Sistema de gestión de tareas`, 14, 200);
      doc.text(`Fecha: ${fecha}`, 230, 200);
      doc.text(`Página ${i} de ${pageCount}`, 140, 200);
    }

    doc.save(`Tareas_${nombreLista}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success(`✅ Exportado en PDF (${nombreLista})`);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-12 h-auto" />
      <h1 className="text-2xl font-bold mb-4 text-center">
        📌 Registro de tareas de{" "}
        <span className="text-blue-700">
          {personal?.nombre || personal?.mail || "Personal"}
        </span>
      </h1>

      {/* Botones superiores */}
      <div className="flex space-x-2 mb-4 justify-center">
        <button
          onClick={fetchTareas}
          className="bg-blue-400 text-white px-3 py-1 rounded-xl text-sm"
        >
          🔄 Actualizar lista
        </button>
        <button
          onClick={handleExportarPDF}
          className="bg-green-600 text-white px-3 py-1 rounded-xl text-sm"
        >
          📄 Exportar {filtro === "pendientes"
            ? "pendientes"
            : filtro === "enProceso"
            ? "en proceso"
            : "finalizadas"} en PDF
        </button>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-3 py-1 rounded-xl text-sm"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Filtros */}
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => setFiltro("pendientes")}
          className={`px-3 py-1 rounded-xl ${
            filtro === "pendientes"
              ? "bg-yellow-400 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          🕓 Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setFiltro("enProceso")}
          className={`px-3 py-1 rounded-xl ${
            filtro === "enProceso"
              ? "bg-blue-400 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          🧩 En proceso ({enProceso.length})
        </button>
        <button
          onClick={() => setFiltro("finalizadas")}
          className={`px-3 py-1 rounded-xl ${
            filtro === "finalizadas"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          ✅ Finalizadas ({finalizadas.length})
        </button>
      </div>

      {/* Lista de tareas */}
      <ul className="space-y-4">
        {tareasFiltradas.map((tarea) => (
          <li key={tarea.id} className="border p-4 rounded-xl shadow bg-white">
            <p className="font-semibold">📝 {tarea.tarea}</p>
            <p className="text-sm text-gray-600">👤 Usuario: {tarea.usuario}</p>
            <p className="text-sm text-gray-600">🧰 Servicio: {tarea.servicio || "—"}</p>
            <p className="text-sm text-gray-600">
              🔧 Subservicio: {tarea.subservicio || "—"}
            </p>
            {tarea.reasignado_a && (
              <p className="text-sm text-purple-600 mt-1">
                🔄 Reasignada desde <strong>{tarea.area}</strong> por{" "}
                <strong>{tarea.reasignado_por}</strong>
              </p>
            )}

            <button
              onClick={() => setModal(tarea)}
              className="mt-2 px-3 py-1 bg-purple-500 text-white rounded text-sm"
            >
              🔄 Reasignar
            </button>

            <textarea
              className="w-full p-2 border rounded mt-2"
              placeholder="Escriba la solución..."
              value={soluciones[tarea.id] || tarea.solucion || ""}
              onChange={(e) => handleSolucionChange(tarea.id, e.target.value)}
              disabled={!!tarea.solucion}
            />

            <button
              onClick={() => handleCompletar(tarea.id)}
              className={`mt-2 px-3 py-1 rounded text-white ${
                tarea.solucion ? "bg-gray-400 cursor-not-allowed" : "bg-green-500"
              }`}
              disabled={!!tarea.solucion}
            >
              ✅ Completar
            </button>
          </li>
        ))}
      </ul>

      {/* Modal de reasignación */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80">
            <h2 className="text-lg font-bold mb-3">
              🔄 Reasignar tarea #{modal.id}
            </h2>
            <label className="block mb-2">Seleccionar nueva área:</label>
            <select
              className="border rounded p-2 w-full mb-4"
              value={nuevaArea}
              onChange={(e) => setNuevaArea(e.target.value)}
            >
              <option value="">Seleccione...</option>
              {areas.map((a) => (
                <option key={a.id} value={a.area}>
                  {a.area}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModal(null)}
                className="bg-gray-300 px-3 py-1 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReasignar(modal.id)}
                className="bg-purple-600 text-white px-3 py-1 rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}
