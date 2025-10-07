// src/FormularioUsuario.js
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "./config";
import QrReader from "react-qr-scanner";

const API_TAREAS = API_URL.Tareas;

export default function FormularioUsuario({ usuario, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [filtro, setFiltro] = useState("pendientes"); // 👈 NUEVO estado para pestañas

  useEffect(() => {
    fetchTareas();
    window.addEventListener("online", enviarTareasPendientes);
    return () => window.removeEventListener("online", enviarTareasPendientes);
  }, []);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      if (!usuario) return;
      const areaParam = encodeURIComponent(usuario.area || "");
      const url = areaParam ? `${API_TAREAS}/${areaParam}` : API_TAREAS;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const data = await res.json();
      const userIdentifier =
        typeof usuario === "string"
          ? usuario
          : usuario.nombre || usuario.mail || String(usuario);

      setTareas(
        data
          .filter((t) => t.usuario === userIdentifier)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      );
    } catch {
      toast.error("Error al cargar tareas ❌");
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (img) => setModalImagen(img);
  const cerrarModal = () => setModalImagen(null);

  const handleFinalizar = async (id) => {
    try {
      const res = await fetch(`${API_TAREAS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fin: true }),
      });
      if (!res.ok) throw new Error("Error HTTP " + res.status);

      setTareas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fin: true } : t))
      );
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

        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.6);
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

  // ✅ GUARDA también servicio y subservicio automáticamente
  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return toast.error("Ingrese una descripción de tarea");
    if (!usuario) return toast.error("Usuario no disponible");

    let userIdentifier =
      typeof usuario === "string"
        ? usuario
        : usuario.nombre || usuario.mail || String(usuario);

    const areaValor = typeof usuario === "object" ? usuario.area || null : null;
    const servicioValor =
      typeof usuario === "object" ? usuario.servicio || null : null;
    const subservicioValor =
      typeof usuario === "object" ? usuario.subservicio || null : null;

    const bodyToSend = {
      usuario: userIdentifier,
      tarea: nuevaTarea,
      area: areaValor,
      servicio: servicioValor,       // ✅ agregado
      subservicio: subservicioValor, // ✅ agregado
      imagen: nuevaImagen,
      fin: false,
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
        const serverMsg =
          payload && typeof payload === "object" && payload.error
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
      } catch {
        toast.error("❌ No se pudieron enviar algunas tareas");
        return;
      }
    }

    localStorage.removeItem("tareasPendientes");
    toast.success("✅ Tareas pendientes enviadas");
    fetchTareas();
  };

  const handleScan = (data) => {
    if (data) {
      let qrData;
      try {
        qrData = JSON.parse(data.text || data);
      } catch {
        qrData = { info: data.text || data };
      }
      setNuevaTarea(
        `Solicitud automática de asistencia para: ${qrData.marca || qrData.info} - ${qrData.numeroSerie || ""} - ${qrData.servicio || ""}`
      );
      toast.success("QR leído ✅ Tarea generada automáticamente");
      setShowQR(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    toast.error("Error al leer QR ❌");
  };

  const tareasFiltradas = tareas.filter((t) => {
    if (filtro === "pendientes") return !t.solucion && !t.fin;
    if (filtro === "enProceso") return t.solucion && !t.fin;
    if (filtro === "finalizadas") return t.fin;
    return true;
  });

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-12 h-auto" />
      <h1 className="text-2xl font-bold mb-4 text-center">
        📌 Pedidos de tareas de {usuario?.nombre || usuario?.mail || "Usuario"}{" "}
      </h1>
      <p>
        <button onClick={fetchTareas} className="bg-blue-400 text-white px-3 py-1 rounded-xl text-sm">
          🔄 Actualizar lista
        </button>
        <button onClick={onLogout} className="bg-red-500 text-white px-3 py-1 rounded-xl text-sm">
          Cerrar sesión
        </button>
      </p>

      <button
        type="button"
        onClick={() => setShowQR(!showQR)}
        className="bg-purple-500 text-white px-3 py-1 rounded-xl my-2"
      >
        {showQR ? "Cerrar lector QR" : "Solicitar asistencia mediante QR"}
      </button>

      {showQR && (
        <div className="mt-4">
          <QrReader
            constraints={{ video: { facingMode: { exact: "environment" } } }}
            delay={300}
            style={{ width: "100%" }}
            onError={handleError}
            onScan={handleScan}
          />
        </div>
      )}

      <div className="flex justify-center space-x-2 my-4">
        <button
          className={`px-3 py-1 rounded-xl ${filtro === "pendientes" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setFiltro("pendientes")}
        >
          Pendientes
        </button>
        <button
          className={`px-3 py-1 rounded-xl ${filtro === "enProceso" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setFiltro("enProceso")}
        >
          En proceso
        </button>
        <button
          className={`px-3 py-1 rounded-xl ${filtro === "finalizadas" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setFiltro("finalizadas")}
        >
          Finalizadas
        </button>
      </div>

      <form onSubmit={handleCrearTarea} className="mb-6 bg-gray-50 p-4 rounded-xl shadow space-y-3">
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Descripción de la nueva tarea..."
          value={nuevaTarea}
          onChange={(e) => setNuevaTarea(e.target.value)}
          required
        />
        <label className="bg-green-200 px-3 py-2 rounded cursor-pointer inline-block">
          Subir imagen
          <input type="file" accept="image/*" onChange={handleImagenChange} className="hidden" />
        </label>

        {previewImagen && (
          <div className="mt-2 relative inline-block">
            <img src={previewImagen} alt="preview" className="w-24 h-24 object-cover rounded shadow" />
            <button
              type="button"
              onClick={quitarImagen}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-full px-1 text-xs"
            >
              ❌
            </button>
          </div>
        )}

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-xl" disabled={loading}>
          {loading ? "Enviando..." : "Enviar pedido"}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <ul className="space-y-4">
          {tareasFiltradas.map((tarea) => (
            <motion.li
              key={tarea.id}
              className="border p-4 rounded-xl shadow bg-white"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="font-semibold">📝 {tarea.tarea}</p>
              {tarea.imagen && (
                <img
                  src={`data:image/jpeg;base64,${tarea.imagen}`}
                  alt="tarea"
                  className="w-32 h-32 object-cover mt-2 cursor-pointer rounded"
                  onClick={() => abrirModal(`data:image/jpeg;base64,${tarea.imagen}`)}
                />
              )}
              {tarea.solucion && (
                <motion.p
                  className="mt-2 p-2 bg-gray-100 rounded text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  💡 Solución: {tarea.solucion}
                </motion.p>
              )}
              {!tarea.fin ? (
                <button
                  onClick={() => handleFinalizar(tarea.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded mt-2"
                >
                  ✅ Finalizar
                </button>
              ) : (
                <p className="text-green-600 font-bold mt-2">✔️ Tarea finalizada</p>
              )}
            </motion.li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {modalImagen && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={cerrarModal}
          >
            <motion.img
              src={modalImagen}
              alt="Ampliada"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-full max-h-full rounded-xl shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}
