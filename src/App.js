// src/App.js
import React, { useState } from "react";
import Login from "./Login";
import RegistroUsuario from "./RegistroUsuario";
import FormularioUsuario from "./FormularioUsuario";
import Supervisor from "./Supervisor";

function App() {
  const [usuario, setUsuario] = useState(localStorage.getItem("usuario") || "");
  const [pantalla, setPantalla] = useState(usuario ? "tareas" : "login");

  const handleLogin = (nombre) => {
    localStorage.setItem("usuario", nombre);
    setUsuario(nombre);
    setPantalla("tareas");
  };

  const handleRegistro = (nombre) => {
    localStorage.setItem("usuario", nombre);
    setUsuario(nombre);
    setPantalla("tareas");
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario("");
    setPantalla("login");
  };

  return (
    <>
      {pantalla === "login" && <Login onLogin={handleLogin} onGoRegister={() => setPantalla("registro")} />}
      {pantalla === "registro" && <RegistroUsuario onRegister={handleRegistro} />}
      {pantalla === "tareas" && <FormularioUsuario usuario={usuario} onLogout={handleLogout} />}
      {pantalla === "supervisor" && <Supervisor />}
    </>
  );
}

export default App;
