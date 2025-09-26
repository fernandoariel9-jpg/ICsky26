import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./Login";
import RegistroUsuario from "./RegistroUsuario";
import FormularioUsuario from "./FormularioUsuario";
import Supervisor from "./Supervisor";
import PanelPendientes from "./PanelPendientes";

export default function App() {
  const [usuario, setUsuario] = useState(localStorage.getItem("usuario") || "");
  const [vista, setVista] = useState("login"); // "login" | "registro" | "app"

  const handleLogin = (nombre) => {
    localStorage.setItem("usuario", nombre);
    setUsuario(nombre);
    setVista("app");
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario("");
    setVista("login");
  };

  return (
    <div>
      {vista === "login" && (
        <Login onLogin={handleLogin} onRegistro={() => setVista("registro")} />
      )}
      {vista === "registro" && (
        <RegistroUsuario onRegistrado={(nombre) => handleLogin(nombre)} />
      )}
      {vista === "app" && usuario && (
        <>
          <FormularioUsuario usuario={usuario} onLogout={handleLogout} />
          <hr className="my-4" />
          <Supervisor />
          <hr className="my-4" />
          <PanelPendientes />
        </>
      )}
      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}
