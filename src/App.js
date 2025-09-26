// App.js
import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import RegistroUsuario from "./RegistroUsuario";
import FormularioUsuario from "./FormularioUsuario";
import SupervisionWrapper from "./Supervisor";
import UsuarioLogin from "./Login";

const API_URL = "https://sky26.onrender.com";

export default function App() {
  const [usuario, setUsuario] = useState(localStorage.getItem("usuario") || "");
  const [registrado, setRegistrado] = useState(localStorage.getItem("registrado") === "true");

  // Manejo de login
  const handleLogin = (nombre) => {
    localStorage.setItem("usuario", nombre);
    setUsuario(nombre);
  };

  // Manejo de logout
  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("registrado");
    setUsuario("");
    setRegistrado(false);
  };

  // Si no está registrado → mostrar registro
  if (!registrado) {
    return (
      <div>
        <RegistroUsuario
          onRegistro={(nombre) => {
            localStorage.setItem("registrado", "true");
            localStorage.setItem("usuario", nombre);
            setUsuario(nombre);
            setRegistrado(true);
          }}
        />
        <ToastContainer position="bottom-right" autoClose={2000} />
      </div>
    );
  }

  // Si no está logueado → mostrar login
  if (!usuario) {
    return (
      <div>
        <UsuarioLogin onLogin={handleLogin} />
        <ToastContainer position="bottom-right" autoClose={2000} />
      </div>
    );
  }

  // Usuario logueado → mostrar formulario de tareas + supervisor
  return (
    <div>
      <FormularioUsuario usuario={usuario} onLogout={handleLogout} />
      <hr className="my-4" />
      <SupervisionWrapper />
      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}
