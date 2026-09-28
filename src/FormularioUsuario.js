// src/FormularioUsuario.js
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "./config";
import QrReader from "react-qr-scanner";

const API_TAREAS = API_URL.Tareas;
const API_EQUIPO_PUBLICO = "https://sky26.onrender.com/equipos/publico";

const normalizarIdentidad = (valor = "") => String(valor || "").trim().toLowerCase();

export default function FormularioUsuario({ usuario, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [filtro, setFiltro] = useState("pendientes");

  useEffect(() => {
    fetchTareas();
    window.addEventListener("online", enviarTareasPendientes);
    return () => window.removeEventListener("online", enviarTareasPendientes);
  }, []);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      if (!usuario) return;

      const mailUsuario = typeof usuario === "object" ? usuario?.mail : "";
      const userIdentifier = typeof usuario === "string" ? usuario : mailUsuario || usuario.nombre;

      const res = await fetch(`${API_TAREAS}?usuario=${encodeURIComponent(userIdentifier)}`);
      if (!res.ok) throw new Error("Error HTTP " + res.status);

      const data = await res.json();

      // Si conocemos el mail, la identidad del usuario es el mail, no el nombre.
      // Esto evita que dos usuarios homónimos vean las tareas del otro.
      const tareasPropias = mailUsuario
        ? data.filter((t) => {
            const mail = normalizarIdentidad(mailUsuario);
            return (
              normalizarIdentidad(t.usuario) === mail ||
              normalizarIdentidad(t.solicitado_por) === mail
            );
          })
        : data;

      setTareas(tareasPropias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar tareas ❌");
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (img) => setModalImagen(img);
  const cerrarModal = () => setModalImagen(null);

  function formatTimestamp(ts) {
    if (!ts) return "";
    if (/^\d{2}\/\d{2}\/\d{4}/.test(ts)) return ts;

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(ts)) {
      const [fechaPart, horaPart] = ts.split(" ");
      const [year, month, day] = fechaPart.split("-").map(Number);
      const [hour, min, sec = "00"] = horaPart.split(":");
      return `${String(day).padStart(2,"0")}/${String(month).padStart(2,"0")}/${year}, ${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    }

    try {
      const d = new Date(ts);
      const opciones = {
        timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      const partes = new Intl.DateTimeFormat("es-AR", opciones).formatToParts(d);
      const get = (t) => (partes.find(p => p.type === t) || {}).value || "00";
      const dia = get("day"), mes = get("month"), año = get("year");
      const hora = get("hour"), min = get("minute"), seg = get("second");
      return `${dia}/${mes}/${año}, ${hora}:${min}:${seg}`;
    } catch {
      return String(ts);
    }
  }

  function getFechaLocal() {
    const d = new Date();
    d.setSeconds(0, 0);
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${año}-${mes}-${dia} ${hora}:${min}`;
  }

  const handleFinalizar = async (id) => {
    try {
      const fecha_fin = getFechaLocal();
      const res = await fetch(`${API_TAREAS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fin: true, fecha_fin }),
      });
      if (!res.ok) throw new Error("Error HTTP " + res.status);

      setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, fin: true } : t)));
      toast.success("✅ Tarea finalizada");
    } catch {
      toast.error("❌ No se pudo finalizar la tarea");
    }
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 500;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.5);
        const base64Data = compressedDataUrl.split(",")[1];
        setNuevaImagen(base64Data);
        setPreviewImagen(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const quitarImagen = () => {
    setNuevaImagen(null);
    setPreviewImagen(null);
  };

  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return toast.error("Ingrese una descripción de tarea");
    if (!usuario) return toast.error("Usuario no disponible");

    // El mail es el identificador único. El nombre queda solo para presentación.
    const userIdentifier = typeof usuario === "string" ? usuario : usuario.mail || usuario.nombre || String(usuario);
    const areaValor = usuario?.area ?? null;
    const servicioValor = usuario?.servicio ?? null;
    const subservicioValor = usuario?.subservicio ?? null;
    const fecha = getFechaLocal();

    const bodyToSend = {
      usuario: userIdentifier,
      tarea: nuevaTarea,
      area: areaValor,
      servicio: servicioValor,
      subservicio: subservicioValor,
      imagen: nuevaImagen,
      fin: false,
      fecha,
    };

    setLoading(true);
    try {
      if (!navigator.onLine) throw new Error("offline");

      const res = await fetch(API_TAREAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });

      const text = await res.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = text;
      }

      if (!res.ok) {
        const serverMsg = payload && typeof payload === "object" && payload.error
          ? payload.error
          : typeof payload === "string"
            ? payload
            : `HTTP ${res.status}`;
        toast.error("❌ Error al crear tarea: " + serverMsg);
        return;
      }

      setTareas((prev) => [payload, ...prev]);
      setNuevaTarea("");
      setNuevaImagen(null);
      setPreviewImagen(null);
      toast.success("✅ Tarea creada");
    } catch (err) {
      let pendientes = JSON.parse(localStorage.getItem("tareasPendientes") || "[]");
      pendientes.push(bodyToSend);
      localStorage.setItem("tareasPendientes", JSON.stringify(pendientes));
      setNuevaTarea("");
      setNuevaImagen(null);
      setPreviewImagen(null);
      toast.info("⚠️ Sin conexión: tarea guardada localmente");
    } finally {
      setLoading(false);
    }
  };

  const enviarTareasPendientes = async () => {
    let pendientes = JSON.parse(localStorage.getItem("tareasPendientes") || "[]");
    if (!pendientes.length) return;

    for (const tarea of pendientes) {
      try {
        await fetch(API_TAREAS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tarea),
        });
      } catch (error) {
        console.error("Error enviando tarea pendiente:", error);
        return;
      }
    }

    localStorage.removeItem("tareasPendientes");
    fetchTareas();
  };

  const pendientes = tareas.filter((t) => !t.solucion && !t.fin);
  const enProceso = tareas.filter((t) => t.solucion && !t.fin);
  const finalizadas = tareas.filter((t) => t.fin);
  const tareasVisibles = filtro === "pendientes" ? pendientes : filtro === "enProceso" ? enProceso : finalizadas;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mis tareas</h1>
            <p className="text-sm text-gray-500">{typeof usuario === "object" ? usuario?.nombre || usuario?.mail : usuario}</p>
          </div>
          {onLogout && <button onClick={onLogout} className="bg-gray-600 text-white px-4 py-2 rounded-xl">Cerrar sesión</button>}
        </div>

        <form onSubmit={handleCrearTarea} className="bg-white rounded-2xl shadow p-4 mb-4">
          <textarea value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} placeholder="Describa la tarea o inconveniente..." className="w-full border rounded-xl p-3" rows={4} />
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="bg-blue-600 text-white px-4 py-2 rounded-xl cursor-pointer">
              📷 Agregar imagen
              <input type="file" accept="image/*" capture="environment" onChange={handleImagenChange} className="hidden" />
            </label>
            {previewImagen && <button type="button" onClick={quitarImagen} className="bg-red-500 text-white px-4 py-2 rounded-xl">Quitar imagen</button>}
            <button type="submit" disabled={loading} className="ml-auto bg-green-600 disabled:bg-gray-400 text-white px-5 py-2 rounded-xl font-semibold">{loading ? "Guardando..." : "Crear tarea"}</button>
          </div>
          {previewImagen && <img src={previewImagen} alt="Vista previa" className="mt-3 max-h-56 rounded-xl border cursor-pointer" onClick={() => abrirModal(previewImagen)} />}
        </form>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={() => setFiltro("pendientes")} className={`rounded-xl p-3 font-semibold ${filtro === "pendientes" ? "bg-red-600 text-white" : "bg-white shadow"}`}>Pendientes ({pendientes.length})</button>
          <button onClick={() => setFiltro("enProceso")} className={`rounded-xl p-3 font-semibold ${filtro === "enProceso" ? "bg-yellow-500 text-white" : "bg-white shadow"}`}>En proceso ({enProceso.length})</button>
          <button onClick={() => setFiltro("finalizadas")} className={`rounded-xl p-3 font-semibold ${filtro === "finalizadas" ? "bg-green-600 text-white" : "bg-white shadow"}`}>Finalizadas ({finalizadas.length})</button>
        </div>

        <div className="space-y-3">
          {tareasVisibles.map((t) => (
            <motion.div key={t.id} layout className="bg-white rounded-2xl shadow p-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="text-xs text-gray-500">Tarea #{t.id}</p>
                  <p className="font-bold text-gray-800">{t.tarea}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.fin ? "bg-green-100 text-green-700" : t.solucion ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{t.fin ? "FINALIZADA" : t.solucion ? "EN PROCESO" : "PENDIENTE"}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-3 text-sm text-gray-600">
                <p><b>Área:</b> {t.area || "-"}</p>
                <p><b>Servicio:</b> {t.servicio || "-"}</p>
                <p><b>Subservicio:</b> {t.subservicio || "-"}</p>
                <p><b>Asignado:</b> {t.asignado || "-"}</p>
                <p><b>Fecha:</b> {formatTimestamp(t.fecha)}</p>
                {t.fecha_comp && <p><b>Completada:</b> {formatTimestamp(t.fecha_comp)}</p>}
                {t.fecha_fin && <p><b>Finalizada:</b> {formatTimestamp(t.fecha_fin)}</p>}
              </div>

              {t.solucion && <div className="mt-3 bg-green-50 rounded-xl p-3"><b>Solución</b><p className="whitespace-pre-wrap mt-1">{t.solucion}</p></div>}
              {t.observacion && <div className="mt-3 bg-blue-50 rounded-xl p-3"><b>Observación</b><p className="whitespace-pre-wrap mt-1">{t.observacion}</p></div>}
              {t.imagen && <button type="button" onClick={() => abrirModal(`data:image/jpeg;base64,${t.imagen}`)} className="mt-3 bg-blue-600 text-white px-3 py-2 rounded-xl">Ver imagen</button>}
              {!t.fin && t.solucion && <button type="button" onClick={() => handleFinalizar(t.id)} className="mt-3 w-full bg-green-600 text-white p-3 rounded-xl font-semibold">Finalizar tarea</button>}
            </motion.div>
          ))}

          {tareasVisibles.length === 0 && <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No hay tareas en esta sección.</div>}
        </div>
      </div>

      <AnimatePresence>
        {modalImagen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={cerrarModal}>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} src={modalImagen} alt="Imagen ampliada" className="max-w-full max-h-[90vh] rounded-xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
