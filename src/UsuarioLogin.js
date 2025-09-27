import React, { useState } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com";

export default function UsuarioLogin({ onLogin, switchToRegister }) {
  const [usuario, setUsuario] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usuario.trim()) return toast.error("Debes ingresar un nombre de usuario");

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: usuario })
      });

      if (res.status === 401) return toast.error("Usuario no registrado ❌");

      const data = await res.json();
      localStorage.setItem("usuario", data.nombre);
      onLogin(data.nombre);
      toast.success(`Bienvenido, ${data.nombre} ✅`);
    } catch {
      toast.error("Error al intentar loguear");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
    <img
          src="/logosmall.png"
          alt="Logo"
          className="mx-auto mb-4 w-24 h-auto"
        />
      <h1 className="text-2xl font-bold text-center mb-4">Ingreso de Usuario</h1>
      <form onSubmit={handleLogin} className="flex flex-col space-y-3">
        <input type="text" placeholder="Nombre de usuario" className="w-full p-2 border rounded" value={usuario} onChange={e => setUsuario(e.target.value)} required/>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">Ingresar</button>
      </form>
      <p className="text-center mt-2">
        ¿No tienes cuenta?{" "}
        <span className="text-blue-500 cursor-pointer" onClick={switchToRegister}>
          Regístrate aquí
        </span>
      </p>
    </div>
  );
}
