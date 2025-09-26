// FormularioUsuario.js
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "https://sky26.onrender.com/tareas";

export default function FormularioUsuario({ usuario, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [form, setForm] = useState({ tarea: "", fin: false, imagen: null });
  const [editTask, setEditTask] = useState(null);
  const [modalImagen, setModalImagen] = useState(null);

  useEffect(() => { fetchTareas(); }, []);

  const fetchTareas = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTareas(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch {
      toast.error("Error al cargar tareas");
    }
  };

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const max = 300;
        let width = img.width, height = img.height;
        if (width > height) {
          if (width > max) { height = Math.round(height * max / width); width = max; }
        } else {
          if (height > max) { width = Math.round(width * max / height); height = max; }
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", 0.4).split(",")[1];
        if (editTask) setEditTask({ ...editTask, imagen: base64 });
        else setForm({ ...form, imagen: base64 });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = editTask ? editTask : { ...form, usuario };
    try {
      if (!editTask) {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const newTask = await res.json();
        setTareas([newTask, ...tareas]);
        setForm({ tarea: "", fin: false, imagen: null });
        toast.success("Tarea creada ✅");
      } else {
        if (editTask.fin) return toast.error("Tarea finalizada, no editable ❌");
        const res = await fetch(`${API_URL}/${editTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editTask),
        });
        const updated = await res.json();
        setTareas(prev => prev.map(t => t.id === updated.id ? updated : t));
        setEditTask(null);
        toast.success("Tarea actualizada ✅");
      }
    } catch {
      toast.error("Error al guardar tarea");
    }
  };

  const handleToggleFin = async (task, newFin) => {
    if (task.fin) return toast.info("Ya finalizada 🔒");
    try {
      const res = await fetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, fin: newFin }),
      });
      const updated = await res.json();
      setTareas(prev => prev.map(t => t.id === updated.id ? updated : t));
      toast.success("Estado actualizado ✅");
    } catch {
      toast.error("Error al actualizar tarea");
    }
  };

  const handleCloseEdit = () => { setEditTask(null); setForm({ tarea: "", fin: false, imagen: null }); };

  const tareasFiltradas = tareas.filter(t => t.usuario === usuario);
  const pendientes = tareasFiltradas.filter(t => !t.fin).length;

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">📋 Solicitud de servicio RIC01</h1>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-lg font-semibold">👤 {usuario}</p>
        <button onClick={onLogout} className="bg-red-500 text-white px-3 py-1 rounded-xl text-sm">
          Logout
        </button>
      </div>

      <div className="text-center mb-4">
        <p className="text-lg font-semibold text-red-600">Solicitudes pendientes: {pendientes}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow mb-6 flex flex-col space-y-3">
        <input type="text" placeholder="Tarea solicitada" className="w-full p-2 border rounded"
          value={editTask ? editTask.tarea : form.tarea}
          onChange={e => editTask ? setEditTask({ ...editTask, tarea: e.target.value }) : setForm({ ...form, tarea: e.target.value })}
          required />

        <label className="bg-green-500 text-white px-3 py-2 rounded-xl cursor-pointer text-center">
          Tomar foto
          <input type="file" accept="image/*" onChange={handleImagen} className="hidden" />
        </label>

        {editTask?.imagen && (
          <img src={`data:image/jpeg;base64,${editTask.imagen}`} alt="Foto" className="mt-2 w-24 h-24 rounded-full object-cover" />
        )}
        {!editTask?.imagen && form.imagen && (
          <img src={`data:image/jpeg;base64,${form.imagen}`} alt="Foto" className="mt-2 w-24 h-24 rounded-full object-cover" />
        )}

        <div className="flex space-x-2">
          <button type="submit" className="flex-1 bg-blue-500 text-white p-2 rounded-xl">
            {editTask ? "Actualizar" : "Enviar solicitud"}
          </button>
          {editTask && (
            <button type="button" className="flex-1 bg-gray-400 text-white p-2 rounded-xl" onClick={handleCloseEdit}>
              Cerrar edición
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-3">
        {tareasFiltradas.map(t => (
          <li key={t.id} className={`p-3 rounded-xl shadow-sm flex items-center justify-between ${t.fin ? "bg-green-200" : "bg-blue-100"}`}>
            <div className="flex items-center space-x-3">
              {t.imagen && (
                <img src={`data:image/jpeg;base64,${t.imagen}`} alt="Foto" className="w-12 h-12 rounded-full object-cover" />
              )}
              <div>
                <p className={t.fin ? "line-through text-gray-600" : "text-black"}>
                  <span className="font-bold text-gray-700">#{t.id}</span> {t.usuario}: {t.tarea} {t.fin ? "✅" : "🔹"}
                </p>
                <p className="text-sm text-gray-500">Fecha: {new Date(t.fecha).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input type="checkbox" checked={t.fin} onChange={e => handleToggleFin(t, e.target.checked)} disabled={t.fin} />
                <span>Finalizada</span>
              </label>
            </div>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {modalImagen && (
          <motion.div key="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <motion.img src={`data:image/jpeg;base64,${modalImagen}`} alt="Ampliada"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="max-w-full max-h-full rounded-xl shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
