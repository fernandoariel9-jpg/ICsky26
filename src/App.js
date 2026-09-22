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
import NotificacionesMantenimiento from "./NotificacionesMantenimiento";
import MobileKeyboardSupport from "./MobileKeyboardSupport";
import TareasPersonal from "./TareasPersonal";
import PanelLogin from "./PanelLogin";
import ManualUsuario from "./ManualUsuario";
import AnaliticaAreas from "./AnaliticaAreas";
import Equipos from "./Equipos";
import PanelPersonal from "./PanelPersonal";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ResumenEstados from "./ResumenEstados";
import RIC37 from "./RIC37";
import InformacionPublica from "./InformacionPublica";
import PoliticaPrivacidad from "./PoliticaPrivacidad";
import MonitorIndicadores from "./MonitorIndicadores";
import EquipoPublico from "./EquipoPublico";
import EtiquetaQREquipoGlobal from "./EtiquetaQREquipoGlobal";

const API_URL = "https://sky26.onrender.com/tareas";

function Main() {
  const [modo, setModo] = useState("menu");
  const [usuario, setUsuario] = useState(null);
  const [personal, setPersonal] = useState(null);

  useEffect(() => {
    window.setModoGlobal = setModo;
  }, [setModo]);

  const handleLogout = () => {
    setUsuario(null);
    setPersonal(null);
    setModo("menu");
  };

  if (usuario) {
    return (
      <div className="relative min-h-screen">
        <FormularioUsuario usuario={usuario} onLogout={handleLogout} />
        <div className="fixed top-4 right-4 z-[60]">
          <NotificacionesMantenimiento usuario={usuario} />
        </div>
      </div>
    );
  }

  if (personal) return <PanelPersonal personal={personal} onLogout={handleLogout} />;

  if (modo === "menu") {
    return (
      <div className="p-4 max-w-md mx-auto mt-20 text-center">
        <img src="/logosmall_old.png" alt="Logo" className="mx-auto mb-4 w-24 h-auto" />
        <h1 className="text-2xl font-bold mb-6">Bienvenido al gestor de tareas de INGENIERÍA CLÍNICA</h1>
        <div className="flex flex-col space-y-4">
          <button className="bg-blue-500 text-white p-2 rounded-xl" onClick={() => setModo("loginUsuario")}>Ingreso de Usuario</button>
          <button className="bg-green-500 text-white p-2 rounded-xl" onClick={() => setModo("loginPersonal")}>Ingreso de Personal de Ingeniería Clínica</button>
          <button className="bg-orange-500 text-white p-2 rounded-xl" onClick={() => setModo("supervision")}>Panel de Supervisión</button>
        </div>
      </div>
    );
  }

  if (modo === "loginUsuario") return <UsuarioLogin onLogin={(u) => setUsuario(u)} switchToRegister={() => setModo("registroUsuario")} switchToMenu={() => setModo("menu")} />;
  if (modo === "registroUsuario") return <RegistroUsuario onRegister={(u) => setUsuario(u)} switchToLogin={() => setModo("loginUsuario")} />;
  if (modo === "loginPersonal") return <LoginPersonal onLogin={(p) => setPersonal(p)} switchToRegister={() => setModo("registroPersonal")} switchToMenu={() => setModo("menu")} />;
  if (modo === "registroPersonal") return <RegistroPersonal onRegister={(p) => setPersonal(p)} switchToLogin={() => setModo("loginPersonal")} />;

  if (modo === "supervision") {
    return <SupervisionWrapper />;
  }

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <MobileKeyboardSupport />
      <EtiquetaQREquipoGlobal />
      <Routes>
        <Route path="/informacion" element={<InformacionPublica />} />
        <Route path="/privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/analitica-areas" element={<AnaliticaAreas />} />
        <Route path="/monitor-indicadores" element={<MonitorIndicadores />} />
        <Route path="/equipo/:numeroSerie" element={<EquipoPublico />} />
        <Route path="/estado-equipos" element={<ResumenEstados />} />
        <Route path="/*" element={<Main />} />
      </Routes>
    </BrowserRouter>
  );
}

export function Toast() {
  return <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar={false} />;
}

function Supervision() {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const setModoGlobal = window.setModoGlobal;

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
      <img src="/logosmall_old.png" alt="Logo" className="mx-auto mb-4 w-24 h-auto" />
      <h1 className="text-2xl font-bold text-center mb-4">📋 Panel de Supervisión</h1>
      <p className="text-center mb-4 text-red-600 font-semibold">Tareas pendientes: {tareas.length}</p>

      <ul className="space-y-3">
        {tareas.map((t) => (
          <li key={t.id} className="p-3 rounded-xl shadow-sm bg-yellow-100 flex items-center space-x-3">
            {t.imagen && (
              <img
                src={`data:image/jpeg;base64,${t.imagen}`}
                alt="Foto"
                className="w-12 h-12 rounded-full object-cover cursor-pointer"
                onClick={() => setModalImagen(t.imagen)}
              />
            )}
            <div>
              <p><span className="font-bold text-gray-700">#{t.id}</span> {t.usuario}: {t.tarea} 🔹</p>
              <p className="text-sm text-gray-500">Fecha: {new Date(t.fecha).toLocaleString()}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col space-y-2">
        <button onClick={() => setModoGlobal("menu")} className="bg-gray-400 text-white px-4 py-2 rounded-xl w-full">Volver al menú</button>
        <button onClick={() => setModoGlobal("registroUsuario")} className="bg-blue-500 text-white px-4 py-2 rounded-xl w-full">Registrar nuevo usuario</button>
        <button onClick={() => setModoGlobal("registroPersonal")} className="bg-green-500 text-white px-4 py-2 rounded-xl w-full">Registrar nuevo personal</button>
        <button onClick={() => window.location.href = "/estado-equipos"} className="bg-purple-600 text-white px-4 py-2 rounded-xl w-full">Ver estado de equipos</button>
      </div>

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
  useEffect(() => {
    const insertarBotonMonitor = () => {
      if (document.getElementById("monitor-indicadores-supervision")) return;

      const botones = Array.from(document.querySelectorAll("button"));
      const botonEstado = botones.find((boton) =>
        boton.textContent?.trim().includes("Ver estado de equipos")
      );

      if (!botonEstado?.parentElement) return;

      const botonMonitor = document.createElement("button");
      botonMonitor.id = "monitor-indicadores-supervision";
      botonMonitor.type = "button";
      botonMonitor.textContent = "🖥 Monitor externo";
      botonMonitor.className = "bg-slate-800 text-white px-4 py-2 rounded-xl text_sm";
      botonMonitor.onclick = () => {
        window.open(
          "/monitor-indicadores",
          "monitorIndicadores",
          "noopener,noreferrer"
        );
      };

      botonEstado.parentElement.appendChild(botonMonitor);
    };

    insertarBotonMonitor();

    const observer = new MutationObserver(insertarBotonMonitor);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.getElementById("monitor-indicadores-supervision")?.remove();
    };
  }, []);

  return <PanelLogin />;
}
