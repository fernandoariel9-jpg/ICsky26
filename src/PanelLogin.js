import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "https://sky26.onrender.com/tareas";

// ---------- Login del Panel ----------
function PanelLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const PASS = "super123";

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === PASS) {
        onLogin(true);
        toast.success("Acceso concedido ✅");
      } else {
        toast.error("Contraseña incorrecta ❌");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20 relative">
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-center mb-4">
        🔒 Acceso Panel de Supervisión
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-500 text-white p-2 rounded-xl"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}

// ---------- Panel de Supervisión ----------
function Supervision() {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const [tab, setTab] = useState("pendientes");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTareas(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch {
      toast.error("Error al cargar tareas ❌");
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (img) => setModalImagen(img);
  const cerrarModal = () => setModalImagen(null);

  // 🔹 Filtrado por pestañas
  const pendientes = tareas.filter((t) => !t.solucion && !t.fin);
  const terminadas = tareas.filter((t) => t.solucion && !t.fin);
  const finalizadas = tareas.filter((t) => t.fin);

  const tareasPorTab =
    tab === "pendientes"
      ? pendientes
      : tab === "terminadas"
      ? terminadas
      : finalizadas;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-2">📋 Panel de Supervisión</h1>

      {/* 🔹 Botones debajo del título */}
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => window.location.href = "/registro-usuario"}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl"
        >
          Registrar Usuario
        </button>
        <button
          onClick={() => window.location.href = "/registro-personal"}
          className="bg-green-500 text-white px-4 py-2 rounded-xl"
        >
          Registrar Personal
        </button>
      </div>

      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => setTab("pendientes")}
          className={`px-3 py-1 rounded-xl ${
            tab === "pendientes"
              ? "bg-yellow-400 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          🕓 Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setTab("terminadas")}
          className={`px-3 py-1 rounded-xl ${
            tab === "terminadas"
              ? "bg-blue-400 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          🧩 Terminadas ({terminadas.length})
        </button>
        <button
          onClick={() => setTab("finalizadas")}
          className={`px-3 py-1 rounded-xl ${
            tab === "finalizadas"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          ✅ Finalizadas ({finalizadas.length})
        </button>
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={fetchTareas}
          className="bg-blue-500 text-white px-3 py-1 rounded-xl"
        >
          🔄 Actualizar lista
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <ul className="space-y-3">
          {tareasPorTab.length === 0 && (
            <p className="text-center text-gray-500 italic">
              No hay tareas en esta categoría.
            </p>
          )}
          {tareasPorTab.map((t) => (
            <motion.li
              key={t.id}
              className="p-3 rounded-xl shadow bg-white"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-3">
                {t.imagen && (
                  <img
                    src={`data:image/jpeg;base64,${t.imagen}`}
                    alt="Foto"
                    className="w-14 h-14 rounded-lg object-cover cursor-pointer"
                    onClick={() => abrirModal(t.imagen)}
                  />
                )}
                <div>
                  <p className="font-semibold">
                    #{t.id} — {t.usuario}: {t.tarea}
                  </p>
                  <p className="text-sm text-gray-600">
                    📅 {new Date(t.fecha).toLocaleString()}
                  </p>
                  {t.solucion && (
                    <p className="text-sm bg-gray-100 p-1 rounded mt-1">
                      💡 Solución: {t.solucion}
                    </p>
                  )}
                  {t.fin && (
                    <p className="text-green-600 font-semibold mt-1">
                      ✔️ Finalizada por el usuario
                    </p>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      {/* Modal para imagen ampliada */}
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
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}

// ---------- Wrapper que combina login + panel ----------
export default function Panel() {
  const [loggedIn, setLoggedIn] = useState(false);
  return loggedIn ? <Supervision /> : <PanelLogin onLogin={setLoggedIn} />;
}
