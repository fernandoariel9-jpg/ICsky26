// Supervision.js
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "http://192.168.2.101:4000/tareas";

export default function Supervision() {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      // Solo tareas pendientes
      const pendientes = data.filter(t => !t.fin);
      setTareas(pendientes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch {
      toast.error("Error al cargar tareas");
    }
  };

  const abrirModal = (imgBase64) => setModalImagen(imgBase64);
  const cerrarModal = () => setModalImagen(null);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">📋 Panel de Supervisión</h1>
      <p className="text-center mb-4 text-red-600 font-semibold">Tareas pendientes: {tareas.length}</p>

      <ul className="space-y-3">
        {tareas.map(t => (
          <li key={t.id} className="p-3 rounded-xl shadow-sm bg-yellow-100 flex items-center space-x-3">
            {t.imagen && (
              <img
                src={`data:image/jpeg;base64,${t.imagen}`}
                alt="Foto"
                className="w-12 h-12 rounded-full object-cover cursor-pointer"
                onClick={() => abrirModal(t.imagen)}
              />
            )}
            <div>
              <p><span className="font-bold text-gray-700">#{t.id}</span> {t.usuario}: {t.tarea} 🔹</p>
              <p className="text-sm text-gray-500">Fecha: {new Date(t.fecha).toLocaleString()}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Lightbox modal */}
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
              src={`data:image/jpeg;base64,${modalImagen}`}
              alt="Ampliada"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-full max-h-full rounded-xl shadow-lg"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar={false} />
    </div>
  );
}
