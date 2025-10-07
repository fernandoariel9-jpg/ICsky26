// src/FormularioUsuario.js
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "./config";

const API_TAREAS = API_URL.tareas;

export default function FormularioUsuario({ usuario, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTareas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (err) {
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
    reader.onloadend = () => {
      const parts = reader.result.split(",");
      setNuevaImagen(parts.length > 1 ? parts[1] : parts[0]);
      setPreviewImagen(reader.result);
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

    const userIdentifier =
      typeof usuario === "string"
        ? usuario
        : usuario.nombre || usuario.mail || String(usuario);

    const bodyToSend = {
      usuario: userIdentifier,
      tarea: nuevaTarea,
      area: usuario.area || null,
      servicio: usuario.servicio || null,
      subservicio: usuario.subservicio || null,
      imagen: nuevaImagen,
      fin: false,
    };

    setLoading(true);
    try {
      const res = await fetch(API_TAREAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear tarea");

      setTareas((prev) => [data, ...prev]);
      setNuevaTarea("");
      setNuevaImagen(null);
      setPreviewImagen(null);
      toast.success("✅ Tarea creada");
    } catch (err) {
      toast.error("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Dividir tareas en secciones
  const tareasPendientes = tareas.filter((t) => !t.fin && !t.solucion);
  const tareasTerminadas = tareas.filter((t) => t.solucion && !t.fin);
  const tareasFinalizadas = tareas.filter((t) => t.fin);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-12 h-auto" />
      <h1 className="text-2xl font-bold mb-4 text-center">
        📌 Pedidos de tareas de {usuario?.nombre || usuario?.mail || "Usuario"}
      </h1>

      <div className="flex justify-center gap-3 mb-4">
        <button onClick={fetchTareas} className="bg-blue-500 text-white px-3 py-1 rounded-xl text-sm">
          🔄 Actualizar
        </button>
        <button onClick={onLogout} className="bg-red-500 text-white px-3 py-1 rounded-xl text-sm">
          Logout
        </button>
      </div>

      {/* Formulario para crear nueva tarea */}
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
        <>
          {/* Sección: Pendientes */}
          {tareasPendientes.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mt-4 mb-2 text-yellow-600">🕓 Pendientes</h2>
              <ListaTareas tareas={tareasPendientes} onFinalizar={handleFinalizar} abrirModal={abrirModal} />
            </div>
          )}

          {/* Sección: Terminadas */}
          {tareasTerminadas.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mt-6 mb-2 text-blue-600">💡 Terminadas</h2>
              <ListaTareas tareas={tareasTerminadas} onFinalizar={handleFinalizar} abrirModal={abrirModal} />
            </div>
          )}

          {/* Sección: Finalizadas */}
          {tareasFinalizadas.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mt-6 mb-2 text-green-700">✅ Finalizadas</h2>
              <ListaTareas tareas={tareasFinalizadas} abrirModal={abrirModal} />
            </div>
          )}
        </>
      )}

      {/* Modal de imagen ampliada */}
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

// 🧩 Componente para renderizar lista de tareas
function ListaTareas({ tareas, onFinalizar, abrirModal }) {
  return (
    <ul className="space-y-4">
      {tareas.map((tarea) => (
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

          {onFinalizar && !tarea.fin && (
            <button
              onClick={() => onFinalizar(tarea.id)}
              className="bg-green-600 text-white px-3 py-1 rounded mt-2"
            >
              ✅ Finalizar
            </button>
          )}
        </motion.li>
      ))}
    </ul>
  );
}
