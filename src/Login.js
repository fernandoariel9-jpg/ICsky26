import React, { useState } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com/login";

export default function Login({ onLogin }) {
  const [nombre, setNombre] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });

      if (!res.ok) throw new Error("Usuario no encontrado");

      const data = await res.json();
      toast.success(Bienvenido ${data.usuario.nombre} ✅);

      localStorage.setItem("usuario", data.usuario.nombre);
      onLogin(data.usuario.nombre);

    } catch (err) {
      toast.error("Usuario no registrado ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Iniciar sesión</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">
          Entrar
        </button>
      </form>
    </div>
  );
}