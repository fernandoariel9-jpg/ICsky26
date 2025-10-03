// src/PanelLogin.js
import React, { useState } from "react";
import UsuarioLogin from "./UsuarioLogin";
import RegistroUsuario from "./RegistroUsuario";
import LoginPersonal from "./LoginPersonal";
import RegistroPersonal from "./RegistroPersonal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PanelLogin({ onLogin }) {
  const [modo, setModo] = useState("usuarioLogin"); // modos: usuarioLogin, usuarioRegistro, personalLogin, personalRegistro
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  const switchModo = (nuevoModo) => setModo(nuevoModo);

  const handleLogin = (usuario) => {
    setUsuarioLogueado(usuario);
    onLogin(usuario);
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      {!usuarioLogueado ? (
        <>
          {modo === "usuarioLogin" && (
            <UsuarioLogin onLogin={handleLogin} switchToRegister={() => switchModo("usuarioRegistro")} />
          )}
          {modo === "usuarioRegistro" && (
            <UsuarioRegistro switchToLogin={() => switchModo("usuarioLogin")} />
          )}
          {modo === "personalLogin" && (
            <PersonalLogin onLogin={handleLogin} switchToRegister={() => switchModo("personalRegistro")} />
          )}
          {modo === "personalRegistro" && (
            <PersonalRegistro switchToLogin={() => switchModo("personalLogin")} />
          )}

          <div className="mt-4 text-center">
            {modo.includes("usuario") ? (
              <button
                className="text-blue-600 underline text-sm mr-2"
                onClick={() => switchModo("personalLogin")}
              >
                Soy personal
              </button>
            ) : (
              <button
                className="text-green-600 underline text-sm mr-2"
                onClick={() => switchModo("usuarioLogin")}
              >
                Soy usuario
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-lg font-bold">Bienvenido, {usuarioLogueado} ✅</p>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded mt-3"
            onClick={() => setUsuarioLogueado(null)}
          >
            Logout
          </button>
        </div>
      )}
      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}
