import React, { useState } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com/usuarios";

export default function Login({ onLogin, onRegistro }) {
  const [usuario, setUsuario] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario.trim()) return toast.error("Debes ingresar un nombre");

    try {
      const res = await fetch(`${API_URL}/${usuario}`);
      if (res.ok) {
        onLogin(usuario);
        toast.success(`Bienvenido, ${usuario}`);
      } else {
        toast.error("Usuario no registrado");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Login de Usuario</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
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
        <button
          type="button"
          onClick={onRegistro}
          className="bg-gray-500 text-white p-2 rounded-xl"
        >
          Registrarse
        </button>
      </form>
    </div>
  );
}
