// App.js
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom/client";
import Login from "./Login";
import RegistroUsuario from "./RegistroUsuario";
import Panel from "./Panel";
import UsuarioLogin from "./UsuarioLogin";
import FormularioUsuario from "./FormularioUsuario";
import Supervisor from "./Supervisor";

const API_URL = "https://sky26.onrender.com/tareas";

function Main() {
  const [registrado, setRegistrado] = useState(false);
  const [usuario, setUsuario] = useState(localStorage.getItem("usuario") || "");

  if (!registrado && !usuario) {
    return <RegistroUsuario onRegistrado={(nombre) => {
      localStorage.setItem("usuario", nombre);
      setUsuario(nombre);
      setRegistrado(true);
    }} />;
  }

  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Main />);

export default function App() {
  const [usuario, setUsuario] = useState(localStorage.getItem("usuario") || "");
  const [modo, setModo] = useState("menu"); // "menu", "login", "registro"

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario("");
    setModo("menu"); // volver al menú inicial
  };

  // Usuario logueado → muestra formulario de tareas
  if (usuario) {
    return <FormularioUsuario usuario={usuario} onLogout={handleLogout} />;
  }

  // Usuario no logueado → menú inicial
  if (modo === "menu") {
    return (
      <div className="p-4 max-w-md mx-auto mt-20 text-center">
        <h1 className="text-2xl font-bold mb-6">Bienvenido a RIC01</h1>
        <div className="flex flex-col space-y-4">
          <button
            className="bg-blue-500 text-white p-2 rounded-xl"
            onClick={() => setModo("login")}
          >
            Ingresar
          </button>
          <button
            className="bg-green-500 text-white p-2 rounded-xl"
            onClick={() => setModo("registro")}
          >
            Registrarse
          </button>
        </div>
      </div>
    );
  }

  // Mostrar login
  if (modo === "login") {
    return <UsuarioLogin onLogin={(u) => setUsuario(u)} switchToRegister={() => setModo("registro")} />;
  }

  // Mostrar registro
  if (modo === "registro") {
    return <RegistroUsuario onRegister={(u) => setUsuario(u)} switchToLogin={() => setModo("login")} />;
  }

  return null;
}

// ---------- Componente Login de Panel de Supervisión ----------
function PanelLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const PASS = "super123"; // Cambiar contraseña aquí

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === PASS) {
      onLogin(true);
      toast.success("Acceso concedido ✅");
    } else {
      toast.error("Contraseña incorrecta ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">🔒 Acceso Panel de Supervisión</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded-xl">Ingresar</button>
      </form>
    </div>
  );
}

// ---------- Componente Panel de Supervisión ----------
function Supervision() {
  const [tareas, setTareas] = useState([]);
  const [modalImagen,setModalImagen] = useState(null);

  useEffect(()=>{ fetchTareas(); },[]);

  const fetchTareas = async () => {
    try{
      const res = await fetch(API_URL);
      const data = await res.json();
      setTareas(data.filter(t=>!t.fin).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)));
    }catch{ toast.error("Error al cargar tareas"); }
  };

  const abrirModal = (img)=>setModalImagen(img);
  const cerrarModal = ()=>setModalImagen(null);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">📋 Panel de Supervisión</h1>
      <p className="text-center mb-4 text-red-600 font-semibold">Tareas pendientes: {tareas.length}</p>

      <ul className="space-y-3">
        {tareas.map(t=>(
          <li key={t.id} className="p-3 rounded-xl shadow-sm bg-yellow-100 flex items-center space-x-3">
            {t.imagen && <img src={`data:image/jpeg;base64,${t.imagen}`} alt="Foto" className="w-12 h-12 rounded-full object-cover cursor-pointer" onClick={()=>abrirModal(t.imagen)}/>}
            <div>
              <p><span className="font-bold text-gray-700">#{t.id}</span> {t.usuario}: {t.tarea} 🔹</p>
              <p className="text-sm text-gray-500">Fecha: {new Date(t.fecha).toLocaleString()}</p>
            </div>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {modalImagen && (
          <motion.div key="modal" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={cerrarModal}>
            <motion.img src={`data:image/jpeg;base64,${modalImagen}`} alt="Ampliada" initial={{scale:0.8}} animate={{scale:1}} exit={{scale:0.8}} className="max-w-full max-h-full rounded-xl shadow-lg" onClick={e=>e.stopPropagation()}/>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar={false}/>
    </div>
  );
}

// ---------- Componente Wrapper de Supervisión con contraseña ----------
function SupervisionWrapper() {
  const [loggedIn,setLoggedIn] = useState(false);
  return loggedIn ? <Supervision /> : <PanelLogin onLogin={setLoggedIn} />;
}
