import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import UsuarioLogin from "./UsuarioLogin";
import RegistroUsuario from "./RegistroUsuario";
import FormularioUsuario from "./FormularioUsuario";
import SupervisionWrapper from "./SupervisionWrapper";

export default function App() {
  const [usuario, setUsuario] = useState(localStorage.getItem("usuario") || "");
  const [showRegistro, setShowRegistro] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario("");
  };

  // 👉 Si no hay usuario, mostrar login o registro
  if (!usuario) {
    return showRegistro ? (
      <RegistroUsuario
        onRegister={(nombre) => {
          setUsuario(nombre);
          setShowRegistro(false);
        }}
      />
    ) : (
      <UsuarioLogin
        onLogin={(u) => setUsuario(u)}
        onSwitchToRegistro={() => setShowRegistro(true)}
      />
    );
  }

  // 👉 Si hay usuario logueado
  return (
    <div>
      <FormularioUsuario usuario={usuario} onLogout={handleLogout} />
      <hr className="my-4" />
      <SupervisionWrapper />
      <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar={false} />
    </div>
  );
}
