// Login.js
import React, { useState } from "react";
import { toast } from "react-toastify";

export default function UsuarioLogin({ onLogin }) {
  const [nombre, setNombre] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("Ingresa tu nombre");
      return;
    }
    toast.success("Bienvenido " + nombre + " ✅");
    onLogin(nombre);
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Iniciar sesión</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Tu nombre"
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
