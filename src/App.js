// App.js
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import RegistroUsuario from "./RegistroUsuario";
import UsuarioLogin from "./UsuarioLogin";
import RegistroPersonal from "./RegistroPersonal";
import LoginPersonal from "./LoginPersonal";
import FormularioUsuario from "./FormularioUsuario";
import TareasPersonal from "./TareasPersonal";
import PanelLogin from "./PanelLogin";
import TestQR from "./TestQR";

const API_URL = "https://sky26.onrender.com/tareas";

function Main() {
  const [modo, setModo] = useState("menu"); // "menu", "loginUsuario", "registroUsuario", "loginPersonal", "registroPersonal"
  const [usuario, setUsuario] = useState(null);
  const [personal, setPersonal] = useState(null);

  // Logout para ambos tipos
  const handleLogout = () => {
    setUsuario(null);
    setPersonal(null);
    setModo("menu");
  };

  // ----------- Renderizado según estado -----------

  // Usuario logueado → FormularioUsuario
  if (usuario) return <FormularioUsuario usuario={usuario} onLogout={handleLogout} />;

  // Personal logueado → TareasPersonal
  if (personal) return <TareasPersonal personal={personal} onLogout={handleLogout} />;

  // Menú inicial
  if (modo === "menu") {
    return (
      <div className="p-4 max-w-md mx-auto mt-20 text-center">
        <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-24 h-auto" />
        <h1 className="text-2xl font-bold mb-6">Bienvenido al gestor de tareas de INGENIERÍA CLÍNICA</h1>
        <div className="flex flex-col space-y-4">
          <button className="bg-blue-500 text-white p-2 rounded-xl" onClick={() => setModo("loginUsuario")}>
            Ingreso de Usuario
          </button>
          <button className="bg-green-500 text-white p-2 rounded-xl" onClick={() => setModo("loginPersonal")}>
            Ingreso de Personal Técnico
          </button>
          <button className="bg-orange-500 text-white p-2 rounded-xl" onClick={() => setModo("supervision")}>
          Panel de Supervisión
        </button>
            <button
  className="bg-purple-500 text-white p-2 rounded-xl"
  onClick={() => setModo("testQR")}
>
  Test QR
</button>
        </div>
      </div>
    );
  }

  // Login Usuario
  if (modo === "loginUsuario") return <UsuarioLogin onLogin={(u) => setUsuario(u)} switchToRegister={() => setModo("registroUsuario")} />;

  // Registro Usuario
  if (modo === "registroUsuario") return <RegistroUsuario onRegister={(u) => setUsuario(u)} switchToLogin={() => setModo("loginUsuario")} />;

  // Login Personal
  if (modo === "loginPersonal") return <LoginPersonal onLogin={(p) => setPersonal(p)} switchToRegister={() => setModo("registroPersonal")} />;

  // Registro Personal
  if (modo === "registroPersonal") return <RegistroPersonal onRegister={(p) => setPersonal(p)} switchToLogin={() => setModo("loginPersonal")} />;

// dentro de tu Main()
if (modo === "testQR") return <TestQR />;

// Mostrar supervisión
  if (modo === "supervision") {
    return <SupervisionWrapper />;
  }
  return null;
}

export default Main;

// ToastContainer global
export function Toast() {
  return <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar={false} />;
}
// ---------- Panel de Supervisión ----------
function Supervision() {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTareas(
        data
          .filter((t) => !t.fin)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      );
    } catch {
      toast.error("Error al cargar tareas ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
    <img
          src="/logosmall.png"
          alt="Logo"
          className="mx-auto mb-4 w-24 h-auto"
        />
      <h1 className="text-2xl font-bold text-center mb-4">
        📋 Panel de Supervisión
      </h1>
      <p className="text-center mb-4 text-red-600 font-semibold">
        Tareas pendientes: {tareas.length}
      </p>

      <ul className="space-y-3">
        {tareas.map((t) => (
          <li
            key={t.id}
            className="p-3 rounded-xl shadow-sm bg-yellow-100 flex items-center space-x-3"
          >
            {t.imagen && (
              <img
                src={`data:image/jpeg;base64,${t.imagen}`}
                alt="Foto"
                className="w-12 h-12 rounded-full object-cover cursor-pointer"
                onClick={() => setModalImagen(t.imagen)}
              />
            )}
            <div>
              <p>
                <span className="font-bold text-gray-700">#{t.id}</span>{" "}
                {t.usuario}: {t.tarea} 🔹
              </p>
              <p className="text-sm text-gray-500">
                Fecha: {new Date(t.fecha).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {modalImagen && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setModalImagen(null)}
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

function SupervisionWrapper() {
  const [loggedIn, setLoggedIn] = useState(false);
  return loggedIn ? <Supervision /> : <PanelLogin onLogin={setLoggedIn} />;
}
