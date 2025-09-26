import React, { useState } from "react";
import { toast } from "react-toastify";

export default function UsuarioLogin({ onLogin, onSwitchToRegistro }) {
  const [usuario, setUsuario] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usuario.trim()) return toast.error("Debes ingresar un nombre de usuario");
    localStorage.setItem("usuario", usuario);
    onLogin(usuario);
    toast.success(`Bienvenido, ${usuario} ✅`);
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Login de Usuario</h1>
      <form onSubmit={handleLogin} className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Nombre de usuario"
          className="w-full p-2 border rounded"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">
          Ingresar
        </button>
      </form>
      <p className="text-center mt-4">
        ¿No tienes cuenta?{" "}
        <button onClick={onSwitchToRegistro} className="text-blue-600 underline">
          Regístrate aquí
        </button>
      </p>
    </div>
  );
}
