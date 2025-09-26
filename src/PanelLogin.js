import React, { useState } from "react";
import { toast } from "react-toastify";

export default function PanelLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const PASS = "super123"; // 🔑 Cambia esta contraseña

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === PASS) {
      onLogin(true);
      toast.success("Acceso concedido ✅");
    } else {
      toast.error("Contraseña incorrecta ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">🔒 Acceso Panel de Supervisión</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded-xl">
          Ingresar
        </button>
      </form>
    </div>
  );
}
